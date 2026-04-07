# Code Mode
Type: concept
Sources: https://sunilpai.dev/posts/after-wimp/

Pattern where LLMs write and execute code to combine tool calls directly rather than shuttling intermediate results back through the model via conventional tool calling, reducing tokens by orders of magnitude (e.g., 1,000 vs 1.17 million tokens for Cloudflare API)

## Relations
- → Model inhabiting state: "the model stops trying to generate the program and starts inhabiting the state machine"
- → MCP: "the Cloudflare API MCP server exposes access to the entire API using essentially two tools, search() and execute(), while consuming around 1,000 tokens"
