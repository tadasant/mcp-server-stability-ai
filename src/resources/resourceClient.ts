import { Resource } from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";

export class ResourceClient {
	constructor(private readonly imageStorageDirectory: string) {}

	async listResources(): Promise<Resource[]> {
		const resources = await fs.promises.readdir(this.imageStorageDirectory, {
			withFileTypes: true,
		});

		return resources.map((resource) => ({
			uri: `file://${this.imageStorageDirectory}/${resource.name}`,
			name: resource.name,
			mimeType: this.getMimeType(resource.name),
		}));
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
