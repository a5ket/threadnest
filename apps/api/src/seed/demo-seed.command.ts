import * as argon2 from 'argon2'
import { NestJoinPolicy, NestVisibility, VoteType } from 'generated/prisma/enums'
import { Command, CommandRunner, Option } from 'nest-commander'
import sharp from 'sharp'
import { AttachmentService } from 'src/attachment/attachment.service'
import { CommentService } from 'src/comment/comment.service'
import { NestMemberService } from 'src/nest/member/nest-member.service'
import { NestRepository } from 'src/nest/nest.repository'
import { NestService } from 'src/nest/nest.service'
import { NestPaywallService } from 'src/nest/paywall/nest-paywall.service'
import { PrismaService } from 'src/prisma/prisma.service'
import { ThreadService } from 'src/thread/thread.service'
import { UserService } from 'src/user/user.service'

interface DemoSeedOptions {
  users: number
  nests: number
  withImages: boolean
  password: string
}

interface DemoUser {
  id: string
  index: number
}

interface DemoNest {
  slug: string
  topic: string
  ownerId: string
}

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Rowan',
  'Skyler', 'Reese', 'Emerson', 'Finley', 'Harper', 'Charlie', 'Dakota', 'Elliot', 'Hayden', 'Kendall',
  'Logan', 'Parker', 'Sage', 'Blake', 'Cameron', 'Drew', 'Frankie', 'Micah', 'Noor', 'Wren'
]

const LAST_NAMES = [
  'Chen', 'Patel', 'Garcia', 'Kim', 'Nguyen', 'Silva', 'Cohen', 'Novak', 'Andersson', 'Rossi',
  'Dubois', 'Mueller', 'Tanaka', 'Okafor', 'Larsen', 'Petrov', 'Haddad', 'Santos', 'Berg', 'Costa',
  'Farrell', 'Ivanov', 'Jansen', 'Kowalski', 'Lindgren', 'Mora', 'Nakamura', 'Osei', 'Pearce', 'Reyes'
]

const NEST_TOPICS = [
  'Game Devs', 'Home Baking', 'Urban Photography', 'Vintage Cars', 'Board Games', 'Cryptocurrency',
  'Woodworking', 'Houseplants', 'Rock Climbing', 'Sourdough Bakers', 'Vinyl Collecting', 'Freelance Writing',
  'Home Automation', 'Amateur Astronomy', 'Craft Beer', 'Bird Watching', 'Watch Collecting', 'Cold Brew Coffee',
  'Indie Films', '3D Printing', 'Trail Running', 'Home Renovation', 'Chess', 'Fantasy Football',
  'Mechanical Keyboards', 'Backyard Gardening', 'Street Art', 'Solo Travel', 'Language Learning', 'Analog Photography'
]

const THREAD_TITLE_TEMPLATES = [
  (topic: string) => `Best ${topic} tips for beginners?`,
  (topic: string) => `Just got into ${topic}, any advice?`,
  () => 'Show off your setup',
  () => "What's everyone working on this week?",
  () => 'Finally finished my latest project',
  (topic: string) => `Unpopular opinion about ${topic}`,
  (topic: string) => `Where do you find inspiration for ${topic}?`,
  (topic: string) => `Budget-friendly ${topic} recommendations?`,
  () => 'Anyone else struggling with getting started?',
  () => 'Weekly discussion thread'
]

const THREAD_CONTENT_TEMPLATES = [
  'Would love to hear what everyone thinks about this.',
  "Been at this for a few months now and wanted to share some thoughts.",
  'Curious what tools or approaches other people are using.',
  'Long time lurker, first time posting here.',
  "Not sure if this is the right place to ask, but here goes.",
  'Sharing this in case it helps someone else out.'
]

const COMMENT_TEMPLATES = [
  'Great post, thanks for sharing!',
  "I've had a similar experience.",
  'Not sure I agree, but interesting perspective.',
  'This is really helpful, appreciate it.',
  'Following this thread closely.',
  'Same here, glad it\'s not just me.',
  'Solid advice, wish I knew this earlier.'
]

const COLOR_PALETTE: [number, number, number][] = [
  [239, 68, 68], [249, 115, 22], [234, 179, 8], [34, 197, 94],
  [20, 184, 166], [59, 130, 246], [139, 92, 246], [236, 72, 153]
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)]
}

