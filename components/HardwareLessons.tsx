'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { HardwareChapterCopy } from '@/components/hardware/HardwareChapterCopy'
import { EimTouchFamilyArt } from '@/components/EimTouchFamilyArt'
import { SensiLiteLessonArt } from '@/components/SensiLiteLessonArt'
import { HARDWARE_LESSON_DEVICES } from '@/lib/hardware/lessonDevices'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

interface Props {
  lessonTitle: string
  lessonBody: string
  isLast: boolean
}

export function HardwareLessons({ lessonTitle, lessonBody, isLast }: Props) {
  const { isActive } = useChapterPanelOpacity('hardware-lessons')

  return (
    <ChapterViewport
      chapterId="hardware-lessons"
      isLast={isLast}
      fillViewport
      className="hardware-lessons"
    >
      <ul className="hardware-lessons__devices" aria-label="Thermostat product line">
        {HARDWARE_LESSON_DEVICES.map((device) => (
          <li
            key={device.id}
            className={[
              'hardware-lessons__device',
              device.id === 'eim-touch-family'
                ? 'hardware-lessons__device--family'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {device.id === 'eim-touch-family' ? (
              <EimTouchFamilyArt className="hardware-lessons__device-art" />
            ) : device.id === 'lite' ? (
              <SensiLiteLessonArt className="hardware-lessons__device-art" />
            ) : (
              <img
                src={device.src}
                alt=""
                className="hardware-lessons__device-art"
                decoding="async"
              />
            )}
          </li>
        ))}
      </ul>

      <HardwareChapterCopy
        active={isActive}
        headline={lessonTitle}
        body={lessonBody}
        className="hardware-lessons__copy"
      />
    </ChapterViewport>
  )
}
