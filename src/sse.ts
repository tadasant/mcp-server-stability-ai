import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import http from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function runSSEServer(server: Server) {
	// Store the active transport
	let sseTransport: SSEServerTransport | null = null;

	const httpServer = http.createServer(async (req, res) => {
		console.log(`${req.method} request to ${req.url}`);

		if (req.url?.startsWith("/sse")) {
			if (req.method === "GET") {
				console.log("SSE connection attempt received");

				// Add error handler for the response
				res.on("error", (error) => {
					console.error("Response error:", error);
				});

				// Add close handler
				res.on("close", () => {
					sseTransport = null;
					console.log("SSE connection closed");
				});

				sseTransport = new SSEServerTransport("/sse", res);

				await server.connect(sseTransport);

				console.log("SSE connection setup complete");
			} else if (req.method === "POST") {
				if (!sseTransport) {
					res.writeHead(400);
					res.end("No active SSE connection");
					return;
				}

				await sseTransport.handlePostMessage(req, res);
			}
		} else {
			res.writeHead(404);
			res.end();
		}
	});

	httpServer.on("error", (error) => {
		console.error("Server error:", error);
	});

	httpServer.listen(3020, () => {
		console.error(
			"stability-ai MCP Server running on SSE at http://localhost:3020"
		);
	});
}
