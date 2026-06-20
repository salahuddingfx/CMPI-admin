import React, { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { getInstitute, updateInstitute } from "../services/api";
import FileUpload from "../components/FileUpload";

export default function SiteSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [eiin, setEiin] = useState("");
  const [established, setEstablished] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    getInstitute()
      .then((data) => {
        setName(data.name || "");
        setShortName(data.short_name || "");
        setTagline(data.tagline || "");
        setAddress(data.address || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setWebsite(data.website || "");
        setEiin(data.eiin || "");
        setEstablished(data.established || "");
        setLogo(data.logo || "");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateInstitute({
        name, short_name: shortName, tagline, address,
        phone, email, website, eiin, established, logo,
      });
      alert("Settings saved successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Site Settings</h1>
        <p className="text-sm text-muted-foreground font-semibold">Manage institute information displayed across the website</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 border space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Institute Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Short Name</label>
            <input type="text" required value={shortName} onChange={(e) => setShortName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-muted-foreground block">Tagline</label>
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-muted-foreground block">Address</label>
          <textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Phone</label>
            <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Website</label>
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">EIIN</label>
            <input type="text" value={eiin} onChange={(e) => setEiin(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase text-muted-foreground block">Established</label>
            <input type="text" value={established} onChange={(e) => setEstablished(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <FileUpload
          value={logo}
          onChange={setLogo}
          folder="others"
          label="Institute Logo"
          placeholder="/CMPI.png"
        />

        <button type="submit" disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/25 px-6 py-3 text-sm transition disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Save Settings</span>
        </button>
      </form>
    </div>
  );
}
