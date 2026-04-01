import { useEffect, useState } from "react";
import { Bell, AlertTriangle, Mail } from "lucide-react";

import {
  fetchUserViolations,
  ViolationRecord,
} from "../services/violationsService";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return "Unknown time";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString();
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ViolationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("You're offline. Notifications will refresh when internet is back.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchUserViolations();
      setItems(data || []);
    } catch (error: any) {
      setError(error?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);

  const count = items.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-red-500 text-white text-[11px] leading-5 rounded-full text-center shadow-sm">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-96 p-0 bg-white text-slate-900 shadow-xl rounded-xl"
      >
        <div className="px-4 py-3 border-b flex items-center justify-between bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="font-medium">Notifications</span>
            {count > 0 && (
              <Badge variant="outline" className="text-[11px]">
                {count}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={load}
            >
              ↻
            </Button>
            {loading && (
              <Badge variant="outline" className="text-xs">
                Loading...
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          <div className="divide-y">
            {error && <div className="p-4 text-sm text-red-600">{error}</div>}
            {items.length === 0 && !error && (
              <div className="p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
            {items.map((item, idx) => (
              <div
                key={
                  item.id || `${item.violation_type}-${item.timestamp}-${idx}`
                }
                className="p-4 flex gap-3"
              >
                <div className="mt-1">
                  {item.is_test ? (
                    <Mail className="w-4 h-4 text-blue-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm">
                      {item.violation_type || "Violation"}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.camera_location || "Unknown camera"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Sent to {item.destination_email || "recipient"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {formatTimestamp(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
