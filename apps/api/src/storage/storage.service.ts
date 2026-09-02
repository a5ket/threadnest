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

/**
 * Prefixes served as permanently public (avatars, nest icons) — anything else (e.g. thread/comment
 * attachments, which can live inside private nests) stays private and must go through
 * {@link StorageService.getPresignedUrl}.
 */
const PUBLIC_READ_PREFIXES = ['avatars/*', 'nests/*']

/**
 * Signed with an hour-aligned timestamp so repeated calls within the hour reuse the same URL,
 * letting the browser cache it instead of re-fetching on every signature change.
 */
const PRESIGN_EXPIRES_IN_SECONDS = 25 * 60 * 60

/** S3-compatible object storage: public assets, presigned private access, and self-host bucket bootstrap. */
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

  /**
   * Self-host convenience: auto-provisions the bucket plus a public-read policy on
   * {@link PUBLIC_READ_PREFIXES} at boot. Harmless no-op against a provider where the bucket
   * already exists and/or the credentials can't manage bucket policy (e.g. a locked-down real
   * S3/R2 bucket) — failures are logged, never fatal to startup.
   */
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

  /**
   * @param key - The storage key to write to.
   * @param body - The object's raw bytes.
   * @param contentType - The MIME type to store alongside the object.
   * @returns The object's public URL — meaningful only if `key` falls under
   * {@link PUBLIC_READ_PREFIXES}; otherwise use {@link getPresignedUrl} to actually reach it.
   */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    }))

    return this.getPublicUrl(key)
  }

  /**
   * Idempotent — deleting an already-missing key is a silent no-op rather than an error, since
   * the end state ("the key doesn't exist") is the same either way.
   *
   * @param key - The storage key to delete.
   */
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

  /**
   * Deletes by public URL instead of key, for callers that only stored the URL. Only removes
   * objects this service itself stored — a URL from before this feature (or from a different
   * storage provider after a migration) simply won't match {@link getKeyFromUrl}'s prefix check
   * and is silently left alone.
   *
   * @param url - The object's public URL, or `null` (a no-op) for "nothing was ever stored".
   */
  async deleteByUrl(url: string | null): Promise<void> {
    const key = this.getKeyFromUrl(url)

    if (key) {
      await this.delete(key)
    }
  }

  /** @param key - The storage key. */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }

  /**
   * For content that isn't unconditionally public (thread/comment attachments, which can live
   * inside private nests) — only ever meant to be handed out by a response that already passed
   * the content's own permission check, and expires rather than being a permanent bypass of that
   * check.
   *
   * @param key - The storage key to grant temporary access to.
   * @returns A time-limited signed URL, valid for {@link PRESIGN_EXPIRES_IN_SECONDS}.
   */
  async getPresignedUrl(key: string): Promise<string> {
    const now = new Date()
    const signingDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: PRESIGN_EXPIRES_IN_SECONDS, signingDate }
    )
  }

  /**
   * @param url - A URL to extract a key from.
   * @returns The storage key, or `null` if `url` isn't one this service issued (doesn't start
   * with its own public URL prefix) — including if `url` is itself `null`.
   */
  getKeyFromUrl(url: string | null): string | null {
    if (!url || !url.startsWith(`${this.publicUrl}/`)) {
      return null
    }

    return url.slice(this.publicUrl.length + 1)
  }
}
