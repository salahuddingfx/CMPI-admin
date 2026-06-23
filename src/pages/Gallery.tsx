import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Image, Loader2, Save, Upload, Link } from "lucide-react";
import { getGalleryAlbums, getGalleryAlbum, createGalleryAlbum, updateGalleryAlbum, deleteGalleryAlbum, uploadGalleryImages, deleteGalleryImage } from "../services/api";
import FileUpload from "../components/FileUpload";

interface GalleryAlbum {
  id: number;
  title: string;
  description: string;
  accent: string;
  cover: string | null;
  count: number;
  images: GalleryImage[];
  created_at: string;
}

interface GalleryImage {
  id: number;
  url: string;
  caption: string | null;
}

export default function Gallery() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<GalleryAlbum | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [form, setForm] = useState({ title: "", description: "", accent: "#3b82f6", cover: "" });
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  async function loadAlbums() {
    setLoading(true);
    try {
      const data = await getGalleryAlbums();
      setAlbums(data);
    } catch (err) {
      console.error("Failed to load albums", err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingAlbum(null);
    setForm({ title: "", description: "", accent: "#3b82f6", cover: "" });
    setShowForm(true);
  }

  function openEdit(album: GalleryAlbum) {
    setEditingAlbum(album);
    setForm({ title: album.title, description: album.description, accent: album.accent, cover: album.cover || "" });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingAlbum) {
        await updateGalleryAlbum(editingAlbum.id, form);
      } else {
        await createGalleryAlbum(form);
      }
      setShowForm(false);
      loadAlbums();
    } catch (err) {
      console.error("Failed to save album", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(album: GalleryAlbum) {
    if (!confirm(`Delete album "${album.title}"?`)) return;
    try {
      await deleteGalleryAlbum(album.id);
      if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
      loadAlbums();
    } catch (err) {
      console.error("Failed to delete album", err);
    }
  }

  function openAlbum(album: GalleryAlbum) {
    setSelectedAlbum(album);
    setImageUrls([]);
  }

  function addImageUrl(url: string) {
    setImageUrls((prev) => [...prev, url]);
  }

  function removeImageUrl(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSaveImages() {
    if (!selectedAlbum || imageUrls.length === 0) return;
    setUploadingImages(true);
    try {
      await uploadGalleryImages(selectedAlbum.id, { images: imageUrls });
      setImageUrls([]);
      const updated = await getGalleryAlbum(selectedAlbum.id);
      setSelectedAlbum(updated);
      loadAlbums();
    } catch (err) {
      console.error("Failed to upload images", err);
    } finally {
      setUploadingImages(false);
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!selectedAlbum || !confirm("Delete this image?")) return;
    try {
      await deleteGalleryImage(selectedAlbum.id, imageId);
      const updated = await getGalleryAlbum(selectedAlbum.id);
      setSelectedAlbum(updated);
      loadAlbums();
    } catch (err) {
      console.error("Failed to delete image", err);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Gallery Albums</h1>
          <p className="text-sm text-muted-foreground">Manage photo albums and images</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition">
          <Plus className="h-4 w-4" /> New Album
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">{editingAlbum ? "Edit Album" : "New Album"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground transition"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Album title" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="Short description" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Accent Color</label>
                <input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} className="h-10 w-full rounded-xl border border-border bg-background cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">Cover Image</label>
                <FileUpload value={form.cover} onChange={(url) => setForm({ ...form, cover: url })} folder="gallery" label="Upload Cover" />
              </div>
              <button onClick={handleSave} disabled={!form.title.trim() || saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingAlbum ? "Update Album" : "Create Album"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedAlbum(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">{selectedAlbum.title}</h2>
              <button onClick={() => setSelectedAlbum(null)} className="text-muted-foreground hover:text-foreground transition"><X className="h-5 w-5" /></button>
            </div>

            <div className="mb-4 space-y-3 rounded-xl bg-muted/40 p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground">Add Images</p>

              <FileUpload value="" onChange={addImageUrl} folder="gallery" label="Upload Image File" />

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste image URL and click Add"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      addImageUrl(e.currentTarget.value.trim());
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input?.value?.trim()) {
                      addImageUrl(input.value.trim());
                      input.value = "";
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition"
                >
                  <Link className="h-3 w-3" /> Add
                </button>
              </div>

              {imageUrls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-background border border-border px-3 py-1.5 text-xs font-medium">
                        <span className="text-muted-foreground truncate max-w-[200px]">{url.split("/").pop()}</span>
                        <button onClick={() => removeImageUrl(i)} className="text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSaveImages} disabled={uploadingImages} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50 transition">
                    {uploadingImages ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Save {imageUrls.length} Image{imageUrls.length > 1 ? "s" : ""}
                  </button>
                </div>
              )}
            </div>

            {selectedAlbum.images.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No images in this album yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedAlbum.images.map((img) => (
                  <div key={img.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted">
                    <img src={img.url} alt={img.caption || ""} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition flex items-center justify-between">
                      {img.caption && <p className="text-xs text-white truncate">{img.caption}</p>}
                      <button onClick={() => handleDeleteImage(img.id)} className="ml-auto rounded-lg bg-destructive/80 p-1 text-white hover:bg-destructive transition">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12">
          <Image className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No gallery albums yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create your first album to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <div key={album.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md cursor-pointer" onClick={() => openAlbum(album)}>
              <div className="aspect-video w-full overflow-hidden bg-muted" style={{ backgroundColor: album.accent + "20" }}>
                {album.cover ? (
                  <img src={album.cover} alt={album.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Image className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: album.accent }} />
                  <h3 className="text-sm font-black text-foreground truncate">{album.title}</h3>
                </div>
                {album.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{album.description}</p>}
                <p className="text-[10px] font-semibold text-muted-foreground">{album.count} image{album.count !== 1 ? "s" : ""}</p>
              </div>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onClick={(e) => { e.stopPropagation(); openEdit(album); }} className="rounded-lg bg-background/80 p-1.5 text-muted-foreground hover:text-foreground backdrop-blur-sm border border-border/50">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(album); }} className="rounded-lg bg-destructive/80 p-1.5 text-white hover:bg-destructive backdrop-blur-sm border border-border/50">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
