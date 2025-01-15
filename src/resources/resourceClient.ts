import { Resource } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";

export class ResourceClient {
	constructor(private readonly imageStorageDirectory: string) {}

	async listResources(): Promise<Resource[]> {
		const resources = await fs.promises.readdir(this.imageStorageDirectory, {
			withFileTypes: true,
		});

		return resources.map((resource) => {
			const uri = `file://${this.imageStorageDirectory}/${resource.name}`;
			const mimeType = this.getMimeType(resource.name);
			return { uri, name: resource.name, mimeType };
		});
	}

	async readResource(uri: string): Promise<Resource> {
		try {
			const filePath = uri.replace("file://", "");

			// Check if file exists
			if (!fs.existsSync(filePath)) {
				throw new Error("Resource file not found");
			}

			const content = await fs.promises.readFile(filePath);
			const name = filePath.split("/").pop();

			if (!name) {
				throw new Error("Invalid file path");
			}

			const base64Content = Buffer.from(content).toString("base64");

			return {
				uri,
				name,
				blob: base64Content,
				mimeType: this.getMimeType(name),
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to read resource: ${error.message}`);
			}
			throw new Error("Failed to read resource: Unknown error");
		}
	}

	async createResource(uri: string, base64image: string) {
		const filename = uri.split("/").pop();
		if (!filename) {
			throw new Error("Invalid file path");
		}

		// Split filename into name and extension
		const [name, ext] = filename.split(".");
		let finalFilename = filename;

		// If file exists, append random string
		if (fs.existsSync(`${this.imageStorageDirectory}/${filename}`)) {
			const randomString = Math.random().toString(36).substring(2, 7);
			finalFilename = `${name}-${randomString}.${ext}`;
		}

		fs.writeFileSync(
			`${this.imageStorageDirectory}/${finalFilename}`,
			base64image,
			"base64"
		);

		const fullUri = `file://${this.imageStorageDirectory}/${finalFilename}`;

		return {
			uri: fullUri,
			name: finalFilename,
			mimeType: this.getMimeType(finalFilename),
			text: `Image ${finalFilename} successfully created at URI ${fullUri}.`,
		};
	}

	// Return a resource URI as a file path. In the stdio case, this is simply a matter of stripped out the file:// prefix.
	// TODO: in the SSE case, we want to actually download the file from external storage and (temporarily) store it locally while we stream it to Stability. Also will need to handle deletion after the fact (maybe refactor to use a temp directory in both stdio and SSE cases)
	async resourceToFile(uri: string) {
		const filename = uri.split("/").pop();
		if (!filename) {
			throw new Error("Invalid file path");
		}
		return uri.replace("file://", "");
	}

	private getMimeType(filename: string): string {
		const ext = filename.toLowerCase().split(".").pop();
		switch (ext) {
			case "jpg":
			case "jpeg":
				return "image/jpeg";
			case "png":
				return "image/png";
			case "gif":
				return "image/gif";
			default:
				return "application/octet-stream";
		}
	}
}
