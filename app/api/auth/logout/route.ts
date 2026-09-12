import { NextResponse } from "next/server";
import { deleteCurrentSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await deleteCurrentSession();
  } catch (error) {
    console.error("Logout cleanup failed", error);
  }

  return NextResponse.json({ ok: true });
}
