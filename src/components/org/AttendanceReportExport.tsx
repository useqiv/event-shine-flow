import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { exportToCsv, formatDateForExport, formatCurrencyForExport } from '@/lib/exportCsv';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AttendanceReportExportProps {
  eventId: string;
  eventTitle: string;
}

const AttendanceReportExport: React.FC<AttendanceReportExportProps> = ({ eventId, eventTitle }) => {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [includeFields, setIncludeFields] = useState({
    ticket_id: true,
    attendee_name: true,
    attendee_email: true,
    attendee_phone: true,
    ticket_type: true,
    quantity: true,
    amount_paid: true,
    payment_method: true,
    purchase_date: true,
    status: true,
    check_in_time: true,
    check_in_count: true,
    last_scan_time: true,
    qr_code: false,
  });

  const toggleField = (field: string) => {
    setIncludeFields(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }));
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // Fetch tickets with related data
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          qr_code,
          status,
          quantity,
          amount_paid,
          payment_method,
          created_at,
          user_id,
          ticket_type_id
        `)
        .eq('event_id', eventId);

      if (ticketsError) throw ticketsError;

      // Fetch all check-in logs for analytics
      const { data: scanLogs } = await supabase
        .from('qr_scan_logs')
        .select('ticket_id, scanned_at, scan_result')
        .eq('event_id', eventId);

      // Create maps for check-in analytics
      const firstCheckInMap = new Map<string, string>();
      const lastCheckInMap = new Map<string, string>();
      const checkInCountMap = new Map<string, number>();
      
      scanLogs?.forEach(log => {
        if (log.scan_result === 'success') {
          // Track first check-in
          if (!firstCheckInMap.has(log.ticket_id)) {
            firstCheckInMap.set(log.ticket_id, log.scanned_at);
          }
          // Track last check-in (always update)
          lastCheckInMap.set(log.ticket_id, log.scanned_at);
          // Count successful scans
          checkInCountMap.set(log.ticket_id, (checkInCountMap.get(log.ticket_id) || 0) + 1);
        }
      });

      // Enrich ticket data
      const enrichedData = [];
      for (const ticket of tickets || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', ticket.user_id)
          .maybeSingle();

        const { data: ticketType } = await supabase
          .from('ticket_types')
          .select('name')
          .eq('id', ticket.ticket_type_id)
          .maybeSingle();

        enrichedData.push({
          ticket_id: ticket.id.slice(0, 8).toUpperCase(),
          attendee_name: profile?.full_name || 'N/A',
          attendee_email: profile?.email || 'N/A',
          attendee_phone: profile?.phone || 'N/A',
          ticket_type: ticketType?.name || 'Standard',
          quantity: ticket.quantity,
          amount_paid: formatCurrencyForExport(ticket.amount_paid),
          payment_method: ticket.payment_method,
          purchase_date: formatDateForExport(ticket.created_at),
          status: ticket.status === 'used' ? 'Checked In' : ticket.status === 'active' ? 'Not Checked In' : ticket.status,
          check_in_time: firstCheckInMap.has(ticket.id) ? formatDateForExport(firstCheckInMap.get(ticket.id)!) : 'Not checked in',
          check_in_count: checkInCountMap.get(ticket.id) || 0,
          last_scan_time: lastCheckInMap.has(ticket.id) ? formatDateForExport(lastCheckInMap.get(ticket.id)!) : 'N/A',
          qr_code: ticket.qr_code,
        });
      }

      if (enrichedData.length === 0) {
        toast.error('No attendance data to export');
        return;
      }

      // Build headers based on selected fields
      const fieldLabels: Record<string, string> = {
        ticket_id: 'Ticket ID',
        attendee_name: 'Attendee Name',
        attendee_email: 'Email',
        attendee_phone: 'Phone',
        ticket_type: 'Ticket Type',
        quantity: 'Quantity',
        amount_paid: 'Amount Paid (₦)',
        payment_method: 'Payment Method',
        purchase_date: 'Purchase Date',
        status: 'Status',
        check_in_time: 'First Check-in',
        check_in_count: 'Scan Count',
        last_scan_time: 'Last Scan',
        qr_code: 'QR Code',
      };

      const selectedFields = Object.entries(includeFields)
        .filter(([_, included]) => included)
        .map(([key]) => key);

      const headers = selectedFields.map(key => ({ key, label: fieldLabels[key] }));

      if (exportFormat === 'csv') {
        const filename = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '-')}-attendance-${format(new Date(), 'yyyy-MM-dd')}`;
        exportToCsv(enrichedData, filename, headers);
        toast.success('Attendance report exported successfully');
      } else {
        // For PDF, we'll generate a simple HTML-based print view
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          toast.error('Please allow popups to export PDF');
          return;
        }

        const checkedInCount = enrichedData.filter(d => d.status === 'Checked In').length;
        const totalAttendees = enrichedData.length;

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Attendance Report - ${eventTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              h1 { color: #333; margin-bottom: 10px; }
              .subtitle { color: #666; margin-bottom: 30px; }
              .summary { display: flex; gap: 40px; margin-bottom: 30px; padding: 20px; background: #f5f5f5; border-radius: 8px; }
              .summary-item { text-align: center; }
              .summary-value { font-size: 32px; font-weight: bold; color: #333; }
              .summary-label { color: #666; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; }
              th { background: #333; color: white; padding: 12px 8px; text-align: left; }
              td { padding: 10px 8px; border-bottom: 1px solid #ddd; }
              tr:nth-child(even) { background: #f9f9f9; }
              .checked-in { color: #22c55e; font-weight: 500; }
              .not-checked-in { color: #f59e0b; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
              @media print { body { margin: 20px; } }
            </style>
          </head>
          <body>
            <h1>Attendance Report</h1>
            <p class="subtitle">${eventTitle} • Generated on ${format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
            
            <div class="summary">
              <div class="summary-item">
                <div class="summary-value">${totalAttendees}</div>
                <div class="summary-label">Total Tickets</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${checkedInCount}</div>
                <div class="summary-label">Checked In</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${totalAttendees - checkedInCount}</div>
                <div class="summary-label">Not Checked In</div>
              </div>
              <div class="summary-item">
                <div class="summary-value">${totalAttendees > 0 ? Math.round((checkedInCount / totalAttendees) * 100) : 0}%</div>
                <div class="summary-label">Check-in Rate</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  ${headers.map(h => `<th>${h.label}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${enrichedData.map(row => `
                  <tr>
                    ${selectedFields.map(key => {
                      const value = row[key as keyof typeof row];
                      const className = key === 'status' 
                        ? (value === 'Checked In' ? 'checked-in' : 'not-checked-in')
                        : '';
                      return `<td class="${className}">${value}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              Generated by USEQIV • ${format(new Date(), 'yyyy')}
            </div>
          </body>
          </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        toast.success('PDF report generated - use Print dialog to save');
      }

      setOpen(false);
    } catch (error: any) {
      toast.error('Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Attendance Report</DialogTitle>
          <DialogDescription>
            Choose format and fields to include in the report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF (Printable)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <Label>Include Fields</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(includeFields).map(([key, checked]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={checked}
                    onCheckedChange={() => toggleField(key)}
                  />
                  <Label htmlFor={key} className="text-sm cursor-pointer capitalize">
                    {key.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceReportExport;
