import { lazy, Suspense, useCallback, useEffect, useLayoutEffect } from 'react'
import { Cursor } from './components/Cursor'
import { Loader } from './components/Loader'
import { Nav } from './components/Nav'
import { useStageOn } from './lib/env'
import { initChoreography, playIntro } from './motion/choreography'
import { initSmoothScroll, scrollToTarget, ScrollTrigger } from './motion/scroll'
import { Clubs } from './sections/Clubs'
import { Coaches } from './sections/Coaches'
import { Finale } from './sections/Finale'
import { Hero } from './sections/Hero'
import { Membership } from './sections/Membership'
import { Philosophy } from './sections/Philosophy'
import { Programs } from './sections/Programs'
import './styles/sections.css'

const Stage = lazy(() => import('./scene/Stage'))

export default function App() {
  const stageOn = useStageOn()
  useLayoutEffect(() => initChoreography(), [])
  useEffect(() => initSmoothScroll(), [])

  useEffect(() => {
    // late layout shifts (fonts, lazy images) move trigger positions
    const refresh = () => ScrollTrigger.refresh()
    document.fonts.ready.then(refresh)
    window.addEventListener('load', refresh)
    // any remaining in-page anchors go through the scroller
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="#"]')
      if (!a || e.defaultPrevented) return
      e.preventDefault()
      scrollToTarget(a.getAttribute('href')!)
    }
    document.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('load', refresh)
      document.removeEventListener('click', onClick)
    }
  }, [])

  const onLoaded = useCallback(() => {
    playIntro()
  }, [])

  return (
    <>
      <a className="skip-link" href="#philosophy">
        Skip to content
      </a>
      <Loader onDone={onLoaded} />
      {stageOn && (
        <div className="stage" aria-hidden>
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
        </div>
      )}
      {/* the club's sand walls rise over the set through the middle of the page */}
      <div className="veil" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <Philosophy />
        <Programs />
        <Clubs />
        <Coaches />
        <Membership />
        <Finale />
      </main>
      <Cursor />
    </>
  )
}
