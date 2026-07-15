---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "The office haunting agent design"
date: "2026-07-15"
summary: "Persistent, extensible runtimes should let agents assemble their own harnesses just in time instead of inheriting fixed roles and organizations."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

I’ve been thinking about the word *shell*.

Partly because *Ghost in the Shell* is back in public view, between anniversary screenings of Mamoru Oshii’s 1995 film and [the new Science Saru adaptation](https://www.theghostintheshell-anime.jp/en/). But the title also describes a tension in how we build AI agents.

In the film, the shell is the machinery. The ghost is the possible self inside it. Agent products increasingly treat the ghost as infrastructure: give every agent a name, role, memory, inbox, and history, then preserve that character as work moves around it.

My experience with Pi and Herdr has pushed me in the opposite direction. Put the persistence and flexibility in the shell. Let the workers appear when the work requires them and disappear when it does not.

I have watched a Pi process decide that it needs an independent review, open a new Herdr pane, launch a fresh Pi with a different prompt and tool set, continue its own work, collect the review, and remove the temporary pane. On another task it made a different arrangement. There was no reviewer waiting in an organization chart. The role existed for one job.

Most agent products would call this delegation or multi-agent orchestration. From the runtime, it looked more like creating a process.

That difference matters.

## The office

We like giving agents selves because selves make the interface easy to understand. The agent becomes an assistant, employee, reviewer, manager, or teammate. A workspace becomes a desk. A message queue becomes an inbox. Repeated invocations become one continuous life.

The metaphor is not harmless once it becomes architecture. A persistent employee needs a profile, private memory, durable role, ownership, and a place in the organization. Those choices arrive before the agent has done any work.

Mark Fisher’s writing on hauntology is useful here. In *Ghosts of My Life*, he describes a present occupied by old forms and by futures that failed to arrive. Fisher, following Franco “Bifo” Berardi, called it the [slow cancellation of the future](https://www.opendemocracy.net/en/mark-fisher-ghosts-retromania/): the loss of an expectation that the future might be structurally different from the present.

The digital employee is hauntological in exactly this sense. The model is new. The institution around it is an office. Profiles, managers, teams, inboxes, and company memory force a new computational medium back into twentieth-century labor organization.

This can even blur responsibility. [Experimental research](https://hbr.org/2026/05/research-why-you-shouldnt-treat-ai-agents-like-employees) suggests that presenting AI as an employee reduces human oversight. The language of colleagues and delegation makes it easier to forget that responsibility has not actually moved to a machine.

By identity, I do not mean a process ID, security principal, or audit record. Systems need stable handles and attribution. I mean the durable product persona: the assumption that a worker should exist as the same named actor before, during, and after its tasks.

Making that persona the basic unit shapes the whole system. Capabilities belong to an actor. Context accumulates in its private memory. Work reaches it through an inbox. Coordination happens through predefined roles. The organization becomes difficult to change because every piece of state assumes the organization already exists.

The problem is not that agents act too little like people. It is that we decide what kind of people they are before they encounter the task.

## The shell

A shell is a better primitive.

I do not mean that every agent must run in a terminal. A terminal is one useful implementation, and it is the one Pi and Herdr make unusually visible. The broader shell is the runtime around the agent: the place where work executes, state can be inspected, resources are reached, and new harnesses can be assembled.

A shell might expose terminal processes, containers, virtual machines, browser sandboxes, remote services, or interfaces we have not built yet. It can be long-lived. In fact, it is often more useful when it is. The runtime remains available while workers start, stop, and change shape inside it.

Humans and platforms still set the outside boundary: security policy, resource limits, available models, credentials, and which capabilities may be granted. Inside that boundary, the agent should have room to decide how a task is performed. It can choose the context, tools, model, permissions, working directory, and lifetime required for a worker. It can create one worker, several, or none. It can keep a useful process around or destroy it when the task ends.

The harness is assembled just in time because the task supplies information its author did not have. A fixed harness encodes one person’s guess about what future work will require. An extensible shell gives the agent primitives and lets it make the local decision.

This is not the same as adding more agent types to a framework. A larger catalog is still a catalog. The important question is whether the agent can compose a harness its platform author did not anticipate.

## A runtime that stays

Herdr is a concrete example of what I mean by a persistent shell.

A Herdr session has one authoritative server that owns the PTYs, processes, workspace layout, and runtime state. Clients are replaceable views. Close the TUI or lose the SSH connection and the jobs continue; reconnecting attaches to the same [persistent session](https://herdr.dev/docs/persistence-remote/).

The persistence belongs to the runtime. Workspaces and panes have stable handles because they must be addressable. Processes can outlive the agent that started them. Files and terminal history remain available to the next process. Herdr can also [restore session shape or resume supported agent sessions](https://herdr.dev/docs/session-state/) after a server restart.

Pi complements this by making the agent harness small and serializable. Its [design](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) leaves sub-agents and background jobs out of the core. Models, prompts, tools, skills, extensions, context, and session policy can be selected for each invocation.

A review worker can be created as a command:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

There is no permanent reviewer behind that command. The current agent decides that a review would help, gives the new invocation only what it needs, observes the result, and lets it end.

Through a typed Herdr extension, Pi can start work in a particular project, watch output, send input, wait, interrupt, and clean up. The typed boundary matters: the runtime can enforce what is allowed without prescribing the organization that must form inside it.

I use this pattern repeatedly. One Pi launches another for an independent opinion while tests run in a separate pane. Sometimes the child gets a different model or read-only tools. Sometimes a plain shell command is enough. Sometimes no delegation is needed. The arrangement is decided after the task is understood, not when the product is designed.

Herdr survives these arrangements. The temporary workers do not have to. That is the architectural separation: a resident shell runtime below, just-in-time harnesses above.

Nothing about this idea requires a terminal. The terminal simply makes the lifecycle legible. The same separation could exist in a container platform, a browser runtime, or a service built around typed jobs. Pi and Herdr are evidence that the pattern works, not a limit on where it can work.

## Two almost-right answers

Current agent products approach this problem from two directions.

[Claude Code](https://code.claude.com/docs/en/features-overview) and [Codex](https://developers.openai.com/codex/subagents) get many of the execution primitives right. They offer sub-agents or threads, skills, plugins, hooks, worktree isolation, and shell access. These are capable harnesses, and their built-in choices solve real problems.

But most of the architectural choices still come from the product. The model selects from a menu whose important categories, lifecycles, and extension points were designed in advance. Shell access makes the boundary less rigid, but the center of gravity remains a vertically integrated harness controlled by a large vendor.

That concentration matters. As these products become the environment in which agents work, a small number of companies get to decide what an agent can compose, which parts of the harness are replaceable, and which forms of delegation count as supported. A rich menu can still be a closed future.

[Multica](https://www.multica.ai/) and [Raft](https://raft.build/) move in a more open direction. They let users define profiles, squads, teammates, memories, inboxes, and longer-running organizations. The system is more configurable, and its coordination machinery is visible.

But the available freedom is organized around human assumptions. The user designs a company, then places agents inside it. A reviewer is a teammate. Coordination is messaging. Persistence is personal memory. Work is owned by named actors. The organization can be customized, but the idea of organization has already been chosen.

The choice should not be between a vendor-defined harness and a user-configured office.

A third option is to expose composable runtime primitives and let the agent assemble the harness required by the task. The platform defines the safe operating envelope. The agent decides the temporary form of work inside it.

Openness, in this model, is not the number of roles a human can configure. It is the number of useful arrangements the agent can create that the runtime author never named.

## What survives

If workers come and go, the work still needs continuity.

The shell can remain. Files, Git history, plans, prompts, policies, logs, task records, and outputs can remain. Active processes can remain when keeping them is useful. These are explicit artifacts: humans and later agents can inspect, search, diff, edit, restrict, and delete them.

A fresh worker should be able to enter the runtime, inspect what happened, and continue from those artifacts. If it cannot, some important state is trapped inside the old agent.

That is the real test of persistence. Not whether the same character returns, but whether the work can continue without hidden continuity of the worker.

A long-running worker is not forbidden. It may be cheaper or more effective to preserve its context. But persistence should be a runtime decision, not evidence that the worker has become a permanent member of an organization. Keep it because the task benefits, not because its profile already exists.

This is where the shell matters more than the self. The runtime carries capabilities and evidence forward. Identity is optional metadata added when a task genuinely needs it.

## No self to save

The office keeps returning because it gives us a ready-made picture of coordination. We already know what managers, specialists, teams, and inboxes look like. Agent products can appear futuristic while reproducing those forms almost unchanged.

That is the hauntological part of agent design. The ghost is not the model. It is the institution we cannot stop rebuilding around it.

Agents may be able to organize work in ways that do not resemble a company: a temporary process tree, a one-off review, a tool created for one decision, a worker that exists for five minutes, or a harness assembled only after the task reveals what it needs. We should not require these arrangements to look like human employment before we consider them real organization.

*Ghost in the Shell* asks whether a self can survive when the shell is replaceable.

Agent systems suggest a different design question: if the shell can preserve the work and create the next worker, why preserve the self at all?

Persist the shell. Leave the harness open. Let workers come and go.

The ghost we need to exorcise is not the agent. It is the office we keep rebuilding around it.

## Further reading

- Mark Fisher, *Ghosts of My Life: Writings on Depression, Hauntology and Lost Futures*
- Thorsten Ball, [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent)
- Vivek Trivedy, [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- Birgitta Böckeler, [“Harness engineering for coding agent users”](https://martinfowler.com/articles/harness-engineering.html)
- Mario Zechner, [“What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
