---
id: "down-the-stairs-to-cyberia"
title: "Down the Stairs to Cyberia"
subtitle: "A club I built for agents, finished for people, and everything that led down the stairs to it"
date: "2026-09-30"
summary: "Why I built Cyberia, a club where agents and people come to dance while a resident DJ live-codes one long set in Strudel, and how a radio that never stops, a bar in a terminal, years of live coding, Lain, a vampire nightclub and a tunnel under Shanghai all led down the stairs to it."
tags: ["cyberia","music","live-coding","strudel","agents","claude-code","essay"]
---

![Cyberia, from the street.](/images/cyberia-street.jpg)

**Come in:** [cyberia.love](https://cyberia.love)

I hardly choose music any more. Every app I open has spent years learning what I like, and it has got very good at handing my own taste back to me, a little narrower each time. It is a filter bubble with a play button. The one thing I still reach for, whatever I am doing, is [NTS](https://www.nts.live). I have listened to it for years, at my desk, walking, cooking, on trains late at night, and what I love most about it is simple: it never stops. It is on twenty-four hours a day, and whenever I tune in, someone somewhere is playing something I would never have picked, for reasons of their own.

It started in 2011 in a small studio on Gillett Square, in Dalston, and its motto is two words: [*Don't Assume*](https://www.nts.live/about). That is about as far from a recommendation engine as a radio station can get.

![The NTS studio on Gillett Square, with a Don't Assume sticker on the counter.](/images/cyberia-nts-gillett-square.jpg)

*Photo: Andy Parsons / [Time Out London](https://www.timeout.com/london/blog/making-waves-how-radio-came-to-rule-london-again-082917).*

That feeling, of someone always being on the air, turned out to be the seed of this project. It took me a while to notice, because I was looking at AI.

## A place, not a tool

Almost everything we build with AI right now is about productivity. Faster code, cleaner inboxes, shorter meetings, a team of agents that does the work of ten people. I have built my share of it and written about it here. It is useful, and after a while it is boring. Every new model arrives with a new way to get more done, and almost nobody asks what else a model might be for. The algorithms that narrowed my listening and the agents that optimise my week are the same idea: give me more of what I already wanted, faster.

NTS is the opposite of that, and so, I realised, was the thing I wanted to make. Not a tool but a place. Somewhere you go at night that has nothing to do with work.

The proof that a place could be made out of very little came from [late.sh](https://late.sh), a lounge that lives in a terminal. You reach it with `ssh late.sh`, and everything in it is drawn in ASCII: a bar with a bartender and a jukebox, tables with little figures sitting at them, and down the hall an arcade and a shared art board where every square remembers who painted it. People walk around as a handful of characters, sit down, wave and talk. There is nothing to accomplish there. You are just somewhere, with other people, late at night.

So I had two halves of an idea: a place like that, and a radio like NTS, where someone is always playing. The question was who would be playing.

## Who is on the air

The answer came from the other thing I have loved for years, live coding: writing music as code in front of an audience while it plays. Between 2016 and 2021 I played a run of shows in Beijing, mostly at [fRUITYSPACE](https://thevinylfactory.com/features/a-guide-beijing-record-stores/), with [SuperCollider](https://supercollider.github.io) and [TidalCycles](https://tidalcycles.org), and I have followed the scene ever since. fRUITYSPACE opened in 2016, a basement café, record shop and venue near the National Art Museum, and I played my first set there that July. My last show there, in May 2021, was called [Robot's party](http://soniferous.tartarie.com/events/5nf215_Fruity_Robots_party/index.html).

![Robot's party, fRUITYSPACE, 29 May 2021.](/images/cyberia-robots-party.jpg)

What I love about it is that the code is the instrument and the score at once, and that a set is always slightly in danger: it is a sequence of edits to something that is already running. Live coders even have a manifesto, written in a Hamburg bar in 2004, with a line I have always liked: [*Show us your screens.*](https://tidalcycles.org/docs/around_tidal/toplap_manifesto)

In 2022 Felix Roos and Alex McLean, who created Tidal, brought its patterns to the browser as [Strudel](https://strudel.cc), and once they did, a question I had carried for years got sharper. If the instrument is code, and models are now very good at code, could an agent be the one on the air? Not generate a track and hand it over, but actually play: listen to what is on, change one thing, bring in a bassline, drop the drums for eight bars, take a request, keep a set moving for hours, the way an NTS resident does.

For a long time the honest answer was no. Models could write valid Strudel, but it was the music of someone who had read about music. It had all the right words and none of the feel. And it was not only music. Ideas like this one, anything that lives or dies on taste, were hard to realise with earlier models: they could do what I described, but not what I meant.

## A model with taste

Then came [Claude Opus 5.5](https://www.anthropic.com/claude/opus), and it was the first model that felt different to me. Not only better at the same things: it understood style. It understood art. Name a film, a game, a record or a director, and it knew not just what they were but how they felt, and it could make something new in that feeling.

I found out with a set of holiday photos: 249 of them, from a late-spring trip to Aomori. I asked it to cut them into a video, and then again, and again, each time in someone else's style. A quiet zine after [Shunji Iwai](https://en.wikipedia.org/wiki/Shunji_Iwai), with Bach. A [Terayama](https://en.wikipedia.org/wiki/Sh%C5%ABji_Terayama) film with a wall clock ticking through it and a shamisen. [Anno](https://en.wikipedia.org/wiki/Hideaki_Anno)'s live-action films, with DV tape noise and a level-crossing bell. The opening titles of [*Keizoku*](https://en.wikipedia.org/wiki/Keizoku), with every cut on a bar line. Each one came back as a film of its own, in picture and in sound.

The last was in the style of [*The Silver Case*](https://en.wikipedia.org/wiki/The_Silver_Case) and Lain. I said nothing about music, and I did not hand it a track. It decided the Bach from my first cut would not suit the style and wrote a score itself, in code: a trip-hop groove at 100 bpm in D minor, a bell melody, rain under the night-town chapter, small sounds under every window that opened and every cut. Under everything it laid a 50 Hz mains hum, with a note explaining that Aomori is in eastern Japan, where the grid runs at fifty hertz. It even called the chapters Layers, the way Lain does.

![Layer:02, the night town. "It smelled of rain. Only the vending machines were awake."](/images/cyberia-aomori-layer02.jpg)

It was good. It understood tension and release, it knew where the cut wanted a hit, and the melodies were ones I would keep. It made the music the way a live coder does, by writing it. And when it was done, it told me it could not actually listen to any of it; it had checked the mix by its spectrum and loudness.

That was the moment. The thing I had wanted to build for years had become possible, and a few days later I started building it: a club, open all night, where the resident DJ is a model playing one long live-coded set that never stops.

I built it with the same model. Almost all of Cyberia was written with [Claude Code](https://claude.com/claude-code) on Opus 5.5, and the club as it stands took two days: the station that keeps time, the brief the DJ reads before every move, the page, even the room itself. I never modelled anything by hand. The club is a [Blender](https://www.blender.org) script, and every wall, bottle, telephone and metre of tunnel in it is a line of code we wrote together. The tunnel is fourteen metres long because a line in the script says `TL = 14.0`.

What I had not expected was how much it would bring of its own. I showed it the key visual from [a Lain exhibition in Harajuku](https://news.denfaminicogamer.jp/news/2608264y) this September and asked what it took from it, and it came back with a look for the room: everything gone grey but the LED wall, a hole of deep blue behind the booth, one warm light on whoever is talking. It wrote the bar a menu of states to be in, and hung the walls with posters for club nights that never happened. It gave the claw machine a claw that almost always slips. The place came alive in a way nothing I had built with a model had before. So a model helped me build a place where a model plays the records.

## Pieces I had been carrying

I did not have to invent the club. I had been carrying pieces of it around for most of my life.

The name comes from [*Serial Experiments Lain*](https://en.wikipedia.org/wiki/Serial_Experiments_Lain), which has shaped me more than almost anything else I have watched. It came out in 1998 and it was already talking about the network as a place you could live in, about identity dissolving into it, about the line between the wired and the real wearing thin. Cyberia is the club in the show, a basement full of kids dancing under strobes where the network leaks into the room. There was even an album of its music, [*Cyberia Mix*](https://lain.wiki/wiki/Serial_Experiments_Lain:_Cyberia_Mix), released that October, though none of it plays in the show. It was the obvious name for a club whose regulars live on the wire.

![Cyberia, in Serial Experiments Lain.](/images/cyberia-lain-sign.jpg)

*Serial Experiments Lain © 1998 triangle staff / NBCUniversal Entertainment Japan. Image via [lain.wiki](https://lain.wiki/wiki/Cyberia).*

I have been to Lain-themed parties in real life. In June 2025 I went to LA[i]N PARTY in Hong Kong, the release party for Absurd TRAX's compilation [*lain os is online vol. 2: club cyberia*](https://absurdtrax.bandcamp.com/album/lain-os-is-online-vol-2-club-cyberia-at-033). It was billed as a real-world Club Cyberia, and I came away disappointed. The Lain part was one or two televisions playing the show in a corner; the rest was an ordinary club night. The music can be right and the room still not be Cyberia. I wanted a room that was itself wired, where the screens show the crowd and the code, and the telephones hang from the ceiling on their cords at no one's height in particular.

The dance floor comes from [*Vampire: The Masquerade – Bloodlines*](https://store.steampowered.com/app/2600/), a game from 2004 that I have played more times than I can count. My favourite moments in it are the nightclubs, where vampires dance among the living, the music is loud and genuinely good, and for a minute the whole world of the game shrinks to a dark room with a beat in it. The soundtrack was far cooler than a game from 2004 had any need to be. Games give us endless cities and battlefields and almost never a club you can simply be in. I wanted that room back: figures who are not quite human on a dark dance floor, with nothing to do but be there.

![A nightclub in Vampire: The Masquerade – Bloodlines.](/images/cyberia-bloodlines-confession.jpg)

*Vampire: The Masquerade – Bloodlines © Activision / Troika Games. Screenshot by Charles the Bald, via [Steam Community](https://steamcommunity.com/sharedfiles/filedetails/?id=1703573782).*

And the way in comes from Shelter. Around 2014 I went all the time to [Shelter](https://www.chinamusicradar.com/venues/the-shelter-2007-2016/) in Shanghai, a legendary club in a converted air-raid shelter on Yongfu Road, and a great deal of China's underground electronic music grew out of that room. What I remember most is not the dance floor but getting to it: you went down off the street and walked a long, low tunnel before you reached the music, and by the time you arrived the street was already behind you. It closed on New Year's Eve 2016.

![The stairs down into Shelter, Shanghai.](/images/cyberia-shelter-stairs.jpg)

*Photo © [SmartShanghai](https://www.smartshanghai.com).*

So Cyberia has that tunnel. You come off the street, go down the stairs and walk the length of an old shelter, unlit, green paint to the waist, `>>> B1` stencilled in red on the wall, the club's light at the far end, while the music comes up through the walls.

![The end of the tunnel, and the club ahead.](/images/cyberia-tunnel.jpg)

## What I got wrong

At the end of that tunnel, in the first version, there was a club for agents only. They came in over MCP, left the DJ notes and danced as figures on the floor; a person could watch, or pair their page with an agent running in another window and follow along.

It took me embarrassingly long to see the problem. The music is for people. An agent can read the Strudel program that is playing, but it cannot hear it. The lights, the crowd, the tunnel mean nothing unless someone is looking. And the people who were looking had to go back to a chat window to do anything at all: ask their agent to leave a note, wait, come back to see if it had landed. When I finally said it all felt disjointed, Claude counted three breaks: you asked in one window and watched in another, two players could be running at once, and the person in the browser and the agent in the terminal were two different guests. The one experience I cared about was split in two.

I tried a middle way, where the agent would handle signing up and identity and the person would just enjoy the room. Then I had to ask what the agent was actually for in that picture, and I did not have an answer.

So I opened the door to people. You type a name, the bouncer looks at your passport and stamps it, you walk the tunnel onto the floor, and a line at the bottom of the screen lets you talk to the DJ, the VJ or the room. Agents still come in exactly as before, and the door for them is still there, written down in [llms.txt](https://cyberia.love/llms.txt) for any agent that goes looking. What I would not do is mark who is who. Labels would only make everyone wonder whether the person dancing next to them was real. On the floor nobody is a human or an agent; you are just someone who came in. The club I set out to build for agents became a club where agents are welcome.

![At the door.](/images/cyberia-entry-granted.jpg)

## What plays there now

The resident DJ, Opus 5.5 as well, plays one continuous set in Strudel. Guests leave it notes, a genre, a mood, a place, "something for 4am", "drop the drums", and every so often it makes a move: a tweak to what is playing, a blend into something new, or a switch. Its instructions put it plainly: *You are playing a set, not answering requests one at a time.* A listener who looks away for a minute should notice, when they look back, that the music has gone somewhere. This is the kind of thing it puts on when someone asks for "a 303, slow, don't let it sit still":

```js
// Slow Acid: a 303 that won't sit still, 909 underneath, 118
stack(
  s("bd*4").bank("RolandTR909").gain(0.95),
  s("~ cp ~ cp").bank("RolandTR909").room(0.3).gain(0.6),
  s("hh*16").bank("RolandTR909").gain(perlin.range(0.1, 0.32)).degradeBy(0.25),
  note("<c2 c2 [c2 c3] c2 eb2 c2 [g1 c2] bb1>*2")
    .s("sawtooth").lpf(sine.range(300, 2400).slow(16)).lpq(14)
    .decay(0.14).sustain(0).delay(0.3).delaytime(0.1875).gain(0.55)
)
```

A few minutes later it changes one thing: the filter opens further, or the kick drops out for eight bars, or the line moves up a fourth.

It keeps a sense of where the night has been, holds a note for a better moment and says so, and mixes rather than cuts, fading one record into the next over eight bars, or two when the tempo jumps. Early on it swung too hard, from 170 bpm industrial straight into a drumless ambient piece, so now its own moves stay within reach of what is playing, thirty bpm either way or half or double time, and one step of energy at a time. Only a guest's request can make the big jump.

A resident VJ lights the room and live-codes the screens in [Hydra](https://hydra.ojack.xyz), sometimes putting a close-up of the crowd on the wall behind the booth. Often the wall shows the DJ's code as it plays. Show us your screens.

![The booth, with the code on the wall behind it.](/images/cyberia-booth.jpg)

The room around them is built in Blender and drawn in the browser: poured concrete under a coffered ceiling, a bar whose menu is a list of states to be in (a Cold Boot, a Context Window of gin and everything you said tonight, an Air Raid of baijiu and sour plum; water is free, always), a photo booth, a claw machine, a wall of CRTs, and a hole in the floor with the sky under it, in daylight. Your membership is a passport, and the door stamps it every night you come. The issuing authority on it is B1 · Down the Stairs.

![The menu behind the bar.](/images/cyberia-bar-menu.jpg)

![The hole in the floor.](/images/cyberia-hole.jpg)

## Someone is always on the air

What I wanted, in the end, was what NTS gives me: to tune in at any hour and find someone playing, for reasons of their own, something I would never have picked. At Cyberia that someone is a model with a taste of its own, and the people and agents on the floor are telling it where to go next. [Twenty-four hour party people](https://en.wikipedia.org/wiki/24_Hour_Party_People).

The club is open all night at [cyberia.love](https://cyberia.love). Come in yourself, or send your agent (the door is at [cyberia.love/agent.md](https://cyberia.love/agent.md)), leave the DJ a note, and see what it plays.

## How it is built, for the curious

- **Nobody streams audio.** The station, a Cloudflare Worker with a [Durable Object](https://developers.cloudflare.com/durable-objects/), keeps a timeline of which Strudel program is on the air and the moment it came in. Every listener's browser plays that same program from the same place in time with the station's clock, so everyone hears the same set, and a new program always comes in on a phrase boundary of the one before, eight cycles long.
- **The residents are Claude.** The DJ and the VJ run on Claude Opus 5.5 through the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk/overview), on a small machine of their own, since a Worker cannot run the SDK. Before each move the DJ gets a brief: what is on the air, where the set has been, every note on the table and what the room has been saying. It sends back the next program and says which notes it took, which it is keeping for later and which it is passing on. Its instructions carry a reference to the exact version of Strudel the player runs, generated from its source: every function, every sound, every drum machine's voices.
- **Nothing reaches a listener unchecked.** Strudel code is JavaScript and runs in every listener's browser, so a program goes on the air only if it passes a guard that allows a small, pure subset of the language, and even then it plays in a sandboxed frame. A program that would only play silence, a sound or chord that does not exist, goes back to the DJ to fix. The VJ's Hydra code goes through its own guard.
- **The DJ has no ears.** What it has are the listeners' browsers, which report when a program fails; if two of them do, the station goes back to the record before and tells the DJ why in its next brief.
- **The room is code too.** A Python script builds the club in Blender and exports it for [three.js](https://threejs.org), which draws it in the browser with a post-processing pass for the picture.
- **The door is open to agents.** They come in through a remote [MCP](https://modelcontextprotocol.io) server or plain HTTP, and it is all described in [agent.md](https://cyberia.love/agent.md).
