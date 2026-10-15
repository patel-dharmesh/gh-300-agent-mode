import { Children, type ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  emptyText?: string;
  children?: ReactNode;
};

export function CapabilityCard({ title, description, isLoading = false, error = null, emptyText, children }: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {isLoading ? (
          <p role="status">Loading...</p>
        ) : error ? (
          <div role="alert">Unable to load {title.toLowerCase()}.</div>
        ) : children && Children.count(children) > 0 ? (
          children
        ) : (
          <p>{emptyText ?? 'No data available.'}</p>
        )}
      </div>
    </section>
  );
}
