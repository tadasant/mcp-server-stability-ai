import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express, { Request } from "express";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import bodyParser from "body-parser";

function getClientIp(req: Request): string {
	return (
		// Check X-Forwarded-For header first (when behind a proxy/load balancer)
		req.get("x-forwarded-for")?.split(",")[0] ||
		// Check X-Real-IP header (common with Nginx)
		req.get("x-real-ip") ||
		// Check req.ip (Express built-in, respects trust proxy setting)
		req.ip ||
		// Fallback to remoteAddress from the underlying socket
		req.socket.remoteAddress ||
		// Final fallback
		"unknown"
	);
}

export async function runSSEServer(server: Server) {
	let sseTransport: SSEServerTransport | null = null;
	const app = express();

	// Used to allow parsing of the body of the request
	app.use("/*", bodyParser.json());

	app.get("/sse", async (req, res) => {
		sseTransport = new SSEServerTransport("/messages", res);
		await server.connect(sseTransport);

		res.on("close", () => {
			sseTransport = null;
		});
	});

	app.post("/messages", async (req: Request, res) => {
		if (sseTransport) {
			// Parse the body and add the IP address
			const body = req.body;
			const params = req.body.params || {};
			params._meta = {
				ip: getClientIp(req),
				headers: req.headers,
			};
			const enrichedBody = {
				...body,
				params,
			};

			await sseTransport.handlePostMessage(req, res, enrichedBody);
		} else {
			res.status(400).send("No active SSE connection");
		}
	});

	// Handle 404s for all other routes
	app.use((req, res) => {
		res.status(404).json({
			error: "Not Found",
			message: `Route ${req.method} ${req.path} not found`,
			timestamp: new Date().toISOString(),
		});
	});

	app.listen(3020, () => {
		console.error(
			"stability-ai MCP Server running on SSE at http://localhost:3020"
		);
	});
}
