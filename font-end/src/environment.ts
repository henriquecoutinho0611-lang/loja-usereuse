const apiOrigin = import.meta.env["VITE_API_ORIGIN"] || (import.meta.env.DEV ? "https://localhost:8443" : "");

export const environment = {
  apiBaseUrl: import.meta.env["VITE_API_BASE_URL"] || (import.meta.env.DEV ? `${apiOrigin}/api` : "/api"),
  apiOrigin,
  whatsappNumber: import.meta.env["VITE_WHATSAPP_NUMBER"] || "",
};
