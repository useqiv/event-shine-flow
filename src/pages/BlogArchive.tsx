import { Link } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { usePublishedBlogPosts } from '@/hooks/useBlogPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { stripHtmlToText } from '@/lib/blogUtils';
import SEOHead from '@/components/seo/SEOHead';
import {
  SITE_URL,
  getBlogArchiveSchema,
  getBreadcrumbSchema,
  combineSchemas,
} from '@/lib/structuredData';

const BlogArchive = () => {
  const { data: posts, isLoading } = usePublishedBlogPosts(50);

  const archiveSchema = posts?.length
    ? combineSchemas(
        getBlogArchiveSchema(
          posts.map((post) => ({
            title: post.title,
            url: `${SITE_URL}/blog/${post.slug}`,
            datePublished: post.published_at ?? post.created_at,
            image: post.cover_image_url ?? undefined,
          }))
        ),
        getBreadcrumbSchema([
          { name: 'Home', url: SITE_URL },
          { name: 'Blog', url: `${SITE_URL}/blog` },
        ])
      )
    : getBreadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
      ]);

  return (
    <>
      <SEOHead
        title="Blog"
        description="Expert guides, product updates, and insights on contest voting, event ticketing, crowdfunding, and event management from USEQIV."
        canonicalUrl={`${SITE_URL}/blog`}
        keywords="USEQIV blog, contest voting tips, event ticketing guides, crowdfunding advice, event platform news"
        structuredData={archiveSchema}
      />
      <div className="min-h-screen bg-muted">
        <Navbar />
        <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-3">
              <BookOpen className="h-4 w-4" />
              Blog
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">All posts</h1>
            <p className="text-muted-foreground mt-2">
              News, tips, and updates from USEQIV on contests, events, and campaigns.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const preview =
                  post.excerpt?.trim() ||
                  stripHtmlToText(post.content).slice(0, 120) + '…';
                const date = post.published_at || post.created_at;

                return (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="aspect-[16/10] bg-muted">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/15 to-accent/15">
                          <BookOpen className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                        <Calendar className="h-3 w-3" />
                        <time dateTime={date}>{format(new Date(date), 'MMM d, yyyy')}</time>
                      </span>
                      <h2 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
                        {preview}
                      </p>
                      <span className="text-sm text-primary font-medium mt-3 inline-flex items-center">
                        Read more <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-16">No posts published yet. Check back soon.</p>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogArchive;
