import { redirect } from "next/navigation";

/**
 * L'ancienne adresse des fiches.
 *
 * La page s'appelait « concepts » ; le mot juste, celui des référentiels et
 * celui qu'emploient les enseignants, est « notions ». L'adresse a suivi, mais
 * elle a pu être copiée dans un cahier de textes ou sur un support imprimé :
 * la redirection permanente évite de casser ces liens là.
 */
export default function AncienneAdresseDesFiches() {
  redirect("/notions");
}
