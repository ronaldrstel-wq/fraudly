import { NextResponse } from "next/server";
import { getOrCreateUser, getUserIdFromRequest } from "@/lib/user-store";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const user = await getOrCreateUser(userId);
  return NextResponse.json({ userId, user });
}
