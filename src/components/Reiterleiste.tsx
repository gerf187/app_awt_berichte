import { useEffect, useRef } from 'react'
import type { Stand } from '../lib/blattstand'
import type { BlattId } from '../lib/typen'
import { BlattZeichen } from './BlattZeichen'

/** Der letzte Reiter führt aus den Blättern heraus in die Kachelübersicht. */
export type ReiterId = BlattId | 'uebersicht'

export type Reiter = { id: ReiterId; kurz: string; stand: Stand }

/**
 * Waagerecht scrollbare Reiterleiste über dem Blatt.
 *
 * Auf der Baustelle wird über den Tag zu einzelnen Punkten nachgetragen –
 * ein Tipp muss reichen, statt sich durch Schritte zurückzuarbeiten.
 */
export function Reiterleiste({
  reiter,
  aktiv,
  waehle,
}: {
  reiter: Reiter[]
  aktiv: ReiterId
  waehle: (id: ReiterId) => void
}) {
  const leiste = useRef<HTMLDivElement>(null)

  // Der aktive Reiter wandert in die Mitte, sonst ist er nach dem Wechsel
  // aus dem sichtbaren Bereich gescrollt.
  useEffect(() => {
    leiste.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [aktiv])

  return (
    <div
      ref={leiste}
      role="tablist"
      aria-label="Blätter des Berichts"
      className="border-sika-schwarz/10 flex overflow-x-auto border-b bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {reiter.map((eintrag) => {
        const gewaehlt = eintrag.id === aktiv
        return (
          <button
            key={eintrag.id}
            type="button"
            role="tab"
            aria-selected={gewaehlt}
            onClick={() => waehle(eintrag.id)}
            className={`tippziel flex shrink-0 items-center gap-1.5 border-b-4 px-4 font-semibold whitespace-nowrap ${
              gewaehlt
                ? 'border-sika-gelb bg-sika-gelb/10 text-sika-schwarz'
                : 'text-sika-grau border-transparent'
            }`}
          >
            {eintrag.kurz}
            <BlattZeichen art={eintrag.stand.art} klasse="text-sm" />
          </button>
        )
      })}
    </div>
  )
}
