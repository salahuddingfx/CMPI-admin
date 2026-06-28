import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, Calendar } from "lucide-react";
import {
  getAcademicCalendar,
  createAcademicCalendarItem,
  updateAcademicCalendarItem,
  deleteAcademicCalendarItem
} from "../services/api";

interface CalendarEvent {
  id: number;
  title: string;
  event_date: string;
  end_date: string | null;
  category: "exam" | "holiday" | "event" | "meeting" | "deadline" | "other";
  description: string | null;
  is_holiday: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  exam: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200",
  holiday: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200",
  event: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200",
  meeting: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200",
  deadline: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-200",
};

export default function AcademicCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CalendarEvent["category"]>("event");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getAcademicCalendar();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load academic calendar events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setCategory("event");
    setEventDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setDescription("");
    setIsHoliday(false);
    setEditEvent(null);
    setShowForm(false);
  };

  const handleEditClick = (event: CalendarEvent) => {
    setEditEvent(event);
    setTitle(event.title);
    setCategory(event.category);
    setEventDate(event.event_date ? event.event_date.split("T")[0] : "");
    setEndDate(event.end_date ? event.end_date.split("T")[0] : "");
    setDescription(event.description || "");
    setIsHoliday(event.is_holiday);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      category,
      event_date: eventDate,
      end_date: endDate || null,
      description: description || null,
      is_holiday: isHoliday,
    };

    try {
      if (editEvent) {
        await updateAcademicCalendarItem(editEvent.id, payload);
      } else {
        await createAcademicCalendarItem(payload);
      }
      resetForm();
      loadEvents();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save calendar event. Please verify all inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await window.customConfirm("Are you sure you want to delete this calendar event?")) {
      try {
        await deleteAcademicCalendarItem(id);
        loadEvents();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete calendar event");
      }
    }
  };

  const filteredEvents = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Academic Calendar Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Define exams, public holidays, campus events and administrative deadlines</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black shadow-lg shadow-primary/25 px-4 py-2.5 text-sm transition"
        >
          <Plus className="h-5 w-5" />
          <span>New Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Events list */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title or category..."
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

          {/* List display */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No calendar events found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((ev) => (
                <div key={ev.id} className="glass-card p-6 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition hover:shadow-md">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${CATEGORY_COLORS[ev.category] || ""}`}>
                        {ev.category}
                      </span>
                      {ev.is_holiday && (
                        <span className="inline-flex rounded-full bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 px-2 py-0.5 text-[10px] font-black uppercase border border-green-200">
                          Holiday
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-black text-foreground">{ev.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{ev.event_date}</span>
                      {ev.end_date && ev.end_date !== ev.event_date && (
                        <span> – {ev.end_date}</span>
                      )}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 font-medium">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
                    <button
                      onClick={() => handleEditClick(ev)}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal-like Edit/Create Form on the right side if visible */}
        {showForm && (
          <div className="glass-card p-6 border space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-foreground">
                {editEvent ? "Edit Event" : "Create Event"}
              </h2>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1st Semester Mid-Term Exam"
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="exam">Examination</option>
                    <option value="holiday">Holiday</option>
                    <option value="event">Campus Event</option>
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Is Holiday?</label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      id="isHoliday"
                      checked={isHoliday}
                      onChange={(e) => setIsHoliday(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary/20 border-input rounded"
                    />
                    <label htmlFor="isHoliday" className="ml-2 text-sm font-semibold text-foreground">Yes, no classes</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details, guidelines or notes..."
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-black py-2.5 text-sm transition disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{editEvent ? "Update Event" : "Publish Event"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
