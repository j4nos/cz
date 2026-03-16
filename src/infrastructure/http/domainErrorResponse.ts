import { NextResponse } from "next/server";

import { DomainError } from "@/src/domain/value-objects/errors";

export function createDomainErrorResponse(error: DomainError) {
  return NextResponse.json({ error: error.message }, { status: error.httpStatus });
}