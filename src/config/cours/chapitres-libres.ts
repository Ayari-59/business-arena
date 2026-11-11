import { formationParCode, type Formation } from "../formations";
import { FORMATIONS_PROPOSEES, chapitrePropose } from "../formations-proposees";
import { competencesAffichees, type ContexteDuChapitre } from "./competences-affichees";
import { coursDuDiplome } from "./par-diplome";
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
 *  · LE PREMIER CHAPITRE DU PARCOURS DE CHAQUE DIPLÔME EST LIBRE, dans l'ordre d'apprentissage de sa
 *    page (config/cours/par-diplome.ts, `coursDuDiplome(...).premier` : les prérequis, puis le palier,
 *    puis l'ordre du registre). Une option compte pour son diplôme : le BTS MHR, options B et C, a
 *    celui du BTS MHR. Deux diplômes qui commencent par le même chapitre le partagent.
 *  · SON CAS PRATIQUE DÉDIÉ (`casDuChapitre`) EST LIBRE AUSSI. Les enquêtes, bureaux et scénarios
 *    qui le reprennent restent réservés.
 *  · AUCUN AUTRE CHAPITRE N'EST LIBRE. Le chapitre et son cas le déclarent eux-mêmes (leur champ `libre`,
 *    dans leur fichier) : c'est le même mécanisme qu'avant, celui que lisent la règle d'accès
 *    (services/cours.service.ts, `coursOuvert`) et la fouille des fichiers publics
 *    (scripts/verifier-bundles.ts). Ce module ne décide rien : il retrouve, pour chaque diplôme,
 *    le chapitre que la décision ouvre, et la garde (tests/architecture/un-chapitre-libre-par-diplome.test.ts)
 *    vérifie que les drapeaux des fichiers sont ceux-là.
 *
 * Un chapitre qui deviendrait demain le premier d'un parcours ne s'ouvre donc pas seul : la garde
 * le signale, et l'ouvrir reste une décision.
 */

export interface EssaiDuDiplome {
  /** Le diplôme qui porte l'essai : celui demandé, ou celui dont il est l'option. */
  diplome: Formation;
  /** Le chapitre libre : le premier du parcours de ce diplôme. */
  chapitre: Chapitre;
  /** Son cas pratique dédié, libre comme lui. */
  cas: Situation | null;
}

/** Le diplôme dont compte une formation : le sien, ou celui dont elle est l'option. */
const diplomeDe = (code: string): Formation | undefined => {
  const f = formationParCode(code);
  return f?.optionDe ? formationParCode(f.optionDe) : f;
};

/** Le premier chapitre du parcours d'un diplôme, dans l'ordre d'apprentissage de sa page. */
export function premierDuDiplome(code: string): Chapitre | null {
  return coursDuDiplome(code)?.premier?.chapitre ?? null;
}

/**
 * L'ESSAI D'UN DIPLÔME : son chapitre libre et le cas pratique dédié de ce chapitre ; pour une
 * option, ceux de son diplôme. Null pour un code inconnu, un diplôme sans chapitre, ou si le premier
 * chapitre n'est pas libre (la garde l'interdit ; la page ne promet alors rien).
 */
export function essaiDuDiplome(code: string | null | undefined): EssaiDuDiplome | null {
  const diplome = code ? diplomeDe(code) : undefined;
  if (!diplome) return null;
  const chapitre = premierDuDiplome(diplome.code);
  if (!chapitre?.libre) return null;
  return { diplome, chapitre, cas: casDuChapitre(chapitre.code) ?? null };
}

/** Les diplômes proposés, une option comptant pour le sien : ceux qui peuvent avoir leur chapitre libre. */
export const DIPLOMES_PROPOSES: readonly Formation[] = FORMATIONS_PROPOSEES.filter((f) => !f.optionDe);

/**
 * LA LISTE DES CHAPITRES LIBRES, chapitre par chapitre : les diplômes qui commencent par lui, dans
 * l'ordre du registre des formations, et son cas dédié. Ce que la garde compare aux drapeaux.
 */
export function chapitresLibresParDiplome(): { chapitre: Chapitre; cas: Situation | null; diplomes: Formation[] }[] {
  const parChapitre = new Map<string, { chapitre: Chapitre; cas: Situation | null; diplomes: Formation[] }>();
  for (const f of DIPLOMES_PROPOSES) {
    const chapitre = premierDuDiplome(f.code);
    if (!chapitre) continue;
    const ligne = parChapitre.get(chapitre.code) ?? { chapitre, cas: casDuChapitre(chapitre.code) ?? null, diplomes: [] };
    ligne.diplomes.push(f);
    parChapitre.set(chapitre.code, ligne);
  }
  return [...parChapitre.values()];
}

/**
 * L'ESSAI PAR DÉFAUT, quand la page ne connaît aucun diplôme (l'accueil, le menu, l'encart des pages
 * des publics) : le premier chapitre libre du registre parmi ceux qui sont proposés. C'est celui du
 * bac STMG, « Les flux de l'entreprise ».
 */
export function chapitreLibreParDefaut(): Chapitre {
  return CHAPITRES.find((c) => c.libre && chapitrePropose(c))!;
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
