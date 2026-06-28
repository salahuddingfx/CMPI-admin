import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cmpi-admin-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("cmpi-admin-token");
      localStorage.removeItem("cmpi-admin-user");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Auth
export async function login(email: string, password: string) {
  const response = await api.post("/login", { email, password });
  if (response.data.user?.role !== "admin") {
    throw new Error("Unauthorized. Admin role required.");
  }
  localStorage.setItem("cmpi-admin-token", response.data.token);
  localStorage.setItem("cmpi-admin-user", JSON.stringify(response.data.user));
  return response.data;
}

export async function logout() {
  try {
    await api.post("/logout");
  } catch (e) {
    console.error("Logout request failed", e);
  } finally {
    localStorage.removeItem("cmpi-admin-token");
    localStorage.removeItem("cmpi-admin-user");
  }
}

export async function getAdminUser() {
  const response = await api.get("/user");
  return response.data;
}

// Institute management
export async function getInstitute() {
  const response = await api.get("/institute");
  return response.data.institute;
}
export async function updateInstitute(data: any) {
  const response = await api.put("/institute", data);
  return response.data;
}
export async function getChartData() {
  const response = await api.get("/institute/chart-data");
  return response.data;
}

// Notice management
export async function getNotices() {
  const response = await api.get("/notices");
  return response.data;
}
export async function createNotice(data: any) {
  const response = await api.post("/notices", data);
  return response.data;
}
export async function updateNotice(id: number, data: any) {
  const response = await api.put(`/notices/${id}`, data);
  return response.data;
}
export async function deleteNotice(id: number) {
  const response = await api.delete(`/notices/${id}`);
  return response.data;
}

// Event management
export async function getEvents() {
  const response = await api.get("/events");
  return response.data;
}
export async function createEvent(data: any) {
  const response = await api.post("/events", data);
  return response.data;
}
export async function updateEvent(id: number, data: any) {
  const response = await api.put(`/events/${id}`, data);
  return response.data;
}
export async function deleteEvent(id: number) {
  const response = await api.delete(`/events/${id}`);
  return response.data;
}

// Blog management
export async function getBlogs() {
  const response = await api.get("/blogs");
  return response.data;
}
export async function createBlog(data: any) {
  const response = await api.post("/blogs", data);
  return response.data;
}
export async function updateBlog(id: number, data: any) {
  const response = await api.put(`/blogs/${id}`, data);
  return response.data;
}
export async function deleteBlog(id: number) {
  const response = await api.delete(`/blogs/${id}`);
  return response.data;
}

// Faculty management
export async function getFaculty() {
  const response = await api.get("/faculty");
  return response.data;
}
export async function createFaculty(data: any) {
  const response = await api.post("/faculty", data);
  return response.data;
}
export async function updateFaculty(id: number, data: any) {
  const response = await api.put(`/faculty/${id}`, data);
  return response.data;
}
export async function deleteFaculty(id: number) {
  const response = await api.delete(`/faculty/${id}`);
  return response.data;
}

// Department management
export async function getDepartments() {
  const response = await api.get("/departments");
  return response.data;
}
export async function createDepartment(data: any) {
  const response = await api.post("/departments", data);
  return response.data;
}
export async function updateDepartment(id: number, data: any) {
  const response = await api.put(`/departments/${id}`, data);
  return response.data;
}
export async function deleteDepartment(id: number) {
  const response = await api.delete(`/departments/${id}`);
  return response.data;
}

// Admissions management
export async function getAdmissions() {
  const response = await api.get("/admissions");
  return response.data;
}
export async function updateAdmissionStatus(id: number, status: string) {
  const response = await api.put(`/admissions/${id}/status`, { status });
  return response.data;
}

// User management
export async function getUsers() {
  const response = await api.get("/users");
  return response.data;
}
export async function createUser(data: any) {
  const response = await api.post("/users", data);
  return response.data;
}
export async function updateUser(id: number, data: any) {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}
export async function deleteUser(id: number) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

// Social links management
export async function getSocialLinks() {
  const response = await api.get("/social-links");
  return response.data;
}
export async function createSocialLink(data: any) {
  const response = await api.post("/social-links", data);
  return response.data;
}
export async function updateSocialLink(id: number, data: any) {
  const response = await api.put(`/social-links/${id}`, data);
  return response.data;
}
export async function deleteSocialLink(id: number) {
  const response = await api.delete(`/social-links/${id}`);
  return response.data;
}

