import React, { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import QRScanner from '@/components/QRScanner';
import { useValidateTicket } from '@/hooks/useTicketValidation';
import { useEvent } from '@/hooks/useEvents';
import { ArrowLeft, CheckCircle2, XCircle, Ticket, RefreshCw, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

const TicketScanner = () => {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id || '');
  const validateTicket = useValidateTicket();
  
  const [scanResult, setScanResult] = useState<{
    isValid: boolean;
    message: string;
    ticket?: any;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scanCount, setScanCount] = useState({ success: 0, failed: 0 });

  const handleScan = useCallback(async (qrCode: string) => {
    if (!id || validateTicket.isPending) return;
    
    // Pause scanning while validating
    setIsScanning(false);
    
    const result = await validateTicket.mutateAsync({ qrCode, eventId: id });
    setScanResult(result);
    
    // Update counts
    setScanCount(prev => ({
      success: result.isValid ? prev.success + 1 : prev.success,
      failed: !result.isValid ? prev.failed + 1 : prev.failed,
    }));
  }, [id, validateTicket]);

  const handleContinue = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  if (isLoading) {
    return (
      <OrganizationLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!event) {
    return (
      <OrganizationLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Event not found</p>
          <Link to="/org/events">
            <Button className="mt-4">Back to Events</Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to={`/org/events/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Ticket Scanner</h1>
            <p className="text-muted-foreground">{event.title}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scanCount.success}</p>
                <p className="text-sm text-muted-foreground">Validated</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scanCount.failed}</p>
                <p className="text-sm text-muted-foreground">Invalid</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scanner or Result */}
        {scanResult ? (
          <Card className={cn(
            'border-2',
            scanResult.isValid ? 'border-green-500' : 'border-destructive'
          )}>
            <CardContent className="p-6 text-center">
              <div className={cn(
                'mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4',
                scanResult.isValid ? 'bg-green-500/10' : 'bg-destructive/10'
              )}>
                {scanResult.isValid ? (
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                ) : (
                  <XCircle className="h-10 w-10 text-destructive" />
                )}
              </div>
              
              <h2 className={cn(
                'text-2xl font-bold mb-2',
                scanResult.isValid ? 'text-green-500' : 'text-destructive'
              )}>
                {scanResult.isValid ? 'Valid Ticket' : 'Invalid'}
              </h2>
              
              <p className="text-muted-foreground mb-4">{scanResult.message}</p>
              
              {scanResult.ticket && (
                <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-4 w-4" />
                    <span className="font-medium">{scanResult.ticket.ticketType || 'Standard Ticket'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-2 font-medium">{scanResult.ticket.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="ml-2" variant={scanResult.ticket.status === 'used' ? 'secondary' : 'default'}>
                        {scanResult.ticket.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={handleContinue} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Scan Next Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <QRScanner 
              onScan={handleScan}
              isEnabled={isScanning}
              onError={(error) => console.error('Scanner error:', error)}
            />
            
            <Card className="bg-secondary/30">
              <CardContent className="p-4 flex items-start gap-3">
                <QrCode className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">How to scan</p>
                  <p className="text-sm text-muted-foreground">
                    Point your camera at the QR code on the attendee's ticket. 
                    The ticket will be automatically validated and marked as used.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
};

export default TicketScanner;
