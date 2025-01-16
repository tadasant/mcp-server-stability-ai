import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

export async function runSSEServer(server: Server) {
	let sseTransport: SSEServerTransport | null = null;
	const app = express();

	app.get("/sse", (req, res) => {
		sseTransport = new SSEServerTransport("/messages", res);
		server.connect(sseTransport);
	});

	app.post("/messages", (req, res) => {
		if (sseTransport) {
			sseTransport.handlePostMessage(req, res);
		}
	});

	app.listen(3020);
}
