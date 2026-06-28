import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Upload, Trash2, Download, Loader2, CheckCircle, AlertTriangle, Edit2, Save } from "lucide-react";
import {
  getClassRoutines,
  uploadClassRoutine,
  deleteClassRoutine,
  updateClassRoutine,
} from "../services/api";

const departments = [
  "Computer Science & Technology",
  "Civil Technology",
  "Electrical Technology",
];

const allSemesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "all"];

interface Routine {
  id: number;
  department: string;
  semester: string;
  academic_year: string;
  title: string;
  pdf_path: string;
  original_name: string;
  created_at: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function ClassRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [dept, setDept] = useState(departments[0]);
  const [semester, setSemester] = useState("1st");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString().slice(-2));
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Edit state
  const [editRoutine, setEditRoutine] = useState<Routine | null>(null);
  const [editDept, setEditDept] = useState(departments[0]);
  const [editSemester, setEditSemester] = useState("1st");
  const [editAcademicYear, setEditAcademicYear] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const editFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadRoutines();
  }, []);

  async function loadRoutines() {
    setLoading(true);
    try {
      const data = await getClassRoutines();
      setRoutines(data);
    } catch {}
    setLoading(false);
  }

  async function handleUpload() {
    if (!pdfFile || !title) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      fd.append("department", dept);
      fd.append("semester", semester);
      fd.append("academic_year", academicYear);
      fd.append("title", title);
      await uploadClassRoutine(fd);
      setSuccess(`Routine uploaded: ${title}`);
      setPdfFile(null);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      loadRoutines();
    } catch (e: any) {
      setError(e.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this routine?")) return;
    try {
      await deleteClassRoutine(id);
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  }

  function handleEditStart(routine: Routine) {
    setEditRoutine(routine);
    setEditDept(routine.department);
    setEditSemester(routine.semester);
    setEditAcademicYear(routine.academic_year);
    setEditTitle(routine.title);
    setEditPdfFile(null);
  }

  async function handleEditSave() {
    if (!editRoutine || !editTitle) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append("department", editDept);
      fd.append("semester", editSemester);
      fd.append("academic_year", editAcademicYear);
      fd.append("title", editTitle);
      if (editPdfFile) fd.append("pdf", editPdfFile);
      await updateClassRoutine(editRoutine.id, fd);
      setSuccess(`Routine updated: ${editTitle}`);
      setEditRoutine(null);
      loadRoutines();
    } catch (e: any) {
      setError(e.response?.data?.error || "Update failed");
    } finally {
      setUploading(false);
    }
  }

  function handleEditCancel() {
    setEditRoutine(null);
    setEditPdfFile(null);
  }

  function getDownloadUrl(routine: Routine) {
    return `${API_BASE}/class-routines/${routine.id}/download`;
  }

  const grouped = routines.reduce((acc, r) => {
    const key = r.department;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, Routine[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Class Routines</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload and manage class routine PDFs for each department and semester</p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-lg p-3 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Upload Form */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Upload New Routine</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium mb-1">Department</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full">
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full">
              {allSemesters.map((s) => <option key={s} value={s}>{s === "all" ? "All Semesters" : s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Academic Year</label>
            <input type="text" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full" placeholder="2025-26" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full" placeholder="e.g. Spring 2026 Routine" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <input ref={fileRef} type="file" accept=".pdf" onChange={(e: ChangeEvent<HTMLInputElement>) => setPdfFile(e.target.files?.[0] || null)} className="text-xs text-muted-foreground font-semibold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-all duration-150" />
          <button onClick={handleUpload} disabled={!pdfFile || !title || uploading} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload PDF
          </button>
        </div>
      </div>

      {/* Existing Routines */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : routines.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No routines uploaded yet.</div>
        ) : (
          Object.entries(grouped).map(([department, items]) => (
            <div key={department} className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">{department}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium">Title</th>
                      <th className="text-left py-2 px-3 font-medium">Semester</th>
                      <th className="text-left py-2 px-3 font-medium">Year</th>
                      <th className="text-left py-2 px-3 font-medium">File</th>
                      <th className="text-left py-2 px-3 font-medium">Uploaded</th>
                      <th className="text-right py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      editRoutine?.id === r.id ? (
                        <tr key={r.id} className="border-b border-border/50 bg-muted/30">
                          <td className="py-2 px-3">
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs w-full" />
                          </td>
                          <td className="py-2 px-3">
                            <select value={editSemester} onChange={(e) => setEditSemester(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs w-full">
                              {allSemesters.map((s) => <option key={s} value={s}>{s === "all" ? "All Semesters" : s}</option>)}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input type="text" value={editAcademicYear} onChange={(e) => setEditAcademicYear(e.target.value)} className="bg-background border border-border rounded px-2 py-1 text-xs w-full" />
                          </td>
                          <td className="py-2 px-3">
                            <input ref={editFileRef} type="file" accept=".pdf" onChange={(e: ChangeEvent<HTMLInputElement>) => setEditPdfFile(e.target.files?.[0] || null)} className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary" />
                          </td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{editPdfFile ? editPdfFile.name : "Keep current"}</td>
                          <td className="py-2 px-3 text-right space-x-2">
                            <button onClick={handleEditSave} disabled={uploading} className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-xs font-medium">
                              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                            </button>
                            <button onClick={handleEditCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                          <td className="py-2 px-3 font-medium">{r.title}</td>
                          <td className="py-2 px-3">{r.semester === "all" ? "All" : r.semester}</td>
                          <td className="py-2 px-3">{r.academic_year}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{r.original_name}</td>
                          <td className="py-2 px-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-right space-x-2">
                            <a href={getDownloadUrl(r)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                              <Download className="w-3 h-3" /> View
                            </a>
                            <button onClick={() => handleEditStart(r)} className="text-muted-foreground hover:text-foreground" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="text-destructive/70 hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
