Title: OpenComputer – Long-running cloud infrastructure for AI agents

URL Source: https://opencomputer.dev/blog/where-should-the-agent-live

Markdown Content:
## Where Should the Agent(s) Live?

Utpal Nadiger, Mohamed Habib, Igor Zalutski · March 20, 2026

In [The Agentic Workload](https://opencomputer.dev/blog/the-agentic-workload), we explained why software agent workloads are fundamentally different from traditional applications. Agents introduce a new set of deployment needs and constraints, and this post explores those constraints and what they mean for designing agentic systems.

The ideas here apply broadly, but they matter most for platforms that give end users direct access to generative AI capabilities, like [Lovable](https://lovable.dev/) or [Bolt](https://bolt.new/), where untrusted input can reach the agent. Internal background agents often operate under a more trusted user model, but many of the same isolation and placement tradeoffs still come up.

We will explore a few core questions

1.   What should the isolation model look like?
2.   Should the agent be separated from the tool-call environment?
3.   What state should persist inside the compute environment?
4.   How should the platform trade off speed, safety, and cost?

## Security

The broad access that makes agents so powerful also makes them dangerous. For many applications, agents need filesystem access, process control, network access, and the ability to generate and execute arbitrary code.

Isolation usually happens in two layers: an OS sandbox around the agent process itself, and a stronger execution boundary around the whole environment it operates in. Anthropic's [sandboxing guidance](https://code.claude.com/docs/en/sandboxing#how-it-works) and [OpenAI's Codex docs](https://developers.openai.com/codex/agent-approvals-security/#os-level-sandbox) are useful references for the first layer; [Luis Cardoso](https://www.luiscardoso.dev/blog/sandboxes-for-ai), [Pierce Freeman](https://pierce.dev/notes/a-deep-dive-on-agent-sandboxes), and our [Sandbox Fingerprinting](http://localhost:8080/blog/sandbox-fingerprinting#isolation-categories) writeup are good references for the second.

Use both layers together: OS sandboxing limits what the agent process can do, while the execution boundary provides another layer of defense and contains the full machine-level blast radius.

### Aside: Credentials

Even with strong isolation, agents still need a safe way to access external services. At a minimum, the agent needs to authenticate to the model provider, so it is important to design the system to minimize blast radius if that environment is compromised. Prompt injection, policy bypass attempts, and the simple fact that the agent can execute arbitrary code all push in the same direction: assume the environment may eventually be coerced into trying to exfiltrate whatever credentials it can reach.

A common answer is to give the sandbox only a short-lived session token and route privileged operations through a proxy or control plane. [Browser Use](https://browser-use.com/posts/two-ways-to-sandbox-agents) pushes this idea further with what they call a "zero-secret sandbox" approach: the agent inside the sandbox holds no credentials at all, and every privileged operation, including model inference, is routed through an external control plane that owns the secrets on the agent's behalf.

## Agent Placement

Once isolation is a given, the next design choice is where the agent should live relative to the environment where code actually executes. Should the agent run inside the same isolated computer where it reads files, installs dependencies, and executes commands? Or should it remain outside that environment and send tool calls across the boundary into a separate execution target?

That distinction turns out to matter a lot. It affects latency, security boundaries, state management, and how naturally the environment behaves like a real computer. The biggest performance question is whether repeated tool calls have to cross the sandbox boundary over and over again, or whether they can execute locally alongside the agent.

### The Basic Agent Loop

Before getting into the specific placement models, it helps to define the basic loop most coding agents follow:

There are four main sources of time in that loop:

Agent placement mostly changes what happens around tool calls. Local tools add little overhead beyond the work itself; remote tools add another network hop each time. On real tasks, that compounds quickly across dozens of loops, which is why agent placement is a performance decision as much as a security one.

The agent can live outside the sandbox, inside it, or in a hybrid setup.

### 1/ Agent outside the sandbox

In this model, the agent lives in its own environment and reaches across the sandbox boundary whenever it needs to execute tools or touch the filesystem. This keeps orchestration separate, but every tool call pays the cost of crossing that boundary.

The security upside is that durable credentials, orchestration logic, and conversation state can stay outside the sandbox. That reduces blast radius, but it does not make the system immune to prompt injection: a manipulated agent can still abuse whatever bridges and permissions the control plane exposes.

### 2/ Agent inside the sandbox

Here, the agent is co-located with the tool and filesystem environment. Tool calls stay local, which removes the repeated sandbox round-trip penalty, but it also means the agent itself lives inside the stronger isolation boundary.

This shrinks the gap between reasoning and execution, but it also means a compromised agent sits next to the same files and tools it is using. This pattern works best with a zero-trust posture toward the sandbox itself: even inside the isolation boundary, the agent should not be assumed trustworthy enough to hold durable secrets.

### 3/ Hybrid placement

A hybrid model keeps safe, common tool calls close to the agent while routing risky actions into a sandboxed execution target. This preserves much of the latency benefit of co-location without giving every capability the same trust boundary.

Here, "safe" means low-blast-radius operations such as workspace file access or routine local commands. "Risky" means actions that cross trust boundaries, such as networked installs, privileged system access, or anything that could expose secrets or affect external systems. For example, reading and writing project files might execute locally alongside the agent, while dependency installs and arbitrary code execution get routed into the sandboxed environment where network access and process execution are more tightly controlled.

## Head-to-Head Comparison

### Speed and Latency

The effect of these placement decisions becomes clearer when the task is held constant and only the system design varies. The interactive comparison below runs the same workload across all three placement models. The latency assumptions are adjustable, so it is possible to see how placement alone changes execution behavior and total task completion time.

Interactive comparison

Use the shared controls below to compare how the three placement models respond to the same workload and latency assumptions.

Sandbox boundary 160ms

Model API latency 120ms

Model response 1400ms

Tool execution 650ms

Tool calls per task 30 (Medium)

Safe tool calls (%)60%

### Agent Outside Sandbox

Total completion

81.8s

Total

81.8s

### Agent Inside Sandbox

Total completion

69.2s

Total

69.2s

### Agent Hybrid Sandbox

Total completion

74.0s

Total

74.0s

### Security Boundaries

The broader security model does not change, but the risk concentrates in different places depending on where the agent runs. On the surface, placing the agent outside the sandbox is the safest default, hybrid sits in the middle, and placing the agent inside is the riskiest if the question is simply what a compromised agent can touch directly. This is because an agent that can execute arbitrary code from within the environment is also closer to the files, tools, networked systems, and credentials that exist there.

In practice, though, that ordering does not materially change the security posture you need to design for. The attack surfaces differ across the three patterns, but all of them still need strong environment isolation and strong secret isolation, especially because prompt injection has the potential to be routed through whatever tools and permissions the system exposes.

### System Complexity

Latency is only part of the tradeoff. Every additional execution boundary also increases operational complexity.

Once the agent, the safe tool environment, and the sandboxed tool environment are no longer the same place, logs, traces, credentials, filesystem state, and failures are spread across multiple systems. That makes reproduction and debugging much harder, even if the latency cost is acceptable.

Across all three comparisons

Taking speed, security boundaries, and system complexity together, we favor placing the agent inside the isolated compute environment where it will actually execute code. It is usually the fastest and simplest approach, and it does not materially change the security posture as long as the sandbox is strongly isolated, treated as untrusted, and durable credentials stay outside it.

## Sandbox Lifecycle Patterns

Beyond securing the isolated environment and deciding where to place the agent, there is still the question of how that environment should live over time. Anthropic's [Agent SDK hosting guidance](https://platform.claude.com/docs/en/agent-sdk/hosting) and related docs on [secure deployment](https://platform.claude.com/docs/en/agent-sdk/secure-deployment) lay out a useful set of patterns here: ephemeral sessions, long-running sessions, hybrid sessions, and shared containers. These patterns describe how compute is created, how long it persists, and how state carries across work.

The right choice depends on the shape of the workload. Some agents do one-shot work and can safely disappear when they are done. Others need to stay warm, preserve state, or serve a continuous stream of user and system events. The diagrams below make those differences concrete.

### 1/ Ephemeral sessions

A new sandbox is created for a task, the agent does its work, and the environment is destroyed when the task completes. This is operationally simple, but it starts to break down when complexity extends beyond what is possible to accomplish with a single prompt.

### 2/ Long-running sessions

The sandbox stays alive across tasks and interactions. This reduces repeated startup cost, keeps state close to the work, and is often the best fit for high-frequency or proactive agents.

### 3/ Hybrid sessions

The sandbox can shut down between bursts of work, but state is preserved and reloaded when the user or system returns. This pattern trades some startup overhead for much better economics than keeping everything hot all the time.

### 4/ Shared container

Multiple agents or processes share one long-lived environment. This can work when close collaboration is essential, but it increases the risk of conflicts and makes isolation between agents much weaker.

Unlike the patterns above, shared containers are less about lifecycle and more about tenancy. A shared environment can itself be ephemeral, long-running, or hybrid; the key difference is that multiple agents or users share the same boundary, which weakens isolation in exchange for tighter collaboration.

Long-lived and hybrid patterns tend to make the most sense from both a performance and economic perspective. Long-lived sessions minimize repeated startup and hydration costs for agents that are active continuously, while hybrid sessions preserve most of the same statefulness benefits without paying to keep every environment hot during idle periods.

Ephemeral sessions are still useful for narrow one-shot tasks, and shared containers can make sense for tightly coordinated multi-agent systems, but for most user-facing agent products a long-lived or hybrid approach is best.

OpenComputer takes a middle path between long-lived and hybrid designs. Where possible, environments are paused and resumed on the same host so they can preserve local state and avoid unnecessary cold starts. At the same time, state can also be persisted and restored externally when a workload is more intermittent or when the environment needs to move between hosts.

## Conclusion

Agentic systems have operational needs that do not line up neatly with traditional application architectures. They need isolated execution, broad tool access, persistent working state, and a setup where reasoning and execution stay close enough that repeated tool calls do not pile on avoidable latency.

For most user-facing agent products, this means combining OS-level sandboxing, strong environment isolation, and trust-minimized credentials. Colocating the agent with its execution environment inside that boundary keeps latency low and operational complexity to a minimum.

On the lifecycle side, the most practical production choices are usually long-lived or hybrid environments. They preserve continuity where agents need it while still allowing environments to hibernate to avoid wasted compute during periods of inactivity.

The broader takeaway is simple: agents do not just need sandboxes. They need computers with the right isolation, the right placement, and the right lifecycle model for the workload they are serving. That is what we are building with OpenComputer.
