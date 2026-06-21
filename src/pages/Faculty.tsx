import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, Mail, Phone } from "lucide-react";
import { getFaculty, createFaculty, updateFaculty, deleteFaculty } from "../services/api";

interface Faculty {
  id: number;
  name: string;
  designation: string;
  department: string;
  qualification: string;
  email: string;
  phone: string;
  specialization?: string[];
  photo?: string;
}

export default function Faculty() {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editFaculty, setEditFaculty] = useState<Faculty | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("computer-science-technology");
  const [qualification, setQualification] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [photo, setPhoto] = useState("");

  const loadFaculty = async () => {
    setLoading(true);
    try {
      const data = await getFaculty();
      setFacultyList(data);
    } catch (err) {
      console.error("Failed to load faculty", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaculty();
  }, []);

  const resetForm = () => {
    setName("");
    setDesignation("");
    setDepartment("computer-science-technology");
    setQualification("");
    setEmail("");
    setPhone("");
    setSpecialization("");
    setPhoto("");
    setEditFaculty(null);
    setShowForm(false);
  };

  const handleEditClick = (fac: Faculty) => {
    setEditFaculty(fac);
    setName(fac.name);
    setDesignation(fac.designation);
    setDepartment(fac.department);
    setQualification(fac.qualification);
    setEmail(fac.email);
    setPhone(fac.phone);
    setSpecialization(fac.specialization ? fac.specialization.join(", ") : "");
    setPhoto(fac.photo || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const specArray = specialization
      ? specialization.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      name,
      designation,
      department,
      qualification,
      email,
      phone,
      specialization: specArray,
      photo: photo || null,
    };

    try {
      if (editFaculty) {
        await updateFaculty(editFaculty.id, payload);
      } else {
        await createFaculty(payload);
      }
      resetForm();
      loadFaculty();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save faculty details. Please verify fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await window.customConfirm("Are you sure you want to delete this faculty member from the directory?")) {
      try {
        await deleteFaculty(id);
        loadFaculty();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete faculty member");
      }
    }
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.designation.toLowerCase().includes(search.toLowerCase()) ||
      f.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Faculty Directory Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Manage profiles of teachers, lecturers, HODs, and administrative staff</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Faculty Profile</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Listing column */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, designation, department..."
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
          ) : filteredFaculty.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No faculty profiles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFaculty.map((f) => (
                <div key={f.id} className="glass-card p-5 border flex flex-col justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      {f.photo && (
                        <img src={f.photo} alt={f.name} className="h-12 w-12 rounded-full object-cover border border-border shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-primary uppercase tracking-wider">{f.designation}</p>
                        <h3 className="text-base font-black text-foreground">{f.name}</h3>
                        <p className="text-xs font-semibold text-muted-foreground -mt-0.5 capitalize">Dept: {f.department.replace(/-/g, " ")}</p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <p className="text-foreground"><span className="text-muted-foreground">Quals:</span> {f.qualification}</p>
                      {f.specialization && f.specialization.length > 0 && (
                        <p className="text-foreground leading-relaxed">
                          <span className="text-muted-foreground">Skills:</span> {f.specialization.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 text-xs font-semibold text-muted-foreground pt-1.5 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{f.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-primary" />
                        <span>{f.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-3 border-border">
                    <button
                      onClick={() => handleEditClick(f)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Profile"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                      title="Delete Profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input form panel */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editFaculty ? "Edit Profile" : "Create Profile"}
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
                <label className="text-xs font-black uppercase text-muted-foreground block">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Md. Rafiqul Islam"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lecturer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Administration">Administration</option>
                    <option value="computer-science-technology">Computer Science (CST)</option>
                    <option value="civil-technology">Civil Technology</option>
                    <option value="electrical-technology">Electrical Technology</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Qualifications</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Sc. in CSE, M.Sc."
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name.dept@cmpi.edu.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Phone Contact</label>
                  <input
                    type="text"
                    required
                    placeholder="+880 1712-345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Specializations (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Database, Surveying, CAD Drawing"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Photo URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/photo.jpg"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <span>{editFaculty ? "Update Profile" : "Save Profile"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
