# Sandbox Lifecycle Patterns
Type: concept
Sources: https://opencomputer.dev/blog/where-should-the-agent-live

How agent compute environments live over time: ephemeral (created and destroyed per task), long-running (persistent across interactions), hybrid (paused/resumed with preserved state), or shared containers (multi-agent co-tenancy).

## Relations
- ← Agentic Workload: "Beyond securing the isolated environment and deciding where to place the agent, there is still the question of how that environment should live over time"
- ← OpenComputer: "OpenComputer takes a middle path between long-lived and hybrid designs. Where possible, environments are paused and resumed on the same host so they can preserve local state and avoid unnecessary cold starts"
