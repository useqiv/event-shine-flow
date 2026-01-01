import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Download, Trash2, Eye, FileText, BarChart3, CheckCircle, Clock, Archive } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useForm, useFormFields, useFormResponses, useDeleteFormResponse, useUpdateFormResponse, useFormAnalytics, FormResponse } from '@/hooks/useForms';
import { format } from 'date-fns';
import { exportToCsv } from '@/lib/exportCsv';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  reviewed: { label: 'Reviewed', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground border-border', icon: Archive },
};

const FormResponses = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const { data: form, isLoading: formLoading } = useForm(formId || '');
  const { data: fields, isLoading: fieldsLoading } = useFormFields(formId || '');
  const { data: responses, isLoading: responsesLoading } = useFormResponses(formId || '');
  const { data: analytics, isLoading: analyticsLoading } = useFormAnalytics(formId || '');
  const deleteResponse = useDeleteFormResponse();
  const updateResponse = useUpdateFormResponse();

  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [activeTab, setActiveTab] = useState('responses');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleExport = () => {
    if (!responses || !fields || !form) return;

    const exportData = responses.map((response) => {
      const row: Record<string, string> = {
        'Submitted At': format(new Date(response.submitted_at), 'yyyy-MM-dd HH:mm:ss'),
        'Respondent Name': response.respondent_name || '',
        'Respondent Email': response.respondent_email || '',
        'Status': response.status,
      };

      fields.forEach((field) => {
        const value = response.response_data[field.id];
        row[field.label] = Array.isArray(value) ? value.join(', ') : String(value || '');
      });

      return row;
    });

    exportToCsv(exportData, `${form.title.replace(/[^a-z0-9]/gi, '_')}_responses`);
  };

  const handleDeleteResponse = async (responseId: string) => {
    if (!formId) return;
    if (confirm('Are you sure you want to delete this response?')) {
      await deleteResponse.mutateAsync({ id: responseId, form_id: formId });
      setSelectedResponse(null);
    }
  };

  const handleStatusChange = async (responseId: string, newStatus: string) => {
    if (!formId) return;
    await updateResponse.mutateAsync({ id: responseId, form_id: formId, status: newStatus });
  };

  const isLoading = formLoading || fieldsLoading || responsesLoading;

  const filteredResponses = responses?.filter(r => 
    statusFilter === 'all' || r.status === statusFilter
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!form) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-4">Form not found</h2>
          <Button onClick={() => navigate('/forms')}>Back to Forms</Button>
        </div>
      </DashboardLayout>
    );
  }

  const getFieldLabel = (fieldId: string): string => {
    const field = fields?.find(f => f.id === fieldId);
    return field?.label || fieldId;
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  return (
    <DashboardLayout>
      <Helmet>
        <title>Responses - {form.title} | VoteApp</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={`/forms/${formId}/edit`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{form.title}</h1>
              <p className="text-muted-foreground text-sm">
                {responses?.length || 0} response{(responses?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!responses?.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="responses">Responses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="responses" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Responses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  {analytics?.statusCounts.pending || 0} Pending
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  {analytics?.statusCounts.reviewed || 0} Reviewed
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  {analytics?.statusCounts.archived || 0} Archived
                </Badge>
              </div>
            </div>

            {/* Responses Table */}
            {filteredResponses && filteredResponses.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Respondent</TableHead>
                        <TableHead>Status</TableHead>
                        {fields?.slice(0, 2).map((field) => (
                          <TableHead key={field.id} className="max-w-[200px]">
                            {field.label}
                          </TableHead>
                        ))}
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResponses.map((response) => {
                        const statusConfig = STATUS_CONFIG[response.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                        const StatusIcon = statusConfig.icon;
                        
                        return (
                          <TableRow key={response.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {response.respondent_name || 'Anonymous'}
                                </span>
                                {response.respondent_email && (
                                  <span className="text-sm text-muted-foreground">
                                    {response.respondent_email}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={response.status}
                                onValueChange={(value) => handleStatusChange(response.id, value)}
                              >
                                <SelectTrigger className={`h-8 w-[120px] text-xs ${statusConfig.color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                  <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            {fields?.slice(0, 2).map((field) => (
                              <TableCell key={field.id} className="max-w-[200px] truncate">
                                {formatValue(response.response_data[field.id])}
                              </TableCell>
                            ))}
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedResponse(response)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteResponse(response.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Share your form to start collecting responses.
                  </p>
                  <Link to={`/f/${formId}`} target="_blank">
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Form
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{analytics?.totalResponses || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Responses</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-600">{analytics?.statusCounts.pending || 0}</div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">{analytics?.statusCounts.reviewed || 0}</div>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-muted-foreground">{analytics?.statusCounts.archived || 0}</div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                </CardContent>
              </Card>
            </div>

            {/* Submission Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Submission Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.dailyStats && analytics.dailyStats.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          labelFormatter={(value) => format(new Date(value), 'MMMM d, yyyy')}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary) / 0.2)" 
                          name="Responses"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p>{format(new Date(selectedResponse.submitted_at), 'PPpp')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Respondent</p>
                  <p>{selectedResponse.respondent_name || 'Anonymous'}</p>
                  {selectedResponse.respondent_email && (
                    <p className="text-sm text-muted-foreground">{selectedResponse.respondent_email}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {fields?.map((field) => (
                  <div key={field.id}>
                    <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                    <p className="mt-1">{formatValue(selectedResponse.response_data[field.id])}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default FormResponses;