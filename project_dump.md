import { useState } from "react";
import emailjs from "emailjs-com";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Mail, AlertTriangle, Droplet, Bug, Flame, Save } from "lucide-react";

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ppeEmail, setPpeEmail] = useState(true);
  const [spillEmail, setSpillEmail] = useState(true);
  const [pestEmail, setPestEmail] = useState(true);
  const [fireEmail, setFireEmail] = useState(true);
  const [criticalEmail, setCriticalEmail] = useState(true);

  // NEW fields for test email
  const [destinationEmail, setDestinationEmail] = useState(
    "manager@example.com"
  );
  const [violationType, setViolationType] = useState("Missing Gloves");
  const [cameraLocation, setCameraLocation] = useState("Kitchen Cam 1");
  const [sending, setSending] = useState(false);

  async function sendTestEmail() {
    setSending(true);
    try {
      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      console.log("sending email params:", {
        user_email: destinationEmail,
        violation_type: violationType,
        timestamp: new Date().toLocaleString(),
        camera_location: cameraLocation,
      });
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          user_email: destinationEmail,
          violation_type: violationType,
          timestamp: new Date().toLocaleString(),
          camera_location: cameraLocation,
        },
        PUBLIC_KEY
      );
      alert("Test email sent");
    } catch (err) {
      console.error(err);
      alert("Send failed: " + String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold">Notification Settings</h1>
      </div>

      {/* Master Email Notification Switch */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email Notifications</Label>
            <p className="text-sm text-slate-600">
              Receive all alerts via email
            </p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>
      </Card>

      {/* Email Contact Info + Send Test */}
      <Card className="p-6">
        <Label>Send test email to</Label>
        <Input
          id="dest-email"
          type="email"
          placeholder="recipient@example.com"
          value={destinationEmail}
          onChange={(e: any) => setDestinationEmail(e.target.value)}
        />
        <div className="mt-3">
          <Label>Violation Type</Label>
          <Input
            value={violationType}
            onChange={(e: any) => setViolationType(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <Label>Camera Location</Label>
          <Input
            value={cameraLocation}
            onChange={(e: any) => setCameraLocation(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <Button onClick={sendTestEmail} disabled={sending}>
            {sending ? "Sending…" : "Send Test Email"}
          </Button>
        </div>
      </Card>

      {/* Violation Type Notifications */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Notifications by Violation Type</h2>
        <div className="space-y-6">
          {/* PPE Violations */}
          <div className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="mb-1">PPE Violations</h3>
                  <p className="text-sm text-slate-600">
                    Missing gloves, hairnets, masks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">Medium Priority</Badge>
                <Switch
                  id="ppe-email"
                  checked={ppeEmail}
                  onCheckedChange={setPpeEmail}
                />
              </div>
            </div>
          </div>

          {/* Spill Detection */}
          <div className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="mb-1">Spill Detection</h3>
                  <p className="text-sm text-slate-600">
                    Floor hazards and liquid spills
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-700 border-orange-200"
                >
                  High Priority
                </Badge>
                <Switch
                  id="spill-email"
                  checked={spillEmail}
                  onCheckedChange={setSpillEmail}
                />
              </div>
            </div>
          </div>

          {/* Pest Detection */}
          <div className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="mb-1">Pest Detection</h3>
                  <p className="text-sm text-slate-600">Rodents and insects</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-200"
                >
                  Critical
                </Badge>
                <Switch
                  id="pest-email"
                  checked={pestEmail}
                  onCheckedChange={setPestEmail}
                />
              </div>
            </div>
          </div>

          {/* Fire/Smoke Alerts */}
          <div className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="mb-1">Fire & Smoke Detection</h3>
                  <p className="text-sm text-slate-600">
                    Fire hazards and smoke alerts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-200"
                >
                  Critical
                </Badge>
                <Switch
                  id="fire-email"
                  checked={fireEmail}
                  onCheckedChange={setFireEmail}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Severity-Based Notifications */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Severity-Based Email Notifications</h2>
        <div className="p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1">Critical Alerts</h3>
              <p className="text-sm text-slate-600">
                Immediate action required - includes all critical violations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="bg-red-100 text-red-700 border-red-200"
              >
                Critical
              </Badge>
              <Switch
                id="critical-email"
                checked={criticalEmail}
                onCheckedChange={setCriticalEmail}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
