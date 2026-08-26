import { useState } from 'react'
import { AktualisierungsHinweis } from './components/AktualisierungsHinweis'
import { BerichtBildschirm } from './screens/BerichtBildschirm'
import { BerichteBildschirm } from './screens/BerichteBildschirm'
import { EinstellungenBildschirm } from './screens/EinstellungenBildschirm'
import { StartBildschirm } from './screens/StartBildschirm'
import type { BlattId } from './lib/typen'

/**
 * Navigation ohne Router-Bibliothek: die App hat wenige Ansichten und läuft
 * unter einem Unterpfad auf GitHub Pages – ein Zustand im Speicher genügt und
 * spart Kilobytes im Offline-Cache.
 */
export type Ansicht =
  | { name: 'start' }
  | { name: 'liste' }
  | { name: 'einstellungen' }
  /** Ohne `blatt` steht die Kachelübersicht des Berichts. */
  | { name: 'bericht'; id: string; blatt?: BlattId }

export default function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>({ name: 'start' })

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      {ansicht.name === 'start' && <StartBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'liste' && <BerichteBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'einstellungen' && <EinstellungenBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'bericht' && (
        <BerichtBildschirm id={ansicht.id} blatt={ansicht.blatt} zeige={setAnsicht} />
      )}
      <AktualisierungsHinweis />
    </div>
  )
}
