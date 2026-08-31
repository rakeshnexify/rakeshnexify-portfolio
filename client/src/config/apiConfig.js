const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

/*
 * Development:
 * Configure VITE_API_URL in the local client environment.
 *
 * Production:
 * Empty VITE_API_URL intentionally uses same-origin requests:
 * /api/services
 * /api/projects
 * /api/companies
 */
const API_URL = configuredApiUrl.replace(/\/+$/, "");

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
