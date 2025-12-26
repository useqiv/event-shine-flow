import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ eventId, onScanComplete }) => {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [scanStats, setScanStats] = useState({ total: 0, successful: 0, failed: 0 });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader';

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        setCameras(devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id}` })));
        // Prefer back camera
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back'));
        setSelectedCamera(backCamera?.id || devices[0].id);
      }
    }).catch(err => {
      console.error('Error getting cameras:', err);
      toast.error('Could not access camera. Please ensure camera permissions are granted.');
    });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      toast.error('No camera selected');
      return;
    }

    try {
      scannerRef.current = new Html5Qrcode(scannerContainerId);
      
      await scannerRef.current.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onQRCodeScanned,
        (errorMessage) => {
          // Ignore scan errors (no QR found)
        }
      );
      
      setIsScanning(true);
      setLastScan(null);
    } catch (err) {
      console.error('Error starting scanner:', err);
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
      // Fetch ticket by QR code value directly
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id,
          event_id,
          status,
          qr_code,
          ticket_type_id,
          user_id
        `)
        .eq('qr_code', decodedText)
        .maybeSingle();

      if (ticketError || !ticket) {
        setLastScan({
          status: 'error',
          message: 'Ticket not found in system',
        });
        // Log with placeholder ticket_id since we don't have one
        try {
          await supabase.from('qr_scan_logs').insert({
            event_id: eventId,
            ticket_id: '00000000-0000-0000-0000-000000000000', // Placeholder for invalid tickets
            scan_result: 'invalid',
            scanned_by: user?.id,
          });
        } catch (e) {
          console.error('Failed to log invalid scan:', e);
        }
        setScanStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
        onScanComplete?.({ success: false, message: 'Ticket not found' });
        resumeScanning();
        return;
      }

      // Fetch ticket type name
      const { data: ticketType } = await supabase
        .from('ticket_types')
        .select('name')
        .eq('id', ticket.ticket_type_id)
        .maybeSingle();

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', ticket.user_id)
        .maybeSingle();

      // Check if ticket belongs to this event
      if (ticket.event_id !== eventId) {
        setLastScan({
          status: 'error',
          message: 'This ticket is for a different event',
        });
        logScan(ticket.id, 'wrong_event');
        setScanStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
        onScanComplete?.({ success: false, message: 'Wrong event' });
        resumeScanning();
        return;
      }

      // Check if ticket is already used
      if (ticket.status === 'used') {
        setLastScan({
          status: 'warning',
          message: 'Ticket already checked in',
          ticketInfo: {
            holderName: profile?.full_name || undefined,
            ticketType: ticketType?.name || undefined,
          },
        });
        logScan(ticket.id, 'already_used');
        setScanStats(prev => ({ ...prev, total: prev.total + 1, failed: prev.failed + 1 }));
        onScanComplete?.({ success: false, message: 'Already used', ticketId: ticket.id });
        resumeScanning();
        return;
      }

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

      setLastScan({
        status: 'success',
        message: 'Check-in successful!',
        ticketInfo: {
          holderName: profile?.full_name || undefined,
          ticketType: ticketType?.name || undefined,
        },
      });
      setScanStats(prev => ({ ...prev, total: prev.total + 1, successful: prev.successful + 1 }));
      onScanComplete?.({ success: true, message: 'Check-in successful', ticketId: ticket.id });

    } catch (err: any) {
      setLastScan({
        status: 'error',
        message: err.message || 'Failed to process QR code',
      });
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
    <div className="space-y-4">
      {/* Scanner Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{scanStats.total}</p>
            <p className="text-xs text-muted-foreground">Total Scans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{scanStats.successful}</p>
            <p className="text-xs text-muted-foreground">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-destructive">{scanStats.failed}</p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Scanner View */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 relative">
          <div 
            id={scannerContainerId} 
            className="w-full aspect-square max-h-[400px] bg-secondary"
          />
          
          {!isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-secondary z-10">
              <div className="text-center p-6">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Camera is off</p>
                <Button onClick={startScanning} disabled={!selectedCamera}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Scan Result */}
      {lastScan && (
        <Card className={`border-2 ${
          lastScan.status === 'success' ? 'border-green-500 bg-green-500/10' :
          lastScan.status === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
          'border-destructive bg-destructive/10'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {lastScan.status === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              ) : lastScan.status === 'warning' ? (
                <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold">{lastScan.message}</p>
                {lastScan.ticketInfo && (
                  <div className="text-sm text-muted-foreground mt-1">
                    <p>Name: {lastScan.ticketInfo.holderName || 'N/A'}</p>
                    <p>Ticket: {lastScan.ticketInfo.ticketType || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        {isScanning ? (
          <Button variant="destructive" onClick={stopScanning} className="flex-1">
            <CameraOff className="mr-2 h-4 w-4" />
            Stop Scanner
          </Button>
        ) : (
          <Button onClick={startScanning} disabled={!selectedCamera} className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            Start Scanner
          </Button>
        )}
        {cameras.length > 1 && (
          <Button variant="outline" onClick={switchCamera}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <p className="text-xs text-center text-muted-foreground">
          Using: {cameras.find(c => c.id === selectedCamera)?.label || 'Unknown camera'}
        </p>
      )}
    </div>
  );
};

export default QRCodeScanner;
