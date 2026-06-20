import { useEffect, useState } from "react";
import { Search, Loader2, CheckCircle, XCircle, RefreshCw, User, X } from "lucide-react";
import { getAdmissions, updateAdmissionStatus } from "../services/api";

interface Admission {
  id: number;
  application_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  ssc_gpa: string;
  father_name: string;
  mother_name: string;
  address: string;
  blood_group?: string;
  status: string;
  created_at: string;
}

export default function Admissions() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAdm, setSelectedAdm] = useState<Admission | null>(null);

  const loadAdmissions = async () => {
    setLoading(true);
    try {
      const data = await getAdmissions();
      setAdmissions(data);
    } catch (err) {
      console.error("Failed to load admissions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleStatusChange = async (id: number, status: "Approved" | "Rejected") => {
    if (window.confirm(`Are you sure you want to change status to ${status}? Approving will auto-create a student user account.`)) {
      setUpdatingId(id);
      try {
        await updateAdmissionStatus(id, status);
        // Refresh
        await loadAdmissions();
        // If the selected applicant detail is open, update its local copy
        if (selectedAdm && selectedAdm.id === id) {
          setSelectedAdm({ ...selectedAdm, status });
        }
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to update admission status");
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const filteredAdmissions = admissions.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.application_id.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.phone.includes(search);

    const matchesStatus = statusFilter === "All" || a.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Admissions Review Workspace</h1>
          <p className="text-sm text-muted-foreground font-semibold">Review applicant files, academic GPAs, and transition candidates to active student rosters</p>
        </div>
        <button
          onClick={loadAdmissions}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Grid: list + detail side view */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Applicants table list */}
        <div className={`space-y-4 lg:col-span-2 ${selectedAdm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Filters & search row */}
          <div className="glass-card p-4 border flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 bg-muted/40 border border-border px-4 py-2 rounded-xl w-full md:max-w-xs">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs font-semibold border-none focus:outline-none placeholder:text-muted-foreground text-foreground w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Applications</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table display */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredAdmissions.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No applications found matching options.</p>
            </div>
          ) : (
            <div className="glass-card border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                      <th className="py-3.5 pl-4">Application ID</th>
                      <th className="py-3.5">Candidate Name</th>
                      <th className="py-3.5">Department Choice</th>
                      <th className="py-3.5">SSC GPA</th>
                      <th className="py-3.5">Status</th>
                      <th className="py-3.5 text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredAdmissions.map((a) => (
                      <tr
                        key={a.id}
                        className={`hover:bg-muted/30 cursor-pointer transition ${
                          selectedAdm?.id === a.id ? "bg-primary/5" : ""
                        }`}
                        onClick={() => setSelectedAdm(a)}
                      >
                        <td className="py-3.5 pl-4 font-mono font-bold text-xs text-foreground">{a.application_id}</td>
                        <td className="py-3.5 font-extrabold text-foreground">{a.name}</td>
                        <td className="py-3.5 text-muted-foreground font-semibold">{a.department}</td>
                        <td className="py-3.5 text-foreground font-bold">{a.ssc_gpa}</td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                              a.status === "Approved"
                                ? "bg-primary/10 text-primary"
                                : a.status === "Rejected"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary/15 text-secondary-dark"
                            }`}
                          >
                            <span>{a.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          {a.status === "Pending" ? (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => handleStatusChange(a.id, "Approved")}
                                disabled={updatingId === a.id}
                                className="rounded-lg p-1 text-primary hover:bg-primary/10 transition"
                                title="Approve Student"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(a.id, "Rejected")}
                                disabled={updatingId === a.id}
                                className="rounded-lg p-1 text-destructive hover:bg-destructive/10 transition"
                                title="Reject Application"
                              >
                                <XCircle className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground font-semibold">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Applicant file details panel */}
        {selectedAdm && (
          <div className="glass-card p-6 border space-y-6 relative">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{selectedAdm.application_id}</span>
                <h3 className="text-lg font-black text-foreground">{selectedAdm.name}</h3>
              </div>
              <button
                onClick={() => setSelectedAdm(null)}
                className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground uppercase text-[10px] font-black">Email</p>
                  <p className="text-foreground mt-0.5 break-all">{selectedAdm.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-[10px] font-black">Phone</p>
                  <p className="text-foreground mt-0.5">{selectedAdm.phone}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground uppercase text-[10px] font-black">Applied Department</p>
                <p className="text-foreground font-bold mt-0.5 text-sm">{selectedAdm.department}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground uppercase text-[10px] font-black">SSC Result GPA</p>
                  <p className="text-foreground font-bold mt-0.5 text-sm text-primary">{selectedAdm.ssc_gpa}</p>
                </div>
                <div>
                  <p className="text-muted-foreground uppercase text-[10px] font-black">Blood Group</p>
                  <p className="text-foreground mt-0.5">{selectedAdm.blood_group || "-"}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-foreground font-black uppercase text-[10px] tracking-wider text-muted-foreground">Guardian Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-black">Father's Name</p>
                    <p className="text-foreground mt-0.5">{selectedAdm.father_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase text-[9px] font-black">Mother's Name</p>
                    <p className="text-foreground mt-0.5">{selectedAdm.mother_name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-muted-foreground uppercase text-[10px] font-black">Residential Address</p>
                <p className="text-foreground leading-relaxed mt-0.5 bg-muted/30 p-2.5 rounded-xl border border-border">{selectedAdm.address}</p>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-black text-muted-foreground">
                  <span>Application Status</span>
                  <span
                    className={`rounded-full px-2 py-0.5 ${
                      selectedAdm.status === "Approved"
                        ? "bg-primary/10 text-primary"
                        : selectedAdm.status === "Rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-secondary/15 text-secondary-dark"
                    }`}
                  >
                    {selectedAdm.status}
                  </span>
                </div>

                {selectedAdm.status === "Pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedAdm.id, "Approved")}
                      disabled={updatingId === selectedAdm.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-dark font-black px-3 py-2 text-xs transition shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve Applicant</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedAdm.id, "Rejected")}
                      disabled={updatingId === selectedAdm.id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-destructive/20 hover:border-destructive bg-destructive/5 hover:bg-destructive text-destructive hover:text-white font-black px-3 py-2 text-xs transition"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject File</span>
                    </button>
                  </div>
                ) : selectedAdm.status === "Approved" ? (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl">
                    <User className="h-4 w-4" />
                    <p className="text-[10px] leading-relaxed font-bold">
                      Student record activated. Default login account `student123` generated for this candidate.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-destructive/5 text-destructive border border-destructive/15 rounded-xl">
                    <XCircle className="h-4 w-4" />
                    <p className="text-[10px] leading-relaxed font-bold">
                      This applicant's folder was rejected. Account creation skipped.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
