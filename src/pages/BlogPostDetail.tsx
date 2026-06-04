import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useBlogPostBySlug } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { sanitizeBlogHtml } from '@/lib/blogUtils';
import SEOHead from '@/components/seo/SEOHead';

const BlogPostDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, isError } = useBlogPostBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="aspect-video w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">Post not found</h1>
          <p className="text-muted-foreground mb-6">This article may have been removed or is not published yet.</p>
          <Button asChild>
            <Link to="/blog">Back to blog</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const date = post.published_at || post.created_at;
  const description =
    post.excerpt?.trim() ||
    post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  return (
    <>
      <SEOHead
        title={`${post.title} | USEQIV Blog`}
        description={description}
        ogType="article"
        publishedTime={post.published_at ?? post.created_at}
        modifiedTime={post.updated_at}
        ogImage={post.cover_image_url ?? undefined}
      />
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="pb-16">
          {post.cover_image_url && (
            <div className="w-full max-h-[420px] overflow-hidden bg-muted">
              <img
                src={post.cover_image_url}
                alt=""
                className="w-full h-full max-h-[420px] object-cover"
              />
            </div>
          )}
          <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All posts
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              {format(new Date(date), 'MMMM d, yyyy')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 leading-tight">
              {post.title}
            </h1>
            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary [&_img]:rounded-xl"
              dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.content) }}
            />
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPostDetail;
