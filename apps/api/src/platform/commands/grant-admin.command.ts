import { PlatformRole } from 'generated/prisma/enums'
import { Command, CommandRunner } from 'nest-commander'
import { PlatformRoleGrantCreateDto } from '../role-grant/dto/platform-role-grant-create.dto'
import { PlatformRoleGrantService } from '../role-grant/platform-role-grant.service'

@Command({ name: 'grant-admin', description: 'Grant a platform role to a user by email', arguments: '<email> <role>' })
export class GrantAdminCommand extends CommandRunner {
  constructor(
    private readonly roleGrantService: PlatformRoleGrantService
  ) {
    super()
  }

  async run([email, role]: string[]) {
    const dto = new PlatformRoleGrantCreateDto()
    dto.role = role as PlatformRole

    const grant = await this.roleGrantService.grantRoleBySystemForEmail(email, dto)

    console.log(`Granted ${dto.role} to user ${grant.userId}`)
  }
}
