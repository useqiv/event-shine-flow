import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrganizationLayout from '@/components/layout/OrganizationLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { useContest, useContestants } from '@/hooks/useContests';
import { useUpdateContest, useCreateContestant, useContestContestants } from '@/hooks/useOrganization';
import { Trophy, Users, Vote, PlusCircle, BarChart3, Download, ArrowLeft, Edit, Copy, Link as LinkIcon, Save } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { exportToCsv, formatDateForExport } from '@/lib/exportCsv';

const categories = [
  'Music', 'Beauty', 'Fashion', 'Sports', 'Talent',
  'Dance', 'Photography', 'Art', 'Tech', 'Other'
];


const ContestManagement = () => {
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading } = useContest(id || '');
  const { data: contestants, isLoading: contestantsLoading } = useContestants(id || '');
  const updateContest = useUpdateContest();
  const createContestant = useCreateContestant();

  const [isAddContestantOpen, setIsAddContestantOpen] = useState(false);
  const [newContestant, setNewContestant] = useState({
    name: '',
    bio: '',
    photo_url: '',
    performance: '',
  });

  // Edit contest form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    image_url: '',
    start_date: '',
    end_date: '',
    vote_price: 100,
  });

  // Initialize edit form when contest data loads
  useEffect(() => {
    if (contest) {
      setEditForm({
        title: contest.title || '',
        description: contest.description || '',
        category: contest.category || '',
        image_url: contest.image_url || '',
        start_date: contest.start_date ? new Date(contest.start_date).toISOString().slice(0, 16) : '',
        end_date: contest.end_date ? new Date(contest.end_date).toISOString().slice(0, 16) : '',
        vote_price: Number(contest.vote_price) || 100,
      });
    }
  }, [contest]);

  const handleAddContestant = async () => {
    if (!id || !newContestant.name) return;
    
    try {
      await createContestant.mutateAsync({
        contest_id: id,
        ...newContestant,
      });
      setIsAddContestantOpen(false);
      setNewContestant({ name: '', bio: '', photo_url: '', performance: '' });
    } catch (error) {
      console.error('Failed to add contestant:', error);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/contests/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Contest link copied to clipboard!');
  };

  const handleCopyContestantLink = (contestantId: string, contestantName: string) => {
    const url = `${window.location.origin}/contests/${id}?vote=${contestantId}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link for ${contestantName} copied!`);
  };

  const handleToggleActive = async () => {
    if (!contest) return;
    await updateContest.mutateAsync({
      id: contest.id,
      is_active: !contest.is_active,
    });
  };

  const handleSaveContestDetails = async () => {
    if (!contest) return;
    try {
      await updateContest.mutateAsync({
        id: contest.id,
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        image_url: editForm.image_url,
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        vote_price: Number(editForm.vote_price),
      });
      toast.success('Contest details updated successfully');
    } catch (error) {
      console.error('Failed to update contest:', error);
    }
  };

  const handleExportContestants = () => {
    if (!contestants || contestants.length === 0) {
      toast.error('No contestants to export');
      return;
    }

    const headers = [
      { key: 'name', label: 'Name' },
      { key: 'bio', label: 'Bio' },
      { key: 'performance', label: 'Performance' },
      { key: 'vote_count', label: 'Votes' },
      { key: 'created_at', label: 'Added Date' },
    ];

    const exportData = contestants.map((c: any, index: number) => ({
      ...c,
      created_at: formatDateForExport(c.created_at),
      rank: index + 1,
    }));

    exportToCsv(exportData, `${contest?.title || 'contest'}-results-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success('Contest results exported successfully');
  };

  const handleExportLeaderboard = () => {
    if (!contestants || contestants.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      { key: 'rank', label: 'Rank' },
      { key: 'name', label: 'Contestant Name' },
      { key: 'vote_count', label: 'Total Votes' },
      { key: 'percentage', label: 'Vote Percentage' },
    ];

    const totalVotes = contestants.reduce((sum: number, c: any) => sum + c.vote_count, 0);
    
    const exportData = contestants.map((c: any, index: number) => ({
      rank: index + 1,
      name: c.name,
      vote_count: c.vote_count,
      percentage: totalVotes > 0 ? `${((c.vote_count / totalVotes) * 100).toFixed(2)}%` : '0%',
    }));

    exportToCsv(exportData, `${contest?.title || 'contest'}-leaderboard-${format(new Date(), 'yyyy-MM-dd')}`, headers);
    toast.success('Leaderboard exported successfully');
  };

  if (isLoading) {
    return (
      <OrganizationLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
        </div>
      </OrganizationLayout>
    );
  }

  if (!contest) {
    return (
      <OrganizationLayout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Contest not found</p>
          <Link to="/org/contests">
            <Button variant="link">Back to Contests</Button>
          </Link>
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/org/contests">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{contest.title}</h1>
              <p className="text-muted-foreground">
                {format(new Date(contest.start_date), 'MMM d')} - {format(new Date(contest.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <Button
              variant={contest.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
            >
              {contest.is_active ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                  <p className="text-2xl font-bold">{contest.total_votes.toLocaleString()}</p>
                </div>
                <Vote className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Contestants</p>
                  <p className="text-2xl font-bold">{contestants?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vote Price</p>
                  <p className="text-2xl font-bold">₦{Number(contest.vote_price).toLocaleString()}</p>
                </div>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">₦{(contest.total_votes * Number(contest.vote_price)).toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="contestants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contestants">Contestants</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="contestants" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Contestants ({contestants?.length || 0})</h2>
              <Dialog open={isAddContestantOpen} onOpenChange={setIsAddContestantOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Contestant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Contestant</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input
                        placeholder="Contestant name"
                        value={newContestant.name}
                        onChange={(e) => setNewContestant(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea
                        placeholder="Short bio..."
                        value={newContestant.bio}
                        onChange={(e) => setNewContestant(prev => ({ ...prev, bio: e.target.value }))}
                      />
                    </div>
                    <ImageUpload
                      bucket="contestant-images"
                      value={newContestant.photo_url}
                      onChange={(url) => setNewContestant(prev => ({ ...prev, photo_url: url }))}
                      label="Photo"
                    />
                    <div className="space-y-2">
                      <Label>Performance/Entry</Label>
                      <Input
                        placeholder="e.g., Song title, routine name"
                        value={newContestant.performance}
                        onChange={(e) => setNewContestant(prev => ({ ...prev, performance: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddContestant} className="w-full" disabled={createContestant.isPending}>
                      {createContestant.isPending ? 'Adding...' : 'Add Contestant'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {contestantsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : contestants && contestants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contestants.map((contestant: any) => (
                  <Card key={contestant.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {contestant.photo_url ? (
                            <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{contestant.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{contestant.bio}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Vote className="h-4 w-4 text-primary" />
                            <span className="font-medium">{contestant.vote_count.toLocaleString()} votes</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleCopyContestantLink(contestant.id, contestant.name)}
                        >
                          <LinkIcon className="h-3 w-3 mr-2" />
                          Copy Voting Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No contestants yet. Add your first contestant to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Leaderboard</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleExportLeaderboard}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contestants && contestants.length > 0 ? (
                  <div className="space-y-2">
                    {contestants.map((contestant: any, index: number) => (
                      <div key={contestant.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-400 text-gray-900' :
                          index === 2 ? 'bg-orange-400 text-orange-950' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="h-10 w-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                          {contestant.photo_url ? (
                            <img src={contestant.photo_url} alt={contestant.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{contestant.name}</p>
                        </div>
                        <Badge variant="secondary">
                          {contestant.vote_count.toLocaleString()} votes
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No contestants to display</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contest Details</CardTitle>
                <CardDescription>Update your contest information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Contest Title *</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select
                      value={editForm.category}
                      onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-vote-price">Price per Vote (₦) *</Label>
                    <Input
                      id="edit-vote-price"
                      type="number"
                      min="1"
                      value={editForm.vote_price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, vote_price: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <ImageUpload
                  bucket="contest-images"
                  value={editForm.image_url}
                  onChange={(url) => setEditForm(prev => ({ ...prev, image_url: url }))}
                  label="Contest Banner Image"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Update contest dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-date">Start Date *</Label>
                    <Input
                      id="edit-start-date"
                      type="datetime-local"
                      value={editForm.start_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-end-date">End Date *</Label>
                    <Input
                      id="edit-end-date"
                      type="datetime-local"
                      value={editForm.end_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveContestDetails} disabled={updateContest.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateContest.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationLayout>
  );
};

export default ContestManagement;
