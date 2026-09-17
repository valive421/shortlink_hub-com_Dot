import * as React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={[
        "rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={["flex flex-col space-y-1.5 p-6", className].join(" ")} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return <h3 className={["text-lg font-semibold leading-none tracking-tight", className].join(" ")} {...props} />;
}

export function CardContent({ className = "", ...props }) {
  return <div className={["p-6 pt-0", className].join(" ")} {...props} />;
}
