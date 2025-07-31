import axios, { AxiosError } from "axios";
import { Alert } from "react-native";
import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentMethod,
  Order,
} from "../types";

// Hubtel API Configuration
const HUBTEL_BASE_URL =
  process.env.EXPO_PUBLIC_HUBTEL_BASE_URL || "https://api.hubtel.com/v1";
const HUBTEL_CLIENT_ID = process.env.EXPO_PUBLIC_HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_CLIENT_SECRET;

// Payment Configuration
const PAYMENT_CONFIG = {
  MOMO_CALLBACK_URL: `${process.env.EXPO_PUBLIC_API_BASE_URL}/webhooks/hubtel/momo`,
  CARD_CALLBACK_URL: `${process.env.EXPO_PUBLIC_API_BASE_URL}/webhooks/hubtel/card`,
  RETURN_URL: "chopcart://payment/success",
  CANCEL_URL: "chopcart://payment/cancel",
  TIMEOUT_MINUTES: 5,
};

// Error Messages
const ERROR_MESSAGES = {
  NETWORK_ERROR:
    "Network connection failed. Please check your internet connection.",
  INVALID_PHONE: "Invalid phone number format.",
  INSUFFICIENT_FUNDS: "Insufficient funds in your account.",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  PAYMENT_CANCELLED: "Payment was cancelled.",
  PAYMENT_TIMEOUT: "Payment timed out. Please try again.",
  INVALID_AMOUNT: "Invalid payment amount.",
  SERVICE_UNAVAILABLE: "Payment service is temporarily unavailable.",
  UNKNOWN_ERROR: "An unknown error occurred. Please try again.",
};

// Hubtel API Response Types
interface HubtelMoMoResponse {
  ResponseCode: string;
  Data: {
    TransactionId: string;
    ClientReference: string;
    Description: string;
    ExternalTransactionId: string;
    Amount: number;
    Charges: number;
    AmountCharged: number;
  };
  Message: string;
}

interface HubtelCardResponse {
  ResponseCode: string;
  Data: {
    CheckoutUrl: string;
    TransactionId: string;
    ClientReference: string;
    Description: string;
    Amount: number;
  };
  Message: string;
}

interface HubtelStatusResponse {
  ResponseCode: string;
  Data: {
    TransactionId: string;
    ClientReference: string;
    TransactionStatus: string;
    TransactionType: string;
    Description: string;
    Amount: number;
    Charges: number;
    AmountCharged: number;
    ExternalTransactionId?: string;
    CustomerMsisdn?: string;
    TransactionDate: string;
  };
  Message: string;
}

class PaymentService {
  private static instance: PaymentService;
  private authToken: string | null = null;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Get authentication token for Hubtel API
   */
  private getAuthHeader(): string {
    if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
      throw new Error("Hubtel credentials not configured");
    }

