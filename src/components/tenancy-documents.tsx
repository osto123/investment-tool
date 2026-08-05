import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

const inputClass = "field-input";
const labelClass = "field-label";

export type TenancyDocumentItem = {
  id: string;
  label: string | null;
  url: string;
};

export function TenancyDocuments({
  documents,
  addAction,
  deleteAction,
}: {
  documents: TenancyDocumentItem[];
  addAction: (formData: FormData) => void | Promise<void>;
  deleteAction: (documentId: string) => () => Promise<void>;
}) {
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-medium">Documents</h2>

      {documents.length === 0 ? (
        <p className="text-sm text-muted">No documents linked yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="link-muted hover:underline"
              >
                {doc.label || "Document"}
              </a>
              <ConfirmDeleteButton
                action={deleteAction(doc.id)}
                label="Remove"
                confirmText="Remove this document link?"
              />
            </li>
          ))}
        </ul>
      )}

      <form action={addAction} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="label" className={labelClass}>
            Label (optional)
          </label>
          <input
            id="label"
            name="label"
            placeholder="e.g. Rental agreement"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="url" className={labelClass}>
            Link (e.g. Google Drive share link)
          </label>
          <input id="url" name="url" type="url" required className={inputClass} />
        </div>

        <button type="submit" className="btn btn-secondary">
          + Add document link
        </button>
      </form>
    </div>
  );
}
