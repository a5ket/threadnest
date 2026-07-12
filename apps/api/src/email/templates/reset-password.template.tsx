import { Heading, Text } from 'react-email'
import { ActionButton } from './components/action-button'
import { AuthEmailLayout } from './components/auth-email-layout'

interface Props {
  resetUrl: string
}

export function ResetPasswordTemplate({ resetUrl }: Props) {
  return (
    <AuthEmailLayout actionUrl={resetUrl}>
      <Heading style={{ fontSize: '20px', marginBottom: '16px' }}>Reset your password</Heading>
      <Text style={{ color: '#555', marginBottom: '24px' }}>
        Click the button below to reset your password. This link expires in 15 minutes.
      </Text>
      <ActionButton href={resetUrl} label="Reset password" />
    </AuthEmailLayout>
  )
}
