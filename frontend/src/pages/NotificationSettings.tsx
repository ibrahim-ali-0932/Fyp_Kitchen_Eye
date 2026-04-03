/// <reference types="vite/client" />

import { useEffect, useMemo, useRef, useState } from "react";
import emailjs from "emailjs-com";
import { Bell, ChefHat, Flame, Hand, Mail, Pause, Play, Shirt, CheckCircle } from "lucide-react";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { API_URL } from "../services/api";
import { authorizedFetch } from "../services/authToken";
import { fetchUserViolations, type ViolationRecord } from "../services/violationsService";

type AlertCategory = "apron" | "gloves" | "hairnet" | "fire";

type AlertSettings = {
  apron: boolean;
  gloves: boolean;
  hairnet: boolean;
  fire: boolean;
  critical: boolean;
};

type MappedViolation = {
  id: string;
  category: AlertCategory;
  label: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  camera: string;
  timestamp: string;
  raw: ViolationRecord;
};

function mapViolation(v: ViolationRecord): MappedViolation | null {
  const rawType = String(v.violation_type || "").toLowerCase();
  const timestamp = v.violation_time || v.timestamp || "";
  const camera = v.camera_id || v.camera_location || "Kitchen Monitor System";
  const id = v.id || v.violation_id || "";

  if (!id) {
    return null;
  }

  if (rawType === "no_apron") {
    return { id, category: "apron", label: "Apron", severity: "Medium", camera, timestamp, raw: v };
  }

  if (rawType === "no_gloves") {
    return { id, category: "gloves", label: "Gloves", severity: "Low", camera, timestamp, raw: v };
  }

  if (rawType === "no_hairnet") {
    return { id, category: "hairnet", label: "Hairnet", severity: "Low", camera, timestamp, raw: v };
  }

  if (rawType === "fire") {
    return { id, category: "fire", label: "Fire", severity: "Critical", camera, timestamp, raw: v };
  }

  return null;
}

function getCategoryIcon(category: AlertCategory) {
  switch (category) {
    case "apron":
      return Shirt;
    case "gloves":
      return Hand;
    case "hairnet":
      return ChefHat;
    case "fire":
      return Flame;
  }
}

function getCategoryLabel(category: AlertCategory) {
  switch (category) {
    case "apron":
      return "Apron Alerts";
    case "gloves":
      return "Gloves Alerts";
    case "hairnet":
      return "Hairnet Alerts";
    case "fire":
      return "Fire Alerts";
  }
}

