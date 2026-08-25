import { describe, expect, it } from 'vitest'
import { betreff, mailtext, mailtoAdresse } from '../src/lib/teilen'
import { beispielBericht } from './hilfen/beispielBericht'

describe('betreff', () => {
  it('setzt Nummer und Projekt zusammen', async () => {
    const bericht = await beispielBericht()
    expect(betreff(bericht)).toBe('Baustellenbericht 2026-08-25-01 – Neubau Produktionshalle Süd')
  })

  it('lässt den Gedankenstrich weg, wenn kein Projekt eingetragen ist', async () => {
    const bericht = await beispielBericht()
    bericht.kopf.projekt = ''
    expect(betreff(bericht)).toBe('Baustellenbericht 2026-08-25-01')
  })
})

describe('mailtext', () => {
  it('nennt Nummer, Datum, Projekt und Verarbeiter', async () => {
    const text = mailtext(await beispielBericht(), false)
    expect(text).toContain('Nummer: 2026-08-25-01')
    expect(text).toContain('Datum: 25.08.2026')
    expect(text).toContain('Projekt: Neubau Produktionshalle Süd')
    expect(text).toContain('Verarbeiter: Bodentechnik Meier GmbH')
  })

  it('weist auf eine Taupunkt-Warnung hin', async () => {
    expect(mailtext(await beispielBericht(), false)).toContain('Abstand zum Taupunkt')
  })

  it('schweigt zum Taupunkt, wenn alle Messungen in Ordnung sind', async () => {
    const bericht = await beispielBericht()
    bericht.klima = bericht.klima.filter((messung) => !messung.warnung)
    expect(mailtext(bericht, false)).not.toContain('Abstand zum Taupunkt')
  })

  it('erklärt den Anhang nur beim Fallback-Weg', async () => {
    const bericht = await beispielBericht()
    expect(mailtext(bericht, true)).toContain('von Hand an diese Mail anhängen')
    expect(mailtext(bericht, false)).not.toContain('von Hand an diese Mail anhängen')
  })
})

describe('mailtoAdresse', () => {
  it('baut eine mailto-Adresse mit Empfänger, Betreff und Text', async () => {
    const adresse = mailtoAdresse(await beispielBericht(), 'buero@example.de')
    expect(adresse.startsWith('mailto:buero%40example.de?')).toBe(true)
    expect(adresse).toContain('subject=')
    expect(adresse).toContain('body=')
  })

  it('kodiert Leerzeichen als %20 und nicht als Pluszeichen', async () => {
    const adresse = mailtoAdresse(await beispielBericht(), 'buero@example.de')
    expect(adresse).not.toContain('+')
    expect(adresse).toContain('%20')
  })
})
