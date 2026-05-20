'use client'

import { SectionLessons } from '@/components/SectionLessons'
import { EimTouchFamilyArt } from '@/components/EimTouchFamilyArt'
import { SensiLiteLessonArt } from '@/components/SensiLiteLessonArt'
import { HARDWARE_LESSON_DEVICES } from '@/lib/hardware/lessonDevices'

interface Props {
  lessonTitle: string
  lessonBody: string
  isLast: boolean
}

export function HardwareLessons({ lessonTitle, lessonBody, isLast }: Props) {
  return (
    <SectionLessons
      sectionId="hardware"
      lessonTitle={lessonTitle}
      lessonBody={lessonBody}
      isLast={isLast}
    >
      <ul className="section-lessons__devices" aria-label="Thermostat product line">
        {HARDWARE_LESSON_DEVICES.map((device) => (
          <li
            key={device.id}
            className={[
              'section-lessons__device',
              device.id === 'eim-touch-family'
                ? 'section-lessons__device--family'
                : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {device.id === 'eim-touch-family' ? (
              <EimTouchFamilyArt className="section-lessons__device-art" />
            ) : device.id === 'lite' ? (
              <SensiLiteLessonArt className="section-lessons__device-art" />
            ) : (
              <img
                src={device.src}
                alt=""
                className="section-lessons__device-art"
                decoding="async"
              />
            )}
          </li>
        ))}
      </ul>
    </SectionLessons>
  )
}
