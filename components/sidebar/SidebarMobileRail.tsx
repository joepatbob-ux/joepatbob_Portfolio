import type { RefObject } from 'react'

/** Phone + tablet: backdrop scrim + collapsed top rail that opens the drawer. */
export function SidebarMobileRail({
  railRef,
  ready,
  drawerOpen,
  showRail,
  sectionLabel,
  onOpen,
  onClose,
}: {
  railRef: RefObject<HTMLButtonElement>
  ready: boolean
  drawerOpen: boolean
  showRail: boolean
  sectionLabel: string
  onOpen: () => void
  onClose: () => void
}) {
  return (
    <div
      className={['sidebar-mobile-nav', ready ? 'sidebar-mobile-nav--ready' : '']
        .filter(Boolean)
        .join(' ')}
      /* --ready is effect-driven: the snapshot bakes it true, the first client
         render is false, and the effect reconciles right after — prod React
         never compares attributes, so only the dev warning needs quieting. */
      suppressHydrationWarning
    >
      <div
        className={`sidebar-mobile-backdrop${drawerOpen ? ' sidebar-mobile-backdrop--visible' : ''}`}
        role="presentation"
        aria-hidden={drawerOpen ? undefined : true}
        onClick={onClose}
      />

      <button
        ref={railRef}
        type="button"
        className={[
          'sidebar-mobile-rail',
          showRail ? 'sidebar-mobile-rail--visible' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-expanded={drawerOpen}
        aria-controls="sidebar-tablet-panel"
        aria-label={`Open navigation — ${sectionLabel}`}
        aria-hidden={showRail ? undefined : true}
        tabIndex={showRail ? 0 : -1}
        onClick={onOpen}
      >
        <span className="sidebar-mobile-rail__chrome" aria-hidden />
        <p className="sidebar-mobile-rail__label" aria-hidden="true">
          {/* Single-string child: the prerender snapshot merges adjacent text
              nodes ("…for" + " "), which fails hydration's text comparison. */}
          {'I design connected experiences for '}
          <span className="sidebar-mobile-rail__label-accent">{sectionLabel}</span>
        </p>
      </button>
    </div>
  )
}
