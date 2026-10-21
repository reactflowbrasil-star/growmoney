import { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 animate-in">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-text-primary truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-secondary mt-1 max-w-xl leading-relaxed">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
