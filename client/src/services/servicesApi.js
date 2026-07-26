const configuredApiUrl =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_URL = configuredApiUrl.replace(/\/+$/, "");

export async function fetchPublicServices({ signal } = {}) {
  const response = await fetch(`${API_URL}/api/services`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Services request failed with status ${response.status}.`,
    );
  }

  if (!responseData?.success || !Array.isArray(responseData?.data)) {
    throw new Error("Services API returned an invalid response.");
  }

  return responseData.data;
}
