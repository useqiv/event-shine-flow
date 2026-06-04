import { Link } from "react-router-dom";
import { usePublishedBlogPosts } from "@/hooks/useBlogPosts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Calendar } from "lucide-react";
import { format } from "date-fns";
import { stripHtmlToText } from "@/lib/blogUtils";

const BlogShowcase = () => {
  const { data: posts, isLoading } = usePublishedBlogPosts(6);

  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <section id="blog" className="py-10 sm:py-14 lg:py-20 bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                From our blog
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Insights & Updates
              </h2>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
                Tips, product news, and guides for running contests, events, and campaigns on USEQIV.
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link to="/blog">
                View all posts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts?.map((post) => {
                const preview =
                  post.excerpt?.trim() ||
                  stripHtmlToText(post.content).slice(0, 140) +
                    (stripHtmlToText(post.content).length > 140 ? "…" : "");
                const date = post.published_at || post.created_at;

                return (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      {post.cover_image_url ? (
                        <img
                          src={post.cover_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                          <BookOpen className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(date), "MMM d, yyyy")}
                        {post.is_featured && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                        {preview}
                      </p>
                      <span className="inline-flex items-center text-sm font-medium text-primary mt-4">
                        Read more
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogShowcase;
