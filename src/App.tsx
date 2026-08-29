import { useState } from 'react'
import { AktualisierungsHinweis } from './components/AktualisierungsHinweis'
import { BerichtBildschirm } from './screens/BerichtBildschirm'
import { BerichteBildschirm } from './screens/BerichteBildschirm'
import { DatenschutzBildschirm } from './screens/DatenschutzBildschirm'
import { EinstellungenBildschirm } from './screens/EinstellungenBildschirm'
import { StartBildschirm } from './screens/StartBildschirm'
import { rueckkehrErkannt } from './lib/onedrive'
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
  | { name: 'datenschutz' }
  /** Ohne `blatt` steht die Kachelübersicht des Berichts. */
  | { name: 'bericht'; id: string; blatt?: BlattId }

export default function App() {
  // Nach der OneDrive-Anmeldung kommt der Browser mit einer Antwort von
  // Microsoft zurück. Die gehört in die Einstellungen – dort ist die
  // Verbindung angestoßen worden, dort steht danach das Ergebnis.
  const [ansicht, setAnsicht] = useState<Ansicht>(() =>
    rueckkehrErkannt() ? { name: 'einstellungen' } : { name: 'start' },
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      {ansicht.name === 'start' && <StartBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'liste' && <BerichteBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'einstellungen' && <EinstellungenBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'datenschutz' && <DatenschutzBildschirm zeige={setAnsicht} />}
      {ansicht.name === 'bericht' && (
        <BerichtBildschirm id={ansicht.id} blatt={ansicht.blatt} zeige={setAnsicht} />
      )}
      <AktualisierungsHinweis />
    </div>
  )
}
