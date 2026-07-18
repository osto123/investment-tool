import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApartmentYearReport } from "@/lib/reports";
import { renderTaxReportCsv } from "@/lib/csv";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/apartments/[id]/reports/[year]/csv">
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

  const report = await getApartmentYearReport(id, yearNum);
  const csv = renderTaxReportCsv(report);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${id}-${yearNum}-tax-report.csv"`,
    },
  });
}
