import type { Asset, Listing, Order } from "@/src/domain/entities";

type PowensOrder = Pick<
  Order,
  "id" | "investorId" | "listingId" | "paymentProvider" | "total" | "currency"
>;

type PowensAsset = Pick<Asset, "id" | "beneficiaryIban" | "beneficiaryLabel">;
type PowensListing = Pick<Listing, "id" | "assetId">;

type PowensPaymentRepository = {
  getOrderById(id: string): Promise<PowensOrder | null>;
  getListingById(id: string): Promise<PowensListing | null>;
  getAssetById(id: string): Promise<PowensAsset | null>;
  updateOrder(input: Partial<Order> & Pick<Order, "id">): Promise<Order>;
};

type PowensCreatePaymentResult = {
  paymentId: string;
  paymentState: string;
};

type PowensApi = {
  getAdminToken(): Promise<string>;
  createPayment(input: {
    adminToken: string;
    orderId: string;
    total: number;
    currency: string;
    beneficiaryIban: string;
    beneficiaryLabel: string;
    redirectUri: string;
  }): Promise<PowensCreatePaymentResult>;
  getPaymentScopedToken(input: {
    adminToken: string;
    paymentId: string;
  }): Promise<string>;
};

type RequestPowensPaymentResponse =
  | { status: 200; body: { redirectUrl: string; paymentId: string } }
  | { status: number; body: { error: string } };

export class RequestPowensPaymentService {
  constructor(
    private readonly repository: PowensPaymentRepository,
    private readonly powensApi: PowensApi,
    private readonly config: {
      appUrl: string;
      powensBaseUrl: string;
      powensClientId: string;
    },
  ) {}

  async createPayment(input: {
    orderId: string;
    userId: string;
  }): Promise<RequestPowensPaymentResponse> {
    const order = await this.repository.getOrderById(input.orderId);
    if (!order) {
      return { status: 404, body: { error: "Order not found." } };
    }

    if (order.investorId !== input.userId) {
      return { status: 403, body: { error: "Forbidden." } };
    }

    if ((order.paymentProvider ?? "") !== "bank-transfer") {
      return {
        status: 400,
        body: { error: "Order is not eligible for bank transfer." },
      };
    }

    const listingId = order.listingId?.trim() || "";
    if (!listingId) {
      return { status: 400, body: { error: "Order is missing listingId." } };
    }

    const listing = await this.repository.getListingById(listingId);
    if (!listing?.assetId) {
      return { status: 400, body: { error: "Listing is missing asset." } };
    }

    const asset = await this.repository.getAssetById(listing.assetId);
    if (!asset) {
      return { status: 404, body: { error: "Asset not found." } };
    }

    const beneficiaryIban = asset.beneficiaryIban?.trim() || "";
    const beneficiaryLabel = asset.beneficiaryLabel?.trim() || "";
    if (!beneficiaryIban || !beneficiaryLabel) {
      return { status: 400, body: { error: "Missing beneficiary details." } };
    }

    let adminToken = "";
    try {
      adminToken = await this.powensApi.getAdminToken();
    } catch (error) {
      return {
        status: 502,
        body: {
          error: error instanceof Error ? error.message : "Failed to fetch token.",
        },
      };
    }

    let payment;
    try {
      payment = await this.powensApi.createPayment({
        adminToken,
        orderId: order.id,
        total: Number(Number(order.total ?? 0).toFixed(2)),
        currency: order.currency ?? "EUR",
        beneficiaryIban,
        beneficiaryLabel,
        redirectUri: `${this.config.appUrl.replace(/\/+$/, "")}/powens/callback`,
      });
    } catch (error) {
      return {
        status: 502,
        body: {
          error:
            error instanceof Error ? error.message : "Failed to create payment.",
        },
      };
    }

    await this.repository.updateOrder({
      id: order.id,
      paymentProviderId: payment.paymentId,
      paymentProviderStatus: payment.paymentState,
    });

    let paymentToken = "";
    try {
      paymentToken = await this.powensApi.getPaymentScopedToken({
        adminToken,
        paymentId: payment.paymentId,
      });
    } catch (error) {
      return {
        status: 502,
        body: {
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch payment token.",
        },
      };
    }

    const webviewUrl = new URL(
      `${this.config.powensBaseUrl.replace(/\/+$/, "")}/auth/webview/payment`,
    );
    webviewUrl.searchParams.set("payment_id", payment.paymentId);
    webviewUrl.searchParams.set("client_id", this.config.powensClientId);
    webviewUrl.searchParams.set("code", paymentToken);

    return {
      status: 200,
      body: {
        redirectUrl: webviewUrl.toString(),
        paymentId: payment.paymentId,
      },
    };
  }
}
