import { describe, expect, it } from 'vitest'
import { FILLER_WORDS, cleanDictation } from './cleanDictation'

describe('cleanDictation', () => {
  it('macht aus einem Diktat einen Satz', () => {
    expect(
      cleanDictation(
        'ähm also der Untergrund war trocken Komma die Temperatur lag bei 3 Komma 5 Grad',
      ),
    ).toBe('Der Untergrund war trocken, die Temperatur lag bei 3,5 Grad.')
  })

  it('lässt Produktnamen stehen und macht aus „neuer Absatz" einen Absatz', () => {
    const ergebnis = cleanDictation(
      'Sikafloor-264 aufgetragen neuer Absatz Nachkontrolle am Folgetag',
    )
    expect(ergebnis).toBe('Sikafloor-264 aufgetragen\n\nNachkontrolle am Folgetag.')
  })

  it('ändert beim zweiten Mal nichts mehr', () => {
    const roh =
      'ähm der Estrich war Komma sagen wir mal Komma bei 4 Komma 2 CM Prozent neue Zeile Fragezeichen'
    const einmal = cleanDictation(roh)
    expect(cleanDictation(einmal)).toBe(einmal)

    const schon = 'Der Estrich war trocken. Die Messung folgt.'
    expect(cleanDictation(schon)).toBe(schon)
  })

  it('lässt Messwerte unangetastet', () => {
    expect(cleanDictation('CM-Wert 1,8 %, Haftzug 2,4 N/mm²')).toBe(
      'CM-Wert 1,8 %, Haftzug 2,4 N/mm².',
    )
    expect(cleanDictation('bei 22 °C und 55 % rF gemessen')).toBe(
      'Bei 22 °C und 55 % rF gemessen.',
    )
  })

  it('schreibt Abkürzungen nicht klein', () => {
    expect(cleanDictation('AWT vor Ort Punkt CM-Messung folgt')).toBe(
      'AWT vor Ort. CM-Messung folgt.',
    )
  })

  it('setzt die übrigen gesprochenen Satzzeichen', () => {
    expect(cleanDictation('Frage Doppelpunkt wer liefert Fragezeichen')).toBe(
      'Frage: wer liefert?',
    )
    expect(cleanDictation('Achtung Ausrufezeichen Klammer auf siehe Foto Klammer zu')).toBe(
      'Achtung! (siehe Foto).',
    )
  })

  it('entfernt Füllwörter nur als eigenes Wort', () => {
    // „hm" steckt in „Nahmaß" – dort hat es nichts verloren.
    expect(cleanDictation('hm das Nahmaß stimmt')).toBe('Das Nahmaß stimmt.')
    expect(FILLER_WORDS).toContain('ähm')
  })

  it('kommt mit leerer Eingabe klar', () => {
    expect(cleanDictation('')).toBe('')
    expect(cleanDictation('   \n  ')).toBe('')
  })
})