// Bteb results management
export async function importBtebResults(data: { results: any[] }) {
  const response = await api.post("/bteb-results/import", data);
  return response.data;
}
export async function importBtebResultsFromDrive(data: {
  drive_url: string;
  semester?: string;
  regulation?: string;
  holding_year?: string;
}) {
  const response = await api.post("/bteb-results/import-drive", data, { timeout: 30000 });
  return response.data;
}
export async function getImportJobStatus(jobId: number) {
  const response = await api.get(`/bteb-results/import-status/${jobId}`);
  return response.data;
}
export async function getBtebStats() {
  const response = await api.get("/bteb-results/stats");
  return response.data;
}

// Institute results management
export async function searchInstituteResults(roll: string) {
  const response = await api.get(`/institute-results/search?roll=${roll}`);
  return response.data;
}
export async function getInstituteResultsStats() {
  const response = await api.get("/institute-results/stats");
  return response.data;
}
export async function uploadInstituteCsv(formData: FormData) {
  const response = await api.post("/institute-results/upload-csv", formData);
  return response.data;
}
export async function uploadInstitutePdf(formData: FormData) {
  const response = await api.post("/institute-results/upload-pdf", formData);
  return response.data;
}
export async function addInstituteResult(data: {
  roll: string;
  semester: string;
  academic_year: string;
  status: string;
  referred_subjects?: string[];
}) {
  const response = await api.post("/institute-results/manual", data);
  return response.data;
}
export async function deleteInstituteResult(id: number) {
  const response = await api.delete(`/institute-results/${id}`);
  return response.data;
}

// Dashboard stats
export async function getDashboardStats() {
  const [users, admissions, notices, events, blogs, faculty, departments] = await Promise.all([
    getUsers(),
    getAdmissions(),
    getNotices(),
    getEvents(),
    getBlogs(),
    getFaculty(),
    getDepartments()
  ]);

  return {
    usersCount: users.length,
    studentsCount: users.filter((u: any) => u.role === "student").length,
    adminsCount: users.filter((u: any) => u.role === "admin").length,
    admissionsCount: admissions.length,
    pendingAdmissionsCount: admissions.filter((a: any) => a.status === "Pending").length,
    noticesCount: notices.length,
    eventsCount: events.length,
    blogsCount: blogs.length,
    facultyCount: faculty.length,
    departmentsCount: departments.length,
    recentAdmissions: admissions.slice(0, 5),
    recentNotices: notices.slice(0, 5),
  };
}

// Class routines
export async function getClassRoutines(params?: { department?: string; semester?: string }) {
  const response = await api.get("/class-routines", { params });
  return response.data;
}
export async function uploadClassRoutine(formData: FormData) {
  const response = await api.post("/class-routines/upload", formData);
  return response.data;
}
export async function deleteClassRoutine(id: number) {
  const response = await api.delete(`/class-routines/${id}`);
  return response.data;
}

// Bills
export async function getBills(params?: Record<string, string>) {
  const response = await api.get("/bills", { params });
  return response.data;
}
export async function createBill(data: Record<string, any>) {
  const response = await api.post("/bills", data);
  return response.data;
}
export async function deleteBill(id: number) {
  const response = await api.delete(`/bills/${id}`);
  return response.data;
}
export async function markBillPaid(id: number, data?: Record<string, string>) {
  const response = await api.post(`/bills/${id}/mark-paid`, data);
  return response.data;
}
export async function getBillStats() {
  const response = await api.get("/bills/stats");
  return response.data;
}
export async function bulkCreateBills(data: Record<string, any>) {
  const response = await api.post("/bills/bulk", data);
  return response.data;
}
export async function bulkImportStudents(formData: FormData) {
  const response = await api.post("/users/bulk-import", formData);
  return response.data;
}

// Hero slides
export async function getHeroSlides() {
  const response = await api.get("/hero-slides/all");
  return response.data;
}
export async function createHeroSlide(data: Record<string, any>) {
  const response = await api.post("/hero-slides", data);
  return response.data;
}
export async function updateHeroSlide(id: number, data: Record<string, any>) {
  const response = await api.put(`/hero-slides/${id}`, data);
  return response.data;
}
export async function deleteHeroSlide(id: number) {
  const response = await api.delete(`/hero-slides/${id}`);
  return response.data;
}

