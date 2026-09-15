import { useEffect, useId, useRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { ArrowUpRight, Sparkles, X } from "lucide-react";

export const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  return <button className={cn("btn", `btn-${variant}`, className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("panel", className)} {...props} />;
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "blue" | "green" | "amber" | "red" | "violet";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={cn("avatar", className)} aria-label={name}>
      {name.slice(-2)}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}

export function Metric({
  label,
  value,
  trend,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  trend: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <Card className="metric-card">
      <div className={`metric-icon tone-${tone}`}>{icon}</div>
      <div>
        <span className="eyebrow">{label}</span>
        <strong>{value}</strong>
        <small>{trend}</small>
      </div>
    </Card>
  );
}

export function GrowthSignal({
  title,
  detail,
  action,
  onAction,
  tone = "blue",
}: {
  title: string;
  detail: string;
  action: string;
  onAction: () => void;
  tone?: "blue" | "green" | "amber" | "red" | "violet";
}) {
  return (
    <aside className={`growth-signal growth-signal-${tone}`} aria-label="增长信号">
      <span className="signal-mark"><Sparkles size={14} /></span>
      <div className="signal-copy">
        <span>GROWTH SIGNAL</span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
      <button onClick={onAction}>{action}<ArrowUpRight size={13} /></button>
    </aside>
  );
}

export function Tabs({
  items,
  active,
  onChange,
}: {
  items: string[];
  active: string;
  onChange: (item: string) => void;
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          role="tab"
          aria-selected={active === item}
          className={active === item ? "active" : ""}
          onClick={() => onChange(item)}
          key={item}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside
        ref={dialogRef}
        className={cn("drawer", wide && "drawer-wide")}
        onMouseDown={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">高顿业务中台</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const dialogRef = useDialogFocus(open, onClose);
  if (!open) return null;
  return (
    <div className="overlay modal-overlay" onMouseDown={onClose}>
      <section ref={dialogRef} className="modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="drawer-head">
          <h2 id={titleId}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  );
}

function useDialogFocus<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusable = () => Array.from(node?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    window.requestAnimationFrame(() => (focusable()[0] ?? node)?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        node?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus.current?.focus();
    };
  }, [open]);
  return ref;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p>{detail}</p>
    </div>
  );
}
