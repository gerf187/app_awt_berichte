/**
 * Leeres Ersatzmodul.
 *
 * jsPDF lädt `html2canvas`, `canvg` und `dompurify` nach, sobald man HTML in
 * eine PDF gießen will. Diese App baut ihre PDF von Hand aus Text, Tabellen
 * und Fotos – die drei Pakete werden nie ausgeführt, würden aber rund 380 kB
 * in den Offline-Cache legen. Deshalb zeigt der Build dorthin ins Leere.
 */
export default {}
