import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function runSSEServer(server: Server) {
	let sseTransport: SSEServerTransport | null = null;

	const httpServer = http.createServer(async (req, res) => {
		console.log(`${req.method} request to ${req.url}`);

		if (req.url?.startsWith("/sse") && req.method === "GET") {
			sseTransport = new SSEServerTransport("/messages", res);
			await server.connect(sseTransport);

			res.on("close", () => {
				sseTransport = null;
			});
		} else if (req.url?.startsWith("/messages") && req.method === "POST") {
			if (sseTransport) {
				await sseTransport.handlePostMessage(req, res);
			} else {
				res.writeHead(400);
				res.end("No active SSE connection");
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	});

	httpServer.listen(3020, () => {
		console.error(
			"stability-ai MCP Server running on SSE at http://localhost:3020"
		);
	});
}
