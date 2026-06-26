// All scoring formulas for PRISM ICC
// These are also computed server-side via triggers; frontend uses pre-computed values
// These functions are provided for display, verification, and client-side preview

export function computeConfidence(
  evidence_quality: number,
  source_reliability: number,
  source_independence: number,
  methodological_strength: number,
  freshness: number,
  consensus: number,
  contradiction_adjustment: number,
  applicability: number
): number {
  const base =
    evidence_quality * 0.25 +
    source_reliability * 0.20 +
    source_independence * 0.10 +
    methodological_strength * 0.15 +
    freshness * 0.10 +
    consensus * 0.10 +
    applicability * 0.10
  const adjusted = base * (1 - contradiction_adjustment * 0.3)
  return Math.max(0, Math.min(1, adjusted))
}

export function computeAssumptionRisk(
  importance: number,
  risk_if_false: number,
  confidence_gap: number,
  dependency_count: number,
  time_since_review: number
): number {
  return importance * risk_if_false * confidence_gap * dependency_count * Math.max(time_since_review, 1)
}

export function computeEVI(
  impact_if_resolved: number,
  probability_changes_decision: number,
  decision_value: number,
  cost_to_resolve: number,
  cost_of_delay: number
): number {
  return (impact_if_resolved * probability_changes_decision * decision_value) - cost_to_resolve - cost_of_delay
}

export function computeFocusScore(
  strategic_importance: number,
  expected_value: number,
  urgency: number,
  confidence: number,
  unblock_multiplier: number,
  effort: number,
  distraction_cost: number
): number {
  return (strategic_importance * expected_value * urgency * confidence * unblock_multiplier) - effort - distraction_cost
}

export function computeRAI(
  forecast_accuracy: number,
  calibration_score: number,
  evidence_freshness: number,
  unsupported_claim_ratio: number,
  contradiction_rate: number,
  decision_accuracy: number,
  unknown_ratio: number,
  bias_score: number,
  knowledge_decay_rate: number,
  model_drift_score: number
): number {
  // Weighted composite — positive dimensions increase score, negative dimensions decrease it
  const positive =
    forecast_accuracy * 0.15 +
    calibration_score * 0.15 +
    evidence_freshness * 0.10 +
    decision_accuracy * 0.15

  const negative =
    unsupported_claim_ratio * 0.15 +
    contradiction_rate * 0.10 +
    unknown_ratio * 0.10 +
    bias_score * 0.10 +
    knowledge_decay_rate * 0.05 +
    model_drift_score * 0.05

  return Math.max(0, Math.min(100, (positive - negative + 0.5) * 100))
}

// Badge color thresholds
export type BadgeColor = 'green' | 'amber' | 'red' | 'gray'

export function confidenceBadgeColor(score: number): BadgeColor {
  if (score >= 0.70) return 'green'
  if (score >= 0.40) return 'amber'
  return 'red'
}

export function assumptionRiskBadgeColor(score: number): BadgeColor {
  if (score > 0.70) return 'red'
  if (score >= 0.30) return 'amber'
  return 'green'
}

export function riskScoreBadgeColor(score: number): BadgeColor {
  if (score > 0.64) return 'red'
  if (score > 0.36) return 'amber'
  if (score > 0.16) return 'gray'
  return 'green'
}

export function raiBadgeColor(score: number): BadgeColor {
  if (score >= 80) return 'green'
  if (score >= 60) return 'amber'
  return 'red'
}

export function freshnessBadgeColor(daysSince: number): BadgeColor {
  if (daysSince < 30) return 'green'
  if (daysSince <= 90) return 'amber'
  return 'red'
}

export function taskOverdueBadgeColor(daysOverdue: number): BadgeColor {
  if (daysOverdue <= 0) return 'green'
  if (daysOverdue <= 3) return 'amber'
  return 'red'
}
