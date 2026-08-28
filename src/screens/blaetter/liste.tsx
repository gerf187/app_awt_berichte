import type { ReactNode } from 'react'
import type { Ansicht } from '../../App'
import type { Bericht, BlattId } from '../../lib/typen'
import { AbschlussBlatt } from './AbschlussBlatt'
import { AufbauBlatt } from './AufbauBlatt'
import { FotoBlatt } from './FotoBlatt'
import { KlimaBlatt } from './KlimaBlatt'
import { KopfdatenBlatt } from './KopfdatenBlatt'
import { PruefungenBlatt } from './PruefungenBlatt'
import { TextBlatt } from './TextBlatt'
import { ThematikBlatt } from './ThematikBlatt'
import { UntergrundBlatt } from './UntergrundBlatt'

/** Änderungsfunktion, die jedes Blatt bekommt. */
export type Aendern = (veraenderung: (vorher: Bericht) => Bericht) => void

export type BlattEigenschaften = {
  bericht: Bericht
  aendern: Aendern
  /** Sprung in ein anderes Blatt – der Abschluss führt damit zu fehlenden Angaben. */
  zeigeBlatt: (id: BlattId) => void
  /** Raus aus dem Bericht – der Abschluss führt damit zur Startseite zurück. */
  zeigeAnsicht: (ansicht: Ansicht) => void
}

export type Blatt = {
  id: BlattId
  /** Überschrift im Blatt und auf der Kachel. */
  titel: string
  /** Kurzform für den Reiter – muss auf ein Handy passen. */
  kurz: string
  inhalt: (eigenschaften: BlattEigenschaften) => ReactNode
}

/**
 * Ein Thema pro Blatt. Reihenfolge und Titel stammen aus der Spezifikation;
 * Übersicht und Reiterleiste lesen hier nur ab. Welches Zeichen ein Blatt
 * bekommt, steht in `src/lib/blattstand.ts`.
 */
export const BLAETTER: Blatt[] = [
  { id: 'kopf', titel: 'Kopfdaten', kurz: 'Kopfdaten', inhalt: (p) => <KopfdatenBlatt {...p} /> },
  {
    id: 'thematik',
    titel: 'Thematik & Anwesende',
    kurz: 'Thematik',
    inhalt: (p) => <ThematikBlatt {...p} />,
  },
  {
    id: 'untergrund',
    titel: 'Untergrund',
    kurz: 'Untergrund',
    inhalt: (p) => <UntergrundBlatt {...p} />,
  },
  {
    id: 'pruefungen',
    titel: 'Prüfungen',
    kurz: 'Prüfungen',
    inhalt: (p) => <PruefungenBlatt {...p} />,
  },
  { id: 'klima', titel: 'Klimawerte', kurz: 'Klima', inhalt: (p) => <KlimaBlatt {...p} /> },
  { id: 'aufbau', titel: 'Aufbau', kurz: 'Aufbau', inhalt: (p) => <AufbauBlatt {...p} /> },
  {
    id: 'text',
    titel: 'Bericht & Feststellungen',
    kurz: 'Bericht',
    inhalt: (p) => <TextBlatt {...p} />,
  },
  { id: 'fotos', titel: 'Fotos', kurz: 'Fotos', inhalt: (p) => <FotoBlatt {...p} /> },
  {
    id: 'abschluss',
    titel: 'Abschluss',
    kurz: 'Abschluss',
    inhalt: (p) => <AbschlussBlatt {...p} />,
  },
]

/** Findet ein Blatt; unbekannte Kennungen landen auf dem ersten. */
export function blattFinden(id: BlattId | undefined): Blatt {
  return BLAETTER.find((blatt) => blatt.id === id) ?? BLAETTER[0]
}
