const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

/*
 * Development:
 * VITE_API_URL missing ho to local backend use hoga.
 *
 * Production:
 * Empty base URL same-origin requests banayega:
 * /api/services
 * /api/projects
 * /api/companies
 */
const defaultApiUrl = import.meta.env.DEV ? "http://localhost:5000" : "";

const API_URL = (configuredApiUrl || defaultApiUrl).replace(/\/+$/, "");

function createApiUrl(pathname) {
  const safePath = String(pathname || "").trim();

  if (!safePath) {
    return API_URL;
  }

  const normalizedPath = safePath.startsWith("/") ? safePath : `/${safePath}`;

  return `${API_URL}${normalizedPath}`;
}

export { API_URL, createApiUrl };

export default API_URL;
