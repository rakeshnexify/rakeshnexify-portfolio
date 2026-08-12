import { createApiUrl } from "../config/apiConfig.js";

const REQUEST_TIMEOUT_MS = 15000;

function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function parseRetryAfter(value) {
  if (!value) {
    return null;
  }

  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    numericValue >= 0
  ) {
    return Math.ceil(numericValue);
  }

  const retryDate = new Date(value);

  if (Number.isNaN(retryDate.getTime())) {
    return null;
  }

  const seconds = Math.ceil(
    (retryDate.getTime() - Date.now()) / 1000,
  );

  return seconds > 0 ? seconds : 0;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function createSubscriberApiError(
  message,
  {
    status = 0,
    fieldErrors = {},
    retryAfterSeconds = null,
    code = "",
    cause,
  } = {},
) {
  const error = new Error(message);

  error.name = "SubscriberApiError";
  error.status = status;
  error.fieldErrors = isPlainObject(fieldErrors)
    ? fieldErrors
    : {};
  error.retryAfterSeconds =
    retryAfterSeconds;
  error.code = code;

  if (cause !== undefined) {
    error.cause = cause;
  }

  return error;
}

function createCombinedSignal(
  callerSignal,
  timeoutController,
) {
  if (!callerSignal) {
    return {
      signal: timeoutController.signal,
      cleanup() {},
    };
  }

  if (callerSignal.aborted) {
    timeoutController.abort();

    return {
      signal: timeoutController.signal,
      cleanup() {},
    };
  }

  const handleCallerAbort = () => {
    timeoutController.abort();
  };

  callerSignal.addEventListener(
    "abort",
    handleCallerAbort,
    {
      once: true,
    },
  );

  return {
    signal: timeoutController.signal,
    cleanup() {
      callerSignal.removeEventListener(
        "abort",
        handleCallerAbort,
      );
    },
  };
}

async function submitSubscriber(
  payload,
  {
    signal: callerSignal,
  } = {},
) {
  const timeoutController =
    new AbortController();

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, REQUEST_TIMEOUT_MS);

  const {
    signal,
    cleanup,
  } = createCombinedSignal(
    callerSignal,
    timeoutController,
  );

  try {
    const response = await fetch(
      createApiUrl("/api/subscribers"),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      },
    );

    const responseData =
      await parseJsonResponse(response);

    if (!response.ok) {
      const retryAfterSeconds =
        parseRetryAfter(
          response.headers.get("Retry-After"),
        );

      let fallbackMessage =
        "Unable to submit the newsletter subscription.";

      if (response.status === 429) {
        fallbackMessage =
          "Too many newsletter subscription requests were sent. Please wait a few minutes and try again.";
      } else if (response.status >= 500) {
        fallbackMessage =
          "The newsletter subscription service is temporarily unavailable. Please try again.";
      }

      throw createSubscriberApiError(
        typeof responseData?.message ===
          "string" &&
          responseData.message.trim()
          ? responseData.message.trim()
          : fallbackMessage,
        {
          status: response.status,
          fieldErrors:
            responseData?.fieldErrors,
          retryAfterSeconds,
        },
      );
    }

    if (
      !responseData ||
      responseData.success !== true
    ) {
      throw createSubscriberApiError(
        "The newsletter subscription service returned an unexpected response.",
        {
          status: response.status,
          code: "INVALID_RESPONSE",
        },
      );
    }

    return {
      message:
        typeof responseData.message ===
          "string" &&
        responseData.message.trim()
          ? responseData.message.trim()
          : "Your newsletter subscription request has been received.",
    };
  } catch (error) {
    if (
      error?.name ===
      "SubscriberApiError"
    ) {
      throw error;
    }

    if (timeoutController.signal.aborted) {
      if (callerSignal?.aborted) {
        throw createSubscriberApiError(
          "The newsletter subscription request was cancelled.",
          {
            code: "ABORTED",
            cause: error,
          },
        );
      }

      throw createSubscriberApiError(
        "The newsletter subscription request timed out. Please try again.",
        {
          code: "TIMEOUT",
          cause: error,
        },
      );
    }

    throw createSubscriberApiError(
      "Unable to connect to the newsletter subscription service. Please check your connection and try again.",
      {
        code: "NETWORK_ERROR",
        cause: error,
      },
    );
  } finally {
    clearTimeout(timeoutId);
    cleanup();
  }
}

export {
  REQUEST_TIMEOUT_MS,
  submitSubscriber,
};
