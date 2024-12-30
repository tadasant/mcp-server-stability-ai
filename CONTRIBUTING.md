## Running the server locally

```
npm run build
npm run start
```

## Generating types

1. Download the Stability AI OpenAPI schema: https://platform.stability.ai/docs/api-reference
2. Run the following command to generate the types:

```
npx openapi-typescript openapi.json -o /path/to/mcp-server-stability/src/stabilityAiApi/types.ts
```

## Debugging tools

### Running Inspector

```
npx @modelcontextprotocol/inspector node path/to/mcp-server-stability/build/index.js
```

### Claude

#### Follow logs in real-time

```
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

## Testing with a test.ts file

Helpful for isolating and trying out pieces of code.

1. Create a `src/test.ts` file.
2. Write something like this in it

```ts
import * as dotenv from "dotenv";
import { StabilityAiApiClient } from "./stabilityAi/stabilityAiApiClient.js";
import * as fs from "fs";

dotenv.config();

if (!process.env.STABILITY_AI_API_KEY) {
	throw new Error("STABILITY_AI_API_KEY is required in .env file");
}

const API_KEY = process.env.STABILITY_AI_API_KEY;

async function test() {
	const client = new StabilityAiApiClient(API_KEY);
	const data = await client.generateImageCore(
		"A beautiful sunset over mountains"
	);

	// Create the directory if it doesn't exist
	fs.mkdirSync("stabilityAi", { recursive: true });

	// Write data to file
	fs.writeFileSync("stabilityAi/test.png", data.base64Image, "base64");
	console.log("Image saved to stabilityAi/test.png");
}

test().catch(console.error);
```

3. `npm run build` and `node build/test.js`
