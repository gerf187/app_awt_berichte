/**
 * Verbrauch und Gesamtmenge im Aufbau.
 *
 * Auf der Baustelle wird mal das eine, mal das andere genannt: „1,2 kg/m²"
 * oder „wir haben 500 kg verarbeitet". Beides ist erlaubt – aus der Fläche
 * rechnet die App die jeweils andere Größe aus.
 *
 * Gespeichert wird immer in kg/m². Die Anzeige folgt der Praxis: unter
 * 1,00 kg spricht man von Gramm, darüber von Kilogramm.
 */

/** Ab diesem Wert kann die Eingabe nur Gramm gemeint haben – 20 kg/m² gibt es nicht. */
const GRAMM_AB = 10

/** Unter diesem Verbrauch wird in g/m² angezeigt. */
const GRAMM_UNTER = 1

/** „1,8" oder „1.8" als Zahl. Leeres oder Unsinn ergibt null. */
export function zahlLesen(text: string): number | null {
  const bereinigt = text.replace(',', '.').trim()
  if (!bereinigt) return null
  const zahl = Number(bereinigt)
  return Number.isFinite(zahl) && zahl >= 0 ? zahl : null
}

/**
 * Zahl mit Komma und ohne überflüssige Nullen: 1.2 → „1,2", 504 → „504".
 * Abgeschnitten wird nur hinter dem Komma – sonst würde aus 200 eine 2.
 */
export function zahlSchreiben(wert: number, stellen = 2): string {
  const text = wert.toFixed(stellen)
  const gekuerzt = text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text
  return gekuerzt.replace('.', ',')
}

/**
 * Eine Verbrauchseingabe in kg/m².
 *
 * Die Einheit springt automatisch um: Wer „200" tippt, meint 200 g/m² –
 * 200 kg/m² wäre eine Betondecke. Wer „1,2" tippt, meint kg/m².
 */
export function verbrauchLesen(eingabe: string): number | null {
  const zahl = zahlLesen(eingabe)
  if (zahl === null) return null
  return zahl >= GRAMM_AB ? zahl / 1000 : zahl
}

/** Verbrauch für die Anzeige: „1,2 kg/m²" oder „200 g/m²". */
export function verbrauchAnzeigen(kgProM2: number): string {
  if (kgProM2 > 0 && kgProM2 < GRAMM_UNTER) return `${zahlSchreiben(kgProM2 * 1000, 0)} g/m²`
  return `${zahlSchreiben(kgProM2)} kg/m²`
}

/** Menge für die Anzeige: „504 kg" oder „840 g". */
export function mengeAnzeigen(kg: number): string {
  if (kg > 0 && kg < GRAMM_UNTER) return `${zahlSchreiben(kg * 1000, 0)} g`
  return `${zahlSchreiben(kg)} kg`
}

/** Gesamtmenge in kg aus Verbrauch und Fläche. */
export function gesamtmengeRechnen(kgProM2: number, flaecheM2: number): number {
  return kgProM2 * flaecheM2
}

/** Verbrauch in kg/m² aus Gesamtmenge und Fläche. Ohne Fläche nicht möglich. */
export function verbrauchRechnen(gesamtKg: number, flaecheM2: number): number | null {
  if (flaecheM2 <= 0) return null
  return gesamtKg / flaecheM2
}

/**
 * Die Zeile im Bericht: „1,2 kg/m² · 420 m² · gesamt 504 kg".
 * Was fehlt, fällt weg – keine leeren Einheiten.
 */
export function verbrauchszeile(zeile: {
  verbrauch: string
  gesamtmenge: string
  flaeche: string
}): string {
  const verbrauch = zahlLesen(zeile.verbrauch)
  const gesamt = zahlLesen(zeile.gesamtmenge)
  const flaeche = zahlLesen(zeile.flaeche)

  return [
    verbrauch !== null ? verbrauchAnzeigen(verbrauch) : '',
    flaeche !== null ? `${zahlSchreiben(flaeche)} m²` : '',
    gesamt !== null ? `gesamt ${mengeAnzeigen(gesamt)}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
