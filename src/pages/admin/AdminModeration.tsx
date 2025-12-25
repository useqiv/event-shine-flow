import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContentModeration, useModerateContent } from '@/hooks/useAdminData';
import { CheckCircle, XCircle, Image, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const AdminModeration: React.FC = () => {
  const { data: content, isLoading } = useContentModeration();
  const moderate = useModerateContent();

  const pending = content?.filter(c => c.status === 'pending') || [];
  const approved = content?.filter(c => c.status === 'approved') || [];
  const rejected = content?.filter(c => c.status === 'rejected') || [];

  const handleApprove = async (id: string) => {
    await moderate.mutateAsync({ contentId: id, status: 'approved' });
  };

  const handleReject = async (id: string) => {
    await moderate.mutateAsync({ contentId: id, status: 'rejected', reason: 'Content does not meet guidelines' });
  };

  const ContentGrid = ({ items }: { items: any[] }) => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <img src={item.content_url} alt="Content" className="w-full h-40 object-cover rounded-lg mb-3" />
            <div className="space-y-2">
              <Badge variant="outline" className="capitalize">{item.content_type.replace(/_/g, ' ')}</Badge>
              <p className="text-xs text-muted-foreground">By: {item.submitter?.full_name || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
              {item.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600" onClick={() => handleApprove(item.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(item.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-12">No content to review</div>
      )}
    </div>
  );

  if (isLoading) {
    return <AdminLayout><div className="space-y-6"><Skeleton className="h-64 w-full" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground">Review and approve uploaded content</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-500" /><div><div className="text-2xl font-bold">{pending.length}</div><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /><div><div className="text-2xl font-bold">{approved.length}</div><p className="text-xs text-muted-foreground">Approved</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-2"><XCircle className="h-5 w-5 text-destructive" /><div><div className="text-2xl font-bold">{rejected.length}</div><p className="text-xs text-muted-foreground">Rejected</p></div></div></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Content Queue</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4"><ContentGrid items={pending} /></TabsContent>
              <TabsContent value="approved" className="mt-4"><ContentGrid items={approved} /></TabsContent>
              <TabsContent value="rejected" className="mt-4"><ContentGrid items={rejected} /></TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminModeration;