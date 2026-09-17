import * as React from "react";

const SelectContext = React.createContext(null);

export function Select({ value, onValueChange, children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, ref }}>
      <div ref={ref} className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = "", children, ...props }) {
  const ctx = React.useContext(SelectContext);
  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={ctx?.open}
      onClick={() => ctx?.setOpen((v) => !v)}
      className={[
        "flex h-10 w-full items-center justify-between rounded-lg border border-zinc-300",
        "bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm",
        "hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-200",
        "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900",
        className,
      ].join(" ")}
      {...props}
    >
      <span className="truncate">{children}</span>
      <span className="ml-2 text-zinc-400">⌄</span>
    </button>
  );
}

export function SelectValue({ placeholder = "Select...", ...props }) {
  const ctx = React.useContext(SelectContext);
  return <span {...props}>{ctx?.value || placeholder}</span>;
}

export function SelectPopup({ className = "", children, ...props }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx?.open) return null;

  return (
    <div
      role="listbox"
      className={[
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border",
        "border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-950",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className = "", ...props }) {
  const ctx = React.useContext(SelectContext);

  return (
    <button
      type="button"
      role="option"
      aria-selected={ctx?.value === value}
      onClick={() => {
        ctx?.onValueChange?.(value);
        ctx?.setOpen(false);
      }}
      className={[
        "flex w-full items-center rounded-md px-3 py-2 text-left text-sm",
        "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-900",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
