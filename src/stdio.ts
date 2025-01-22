import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function runStdioServer(server: Server) {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("stability-ai MCP Server running on stdio");
}
