import { NestMemberRepository } from 'src/nest/member/nest-member.repository'

export const createMockNestMemberRepository = (): jest.Mocked<Pick<NestMemberRepository, 'findByUser' | 'getByUser' | 'exists' | 'countByRole' | 'listByNestId' | 'deleteByUserId' | 'deleteIfExistsByUserId' | 'updateRole' | 'listMembershipsByUser' | 'listMembershipReferencesByUser' | 'createMember' | 'createOwner'>> => ({
  findByUser: jest.fn(),
  getByUser: jest.fn(),
  exists: jest.fn(),
  countByRole: jest.fn(),
  listByNestId: jest.fn(),
  deleteByUserId: jest.fn(),
  deleteIfExistsByUserId: jest.fn().mockResolvedValue({ count: 0 }),
  updateRole: jest.fn(),
  listMembershipsByUser: jest.fn(),
  listMembershipReferencesByUser: jest.fn(),
  createMember: jest.fn(),
  createOwner: jest.fn(),
})
