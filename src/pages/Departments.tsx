import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, Layers } from "lucide-react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../services/api";

interface Department {
  id: number;
  slug: string;
  title: string;
  short_title: string;
  description: string;
  overview: string;
  objectives?: string[];
  labs?: string[];
  achievements?: string[];
  career_opportunities?: string[];
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortTitle, setShortTitle] = useState("");
  const [description, setDescription] = useState("");
  const [overview, setOverview] = useState("");
  const [objectives, setObjectives] = useState(""); // newline separated
  const [labs, setLabs] = useState(""); // newline separated
  const [achievements, setAchievements] = useState(""); // newline separated
  const [careerOpportunities, setCareerOpportunities] = useState(""); // newline separated

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editDept) {
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
    setShortTitle("");
    setDescription("");
    setOverview("");
    setObjectives("");
    setLabs("");
    setAchievements("");
    setCareerOpportunities("");
    setEditDept(null);
    setShowForm(false);
  };

  const handleEditClick = (dept: Department) => {
    setEditDept(dept);
    setTitle(dept.title);
    setSlug(dept.slug);
    setShortTitle(dept.short_title);
    setDescription(dept.description);
    setOverview(dept.overview);
    setObjectives(dept.objectives ? dept.objectives.join("\n") : "");
    setLabs(dept.labs ? dept.labs.join("\n") : "");
    setAchievements(dept.achievements ? dept.achievements.join("\n") : "");
    setCareerOpportunities(dept.career_opportunities ? dept.career_opportunities.join("\n") : "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const parseLines = (text: string) =>
      text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload = {
      title,
      slug,
      short_title: shortTitle,
      description,
      overview,
      objectives: parseLines(objectives),
      labs: parseLines(labs),
      achievements: parseLines(achievements),
      career_opportunities: parseLines(careerOpportunities),
    };

    try {
      if (editDept) {
        await updateDepartment(editDept.id, payload);
      } else {
        await createDepartment(payload);
      }
      resetForm();
      loadDepartments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save department. Ensure slug is unique and fields are valid.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this department? All associated listings may be affected.")) {
      try {
        await deleteDepartment(id);
        loadDepartments();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete department");
      }
    }
  };

  const filteredDepts = departments.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.short_title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Academic Departments Editor</h1>
          <p className="text-sm text-muted-foreground font-semibold">Configure curriculum guidelines, lab workshops, and key metrics for diploma tech programs</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Department</span>
        </button>
      </div>

      {/* Split display */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Listing column */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by technology name or code..."
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

          {/* List display */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No departments found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDepts.map((d) => (
                <div key={d.id} className="glass-card p-6 border flex flex-col justify-between gap-4 transition hover:shadow-md">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-flex rounded-full bg-secondary/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-dark border border-secondary/20">
                          {d.short_title}
                        </span>
                        <h3 className="text-base font-black text-foreground mt-1">{d.title}</h3>
                        <p className="text-xs text-muted-foreground font-mono">Slug: {d.slug}</p>
                      </div>
                      <Layers className="h-6 w-6 text-primary shrink-0 opacity-80" />
                    </div>

                    <p className="text-xs font-semibold text-muted-foreground leading-relaxed line-clamp-3">{d.description}</p>

                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-border">
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Laboratories</p>
                        <p className="text-foreground mt-1">{d.labs?.length || 0} labs registered</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase text-[10px] font-black tracking-wider">Objectives</p>
                        <p className="text-foreground mt-1">{d.objectives?.length || 0} targets outlined</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-3 border-border">
                    <button
                      onClick={() => handleEditClick(d)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Department"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                      title="Delete Department"
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
          <div className="glass-card p-6 border space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editDept ? "Edit Department" : "Create Department"}
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
                <label className="text-xs font-black uppercase text-muted-foreground block">Technology Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Civil Technology"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Short Title Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CST"
                    value={shortTitle}
                    onChange={(e) => setShortTitle(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. civil-technology"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Technology Summary Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short description summarizing the tech program"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Program Overview</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Comprehensive program details, semester structures, and focus areas..."
                  value={overview}
                  onChange={(e) => setOverview(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Program Objectives (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Understand computer system architecture&#10;Implement relational database networks"
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Registered Laboratories (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Programming Lab 1&#10;Computer Hardware Studio"
                  value={labs}
                  onChange={(e) => setLabs(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Key Achievements (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Runner up at cox's regional tech fair&#10;100% internship placements for CST candidates"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Career Opportunities (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Junior Software Engineer&#10;Network Administrator Associate"
                  value={careerOpportunities}
                  onChange={(e) => setCareerOpportunities(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                />
              </div>

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
                <span>{editDept ? "Update Department" : "Save Department"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
