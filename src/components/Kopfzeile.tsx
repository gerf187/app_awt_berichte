import type { ReactNode } from 'react'

/**
 * Kopfzeile mit Zurück-Pfeil. Klebt oben fest, damit der Weg zurück
 * auch bei langen Formularen mit dem Daumen erreichbar bleibt.
 */
export function Kopfzeile({
  titel,
  zurueck,
  rechts,
  fortschritt,
}: {
  titel: string
  zurueck: () => void
  rechts?: ReactNode
  /** Text der Fortschrittsanzeige, z. B. „Schritt 4 von 8". */
  fortschritt?: string
}) {
  return (
    <header className="bg-sika-hell/95 sticky top-0 z-20 backdrop-blur">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={zurueck}
          aria-label="Zurück"
          className="tippziel active:bg-sika-schwarz/10 flex w-12 items-center justify-center rounded-xl text-2xl"
        >
          ←
        </button>
        <h1 className="flex-1 truncate text-xl font-bold">{titel}</h1>
        {rechts}
      </div>
      {fortschritt && (
        <p className="text-sika-grau px-4 pb-2 text-sm font-semibold">{fortschritt}</p>
      )}
    </header>
  )
}
