import { useEffect, useState } from "react";
import { CheckCircle, Trash2, Loader2, MessageSquare } from "lucide-react";
import { getFeedbacks, approveFeedback, rejectFeedback, deleteFeedback } from "../services/api";

interface Feedback {
  id: number;
  title: string;
  category: "general" | "academic" | "facility" | "hostel" | "other";
  description: string;
  status: "pending" | "in-progress" | "resolved";
  upvotes: number;
  user?: {
    id: number;
    name: string;
  };
  created_at: string;
}

const CATEGORY_LABELS: Record<Feedback["category"], string> = {
  general: "General",
  academic: "Academic",
  facility: "Campus Facility",
  hostel: "Hostel",
  other: "Other",
};

const STATUS_BADGES: Record<Feedback["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200",
  resolved: "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400 border border-green-200",
};

export default function FeedbackModeration() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Feedback["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await getFeedbacks({ page });
      // The API returns paginated array, handle both paginated wrapper and raw arrays
      const dataList = Array.isArray(response) ? response : (response.data ?? []);
      setFeedbacks(dataList);
      setTotalPages(response.last_page || 1);
    } catch (err) {
      console.error("Failed to load feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, [page]);

  const handleApprove = async (id: number) => {
    try {
      await approveFeedback(id);
      loadFeedbacks();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to approve feedback");
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await rejectFeedback(id); // mapped to reject action on backend which marks as resolved
      loadFeedbacks();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to resolve feedback");
    }
  };

  const handleDelete = async (id: number) => {
    if (await window.customConfirm("Are you sure you want to delete this feedback submission?")) {
      try {
        await deleteFeedback(id);
        loadFeedbacks();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete feedback");
      }
    }
  };

  const filteredFeedbacks = feedbacks.filter(
    (f) => filterStatus === "all" || f.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-tight">Student Feedback Moderator</h1>
        <p className="text-sm text-muted-foreground font-semibold">Review, approve, and resolve student feedback submissions and campus grievances</p>
      </div>

      {/* Filter tab bar */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {(["all", "pending", "in-progress", "resolved"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              filterStatus === status
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* List content */}
      {loading ? (
        <div className="flex justify-center items-center h-48 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">No feedback submissions found.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredFeedbacks.map((f) => (
            <div key={f.id} className="glass-card p-6 border flex flex-col md:flex-row md:items-start md:justify-between gap-6 transition hover:shadow-md">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-secondary-dark border border-secondary/20">
                    {CATEGORY_LABELS[f.category] || f.category}
                  </span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${STATUS_BADGES[f.status] || ""}`}>
                    {f.status}
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold">
                    Upvotes: {f.upvotes}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-foreground">{f.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    Submitted by: <span className="font-bold text-foreground">{f.user?.name || "Anonymous Student"}</span> · {f.created_at ? f.created_at.slice(0, 10) : ""}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed font-semibold bg-muted/20 p-4 rounded-xl border border-muted/30">
                  {f.description}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex md:flex-col items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                {f.status === "pending" && (
                  <button
                    onClick={() => handleApprove(f.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 transition"
                    title="Mark In-Progress"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                )}
                {f.status !== "resolved" && (
                  <button
                    onClick={() => handleResolve(f.id)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3.5 py-2 transition"
                    title="Mark Resolved"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Resolve</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(f.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs px-3.5 py-2 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="px-3 py-1.5 rounded-lg border text-sm font-semibold hover:bg-muted disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-muted-foreground font-bold">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1.5 rounded-lg border text-sm font-semibold hover:bg-muted disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
