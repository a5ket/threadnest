import { Heading, Text } from 'react-email'
import { ActionButton } from './components/action-button'
import { AuthEmailLayout } from './components/auth-email-layout'

interface Props {
  verifyUrl: string
}

export function VerifyEmailTemplate({ verifyUrl }: Props) {
  return (
    <AuthEmailLayout actionUrl={verifyUrl}>
      <Heading style={{ fontSize: '20px', marginBottom: '16px' }}>Verify your email</Heading>
      <Text style={{ color: '#555', marginBottom: '24px' }}>
        Click the button below to verify your email address. This link expires in 24 hours.
      </Text>
      <ActionButton href={verifyUrl} label="Verify email" />
    </AuthEmailLayout>
  )
}
