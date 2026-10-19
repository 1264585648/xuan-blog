import type { SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
  strokeWidth?: number
}

function BaseIcon({
  size = 16,
  strokeWidth = 1.75,
  children,
  className = '',
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`svg-icon ${className}`.trim()}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const ArrowUpRight = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </BaseIcon>
)

export const ArrowLeft = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </BaseIcon>
)

export const BookOpen = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </BaseIcon>
)

export const BriefcaseBusiness = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect width="20" height="14" x="2" y="7" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M12 12h.01" />
    <path d="M2 12h20" />
  </BaseIcon>
)

export const CalendarDays = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
    <path d="M8 14h.01" />
    <path d="M12 14h.01" />
    <path d="M16 14h.01" />
    <path d="M8 18h.01" />
    <path d="M12 18h.01" />
  </BaseIcon>
)

export const ChevronRight = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m9 18 6-6-6-6" />
  </BaseIcon>
)

export const Code2 = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m18 16 4-4-4-4" />
    <path d="m6 8-4 4 4 4" />
    <path d="m14.5 4-5 16" />
  </BaseIcon>
)

export const Compass = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </BaseIcon>
)

export const GitBranch = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </BaseIcon>
)

export const Hash = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </BaseIcon>
)

export const Layers3 = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 12.5-8.97 4.08a2 2 0 0 1-1.66 0L2 12.5" />
    <path d="m22 17.5-8.97 4.08a2 2 0 0 1-1.66 0L2 17.5" />
  </BaseIcon>
)

export const Leaf = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </BaseIcon>
)

export const Sprout = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M7 20h10" />
    <path d="M10 20c5.5-2.5.8-6.4 3-10" />
    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
  </BaseIcon>
)

export const AtSign = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
  </BaseIcon>
)

export const Mail = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </BaseIcon>
)

export const Menu = (props: IconProps) => (
  <BaseIcon {...props}>
    <line x1="4" x2="20" y1="7" y2="7" />
    <line x1="4" x2="20" y1="12" y2="12" />
    <line x1="4" x2="15" y1="17" y2="17" />
  </BaseIcon>
)

export const Moon = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </BaseIcon>
)

export const Palette = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </BaseIcon>
)

export const PenLine = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </BaseIcon>
)

export const Rss = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M4 11a9 9 0 0 1 9 9" />
    <path d="M4 4a16 16 0 0 1 16 16" />
    <circle cx="5" cy="19" r="1" fill="currentColor" />
  </BaseIcon>
)

export const Search = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </BaseIcon>
)

export const Sparkles = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
  </BaseIcon>
)

export const Sun = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </BaseIcon>
)

export const X = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </BaseIcon>
)

export const Clock = (props: IconProps) => (
  <BaseIcon {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </BaseIcon>
)

export const LayoutList = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
    <path d="M14 4h7" />
    <path d="M14 9h7" />
    <path d="M14 15h7" />
    <path d="M14 20h7" />
  </BaseIcon>
)

export const Rows3 = (props: IconProps) => (
  <BaseIcon {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M21 9H3" />
    <path d="M21 15H3" />
  </BaseIcon>
)

export const Star = (props: IconProps) => (
  <BaseIcon {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </BaseIcon>
)

export const Check = (props: IconProps) => (
  <BaseIcon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </BaseIcon>
)
