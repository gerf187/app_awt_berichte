import { useEffect, useState } from 'react'
import {
  OneDriveFehler,
  ordnerAnlegen,
  ordnerAuflisten,
  ordnerpfad,
  type OneDriveOrdner,
} from '../lib/onedrive'
import { Knopf } from './Knopf'

/**
 * Ordner in OneDrive auswählen – durch die eigenen Ordner blättern statt
 * einen Pfad abzutippen, den man auf dem Handy doch nur falsch schreibt.
 *
 * Antippen öffnet einen Ordner, „Diesen Ordner nehmen" übernimmt den gerade
 * offenen. Ein neuer Ordner entsteht im gerade offenen und wird sofort
 * geöffnet.
 */
export function OrdnerWahl({
  start,
  waehlen,
  schliessen,
}: {
  /** Der bisher gewählte Ordner – dort fängt die Auswahl an. */
  start: string
  waehlen: (pfad: string) => void
  schliessen: () => void
}) {
  const [pfad, setPfad] = useState(() => ordnerpfad(start))
  const [ordner, setOrdner] = useState<OneDriveOrdner[] | null>(null)
  const [fehler, setFehler] = useState('')
  const [neuerName, setNeuerName] = useState('')
  const [anlegenOffen, setAnlegenOffen] = useState(false)

  /** In einen anderen Ordner wechseln: die alte Liste gilt dann nicht mehr. */
  function oeffne(neu: string) {
    setPfad(neu)
    setOrdner(null)
    setFehler('')
  }

  useEffect(() => {
    let aktuell = true
    ordnerAuflisten(pfad)
      .then((liste) => {
        if (aktuell) setOrdner(liste)
      })
      .catch((grund: unknown) => {
        if (!aktuell) return
        // Den bisher gewählten Ordner gibt es (noch) nicht – er entsteht erst
        // beim ersten Hochladen. Dann oben anfangen statt mit einem Fehler.
        if (pfad && pfad === ordnerpfad(start)) {
          setPfad('')
          return
        }
        setFehler(
          grund instanceof OneDriveFehler
            ? grund.message
            : 'Die Ordner ließen sich nicht laden. Besteht eine Internetverbindung?',
        )
      })
    return () => {
      aktuell = false
    }
  }, [pfad, start])

  const teile = pfad ? pfad.split('/') : []

  async function anlegen() {
    const name = ordnerpfad(neuerName.replace(/\//g, ' '))
    if (!name) return
    // Gibt es ihn schon, einfach hinein – ein zweiter Ordner gleichen Namens
    // wäre nur verwirrend.
    if (ordner?.some((eintrag) => eintrag.name.toLowerCase() === name.toLowerCase())) {
      oeffne([pfad, name].filter(Boolean).join('/'))
    } else {
      try {
        oeffne(await ordnerAnlegen(pfad, name))
      } catch (grund) {
        setFehler(
          grund instanceof OneDriveFehler ? grund.message : 'Der Ordner ließ sich nicht anlegen.',
        )
        return
      }
    }
    setNeuerName('')
    setAnlegenOffen(false)
  }

  return (
    <div
      className="unten-frei fixed inset-0 z-30 flex flex-col overflow-y-auto overscroll-contain bg-black/50 px-3 pt-3"
      role="dialog"
      aria-modal
      aria-label="Ordner in OneDrive wählen"
    >
      <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-4">
        <h2 className="text-xl font-bold">Ordner wählen</h2>

        {/* Wo man gerade ist – jedes Stück führt dorthin zurück. */}
        <nav aria-label="Pfad" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => oeffne('')}
            className="tippziel rounded-lg px-2 underline"
          >
            OneDrive
          </button>
          {teile.map((teil, stelle) => (
            <span key={stelle} className="flex items-center gap-1">
              <span aria-hidden className="text-sika-grau">
                ›
              </span>
              <button
                type="button"
                onClick={() => oeffne(teile.slice(0, stelle + 1).join('/'))}
                className="tippziel rounded-lg px-2 break-all underline"
              >
                {teil}
              </button>
            </span>
          ))}
        </nav>

        {fehler && (
          <p role="alert" className="font-semibold">
            {fehler}
          </p>
        )}

        {ordner === null && !fehler && (
          <p role="status" className="text-sika-grau">
            Ordner werden geladen …
          </p>
        )}

        {ordner && (
          <ul className="border-sika-schwarz/10 flex max-h-[45vh] flex-col overflow-y-auto rounded-xl border-2">
            {ordner.length === 0 && (
              <li className="text-sika-grau p-4 text-sm">Hier sind keine Unterordner.</li>
            )}
            {ordner.map((eintrag) => (
              <li key={eintrag.name} className="border-sika-schwarz/10 border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => oeffne([pfad, eintrag.name].filter(Boolean).join('/'))}
                  className="tippziel active:bg-sika-hell flex w-full items-center gap-3 px-4 py-2 text-left"
                >
                  <span aria-hidden>📁</span>
                  <span className="min-w-0 flex-1 break-words">{eintrag.name}</span>
                  <span aria-hidden className="text-sika-grau">
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {anlegenOffen ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold" htmlFor="neuer-ordner">
              Name des neuen Ordners
            </label>
            <div className="flex gap-2">
              <input
                id="neuer-ordner"
                autoFocus
                value={neuerName}
                onChange={(e) => setNeuerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void anlegen()
                }}
                placeholder="z. B. Baustellenberichte"
                className="border-sika-schwarz/15 focus:border-sika-schwarz tippziel min-w-0 flex-1 rounded-xl border-2 bg-white px-4 py-3 text-lg"
              />
              <Knopf art="zweit" onClick={() => void anlegen()}>
                Anlegen
              </Knopf>
            </div>
          </div>
        ) : (
          <Knopf
            art="zweit"
            onClick={() => setAnlegenOffen(true)}
            disabled={ordner === null}
            className="self-start"
          >
            + Neuer Ordner
          </Knopf>
        )}

        <div className="flex flex-col gap-3 pt-1">
          {/* Die oberste Ebene ist nicht wählbar: lose Berichte zwischen allen
              anderen Dateien findet niemand wieder. */}
          <Knopf
            art="haupt"
            breit
            disabled={ordner === null || !pfad}
            onClick={() => waehlen(pfad)}
          >
            {pfad ? `„${teile[teile.length - 1]}" nehmen` : 'Erst einen Ordner öffnen'}
          </Knopf>
          <Knopf art="zweit" breit onClick={schliessen}>
            Abbrechen
          </Knopf>
        </div>
      </div>
    </div>
  )
}
