const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

async function submitContactMessage(messageData) {
  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/contact-messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      },
    );
  } catch {
    throw new Error(
      "Unable to connect to the server. Please try again.",
    );
  }

  let responseData = {};

  try {
    responseData = await response.json();
  } catch {
    responseData = {};
  }

  if (!response.ok) {
    const requestError = new Error(
      responseData.message ||
        "Your project enquiry could not be submitted.",
    );

    requestError.fieldErrors = responseData.errors || {};

    throw requestError;
  }

  return responseData;
}

export { submitContactMessage };