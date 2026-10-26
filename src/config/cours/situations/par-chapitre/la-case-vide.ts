import { soldUnits } from "../../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../../engine/types";
import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { TRIMESTRE_DECIDE, UNE_DONNEE_FAUSSE, anneeAvecLePlan, donneeFausse } from "../../chapitres/une-donnee-fausse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « UNE DONNÉE FAUSSE, UNE DÉCISION FAUSSE » : LA CASE VIDE (Bac STMG,
 * systèmes d'information de gestion, palier 1).
 *
 * Le chapitre a traqué une donnée inexacte (une virgule déplacée) par la cohérence. Ici, la donnée
 * manque : les ventes d'un trimestre n'ont pas été saisies, et le tableur a compté la case vide
 * pour zéro dans son total. Le responsable des opérations a divisé ce total par le nombre de
 * trimestres et calé sur ce résultat le plan du trimestre 4. L'élève retrouve la donnée manquante
 * par la cohérence (chiffre d'affaires ÷ prix), refait la prévision, et lit dans l'arène ce que le
 * plan du responsable aurait coûté.
 *
 * Le cas est neuf par sa question : la complétude, et non plus l'exactitude. Les chiffres sont ceux
 * du chapitre (`donneeFausse` : l'extrait de l'année du cours, la prévision juste et son trimestre
 * rejoué) ; le plan du responsable est l'année du cours rejouée avec la décision de production du
 * trimestre 4 calée sur le total du tableur (`anneeAvecLePlan`).
 *
 * LA BONNE RÉPONSE EST LA MÊME PARTOUT : remplir la case avant de refaire la moyenne. Ce qui se
 * calcule, c'est ce que la case vide coûte dans chaque entreprise, et l'écart de la moyenne des deux
 * trimestres saisis, l'autre réflexe, à la prévision juste.
 */

/** Le trimestre dont les ventes n'ont pas été saisies. */
export const TRIMESTRE_SANS_SAISIE = 2;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

const manquees = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);

