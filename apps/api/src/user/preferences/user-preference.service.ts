import { Injectable } from '@nestjs/common'
import { UserPreferenceUpdateDto } from './dto/user-preference.update.dto'
import { UserPreferenceRepository } from './user-preference.repository'

@Injectable()
export class UserPreferenceService {
  constructor(private readonly repo: UserPreferenceRepository) { }

  /**
   * Supplies `showActivityOnProfile: true` when the user has never set a preference — new
   * accounts default to visible.
   *
   * @param userId - The account to look up.
   */
  async get(userId: string) {
    const preference = await this.repo.getByUserId(userId)

    return preference ?? { userId, showActivityOnProfile: true }
  }

  /**
   * No-op (returns the current value) if the dto sets nothing — avoids writing a row just to
   * leave everything unchanged.
   *
   * @param userId - The account to update.
   * @param dto - New preference values; only `showActivityOnProfile` currently exists.
   */
  async update(userId: string, dto: UserPreferenceUpdateDto) {
    if (dto.showActivityOnProfile === undefined) {
      return this.get(userId)
    }

    const existing = await this.repo.getByUserId(userId)
    const showActivityOnProfile = dto.showActivityOnProfile ?? existing?.showActivityOnProfile ?? true

    return this.repo.upsert(userId, showActivityOnProfile)
  }
}
