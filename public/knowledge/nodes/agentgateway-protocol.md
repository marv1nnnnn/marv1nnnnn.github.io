# AgentGateway Protocol
Type: concept
Sources: https://x.com/larsencc/status/2027225210412470668

Interface abstraction allowing agents to use either a control plane HTTP backend or direct local calls without code changes

## Relations
- ← Control Plane Pattern: "In production, ControlPlaneGateway sends HTTP requests to the control plane. For local development and evals, DirectGateway calls the LLM directly and keeps history in memory. The agent code doesn't know which one it's using"