    const credentials = `${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  /**
   * Validate phone number for Ghana mobile money
   */
  private validatePhoneNumber(phoneNumber: string): boolean {
    // Ghana phone number formats: +233XXXXXXXXX, 0XXXXXXXXX
    const ghanaPhoneRegex = /^(\+233|0)[0-9]{9}$/;
    return ghanaPhoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for Hubtel API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Convert to international format
    if (cleaned.startsWith("0") && cleaned.length === 10) {
      return `233${cleaned.substring(1)}`;
    } else if (cleaned.startsWith("233") && cleaned.length === 12) {
      return cleaned;
    } else if (cleaned.length === 9) {
      return `233${cleaned}`;
    }

    return cleaned;
  }

  /**
   * Validate payment amount
   */
  private validateAmount(amount: number): boolean {
    const minAmount = parseFloat(
      process.env.EXPO_PUBLIC_MIN_ORDER_AMOUNT || "1",
    );
    const maxAmount = 10000; // GHS 10,000 limit

    return amount >= minAmount && amount <= maxAmount;
  }

  /**
   * Handle API errors and return user-friendly messages
   */
  private handlePaymentError(error: any): string {
    console.error("Payment error:", error);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          if (
            data.Message?.includes("phone") ||
            data.Message?.includes("msisdn")
          ) {
            return ERROR_MESSAGES.INVALID_PHONE;
          }
          if (data.Message?.includes("amount")) {
            return ERROR_MESSAGES.INVALID_AMOUNT;
          }
          return data.Message || ERROR_MESSAGES.TRANSACTION_FAILED;

        case 401:
          return "Authentication failed. Please contact support.";

        case 402:
          return ERROR_MESSAGES.INSUFFICIENT_FUNDS;

        case 403:
          return "Payment not authorized. Please try again.";

        case 408:
          return ERROR_MESSAGES.PAYMENT_TIMEOUT;

        case 429:
          return "Too many requests. Please wait a moment and try again.";

        case 500:
        case 502:
        case 503:
          return ERROR_MESSAGES.SERVICE_UNAVAILABLE;

        default:
          return data.Message || ERROR_MESSAGES.TRANSACTION_FAILED;
      }
    } else if (error.request) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }

  /**
   * Initiate Mobile Money payment
   */
  async initiateMoMoPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate inputs
      if (!this.validateAmount(request.amount)) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_AMOUNT,
        };
      }

      if (!this.validatePhoneNumber(request.customerNumber)) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_PHONE,
        };
      }

      const formattedPhone = this.formatPhoneNumber(request.customerNumber);

      const payload = {
        CustomerName: request.customerName,
        CustomerMsisdn: formattedPhone,
        CustomerEmail: `order-${request.orderId}@chopcart.com`,
        Channel: "mtn-gh", // Default to MTN, can be dynamic
        Amount: request.amount,
        PrimaryCallbackUrl: PAYMENT_CONFIG.MOMO_CALLBACK_URL,
        Description:
          request.description || `ChopCart Order #${request.orderId}`,
        ClientReference: request.orderId,
        FeesOnCustomer: true,
      };

      console.log("Initiating MoMo payment:", {
        ...payload,
        CustomerMsisdn: "***",
      });

      const response = await axios.post<HubtelMoMoResponse>(
        `${HUBTEL_BASE_URL}/merchantaccount/merchants/${HUBTEL_CLIENT_ID}/receive/mobilemoney`,
        payload,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 seconds timeout
        },
      );

      const { ResponseCode, Data, Message } = response.data;

      if (ResponseCode === "0000" || ResponseCode === "0001") {
        return {
          success: true,
          transactionId: Data.TransactionId,
          reference: Data.ClientReference,
          message:
            "Payment initiated successfully. Please complete on your phone.",
        };
      } else {
        return {
          success: false,
          message: Message || ERROR_MESSAGES.TRANSACTION_FAILED,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: this.handlePaymentError(error),
      };
    }
  }

  /**
   * Initiate Card payment
   */
  async initiateCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate amount
      if (!this.validateAmount(request.amount)) {
        return {
          success: false,
          message: ERROR_MESSAGES.INVALID_AMOUNT,
        };
      }

      const payload = {
        CustomerName: request.customerName,
        CustomerEmail: `order-${request.orderId}@chopcart.com`,
        Amount: request.amount,
        CallbackUrl: PAYMENT_CONFIG.CARD_CALLBACK_URL,
        ReturnUrl: PAYMENT_CONFIG.RETURN_URL,
        CancelUrl: PAYMENT_CONFIG.CANCEL_URL,
        Description:
          request.description || `ChopCart Order #${request.orderId}`,
        ClientReference: request.orderId,
        Logo: "https://chopcart.com/logo.png", // App logo URL
        FeesOnCustomer: true,
      };

      console.log("Initiating card payment:", payload);

      const response = await axios.post<HubtelCardResponse>(
        `${HUBTEL_BASE_URL}/merchantaccount/onlinecheckout/invoice/create`,
        payload,
        {
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const { ResponseCode, Data, Message } = response.data;

      if (ResponseCode === "0000") {
        return {
          success: true,
          checkoutUrl: Data.CheckoutUrl,
          transactionId: Data.TransactionId,
          reference: Data.ClientReference,
          message: "Card payment checkout created successfully.",
        };
      } else {
        return {
          success: false,
          message: Message || ERROR_MESSAGES.TRANSACTION_FAILED,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: this.handlePaymentError(error),
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    transactionId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      console.log("Checking payment status for transaction:", transactionId);

      const response = await axios.get<HubtelStatusResponse>(
        `${HUBTEL_BASE_URL}/merchantaccount/merchants/${HUBTEL_CLIENT_ID}/transactions/${transactionId}`,
        {
          headers: {
            Authorization: this.getAuthHeader(),
          },
          timeout: 15000,
        },
      );

      const { ResponseCode, Data, Message } = response.data;

      if (ResponseCode === "0000" && Data) {
        let status: "pending" | "successful" | "failed" = "pending";

        // Map Hubtel status to our status
        switch (Data.TransactionStatus?.toLowerCase()) {
          case "success":
          case "successful":
          case "completed":
            status = "successful";
            break;
          case "failed":
          case "declined":
          case "cancelled":
          case "expired":
            status = "failed";
            break;
          default:
            status = "pending";
        }

        return {
          status,
          message: Message || "Status retrieved successfully",
          transactionId: Data.TransactionId,
        };
      } else {
        return {
          status: "failed",
          message: Message || "Failed to retrieve payment status",
        };
      }
    } catch (error: any) {
      console.error("Payment status check error:", error);
      return {
        status: "failed",
        message: this.handlePaymentError(error),
      };
    }
  }

  /**
   * Process payment for an order
   */
  async processOrderPayment(
    order: Order,
    paymentMethod: PaymentMethod,
    customerData: {
      phone?: string;
      name: string;
    },
  ): Promise<PaymentResponse> {
    const request: PaymentRequest = {
      amount: order.total_amount,
      customerNumber: customerData.phone || "",
      customerName: customerData.name,
      orderId: order.id,
      description: `ChopCart Order #${order.order_number} - ${order.order_items?.length || 0} items`,
    };

    switch (paymentMethod) {
      case "momo":
        if (!customerData.phone) {
          return {
            success: false,
            message: "Phone number is required for Mobile Money payment",
          };
        }
        return this.initiateMoMoPayment(request);

      case "card":
        return this.initiateCardPayment(request);

      case "cash":
        // For cash payments, we just return success
        // The runner will handle cash collection
        return {
          success: true,
          message: "Cash payment selected. Pay runner on delivery.",
          reference: `CASH_${order.id}`,
        };

      default:
        return {
          success: false,
          message: "Invalid payment method selected",
        };
    }
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      // Implement webhook signature verification
      // This would involve HMAC verification with Hubtel's secret
      // For now, we'll return true but this should be implemented for production
      console.log("Webhook signature verification not implemented");
      return true;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Handle payment webhook callback
   */
  async handlePaymentWebhook(webhookData: any): Promise<{
    success: boolean;
    orderId?: string;
    status?: "successful" | "failed";
    message?: string;
  }> {
    try {
      console.log("Processing payment webhook:", webhookData);

      const { Data, ResponseCode, Message } = webhookData;

      if (!Data || !Data.ClientReference) {
        return {
          success: false,
          message: "Invalid webhook data",
        };
      }

      const orderId = Data.ClientReference;
      let status: "successful" | "failed" = "failed";

      // Determine payment status
      if (ResponseCode === "0000" && Data.TransactionStatus) {
        switch (Data.TransactionStatus.toLowerCase()) {
          case "success":
          case "successful":
          case "completed":
            status = "successful";
            break;
          default:
            status = "failed";
        }
      }

      return {
        success: true,
        orderId,
        status,
        message: Message || "Webhook processed successfully",
      };
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        message: "Failed to process webhook",
      };
    }
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): PaymentMethod[] {
    const methods: PaymentMethod[] = ["cash"]; // Cash is always supported

    if (process.env.EXPO_PUBLIC_ENABLE_CARD_PAYMENTS === "true") {
      methods.push("card");
    }

    // MoMo is enabled by default for Ghana
    methods.push("momo");

    return methods;
  }

  /**
   * Get payment method display information
   */
  getPaymentMethodInfo(method: PaymentMethod): {
    name: string;
    description: string;
    icon: string;
    enabled: boolean;
  } {
    const methodInfo = {
      momo: {
        name: "Mobile Money",
        description: "Pay with MTN, Vodafone, or AirtelTigo",
        icon: "phone-portrait",
        enabled: true,
      },
      card: {
        name: "Debit/Credit Card",
        description: "Pay with Visa, Mastercard, or Verve",
        icon: "card",
        enabled: process.env.EXPO_PUBLIC_ENABLE_CARD_PAYMENTS === "true",
      },
      cash: {
        name: "Cash on Delivery",
        description: "Pay with cash when your order arrives",
        icon: "cash",
        enabled: process.env.EXPO_PUBLIC_ENABLE_CASH_PAYMENTS === "true",
      },
    };

    return (
      methodInfo[method] || {
        name: "Unknown",
        description: "Unknown payment method",
        icon: "help",
        enabled: false,
      }
    );
  }

  /**
   * Cancel payment transaction
   */
  async cancelPayment(
    transactionId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Hubtel doesn't have a direct cancel API for initiated transactions
      // This would typically be handled on their end or through customer service
      console.log("Payment cancellation requested for:", transactionId);

      return {
        success: true,
        message: "Payment cancellation requested. Contact support if needed.",
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Failed to cancel payment",
      };
    }
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = "GHS"): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Calculate payment fees
   */
  calculatePaymentFees(
    amount: number,
    method: PaymentMethod,
  ): {
    fees: number;
    total: number;
  } {
    let fees = 0;

    switch (method) {
      case "momo":
        // Typical MoMo fees in Ghana (this would be configurable)
        fees = Math.max(0.5, amount * 0.01); // 1% with minimum of 0.50 GHS
        break;
      case "card":
        // Typical card processing fees
        fees = amount * 0.025; // 2.5%
        break;
      case "cash":
        fees = 0;
        break;
    }

    return {
      fees: Number(fees.toFixed(2)),
      total: Number((amount + fees).toFixed(2)),
    };
  }
}

// Export singleton instance and class
const paymentServiceInstance = PaymentService.getInstance();
export { PaymentService };
export default paymentServiceInstance;
