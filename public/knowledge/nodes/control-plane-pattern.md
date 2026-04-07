# Control Plane Pattern
Type: concept
Sources: https://x.com/larsencc/status/2027225210412470668, https://opencomputer.dev/blog/where-should-the-agent-live

Architectural pattern where a privileged external service manages credentials, routes privileged operations, and mediates access between the untrusted sandbox and external services.

## Relations
- → AgentGateway Protocol: "In production, ControlPlaneGateway sends HTTP requests to the control plane. For local development and evals, DirectGateway calls the LLM directly and keeps history in memory. The agent code doesn't know which one it's using"
- ← Agent Sandbox Isolation: "Isolate the agent. The entire agent runs in a sandbox with zero secrets. It talks to the outside world through a control plane that holds all the credentials"
- ← Agent Sandbox Isolation: "A common answer is to give the sandbox only a short-lived session token and route privileged operations through a proxy or control plane"
- ← Browser Use: "We started with Pattern 1 and moved to Pattern 2"
- ← Zero-Secret Sandbox: "the agent inside the sandbox holds no credentials at all, and every privileged operation, including model inference, is routed through an external control plane that owns the secrets on the agent's behalf"
