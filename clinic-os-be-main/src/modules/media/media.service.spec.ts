import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { File } from './schemas/file.schema';
import { S3Service } from 'src/common/services/s3.service';

describe('MediaService', () => {
  let service: MediaService;

  const mockFileModel: any = {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  const mockS3Service = {
    bucket: 'test-bucket',
    region: 'us-east-1',
    upload: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    getSignedDownloadUrl: jest
      .fn()
      .mockResolvedValue('https://s3.signed-url.com/test'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(3600),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: getModelToken(File.name), useValue: mockFileModel },
        { provide: S3Service, useValue: mockS3Service },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should return error when file is missing', async () => {
      const result = await service.uploadFile(null as any);
      expect(result.status).toBe(422);
    });

    it('should upload file to S3 and save to DB', async () => {
      const file = {
        originalname: 'test.png',
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
      } as Express.Multer.File;
      mockFileModel.create.mockResolvedValue({ _id: 'f1', path: 'test.png' });

      const result = await service.uploadFile(file);
      expect(result.status).toBe(201);
      expect(mockS3Service.upload).toHaveBeenCalledWith(
        expect.stringContaining('test.png'),
        file.buffer,
        'image/png',
      );
    });

    it('should sanitize uploaded filenames before storing S3 keys', async () => {
      const file = {
        originalname: 'my avatar 😄.png',
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
      } as Express.Multer.File;
      mockFileModel.create.mockResolvedValue({
        _id: 'f1',
        path: 'my_avatar.png',
      });

      await service.uploadFile(file);

      expect(mockS3Service.upload).toHaveBeenCalledWith(
        expect.stringMatching(/my_avatar_\.png$/),
        file.buffer,
        'image/png',
      );
    });
  });

  describe('deleteFile', () => {
    it('should return 404 when file not found', async () => {
      mockFileModel.findById.mockResolvedValue(null);
      const result = await service.deleteFile('bad-id');
      expect(result.status).toBe(404);
    });

    it('should delete from S3 and DB', async () => {
      mockFileModel.findById.mockResolvedValue({ _id: 'f1', path: 'test.png' });
      mockFileModel.findByIdAndDelete.mockResolvedValue({});

      const result = await service.deleteFile('f1');
      expect(result.status).toBe(204);
      expect(mockS3Service.delete).toHaveBeenCalledWith('test.png');
    });
  });

  describe('generatePresignedUrl', () => {
    it('should return presigned url', async () => {
      const result = await service.generatePresignedUrl('uploads/test.png');
      expect(result.status).toBe(200);
      expect(result.data.url).toBe('https://s3.signed-url.com/test');
      expect(result.data.filename).toBe('test.png');
    });
  });
});
