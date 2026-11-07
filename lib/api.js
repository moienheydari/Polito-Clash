import { NextResponse } from "next/server";

export function json(data, status = 200) { return NextResponse.json(data, { status }); }
export function errorResponse(error) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message === "Authentication required" ? 401 : 400;
  return json({ error: message }, status);
}
