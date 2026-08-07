import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

interface NestMemberView {
  user: UserReferenceDto
  role: NestMemberRole
  createdAt: Date
}

@Injectable()
export class NestMemberPresenter {
  toView(member: NestMemberView) {
    return {
      user: member.user,
      role: member.role,
      createdAt: member.createdAt,
    }
  }
}
