"use client";

export async function createPowensBankTransferPayment(input: {
  orderId: string;
  accessToken: string;
}) {
  const response = await fetch("/api/powens/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ orderId: input.orderId }),
  });

  return (await response.json()) as {
    redirectUrl?: string;
    error?: string;
  };
}

export async function fetchPowensPaymentStatus(input: {
  orderId: string;
  accessToken: string;
}) {
  const response = await fetch("/api/powens/payment-status", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ orderId: input.orderId }),
  });

  return response;
}
