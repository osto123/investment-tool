import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApartmentYearReport } from "@/lib/reports";
import { renderTaxReportPdf } from "@/lib/pdf";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/apartments/[id]/reports/[year]/pdf">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, year } = await ctx.params;
  const yearNum = Number(year);
  if (!Number.isInteger(yearNum)) {
    return NextResponse.json({ error: "Invalid year" }, { status: 400 });
  }

  let report;
  try {
    report = await getApartmentYearReport(id, yearNum, session.user.id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const pdfBuffer = await renderTaxReportPdf(report);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${id}-${yearNum}-tax-report.pdf"`,
    },
  });
}
