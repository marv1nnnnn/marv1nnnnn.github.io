# Capability-scoped sandbox
Type: concept
Sources: https://sunilpai.dev/posts/after-wimp/

Runtime primitive that begins with nearly no ambient authority and explicitly grants capabilities resource by resource, enabling safe execution of untrusted user-generated code with tight permission control, fast enough for interactive requests

## Relations
- → User-specific software: "once users have access to systems that can generate code on their behalf, the next important question is not just how smart the model is. it is whether our software platforms are prepared to host user-specific code safely, quickly, and with tight control"
- → All-or-nothing permissions: "instead of beginning with a miniature server and then trying to constrain it, you begin with an isolate that has almost no ambient authority and then explicitly hand it the capabilities it should have"
- ← Procedural expressibility: "if models can write code on behalf of users, where does that code run? ... THAT requires a different kind of runtime primitive"
