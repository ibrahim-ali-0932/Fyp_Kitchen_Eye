import React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";

interface CameraVideoModalProps {
  isOpen: boolean;
  cameraId: string;
  cameraName: string;
  videoUrl: string;
  onClose: () => void;
}

export function CameraVideoModal({
  isOpen,
  cameraId,
  cameraName,
  videoUrl,
  onClose,
}: CameraVideoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">{cameraName}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Video Container */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
          <video
            key={videoUrl}
            width="100%"
            height="100%"
            autoPlay
            loop
            muted
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error("Video loading error:", e);
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
