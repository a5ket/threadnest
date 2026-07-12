import { Hr, Link, Text } from 'react-email'
import { EmailLayout } from './email-layout'

interface AuthEmailLayoutProps {
  children: React.ReactNode
  actionUrl: string
}

export function AuthEmailLayout({ children, actionUrl }: AuthEmailLayoutProps) {
  return (
    <EmailLayout>
      {children}
      <Hr style={{ margin: '24px 0', borderColor: '#eee' }} />
      <Text style={{ color: '#aaa', fontSize: '12px' }}>If you didn't request this, you can ignore this email.</Text>
      <Text style={{ color: '#aaa', fontSize: '11px', marginTop: '8px' }}>
        If the button doesn't work, copy and paste this link into your browser:{' '}
        <Link href={actionUrl} style={{ color: '#aaa', wordBreak: 'break-all' }}>{actionUrl}</Link>
      </Text>
    </EmailLayout>
  )
}
