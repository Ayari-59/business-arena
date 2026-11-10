import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { PGI_EN_NUAGE } from "./processus-de-commande";

/**
 * LE MONDE DU COURS : LE PROJET DE PGI DE NOVA (enseignement spécifique de systèmes d'information de
 * gestion de terminale STMG, thème 2, question 2.2, lot F).
 *
 * CE QUI VIENT DES FICHES : le PGI en nuage que « Le processus et le PGI » proposait, à 75 € par poste et
 * par mois pour 4 postes (processus-de-commande.ts). Ici, NOVA le met en place : c'est un projet.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LES TÂCHES DU PROJET, leurs durées en jours ouvrés et leurs antériorités, dans le tableau
 *     ci-dessous ; une tâche commence dès que toutes celles qui la précèdent sont finies ;
 *   · L'INTÉGRATEUR, qui paramètre le PGI, reprend les données et forme les utilisateurs, facture 650 € la
 *     journée ; la recette est faite par les utilisateurs de NOVA ;
 *   · LE PARAMÉTRAGE a pris 13 jours au lieu des 10 prévus ;
 *   · LE CAS : la formation est reportée de 9 jours, sans coûter plus (l'intégrateur n'est pas libre plus
 *     tôt), et le paramétrage prend 2 jours de plus, facturés.
 */

export const ENTREPRISES_DU_PROJET = ENTREPRISES_DE_LA_DIRECTION;

export type CodeDeTache = "etude" | "choix" | "parametrage" | "reprise" | "formation" | "recette" | "demarrage";

export interface TacheDuProjet {
  code: CodeDeTache;
  lettre: string;
  libelle: string;
  duree: number;
  apres: readonly CodeDeTache[];
  /** L'intégrateur facture cette tâche à la journée. */
  facturee: boolean;
}

export const TACHES: readonly TacheDuProjet[] = [
  { code: "etude", lettre: "A", libelle: "Étudier les besoins", duree: 5, apres: [], facturee: false },
  { code: "choix", lettre: "B", libelle: "Choisir l'éditeur", duree: 3, apres: ["etude"], facturee: false },
  { code: "parametrage", lettre: "C", libelle: "Paramétrer le PGI", duree: 10, apres: ["choix"], facturee: true },
  { code: "reprise", lettre: "D", libelle: "Reprendre les données", duree: 4, apres: ["choix"], facturee: true },
  { code: "formation", lettre: "E", libelle: "Former les utilisateurs", duree: 3, apres: ["choix"], facturee: true },
  { code: "recette", lettre: "F", libelle: "Faire la recette", duree: 4, apres: ["parametrage", "reprise"], facturee: false },
  { code: "demarrage", lettre: "G", libelle: "Démarrer", duree: 1, apres: ["formation", "recette"], facturee: false },
];

export const INTEGRATEUR = { parJour: 650 } as const;
export const PARAMETRAGE_REEL = 13;
export const RETARDS_DU_CAS = { formation: 9, parametrage: 2 } as const;
export const LICENCES_DE_L_ANNEE = PGI_EN_NUAGE.parPosteEtParMois * PGI_EN_NUAGE.postes * 12;

/** Le planning au plus tôt, les durées données (par défaut, celles du plan) : le début et la fin de chaque tâche, et la fin du projet. */
export function planning(durees: Partial<Record<CodeDeTache, number>> = {}) {
  const fin = new Map<CodeDeTache, number>();
  const lignes = TACHES.map((t) => {
    const debut = Math.max(0, ...t.apres.map((a) => fin.get(a)!));
    const duree = durees[t.code] ?? t.duree;
    fin.set(t.code, debut + duree);
    return { ...t, duree, debut, fin: debut + duree };
  });
  return { lignes, fin: Math.max(...lignes.map((l) => l.fin)) };
}

/** La marge d'une tâche : les jours qu'elle peut perdre sans retarder la fin du projet. */
export function marge(code: CodeDeTache) {
  const base = planning().fin;
  let m = 0;
  while (planning({ [code]: TACHES.find((t) => t.code === code)!.duree + m + 1 }).fin === base) m++;
  return m;
}

/** Les tâches critiques : celles qui n'ont aucune marge. */
export const tachesCritiques = () => TACHES.filter((t) => marge(t.code) === 0);

/** La fin du projet si la reprise des données prend du retard. */
export const finAvecUnRetardDeLaReprise = (retard: number) => planning({ reprise: TACHES.find((t) => t.code === "reprise")!.duree + retard }).fin;

/** Le budget de l'intégrateur, prévu et réel, et l'écart. */
export function ecartDuBudget() {
  const facturees = TACHES.filter((t) => t.facturee);
  const joursPrevus = facturees.reduce((s, t) => s + t.duree, 0);
  const joursReels = joursPrevus - TACHES.find((t) => t.code === "parametrage")!.duree + PARAMETRAGE_REEL;
  const prevu = auCentime(joursPrevus * INTEGRATEUR.parJour);
  const reel = auCentime(joursReels * INTEGRATEUR.parJour);
  const ecart = auCentime(reel - prevu);
  return { joursPrevus, joursReels, prevu, reel, ecart, ecartPct: Math.round((ecart / prevu) * 1_000) / 10, finReelle: planning({ parametrage: PARAMETRAGE_REEL }).fin };
}

/** Le cas : la formation reportée (un retard de son début, qui ne coûte rien) et le paramétrage allongé (facturé). */
export function retardsDuCas() {
  const d = Object.fromEntries(TACHES.map((t) => [t.code, t.duree])) as Record<CodeDeTache, number>;
  const fin = planning({ formation: d.formation + RETARDS_DU_CAS.formation, parametrage: d.parametrage + RETARDS_DU_CAS.parametrage }).fin;
  const surcout = auCentime(RETARDS_DU_CAS.parametrage * INTEGRATEUR.parJour);
  return { ...RETARDS_DU_CAS, prevue: planning().fin, fin, decalage: fin - planning().fin, surcout, margeDeLaFormation: marge("formation") };
}
