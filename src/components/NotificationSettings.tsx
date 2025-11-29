import { useState } from 'react';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Mail, AlertTriangle, Droplet, Bug, Flame, Save } from 'lucide-react';

export default function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const [ppeEmail, setPpeEmail] = useState(true);
  
  const [spillEmail, setSpillEmail] = useState(true);
  
  const [pestEmail, setPestEmail] = useState(true);
  
  const [fireEmail, setFireEmail] = useState(true);

  const [criticalEmail, setCriticalEmail] = useState(true);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Notification Settings</h1>
        <p className="text-slate-600">Configure how and when you receive alerts for violations</p>
      </div>

      {/* Master Email Notification Switch */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Email Notification Settings</h2>
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="email-master" className="text-base mb-1 cursor-pointer">Email Notifications</Label>
              <p className="text-sm text-slate-600">Receive all alerts via email</p>
            </div>
          </div>
          <Switch 
            id="email-master"
            checked={emailNotifications} 
            onCheckedChange={setEmailNotifications}
          />
        </div>
      </Card>

      {/* Email Contact Info */}
      <Card className="p-6">
        <h2 className="text-xl mb-6">Email Address</h2>
        <div className="space-y-2">
          <Label htmlFor="email">Notification Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            defaultValue="johndoe@company.com"
          />
          <p className="text-sm text-slate-600">All violation alerts will be sent to this email address</p>
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
                  <p className="text-sm text-slate-600">Missing gloves, hairnets, masks</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline">Medium Priority</Badge>
                <Switch id="ppe-email" checked={ppeEmail} onCheckedChange={setPpeEmail} />
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
                  <p className="text-sm text-slate-600">Floor hazards and liquid spills</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">High Priority</Badge>
                <Switch id="spill-email" checked={spillEmail} onCheckedChange={setSpillEmail} />
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
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
                <Switch id="pest-email" checked={pestEmail} onCheckedChange={setPestEmail} />
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
                  <p className="text-sm text-slate-600">Fire hazards and smoke alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
                <Switch id="fire-email" checked={fireEmail} onCheckedChange={setFireEmail} />
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
              <p className="text-sm text-slate-600">Immediate action required - includes all critical violations</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Critical</Badge>
              <Switch id="critical-email" checked={criticalEmail} onCheckedChange={setCriticalEmail} />
            </div>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
