import { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ResourceClient } from "./resourceClient.js";
import * as fs from "fs";

export class FilesystemResourceClient extends ResourceClient {
	constructor(private readonly imageStorageDirectory: string) {
		super();
	}

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

	async createResource(uri: string, base64image: string): Promise<Resource> {
		const filename = uri.split("/").pop();
		if (!filename) {
			throw new Error("Invalid file path");
		}

		const [name, ext] = filename.split(".");
		let finalFilename = filename;

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

	async resourceToFile(uri: string): Promise<string> {
		const filename = uri.split("/").pop();
		if (!filename) {
			throw new Error("Invalid file path");
		}
		return uri.replace("file://", "");
	}
}
