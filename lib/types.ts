export type ObjectType =
  | 'person'
  | 'organization'
  | 'product'
  | 'claim'
  | 'evidence'
  | 'source'
  | 'decision'
  | 'assumption'
  | 'unknown'
  | 'risk'
  | 'task'
  | 'project'
  | 'metric'
  | 'experiment'
  | 'document'
  | 'ghost_note'
  | 'automation'
  | 'agent';

export type ClaimStatus =
  | 'proposed'
  | 'supported'
  | 'unsupported'
  | 'contested'
  | 'unknown'
  | 'deprecated'
  | 'retracted';

export type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'AWAITING_REVIEW'
  | 'DONE'
  | 'CANCELLED';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DecisionStatus =
  | 'IDENTIFIED'
  | 'FRAMING'
  | 'ALTERNATIVES_GENERATED'
  | 'ANALYZED'
  | 'RECOMMENDED'
  | 'MADE'
  | 'IMPLEMENTING'
  | 'OUTCOME_KNOWN'
  | 'REVIEWED'
  | 'SUPERSEDED'
  | 'ABANDONED';

export type AssumptionStatus =
  | 'active'
  | 'validated'
  | 'invalidated'
  | 'superseded'
  | 'deferred'
  | 'accepted_permanent';

export type UnknownStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'accepted'
  | 'deferred';

export type RiskCategory =
  | 'strategic'
  | 'operational'
  | 'financial'
  | 'regulatory'
  | 'reputational'
  | 'technical'
  | 'market'
  | 'human'
  | 'legal'
  | 'clinical'
  | 'safety';

export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertType =
  | 'overdue_task'
  | 'high_risk_assumption'
  | 'unsupported_claim'
  | 'stale_evidence'
  | 'high_evi_unknown'
  | 'open_contradiction'
  | 'blocked_decision';

export interface PRISMAlert {
  id: string;
  severity: AlertSeverity;
  alert_type: AlertType;
  alert_text: string;
  object_id: string;
  object_type: ObjectType;
  object_name: string;
  created_at: string;
  dismissed_at: string | null;
}

export interface OrgHealthDimension {
  label: string;
  key: string;
  score: number;
  sparkline_data: number[];
  delta: number;
  delta_direction: 'up' | 'down' | 'flat';
  color: string;
}

export const OBJECT_TYPE_CONFIG: Record<ObjectType, { icon: string; color: string; label: string }> = {
  person: { icon: 'User', color: '#2E75B6', label: 'Person' },
  organization: { icon: 'Building2', color: '#375623', label: 'Organization' },
  product: { icon: 'Package', color: '#7030A0', label: 'Product' },
  claim: { icon: 'FileCheck', color: '#C55A11', label: 'Claim' },
  evidence: { icon: 'Microscope', color: '#1F4E79', label: 'Evidence' },
  source: { icon: 'BookOpen', color: '#595959', label: 'Source' },
  decision: { icon: 'GitBranch', color: '#0D2137', label: 'Decision' },
  assumption: { icon: 'HelpCircle', color: '#C55A11', label: 'Assumption' },
  unknown: { icon: 'Eye', color: '#9C0006', label: 'Unknown' },
  risk: { icon: 'AlertTriangle', color: '#9C0006', label: 'Risk' },
  task: { icon: 'CheckSquare', color: '#375623', label: 'Task' },
  project: { icon: 'Folder', color: '#2E75B6', label: 'Project' },
  metric: { icon: 'BarChart2', color: '#1F4E79', label: 'Metric' },
  experiment: { icon: 'FlaskConical', color: '#7030A0', label: 'Experiment' },
  document: { icon: 'FileText', color: '#595959', label: 'Document' },
  ghost_note: { icon: 'Ghost', color: '#595959', label: 'Ghost Note' },
  automation: { icon: 'Zap', color: '#C55A11', label: 'Automation' },
  agent: { icon: 'Bot', color: '#2E75B6', label: 'Agent' },
};
