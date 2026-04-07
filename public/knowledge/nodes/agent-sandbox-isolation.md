# Agent Sandbox Isolation
Type: concept
Sources: https://x.com/larsencc/status/2027225210412470668, https://opencomputer.dev/blog/where-should-the-agent-live

Two-layer isolation model for agent workloads: an OS sandbox around the agent process itself, and a stronger execution boundary around the entire environment, designed to contain blast radius from prompt injection or compromised agents.

## Relations
- → Control Plane Pattern: "Isolate the agent. The entire agent runs in a sandbox with zero secrets. It talks to the outside world through a control plane that holds all the credentials"
- → Input hardening: "Always assume inputs can be adversarial."
- → Control Plane Pattern: "A common answer is to give the sandbox only a short-lived session token and route privileged operations through a proxy or control plane"
- → Agentic Workload: "Agents introduce a new set of deployment needs and constraints"
- ← Agent Placement: "Once isolation is a given, the next design choice is where the agent should live relative to the environment where code actually executes"
- ← Unikraft: "Unikraft gives us scale-to-zero out of the box. When a sandbox is idle, the VM suspends. When the next request comes in, it resumes"
