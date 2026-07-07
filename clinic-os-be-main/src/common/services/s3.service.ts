import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CONFIG } from 'src/common/constants/config.constants';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  readonly bucket: string;
  readonly region: string;
  readonly cdnDomain: string;

  constructor(private readonly configService: ConfigService) {
    this.region = this.configService.get<string>(CONFIG.AWS_REGION)!;
    this.bucket = this.configService.get<string>(CONFIG.AWS_S3_BUCKET)!;
    this.cdnDomain =
      this.configService.get<string>(CONFIG.AWS_CLOUDFRONT_DOMAIN) || '';

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>(CONFIG.AWS_ACCESS_KEY_ID)!,
        secretAccessKey: this.configService.get<string>(
          CONFIG.AWS_SECRET_ACCESS_KEY,
        )!,
      },
    });
  }

  async upload(
    key: string,
    body: Buffer | ReadableStream,
    contentType: string,
  ) {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      },
    });
    return upload.done();
  }

  async getSignedUploadUrl(key: string, contentType: string, expiresIn = 300) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getObject(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.client.send(command);
  }

  async delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return this.client.send(command);
  }

  getCdnUrl(key: string): string {
    if (this.cdnDomain && !this.cdnDomain.includes('xxxx')) {
      return `${this.cdnDomain}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
