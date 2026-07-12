import { Body, Container, Head, Html } from 'react-email'

interface EmailLayoutProps {
  children: React.ReactNode
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f9f9f9', padding: '24px' }}>
        <Container style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '32px', maxWidth: '480px' }}>
          {children}
        </Container>
      </Body>
    </Html>
  )
}
