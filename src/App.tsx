import './vite-font.css'
import '@/styles/globals.css'
import dynamic from 'next/dynamic'
import { CaseStudy } from '@/components/CaseStudy'
import { ChapterNavProvider } from '@/components/ChapterNavProvider'
import { Hero } from '@/components/Hero'
import { SidebarNav } from '@/components/SidebarNav'
import { StickerProvider } from '@/components/StickerProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { hardware } from '@/lib/sections/hardware'

const StickerLayer = dynamic(
  () =>
    import('@/components/StickerLayer').then((m) => ({
      default: m.StickerLayer,
    })),
  { loading: () => null },
)

export default function App() {
  return (
    <div className="vite-font-mono">
      <ThemeProvider>
        <StickerProvider>
          <ChapterNavProvider>
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
                <CaseStudy section={hardware} sectionId="hardware" />
                <CaseStudy sectionId="mobile" />
                <CaseStudy sectionId="web-apps" />
                <CaseStudy sectionId="everything-else" />
              </main>
              <footer className="site-footer" aria-label="Site footer">
                <p className="site-footer__copy">
                  &copy; {new Date().getFullYear()} Joseph Patrick Roberts. All
                  rights reserved.
                </p>
              </footer>
            </div>
            <StickerLayer />
          </ChapterNavProvider>
        </StickerProvider>
      </ThemeProvider>
    </div>
  )
}
