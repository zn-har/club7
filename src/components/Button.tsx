import type { MouseEvent, ReactNode } from 'react'
import { scrollToTarget } from '../motion/scroll'

/** Anchor-styled CTA. In-page hrefs route through the smooth scroller. */
export function Button({
  href,
  children,
  variant = 'solid',
  ...rest
}: {
  href: string
  children: ReactNode
  variant?: 'solid' | 'ghost' | 'amber' | 'ink'
  'data-intro'?: boolean
}) {
  const onClick = (e: MouseEvent) => {
    if (!href.startsWith('#')) return
    e.preventDefault()
    scrollToTarget(href)
  }
  return (
    <a className={`btn btn--${variant}`} href={href} onClick={onClick} {...rest}>
      {children}
    </a>
  )
}
