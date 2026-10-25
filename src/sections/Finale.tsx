import { Button } from '../components/Button'
import { Lines } from '../components/Lines'
import { Photo } from '../components/Photo'
import { useStageOn } from '../lib/env'

export function Finale() {
  const stageOn = useStageOn()
  return (
    <>
      <section className="finale" aria-labelledby="finale-title">
        {!stageOn &&<Photo name="barbell-bw" alt="A loaded barbell resting on the gym floor" className="finale__fallback" reveal={false} />}
        <div className="finale__scrim" aria-hidden />
        <div className="finale__sticky wrap">
          <p className="meta" data-reveal="fade">
            Sultan Bathery and Al Quoz, Dubai
          </p>
          <Lines id="finale-title" className="h-xl finale__title" lines={['See you', 'on the floor.']} />
          <div className="finale__cta" data-reveal="fade">
            <Button href="#membership" variant="amber">Book your first session</Button>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap grid footer__grid">
          <div className="footer__brand">
            <img src="/c7-mark.png" alt="Club 7" width="92" height="60" />
            <p className="meta">Club Seven Fitness &amp; Gym, since 2022</p>
          </div>
          <div className="footer__col">
            <p className="meta">Wayanad</p>
            <address>
              AE Tower, Sultan Bathery
              <br />
              Wayanad, Kerala
              <br />
              <a href="tel:+919207556622">+91 9207 55 66 22</a>
            </address>
          </div>
          <div className="footer__col">
            <p className="meta">Dubai</p>
            <address>
              Al Quoz Mall
              <br />
              Dubai, UAE
              <br />
              <a href="tel:+971525315875">+971 52 53 15875</a>
            </address>
          </div>
          <div className="footer__col">
            <p className="meta">Contact</p>
            <p>
              <a className="text-link" href="mailto:info@c7clubseven.com">info@c7clubseven.com</a>
              <br />
              <a href="https://www.instagram.com/c7_clubseven/" target="_blank" rel="noreferrer">Instagram</a>
              <br />
              <a href="https://www.facebook.com/c7club/" target="_blank" rel="noreferrer">Facebook</a>
              {/* [NEED: opening hours] until then, the clubs answer it by phone */}
            </p>
          </div>
        </div>
        <div className="wrap footer__base">
          <p className="meta">© {new Date().getFullYear()} Club Seven Fitness &amp; Gym</p>
          <p className="meta footer__credits">
            Club photography from Club 7. Fallback photography from Unsplash. Lighting and materials from Poly Haven (CC0).
          </p>
        </div>
      </footer>
    </>
  )
}
