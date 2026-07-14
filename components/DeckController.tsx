import { useDeck } from '@/lib/deck/useDeck'

/**
 * Headless driver for the desktop deck presentation (wheel → chapter steps +
 * hash deep-linking). Renders nothing; only active under `?deck=1` on a wide,
 * fine-pointer viewport. Must live inside ChapterNavProvider.
 */
export function DeckController() {
  useDeck()
  return null
}
