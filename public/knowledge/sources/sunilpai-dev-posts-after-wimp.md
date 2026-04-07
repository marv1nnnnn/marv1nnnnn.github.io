Title: let the code do the talking

URL Source: https://sunilpai.dev/posts/after-wimp/

Published Time: 2026-03-13T00:00:00.000Z

Markdown Content:
hey fellow programmer, consider this.

for most of the history of personal computing, we have split users into two classes: programmers got to describe procedures, everyone else got interfaces.

if you could code, the machine was plastic (or clay?). you could reshape it around the task in front of you: rename 10,000 files, clean up ugly data, automate some tedious workflow, stitch together five systems that were never meant to interoperate, whatever. if the feature did not exist, you could usually just write it.

but if you couldn’t code, software had to arrive pre-authored. menus, forms, dashboards, buttons. a finite surface of allowed moves. desktop apps, websites, mobile apps - all required pre-built interfaces.

this was a perfectly sensible arrangement. the GUI era, and especially the WIMP model of windows, icons, menus, and pointer, solved a real problem: most users could express what they wanted, but not the procedure for getting there. so we embedded the procedures into the interface ahead of time. that model emerged from the graphical interface tradition shaped by [Xerox PARC and became the dominant pattern in mainstream personal computing.](https://en.wikipedia.org/wiki/WIMP_%28computing%29)

what seems different now is not that everyone suddenly became a programmer. it is that many more people can now describe procedures in a form that can be compiled into code.

a user who would never open an editor can still say: rename these photos according to the date and location. find the failed invoices from last month and retry the ones that match this customer. go through this API and figure out which combination of calls gives me the answer I actually need.

natural language is not programming in the strict sense, of course. but with a capable model in the loop, it is increasingly enough to specify intent, constraints, and examples well enough for runnable code to be synthesized. (I like thinking about is as every human having a little coding buddle sticking out of their shirt pocket.)

that weakens a very old distinction.

for decades, the practical divide in software was not simply “technical” versus “non-technical.” it was: who gets to issue procedures to the machine, and who has to choose from a menu of pre-authored actions? llms blur that line. once they do, the bottleneck shifts. the hard question is no longer only whether users can express a procedure. the hard question becomes whether the system has somewhere safe to run that code.

that is the part I think we are only just beginning to understand.

code mode was a clue
--------------------

[last year at Cloudflare](https://blog.cloudflare.com/code-mode/), we talked about code mode as a better way for models to use tools. the immediate problem was practical: conventional tool calling has a slightly awkward shape. the model calls a tool, pulls the result back through the context window, calls another tool, pulls that result back through the model, and so on. as the tool surface grows, this gets both expensive and clumsy. Cloudflare’s original code mode post framed this as a way to let the model write and execute code that can combine tool calls directly, instead of shuttling every intermediate result back through the model.

[the MCP version by Matt Carey](https://blog.cloudflare.com/code-mode-mcp/) makes the same point even more sharply. the Cloudflare API MCP server exposes access to the entire API using essentially two tools, `search()` and `execute()`, while consuming around 1,000 tokens. we claimed that a naive equivalent MCP server would require about 1.17 million tokens, a reduction of 99.9%.

that is the obvious story: fewer tokens, fewer round-trips, less context waste.

I do not think it is the most interesting story. like at all, lol.

the deeper lesson is that _models are often better at writing code to use a system than they are at playing the bespoke tool-calling game we built for them_.

![Image 1: kenton says he wants to demo something](https://sunilpai.dev/_astro/kenton-demo.CF44B8jX_Z292ge8.webp)

the moment this really clicked for me was during one of Kenton’s demos. he had an LLM coding agent connected to a canvas. he drew a tic-tac-toe board on it, added an `X` in one corner, then asked the model to play tic tac toe. the model immediately did the obvious 2026 thing: it started generating tic-tac-toe application code.

Kenton stopped it.

he told the model, no; you already have access to the canvas state. the strokes are there. the points are there. inspect that representation and play with me.

to the model’s credit, it switched modes immediately. it analyzed the stroke data, inferred not only that a grid had been drawn but that there was already an `X` in one square, and then wrote back an `O` into the state representation in the center. from there it played the game entirely by reading and mutating the canvas state. Kenton later described the demo in [this thread](https://x.com/KentonVarda/status/2029678769372299508).

what struck me about that demo was that no new application really needed to be generated at all. the intelligence was not in scaffolding a fresh app. it was in understanding an existing stateful environment and using code as the mechanism of interaction with it.

that feels capital I “important”

it suggests that the future is not just “ask an LLM to generate a program for me.” sometimes it will be that. but sometimes the more interesting move is that the system exposes state plus capabilities, and the model learns to _inhabit_ that environment, y’dig?

the model stops trying to _generate_ the program and starts _inhabiting_ the state machine.

(man, shit’s weird in 2026)

the missing primitive is the sandbox
------------------------------------

once you see that, a more consequential question appears. if models can write code on behalf of users, where does that code run?

not eventually, after a sprint or whatever. not after a product team turns the pattern into a roadmap item. I mean right NOW, on behalf of this user, against this system, with tightly defined permissions.

THAT requires a different kind of runtime primitive.

it has to be fast enough to sit in the middle of an interactive request. it has to be isolated enough to run code you do not fully trust. it has to be capability-scoped, so the generated code can only touch the resources it has been granted. and it has to be observable, because generated software that cannot be inspected, audited, or rolled back is not really a feature so much as an unusually elaborate way to generate incidents.

this is where the shape of the sandbox matters.

a lot of current infrastructure in this space starts from the model of a general-purpose machine: spin up a container or a VM, then layer security and policy on top. that is useful, and there are good reasons people build that way. but there is another approach that starts from a different premise. instead of beginning with a miniature server and then trying to constrain it, you begin with an isolate that has almost no ambient authority and then _explicitly_ hand it the capabilities it should have.

that is the interesting thing about isolates here.

Cloudflare’s [dynamic worker loader docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/) make this unusually explicit. dynamic workers run in isolates; outbound network requests can be blocked or intercepted; and only specific bindings can be supplied to represent the resources the sandboxed code is allowed to access. the docs are also unusually direct about the intended use case: with proper sandboxing configured, you can safely run code you do not trust in a dynamic isolate. by contrast, [Node’s own documentation](https://nodejs.org/api/vm.html#vm-executing-javascript) says plainly that `node:vm` is not a security mechanism and should not be used to run untrusted code.

(yeah whatever, this sounds like a marketing pitch, but whatever. that is not the only implementation that will matter, and it is not really the point. someone else will build different runtime mechanisms for this, and they should. the larger thesis has very little to do with any one vendor.)

the important thing is the capability model.

when the sandbox _begins_ nearly powerless, and access is granted resource by resource, you get a much better foundation for user-specific code than you do from a generic machine with security retrofitted around it. you are no longer asking, “how do we stop this thing from doing too much?” you are asking, “what exactly do we want this thing to be able to do?”

now, that is a much healthier question.

from one-off scripts to user-specific software
----------------------------------------------

once you start looking at software through that lens, code mode stops looking like a narrow trick for MCP and starts to look like the shallow end of a much larger pool.

at one end of the spectrum, you have one-off generated code. rename these files. transform this dataset. call these three tools and combine the answer. that alone is already useful.

a bit further along, you get workflows: code that paginates, retries, filters, joins, ranks, and transforms data before the model ever needs to see the final result. one request becomes a small program.

further along still, you get persistent user-specific logic. not just code that runs once, but code attached to a user, an account, or a session and reused over time. maybe it is revised periodically. maybe it adapts as the system learns more. maybe it becomes the place where user-specific behavior lives.

and eventually you get something that looks less like “software with an AI feature” and more like a programmable system wrapped around your product’s data and capabilities.

take an e-commerce site. the normal word here would be “personalization,” but that word is too weak. personalization usually means ranking, segmentation, recommendations, maybe a bit of conditional logic. useful, yes. conceptually familiar, also yes.

now imagine something stronger. each user has a small persistent “runtime” (program?) associated with their account. that runtime has tightly scoped access to the catalog, the cart, order history, the returns policy, maybe a support surface. on each request, it can assemble app bundles, explain trade-offs, adapt the purchasing flow for the user’s constraints, or generate a temporary interface specialized to the task the user is actually trying to complete.

every user gets a somewhat different “program”.

that is not just a better recommendation engine. it is not quite a chatbot either. it is much MUCH closer to user-specific software.

after wimp is not after ui
--------------------------

I suspect this is the real significance of the moment we are entering. the successor to [WIMP](https://en.wikipedia.org/wiki/WIMP_%28computing%29) is probably not “chat,” at least not in the simplistic sense people sometimes mean. we are not heading toward a world where all software collapses into a text box. WIMP solved a real problem. it gave us stable, visual, learnable systems. those properties still matter.

but fixed graphical interfaces stop being the only sensible contract between user and machine once the user can increasingly express procedures through a model. some interfaces will still be hand-authored. some will be generated. some will be assembled on the fly around a particular task. some will disappear into the background and exist mostly as code running on the user’s behalf.

the important shift is that the behavior of the system no longer has to be fully predetermined by the product team before the user arrives. some part of it can now be _synthesized_ at runtime.

that is what I mean by “after wimp.” not the end of interfaces, but the end of the assumption that interfaces must be fully fixed in advance because users cannot program the machine.

for a long time, software was organized around a social fact as much as a technical one: programmers got code, everyone else got buttons. llms unsettle that distinction. safe sandboxes make it operational.

that is why code mode felt bigger to me than it first appeared. it started as an optimization story about tools, MCP, context windows, and token pressure. those wins are real. but the thing it pointed toward was much larger. once users have access to systems that can generate code on their behalf, the next important question is not just how smart the model is. it is whether our software platforms are prepared to host user-specific code safely, quickly, and with tight control over what that code can do.

I think that question is going to shape the next era of human-computer interaction more than we currently realize. I’m looking forward to seeing how it plays out, shit sounds fun.
