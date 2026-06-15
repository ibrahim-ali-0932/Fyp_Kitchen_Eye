import { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Camera, Maximize2, Pause, Play, RefreshCw } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { CameraVideoModal } from "../components/CameraVideoModal";
import { getVideoUrl } from "../services/api";
import { detectionAPI } from "../services/api";
import { camerasAPI, type Camera as ApiCamera } from "../services/adminService";
import { getAuthToken } from "../services/authToken";
import BranchSelector from "../components/BranchSelector";

interface SelectedCamera {
  id: string;
  name: string;
}

interface DisplayCamera {
  id: string;
  name: string;
  branch: string;
  status: "online" | "offline";
  location: string;
  image: string;
  sourceType?: "ip" | "video";
  sourceValue?: string;
  streamUrl?: string;
  isFallback?: boolean;
}

function normalizeStatus(status?: string): "online" | "offline" {
  const value = String(status || "").toLowerCase();
  return value === "active" || value === "online" ? "online" : "offline";
}

function mapCamera(camera: ApiCamera, index: number): DisplayCamera {
  const fallbackImages = [
    "https://images.unsplash.com/photo-1761489798133-acc5e4decb30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzZWN1cml0eSUyMGNhbWVyYXxlbnwxfHx8fDE3NjM4ODYyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    "https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  ];

  const label = camera.branch?.trim() || camera.location?.trim() || camera.id;

  return {
    id: camera.id,
    name:
      camera.name?.trim() ||
      (label.endsWith("Camera") ? label : `${label} Camera`),
    branch: camera.branch || "Unassigned",
    status: normalizeStatus(camera.status),
    location: camera.location || "Unknown",
    image: camera.image || fallbackImages[index % fallbackImages.length],
    sourceType: (camera.source_type as DisplayCamera["sourceType"]) || "ip",
    sourceValue: camera.source_value || camera.ip_address,
    streamUrl: camera.stream_url || undefined,
  };
}

const fallbackCameras: DisplayCamera[] = Array.from(
  { length: 8 },
  (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const imageIndex = (index % 6) + 1;
    return {
      id: `CAM-${number}`,
      name: `Camera ${number}`,
      branch: `CAM-${number}`,
      status: index % 3 === 0 ? "offline" : "online",
      location: `Local Feed ${number}`,
      image: `/images/bg-${imageIndex}.jpg`,
      sourceType: "video",
      sourceValue: `CAM-${number}.mp4`,
      streamUrl: undefined,
      isFallback: true,
    };
  },
);

