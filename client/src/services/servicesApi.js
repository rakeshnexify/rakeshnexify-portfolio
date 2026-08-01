import { createApiUrl } from "../config/apiConfig";

function extractServices(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleServiceLists = [
    responseData?.data,
    responseData?.services,
    responseData?.data?.services,
    responseData?.result,
    responseData?.result?.services,
  ];

  return possibleServiceLists.find(Array.isArray) || null;
}

async function readResponseData(response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}

export async function fetchPublicServices({ signal } = {}) {
  const response = await fetch(createApiUrl("/api/services"), {
    method: "GET",

    headers: {
      Accept: "application/json",
    },

    signal,
  });

  const responseData = await readResponseData(response);

  if (!response.ok) {
    throw new Error(
      responseData?.message ||
        `Services request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || "Services request was unsuccessful.",
    );
  }

  const services = extractServices(responseData);

  if (!services) {
    throw new Error("Services API returned an unsupported response format.");
  }

  return services;
}
