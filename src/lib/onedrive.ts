/**
 * OneDrive-Anbindung über Microsoft Graph.
 *
 * Bewusst ohne Microsoft-Bibliothek (MSAL): der Anmeldevorgang ist reines
 * OAuth 2.0 mit PKCE, das sind ein paar Dutzend Zeilen – dafür bleibt das
 * Bündel klein und offline-tauglich.
 *
 * Es gibt keinen Server und kein Geheimnis in der App. Die Anmeldung läuft im
 * Browser des Nutzers, die Tokens bleiben auf dem Gerät (siehe DATENSCHUTZ.md).
 *
 * Damit Microsoft die App überhaupt anmelden lässt, braucht es eine
 * App-Registrierung (Azure/Entra) und deren Anwendungs-ID. Die trägt jeder
 * selbst in den Einstellungen ein – so kann heute ein privates Konto testen
 * und später die Sika-Registrierung eingetragen werden, ohne Codeänderung.
 */

/** Anmeldeserver für private Microsoft-Konten *und* Firmenkonten. */
const BEHOERDE = 'https://login.microsoftonline.com/common/oauth2/v2.0'
const GRAPH = 'https://graph.microsoft.com/v1.0'

/**
 * Rechte, die die App erbittet:
 * - `Files.ReadWrite`  – Berichte ablegen
 * - `offline_access`   – Erneuerungstoken, damit nicht jedes Mal die
 *                        Anmeldemaske erscheint
 * - `User.Read`        – nur, um in den Einstellungen zu zeigen, mit welchem
 *                        Konto die App verbunden ist
 */
const RECHTE = 'Files.ReadWrite offline_access User.Read'

/** Standardordner in OneDrive. Änderbar in den Einstellungen. */
export const STANDARD_ORDNER = 'Baustellenberichte'

/** Ab dieser Größe lädt Graph nicht mehr am Stück, sondern in Abschnitten. */
const EINZELSTUECK_GRENZE = 4 * 1024 * 1024
/** Abschnittsgröße beim stückweisen Hochladen – muss ein Vielfaches von 320 KiB sein. */
const ABSCHNITT = 16 * 320 * 1024

/**
 * Die Sitzung liegt bewusst *nicht* in den Einstellungen: die wandern in die
 * Sicherungsdatei, und Zugangstoken haben in einer Datei nichts zu suchen.
 */
const SITZUNG_SCHLUESSEL = 'awt-onedrive-sitzung'
const LAUF_SCHLUESSEL = 'awt-onedrive-anmeldung'

export type OneDriveKonfig = {
  /** Anwendungs-ID (Client-ID) der App-Registrierung. */
  clientId: string
  /** Zielordner in OneDrive, z. B. `Baustellenberichte`. */
  ordner: string
}

type Sitzung = {
  zugriffsToken: string
  /** Zeitpunkt in Millisekunden, ab dem das Zugriffstoken als abgelaufen gilt. */
  gueltigBis: number
  erneuerungsToken?: string
  clientId: string
  konto: string
}

/** Fehler, deren Text direkt auf dem Bildschirm stehen darf. */
export class OneDriveFehler extends Error {}

export function standardKonfig(): OneDriveKonfig {
  return { clientId: '', ordner: STANDARD_ORDNER }
}

/**
 * Die Adresse, die in der App-Registrierung als Umleitungs-URI (Plattform
 * „Einzelseitenanwendung") stehen muss. Wird in den Einstellungen angezeigt,
 * damit niemand sie abtippen muss.
 */
export function umleitungsAdresse(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}

// --- Sitzung ---------------------------------------------------------------

function sitzungLesen(): Sitzung | null {
  try {
    const roh = localStorage.getItem(SITZUNG_SCHLUESSEL)
    return roh ? (JSON.parse(roh) as Sitzung) : null
  } catch {
    return null
  }
}

function sitzungSchreiben(sitzung: Sitzung | null): void {
  try {
    if (sitzung) localStorage.setItem(SITZUNG_SCHLUESSEL, JSON.stringify(sitzung))
    else localStorage.removeItem(SITZUNG_SCHLUESSEL)
  } catch {
    // Privater Modus ohne Speicher: dann eben nur für diese Sitzung.
  }
}

/** Mit welchem Konto ist dieses Gerät verbunden? `null` heißt: mit keinem. */
export function verbundenesKonto(): string | null {
  return sitzungLesen()?.konto ?? null
}

/** Verbindung lösen – die Tokens verschwinden vom Gerät. */
export function abmelden(): void {
  sitzungSchreiben(null)
}

// --- Anmeldung (OAuth 2.0 mit PKCE) ---------------------------------------

function zufall(laenge: number): string {
  const bytes = new Uint8Array(laenge)
  crypto.getRandomValues(bytes)
  return base64url(bytes)
}

