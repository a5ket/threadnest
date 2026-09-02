import { PlatformRole } from 'generated/prisma/enums'
import { Command, CommandRunner } from 'nest-commander'
import { PlatformRoleGrantCreateDto } from '../role-grant/dto/platform-role-grant-create.dto'
import { PlatformRoleGrantService } from '../role-grant/platform-role-grant.service'

/**
 * CLI: `grant-admin <email> <role>` — bootstraps the first platform moderator/admin, since
 * granting a role normally requires an existing admin (a chicken-and-egg problem for a fresh
 * deployment with no admins yet). Run via the app's CLI entry point, not over HTTP.
 */
@Command({ name: 'grant-admin', description: 'Grant a platform role to a user by email', arguments: '<email> <role>' })
export class GrantAdminCommand extends CommandRunner {
  constructor(
    private readonly roleGrantService: PlatformRoleGrantService
  ) {
    super()
  }

  /** @param param0 - The CLI's positional arguments: `[email, role]`. */
  async run([email, role]: string[]) {
    const dto = new PlatformRoleGrantCreateDto()
    dto.role = role as PlatformRole

    const grant = await this.roleGrantService.grantRoleBySystemForEmail(email, dto)

    console.log(`Granted ${dto.role} to user ${grant.userId}`)
  }
}
