// Agent EA-23: Socrates — 
// Spec source: PRISM Canon Book I, Agent 23: Socrates — Assumption Testing and Adversarial Reasoning
//
// Constitutional requirement (Canon Vol III 3.15): every agent must expose
// Capability / Knowledge / Reasoning as inspectable interfaces, not just act.

export const SOCRATES_CAPABILITY = [
  'Generate the strongest possible adversarial challenge to every significant conclusion produced by any agent or governance process',
  'Conduct red-team analysis of strategic decisions and pre-mortem analysis before significant commitments',
  'Identify structurally inherited assumptions per CA-003 that were adopted without deliberate examination',
  'Challenge evidence interpretations that may reflect structural bias; identify missing alternatives in decision processes',
]

export const SOCRATES_KNOWLEDGE = [
  'decisions (Decision Registry, assumption sets)',
  'the Assumption Engine classification (evidence-based, opinion-based, untested, structurally inherited — Vol IX Ch. 3)',
  '4 subagents: Adversary (strongest opposing argument), Archaeologist (traces assumptions to origins, incl. structural), Premortem (simulates decision failure scenarios), Devil (identifies most undermining evidence)',
]
