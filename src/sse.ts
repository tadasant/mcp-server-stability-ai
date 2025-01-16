import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function runSSEServer(server: Server) {
	let sseTransport: SSEServerTransport | null = null;
	const app = express();

	app.get("/sse", async (req, res) => {
		sseTransport = new SSEServerTransport("/messages", res);
		await server.connect(sseTransport);

		res.on("close", () => {
			sseTransport = null;
		});
	});

	app.post("/messages", async (req, res) => {
		if (sseTransport) {
			await sseTransport.handlePostMessage(req, res);
		} else {
			res.status(400).send("No active SSE connection");
		}
	});

	// Handle 404s for all other routes
	app.use((req, res) => {
		res.status(404).end();
	});

	app.listen(3020, () => {
		console.error(
			"stability-ai MCP Server running on SSE at http://localhost:3020"
		);
	});
}
