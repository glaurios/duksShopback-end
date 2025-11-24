export const kowriConfig = {
 baseUrl: process.env.KOWRI_BASE_URL || "https://posapi.kowri.app/",
  apiKey: process.env.KOWRI_API_KEY,
  merchantId: process.env.KOWRI_MERCHANT_ID,
  webhookSecret: process.env.KOWRI_WEBHOOK_SECRET,
  currency: "GHS",
};