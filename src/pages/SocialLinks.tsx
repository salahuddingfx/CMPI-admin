import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, X, ExternalLink } from "lucide-react";
import { getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink } from "../services/api";

interface SocialLink {
  id: number;
  platform: string;
  url: string;
  is_active: boolean;
  sort_order: number;
}

const PLATFORMS = [
  "Facebook", "YouTube", "Instagram", "LinkedIn", "Twitter",
  "GitHub", "TikTok", "WhatsApp", "Telegram", "Website",
];

export default function SocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editLink, setEditLink] = useState<SocialLink | null>(null);

  const [platform, setPlatform] = useState("Facebook");
  const [url, setUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await getSocialLinks();
      setLinks(data);
    } catch (err) {
      console.error("Failed to load social links", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const resetForm = () => {
    setPlatform("Facebook");
    setUrl("");
    setIsActive(true);
    setSortOrder(0);
    setEditLink(null);
    setShowForm(false);
  };

  const handleEditClick = (link: SocialLink) => {
    setEditLink(link);
    setPlatform(link.platform);
    setUrl(link.url);
    setIsActive(link.is_active);
    setSortOrder(link.sort_order);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { platform, url, is_active: isActive, sort_order: sortOrder };

    try {
      if (editLink) {
        await updateSocialLink(editLink.id, payload);
      } else {
        await createSocialLink(payload);
      }
      resetForm();
      loadLinks();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save. Check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await window.customConfirm("Delete this social link?")) {
      try {
        await deleteSocialLink(id);
        loadLinks();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Social Links</h1>
          <p className="text-sm text-muted-foreground font-semibold">Manage social media links shown on the website footer</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>Add Link</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <div className={`space-y-4 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No social links yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="glass-card p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/20 shrink-0">
                      {link.platform}
                    </span>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground truncate hover:text-primary transition"
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      link.is_active
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}>
                      {link.is_active ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">#{link.sort_order}</span>
                    <button
                      onClick={() => handleEditClick(link)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2 text-muted-foreground hover:text-foreground transition"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2 text-destructive transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showForm && (
          <div className="glass-card p-6 border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editLink ? "Edit Link" : "Add Link"}
              </h3>
              <button onClick={resetForm} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://facebook.com/yourpage"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Status</label>
                  <select
                    value={isActive ? "1" : "0"}
                    onChange={(e) => setIsActive(e.target.value === "1")}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/25 px-4 py-3 text-sm transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{editLink ? "Update" : "Save"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
