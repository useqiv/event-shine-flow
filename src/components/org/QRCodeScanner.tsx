import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CameraOff, RefreshCw, CheckCircle, XCircle, AlertCircle, Volume2, VolumeX, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeScannerProps {
  eventId: string;
  onScanComplete?: (result: { success: boolean; message: string; ticketId?: string }) => void;
}

interface ScanResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  ticketInfo?: {
    holderName?: string;
    ticketType?: string;
  };
}

interface RecentCheckIn {
  id: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning';
  holderName?: string;
  ticketType?: string;
  message: string;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'success' | 'error' | 'warning') => {
  if ('vibrate' in navigator) {
    switch (type) {
      case 'success':
        navigator.vibrate([100, 50, 100]); // Double short vibration for success
        break;
      case 'error':
        navigator.vibrate([300]); // Long vibration for error
        break;
      case 'warning':
        navigator.vibrate([150, 100, 150]); // Medium pattern for warning
        break;
    }
  }
};

// Sound feedback utility
const playSound = (type: 'success' | 'error' | 'warning') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.3;
    
    switch (type) {
      case 'success':
        // Pleasant ascending tone
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'error':
        // Low buzzer tone
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.type = 'square';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
        break;
      case 'warning':
        // Double beep
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.type = 'triangle';
        oscillator.start(audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.25);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
    }
  } catch (err) {
    console.log('Sound feedback not available:', err);
  }
};

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ eventId, onScanComplete }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanStats, setScanStats] = useState({ total: 0, successful: 0, failed: 0 });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [canUseConstraintFallback, setCanUseConstraintFallback] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  // Combined feedback function that respects sound toggle
  const provideFeedback = useCallback((type: 'success' | 'error' | 'warning') => {
    triggerHapticFeedback(type);
    if (soundEnabled) {
      playSound(type);
    }
  }, [soundEnabled]);

  // Add to recent check-ins list
  const addRecentCheckIn = useCallback((checkIn: Omit<RecentCheckIn, 'id' | 'timestamp'>) => {
    setRecentCheckIns(prev => [
      {
        ...checkIn,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
      ...prev.slice(0, 9) // Keep only last 10
    ]);
  }, []);

  // Fetch initial scan stats from database
  useEffect(() => {
    const fetchScanStats = async () => {
      const { data, error } = await supabase
        .from('qr_scan_logs')
        .select('scan_result')
        .eq('event_id', eventId);
      
      if (!error && data) {
        const total = data.length;
        const successful = data.filter(s => s.scan_result === 'success').length;
        const failed = total - successful;
        setScanStats({ total, successful, failed });
      }
    };
    
    fetchScanStats();
  }, [eventId]);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [requestingCamera, setRequestingCamera] = useState(false);

  const isEmbeddedContext = useCallback(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);

  const isInAppBrowser = useCallback(() => {
    const userAgent = navigator.userAgent || '';
    return /FBAN|FBAV|Instagram|Line|; wv\)|WebView|MiuiBrowser/i.test(userAgent);
  }, []);

  const isPermissionDeniedError = useCallback((err: any) => {
    const name = err?.name || '';
    const message = String(err?.message || '').toLowerCase();

    return (
      name === 'NotAllowedError' ||
      name === 'PermissionDeniedError' ||
      (name === 'SecurityError' && message.includes('permission')) ||
      message.includes('permission denied') ||
      message.includes('denied by system') ||
      message.includes('permission dismissed')
    );
  }, []);

  const isCameraBlockedByDocumentPolicy = useCallback(() => {
    const policyApi = (document as any).permissionsPolicy || (document as any).featurePolicy;
    if (!policyApi || typeof policyApi.allowsFeature !== 'function') {
      return false;
    }

    try {
      return !policyApi.allowsFeature('camera');
    } catch {
      return false;
    }
  }, []);

  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera is not supported on this browser/device.');
      return false;
    }

    const embedded = isEmbeddedContext();

    if (isCameraBlockedByDocumentPolicy()) {
      if (embedded) {
        setCameraError('Camera is blocked in embedded preview. Open this app directly in Safari or Chrome.');
      } else {
        setCameraError('Camera is blocked by this page policy (Permissions-Policy). If this is your custom domain, redeploy and clear CDN/browser cache.');
      }
      return false;
    }

    if (!window.isSecureContext) {
      setCameraError('Camera requires a secure HTTPS connection. Please open this page with https and try again.');
      return false;
    }

    setRequestingCamera(true);
    setCameraError(null);

    try {
      const constraintsToTry: MediaStreamConstraints[] = [
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastConstraintError: any = null;

      for (const constraints of constraintsToTry) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (candidateError: any) {
          lastConstraintError = candidateError;
          if (isPermissionDeniedError(candidateError)) {
            break;
          }
        }
      }

      if (!stream) {
        throw lastConstraintError || new Error('Unable to initialize camera stream');
      }

      stream.getTracks().forEach(track => track.stop());
      setCanUseConstraintFallback(true);

      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
          const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
          setSelectedCamera(backCamera?.id || devices[0].id);
          return true;
        }
      } catch (enumerationError) {
        console.warn('Camera enumeration failed, using constraint fallback:', enumerationError);
      }

      // Some browsers block device enumeration but still allow direct camera constraints
      setCameras([]);
      setSelectedCamera('');
      return true;
    } catch (err: any) {
      console.error('Camera access error:', err);

      const inAppBrowser = isInAppBrowser();

      if (isPermissionDeniedError(err)) {
        if (isCameraBlockedByDocumentPolicy()) {
          setCameraError('Camera is blocked by document Permissions-Policy for this page/context. Open directly in the main browser tab and try again.');
        } else if (embedded) {
          setCameraError('Camera access is blocked inside embedded preview. Open this app in Safari or Chrome directly and try again.');
        } else if (inAppBrowser) {
          setCameraError('This in-app browser is blocking camera access. Open the link in Safari or Chrome and try again.');
        } else {
          setCameraError('Camera permission was blocked by browser or OS settings. Please allow camera for this site and your browser app, then tap "Try Again".');
        }
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another app. Close other apps using the camera and try again.');
      } else {
        setCameraError(`Could not access camera: ${err.message || 'Unknown error'}. Please check your browser settings.`);
      }

      return false;
    } finally {
      setRequestingCamera(false);
    }
  }, [isEmbeddedContext, isInAppBrowser, isPermissionDeniedError, isCameraBlockedByDocumentPolicy]);

  // Check permission state on mount - show dialog if not yet granted
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (result.state === 'granted') {
            setCanUseConstraintFallback(true);
            void requestCameraAccess();
            return;
          }
        }
      } catch {
        // permissions.query not supported for camera in some browsers
      }

      setShowPermissionDialog(true);
    };

    checkPermission();
    return () => {
      stopScanning();
    };
  }, [requestCameraAccess]);

  const handlePermissionGrant = async () => {
    const granted = await requestCameraAccess();
    if (granted) {
      setShowPermissionDialog(false);
    }
  };

  const startScanning = async () => {
    if (!selectedCamera && !canUseConstraintFallback) {
      const granted = await requestCameraAccess();
      if (!granted) return;
    }

    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId);

      const cameraInputs: Array<string | MediaTrackConstraints> = [];
      if (selectedCamera) {
        cameraInputs.push(selectedCamera);
      }
      cameraInputs.push({ facingMode: { ideal: 'environment' } });
      cameraInputs.push({ facingMode: { ideal: 'user' } });

      let lastStartError: any = null;

      for (const cameraInput of cameraInputs) {
        try {
          await scannerRef.current.start(
            cameraInput,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            onQRCodeScanned,
            () => {
              // Ignore scan errors (no QR found)
            }
          );

          setIsScanning(true);
          setLastScan(null);
          setCameraError(null);
          setShowPermissionDialog(false);
          return;
        } catch (attemptError: any) {
          lastStartError = attemptError;
          console.warn('Camera start attempt failed:', attemptError);
        }
      }

      throw lastStartError || new Error('Failed to initialize camera');
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      const embedded = isEmbeddedContext();
      const inAppBrowser = isInAppBrowser();

      if (isPermissionDeniedError(err)) {
        if (isCameraBlockedByDocumentPolicy()) {
          setCameraError('Camera is blocked by document Permissions-Policy for this page/context. Open directly in a browser tab (not embedded) and try again.');
        } else if (embedded) {
          setCameraError('Camera is blocked inside embedded preview. Open this app directly in Safari or Chrome.');
        } else if (inAppBrowser) {
          setCameraError('This in-app browser blocks camera access. Open the link in Safari or Chrome.');
        } else {
          setCameraError('Camera permission was blocked by browser or OS settings. Allow camera for this site and browser app, then tap "Try Again".');
        }
      } else if (err?.name === 'NotReadableError') {
        setCameraError('Camera is currently in use by another app. Close other camera apps and try again.');
      } else {
        setCameraError(err?.message ? `Failed to start camera: ${err.message}` : 'Failed to start camera. Please check permissions and try again.');
      }

      toast.error('Failed to start camera. Please check permissions.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const onQRCodeScanned = async (decodedText: string) => {
    // Pause scanning while processing
    if (scannerRef.current) {
      await scannerRef.current.pause();
    }

    try {
      // Pre-validate ticket using the verification endpoint
      const verifyResponse = await fetch(
        'https://tirqmqzgksclsjxfiham.supabase.co/functions/v1/verify-ticket-qr',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpcnFtcXpna3NjbHNqeGZpaGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1NzgyMTksImV4cCI6MjA4MjE1NDIxOX0.Y96LDtj66PRezBMQgyiNZw7ppDZ1vkeMuu5qkrExuPY',
          },
          body: JSON.stringify({
            qr_code: decodedText,
            event_id: eventId,
          }),
        }
      );

      const verification = await verifyResponse.json();

      // Handle verification results
      if (!verification.valid) {
        const feedbackType = verification.status === 'used' ? 'warning' : 'error';
        provideFeedback(feedbackType);
        
        const scanResult = {
          status: feedbackType as 'warning' | 'error',
          message: verification.message,
          ticketInfo: verification.ticket ? {
            holderName: verification.ticket.holder_name || undefined,
            ticketType: verification.ticket.ticket_type?.name || undefined,
          } : undefined,
        };
        
        setLastScan(scanResult);
        addRecentCheckIn({
          status: feedbackType,
          message: verification.message,
          holderName: verification.ticket?.holder_name || undefined,
          ticketType: verification.ticket?.ticket_type?.name || undefined,
        });

        // Log the failed verification
        if (verification.ticket?.id) {
          logScan(verification.ticket.id, verification.status);
        } else {
          // Log with placeholder for unknown tickets
          try {
            await supabase.from('qr_scan_logs').insert({
              event_id: eventId,
              ticket_id: '00000000-0000-0000-0000-000000000000',
              scan_result: verification.status || 'invalid',
              scanned_by: user?.id,
            });
          } catch (e) {
            console.error('Failed to log invalid scan:', e);
          }
        }

        setScanStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
        onScanComplete?.({ 
          success: false, 
          message: verification.message, 
          ticketId: verification.ticket?.id 
        });
        resumeScanning();
        return;
      }

      // Ticket is valid - proceed with check-in
      const ticket = verification.ticket;

      // Mark ticket as used
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'used' })
        .eq('id', ticket.id);

      if (updateError) {
        throw new Error('Failed to update ticket status');
      }

      // Log successful scan
      logScan(ticket.id, 'success');

      provideFeedback('success');
      setLastScan({
        status: 'success',
        message: 'Check-in successful!',
        ticketInfo: {
          holderName: ticket.holder_name || undefined,
          ticketType: ticket.ticket_type?.name || undefined,
        },
      });
      addRecentCheckIn({
        status: 'success',
        message: 'Check-in successful',
        holderName: ticket.holder_name || undefined,
        ticketType: ticket.ticket_type?.name || undefined,
      });
      setScanStats(prev => ({ ...prev, total: prev.total + 1, successful: prev.successful + 1 }));
      onScanComplete?.({ success: true, message: 'Check-in successful', ticketId: ticket.id });

    } catch (err: any) {
      provideFeedback('error');
      setLastScan({
        status: 'error',
        message: err.message || 'Failed to process QR code',
      });
      addRecentCheckIn({ status: 'error', message: err.message || 'Processing failed' });
      setScanStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
      onScanComplete?.({ success: false, message: err.message });
    }

    resumeScanning();
  };

  const logScan = async (ticketId: string, result: string) => {
    try {
      await supabase.from('qr_scan_logs').insert({
        event_id: eventId,
        ticket_id: ticketId,
        scan_result: result,
        scanned_by: user?.id,
      });
    } catch (err) {
      console.error('Failed to log scan:', err);
    }
  };

  const resumeScanning = () => {
    setTimeout(() => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.resume();
      }
    }, 2000);
  };

  const switchCamera = () => {
    const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCamera(cameras[nextIndex].id);
    
    if (isScanning) {
      stopScanning().then(() => {
        setTimeout(startScanning, 500);
      });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Camera Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center">Camera Access Required</DialogTitle>
            <DialogDescription className="text-center">
              To scan QR codes on tickets, this app needs access to your device&apos;s camera.
              Please tap <strong>&quot;Allow&quot;</strong> when your browser asks for permission.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handlePermissionGrant} size="lg" className="w-full h-12 text-base">
              <Camera className="mr-2 h-5 w-5" />
              Grant Camera Access
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your camera is only used for scanning — no images are stored.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scanner Stats - Compact on mobile */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <Card>
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold">{scanStats.total}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total Scans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{scanStats.successful}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 sm:p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-destructive">{scanStats.failed}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanner View - Full width on mobile */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <div 
            id={scannerContainerId} 
            className="w-full aspect-[4/3] sm:aspect-square max-h-[60vh] sm:max-h-[400px] bg-secondary"
          />
          
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
              <div className="text-center p-4 sm:p-6">
                {cameraError ? (
                  <>
                    <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-destructive font-medium mb-2">{cameraError}</p>
                    {cameraError.includes('embedded preview') || cameraError.includes('in-app browser') || cameraError.includes('Permissions-Policy') ? (
                      <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                        This browser context blocks camera APIs. Open the app link directly in Safari or Chrome.
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                        Check both browser site permission and device-level browser camera permission, then tap &quot;Try Again&quot;.
                      </p>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button onClick={requestCameraAccess} disabled={requestingCamera} size="lg" className="h-12 px-6 text-base">
                        <Camera className="mr-2 h-5 w-5" />
                        {requestingCamera ? 'Requesting...' : 'Try Again'}
                      </Button>
                      <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reload Page
                      </Button>
                    </div>
                  </>
                ) : requestingCamera ? (
                  <>
                    <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4 animate-pulse" />
                    <p className="text-sm sm:text-base text-muted-foreground">Requesting camera access...</p>
                  </>
                ) : (
                  <>
                    <Camera className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Camera is off</p>
                    <Button
                      onClick={startScanning}
                      disabled={!selectedCamera && !canUseConstraintFallback}
                      size="lg"
                      className="h-12 px-6 text-base"
                    >
                      <Camera className="mr-2 h-5 w-5" />
                      Start Scanning
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Scan Result - Larger touch feedback area */}
      {lastScan && (
        <Card className={`border-2 ${
          lastScan.status === 'success' ? 'border-green-500 bg-green-500/10' :
          lastScan.status === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
          'border-destructive bg-destructive/10'
        }`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              {lastScan.status === 'success' ? (
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0" />
              ) : lastScan.status === 'warning' ? (
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base">{lastScan.message}</p>
                {lastScan.ticketInfo && (
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    <p className="truncate">Name: {lastScan.ticketInfo.holderName || 'N/A'}</p>
                    <p className="truncate">Ticket: {lastScan.ticketInfo.ticketType || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls - Larger touch targets for mobile */}
      <div className="flex items-center gap-2">
        {isScanning ? (
          <Button variant="destructive" onClick={stopScanning} className="flex-1 h-12 sm:h-10 text-base sm:text-sm">
            <CameraOff className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
            Stop Scanner
          </Button>
        ) : (
          <Button
            onClick={startScanning}
            disabled={!selectedCamera && !canUseConstraintFallback}
            className="flex-1 h-12 sm:h-10 text-base sm:text-sm"
          >
            <Camera className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
            Start Scanner
          </Button>
        )}
        {cameras.length > 1 && (
          <Button variant="outline" onClick={switchCamera} size="icon" className="h-12 w-12 sm:h-10 sm:w-10">
            <RefreshCw className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        )}
        
        {/* Sound Toggle */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Sound on' : 'Sound off'}
          className="h-12 w-12 sm:h-10 sm:w-10"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5 sm:h-4 sm:w-4" />
          ) : (
            <VolumeX className="h-5 w-5 sm:h-4 sm:w-4" />
          )}
        </Button>
      </div>

      {/* Sound Toggle Label */}
      <div className="flex items-center justify-center gap-2">
        <Label htmlFor="sound-toggle" className="text-xs text-muted-foreground">
          Sound feedback
        </Label>
        <Switch
          id="sound-toggle"
          checked={soundEnabled}
          onCheckedChange={setSoundEnabled}
        />
      </div>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <p className="text-xs text-center text-muted-foreground">
          Using: {cameras.find(c => c.id === selectedCamera)?.label || 'Unknown camera'}
        </p>
      )}
      {cameras.length === 0 && canUseConstraintFallback && (
        <p className="text-xs text-center text-muted-foreground">
          Using automatic camera mode
        </p>
      )}

      {/* Recent Check-ins List */}
      {recentCheckIns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Recent Check-ins</h3>
              <span className="text-xs text-muted-foreground">({recentCheckIns.length})</span>
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {recentCheckIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border ${
                      checkIn.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                      checkIn.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                      'bg-destructive/5 border-destructive/20'
                    }`}
                  >
                    {checkIn.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : checkIn.status === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {checkIn.holderName || checkIn.message}
                      </p>
                      {checkIn.ticketType && (
                        <p className="text-xs text-muted-foreground truncate">
                          {checkIn.ticketType}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(checkIn.timestamp, 'HH:mm:ss')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeScanner;