function base64url(bytes: Uint8Array): string {
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function pruefsumme(text: string): Promise<string> {
  const rohdaten = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return base64url(new Uint8Array(rohdaten))
}

/**
 * Anmeldung starten. Die Seite wird zu Microsoft umgeleitet und kommt danach
 * mit einem Code zurück – Umleitung statt Fenster, weil ein zusätzliches
 * Fenster auf dem Handy oft blockiert wird.
 */
export async function anmeldungStarten(konfig: OneDriveKonfig): Promise<void> {
  if (!konfig.clientId.trim()) {
    throw new OneDriveFehler('Es fehlt die Anwendungs-ID der App-Registrierung.')
  }

  const schluessel = zufall(32)
  const zustand = zufall(16)
  sessionStorage.setItem(
    LAUF_SCHLUESSEL,
    JSON.stringify({ schluessel, zustand, clientId: konfig.clientId.trim() }),
  )

  const felder = new URLSearchParams({
    client_id: konfig.clientId.trim(),
    response_type: 'code',
    redirect_uri: umleitungsAdresse(),
    response_mode: 'query',
    scope: RECHTE,
    state: zustand,
    code_challenge: await pruefsumme(schluessel),
    code_challenge_method: 'S256',
    // Ein Konto ist schon gewählt? Trotzdem fragen – auf geteilten Geräten
    // landet der Bericht sonst im falschen OneDrive.
    prompt: 'select_account',
  })
  window.location.assign(`${BEHOERDE}/authorize?${felder.toString()}`)
}

/** Steht in der Adresszeile eine Antwort von Microsoft? */
export function rueckkehrErkannt(): boolean {
  const felder = new URLSearchParams(window.location.search)
  return felder.has('code') || felder.has('error')
}

/** Die Antwortparameter aus der Adresszeile entfernen – sie gehören nicht in den Verlauf. */
function adresseAufraeumen(): void {
  window.history.replaceState(null, '', window.location.pathname)
}

/**
 * Rückkehr von Microsoft auswerten und den Code gegen Tokens tauschen.
 * Gibt den Kontonamen zurück; wirft mit einem lesbaren Text, wenn es klemmt.
 */
export async function rueckkehrVerarbeiten(): Promise<string> {
  const felder = new URLSearchParams(window.location.search)
  const code = felder.get('code')
  const fehler = felder.get('error_description') ?? felder.get('error')
  const lauf = sessionStorage.getItem(LAUF_SCHLUESSEL)
  sessionStorage.removeItem(LAUF_SCHLUESSEL)
  adresseAufraeumen()

  if (fehler) throw new OneDriveFehler(kurzfassen(fehler))
  if (!code || !lauf) throw new OneDriveFehler('Die Anmeldung wurde nicht abgeschlossen.')

  const { schluessel, zustand, clientId } = JSON.parse(lauf) as {
    schluessel: string
    zustand: string
    clientId: string
  }
  if (felder.get('state') !== zustand) {
    throw new OneDriveFehler('Die Antwort gehört nicht zu dieser Anmeldung.')
  }

  const antwort = await tokenHolen(clientId, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: umleitungsAdresse(),
    code_verifier: schluessel,
  })

  const konto = await kontonameHolen(antwort.access_token)
  sitzungSchreiben({ ...antwort, clientId, konto })
  return konto
}

type TokenAntwort = { zugriffsToken: string; gueltigBis: number; erneuerungsToken?: string }

