import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, CheckCircle, DollarSign, AlertTriangle, Clock, Edit2, X, Save } from "lucide-react";
import { getBills, createBill, deleteBill, markBillPaid, getBillStats, updateBill } from "../services/api";

interface Bill {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  type: string;
  amount: number;
  due: string;
  academic_year: string | null;
  status: string;
  paid_at: string | null;
  payment_method: string | null;
  transaction_id: string | null;
  user?: { name: string; email: string; student_id: string };
}

const inputCls = "bg-background border border-border rounded-lg px-3 py-2 text-sm w-full";
const btnCls = "flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50";

export default function Bills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState({ total_pending: 0, total_paid: 0, total_overdue: 0, count_pending: 0, count_paid: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({ title: "", description: "", type: "tuition", amount: "", due: "", academic_year: "", user_id: "" });
  const [saving, setSaving] = useState(false);
  const [editBill, setEditBill] = useState<Bill | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", type: "", amount: "", due: "", academic_year: "" });

  useEffect(() => { loadBills(); loadStats(); }, []);

  async function loadBills() {
    setLoading(true);
    try { setBills(await getBills()); } catch {}
    setLoading(false);
  }

  async function loadStats() {
    try { setStats(await getBillStats()); } catch {}
  }

  async function handleCreate() {
    if (!form.user_id || !form.title || !form.amount || !form.due) return;
    setSaving(true);
    try {
      await createBill({
        user_id: parseInt(form.user_id), title: form.title, description: form.description || null,
        type: form.type, amount: parseFloat(form.amount), due: form.due, academic_year: form.academic_year || null,
      });
      setForm({ title: "", description: "", type: "tuition", amount: "", due: "", academic_year: "", user_id: "" });
      setShowForm(false);
      loadBills(); loadStats();
    } catch {}
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this bill?")) return;
    try { await deleteBill(id); loadBills(); loadStats(); } catch {}
  }

  async function handleMarkPaid(id: number) {
    try { await markBillPaid(id, { payment_method: "cash" }); loadBills(); loadStats(); } catch {}
  }

  function handleEditStart(bill: Bill) {
    setEditBill(bill);
    setEditForm({
      title: bill.title,
      description: bill.description || "",
      type: bill.type,
      amount: String(bill.amount),
      due: bill.due.split("T")[0],
      academic_year: bill.academic_year || "",
    });
  }

  async function handleEditSave() {
    if (!editBill || !editForm.title || !editForm.amount || !editForm.due) return;
    setSaving(true);
    try {
      await updateBill(editBill.id, {
        title: editForm.title,
        description: editForm.description || null,
        type: editForm.type,
        amount: parseFloat(editForm.amount),
        due: editForm.due,
        academic_year: editForm.academic_year || null,
      });
      setEditBill(null);
      loadBills();
      loadStats();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update bill");
    }
    setSaving(false);
  }

  function handleEditCancel() {
    setEditBill(null);
  }

  const filtered = bills.filter((b) => filter === "all" || b.status === filter);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bills & Payments</h1>
        <p className="text-sm text-muted-foreground">Create, manage, and track student bills.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-sm border bg-card p-4">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Pending</span><Clock className="h-4 w-4 text-yellow-500" /></div>
          <div className="mt-2 text-2xl font-bold">{stats.count_pending}</div>
          <div className="text-xs text-muted-foreground">৳{stats.total_pending.toLocaleString()}</div>
        </div>
        <div className="rounded-sm border bg-card p-4">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Paid</span><CheckCircle className="h-4 w-4 text-green-500" /></div>
          <div className="mt-2 text-2xl font-bold">{stats.count_paid}</div>
          <div className="text-xs text-muted-foreground">৳{stats.total_paid.toLocaleString()}</div>
        </div>
        <div className="rounded-sm border bg-card p-4">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Overdue</span><AlertTriangle className="h-4 w-4 text-red-500" /></div>
          <div className="mt-2 text-2xl font-bold">৳{stats.total_overdue.toLocaleString()}</div>
        </div>
        <div className="rounded-sm border bg-card p-4">
          <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Total</span><DollarSign className="h-4 w-4 text-primary" /></div>
          <div className="mt-2 text-2xl font-bold">৳{(stats.total_paid + stats.total_pending).toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setShowForm(!showForm)} className={btnCls}><Plus className="h-4 w-4" /> Create Bill</button>
        <div className="flex-1" />
        <div className="flex gap-2">
          {["all", "pending", "paid", "overdue"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-xs rounded-lg capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{f}</button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="rounded-sm border bg-card p-6 space-y-4">
          <h3 className="text-sm font-bold">Create New Bill</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><label className="text-xs font-semibold">Student User ID *</label><input placeholder="User ID" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold">Title *</label><input placeholder="e.g. Tuition Fee" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold">Type *</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                <option value="tuition">Tuition</option><option value="exam">Exam</option><option value="lab">Lab</option><option value="library">Library</option><option value="hostel">Hostel</option><option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1"><label className="text-xs font-semibold">Amount (BDT) *</label><input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold">Due Date *</label><input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1"><label className="text-xs font-semibold">Academic Year</label><input placeholder="e.g. 2025-26" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} className={inputCls} /></div>
          </div>
          <div className="space-y-1"><label className="text-xs font-semibold">Description</label><input placeholder="Optional" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving} className={btnCls}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading bills...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border bg-card p-8 text-center text-muted-foreground">No bills found.</div>
      ) : (
        <div className="rounded-sm border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase"><tr>
              <th className="p-3 text-left">Student</th><th className="p-3 text-left">Title</th><th className="p-3 text-left">Type</th>
              <th className="p-3 text-right">Amount</th><th className="p-3 text-left">Due</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((bill) => (
                <tr key={bill.id} className="border-t hover:bg-muted/30">
                  {editBill?.id === bill.id ? (
                    <>
                      <td className="p-3 text-xs text-muted-foreground">{bill.user?.name || `User #${bill.user_id}`}</td>
                      <td className="p-3"><input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-background border border-border rounded px-2 py-1 text-xs w-full" /></td>
                      <td className="p-3">
                        <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="bg-background border border-border rounded px-2 py-1 text-xs capitalize w-full">
                          {["tuition", "exam", "lab", "library", "hostel", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="p-3 text-right"><input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="bg-background border border-border rounded px-2 py-1 text-xs w-20 text-right" /></td>
                      <td className="p-3"><input type="date" value={editForm.due} onChange={(e) => setEditForm({ ...editForm, due: e.target.value })} className="bg-background border border-border rounded px-2 py-1 text-xs w-full" /></td>
                      <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${bill.status === "paid" ? "bg-green-100 text-green-700" : bill.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{bill.status}</span></td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={handleEditSave} disabled={saving} className="p-1 text-green-600 hover:text-green-700" title="Save"><Save className="h-4 w-4" /></button>
                          <button onClick={handleEditCancel} className="p-1 text-muted-foreground hover:text-foreground" title="Cancel"><X className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3"><div className="font-medium">{bill.user?.name || `User #${bill.user_id}`}</div><div className="text-xs text-muted-foreground">{bill.user?.student_id || bill.user?.email}</div></td>
                      <td className="p-3">{bill.title}</td>
                      <td className="p-3 capitalize text-xs">{bill.type}</td>
                      <td className="p-3 text-right font-semibold">৳{parseFloat(String(bill.amount)).toLocaleString()}</td>
                      <td className="p-3 text-xs">{new Date(bill.due).toLocaleDateString()}</td>
                      <td className="p-3 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${bill.status === "paid" ? "bg-green-100 text-green-700" : bill.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{bill.status}</span></td>
                      <td className="p-3 text-center"><div className="flex items-center justify-center gap-1">
                        {bill.status !== "paid" && <button onClick={() => handleMarkPaid(bill.id)} className="p-1 text-green-600 hover:text-green-700" title="Mark as paid"><CheckCircle className="h-4 w-4" /></button>}
                        <button onClick={() => handleEditStart(bill)} className="p-1 text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(bill.id)} className="p-1 text-red-600 hover:text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
