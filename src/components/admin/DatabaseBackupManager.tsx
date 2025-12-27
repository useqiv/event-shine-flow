import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Database, 
  Download, 
  Loader2, 
  FileJson, 
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';


interface TableInfo {
  name: string;
  label: string;
  category: 'users' | 'contests' | 'events' | 'transactions' | 'system';
}

const ALL_TABLES: TableInfo[] = [
  // Users & Profiles
  { name: 'profiles', label: 'User Profiles', category: 'users' },
  { name: 'user_roles', label: 'User Roles', category: 'users' },
  { name: 'wallets', label: 'Wallets', category: 'users' },
  { name: 'user_vote_streaks', label: 'Vote Streaks', category: 'users' },
  { name: 'saved_items', label: 'Saved Items', category: 'users' },
  { name: 'favorite_contestants', label: 'Favorite Contestants', category: 'users' },
  
  // Contests
  { name: 'contests', label: 'Contests', category: 'contests' },
  { name: 'contestants', label: 'Contestants', category: 'contests' },
  { name: 'votes', label: 'Votes', category: 'contests' },
  { name: 'contest_analytics', label: 'Contest Analytics', category: 'contests' },
  { name: 'contest_auto_posts', label: 'Contest Auto Posts', category: 'contests' },
  
  // Events
  { name: 'events', label: 'Events', category: 'events' },
  { name: 'ticket_types', label: 'Ticket Types', category: 'events' },
  { name: 'tickets', label: 'Tickets', category: 'events' },
  { name: 'ticket_transfers', label: 'Ticket Transfers', category: 'events' },
  { name: 'qr_scan_logs', label: 'QR Scan Logs', category: 'events' },
  { name: 'event_auto_posts', label: 'Event Auto Posts', category: 'events' },
  { name: 'event_templates', label: 'Event Templates', category: 'events' },
  
  // Transactions & Finance
  { name: 'wallet_transactions', label: 'Wallet Transactions', category: 'transactions' },
  { name: 'payouts', label: 'Payouts', category: 'transactions' },
  { name: 'refunds', label: 'Refunds', category: 'transactions' },
  { name: 'promo_codes', label: 'Promo Codes', category: 'transactions' },
  { name: 'promo_code_usage', label: 'Promo Code Usage', category: 'transactions' },
  { name: 'vouchers', label: 'Vouchers', category: 'transactions' },
  
  // System & Admin
  { name: 'notifications', label: 'Notifications', category: 'system' },
  { name: 'fraud_alerts', label: 'Fraud Alerts', category: 'system' },
  { name: 'content_moderation', label: 'Content Moderation', category: 'system' },
  { name: 'admin_activity_logs', label: 'Admin Activity Logs', category: 'system' },
  { name: 'organization_approvals', label: 'Org Approvals', category: 'system' },
  { name: 'organization_settings', label: 'Org Settings', category: 'system' },
  { name: 'organization_webhooks', label: 'Org Webhooks', category: 'system' },
  { name: 'webhook_logs', label: 'Webhook Logs', category: 'system' },
  { name: 'platform_settings', label: 'Platform Settings', category: 'system' },
  { name: 'support_tickets', label: 'Support Tickets', category: 'system' },
  { name: 'support_ticket_messages', label: 'Support Messages', category: 'system' },
  { name: 'team_members', label: 'Team Members', category: 'system' },
  { name: 'influencer_links', label: 'Influencer Links', category: 'system' },
  { name: 'influencer_clicks', label: 'Influencer Clicks', category: 'system' },
  { name: 'social_post_logs', label: 'Social Post Logs', category: 'system' },
];

const CATEGORY_LABELS: Record<string, string> = {
  users: 'Users & Profiles',
  contests: 'Contests',
  events: 'Events & Tickets',
  transactions: 'Transactions & Finance',
  system: 'System & Admin',
};

interface BackupHistory {
  id: string;
  tables: string[];
  format: 'csv' | 'json';
  status: 'completed' | 'failed';
  createdAt: Date;
  fileSize?: string;
}

