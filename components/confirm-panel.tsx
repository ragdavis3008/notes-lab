"use client";

// A small "are you sure?" box with Cancel and a confirm button (Delete unless
// confirmLabel says otherwise). The parent decides where it sits (className) and
// what happens on confirm. Cancel has the focus first, so pressing Enter by
// accident does not delete anything.
export function ConfirmPanel({
  message,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
  pending,
  error,
  onConfirm,
  onCancel,
  className = "",
}: {
  message: string;
  confirmLabel?: string;
  pendingLabel?: string;
  pending: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={message}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) onCancel();
      }}
      className={`flex flex-col gap-2 text-sm ${className}`}
    >
      <p>{message}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          autoFocus
          disabled={pending}
          onClick={onCancel}
          className="rounded-full bg-muted px-4 py-1 hover:bg-foreground/10 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="rounded-full bg-red-600 px-4 py-1 text-white disabled:opacity-50"
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
