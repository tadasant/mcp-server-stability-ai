import { Resource } from "@modelcontextprotocol/sdk/types.js";
import { ResourceClient, ResourceContext } from "./resourceClient.js";
import { GcsClient } from "../gcs/gcsClient.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export class GcsResourceClient extends ResourceClient {
	private readonly tempDir: string;
	private ipAddress?: string;

	constructor(private readonly gcsClient: GcsClient) {
		super();
		this.tempDir = fs.mkdtempSync(
			path.join(os.tmpdir(), "stability-ai-mcp-server-gcs-resource-")
		);
	}

	getPrefix(context?: ResourceContext): string {
		return context?.requestorIpAddress + "/";
	}

	async listResources(context?: ResourceContext): Promise<Resource[]> {
		const files = await this.gcsClient.listFiles(this.getPrefix(context));
		return files.map((file) => {
			const nameWithoutPrefix = file.name.replace(this.getPrefix(context), "");
			return {
				uri: `gcs://${nameWithoutPrefix}`,
				name: nameWithoutPrefix,
				mimeType: this.getMimeType(nameWithoutPrefix),
			};
		});
	}

	async readResource(
		uri: string,
		context?: ResourceContext
	): Promise<Resource> {
		try {
			const filename = uri.replace("gcs://", "");
			const tempFilePath = path.join(this.tempDir, filename);

			await this.gcsClient.downloadFile(
				this.getPrefix(context) + filename,
				tempFilePath
			);
			const content = await fs.promises.readFile(tempFilePath);
			const base64Content = content.toString("base64");

			// Clean up temp file
			fs.unlinkSync(tempFilePath);

			return {
				uri,
				name: filename,
				blob: base64Content,
				mimeType: this.getMimeType(filename),
			};
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to read resource: ${error.message}`);
			}
			throw new Error("Failed to read resource: Unknown error");
		}
	}

	async createResource(
		uri: string,
		base64image: string,
		context?: ResourceContext
	): Promise<Resource> {
		const filename = uri.replace("gcs://", "");
		if (!filename) {
			throw new Error("Invalid file path");
		}

		const [name, ext] = filename.split(".");
		const randomString = Math.random().toString(36).substring(2, 7);
		const finalFilename = `${name}-${randomString}.${ext}`;

		// Write to temp file first
		const tempFilePath = path.join(this.tempDir, finalFilename);
		fs.writeFileSync(tempFilePath, base64image, "base64");

		// Upload to GCS
		await this.gcsClient.uploadFile(tempFilePath, {
			destination: this.getPrefix(context) + finalFilename,
			contentType: this.getMimeType(finalFilename),
		});

		// Clean up temp file
		fs.unlinkSync(tempFilePath);

		const fullUri = `gcs://${finalFilename}`;

		return {
			uri: fullUri,
			name: finalFilename,
			mimeType: this.getMimeType(finalFilename),
			text: `Image ${finalFilename} successfully created at URI ${fullUri}.`,
		};
	}

	async resourceToFile(
		uri: string,
		context?: ResourceContext
	): Promise<string> {
		const filename = uri.replace("gcs://", "");
		if (!filename) {
			throw new Error("Invalid file path");
		}

		const tempFilePath = path.join(this.tempDir, filename);
		await this.gcsClient.downloadFile(
			this.getPrefix(context) + filename,
			tempFilePath
		);

		return tempFilePath;
	}
}
