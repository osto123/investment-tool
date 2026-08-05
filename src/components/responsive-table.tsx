import type { ReactNode } from "react";

export type ResponsiveTableColumn = {
  key: string;
  header: string;
  align?: "right";
  /** Rendered as the mobile card's heading row instead of a labeled field. */
  primary?: boolean;
  /** Rendered without a label, next to the heading on mobile (e.g. an edit link). */
  hideLabel?: boolean;
};

export type ResponsiveTableRow = {
  id: string;
  cells: Record<string, ReactNode>;
};

export function ResponsiveTable({
  columns,
  rows,
  emptyMessage = "No data.",
}: {
  columns: ResponsiveTableColumn[];
  rows: ResponsiveTableRow[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-muted">{emptyMessage}</p>;
  }

  const primaryCol = columns.find((c) => c.primary);
  const actionCols = columns.filter((c) => c.hideLabel);
  const detailCols = columns.filter((c) => !c.primary && !c.hideLabel);

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-2 font-medium ${c.align === "right" ? "text-right" : ""}`}
                >
                  {c.hideLabel ? "" : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/60 last:border-0">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-2 ${c.align === "right" ? "text-right" : ""}`}
                  >
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="card space-y-2 text-sm">
            {primaryCol && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{row.cells[primaryCol.key]}</span>
                {actionCols.length > 0 && (
                  <div className="flex items-center gap-3">
                    {actionCols.map((c) => (
                      <span key={c.key}>{row.cells[c.key]}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {detailCols.map((c) => (
                <div key={c.key}>
                  <dt className="detail-label">{c.header}</dt>
                  <dd className={c.align === "right" ? "text-right" : ""}>{row.cells[c.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
