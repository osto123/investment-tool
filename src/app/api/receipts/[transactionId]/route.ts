import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/receipts/[transactionId]">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await ctx.params;

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, apartment: { ownerId: session.user.id } },
  });
  if (!transaction || !transaction.receiptStoragePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await getStorage().read(transaction.receiptStoragePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": transaction.receiptMimeType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${transaction.receiptFileName ?? "receipt"}"`,
    },
  });
}
