'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type PhoneDevToolsAction = 'layout' | 'anim' | 'materials' | 'hide'

type Props = {
  x: number
  y: number
  devToolsEnabled: boolean
  onSelect: (action: PhoneDevToolsAction) => void
  onClose: () => void
}

export function PhoneDevToolsMenu({
  x,
  y,
  devToolsEnabled,
  onSelect,
  onClose,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const pad = 8
    const rect = menu.getBoundingClientRect()
    let left = x
    let top = y

    if (left + rect.width > window.innerWidth - pad) {
      left = Math.max(pad, window.innerWidth - rect.width - pad)
    }
    if (top + rect.height > window.innerHeight - pad) {
      top = Math.max(pad, window.innerHeight - rect.height - pad)
    }

    setPosition({ left, top })
  }, [x, y])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <>
      <button
        type="button"
        className="phone-dev-tools-menu__backdrop"
        aria-label="Close developer menu"
        onClick={onClose}
      />
      <div
        ref={menuRef}
        className="phone-dev-tools-menu"
        style={{ left: position.left, top: position.top }}
        role="menu"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="phone-dev-tools-menu__label">Phone dev tools</p>
        <button
          type="button"
          role="menuitem"
          className="phone-dev-tools-menu__item"
          onClick={() => onSelect('layout')}
        >
          Adjust positions
        </button>
        <button
          type="button"
          role="menuitem"
          className="phone-dev-tools-menu__item"
          onClick={() => onSelect('anim')}
        >
          Tune animation
        </button>
        <button
          type="button"
          role="menuitem"
          className="phone-dev-tools-menu__item"
          onClick={() => onSelect('materials')}
        >
          Tune materials
        </button>
        {devToolsEnabled ? (
          <button
            type="button"
            role="menuitem"
            className="phone-dev-tools-menu__item phone-dev-tools-menu__item--muted"
            onClick={() => onSelect('hide')}
          >
            Hide developer tools
          </button>
        ) : null}
      </div>
    </>
  )
}
