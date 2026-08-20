import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor'
import { ApiDataResponse } from 'src/common/swagger/api-data-response.decorator'
import { ApiExceptionResponses } from 'src/common/swagger/api-exception-responses.decorator'
import { ValidationException } from 'src/common/exceptions/validation.exception'
import type { AuthUser } from 'src/common/types/auth.user'
import { Authenticated } from 'src/security/decorators/authenticated.decorator'
import { CurrentUser } from 'src/security/decorators/current-user.decorator'
import { RateLimit } from 'src/security/decorators/rate-limit.decorator'
import { ImageFileRequiredException } from 'src/storage/exceptions/image-file-required.exception'
import { ImageTooLargeException } from 'src/storage/exceptions/image-too-large.exception'
import { InvalidImageFileException } from 'src/storage/exceptions/invalid-image-file.exception'
import { UpdateProfileDto } from 'src/user/dto/update-profile.dto'
import { UserProfileResponseDto } from 'src/user/dto/user-profile-response.dto'
import { UsernameTakenException } from 'src/user/exceptions/username-taken.exception'
import { UserService } from 'src/user/user.service'

@ApiTags('Me')
@Controller('me/profile')
@Authenticated()
@UseInterceptors(ResponseInterceptor)
export class MeProfileController {
  constructor(private readonly users: UserService) { }

  @Get()
  @ApiOperation({ operationId: 'meProfileGet', summary: 'Get the current user\'s profile' })
  @ApiDataResponse({ status: 200, description: 'Profile', type: UserProfileResponseDto })
  getProfile(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id)
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @ApiOperation({ operationId: 'meProfileUpdate', summary: 'Update the current user\'s profile' })
  @ApiDataResponse({ status: 200, description: 'Updated profile', type: UserProfileResponseDto })
  @ApiExceptionResponses(ValidationException, UsernameTakenException)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto
  ) {
    return this.users.updateProfile(user.id, dto)
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ limit: 10, ttlMs: 60_000 })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ operationId: 'meProfileAvatarUpload', summary: 'Upload the current user\'s avatar' })
  @ApiDataResponse({ status: 200, description: 'Updated profile', type: UserProfileResponseDto })
  @ApiExceptionResponses(ImageFileRequiredException, InvalidImageFileException, ImageTooLargeException)
  updateAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    if (!file) {
      throw new ImageFileRequiredException()
    }

    return this.users.updateAvatar(user.id, file.buffer)
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'meProfileAvatarDelete', summary: 'Remove the current user\'s avatar' })
  @ApiDataResponse({ status: 200, description: 'Updated profile', type: UserProfileResponseDto })
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.users.removeAvatar(user.id)
  }
}
