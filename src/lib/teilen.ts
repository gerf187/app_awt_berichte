import { alsAnzeigedatum } from './bericht'
import type { Bericht } from './typen'

/**
 * Versand der fertigen Datei.
 *
 * Erster Weg ist die Teilen-Funktion des Handys (Web Share API) – damit
 * landet die Datei direkt in Mail, WhatsApp oder Teams. Kann der Browser das
 * nicht, wird die Datei heruntergeladen und eine vorbereitete Mail geöffnet.
 */

/** Prüft zur Laufzeit, ob dieses Gerät die Datei wirklich teilen kann. */
export function kannDateiTeilen(datei: File): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false
  try {
    return navigator.canShare({ files: [datei] })
  } catch {
    return false
  }
}

/**
 * Teilen anstoßen. Gibt `false` zurück, wenn der Nutzer abbricht oder das
 * Gerät doch nicht mitspielt – dann greift der Fallback.
 */
export async function dateiTeilen(datei: File, titel: string, text: string): Promise<boolean> {
  if (!kannDateiTeilen(datei)) return false
  try {
    await navigator.share({ files: [datei], title: titel, text })
    return true
  } catch {
    // Abbruch durch den Nutzer ist kein Fehler, sondern eine Entscheidung.
    return false
  }
}

/** Datei im Browser herunterladen. */
export function herunterladen(blob: Blob, name: string): void {
  const adresse = URL.createObjectURL(blob)
  const verweis = document.createElement('a')
  verweis.href = adresse
  verweis.download = name
  verweis.click()
  // Erst freigeben, wenn der Browser den Download übernommen hat.
  setTimeout(() => URL.revokeObjectURL(adresse), 10_000)
}

/** Betreffzeile: `Baustellenbericht <Nummer> – <Projekt>` */
export function betreff(bericht: Bericht): string {
  const projekt = bericht.kopf.projekt.trim()
  const kopf = `Baustellenbericht ${bericht.kopf.berichtsnummer}`
  return projekt ? `${kopf} – ${projekt}` : kopf
}

/** Kurze Zusammenfassung für den Mailtext. */
export function mailtext(bericht: Bericht, mitAnhangHinweis: boolean): string {
  const zeilen = [
    'Guten Tag,',
    '',
    'anbei der Baustellenbericht:',
    `Nummer: ${bericht.kopf.berichtsnummer}`,
    `Datum: ${alsAnzeigedatum(bericht.kopf.datum)}`,
  ]

  if (bericht.kopf.projekt.trim()) zeilen.push(`Projekt: ${bericht.kopf.projekt}`)
  if (bericht.kopf.verarbeiter.trim()) zeilen.push(`Verarbeiter: ${bericht.kopf.verarbeiter}`)
  if (bericht.klima.some((messung) => messung.warnung)) {
    zeilen.push('', 'Hinweis: Der Abstand zum Taupunkt war bei mindestens einer Messung zu gering.')
  }

  if (mitAnhangHinweis) {
    zeilen.push(
      '',
      'Bitte die heruntergeladene Datei noch von Hand an diese Mail anhängen –',
      'der Browser darf das nicht selbst tun.',
    )
  }

  zeilen.push('', 'Freundliche Grüße', bericht.kopf.awt)
  return zeilen.join('\n')
}

/** Fertige `mailto:`-Adresse mit Empfänger, Betreff und Text. */
export function mailtoAdresse(bericht: Bericht, empfaenger: string, mitAnhangHinweis = true): string {
  const felder = new URLSearchParams({
    subject: betreff(bericht),
    body: mailtext(bericht, mitAnhangHinweis),
  })
  // URLSearchParams schreibt Leerzeichen als „+“; in mailto gehört %20 hin.
  return `mailto:${encodeURIComponent(empfaenger)}?${felder.toString().replace(/\+/g, '%20')}`
}
