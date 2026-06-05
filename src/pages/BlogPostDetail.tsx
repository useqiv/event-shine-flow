import { Link, useParams } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { useBlogPostBySlug } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import {
  sanitizeBlogHtml,
  buildBlogMetaDescription,
  buildBlogKeywords,
  countWords,
} from '@/lib/blogUtils';
import SEOHead from '@/components/seo/SEOHead';
import {
  SITE_URL,
  getBlogPostingSchema,
  getBreadcrumbSchema,
  combineSchemas,
} from '@/lib/structuredData';

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
  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const description = buildBlogMetaDescription(post.excerpt, post.content);
  const keywords = buildBlogKeywords(post.title, post.excerpt);
  const tags = post.title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5);

  const structuredData = combineSchemas(
    getBlogPostingSchema({
      title: post.title,
      description,
      url: pageUrl,
      image: post.cover_image_url ?? undefined,
      datePublished: post.published_at ?? post.created_at,
      dateModified: post.updated_at,
      wordCount: countWords(post.content),
    }),
    getBreadcrumbSchema([
      { name: 'Home', url: SITE_URL },
      { name: 'Blog', url: `${SITE_URL}/blog` },
      { name: post.title, url: pageUrl },
    ])
  );

  return (
    <>
      <SEOHead
        title={post.title}
        description={description}
        canonicalUrl={pageUrl}
        ogType="article"
        ogImage={post.cover_image_url ?? `${SITE_URL}/og-image.png`}
        keywords={keywords}
        author="USEQIV"
        publishedTime={post.published_at ?? post.created_at}
        modifiedTime={post.updated_at}
        articleSection="Blog"
        tags={tags}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="pb-16">
          {post.cover_image_url && (
            <div className="w-full max-h-[420px] overflow-hidden bg-muted">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-full max-h-[420px] object-cover"
              />
            </div>
          )}
          <article
            className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14"
            itemScope
            itemType="https://schema.org/BlogPosting"
          >
            <meta itemProp="headline" content={post.title} />
            <meta itemProp="description" content={description} />
            <meta itemProp="datePublished" content={post.published_at ?? post.created_at} />
            <meta itemProp="dateModified" content={post.updated_at} />
            {post.cover_image_url && <meta itemProp="image" content={post.cover_image_url} />}
            <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
              <Link to="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All posts
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4" />
              <time dateTime={date}>{format(new Date(date), 'MMMM d, yyyy')}</time>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 leading-tight" itemProp="name">
              {post.title}
            </h1>
            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary [&_img]:rounded-xl"
              itemProp="articleBody"
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
