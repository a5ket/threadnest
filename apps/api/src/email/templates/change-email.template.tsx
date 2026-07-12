import { Heading, Text } from 'react-email'
import { ActionButton } from './components/action-button'
import { AuthEmailLayout } from './components/auth-email-layout'

interface Props {
  changeEmailUrl: string
  newEmail: string
}

export function ChangeEmailTemplate({ changeEmailUrl, newEmail }: Props) {
  return (
    <AuthEmailLayout actionUrl={changeEmailUrl}>
      <Heading style={{ fontSize: '20px', marginBottom: '16px' }}>Confirm your new email</Heading>
      <Text style={{ color: '#555', marginBottom: '8px' }}>
        You requested to change your email address to <strong>{newEmail}</strong>.
      </Text>
      <Text style={{ color: '#555', marginBottom: '24px' }}>
        Click the button below to confirm. This link expires in 30 minutes.
      </Text>
      <ActionButton href={changeEmailUrl} label="Confirm new email" />
    </AuthEmailLayout>
  )
}
