// components/SidebarNav.tsx — composition of the sidebar nav family.
// State + scroll choreography live in components/sidebar/useSidebarNavState;
// the render regions are components/sidebar/* (rail, hero name, subnav,
// mobile hero). This file wires them together plus the desktop shell markup
// (divider, hero name, main nav sentence, contact).

import { createPortal } from 'react-dom'
import { ContactButton } from '@/components/ContactButton'
import { SidebarMainNavSentence } from '@/components/SidebarMainNavSentence'
import { OverlayPanelClose } from '@/components/ui/OverlayPanelClose'
import { SidebarHeroName } from '@/components/sidebar/SidebarHeroName'
import { SidebarMobileHero } from '@/components/sidebar/SidebarMobileHero'
import { SidebarMobileRail } from '@/components/sidebar/SidebarMobileRail'
import { SidebarSubnav } from '@/components/sidebar/SidebarSubnav'
import { BLUR_PX, INK, navKeywordStyle } from '@/components/sidebar/constants'
import { useSidebarNavState } from '@/components/sidebar/useSidebarNavState'

function SidebarOverlayClose({
  onClose,
  variant,
}: {
  onClose: () => void
  variant: 'tablet' | 'mobile-panel'
}) {
  return (
    <OverlayPanelClose
      className={`sidebar-overlay-close--${variant}`}
      aria-label="Close navigation"
      data-sidebar-nav-hit
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    />
  )
}

export function SidebarNav() {
  const nav = useSidebarNavState()
  const {
    usesTopBarNav,
    reducedMotion,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    closeOverlays,
  } = nav

  const shellClass = [
    'sidebar-desktop-shell',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const subnavClass = [
    'sidebar-desktop-subnav',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Phone + tablet: hero intro → top rail → expand panel + scrim */}
      <SidebarMobileRail
        railRef={nav.mobileRailRef}
        ready={nav.mobileNavReady}
        drawerOpen={mobileDrawerOpen}
        showRail={nav.showMobileRail}
        sectionLabel={nav.currentSection.label}
        onOpen={() => setMobileDrawerOpen(true)}
        onClose={closeOverlays}
      />

      {/* Sidebar shell — desktop; phone/tablet expand as overlay */}
      <div
        ref={nav.mobileDrawerPanelRef}
        id="sidebar-tablet-panel"
        className={shellClass}
        role={usesTopBarNav && mobileDrawerOpen ? 'dialog' : undefined}
        aria-modal={usesTopBarNav && mobileDrawerOpen ? true : undefined}
        aria-label={usesTopBarNav && mobileDrawerOpen ? 'Navigation menu' : undefined}
      >
        <div
          ref={nav.sidebarShellRef}
          className="sidebar-shell--fixed"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: nav.shellUsesOverlayWidth
              ? 'var(--sidebar-overlay-width)'
              : 'var(--sidebar-width)',
            height: '100dvh',
            zIndex: usesTopBarNav ? undefined : 100,
            pointerEvents: usesTopBarNav && mobileDrawerOpen ? 'auto' : 'none',
          }}
          onClick={(e) => {
            if ((e.target as Element).closest('[data-sidebar-nav-hit]')) return
            if (usesTopBarNav && mobileDrawerOpen) closeOverlays()
          }}
        >
          {!(usesTopBarNav && mobileDrawerOpen) ? (
            <div
              aria-hidden
              className="sidebar-shell__divider"
              style={{
                opacity: nav.dividerVisible ? 1 : 0,
                filter:
                  reducedMotion || nav.dividerVisible
                    ? 'blur(0)'
                    : `blur(${BLUR_PX}px)`,
                transition: reducedMotion
                  ? 'opacity 600ms ease'
                  : 'opacity 600ms ease, filter 600ms ease',
              }}
            />
          ) : null}

          {/* Hero name — opacity/blur driven by scroll frame */}
          <div
            ref={nav.heroRef}
            className="sidebar-hero-name"
            aria-hidden
            style={{
              position: 'absolute',
              opacity: 1,
              filter: 'blur(0px)',
              transition: 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <SidebarHeroName variant="desktop" />
          </div>

          {/* Main nav sentence — top set in applyDesktopNavScroll after layout measure */}
          <div
            ref={nav.navWrapRef}
            data-sidebar-main-nav
            data-sidebar-nav-hit
            aria-hidden={usesTopBarNav && !mobileDrawerOpen ? true : undefined}
            style={{
              position: 'absolute',
              transition: 'none',
              pointerEvents: 'auto',
            }}
          >
            <SidebarMainNavSentence
              variant="desktop"
              inkColor={INK}
              dimActive={nav.dimActive}
              activeSection={nav.activeSection}
              hoverSectionId={nav.hoverSectionId}
              fadeMainNavSelection={nav.fadeMainNavSelection}
              navKeywordStyle={navKeywordStyle}
              onSelect={nav.scrollToSection}
              onHoverSection={nav.setHoverSectionId}
              onClearChapterHover={() => nav.setHoverChapterId(null)}
            />
          </div>

          {/* Contact — liquid split; mobile overlay stacks divider + close below */}
          {usesTopBarNav && mobileDrawerOpen ? (
            <div className="sidebar-mobile-shell-footer" data-sidebar-nav-hit>
              <div className="sidebar-mobile-shell-footer__contact">
                <div ref={nav.contactRef} className="sidebar-contact">
                  <ContactButton variant="panel" />
                </div>
              </div>
              <div
                aria-hidden
                className="sidebar-shell__divider sidebar-shell__divider--horizontal"
              />
              <SidebarOverlayClose
                onClose={nav.commitOverlaySelection}
                variant="mobile-panel"
              />
            </div>
          ) : (
            <div
              ref={nav.contactRef}
              className="sidebar-contact"
              data-sidebar-nav-hit
              style={{
                position: 'absolute',
                pointerEvents: 'auto',
              }}
            >
              <ContactButton />
            </div>
          )}
        </div>
      </div>

      {/* Sub nav — viewport center (desktop only) */}
      <SidebarSubnav
        subnavRef={nav.subnavRef}
        subnavClass={subnavClass}
        section={nav.currentSection}
        interactive={nav.subnavInteractive}
        overlayMode={nav.overlaySubnav}
        visibleItems={nav.chapterItemsVisible}
        activeChapter={nav.activeChapter}
        hoverChapterId={nav.hoverChapterId}
        reducedMotion={reducedMotion}
        onSelectChapter={nav.scrollToChapter}
        setHoverChapterId={nav.setHoverChapterId}
        setHoverSectionId={nav.setHoverSectionId}
      />

      {usesTopBarNav &&
        nav.heroNavSlot &&
        createPortal(
          <SidebarMobileHero
            heroRef={nav.mobileHeroRef}
            active={nav.showMobileHero}
            onSelectSection={nav.scrollToSection}
          />,
          nav.heroNavSlot,
        )}
    </>
  )
}
