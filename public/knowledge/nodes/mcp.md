# MCP
Type: technology
Sources: https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/, https://sunilpai.dev/posts/after-wimp/

Model Context Protocol used for tool integration; code mode applied to MCP dramatically reduces token consumption by exposing APIs through minimal tool surfaces like search() and execute()

## Relations
- → Discovery Document: "Under the hood, the MCP server dynamically builds its tool list from the same Discovery Document used for CLI commands."
- ← Code Mode: "the Cloudflare API MCP server exposes access to the entire API using essentially two tools, search() and execute(), while consuming around 1,000 tokens"
- ← Google Workspace CLI: "MCP (Model Context Protocol): `gws mcp --services drive,gmail` exposes all commands as JSON-RPC tools over stdio."
