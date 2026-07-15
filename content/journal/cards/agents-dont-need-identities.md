---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "On self, ghost, and terminal-native agents"
date: "2026-07-15"
summary: "Pi and Herdr suggest a terminal-native agent architecture: assemble each agent as a batch, persist its artifacts, and let the worker disappear."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

I’ve been thinking about the word *shell*.

Partly because *Ghost in the Shell* is back in public view, between anniversary screenings of Mamoru Oshii’s 1995 film and [the new Science Saru adaptation](https://www.theghostintheshell-anime.jp/en/). But the title also offers a useful model for AI agents.

In *Ghost in the Shell*, the shell is replaceable. The ghost is what might remain: continuity, consciousness, a self.

Agent products often assume the same thing. Models and containers may change, but somewhere inside there is supposed to be a stable someone with a name, role, memory, and history.

Pi and Herdr suggest the relationship may be backward. An agent needs a shell and can produce something ghost-like while it runs. It does not follow that the ghost must persist.

## The self

We like giving agents selves because selves are easy to understand. The agent becomes an assistant, employee, reviewer, or manager. Conversations become memories. A workspace becomes a desk. Repeated invocations become one continuous life.

The metaphor helps the interface. The problem begins when it becomes the architecture. Persistent selves require identity, private memory, durable roles, ownership, and an organization chart.

Mark Fisher gives us language for this mistake. In *Ghosts of My Life*, hauntology describes a present occupied by futures that failed to arrive while familiar forms keep returning. Fisher, following Franco “Bifo” Berardi, called this the [slow cancellation of the future](https://www.opendemocracy.net/en/mark-fisher-ghosts-retromania/): the fading expectation that the future could be structurally different.

The “digital employee” is hauntological in exactly this sense. The model is new; the institution around it is an office. Profiles, managers, teams, inboxes, and company memory force a new computational medium back into twentieth-century labor organization.

Once that metaphor hardens into architecture, it limits what we can imagine. An agent company may look futuristic while revealing an inability to imagine a future beyond the company. It can also weaken accountability: [experimental research](https://hbr.org/2026/05/research-why-you-shouldnt-treat-ai-agents-like-employees) suggests that presenting AI as an employee reduces human oversight.

The stable self may be only an interface effect. Keep feeding a model the same name, files, and history, and it appears to be the same someone. The continuity may belong entirely to the inputs.

## The ghost

A ghost is not necessarily a self.

In Derrida’s hauntology, a ghost is made of traces. It acts without existing as a normal object continuously present in one place.

Gilbert Simondon offers a more precise formulation. In his philosophy of [individuation](https://www.upress.umn.edu/9780816680023/individuation-in-light-of-notions-of-form-and-information/), the individual is not the starting point. It is produced by a process together with its associated milieu.

An agent can be understood the same way:

```text
agent = model
      + task
      + context
      + tools
      + permissions
      + environment
```

The agent is not a pre-existing individual to which a harness is attached. It appears when those elements are assembled, acts, leaves effects, and ends. Change the milieu and a different form of agency appears.

The model weights are not a sleeping person. The prompt is not a soul. The conversation log is not proof of a continuing inner life.

The agent is an event.

## The shell

If the agent is an event, the shell makes the event possible.

By shell I mean something literal: agent work should execute through a terminal as a batch. The batch has a command, working directory, environment, input, capabilities, output, and exit status. Typed tools can make submission safer, but the work should still reduce to a visible terminal job that can be started, observed, interrupted, and allowed to disappear.

The terminal is the execution plane. The batch is the unit of agency.

```text
files + task + terminal batch
              ↓
        temporary ghost
              ↓
   files + output + exit status
```

A review batch can be read-only. A refactoring batch can use an isolated worktree. A deployment batch can expose only the commands it needs. A simple task may need no separate agent at all.

The shell is specific. The ghost is temporary. The self is optional.

## A terminal-native architecture

Pi and Herdr may point toward a new agent architecture.

Pi makes a harness serializable as a command. Herdr lets the model execute and supervise that command in a terminal. Together they allow an agent to construct the temporary batch system that will perform its work.

Pi describes itself as a minimal terminal coding harness. Its [design](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/) leaves sub-agents and background shell jobs out of the core. Models, prompts, tools, skills, extensions, context, and session policy can all be selected per invocation:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

That command is both a harness definition and a complete agent lifecycle.

Herdr supplies the execution plane. Through one typed Pi extension, the model can submit work in a particular project, observe terminal output, send input, wait, interrupt, and clean up. A pane handle names a temporary terminal job, not a persistent worker.

The combination is recursive. One Pi batch can use Herdr to launch another Pi batch with a different model, prompt, tool set, working directory, permission boundary, and lifetime. The child does not need a predefined agent type. Its harness is assembled from the task and serialized into a command.

With GPT-5.6, this already works without a delegation graph. A process can launch a fresh Pi for an independent review, run tests in another terminal, continue its own work, collect the results, and remove the temporary panes. On another task it can use a plain command or decide not to delegate.

The important part is not that one agent can call another. It is that the batch plan does not exist until the model needs it.

Traditional frameworks ask humans to design a workflow and place the model inside it. A terminal-native architecture exposes legible commands and lets the model compile the workflow into batches at runtime. The agent graph becomes an ephemeral batch plan materialized as a Unix process tree.

Stable terminal infrastructure below. Temporary organization above.

## Rich is not open

[Claude Code](https://code.claude.com/docs/en/features-overview) and [Codex](https://developers.openai.com/codex/subagents) are rich harnesses. They offer sub-agents, teams or threads, skills, plugins, hooks, and worktree isolation.

But richness is not openness.

A rich harness gives the model a larger menu. An open harness lets the model assemble the menu.

Claude Code and Codex are not sealed boxes; both expose shells and extension points. The difference is where the architecture pulls: toward product-defined forms, or toward terminal batches composed at runtime.

[Multica](https://www.multica.ai/) and [Raft](https://raft.build/) pull further toward durable organization. Profiles, squads, named teammates, inboxes, and private memories turn runtime configurations into continuing actors. Their queues, logs, and process supervision may be useful. Binding them to persistent selves is not. A queue needs a claimant; it does not need a colleague.

Fixed workflows can compensate for weak models and become ceilings for stronger ones. LangChain’s [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness) points toward just-in-time assembly of tools and context, with harnesses behaving more like compilers.

The test is simple: can every unit of work become a terminal batch? Can the model compose a batch its author did not anticipate? Can every worker disappear while another batch resumes from inspectable artifacts?

## The traces

If agents disappear, what carries the work forward?

Files.

Plans, code, prompts, skills, policies, and logs can all be files. Git turns them into history. The filesystem becomes both memory and protocol.

Artifacts are better than hidden agent memory because humans and agents can inspect, search, diff, edit, version, branch, restrict, and delete them.

Derek Parfit’s reductionism about [personal identity](https://plato.stanford.edu/entries/identity-personal/) is useful here—not because agents are persons, but because it separates continuity from numerical identity. Agent systems make that separation literal: work can continue through artifacts without continuity of the worker.

If another batch cannot resume from durable artifacts, the system is carrying hidden state.

Persist the inputs and outputs, not the process.

## No self to save

A lot of agent infrastructure asks how to preserve the agent. The better question is how little of it needs to survive.

Keep the files, capabilities, and rules for assembling a safe shell. Then create the next batch when there is work to do.

Weak models need more workflow encoded around them. Stronger models can construct the harness that will execute the workflow. Scaffolding that once supplied missing judgment can later obstruct it.

*Ghost in the Shell* asks whether a self can survive when the shell is replaceable.

Agents suggest another possibility: useful agency may not need a continuous self at all.

Persist the files.

Assemble the shell just in time.

Run the batch.

Let the ghost disappear.

## Further reading

- Mark Fisher, *Ghosts of My Life: Writings on Depression, Hauntology and Lost Futures*
- Jacques Derrida, *Specters of Marx*
- Gilbert Simondon, *Individuation in Light of Notions of Form and Information*
- Derek Parfit, *Reasons and Persons*
- Thorsten Ball, [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent)
- Vivek Trivedy, [“The Anatomy of an Agent Harness”](https://www.langchain.com/blog/the-anatomy-of-an-agent-harness)
- Birgitta Böckeler, [“Harness engineering for coding agent users”](https://martinfowler.com/articles/harness-engineering.html)
- Mario Zechner, [“What I learned building an opinionated and minimal coding agent”](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)
