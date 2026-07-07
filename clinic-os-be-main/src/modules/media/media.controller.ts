import { Response, Express } from 'express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

import { MediaService } from './media.service';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
@ApiTags('Media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload a file to S3',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const response = await this.mediaService.uploadFile(file);
    return res.status(Number(response.status)).json(response);
  }

  @Delete('delete/:id')
  async deleteFile(@Param('id') fileId: string, @Res() res: Response) {
    const response = await this.mediaService.deleteFile(fileId);
    return res.status(response.status).json(response);
  }

  @Get('presigned-url/:id')
  async generatePresignedUrl(
    @Param('id') fileId: string,
    @Res() res: Response,
  ) {
    const response = await this.mediaService.generatePresignedUrl(fileId);
    return res.status(response.status).json(response);
  }
}