async function tokenHolen(
  clientId: string,
  felder: Record<string, string>,
): Promise<{ access_token: string } & TokenAntwort> {
  const antwort = await fetch(`${BEHOERDE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, scope: RECHTE, ...felder }).toString(),
  })

  const inhalt: unknown = await antwort.json().catch(() => null)
  if (!antwort.ok) {
    const text =
      inhalt && typeof inhalt === 'object' && 'error_description' in inhalt
        ? kurzfassen(String((inhalt as { error_description: unknown }).error_description))
        : 'Microsoft hat die Anmeldung abgelehnt.'
    throw new OneDriveFehler(text)
  }

  const daten = inhalt as { access_token: string; expires_in: number; refresh_token?: string }
  return {
    access_token: daten.access_token,
    zugriffsToken: daten.access_token,
    // Eine Minute Sicherheitsabstand, damit kein Token mitten im Hochladen abläuft.
    gueltigBis: Date.now() + (daten.expires_in - 60) * 1000,
    erneuerungsToken: daten.refresh_token,
  }
}

/** Microsofts Fehlertexte sind lang und technisch – die erste Zeile genügt. */
function kurzfassen(text: string): string {
  return text.split(/\r?\n/)[0].slice(0, 200)
}

async function kontonameHolen(token: string): Promise<string> {
  try {
    const antwort = await fetch(`${GRAPH}/me`, { headers: { Authorization: `Bearer ${token}` } })
    if (!antwort.ok) return 'OneDrive'
    const daten = (await antwort.json()) as { displayName?: string; userPrincipalName?: string }
    return daten.userPrincipalName ?? daten.displayName ?? 'OneDrive'
  } catch {
    return 'OneDrive'
  }
}

/** Gültiges Zugriffstoken besorgen – notfalls mit dem Erneuerungstoken. */
async function token(): Promise<string> {
  const sitzung = sitzungLesen()
  if (!sitzung) throw new OneDriveFehler('Dieses Gerät ist nicht mit OneDrive verbunden.')
  if (Date.now() < sitzung.gueltigBis) return sitzung.zugriffsToken
  if (!sitzung.erneuerungsToken) {
    abmelden()
    throw new OneDriveFehler('Die Verbindung ist abgelaufen. Bitte neu verbinden.')
  }

  try {
    const neu = await tokenHolen(sitzung.clientId, {
      grant_type: 'refresh_token',
      refresh_token: sitzung.erneuerungsToken,
    })
    sitzungSchreiben({
      ...sitzung,
      zugriffsToken: neu.zugriffsToken,
      gueltigBis: neu.gueltigBis,
      erneuerungsToken: neu.erneuerungsToken ?? sitzung.erneuerungsToken,
    })
    return neu.zugriffsToken
  } catch {
    abmelden()
    throw new OneDriveFehler('Die Verbindung ist abgelaufen. Bitte neu verbinden.')
  }
}

// --- Hochladen -------------------------------------------------------------

/** Ordnernamen entschärfen: OneDrive verbietet einige Zeichen. */
export function ordnerpfad(ordner: string): string {
  return ordner
    .split('/')
    .map((teil) => teil.replace(/["*:<>?\\|]/g, '').trim())
    .filter(Boolean)
    .join('/')
}

function graphPfad(ordner: string, name: string): string {
  const pfad = ordnerpfad(ordner)
  const ziel = pfad ? `${pfad}/${name}` : name
  return ziel.split('/').map(encodeURIComponent).join('/')
}

/**
 * Bericht in OneDrive ablegen. Gibt die Adresse der Datei zurück, damit die
 * App darauf verweisen kann.
 */
export async function hochladen(datei: File, ordner: string): Promise<string> {
  const pfad = graphPfad(ordner, datei.name)
  return datei.size <= EINZELSTUECK_GRENZE
    ? await amStueck(pfad, datei)
    : await inAbschnitten(pfad, datei)
}

async function amStueck(pfad: string, datei: File): Promise<string> {
  const antwort = await mitToken((zugriff) =>
    fetch(`${GRAPH}/me/drive/root:/${pfad}:/content?@microsoft.graph.conflictBehavior=rename`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${zugriff}`,
        'Content-Type': datei.type || 'application/octet-stream',
      },
      body: datei,
    }),
  )
  return adresseAus(await antwort.json())
}

/**
 * Große Berichte (viele Fotos) gehen in Abschnitten hoch. Bricht die
 * Verbindung mitten drin ab, ist nichts halbes in OneDrive: Graph gibt die
 * Datei erst frei, wenn der letzte Abschnitt angekommen ist.
 */
async function inAbschnitten(pfad: string, datei: File): Promise<string> {
  const start = await mitToken((zugriff) =>
    fetch(`${GRAPH}/me/drive/root:/${pfad}:/createUploadSession`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${zugriff}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
    }),
  )
  const { uploadUrl } = (await start.json()) as { uploadUrl: string }

  for (let ab = 0; ab < datei.size; ab += ABSCHNITT) {
    const bis = Math.min(ab + ABSCHNITT, datei.size)
    const antwort = await fetch(uploadUrl, {
      method: 'PUT',
      // Die Sitzungsadresse trägt ihre Berechtigung selbst – hier gehört
      // ausdrücklich kein Authorization-Kopf hin.
      headers: {
        'Content-Range': `bytes ${ab}-${bis - 1}/${datei.size}`,
        'Content-Length': String(bis - ab),
      },
      body: datei.slice(ab, bis),
    })
    if (!antwort.ok) throw new OneDriveFehler(await fehlertext(antwort))
    // Der letzte Abschnitt antwortet mit der fertigen Datei.
    if (bis >= datei.size) return adresseAus(await antwort.json())
  }
  throw new OneDriveFehler('Die Datei wurde nicht vollständig übertragen.')
}

function adresseAus(antwort: unknown): string {
  return antwort && typeof antwort === 'object' && 'webUrl' in antwort
    ? String((antwort as { webUrl: unknown }).webUrl)
    : ''
}

/**
 * Anfrage mit Token ausführen. Läuft das Token genau zwischen Prüfung und
 * Anfrage ab, wird einmal erneuert und wiederholt – erst dann ist es ein Fehler.
 */
async function mitToken(anfrage: (zugriff: string) => Promise<Response>): Promise<Response> {
  let antwort = await anfrage(await token())
  if (antwort.status === 401) {
    const sitzung = sitzungLesen()
    if (sitzung) sitzungSchreiben({ ...sitzung, gueltigBis: 0 })
    antwort = await anfrage(await token())
  }
  if (!antwort.ok) throw new OneDriveFehler(await fehlertext(antwort))
  return antwort
}

async function fehlertext(antwort: Response): Promise<string> {
  try {
    const inhalt = (await antwort.json()) as { error?: { message?: string } }
    if (inhalt.error?.message) return kurzfassen(inhalt.error.message)
  } catch {
    // Antwort ohne JSON – dann bleibt nur der Statuscode.
  }
  return `OneDrive hat die Datei abgelehnt (Fehler ${antwort.status}).`
}
