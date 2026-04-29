import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

function PageStateContainer({ title, description, action, className }: PageStateProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-10 text-center shadow-card", className)}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function LoadingState({
  title = "Loading...",
  description = "Fetching the latest data.",
}: Partial<PageStateProps>) {
  return <PageStateContainer title={title} description={description} />;
}

export function EmptyState({ title, description, action, className }: PageStateProps) {
  return <PageStateContainer title={title} description={description} action={action} className={className} />;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <PageStateContainer
      title={title}
      description={description}
      action={onRetry ? <Button onClick={onRetry}>Try again</Button> : undefined}
    />
  );
}