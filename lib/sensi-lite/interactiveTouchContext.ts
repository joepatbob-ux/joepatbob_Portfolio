import { createContext, useContext } from 'react'

export type MenuLongPressIndicatorState = {
  active: boolean
  durationMs: number
}

type MenuLongPressIndicatorContextValue = {
  state: MenuLongPressIndicatorState
  setState: (state: MenuLongPressIndicatorState) => void
}

export const MenuLongPressIndicatorContext =
  createContext<MenuLongPressIndicatorContextValue | null>(null)

export function useMenuLongPressIndicator() {
  return useContext(MenuLongPressIndicatorContext)
}
