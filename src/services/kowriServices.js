import axios from "axios";
import { kowriConfig } from "../config/kowri.js";

class KowriService {
  constructor() {
    this.client = axios.create({
      baseURL: kowriConfig.baseUrl,
      headers: {
        "Authorization": `Bearer ${kowriConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  /**
   * Initialize payment with Kowri
   */
  async initializePayment(paymentData) {
    try {
      const payload = {
        merchant_id: kowriConfig.merchantId,
        amount: paymentData.amount,
        currency: kowriConfig.currency,
        order_id: paymentData.orderId,
        customer_email: paymentData.customerEmail,
        customer_name: paymentData.customerName,
        customer_phone: paymentData.customerPhone,
        description: paymentData.description,
        callback_url: `${process.env.BASE_URL}/api/payments/kowri/webhook`,
        return_url: `${process.env.FRONTEND_URL}/order-success/${paymentData.orderId}`,
        cancel_url: `${process.env.FRONTEND_URL}/order-failed/${paymentData.orderId}`,
        metadata: {
          orderNumber: paymentData.orderNumber,
          items: paymentData.items,
        },
      };

      const response = await this.client.post("/payments/initialize", payload);
      
      return {
        success: true,
        paymentUrl: response.data.data.payment_url,
        paymentReference: response.data.data.reference,
        checkoutUrl: response.data.data.checkout_url,
      };
    } catch (error) {
      console.error("❌ Kowri payment initialization error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || "Payment initialization failed",
      };
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference) {
    try {
      const response = await this.client.get(`/payments/verify/${reference}`);
      
      return {
        success: true,
        status: response.data.data.status,
        paymentData: response.data.data,
      };
    } catch (error) {
      console.error("❌ Kowri payment verification error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || "Payment verification failed",
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(reference, amount) {
    try {
      const payload = {
        reference,
        amount: amount || null,
      };

      const response = await this.client.post("/payments/refund", payload);
      
      return {
        success: true,
        refundData: response.data.data,
      };
    } catch (error) {
      console.error("❌ Kowri refund error:", error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || "Refund failed",
      };
    }
  }
}

export default new KowriService();