const KELVIN = '#F5431B'
const INK = '#1a1a1a'
const MUTED = '#6b6b6b'
const LINE = '#c8c6c0'
const PANEL = '#f5f4f0'

interface Props {
  width?: number
  height?: number
}

/** Unified Kelvin design system wireframe (full 2×2 card). */
export function KelvinAfterWireframe({
  width = 800,
  height = 800,
}: Props) {
  const sideW = Math.max(56, width * 0.07)
  const mainX = sideW + 16
  const mainW = width - mainX - 16
  const kpiH = height * 0.12
  const kpiW = (mainW - 32) / 4
  const tableY = 48 + kpiH + 16
  const tableH = height - tableY - 56
  const detailW = mainW * 0.32
  const tableW = mainW - detailW - 10

  return (
    <svg
      className="kelvin-after-wireframe"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <rect width={width} height={height} fill="#fafaf8" />

      <rect x={0} y={0} width={width} height={44} fill="#fff" stroke={LINE} />
      <rect x={14} y={12} width={28} height={20} fill={KELVIN} rx={2} />
      <text
        x={28}
        y={26}
        fill="#fff"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        K
      </text>
      {['Overview', 'Devices', 'Alarms', 'Reports'].map((label, i) => (
        <text
          key={label}
          x={72 + i * 88}
          y={26}
          fill={i === 0 ? KELVIN : MUTED}
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {label}
        </text>
      ))}

      <rect x={0} y={44} width={sideW} height={height - 44} fill="#fff" stroke={LINE} />
      {['▣', '◇', '△', '◎', '◆'].map((icon, i) => (
        <text
          key={icon}
          x={sideW / 2}
          y={72 + i * 36}
          fill={i === 0 ? KELVIN : MUTED}
          fontSize={14}
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
        >
          {icon}
        </text>
      ))}

      {['Sites', 'Alarms', 'Compliance', 'Sensors'].map((label, i) => {
        const kx = mainX + i * (kpiW + 8)
        return (
          <g key={label}>
            <rect x={kx} y={52} width={kpiW} height={kpiH} fill={PANEL} stroke={LINE} />
            <text
              x={kx + 10}
              y={64}
              fill={MUTED}
              fontSize={10}
              fontFamily="ui-monospace, monospace"
            >
              {label}
            </text>
            <text
              x={kx + 10}
              y={82}
              fill={i === 1 ? KELVIN : INK}
              fontSize={13}
              fontFamily="ui-monospace, monospace"
              fontWeight={600}
            >
              {['128', '3', '99.2%', '1.4k'][i]}
            </text>
          </g>
        )
      })}

      <rect
        x={mainX}
        y={tableY}
        width={tableW}
        height={tableH}
        fill="#fff"
        stroke={LINE}
      />
      <rect x={mainX} y={tableY} width={tableW} height={20} fill="#eeede8" />
      {['Asset', 'Status', 'Temp', 'Zone'].map((col, i) => (
        <text
          key={col}
          x={mainX + 10 + i * (tableW / 4.5)}
          y={tableY + 14}
          fill={INK}
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          {col}
        </text>
      ))}
      {Array.from({ length: 7 }, (_, r) => (
        <line
          key={r}
          x1={mainX}
          y1={tableY + 24 + r * 18}
          x2={mainX + tableW}
          y2={tableY + 24 + r * 18}
          stroke={LINE}
        />
      ))}

      <rect
        x={mainX + tableW + 10}
        y={tableY}
        width={detailW}
        height={tableH}
        fill="#fff"
        stroke={LINE}
      />
      <text
        x={mainX + tableW + 18}
        y={tableY + 16}
        fill={INK}
        fontSize={10}
        fontFamily="ui-monospace, monospace"
      >
        Detail
      </text>
      <rect
        x={mainX + tableW + 18}
        y={tableY + 36}
        width={detailW - 28}
        height={56}
        fill="none"
        stroke={KELVIN}
        strokeWidth={1.5}
      />

      <text
        x={width / 2}
        y={height - 22}
        fill={MUTED}
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
        letterSpacing="0.14em"
      >
        KELVIN DESIGN SYSTEM
      </text>
    </svg>
  )
}
