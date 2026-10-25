import type { ReactNode } from 'react'

/** A display heading split into masked lines for the rise reveal. */
export function Lines({
  as: Tag = 'h2',
  lines,
  className = '',
  reveal = true,
  id,
}: {
  as?: 'h1' | 'h2' | 'h3' | 'p'
  lines: ReactNode[]
  className?: string
  reveal?: boolean
  id?: string
}) {
  return (
    <Tag className={`display ${className}`} data-reveal={reveal ? 'lines' : undefined} id={id}>
      {lines.map((line, i) => (
        <span className="line-mask" key={i}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  )
}
