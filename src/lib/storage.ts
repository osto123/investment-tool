import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { put, get, del } from "@vercel/blob";

export interface StoredFileRef {
  storagePath: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface StorageAdapter {
  save(input: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    keyPrefix: string;
  }): Promise<StoredFileRef>;
  read(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
}

class LocalDiskStorageAdapter implements StorageAdapter {
  constructor(private readonly root: string) {}

  async save({
    buffer,
    fileName,
    mimeType,
    keyPrefix,
  }: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    keyPrefix: string;
  }): Promise<StoredFileRef> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${keyPrefix}/${randomUUID()}-${safeName}`;
    const fullPath = path.join(this.root, storagePath);

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);

    return { storagePath, fileName, mimeType, size: buffer.length };
  }

  async read(storagePath: string): Promise<Buffer> {
    return fs.readFile(path.join(this.root, storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    await fs.rm(path.join(this.root, storagePath), { force: true });
  }
}

class VercelBlobStorageAdapter implements StorageAdapter {
  async save({
    buffer,
    fileName,
    mimeType,
    keyPrefix,
  }: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    keyPrefix: string;
  }): Promise<StoredFileRef> {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `${keyPrefix}/${randomUUID()}-${safeName}`;

    const blob = await put(pathname, buffer, {
      access: "private",
      contentType: mimeType,
      addRandomSuffix: false,
    });

    return { storagePath: blob.pathname, fileName, mimeType, size: buffer.length };
  }

  async read(storagePath: string): Promise<Buffer> {
    const result = await get(storagePath, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error(`Receipt not found in blob storage: ${storagePath}`);
    }

    const chunks: Uint8Array[] = [];
    const reader = result.stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    return Buffer.concat(chunks);
  }

  async delete(storagePath: string): Promise<void> {
    await del(storagePath);
  }
}

let cachedAdapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (cachedAdapter) return cachedAdapter;

  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    const root = path.resolve(
      /* turbopackIgnore: true */ process.cwd(),
      process.env.STORAGE_LOCAL_PATH ?? "./storage"
    );
    cachedAdapter = new LocalDiskStorageAdapter(root);
    return cachedAdapter;
  }

  if (driver === "vercel-blob") {
    cachedAdapter = new VercelBlobStorageAdapter();
    return cachedAdapter;
  }

  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}
