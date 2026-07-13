---
id: "build-for-yourself-2"
title: "Build Something Just for Yourself: #2"
subtitle: "Why not make your coding agent personal?"
date: "2026-03-16"
summary: "Everyone's coding agent looks the same. I customized pi with themes, music, a virtual pet, a knowledge graph, and more — because the terminal is where I live, and it should feel like mine."
tags: ["pi","coding-agent","customization","extensions","open-source","personal-software"]
---

> Everyone is using Codex and Claude Code now. Open your Twitter feed and every other screenshot looks identical — the same terminal, the same monospace font, the same pale text on dark background, the same tool call outputs scrolling by. It's like we all moved into the same apartment and nobody bothered to hang anything on the walls.

**Original post:** [x.com/marv1nnnnn1](https://x.com/marv1nnnnn1/status/2033215133410013385)

![Cover](/images/bfy2-cover.jpg)

---

### The Problem

![Does your terminal also look like this?](/images/bfy2-terminal-same.jpg)

We're spending 8, 10, sometimes more hours a day inside a black rectangle, talking to an AI that reads our code and writes it back. The terminal isn't something we pass through anymore. It's where we live. So why does everyone's look exactly the same?

In the [first post](/projects/build-for-yourself) I talked about how the fastest way to build something meaningful might be to start by building for yourself. This time I applied that to the place I work.

---

### The Customization

I've been using a terminal agent called **pi**, built by [@badlogicgames](https://x.com/badlogicgames). It does what the others do — but it has something most of them don't: a real extension system and a full theming engine.

![My customized pi](/images/bfy2-pi-custom.jpg)

**Themes** — I wrote 10 custom themes from scratch. Not "dark mode with blue accents" — actual palettes with intent behind them. The one I use most is called *terayama*, after Shuji Terayama, the avant-garde Japanese playwright. Deep theatrical blacks, warm parchment text. I'm also using the terminal Kaku from [@HiTw93](https://x.com/HiTw93) which is visually stunning.

![Shuji Terayama's film](/images/bfy2-terayama.jpg)

**Music** — I wrote an extension that turns pi into a music player — YouTube, Mixcloud, Bandcamp, NTS Radio, all playable from inside the terminal. Search, queue, play, pause, seek. `Alt+P` to pause, `Alt+[` and `Alt+]` to seek. Under the hood it's mpv and yt-dlp, but the interesting part is what happens on top: the extension exposes real-time audio analysis — energy, beat, transients, spectral flux — as a data stream that other parts of the system can read.

![Music interface](/images/bfy2-music.png)

**Navi** — A small animated entity that lives below the editor. It has moods — idle, thinking, happy, excited, sleeping. It pulls headlines from random Wikipedia articles, Hacker News top list, and RSS feeds. And its particle field reacts to the music data. The particles pulse with the beat. It's a tiny VJ show running in your terminal while you work. Navi levels up based on how many tokens you burn.

![Navi](/images/bfy2-navi.jpg)

---

### The Extensions

Beyond the big ones, here's everything else I wrote:

- **Knowledge graph** — extracts entities from URLs and builds a searchable second brain

![Knowledge graph](/images/bfy2-knowledge-graph.jpg)

- **Project board** — the AI can read so I don't have to re-explain context

![Project board](/images/bfy2-project-board.jpg)

- **Background tasks** — automatic log capture, session branching — version control for conversations

![Background tasks](/images/bfy2-background-tasks.jpg)

- **LLM council** — different models independently analyze a problem and a chairman writes the synthesis (inspired by [@karpathy](https://x.com/karpathy)'s [llm-council](https://github.com/karpathy/llm-council))

![LLM council](/images/bfy2-llm-council.jpg)

Community packages I installed:

- **pi-extmgr** — extension manager that makes installing and updating painless
- **pi-agentic-compaction** — smart context compaction so long sessions don't blow up
- **pi-rewind** — rewind and branch session history
- **pi-web-providers** — web search from inside the agent
- **@sherif-fanous/pi-rtk** — runtime toolkit

---

### The Point

In a landscape where every coding agent feels like a slightly different skin over the same four API calls, pi got something right: it's an agent that trusts you to make it yours. Open source in the way open source is supposed to work — not just "the code is on GitHub," but actually designed so that anyone can extend, reshape, and personalize it.

Software is becoming cheap to build. That's the reality of 2026. And I think the right response isn't to keep building the same generic tools for everyone — it's to let people create their own. Personal software. Software shaped by one person's taste, habits, and weird preferences. Pi makes that possible for the coding agent itself. It took something that was becoming boring and uniform and turned it into a canvas.
