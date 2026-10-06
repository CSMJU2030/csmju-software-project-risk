import type { ProjectStatus, RiskLevel, TaskStatus } from '@/types/api';
import { PROJECT_STATUS_LABEL, RISK_LEVEL_LABEL, TASK_STATUS_LABEL } from '@/lib/labels';

const base = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-label-sm font-semibold';

const LEVEL_STYLE: Record<RiskLevel, string> = {
  LOW: 'bg-success/10 text-success',
  MEDIUM: 'bg-warning/10 text-warning',
  HIGH: 'bg-warning/15 text-warning',
  CRITICAL: 'bg-error-container text-on-error-container',
};
const PROJECT_STYLE: Record<ProjectStatus, string> = {
  PLANNING: 'bg-primary-fixed text-primary',
  IN_PROGRESS: 'bg-success/10 text-success',
  ON_HOLD: 'bg-warning/10 text-warning',
  COMPLETED: 'bg-surface-variant text-on-surface-variant',
  CANCELLED: 'bg-error-container text-on-error-container',
};
const TASK_STYLE: Record<TaskStatus, string> = {
  TODO: 'bg-surface-variant text-on-surface-variant',
  IN_PROGRESS: 'bg-primary-fixed text-primary',
  COMPLETED: 'bg-success/10 text-success',
};

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={base + ' ' + style}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
export const RiskLevelBadge = ({ level }: { level: RiskLevel }) => (
  <Badge label={RISK_LEVEL_LABEL[level] + ' (' + level + ')'} style={LEVEL_STYLE[level]} />
);
export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => (
  <Badge label={PROJECT_STATUS_LABEL[status]} style={PROJECT_STYLE[status]} />
);
export const TaskStatusBadge = ({ status }: { status: TaskStatus }) => (
  <Badge label={TASK_STATUS_LABEL[status]} style={TASK_STYLE[status]} />
);
