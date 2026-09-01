import {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  NoSuchKey,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { StorageConfig } from './storage.config'

// Prefixes served as permanently public (avatars, nest icons) — anything else (e.g. thread/comment
// attachments, which can live inside private nests) stays private and must go through getPresignedUrl.
const PUBLIC_READ_PREFIXES = ['avatars/*', 'nests/*']

// Signed with an hour-aligned timestamp so repeated calls within the hour reuse the same URL,
// letting the browser cache it instead of re-fetching on every signature change.
const PRESIGN_EXPIRES_IN_SECONDS = 25 * 60 * 60

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: S3Client
  private readonly bucket: string
  private readonly publicUrl: string

  constructor(config: ConfigService<StorageConfig>) {
    const endpoint = config.getOrThrow('storageEndpoint', { infer: true })
    const region = config.getOrThrow('storageRegion', { infer: true })
    const accessKeyId = config.getOrThrow('storageAccessKeyId', { infer: true })
    const secretAccessKey = config.getOrThrow('storageSecretAccessKey', { infer: true })
    const forcePathStyle = config.getOrThrow('storageForcePathStyle', { infer: true })

    this.bucket = config.getOrThrow('storageBucket', { infer: true })
    this.publicUrl = config.getOrThrow('storagePublicUrl', { infer: true }).replace(/\/$/, '')

    this.client = new S3Client({
      endpoint,
      region,
      forcePathStyle,
      credentials: { accessKeyId, secretAccessKey }
    })
  }

  // Self-host convenience: auto-provisions the bucket + a public-read policy on boot.
  // Harmless no-op against a provider where the bucket already exists and/or the credentials
  // can't manage bucket policy (e.g. a locked-down real S3/R2 bucket) — logged, not fatal.
  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
    }
    catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }))
      }
      catch (error) {
        if (!(error instanceof BucketAlreadyExists) && !(error instanceof BucketAlreadyOwnedByYou)) {
          this.logger.warn(`Could not create storage bucket "${this.bucket}": ${(error as Error).message}`)
          return
        }
      }
    }

    try {
      await this.client.send(new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: PUBLIC_READ_PREFIXES.map((prefix) => `arn:aws:s3:::${this.bucket}/${prefix}`)
          }]
        })
      }))
    }
    catch (error) {
      this.logger.warn(`Could not set public-read policy on bucket "${this.bucket}": ${(error as Error).message}`)
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    }))

    return this.getPublicUrl(key)
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    }
    catch (error) {
      if (!(error instanceof NoSuchKey)) {
        throw error
      }
    }
  }

  // Only removes objects we ourselves stored — a URL from before this feature (or from a
  // different storage provider after a migration) simply won't match and is left alone.
  async deleteByUrl(url: string | null): Promise<void> {
    const key = this.getKeyFromUrl(url)

    if (key) {
      await this.delete(key)
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }

  // For content that isn't unconditionally public (thread/comment attachments, which can live inside
  // private nests) — only ever handed out by a response that already passed the content's own
  // permission check, and expires rather than being a permanent bypass of that check.
  async getPresignedUrl(key: string): Promise<string> {
    const now = new Date()
    const signingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: PRESIGN_EXPIRES_IN_SECONDS, signingDate }
    )
  }

  getKeyFromUrl(url: string | null): string | null {
    if (!url || !url.startsWith(`${this.publicUrl}/`)) {
      return null
    }

    return url.slice(this.publicUrl.length + 1)
  }
}
