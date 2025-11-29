import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Camera, Maximize2, RefreshCw } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export default function LiveCameraFeed() {
  const cameras = [
    {
      id: 'CAM-001',
      name: 'Main Prep Area',
      branch: 'Downtown Branch',
      status: 'online',
      location: 'Kitchen 1',
      image: 'https://images.unsplash.com/photo-1761489798133-acc5e4decb30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzZWN1cml0eSUyMGNhbWVyYXxlbnwxfHx8fDE3NjM4ODYyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-002',
      name: 'Dishwashing Station',
      branch: 'Downtown Branch',
      status: 'online',
      location: 'Kitchen 2',
      image: 'https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-003',
      name: 'Cooking Area',
      branch: 'Westside Branch',
      status: 'online',
      location: 'Kitchen 1',
      image: 'https://images.unsplash.com/photo-1761489798133-acc5e4decb30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzZWN1cml0eSUyMGNhbWVyYXxlbnwxfHx8fDE3NjM4ODYyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-004',
      name: 'Storage Room A',
      branch: 'Westside Branch',
      status: 'offline',
      location: 'Storage',
      image: 'https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-005',
      name: 'Food Prep Station',
      branch: 'Eastside Branch',
      status: 'online',
      location: 'Kitchen 1',
      image: 'https://images.unsplash.com/photo-1761489798133-acc5e4decb30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzZWN1cml0eSUyMGNhbWVyYXxlbnwxfHx8fDE3NjM4ODYyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-006',
      name: 'Salad Station',
      branch: 'Eastside Branch',
      status: 'online',
      location: 'Kitchen 3',
      image: 'https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-007',
      name: 'Entrance Area',
      branch: 'Downtown Branch',
      status: 'online',
      location: 'Main Entrance',
      image: 'https://images.unsplash.com/photo-1761489798133-acc5e4decb30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjBzZWN1cml0eSUyMGNhbWVyYXxlbnwxfHx8fDE3NjM4ODYyMDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'CAM-008',
      name: 'Storage Room B',
      branch: 'Downtown Branch',
      status: 'online',
      location: 'Storage',
      image: 'https://images.unsplash.com/photo-1762330018258-2cf9b8f80618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMGh5Z2llbmV8ZW58MXx8fHwxNzYzODg2MjA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
  ];

  const onlineCameras = cameras.filter(cam => cam.status === 'online').length;
  const offlineCameras = cameras.filter(cam => cam.status === 'offline').length;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl mb-2">Live Camera Feed</h1>
        <p className="text-slate-600">Monitor all camera feeds across your locations in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Cameras</p>
              <p className="text-3xl">{cameras.length}</p>
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
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
        </Card>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cameras.map((camera) => (
          <Card key={camera.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative aspect-video bg-slate-900">
              <ImageWithFallback
                src={camera.image}
                alt={camera.name}
                className="w-full h-full object-cover opacity-80"
              />
              {camera.status === 'offline' && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Camera Offline</p>
                  </div>
                </div>
              )}
              <div className="absolute top-3 left-3">
                <Badge className={
                  camera.status === 'online'
                    ? 'bg-green-500 text-white border-0'
                    : 'bg-red-500 text-white border-0'
                }>
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  {camera.status.toUpperCase()}
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
              {camera.status === 'online' && (
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
    </div>
  );
}
