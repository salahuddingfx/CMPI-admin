import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, BookOpen, Filter } from "lucide-react";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "../services/api";

interface Subject {
  id: number;
  department: string;
  semester: string;
  subject_code: string;
  subject_name: string;
  credit: number;
  technology_code?: string;
  technology_name?: string;
  theory_marks?: number;
  practical_marks?: number;
  total_marks?: number;
}

const departments = ["Civil Technology", "Computer Science & Technology", "Electrical Technology"];
const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const inputCls = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export default function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);

  // Filters
  const [filterDept, setFilterDept] = useState("");
  const [filterSem, setFilterSem] = useState("");

  // Form Fields
  const [department, setDepartment] = useState(departments[0]);
  const [semester, setSemester] = useState("1st");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [credit, setCredit] = useState("");
  const [technologyCode, setTechnologyCode] = useState("");
  const [technologyName, setTechnologyName] = useState("");
  const [theoryMarks, setTheoryMarks] = useState("");
  const [practicalMarks, setPracticalMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("");

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterDept) params.department = filterDept;
      if (filterSem) params.semester = filterSem;
      const data = await getSubjects(Object.keys(params).length ? params : undefined);
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [filterDept, filterSem]);

  const resetForm = () => {
    setDepartment(departments[0]);
    setSemester("1st");
    setSubjectCode("");
    setSubjectName("");
    setCredit("");
    setTechnologyCode("");
    setTechnologyName("");
    setTheoryMarks("");
    setPracticalMarks("");
    setTotalMarks("");
    setEditSubject(null);
    setShowForm(false);
  };

  const handleEditClick = (subj: Subject) => {
    setEditSubject(subj);
    setDepartment(subj.department);
    setSemester(subj.semester);
    setSubjectCode(subj.subject_code);
    setSubjectName(subj.subject_name);
    setCredit(String(subj.credit));
    setTechnologyCode(subj.technology_code || "");
    setTechnologyName(subj.technology_name || "");
    setTheoryMarks(subj.theory_marks != null ? String(subj.theory_marks) : "");
    setPracticalMarks(subj.practical_marks != null ? String(subj.practical_marks) : "");
    setTotalMarks(subj.total_marks != null ? String(subj.total_marks) : "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, any> = {
      department,
      semester,
      subject_code: subjectCode,
      subject_name: subjectName,
      credit: parseFloat(credit),
    };
    if (technologyCode) payload.technology_code = technologyCode;
    if (technologyName) payload.technology_name = technologyName;
    if (theoryMarks) payload.theory_marks = parseInt(theoryMarks);
    if (practicalMarks) payload.practical_marks = parseInt(practicalMarks);
    if (totalMarks) payload.total_marks = parseInt(totalMarks);

    try {
      if (editSubject) {
        await updateSubject(editSubject.id, payload);
      } else {
        await createSubject(payload);
      }
      resetForm();
      loadSubjects();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save subject. Ensure code is unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await window.customConfirm("Are you sure you want to delete this subject?")) {
      try {
        await deleteSubject(id);
        loadSubjects();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete subject");
      }
    }
  };

  const filtered = subjects.filter(
    (s) =>
      s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  // Group by semester for display
  const grouped = filtered.reduce((acc, s) => {
    if (!acc[s.semester]) acc[s.semester] = [];
    acc[s.semester].push(s);
    return acc;
  }, {} as Record<string, Subject[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Subjects Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Manage curriculum subjects for all departments and semesters</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Subject</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Listing column */}
        <div className={`space-y-4 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search + Filters */}
          <div className="glass-card p-4 border space-y-3">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search by name, code, or department..."
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
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                value={filterSem}
                onChange={(e) => setFilterSem(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none"
              >
                <option value="">All Semesters</option>
                {semesters.map((s) => <option key={s} value={s}>{s} Semester</option>)}
              </select>
              {(filterDept || filterSem) && (
                <button onClick={() => { setFilterDept(""); setFilterSem(""); }} className="text-xs text-primary hover:underline font-semibold">
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Subjects List */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-semibold text-muted-foreground">No subjects found.</p>
            </div>
          ) : (
            Object.entries(grouped).sort(([a], [b]) => semesters.indexOf(a) - semesters.indexOf(b)).map(([sem, items]) => (
              <div key={sem} className="glass-card p-5 border space-y-3">
                <h3 className="text-sm font-black text-primary uppercase tracking-wider">{sem} Semester ({items.length} subjects)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                        <th className="text-left py-2 px-2 font-semibold">Code</th>
                        <th className="text-left py-2 px-2 font-semibold">Name</th>
                        <th className="text-left py-2 px-2 font-semibold">Dept</th>
                        <th className="text-center py-2 px-2 font-semibold">Credit</th>
                        <th className="text-center py-2 px-2 font-semibold">Theory</th>
                        <th className="text-center py-2 px-2 font-semibold">Practical</th>
                        <th className="text-right py-2 px-2 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((s) => (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-2 font-mono text-xs font-bold">{s.subject_code}</td>
                          <td className="py-2 px-2 font-semibold text-xs">{s.subject_name}</td>
                          <td className="py-2 px-2 text-xs text-muted-foreground">{s.department}</td>
                          <td className="py-2 px-2 text-center text-xs font-bold">{s.credit}</td>
                          <td className="py-2 px-2 text-center text-xs">{s.theory_marks ?? "—"}</td>
                          <td className="py-2 px-2 text-center text-xs">{s.practical_marks ?? "—"}</td>
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleEditClick(s)} className="p-1 text-muted-foreground hover:text-foreground" title="Edit">
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(s.id)} className="p-1 text-destructive/70 hover:text-destructive" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Panel */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editSubject ? "Edit Subject" : "Create Subject"}
              </h3>
              <button onClick={resetForm} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls}>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Semester</label>
                  <select value={semester} onChange={(e) => setSemester(e.target.value)} className={inputCls}>
                    {semesters.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 26442"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Credit</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="e.g. 3"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Drawing"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Technology Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 264"
                    value={technologyCode}
                    onChange={(e) => setTechnologyCode(e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Technology Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Civil Technology"
                    value={technologyName}
                    onChange={(e) => setTechnologyName(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Theory Marks</label>
                  <input
                    type="number"
                    placeholder="e.g. 60"
                    value={theoryMarks}
                    onChange={(e) => setTheoryMarks(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Practical Marks</label>
                  <input
                    type="number"
                    placeholder="e.g. 40"
                    value={practicalMarks}
                    onChange={(e) => setPracticalMarks(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Total Marks</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/25 px-4 py-3 text-sm transition disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>{editSubject ? "Update Subject" : "Save Subject"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
