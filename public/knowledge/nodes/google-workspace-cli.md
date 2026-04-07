# Google Workspace CLI
Type: product
Sources: https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/

An agents-first CLI (gws) designed for Google Workspace APIs with machine-readable I/O, schema introspection, input hardening, safety rails, and multi-surface interfaces.

## Relations
- → Agent DX: "I built a CLI for Google Workspace — agents first."
- → Machine-readable output: "Agents don’t need GUIs. They need deterministic, machine-readable output"
- → Schema introspection: "The better pattern: make the CLI itself the documentation, queryable at runtime."
- → Input hardening: "Input Hardening Against Hallucinations"
- → Context window discipline: "Context Window Discipline"
- → SKILL.md files: "`gws` ships 100+ `SKILL.md` files"
- → MCP: "MCP (Model Context Protocol): `gws mcp --services drive,gmail` exposes all commands as JSON-RPC tools over stdio."
- → Gemini CLI Extension: "Gemini CLI Extension: `gemini extensions install https://github.com/googleworkspace/cli` installs the binary as a native capability of the agent."
- → Environment variable auth: "`GOOGLE_WORKSPACE_CLI_TOKEN` and `GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE` enable credential injection via environment"
- → Dry-run: "`--dry-run` validates the request locally without hitting the API."
- → Response sanitization: "`--sanitize <TEMPLATE>` pipes API responses through Google Cloud Model Armor before returning them to the agent."
