import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000, // 60 seconds default timeout (wakes up slow/sleeping server)
});

// Request interceptor to automatically add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper to determine if an error is retryable
const isRetryableError = (error) => {
  // Connection aborted / timeout (e.g. ECONNABORTED)
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return true;
  }
  // If there's no response (network error, offline, CORS issues, DNS lookup fail)
  if (!error.response) {
    return true;
  }
  // 5xx Server Errors (like 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
  // which are very common when a server is boot-looping, waking up, or overloaded
  const status = error.response.status;
  return status >= 500 && status <= 599;
};

// Response interceptor to handle silent retries
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config } = error;

    // If config doesn't exist, or we shouldn't retry this error, reject
    if (!config || !isRetryableError(error)) {
      return Promise.reject(error);
    }

    const maxRetries = 3;
    const retryDelay = 3000; // 3 seconds

    config.__retryCount = config.__retryCount || 0;

    // If we have retried enough times, fail the request
    if (config.__retryCount >= maxRetries) {
      return Promise.reject(error);
    }

    // Increment retry count
    config.__retryCount += 1;

    // Wait for the retry delay
    await new Promise((resolve) => setTimeout(resolve, retryDelay));

    console.warn(
      `Retrying request to ${config.url} (Attempt ${config.__retryCount}/${maxRetries}) due to connection issue: ${error.message}`
    );

    // Re-run the request
    return apiClient(config);
  }
);

export default apiClient;
