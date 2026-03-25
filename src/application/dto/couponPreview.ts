export type CouponPreview = {
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  total: number;
  couponCodeApplied?: string;
  discountPctApplied?: number;
  isCouponValid: boolean;
  hasCouponInput: boolean;
  message?: string;
};
