import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Database, Server, Clock, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface HealthMetric {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  lastChecked: Date;
}

interface ResponseHistory {
  time: string;
  db: number;
  auth: number;
}

export function SystemMetricsWidget() {
  const [responseHistory, setResponseHistory] = useState<ResponseHistory[]>([]);
  
  // Check database health
  const { data: dbHealth, refetch: refetchDb } = useQuery({
    queryKey: ["system-health-db"],
    queryFn: async (): Promise<HealthMetric> => {
      const start = performance.now();
      try {
        await supabase.from("profiles").select("id").limit(1);
        const responseTime = performance.now() - start;
        return {
          name: "Database",
          status: responseTime < 500 ? "healthy" : responseTime < 1500 ? "degraded" : "down",
          responseTime: Math.round(responseTime),
          lastChecked: new Date()
        };
      } catch {
        return {
          name: "Database",
          status: "down",
          responseTime: performance.now() - start,
          lastChecked: new Date()
        };
      }
    },
    refetchInterval: 30000
  });

  // Check auth service health
  const { data: authHealth, refetch: refetchAuth } = useQuery({
    queryKey: ["system-health-auth"],
    queryFn: async (): Promise<HealthMetric> => {
      const start = performance.now();
      try {
        await supabase.auth.getSession();
        const responseTime = performance.now() - start;
        return {
          name: "Auth Service",
          status: responseTime < 300 ? "healthy" : responseTime < 1000 ? "degraded" : "down",
          responseTime: Math.round(responseTime),
          lastChecked: new Date()
        };
      } catch {
        return {
          name: "Auth Service",
          status: "down",
          responseTime: performance.now() - start,
          lastChecked: new Date()
        };
      }
    },
    refetchInterval: 30000
  });

  // Fetch error stats
  const { data: errorStats } = useQuery({
    queryKey: ["system-error-stats"],
    queryFn: async () => {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const [fraudAlerts, rejectedContent] = await Promise.all([
        supabase.from("fraud_alerts").select("id", { count: "exact" }).gte("created_at", last24Hours),
        supabase.from("content_moderation").select("id", { count: "exact" }).eq("status", "rejected").gte("created_at", last24Hours)
      ]);
      
      return {
        fraudAlerts: fraudAlerts.count || 0,
        rejectedContent: rejectedContent.count || 0
      };
    },
    refetchInterval: 60000
  });

  // Update response history
  useEffect(() => {
    if (dbHealth && authHealth) {
      setResponseHistory(prev => {
        const newEntry = {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          db: dbHealth.responseTime,
          auth: authHealth.responseTime
        };
        const updated = [...prev, newEntry].slice(-10);
        return updated;
      });
    }
  }, [dbHealth, authHealth]);

  const handleRefresh = () => {
    refetchDb();
    refetchAuth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-green-500";
      case "degraded": return "text-yellow-500";
      case "down": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>;
      case "degraded": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
      case "down": return <Badge variant="destructive">Down</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const overallStatus = dbHealth?.status === "healthy" && authHealth?.status === "healthy" 
    ? "healthy" 
    : dbHealth?.status === "down" || authHealth?.status === "down" 
      ? "down" 
      : "degraded";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Metrics
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {overallStatus === "healthy" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertTriangle className={`h-5 w-5 ${getStatusColor(overallStatus)}`} />
            )}
            <span className="font-medium">Overall Status</span>
          </div>
          {getStatusBadge(overallStatus)}
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Database</span>
            </div>
            <div className="flex items-center justify-between">
              {getStatusBadge(dbHealth?.status || "unknown")}
              <span className="text-xs text-muted-foreground">
                {dbHealth?.responseTime || 0}ms
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Auth Service</span>
            </div>
            <div className="flex items-center justify-between">
              {getStatusBadge(authHealth?.status || "unknown")}
              <span className="text-xs text-muted-foreground">
                {authHealth?.responseTime || 0}ms
              </span>
            </div>
          </div>
        </div>

        {/* Response Time Chart */}
        {responseHistory.length > 1 && (
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseHistory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Line type="monotone" dataKey="db" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Database" />
                <Line type="monotone" dataKey="auth" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Auth" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Error Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold">{errorStats?.fraudAlerts || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Fraud Alerts (24h)</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{errorStats?.rejectedContent || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">Rejected Content (24h)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
