export const kowriConfig = {
  baseUrl: process.env.KOWRI_BASE_URL || "https://api.kowri.com/v1",
  apiKey: process.env.KOWRI_API_KEY,
  merchantId: process.env.KOWRI_MERCHANT_ID,
  webhookSecret: process.env.KOWRI_WEBHOOK_SECRET,
  currency: "GHS",
};