import { EmailService } from 'src/email/email.service'

export const createMockEmailService = (): jest.Mocked<Pick<EmailService, 'sendVerificationEmail' | 'sendPasswordResetEmail' | 'sendEmailChangeEmail'>> => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailChangeEmail: jest.fn(),
})
