/**
 * Datenhaltung: IndexedDB über `idb`.
 *
 * Alles bleibt auf dem Gerät – es gibt keinen Server, zu dem irgendetwas
 * synchronisiert würde. Fotos liegen als Data-URL im Bericht selbst, damit
 * ein Bericht immer vollständig ist (auch in der Sicherungsdatei).
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import {
  berichtAuffuellen,
  einstellungenAuffuellen,
  naechsteBerichtsnummer,
  neuerBericht,
  produktMerken,
} from './bericht'
import type { Bericht, Einstellungen, Sicherung } from './typen'

const DB_NAME = 'awt-berichte'
const DB_VERSION = 1
const BERICHTE = 'berichte'
const EINSTELLUNGEN = 'einstellungen'
/** In den Einstellungen liegt genau ein Datensatz unter diesem Schlüssel. */
const EINSTELLUNGEN_SCHLUESSEL = 'app'

interface BerichtDB extends DBSchema {
  [BERICHTE]: {
    key: string
    value: Bericht
    indexes: { geaendertAm: string }
  }
  [EINSTELLUNGEN]: {
    key: string
    value: Einstellungen
  }
}

let verbindung: Promise<IDBPDatabase<BerichtDB>> | null = null

function db(): Promise<IDBPDatabase<BerichtDB>> {
  verbindung ??= openDB<BerichtDB>(DB_NAME, DB_VERSION, {
    upgrade(datenbank) {
      if (!datenbank.objectStoreNames.contains(BERICHTE)) {
        const speicher = datenbank.createObjectStore(BERICHTE, { keyPath: 'id' })
        speicher.createIndex('geaendertAm', 'geaendertAm')
      }
      if (!datenbank.objectStoreNames.contains(EINSTELLUNGEN)) {
        datenbank.createObjectStore(EINSTELLUNGEN)
      }
    },
  })
  return verbindung
}

/** Alle Berichte, zuletzt bearbeitete zuerst. */
export async function alleBerichte(): Promise<Bericht[]> {
  const berichte = await (await db()).getAllFromIndex(BERICHTE, 'geaendertAm')
  return berichte.reverse().map(berichtAuffuellen)
}

export async function berichtLaden(id: string): Promise<Bericht | undefined> {
  const gefunden = await (await db()).get(BERICHTE, id)
  return gefunden && berichtAuffuellen(gefunden)
}

/**
 * Bericht schreiben und dabei den Änderungszeitstempel setzen.
 * Gibt den gespeicherten Stand zurück, damit die Oberfläche denselben
 * Zeitstempel führt wie die Datenbank.
 */
export async function berichtSpeichern(bericht: Bericht): Promise<Bericht> {
  const gespeichert: Bericht = { ...bericht, geaendertAm: new Date().toISOString() }
  await (await db()).put(BERICHTE, gespeichert)
  return gespeichert
}

export async function berichtLoeschen(id: string): Promise<void> {
  await (await db()).delete(BERICHTE, id)
}

/**
 * Legt einen neuen Bericht an, vergibt die Tagesnummer und speichert ihn
 * sofort – so taucht er auch dann in „Meine Berichte" auf, wenn der Kollege
 * die App gleich wieder schließt.
 */
export async function berichtAnlegen(jetzt: Date = new Date()): Promise<Bericht> {
  const [berichte, einstellungen] = await Promise.all([alleBerichte(), einstellungenLaden()])
  const nummern = berichte.map((bericht) => bericht.kopf.berichtsnummer)
  const bericht = neuerBericht(naechsteBerichtsnummer(nummern, jetzt), einstellungen, jetzt)
  await (await db()).put(BERICHTE, bericht)
  return bericht
}

export async function einstellungenLaden(): Promise<Einstellungen> {
  const gespeichert = await (await db()).get(EINSTELLUNGEN, EINSTELLUNGEN_SCHLUESSEL)
  // Fehlende Felder auffüllen, damit ältere Datenstände nicht undefined liefern.
  return einstellungenAuffuellen(gespeichert)
}

export async function einstellungenSpeichern(einstellungen: Einstellungen): Promise<void> {
  await (await db()).put(EINSTELLUNGEN, einstellungen, EINSTELLUNGEN_SCHLUESSEL)
}

/**
 * Merkt sich ein im Bericht eingetragenes Produkt für die nächste Auswahl.
 * Sika führt 33.000 Produkte – eine mitgelieferte Liste hilft nicht, die
 * Handvoll, die dieser Kollege wirklich benutzt, schon.
 */
export async function produktSpeichern(produkt: string): Promise<void> {
  const einstellungen = await einstellungenLaden()
  const gemerkt = produktMerken(einstellungen.gemerkteProdukte, produkt)
  if (gemerkt === einstellungen.gemerkteProdukte) return
  await einstellungenSpeichern({ ...einstellungen, gemerkteProdukte: gemerkt })
}

/** Kompletter Datenbestand für die Sicherungsdatei. */
export async function alleDatenSichern(): Promise<Sicherung> {
  const [berichte, einstellungen] = await Promise.all([alleBerichte(), einstellungenLaden()])
  return {
    art: 'awt-berichte-sicherung',
    version: 1,
    erstelltAm: new Date().toISOString(),
    berichte,
    einstellungen,
  }
}

/**
 * Sicherung einspielen. Berichte mit gleicher Id werden überschrieben,
 * alles andere kommt hinzu – ein Wiederherstellen löscht also nichts,
 * was nur auf diesem Gerät liegt.
 */
export async function datenWiederherstellen(sicherung: Sicherung): Promise<number> {
  const datenbank = await db()
  const transaktion = datenbank.transaction([BERICHTE, EINSTELLUNGEN], 'readwrite')
  const speicher = transaktion.objectStore(BERICHTE)
  for (const bericht of sicherung.berichte) {
    await speicher.put(berichtAuffuellen(bericht))
  }
  if (sicherung.einstellungen) {
    await transaktion
      .objectStore(EINSTELLUNGEN)
      .put(einstellungenAuffuellen(sicherung.einstellungen), EINSTELLUNGEN_SCHLUESSEL)
  }
  await transaktion.done
  return sicherung.berichte.length
}

/**
 * Prüft, ob eine eingelesene Datei wirklich eine Sicherung dieser App ist.
 * Ohne die Prüfung würde eine falsche Datei stillschweigend Müll anlegen.
 */
export function istSicherung(daten: unknown): daten is Sicherung {
  if (typeof daten !== 'object' || daten === null) return false
  const kandidat = daten as Partial<Sicherung>
  return kandidat.art === 'awt-berichte-sicherung' && Array.isArray(kandidat.berichte)
}
