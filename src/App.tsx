import './vite-font.css'
import '@/styles/globals.css'
import { CaseStudy } from '@/components/CaseStudy'
import { ContactFormProvider } from '@/components/ContactFormProvider'
import { ChapterNavProvider } from '@/components/ChapterNavProvider'
import { Hero } from '@/components/Hero'
import { SidebarNav } from '@/components/SidebarNav'
import { StickerLayer } from '@/components/StickerLayer'
import { StickerProvider } from '@/components/StickerProvider'
import { ProtoDebugGate } from '@/components/ProtoDebugGate'
import { StageArtifactTuneController } from '@/components/stage-artifact-tune/StageArtifactTuneController'
import { StageArtifactTunePanel } from '@/components/stage-artifact-tune/StageArtifactTunePanel'
import { StageArtifactTuneProvider } from '@/components/stage-artifact-tune/StageArtifactTuneProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { everythingElse } from '@/lib/sections/everything-else'
import { hardware } from '@/lib/sections/hardware'
import { mobile } from '@/lib/sections/mobile'
import { webApps } from '@/lib/sections/webapps'

export default function App() {
  return (
    <div className="vite-font-mono">
      <ThemeProvider>
        <StageArtifactTuneProvider>
          <StageArtifactTuneController />
          <StageArtifactTunePanel />
          <ProtoDebugGate>
          <ContactFormProvider>
            <StickerProvider>
              <ChapterNavProvider>
                <div className="site-frame">
                  <SidebarNav />
                  <main className="content-area">
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
          </ContactFormProvider>
        </ProtoDebugGate>
        </StageArtifactTuneProvider>
      </ThemeProvider>
    </div>
  )
}
