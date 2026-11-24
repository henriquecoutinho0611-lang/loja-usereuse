const apiOrigin = import.meta.env["VITE_API_ORIGIN"] || "";

export const environment = {
  apiBaseUrl: import.meta.env["VITE_API_BASE_URL"] || "/api",
  apiOrigin,
  whatsappNumber: import.meta.env["VITE_WHATSAPP_NUMBER"] || "",
};
