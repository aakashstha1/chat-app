export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {Icon && (
        <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-surface-raised text-muted">
          <Icon size={26} />
        </span>
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
