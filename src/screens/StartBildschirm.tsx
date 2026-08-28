import { useState } from 'react'
import type { Ansicht } from '../App'
import { Knopf } from '../components/Knopf'
import { berichtAnlegen } from '../lib/db'

export function StartBildschirm({ zeige }: { zeige: (ansicht: Ansicht) => void }) {
  const [laeuft, setLaeuft] = useState(false)

  async function neuerBericht() {
    setLaeuft(true)
    try {
      const bericht = await berichtAnlegen()
      // Direkt ins erste Blatt: bei einem frischen Bericht ist die Kachelübersicht
      // nur ein Zwischenschritt – ausgefüllt ist noch nichts.
      zeige({ name: 'bericht', id: bericht.id, blatt: 'kopf' })
    } finally {
      setLaeuft(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3">
        <img src="favicon.svg" alt="" className="h-20 w-20" />
        <h1 className="text-3xl font-bold">Baustellenbericht</h1>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Knopf art="haupt" breit disabled={laeuft} onClick={() => void neuerBericht()}>
          Neuer Bericht
        </Knopf>
        <Knopf art="zweit" breit onClick={() => zeige({ name: 'liste' })}>
          Meine Berichte
        </Knopf>
      </div>

      <Knopf art="still" onClick={() => zeige({ name: 'einstellungen' })}>
        Einstellungen
      </Knopf>
    </main>
  )
}