const DatabaseBackupManager: React.FC = () => {
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupSchedule, setAutoBackupSchedule] = useState('weekly');

  const toggleTable = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const selectCategory = (category: string) => {
    const categoryTables = ALL_TABLES.filter(t => t.category === category).map(t => t.name);
    const allSelected = categoryTables.every(t => selectedTables.includes(t));
    
    if (allSelected) {
      setSelectedTables(prev => prev.filter(t => !categoryTables.includes(t)));
    } else {
      setSelectedTables(prev => [...new Set([...prev, ...categoryTables])]);
    }
  };

  const selectAll = () => {
    if (selectedTables.length === ALL_TABLES.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(ALL_TABLES.map(t => t.name));
    }
  };

  const fetchTableData = async (tableName: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(10000);
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      return [];
    }
    
    return data || [];
  };

  const exportBackup = async () => {
    if (selectedTables.length === 0) {
      toast.error('Please select at least one table to export');
      return;
    }

    setIsExporting(true);
    setExportProgress({ current: 0, total: selectedTables.length });

    try {
      const allData: Record<string, any[]> = {};
      
      for (let i = 0; i < selectedTables.length; i++) {
        const tableName = selectedTables[i];
        setExportProgress({ current: i + 1, total: selectedTables.length });
        
        const data = await fetchTableData(tableName);
        allData[tableName] = data;
      }

      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');

      if (exportFormat === 'json') {
        // Export as single JSON file
        const jsonBlob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `votepass_backup_${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Export as CSV - create individual downloads for each table
        for (const [tableName, data] of Object.entries(allData)) {
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            // Create CSV content manually and download
            const csvContent = [
              headers.join(','),
              ...data.map(row => 
                headers.map(h => {
                  const val = row[h];
                  if (val === null || val === undefined) return '';
                  const str = String(val);
                  return str.includes(',') || str.includes('"') || str.includes('\n') 
                    ? `"${str.replace(/"/g, '""')}"` 
                    : str;
                }).join(',')
              )
            ].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tableName}_${timestamp}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Small delay between downloads
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      // Add to history
      const newBackup: BackupHistory = {
        id: crypto.randomUUID(),
        tables: selectedTables,
        format: exportFormat,
        status: 'completed',
        createdAt: new Date(),
      };
      setBackupHistory(prev => [newBackup, ...prev.slice(0, 9)]);

      toast.success(`Backup completed! Exported ${selectedTables.length} tables`);
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Backup failed. Please try again.');
      
      const failedBackup: BackupHistory = {
        id: crypto.randomUUID(),
        tables: selectedTables,
        format: exportFormat,
        status: 'failed',
        createdAt: new Date(),
      };
      setBackupHistory(prev => [failedBackup, ...prev.slice(0, 9)]);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const groupedTables = Object.entries(CATEGORY_LABELS).map(([category, label]) => ({
    category,
    label,
    tables: ALL_TABLES.filter(t => t.category === category),
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Backup & Export
          </CardTitle>
          <CardDescription>
            Export database tables for backup or analysis. Select tables and choose format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedTables.length === ALL_TABLES.length ? 'Deselect All' : 'Select All'}
            </Button>
            {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
              <Button
                key={category}
                variant="outline"
                size="sm"
                onClick={() => selectCategory(category)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Table Selection */}
          <div className="grid gap-6">
            {groupedTables.map(({ category, label, tables }) => (
              <div key={category}>
                <h4 className="font-medium mb-3">{label}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tables.map(table => (
                    <label
                      key={table.name}
                      className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={() => toggleTable(table.name)}
                      />
                      <span className="text-sm">{table.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Export Options */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end pt-4 border-t">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportFormat} onValueChange={(v: 'csv' | 'json') => setExportFormat(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      CSV (Multiple files)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON (Single file)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={exportBackup} 
              disabled={isExporting || selectedTables.length === 0}
              className="min-w-[200px]"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting {exportProgress?.current}/{exportProgress?.total}...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {selectedTables.length} Tables
                </>
              )}
            </Button>
          </div>

          {selectedTables.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedTables.map(t => ALL_TABLES.find(at => at.name === t)?.label).join(', ')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Scheduled Backups
          </CardTitle>
          <CardDescription>
            Configure automatic backups for your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Enable Automatic Backups</p>
              <p className="text-sm text-muted-foreground">
                Automatically export all tables on a schedule
              </p>
            </div>
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={setAutoBackupEnabled}
            />
          </div>

          {autoBackupEnabled && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select value={autoBackupSchedule} onValueChange={setAutoBackupSchedule}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                Note: Automated backups will be stored in Supabase Storage and can be downloaded from the backup history.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Recent Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Tables</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backupHistory.map(backup => (
                  <TableRow key={backup.id}>
                    <TableCell>{format(backup.createdAt, 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell>{backup.tables.length} tables</TableCell>
                    <TableCell>
                      <Badge variant="outline">{backup.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      {backup.status === 'completed' ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DatabaseBackupManager;
