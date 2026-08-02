import { createApiUrl } from "../config/apiConfig";

function extractStatistics(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  const possibleStatisticLists = [
    responseData?.data,
    responseData?.statistics,
    responseData?.data?.statistics,
    responseData?.result,
    responseData?.result?.statistics,
  ];

  return possibleStatisticLists.find(Array.isArray) || null;
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

export async function fetchPublicStatistics({ signal } = {}) {
  const response = await fetch(createApiUrl("/api/statistics"), {
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
        `Statistics request failed with status ${response.status}.`,
    );
  }

  if (response.status === 204) {
    return [];
  }

  if (responseData?.success === false) {
    throw new Error(
      responseData.message || "Statistics request was unsuccessful.",
    );
  }

  const statistics = extractStatistics(responseData);

  if (!statistics) {
    throw new Error("Statistics API returned an unsupported response format.");
  }

  return statistics;
}
