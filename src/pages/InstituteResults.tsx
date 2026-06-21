import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  Upload,
  FileText,
  PenLine,
  Search,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Loader2,
  Info,
} from "lucide-react";
import {
  uploadInstituteCsv,
  uploadInstitutePdf,
  addInstituteResult,
  deleteInstituteResult,
  searchInstituteResults,
  getInstituteResultsStats,
} from "../services/api";
import { getSubjectsForSemester, allSemesters } from "../utils/instituteSubjects";

type Tab = "csv" | "pdf" | "manual";

interface InstituteResult {
  id: number;
  roll: string;
  semester: string;
  academic_year: string;
  status: string;
  referred_subjects: string[] | null;
  created_at: string;
}

export default function InstituteResults() {
  const [tab, setTab] = useState<Tab>("csv");
  const [semester, setSemester] = useState("1st");
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const csvRef = useRef<HTMLInputElement | null>(null);
  const pdfRef = useRef<HTMLInputElement | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [stats, setStats] = useState<any>(null);

  // Manual form state
  const [manualRoll, setManualRoll] = useState("");
  const [manualSubjects, setManualSubjects] = useState<Record<string, boolean>>({});

  // Search state
  const [searchRoll, setSearchRoll] = useState("");
  const [searchResults, setSearchResults] = useState<InstituteResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const subjects = getSubjectsForSemester(semester);
    const map: Record<string, boolean> = {};
    subjects.forEach((s) => (map[s.code] = true));
    setManualSubjects(map);
  }, [semester]);

  async function loadStats() {
    try {
      const data = await getInstituteResultsStats();
      setStats(data);
    } catch {}
  }

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  // CSV Upload
  async function handleCsvUpload() {
    if (!csvFile) return;
    clearMessages();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", csvFile);
      fd.append("semester", semester);
      fd.append("academic_year", academicYear);
      const res = await uploadInstituteCsv(fd);
      setSuccess(`Imported ${res.imported} records. ${res.skipped} skipped.`);
      if (res.errors?.length > 0) {
        setError(`${res.errors.length} warnings: ${res.errors.slice(0, 3).join("; ")}`);
      }
      setCsvFile(null);
      if (csvRef.current) csvRef.current.value = "";
      loadStats();
    } catch (e: any) {
      setError(e.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  // PDF Upload
  async function handlePdfUpload() {
    if (!pdfFile) return;
    clearMessages();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("pdf", pdfFile);
      fd.append("semester", semester);
      fd.append("academic_year", academicYear);
      const res = await uploadInstitutePdf(fd);
      setSuccess(`Parsed ${res.pages_processed} pages, imported ${res.imported} records.`);
      setPdfFile(null);
      if (pdfRef.current) pdfRef.current.value = "";
      loadStats();
    } catch (e: any) {
      setError(e.response?.data?.error || "PDF upload failed");
    } finally {
      setLoading(false);
    }
  }

  // Manual entry
  async function handleManualSubmit() {
    clearMessages();
    if (!manualRoll || manualRoll.length !== 6) {
      setError("Roll must be 6 digits");
      return;
    }

    const referredSubjects = Object.entries(manualSubjects)
      .filter(([_, passed]) => !passed)
      .map(([code]) => code);

    const status = referredSubjects.length > 0 ? "Referred" : "Passed";

    setLoading(true);
    try {
      await addInstituteResult({
        roll: manualRoll,
        semester,
        academic_year: academicYear,
        status,
        referred_subjects: referredSubjects.length > 0 ? referredSubjects : undefined,
      });
      setSuccess(`Result saved for roll ${manualRoll} — ${status}`);
      setManualRoll("");
      loadStats();
    } catch (e: any) {
      setError(e.response?.data?.error || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  // Search
  async function handleSearch() {
    if (!searchRoll || searchRoll.length !== 6) return;
    setSearchLoading(true);
    try {
      const data = await searchInstituteResults(searchRoll);
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!await window.customConfirm("Delete this result?")) return;
    try {
      await deleteInstituteResult(id);
      setSearchResults((prev) => prev.filter((r) => r.id !== id));
      loadStats();
    } catch {}
  }

  const subjects = getSubjectsForSemester(semester);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Institute Mid-Term Results</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload mid-term exam results (pass/fail per subject, no GPA)
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold">{stats.total_records}</div>
            <div className="text-muted-foreground text-sm">Total Records</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold">{stats.distinct_rolls}</div>
            <div className="text-muted-foreground text-sm">Students</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold">{stats.referred_count}</div>
            <div className="text-muted-foreground text-sm">Referred</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-2xl font-bold">{stats.semesters?.length || 0}</div>
            <div className="text-muted-foreground text-sm">Semesters</div>
          </div>
        </div>
      )}

      {/* Messages */}
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

      {/* Config row */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm"
            >
              {allSemesters.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Academic Year</label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-28"
              placeholder="2025"
            />
          </div>
          <div className="ml-auto">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="w-3 h-3" />
              {subjects.length} subjects for {semester} semester
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {([
          ["csv", "CSV Upload", FileText],
          ["pdf", "PDF Upload", Upload],
          ["manual", "Manual Entry", PenLine],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => { setTab(key); clearMessages(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* CSV Tab */}
      {tab === "csv" && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Upload CSV File</h2>
          <p className="text-sm text-muted-foreground">
            CSV format: <code className="bg-muted px-1 rounded">roll,failed_subjects</code> —
            empty failed_subjects means all passed.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono">
            <div>roll,failed_subjects</div>
            <div>593818,"66454(T),67045(T)"</div>
            <div>593819,</div>
            <div>593820,"66641(T)"</div>
          </div>
          <div className="flex items-center gap-4">
            <input
              ref={csvRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCsvFile(e.target.files?.[0] || null)}
              className="text-xs text-muted-foreground font-semibold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-all duration-150"
            />
            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import CSV
            </button>
          </div>
        </div>
      )}

      {/* PDF Tab */}
      {tab === "pdf" && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Upload BTEB Format PDF</h2>
          <p className="text-sm text-muted-foreground">
            Server-side parser — detects CMPI section (74026), parses passed/referred students.
          </p>
          <div className="flex items-center gap-4">
            <input
              ref={pdfRef}
              type="file"
              accept=".pdf"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPdfFile(e.target.files?.[0] || null)}
              className="text-xs text-muted-foreground font-semibold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer transition-all duration-150"
            />
            <button
              onClick={handlePdfUpload}
              disabled={!pdfFile || loading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Parse & Import PDF
            </button>
          </div>
        </div>
      )}

      {/* Manual Tab */}
      {tab === "manual" && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Manual Entry</h2>
          <p className="text-sm text-muted-foreground">
            Enter a roll number and mark pass/fail for each {semester} semester subject.
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Roll Number</label>
              <input
                type="text"
                value={manualRoll}
                onChange={(e) => setManualRoll(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-36 font-mono"
                placeholder="6 digits"
                maxLength={6}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {subjects.map((subj) => (
              <label
                key={subj.code}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  manualSubjects[subj.code]
                    ? "border-green-500/50 bg-green-500/5"
                    : "border-destructive/50 bg-destructive/5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={manualSubjects[subj.code] ?? true}
                  onChange={(e) =>
                    setManualSubjects((prev) => ({ ...prev, [subj.code]: e.target.checked }))
                  }
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-muted-foreground">{subj.code}</div>
                  <div className="text-sm truncate">{subj.name}</div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    manualSubjects[subj.code] ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {manualSubjects[subj.code] ? "Pass" : "Fail"}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={!manualRoll || manualRoll.length !== 6 || loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            Save Result
          </button>
        </div>
      )}

      {/* Search Section */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Search Student Results</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={searchRoll}
            onChange={(e) => setSearchRoll(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-36 font-mono"
            placeholder="Roll number"
            maxLength={6}
          />
          <button
            onClick={handleSearch}
            disabled={!searchRoll || searchRoll.length !== 6 || searchLoading}
            className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">Roll</th>
                  <th className="text-left py-2 px-3 font-medium">Semester</th>
                  <th className="text-left py-2 px-3 font-medium">Year</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium">Referred Subjects</th>
                  <th className="text-right py-2 px-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 px-3 font-mono">{r.roll}</td>
                    <td className="py-2 px-3">{r.semester}</td>
                    <td className="py-2 px-3">{r.academic_year}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "Passed"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs font-mono">
                      {r.referred_subjects?.join(", ") || "—"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-destructive/70 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {searchResults.length === 0 && searchRoll.length === 6 && !searchLoading && (
          <p className="text-muted-foreground text-sm">No results found for this roll.</p>
        )}
      </div>
    </div>
  );
}
