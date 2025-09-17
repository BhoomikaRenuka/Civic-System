const API_BASE_URL = "http://localhost:5000"
const ADMIN_API_BASE_URL = "http://localhost:5001"

export interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
}

export interface AuthResponse {
  message: string
  access_token: string
  user: User
}

export interface ApiError {
  error: string
}

class ApiClient {
  private getAuthHeaders(base: "user" | "admin" = "user") {
    const token = base === "admin" ? localStorage.getItem("token_admin") : localStorage.getItem("token_user")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  async post<T>(endpoint: string, data: any, base: "user" | "admin" = "user"): Promise<T> {
    const baseUrl = base === "admin" ? ADMIN_API_BASE_URL : API_BASE_URL
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: this.getAuthHeaders(base),
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "An error occurred")
    }

    return result
  }

  async get<T>(endpoint: string, params?: Record<string, string>, base: "user" | "admin" = "user"): Promise<T> {
    const baseUrl = base === "admin" ? ADMIN_API_BASE_URL : API_BASE_URL
    const url = new URL(`${baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(base),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "An error occurred")
    }

    return result
  }

  async postFormData<T>(endpoint: string, formData: FormData, base: "user" | "admin" = "user"): Promise<T> {
    const token = base === "admin" ? localStorage.getItem("token_admin") : localStorage.getItem("token_user")
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const baseUrl = base === "admin" ? ADMIN_API_BASE_URL : API_BASE_URL
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || "An error occurred")
    }

    return result
  }
}

export const api = new ApiClient()

// Auth API functions
export const authApi = {
  register: (data: { name: string; email: string; password: string }) => api.post<AuthResponse>("/register", data),

  login: (data: { email: string; password: string }) => api.post<AuthResponse>("/login", data),
}

// Issues API functions
export const issuesApi = {
  submitReport: (formData: FormData) => api.postFormData<{ message: string; issue_id: string }>("/report", formData),

  getMyReports: () => api.get<{ issues: any[] }>("/myreports"),

  getAllIssues: (params?: { category?: string; status?: string }) => api.get<{ issues: any[] }>("/issues", params),

  getAdminReports: (params?: { category?: string; status?: string; location?: string }) =>
    api.get<{ issues: any[] }>("/admin/reports", params, "admin"),

  updateIssueStatus: (data: { issue_id: string; status: string }) =>
    api.post<{ message: string }>("/admin/update", data, "admin"),
}

// Notifications API functions
export interface NotificationItem {
  _id: string
  user_id: string
  type: string
  title: string
  message: string
  issue_id?: string
  status?: string
  read: boolean
  created_at: string
}

export const notificationsApi = {
  getNotifications: (params?: { limit?: string }) =>
    api.get<{ notifications: NotificationItem[]; unread_count: number }>("/notifications", params),
  markRead: (ids?: string[]) => api.post<{ updated: number }>("/notifications/mark-read", { ids }),
}
