import { NestMemberService } from 'src/nest/member/nest-member.service'

export const createMockNestMemberService = (): jest.Mocked<Pick<NestMemberService, 'listMembershipReferencesByUser'>> => ({
  listMembershipReferencesByUser: jest.fn(),
})
