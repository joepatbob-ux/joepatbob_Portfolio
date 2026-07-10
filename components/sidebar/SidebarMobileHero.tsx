import type { RefObject } from 'react'
import { SidebarHeroName } from '@/components/sidebar/SidebarHeroName'
import { SidebarMainNavSentence } from '@/components/SidebarMainNavSentence'

/** Hero-slot intro nav for phone + tablet (portaled into #hero-mobile-nav-slot). */
export function SidebarMobileHero({
  heroRef,
  active,
  onSelectSection,
}: {
  heroRef: RefObject<HTMLDivElement>
  active: boolean
  onSelectSection: (sectionId: string) => void
}) {
  return (
    <nav
      ref={heroRef}
      aria-label="Site navigation"
      className={`sidebar-mobile-hero${active ? ' sidebar-mobile-hero--active' : ''}`}
      aria-hidden={active ? undefined : true}
    >
      <div className="sidebar-mobile-hero__inner">
        <SidebarHeroName variant="mobile" />
        <SidebarMainNavSentence
          variant="mobile-hero"
          onSelect={onSelectSection}
          keywordTabIndex={active ? 0 : -1}
        />
      </div>
    </nav>
  )
}
