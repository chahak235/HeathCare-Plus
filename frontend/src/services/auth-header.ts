import axios from 'axios';

/** Header with the logged-in user's token, for fetch() calls. */
export function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/**
 * Attach the token to every request made with the default axios instance, so
 * pages that call protected API routes (bookings, patient data, doctor
 * settings) are recognised as the logged-in user. Requests that already set
 * an Authorization header keep theirs.
 */
export function installAuthHeader(): void {
  axios.interceptors.request.use((config) => {
    if (!config.headers.has('Authorization')) {
      const h = authHeaders();
      if (h.Authorization) config.headers.set('Authorization', h.Authorization);
    }
    return config;
  });
}
