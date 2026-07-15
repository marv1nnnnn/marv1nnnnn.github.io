---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "What Pi and Herdr taught me about disposable agents"
date: "2026-07-15"
summary: "For terminal-native coding agents, persist the runtime and artifacts, then create workers as each task needs them."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

I didn’t set out to build a multi-agent system. I wanted one model to review a diff while another terminal ran the tests.

In my current setup, the Pi session I’m working with can open two Herdr panes, start a fresh Pi in one, run the test suite in the other, collect both results, and close the temporary panes. The second Pi has no name, profile, inbox, or private memory. It has a task, a working directory, a limited set of tools, and an exit condition.

That has been enough.

I borrowed the title of this article from *Ghost in the Shell*, but this isn’t an argument about machine consciousness. It is a much narrower software question: when an agent does a piece of work, where should its state live?

A lot of agent products answer by creating a persistent character. Pi and Herdr have pushed me toward a different default: keep the environment running, keep the artifacts, and create the worker only when there is work to do.

## What I mean by identity

“Agent identity” can refer to several different things, and they shouldn’t be mixed together.

A running process needs a handle. A pane, session, task, and model invocation need IDs so that we can find, monitor, interrupt, and audit them. An agent may also need a security principal so that permissions and actions can be attributed correctly. None of this is optional.

The identity I’m questioning is the product-level persona: a named actor with a role, private memory, history, inbox, and an expectation that it will still be the same actor tomorrow.

That model is appealing because it is familiar. The agent becomes an employee, reviewer, manager, or teammate. The interface is easy to explain, and for some products the ongoing relationship may be the point.

The trouble starts when the metaphor becomes the default architecture. Before the agent has done anything, the system already needs profiles, roles, memory boundaries, ownership rules, and an organization chart. A new computational tool ends up looking a lot like an office.

