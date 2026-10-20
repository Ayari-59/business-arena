/**
 * L'ADRESSE D'UN COMPTE EST ÉTABLIE quand son titulaire a ouvert le lien, quand elle vient
 * d'une plateforme de cours ou de la fédération d'identités (l'établissement l'a fournie),
 * ou quand le compte est entré par un code d'invitation (remis par l'administration ou
 * l'établissement, pas pris au hasard).
 */
export function adresseEtablie(compte: {
  emailConfirmeLe: Date | null;
  provenance: "inscription" | "lti" | "renater" | null;
  invitationId: string | null;
}): boolean {
  return (
    compte.emailConfirmeLe !== null ||
    compte.provenance === "lti" ||
    compte.provenance === "renater" ||
    compte.invitationId !== null
  );
}

/**
 * UN ÉTABLISSEMENT REÇOIT UNE LICENCE si l'un de ses administrateurs a une adresse
 * établie, ou s'il n'en a encore aucun (créé par l'administration, qui remettra son code).
 * Rend sinon les adresses de ses administrateurs, toutes à confirmer, pour le dire.
 */
export function adressesAConfirmer(
  admins: readonly (Parameters<typeof adresseEtablie>[0] & { email: string })[],
): string[] {
  if (admins.length === 0 || admins.some(adresseEtablie)) return [];
  return admins.map((a) => a.email);
}

/** Le refus dit, tel que l'administration le lit. */
export function refusDeLicencePourAdresse(adresses: readonly string[]): string {
  return `Aucun administrateur de cet établissement n'a confirmé son adresse (${adresses.join(", ")}). La licence attend que le lien reçu à l'inscription soit ouvert ; il se renvoie depuis « Mon compte ».`;
}
