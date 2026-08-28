import { useMemo } from 'react'
import type { Ansicht } from '../App'
import { BlattZeichen } from '../components/BlattZeichen'
import { Knopf } from '../components/Knopf'
import { Kopfzeile } from '../components/Kopfzeile'
import { Reiterleiste } from '../components/Reiterleiste'
import { fehlendePflichtfelder } from '../lib/bericht'
import { blattStand } from '../lib/blattstand'
import { useBericht } from '../lib/useBericht'
import type { BlattId } from '../lib/typen'
import { BLAETTER, blattFinden } from './blaetter/liste'

/**
 * Ein Bericht besteht aus Blättern, nicht aus Schritten.
 *
 * Ohne `blatt` steht die Kachelübersicht: sie zeigt auf einen Blick, wo noch
 * etwas fehlt. Im Blatt selbst führt die Reiterleiste ohne Umweg weiter –
 * auf der Baustelle wird über den Tag verteilt nachgetragen, und niemand will
 * sich dafür durch acht Bildschirme zurückarbeiten.
 */
export function BerichtBildschirm({
  id,
  blatt,
  zeige,
}: {
  id: string
  blatt?: BlattId
  zeige: (ansicht: Ansicht) => void
}) {
  const { bericht, geladen, aendern, jetztSchreiben } = useBericht(id)

  const fehlt = useMemo(() => (bericht ? fehlendePflichtfelder(bericht) : []), [bericht])

  function wechsle(ziel: BlattId | undefined) {
    jetztSchreiben()
    zeige({ name: 'bericht', id, blatt: ziel })
  }

  /** Raus aus dem Bericht – vorher schreiben, sonst fehlt der letzte Tastendruck. */
  function verlasse(ansicht: Ansicht) {
    jetztSchreiben()
    zeige(ansicht)
  }

  if (!geladen) {
    return (
      <div className="flex flex-1 flex-col">
        <Kopfzeile titel="Bericht" zurueck={() => zeige({ name: 'liste' })} />
        <p className="text-sika-grau p-4">Wird geladen …</p>
      </div>
    )
  }

  if (!bericht) {
    return (
      <div className="flex flex-1 flex-col">
        <Kopfzeile titel="Bericht" zurueck={() => zeige({ name: 'liste' })} />
        <div className="flex flex-col gap-4 p-4">
          <p>Dieser Bericht ist nicht mehr vorhanden.</p>
          <Knopf art="zweit" breit onClick={() => zeige({ name: 'liste' })}>
            Zur Übersicht
          </Knopf>
        </div>
      </div>
    )
  }

  const kennung = `Bericht ${bericht.kopf.berichtsnummer}`

  // --- Übersicht: alle Blätter als Kacheln -----------------------------------
  if (!blatt) {
    return (
      <div className="flex flex-1 flex-col">
        <Kopfzeile
          titel={bericht.kopf.projekt || 'Ohne Bezeichnung'}
          zurueck={() => {
            jetztSchreiben()
            zeige({ name: 'liste' })
          }}
          fortschritt={kennung}
        />

        <main className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            {BLAETTER.map((eintrag) => {
              const stand = blattStand(eintrag.id, bericht, fehlt)
              return (
                <button
                  key={eintrag.id}
                  type="button"
                  onClick={() => wechsle(eintrag.id)}
                  className="border-sika-schwarz/10 active:bg-sika-hell flex min-h-28 flex-col justify-between gap-2 rounded-xl border-2 bg-white p-3 text-left"
                >
                  <span className="text-base leading-tight font-bold">{eintrag.titel}</span>
                  <span className="text-sika-grau flex items-center gap-1.5 text-sm font-semibold">
                    <BlattZeichen art={stand.art} />
                    <span className="truncate">{stand.text}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <Knopf art="haupt" breit onClick={() => wechsle('abschluss')}>
            Bericht ausgeben
          </Knopf>
        </main>
      </div>
    )
  }

  // --- Ein Blatt -------------------------------------------------------------
  const aktuell = blattFinden(blatt)
  const stelle = BLAETTER.findIndex((eintrag) => eintrag.id === aktuell.id)
  const vorheriges = BLAETTER[stelle - 1]
  const naechstes = BLAETTER[stelle + 1]

  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile
        titel={aktuell.titel}
        zurueck={() => wechsle(undefined)}
        fortschritt={`${kennung} · ${bericht.kopf.projekt || 'Ohne Bezeichnung'}`}
      />

      <Reiterleiste
        reiter={[
          ...BLAETTER.map((eintrag) => ({
            id: eintrag.id,
            kurz: eintrag.kurz,
            stand: blattStand(eintrag.id, bericht, fehlt),
          })),
          // Letzter Reiter: zurück in die Kacheln. Ohne ihn führt aus der
          // Reiterleiste nur der Pfeil oben links heraus.
          { id: 'uebersicht' as const, kurz: 'Übersicht', stand: { art: 'neutral' as const, text: '' } },
        ]}
        aktiv={aktuell.id}
        waehle={(ziel) => wechsle(ziel === 'uebersicht' ? undefined : ziel)}
      />

      <main className="flex flex-1 flex-col gap-5 p-4 pb-28">
        {aktuell.inhalt({
          bericht,
          aendern,
          zeigeBlatt: (ziel) => wechsle(ziel),
          zeigeAnsicht: verlasse,
        })}
      </main>

      {/* Fußleiste klebt unten – erreichbar mit dem Daumen, auch einhändig. */}
      <nav className="bg-sika-hell/95 border-sika-schwarz/10 sticky bottom-0 flex gap-3 border-t p-3 backdrop-blur">
        <Knopf art="zweit" breit onClick={() => wechsle(vorheriges?.id)}>
          {vorheriges ? 'Zurück' : 'Übersicht'}
        </Knopf>
        <Knopf art="haupt" breit onClick={() => wechsle(naechstes?.id)}>
          {naechstes ? 'Weiter' : 'Übersicht'}
        </Knopf>
      </nav>
    </div>
  )
}
