---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "On self, ghost, and shell in agent systems"
date: "2026-07-15"
summary: "AI agents may not need persistent identities or fixed workflows. Pi and Herdr point toward a process-native architecture that assembles harnesses just in time and persists only their artifacts."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

I’ve been thinking about the word *shell* lately.

Partly because *Ghost in the Shell* is back in public view, between recent anniversary screenings of Mamoru Oshii’s 1995 film and [the new Science Saru adaptation](https://www.theghostintheshell-anime.jp/en/). But also because the title now feels like a useful way to think about AI agents.

In *Ghost in the Shell*, the shell is replaceable. The ghost is what might remain: consciousness, continuity, a self that can move from one body to another.

Agent systems quietly assume something similar. The model or container may change, but somewhere inside the product there is supposed to be a persistent agent—a stable “someone” with a name, a role, a memory, and a history.

Pi and Herdr have made me wonder if this gets the relationship backward.

Maybe an agent needs a shell and can produce something ghost-like while it runs. But it does not follow that the ghost is a self, or that anything inside the process must persist when the work is done.

## The self

We like giving agents selves.

A self makes the technology easier to understand. The agent becomes an assistant, employee, reviewer, researcher, or manager. It gets a name and a biography. Its conversations become memories. Its workspace becomes a desk. Its repeated invocations become one continuous life.

This is a familiar human move. When a technology is strange, we explain it with metaphors we already know. Computers got desktops, folders, windows, and trash cans. Voice assistants got human voices and names. Agents get personalities and careers.

The metaphor may help the interface. The problem begins when it becomes the architecture.

A system built around persistent selves needs to preserve identity, synchronize memory, assign durable roles, and decide which agent owns which work. Before long, a new computational medium is reenacting an old organization chart.

That framing is not neutral. [Recent experimental research](https://hbr.org/2026/05/research-why-you-shouldnt-treat-ai-agents-like-employees) suggests that presenting AI as an employee can weaken human oversight and shift accountability away from the people using it.

Borrowing Mark Fisher’s use of hauntology loosely, the “digital employee” may be an old institutional form returning inside a genuinely new technical medium. Fisher wrote about lost futures and a culture trapped recycling familiar forms; the future of agents may look futuristic while still carrying the ghost of the twentieth-century office.

But an agent is not a human worker with biology removed.

A human self cannot be reconstructed from a prompt, a directory, and a list of tools. An agent’s operating conditions can, even if its exact output remains nondeterministic.

What we experience as continuity may come entirely from the state we keep feeding back into each invocation. The name is stable. The files are stable. The session history is stable. So we project a stable someone behind them.

The self may be an effect of the interface rather than a property of the process.

## The ghost

A ghost is not necessarily a self.

In Derrida’s broader hauntological sense, a ghost is made of traces. It is present without being fully present. It acts, but it is not a normal object that sits continuously in one place.

That feels closer to an agent.

An agent appears when a model is brought together with a task, context, tools, permissions, and an environment. It reads, reasons, acts, and leaves effects behind. Then the invocation ends.

```text
agent = model
      + task
      + context
      + tools
      + permissions
      + environment
```

Change the context or tools and a different form of agency appears. Invoke the same model tomorrow and there is no obvious reason to call the resulting process the same individual, except that we choose to present it that way.

The model weights are not a sleeping person. The prompt is not a soul. The conversation log is not proof of an inner life continuing between calls.

The agent is an event.

It is real in what it does. A temporary process can still find a bug, edit a repository, make a decision, or launch another process. Agency does not require a permanent self any more than computation requires a permanent Unix process.

Perhaps “ghost” is useful precisely because it lets us talk about agency without pretending there is a little human inside the machine.

## The shell

If the agent is an event, the shell is what makes the event possible.

The shell is the harness: the model, tools, files, permissions, working directory, prompt, and runtime. It determines what kind of ghost can appear and what that ghost can do.

By shell I do not mean that every agent must speak Bash. Bash is syntax. I mean the broader Unix process contract: arguments and environment on the way in; files and streams across the boundary; permissions around the work; output, signals, and an exit status on the way out. Typed tools and supervisors are useful when they remain transparent translations of those primitives.

This is why the Unix command line feels like a better model for agents than the employee.

A Unix process has state while it runs. It has memory, open files, environment variables, and permissions. But the process is disposable. It reads files and stdin, produces files and stdout, returns an exit status, and disappears.

Nobody worries about preserving the identity of a particular `grep` process. If its work matters, the result is written somewhere durable.

An agent can follow the same contract:

```text
files + task + shell
         ↓
   temporary ghost
         ↓
files + output + exit status
```

The shell can be assembled differently for every task. A review shell can be read-only. A refactoring shell can have edit access and an isolated worktree. A deployment shell can expose a narrow set of commands. A simple task may need no separate agent at all.

The shell is specific. The ghost is temporary. The self is optional.

## A process-native agent architecture

Pi and Herdr may point toward a different architecture for agents.

Pi makes the harness addressable from the shell. Herdr makes the process tree addressable to the model. Together they let an agent construct not only its next action, but the temporary system that will perform it.

```text
files and Git    → durable state
Pi               → just-in-time harness construction
Herdr            → process creation and supervision
model            → runtime composition
```

Pi describes itself as a minimal terminal coding harness. Its [design](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) intentionally leaves sub-agents and background shell jobs out of the core. Extensions can add or replace tools and behavior; skills and prompts define procedures; invocation flags choose the model, thinking level, tools, extensions, context, and session policy.

A task-specific agent is therefore an ordinary command:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

That invocation is both a harness definition and a complete agent lifecycle. Pi does not merely put a shell tool inside the harness. It makes the harness itself addressable from the shell.

Herdr supplies the lower layer. Through one typed Pi extension, the model can start a process in a particular project, observe its output, send input, wait for it, and clean it up. The types make the interface safer; they do not introduce a new agent ontology. A pane handle names a temporary process resource, not a persistent self.

This creates a recursive capability. A running Pi process can use Herdr to launch another Pi with a different model, prompt, tool set, extension set, working directory, permission boundary, and lifetime. The child does not have to match a predefined agent type. Its harness is assembled from the needs of the task.

```text
task
  ↓
model chooses a topology
  ↓
Pi assembles task-specific harnesses
  ↓
Herdr materializes a temporary process tree
  ↓
files + output + exit status
```

With GPT-5.6, this already works without a predefined delegation graph. One process can launch a fresh Pi for an independent review, run tests elsewhere, continue its own work, collect the results, and remove the temporary panes. On another task it can use a plain command or decide that no delegation is needed.

The important part is not that one agent can call another. It is that the workflow does not exist until the model needs it.

Traditional agent frameworks ask humans to design the workflow and then place the model inside it. A process-native architecture asks humans to expose legible capabilities and lets the model compile the workflow at runtime. The agent graph becomes an ephemeral artifact, like a Unix process tree.

This is the possible new paradigm: stable infrastructure below, temporary organization above. Do not design a permanent agent organization. Design the primitives from which the model can instantiate one just in time.

## Rich is not open

Modern coding harnesses are becoming very rich. [Claude Code](https://code.claude.com/docs/en/features-overview) has custom sub-agents, agent teams, hooks, skills, plugins, and worktrees. [Codex](https://developers.openai.com/codex/subagents) has sub-agents, skills, plugins, threads, automations, and worktree isolation.

But richness is not the same as openness.

A rich harness gives the model a larger menu. An open harness lets the model assemble the menu.

Most built-in multi-agent systems freeze their ontology early. Work is expected to fit a sub-agent, teammate, thread, automation, or plugin. The model may decide when to use those objects, but the product has already decided what kinds of objects may organize the work. The agent orchestrates inside the harness rather than constructing the harness itself.

This is a difference of degree, not a claim that Claude Code or Codex are sealed boxes. Both expose shells, configuration, extension points, and programmatic interfaces. A determined user can make either one launch another configured process. The difference is where the architecture pulls: toward product-defined forms, or toward temporary compositions of lower-level capabilities.

Platforms such as [Multica](https://www.multica.ai/) and [Raft](https://raft.build/) pull further toward durable organization. Profiles, squads, named teammates, inboxes, and private memories turn runtime configurations into continuing actors. Their process supervision, queues, messages, and logs may be useful. Binding those facilities to persistent selves is the unnecessary part. A queue needs a claimant; it does not need a colleague.

This distinction matters more as models improve. A fixed workflow can compensate for a weak model and become a ceiling for a stronger one. LangChain’s [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) points toward just-in-time assembly of tools and context, with harnesses behaving more like compilers.

The test is simple: can the running model construct a harness its author did not anticipate? Can every worker disappear while another process resumes from inspectable artifacts? If so, the system preserves the work without preserving a fictional worker.

## The traces

If agents disappear, what carries the work forward?

Files.

Plans are files. Code is files. Prompts are files. Skills and policies are files. Logs and session traces are files. Git turns files into history. If an agent learns something worth keeping, it can write that knowledge somewhere the next process can read.

At the task layer, these files are the durable state I want. The operating system, Herdr, and model service may stay up, but they are infrastructure, not a persistent agent self.

The filesystem is not only memory. It is also the protocol between agents. Agents do not need to share a self; they can communicate by leaving artifacts.

Files are better than hidden agent memory because they are inspectable. They can be searched, diffed, edited, versioned, branched, permissioned, and deleted. Humans and agents can look at the same state.

If the next agent needs context, give it the relevant files. If continuity depends on something that cannot be reconstructed from durable artifacts, the system is carrying hidden state.

The ghost does not persist. Its traces do.

Another ghost can appear later, read those traces, and continue the work. It does not have to pretend it was the same person all along.

This is the part of the Unix model I find most important: persist the inputs and outputs, not the process.

A persistent agent is often just a process whose traces were never separated from its identity.

## No self to save

A lot of agent infrastructure asks how to preserve the agent: its memory, personality, role, and relationship to the user.

I think the better question is how little of the agent needs to survive.

Keep the files. Keep the capabilities. Keep the rules for assembling a safe shell. Keep the outputs that matter. Then create the next agent when there is work to do.

As models improve, this becomes easier. Weak models need more workflow encoded around them. Stronger models can look at available primitives and construct not only the workflow but the harness that will execute it. Scaffolding that once supplied missing judgment can later obstruct it. The architecture itself can become temporary.

That may be the deeper meaning of Pi and Herdr. The model does not become a better permanent employee. It becomes better at summoning and releasing processes.

*Ghost in the Shell* asks whether a self can survive when the shell is replaceable.

Agents suggest another possibility: perhaps useful agency does not need a continuous self in the first place.

The ghost is the temporary pattern. The shell is the harness. The filesystem holds the traces.

Persist the files.

Assemble the shell just in time.

Summon the ghost when needed.

## Further reading

- Thorsten Ball, [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent)
- Vivek Trivedy, [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- Birgitta Böckeler, [“Harness engineering for coding agent users”](https://martinfowler.com/articles/harness-engineering.html)
- Mario Zechner, [“What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
- Mark Fisher, *Ghosts of My Life: Writings on Depression, Hauntology and Lost Futures*
