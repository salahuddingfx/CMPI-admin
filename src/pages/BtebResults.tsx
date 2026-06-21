import { useState, useRef, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Upload, AlertTriangle, CheckCircle, RefreshCw, X, Save, Info, Link, Loader2 } from "lucide-react";
import { detectDepartmentFromSubjects } from "../utils/btebSubjectCodes";
import { importBtebResults, importBtebResultsFromDrive, getImportJobStatus } from "../services/api";

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
  error_log: string[] | null;
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

  // Drive import progress state
  const [driveJob, setDriveJob] = useState<ImportJobStatus | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

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
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to sync parsed records to backend.");
    } finally {
      setImporting(false);
    }
  };

  // Drive progress percentage
  const driveProgress = driveJob && driveJob.total_files > 0
    ? Math.round((driveJob.processed_files / driveJob.total_files) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">BTEB Results Board Portal</h1>
        <p className="text-sm text-muted-foreground font-semibold">Upload and parse official Bangladesh Technical Education Board PDF result sheets to synchronize student portals</p>
      </div>

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
                  Paste a public Google Drive folder link. Semester, regulation, and holding year are auto-detected from filenames (e.g. RESULT_4th_2022_Regulation.pdf). Subfolders like Rescrutiny &amp; Correction are processed recursively.
                </p>
              </div>

              {/* Progress Bar - shown during drive import */}
              {driveJob && (driveJob.status === "pending" || driveJob.status === "processing") && (
                <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {driveJob.status === "pending" && "Queued... Waiting to start"}
                        {driveJob.status === "processing" && `Processing files... ${driveJob.processed_files}/${driveJob.total_files}`}
                      </span>
                    </div>
                    <span className="text-muted-foreground">{driveProgress}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${driveProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>
                      {driveJob.processed_files} of {driveJob.total_files} files processed
                    </span>
                    <span className="text-primary font-bold">
                      {driveJob.total_results} results found
                    </span>
                  </div>
                </div>
              )}

              {/* Completion Summary */}
              {driveJob && driveJob.status === "completed" && (
                <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 text-green-700 p-4 text-xs font-bold leading-relaxed">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p>Import completed successfully!</p>
                    <p className="mt-1 text-green-600">
                      {driveJob.total_files} files processed &middot; {driveJob.total_results} result records imported
                      {driveJob.error_log && driveJob.error_log.length > 0 && (
                        <span className="text-yellow-600"> &middot; {driveJob.error_log.length} warnings</span>
                      )}
                    </p>
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
                    📄 {parseProgress.fileName}
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

        {/* Informative Side Card */}
        <div className="glass-card p-6 border space-y-4 bg-muted/20">
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <h4 className="text-sm font-black uppercase tracking-wider">Parsing Specifications</h4>
          </div>
          <div className="text-xs font-semibold text-muted-foreground space-y-3 leading-relaxed">
            <p>
              This parser operates completely **in-browser** (client-side) using `pdf.js`. It performs pattern matching and heuristic lookups to process transcripts reliably without exposing data to external processors.
            </p>
            <div className="bg-card border rounded-xl p-3 space-y-2 text-[11px]">
              <p className="font-bold text-foreground">Pattern Rules Supported:</p>
              <ul className="list-disc pl-4 space-y-1.5 font-mono text-[10px]">
                <li><span className="text-primary">Passed:</span> Roll (GPA) &rarr; e.g. 123456 (3.75)</li>
                <li><span className="text-primary">Referred:</span> Roll &#123; Codes(type) &#125; &rarr; e.g. 123458 &#123; 25911(T) &#125;</li>
              </ul>
            </div>
            <p>
              Only pages containing the **CMPI Center Code (16058)** are processed. If a technology header is omitted on continuation pages, the parser automatically links student rolls to the last matching department.
            </p>
            <div className="bg-card border rounded-xl p-3 space-y-2 text-[11px]">
              <p className="font-bold text-foreground">Drive Import (Background Job):</p>
              <ul className="list-disc pl-4 space-y-1.5">
                <li>Paste a Google Drive folder link</li>
                <li>Files are downloaded & parsed server-side</li>
                <li>Progress updates every 2 seconds</li>
                <li>Supports folders with 50+ PDF files</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
