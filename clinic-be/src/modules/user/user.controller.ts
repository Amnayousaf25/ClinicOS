import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { GetUser } from 'src/modules/auth/decorators/user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { USER_ROLES } from 'src/modules/user/constants/user.constant';

import { CreateUserDto, UpdateUserDto, ChangeEmailDto } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.create(createUserDto, file);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('all')
  @Roles(USER_ROLES.OWNER, USER_ROLES.ADMIN, USER_ROLES.MEMBER)
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  @Roles(USER_ROLES.OWNER, USER_ROLES.ADMIN)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('change-email')
  changeEmail(
    @GetUser('id') userId: string,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    return this.userService.changeEmail(userId, changeEmailDto);
  }

  @Patch(':id')
  @Roles(USER_ROLES.OWNER, USER_ROLES.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @Roles(USER_ROLES.OWNER, USER_ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
