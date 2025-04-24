// lib/ensure-session-cart.ts
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function ensureSessionCartId() {
  const cookieStore = await cookies();
  let sessionCartId = cookieStore.get("sessionCartId")?.value;

  if (!sessionCartId) {
    sessionCartId = uuidv4();
    cookieStore.set("sessionCartId", sessionCartId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return sessionCartId;
}