function pickN<T>(items: T[], n: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, items.length))
}

function pickNestConfig(): { visibility: NestVisibility, paywallAmountCents: number | null } {
  const roll = Math.random()
  if (roll < 0.7) return { visibility: NestVisibility.PUBLIC, paywallAmountCents: null }
  if (roll < 0.8) return { visibility: NestVisibility.PUBLIC, paywallAmountCents: randomInt(3, 20) * 100 }
  if (roll < 0.95) return { visibility: NestVisibility.PRIVATE, paywallAmountCents: null }
  return { visibility: NestVisibility.PRIVATE, paywallAmountCents: randomInt(5, 30) * 100 }
}

async function generatePlaceholderImage(rgb: [number, number, number], size: number): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } }
  }).png().toBuffer()
}

@Command({ name: 'demo-seed', description: 'Populate the database with a large volume of randomized demo data, with every user getting real activity' })
export class DemoSeedCommand extends CommandRunner {
  constructor(
    private readonly users: UserService,
    private readonly nests: NestService,
    private readonly nestMembers: NestMemberService,
    private readonly nestPaywall: NestPaywallService,
    private readonly threads: ThreadService,
    private readonly comments: CommentService,
    private readonly attachments: AttachmentService,
    private readonly nestsRepo: NestRepository,
    private readonly prisma: PrismaService
  ) {
    super()
  }

  @Option({ flags: '-u, --users [number]', description: 'Number of demo users to create (default 300)' })
  parseUsers(val: string): number {
    return Number.parseInt(val, 10)
  }

  @Option({ flags: '-n, --nests [number]', description: 'Number of demo nests to create (default 30)' })
  parseNests(val: string): number {
    return Number.parseInt(val, 10)
  }

  @Option({ flags: '-i, --with-images', description: 'Also generate per-user avatars and thread attachments (much slower, real storage usage)' })
  parseWithImages(): boolean {
    return true
  }

  @Option({ flags: '-p, --password [password]', description: 'Shared password for all demo accounts (default DemoPassword123!)' })
  parsePassword(val: string): string {
    return val
  }

  async run(_params: string[], options: Partial<DemoSeedOptions>) {
    const userCount = options.users ?? 300
    const nestCount = options.nests ?? 30
    const withImages = options.withImages ?? false
    const password = options.password ?? 'DemoPassword123!'

    console.log(`Seeding ${userCount} users and ${nestCount} nests (images: ${withImages ? 'on' : 'off'})...`)
    console.log(`Target: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`)

    const demoUsers = await this.seedUsers(userCount, password, withImages)
    const demoNests = await this.seedNestShells(nestCount, demoUsers, withImages)

    if (demoNests.length === 0) {
      console.log('No new nests were created (all target slugs already exist) — nothing to guarantee activity for. Increase --nests or use a fresh database.')
      return
    }

    const membersBySlug = await this.assignEveryUserToNests(demoNests, demoUsers)
    const threadsBySlug = await this.guaranteeEveryUserHasAThread(demoNests, membersBySlug, withImages)
    await this.guaranteeEveryUserHasAComment(demoNests, membersBySlug, threadsBySlug)
    await this.castVotes(demoNests, membersBySlug, threadsBySlug)

    console.log('Demo seed complete.')
    console.log(`Log in as any of: demo-user-0@example.com .. demo-user-${userCount - 1}@example.com`)
    console.log(`Password for all: ${password}`)
  }

