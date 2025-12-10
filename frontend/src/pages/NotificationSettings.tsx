import { useState, useEffect, useRef } from "react";
import emailjs from "emailjs-com";
import { Card } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { AlertTriangle, Droplet, Bug, Flame, Bell, CheckCircle } from "lucide-react";
import { logViolation } from "../services/violationsService";

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [ppeEmail, setPpeEmail] = useState(true);
  const [spillEmail, setSpillEmail] = useState(true);
  const [pestEmail, setPestEmail] = useState(true);
  const [fireEmail, setFireEmail] = useState(true);
  const [criticalEmail, setCriticalEmail] = useState(true);

  // Monitoring state
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [emailsSent, setEmailsSent] = useState<number>(0);
  const [lastViolationTime, setLastViolationTime] = useState<string>("");
  const previousCountRef = useRef<number>(0);

  // Fetch violation count from backend
  async function fetchViolationCount(): Promise<number> {
    try {
      const response = await fetch(`http://localhost:8000/stats/violation_count.txt?t=${Date.now()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle both formats: direct number or {value: number}
        let count: number;
        if (typeof data === 'number') {
          count = data;
        } else if (typeof data === 'object' && data !== null) {
          count = typeof data.value === 'number' ? data.value : parseInt(data.value) || 0;
        } else {
          count = parseInt(String(data)) || 0;
        }
        
        console.log("🔢 Parsed count:", count);
        return count;
      } else {
        console.error("❌ Response not OK:", response.status);
      }
    } catch (error) {
      console.error("❌ Error fetching violation count:", error);
    }
    return 0;
  }

  // Send automated email notification
  async function sendAutomatedEmail(violationNumber: number) {
    if (!emailNotifications) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found - cannot log violation");
      }

      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      const timestamp = new Date().toLocaleString();
      
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          user_email: "ibrahimalikhan0932@gmail.com",
          violation_type: "Violation Detected",
          timestamp: timestamp,
          camera_location: "Kitchen Monitor System",
          violation_number: violationNumber,
        },
        PUBLIC_KEY
      );

      if (token) {
        await logViolation({
          violation_type: "Automated Violation Alert",
          camera_location: "Kitchen Monitor System",
          destination_email: "f223367@cfd.nu.edu.pk",
          token,
          is_test: false,
        });
      }

      setEmailsSent(prev => prev + 1);
      setLastViolationTime(timestamp);
      console.log(`✅ Email sent for violation #${violationNumber}`);
      alert(`Automated email sent for violation #${violationNumber}`);
    } catch (err) {
      console.error("Failed to send automated email:", err);
    }
  }

  // Monitor violation count changes
  useEffect(() => {
    console.log("🔄 Monitoring useEffect triggered - isMonitoring:", isMonitoring, "emailNotifications:", emailNotifications);
    
    if (!isMonitoring) {
      console.log("⏸️ Monitoring paused");
      return;
    }

    console.log("▶️ Starting monitoring interval...");
    
    const interval = setInterval(async () => {
      const newCount = await fetchViolationCount();
      setCurrentCount(newCount);

      // Check if count increased
      if (newCount > previousCountRef.current) {
        const increase = newCount - previousCountRef.current;
        console.log(`Violation count increased from ${previousCountRef.current} to ${newCount} (+${increase})`);
        
        // Only send emails if email notifications are enabled
        if (emailNotifications) {
          // Send email for each increase
          for (let i = 0; i < increase; i++) {
            await sendAutomatedEmail(previousCountRef.current + i + 1);
          }
        } else {
          console.log("Email notifications disabled - skipping email send");
          alert(`Email notifications disabled - email will not be sent`);
        }
      } else {
        console.log(`✓ No change: current=${newCount}, previous=${previousCountRef.current}`);
      }

      previousCountRef.current = newCount;
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(interval);
    };
  }, [isMonitoring, emailNotifications]);

  // Initial load
  useEffect(() => {
    console.log("Initial load - fetching violation count...");
    fetchViolationCount().then(count => {
      console.log("Initial count loaded:", count);
      setCurrentCount(count);
      previousCountRef.current = count;
    });
  }, []);

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

      {/* Monitoring Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Automated Violation Monitoring
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              System detects violations and sends email alerts
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isMonitoring && (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-600 mb-1">Current Violation Count</p>
            <p className="text-3xl font-bold text-blue-700">{currentCount}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-600 mb-1">Emails Sent</p>
            <p className="text-3xl font-bold text-green-700">{emailsSent}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-600 mb-1">Last Alert</p>
            <p className="text-sm font-semibold text-purple-700">
              {lastViolationTime || "No alerts yet"}
            </p>
          </div>
        </div>

    {/*emailsSent > 0 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Email notifications are working correctly
              </p>
              <p className="text-xs text-green-600 mt-1">
                To test: Update the violation_count.txt file in backend/app/data/ folder
              </p>
            </div>
          </div>
        )*/} 

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>Email sent to:</strong> f223367@cfd.nu.edu.pk
          </p>
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
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <h3 className="mb-1">Pest Detection</h3>
                  <p className="text-sm text-slate-600">
                    Rodents, insects, and contamination risks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">Medium Priority</Badge>
                <Switch
                  id="pest-email"
                  checked={pestEmail}
                  onCheckedChange={setPestEmail}
                />
              </div>
            </div>
          </div>

          {/* Fire Safety */}
          <div className="p-4 rounded-xl border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Flame className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="mb-1">Fire Safety</h3>
                  <p className="text-sm text-slate-600">
                    Smoke, heat, and equipment fire risks
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant="outline"
                  className="bg-red-100 text-red-700 border-red-200"
                >
                  Critical Priority
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
