import './vite-font.css'
import '@/styles/globals.css'
import dynamic from 'next/dynamic'
import { CaseStudy } from '@/components/CaseStudy'
import { ChapterNavProvider } from '@/components/ChapterNavProvider'
import { ContactFormProvider } from '@/components/ContactFormProvider'
import { Hero } from '@/components/Hero'
import { SidebarNav } from '@/components/SidebarNav'
import { StickerProvider } from '@/components/StickerProvider'
import { ProtoDebugGate } from '@/components/ProtoDebugGate'
import { StageArtifactTuneController } from '@/components/stage-artifact-tune/StageArtifactTuneController'
import { ThemeProvider } from '@/components/ThemeProvider'
import { everythingElse } from '@/lib/sections/everything-else'
import { hardware } from '@/lib/sections/hardware'
import { mobile } from '@/lib/sections/mobile'
import { webApps } from '@/lib/sections/webapps'

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
        <ContactFormProvider>
          <StageArtifactTuneController />
          <ProtoDebugGate>
            <StickerProvider>
              <ChapterNavProvider>
                <a href="#main-content" className="skip-link">
                  Skip to content
                </a>
                <div className="site-frame">
                  <SidebarNav />
                  <main id="main-content" className="content-area" tabIndex={-1}>
                    <Hero />
                    <CaseStudy section={hardware} sectionId="hardware" />
                    <CaseStudy section={mobile} sectionId="mobile" />
                    <CaseStudy section={webApps} sectionId="web-apps" />
                    <CaseStudy
                      section={everythingElse}
                      sectionId="everything-else"
                    />
                  </main>
                </div>
                <StickerLayer />
              </ChapterNavProvider>
            </StickerProvider>
          </ProtoDebugGate>
        </ContactFormProvider>
      </ThemeProvider>
    </div>
  )
}
