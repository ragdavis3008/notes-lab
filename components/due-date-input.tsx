"use client";

import { useEffect, useRef, useState } from "react";
import { formatDue, isDateString, parseDisplayDate } from "@/lib/due-date";

const FORMAT_ERROR = "Use the format dd/mm/yyyy";

type Props = {
  id: string;
  initialValue?: string; // YYYY-MM-DD, or "" for none
};

// Due date field that always reads and shows dd/mm/yyyy, whatever the browser's
// language. The form gets the date as YYYY-MM-DD in `due_date`. The calendar button
// opens the browser's own date picker through a hidden <input type="date">.
export function DueDateInput({ id, initialValue = "" }: Props) {
  const [text, setText] = useState(
    isDateString(initialValue) ? formatDue(initialValue) : "",
  );
  const [touched, setTouched] = useState(false);
  const textRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  const parsed = parseDisplayDate(text);
  const invalid = parsed === undefined;
  const errorId = `${id}-error`;

  // A custom validity message stops the form from submitting a bad date.
  useEffect(() => {
    textRef.current?.setCustomValidity(invalid ? FORMAT_ERROR : "");
  }, [invalid]);

  function openPicker() {
    try {
      pickerRef.current?.showPicker();
    } catch {
      // Some browsers do not allow showPicker(); typing the date still works.
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex gap-2">
        <input
          ref={textRef}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/yyyy"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={invalid && touched ? true : undefined}
          aria-describedby={invalid && touched ? errorId : undefined}
          className="field flex-1"
        />
        {/* Sent with the form: YYYY-MM-DD. Bad text is sent as typed, so the server
            rejects it instead of silently dropping the date. */}
        <input type="hidden" name="due_date" value={invalid ? text : (parsed ?? "")} />
        <button
          type="button"
          onClick={openPicker}
          aria-label="Open calendar"
          className="rounded-md border border-foreground/20 px-3 text-sm hover:bg-muted"
        >
          📅
        </button>
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          value={parsed ?? ""}
          onChange={(e) => {
            if (e.target.value) {
              setText(formatDue(e.target.value));
              setTouched(true);
            }
          }}
          className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
        />
      </div>
      {invalid && touched && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {FORMAT_ERROR}
        </p>
      )}
    </div>
  );
}
