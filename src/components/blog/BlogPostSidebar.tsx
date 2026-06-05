import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { BlogPost } from '@/hooks/useBlogPosts';
import { BookOpen } from 'lucide-react';

const ADSENSE_CLIENT = 'ca-pub-4739421992298461';
const ADSENSE_SLOT = '7321558608';

interface BlogPostSidebarProps {
  relatedPosts: BlogPost[];
  sidebarImages?: string[];
  /** Changes when navigating between posts so the ad unit re-initializes */
  postSlug?: string;
}

function loadAdSenseScript(): Promise<void> {
  return new Promise((resolve) => {
    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
    );
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

const BlogPostSidebar = ({ relatedPosts, sidebarImages = [], postSlug }: BlogPostSidebarProps) => {
  const images = sidebarImages.filter(Boolean);
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    let cancelled = false;

    const initAd = async () => {
      await loadAdSenseScript();
      if (cancelled || !adRef.current) return;

      try {
        const w = window as Window & { adsbygoogle?: Record<string, unknown>[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        // AdSense may error if the slot was already initialized
      }
    };

    initAd();

    return () => {
      cancelled = true;
    };
  }, [postSlug]);

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

      <section className="rounded-2xl overflow-hidden" aria-label="Advertisement">
        <ins
          ref={adRef}
          key={postSlug ?? 'blog-ad'}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
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
