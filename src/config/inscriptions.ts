/**
 * LES RÈGLES D'INSCRIPTION DES ENSEIGNANTS, réglées dans /admin/inscrits (« la gestion des
 * inscriptions ») et appliquées par `registerTeacher` (services/auth.service.ts) :
 *  · l'inscription libre (sans code d'établissement), oui ou non (`allowSelfServiceTeachers`) ;
 *  · des domaines d'e-mail AUTORISÉS (liste vide : tous) et BLOQUÉS (prioritaires).
 * Un domaine couvre ses sous-domaines : « ac-lille.fr » couvre « prof.ac-lille.fr ».
 * Les règles de domaine portent sur l'inscription par le formulaire du site :
 *  · les domaines BLOQUÉS s'appliquent toujours, avec ou sans code ;
 *  · les domaines AUTORISÉS restreignent l'inscription LIBRE seulement : un code d'invitation
 *    valide est le choix explicite d'un établissement et passe outre (comme il passe outre
 *    l'inscription libre fermée).
 * Un compte venu d'une plateforme LTI ou de RENATER est authentifié par l'établissement et
 * n'y est pas soumis. Pures, testables sans base.
 */

export interface ReglesDeDomaine {
  domainesAutorises: readonly string[];
  domainesBloques: readonly string[];
}

/** Au plus ce nombre de domaines par liste : une liste, pas un annuaire. */
export const DOMAINES_MAX = 200;

const DOMAINE = /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** « @Lycee-Hugo.FR », « lycee-hugo.fr » → « lycee-hugo.fr » ; null si ce n'est pas un domaine. */
export function normaliserDomaine(brut: string): string | null {
  const d = brut.trim().toLowerCase().replace(/^\*?\.?@?/, "").replace(/\.$/, "");
  return DOMAINE.test(d) ? d : null;
}

/** Une liste saisie (une par ligne, ou séparée par virgules, points-virgules, espaces) → domaines valides, sans doublon. */
export function lireDomaines(texte: string): { domaines: string[]; ignores: string[] } {
  const domaines: string[] = [];
  const ignores: string[] = [];
  for (const brut of texte.split(/[\s,;]+/).filter(Boolean)) {
    const d = normaliserDomaine(brut);
    if (d === null) ignores.push(brut);
    else if (!domaines.includes(d)) domaines.push(d);
  }
  return { domaines: domaines.slice(0, DOMAINES_MAX), ignores };
}

/** Ce que la base contient (JSON libre) → une liste propre ; tout le reste → liste vide. */
export function normaliserListe(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return lireDomaines(v.filter((x): x is string => typeof x === "string").join("\n")).domaines;
}

const couvre = (domaine: string, regle: string) => domaine === regle || domaine.endsWith(`.${regle}`);

/**
 * Le refus d'une adresse, en une phrase ; null si elle passe. `parInvitation` : l'inscription
 * porte un code d'invitation valide, la liste des autorisés ne s'applique pas.
 */
export function refusDuDomaine(
  email: string,
  regles: ReglesDeDomaine,
  options: { parInvitation?: boolean } = {},
): string | null {
  const domaine = email.trim().toLowerCase().split("@")[1] ?? "";
  if (regles.domainesBloques.some((r) => couvre(domaine, r))) {
    return "Les inscriptions avec cette adresse e-mail ne sont pas acceptées. Utilisez votre adresse professionnelle.";
  }
  if (options.parInvitation) return null;
  if (regles.domainesAutorises.length > 0 && !regles.domainesAutorises.some((r) => couvre(domaine, r))) {
    return "Les inscriptions sont réservées à certaines adresses d'établissement. Utilisez votre adresse professionnelle, ou demandez un accès à votre établissement.";
  }
  return null;
}
