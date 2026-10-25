type PhotoProps = {
  name: string
  alt: string
  className?: string
  warm?: boolean
  parallax?: number
  reveal?: boolean
  /** object-position for art-directed crops */
  focal?: string
  eager?: boolean
}

/** Graded photograph with responsive source, optional mask reveal and in-frame parallax. */
export function Photo({ name, alt, className = '', warm, parallax, reveal = true, focal, eager }: PhotoProps) {
  return (
    <div
      className={`photo ${warm ? 'warm' : ''} ${className}`}
      data-reveal={reveal ? 'photo' : undefined}
      data-parallax={parallax}
    >
      <img
        src={`/img/${name}.webp`}
        srcSet={`/img/${name}-sm.webp 900w, /img/${name}.webp 2000w`}
        sizes="(max-width: 820px) 100vw, 60vw"
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={focal ? { objectPosition: focal } : undefined}
      />
    </div>
  )
}
