import { auCentime } from "./amortissement";
import { van } from "./finance";
import { EMPLOIS_CREES, KWH_ECONOMISES_PAR_AN, KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE, PRET_VERT, criteresExtraFinanciers, deuxProjetsDurables } from "./investissement-durable";
import { DUREE_DES_PROJETS, PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE, TAUX_D_ACTUALISATION_DE_NOVA } from "./projets-et-financement";
import { KG_CO2_PAR_KWH } from "./tableau-de-bord-durable";

/**
 * LE MONDE DU COURS : LE DOSSIER VERT DE NOVA, EN DÉCISIONS (décision du propriétaire, novembre 2026 :
 * une activité par chapitre ; le format « scénario à embranchements » ; DCG UE6, 2.4).
 *
 * La suite du chapitre « Évaluer un investissement durable » : fin décembre N, le président doit choisir
 * la seconde ligne de la gamme, puis la façon de la présenter à la banque. Deux décisions à la suite : la
 * ligne (A, la ligne manuelle ; A durable, la même avec ses équipements d'efficacité et leur subvention ;
 * B, la ligne semi-automatique), puis le prêt demandé (le prêt classique, le prêt vert, ou le prêt vert
 * en présentant toute la ligne comme alignée). Le scénario
 * (config/cours/scenarios/le-dossier-vert-de-nova.ts) lit tout ici ; chaque branche se CALCULE par les
 * flux et les taux du chapitre (`deuxProjetsDurables`), aucune ne s'écrit à la main.
 *
 * CE QUI VIENT DU MONDE, ET NE S'ÉCRIT DONC PAS ICI (monde/investissement-durable.ts) : les flux de A et
 * de B, ceux des équipements d'efficacité et de leur subvention, le risque de la hausse attendue de
 * l'électricité que B subit, le prêt vert et le taux qu'il donne au projet, la part alignée sur la
 * taxonomie, les kWh, le CO2 et les emplois.
 *
 * CE QUI EST CHOISI (la règle de la banque, dite à l'élève) : le chapitre le pose, la banque compte un
 * projet dans ses actifs verts parce qu'une part de ses dépenses est alignée, et elle en contrôle les
 * critères techniques. Le scénario en tire la règle : le prêt vert ne finance qu'un projet dont une part
 * est alignée ; un projet sans part alignée reçoit le prêt classique ; un dossier qui se dit aligné au
 * delà de ce qu'il est se refuse au contrôle, et la banque le note. Aucun chiffre nouveau.
 */

export const CHOIX_DE_LA_LIGNE = ["a", "a-durable", "b"] as const;
export const CHOIX_DU_PRET = ["classique", "vert", "facade"] as const;
export type ChoixDeLaLigne = (typeof CHOIX_DE_LA_LIGNE)[number];
export type ChoixDuPret = (typeof CHOIX_DU_PRET)[number];

/** Les choix possibles de chaque décision, dans l'ordre du scénario : la ligne, puis le prêt. */
export const CHOIX_DU_DOSSIER: readonly (readonly string[])[] = [CHOIX_DE_LA_LIGNE, CHOIX_DU_PRET];

export interface SuiteDuDossier {
  ligne?: ChoixDeLaLigne;
  pret?: ChoixDuPret;
}
export type SuiteCompleteDuDossier = Required<SuiteDuDossier>;

/** Une suite lue d'une liste de codes, dans l'ordre des décisions : null si un code n'existe pas. */
export function suiteDuDossier(codes: readonly string[]): SuiteDuDossier | null {
  if (codes.length > CHOIX_DU_DOSSIER.length) return null;
  if (codes.some((c, i) => !CHOIX_DU_DOSSIER[i]!.includes(c))) return null;
  const [ligne, pret] = codes as [ChoixDeLaLigne?, ChoixDuPret?];
  return { ...(ligne ? { ligne } : {}), ...(pret ? { pret } : {}) };
}

const investissement = (actifs: readonly { montant: number }[]) => actifs.reduce((t, a) => t + a.montant, 0);

