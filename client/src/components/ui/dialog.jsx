import * as React from "react";

const DialogContext = React.createContext(null);

export function Dialog({ open, onOpenChange, children }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogPopup({ className = "", children, ...props }) {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) ctx.onOpenChange?.(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={[
          "w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl",
          "dark:border-zinc-800 dark:bg-zinc-950",
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = "", ...props }) {
  return <div className={["mb-4 flex flex-col space-y-1.5", className].join(" ")} {...props} />;
}

export function DialogTitle({ className = "", ...props }) {
  return <h2 className={["text-lg font-semibold", className].join(" ")} {...props} />;
}

export function DialogClose({ render, children, ...props }) {
  const ctx = React.useContext(DialogContext);

  if (React.isValidElement(render)) {
    return React.cloneElement(render, {
      ...props,
      onClick: (event) => {
        render.props.onClick?.(event);
        ctx?.onOpenChange?.(false);
      },
    });
  }

  return (
    <button
      type="button"
      onClick={() => ctx?.onOpenChange?.(false)}
      {...props}
    >
      {children || "Close"}
    </button>
  );
}
