import { useState } from "react";
import { Loader2, Download, FileText, Users, BarChart3 } from "lucide-react";
import { api } from "../services/api";

const DEPARTMENTS = [
  "Computer Science & Technology",
  "Electrical & Electronic Engineering",
  "Civil Engineering",
  "Marine Technology",
  "Electronics",
  "Telecommunication",
  "Mechanical Engineering",
];
const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

const inputCls = "bg-background border border-border rounded-lg px-3 py-2 text-sm w-full";
const btnCls = "flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50";

export default function Reports() {
  const [tab, setTab] = useState<"dept" | "student">("dept");

  // Dept report
  const [dept, setDept] = useState("");
  const [semester, setSemester] = useState("");
  const [deptLoading, setDeptLoading] = useState(false);
  const [deptData, setDeptData] = useState<any>(null);

  // Student transcript
  const [roll, setRoll] = useState("");
  const [stuLoading, setStuLoading] = useState(false);
  const [stuData, setStuData] = useState<any>(null);

  async function loadDeptReport() {
    if (!dept || !semester) return;
    setDeptLoading(true);
    try {
      const res = await api.get("/reports/department-result", { params: { department: dept, semester } });
      setDeptData(res.data);
    } catch {}
    setDeptLoading(false);
  }

  async function downloadDeptReport() {
    if (!dept || !semester) return;
    window.open(`${api.defaults.baseURL}/reports/department-result/download?department=${encodeURIComponent(dept)}&semester=${semester}`, "_blank");
  }

  async function loadStudentTranscript() {
    if (!roll) return;
    setStuLoading(true);
    try {
      const res = await api.get(`/reports/student-transcript/${roll}`);
      setStuData(res.data);
    } catch { setStuData(null); }
    setStuLoading(false);
  }

  async function downloadStudentTranscript() {
    if (!roll) return;
    window.open(`${api.defaults.baseURL}/reports/student-transcript/${roll}/download`, "_blank");
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Report Generation</h1>
        <p className="text-sm text-muted-foreground">Generate and download PDF reports for departments and students.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab("dept")} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === "dept" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          <BarChart3 className="h-4 w-4 inline mr-1" /> Department Report
        </button>
        <button onClick={() => setTab("student")} className={`px-4 py-2 text-sm rounded-lg font-medium ${tab === "student" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
          <FileText className="h-4 w-4 inline mr-1" /> Student Transcript
        </button>
      </div>

      {/* Department Report */}
      {tab === "dept" && (
        <div className="space-y-4">
          <div className="rounded-sm border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold">Department Result Report</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Department *</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputCls}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Semester *</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className={inputCls}>
                  <option value="">Select Semester</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={loadDeptReport} disabled={!dept || !semester || deptLoading} className={btnCls}>
                  {deptLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {deptLoading ? "Loading..." : "View Data"}
                </button>
                <button onClick={downloadDeptReport} disabled={!dept || !semester} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>

          {deptData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold">{deptData.total_students}</div>
                  <div className="text-xs text-muted-foreground">Total Students</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{deptData.pass_count}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{deptData.fail_count}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold">{deptData.avg_gpa}</div>
                  <div className="text-xs text-muted-foreground">Average GPA</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold">{deptData.pass_rate}%</div>
                  <div className="text-xs text-muted-foreground">Pass Rate</div>
                </div>
              </div>

              {deptData.results && deptData.results.length > 0 && (
                <div className="rounded-sm border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase">
                      <tr>
                        <th className="p-3 text-left">#</th>
                        <th className="p-3 text-left">Roll</th>
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Regulation</th>
                        <th className="p-3 text-right">GPA</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptData.results.map((r: any, i: number) => (
                        <tr key={r.id || i} className="border-t hover:bg-muted/30">
                          <td className="p-3">{i + 1}</td>
                          <td className="p-3 font-mono text-xs">{r.roll}</td>
                          <td className="p-3">{r.name || '—'}</td>
                          <td className="p-3 text-xs">{r.regulation || '—'}</td>
                          <td className="p-3 text-right font-bold">{r.gpa ? Number(r.gpa).toFixed(2) : '—'}</td>
                          <td className="p-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.gpa >= 2.00 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {r.gpa >= 2.00 ? "PASS" : "FAIL"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Student Transcript */}
      {tab === "student" && (
        <div className="space-y-4">
          <div className="rounded-sm border bg-card p-6 space-y-4">
            <h3 className="text-sm font-bold">Student Academic Transcript</h3>
            <div className="flex gap-4 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-semibold">Roll Number *</label>
                <input placeholder="Enter roll number" value={roll} onChange={(e) => setRoll(e.target.value)} className={inputCls} />
              </div>
              <button onClick={loadStudentTranscript} disabled={!roll || stuLoading} className={btnCls}>
                {stuLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {stuLoading ? "Loading..." : "View Transcript"}
              </button>
              <button onClick={downloadStudentTranscript} disabled={!roll} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          </div>

          {stuData && (
            <div className="space-y-4">
              {stuData.student && (
                <div className="rounded-sm border bg-card p-6">
                  <h3 className="text-sm font-bold mb-3">Student Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Name:</span> <strong>{stuData.student.name}</strong></div>
                    <div><span className="text-muted-foreground">ID:</span> <strong>{stuData.student.student_id}</strong></div>
                    <div><span className="text-muted-foreground">Department:</span> <strong>{stuData.student.department}</strong></div>
                    <div><span className="text-muted-foreground">Session:</span> <strong>{stuData.student.session}</strong></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold">{stuData.total_semesters}</div>
                  <div className="text-xs text-muted-foreground">Semesters</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold">{stuData.avg_gpa}</div>
                  <div className="text-xs text-muted-foreground">Average GPA</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{stuData.highest_gpa}</div>
                  <div className="text-xs text-muted-foreground">Highest GPA</div>
                </div>
                <div className="rounded-sm border bg-card p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{stuData.lowest_gpa}</div>
                  <div className="text-xs text-muted-foreground">Lowest GPA</div>
                </div>
              </div>

              {stuData.results && stuData.results.length > 0 && (
                <div className="rounded-sm border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase">
                      <tr>
                        <th className="p-3 text-left">Semester</th>
                        <th className="p-3 text-left">Regulation</th>
                        <th className="p-3 text-right">GPA</th>
                        <th className="p-3 text-left">Department</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stuData.results.map((r: any, i: number) => (
                        <tr key={i} className="border-t hover:bg-muted/30">
                          <td className="p-3 font-medium">{r.semester}</td>
                          <td className="p-3 text-xs">{r.regulation || '—'}</td>
                          <td className="p-3 text-right font-bold">{r.gpa ? Number(r.gpa).toFixed(2) : '—'}</td>
                          <td className="p-3 text-xs">{r.department || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
