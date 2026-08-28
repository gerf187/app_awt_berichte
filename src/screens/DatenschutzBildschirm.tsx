import type { Ansicht } from '../App'
import { Kopfzeile } from '../components/Kopfzeile'
import { DATENSCHUTZ, DATENSCHUTZ_STAND } from '../data/datenschutz'

/**
 * Datenschutz-Hinweise für den Kollegen auf der Baustelle.
 *
 * Der Text steht in `src/data/datenschutz.ts`, damit die Anleitung dieselben
 * Sätze druckt. Die förmliche Fassung mit Rechtsgrundlagen und technischen
 * Maßnahmen liegt als DATENSCHUTZ.md im Projekt.
 */
export function DatenschutzBildschirm({ zeige }: { zeige: (ansicht: Ansicht) => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile titel="Datenschutz" zurueck={() => zeige({ name: 'einstellungen' })} />

      <main className="flex flex-1 flex-col gap-5 p-4">
        {DATENSCHUTZ.map((abschnitt) => (
          <section
            key={abschnitt.titel}
            className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4"
          >
            <h2 className="text-lg font-bold">{abschnitt.titel}</h2>
            {abschnitt.bloecke.map((block, nummer) =>
              block.art === 'text' ? (
                <p key={nummer} className="leading-relaxed">
                  {block.inhalt}
                </p>
              ) : (
                <ul key={nummer} className="flex list-disc flex-col gap-2 pl-5">
                  {block.punkte.map((punkt) => (
                    <li key={punkt} className="leading-relaxed">
                      {punkt}
                    </li>
                  ))}
                </ul>
              ),
            )}
          </section>
        ))}

        <p className="text-sika-grau pb-4 text-center text-sm">Stand: {DATENSCHUTZ_STAND}</p>
      </main>
    </div>
  )
}
