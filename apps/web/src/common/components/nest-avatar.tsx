const PALETTE = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

function paletteClassFor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

interface NestAvatarProps {
  name: string
  slug: string
  iconUrl?: string | null
  size?: number
  className?: string
}

export function NestAvatar({ name, slug, iconUrl, size = 32, className = '' }: NestAvatarProps) {
  if (iconUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={iconUrl}
        alt=''
        style={{ width: size, height: size }}
        className={`inline-block shrink-0 rounded-md object-cover ${className}`}
      />
    )
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.45 }}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold text-white ${paletteClassFor(slug)} ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
