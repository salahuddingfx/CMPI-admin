import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Search, X, Loader2, Save, MapPin, Clock } from "lucide-react";
import { getEvents, createEvent, updateEvent, deleteEvent } from "../services/api";
import FileUpload from "../components/FileUpload";

interface Event {
  id: number;
  title: string;
  date: string;
  end_date?: string;
  time: string;
  venue: string;
  category: string;
  status: string;
  summary: string;
  details: string;
  image?: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [category, setCategory] = useState("Academic");
  const [status, setStatus] = useState("Upcoming");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const resetForm = () => {
    setTitle("");
    setDate("");
    setEndDate("");
    setTime("");
    setVenue("");
    setCategory("Academic");
    setStatus("Upcoming");
    setSummary("");
    setDetails("");
    setImageUrl("");
    setEditEvent(null);
    setShowForm(false);
  };

  const handleEditClick = (event: Event) => {
    setEditEvent(event);
    setTitle(event.title);
    setDate(event.date ? event.date.split("T")[0] : "");
    setEndDate(event.end_date ? event.end_date.split("T")[0] : "");
    setTime(event.time);
    setVenue(event.venue);
    setCategory(event.category);
    setStatus(event.status);
    setSummary(event.summary);
    setDetails(event.details);
    setImageUrl(event.image || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title,
      date,
      end_date: endDate || null,
      time,
      venue,
      category,
      status,
      summary,
      details,
      image: imageUrl || null,
    };

    try {
      if (editEvent) {
        await updateEvent(editEvent.id, payload);
      } else {
        await createEvent(payload);
      }
      resetForm();
      loadEvents();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save event. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await deleteEvent(id);
        loadEvents();
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to delete event");
      }
    }
  };

  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.venue.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Events Calendar Manager</h1>
          <p className="text-sm text-muted-foreground font-semibold">Organize and schedule institutional events, conferences, workshops, and sports meets</p>
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

      {/* Grid split layout if form visible */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Events listing */}
        <div className={`space-y-4 lg:col-span-2 ${showForm ? "lg:col-span-2" : "lg:col-span-3"}`}>
          {/* Search bar */}
          <div className="glass-card p-4 border flex items-center gap-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, venue, or category..."
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

          {/* List items */}
          {loading ? (
            <div className="flex justify-center items-center h-48 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <p className="text-sm font-semibold text-muted-foreground">No events found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredEvents.map((e) => (
                <div key={e.id} className="glass-card p-6 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition hover:shadow-md">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-primary border border-primary/20">
                        {e.category}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                          e.status === "Upcoming"
                            ? "bg-secondary/15 text-secondary-dark border-secondary/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {e.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold">{e.date}</span>
                    </div>
                    <h3 className="text-base font-black text-foreground">{e.title}</h3>
                    <p className="text-xs font-semibold text-muted-foreground line-clamp-2 leading-relaxed">{e.summary}</p>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>{e.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{e.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                    <button
                      onClick={() => handleEditClick(e)}
                      className="rounded-xl border border-border bg-card hover:bg-muted p-2.5 text-muted-foreground hover:text-foreground transition"
                      title="Edit Event"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive hover:text-white p-2.5 text-destructive transition"
                      title="Delete Event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event input form */}
        {showForm && (
          <div className="glass-card p-6 border space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">
                {editEvent ? "Edit Event" : "Create Event"}
              </h3>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Programming Contest"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Start Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">End Date (Optional)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Time Window</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10:00 AM - 4:00 PM"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 402, Lab 1"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Exhibition">Exhibition</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-muted-foreground block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Past">Past</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Short Summary</label>
                <textarea
                  required
                  rows={2}
                  placeholder="One sentence description"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-muted-foreground block">Detailed Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Event itinerary, guidelines or descriptions"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <FileUpload
                value={imageUrl}
                onChange={setImageUrl}
                folder="gallery"
                label="Cover Image"
                placeholder="e.g. /images/event-programming.jpg"
              />

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
                <span>{editEvent ? "Update Event" : "Save Event"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
