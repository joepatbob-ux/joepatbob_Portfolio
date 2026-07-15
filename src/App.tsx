import './vite-font.css'
import '@/styles/globals.css'
import '@/styles/deck.css'
import dynamic from '@/lib/dynamic'
import { CaseStudy } from '@/components/CaseStudy'
import { ChapterNavProvider } from '@/components/ChapterNavProvider'
import { NavSentenceLayoutProvider } from '@/components/NavSentenceLayoutProvider'
import { ContentDebugProvider } from '@/components/ContentDebugProvider'
import { DevPanels } from '@/components/DevPanels'
import { DeckController } from '@/components/DeckController'
import { Hero } from '@/components/Hero'
import { PortfolioInterlude } from '@/components/PortfolioInterlude'
import { PortfolioOutro } from '@/components/PortfolioOutro'
import { SidebarNav } from '@/components/SidebarNav'
import { StickerProvider } from '@/components/StickerProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { hardware } from '@/lib/sections/hardware'
import { startIdlePrefetch } from '@/lib/idlePrefetch'
import { useEffect } from 'react'

const StickerLayer = dynamic(
  () =>
    import('@/components/StickerLayer').then((m) => ({
      default: m.StickerLayer,
    })),
  { loading: () => null, preloadForHydration: true },
)

export default function App() {
  useEffect(() => {
    startIdlePrefetch()
  }, [])

  return (
    <div className="vite-font-mono">
      <ThemeProvider>
        <StickerProvider>
          <ChapterNavProvider>
            <ContentDebugProvider>
            <NavSentenceLayoutProvider>
            <a
              href="#main-content"
              className="skip-link"
              onClick={(e) => {
                e.preventDefault()
                const main = document.getElementById('main-content')
                if (main) main.focus()
              }}
            >
              Skip to content
            </a>
            <div className="site-frame">
              <SidebarNav />
              <main id="main-content" className="content-area" tabIndex={-1}>
                <Hero />
                <PortfolioInterlude />
                <div className="portfolio-sections">
                  <CaseStudy section={hardware} sectionId="hardware" />
                  <CaseStudy sectionId="mobile" />
                  <CaseStudy sectionId="web-apps" />
                  <CaseStudy sectionId="everything-else" />
                </div>
                <PortfolioOutro />
              </main>
              <DeckController />
            </div>
            <StickerLayer />
            <DevPanels />
            </NavSentenceLayoutProvider>
            </ContentDebugProvider>
          </ChapterNavProvider>
        </StickerProvider>
      </ThemeProvider>
    </div>
  )
}
