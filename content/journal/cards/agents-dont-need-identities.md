---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "On self, ghost, and shell in agent systems"
date: "2026-07-15"
summary: "AI agents may not need persistent identities: keep task state in files, assemble a Pi harness on demand, and let each agent exit like a Unix process."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

I’ve been thinking about the word *shell* lately.

Partly because *Ghost in the Shell* is back in public view, between recent anniversary screenings of Mamoru Oshii’s 1995 film and [the new Science Saru adaptation](https://www.theghostintheshell-anime.jp/en/). But also because the title now feels like a useful way to think about AI agents.

In *Ghost in the Shell*, the shell is replaceable. The ghost is what might remain: consciousness, continuity, a self that can move from one body to another.

Agent systems quietly assume something similar. The model or container may change, but somewhere inside the product there is supposed to be a persistent agent—a stable “someone” with a name, a role, a memory, and a history.

My recent experiments with Pi and Herdr have made me wonder if this gets the relationship backward.

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

## Why Pi fits this model

Pi made this more than a metaphor for me because it is already very close to the Unix idea of an agent.

This intuition is showing up elsewhere too. Thorsten Ball’s [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent) strips a coding agent down to an LLM, a loop, and tools. Recent [harness engineering](https://martinfowler.com/articles/harness-engineering.html) work uses the shorthand `Agent = Model + Harness`. Pi is interesting because it turns that equation into an ordinary command.

Pi is not primarily an agent service. It is a harness and a command-line program. It intentionally leaves sub-agents and background shell jobs out of the core, expecting those workflows to be composed through extensions and terminal processes. It can be interactive, but it also has a non-interactive, effectively headless print mode: give it a prompt, let it use its tools, receive the output, and let the process exit.

```bash
pi --no-session -p "Review the current diff"
```

That one command is already a complete agent lifecycle.

The durable definition of the agent can live in files. A TypeScript extension defines its tools. A skill or prompt defines a procedure. Context files describe the project. CLI flags choose the model, thinking level, tool access, and whether a session should be saved.

A more specific agent is still just another invocation:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

There is nothing to provision. No identity has to be registered. No worker has to be kept warm. Write the extension and prompt once, then summon the agent with a command whenever that harness is useful.

This is why Pi is such a good framework for the hypothesis. The persistent parts—extensions, skills, prompts, policies, and project context—are files. The agent itself is a process created from those files.

Pi can save a session when a trace is useful, but it does not require the process to pretend that the trace is a self. Headless mode makes the separation obvious: the shell constructs the agent, the agent acts, stdout and files remain, and the process ends.

## Ghosts making shells

Herdr adds process supervision to that model. It manages visible terminal workspaces, panes, working directories, input, output, and lifecycle.

I wrote a thin Pi extension that exposes Herdr as one typed tool. It lets Pi start work in the right project, observe it, send input, wait for results, and clean it up. A short skill describes when parallel or interactive terminal work is appropriate.

The extension does not define a team. There is no permanent reviewer, tester, or researcher. It exposes process primitives and a few lifecycle rules.

After I moved the setup to GPT-5.6, I noticed a qualitative change in my own workflow: Pi became much better at composing those primitives without a task-specific delegation plan or predefined agent graph.

During a normal engineering task, it might ask the extension to launch a fresh Pi process for an independent review, run checks in another terminal, continue its main work, then collect the results. On another task it might use a plain shell command or decide not to delegate at all.

The surprising part was not that one agent could call another. The surprising part was that the workflow did not exist until the model needed it.

A temporary ghost wrote the command line for another shell and summoned another temporary ghost.

That second agent did not need a name or a history. Its entire identity was the extension, prompt, files, and flags assembled for that task. When the review ended, the review remained and the reviewer disappeared.

This felt more natural than a permanent multi-agent team. Even the organization could be temporary.

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

As models improve, this becomes easier. Weak models need more workflow encoded around them. Stronger models can look at available tools and construct the workflow at runtime. The architecture itself can become temporary.

That may be the deeper meaning of what I saw with Pi and Herdr. The model did not become a better permanent employee. It became better at summoning and releasing processes.

*Ghost in the Shell* asks whether a self can survive when the shell is replaceable.

Agents suggest another possibility: perhaps useful agency does not need a continuous self in the first place.

The ghost is the temporary pattern. The shell is the harness. The filesystem holds the traces.

Persist the files.

Rebuild the shell.

Summon the ghost when needed.

## Further reading

- Thorsten Ball, [“How to Build an Agent”](https://ampcode.com/notes/how-to-build-an-agent)
- Birgitta Böckeler, [“Harness engineering for coding agent users”](https://martinfowler.com/articles/harness-engineering.html)
- Mark Fisher, *Ghosts of My Life: Writings on Depression, Hauntology and Lost Futures*
