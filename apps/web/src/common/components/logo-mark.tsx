interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 24, className = '' }: LogoMarkProps) {
  return (
    <svg viewBox='0 0 100 100' fill='none' width={size} height={size} className={`text-primary ${className}`}>
      <polygon points='50,8 86.4,29 86.4,71 50,92 13.6,71 13.6,29' stroke='currentColor' strokeWidth={5} strokeLinejoin='round' />
      <path d='M40 34 H68 A8 8 0 0 1 76 42 V54 A8 8 0 0 1 68 62 H50 L40 72 V62 H40 A8 8 0 0 1 32 54 V42 A8 8 0 0 1 40 34 Z' stroke='currentColor' strokeWidth={4.5} strokeLinejoin='round' strokeLinecap='round' />
      <rect x={41} y={42.5} width={28} height={4.5} rx={2.25} fill='currentColor' />
      <rect x={41} y={50.5} width={28} height={4.5} rx={2.25} fill='currentColor' />
    </svg>
  )
}
