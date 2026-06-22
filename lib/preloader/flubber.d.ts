declare module 'flubber' {
  export function interpolate(from: string, to: string): (t: number) => string
}
