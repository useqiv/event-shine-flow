import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff, SwitchCamera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
  isEnabled?: boolean;
  className?: string;
}

const QRScanner = ({ onScan, onError, isEnabled = true, className }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.log('Stop error (safe to ignore):', err);
      }
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (!containerRef.current || !isEnabled) return;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) {
        setHasCamera(false);
        onError?.('No camera found');
        return;
      }

      setCameras(devices);
      setHasCamera(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('qr-reader');
      }

      const cameraId = devices[currentCameraIndex]?.id || devices[0].id;

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          onScan(decodedText);
        },
        (errorMessage) => {
          // QR code not found in frame - this is normal
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setHasCamera(false);
      onError?.(err.message || 'Failed to access camera');
    }
  }, [currentCameraIndex, isEnabled, onScan, onError]);

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    
    await stopScanning();
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  }, [cameras.length, stopScanning]);

  useEffect(() => {
    if (isEnabled && !isScanning) {
      startScanning();
    }
    
    return () => {
      stopScanning();
    };
  }, [isEnabled, currentCameraIndex]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, []);

  if (!hasCamera) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
          <CameraOff className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No camera available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please allow camera access or use a device with a camera.
          </p>
          <Button onClick={startScanning} className="mt-4">
            <Camera className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0 relative">
        <div 
          id="qr-reader" 
          ref={containerRef}
          className="w-full aspect-square bg-black"
        />
        
        {/* Overlay with scanning frame */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-primary rounded-lg relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            
            {/* Scanning line animation */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-primary animate-[scan_2s_ease-in-out_infinite]" 
                 style={{ 
                   animation: 'scan 2s ease-in-out infinite',
                 }} 
            />
          </div>
        </div>

        {/* Camera switch button */}
        {cameras.length > 1 && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4"
            onClick={switchCamera}
          >
            <SwitchCamera className="h-4 w-4" />
          </Button>
        )}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/80 rounded-full px-3 py-1">
          <span className={cn(
            'h-2 w-2 rounded-full',
            isScanning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
          )} />
          <span className="text-xs font-medium">
            {isScanning ? 'Scanning...' : 'Starting...'}
          </span>
        </div>
      </CardContent>
      
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader__scan_region {
          display: none !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
      `}</style>
    </Card>
  );
};

export default QRScanner;