function getSeverityBadge(severity: MappedViolation["severity"]) {
  if (severity === "Critical") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  if (severity === "High") {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (severity === "Medium") {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

async function fetchViolationImageDataUrl(violationId: string): Promise<string | null> {
  const response = await authorizedFetch(`${API_URL}/violations/${violationId}/image`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch violation image: ${response.status} - ${errorText}`);
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const value = String(reader.result || "");
      resolve(value || "");
    };
    reader.onerror = () => reject(new Error("Failed to read violation image"));
    reader.readAsDataURL(blob);
  });
}

function buildViolationImagePayload(violationId: string, imageDataUrl: string | null) {
  return {
    violation_image: imageDataUrl || "",
    violation_image_html: imageDataUrl
      ? `<div style="margin-top:12px;text-align:center;"><img src="${imageDataUrl}" alt="Violation snapshot" style="max-width:100%;width:100%;border-radius:12px;border:1px solid #e2e8f0;" /></div>`
      : "",
    violation_image_link: imageDataUrl || "",
  };
}

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isReceivingEmails, setIsReceivingEmails] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState("f223367@cfd.nu.edu.pk");
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    apron: true,
    gloves: true,
    hairnet: true,
    fire: true,
    critical: true,
  });
  const [violations, setViolations] = useState<MappedViolation[]>([]);
  const [emailsSent, setEmailsSent] = useState(0);
  const [lastViolationTime, setLastViolationTime] = useState("");
  const [lastAlertType, setLastAlertType] = useState("");
  const [statusMessage, setStatusMessage] = useState("Monitoring is active.");
  const [loading, setLoading] = useState(true);

  const seenViolationIdsRef = useRef<Set<string>>(new Set());
  const pollInFlightRef = useRef(false);
  const settingsRef = useRef({ emailNotifications, alertSettings, recipientEmail });

  useEffect(() => {
    settingsRef.current = { emailNotifications, alertSettings, recipientEmail };
  }, [emailNotifications, alertSettings, recipientEmail]);

  const currentCount = violations.length;

  const activeCategories = useMemo(
    () =>
      (Object.entries(alertSettings) as Array<[keyof AlertSettings, boolean]>).filter(
        ([key, enabled]) => key !== "critical" && enabled
      ).map(([key]) => key),
    [alertSettings]
  );

  const fetchAllViolations = async () => {
    const raw = await fetchUserViolations();
    const mapped = raw
      .map(mapViolation)
      .filter((item): item is MappedViolation => Boolean(item))
      .sort((a, b) => {
        const aTime = new Date(a.timestamp || 0).getTime();
        const bTime = new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });
    setViolations(mapped);
    return mapped;
  };

  const shouldSendAlert = (violation: MappedViolation) => {
    const { emailNotifications: emailEnabled, alertSettings: filters } = settingsRef.current;

    if (!emailEnabled || !isReceivingEmails) {
      return false;
    }

    if (violation.severity === "Critical") {
      return filters.critical || filters.fire;
    }

    return filters[violation.category];
  };

  const sendAlertEmail = async (violation: MappedViolation) => {
    const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    const imageDataUrl = await fetchViolationImageDataUrl(violation.id).catch((error) => {
      console.warn("Unable to attach violation image:", error);
      return null;
    });

    const imagePayload = buildViolationImagePayload(violation.id, imageDataUrl);

    const timestamp = violation.timestamp || new Date().toLocaleString();

    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        user_email: recipientEmail,
        violation_type: violation.raw.violation_type,
        category: violation.category,
        severity: violation.severity,
        timestamp,
        camera_location: violation.camera,
        violation_number: violation.id,
        ...imagePayload,
        violation_id: violation.id,
      },
      PUBLIC_KEY
    );

    setEmailsSent((prev) => prev + 1);
    setLastViolationTime(timestamp);
    setLastAlertType(`${violation.label} alert`);
    setStatusMessage(`Sent ${violation.label} alert for violation ${violation.id.slice(0, 8)}.`);
  };

  const syncAndSendNewViolations = async () => {
    if (pollInFlightRef.current) {
      return;
    }

    pollInFlightRef.current = true;
    try {
      const mapped = await fetchAllViolations();
      const unseen = mapped.filter((item) => !seenViolationIdsRef.current.has(item.id));

      for (const violation of unseen.reverse()) {
        if (shouldSendAlert(violation)) {
          await sendAlertEmail(violation);
        }
        seenViolationIdsRef.current.add(violation.id);
      }

      setStatusMessage(
        unseen.length > 0
          ? `${unseen.length} new violation(s) checked.`
          : "No new violations detected."
      );
    } catch (error) {
      console.error("Failed to sync violations:", error);
      setStatusMessage("Unable to fetch new violations right now.");
    } finally {
      pollInFlightRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const mapped = await fetchAllViolations();
        if (!active) {
          return;
        }
        seenViolationIdsRef.current = new Set(mapped.map((item) => item.id));
      } catch (error) {
        console.error("Failed to initialize violations:", error);
        setStatusMessage("Failed to load current violations.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReceivingEmails) {
      setStatusMessage("Receiving emails is paused.");
      return;
    }

    setStatusMessage("Monitoring is active.");
    const interval = window.setInterval(() => {
      void syncAndSendNewViolations();
    }, 15000);

    void syncAndSendNewViolations();

    return () => {
      window.clearInterval(interval);
    };
  }, [isReceivingEmails]);

  const startReceivingEmails = () => {
    setEmailNotifications(true);
    setIsReceivingEmails(true);

    const allDisabled = !alertSettings.apron && !alertSettings.gloves && !alertSettings.hairnet && !alertSettings.fire;
    if (allDisabled) {
      setAlertSettings({
        apron: true,
        gloves: true,
        hairnet: true,
        fire: true,
        critical: true,
      });
    }
  };

  const stopReceivingEmails = () => {
    setIsReceivingEmails(false);
  };

  const updateCategory = (key: keyof AlertSettings, value: boolean) => {
    setAlertSettings((prev) => ({ ...prev, [key]: value }));
    if (value && !emailNotifications) {
      setEmailNotifications(true);
    }
    if (value && !isReceivingEmails) {
      setIsReceivingEmails(true);
    }
  };

  const categoryCards: Array<{ key: keyof AlertSettings; label: string; description: string; priority: string }> = [
    { key: "apron", label: "Apron Alerts", description: "Apron-related compliance alerts", priority: "Medium" },
    { key: "gloves", label: "Gloves Alerts", description: "Hand-safety and gloves-related alerts", priority: "Low" },
    { key: "hairnet", label: "Hairnet Alerts", description: "Hairnet and head-covering compliance alerts", priority: "Low" },
    { key: "fire", label: "Fire Alerts", description: "Smoke, heat, and equipment fire risks", priority: "Critical" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notification Settings</h1>
        <p className="text-slate-600 mt-1">Choose which violations trigger email alerts and attach the latest image when available.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-slate-600">Master switch for all violation emails.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked: boolean) => {
                setEmailNotifications(checked);
                if (!checked) {
                  setIsReceivingEmails(false);
                }
              }}
            />
            <Badge variant="outline">{emailNotifications ? "Enabled" : "Disabled"}</Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={startReceivingEmails} className="gap-2" disabled={isReceivingEmails && emailNotifications}>
            <Play className="w-4 h-4" />
            Start Receiving Emails
          </Button>
          <Button variant="outline" onClick={stopReceivingEmails} className="gap-2" disabled={!isReceivingEmails}>
            <Pause className="w-4 h-4" />
            Stop Receiving Emails
          </Button>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Bell className="w-4 h-4" />
            {statusMessage}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Current Violations</p>
            <p className="text-3xl font-bold text-blue-700">{loading ? "..." : currentCount}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">Emails Sent</p>
            <p className="text-3xl font-bold text-green-700">{emailsSent}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">Last Alert</p>
            <p className="text-sm font-semibold text-purple-700">{lastAlertType || "No alerts yet"}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Last Time</p>
            <p className="text-sm font-semibold text-slate-700">{lastViolationTime || "No alerts yet"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl mb-1">Alert Categories</h2>
            <p className="text-sm text-slate-600">Enable the specific kinds of alerts you want to receive.</p>
          </div>
          <Badge variant="outline">{activeCategories.length} active</Badge>
        </div>

        <div className="space-y-4">
          {categoryCards.map((item) => {
            const Icon = getCategoryIcon(item.key as AlertCategory);
            return (
              <div key={item.key} className="p-4 rounded-xl border">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                      <h3 className="mb-1">{item.label}</h3>
                      <p className="text-sm text-slate-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{item.priority} Priority</Badge>
                    <Switch
                      checked={alertSettings[item.key]}
                      onCheckedChange={(checked: boolean) => updateCategory(item.key, checked)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl mb-1">Critical Alerts</h2>
            <p className="text-sm text-slate-600">Send immediate emails for critical severity violations.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
            <Switch
              checked={alertSettings.critical}
              onCheckedChange={(checked: boolean) => updateCategory("critical", checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <Label htmlFor="recipient-email">Alert Recipient Email</Label>
            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="pl-9"
                placeholder="recipient@example.com"
              />
            </div>
          </div>
          <div className="text-sm text-slate-600">
            Image attachment is sent as a data URL when available.
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Monitoring Status
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              New violations are checked automatically and sent to your recipient email.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isReceivingEmails ? (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500">
                <div className="w-2 h-2 bg-slate-400 rounded-full" />
                <span className="text-sm font-medium">Stopped</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-sm text-slate-600">
          <CheckCircle className="w-4 h-4" />
          <span>{emailNotifications ? "Master email notifications are enabled." : "Master email notifications are disabled."}</span>
        </div>
      </Card>
    </div>
  );
}