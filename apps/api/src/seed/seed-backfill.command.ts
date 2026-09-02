import { NestJoinPolicy, VoteType } from 'generated/prisma/enums'
import { Command, CommandRunner } from 'nest-commander'
import sharp from 'sharp'
import { AttachmentService } from 'src/attachment/attachment.service'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { NestService } from 'src/nest/nest.service'
import { NestSettingsService } from 'src/nest/settings/nest-settings.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { CommentService } from 'src/comment/comment.service'
import { ThreadService } from 'src/thread/thread.service'
import { UserService } from 'src/user/user.service'

const USER_NAMES = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank']

const COLOR_PALETTE: [number, number, number][] = [
  [239, 68, 68],
  [249, 115, 22],
  [234, 179, 8],
  [34, 197, 94],
  [20, 184, 166],
  [59, 130, 246],
  [139, 92, 246],
  [236, 72, 153]
]

const NEST_ICON_COLOR: Record<string, [number, number, number]> = {
  'game-devs': COLOR_PALETTE[0],
  'book-club': COLOR_PALETTE[1],
  'photography-corner': COLOR_PALETTE[2],
  'indie-hackers': COLOR_PALETTE[3],
  'the-vault': COLOR_PALETTE[4]
}

async function generatePlaceholderImage(rgb: [number, number, number], size: number): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } }
  }).png().toBuffer()
}

@Command({ name: 'seed:backfill', description: 'One-time repair for seed data created before avatars/icons/attachments/the-vault expansion existed' })
export class SeedBackfillCommand extends CommandRunner {
  constructor(
    private readonly users: UserService,
    private readonly nests: NestService,
    private readonly nestMembers: NestMemberService,
    private readonly nestSettings: NestSettingsService,
    private readonly threads: ThreadService,
    private readonly comments: CommentService,
    private readonly attachments: AttachmentService,
    private readonly prisma: PrismaService
  ) {
    super()
  }

  async run() {
    const userIds: Record<string, string> = {}

    for (const [index, name] of USER_NAMES.entries()) {
      const email = `seed-${name}@example.com`
      const user = await this.prisma.user.findUnique({ where: { email } })
      if (!user) continue
      userIds[name] = user.id

      const profile = await this.prisma.userProfile.findUnique({ where: { userId: user.id } })
      if (profile && !profile.avatarKey) {
        await this.users.updateAvatar(user.id, await generatePlaceholderImage(COLOR_PALETTE[index % COLOR_PALETTE.length], 256))
        console.log(`Backfilled avatar for ${email}`)
      }
    }

    for (const [slug, color] of Object.entries(NEST_ICON_COLOR)) {
      const nest = await this.prisma.nest.findUnique({ where: { slug } })
      if (!nest || nest.iconKey) continue

      const owner = await this.prisma.nestMember.findFirst({ where: { nestId: nest.id, role: 'OWNER' } })
      if (!owner) continue

      await this.nests.updateIcon(slug, owner.userId, await generatePlaceholderImage(color, 256))
      console.log(`Backfilled icon for nest "${slug}"`)
    }

    await this.backfillAttachment('game-devs', 'What engine are you using in 2026?')
    await this.backfillAttachment('photography-corner', 'Golden hour shots from this weekend')

    await this.backfillTheVault(userIds)

    console.log('Backfill complete.')
  }

  private async backfillAttachment(nestSlug: string, threadTitle: string) {
    const nest = await this.prisma.nest.findUnique({ where: { slug: nestSlug } })
    if (!nest) return

    const thread = await this.prisma.thread.findFirst({ where: { nestId: nest.id, title: threadTitle }, include: { attachments: true } })
    if (!thread || thread.attachments.length > 0) return

    const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
    const uploaded = await this.attachments.upload(thread.authorId, await generatePlaceholderImage(color, 800))

    await this.threads.updateThread(nestSlug, thread.slug, thread.authorId, {
      title: thread.title,
      content: thread.content ?? '',
      attachments: [uploaded]
    })
    console.log(`Backfilled attachment for thread "${threadTitle}" in "${nestSlug}"`)
  }

  private async backfillTheVault(userIds: Record<string, string>) {
    const nest = await this.prisma.nest.findUnique({ where: { slug: 'the-vault' } })
    if (!nest) return

    const settings = await this.prisma.nestSettings.findUnique({ where: { nestId: nest.id } })
    if (settings?.joinPolicy === NestJoinPolicy.BY_INVITE) {
      await this.nestSettings.updateSettings('the-vault', userIds.erin, { joinPolicy: NestJoinPolicy.OPEN })
      console.log('Opened join policy for "the-vault"')
    }

    for (const name of ['bob', 'frank']) {
      const alreadyMember = await this.prisma.nestMember.findFirst({ where: { nestId: nest.id, userId: userIds[name] } })
      if (alreadyMember) continue
      await this.nestMembers.joinNest('the-vault', userIds[name])
      console.log(`Added ${name} to "the-vault"`)
    }

    const existingThread = await this.prisma.thread.findFirst({ where: { nestId: nest.id, title: 'Plans for the weekend?' } })
    if (existingThread) return

    const thread = await this.threads.createThread('the-vault', userIds.bob, {
      title: 'Plans for the weekend?',
      content: 'Thinking of getting everyone together, who\'s around?'
    })
    await this.prisma.thread.update({ where: { id: thread.id }, data: { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) } })
    await this.comments.createThreadCommentByThreadSlug('the-vault', thread.slug, userIds.frank, { content: 'I\'m in, just tell me when.' })
    await this.threads.voteOnThread('the-vault', thread.slug, userIds.erin, VoteType.UPVOTE)
    console.log('Backfilled second thread for "the-vault"')
  }
}
