import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { TRIMESTRE_DECIDE, UNE_DONNEE_FAUSSE, donneeFausse } from "../../chapitres/une-donnee-fausse";
import { FICHE_DE_CAPACITE, trimestreDecide } from "../../monde/gestion-et-information";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « UNE DONNÉE FAUSSE, UNE DÉCISION FAUSSE » : LA CASE VIDE (Bac STMG,
 * systèmes d'information de gestion, palier 1).
 *
 * Le chapitre a traqué une donnée inexacte (une virgule déplacée) par la cohérence. Ici, la donnée
 * manque : les ventes d'un trimestre n'ont pas été saisies, et le tableur a compté la case vide pour
 * zéro dans son total. Le responsable des opérations a divisé ce total par le nombre de trimestres
 * et calé sur ce résultat le plan du trimestre 4. L'élève retrouve la donnée manquante par la
 * cohérence (chiffre d'affaires ÷ prix), refait la prévision, et lit ce que le plan du responsable
 * aurait coûté.
 *
 * Le cas est neuf par sa question : la complétude, et non plus l'exactitude. Les chiffres sont ceux
 * du chapitre (`donneeFausse` : l'extrait de l'année N de NOVA, la prévision juste), et le
 * trimestre 4 rejoué avec chaque plan (`trimestreDecide`, monde/gestion-et-information.ts). Le cas
 * rejouait l'année de l'arène, dans sept entreprises.
 */

/** Le trimestre dont les ventes n'ont pas été saisies (hypothèse du cas). */
export const TRIMESTRE_SANS_SAISIE = 2;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'extrait à la case vide, le plan qu'il a fait prendre, et le trimestre 4 rejoué. */
export function caseVide() {
  const r = donneeFausse();
  const lignes = r.lignes.map((l) => ({ ...l, saisie: l.trimestre === TRIMESTRE_SANS_SAISIE ? null : l.ventes }));
  const vide = lignes.find((l) => l.trimestre === TRIMESTRE_SANS_SAISIE)!;
  const n = lignes.length;
  const totalDuTableur = lignes.reduce((t, l) => t + (l.saisie ?? 0), 0);
  const chiffreDAffairesTotal = auCentime(lignes.reduce((t, l) => t + l.chiffreDAffaires, 0));
  const planDuResponsable = Math.round(totalDuTableur / n);
  const moyenneDesSaisis = Math.round(totalDuTableur / (n - 1));
  const avecLaCaseVide = trimestreDecide(FICHE_DE_CAPACITE, planDuResponsable);
  const juste = r.juste;
  return {
    r,
    lignes,
    vide,
    n,
    totalDuTableur,
    chiffreDAffairesTotal,
    planDuResponsable,
    moyenneDesSaisis,
    ecartDesSaisis: moyenneDesSaisis - r.previsionJuste,
    avecLaCaseVide,
    juste,
    ventesPerdues: juste.vendues - avecLaCaseVide.vendues,
    coutDeLaCaseVide: auCentime(juste.marge - avecLaCaseVide.marge),
  };
}

const V = TRIMESTRE_SANS_SAISIE;
const D = TRIMESTRE_DECIDE;

export const LA_CASE_VIDE: Situation = {
  code: "la-case-vide",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: [UNE_DONNEE_FAUSSE.code],
  commanditaire: "Le responsable des opérations",
  titre: "La case vide",
  accroche:
    "Les ventes d'un trimestre n'ont pas été saisies, le tableur a compté la case pour zéro, et le plan du trimestre suivant est calé sur ce total. Retrouver la donnée, refaire la prévision, et dire ce que le plan aurait coûté.",
  objectifs: [
    "Repérer une donnée manquante dans un extrait",
    "Retrouver la donnée par la cohérence des autres",
    "Refaire la prévision sur des données complètes",
    "Chiffrer ce que la donnée manquante aurait coûté, et répondre au responsable",
  ],
  libre: false,
  entreprises: UNE_DONNEE_FAUSSE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable des opérations",
      texte: (c) => {
        const s = caseVide();
        return [
          `« J'ai calé le plan du trimestre ${D} sur le tableur : le total des ventes des trimestres ${s.lignes[0]!.trimestre} à ${s.lignes.at(-1)!.trimestre}, divisé par ${s.n}, donne ${qte(s.planDuResponsable)} ${c.unites}. On me dit qu'une case des ventes est restée vide, et que le tableur l'a comptée pour zéro. Avant de lancer la production, dites-moi ce qu'il faut corriger, et ce que mon plan aurait coûté. »`,
          `Pas de cours cette fois : vous avez l'extrait du tableur, où le prix et le chiffre d'affaires sont repris des factures. Le trimestre ${D} a été rejoué avec le plan du responsable, puis avec le plan calé sur la prévision juste.`,
        ];
      },
      tableau: (c) => {
        const s = caseVide();
        return {
          titre: `L'extrait du tableur ${dE(c.entreprise)}`,
          colonnes: [`Ventes (${c.unites})`, "Prix de vente", "Chiffre d'affaires"],
          lignes: [
            ...s.lignes.map((l) => ({ libelle: `Trimestre ${l.trimestre}`, valeurs: [l.saisie === null ? "" : qte(l.saisie), eur(l.prix), eur(l.chiffreDAffaires)] })),
            { libelle: "Total calculé par le tableur", valeurs: [qte(s.totalDuTableur), "", eur(s.chiffreDAffairesTotal)] },
          ],
        };
      },
      repere: () => "À rendre : la donnée manquante, la prévision juste, ce que le plan du responsable coûterait, et votre réponse.",
    },
    {
      id: "completer",
      type: "montants",
      titre: "Compléter l'extrait",
      notions: ["revenue"],
      question: (c) => `Retrouvez les ventes du trimestre ${V} à partir de son chiffre d'affaires et du prix, puis le vrai total des ventes de l'extrait et la prévision du trimestre ${D}, leur moyenne à l'unité (en ${c.unites}).`,
      champs: (c) => {
        const s = caseVide();
        return [
          { libelle: `Ventes du trimestre ${V} (${c.unites})`, attendu: s.vide.ventes, calcul: `${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)}` },
          { libelle: `Total des ventes de l'extrait (${c.unites})`, attendu: s.r.sommeJuste, calcul: `${s.lignes.map((l) => qte(l.ventes)).join(" + ")} = ${qte(s.r.sommeJuste)}` },
          { libelle: `Prévision du trimestre ${D} (${c.unites})`, attendu: s.r.previsionJuste, calcul: `${qte(s.r.sommeJuste)} ÷ ${s.n} = ${qte(s.r.previsionJuste)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const s = caseVide();
        return [`La prévision juste est de ${qte(s.r.previsionJuste)} ${c.unites}, pour ${qte(s.planDuResponsable)} dans le plan du responsable : la case vide en retire ${qte(s.r.previsionJuste - s.planDuResponsable)}.`];
      },
    },
    {
      id: "le-trimestre-rejoue",
      type: "montants",
      titre: `Le trimestre ${D} rejoué`,
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const s = caseVide();
        return {
          titre: `Le trimestre ${D}, rejoué avec chaque plan`,
          colonnes: ["Plan du responsable", "Plan sur la prévision juste"],
          lignes: [
            { libelle: `Plan de production (${c.unites})`, valeurs: [qte(s.planDuResponsable), qte(s.r.previsionJuste)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(s.avecLaCaseVide.vendues), qte(s.juste.vendues)] },
            { libelle: `Demande non servie (${c.unites})`, valeurs: [qte(s.avecLaCaseVide.manquees), qte(s.juste.manquees)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(s.avecLaCaseVide.marge), eur(s.juste.marge)] },
          ],
        };
      },
      question: (c) => `D'après le tableau, calculez les ventes que le plan du responsable ferait perdre (en ${c.unites}), puis ce que la case vide coûterait à la marge du trimestre.`,
      champs: (c) => {
        const s = caseVide();
        return [
          { libelle: `Ventes perdues (${c.unites})`, attendu: s.ventesPerdues, calcul: `${qte(s.juste.vendues)} − ${qte(s.avecLaCaseVide.vendues)} = ${qte(s.ventesPerdues)}` },
          { libelle: "Coût de la case vide sur la marge", attendu: s.coutDeLaCaseVide, calcul: `${eur(s.juste.marge)} − ${eur(s.avecLaCaseVide.marge)} = ${eur(s.coutDeLaCaseVide)}` },
        ];
      },
      explication: (c) => {
        const s = caseVide();
        return [
          `Le plan du responsable laisse ${qte(s.avecLaCaseVide.manquees)} ${c.unites} de demande sans réponse, et la marge du trimestre perd ${eur(s.coutDeLaCaseVide)}. Une case vide ne se voit pas dans un total : c'est le contrôle de complétude qui la trouve.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Quelle réponse envoyez-vous au responsable des opérations ?",
      options: (c) => {
        const s = caseVide();
        return [
          { texte: "Remplir la case, puis refaire la moyenne", juste: true, retour: `Oui : ${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)} ${c.unites} au trimestre ${V}, et la prévision du trimestre ${D} passe à ${qte(s.r.previsionJuste)}. Le plan calé sur la case vide coûterait ${eur(s.coutDeLaCaseVide)} de marge au trimestre ${D}.` },
          { texte: "Garder le plan : une case vide vaut zéro", juste: false, retour: `Non : le trimestre ${V} a bien vendu, ses factures le disent (${eur(s.vide.chiffreDAffaires)}). Compter la case pour zéro retire ${qte(s.r.previsionJuste - s.planDuResponsable)} ${c.unites} à la prévision, et ${eur(s.coutDeLaCaseVide)} à la marge du trimestre ${D}.` },
          { texte: "Faire la moyenne des seuls trimestres saisis", juste: false, retour: `Non : ${qte(s.totalDuTableur)} ÷ ${s.n - 1} = ${qte(s.moyenneDesSaisis)}, à ${qte(Math.abs(s.ecartDesSaisis))} ${c.unites} de la prévision juste. C'est laisser de côté un trimestre réel, alors que la donnée se retrouve : ${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)}.` },
        ];
      },
    },
  ],
};

export type CaseVide = ReturnType<typeof caseVide>;
