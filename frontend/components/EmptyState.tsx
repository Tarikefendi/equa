import Link from 'next/link';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-7xl mb-6 animate-fade-in">{icon}</div>
      <h3 className="text-2xl font-bold text-text-primary mb-3">{title}</h3>
      <p className="text-text-secondary mb-8 max-w-md mx-auto">{description}</p>
      
      {(actionLabel && (actionHref || onAction)) && (
        actionHref ? (
          <Link href={actionHref} className="btn-primary inline-block">
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className="btn-primary">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
