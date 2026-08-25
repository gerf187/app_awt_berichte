import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Art = 'haupt' | 'zweit' | 'gefahr' | 'still'

const ARTEN: Record<Art, string> = {
  haupt: 'bg-sika-gelb text-sika-schwarz active:bg-sika-gelb-dunkel',
  zweit: 'bg-white text-sika-schwarz border-2 border-sika-schwarz/15 active:bg-sika-hell',
  gefahr: 'bg-sika-rot text-white active:brightness-90',
  still: 'bg-transparent text-sika-grau underline active:text-sika-schwarz',
}

type Eigenschaften = ButtonHTMLAttributes<HTMLButtonElement> & {
  art?: Art
  /** Nimmt die volle Breite ein – der Normalfall auf dem Handy. */
  breit?: boolean
  children: ReactNode
}

/**
 * Einheitliche Schaltfläche. Mindesthöhe 3rem (48 px) – Bedienung mit
 * Handschuhen ist Vorgabe aus der Spezifikation.
 */
export function Knopf({
  art = 'zweit',
  breit = false,
  className = '',
  children,
  ...rest
}: Eigenschaften) {
  return (
    <button
      type="button"
      {...rest}
      className={[
        'tippziel inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-lg font-semibold',
        'disabled:opacity-40',
        ARTEN[art],
        breit ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  )
}
