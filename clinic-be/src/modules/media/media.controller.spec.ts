import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { getModelToken } from '@nestjs/mongoose';

describe('MediaController', () => {
  let controller: MediaController;

  const mockMediaService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    generatePresignedUrl: jest.fn(),
  };

  const mockUserModel = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: MediaService, useValue: mockMediaService },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
