// lib/workflows.ts — Agent workflow definitions for monetization
// Each workflow is a pre-configured diagnostic session that produces a specific deliverable.
// Free workflows: available to all users. Paid workflows: require ceo_diagnostic or above.

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  deliverable: string;
  tier: 'free' | 'paid';
  estimatedMinutes: number;
  systemPromptSuffix: string; // appended to DRA_SYSTEM_PROMPT
  icon: string; // emoji for quick visual ID (internal, not user-facing brand)
}

export const WORKFLOWS: AgentWorkflow[] = [
  {
    id: 'stability_diagnostic',
    name: 'Stability Diagnostic',
    description: 'Full organizational stability assessment using The OSS Index™. The canonical 10-minute diagnostic.',
    deliverable: 'The OSS Index™ score (0–100) + 4-dimension breakdown + risk zone + HP/LR trap detection',
    tier: 'free',
    estimatedMinutes: 10,
    systemPromptSuffix: '',
    icon: '📊',
  },
  {
    id: 'quarterly_review',
    name: 'Quarterly Board Review',
    description: 'Quarterly reassessment comparing current OSS™ against previous quarter. Generates trend analysis and board-ready summary.',
    deliverable: 'Quarterly comparison report + ΔOSS trend alert + board discussion points',
    tier: 'paid',
    estimatedMinutes: 12,
    systemPromptSuffix: `\n\n## WORKFLOW: QUARTERLY BOARD REVIEW\nThis session is a quarterly reassessment. After completing the standard diagnostic, additionally:\n1. Compare the new OSS™ score against the user's previous assessment\n2. Calculate ΔOSS% and classify as Yellow Alert (>8%) or Red Alert (>15%)\n3. Generate 3 board discussion points based on the trend\n4. Recommend governance actions for the next quarter`,
    icon: '📅',
  },
  {
    id: 'ma_diligence',
    name: 'M&A Due Diligence',
    description: 'Structural stability assessment for merger/acquisition target. Identifies integration risk factors.',
    deliverable: 'M&A structural risk profile + integration risk score + 5 red flags checklist',
    tier: 'paid',
    estimatedMinutes: 15,
    systemPromptSuffix: `\n\n## WORKFLOW: M&A DUE DILIGENCE\nThis session assesses an organization as an M&A target. After completing the standard diagnostic, additionally:\n1. Frame findings as M&A risk factors (not just stability score)\n2. Identify integration risk: will the target's rhythm survive the merger?\n3. Generate a 5-point red flags checklist for the acquiring board\n4. Recommend post-merger stabilization protocols\n5. Assess cultural rhythm compatibility (ER/PR synchronization)`,
    icon: '🔗',
  },
  {
    id: 'crisis_response',
    name: 'Crisis Response Assessment',
    description: 'Rapid structural assessment during organizational crisis (exec departure, mass burnout, missed quarter).',
    deliverable: 'Crisis structural analysis + immediate stabilization protocol + 48-hour action checklist',
    tier: 'paid',
    estimatedMinutes: 8,
    systemPromptSuffix: `\n\n## WORKFLOW: CRISIS RESPONSE ASSESSMENT\nThis session is a crisis-response diagnostic. The organization is experiencing acute instability. Adjust your approach:\n1. Be more direct and urgent in tone\n2. Prioritize Recovery Integrity (RI) as the primary variable\n3. If HP/LR Trap is detected, escalate immediately to Red Alert\n4. Generate a 48-hour stabilization protocol\n5. Recommend which expansion initiatives must be frozen immediately\n6. Provide a board emergency briefing template`,
    icon: '🚨',
  },
  {
    id: 'team_restructuring',
    name: 'Team Restructuring Assessment',
    description: 'Assess structural impact of planned reorganization, layoff, or team restructuring.',
    deliverable: 'Restructuring impact forecast + rhythm preservation guide + transition timeline',
    tier: 'paid',
    estimatedMinutes: 14,
    systemPromptSuffix: `\n\n## WORKFLOW: TEAM RESTRUCTURING ASSESSMENT\nThis session assesses the structural impact of a planned reorganization. After the standard diagnostic:\n1. Model how the restructuring will affect each dimension (ER, PR, RI, A)\n2. Identify which rhythm functions are most at risk during transition\n3. Generate a rhythm preservation guide for the transition period\n4. Recommend a phased timeline that minimizes RI degradation\n5. Flag if the restructuring would trigger HP/LR Trap conditions`,
    icon: '🔄',
  },
];

export function getWorkflow(id: string): AgentWorkflow | undefined {
  return WORKFLOWS.find(w => w.id === id);
}

export function getAvailableWorkflows(isPaid: boolean): AgentWorkflow[] {
  return WORKFLOWS.filter(w => isPaid ? true : w.tier === 'free');
}