export default function LiveCameraFeed() {
  const [selectedCamera, setSelectedCamera] = useState<SelectedCamera | null>(
    null,
  );
  const [cameras, setCameras] = useState<DisplayCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionEnabled, setDetectionEnabled] = useState(true);
  const [detectionBusy, setDetectionBusy] = useState(false);
  const [branchId, setBranchId] = useState("all");

  const loadCameras = async (bid: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const [data, detectionState] = await Promise.all([
        camerasAPI.getAll(token, undefined, bid),
        detectionAPI.getStatus(token),
      ]);
      setCameras(data.map((camera, index) => mapCamera(camera, index)));
      setDetectionEnabled(detectionState.enabled !== false);
    } catch (err: any) {
      console.error("Failed to load cameras:", err);
      setError(err?.message || "Failed to load cameras from database");
      setCameras([]);
      setDetectionEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleDetection = async () => {
    setDetectionBusy(true);
    try {
      const token = await getAuthToken();
      const nextState = detectionEnabled
        ? await detectionAPI.stop(token)
        : await detectionAPI.start(token);
      setDetectionEnabled(nextState.enabled !== false);
    } catch (err: any) {
      console.error("Failed to toggle detection:", err);
      setError(err?.message || "Failed to update detection state");
    } finally {
      setDetectionBusy(false);
    }
  };

  useEffect(() => {
    loadCameras(branchId);
  }, [branchId]);

  const visibleCameras = cameras.length > 0 ? cameras : fallbackCameras;
  const isFallbackView = cameras.length === 0;

  const onlineCameras = visibleCameras.filter(
    (cam) => cam.status === "online",
  ).length;
  const offlineCameras = visibleCameras.filter(
    (cam) => cam.status === "offline",
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl mb-2">Live Camera Feed</h1>
          <p className="text-slate-600">
            Monitor all camera feeds across your locations in real-time
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          {isFallbackView
            ? "Showing local CAM-001 to CAM-008 previews"
            : "Showing cameras from database"}
        </div>
      </div>

      <BranchSelector value={branchId} onChange={setBranchId} />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Cameras</p>
              <p className="text-3xl">{visibleCameras.length}</p>
            </div>
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Online</p>
              <p className="text-3xl text-green-600">{onlineCameras}</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Offline</p>
              <p className="text-3xl text-red-600">{offlineCameras}</p>
            </div>
            <div className="w-3 h-3 bg-red-500 rounded-full" />
          </div>
        </Card>
        <Card className="p-6">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => loadCameras(branchId)}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {loading ? "Refreshing..." : "Refresh All"}
          </Button>
        </Card>
        <Card className="p-6 border-2 border-slate-200">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-slate-600 mb-1">Violation Detection</p>
              <div className="flex flex-wrap items-center gap-3">
                <p
                  className={
                    detectionEnabled ? "text-emerald-600" : "text-amber-600"
                  }
                >
                  {detectionEnabled ? "Running" : "Stopped"}
                </p>
                <Button
                  onClick={toggleDetection}
                  disabled={detectionBusy}
                  className={"w-full bg-blue-600 hover:bg-blue-700 text-white"}
                >
                  {detectionEnabled ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      {detectionBusy ? "Stopping..." : "Stop Detection"}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {detectionBusy ? "Starting..." : "Start Detection"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Camera Grid */}
      {loading && (
        <Card className="p-6 text-center text-slate-500">
          Loading cameras from database...
        </Card>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleCameras.map((camera) => (
            <Card
              key={camera.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative aspect-video bg-slate-900">
                {camera.status === "online" && !camera.isFallback ? (
                  <video
                    width="100%"
                    height="100%"
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Error loading video for ${camera.id}:`, e);
                    }}
                  >
                    <source
                      src={camera.streamUrl || getVideoUrl(camera.id)}
                      type="video/mp4"
                    />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <ImageWithFallback
                    src={camera.image}
                    alt={camera.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                )}

                {camera.status === "offline" && !camera.isFallback && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Camera Offline</p>
                    </div>
                  </div>
                )}

                <div className="absolute top-3 left-3">
                  <Badge
                    className={
                      camera.status === "online"
                        ? "bg-green-500 text-white border-0"
                        : "bg-red-500 text-white border-0"
                    }
                  >
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                    {camera.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="absolute top-3 right-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setSelectedCamera({
                        id: camera.id,
                        name: camera.name,
                      })
                    }
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>

                {camera.status === "online" && !camera.isFallback && (
                  <div className="absolute bottom-3 left-3 text-white text-sm bg-black/50 px-2 py-1 rounded">
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="mb-1">{camera.name}</h3>
                    <p className="text-sm text-slate-600">{camera.id}</p>
                  </div>
                </div>

                <div className="text-sm text-slate-600 space-y-1">
                  <p className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {camera.location}
                  </p>

                  <p>{camera.branch}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Camera Video Modal */}
      {selectedCamera && (
        <CameraVideoModal
          isOpen={!!selectedCamera}
          cameraId={selectedCamera.id}
          cameraName={selectedCamera.name}
          videoUrl={
            cameras.find((camera) => camera.id === selectedCamera.id)
              ?.streamUrl || getVideoUrl(selectedCamera.id)
          }
          onClose={() => setSelectedCamera(null)}
        />
      )}
    </div>
  );
}
