import { useEffect, useRef, useState } from 'react'
import type { Ansicht } from '../App'
import { Knopf } from '../components/Knopf'
import { Kopfzeile } from '../components/Kopfzeile'
import { Textfeld } from '../components/Felder'
import { EIGENE_FIRMA, EIGENE_FUNKTION } from '../data/stammdaten'
import { LEERE_EINSTELLUNGEN, alsDatumstext } from '../lib/bericht'
import {
  alleDatenSichern,
  allesLoeschen,
  datenWiederherstellen,
  einstellungenLaden,
  einstellungenSpeichern,
  istSicherung,
} from '../lib/db'
import {
  MAX_VORLAGE_BYTES,
  SIKA_RAENDER,
  VorlagenFehler,
  groesseAnzeigen,
  vorlageEinlesen,
} from '../lib/vorlage'
import type { Absender, Briefvorlage, Einstellungen } from '../lib/typen'

export function EinstellungenBildschirm({ zeige }: { zeige: (ansicht: Ansicht) => void }) {
  const [werte, setWerte] = useState<Einstellungen>(LEERE_EINSTELLUNGEN)
  const [geladen, setGeladen] = useState(false)
  const [meldung, setMeldung] = useState('')
  const [vorlagenMeldung, setVorlagenMeldung] = useState('')
  const [loeschenBestaetigen, setLoeschenBestaetigen] = useState(false)
  const dateiFeld = useRef<HTMLInputElement>(null)
  const vorlagenFeld = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void einstellungenLaden().then((gespeichert) => {
      setWerte(gespeichert)
      setGeladen(true)
    })
  }, [])

  /** Einstellungen ändern und sofort speichern – einen Speichern-Knopf gibt es nicht. */
  function aendern(veraenderung: (vorher: Einstellungen) => Einstellungen) {
    setWerte((vorher) => {
      const nachher = veraenderung(vorher)
      void einstellungenSpeichern(nachher)
      return nachher
    })
  }

  /** Einzelne Profilangabe ändern – der Rest des Profils bleibt stehen. */
  function aendernProfil(teil: Partial<Absender>) {
    aendern((vorher) => ({ ...vorher, profil: { ...vorher.profil, ...teil } }))
  }

  function aendernVorlage(teil: Partial<Briefvorlage>) {
    aendern((vorher) =>
      vorher.briefvorlage
        ? { ...vorher, briefvorlage: { ...vorher.briefvorlage, ...teil } }
        : vorher,
    )
  }

  /**
   * Briefbogen übernehmen. Das Lesen passiert vollständig im Browser – die
   * Datei wird nirgendwohin geschickt, sie landet in der Datenbank dieses
   * Geräts. Siehe DATENSCHUTZ.md.
   */
  async function vorlageWaehlen(datei: File) {
    try {
      const vorlage = await vorlageEinlesen(datei)
      aendern((vorher) => ({ ...vorher, briefvorlage: vorlage }))
      setVorlagenMeldung(
        vorlage.art === 'pdf' && vorlage.seiten > 1
          ? `„${vorlage.dateiname}" übernommen – Seite 1 als Briefkopf, Seite 2 für die Folgeseiten.`
          : `„${vorlage.dateiname}" übernommen.`,
      )
    } catch (fehler) {
      setVorlagenMeldung(
        fehler instanceof VorlagenFehler
          ? fehler.message
          : 'Die Datei konnte nicht gelesen werden.',
      )
    }
  }

  async function sichern() {
    const sicherung = await alleDatenSichern()
    const datei = new Blob([JSON.stringify(sicherung)], { type: 'application/json' })
    const adresse = URL.createObjectURL(datei)
    const verweis = document.createElement('a')
    verweis.href = adresse
    verweis.download = `Baustellenberichte_Sicherung_${alsDatumstext()}.json`
    verweis.click()
    URL.revokeObjectURL(adresse)
    setMeldung(`${sicherung.berichte.length} Bericht(e) gesichert.`)
  }

  async function wiederherstellen(datei: File) {
    try {
      const inhalt: unknown = JSON.parse(await datei.text())
      if (!istSicherung(inhalt)) {
        setMeldung('Das ist keine Sicherungsdatei dieser App.')
        return
      }
      const anzahl = await datenWiederherstellen(inhalt)
      setWerte(await einstellungenLaden())
      setMeldung(`${anzahl} Bericht(e) wiederhergestellt.`)
    } catch {
      setMeldung('Die Datei konnte nicht gelesen werden.')
    }
  }

  async function allesLoeschenBestaetigt() {
    await allesLoeschen()
    setWerte(await einstellungenLaden())
    setLoeschenBestaetigen(false)
    setMeldung('Alle Berichte, das Profil und die Briefvorlage wurden von diesem Gerät gelöscht.')
  }

  if (!geladen) {
    return (
      <div className="flex flex-1 flex-col">
        <Kopfzeile titel="Einstellungen" zurueck={() => zeige({ name: 'start' })} />
        <p className="text-sika-grau p-4">Wird geladen …</p>
      </div>
    )
  }

  const vorlage = werte.briefvorlage

  return (
    <div className="flex flex-1 flex-col">
      <Kopfzeile titel="Einstellungen" zurueck={() => zeige({ name: 'start' })} />

      <main className="flex flex-1 flex-col gap-5 p-4">
        <section className="border-sika-schwarz/10 flex flex-col gap-4 rounded-xl border-2 bg-white p-4">
          <div>
            <h2 className="text-lg font-bold">Mein Profil</h2>
            <p className="text-sika-grau mt-1 text-sm">
              Steht in jedem neuen Bericht: als erste Zeile unter „Anwesende" und in der Adresszeile
              des Berichts. Ältere Berichte bleiben unverändert.
            </p>
          </div>

          <Textfeld
            beschriftung="Name"
            value={werte.profil.name}
            onChange={(e) => aendernProfil({ name: e.target.value })}
            autoComplete="name"
          />
          <Textfeld
            beschriftung="Funktion"
            placeholder={EIGENE_FUNKTION}
            value={werte.profil.funktion}
            onChange={(e) => aendernProfil({ funktion: e.target.value })}
          />
          <Textfeld
            beschriftung="Firma"
            placeholder={EIGENE_FIRMA}
            value={werte.profil.firma}
            onChange={(e) => aendernProfil({ firma: e.target.value })}
            autoComplete="organization"
          />
          <Textfeld
            beschriftung="Straße"
            value={werte.profil.strasse}
            onChange={(e) => aendernProfil({ strasse: e.target.value })}
            autoComplete="street-address"
          />
          <Textfeld
            beschriftung="PLZ und Ort"
            value={werte.profil.ort}
            onChange={(e) => aendernProfil({ ort: e.target.value })}
          />
          <Textfeld
            beschriftung="Telefon"
            type="tel"
            inputMode="tel"
            value={werte.profil.telefon}
            onChange={(e) => aendernProfil({ telefon: e.target.value })}
            autoComplete="tel"
          />
          <Textfeld
            beschriftung="E-Mail-Adresse"
            type="email"
            inputMode="email"
            value={werte.profil.email}
            onChange={(e) => aendernProfil({ email: e.target.value })}
            autoComplete="email"
          />
        </section>

        {/* --- Briefvorlage ------------------------------------------------ */}
        <section className="border-sika-schwarz/10 flex flex-col gap-4 rounded-xl border-2 bg-white p-4">
          <div>
            <h2 className="text-lg font-bold">Briefvorlage</h2>
            <p className="text-sika-grau mt-1 text-sm">
              Der Briefbogen, auf dem der Bericht gedruckt wird. Er wird hier hinterlegt und bleibt
              auf diesem Gerät – die App lädt ihn nirgendwo hoch. Ohne Vorlage druckt die App ihre
              eigene schlichte Kopfzeile.
            </p>
          </div>

          {vorlage ? (
            <>
              <div className="border-sika-schwarz/10 flex gap-3 rounded-xl border bg-sika-hell p-3">
                {vorlage.art === 'bild' ? (
                  <img
                    src={vorlage.daten}
                    alt="Vorschau des Briefbogens"
                    className="border-sika-schwarz/10 h-28 w-auto rounded border bg-white object-contain"
                  />
                ) : (
                  <div className="border-sika-schwarz/10 flex h-28 w-20 items-center justify-center rounded border bg-white text-sm font-bold">
                    PDF
                  </div>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold">{vorlage.dateiname}</p>
                  <p className="text-sika-grau">
                    {groesseAnzeigen(vorlage.groesse)}
                    {vorlage.art === 'pdf' && ` · ${vorlage.seiten} Seite(n)`}
                  </p>
                  <p className="text-sika-grau">
                    hinterlegt am {new Date(vorlage.hinzugefuegtAm).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>

              {vorlage.art === 'pdf' && (
                <p className="text-sika-grau text-sm">
                  Word kann eine PDF-Vorlage nicht einbetten – die Word-Datei bekommt die schlichte
                  Kopfzeile. Wer den Briefbogen auch in Word braucht, hinterlegt ihn als PNG.
                </p>
              )}

              <div>
                <h3 className="font-semibold">Wo darf der Bericht stehen?</h3>
                <p className="text-sika-grau mt-1 text-sm">
                  Abstände in Millimetern vom Seitenrand. Oben so viel, dass der Text unter dem
                  Briefkopf beginnt.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Textfeld
                  beschriftung="Oben, Seite 1 (mm)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  value={vorlage.randOben}
                  onChange={(e) => aendernVorlage({ randOben: Number(e.target.value) })}
                />
                <Textfeld
                  beschriftung="Oben, ab Seite 2 (mm)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  value={vorlage.randObenFolgeseiten}
                  onChange={(e) => aendernVorlage({ randObenFolgeseiten: Number(e.target.value) })}
                />
                <Textfeld
                  beschriftung="Unten (mm)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={130}
                  value={vorlage.randUnten}
                  onChange={(e) => aendernVorlage({ randUnten: Number(e.target.value) })}
                />
                <Textfeld
                  beschriftung="Links (mm)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={90}
                  value={vorlage.randLinks}
                  onChange={(e) => aendernVorlage({ randLinks: Number(e.target.value) })}
                />
                <Textfeld
                  beschriftung="Rechts (mm)"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={90}
                  value={vorlage.randRechts}
                  onChange={(e) => aendernVorlage({ randRechts: Number(e.target.value) })}
                />
              </div>

              {/* Die Maße der Sika-Vorlage sind bekannt – niemand muss sie
                  erraten. Verstellen lassen sie sich trotzdem. */}
              <Knopf
                art="still"
                breit
                onClick={() => {
                  aendernVorlage({ ...SIKA_RAENDER })
                  setVorlagenMeldung('Maße der Sika-Vorlage übernommen.')
                }}
              >
                Maße der Sika-Vorlage übernehmen
              </Knopf>

              {vorlage.seiten === 1 && (
                <label className="tippziel flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-6 w-6"
                    checked={vorlage.ersteSeiteWiederholen}
                    onChange={(e) => aendernVorlage({ ersteSeiteWiederholen: e.target.checked })}
                  />
                  <span className="text-sm font-semibold">
                    Briefbogen auch auf den Folgeseiten drucken
                  </span>
                </label>
              )}

              <Knopf art="zweit" breit onClick={() => vorlagenFeld.current?.click()}>
                Andere Vorlage wählen
              </Knopf>
              <Knopf
                art="still"
                breit
                onClick={() => {
                  aendern((vorher) => ({ ...vorher, briefvorlage: undefined }))
                  setVorlagenMeldung('Briefvorlage entfernt.')
                }}
              >
                Vorlage entfernen
              </Knopf>
            </>
          ) : (
            <Knopf art="zweit" breit onClick={() => vorlagenFeld.current?.click()}>
              Briefvorlage hochladen
            </Knopf>
          )}

          <input
            ref={vorlagenFeld}
            type="file"
            accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              const datei = e.target.files?.[0]
              e.target.value = ''
              if (datei) void vorlageWaehlen(datei)
            }}
          />

          <p className="text-sika-grau text-sm">
            PDF, PNG oder JPEG, höchstens {groesseAnzeigen(MAX_VORLAGE_BYTES)}, am besten eine
            A4-Seite. Eine Word-Vorlage vorher in Word als PDF speichern.
          </p>

          {vorlagenMeldung && (
            <p role="status" className="font-semibold">
              {vorlagenMeldung}
            </p>
          )}
        </section>

        <section className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4">
          <h2 className="text-lg font-bold">Datensicherung</h2>
          <p className="text-sika-grau text-sm">
            Alle Berichte liegen nur auf diesem Gerät. Sichern Sie sie regelmäßig. Die
            Sicherungsdatei enthält Kunden- und Personendaten und ist nicht verschlüsselt – bitte
            nicht offen herumliegen lassen.
          </p>
          <Knopf art="zweit" breit onClick={() => void sichern()}>
            Alle Daten sichern (JSON)
          </Knopf>
          <Knopf art="zweit" breit onClick={() => dateiFeld.current?.click()}>
            Daten wiederherstellen
          </Knopf>
          <input
            ref={dateiFeld}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const datei = e.target.files?.[0]
              e.target.value = ''
              if (datei) void wiederherstellen(datei)
            }}
          />
          {meldung && (
            <p role="status" className="font-semibold">
              {meldung}
            </p>
          )}
        </section>

        {/* --- OneDrive ----------------------------------------------------
            Die Frage kommt von jedem Kollegen: Der Platz dafür ist hier – und
            solange der Zugang fehlt, steht wenigstens da, warum. */}
        <section className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4">
          <h2 className="text-lg font-bold">OneDrive</h2>
          <p className="text-sika-grau text-sm">
            Noch nicht angebunden. Damit die App Berichte in OneDrive ablegen darf, muss sie in der
            Sika-Umgebung angemeldet werden – das geht nur zusammen mit der Sika-IT und ist in
            Arbeit. Bis dahin ist die Sicherung oben der Weg, Berichte vom Gerät zu bekommen.
          </p>
        </section>

        {/* --- Anleitung ---------------------------------------------------- */}
        <section className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4">
          <h2 className="text-lg font-bold">Anleitung</h2>
          <p className="text-sika-grau text-sm">
            Jeder Schritt mit Bildern erklärt – vom Profil über die Briefvorlage bis zum fertigen
            Bericht. Die Datei liegt in der App und lässt sich auch ohne Empfang öffnen.
          </p>
          {/* Bewusst ein Verweis auf eine mitgelieferte Datei: kein Netzaufruf. */}
          <a
            href="Anleitung.pdf"
            target="_blank"
            rel="noopener"
            className="border-sika-schwarz/15 active:bg-sika-hell tippziel inline-flex items-center justify-center rounded-xl border-2 bg-white px-5 py-3 text-lg font-semibold"
          >
            Anleitung öffnen (PDF)
          </a>
        </section>

        {/* --- Datenschutz -------------------------------------------------- */}
        <section className="border-sika-schwarz/10 flex flex-col gap-3 rounded-xl border-2 bg-white p-4">
          <h2 className="text-lg font-bold">Datenschutz</h2>
          <p className="text-sika-grau text-sm">
            In den Berichten stehen Kunden- und Mitarbeiterdaten. Was die App damit macht – und was
            nicht –, steht auf einer eigenen Seite.
          </p>
          <Knopf art="zweit" breit onClick={() => zeige({ name: 'datenschutz' })}>
            Datenschutz-Hinweise lesen
          </Knopf>

          {loeschenBestaetigen ? (
            <div className="border-sika-rot rounded-xl border-2 p-3">
              <p className="font-semibold">
                Wirklich alle Berichte, Fotos, das Profil und die Briefvorlage von diesem Gerät
                löschen? Das lässt sich nicht rückgängig machen.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Knopf art="gefahr" breit onClick={() => void allesLoeschenBestaetigt()}>
                  Ja, alles löschen
                </Knopf>
                <Knopf art="zweit" breit onClick={() => setLoeschenBestaetigen(false)}>
                  Abbrechen
                </Knopf>
              </div>
            </div>
          ) : (
            <Knopf art="still" breit onClick={() => setLoeschenBestaetigen(true)}>
              Alle Daten auf diesem Gerät löschen
            </Knopf>
          )}
        </section>

        <p className="text-sika-grau pb-4 text-center text-sm">
          Die App sendet keine Daten. Alles bleibt auf dem Gerät.
        </p>
      </main>
    </div>
  )
}
