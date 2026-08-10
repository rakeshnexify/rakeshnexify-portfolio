import { createApiUrl } from "../config/apiConfig";

const SERVICE_ORDERS_PATH = "/api/service-orders";

async function readApiResponse(response) {
  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      responseData?.message ||
        `Service Order request failed with status ${response.status}.`,
    );

    error.status = response.status;
    error.fieldErrors = responseData?.fieldErrors || {};

    throw error;
  }

  if (!responseData?.success) {
    throw new Error("Service Order API returned an invalid response.");
  }

  return responseData;
}

async function createServiceOrder(orderData) {
  const response = await fetch(createApiUrl(SERVICE_ORDERS_PATH), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const responseData = await readApiResponse(response);

  return {
    message: responseData.message,
    order: responseData.data,
  };
}

export { createServiceOrder };
