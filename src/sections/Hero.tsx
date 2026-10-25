import { Button } from '../components/Button'
import { Photo } from '../components/Photo'
import { hasWebGL } from '../lib/env'

export function Hero() {
  return (
    <>
      <section className="hero" id="top" aria-labelledby="hero-title">
        {!hasWebGL && (
          <Photo name="barbell-man" alt="An athlete stands beside a loaded barbell in a dark gym" className="hero__fallback" reveal={false} eager />
        )}
        {/* keeps the type legible over the lit set without boxing it in */}
        <div className="hero__scrim" aria-hidden />
        <div className="hero__inner wrap">
          <p className="hero__meta meta" data-intro>
            Club Seven Fitness &amp; Gym, Sultan Bathery and Dubai
          </p>
          {/* the line is the club's own, painted on its wall */}
          <h1 className="display hero__title" id="hero-title">
            <span className="line-mask">
              <span>Stronger</span>
            </span>
            <span className="line-mask">
              <span>than you</span>
            </span>
            <span className="line-mask">
              <span>walked in.</span>
            </span>
          </h1>
          <div className="hero__foot">
            <p className="lede" data-intro>
              Certified trainers write a plan around your goal and coach you through it, at our clubs in Wayanad
              and Al Quoz.
            </p>
            <div className="hero__ctas">
              <Button href="#membership" variant="amber" data-intro>
                Book your first session
              </Button>
              <Button href="#clubs" variant="ghost" data-intro>
                See the clubs
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* transparent runway: the camera rises off the bar while the reader scrolls */}
      <div className="bridge" aria-hidden />
    </>
  )
}
