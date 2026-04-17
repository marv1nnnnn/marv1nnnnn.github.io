Title: Eight years of wanting, three months of building with AI

URL Source: https://lalitm.com/post/building-syntaqlite-ai/

Published Time: 2026-04-05T13:00:00+01:00

Markdown Content:
For eight years, I’ve wanted a high-quality set of devtools for working with SQLite. Given how important SQLite is to the industry[1](https://lalitm.com/post/building-syntaqlite-ai/#sn-sqlite-industry), I’ve long been puzzled that no one has invested in building a really good developer experience for it[2](https://lalitm.com/post/building-syntaqlite-ai/#sn-devtools).

A couple of weeks ago, after ~250 hours of effort over three months[3](https://lalitm.com/post/building-syntaqlite-ai/#sn-hours) on evenings, weekends, and vacation days, I finally [released syntaqlite](https://lalitm.com/post/syntaqlite/) ([GitHub](https://github.com/LalitMaganti/syntaqlite)), fulfilling this long-held wish. And I believe the main reason this happened was because of AI coding agents[4](https://lalitm.com/post/building-syntaqlite-ai/#sn-codingtools).

Of course, there’s no shortage of posts claiming that AI one-shot their project or pushing back and declaring that AI is all slop. I’m going to take a very different approach and, instead, systematically break down my experience building syntaqlite with AI, both where it helped _and_ where it was detrimental.

I’ll do this while contextualizing the project and my background so you can independently assess how generalizable this experience was. And whenever I make a claim, I’ll try to back it up with evidence from my project journal, coding transcripts, or commit history[5](https://lalitm.com/post/building-syntaqlite-ai/#sn-evidence).

## Why I wanted it

In my work on [Perfetto](https://docs.perfetto.dev/), I maintain a SQLite-based language for querying performance traces called [PerfettoSQL](https://perfetto.dev/docs/analysis/perfetto-sql-getting-started). It’s basically the same as SQLite but with a few extensions to make the trace querying experience better. There are ~100K lines of PerfettoSQL internally in Google and it’s used by a wide range of teams.

Having a language which gets traction means your users also start expecting things like formatters, linters, and editor extensions. I’d hoped that we could adapt some SQLite tools from open source but the more I looked into it, the more disappointed I was. What I found either wasn’t reliable enough, fast enough[6](https://lalitm.com/post/building-syntaqlite-ai/#sn-speed-comparison), or flexible enough to adapt to PerfettoSQL. There was clearly an opportunity to build something from scratch, but it was never the “most important thing we could work on”. We’ve been reluctantly making do with the tools out there but always wishing for better.

On the other hand, there _was_ the option to do something in my spare time. I had built lots of open source projects in my teens[7](https://lalitm.com/post/building-syntaqlite-ai/#sn-holoirc) but this had faded away during university when I felt that I just didn’t have the motivation anymore. Being a maintainer is much more than just “throwing the code out there” and seeing what happens. It’s triaging bugs, investigating crashes, writing documentation, building a community, and, most importantly, having a direction for the project.

But the itch of open source (specifically freedom to work on what I wanted while helping others) had never gone away. The SQLite devtools project was eternally in my mind as “something I’d like to work on”. But there was another reason why I kept putting it off: it sits at the intersection of being both hard _and_ tedious.

## What makes it hard and tedious

If I was going to invest my personal time working on this project, I didn’t want to build something that only helped Perfetto: I wanted to make it work for _any_ SQLite user out there[8](https://lalitm.com/post/building-syntaqlite-ai/#sn-ambition). And this means parsing SQL _exactly_ like SQLite.

The heart of any language-oriented devtool is the parser. This is responsible for turning the source code into a “parse tree” which acts as the central data structure anything else is built on top of. If your parser isn’t accurate, then your formatters and linters will inevitably inherit those inaccuracies; many of the tools I found suffered from having parsers which approximated the SQLite language rather than representing it precisely.

Unfortunately, unlike many other languages, SQLite has no formal specification describing how it should be parsed. It doesn’t expose a stable API for its parser either. In fact, quite uniquely, in its implementation it doesn’t even build a parse tree at all[9](https://lalitm.com/post/building-syntaqlite-ai/#sn-no-parse-tree)! The only reasonable approach left in my opinion is to carefully extract the relevant parts of SQLite’s source code and adapt it to build the parser I wanted.

This means getting into the weeds of SQLite source code, a fiendishly difficult codebase to understand. The whole project is written in C in an [incredibly dense style](https://sqlite.org/src/file?name=src/vdbe.c&ci=trunk); I’ve spent days just understanding the virtual table [API](https://www.sqlite.org/vtab.html)[11](https://lalitm.com/post/building-syntaqlite-ai/#sn-vtab-nuance) and [implementation](https://sqlite.org/src/file?name=src/vtab.c&ci=trunk). Trying to grasp the full parser stack was daunting.

There’s also the fact that there are >400 rules in SQLite which capture the full surface area of its language. I’d have to specify in each of these “grammar rules” how that part of the syntax maps to the matching node in the parse tree. It’s extremely repetitive work; each rule is similar to all the ones around it but also, by definition, different.

And it’s not just the rules but also coming up with and writing tests to make sure it’s correct, debugging if something is wrong, triaging and fixing the inevitable bugs people filed when I got something wrong…

For years, this was where the idea died. Too hard for a side project[12](https://lalitm.com/post/building-syntaqlite-ai/#sn-complexity), too tedious to sustain motivation, too risky to invest months into something that might not work.

## How it happened

I’ve been using coding agents since early 2025 (Aider, Roo Code, then Claude Code since July) and they’d definitely been useful but never something I felt I could trust a serious project to. But towards the end of 2025, the models seemed to make a significant step forward in quality[13](https://lalitm.com/post/building-syntaqlite-ai/#sn-agents-got-good). At the same time, I kept hitting problems in Perfetto which would have been trivially solved by having a reliable parser. Each workaround left the same thought in the back of my mind: maybe it’s finally time to build it for real.

I got some space to think and reflect over Christmas and decided to really stress test the most maximalist version of AI: could I vibe-code the whole thing using just Claude Code on the Max plan (£200/month)?

Through most of January, I iterated, acting as semi-technical manager and delegating almost all the design and all the implementation to Claude. Functionally, I ended up in a reasonable place: a parser in C extracted from SQLite sources using a bunch of Python scripts, a formatter built on top, support for both the SQLite language and the PerfettoSQL extensions, all exposed in a web playground.

But when I reviewed the codebase in detail in late January, the downside was obvious: the codebase was complete spaghetti[14](https://lalitm.com/post/building-syntaqlite-ai/#sn-spaghetti). I didn’t understand large parts of the Python source extraction pipeline, functions were scattered in random files without a clear shape, and a few files had grown to several thousand lines. It was _extremely_ fragile; it solved the immediate problem _but_ it was never going to cope with my larger vision, never mind integrating it into the Perfetto tools. The saving grace was that it had proved the approach was viable and generated more than 500 tests, many of which I felt I could reuse.

I decided to throw away everything and start from scratch while also switching most of the codebase to Rust[15](https://lalitm.com/post/building-syntaqlite-ai/#sn-rust-not-c). I could see that C was going to make it difficult to build the higher level components like the validator and the language server implementation. And as a bonus, it would also let me use the same language for both the extraction and runtime instead of splitting it across C and Python.

More importantly, I completely changed my role in the project. I took ownership of all decisions[16](https://lalitm.com/post/building-syntaqlite-ai/#sn-took-control) and used it more as “autocomplete on steroids” inside a much tighter process: opinionated design upfront, reviewing every change thoroughly, fixing problems eagerly as I spotted them, and investing in scaffolding (like linting, validation, and non-trivial testing[17](https://lalitm.com/post/building-syntaqlite-ai/#sn-scaffolding)) to check AI output automatically.

The core features came together through February and the final stretch (upstream test validation, editor extensions, packaging, docs) led to a 0.1 launch in mid-March.

But in my opinion, this timeline is the least interesting part of this story. What I really want to talk about is what wouldn’t have happened without AI and also the toll it took on me as I used it.

## AI is why this project exists, and why it’s as complete as it is

### Overcoming inertia

I’ve [written in the past](https://lalitm.com/llm-motivation-via-emotions/) about how one of my biggest weaknesses as a software engineer is my tendency to procrastinate when facing a big new project. Though I didn’t realize it at the time, it could not have applied more perfectly to building syntaqlite.

AI basically let me put aside all my doubts on technical calls, my uncertainty of building the right thing and my reluctance to get started by giving me very concrete problems to work on. Instead of “I need to understand how SQLite’s parsing works”, it was “I need to get AI to suggest an approach for me so I can tear it up and build something better"[18](https://lalitm.com/post/building-syntaqlite-ai/#sn-inertia-journal). I work so much better with concrete prototypes to play with and code to look at than endlessly thinking about designs in my head, and AI lets me get to that point at a pace I could not have dreamed about before. Once I took the first step, every step after that was so much easier.

### Faster at churning code

AI turned out to be better than me at the act of writing code itself, assuming that code is obvious. If I can break a problem down to “write a function with this behaviour and parameters” or “write a class matching this interface,” AI will build it faster than I would and, crucially, in a style that might well be more intuitive to a future reader. It documents things I’d skip, lays out code consistently with the rest of the project, and sticks to what you might call the “standard dialect” of whatever language you’re working in[19](https://lalitm.com/post/building-syntaqlite-ai/#sn-standard-dialect).

That standardness is a double-edged sword. For the vast majority of code in any project, standard is exactly what you want: predictable, readable, unsurprising. But every project has pieces that are its edge, the parts where the value comes from doing something non-obvious. For syntaqlite, that was the extraction pipeline and the parser architecture. AI’s instinct to normalize was actively harmful there, and those were the parts I had to design in depth and often resorted to just writing myself.

But here’s the flip side: the same speed that makes AI great at obvious code also makes it great at refactoring. If you’re using AI to generate code at industrial scale, you _have_ to refactor constantly and continuously[20](https://lalitm.com/post/building-syntaqlite-ai/#sn-refactoring-journal). If you don’t, things immediately get out of hand. This was the central lesson of the vibe-coding month: I didn’t refactor enough, the codebase became something I couldn’t reason about, and I had to throw it all away. In the rewrite, refactoring became the core of my workflow. After every large batch of generated code, I’d step back and ask “is this ugly?” Sometimes AI could clean it up. Other times there was a large-scale abstraction that AI couldn’t see but I could; I’d give it the direction and let it execute[21](https://lalitm.com/post/building-syntaqlite-ai/#sn-refactor-pattern). If you have taste, the cost of a wrong approach drops dramatically because you can restructure quickly[22](https://lalitm.com/post/building-syntaqlite-ai/#sn-refactor-taste).

### Teaching assistant

Of all the ways I used AI, research had by far the highest ratio of value delivered to time spent.

I’ve worked with interpreters and parsers before but I had never heard of Wadler-Lindig pretty printing[23](https://lalitm.com/post/building-syntaqlite-ai/#sn-wadler-lindig). When I needed to build the formatter, AI gave me a concrete and actionable lesson from a point of view I could understand and pointed me to the papers to learn more. I could have found this myself eventually, but AI compressed what might have been a day or two of reading into a focused conversation where I could ask “but why does this work?” until I actually got it.

This extended to entire domains I’d never worked in. I have deep C++ and Android performance expertise but had barely touched Rust tooling or editor extension APIs. With AI, it wasn’t a problem: the fundamentals are the same, the terminology is similar, and AI bridges the gap[24](https://lalitm.com/post/building-syntaqlite-ai/#sn-lateral-moves). The VS Code extension would have taken me a day or two of learning the API before I could even start. With AI, I had a working extension within an hour.

It was also invaluable for reacquainting myself with parts of the project I hadn’t looked at for a few days[25](https://lalitm.com/post/building-syntaqlite-ai/#sn-context-reacquisition). I could control how deep to go: “tell me about this component” for a surface-level refresher, “give me a detailed linear walkthrough” for a deeper dive, “audit unsafe usages in this repo” to go hunting for problems. When you’re context switching a lot, you lose context fast. AI let me reacquire it on demand.

### More than I’d have built alone

Beyond making the project exist at all, AI is also the reason it shipped as complete as it did. Every open source project has a long tail of features that are important but not critical: the things you know theoretically how to do but keep deprioritizing because the core work is more pressing. For syntaqlite, that list was long: editor extensions, Python bindings, a WASM playground, a docs site, packaging for multiple ecosystems[26](https://lalitm.com/post/building-syntaqlite-ai/#sn-last-mile-list). AI made these cheap enough that skipping them felt like the wrong trade-off.

It also freed up mental energy for UX[27](https://lalitm.com/post/building-syntaqlite-ai/#sn-ux-focus). Instead of spending all my time on implementation, I could think about what a user’s first experience should feel like: what error messages would actually help them fix their SQL, how the formatter output should look by default, whether the CLI flags were intuitive. These are the things that separate a tool people try once from one they keep using, and AI gave me the headroom to care about them. Without AI, I would have built something much smaller, probably no editor extensions or docs site. AI didn’t just make the same project faster. It changed what the project _was_.

## Where AI had its costs

### The addiction

There’s an uncomfortable parallel between using AI coding tools and playing slot machines[28](https://lalitm.com/post/building-syntaqlite-ai/#sn-addiction). You send a prompt, wait, and either get something great or something useless. I found myself up late at night wanting to do “just one more prompt,” constantly trying AI just to see what would happen even when I knew it probably wouldn’t work. The sunk cost fallacy kicked in too: I’d keep at it even in tasks it was clearly ill-suited for, telling myself “maybe if I phrase it differently this time.”

The tiredness feedback loop made it worse[29](https://lalitm.com/post/building-syntaqlite-ai/#sn-tiredness-loop). When I had energy, I could write precise, well-scoped prompts and be genuinely productive. But when I was tired, my prompts became vague, the output got worse, and I’d try again, getting more tired in the process. In these cases, AI was probably slower than just implementing something myself, but it was too hard to break out of the loop[30](https://lalitm.com/post/building-syntaqlite-ai/#sn-ai-slower).

### Losing touch

Several times during the project, I lost my mental model of the codebase[31](https://lalitm.com/post/building-syntaqlite-ai/#sn-losing-touch). Not the overall architecture or how things fitted together. But the day-to-day details of what lived where, which functions called which, the small decisions that accumulate into a working system. When that happened, surprising issues would appear and I’d find myself at a total loss to understand what was going wrong. I hated that feeling.

The deeper problem was that losing touch created a communication breakdown[32](https://lalitm.com/post/building-syntaqlite-ai/#sn-communication-breakdown). When you don’t have the mental thread of what’s going on, it becomes impossible to communicate meaningfully with the agent. Every exchange gets longer and more verbose. Instead of “change FooClass to do X,” you end up saying “change the thing which does Bar to do X”. Then the agent has to figure out what Bar is, how that maps to FooClass, and sometimes it gets it wrong[33](https://lalitm.com/post/building-syntaqlite-ai/#sn-manager-analogy). It’s exactly the same complaint engineers have always had about managers who don’t understand the code asking for fanciful or impossible things. Except now you’ve become that manager.

The fix was deliberate: I made it a habit to read through the code immediately after it was implemented and actively engage to see “how would I have done this differently?”.

Of course, in some sense all of the above is also true of code I wrote a few months ago (hence the [sentiment that AI code is legacy code](https://text-incubation.com/AI+code+is+legacy+code+from+day+one)), but AI makes the drift happen faster because you’re not building the same muscle memory that comes from originally typing it out.

### The slow corrosion

There were some other problems I only discovered incrementally over the three months.

I found that AI made me procrastinate on key design decisions[34](https://lalitm.com/post/building-syntaqlite-ai/#sn-procrastination). Because refactoring was cheap, I could always say “I’ll deal with this later.” And because AI could refactor at the same industrial scale it generated code, the cost of deferring felt low. But it wasn’t: deferring decisions corroded my ability to think clearly because the codebase stayed confusing in the meantime. The vibe-coding month was the most extreme version of this. Yes, I understood the problem, but if I had been more disciplined about making hard design calls earlier, I could have converged on the right architecture much faster.

Tests created a similar false comfort[35](https://lalitm.com/post/building-syntaqlite-ai/#sn-tests-insufficient). Having 500+ tests felt reassuring, and AI made it easy to generate more. But neither humans nor AI are creative enough to foresee every edge case you’ll hit in the future; there are several times in the vibe-coding phase where I’d come up with a test case and realise the design of some component was completely wrong and needed to be totally reworked. This was a significant contributor to my lack of trust and the decision to scrap everything and start from scratch.

Basically, I learned that the “normal rules” of software still apply in the AI age: if you don’t have a fundamental foundation (clear architecture, well-defined boundaries) you’ll be left eternally chasing bugs as they appear.

### No sense of time

Something I kept coming back to was how little AI understood about the passage of time[36](https://lalitm.com/post/building-syntaqlite-ai/#sn-no-sense-of-time). It sees a codebase in a certain state but doesn’t _feel_ time the way humans do. I can tell you what it feels like to use an API, how it evolved over months or years, why certain decisions were made and later reversed.

The natural problem from this lack of understanding is that you either make the same mistakes you made in the past and have to relearn the lessons _or_ you fall into new traps which were successfully avoided the first time, slowing you down in the long run. In my opinion, this is a similar problem to why losing a high-quality senior engineer hurts a team so much: they carry history and context that doesn’t exist anywhere else and act as a guide for others around them.

In theory, you can try to preserve this context by keeping specs and docs up to date. But there’s a reason we didn’t do this before AI: capturing implicit design decisions exhaustively is incredibly expensive and time-consuming to write down. AI can help draft these docs, but because there’s no way to automatically verify that it accurately captured what matters, a human still has to manually audit the result. And that’s still time-consuming.

There’s also the context pollution problem. You never know when a design note about API A will echo in API B. Consistency is a huge part of what makes codebases work, and for that you don’t just need context about what you’re working on right now but also about other things which were designed in a similar way. Deciding what’s relevant requires exactly the kind of judgement that institutional knowledge provides in the first place.

## Relativity

Reflecting on the above, the pattern of when AI helped and when it hurt was fairly consistent.

When I was working on something I already understood deeply, AI was excellent. I could review its output instantly, catch mistakes before they landed and move at a pace I’d never have managed alone. The parser rule generation is the clearest example[37](https://lalitm.com/post/building-syntaqlite-ai/#sn-parser-rules): I knew exactly what each rule should produce, so I could review AI’s output within a minute or two and iterate fast.

When I was working on something I could describe but didn’t yet know, AI was good but required more care. Learning Wadler-Lindig for the formatter was like this: I could articulate what I wanted, evaluate whether the output was heading in the right direction, and learn from what AI explained. But I had to stay engaged and couldn’t just accept what it gave me.

When I was working on something where I didn’t even know what I wanted, AI was somewhere between unhelpful and harmful. The architecture of the project was the clearest case: I spent weeks in the early days following AI down dead ends, exploring designs that felt productive in the moment but collapsed under scrutiny. In hindsight, I have to wonder if it would have been faster just thinking it through without AI in the loop at all.

But expertise alone isn’t enough. Even when I understood a problem deeply, AI still struggled if the task had no objectively checkable answer[38](https://lalitm.com/post/building-syntaqlite-ai/#sn-verifiability). Implementation has a right answer, at least at a local level: the code compiles, the tests pass, the output matches what you asked for. Design doesn’t. We’re still arguing about OOP decades after it first took off.

Concretely, I found that designing the public API of syntaqlite was where this hit home the hardest. I spent several days in early March doing nothing but API refactoring, manually fixing things any experienced engineer would have instinctively avoided but AI made a total mess of. There’s no test or objective metric for “is this API pleasant to use” and “will this API help users solve the problems they have” and that’s exactly why the coding agents did _so badly_ at it.

This takes me back to the days I was obsessed with physics and, specifically, relativity. The laws of physics look simple and Newtonian in any small local area, but zoom out and spacetime curves in ways you can’t predict from the local picture alone. Code is the same: at the level of a function or a class, there’s usually a clear right answer, and AI is excellent there. But architecture is what happens when all those local pieces interact, and you can’t get good global behaviour by stitching together locally correct components.

Knowing where you are on these axes at any given moment is, I think, the core skill of working with AI effectively.

## Wrap-up

Eight years is a long time to carry a project in your head. Seeing these SQLite tools actually exist and function after only three months of work is a massive win, and I’m fully aware they wouldn’t be here without AI.

But the process wasn’t the clean, linear success story people usually post. I lost an entire month to vibe-coding. I fell into the trap of managing a codebase I didn’t actually understand, and I paid for that with a total rewrite.

The takeaway for me is simple: AI is an incredible force multiplier for implementation, but it’s a dangerous substitute for design. It’s brilliant at giving you the right answer to a specific technical question, but it has no sense of history, taste, or how a human will actually feel using your API. If you rely on it for the “soul” of your software, you’ll just end up hitting a wall faster than you ever have before.

What I’d like to see more of from others is exactly what I’ve tried to do here: honest, detailed accounts of building real software with these tools; not weekend toys or one-off scripts but the kind of software that has to survive contact with users, bug reports, and your own changing mind.
