import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Upload, AlertTriangle, CheckCircle, RefreshCw, X, Save, Info, Link, Loader2, Database, FileText, HardDrive, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { detectDepartmentFromSubjects } from "../utils/btebSubjectCodes";
import { importBtebResults, importBtebResultsFromDrive, getImportJobStatus, getBtebStats } from "../services/api";

interface ParsedResult {
  roll: string;
  department: string;
  semester: string;
  regulation: string;
  holding_year: string;
  gpa: number | null;
  status: "Passed" | "Referred";
  referred_subjects: string[] | null;
  raw_text: string;
}

interface ImportJobStatus {
  id: number;
  status: "pending" | "processing" | "completed" | "failed";
  total_files: number;
  processed_files: number;
  total_results: number;
  error_log: any;
  created_at?: string;
  updated_at?: string;
  file_details?: { name: string; size_bytes: number; size_human: string; results: number; duration_sec: number }[];
}

interface BtebStats {
  total_results: number;
  total_rolls: number;
  departments: string[];
  semesters: string[];
  import_jobs: ImportJobStatus[];
}

const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(pdfjsLib);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

interface ParseProgress {
  current: number;
  total: number;
  fileName: string;
  phase: "parsing" | "syncing";
}

export default function BtebResults() {
  const [semester, setSemester] = useState("auto");
  const [regulation, setRegulation] = useState("auto");
  const [holdingYear, setHoldingYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number>(0);
  const [parsedData, setParsedData] = useState<ParsedResult[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [parseProgress, setParseProgress] = useState<ParseProgress | null>(null);
  const [stats, setStats] = useState<BtebStats | null>(null);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  // Drive import progress state
  const [driveJob, setDriveJob] = useState<ImportJobStatus | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (!driveSyncing) return;
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [driveSyncing]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getBtebStats();
      setStats(data);

      const latestJob = data.import_jobs?.[0];
      if (latestJob && (latestJob.status === "pending" || latestJob.status === "processing")) {
        setDriveJob(latestJob);
        setDriveSyncing(true);
        pollJobStatus(latestJob.id);
      }
    } catch {
      // Stats endpoint might not have data yet
    }
  };

  const pollJobStatus = useCallback((jobId: number) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data: ImportJobStatus = await getImportJobStatus(jobId);
        setDriveJob(data);

        if (data.status === "completed" || data.status === "failed") {
          stopPolling();
          setDriveSyncing(false);
          setLoading(false);

          if (data.status === "completed") {
            let msg = `Done! ${data.total_files} files processed, ${data.total_results} result records imported.`;
            if (data.error_log && data.error_log.length > 0) {
              msg += ` (${data.error_log.length} warnings)`;
            }
            setSuccess(msg);
            setDriveUrl("");
            loadStats();
          } else {
            const errMsg = data.error_log?.[0] || "Import failed. Check logs.";
            setError(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
          }
        }
      } catch {
        // Poll error - will retry on next tick
      }
    }, 2000);
  }, [stopPolling]);

  const handleDriveImport = async () => {
    if (!driveUrl) {
      setError("Please provide a valid Google Drive folder or file URL.");
      return;
    }
    setLoading(true);
    setDriveSyncing(true);
    setError(null);
    setSuccess(null);
    setParsedCount(0);
    setParsedData([]);
    setDriveJob(null);

    try {
      const response = await importBtebResultsFromDrive({
        drive_url: driveUrl,
        semester: semester === "auto" ? "" : semester,
        regulation: regulation === "auto" ? "" : regulation,
        holding_year: holdingYear || ""
      });
      setDriveJob({ id: response.job_id, status: "pending", total_files: 0, processed_files: 0, total_results: 0, error_log: null });
      pollJobStatus(response.job_id);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.errors?.drive_url?.[0] || "Failed to start import job.");
      setLoading(false);
      setDriveSyncing(false);
    }
  };

  const semesters = ["auto", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const regulations = ["auto", "2022", "2016", "2010"];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
    );

    if (pdfFiles.length === 0) {
      setError("Please select one or more valid BTEB result PDF files.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setParsedCount(0);
    setParsedData([]);
    setParseProgress(null);

    try {
      const pdfjsLib = await loadPdfJs();
      const allResults: ParsedResult[] = [];

      for (let fi = 0; fi < pdfFiles.length; fi++) {
        const file = pdfFiles[fi]!;
        setParseProgress({ current: fi + 1, total: pdfFiles.length, fileName: file.name, phase: "parsing" });

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let lastDetectedDept = "Computer Science & Technology";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");

          if (pageText.includes("16058") || pageText.includes("74026")) {
            const pageResults = parsePage(pageText, lastDetectedDept);
            if (pageResults.length > 0) {
              allResults.push(...pageResults);
              const lastResult = pageResults[pageResults.length - 1];
              if (lastResult && lastResult.department !== "Auto Detect" && lastResult.department !== "General Technology") {
                lastDetectedDept = lastResult.department;
              }
            }
          }
        }
      }

      if (allResults.length === 0) {
        setError("No BTEB results found for CMPI (Institute Code 74026 or 16058) in the selected PDF files.");
        setParseProgress(null);
      } else {
        setParsedCount(allResults.length);
        setParsedData(allResults);
        setSuccess(`Successfully parsed ${allResults.length} student results from ${pdfFiles.length} files. Syncing to database...`);

        setImporting(true);
        setParseProgress({ current: pdfFiles.length, total: pdfFiles.length, fileName: "Uploading to database...", phase: "syncing" });
        try {
          const response = await importBtebResults({ results: allResults });
          setSuccess(`Import success! Successfully uploaded ${response.count} result records from ${pdfFiles.length} PDF files.`);
          setParsedData([]);
          setParsedCount(0);
          loadStats();
        } catch (importErr: any) {
          console.error(importErr);
          setError(importErr.response?.data?.message || "Failed to auto-sync parsed records to the backend database.");
        } finally {
          setImporting(false);
          setParseProgress(null);
        }
      }
    } catch (err) {
      setError("Failed to parse PDF files. Check if files are password-protected or corrupt.");
      console.error(err);
      setParseProgress(null);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const parsePage = (pageText: string, defaultDept: string): ParsedResult[] => {
    const results: ParsedResult[] = [];
    let cmpiStartIndex = pageText.search(/\b74026\b/);
    if (cmpiStartIndex === -1) {
      cmpiStartIndex = pageText.search(/\b16058\b/);
    }
    if (cmpiStartIndex === -1) return results;

    let cmpiText = pageText.substring(cmpiStartIndex);
    const nextInstituteMatch = cmpiText.substring(10).match(/\b\d{5}\s*-\s*/);
    if (nextInstituteMatch && nextInstituteMatch.index !== undefined) {
      cmpiText = cmpiText.substring(0, nextInstituteMatch.index + 10);
    }

    const techRegex = /\b(\d{2})\s*-\s*([a-zA-Z\s&]+Technology|[a-zA-Z\s&]+Engineering)/g;
    const techBlocks: { dept: string; text: string }[] = [];
    let match;
    const matches: { dept: string; index: number }[] = [];

    while ((match = techRegex.exec(cmpiText)) !== null) {
      let deptName = (match[2] ?? "").trim();
      if (deptName.toLowerCase().includes("computer")) {
        deptName = "Computer Science & Technology";
      } else if (deptName.toLowerCase().includes("civil")) {
        deptName = "Civil Technology";
      } else if (deptName.toLowerCase().includes("electrical")) {
        deptName = "Electrical Technology";
      }
      matches.push({ dept: deptName, index: match.index });
    }

    if (matches.length === 0) {
      techBlocks.push({ dept: defaultDept, text: cmpiText });
    } else {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i]?.index ?? 0;
        const end = (i + 1 < matches.length) ? (matches[i + 1]?.index ?? cmpiText.length) : cmpiText.length;
        techBlocks.push({
          dept: matches[i]?.dept ?? defaultDept,
          text: cmpiText.substring(start, end)
        });
      }
    }

    const semDigitMatch = semester.match(/\d/);
    const semDigit = semDigitMatch ? semDigitMatch[0] : null;

    techBlocks.forEach(({ dept, text: blockText }) => {
      const passedRegex = /\b(\d{6})\s*\(\s*([^)]+)\s*\)/g;
      let rollMatch;
      while ((rollMatch = passedRegex.exec(blockText)) !== null) {
        const roll = rollMatch[1] ?? "";
        const contentStr = rollMatch[2] ?? "";
        let gpa: number | null = null;

        if (/^[2-4]\.\d{2}$/.test(contentStr.trim())) {
          gpa = parseFloat(contentStr.trim());
        } else if (semDigit) {
          const gpaRegex = new RegExp(`gpa${semDigit}\\s*:\\s*([2-4]\\.\\d{2})`, 'i');
          const gpaMatch = contentStr.match(gpaRegex);
          if (gpaMatch && gpaMatch[1]) {
            gpa = parseFloat(gpaMatch[1]);
          }
        }
        if (gpa === null) {
          const anyGpaMatch = contentStr.match(/gpa\d+\s*:\s*([2-4]\.\d{2})/i);
          if (anyGpaMatch && anyGpaMatch[1]) {
            gpa = parseFloat(anyGpaMatch[1]);
          } else {
            const numMatch = contentStr.match(/([2-4]\.\d{2})/);
            if (numMatch && numMatch[1]) {
              gpa = parseFloat(numMatch[1]);
            }
          }
        }

        results.push({
          roll,
          department: dept === "Auto Detect" ? defaultDept : dept,
          semester,
          regulation,
          holding_year: holdingYear,
          gpa,
          status: "Passed",
          referred_subjects: null,
          raw_text: rollMatch[0]
        });
      }

      const referredRegex = /\b(\d{6})\s*\{\s*([^}]+)\s*\}/g;
      while ((rollMatch = referredRegex.exec(blockText)) !== null) {
        const roll = rollMatch[1] ?? "";
        const contentStr = rollMatch[2] ?? "";

        const codeMatches = contentStr.match(/\b\d{5,6}(?:\([^)]+\))?\b/g) || [];
        const referredSubjects = codeMatches.map(s => s.trim()).filter(Boolean);

        let gpa: number | null = null;
        if (semDigit) {
          const gpaRegex = new RegExp(`gpa${semDigit}\\s*:\\s*([2-4]\\.\\d{2})`, 'i');
          const gpaMatch = contentStr.match(gpaRegex);
          if (gpaMatch && gpaMatch[1]) {
            gpa = parseFloat(gpaMatch[1]);
          }
        }
        if (gpa === null) {
          const anyGpaMatch = contentStr.match(/gpa\d+\s*:\s*([2-4]\.\d{2})/i);
          if (anyGpaMatch && anyGpaMatch[1]) {
            gpa = parseFloat(anyGpaMatch[1]);
          } else {
            const numMatch = contentStr.match(/([2-4]\.\d{2})/);
            if (numMatch && numMatch[1]) {
              gpa = parseFloat(numMatch[1]);
            }
          }
        }

        let studentDept = dept;
        if (studentDept === "Auto Detect" || studentDept === "General Technology") {
          const detected = detectDepartmentFromSubjects(referredSubjects);
          studentDept = detected !== "General" ? detected : defaultDept;
        }

        results.push({
          roll,
          department: studentDept,
          semester,
          regulation,
          holding_year: holdingYear,
          gpa,
          status: "Referred",
          referred_subjects: referredSubjects.length > 0 ? referredSubjects : null,
          raw_text: rollMatch[0]
        });
      }
    });

    return results;
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await importBtebResults({ results: parsedData });
      setSuccess(`Import completed! Successfully registered ${response.count} result records to the database.`);
      setParsedData([]);
      setParsedCount(0);
      loadStats();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to sync parsed records to backend.");
    } finally {
      setImporting(false);
    }
  };

  const driveProgress = driveJob && driveJob.total_files > 0
    ? Math.round((driveJob.processed_files / driveJob.total_files) * 100)
    : 0;

  const totalFileSize = (files: { size_bytes: number }[]) =>
    files.reduce((sum, f) => sum + (f.size_bytes || 0), 0);

  const totalFileResults = (files: { results: number }[]) =>
    files.reduce((sum, f) => sum + (f.results || 0), 0);

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}m ${secs}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const getProgressDetails = () => {
    if (!driveJob) return null;

    const jobCreatedAt = driveJob.created_at ? new Date(driveJob.created_at).getTime() : Date.now();
    const elapsedMs = currentTime - jobCreatedAt;
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));

    const processed = driveJob.processed_files || 0;
    const total = driveJob.total_files || 0;
    const remaining = Math.max(0, total - processed);

    const isDownloading = driveJob.error_log && typeof driveJob.error_log === "object" && driveJob.error_log.phase === "downloading";
    
    let speedLabel = "";
    let etaLabel = "Calculating...";
    let avgSecondsPerFile = 0;

    if (processed > 0) {
      avgSecondsPerFile = elapsedSeconds / processed;
      speedLabel = `${avgSecondsPerFile.toFixed(1)}s/file`;
      const remainingSeconds = remaining * avgSecondsPerFile;
      etaLabel = formatDuration(Math.round(remainingSeconds));
    }

    return {
      elapsed: formatDuration(elapsedSeconds),
      eta: etaLabel,
      speed: speedLabel,
      isDownloading,
      processed,
      total,
      remaining
    };
  };

  const progressDetails = getProgressDetails();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">BTEB Results Board Portal</h1>
        <p className="text-sm text-muted-foreground font-semibold">Upload and parse official Bangladesh Technical Education Board PDF result sheets to synchronize student portals</p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{stats.total_results.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Results</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{stats.total_rolls.toLocaleString()}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Rolls</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <HardDrive className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{stats.departments.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Departments</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4 border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-black text-foreground">{stats.import_jobs.length}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Import Jobs</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Main interactive panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 border space-y-6">
            <h3 className="text-lg font-black text-foreground border-b border-border pb-4">
              Result Configuration Parameters
            </h3>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  disabled={driveSyncing}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>{sem === "auto" ? "Auto-detect from filename" : `${sem} Semester`}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Regulation</label>
                <select
                  value={regulation}
                  onChange={(e) => setRegulation(e.target.value)}
                  disabled={driveSyncing}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  {regulations.map((reg) => (
                    <option key={reg} value={reg}>{reg === "auto" ? "Auto-detect from filename" : `Regulation-${reg}`}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Holding Year</label>
                <input
                  type="text"
                  placeholder="Auto-detect from folder name"
                  value={holdingYear}
                  onChange={(e) => setHoldingYear(e.target.value)}
                  disabled={driveSyncing}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive p-4 text-xs font-bold leading-relaxed">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 text-primary p-4 text-xs font-bold leading-relaxed">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* Google Drive Import Section */}
            <div className="border-t border-border pt-6 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">
                  Sync from Google Drive Link
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... or https://drive.google.com/file/d/..."
                    value={driveUrl}
                    onChange={(e) => setDriveUrl(e.target.value)}
                    disabled={driveSyncing}
                    className="flex-1 min-w-0 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                  <button
                    onClick={handleDriveImport}
                    disabled={driveSyncing || !driveUrl}
                    className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/20 px-5 py-2.5 text-sm transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {driveSyncing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                    <span>{driveSyncing ? "Importing..." : "Sync from Drive"}</span>
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground font-semibold">
                  Paste a public Google Drive folder link. Semester, regulation, and holding year are auto-detected from filenames. Subfolders like Rescrutiny &amp; Correction are processed recursively.
                </p>
              </div>

              {/* Progress Bar - shown during drive import */}
              {driveJob && (driveJob.status === "pending" || driveJob.status === "processing") && progressDetails && (
                <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {driveJob.status === "pending" && "Queued... Waiting to start"}
                        {driveJob.status === "processing" && (
                          progressDetails.isDownloading
                            ? "Phase 1/2: Downloading PDFs from Google Drive..."
                            : `Phase 2/2: Processing files... ${progressDetails.processed}/${progressDetails.total}`
                        )}
                      </span>
                    </div>
                    <span className="text-muted-foreground">{driveProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${driveProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground flex-wrap gap-2">
                    <span>
                      {progressDetails.processed} of {progressDetails.total} files processed
                      {driveJob.status === "processing" && !progressDetails.isDownloading && progressDetails.speed && (
                        <span className="text-primary ml-1.5 font-bold">({progressDetails.speed})</span>
                      )}
                    </span>
                    <span className="text-primary font-bold">{driveJob.total_results.toLocaleString()} results found</span>
                  </div>
                  {driveJob.status === "processing" && (
                    <div className="flex items-center justify-between border-t border-primary/10 pt-2 text-[10px] font-bold text-muted-foreground">
                      <span>Elapsed: <span className="text-foreground">{progressDetails.elapsed}</span></span>
                      <span>ETA: <span className="text-foreground font-black">{progressDetails.eta}</span></span>
                    </div>
                  )}
                </div>
              )}

              {/* Completion Summary with file details */}
              {driveJob && driveJob.status === "completed" && (
                <div className="space-y-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-bold leading-relaxed">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>Import completed successfully!</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{driveJob.total_files} files</span>
                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{driveJob.total_results.toLocaleString()} results</span>
                        {driveJob.error_log && driveJob.error_log.length > 0 && (
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{driveJob.error_log.length} warnings</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed State */}
              {driveJob && driveJob.status === "failed" && (
                <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive p-4 text-xs font-bold leading-relaxed">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p>Import failed!</p>
                    {driveJob.error_log && driveJob.error_log.length > 0 && (
                      <p className="mt-1 text-destructive/80">{JSON.stringify(driveJob.error_log[0])}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Per-file parse progress */}
            {parseProgress && (
              <div className="space-y-2.5 p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="truncate max-w-[260px]">
                      {parseProgress.phase === "syncing"
                        ? "Uploading to database..."
                        : `Parsing file ${parseProgress.current} of ${parseProgress.total}`}
                    </span>
                  </div>
                  <span className="text-muted-foreground shrink-0 ml-2">
                    {Math.round((parseProgress.current / parseProgress.total) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.round((parseProgress.current / parseProgress.total) * 100)}%` }}
                  />
                </div>
                {parseProgress.phase === "parsing" && (
                  <p className="text-[11px] text-muted-foreground font-semibold truncate">
                    {parseProgress.fileName}
                  </p>
                )}
              </div>
            )}

            {/* Parsing action area */}
            <div className="flex flex-wrap gap-3 items-center border-t border-border pt-6">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={loading || importing || driveSyncing}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={loading || importing || driveSyncing}
                className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black shadow-lg shadow-primary/20 px-5 py-3 text-sm transition-all disabled:opacity-50"
              >
                {loading || importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>Upload & Sync BTEB PDFs</span>
              </button>

              {parsedCount > 0 && (
                <button
                  onClick={handleImport}
                  disabled={loading || importing}
                  className="flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary-dark font-black px-5 py-3 text-sm transition disabled:opacity-50"
                >
                  {importing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  <span>Manual Re-Sync ({parsedCount} Records)</span>
                </button>
              )}

              {parsedCount > 0 && (
                <button
                  onClick={() => { setParsedData([]); setParsedCount(0); setSuccess(null); }}
                  disabled={loading || importing}
                  className="flex items-center gap-1 text-xs font-black text-muted-foreground hover:text-foreground px-3 py-2 transition"
                >
                  <X className="h-4 w-4" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Parsed List Preview */}
          {parsedData.length > 0 && (
            <div className="glass-card border overflow-hidden">
              <div className="p-4 bg-muted/40 border-b border-border flex items-center justify-between">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Parsed Roster Preview (showing first 15)</h4>
                <span className="text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">{parsedData.length} records</span>
              </div>
              <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase font-black tracking-wider text-muted-foreground bg-muted/20">
                      <th className="py-2.5 pl-4">Roll</th>
                      <th className="py-2.5">Department</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 pr-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold text-foreground">
                    {parsedData.slice(0, 15).map((row, index) => (
                      <tr key={index} className="hover:bg-muted/30">
                        <td className="py-2.5 pl-4 font-mono font-bold text-primary">{row.roll}</td>
                        <td className="py-2.5 text-muted-foreground capitalize">{row.department.replace(/-/g, " ")}</td>
                        <td className="py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-black border ${
                            row.status === "Passed"
                              ? "bg-primary/10 text-primary border-primary/10"
                              : "bg-destructive/10 text-destructive border-destructive/10"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground pr-4">
                          {row.status === "Passed" ? `GPA: ${row.gpa?.toFixed(2)}` : row.referred_subjects?.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Import History Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-6 border space-y-4 bg-muted/20">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase tracking-wider">Import History</h4>
            </div>
            {stats && stats.import_jobs.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {stats.import_jobs.map((job) => (
                  <div key={job.id} className="border border-border rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black border ${
                          job.status === "completed" ? "bg-green-100 text-green-700 border-green-200"
                          : job.status === "failed" ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-yellow-100 text-yellow-700 border-yellow-200"
                        }`}>
                          {job.status}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">#{job.id}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        {job.created_at ? new Date(job.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-foreground flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span>{job.total_files} files</span>
                        <span>&middot;</span>
                        <span>{(job.total_results || 0).toLocaleString()} results</span>
                      </div>
                      {job.created_at && job.updated_at && (job.status === "completed" || job.status === "failed") && (
                        <span className="text-[9px] text-muted-foreground font-semibold">
                          Took: {formatDuration(Math.max(0, Math.floor((new Date(job.updated_at).getTime() - new Date(job.created_at).getTime()) / 1000)))}
                        </span>
                      )}
                    </div>
                    {job.error_log && Array.isArray(job.error_log) && job.error_log.length > 0 && (
                      <p className="text-[9px] text-yellow-600 font-bold">{job.error_log.length} warnings</p>
                    )}
                    {/* Per-file details */}
                    {job.file_details && job.file_details.length > 0 && (
                      <div className="border-t border-border pt-2 mt-2">
                        <button
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                          className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-foreground transition"
                        >
                          {expandedJob === job.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {job.file_details.length} files &middot; {formatDuration(job.file_details.reduce((s, f) => s + f.duration_sec, 0))} total &middot; {formatBytes(totalFileSize(job.file_details))}
                        </button>
                        {expandedJob === job.id && (
                          <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                            {job.file_details.map((file, i) => (
                              <div key={i} className="flex items-center justify-between text-[9px] font-semibold text-muted-foreground bg-muted/30 rounded-lg px-2 py-1.5">
                                <span className="truncate max-w-[140px]" title={file.name}>{file.name}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-primary font-bold">{file.results}</span>
                                  <span className="text-muted-foreground">{file.size_human}</span>
                                  <span className="text-muted-foreground">{file.duration_sec}s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground text-center py-4">No import history yet</p>
            )}
          </div>

          {/* Info Card */}
          <div className="glass-card p-6 border space-y-4 bg-muted/20">
            <div className="flex items-center gap-2 text-primary">
              <Info className="h-5 w-5" />
              <h4 className="text-sm font-black uppercase tracking-wider">Parsing Specs</h4>
            </div>
            <div className="text-xs font-semibold text-muted-foreground space-y-3 leading-relaxed">
              <p>
                Client-side parsing via pdf.js. Pattern matching for CMPI center codes (16058/74026). Only matching pages are processed.
              </p>
              <div className="bg-card border rounded-xl p-3 space-y-2 text-[11px]">
                <p className="font-bold text-foreground">Patterns:</p>
                <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px]">
                  <li><span className="text-primary">Passed:</span> Roll (GPA)</li>
                  <li><span className="text-primary">Referred:</span> Roll &#123; Codes &#125;</li>
                  <li><span className="text-primary">Multi-GPA:</span> Roll &#123; gpa1: val, gpa2: ref &#125;</li>
                </ul>
              </div>
              <div className="bg-card border rounded-xl p-3 space-y-2 text-[11px]">
                <p className="font-bold text-foreground">Drive Import:</p>
                <ul className="list-disc pl-4 space-y-1.5">
                  <li>Paste Google Drive folder link</li>
                  <li>Files downloaded &amp; parsed server-side</li>
                  <li>Per-file size, time, results tracked</li>
                  <li>Rescrutiny subfolders auto-detected</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
