export type CouponPreview = {
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  total: number;
  couponCodeApplied?: string;
  isCouponValid: boolean;
  hasCouponInput: boolean;
  message?: string;
};
