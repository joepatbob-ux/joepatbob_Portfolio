'use client'

/** Top + bottom progressive blur for edge-to-edge scroll (Schedule tab). */
export function ScrollEdgeChrome() {
  return (
    <>
      <div className="sma-scroll-edge sma-scroll-edge--top-solid" aria-hidden />
      <div className="sma-scroll-edge sma-scroll-edge--top-fade" aria-hidden />
      <div className="sma-scroll-edge sma-scroll-edge--bottom-solid" aria-hidden />
      <div className="sma-scroll-edge sma-scroll-edge--bottom-fade" aria-hidden />
    </>
  )
}
