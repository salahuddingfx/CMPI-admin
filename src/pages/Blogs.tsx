import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, User } from "lucide-react";
import { getBlogs, createBlog, updateBlog, deleteBlog } from "../services/api";
import FileUpload from "../components/FileUpload";

interface Blog {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  read_time: string;
  related_ids?: string[];
  image?: string;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editBlog, setEditBlog] = useState<Blog | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Admin Office");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("Academics");
  const [readTime, setReadTime] = useState("5 min read");
  const [relatedIds, setRelatedIds] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await getBlogs();
      setBlogs(data);
    } catch (err) {
      console.error("Failed to load blogs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    // Auto-generate slug if not editing a saved blog, or if slug was previously auto-derived
    if (!editBlog) {
      setSlug(generateSlug(val));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setAuthor("Admin Office");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Academics");
    setReadTime("5 min read");
    setRelatedIds("");
    setImageUrl("");
    setEditBlog(null);
    setShowForm(false);
  };

  const handleEditClick = (blog: Blog) => {
    setEditBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setExcerpt(blog.excerpt);
    setContent(blog.content);
    setAuthor(blog.author);
    setDate(blog.date ? blog.date.split("T")[0] : "");
    setCategory(blog.category);
    setReadTime(blog.read_time);
    setRelatedIds(blog.related_ids ? blog.related_ids.join(", ") : "");
    setImageUrl(blog.image || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const relatedArray = relatedIds
      ? relatedIds.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

    const payload = {
      title,
      slug,
      excerpt,
      content,
      author,
      date,
      category,
      read_time: readTime,
      related_ids: relatedArray,
      image: imageUrl || null,
    };

    try {
      if (editBlog) {
        await updateBlog(editBlog.id, payload);
      } else {
        await createBlog(payload);
      }
      resetForm();
      loadBlogs();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save blog. Ensure slug is unique and fields are correct.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this blog?")) {
      try {
        await deleteBlog(id);
        loadBlogs();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete blog");
      }
    }
  };

  const filteredBlogs = blogs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Blogs & News Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Publish, edit, and categorize blog posts, institute highlights, and articles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Article</span>
        </button>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Listing items */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles by title, author, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold border-none focus:outline-none placeholder:text-muted-foreground text-foreground"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* List items */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredBlogs.map((b) => (
                <div key={b.id} className="glass-card p-6 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition hover:shadow-md">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-dark border border-secondary/20">
                        {b.category}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">{b.date}</span>
                    </div>
                    <h3 className="text-base font-black text-foreground">{b.title}</h3>
                    <p className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-relaxed">{b.excerpt}</p>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-1">
                      <div className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>By {b.author}</span>
                      </div>
                      <div>• {b.read_time}</div>
                      <div>• Slug: <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">{b.slug}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <button
                      onClick={() => handleEditClick(b)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Article"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                      title="Delete Article"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form Column */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editBlog ? "Edit Article" : "Create Article"}
              </h3>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Benefits of Technical Learning"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. benefits-of-technical-learning"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Author</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Publish Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Campus">Campus</option>
                    <option value="Admission">Admission</option>
                    <option value="Event Highlights">Event Highlights</option>
                    <option value="Technology">Technology</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Read Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5 min read"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Short Excerpt</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summarized card description for listing boards"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Detailed Content</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Main content body text of the article..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Related Article Slug references (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. admission-guide-2026, campus-life"
                  value={relatedIds}
                  onChange={(e) => setRelatedIds(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FileUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="blogs"
                label="Cover Image"
                placeholder="e.g. /images/blog-learning.jpg"
              />

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/25 px-4 py-3 text-sm transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editBlog ? "Update Article" : "Save Article"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
