import { useState, useEffect } from "react";
import { toast } from "sonner";
import { FileText, Save, RefreshCw, Sparkles } from "lucide-react";
import { getAdminMessages, updateAdminMessage } from "../services/api";
import FileUpload from "../components/FileUpload";

interface MessageProfile {
  id: number;
  key: string;
  name: string;
  title: string;
  subtitle: string | null;
  message: string;
  avatar: string | null;
}

export default function AdminMessages() {
  const [profiles, setProfiles] = useState<MessageProfile[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("principal");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states matching current selection
  const [name, setName] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>("");
  const [avatar, setAvatar] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const loadData = () => {
    setLoading(true);
    getAdminMessages()
      .then((data: MessageProfile[]) => {
        setProfiles(data);
        const initial = data.find((p) => p.key === selectedKey);
        if (initial) {
          syncForm(initial);
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load desk profiles.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const syncForm = (profile: MessageProfile) => {
    setName(profile.name);
    setTitle(profile.title);
    setSubtitle(profile.subtitle ?? "");
    setAvatar(profile.avatar ?? "");
    setMessage(profile.message);
  };

  const handleSelectProfile = (key: string) => {
    setSelectedKey(key);
    const found = profiles.find((p) => p.key === key);
    if (found) {
      syncForm(found);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = profiles.find((p) => p.key === selectedKey);
    if (!found) return;

    setSaving(true);
    try {
      await updateAdminMessage(found.id, {
        name,
        title,
        subtitle: subtitle || null,
        message,
        avatar: avatar || null,
      });
      toast.success("Profile updated successfully!");
      
      // Update local state
      setProfiles((prev) =>
        prev.map((p) =>
          p.key === selectedKey
            ? { ...p, name, title, subtitle: subtitle || null, message, avatar: avatar || null }
            : p
        )
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const activeProfile = profiles.find((p) => p.key === selectedKey);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" /> Desk Messages Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure dynamic messages from the Founder &amp; Chairman, Governing Council, and the Principal.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted transition"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Reload
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[260px_1fr]">
          {/* Tab Selector List */}
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Desk Profiles</p>
            {profiles.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectProfile(p.key)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                  selectedKey === p.key
                    ? "bg-primary text-white border-primary shadow-md font-bold"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="h-10 w-10 overflow-hidden rounded-full border bg-muted flex-shrink-0">
                  <img
                    src={p.avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + p.key}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate leading-tight">{p.name}</p>
                  <p className={`text-[10px] truncate mt-0.5 ${selectedKey === p.key ? "text-white/70" : "text-muted-foreground"}`}>{p.title}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Form and Preview Layout */}
          {activeProfile && (
            <div className="space-y-6">
              <form onSubmit={handleSave} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-3 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-extrabold text-lg text-foreground">Edit Profile — {activeProfile.name}</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Official Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Subtitle (Department or Board detail)</label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="e.g. Governing Council, CMPI"
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <FileUpload
                      value={avatar}
                      onChange={setAvatar}
                      folder="avatars"
                      label="Avatar Image"
                      placeholder="e.g. /principal.png or upload image"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Desk Message (Quotes)</label>
                    <textarea
                      required
                      rows={8}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 whitespace-pre-wrap leading-relaxed"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/95 transition disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>

              {/* Live Preview */}
              <div className="rounded-2xl border bg-muted/30 p-6 space-y-4">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Live Client-Side Preview</p>
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20">
                      <img
                        src={avatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=" + activeProfile.key}
                        alt="Preview Avatar"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <h4 className="font-extrabold text-base text-foreground">{name || "Name Placeholder"}</h4>
                    <p className="text-xs text-muted-foreground">{title || "Title Placeholder"}</p>
                    {subtitle && <p className="text-[10px] text-muted-foreground/60">{subtitle}</p>}
                  </div>
                  <blockquote className="border-l-4 border-primary/30 pl-3 text-xs italic text-muted-foreground leading-relaxed whitespace-pre-line">
                    {message || "No message content."}
                  </blockquote>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