  private async seedUsers(count: number, password: string, withImages: boolean): Promise<DemoUser[]> {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 })
    const result: DemoUser[] = []

    for (let i = 0; i < count; i++) {
      const email = `demo-user-${i}@example.com`
      const exists = await this.users.existsByEmail(email)

      if (exists) {
        const user = await this.users.getByEmail(email)
        result.push({ id: user.id, index: i })
        continue
      }

      const user = await this.users.create(email, passwordHash)
      await this.users.markEmailVerified(user.id)
      await this.users.updateProfile(user.id, { displayName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}` })

      if (withImages && i % 3 === 0) {
        try {
          await this.users.updateAvatar(user.id, await generatePlaceholderImage(pick(COLOR_PALETTE), 256))
        } catch (error) {
          console.warn(`Could not set avatar for ${email}:`, (error as Error).message)
        }
      }

      result.push({ id: user.id, index: i })

      if (i > 0 && i % 50 === 0) {
        console.log(`  ${i}/${count} users created`)
      }
    }

    console.log(`Seeded ${result.length} users.`)
    return result
  }

  private async seedNestShells(count: number, demoUsers: DemoUser[], withImages: boolean): Promise<DemoNest[]> {
    const records: DemoNest[] = []

    for (let i = 0; i < count; i++) {
      const topic = NEST_TOPICS[i % NEST_TOPICS.length]
      const suffix = i >= NEST_TOPICS.length ? ` ${Math.floor(i / NEST_TOPICS.length) + 1}` : ''
      const name = `${topic}${suffix}`
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const alreadyExists = await this.nestsRepo.slugExists(slug)
      if (alreadyExists) {
        console.log(`Nest "${slug}" already exists, skipping.`)
        continue
      }

      const { visibility, paywallAmountCents } = pickNestConfig()
      const owner = pick(demoUsers)

      await this.nests.create(owner.id, {
        name,
        slug,
        description: `A community for people into ${topic.toLowerCase()}.`,
        visibility,
        joinPolicy: NestJoinPolicy.OPEN
      })

      if (withImages) {
        try {
          await this.nests.updateIcon(slug, owner.id, await generatePlaceholderImage(pick(COLOR_PALETTE), 256))
        } catch (error) {
          console.warn(`Could not set icon for "${slug}":`, (error as Error).message)
        }
      }

      if (paywallAmountCents) {
        try {
          await this.nestPaywall.setPrice(slug, owner.id, { amountCents: paywallAmountCents })
        } catch (error) {
          console.warn(`Could not paywall "${slug}":`, (error as Error).message)
        }
      }

      records.push({ slug, topic, ownerId: owner.id })
    }

    console.log(`Seeded ${records.length} nests.`)
    return records
  }

  private async assignEveryUserToNests(demoNests: DemoNest[], demoUsers: DemoUser[]): Promise<Map<string, DemoUser[]>> {
    const membersBySlug = new Map<string, DemoUser[]>()
    for (const nest of demoNests) {
      const owner = demoUsers.find((u) => u.id === nest.ownerId)
      membersBySlug.set(nest.slug, owner ? [owner] : [])
    }

    for (const [i, user] of demoUsers.entries()) {
      const eligibleNests = demoNests.filter((n) => n.ownerId !== user.id)
      if (eligibleNests.length === 0) continue

      const chosen = pickN(eligibleNests, randomInt(1, Math.min(4, eligibleNests.length)))

      for (const nest of chosen) {
        try {
          await this.nestMembers.joinNest(nest.slug, user.id)
          membersBySlug.get(nest.slug)!.push(user)
        } catch (error) {
          console.warn(`Could not join user to "${nest.slug}":`, (error as Error).message)
        }
      }

      if (i > 0 && i % 50 === 0) {
        console.log(`  ${i}/${demoUsers.length} users assigned to nests`)
      }
    }

    return membersBySlug
  }

  private async guaranteeEveryUserHasAThread(
    demoNests: DemoNest[],
    membersBySlug: Map<string, DemoUser[]>,
    withImages: boolean
  ): Promise<Map<string, string[]>> {
    const threadsBySlug = new Map<string, string[]>()
    for (const nest of demoNests) threadsBySlug.set(nest.slug, [])

    const nestBySlug = new Map(demoNests.map((n) => [n.slug, n]))
    const allUsers = new Map<string, DemoUser>()
    for (const members of membersBySlug.values()) {
      for (const member of members) allUsers.set(member.id, member)
    }

    let processed = 0
    for (const user of allUsers.values()) {
      const userNestSlugs = demoNests.filter((n) => membersBySlug.get(n.slug)!.some((m) => m.id === user.id)).map((n) => n.slug)
      if (userNestSlugs.length === 0) continue

      const primarySlug = pick(userNestSlugs)
      const primaryNest = nestBySlug.get(primarySlug)!
      const threadSlug = await this.createThread(primaryNest, user.id, withImages)
      threadsBySlug.get(primarySlug)!.push(threadSlug)

      if (Math.random() < 0.3) {
        const extraSlug = pick(userNestSlugs)
        const extraNest = nestBySlug.get(extraSlug)!
        const extraThreadSlug = await this.createThread(extraNest, user.id, withImages)
        threadsBySlug.get(extraSlug)!.push(extraThreadSlug)
      }

      processed++
      if (processed % 50 === 0) {
        console.log(`  ${processed}/${allUsers.size} users have posted a thread`)
      }
    }

    return threadsBySlug
  }

  private async createThread(nest: DemoNest, authorId: string, withImages: boolean): Promise<string> {
    const title = pick(THREAD_TITLE_TEMPLATES)(nest.topic)
    const content = pick(THREAD_CONTENT_TEMPLATES)
    const attachments = withImages && Math.random() < 0.15 ? await this.buildAttachment(authorId) : []

    const thread = await this.threads.createThread(nest.slug, authorId, { title, content, attachments })

    const daysAgo = randomInt(0, 30)
    await this.prisma.thread.update({ where: { id: thread.id }, data: { createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) } })

    if (Math.random() < 0.05) {
      await this.threads.pinThread(nest.slug, thread.slug, nest.ownerId)
    } else if (Math.random() < 0.03) {
      await this.threads.lockThread(nest.slug, thread.slug, nest.ownerId)
    }

    return thread.slug
  }

  private async guaranteeEveryUserHasAComment(
    demoNests: DemoNest[],
    membersBySlug: Map<string, DemoUser[]>,
    threadsBySlug: Map<string, string[]>
  ) {
    const allUsers = new Map<string, DemoUser>()
    for (const members of membersBySlug.values()) {
      for (const member of members) allUsers.set(member.id, member)
    }

    let processed = 0
    for (const user of allUsers.values()) {
      const eligibleSlugs = demoNests
        .filter((n) => membersBySlug.get(n.slug)!.some((m) => m.id === user.id) && threadsBySlug.get(n.slug)!.length > 0)
        .map((n) => n.slug)

      if (eligibleSlugs.length === 0) continue

      const commentCount = randomInt(1, 3)
      for (let c = 0; c < commentCount; c++) {
        const nestSlug = pick(eligibleSlugs)
        const threadSlug = pick(threadsBySlug.get(nestSlug)!)
        try {
          await this.comments.createThreadCommentByThreadSlug(nestSlug, threadSlug, user.id, { content: pick(COMMENT_TEMPLATES) })
        } catch (error) {
          console.warn(`Could not post comment for user in "${nestSlug}":`, (error as Error).message)
        }
      }

      processed++
      if (processed % 50 === 0) {
        console.log(`  ${processed}/${allUsers.size} users have commented`)
      }
    }
  }

  private async castVotes(demoNests: DemoNest[], membersBySlug: Map<string, DemoUser[]>, threadsBySlug: Map<string, string[]>) {
    const allUsers = new Map<string, DemoUser>()
    for (const members of membersBySlug.values()) {
      for (const member of members) allUsers.set(member.id, member)
    }

    for (const user of allUsers.values()) {
      const eligibleSlugs = demoNests
        .filter((n) => membersBySlug.get(n.slug)!.some((m) => m.id === user.id) && threadsBySlug.get(n.slug)!.length > 0)
        .map((n) => n.slug)

      if (eligibleSlugs.length === 0) continue

      const voteCount = randomInt(1, 3)
      for (let v = 0; v < voteCount; v++) {
        const nestSlug = pick(eligibleSlugs)
        const threadSlug = pick(threadsBySlug.get(nestSlug)!)
        const type = Math.random() < 0.85 ? VoteType.UPVOTE : VoteType.DOWNVOTE
        try {
          await this.threads.voteOnThread(nestSlug, threadSlug, user.id, type)
        } catch {
          continue
        }
      }
    }
  }

  private async buildAttachment(authorId: string) {
    try {
      const buffer = await generatePlaceholderImage(pick(COLOR_PALETTE), 800)
      const attachment = await this.attachments.upload(authorId, buffer)
      return [attachment]
    } catch (error) {
      console.warn('Could not upload thread attachment:', (error as Error).message)
      return []
    }
  }
}
