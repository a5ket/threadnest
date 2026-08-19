import { TransactionManager } from 'src/prisma/transaction-manager'

export const createMockTransactionManager = (): jest.Mocked<Pick<TransactionManager, 'run'>> => ({
  run: jest.fn((callback: (tx: any) => Promise<any>) => callback({} as any)),
})
