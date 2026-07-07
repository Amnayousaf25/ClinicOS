import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable, HttpStatus } from '@nestjs/common';

import {
  createHashPassword,
  comparePassword,
  generatePassword,
} from 'src/modules/auth/utils/auth.util';
import { SerializeHttpResponse } from 'src/utils/serializer';
import { USER_STATUS } from 'src/modules/user/constants/user.constant';
import { MediaService } from 'src/modules/media/media.service';
import { EmailService } from 'src/modules/email/services/email-service';
import { ITemplates } from 'src/modules/email/types/templates.type';
import { MEDIA_FOLDER_NAME } from './constants/user.constant';
import { CreateUserDto, UpdateUserDto, ChangeEmailDto } from './dto/user.dto';
import {
  UserSuccessMessages,
  UserErrorMessages,
} from './constants/user.response';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly mediaService: MediaService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto, file: Express.Multer.File) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase(),
    });

    if (existingUser) {
      return SerializeHttpResponse(
        null,
        HttpStatus.BAD_REQUEST,
        UserErrorMessages.ALREADY_EXISTS,
      );
    }

    const password = generatePassword();
    const hashedPassword = await createHashPassword(password);
    const payload: any = {
      ...createUserDto,
      password: hashedPassword,
      status: USER_STATUS.ACTIVE,
    };

    if (file) {
      const folder = `${MEDIA_FOLDER_NAME.PROFILE}/${createUserDto.email}`;
      const resp = await this.mediaService.uploadFile(file, folder);
      payload.avatar = resp?.data?.key || '';
    }

    const user = await this.userModel.create(payload);

    const emailPayload = {
      email: user.email,
      invitedUserName: user.name,
      password: password,
      userRole: user.role.toLocaleLowerCase(),
    };

    await this.sendOnBoardingEmail(emailPayload);

    return SerializeHttpResponse(
      user,
      HttpStatus.CREATED,
      UserSuccessMessages.CREATED,
    );
  }

  async sendOnBoardingEmail(payload: {
    email: string;
    invitedUserName: string;
    password: string;
  }) {
    const template = this.emailService.loadTemplate(
      ITemplates.NEW_USER,
      payload,
    );

    const subject = 'Welcome to "Platform Name"';
    await this.emailService.sendEmail(payload.email, subject, template);
  }

  async findAll() {
    const users = await this.userModel.find().select('-password');
    return SerializeHttpResponse(
      users,
      HttpStatus.OK,
      UserSuccessMessages.RETRIEVED_ALL,
    );
  }

  async findAllUsers() {
    const users = await this.userModel.find({}).select('-password');

    return SerializeHttpResponse(
      users,
      HttpStatus.OK,
      UserSuccessMessages.RETRIEVED_ALL,
    );
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        UserErrorMessages.NOT_FOUND,
      );
    }

    return SerializeHttpResponse(
      user,
      HttpStatus.OK,
      UserSuccessMessages.RETRIEVED,
    );
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ) {
    const user = await this.userModel.findById(id);

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        UserErrorMessages.NOT_FOUND,
      );
    }

    const payload: any = { ...updateUserDto };

    if (updateUserDto.password) {
      payload.password = await createHashPassword(updateUserDto.password);
    }

    if (file) {
      const folder = `${MEDIA_FOLDER_NAME.PROFILE}/${user.email}`;
      const resp = await this.mediaService.uploadFile(file, folder);
      payload.avatar = resp?.data?.key || '';
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, payload, { new: true })
      .select('-password');

    return SerializeHttpResponse(
      updatedUser,
      HttpStatus.OK,
      UserSuccessMessages.UPDATED,
    );
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        UserErrorMessages.NOT_FOUND,
      );
    }

    await this.userModel.findByIdAndDelete(id);

    return SerializeHttpResponse(
      null,
      HttpStatus.OK,
      UserSuccessMessages.DELETED,
    );
  }

  async changeEmail(userId: string, changeEmailDto: ChangeEmailDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      return SerializeHttpResponse(
        null,
        HttpStatus.NOT_FOUND,
        UserErrorMessages.NOT_FOUND,
      );
    }

    const isPasswordValid = await comparePassword(
      changeEmailDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      return SerializeHttpResponse(
        null,
        HttpStatus.UNAUTHORIZED,
        UserErrorMessages.INVALID_PASSWORD,
      );
    }

    const existingUser = await this.userModel.findOne({
      email: changeEmailDto.email.toLowerCase(),
    });

    if (existingUser) {
      return SerializeHttpResponse(
        null,
        HttpStatus.BAD_REQUEST,
        UserErrorMessages.ALREADY_EXISTS,
      );
    }

    user.email = changeEmailDto.email.toLowerCase();
    user.emailVerified = false;
    await user.save();

    return SerializeHttpResponse(
      user,
      HttpStatus.OK,
      UserSuccessMessages.EMAIL_UPDATED,
    );
  }
}
