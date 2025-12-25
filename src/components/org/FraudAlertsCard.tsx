import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ShieldAlert, Activity, Clock, X } from 'lucide-react';
import { useFraudDetection } from '@/hooks/useFraudDetection';
import { formatDistanceToNow } from 'date-fns';

interface FraudAlertsCardProps {
  contestId: string;
}

export const FraudAlertsCard: React.FC<FraudAlertsCardProps> = ({ contestId }) => {
  const { data: alerts, isLoading } = useFraudDetection(contestId);
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set());

  const visibleAlerts = alerts?.filter(a => !dismissedAlerts.has(a.id)) || [];

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-orange-500 text-white';
      case 'low': return 'bg-yellow-500 text-black';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rapid_votes': return <Activity className="h-4 w-4" />;
      case 'bulk_votes': return <AlertTriangle className="h-4 w-4" />;
      case 'suspicious_pattern': return <ShieldAlert className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Fraud Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Fraud Detection
              {visibleAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {visibleAlerts.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Monitoring for suspicious voting patterns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {visibleAlerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <p className="font-medium text-foreground">No suspicious activity detected</p>
            <p className="text-sm">Votes are being monitored in real-time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="font-medium mt-1 text-sm">{alert.message}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {alert.details.voteCount && (
                      <span>{alert.details.voteCount} votes</span>
                    )}
                    {alert.details.timeWindow && (
                      <span> in {alert.details.timeWindow}</span>
                    )}
                    {alert.details.averageVotes && (
                      <span> (avg: {alert.details.averageVotes})</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
