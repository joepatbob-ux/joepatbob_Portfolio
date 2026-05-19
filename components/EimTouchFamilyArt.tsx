interface Props {
  className?: string
}

/** Touch 2 + EIM + remote sensor — single overlaid product-family silhouette. */
export function EimTouchFamilyArt({ className }: Props) {
  return (
    <div
      className={['eim-touch-family', className].filter(Boolean).join(' ')}
      aria-label="Sensi Touch 2 with Equipment Interface Module and remote sensor"
    >
      <img
        src="/images/EIM.svg"
        alt=""
        className="eim-touch-family__layer eim-touch-family__eim"
        decoding="async"
      />
      <img
        src="/images/Front/Touch%202.svg"
        alt=""
        className="eim-touch-family__layer eim-touch-family__touch2"
        decoding="async"
      />
      <img
        src="/images/Remote%20Sensor.svg"
        alt=""
        className="eim-touch-family__layer eim-touch-family__remote"
        decoding="async"
      />
    </div>
  )
}
