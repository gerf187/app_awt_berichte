import { useRef, useState } from 'react'
import { Textbereich } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { Spracheingabe } from '../../components/Spracheingabe'
import { fotoAufbereiten } from '../../lib/bilder'
import { neueId } from '../../lib/bericht'
import { anfuegen } from '../../utils/cleanDictation'
import type { BlattEigenschaften } from './liste'

export function FotoBlatt({ bericht, aendern }: BlattEigenschaften) {
  const kamera = useRef<HTMLInputElement>(null)
  const galerie = useRef<HTMLInputElement>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')
  /**
   * Frisch aufgenommene Fotos, die noch auf ihre Beschreibung warten.
   *
   * Direkt nach dem Auslösen weiß man noch, was auf dem Bild ist – eine
   * Stunde später auf dem Parkplatz nicht mehr. Deshalb fragt die App sofort.
   */
  const [zuBeschreiben, setZuBeschreiben] = useState<string[]>([])

  async function aufnehmen(dateien: FileList) {
    setLaeuft(true)
    setFehler('')
    const neu: string[] = []
    try {
      for (const datei of Array.from(dateien)) {
        const dataUrl = await fotoAufbereiten(datei)
        const id = neueId()
        neu.push(id)
        aendern((vorher) => ({
          ...vorher,
          fotos: [
            ...vorher.fotos,
            {
              id,
              dataUrl,
              beschreibung: '',
              aufgenommenAm: new Date().toISOString(),
            },
          ],
        }))
      }
    } catch {
      setFehler('Ein Foto konnte nicht verarbeitet werden. Bitte noch einmal versuchen.')
    } finally {
      setLaeuft(false)
      if (neu.length > 0) setZuBeschreiben((vorher) => [...vorher, ...neu])
    }
  }

  function beschreiben(id: string, text: string) {
    aendern((vorher) => ({
      ...vorher,
      fotos: vorher.fotos.map((foto) => (foto.id === id ? { ...foto, beschreibung: text } : foto)),
    }))
  }

  function diktiertAnhaengen(id: string, gesprochen: string) {
    aendern((vorher) => ({
      ...vorher,
      fotos: vorher.fotos.map((foto) =>
        foto.id === id ? { ...foto, beschreibung: anfuegen(foto.beschreibung, gesprochen) } : foto,
      ),
    }))
  }

  // Ein inzwischen gelöschtes Foto wartet auf nichts mehr.
  const wartend = zuBeschreiben
    .map((id) => bericht.fotos.find((foto) => foto.id === id))
    .filter((foto) => foto !== undefined)
  const aktuell = wartend[0]

  function verschieben(index: number, richtung: -1 | 1) {
    const ziel = index + richtung
    aendern((vorher) => {
      if (ziel < 0 || ziel >= vorher.fotos.length) return vorher
      const fotos = [...vorher.fotos]
      ;[fotos[index], fotos[ziel]] = [fotos[ziel], fotos[index]]
      return { ...vorher, fotos }
    })
  }

  function entfernen(id: string) {
    aendern((vorher) => ({ ...vorher, fotos: vorher.fotos.filter((foto) => foto.id !== id) }))
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Knopf art="haupt" breit disabled={laeuft} onClick={() => kamera.current?.click()}>
          Foto aufnehmen
        </Knopf>
        <Knopf art="zweit" breit disabled={laeuft} onClick={() => galerie.current?.click()}>
          Aus Galerie wählen
        </Knopf>
        <input
          ref={kamera}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const dateien = e.target.files
            if (dateien?.length) void aufnehmen(dateien)
            e.target.value = ''
          }}
        />
        <input
          ref={galerie}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const dateien = e.target.files
            if (dateien?.length) void aufnehmen(dateien)
            e.target.value = ''
          }}
        />
      </div>

      {laeuft && <p role="status">Foto wird verkleinert …</p>}
      {fehler && (
        <p role="alert" className="text-sika-rot font-semibold">
          {fehler}
        </p>
      )}

      {bericht.fotos.length === 0 && !laeuft && (
        <p className="text-sika-grau">Noch kein Foto im Bericht.</p>
      )}

      <ul className="flex flex-col gap-4">
        {bericht.fotos.map((foto, index) => (
          <li
            key={foto.id}
            className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-3"
          >
            <img
              src={foto.dataUrl}
              alt={foto.beschreibung || `Foto ${index + 1}`}
              className="max-h-72 w-full rounded-lg object-contain"
            />
            <Textbereich
              beschriftung={`Beschreibung zu Foto ${index + 1}`}
              rows={2}
              value={foto.beschreibung}
              onChange={(e) => beschreiben(foto.id, e.target.value)}
              placeholder="Was ist zu sehen?"
              nebenBeschriftung={
                <Spracheingabe anhaengen={(gesprochen) => diktiertAnhaengen(foto.id, gesprochen)} />
              }
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-sika-grau text-sm font-semibold">
                Foto {index + 1} von {bericht.fotos.length}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => verschieben(index, -1)}
                  disabled={index === 0}
                  aria-label={`Foto ${index + 1} nach oben`}
                  className="tippziel active:bg-sika-hell w-12 rounded-xl text-2xl disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => verschieben(index, 1)}
                  disabled={index === bericht.fotos.length - 1}
                  aria-label={`Foto ${index + 1} nach unten`}
                  className="tippziel active:bg-sika-hell w-12 rounded-xl text-2xl disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => entfernen(foto.id)}
                  aria-label={`Foto ${index + 1} löschen`}
                  className="tippziel text-sika-grau active:text-sika-rot w-12 rounded-xl text-2xl"
                >
                  🗑
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {aktuell && (
        <div
          className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-black/50 p-3"
          role="dialog"
          aria-modal
          aria-label="Foto beschreiben"
        >
          {/* Wie beim Aufbau: unten am Daumen, nach oben scrollbar. */}
          <div className="mx-auto mt-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl bg-white p-4">
            <h2 className="text-xl font-bold">
              Foto {bericht.fotos.findIndex((foto) => foto.id === aktuell.id) + 1} beschreiben
            </h2>
            <img
              src={aktuell.dataUrl}
              alt=""
              className="max-h-56 w-full rounded-lg object-contain"
            />
            <Textbereich
              beschriftung="Was ist zu sehen?"
              rows={3}
              autoFocus
              value={aktuell.beschreibung}
              onChange={(e) => beschreiben(aktuell.id, e.target.value)}
              placeholder="z. B. Blasenbildung im Randbereich, Achse C"
              nebenBeschriftung={
                <Spracheingabe
                  key={aktuell.id}
                  anhaengen={(gesprochen) => diktiertAnhaengen(aktuell.id, gesprochen)}
                />
              }
            />
            <div className="flex flex-col gap-3">
              <Knopf
                art="haupt"
                breit
                onClick={() =>
                  setZuBeschreiben((vorher) => vorher.filter((id) => id !== aktuell.id))
                }
              >
                {wartend.length > 1 ? `Weiter (noch ${wartend.length - 1})` : 'Fertig'}
              </Knopf>
              <Knopf
                art="zweit"
                breit
                disabled={laeuft}
                onClick={() => {
                  setZuBeschreiben((vorher) => vorher.filter((id) => id !== aktuell.id))
                  kamera.current?.click()
                }}
              >
                Nächstes Foto aufnehmen
              </Knopf>
              {/* Später geht auch: die Beschreibung steht weiter unter jedem Foto. */}
              <Knopf art="still" breit onClick={() => setZuBeschreiben([])}>
                Später beschreiben
              </Knopf>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
