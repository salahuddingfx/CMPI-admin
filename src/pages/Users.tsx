import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, User as UserIcon } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  student_id?: string;
  semester?: string;
  session?: string;
  phone?: string;
  guardian?: string;
  blood_group?: string;
  address?: string;
  admission_date?: string;
  avatar?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editUserObj, setEditUserObj] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [semester, setSemester] = useState("");
  const [session, setSession] = useState("");
  const [phone, setPhone] = useState("");
  const [guardian, setGuardian] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [address, setAddress] = useState("");

  const currentAdmin = (() => {
    try {
      const userStr = localStorage.getItem("cmpi-admin-user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  })();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("student");
    setDepartment("");
    setStudentId("");
    setSemester("");
    setSession("");
    setPhone("");
    setGuardian("");
    setBloodGroup("");
    setAddress("");
    setEditUserObj(null);
    setShowForm(false);
  };

  const handleEditClick = (u: User) => {
    setEditUserObj(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(""); // Clear password field on edit
    setRole(u.role);
    setDepartment(u.department || "");
    setStudentId(u.student_id || "");
    setSemester(u.semester || "");
    setSession(u.session || "");
    setPhone(u.phone || "");
    setGuardian(u.guardian || "");
    setBloodGroup(u.blood_group || "");
    setAddress(u.address || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: any = {
      name,
      email,
      role,
      department: department || null,
      student_id: studentId || null,
      semester: semester || null,
      session: session || null,
      phone: phone || null,
      guardian: guardian || null,
      blood_group: bloodGroup || null,
      address: address || null,
    };

    if (password) {
      payload.password = password;
    } else if (!editUserObj) {
      // Password is required for new users
      alert("Password is required for creating a new user");
      setSubmitting(false);
      return;
    }

    try {
      if (editUserObj) {
        await updateUser(editUserObj.id, payload);
      } else {
        await createUser(payload);
      }
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save user. Verify email and ID are unique.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userToDelete: User) => {
    if (currentAdmin && currentAdmin.id === userToDelete.id) {
      alert("You cannot delete your own logged-in admin account!");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the user account for ${userToDelete.name}?`)) {
      try {
        await deleteUser(userToDelete.id);
        loadUsers();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === "All" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">User Account Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Manage system users, student roster profiles, administrative access roles, and logins</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New User Account</span>
        </button>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Users list column */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Filters & search row */}
          <div className="glass-card p-4 border flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 bg-muted/40 border border-border px-4 py-2 rounded-xl w-full md:max-w-xs">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, student ID, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs font-semibold border-none focus:outline-none placeholder:text-muted-foreground text-foreground w-full"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-wider">Access level:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Accounts</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No accounts found matching guidelines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredUsers.map((u) => (
                <div key={u.id} className="glass-card p-5 border flex flex-col justify-between gap-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                            u.role === "admin"
                              ? "bg-purple-50 text-purple-600 border-purple-100"
                              : "bg-primary/10 text-primary border-primary/10"
                          }`}
                        >
                          {u.role}
                        </span>
                        <h3 className="text-base font-black text-foreground mt-1.5">{u.name}</h3>
                        <p className="text-xs font-semibold text-muted-foreground -mt-0.5">{u.email}</p>
                      </div>
                      <UserIcon className="h-6 w-6 text-primary shrink-0 opacity-80" />
                    </div>

                    {u.role === "student" && (
                      <div className="text-xs font-semibold space-y-1 bg-muted/40 p-2.5 rounded-xl border border-border">
                        <p className="text-foreground"><span className="text-muted-foreground">ID:</span> <span className="font-mono">{u.student_id || "-"}</span></p>
                        <p className="text-foreground"><span className="text-muted-foreground">Dept:</span> {u.department || "-"}</p>
                        <p className="text-foreground"><span className="text-muted-foreground">Sem/Session:</span> {u.semester || "-"} semester ({u.session || "-"})</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t pt-3 border-border">
                    <button
                      onClick={() => handleEditClick(u)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Account"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {(!currentAdmin || currentAdmin.id !== u.id) && (
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                        title="Delete Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form Column */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editUserObj ? "Edit Account" : "Create Account"}
              </h3>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arif Rahman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Access level</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. student@cmpi.edu.bd"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">
                    Password {editUserObj && "(leave empty to keep current)"}
                  </label>
                  <input
                    type="password"
                    required={!editUserObj}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {role === "student" && (
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="text-xs font-black uppercase text-primary tracking-wider">Student Profile Fields</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Student ID Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CMPI-2023-0102"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Technology Department</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Department...</option>
                        <option value="Computer Science & Technology">Computer Science (CST)</option>
                        <option value="Civil Technology">Civil Technology</option>
                        <option value="Electrical Technology">Electrical Technology</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select Semester...</option>
                        <option value="1st">1st</option>
                        <option value="2nd">2nd</option>
                        <option value="3rd">3rd</option>
                        <option value="4th">4th</option>
                        <option value="5th">5th</option>
                        <option value="6th">6th</option>
                        <option value="7th">7th</option>
                        <option value="8th">8th</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Session Period</label>
                      <input
                        type="text"
                        placeholder="e.g. 2023-2024"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Phone Contact</label>
                      <input
                        type="text"
                        placeholder="+880 1700-000000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Guardian & Relation</label>
                      <input
                        type="text"
                        placeholder="e.g. Karim Miah (Father)"
                        value={guardian}
                        onChange={(e) => setGuardian(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select...</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black uppercase text-muted-foreground block">Residential Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Cox's Bazar"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}

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
                <span>{editUserObj ? "Update Account" : "Create Account"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
