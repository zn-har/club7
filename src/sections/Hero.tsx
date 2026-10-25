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
        <div className="hero__inner wrap">
          <div className="hero__meta meta" data-intro>
            <span className="hero__index">01</span>
            <span className="hero__meta-rule" aria-hidden />
            <span>Strength &amp; fitness</span>
            <span className="hero__meta-place">Wayanad / Dubai</span>
          </div>
          <h1 className="display h-xl hero__title" id="hero-title">
            <span className="line-mask">
              <span>Pick it</span>
            </span>
            <span className="line-mask">
              <span className="hero__accent">up.</span>
            </span>
          </h1>
          <div className="hero__foot">
            <p className="lede" data-intro>
              Club 7 is a strength and fitness gym in Wayanad and Dubai. Certified trainers write your plan. You
              do the lifting.
            </p>
            <div className="hero__ctas">
              <Button href="#membership" variant="red" data-intro>
                Book your first session
              </Button>
              <Button href="#floor" variant="ghost" data-intro>
                See the floor
              </Button>
            </div>
          </div>
        </div>
        <div className="hero__scroll" data-intro aria-hidden>
          <span className="hero__scroll-line" />
        </div>
      </section>
      {/* transparent runway: the camera rises off the bar while the reader scrolls */}
      <div className="bridge" aria-hidden />
    </>
  )
}
