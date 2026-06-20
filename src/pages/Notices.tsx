import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, FileText } from "lucide-react";
import { getNotices, createNotice, updateNotice, deleteNotice } from "../services/api";
import FileUpload from "../components/FileUpload";

interface Notice {
  id: number;
  title: string;
  category: string;
  date: string;
  summary: string;
  details: string;
  file_url?: string;
  image?: string;
}

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editNotice, setEditNotice] = useState<Notice | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadNotices = async () => {
    setLoading(true);
    try {
      const data = await getNotices();
      setNotices(data);
    } catch (err) {
      console.error("Failed to load notices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCategory("Academic");
    setDate(new Date().toISOString().split("T")[0]);
    setSummary("");
    setDetails("");
    setFileUrl("");
    setImageUrl("");
    setEditNotice(null);
    setShowForm(false);
  };

  const handleEditClick = (notice: Notice) => {
    setEditNotice(notice);
    setTitle(notice.title);
    setCategory(notice.category);
    setDate(notice.date ? notice.date.split("T")[0] : "");
    setSummary(notice.summary);
    setDetails(notice.details);
    setFileUrl(notice.file_url || "");
    setImageUrl(notice.image || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      category,
      date,
      summary,
      details,
      file_url: fileUrl || null,
      image: imageUrl || null,
    };

    try {
      if (editNotice) {
        await updateNotice(editNotice.id, payload);
      } else {
        await createNotice(payload);
      }
      resetForm();
      loadNotices();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save notice. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this notice? This action cannot be undone.")) {
      try {
        await deleteNotice(id);
        loadNotices();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete notice");
      }
    }
  };

  const filteredNotices = notices.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Notice Board Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Publish administrative, examination, holiday and academic notices</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Notice</span>
        </button>
      </div>

      {/* Main Grid split layout if Form is visible, else full search list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Notices list column */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title or category..."
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

          {/* Table / List */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No notices found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredNotices.map((n) => (
                <div key={n.id} className="glass-card p-6 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition hover:shadow-md">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-dark border border-secondary/20">
                        {n.category}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">{n.date}</span>
                    </div>
                    <h3 className="text-base font-black text-foreground">{n.title}</h3>
                    <p className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-relaxed">{n.summary}</p>
                    {n.file_url && (
                      <a
                        href={n.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mt-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Attached Document</span>
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <button
                      onClick={() => handleEditClick(n)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Notice"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                      title="Delete Notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notices form column */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editNotice ? "Edit Notice" : "Create Notice"}
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
                <label className="text-xs font-black uppercase text-muted-foreground block">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mid-term Exam Schedule"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Admission">Admission</option>
                    <option value="Exam">Exam</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Tender">Tender</option>
                    <option value="General">General</option>
                  </select>
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

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Notice Summary</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief one-line summary for student portal lists"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Detailed Content</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Main announcement details and notices text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FileUpload
                value={fileUrl}
                onChange={setFileUrl}
                folder="notices"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                label="Document Attachment"
                placeholder="e.g. /notices/schedule.pdf"
              />

              <FileUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="notices"
                label="Banner Image"
                placeholder="e.g. /images/notice-banner.jpg"
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
                <span>{editNotice ? "Update Notice" : "Save Notice"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
