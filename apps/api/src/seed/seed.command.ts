import * as argon2 from 'argon2'
import { NestJoinPolicy, NestVisibility, VoteType } from 'generated/prisma/enums'
import { Command, CommandRunner } from 'nest-commander'
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

interface SeedUser {
  id: string
  email: string
}

interface NestSpec {
  slug: string
  name: string
  description: string
  visibility: NestVisibility
  joinPolicy: NestJoinPolicy
  ownerIndex: number
  memberIndexes: number[]
  paywallAmountCents?: number
  threads: ThreadSpec[]
}

interface ThreadSpec {
  authorIndex: number
  title: string
  content: string
  daysAgo: number
  pinned?: boolean
  locked?: boolean
  withAttachment?: boolean
  comments: { authorIndex: number, content: string }[]
  upvoterIndexes: number[]
  downvoterIndexes: number[]
}

const USER_NAMES = ['alice', 'bob', 'carol', 'dave', 'erin', 'frank']
const SEED_PASSWORD = 'SeedPassword123!'

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

const NEST_SPECS: NestSpec[] = [
  {
    slug: 'game-devs',
    name: 'Game Devs',
    description: 'For people building games, big or small.',
    visibility: NestVisibility.PUBLIC,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 0,
    memberIndexes: [1, 2, 3],
    threads: [
      {
        authorIndex: 0,
        title: 'What engine are you using in 2026?',
        content: 'Curious what everyone has settled on lately. Still torn between two options for my next project.',
        daysAgo: 6,
        pinned: true,
        withAttachment: true,
        comments: [
          { authorIndex: 1, content: 'Been happy with mine so far, tooling has gotten a lot better.' },
          { authorIndex: 2, content: 'Depends a lot on the genre honestly.' }
        ],
        upvoterIndexes: [1, 2, 3],
        downvoterIndexes: []
      },
      {
        authorIndex: 1,
        title: 'Shipped my first solo project after 2 years',
        content: 'Small puzzle game, nothing fancy, but it\'s out and that feels great.',
        daysAgo: 3,
        comments: [
          { authorIndex: 0, content: 'Congrats! That first release is always the hardest one.' }
        ],
        upvoterIndexes: [0, 2],
        downvoterIndexes: []
      },
      {
        authorIndex: 2,
        title: 'Anyone else struggle with scope creep?',
        content: 'Every prototype turns into a 6-month project somehow.',
        daysAgo: 1,
        comments: [],
        upvoterIndexes: [0],
        downvoterIndexes: [3]
      },
      {
        authorIndex: 3,
        title: 'Old thread about a jam we ran',
        content: 'Locking this now that the jam is long over, keeping it up for reference.',
        daysAgo: 12,
        locked: true,
        comments: [],
        upvoterIndexes: [],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'book-club',
    name: 'Book Club',
    description: 'Monthly picks and general reading chat.',
    visibility: NestVisibility.PUBLIC,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 1,
    memberIndexes: [0, 2, 4],
    threads: [
      {
        authorIndex: 1,
        title: 'March pick: nominations open',
        content: 'Drop your suggestions below, we\'ll vote at the end of the week.',
        daysAgo: 4,
        pinned: true,
        comments: [
          { authorIndex: 0, content: 'Would love something shorter this time around.' },
          { authorIndex: 4, content: 'Seconding that.' }
        ],
        upvoterIndexes: [0, 4],
        downvoterIndexes: []
      },
      {
        authorIndex: 0,
        title: 'Finished last month\'s book, thoughts inside',
        content: 'The ending really didn\'t land for me but the middle third was excellent.',
        daysAgo: 2,
        comments: [
          { authorIndex: 1, content: 'Agreed on the ending, felt rushed.' }
        ],
        upvoterIndexes: [1, 2],
        downvoterIndexes: []
      },
      {
        authorIndex: 4,
        title: 'Looking for recommendations similar to last quarter\'s pick',
        content: 'That one really stuck with me, want more like it.',
        daysAgo: 0,
        comments: [],
        upvoterIndexes: [],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'photography-corner',
    name: 'Photography Corner',
    description: 'Share your shots, gear talk welcome.',
    visibility: NestVisibility.PUBLIC,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 2,
    memberIndexes: [3, 4, 5],
    threads: [
      {
        authorIndex: 2,
        title: 'Golden hour shots from this weekend',
        content: 'Finally had good weather for once, here\'s what I got.',
        daysAgo: 5,
        withAttachment: true,
        comments: [
          { authorIndex: 5, content: 'The light in the third one is incredible.' }
        ],
        upvoterIndexes: [3, 4, 5],
        downvoterIndexes: []
      },
      {
        authorIndex: 3,
        title: 'Is a full-frame upgrade worth it for landscapes?',
        content: 'Been going back and forth on this for months.',
        daysAgo: 3,
        comments: [
          { authorIndex: 2, content: 'For landscapes specifically, probably not as much as you\'d think.' },
          { authorIndex: 5, content: 'Depends on how big you print.' }
        ],
        upvoterIndexes: [2],
        downvoterIndexes: []
      },
      {
        authorIndex: 5,
        title: 'Beginner here, tips for shooting in low light?',
        content: 'Everything I take indoors comes out grainy or blurry.',
        daysAgo: 1,
        comments: [],
        upvoterIndexes: [2, 3],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'indie-hackers',
    name: 'Indie Hackers',
    description: 'Building small products, sharing what works.',
    visibility: NestVisibility.PUBLIC,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 3,
    memberIndexes: [0, 5],
    threads: [
      {
        authorIndex: 3,
        title: 'First paying customer today',
        content: 'Small milestone but a real one, wanted to share somewhere that would get it.',
        daysAgo: 7,
        comments: [
          { authorIndex: 0, content: 'That first one is the one that matters most, congrats.' }
        ],
        upvoterIndexes: [0, 5],
        downvoterIndexes: []
      },
      {
        authorIndex: 5,
        title: 'How do you handle support as a solo founder?',
        content: 'Starting to eat into actual building time.',
        daysAgo: 2,
        comments: [],
        upvoterIndexes: [3],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'the-vault',
    name: 'The Vault',
    description: 'Private space for close friends.',
    visibility: NestVisibility.PRIVATE,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 4,
    memberIndexes: [1, 5],
    threads: [
      {
        authorIndex: 4,
        title: 'Welcome to the vault',
        content: 'Just getting this set up, invite whoever you trust.',
        daysAgo: 5,
        comments: [
          { authorIndex: 1, content: 'Nice, finally somewhere to actually talk.' }
        ],
        upvoterIndexes: [1, 5],
        downvoterIndexes: []
      },
      {
        authorIndex: 1,
        title: 'Plans for the weekend?',
        content: 'Thinking of getting everyone together, who\'s around?',
        daysAgo: 2,
        comments: [
          { authorIndex: 5, content: 'I\'m in, just tell me when.' }
        ],
        upvoterIndexes: [4],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'late-night-crew',
    name: 'Late Night Crew',
    description: 'For the people still awake at 3am.',
    visibility: NestVisibility.PRIVATE,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 5,
    memberIndexes: [0, 2],
    threads: [
      {
        authorIndex: 5,
        title: 'Anyone else up right now',
        content: 'Can\'t sleep, might as well be productive.',
        daysAgo: 1,
        comments: [
          { authorIndex: 0, content: 'Same, third night in a row.' },
          { authorIndex: 2, content: 'This is a problem for future us.' }
        ],
        upvoterIndexes: [0, 2],
        downvoterIndexes: []
      },
      {
        authorIndex: 0,
        title: 'Recommend something to half-watch while working',
        content: 'Nothing that needs full attention.',
        daysAgo: 0,
        comments: [],
        upvoterIndexes: [],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'pro-trading-signals',
    name: 'Pro Trading Signals',
    description: 'Daily market breakdowns for subscribers.',
    visibility: NestVisibility.PUBLIC,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 0,
    memberIndexes: [3, 4],
    paywallAmountCents: 999,
    threads: [
      {
        authorIndex: 0,
        title: 'This week\'s outlook',
        content: 'Full breakdown for subscribers, quick summary here for everyone else.',
        daysAgo: 2,
        comments: [
          { authorIndex: 3, content: 'Appreciate the consistency on these.' }
        ],
        upvoterIndexes: [3, 4],
        downvoterIndexes: []
      },
      {
        authorIndex: 0,
        title: 'Q&A thread, ask anything',
        content: 'Will answer what I can throughout the week.',
        daysAgo: 0,
        comments: [],
        upvoterIndexes: [4],
        downvoterIndexes: []
      }
    ]
  },
  {
    slug: 'founders-circle',
    name: 'Founders Circle',
    description: 'Private, paid space for founders who\'ve shipped something.',
    visibility: NestVisibility.PRIVATE,
    joinPolicy: NestJoinPolicy.OPEN,
    ownerIndex: 1,
    memberIndexes: [5],
    paywallAmountCents: 1999,
    threads: [
      {
        authorIndex: 1,
        title: 'Welcome, introduce yourself',
        content: 'Who you are and what you\'re building.',
        daysAgo: 3,
        comments: [
          { authorIndex: 5, content: 'Glad to be here, been wanting something like this.' }
        ],
        upvoterIndexes: [5],
        downvoterIndexes: []
      }
    ]
  }
]

/**
 * @param rgb - The fill color.
 * @param size - The output's width and height, in pixels (always square).
 * @returns A solid-color PNG, for demo avatars/icons/attachments without needing real image assets.
 */
async function generatePlaceholderImage(rgb: [number, number, number], size: number): Promise<Buffer> {
  return sharp({
    create: { width: size, height: size, channels: 3, background: { r: rgb[0], g: rgb[1], b: rgb[2] } }
  }).png().toBuffer()
}

/**
 * CLI: `seed` — populates the database with a small, handcrafted set of realistic users, nests,
 * threads, and comments (defined in {@link NEST_SPECS}), for local development rather than
 * demoing at scale (see {@link DemoSeedCommand} for that). Writes go through the app's normal
 * services, not raw SQL, so seeded data passes the same validation/events as a real user action.
 * Idempotent per-entity: re-running against the same database skips users/nests that already
 * exist rather than erroring or duplicating. Run via the app's CLI entry point, not over HTTP.
 */
@Command({ name: 'seed', description: 'Populate the database with sample users, nests, threads, and comments for local testing' })
export class SeedCommand extends CommandRunner {
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

  async run() {
    const seedUsers = await this.seedUsers()

    for (const spec of NEST_SPECS) {
      await this.seedNest(spec, seedUsers)
    }

    console.log('Seed complete.')
    console.log(`Log in as any of: ${seedUsers.map((u) => u.email).join(', ')}`)
    console.log(`Password for all: ${SEED_PASSWORD}`)
  }

  private async seedUsers(): Promise<SeedUser[]> {
    const passwordHash = await argon2.hash(SEED_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    })

    const result: SeedUser[] = []

    for (const [index, name] of USER_NAMES.entries()) {
      const email = `seed-${name}@example.com`
      const exists = await this.users.existsByEmail(email)

      if (exists) {
        const user = await this.users.getByEmail(email)
        result.push({ id: user.id, email })
        continue
      }

      const user = await this.users.create(email, passwordHash)
      await this.users.markEmailVerified(user.id)
      await this.setAvatar(user.id, COLOR_PALETTE[index % COLOR_PALETTE.length])
      result.push({ id: user.id, email })
    }

    return result
  }

  private async seedNest(spec: NestSpec, seedUsers: SeedUser[], nestIndex: number = NEST_SPECS.indexOf(spec)) {
    const owner = seedUsers[spec.ownerIndex]
    const alreadyExists = await this.nestsRepo.slugExists(spec.slug)

    if (alreadyExists) {
      console.log(`Nest "${spec.slug}" already exists, skipping.`)
      return
    }

    await this.nests.create(owner.id, {
      name: spec.name,
      slug: spec.slug,
      description: spec.description,
      visibility: spec.visibility,
      joinPolicy: spec.joinPolicy
    })

    await this.setNestIcon(spec.slug, owner.id, COLOR_PALETTE[nestIndex % COLOR_PALETTE.length])

    if (spec.paywallAmountCents) {
      try {
        await this.nestPaywall.setPrice(spec.slug, owner.id, { amountCents: spec.paywallAmountCents })
      } catch (error) {
        console.warn(`Could not paywall "${spec.slug}" (Stripe unavailable?):`, (error as Error).message)
      }
    }

    for (const memberIndex of spec.memberIndexes) {
      await this.nestMembers.joinNest(spec.slug, seedUsers[memberIndex].id)
    }

    for (const threadSpec of spec.threads) {
      await this.seedThread(spec.slug, threadSpec, seedUsers, owner.id)
    }

    console.log(`Seeded nest "${spec.slug}" with ${spec.threads.length} threads.`)
  }

  private async seedThread(nestSlug: string, spec: ThreadSpec, seedUsers: SeedUser[], ownerId: string) {
    const author = seedUsers[spec.authorIndex]
    const attachments = spec.withAttachment ? await this.buildAttachment(author.id) : []

    const thread = await this.threads.createThread(nestSlug, author.id, {
      title: spec.title,
      content: spec.content,
      attachments
    })

    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000)
    await this.prisma.thread.update({ where: { id: thread.id }, data: { createdAt } })

    for (const commentSpec of spec.comments) {
      await this.comments.createThreadCommentByThreadSlug(nestSlug, thread.slug, seedUsers[commentSpec.authorIndex].id, {
        content: commentSpec.content
      })
    }

    for (const voterIndex of spec.upvoterIndexes) {
      await this.threads.voteOnThread(nestSlug, thread.slug, seedUsers[voterIndex].id, VoteType.UPVOTE)
    }

    for (const voterIndex of spec.downvoterIndexes) {
      await this.threads.voteOnThread(nestSlug, thread.slug, seedUsers[voterIndex].id, VoteType.DOWNVOTE)
    }

    if (spec.pinned) {
      await this.threads.pinThread(nestSlug, thread.slug, ownerId)
    }

    if (spec.locked) {
      await this.threads.lockThread(nestSlug, thread.slug, ownerId)
    }
  }

  private async buildAttachment(authorId: string) {
    try {
      const color = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]
      const buffer = await generatePlaceholderImage(color, 800)
      const attachment = await this.attachments.upload(authorId, buffer)
      return [attachment]
    } catch (error) {
      console.warn('Could not upload thread attachment (storage unavailable?):', (error as Error).message)
      return []
    }
  }

  private async setAvatar(userId: string, color: [number, number, number]) {
    try {
      const buffer = await generatePlaceholderImage(color, 256)
      await this.users.updateAvatar(userId, buffer)
    } catch (error) {
      console.warn('Could not set avatar (storage unavailable?):', (error as Error).message)
    }
  }

  private async setNestIcon(nestSlug: string, ownerId: string, color: [number, number, number]) {
    try {
      const buffer = await generatePlaceholderImage(color, 256)
      await this.nests.updateIcon(nestSlug, ownerId, buffer)
    } catch (error) {
      console.warn(`Could not set icon for "${nestSlug}" (storage unavailable?):`, (error as Error).message)
    }
  }
}
