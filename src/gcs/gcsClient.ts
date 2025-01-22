import { Storage, File } from "@google-cloud/storage";

// Example .env file:
// GCS_PROJECT_ID=your-project-id
// GCS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
// GCS_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n
interface GcsClientConfig {
	privateKey?: string;
	clientEmail?: string;
	projectId?: string;
}

interface UploadOptions {
	contentType?: string;
	destination?: string;
}

export class GcsClient {
	private readonly storage: Storage;
	private readonly bucketName = "stability-ai-mcp-server";

	constructor(config?: GcsClientConfig) {
		const credentials =
			config?.privateKey && config?.clientEmail
				? {
						type: "service_account",
						private_key: config.privateKey.replace(/\\n/g, "\n"),
						client_email: config.clientEmail,
						project_id: config.projectId,
					}
				: undefined;

		this.storage = new Storage({
			credentials,
			projectId: config?.projectId,
		});

		// Initialize bucket
		this.initializeBucket().catch((error) => {
			console.error("Warning: Bucket initialization error:", error.message);
		});
	}

	private async initializeBucket(): Promise<void> {
		try {
			const [exists] = await this.storage.bucket(this.bucketName).exists();
			if (!exists) {
				await this.storage.createBucket(this.bucketName);
				console.log(`Bucket ${this.bucketName} created successfully.`);
			} else {
				console.log(`Bucket ${this.bucketName} already exists.`);
			}
		} catch (error) {
			throw new Error(`Failed to initialize bucket: ${error}`);
		}
	}

	async uploadFile(filePath: string, options?: UploadOptions): Promise<File> {
		try {
			const bucket = this.storage.bucket(this.bucketName);
			const destination = options?.destination || filePath.split("/").pop();

			const [file] = await bucket.upload(filePath, {
				destination,
				contentType: options?.contentType,
			});

			return file;
		} catch (error) {
			throw new Error(`Failed to upload file: ${error}`);
		}
	}

	async downloadFile(fileName: string, destinationPath: string): Promise<void> {
		try {
			const bucket = this.storage.bucket(this.bucketName);
			const file = bucket.file(fileName);

			await file.download({
				destination: destinationPath,
			});
		} catch (error) {
			throw new Error(`Failed to download file: ${error}`);
		}
	}

	async listFiles(prefix?: string): Promise<File[]> {
		try {
			const bucket = this.storage.bucket(this.bucketName);
			const [files] = await bucket.getFiles({ prefix });
			return files;
		} catch (error) {
			throw new Error(`Failed to list files: ${error}`);
		}
	}
}
