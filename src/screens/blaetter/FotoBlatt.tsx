import { useRef, useState } from 'react'
import { Textbereich } from '../../components/Felder'
import { Knopf } from '../../components/Knopf'
import { Spracheingabe } from '../../components/Spracheingabe'
import { fotoAufbereiten } from '../../lib/bilder'
import { neueId } from '../../lib/bericht'
import type { BlattEigenschaften } from './liste'

export function FotoBlatt({ bericht, aendern }: BlattEigenschaften) {
  const kamera = useRef<HTMLInputElement>(null)
  const galerie = useRef<HTMLInputElement>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState('')

  async function aufnehmen(dateien: FileList) {
    setLaeuft(true)
    setFehler('')
    try {
      for (const datei of Array.from(dateien)) {
        const dataUrl = await fotoAufbereiten(datei)
        aendern((vorher) => ({
          ...vorher,
          fotos: [
            ...vorher.fotos,
            {
              id: neueId(),
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
    }
  }

  function beschreiben(id: string, text: string) {
    aendern((vorher) => ({
      ...vorher,
      fotos: vorher.fotos.map((foto) => (foto.id === id ? { ...foto, beschreibung: text } : foto)),
    }))
  }

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
                <Spracheingabe
                  anhaengen={(gesprochen) =>
                    beschreiben(
                      foto.id,
                      foto.beschreibung
                        ? `${foto.beschreibung.trimEnd()} ${gesprochen}`
                        : gesprochen,
                    )
                  }
                />
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
    </>
  )
}
