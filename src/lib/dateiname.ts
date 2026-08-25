import type { Bericht } from './typen'

/**
 * Umlaute und Sonderzeichen ersetzen. Dateinamen wandern über Mail-Anhänge
 * und fremde Systeme – dort sind „ä" und „/" nichts als Ärger.
 */
export function entschaerfen(text: string): string {
  return text
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ß/g, 'ss')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * Dateiname für PDF und Word – gleiches Schema, nur die Endung unterscheidet:
 * `Baustellenbericht_<Nummer>_<Projekt>.<endung>`
 */
export function dateiname(bericht: Bericht, endung: 'pdf' | 'docx'): string {
  const teile = ['Baustellenbericht', entschaerfen(bericht.kopf.berichtsnummer)]
  const projekt = entschaerfen(bericht.kopf.projekt)
  if (projekt) teile.push(projekt)
  return `${teile.filter(Boolean).join('_')}.${endung}`
}
