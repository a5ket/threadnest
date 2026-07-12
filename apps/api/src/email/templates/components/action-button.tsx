import { Button } from 'react-email'

interface ActionButtonProps {
  href: string
  label: string
}

export function ActionButton({ href, label }: ActionButtonProps) {
  return (
    <Button href={href} style={{ backgroundColor: '#000', color: '#fff', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none' }}>
      {label}
    </Button>
  )
}
