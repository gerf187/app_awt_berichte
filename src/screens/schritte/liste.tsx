import type { ReactNode } from 'react'
import type { Bericht } from '../../lib/typen'
import { AbschlussSchritt } from './AbschlussSchritt'
import { AufbauSchritt } from './AufbauSchritt'
import { FotoSchritt } from './FotoSchritt'
import { KlimaSchritt } from './KlimaSchritt'
import { KopfdatenSchritt } from './KopfdatenSchritt'
import { TextSchritt } from './TextSchritt'
import { ThematikSchritt } from './ThematikSchritt'
import { UntergrundSchritt } from './UntergrundSchritt'

/** Änderungsfunktion, die jeder Schritt bekommt. */
export type Aendern = (veraenderung: (vorher: Bericht) => Bericht) => void

export type SchrittEigenschaften = {
  bericht: Bericht
  aendern: Aendern
}

/**
 * Ein Thema pro Bildschirm. Reihenfolge und Titel stammen aus der
 * Spezifikation; der Assistent liest hier nur ab.
 */
export const SCHRITTE: { titel: string; inhalt: (p: SchrittEigenschaften) => ReactNode }[] = [
  { titel: 'Kopfdaten', inhalt: (p) => <KopfdatenSchritt {...p} /> },
  { titel: 'Thematik & Anwesende', inhalt: (p) => <ThematikSchritt {...p} /> },
  { titel: 'Untergrund', inhalt: (p) => <UntergrundSchritt {...p} /> },
  { titel: 'Klimawerte', inhalt: (p) => <KlimaSchritt {...p} /> },
  { titel: 'Aufbau', inhalt: (p) => <AufbauSchritt {...p} /> },
  { titel: 'Bericht & Feststellungen', inhalt: (p) => <TextSchritt {...p} /> },
  { titel: 'Fotos', inhalt: (p) => <FotoSchritt {...p} /> },
  { titel: 'Abschluss', inhalt: (p) => <AbschlussSchritt {...p} /> },
]
