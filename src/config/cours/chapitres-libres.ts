import { formationParCode, type Formation } from "../formations";
import { FORMATIONS_PROPOSEES, chapitrePropose } from "../formations-proposees";
import { competencesAffichees, type ContexteDuChapitre } from "./competences-affichees";
import { CHAPITRES } from "./registre";
import { casDuChapitre, type Situation } from "./situations";
import type { Chapitre } from "./types";

/**
 * UN CHAPITRE LIBRE PAR DIPLÔME (décision du propriétaire, novembre 2026 ; audit du 10 novembre,
 * produit P1-1, « l'essai du cours »).
 *
 * Un seul chapitre était libre sur tout le site, « De la création au premier bilan » (BTS CG), et
 * il n'était au parcours que de trois diplômes sur treize : l'enseignant de STMG se voyait proposer
 * un chapitre de BTS CG, tout en bas de la page sur téléphone. Désormais :
 *
 *  · CHAQUE DIPLÔME A SON CHAPITRE LIBRE, CELUI DE LA LISTE CI-DESSOUS (`CHAPITRE_LIBRE_DU_DIPLOME`).
 *    Une option compte pour son diplôme : le BTS MHR, options B et C, a celui du BTS MHR. Deux
 *    diplômes peuvent partager le même chapitre.
 *  · SON CAS PRATIQUE DÉDIÉ (`casDuChapitre`) EST LIBRE AUSSI. Les enquêtes, bureaux et scénarios
 *    qui le reprennent restent réservés.
 *  · AUCUN AUTRE CHAPITRE N'EST LIBRE. Le chapitre et son cas le déclarent eux-mêmes (leur champ `libre`,
 *    dans leur fichier) : c'est le même mécanisme qu'avant, celui que lisent la règle d'accès
 *    (services/cours.service.ts, `coursOuvert`) et la fouille des fichiers publics
 *    (scripts/verifier-bundles.ts). Ce module ne décide rien : il retrouve, pour chaque diplôme,
 *    le chapitre que la décision ouvre, et la garde (tests/architecture/un-chapitre-libre-par-diplome.test.ts)
 *    vérifie que les drapeaux des fichiers sont ceux-là.
 *
 * DU PREMIER DU PARCOURS À UNE LISTE CHOISIE (décision du propriétaire, 11 novembre 2026 ; audit
 * pédagogique du 11 novembre, P1-5). Du 9 au 11 novembre, le chapitre libre d'un diplôme était le
 * premier de son parcours : la règle ouvrait un chapitre de lycée au BTS CG, au DCG, au BTS SAM et aux
 * trois BUT, et des enceintes au BTS MHR. Chaque chapitre de la liste est au palier du diplôme, dans
 * son métier, sans prérequis, avec son cas pratique ; il peut venir plus loin dans le parcours. « De
 * la création au premier bilan », libre depuis octobre, y entre pour le BTS CG et n'est plus une
 * exception. Les cinq chapitres que la liste remplace se ferment, avec leurs cas.
 */
export const CHAPITRE_LIBRE_DU_DIPLOME: Readonly<Record<string, string>> = {
  stmg: "les-flux-de-l-entreprise",
  "bts-cg": "creation-premier-bilan",
  "bts-mco": "taux-de-marque-et-coefficient",
  "bts-ndrc": "negocier-le-prix",
  "bts-gpme": "choisir-son-fournisseur",
  "bts-sam": "la-paie",
  "bts-mhr": "le-cout-matiere",
  "but-gea": "seuil-de-rentabilite",
  "but-tc": "negocier-le-prix",
  "but-gaco": "seuil-de-rentabilite",
  dcg: "soldes-intermediaires-de-gestion",
  dscg: "l-effet-de-levier",
};

export interface EssaiDuDiplome {
  /** Le diplôme qui porte l'essai : celui demandé, ou celui dont il est l'option. */
  diplome: Formation;
  /** Le chapitre libre de ce diplôme, celui de la liste. */
  chapitre: Chapitre;
  /** Son cas pratique dédié, libre comme lui. */
  cas: Situation | null;
}

/** Le diplôme dont compte une formation : le sien, ou celui dont elle est l'option. */
const diplomeDe = (code: string): Formation | undefined => {
  const f = formationParCode(code);
  return f?.optionDe ? formationParCode(f.optionDe) : f;
};

/** Le chapitre de la liste pour un diplôme (pas une option), ou null s'il n'en a pas. */
export function chapitreLibreDuDiplome(code: string): Chapitre | null {
  const choisi = CHAPITRE_LIBRE_DU_DIPLOME[code];
  return (choisi && CHAPITRES.find((c) => c.code === choisi)) || null;
}

