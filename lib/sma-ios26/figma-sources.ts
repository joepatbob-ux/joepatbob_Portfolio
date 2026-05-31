/**
 * Figma design sources for the SMA iPhone proto.
 *
 * Rule: **SMA iOS26** only.
 */

export const FIGMA_SMA_IOS26 = {
  fileKey: 'RMl8IRy6WRHIUnEZ2iVMZI',
  name: 'SMA - iOS26',
  url: 'https://www.figma.com/design/RMl8IRy6WRHIUnEZ2iVMZI/SMA---iOS26',
  nodes: {
    /** Control tab — EC frame */
    control: '1142:7210',
    /** Automation tab — full screen with On/Off switcher */
    automation: '3025:5341',
    /** Automation v3 page (scheduling drill-downs) */
    automationV3Page: '2749:82583',
    /** Scheduling — Program sheet */
    schedulingProgram: '2749:82585',
    /** On/Off mode segmented control */
    automationModeSegment: '3025:5347',
    /** Three-way Schedule / Geofence / Off (sheet) */
    scheduleModeSegment: '2749:82591',
  },
} as const

export type FigmaNodeRef = {
  fileKey: string
  nodeId: string
  label: string
}

/** Primary references keyed by proto feature. */
export const PROTO_FIGMA_REFS = {
  controlScreen: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.control,
    label: 'SMA Control',
  },
  automationTab: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.automation,
    label: 'Automation tab',
  },
  automationV3: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.automationV3Page,
    label: 'Automation v3',
  },
  scheduleSheet: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.schedulingProgram,
    label: 'Scheduling — Program (sheet)',
  },
  automationModeSegment: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.automationModeSegment,
    label: 'On / Off switcher',
  },
  scheduleModeSegment: {
    fileKey: FIGMA_SMA_IOS26.fileKey,
    nodeId: FIGMA_SMA_IOS26.nodes.scheduleModeSegment,
    label: 'Schedule / Geofence / Off switcher',
  },
} satisfies Record<string, FigmaNodeRef>

export function figmaDesignUrl(fileKey: string, nodeId: string): string {
  const dashed = nodeId.replace(':', '-')
  return `https://www.figma.com/design/${fileKey}?node-id=${dashed}`
}
