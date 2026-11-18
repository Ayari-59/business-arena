/**
 * Le brouillon local du formulaire de décisions.
 *
 * Pourquoi. Le formulaire fait six étapes et plusieurs dizaines de champs, et
 * rien n'en était gardé tant qu'on n'avait pas validé : un onglet fermé, une
 * batterie vide, un appel en plein cours, et le tour entier était à ressaisir.
 * Le QCM de la même page se sauvait déjà tout seul ; voici la même mécanique
 * pour les décisions.
 *
 * Le brouillon est une simple carte `nom du champ → valeur`, celle que
 * `FormData` produit — donc exactement ce que le serveur recevrait. Une case à
 * cocher décochée n'y figure pas, comme dans un envoi réel.
 *
 * Il est LOCAL au navigateur, et il ne survit pas à un nettoyage du stockage.
 * Ce n'est pas une sauvegarde, c'est un filet. En partie de classe, la feuille
 * enregistre AUSSI la saisie sur le serveur, pour toute l'équipe
 * (`config/brouillon-d-equipe.ts`) : le filet local garde ce que le serveur n'a
 * pas encore reçu, et le serveur fait foi dès qu'il est plus récent.
 *
 * Tout passe par un try/catch : en navigation privée, avec un stockage plein ou
 * bloqué, `localStorage` jette. On perd alors le filet, jamais le formulaire.
 */

export type Brouillon = Record<string, string>;

const PREFIXE = "brouillon-decisions:";

/** Une clé par PARTIE et par TOUR : le brouillon du tour 2 n'est pas celui du 1. */
export function cleBrouillon(gameId: string, tour: number): string {
  return `${PREFIXE}${gameId}:${tour}`;
}

export function lireBrouillon(cle: string): Brouillon | null {
  try {
    const brut = window.localStorage.getItem(cle);
    if (!brut) return null;
    const lu: unknown = JSON.parse(brut);
    if (typeof lu !== "object" || lu === null || Array.isArray(lu)) return null;
    // On ne garde que les paires de chaînes : un brouillon écrit par une version
    // antérieure, ou abîmé, ne doit pas faire tomber le formulaire.
    const b: Brouillon = {};
    for (const [k, v] of Object.entries(lu as Record<string, unknown>)) {
      if (typeof v === "string") b[k] = v;
    }
    return Object.keys(b).length > 0 ? b : null;
  } catch {
    return null;
  }
}

export function ecrireBrouillon(cle: string, b: Brouillon): void {
  try {
    window.localStorage.setItem(cle, JSON.stringify(b));
  } catch {
    /* stockage indisponible ou plein : le formulaire reste utilisable */
  }
}

export function effacerBrouillon(cle: string): void {
  try {
    window.localStorage.removeItem(cle);
    window.localStorage.removeItem(cleDeLEtat(cle));
  } catch {
    /* idem */
  }
}

/**
 * OÙ EN EST LE BROUILLON LOCAL FACE À CELUI DE L'ÉQUIPE, sur le serveur
 * (`config/brouillon-d-equipe.ts`) : la version du serveur dont il part
 * (`base`, l'heure de cet enregistrement), et s'il porte une saisie que le
 * serveur n'a pas encore (`enAttente`). C'est ce qui dit, à l'ouverture de la
 * feuille, lequel des deux fait foi, sans comparer l'horloge de l'appareil à
 * celle du serveur.
 */
export interface EtatLocal {
  base: string | null;
  enAttente: boolean;
}

const cleDeLEtat = (cle: string) => `${cle}:serveur`;

export function lireEtatLocal(cle: string): EtatLocal {
  try {
    const lu: unknown = JSON.parse(window.localStorage.getItem(cleDeLEtat(cle)) ?? "null");
    if (typeof lu !== "object" || lu === null) return { base: null, enAttente: false };
    const e = lu as { base?: unknown; enAttente?: unknown };
    return { base: typeof e.base === "string" ? e.base : null, enAttente: e.enAttente === true };
  } catch {
    return { base: null, enAttente: false };
  }
}

export function ecrireEtatLocal(cle: string, etat: EtatLocal): void {
  try {
    window.localStorage.setItem(cleDeLEtat(cle), JSON.stringify(etat));
  } catch {
    /* idem */
  }
}

/**
 * Efface les brouillons des AUTRES tours de cette partie. Un tour joué ne se
 * rejoue pas : garder son brouillon n'aurait servi qu'à encombrer le stockage
 * du navigateur, partie après partie.
 */
export function effacerBrouillonsAnterieurs(gameId: string, cleAGarder: string): void {
  try {
    const prefixeDuJeu = `${PREFIXE}${gameId}:`;
    const aSupprimer: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const cle = window.localStorage.key(i);
      if (cle && cle.startsWith(prefixeDuJeu) && cle !== cleAGarder && cle !== cleDeLEtat(cleAGarder)) {
        aSupprimer.push(cle);
      }
    }
    for (const cle of aSupprimer) window.localStorage.removeItem(cle);
  } catch {
    /* idem */
  }
}
