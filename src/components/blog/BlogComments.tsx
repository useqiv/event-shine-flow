import React, { useState } from 'react';
import { useBlogComments, useCreateBlogComment } from '@/hooks/useBlogComments';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BlogCommentsProps {
  postId: string;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ postId }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: comments, isLoading } = useBlogComments(postId);
  const createComment = useCreateBlogComment();

  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [content, setContent] = useState('');

  const displayName = profile?.full_name || user?.email?.split('@')[0] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = user ? (displayName || 'Reader') : authorName.trim();
    if (!name || !content.trim()) return;

    try {
      await createComment.mutateAsync({
        post_id: postId,
        author_name: name,
        author_email: user?.email || authorEmail.trim() || undefined,
        content: content.trim(),
        user_id: user?.id ?? null,
      });
      setContent('');
      if (!user) {
        setAuthorName('');
        setAuthorEmail('');
      }
    } catch {
      // handled by mutation
    }
  };

  return (
    <section className="mt-12 pt-10 border-t border-border" id="comments">
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        Comments {comments && comments.length > 0 && `(${comments.length})`}
      </h2>

      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-card border border-border rounded-2xl p-5">
        {user && (
          <p className="text-sm text-muted-foreground">
            Commenting as {displayName || user.email}
          </p>
        )}

        {!user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="comment-name">Name *</Label>
              <Input
                id="comment-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment-email">Email (optional)</Label>
              <Input
                id="comment-email"
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="you@example.com"
                maxLength={255}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="comment-content">Your comment *</Label>
          <Textarea
            id="comment-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={4}
            required
            maxLength={2000}
          />
        </div>

        <Button
          type="submit"
          disabled={
            createComment.isPending ||
            !content.trim() ||
            (!user && !authorName.trim())
          }
        >
          {createComment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Post comment
        </Button>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-sm text-foreground">
                  {comment.author_name}
                </span>
                <time
                  className="text-xs text-muted-foreground shrink-0"
                  dateTime={comment.created_at}
                >
                  {format(new Date(comment.created_at), 'MMM d, yyyy · h:mm a')}
                </time>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </section>
  );
};

export default BlogComments;
