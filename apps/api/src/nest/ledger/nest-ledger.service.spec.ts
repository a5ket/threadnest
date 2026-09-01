import { NestLedgerService } from './nest-ledger.service'

describe('NestLedgerService', () => {
  const ledgerRepo = { recordCharge: jest.fn(), recordWithdrawal: jest.fn() }
  const nestsRepo = { adjustBalanceCents: jest.fn() }

  const service = new NestLedgerService(ledgerRepo as any, nestsRepo as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('creditCharge', () => {
    it('adjusts the nest balance when the charge is newly recorded', async () => {
      ledgerRepo.recordCharge.mockResolvedValue(true)

      await service.creditCharge('nest-1', 500, 'invoice-1')

      expect(ledgerRepo.recordCharge).toHaveBeenCalledWith('nest-1', 500, 'invoice-1')
      expect(nestsRepo.adjustBalanceCents).toHaveBeenCalledWith('nest-1', 500)
    })

    it('does not adjust the balance again for an already-recorded charge', async () => {
      ledgerRepo.recordCharge.mockResolvedValue(false)

      await service.creditCharge('nest-1', 500, 'invoice-1')

      expect(nestsRepo.adjustBalanceCents).not.toHaveBeenCalled()
    })
  })

  describe('debitWithdrawal', () => {
    it('decrements the nest balance when the withdrawal is newly recorded', async () => {
      ledgerRepo.recordWithdrawal.mockResolvedValue(true)

      await service.debitWithdrawal('nest-1', 500, 'tr-1')

      expect(ledgerRepo.recordWithdrawal).toHaveBeenCalledWith('nest-1', 500, 'tr-1')
      expect(nestsRepo.adjustBalanceCents).toHaveBeenCalledWith('nest-1', -500)
    })

    it('does not adjust the balance again for an already-recorded withdrawal', async () => {
      ledgerRepo.recordWithdrawal.mockResolvedValue(false)

      await service.debitWithdrawal('nest-1', 500, 'tr-1')

      expect(nestsRepo.adjustBalanceCents).not.toHaveBeenCalled()
    })
  })
})
