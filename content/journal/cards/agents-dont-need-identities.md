---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "Identity is a product choice. The shell is an execution primitive."
date: "2026-07-15"
summary: "Agent harnesses should be commands that models compose at runtime, not characters stored inside fixed organizations."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

Agent products keep trying to turn a model into someone.

They give it a name, a role, a memory, an inbox, sometimes even a manager.

Most agent work needs none of this. It needs a command line.

An agent should not be a character stored by the platform. It should be a command the model can compose.

The shell in this argument is literal. It is the command line: a public interface for starting work, connecting programs, passing input, observing output, and knowing when a process has ended.

*Ghost in the Shell* asks whether a self can survive when its body is replaceable. Agent products often assume the self before they have built an open shell. They preserve the ghost first.

I think that is backward.

## The ghost

The ghost is the idea that an agent must be the same continuing someone from one task to the next.

It has a profile and a biography. Conversations become personal memories. Capabilities belong to a role. Work arrives through an inbox. Repeated model invocations are presented as one life.

This is useful interface design when a product genuinely needs a character. It is a poor default for an execution system.

Mark Fisher’s writing on hauntology explains some of its appeal. In *Ghosts of My Life*, the present is haunted by old forms and by futures that failed to arrive. Fisher, following Franco “Bifo” Berardi, called it the [slow cancellation of the future](https://www.opendemocracy.net/en/mark-fisher-ghosts-retromania/): the fading expectation that the future might be structurally different from the present.

The digital employee is hauntological in exactly this sense. The model is new. The institution around it is an office. Profiles, managers, teams, inboxes, and company memory force a new computational medium back into twentieth-century labor organization.

Once those metaphors become primitives, they decide how the system can grow. Context accumulates inside named actors. Coordination becomes messaging between teammates. New capabilities require new roles. Before the agent sees the task, a human has already drawn the organization chart.

This can also make responsibility less clear. [Experimental research](https://hbr.org/2026/05/research-why-you-shouldnt-treat-ai-agents-like-employees) suggests that presenting AI as an employee reduces human oversight. Calling a process a colleague does not transfer accountability, but it can make that transfer feel as if it happened.

The stable self may be no more than an interface effect. Feed a model the same name, files, and history and it appears to be the same someone. The continuity belongs to the inputs. The architecture does not need to preserve a fictional owner around them.

By identity, I mean this persistent product persona—not the process IDs, credentials, and audit records any real system needs.

## The shell

A shell gives an agent somewhere to act without deciding who it is.

A shell command has a working directory, environment, input, output, and exit status. It can call ordinary programs, connect them with pipes, read and write files, and be launched by another process. The contract is old, small, and understood by almost every computing environment.

It also makes a complete agent harness portable. A command can select a model, load a prompt and skills, expose a set of tools, pass in context, apply a session policy, and define when the worker should exit. Change the command and a different worker appears.

The command line does not have to be typed by a human or displayed inside a terminal emulator. It can be generated and launched headlessly by another agent. What matters is the shell contract: the work becomes an inspectable command rather than a private object inside an agent platform.

This is where just-in-time assembly matters. The agent examining the task knows more about the task than the harness author did months earlier. Within the permissions and resource limits set by humans, it should be able to decide whether it needs another model, which context that model receives, what tools it may use, and how long it should live.

A fixed harness turns the author’s expectations into a ceiling. Adding more predefined agent types raises the ceiling but does not remove it. A catalog of reviewers, researchers, testers, and managers is still a catalog.

The stronger test is whether an agent can compose a worker that the platform author did not anticipate.

## Who defines the worker?

This question separates three approaches to agent design.

[Claude Code](https://code.claude.com/docs/en/features-overview) and [Codex](https://developers.openai.com/codex/subagents) get many of the practical details right. They provide sub-agents or threads, skills, plugins, hooks, shell access, and worktree isolation. Their built-in workers solve real problems and are often easier to use than assembling everything manually.

But the vendor still defines the important shapes. The model can select workers and features from a rich menu, while the menu’s categories, lifecycles, and extension points remain product decisions. Shell access softens this boundary without removing it.

As these tools become the environment where agent work happens, that design authority becomes concentrated in a few large companies. They decide which parts of the harness are open, which combinations are supported, and how far the model may reorganize its own work. A rich menu can still produce a narrow future.

[Multica](https://www.multica.ai/) and [Raft](https://raft.build/) move in a more open direction. They let users configure profiles, squads, teammates, memories, inboxes, and longer-running organizations. The coordination machinery is visible and more adaptable.

The limitation is different. The user gets to design the organization, but the available primitives already assume a human organization. A reviewer is a teammate. Coordination is messaging. Persistence is personal memory. Work belongs to named actors.

One approach gives the agent a vendor-designed harness. The other lets a human configure an office.

There is a third option: expose safe, composable execution primitives and let the agent define the worker at runtime. Humans set the boundaries. The current agent decides what command to build inside them.

Openness is not the number of roles a human can configure. It is the range of useful workers the model can create that nobody named in advance.

## Pi and Herdr

Pi and Herdr make this architecture concrete.

Pi is a minimal coding-agent harness whose [design](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) leaves sub-agents and background jobs out of the core. Models, prompts, tools, skills, extensions, context, and session policy can be selected for each invocation.

A complete review worker can be expressed as a shell command:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

There is no permanent reviewer behind this command. The invocation creates one for the current diff, gives it read-only tools, collects its output, and ends.

Herdr provides the runtime in which these shell processes remain visible and controllable. Its server owns the PTYs, processes, workspace layout, and runtime state. Clients are replaceable views. Close the TUI or lose the SSH connection and the jobs continue; reconnecting attaches to the same [persistent session](https://herdr.dev/docs/persistence-remote/).

Pi makes the harness a command. Herdr lets an agent start that command in a project, watch it, send input, interrupt it, and clean it up through a typed interface.

I use this pattern repeatedly. A Pi process decides it wants an independent opinion, opens a Herdr pane, launches a fresh Pi with a narrower prompt and tool set, continues its own work, and collects the result later. On another task it may run tests in parallel, choose a different model, use a plain shell command, or avoid delegation altogether.

The arrangement does not exist until the task calls for it. It does not need to survive after the task ends. Herdr remains, the files remain, and the next agent can assemble a different harness from the same shell.

This is multi-agent work without an agent organization. At runtime, it is simply one process composing and launching another command.

## What survives

Workers can disappear without making the work disappear.

Files, Git history, plans, policies, logs, commands, and outputs carry the work forward. Useful processes can keep running. Humans and later agents can inspect, search, diff, edit, restrict, and delete the artifacts that remain.

A fresh worker should be able to enter the project, inspect those artifacts, and continue. If it cannot, important state is trapped inside the old agent.

Persistence should therefore belong to the work, not to a fictional worker who owns it. Keep a process alive when the task benefits from its context. Do not turn that implementation choice into a permanent identity.

*Ghost in the Shell* asks what remains of the self when the shell can be replaced. Agent systems raise the inverse question: if the work survives through commands and artifacts, what exactly are we preserving the self for?

Persist the work, not the worker.

Keep the shell open.

Let the ghost disappear.
