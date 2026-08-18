export interface StorageUploadResult {
  url: string
  key: string
  fileName: string
  sizeBytes?: number
  mimeType?: string
}

export interface StorageProvider {
  uploadFile(file: File | Buffer, fileName: string, options?: { folder?: string; mimeType?: string }): Promise<StorageUploadResult>
  deleteFile(keyOrUrl: string): Promise<boolean>
  getFileUrl(keyOrUrl: string): string
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string

  constructor(uploadDir = 'public/uploads') {
    this.uploadDir = uploadDir
  }

  async uploadFile(file: File | Buffer, fileName: string, options?: { folder?: string; mimeType?: string }): Promise<StorageUploadResult> {
    // In server environment, store file locally or generate path
    const folder = options?.folder ? `${options.folder}/` : ''
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const relativePath = `/uploads/${folder}${safeName}`
    
    return {
      url: relativePath,
      key: relativePath,
      fileName,
      mimeType: options?.mimeType || 'application/octet-stream',
    }
  }

  async deleteFile(keyOrUrl: string): Promise<boolean> {
    return true
  }

  getFileUrl(keyOrUrl: string): string {
    return keyOrUrl
  }
}

// Global active storage provider instance
export const storageProvider: StorageProvider = new LocalStorageProvider()
