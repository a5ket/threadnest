import { NestMemberRepository } from 'src/nest/member/nest-member.repository'

export const createMockNestMemberRepository = (): jest.Mocked<Pick<NestMemberRepository, 'findByUser' | 'getByUser' | 'exists' | 'countByRole'>> => ({
  findByUser: jest.fn(),
  getByUser: jest.fn(),
  exists: jest.fn(),
  countByRole: jest.fn(),
})
