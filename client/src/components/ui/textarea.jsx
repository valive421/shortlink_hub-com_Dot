import * as React from "react";

export const Textarea = React.forwardRef(function Textarea(
  { className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={[
        "flex min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm",
        "text-zinc-900 placeholder:text-zinc-400 outline-none transition",
        "focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500",
        className,
      ].join(" ")}
      {...props}
    />
  );
});
