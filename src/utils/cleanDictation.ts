/**
 * Diktiertes glätten – auf dem Gerät, ohne Netz.
 *
 * Die Spracherkennung des Browsers liefert einen Wortstrom: gesprochene
 * Satzzeichen stehen als Wörter da („Komma"), Füllwörter sind mitgeschrieben,
 * Groß- und Kleinschreibung stimmt selten. Diese Funktion räumt das auf.
 *
 * Sie ist bewusst eine reine Funktion ohne Bibliothek, ohne Modell und ohne
 * Netzaufruf: Ein Baustellenbericht enthält Kunden- und Personendaten, und die
 * Zusage der App lautet, dass davon nichts das Gerät verlässt (DATENSCHUTZ.md).
 *
 * Was sie **nicht** anfasst: Messwerte („3,5 %", „1,8 N/mm²", „4,2 CM-%"),
 * Produktnamen („Sikafloor-264") und Wörter in Großbuchstaben („AWT", „CM").
 * Zweimal angewendet kommt dasselbe heraus wie einmal.
 */

/**
 * Füllwörter, die aus dem Diktat verschwinden.
 *
 * Bewusst kurz gehalten: Was hier steht, ist im Bericht nie eine Aussage.
 * Alles Fachliche bleibt stehen – lieber ein „genau" zu viel als ein
 * verlorener Messwert. Die Liste ist zum Erweitern gedacht.
 */
export const FILLER_WORDS = [
  'ähm...',
  'ähm',
  'äh',
  'öhm',
  'hm',
  'hmm',
  'mhm',
  'tja',
  'ne?',
  'nicht wahr',
  'also',
] as const

/** Gesprochenes Satzzeichen → geschriebenes. Reihenfolge: längstes zuerst. */
const SATZZEICHEN: readonly (readonly [string, string])[] = [
  ['Doppelpunkt', ':'],
  ['Fragezeichen', '?'],
  ['Ausrufezeichen', '!'],
  ['Bindestrich', '-'],
  ['Semikolon', ';'],
  ['Komma', ','],
  ['Punkt', '.'],
] as const

/** Sonderzeichen entschärfen und Leerzeichen großzügig nehmen („nicht  wahr"). */
function maskieren(wort: string): string {
  return wort.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ +/g, '\\s+')
}

/**
 * Nur als eigenständiges Wort ersetzen.
 *
 * `\b` hilft hier nicht: Für JavaScript ist „ä" kein Wortzeichen, „ähm" hätte
 * also gar keine Wortgrenze. Deshalb wird über Buchstaben und Ziffern selbst
 * geprüft.
 */
function alsWort(muster: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])${muster}(?![\\p{L}\\p{N}])`, 'giu')
}

export function cleanDictation(input: string): string {
  // a) Zeilenenden vereinheitlichen.
  let text = input.replace(/\r\n?/g, '\n').trim()
  if (!text) return ''

  // b) Gesprochene Satzzeichen. Die Dezimalzahl zuerst, sonst macht die
  //    Komma-Regel aus „3 Komma 5" ein „3, 5".
  text = text.replace(/(\d)\s+komma\s+(\d)/giu, '$1,$2')
  text = text.replace(alsWort('neuer\\s+Absatz'), '\n\n')
  text = text.replace(alsWort('neue\\s+Zeile'), '\n\n')
  text = text.replace(alsWort('Absatz'), '\n\n')
  text = text.replace(alsWort('Klammer\\s+auf'), '(')
  text = text.replace(alsWort('Klammer\\s+zu'), ')')
  for (const [wort, zeichen] of SATZZEICHEN) {
    text = text.replace(alsWort(wort), zeichen)
  }

  // c) Füllwörter. Längste zuerst, damit „ähm..." nicht als „ähm" plus drei
  //    übrig gebliebene Punkte endet.
  for (const wort of [...FILLER_WORDS].sort((a, b) => b.length - a.length)) {
    text = text.replace(alsWort(maskieren(wort)), '')
  }

  // d) Formatierung. `[ \t]` statt `\s`, sonst frisst die Regel Absätze.
  text = text.replace(/[ \t]+([,.:;?!])/g, '$1')
  text = text.replace(/\([ \t]+/g, '(').replace(/[ \t]+\)/g, ')')
  text = text.replace(
    /([,.:;?!])(?=[^\s,.:;?!)\]}"'»«])/g,
    (_treffer, zeichen: string, stelle: number, ganz: string) => {
      const davor = ganz[stelle - 1] ?? ''
      const danach = ganz[stelle + 1] ?? ''
      // Messwerte bleiben, wie sie gesprochen wurden: 3,5 und 1.8.
      if ((zeichen === ',' || zeichen === '.') && /\d/.test(davor) && /\d/.test(danach)) {
        return zeichen
      }
      return `${zeichen} `
    },
  )
  text = text.replace(/[ \t]{2,}/g, ' ')
  text = text
    .split('\n')
    .map((zeile) => zeile.trim())
    .join('\n')
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  // e) Satzanfänge groß. `\p{Ll}` fasst nur Kleinbuchstaben an – „AWT" und
  //    „CM" bleiben, wie sie sind.
  text = text.replace(
    /(^|[.?!][ \t]+|\n)(\p{Ll})/gu,
    (_treffer, vorher: string, buchstabe: string) => vorher + buchstabe.toUpperCase(),
  )

  // f) Ein Satz ohne Schlusszeichen sieht abgebrochen aus.
  if (!/[.,:;?!]$/.test(text)) text += '.'

  return text
}
