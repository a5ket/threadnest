interface AvatarProps {
  avatarUrl: string | null
  label: string
  size?: number
  className?: string
}

export function Avatar({ avatarUrl, label, size = 40, className = '' }: AvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=''
        style={{ width: size, height: size }}
        className={`inline-block rounded-full object-cover ${className}`}
      />
    )
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ${className}`}
    >
      {label.charAt(0).toUpperCase()}
    </span>
  )
}
