import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { SerializeHttpResponse } from 'src/utils/serializer';
import { S3Service } from 'src/common/services/s3.service';
import { Config } from './constants/config';
import { File } from './schemas/file.schema';
import { AWS_ERROR, AWS_SUCCESS } from './constants/media.response';

@Injectable()
export class MediaService {
  private readonly expiresIn: number;

  constructor(
    @InjectModel(File.name) private readonly fileModel: Model<File>,
    private readonly s3: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.expiresIn =
      this.configService.get<number>(Config.DEFAULT_PRESIGNED_URL_EXPIRATION) ||
      3600;
  }

  async uploadFile(file: Express.Multer.File, folder?: string) {
    if (!file) {
      return SerializeHttpResponse(
        null,
        HttpStatus.UNPROCESSABLE_ENTITY,
        AWS_ERROR.FILE_NOT_FOUND,
      );
    }

    if (!this.s3.bucket || !this.s3.region) {
      return SerializeHttpResponse(
        null,
        HttpStatus.SERVICE_UNAVAILABLE,
        AWS_ERROR.INVALID_FILE,
      );
    }

    // Filenames originating from user uploads can contain spaces and
    // unicode that S3 rejects in keys. Sanitize aggressively while
    // preserving the extension.
    const safeName = file.originalname
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '_');
    const fileName = folder
      ? `${folder}/${safeName}`
      : `${Date.now()}-${safeName}`;

    try {
      await this.s3.upload(fileName, file.buffer, file.mimetype);

      const createdFile = await this.fileModel.create({ path: fileName });

      return SerializeHttpResponse(
        { id: createdFile._id.toString(), key: fileName },
        HttpStatus.CREATED,
        AWS_SUCCESS.UPLOAD_FILE,
      );
    } catch (error: unknown) {
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        AWS_ERROR.UPLOAD_FILE((error as Error).message),
      );
    }
  }

  async deleteFile(fileId: string) {
    const file = await this.fileModel.findById(fileId);

    if (!file) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        AWS_ERROR.FILE_NOT_FOUND,
      );
    }

    try {
      await this.s3.delete(file.path);
      await this.fileModel.findByIdAndDelete(fileId);

      return SerializeHttpResponse(
        null,
        HttpStatus.NO_CONTENT,
        AWS_SUCCESS.DELETE_FILE,
      );
    } catch (error) {
      return SerializeHttpResponse(
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
        AWS_ERROR.DELETE_FILE((error as Error).message),
      );
    }
  }

  async generatePresignedUrl(path: string) {
    try {
      const presignedUrl = await this.s3.getSignedDownloadUrl(
        path,
        this.expiresIn,
      );

      return SerializeHttpResponse(
        {
          url: presignedUrl,
          filename: path.split('/').pop() || 'unknown',
        },
        HttpStatus.OK,
        AWS_SUCCESS.PRESIGNED_URL,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        AWS_ERROR.PRESIGNED_URL((error as Error).message),
      );
    }
  }
}
