// app/page.tsx
import { Hero } from '@/components/Hero'
import { CaseStudy } from '@/components/CaseStudy'
import { hardware } from '@/lib/sections/hardware'
import { mobile } from '@/lib/sections/mobile'
import { webApps } from '@/lib/sections/webapps'
import { everythingElse } from '@/lib/sections/everything-else'

export default function Home() {
  return (
    <>
      {/* Hero — 100vh, sidebar name fades out on scroll */}
      <Hero />

      {/* Case studies */}
      <CaseStudy section={hardware}      sectionId="hardware" />
      <CaseStudy section={mobile}        sectionId="mobile" />
      <CaseStudy section={webApps}       sectionId="web-apps" />
      <CaseStudy section={everythingElse} sectionId="everything-else" />
    </>
  )
}
