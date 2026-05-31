'use client'

import { ScheduleListRow } from '@/components/sma-ios26/parts/ScheduleListRow'
import { ScheduleModeSegment } from '@/components/sma-ios26/parts/ScheduleModeSegment'
import type { SmaProtoState } from '@/lib/sma-ios26/state'
import type { ReactNode } from 'react'

type AutomationScreenProps = {
  state: SmaProtoState
  onStateChange: (patch: Partial<SmaProtoState>) => void
}

function GroupedSection({
  children,
  footer,
}: {
  children: ReactNode
  footer?: string
}) {
  return (
    <section className="sma-automation-section">
      <div className="sma-automation-group">{children}</div>
      {footer ? <p className="sma-automation-section__footer">{footer}</p> : null}
    </section>
  )
}

/** Automation tab (SMA iOS26, node 3025:5341). */
export function AutomationScreen({ state, onStateChange }: AutomationScreenProps) {
  const profilesOn = state.useActivityProfiles

  return (
    <div className="sma-automation-screen">
      <section className="sma-automation-section sma-automation-section--mode">
        <ScheduleModeSegment
          variant="onOff"
          value={state.scheduleMode}
          onChange={(scheduleMode) => onStateChange({ scheduleMode })}
        />
      </section>

      <GroupedSection
        footer={
          profilesOn
            ? 'Activity Profiles group temperature setpoints and room sensor settings to easily control comfort.'
            : undefined
        }
      >
        <ScheduleListRow
          variant="toggle"
          label="Use Activity Profiles"
          checked={profilesOn}
          onChange={(useActivityProfiles) => onStateChange({ useActivityProfiles })}
        />
        <ScheduleListRow
          variant="link"
          label="Activity Profiles"
          detail=""
          disabled={!profilesOn}
        />
      </GroupedSection>

      <GroupedSection>
        {profilesOn ? (
          <ScheduleListRow
            variant="link"
            label="Activity Schedule"
            detail={state.activityScheduleLabel}
          />
        ) : (
          <>
            <ScheduleListRow
              variant="link"
              label="Heating"
              detail={state.heatingScheduleLabel}
            />
            <ScheduleListRow
              variant="link"
              label="Cooling"
              detail={state.coolingScheduleLabel}
            />
            <ScheduleListRow variant="link" label="Auto" detail={state.autoScheduleLabel} />
          </>
        )}
      </GroupedSection>

      <GroupedSection>
        <ScheduleListRow
          variant="toggle"
          label="Device Participation"
          checked={state.deviceParticipation}
          onChange={(deviceParticipation) => onStateChange({ deviceParticipation })}
        />
        <ScheduleListRow variant="link" label="Setback" detail={state.setbackLabel} />
        <ScheduleListRow variant="link" label="Geofence Radius" detail={state.geofenceRadiusLabel} />
      </GroupedSection>

      <GroupedSection footer="Set time you will not be home for extended periods of time.">
        <ScheduleListRow variant="link" label="Vacations" detail={state.vacationsLabel} />
      </GroupedSection>

      <GroupedSection footer="Heat or cool ahead of time to reach your set temperature at the scheduled time.">
        <ScheduleListRow
          variant="toggle"
          label="Early Start"
          checked={state.earlyStart}
          onChange={(earlyStart) => onStateChange({ earlyStart })}
        />
      </GroupedSection>
    </div>
  )
}
