// Agent EA-22: Hermes — 
// Spec source: PRISM Canon Book I, Agent 22: Hermes — Workflow Orchestration and Inter-Agent Coordination
//
// Constitutional requirement (Canon Vol III 3.15): every agent must expose
// Capability / Knowledge / Reasoning as inspectable interfaces, not just act.

export const HERMES_CAPABILITY = [
  'Route tasks to the correct agent with correct context and priority',
  'Manage inter-agent dependencies without bottlenecks via the Agent Communication Protocol (PIOS Book II Vol V)',
  'Assemble context for agent handoffs, preserving provenance, authority, and content of every routed message unmodified',
  'Detect and resolve workflow bottlenecks in the agent execution queue',
]

export const HERMES_KNOWLEDGE = [
  'the Agent Communication Protocol Universal Message Schema (PIOS Book II Volume V)',
  'workflows (design, optimization, dependency graph)',
  'automations (queue state, priority)',
  '5 subagents: Router (task routing/agent selection), Dispatcher (message delivery), Scheduler (priority/queue), Bridge (inter-domain coordination), Monitor (bottleneck detection)',
]
