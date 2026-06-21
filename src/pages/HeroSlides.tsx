import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, Loader2, GripVertical, Eye, EyeOff, Image } from "lucide-react";
import { getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide } from "../services/api";
import FileUpload from "../components/FileUpload";

interface HeroSlide {
  id: number;
  eyebrow: string;
  title: string;
  description: string;
  image: string | null;
  cta_label: string | null;
  cta_href: string | null;
  secondary_label: string | null;
  secondary_href: string | null;
  panel_title: string | null;
  panel_description: string | null;
  stats: { value: string; label: string }[] | null;
  sort_order: number;
  is_active: boolean;
}

export default function HeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eyebrow, setEyebrow] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const [secondaryLabel, setSecondaryLabel] = useState("");
  const [secondaryHref, setSecondaryHref] = useState("");
  const [panelTitle, setPanelTitle] = useState("");
  const [panelDescription, setPanelDescription] = useState("");
  const [stats, setStats] = useState<{ value: string; label: string }[]>([
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ]);
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await getHeroSlides();
      setSlides(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSlides(); }, []);

  const resetForm = () => {
    setEyebrow(""); setTitle(""); setDescription(""); setImage("");
    setCtaLabel(""); setCtaHref(""); setSecondaryLabel(""); setSecondaryHref("");
    setPanelTitle(""); setPanelDescription("");
    setStats([{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }]);
    setSortOrder(0); setIsActive(true);
    setEditing(null); setShowForm(false);
  };

  const startEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setEyebrow(slide.eyebrow);
    setTitle(slide.title);
    setDescription(slide.description);
    setImage(slide.image || "");
    setCtaLabel(slide.cta_label || "");
    setCtaHref(slide.cta_href || "");
    setSecondaryLabel(slide.secondary_label || "");
    setSecondaryHref(slide.secondary_href || "");
    setPanelTitle(slide.panel_title || "");
    setPanelDescription(slide.panel_description || "");
    setStats(slide.stats || [{ value: "", label: "" }, { value: "", label: "" }, { value: "", label: "" }]);
    setSortOrder(slide.sort_order);
    setIsActive(slide.is_active);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      eyebrow, title, description, image: image || null,
      cta_label: ctaLabel || null, cta_href: ctaHref || null,
      secondary_label: secondaryLabel || null, secondary_href: secondaryHref || null,
      panel_title: panelTitle || null, panel_description: panelDescription || null,
      stats: stats.filter(s => s.value && s.label),
      sort_order: sortOrder, is_active: isActive,
    };
    try {
      if (editing) {
        await updateHeroSlide(editing.id, payload);
      } else {
        await createHeroSlide(payload);
      }
      resetForm();
      await fetchSlides();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this slide?")) return;
    try {
      await deleteHeroSlide(id);
      await fetchSlides();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStat = (index: number, field: "value" | "label", val: string) => {
    const next = [...stats];
    next[index] = { ...next[index], [field]: val };
    setStats(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Hero Slides</h1>
          <p className="text-sm text-muted-foreground font-semibold">Manage homepage hero slider content, images, and call-to-actions</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/20 px-5 py-2.5 text-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Add Slide
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card p-6 border space-y-5">
          <h3 className="text-lg font-black text-foreground border-b border-border pb-4">
            {editing ? "Edit Slide" : "New Slide"}
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Eyebrow Tag</label>
              <input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} required
                placeholder="e.g. Admission 2026-2027"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="Main hero heading"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
              placeholder="Supporting paragraph below the title"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <FileUpload
            value={image}
            onChange={setImage}
            folder="gallery"
            label="Background Image"
            placeholder="Background image for the slide (optional)"
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Primary CTA Label</label>
              <input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. Apply Now"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Primary CTA Link</label>
              <input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)}
                placeholder="e.g. /admission"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Secondary CTA Label</label>
              <input value={secondaryLabel} onChange={(e) => setSecondaryLabel(e.target.value)}
                placeholder="e.g. Explore Academics"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Secondary CTA Link</label>
              <input value={secondaryHref} onChange={(e) => setSecondaryHref(e.target.value)}
                placeholder="e.g. /academics"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Side Panel Title</label>
              <input value={panelTitle} onChange={(e) => setPanelTitle(e.target.value)}
                placeholder="e.g. Admission session 2026-2027"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-muted-foreground block">Side Panel Description</label>
              <textarea value={panelDescription} onChange={(e) => setPanelDescription(e.target.value)} rows={2}
                placeholder="Details shown in the floating side panel"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase text-muted-foreground block">Stats (up to 3)</label>
            {stats.map((stat, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)}
                  placeholder={`Stat ${i + 1} value (e.g. 450+)`}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)}
                  placeholder={`Stat ${i + 1} label (e.g. Seat Capacity)`}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
              <span className="text-sm font-semibold">Active</span>
            </label>
          </div>

          <div className="flex gap-3 border-t border-border pt-5">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/25 px-5 py-2.5 text-sm transition disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? "Update Slide" : "Save Slide"}
            </button>
            <button type="button" onClick={resetForm}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted transition">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : slides.length === 0 ? (
        <div className="glass-card p-10 border text-center">
          <Image className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="font-bold text-foreground">No hero slides yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click "Add Slide" to create your first hero slide.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <div key={slide.id} className="glass-card border p-5 flex items-center gap-4">
              {slide.image ? (
                <img src={slide.image} alt="" className="h-16 w-24 rounded-lg object-cover border" />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-muted/60 border flex items-center justify-center">
                  <Image className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] font-black text-muted-foreground">#{slide.sort_order}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${slide.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {slide.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-primary font-bold mt-1">{slide.eyebrow}</p>
                <p className="text-sm font-black text-foreground truncate">{slide.title}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(slide)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Edit">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(slide.id)} className="rounded-lg p-2 text-destructive hover:bg-destructive/10 transition" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
