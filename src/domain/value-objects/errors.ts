const DOMAIN_ERROR_DEFINITIONS = {
  DOMAIN_ERROR: { message: "Domain error.", httpStatus: 400 },
  ASSET_NOT_FOUND: { message: "Asset not found.", httpStatus: 404 },
  FORBIDDEN: { message: "Forbidden.", httpStatus: 403 },
  CONTRACT_DEPLOYMENT_IN_PROGRESS: {
    message: "Contract deployment already in progress.",
    httpStatus: 409,
  },
  CONTRACT_DEPLOYMENT_REQUEST_FAILED: {
    message: "Contract deployment request could not be created.",
    httpStatus: 500,
  },
  INVALID_OWNER_ADDRESS: { message: "Invalid owner address.", httpStatus: 400 },
  RPC_CONFIG_MISSING: { message: "RPC or private key missing.", httpStatus: 500 },
  INVALID_PURCHASE_LIMITS: { message: "Purchase limits are invalid.", httpStatus: 400 },
  SUPPLY_TOTAL_TOO_LOW: { message: "Supply total must cover max purchase.", httpStatus: 400 },
  LISTING_NOT_OPEN: { message: "Listing is not open for orders.", httpStatus: 409 },
  PRODUCT_LISTING_MISMATCH: {
    message: "Product does not belong to the selected listing.",
    httpStatus: 400,
  },
  QUANTITY_OUT_OF_RANGE: {
    message: "Quantity is outside the allowed purchase range.",
    httpStatus: 400,
  },
  INSUFFICIENT_REMAINING_SUPPLY: { message: "Not enough remaining supply.", httpStatus: 409 },
  INVESTOR_NOT_ELIGIBLE: {
    message: "Investor is not eligible for this product.",
    httpStatus: 403,
  },
  ORDER_NOT_PENDING: {
    message: "Only pending payment orders can be completed.",
    httpStatus: 409,
  },
  USER_PROFILE_NOT_FOUND: { message: "User profile was not found.", httpStatus: 404 },
  LISTING_NOT_FOUND: { message: "Listing not found.", httpStatus: 404 },
  PRODUCT_NOT_FOUND: { message: "Product not found.", httpStatus: 404 },
  ORDER_NOT_FOUND: { message: "Order not found.", httpStatus: 404 },
  INVALID_TOKEN_ADDRESS: { message: "Invalid token address.", httpStatus: 400 },
  INVALID_INVESTOR_WALLET_ADDRESS: {
    message: "Invalid investor wallet address.",
    httpStatus: 400,
  },
} as const;

type DomainErrorCatalog = typeof DOMAIN_ERROR_DEFINITIONS;

export type DomainErrorCode = keyof DomainErrorCatalog;

type DomainErrorDefinition = {
  code: DomainErrorCode;
  message: string;
  httpStatus: number;
};

type DomainErrorOptions = {
  code: DomainErrorCode;
  message?: string;
  httpStatus?: number;
  cause?: unknown;
};

const LEGACY_MESSAGE_TO_CODE = new Map<string, DomainErrorCode>(
  Object.entries(DOMAIN_ERROR_DEFINITIONS).map(([code, definition]) => [
    definition.message,
    code as DomainErrorCode,
  ]),
);

function resolveDomainErrorDefinition(input: string | DomainErrorOptions): DomainErrorDefinition {
  if (typeof input === "string") {
    const code = LEGACY_MESSAGE_TO_CODE.get(input) ?? "DOMAIN_ERROR";
    const definition = DOMAIN_ERROR_DEFINITIONS[code];
    return {
      code,
      message: input,
      httpStatus: definition.httpStatus,
    };
  }

  const definition = DOMAIN_ERROR_DEFINITIONS[input.code];
  return {
    code: input.code,
    message: input.message ?? definition.message,
    httpStatus: input.httpStatus ?? definition.httpStatus,
  };
}

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly httpStatus: number;

  constructor(input: string | DomainErrorOptions) {
    const definition = resolveDomainErrorDefinition(input);
    super(definition.message);
    this.name = "DomainError";
    this.code = definition.code;
    this.httpStatus = definition.httpStatus;

    if (typeof input !== "string" && input.cause !== undefined) {
      Object.defineProperty(this, "cause", {
        value: input.cause,
        enumerable: false,
        configurable: true,
      });
    }
  }
}
