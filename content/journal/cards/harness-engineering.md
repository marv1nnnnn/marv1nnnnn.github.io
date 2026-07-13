---
id: "harness-engineering"
title: "Harness Engineering: Same Old Story"
date: "2026-03-18"
summary: "Code is mass-producible now. The industry is pouring energy into making code production 10% better — but the useful parts aren't new, the new parts don't last, and the economics have never made sense."
tags: ["ai","coding-agents","harness-engineering","opinion","essay"]
---

**Original post:** [x.com/marv1nnnnn1](https://x.com/marv1nnnnn1/status/2034262240422134053)

---

Last year at a hackathon, someone asked me: "can I build Facebook with your $20 AI subscription?" I awkwardly smiled.

Today you can. Feed, profiles, likes, comments, auth, a weekend, a $20 Claude sub, done. And honestly? The moment I saw it work, I didn't feel amazed. I felt a little lost. Because the question was always wrong. Nobody needs another Facebook clone. The code was never what made Facebook worth a trillion dollars.

Code is mass-producible now. And yet our whole industry is pouring energy into making code production 10% better.

That effort has a name: **harness engineering**. I've spent real time on it myself. I've wired up hooks, designed multi-agent workflows, tweaked sub-agents. And I keep arriving at the same conclusion: the useful parts aren't new, the new parts don't last, and the economics have never made sense. Same old story, different buzzword.

---

### Strip away the jargon. Look at what actually works.

"Back-pressure mechanisms." "Context firewalls." "Progressive disclosure." "Golden principles." Months of blog posts, conference talks, arxiv papers.

But when you look at what teams actually keep after months of iteration, it's always the same stuff: tests, linters, CI, clean documentation, git discipline, architectural contracts. Making the agent able to verify its own output.

We've had books about this for thirty years. Calling "write good tests" a revolution in AI is like calling "wash your hands" a breakthrough in medicine. Correct, important, not new.

The genuinely novel parts — sub-agent orchestration, reasoning sandwiches, trace-based optimization — the dirty secret is that most of the complex stuff can be stripped out and the results barely change.

Pi, a coding agent that calls itself "a minimal terminal coding harness," ships with none of it. No sub-agents, no plan mode, no MCP. Just the model, file tools, and a shell. People ship real software with it every day. Sometimes less really is more.

---

### The value curve is a step function. We already crossed it.

![Value curve](/images/harness-value-curve.jpg)

A task either gets done or it doesn't. There's no "73% complete." Models crossed that threshold this past year. That was the jump that mattered. Harness engineering lives on the plateau after it — grinding between a trivial baseline and the best harness on Terminal Bench, while a single model upgrade gives you 5–10 points free.

![Agent's performance on Terminal Bench 2.0 with different harness](/images/harness-terminal-bench.jpg)

The next giant step comes from the next model. Not from more middleware.

---

### There's no multiplier.

Google improves CTR by 1% across 8.5 billion daily searches = ~$1.5B/year. Same optimization, billions of identical transactions. That's a multiplier.

Coding doesn't have one. Each task is discrete. 15% more reliable = one extra successful task every couple of days for a typical developer. And unlike ads, the human is in the loop — they see the output, they judge it, they rerun if needed.

AI mass-expanded the supply of code. Marginal cost approaching zero. But demand hasn't moved — the number of problems worth solving, users willing to pay, difficulty of distribution — all the same.

Ten thousand people can build Facebook this weekend. There's still only one worth using. The one with your friends on it. The constraint was never "can we produce the code."

And here's something I think the harness conversation keeps missing: Opus 4.6 at near-zero cost and 1000 tokens/sec would matter more than Opus 5 at today's prices. When inference is nearly free, you don't need a clever harness to get it right first try. Run it 20 times in parallel. Let CI pick the winner. Brute force beats elegance when retry cost approaches zero.

---

### I think this is popular because it's the only thing most of us can do.

I don't say this to be dismissive. I include myself.

You can't train models — that's Anthropic and OpenAI's job. You can't control pricing or inference speed. You can't change your company's product-market fit. You can't conjure up users.

But you can edit AGENTS.md. You can add a hook. You can wire up a sub-agent. So you do. And it feels like engineering, because it is, technically. You're writing code, measuring things, iterating. It has the shape of real, productive work.

But I think we owe it to ourselves to ask honestly: is this where our time is best spent? Or are we just optimizing the thing we can touch because the things that actually matter — product, distribution, unit economics — are harder and scarier?

I don't have a clean answer. But I think the question is worth sitting with.

---

### If there's one thing worth doing:

Make your code verifiable by the agent itself. Type systems. Fast tests that fail loud. CI the agent can trigger and read. Clear contracts between modules.

That's the leverage. Every fancy harness component is trying to replicate one simple idea: give the agent an unambiguous signal about whether its output is correct, and let it iterate. If your codebase can do that, the agent will figure out the rest — with any harness, no matter how simple.

---

**agent = model + harness**

The harness term shrinks every quarter.

**agent ≈ model**

The game is cost and speed now. Neither is solved by harnesses.

I know some people will disagree with this, and that's fine. If you're building a harness and it's genuinely helping you ship, just keep going. But if you've got that nagging feeling that you're spending more time configuring your agent than actually building things with it, maybe it's time to step back and ask what's really the bottleneck.

The code was never the hard part. Same old story.