There is also a human-factors cost. [Experimental research](https://hbr.org/2026/05/research-why-you-shouldnt-treat-ai-agents-like-employees) suggests that presenting AI as an employee can reduce human oversight. The language of colleagues and delegation can make responsibility less clear just when the system needs more scrutiny.

A familiar name and a long conversation can create a convincing sense of continuity. Technically, though, much of that continuity may simply be reconstructed from the same prompt, files, and history on every invocation. If the work can continue without preserving the worker, I’m not sure the worker needs to become a permanent object in the system.

## Start with a job

For coding work, I have found a terminal job to be a more useful starting point than a digital employee.

The job has a command, working directory, environment, inputs, available tools, permissions, output, and exit status. It can be started, observed, interrupted, retried, and removed with machinery we already understand.

For example, Pi can describe a complete review worker in one invocation:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

There is no predefined “reviewer” waiting inside the system. The command supplies the model, instructions, tools, input, and lifetime needed for this review. When it exits, the review remains and the worker does not.

This doesn’t mean the control interface has to be an untyped shell string. A typed tool can validate the model, project, permissions, and command before anything runs. The important part is that the work still becomes a visible terminal job rather than disappearing into a private agent runtime.

The batch is useful because its boundaries are concrete. I can see what entered it, what it was allowed to touch, what it produced, and whether it finished. For a small task, I may decide that a plain command is enough and skip the extra model invocation entirely.

## Put persistence underneath the agent

Herdr is the part that changed how I think about persistence.

A Herdr session has one authoritative server that owns the PTYs, processes, workspace layout, and runtime state. Clients are replaceable views. If I close the TUI or lose an SSH connection, the jobs keep running; reconnecting attaches to the same [persistent session](https://herdr.dev/docs/persistence-remote/).

This infrastructure needs stable identities. A workspace or pane must remain addressable, and direct terminal control needs a clear owner. But a pane ID answers “where is this running?”, not “who is this worker?”

That distinction lets the durable and temporary parts sit at different levels.

Herdr keeps the terminals and processes alive. The repository keeps the code. Git keeps the history. Files can hold plans, prompts, policies, skills, test output, and handoff notes. A fresh Pi process can inspect those artifacts and continue the work without pretending to be the process that came before it.

Herdr can also [restore session shape or resume supported agent sessions](https://herdr.dev/docs/session-state/) after a server restart. Again, what survives is explicit: processes where possible, terminal history, layout, files, and session records. A fictional biography is not required.

## Compose the work when it is needed

Pi describes itself as a minimal terminal coding harness. Its [design](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) deliberately leaves sub-agents and background shell jobs out of the core. Models, prompts, tools, skills, extensions, context, and session policy can be selected for each invocation.

Herdr supplies the terminal control around it. Through one typed Pi extension, a model can start work in a project, watch the output, send input, wait, interrupt, and clean up.

The combination is simple but flexible. A Pi process can launch a fresh Pi for an independent review, run tests in another terminal, continue its own work, and collect the results later. On another task it can choose a different model and tool set, use a plain shell command, or avoid delegation altogether.

I don’t have to define a permanent reviewer, tester, researcher, and manager in advance. The process doing the work decides what it needs, starts those jobs, and lets them end. The temporary organization exists as a Unix process tree for as long as the task requires it.

This is different from drawing a delegation graph before the work begins. Fixed workflows are useful when the task is stable or the model needs more guidance. But they can also become a ceiling: the system can only use the roles and paths its author anticipated.

A terminal gives the model a smaller set of ordinary, inspectable primitives. The model can combine them at runtime without requiring the agent platform to know every future workflow.

## Other harnesses make a different trade-off

[Claude Code](https://code.claude.com/docs/en/features-overview) and [Codex](https://developers.openai.com/codex/subagents) include richer built-in structures for sub-agents, skills, plugins, hooks, threads, and worktree isolation. Those features are useful, and both products still expose shells and extension points.

The difference is not “closed versus open” in an absolute sense. It is where each system puts its defaults. A product-defined sub-agent gives the model a supported menu of worker types and coordination mechanisms. A terminal-native setup starts with processes and lets a particular invocation assemble what it needs.

[Multica](https://www.multica.ai/) and [Raft](https://raft.build/) go further toward durable organizations, with profiles, squads, named teammates, inboxes, and private memories. That can make long-running coordination easier to understand. It also couples queues, logs, and process supervision to the idea of continuing actors.

I would rather separate those concerns. A queue needs durable ownership and status. It does not necessarily need the owner to be presented as a colleague. A task needs an audit trail. It does not necessarily need a personality.

LangChain’s [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) points in a related direction: tools and context can be assembled just in time instead of being permanently attached to one agent definition.

## Where persistent identity may help

Disposable workers should be a default, not a law.

A personal assistant may need to maintain preferences and an ongoing relationship with one user. A customer-facing character may need a consistent voice. Some long-running operational roles need clear responsibility across days or teams. Regulated work may require durable security identities and detailed attribution.

Even in those cases, it is worth asking what actually needs to persist. Preferences can belong to the user account. Responsibility can belong to a task record. Permissions can belong to a security principal. Conversation history can be an inspectable artifact. None of those automatically requires a private, human-like self that owns all of them.

The practical test is whether a fresh process can resume the work from explicit state. Can it inspect the repository, task, logs, and policy and know what to do next? If not, what information is trapped inside the old agent, and why?

Hidden state makes systems harder to inspect and recover. Persistent personas can make that hidden state feel natural rather than making it less risky.

## What should survive

My working rule is now straightforward: persist the environment and the evidence; create workers for tasks.

For terminal-based coding work, that usually means keeping the repository, Git history, terminal runtime, permissions, task description, and outputs. A model process can be restarted or replaced. Another batch should be able to pick up from what the previous one left behind.

Pi and Herdr haven’t proved that agents never need identities. They have shown me how much useful agent work can happen without building identities first.

That is simpler to operate, easier to inspect, and easier to discard when the job is done.

## Further reading

- Thorsten Ball, [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent)
- Vivek Trivedy, [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- Birgitta Böckeler, [“Harness engineering for coding agent users”](https://martinfowler.com/articles/harness-engineering.html)
- Mario Zechner, [“What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
