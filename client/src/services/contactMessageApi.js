import { createApiUrl } from "../config/apiConfig";

const REQUEST_TIMEOUT_IN_MILLISECONDS = 15000;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getRetryAfterSeconds(response) {
  const retryAfterValue = response.headers.get("retry-after");

  if (!retryAfterValue) {
    return null;
  }

  const numericSeconds = Number(retryAfterValue);

  if (Number.isFinite(numericSeconds) && numericSeconds >= 0) {
    return Math.ceil(numericSeconds);
  }

  const retryDate = Date.parse(retryAfterValue);

  if (Number.isNaN(retryDate)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryDate - Date.now()) / 1000));
}

function createResponseError(response, responseData) {
  const isRateLimited = response.status === 429;

  const fallbackMessage = isRateLimited
    ? "Too many project enquiries were submitted. Please wait before trying again."
    : "Your project enquiry could not be submitted.";

  const responseMessage =
    typeof responseData.message === "string" ? responseData.message.trim() : "";

  const requestError = new Error(responseMessage || fallbackMessage);

  requestError.name = "ContactMessageApiError";

  requestError.status = response.status;

  requestError.fieldErrors = isPlainObject(responseData.errors)
    ? responseData.errors
    : {};

  const retryAfterSeconds = getRetryAfterSeconds(response);

  if (retryAfterSeconds !== null) {
    requestError.retryAfterSeconds = retryAfterSeconds;
  }

  return requestError;
}

async function submitContactMessage(messageData) {
  const abortController = new AbortController();

  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_IN_MILLISECONDS);

  try {
    const response = await fetch(createApiUrl("/api/contact-messages"), {
      method: "POST",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify(messageData),

      signal: abortController.signal,
    });

    const responseData = await readJsonResponse(response);

    if (!response.ok) {
      throw createResponseError(response, responseData);
    }

    return responseData;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(
        "The server is taking too long to respond. Please check your connection and try again.",
      );

      timeoutError.code = "REQUEST_TIMEOUT";

      throw timeoutError;
    }

    if (error?.name === "ContactMessageApiError") {
      throw error;
    }

    const networkError = new Error(
      "Unable to connect to the server. Please check your internet connection and try again.",
    );

    networkError.code = "NETWORK_ERROR";

    throw networkError;
  } finally {
    clearTimeout(timeoutId);
  }
}

export { submitContactMessage };
