# Agent Placement
Type: concept
Sources: https://opencomputer.dev/blog/where-should-the-agent-live

Architectural decision about where an AI agent process runs relative to its tool-execution environment—outside the sandbox, inside it, or in a hybrid configuration—affecting latency, security, and system complexity.

## Relations
- → Agent Sandbox Isolation: "Once isolation is a given, the next design choice is where the agent should live relative to the environment where code actually executes"
- → Agentic Workload: "agent placement is a performance decision as much as a security one"
- ← OpenComputer: "we favor placing the agent inside the isolated compute environment where it will actually execute code. It is usually the fastest and simplest approach"
