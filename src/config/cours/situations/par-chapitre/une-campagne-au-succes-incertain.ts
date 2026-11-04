import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_SEUIL_ALEATOIRE, ficheDe } from "../../chapitres/le-seuil-en-avenir-aleatoire";
import { T_DE_LA_TABLE, arrondi, lectureDeLaTable } from "../../monde/loi-normale";
import { CONFIANCE_DU_MOIS_REDOUTE, OBJECTIF_DU_DIRIGEANT, moisAleatoireDeLaFiche, resultatDepasse, seuilAleatoire } from "../../monde/seuil-aleatoire";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SEUIL DE PROFITABILITÉ EN AVENIR ALÉATOIRE » : UNE CAMPAGNE AU SUCCÈS
 * INCERTAIN (contrôle de gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le mois de janvier de NOVA et la loi de ses
 * ventes (monde/seuil-aleatoire.ts), calculés par la loi normale du cours (monde/loi-normale.ts).
 *
 * HYPOTHÈSE DU CAS : une agence propose une campagne sur les réseaux sociaux, CAMPAGNE.coutParMois de
 * plus par mois, en plus de la publicité de la gamme. Elle promet CAMPAGNE.ventesEnPlus enceintes de
 * plus en moyenne ; mais son effet est incertain, et l'écart-type des ventes monterait à
 * CAMPAGNE.ecartType. L'élève refait seul le chemin du chapitre : la loi du résultat avec la campagne,
 * la probabilité d'une perte, celle de l'objectif, le mois redouté. La réponse demande un jugement :
 * la campagne rapporte plus en moyenne, mais elle ne rend pas NOVA plus sûre, elle la rend un peu
 * moins sûre. C'est un choix de risque, que l'espérance seule ne tranche pas.
 */

/** La campagne proposée : son coût par mois, les ventes qu'elle ajoute en moyenne, l'écart-type des ventes avec elle (hypothèses du cas). */
export const CAMPAGNE = { coutParMois: 1_600, ventesEnPlus: 100, ecartType: 190 } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pr = (p: number) => (p + 0).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const tt = (t: number) => (t + 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 }).replace(/^-/, "−");
const pct = (p: number) => `${qte(p * 100, 1)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const TOLERANCE_D_UNE_PROBABILITE = 0.002;

/** Les chiffres du cas, sans et avec la campagne. */
export function campagneIncertaine(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const d = moisAleatoireDeLaFiche(f);
  const sans = seuilAleatoire(d);
  const avec = seuilAleatoire({ ...d, chargesFixes: d.chargesFixes + CAMPAGNE.coutParMois, moyenne: d.moyenne + CAMPAGNE.ventesEnPlus, ecartType: CAMPAGNE.ecartType });
  const objectif = (x: typeof sans) => {
    const t = arrondi((OBJECTIF_DU_DIRIGEANT - x.resultat.esperance) / x.resultat.ecartType, 2);
    return { t, lu: arrondi(1 - lectureDeLaTable(t), 4) };
  };
  return {
    f,
    d,
    sans,
    avec,
    objectifSans: objectif(sans),
    objectifAvec: objectif(avec),
    redouteSans: resultatDepasse(sans, CONFIANCE_DU_MOIS_REDOUTE, T_DE_LA_TABLE.unCoteA95),
    redouteAvec: resultatDepasse(avec, CONFIANCE_DU_MOIS_REDOUTE, T_DE_LA_TABLE.unCoteA95),
    gain: auCentime(avec.resultat.esperance - sans.resultat.esperance),
  };
}

export const UNE_CAMPAGNE_AU_SUCCES_INCERTAIN: Situation = {
  code: "une-campagne-au-succes-incertain",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["le-seuil-en-avenir-aleatoire"],
  commanditaire: "Le dirigeant",
  titre: "Une campagne au succès incertain",
  accroche: `Une agence promet ${CAMPAGNE.ventesEnPlus} ventes de plus par mois, pour un effet incertain. La campagne rend-elle NOVA plus riche, plus sûre, ou ni l'un ni l'autre ?`,
  objectifs: [
    "Déduire la loi du résultat d'une décision qui change l'espérance et l'écart-type des ventes",
    "Comparer deux probabilités de perte et d'objectif, et le mois redouté",
    "Rendre un avis qui tient compte du gain attendu et du risque",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL_ALEATOIRE,
    pourquoi: "ce cas reprend le chapitre « Le seuil de profitabilité en avenir aléatoire », qui se joue sur le mois de janvier de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = campagneIncertaine(c);
        return [
          `« Une agence me propose une campagne sur les réseaux sociaux : ${eur(CAMPAGNE.coutParMois)} par mois, en plus de notre publicité. Elle promet ${qte(CAMPAGNE.ventesEnPlus)} enceintes de plus en moyenne chaque mois, mais elle ne garantit rien : avec elle, nos ventes seraient plus dispersées. Est-ce que je gagnerai plus, et est-ce que je risquerai moins ? »`,
          `Pas de cours cette fois : vous avez le mois de janvier de ${n.f.entreprise}, la loi de ses ventes, et ce que la campagne y change.`,
        ];
      },
      tableau: (c) => {
        const n = campagneIncertaine(c);
        return {
          titre: `Le mois de janvier de ${n.f.entreprise}, sans et avec la campagne`,
          colonnes: ["Sans la campagne", "Avec la campagne"],
          lignes: [
            { libelle: "Prix de vente d'une enceinte", valeurs: [eur(n.d.prix), eur(n.d.prix)] },
            { libelle: "Coût variable d'une enceinte", valeurs: [eur(n.d.coutVariableUnitaire), eur(n.d.coutVariableUnitaire)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(n.sans.chargesFixes), eur(n.avec.chargesFixes)] },
            { libelle: "Espérance des ventes", valeurs: [`${qte(n.sans.moyenne)} enceintes`, `${qte(n.avec.moyenne)} enceintes`] },
            { libelle: "Écart-type des ventes", valeurs: [`${qte(n.sans.ecartType)} enceintes`, `${qte(n.avec.ecartType)} enceintes`] },
          ],
        };
      },
      repere: () => `À rendre : la loi du résultat avec la campagne, la probabilité d'une perte et celle de l'objectif de ${eur(OBJECTIF_DU_DIRIGEANT)}, sans et avec elle, le mois redouté, et votre réponse.`,
    },
    {
      id: "la-loi-avec-la-campagne",
      type: "montants",
      titre: "Le résultat avec la campagne",
      notions: ["contribution_margin", "breakeven"],
      question: () => "Calculez, avec la campagne, le seuil de profitabilité en enceintes, l'espérance du résultat du mois et son écart-type.",
      champs: (c) => {
        const n = campagneIncertaine(c);
        const a = n.avec;
        return [
          { libelle: "Seuil de profitabilité avec la campagne, en enceintes", attendu: auCentime(a.seuil!), tolerance: 0.05, calcul: `${eur(a.chargesFixes)} ÷ ${eur(a.marge)} = ${qte(a.seuil!)}` },
          { libelle: "Espérance du résultat", attendu: a.resultat.esperance, calcul: `${eur(a.marge)} × ${qte(a.moyenne)} − ${eur(a.chargesFixes)} = ${eur(a.resultat.esperance)}` },
          { libelle: "Écart-type du résultat", attendu: a.resultat.ecartType, calcul: `${eur(a.marge)} × ${qte(a.ecartType)} = ${eur(a.resultat.ecartType)}` },
        ];
      },
      explication: (c) => {
        const n = campagneIncertaine(c);
        return [`La campagne rapporte ${eur(n.gain)} de plus en moyenne : ses ${qte(CAMPAGNE.ventesEnPlus)} ventes laissent ${eur(auCentime(CAMPAGNE.ventesEnPlus * n.avec.marge))} de marge, pour ${eur(CAMPAGNE.coutParMois)} de coût. Mais l'écart-type du résultat passe de ${eur(n.sans.resultat.ecartType)} à ${eur(n.avec.resultat.ecartType)}.`];
      },
    },
    {
      id: "les-probabilites",
      type: "montants",
      titre: "La perte et l'objectif",
      notions: ["breakeven", "safety_margin"],
      question: () => `Calculez la probabilité d'une perte sans la campagne, puis avec elle, et la probabilité d'atteindre l'objectif de ${eur(OBJECTIF_DU_DIRIGEANT)} avec elle.`,
      champs: (c) => {
        const n = campagneIncertaine(c);
        const s = n.sans;
        const a = n.avec;
        return [
          { libelle: "Probabilité d'une perte, sans la campagne", attendu: s.perteLue, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `t = (${qte(s.seuil!)} − ${qte(s.moyenne)}) ÷ ${qte(s.ecartType)} = ${tt(s.tLu)} ; Π(${tt(s.tLu)}) = ${pr(s.perteLue)}` },
          { libelle: "Probabilité d'une perte, avec la campagne", attendu: a.perteLue, tolerance: TOLERANCE_D_UNE_PROBABILITE, calcul: `t = (${qte(a.seuil!)} − ${qte(a.moyenne)}) ÷ ${qte(a.ecartType)} = ${tt(a.tLu)} ; Π(${tt(a.tLu)}) = ${pr(a.perteLue)}` },
          {
            libelle: `Probabilité d'atteindre ${eur(OBJECTIF_DU_DIRIGEANT)}, avec la campagne`,
            attendu: n.objectifAvec.lu,
            tolerance: TOLERANCE_D_UNE_PROBABILITE,
            calcul: `t = (${eur(OBJECTIF_DU_DIRIGEANT)} − ${eur(a.resultat.esperance)}) ÷ ${eur(a.resultat.ecartType)} = ${tt(n.objectifAvec.t)} ; 1 − Π(${tt(n.objectifAvec.t)}) = ${pr(n.objectifAvec.lu)}, contre ${pr(n.objectifSans.lu)} sans elle`,
          },
        ];
      },
      explication: (c) => {
        const n = campagneIncertaine(c);
        return [`Le seuil monte avec les charges fixes, et la dispersion élargit la loi : la marge de sécurité, comptée en écarts-types, passe de ${tt(-n.sans.tLu)} à ${tt(-n.avec.tLu)}. Le risque de perte ne baisse donc pas, alors que les bons mois deviennent plus fréquents.`];
      },
    },
    {
      id: "le-mois-redoute",
      type: "montants",
      titre: "Le mois redouté",
      question: () => "Calculez, sans puis avec la campagne, le résultat que le mois dépasse 95 fois sur 100.",
      champs: (c) => {
        const n = campagneIncertaine(c);
        const t = T_DE_LA_TABLE.unCoteA95;
        return [
          { libelle: "Résultat dépassé 95 fois sur 100, sans la campagne", attendu: n.redouteSans, tolerance: 20, calcul: `${eur(n.sans.resultat.esperance)} − ${tt(t)} × ${eur(n.sans.resultat.ecartType)} = ${eur(n.redouteSans)}` },
          { libelle: "Résultat dépassé 95 fois sur 100, avec la campagne", attendu: n.redouteAvec, tolerance: 20, calcul: `${eur(n.avec.resultat.esperance)} − ${tt(t)} × ${eur(n.avec.resultat.ecartType)} = ${eur(n.redouteAvec)}` },
        ];
      },
      explication: (c) => {
        const n = campagneIncertaine(c);
        return [`Le mauvais mois est plus mauvais avec la campagne : 1 mois sur 20, ${n.f.entreprise} perdrait plus de ${eur(-n.redouteAvec)}, au lieu de ${eur(-n.redouteSans)}.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["breakeven"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const n = campagneIncertaine(c);
        return [
          {
            texte: `Un pari : ${eur(n.gain)} de plus en moyenne, pour un risque un peu plus fort`,
            juste: n.gain > 0 && n.avec.perteLue >= n.sans.perteLue,
            retour: `Oui. Le résultat attendu monte de ${eur(n.gain)} et l'objectif devient plus probable, ${pct(n.objectifAvec.lu)} au lieu de ${pct(n.objectifSans.lu)}. Mais la perte est un peu plus probable, ${pct(n.avec.perteLue)} au lieu de ${pct(n.sans.perteLue)}, et le mauvais mois plus lourd. À vous de dire si la trésorerie supporte ce risque.`,
          },
          {
            texte: `Oui sans hésiter : le résultat attendu monte de ${eur(n.gain)}, c'est tout ce qui compte`,
            juste: false,
            retour: "Non : l'espérance ne dit rien du risque. Deux décisions de même espérance peuvent avoir des probabilités de perte très différentes.",
          },
          {
            texte: `Non : ${eur(CAMPAGNE.coutParMois)} par mois pour ${qte(CAMPAGNE.ventesEnPlus)} ventes, la campagne coûte plus qu'elle ne rapporte`,
            juste: n.gain <= 0,
            retour: `Non : ${qte(CAMPAGNE.ventesEnPlus)} ventes laissent ${eur(auCentime(CAMPAGNE.ventesEnPlus * n.avec.marge))} de marge, plus que ${eur(CAMPAGNE.coutParMois)}. Une vente rapporte sa marge, pas son prix.`,
          },
          {
            texte: "Oui : avec plus de ventes, la probabilité de perdre de l'argent baisse forcément",
            juste: n.gain > 0 && n.avec.perteLue < n.sans.perteLue,
            retour: `Non : le seuil monte avec la campagne, et les ventes se dispersent. La probabilité de perte passe de ${pct(n.sans.perteLue)} à ${pct(n.avec.perteLue)}.`,
          },
        ];
      },
    },
  ],
};
