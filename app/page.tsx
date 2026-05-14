// app/page.tsx
import { Hero } from '@/components/Hero'
import { CaseStudy } from '@/components/CaseStudy'
import { hardware } from '@/lib/sections/hardware'

export default function Home() {
  return (
    <>
      {/* Hero — 100vh, sidebar name fades out on scroll */}
      <Hero />

      {/* Hardware case study */}
      <CaseStudy
        section={hardware}
        sectionId="hardware"
      />

      {/* Placeholder sections — build out later */}
      <div data-section-id="mobile"        style={{ minHeight: '100vh' }} />
      <div data-section-id="web-apps"      style={{ minHeight: '100vh' }} />
      <div data-section-id="everything-else" style={{ minHeight: '100vh' }} />
    </>
  )
}