/** Ce que chaque ligne apporte au dossier : ses flux (le risque de l'électricité compris), sa part alignée, son énergie, ses emplois. */
export function ligneDuDossier(ligne: ChoixDeLaLigne) {
  const d = deuxProjetsDurables();
  const extra = criteresExtraFinanciers();
  if (ligne === "a") {
    return { flux: d.a, investissement: investissement(PROJET_LIGNE_MANUELLE.actifs), partAlignee: 0, kwhEnMoinsQueB: KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE, emplois: EMPLOIS_CREES.A };
  }
  if (ligne === "a-durable") {
    return { flux: d.aDurable, investissement: extra.investissementDeA, partAlignee: extra.partAligneeDeA, kwhEnMoinsQueB: KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE + KWH_ECONOMISES_PAR_AN, emplois: EMPLOIS_CREES.A };
  }
  return { flux: d.bAvecLeRisque, investissement: investissement(PROJET_LIGNE_SEMI_AUTOMATIQUE.actifs), partAlignee: extra.partAligneeDeB, kwhEnMoinsQueB: 0, emplois: EMPLOIS_CREES.B };
}

/** La VAN d'une ligne au coût du capital de l'activité, le risque de l'électricité compris : ce que la première décision montre. */
export const vanAuCoutDuCapital = (ligne: ChoixDeLaLigne) => van(ligneDuDossier(ligne).flux, TAUX_D_ACTUALISATION_DE_NOVA);

export type RelationAvecLaBanque = "bonne" | "abimee";
export type FinDuDossier = "vert" | "classique" | "refus" | "facade";

/** Le résultat d'une suite complète : le prêt obtenu, le taux du projet, sa VAN, ses critères, la relation avec la banque. */
export function resultatDuDossier(s: SuiteCompleteDuDossier) {
  const l = ligneDuDossier(s.ligne);
  const aligne = l.partAlignee > 0;
  const pretVert = s.pret === "vert" && aligne;
  const taux = pretVert ? deuxProjetsDurables().tauxVert : TAUX_D_ACTUALISATION_DE_NOVA;
  const relation: RelationAvecLaBanque = s.pret === "facade" ? "abimee" : "bonne";
  const fin: FinDuDossier = s.pret === "facade" ? "facade" : s.pret === "vert" ? (pretVert ? "vert" : "refus") : "classique";
  return {
    suite: s,
    ...l,
    aligne,
    pretVert,
    /** La part du projet que le prêt finance, au taux qu'il obtient. */
    pret: { part: PRET_VERT.part, taux: pretVert ? PRET_VERT.tauxVert : PRET_VERT.tauxClassique },
    taux,
    van: van(l.flux, taux),
    tonnesEviteesSurCinqAns: auCentime((l.kwhEnMoinsQueB * KG_CO2_PAR_KWH * DUREE_DES_PROJETS) / 1_000),
    relation,
    fin,
  };
}
export type ResultatDuDossier = ReturnType<typeof resultatDuDossier>;

/** Les neuf suites, dans l'ordre des choix. */
export function toutesLesSuitesDuDossier(): SuiteCompleteDuDossier[] {
  return CHOIX_DE_LA_LIGNE.flatMap((ligne) => CHOIX_DU_PRET.map((pret) => ({ ligne, pret })));
}

/**
 * LA MEILLEURE SUITE, et la règle qui la désigne : d'abord aucune relation abîmée avec la banque (un
 * dossier verdi de façade ne se rattrape pas d'un geste) ; puis la VAN la plus haute, au taux que le
 * financement obtenu donne au projet ; à VAN égale, le plus d'électricité économisée.
 */
export function meilleurDossier(): ResultatDuDossier {
  const admises = toutesLesSuitesDuDossier()
    .map(resultatDuDossier)
    .filter((r) => r.relation !== "abimee");
  return admises.reduce((a, b) => (b.van > a.van + 1e-9 || (Math.abs(b.van - a.van) < 1e-9 && b.kwhEnMoinsQueB > a.kwhEnMoinsQueB) ? b : a));
}
