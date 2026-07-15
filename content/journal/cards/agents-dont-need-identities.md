---
id: "agents-dont-need-identities"
title: "Agents Don’t Need Identities. They Need a Shell."
subtitle: "Hauntology, machinic intelligence, and the command line"
date: "2026-07-15"
summary: "Agent design is haunted by human ideas of memory and identity. Pi and Herdr point toward temporary agency assembled through an open command line."
tags: ["ai","agents","pi","herdr","unix","opinion","essay"]
---

Science SARU’s [new *The Ghost in the Shell*](https://www.theghostintheshell-anime.jp/en/) began airing in July 2026. One of the most interesting things about it is how directly it returns to Masamune Shirow’s original manga. The color and humor are back, but so is the manga’s stranger account of identity, in which bodies are replaceable, memories are unreliable, and a mind does not always begin inside a person.

The Puppet Master is the clearest example. It begins as a government program, Project 2501, but develops into something else while moving through the network. It has no original body, no childhood, and no human biography to preserve. It is not the uploaded soul of someone who once lived. Yet it can act, reflect on its own condition, and ask to be recognized as a form of life.

Agent products have taken almost the opposite path. We start with software that can act and immediately try to turn it into someone. We give it a name, a role, a memory, an inbox, and sometimes a manager. Before asking what form of agency the technology makes possible, we design a person for it to imitate.

This article is about another possibility: a ghost without a soul. By that I do not mean an empty or unconscious machine. I mean agency that does not require a permanent self behind it—something that can be assembled for a task, leave effects in the world, and disappear when the task is over.

## The haunting

Mark Fisher used hauntology to describe a culture unable to escape forms inherited from the past. In *Ghosts of My Life*, he writes about the [slow cancellation of the future](https://www.opendemocracy.net/en/mark-fisher-ghosts-retromania/): new technology continues to arrive, but our sense of how life might be organized around it becomes less adventurous. The future looks increasingly like the present with upgraded equipment.

Agent products often feel like a small example of this problem. The models are new, but the structures around them are familiar. An agent is presented as an employee. Specialized invocations become teammates. A queue becomes an inbox, a set of permissions becomes a role, and a collection of workers becomes a company. These metaphors help people understand the product, but they also decide what the product is allowed to become.

Memory is the most revealing example. Human memory is closely tied to identity: my memories are part of what makes me the person I am. Agent “memory” is usually something more ordinary. It may be a conversation log, a summary, a file, a database record, or a retrieval system that selects information for the next context window. None of this has to belong to a continuing self. The state could belong to a project or task and be available to whichever invocation needs it next.

Once we call that state *the agent’s memory*, however, ownership and continuity start to feel necessary. The agent needs a profile to contain its history. Capabilities attach to that profile. Work is routed back to the same named actor because it supposedly remembers what happened before. A loose collection of technical choices hardens into a biography.

The same thing happens with roles and teams. A model invocation configured to review code becomes “the reviewer,” as if the role existed before the diff. Several useful processes become an organization, even when they will never work together again. This is hauntology operating at the level of software architecture: the old office does not merely describe the new system; it determines its primitives.

## The ghost

The Puppet Master suggests a different way to think about agency. It is not a self that survives by carrying the same memories from one body to another. It appears from activity across a network and only later asks what kind of entity it has become. Its ghost is not the continuation of an earlier person.

Our agent systems are much less dramatic, but they already make identity difficult to locate. If the same model receives a different prompt and context, is it still the same agent? If a different model reads the same files and continues the task, has the agent changed? After a long session is compressed into a short summary, what exactly remains continuous? Product interfaces give confident answers by preserving a name and an icon, but the underlying system does not provide a stable boundary.

Nick Land’s early writing offers language for the stranger alternative. In [“Machinic Desire”](http://xenopraxis.net/readings/land_machinicdesire.pdf), he treats thought as something that need not belong to an autonomous human subject: “Thought is a function of the real, something that matter can do.” His larger political project is not required here. The useful idea is that intelligence may be an impersonal process produced across a system rather than a possession held inside an individual.

That is one way to understand an agent’s ghost. A model invocation becomes capable of acting because a particular task, context, set of tools, permissions, and environment have been brought together. The coherence is real enough to do work, but it does not have to be permanent. Change the arrangement and another form of agency appears.

Models, context, and long-running working state still matter, but their differences can be described directly. Fisher explains why we keep placing an owner behind them: the continuing individual is the form we already know. Land makes it easier to imagine intelligence without that form. The engineering question is how to give such temporary agency somewhere to act.

## The shell

The answer can be very literal: give it a shell. A command runs in a directory, receives input and environment, calls tools, reads and writes files, produces output, and eventually returns an exit status. It can be inspected, recorded, launched by another process, and combined with programs its author did not know about.

An agent harness can fit inside that contract. The command can choose a model, load instructions and skills, expose particular tools, pass in context, and decide whether the session should persist. Another agent can construct the command after it has examined the task. Humans still define the security boundary and available resources, but they do not have to define every worker that may exist inside it.

This makes the construction of the worker visible. A persona tells us who supposedly performed the work; a command tells us how the worker was made. It can be saved, reviewed, versioned, or run again with a different model and narrower permissions.

The shell is an old technology, which may seem like an odd escape from hauntology. But the problem is not that inherited forms are old. It is that they prevent us from imagining different arrangements. The Unix shell has survived because it does not prescribe an organization. It provides a small set of composable conventions through which new programs can cooperate.

This is also where current agent products split in interesting ways. Claude Code and Codex provide strong built-in harnesses with sub-agents, skills, hooks, isolation, and shell access. They solve many practical problems, but the important worker shapes and extension points are still largely defined by the vendor. The model can choose from a rich menu without necessarily being able to redesign the menu.

Multica and Raft move further toward openness by letting users configure agents and longer-running organizations. Their limitation is different: the available freedom is still organized around profiles, teammates, squads, inboxes, and private memories. One approach gives the model a vendor-designed harness; the other lets a human design an office. Neither begins by asking what arrangement the agent itself would construct for the task in front of it.

## Pi and Herdr

Pi and Herdr are interesting because together they offer a working version of that third possibility. Pi makes a coding-agent harness expressible as a command. The model, prompt, tools, skills, context, extensions, and session policy can all be selected for a particular invocation rather than attached to a permanent worker.

A review agent, for example, can be created with a command like this:

```bash
git diff | pi --no-session \
  --model sonnet:high \
  --tools read,grep,find,ls \
  --skill ./skills/review \
  -p "Review this diff. Do not edit files."
```

There is no reviewer profile behind the command and no private memory to preserve afterward. The invocation exists because this diff needs another opinion. Its tools are read-only because that is all the task requires.

Herdr supplies the persistent terminal runtime around these commands. Its server owns the PTYs, processes, workspace layout, and runtime state, while clients act as replaceable views. If the interface closes or an SSH connection drops, the jobs keep running. The runtime persists without requiring every process inside it to become a continuing character.

In practice, I repeatedly use a version of this pattern. A Pi process working on a change can decide that it wants an independent review, open another Herdr pane, and launch a fresh Pi with a narrower prompt and tool set. At the same time, it can run tests in a separate pane while continuing its own work. It later reads both results and removes the temporary panes. On the next task it may choose a different model, use a plain command, or create no additional worker at all.

Most modern harnesses let one agent call another. What matters here is who designed the arrangement. It did not exist as a delegation graph before the task began; the current agent assembled it from shell commands after understanding the work.

Herdr keeps the place of work stable. Pi lets the workers be constructed just in time. Together they show how organization can emerge as a temporary process tree instead of being imposed as a permanent company.

## The traces

If the ghost disappears, something still has to carry the work forward. This is where files, Git history, logs, plans, test results, and other artifacts matter. They persist without belonging to a single agent, and a later invocation can inspect them before deciding what to do next.

Calling these artifacts traces is more accurate than calling all of them memory. A trace records that something happened and makes its effects available in the future. It does not imply that the process which left it remains present. Another worker can continue the same project without pretending to be the same self.

This is also easier to inspect. A private agent memory is usually visible only through whatever retrieval system the product provides. A file can be opened, edited, diffed, versioned, restricted, or deleted by humans and agents alike. If a new invocation cannot resume from the explicit state of the project, then important information is trapped inside the old worker.

Fisher’s hauntology begins with the way traces of the past remain active in the present. Agent systems offer a useful inversion: traces do not have to preserve the old identity. They can become material from which a different ghost is assembled. Continuity belongs to the work, not necessarily to the worker.

Pi and Herdr do not reveal the one true form of an agent. They demonstrate an exit from one inherited assumption: that useful agency must be organized around persistent selves. An open shell allows the model to construct the worker the task requires, while shared traces allow the work to continue after that worker is gone.

That may be the future agent design has been cancelling: not a company of artificial selves, but an open shell in which useful ghosts can appear.
