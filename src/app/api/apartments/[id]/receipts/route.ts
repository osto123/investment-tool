import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { getStorage } from "@/lib/storage";
import { MAX_RECEIPT_BYTES, resolveReceiptMimeType } from "@/lib/validation";

// Receipts are uploaded here (multipart/form-data) before the transaction form
// is submitted, instead of through the createTransaction Server Action: sending
// file bytes through a Server Action breaks the upload on some mobile browsers
// (Android Chrome aborts the multipart POST with an HTTP/2 protocol error, so
// the request never even reaches the server). A plain Route Handler POST works.
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/apartments/[id]/receipts">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: apartmentId } = await ctx.params;

  const apartment = await getOwnedApartment(apartmentId, session.user.id);
  if (!apartment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json(
      { error: "Receipt file is too large (max 10 MB)" },
      { status: 400 }
    );
  }

  const mimeType = resolveReceiptMimeType(file.name, file.type);
  if (!mimeType) {
    return NextResponse.json(
      { error: "Receipt must be a PDF or image file" },
      { status: 400 }
    );
  }

  const ref = await getStorage().save({
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    mimeType,
    keyPrefix: apartmentId,
  });

  return NextResponse.json(ref);
}
