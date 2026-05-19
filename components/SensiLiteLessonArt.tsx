/** Static Sensi Lite silhouette for Hardware → Lessons (frame + lit 72 display). */
const FRAME = '/images/sensi-lite/lite-frame.svg'
const SCREEN = '/images/sensi-lite/screen.svg'
const DIGIT_7 = '/images/sensi-lite/digit-7.svg'
const DIGIT_2 = '/images/sensi-lite/digit-2.svg'
const ICON_COOL = '/images/sensi-lite/icon-cool.svg'

interface Props {
  className?: string
}

export function SensiLiteLessonArt({ className }: Props) {
  return (
    <div
      className={['sensi-lite-lesson-art', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <img src={FRAME} alt="" className="sensi-lite-lesson-art__frame" decoding="async" />
      <div className="sensi-lite-lesson-art__screen">
        <img src={SCREEN} alt="" className="sensi-lite-lesson-art__screen-base" decoding="async" />
        <img src={DIGIT_7} alt="" className="sensi-lite-lesson-art__digit sensi-lite-lesson-art__digit--tens" decoding="async" />
        <img src={DIGIT_2} alt="" className="sensi-lite-lesson-art__digit sensi-lite-lesson-art__digit--ones" decoding="async" />
        <img src={ICON_COOL} alt="" className="sensi-lite-lesson-art__icon sensi-lite-lesson-art__icon--cool" decoding="async" />
      </div>
    </div>
  )
}
