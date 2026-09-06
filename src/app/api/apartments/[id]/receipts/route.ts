import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedApartment } from "@/lib/ownership";
import { getStorage } from "@/lib/storage";
import {
  ALLOWED_RECEIPT_MIME_TYPES,
  MAX_RECEIPT_BYTES,
  resolveReceiptMimeType,
} from "@/lib/validation";

// Receipt uploads never send file bytes to this app. Android Chrome cannot
// complete a POST with a request body to the Vercel deployment over HTTP/2 —
// the request dies before it reaches the server, for both Server Actions and
// plain fetch. So in production the browser uploads straight to Vercel Blob and
// this route only issues the short-lived signed token (small JSON, no file
// body). In local dev (STORAGE_DRIVER=local, no Blob store) the browser instead
// posts the file here as multipart/form-data and we write it to disk.
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

  const contentType = request.headers.get("content-type") ?? "";

  // Local dev path: the file itself arrives here as multipart/form-data.
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
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

  // Production path: issue a client token for a direct browser -> Vercel Blob
  // upload, scoped to this apartment's key prefix, content types and size.
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`${apartmentId}/`)) {
          throw new Error("Upload path is not allowed");
        }
        return {
          access: "private",
          allowedContentTypes: ALLOWED_RECEIPT_MIME_TYPES,
          maximumSizeInBytes: MAX_RECEIPT_BYTES,
          addRandomSuffix: false,
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}
