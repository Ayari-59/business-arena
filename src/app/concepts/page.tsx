import { permanentRedirect } from "next/navigation";

/**
 * L'ancienne adresse des fiches.
 *
 * La page s'appelait « concepts » ; le mot juste, celui des référentiels et
 * celui qu'emploient les enseignants, est « notions ». L'adresse a suivi, mais
 * elle a pu être copiée dans un cahier de textes ou sur un support imprimé.
 * `permanentRedirect` émet un 308 : le lien n'est pas cassé, ET le
 * référencement se consolide vers /notions. `redirect()` n'émettait qu'un 307
 * temporaire — Google gardait l'ancienne URL et ne transmettait pas le jus.
 */
export default function AncienneAdresseDesFiches() {
  permanentRedirect("/notions");
}
