import { Prisma } from 'generated/prisma/client'
import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { Database } from 'src/prisma/types/database'
import { NEST_SETTINGS_SELECT } from './selects/nest-settings.select'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'

export interface NestSettingsCreateOptions {
  visibility?: NestVisibility
  joinPolicy?: NestJoinPolicy
}

export type NestSettingsSelectResult = Prisma.NestSettingsGetPayload<{ select: typeof NEST_SETTINGS_SELECT }>

/** Persistence contract for nest settings. */
export abstract class NestSettingsRepository {
  abstract create(nestId: string, options?: NestSettingsCreateOptions, db?: Database): Promise<NestSettingsSelectResult>
  abstract get(nestId: string): Promise<NestSettingsSelectResult>
  abstract update(nestId: string, dto: NestSettingsUpdateDto, db?: Database): Promise<NestSettingsSelectResult>
}