// Subjects management
export async function getSubjects(params?: { department?: string; semester?: string }) {
  const response = await api.get("/subjects", { params });
  return response.data;
}
export async function createSubject(data: Record<string, any>) {
  const response = await api.post("/subjects", data);
  return response.data;
}
export async function updateSubject(id: number, data: Record<string, any>) {
  const response = await api.put(`/subjects/${id}`, data);
  return response.data;
}
export async function deleteSubject(id: number) {
  const response = await api.delete(`/subjects/${id}`);
  return response.data;
}

// Bills update
export async function updateBill(id: number, data: Record<string, any>) {
  const response = await api.put(`/bills/${id}`, data);
  return response.data;
}

// Class routine update
export async function updateClassRoutine(id: number, formData: FormData) {
  const response = await api.put(`/class-routines/${id}`, formData);
  return response.data;
}

// Institute results update
export async function updateInstituteResult(id: number, data: Record<string, any>) {
  const response = await api.put(`/institute-results/${id}`, data);
  return response.data;
}
 
// System status
export async function getSystemStatus() {
  const response = await api.get("/system/status");
  return response.data;
}

// Notifications
export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.post("/notifications/mark-read");
  return response.data;
}

export async function markNotificationRead(id: number | string) {
  const response = await api.post(`/notifications/${id}/mark-read`);
  return response.data;
}

// Gallery
export async function getGalleryAlbums() {
  const response = await api.get("/gallery-albums");
  return response.data;
}

export async function getGalleryAlbum(id: number) {
  const response = await api.get(`/gallery-albums/${id}`);
  return response.data;
}

export async function createGalleryAlbum(data: { title: string; description?: string; accent?: string; cover?: string }) {
  const response = await api.post("/gallery-albums", data);
  return response.data;
}

export async function updateGalleryAlbum(id: number, data: { title?: string; description?: string; accent?: string; cover?: string }) {
  const response = await api.put(`/gallery-albums/${id}`, data);
  return response.data;
}

export async function deleteGalleryAlbum(id: number) {
  const response = await api.delete(`/gallery-albums/${id}`);
  return response.data;
}

export async function uploadGalleryImages(id: number, data: { images: string[]; captions?: (string | null)[] }) {
  const response = await api.post(`/gallery-albums/${id}/images`, data);
  return response.data;
}

export async function deleteGalleryImage(albumId: number, imageId: number) {
  const response = await api.delete(`/gallery-albums/${albumId}/images/${imageId}`);
  return response.data;
}

// Cookie consents
export async function getCookieConsents(params?: Record<string, string>) {
  const response = await api.get("/cookie-consents", { params });
  return response.data;
}

export async function getCookieConsentStats() {
  const response = await api.get("/cookie-consents/stats");
  return response.data;
}

// Visit tracker
export async function getVisits(params?: Record<string, string>) {
  const response = await api.get("/visits", { params });
  return response.data;
}

export async function getVisitStats() {
  const response = await api.get("/visits/stats");
  const data = response.data;
  return data;
}

// Academic Calendar Management
export async function getAcademicCalendar(params?: Record<string, string | number>) {
  const response = await api.get("/academic-calendar", { params });
  return response.data;
}

export async function createAcademicCalendarItem(data: any) {
  const response = await api.post("/academic-calendar", data);
  return response.data;
}

export async function updateAcademicCalendarItem(id: number | string, data: any) {
  const response = await api.put(`/academic-calendar/${id}`, data);
  return response.data;
}

export async function deleteAcademicCalendarItem(id: number | string) {
  const response = await api.delete(`/academic-calendar/${id}`);
  return response.data;
}

// Feedback Moderation Management
export async function getFeedbacks(params?: Record<string, string | number>) {
  const response = await api.get("/feedbacks", { params });
  return response.data;
}

export async function approveFeedback(id: number | string) {
  const response = await api.patch(`/feedbacks/${id}/approve`);
  return response.data;
}

export async function rejectFeedback(id: number | string) {
  const response = await api.patch(`/feedbacks/${id}/reject`);
  return response.data;
}

export async function deleteFeedback(id: number | string) {
  const response = await api.delete(`/feedbacks/${id}`);
  return response.data;
}