/** L'extrait à la case vide, le plan qu'il a fait prendre, et le trimestre 4 rejoué. */
export function caseVide(c: Cas) {
  const r = donneeFausse(c);
  const lignes = r.lignes.map((l) => ({ ...l, saisie: l.trimestre === TRIMESTRE_SANS_SAISIE ? null : l.ventes }));
  const vide = lignes.find((l) => l.trimestre === TRIMESTRE_SANS_SAISIE)!;
  const n = lignes.length;
  const totalDuTableur = lignes.reduce((t, l) => t + (l.saisie ?? 0), 0);
  const chiffreDAffairesTotal = auCentime(lignes.reduce((t, l) => t + l.chiffreDAffaires, 0));
  const planDuResponsable = Math.round(totalDuTableur / n);
  const moyenneDesSaisis = Math.round(totalDuTableur / (n - 1));
  const k = TRIMESTRE_DECIDE - 1;
  const avecLaCaseVide = anneeAvecLePlan(c.code, `case-vide-au-trimestre-${TRIMESTRE_SANS_SAISIE}`, planDuResponsable)[k]!;
  const juste = anneeAvecLePlan(c.code, "plan-sur-la-prevision-juste", r.previsionJuste)[k]!;
  const venduesVide = Math.round(soldUnits(avecLaCaseVide));
  const resultatVide = Math.round(avecLaCaseVide.incomeStatement.operatingIncome);
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
    venduesVide,
    manqueesVide: Math.round(manquees(avecLaCaseVide)),
    margeVide: Math.round(avecLaCaseVide.incomeStatement.grossMargin),
    resultatVide,
    ventesPerdues: r.venduesJuste - venduesVide,
    coutDeLaCaseVide: r.resultatJuste - resultatVide,
    // Le trimestre rejoué sur la prévision juste est celui du chapitre : même clé, même année.
    resultatJuste: Math.round(juste.incomeStatement.operatingIncome),
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
        const s = caseVide(c);
        return [
          `« J'ai calé le plan du trimestre ${D} sur le tableur : le total des ventes des trimestres ${s.lignes[0]!.trimestre} à ${s.lignes.at(-1)!.trimestre}, divisé par ${s.n}, donne ${qte(s.planDuResponsable)} ${c.unites}. On me dit qu'une case des ventes est restée vide, et que le tableur l'a comptée pour zéro. Avant de lancer le plan, dites-moi ce que vaut vraiment la prévision, et ce que mon plan coûterait à ${c.entreprise}. »`,
          `Pas de cours cette fois : vous avez l'extrait du tableur, où le prix et le chiffre d'affaires sont repris des factures. L'arène a rejoué le trimestre ${D} avec le plan du responsable, puis avec le plan calé sur la prévision juste.`,
        ];
      },
      tableau: (c) => {
        const s = caseVide(c);
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
      question: (c) =>
        `Retrouvez les ventes du trimestre ${V} à partir de son chiffre d'affaires et du prix, puis le vrai total des ventes de l'extrait et la prévision du trimestre ${D}, leur moyenne à l'unité (en ${c.unites}).`,
      champs: (c) => {
        const s = caseVide(c);
        return [
          { libelle: `Ventes du trimestre ${V} (${c.unites})`, attendu: s.vide.ventes, calcul: `${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)}`, tolerance: 1 },
          {
            libelle: `Total des ventes de l'extrait (${c.unites})`,
            attendu: s.r.sommeJuste,
            calcul: `${s.lignes.map((l) => qte(l.ventes)).join(" + ")} = ${qte(s.r.sommeJuste)}`,
            tolerance: 1,
          },
          {
            libelle: `Prévision du trimestre ${D} (${c.unites})`,
            attendu: s.r.previsionJuste,
            calcul: `${qte(s.r.sommeJuste)} ÷ ${s.n} = ${qte(s.r.previsionJuste)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const s = caseVide(c);
        return [
          `La prévision juste est de ${qte(s.r.previsionJuste)} ${c.unites}, pour ${qte(s.planDuResponsable)} dans le plan du responsable : la case vide en retire ${qte(s.r.previsionJuste - s.planDuResponsable)}.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: `Le trimestre ${D} rejoué`,
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const s = caseVide(c);
        return {
          titre: `Le trimestre ${D} rejoué par l'arène`,
          colonnes: ["Plan du responsable", "Plan sur la prévision juste"],
          lignes: [
            { libelle: `« ${s.r.libellePlan} » (${c.unites})`, valeurs: [qte(s.planDuResponsable), qte(s.r.previsionJuste)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(s.venduesVide), qte(s.r.venduesJuste)] },
            { libelle: `Demande non servie (${c.unites})`, valeurs: [qte(s.manqueesVide), qte(s.r.manqueesJuste)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(s.margeVide), eur(s.r.margeJuste)] },
            { libelle: "Résultat de l'activité", valeurs: [eur(s.resultatVide), eur(s.r.resultatJuste)] },
          ],
        };
      },
      question: (c) =>
        `D'après le tableau, calculez les ventes que le plan du responsable ferait perdre (en ${c.unites}), puis ce que la case vide coûterait au résultat de l'activité du trimestre.`,
      champs: (c) => {
        const s = caseVide(c);
        return [
          { libelle: `Ventes perdues (${c.unites})`, attendu: s.ventesPerdues, calcul: `${qte(s.r.venduesJuste)} − ${qte(s.venduesVide)} = ${qte(s.ventesPerdues)}`, tolerance: 1 },
          {
            libelle: "Coût de la case vide sur le résultat",
            attendu: s.coutDeLaCaseVide,
            calcul: `${eur(s.r.resultatJuste)} − ${retranche(s.resultatVide)} = ${eur(s.coutDeLaCaseVide)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const s = caseVide(c);
        return [
          s.coutDeLaCaseVide > 0
            ? `Le plan du responsable laisse ${qte(s.manqueesVide)} ${c.unites} de demande sans réponse, et le résultat du trimestre perd ${eur(s.coutDeLaCaseVide)}. Une case vide ne se voit pas dans un total : c'est le contrôle de complétude qui la trouve.`
            : `Ici, le plan du responsable ne coûte rien au résultat (${eur(s.coutDeLaCaseVide)}) : la demande ne dépassait pas son plan. La prévision n'en reste pas moins fausse.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Quelle réponse envoyez-vous au responsable des opérations ?",
      options: (c) => {
        const s = caseVide(c);
        return [
          {
            texte: "Remplir la case, puis refaire la moyenne",
            juste: true,
            retour: `Oui : ${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)} ${c.unites} au trimestre ${V}, et la prévision du trimestre ${D} passe à ${qte(s.r.previsionJuste)}. Le plan calé sur la case vide coûterait ${eur(s.coutDeLaCaseVide)} de résultat au trimestre ${D}.`,
          },
          {
            texte: "Garder le plan : une case vide vaut zéro",
            juste: false,
            retour: `Non : le trimestre ${V} a bien vendu, ses factures le disent (${eur(s.vide.chiffreDAffaires)}). Compter la case pour zéro retire ${qte(s.r.previsionJuste - s.planDuResponsable)} ${c.unites} à la prévision, et ${eur(s.coutDeLaCaseVide)} au résultat du trimestre ${D}.`,
          },
          {
            texte: "Faire la moyenne des seuls trimestres saisis",
            juste: false,
            retour: `Non : ${qte(s.totalDuTableur)} ÷ ${s.n - 1} = ${qte(s.moyenneDesSaisis)}, à ${qte(Math.abs(s.ecartDesSaisis))} ${c.unites} de la prévision juste. C'est laisser de côté un trimestre réel, alors que la donnée se retrouve : ${eur(s.vide.chiffreDAffaires)} ÷ ${eur(s.vide.prix)} = ${qte(s.vide.ventes)}.`,
          },
        ];
      },
    },
  ],
};
