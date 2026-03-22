import { Invest } from "@/components/Invest";
import { notFound } from "next/navigation";

type Props = {
  params: { listingId: string; productId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default function InvestorInvestPage({ params, searchParams }: Props) {
  if (!params?.listingId || !params?.productId) {
    notFound();
  }
  const quantityParam = (searchParams?.quantity as string | undefined) ?? undefined;
  const initialQuantity = quantityParam ? Number(quantityParam) : undefined;
  const coupon = (searchParams?.coupon as string | undefined) ?? undefined;

  return (
    <Invest
      listingId={params.listingId}
      productId={params.productId}
      initialQuantity={initialQuantity}
      initialCoupon={coupon}
      mode="investor"
    />
  );
}
