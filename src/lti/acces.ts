import { uneOrganisationAvecEpisodes, uneOrganisationSousLicence } from "@/services/acces.service";

/**
 * CE QU'UNE ACTIVITÉ LTI PEUT OUVRIR, SELON LA LICENCE DE L'ORGANISATION DE LA
 * PLATEFORME. Les règles sont celles de services/acces.service.ts, appelées telles
 * quelles, rien n'est réécrit ici :
 *   · une PARTIE de classe : une licence de l'arène en cours (offre Classe ou Campus),
 *     `uneOrganisationSousLicence` ;
 *   · une COHORTE d'épisodes : une licence en cours qui inclut les épisodes,
 *     `uneOrganisationAvecEpisodes`.
 *
 * Sans l'une ni l'autre, l'enseignant voit le message habituel et le lien vers les
 * tarifs ; l'élève voit seulement que l'activité n'est pas encore ouverte.
 */

export interface Ouvertures {
  partie: boolean;
  cohorte: boolean;
}

export async function ouverturesDeLOrganisation(organizationId: string): Promise<Ouvertures> {
  const [partie, cohorte] = await Promise.all([
    uneOrganisationSousLicence([organizationId]),
    uneOrganisationAvecEpisodes([organizationId]),
  ]);
  return { partie, cohorte };
}

/** L'organisation ouvre-t-elle au moins une des deux cibles ? (écran de l'élève) */
export async function organisationOuverte(organizationId: string): Promise<boolean> {
  const o = await ouverturesDeLOrganisation(organizationId);
  return o.partie || o.cohorte;
}
