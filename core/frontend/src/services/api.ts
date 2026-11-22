import axios, { type AxiosRequestConfig } from "axios"

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, "")
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname.includes("onrender.com")) {
      return "https://mokarrar-backend.onrender.com"
    }
  }
  return "http://localhost:8000"
}

const BASE_URL = getApiBaseUrl()

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30s timeout for Render cold starts
})

// Auto-authenticate helper for seamless access & testing
let authPromise: Promise<string | null> | null = null

export const ensureAuthToken = async (): Promise<string | null> => {
  const existingToken = localStorage.getItem("access_token")
  if (existingToken) return existingToken

  if (authPromise) return authPromise

  authPromise = (async () => {
    try {
      const formData = new URLSearchParams()
      formData.append("username", "admin@mokarrar.com")
      formData.append("password", "MokarrarAdmin2026!")

      const res = await axios.post(`${BASE_URL}/api/v1/login/access-token`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 25000,
      })

      if (res.data?.access_token) {
        localStorage.setItem("access_token", res.data.access_token)
        return res.data.access_token
      }
    } catch (err) {
      console.warn("Auto-token acquisition notice:", err)
    } finally {
      authPromise = null
    }
    return null
  })()

  return authPromise
}

// Attach Bearer token to all requests
apiClient.interceptors.request.use(async (config) => {
  let token = localStorage.getItem("access_token")
  if (!token && !config.url?.includes("/login/access-token")) {
    token = await ensureAuthToken()
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors & automatic retry on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/login/access-token")
    ) {
      originalRequest._retry = true
      localStorage.removeItem("access_token")
      const newToken = await ensureAuthToken()
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      }
    }
    return Promise.reject(error)
  }
)

// ==========================================
// API DOMAIN CLIENTS
// ==========================================

export const api = {
  // Tasks (Plane Proxy)
  tasks: {
    list: async (params?: { state?: string; search?: string }) => {
      const res = await apiClient.get("/tasks/", { params })
      return res.data
    },
    get: async (id: string) => {
      const res = await apiClient.get(`/tasks/${id}`)
      return res.data
    },
    create: async (data: {
      title: string
      description?: string
      priority?: string
      state?: string
      assignee_name?: string
      due_date?: string
      tags?: string[]
    }) => {
      const res = await apiClient.post("/tasks/", data)
      return res.data
    },
    update: async (id: string, updates: Record<string, any>) => {
      const res = await apiClient.patch(`/tasks/${id}`, updates)
      return res.data
    },
    delete: async (id: string) => {
      const res = await apiClient.delete(`/tasks/${id}`)
      return res.data
    },
    getStates: async () => {
      const res = await apiClient.get("/tasks/states")
      return res.data
    },
    getMembers: async () => {
      const res = await apiClient.get("/tasks/members")
      return res.data
    },
    getSummary: async () => {
      const res = await apiClient.get("/tasks/stats/summary")
      return res.data
    },
    addComment: async (taskId: string, content: string) => {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, { content })
      return res.data
    },
  },

  // Procurement (Phase 2)
  procurement: {
    list: async (status?: string) => {
      const res = await apiClient.get("/procurement/requests", { params: { status } })
      return res.data
    },
    get: async (id: string) => {
      const res = await apiClient.get(`/procurement/requests/${id}`)
      return res.data
    },
    create: async (data: {
      title: string
      department: string
      priority: string
      justification: string
      items: Array<{
        item_name: string
        quantity: number
        unit: string
        estimated_unit_price: number
        part_number?: string
      }>
    }) => {
      const res = await apiClient.post("/procurement/requests", data)
      return res.data
    },
    approve: async (id: string, comment?: string) => {
      const res = await apiClient.post(`/procurement/requests/${id}/approve`, { comment })
      return res.data
    },
    reject: async (id: string, comment?: string) => {
      const res = await apiClient.post(`/procurement/requests/${id}/reject`, { comment })
      return res.data
    },
    markPaid: async (id: string) => {
      const res = await apiClient.post(`/procurement/requests/${id}/mark-paid`)
      return res.data
    },
  },

  // Inventory (Phase 3 InvenTree Proxy)
  inventory: {
    listParts: async (search?: string) => {
      const res = await apiClient.get("/inventory/parts", { params: { search } })
      return res.data
    },
    listTransactions: async () => {
      const res = await apiClient.get("/inventory/transactions")
      return res.data
    },
    stockIn: async (data: {
      part_id: string
      quantity: number
      batch?: string
      receiver?: string
      location?: string
      notes?: string
    }) => {
      const res = await apiClient.post("/inventory/stock-in", data)
      return res.data
    },
    stockOut: async (data: {
      part_id: string
      quantity: number
      requester?: string
      notes?: string
    }) => {
      const res = await apiClient.post("/inventory/stock-out", data)
      return res.data
    },
    getKpis: async () => {
      const res = await apiClient.get("/inventory/stats/kpi")
      return res.data
    },
  },

  // Dashboard Executive KPIs
  dashboard: {
    getKpis: async () => {
      const res = await apiClient.get("/dashboard/kpis")
      return res.data
    },
  },

  // File Exports Helper
  exports: {
    downloadTasksExcel: () => downloadFile("/exports/tasks/excel", "mokarrar_tasks.xlsx"),
    downloadTasksDocx: () => downloadFile("/exports/tasks/docx", "mokarrar_tasks_report.docx"),
    downloadProcurementExcel: () => downloadFile("/exports/procurement/excel", "mokarrar_procurement.xlsx"),
    downloadInventoryExcel: () => downloadFile("/exports/inventory/excel", "mokarrar_inventory.xlsx"),
  },
}

async function downloadFile(endpoint: string, defaultFilename: string) {
  try {
    const res = await apiClient.get(endpoint, { responseType: "blob" })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", defaultFilename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Export download failed:", err)
    alert("خطا در دانلود فایل خروجی. لطفا مجددا تلاش فرمایید.")
  }
}
