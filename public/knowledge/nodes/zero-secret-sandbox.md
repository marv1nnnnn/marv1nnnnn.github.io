# Zero-Secret Sandbox
Type: concept
Sources: https://opencomputer.dev/blog/where-should-the-agent-live

Security pattern where the agent inside the sandbox holds no credentials at all; every privileged operation including model inference is routed through an external control plane that owns secrets on the agent's behalf.

## Relations
- → Control Plane Pattern: "the agent inside the sandbox holds no credentials at all, and every privileged operation, including model inference, is routed through an external control plane that owns the secrets on the agent's behalf"