/**
 * L'ESSAI D'UN DIPLÔME : son chapitre libre et le cas pratique dédié de ce chapitre ; pour une
 * option, ceux de son diplôme. Null pour un code inconnu, un diplôme sans chapitre à la liste, ou si
 * ce chapitre n'est pas libre (la garde l'interdit ; la page ne promet alors rien).
 */
export function essaiDuDiplome(code: string | null | undefined): EssaiDuDiplome | null {
  const diplome = code ? diplomeDe(code) : undefined;
  if (!diplome) return null;
  const chapitre = chapitreLibreDuDiplome(diplome.code);
  if (!chapitre?.libre) return null;
  return { diplome, chapitre, cas: casDuChapitre(chapitre.code) ?? null };
}

/** Les diplômes proposés, une option comptant pour le sien : ceux qui peuvent avoir leur chapitre libre. */
export const DIPLOMES_PROPOSES: readonly Formation[] = FORMATIONS_PROPOSEES.filter((f) => !f.optionDe);

/**
 * LA LISTE DES CHAPITRES LIBRES, chapitre par chapitre : les diplômes qui l'ont pour essai, dans
 * l'ordre du registre des formations, et son cas dédié. Ce que la garde compare aux drapeaux.
 */
export function chapitresLibresParDiplome(): { chapitre: Chapitre; cas: Situation | null; diplomes: Formation[] }[] {
  const parChapitre = new Map<string, { chapitre: Chapitre; cas: Situation | null; diplomes: Formation[] }>();
  for (const f of DIPLOMES_PROPOSES) {
    const chapitre = chapitreLibreDuDiplome(f.code);
    if (!chapitre) continue;
    const ligne = parChapitre.get(chapitre.code) ?? { chapitre, cas: casDuChapitre(chapitre.code) ?? null, diplomes: [] };
    ligne.diplomes.push(f);
    parChapitre.set(chapitre.code, ligne);
  }
  return [...parChapitre.values()];
}

/**
 * L'ESSAI PAR DÉFAUT, quand la page ne connaît aucun diplôme (l'accueil, le menu, l'encart des pages
 * des publics) : celui du premier diplôme proposé, le bac STMG, « Les flux de l'entreprise ». Pas le
 * premier chapitre libre du registre, « De la création au premier bilan », celui du BTS CG.
 */
export function chapitreLibreParDefaut(): Chapitre {
  return essaiDuDiplome(DIPLOMES_PROPOSES[0]?.code)?.chapitre ?? CHAPITRES.find((c) => c.libre && chapitrePropose(c))!;
}

/** Ce qui s'écrit d'un essai dans une page : son adresse, son titre, et le diplôme qu'il sert. */
export interface LienDEssai {
  href: string;
  titre: string;
  /** Le sigle du diplôme dont c'est le chapitre libre ; null pour l'essai par défaut. */
  sigle: string | null;
}

const lienDEssai = (chapitre: Chapitre, diplome: string | null, sigle: string | null): LienDEssai => ({
  href: `/cours/${chapitre.code}${diplome ? `?diplome=${diplome}` : ""}`,
  titre: chapitre.titre,
  sigle,
});

/**
 * L'ESSAI À PROPOSER DEPUIS UN CONTENU RÉSERVÉ (un chapitre, un cas pratique, une enquête, un bureau,
 * un scénario). Dans l'ordre :
 *  1. le chapitre que le contenu reprend, s'il est libre : l'enquête d'un chapitre libre ramène à lui ;
 *  2. le chapitre libre du diplôme d'où l'on vient, sur la règle des compétences affichées
 *     (config/cours/competences-affichees.ts) : la classe de l'élève, puis l'adresse (`?diplome=`),
 *     puis le contenu lui-même (pour un cas, le premier chapitre qu'il reprend) ;
 *  3. sinon, l'essai par défaut.
 * Le lien porte le diplôme (`?diplome=`), pour que la page du chapitre libre en montre les compétences.
 */
export function essaiPour(
  contenu: Pick<Chapitre, "parcours"> & { blocs?: readonly string[]; reprend?: readonly string[] },
  contexte: ContexteDuChapitre = {},
): LienDEssai {
  const repris = (contenu.reprend ?? []).flatMap((code) => CHAPITRES.filter((c) => c.code === code));
  const source = repris[0] ?? { parcours: contenu.parcours, blocs: contenu.blocs ?? [] };
  const diplome = competencesAffichees(source, contexte).formation;
  const essai = essaiDuDiplome(diplome);
  const libreRepris = repris.find((c) => c.libre);
  if (libreRepris) return lienDEssai(libreRepris, diplome, essai?.chapitre.code === libreRepris.code ? essai.diplome.sigle : null);
  if (essai) return lienDEssai(essai.chapitre, essai.diplome.code, essai.diplome.sigle);
  return lienDEssai(chapitreLibreParDefaut(), null, null);
}
