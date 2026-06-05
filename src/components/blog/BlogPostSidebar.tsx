import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BlogPost } from '@/hooks/useBlogPosts';
import { BookOpen } from 'lucide-react';

interface BlogPostSidebarProps {
  relatedPosts: BlogPost[];
  sidebarImages?: string[];
}

const BlogPostSidebar = ({ relatedPosts, sidebarImages = [] }: BlogPostSidebarProps) => {
  const images = sidebarImages.filter(Boolean);

  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      {relatedPosts.length > 0 && (
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            Related posts
          </h2>
          <ul className="space-y-4">
            {relatedPosts.map((related) => {
              const date = related.published_at || related.created_at;
              return (
                <li key={related.id}>
                  <Link
                    to={`/blog/${related.slug}`}
                    className="group flex gap-3 items-start"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                      {related.cover_image_url ? (
                        <img
                          src={related.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {related.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Google AdSense slot — replace data-ad-slot with your AdSense unit ID */}
      <section
        className="bg-muted/50 border border-dashed border-border rounded-2xl p-5 min-h-[280px] flex flex-col items-center justify-center text-center"
        aria-label="Advertisement"
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
          Sponsored
        </p>
        <div
          id="blog-ad-slot"
          className="w-full min-h-[250px] flex items-center justify-center"
        >
          <ins
            className="adsbygoogle block w-full min-h-[250px]"
            style={{ display: 'block' }}
            data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
            data-ad-slot="XXXXXXXXXX"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Ad space reserved for Google AdSense
        </p>
      </section>

      {images.length > 0 && (
        <section className="space-y-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="rounded-2xl overflow-hidden border border-border bg-card"
            >
              <img
                src={url}
                alt=""
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </section>
      )}
    </aside>
  );
};

export default BlogPostSidebar;
