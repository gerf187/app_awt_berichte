import type { Ansicht } from '../App'
import { Knopf } from '../components/Knopf'
import { Kopfzeile } from '../components/Kopfzeile'
import { useBericht } from '../lib/useBericht'
import { SCHRITTE } from './schritte/liste'

export function Assistent({
  id,
  schritt,
  zeige,
}: {
  id: string
  schritt: number
  zeige: (ansicht: Ansicht) => void
}) {
  const { bericht, geladen, aendern, jetztSchreiben } = useBericht(id)

  const nummer = Math.min(Math.max(schritt, 1), SCHRITTE.length)
  const aktuell = SCHRITTE[nummer - 1]

  function wechsle(neueNummer: number) {
    jetztSchreiben()
    if (neueNummer < 1) {
      zeige({ name: 'liste' })
      return
    }
    zeige({ name: 'bericht', id, schritt: neueNummer })
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

  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile
        titel={aktuell.titel}
        zurueck={() => wechsle(nummer - 1)}
        fortschritt={`Schritt ${nummer} von ${SCHRITTE.length} · Bericht ${bericht.kopf.berichtsnummer}`}
      />

      {/* Balken statt Prozentzahl: auf einen Blick erfassbar. */}
      <div className="bg-sika-schwarz/10 h-1.5 w-full" aria-hidden>
        <div
          className="bg-sika-gelb h-full transition-all"
          style={{ width: `${(nummer / SCHRITTE.length) * 100}%` }}
        />
      </div>

      <main className="flex flex-1 flex-col gap-5 p-4 pb-28">
        {aktuell.inhalt({ bericht, aendern })}
      </main>

      {/* Fußleiste klebt unten – erreichbar mit dem Daumen, auch einhändig. */}
      <nav className="bg-sika-hell/95 border-sika-schwarz/10 sticky bottom-0 flex gap-3 border-t p-3 backdrop-blur">
        <Knopf art="zweit" breit onClick={() => wechsle(nummer - 1)}>
          Zurück
        </Knopf>
        <Knopf
          art="haupt"
          breit
          disabled={nummer === SCHRITTE.length}
          onClick={() => wechsle(nummer + 1)}
        >
          Weiter
        </Knopf>
      </nav>
    </div>
  )
}
