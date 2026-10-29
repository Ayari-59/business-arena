import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  anneeDeProduction,
  budgetDUnPoint,
  coutMoyenDUnDefaut,
  defautsEnPlusDeLEntretien,
  entretienDeLAnnee,
  margeUnitaire,
  sansEntretienAuTrimestre,
  seuilDEntretien,
  variationDeDisponibilite,
} from "../monde/capacite";
import { CAPACITES_DU_COURS, type FicheDeLaCapacite } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ENTRETENIR L'OUTIL, MAINTENANCE ET DISPONIBILITÉ (BTS GPME, palier 3, bloc 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la ligne de
 * montage de NOVA a une fiche figée (monde/nova-capacite.ts) et son année N + 1 se calcule par le
 * modèle du cours (monde/capacite.ts, partie 2 : `variationDeDisponibilite`, `seuilDEntretien`,
 * `disponibilitesDeLAnnee`, `entretienDeLAnnee`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : sauter l'entretien d'un trimestre fait une économie certaine. La ligne s'use (5 points
 * de disponibilité), l'entretien la répare en proportion de son budget (7,5 points à la référence),
 * et le seuil où elle cesse de baisser est 3 000 €. En N + 1, L'OUTIL EST LE GOULOT aux trimestres 2
 * et 4 : l'entretien sauté au trimestre 1 coûte des ventes au trimestre 2, et l'économie se perd. Le
 * même entretien sauté sur la demande de N, l'année témoin, ne coûte aucune vente : un outil moins
 * disponible ne coûte que s'il borne la production. Une ligne mal entretenue monte aussi mal : les
 * défauts en plus font du budget de référence le meilleur budget, et du seuil un faux ami.
 *
 * Ce qui a changé depuis l'arène : le chapitre rejouait l'année de l'arène, où l'outil de NOVA n'était
 * jamais le goulot (la marge perdue valait 0 €, la leçon devenait « ne pas entretenir rapporte », et
 * le distracteur « l'économie tient » était vrai aussi). Il se joue sur l'année N + 1 prévue de la
 * simulation du cours, où l'outil est le goulot ; le distracteur redevient faux. La branche des
 * rebuts, qui ne jouait qu'au bistrot, se joue chez NOVA.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, le-seuil, la-disponibilite (la formule est au repère ou dans la question, qui
 *     nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-seuil
 *     puis le-seuil-au-curseur (un curseur sur le budget, face à ce que coûte la réparation de
 *     l'usure) avant le-seuil ; predire-la-perte puis la-demande-qui-coute (un curseur sur la demande
 *     du trimestre 2, la marge perdue face à l'économie) avant le-goulot ; predire-le-meilleur-budget
 *     puis le laboratoire (4 budgets, un graphique selon le budget du trimestre 1) ;
 *   · autonome : le-goulot, verdict, les-defauts (ni formule ni chiffres à prendre ; le calcul de la
 *     correction montre le chemin) ;
 *   · expert : la-demande-de-n (le contraste : l'outil n'y est pas le goulot), au-trimestre-2 (une
 *     variante chiffrée : la perte arrive 2 trimestres plus tard), a-rebours (retrouver le budget d'un
 *     trimestre à partir de la capacité d'un autre), ce-que-vaut-le-chiffre (une critique de la
 *     méthode) ; puis la synthèse.
 */

/** Le trimestre sans entretien : le premier de l'année, pour en voir toute la suite (la mission « jouez » le reprend). */
export const TRIMESTRE_SANS_ENTRETIEN = 1;

/** L'entretien se chiffre sur la ligne de montage de NOVA, la PME industrielle de la comptabilité et du contrôle de gestion. */
export const ENTREPRISES_DE_L_ENTRETIEN: readonly string[] = ["nova"];

/** La variante : l'entretien sauté au trimestre 2 au lieu du trimestre 1. */
export const TRIMESTRE_DE_LA_VARIANTE = 2;

/**
 * LE CALCUL À REBOURS, hypothèse du cours : les trimestres 1 et 2 sont entretenus à la référence, et
 * la ligne n'est plus disponible qu'à 98 % au trimestre 4. L'élève retrouve le budget du trimestre 3.
 */
export const DISPONIBILITE_A_REBOURS = 0.98;
export const TRIMESTRE_A_REBOURS = 3;

/** Le laboratoire : chaque budget trimestriel va de 0 à la référence, par 500 €. */
export const PAS_DU_LABORATOIRE = 500;

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
/** Une part ou une disponibilité, en pourcentage au dixième. */
const pct = (t: number) => `${qte(Math.round(t * 1000) / 10)} %`;
/** Des points de disponibilité ou de taux de défaut. */
const points = (t: number) => {
  const n = Math.round(t * 1000) / 10;
  return `${qte(n)} point${Math.abs(n) >= 2 ? "s" : ""}`;
};

/** La fiche de la capacité du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaCapacite => CAPACITES_DU_COURS[c.code]!;

/** Les budgets de l'année : la référence partout, sauf au trimestre donné. */
const budgetsSauf = (f: FicheDeLaCapacite, trimestre: number, budget: number) => f.plan.entretien.map((b, i) => (i === trimestre - 1 ? budget : b));

/** L'entretien de la ligne de NOVA : tout ce que le chapitre et son cas demandent. */
export function entretienDeLOutil(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = f.entretien;
  const T = TRIMESTRE_SANS_ENTRETIEN;
  const marge = margeUnitaire(f);
  const reference = e.budgetDeReference;
  const unPoint = budgetDUnPoint(f);
  const seuil = seuilDEntretien(f);
  const plan = anneeDeProduction(f);
  const sans = sansEntretienAuTrimestre(f, T);
  const surN = entretienDeLAnnee(f, budgetsSauf(f, T, 0), { demande: f.anneeN.demande });
  const variante = sansEntretienAuTrimestre(f, TRIMESTRE_DE_LA_VARIANTE);
  // À rebours : la disponibilité perdue au trimestre 4 dit ce que le budget du trimestre 3 n'a pas réparé.
  const pointsPerdusARebours = Math.round((1 - DISPONIBILITE_A_REBOURS) * 1e9) / 1e9;
  const budgetARebours = auCentime(((e.usureParTrimestre - pointsPerdusARebours) / e.reparationAuBudgetDeReference) * reference);
  const aRebours = entretienDeLAnnee(f, budgetsSauf(f, TRIMESTRE_A_REBOURS, budgetARebours));
  // Le curseur de la demande : à partir de quelle demande du trimestre 2 la marge perdue dépasse l'économie.
  const outilApres = sans.trimestres[T]!.capaciteOutil;
  const demandeQuiCoute = outilApres + Math.ceil(sans.economie / marge - 1e-9);
  // Le meilleur budget du trimestre 1, défauts compris, par pas du laboratoire.
  const budgetsDuT1 = Array.from({ length: reference / PAS_DU_LABORATOIRE + 1 }, (_, i) => i * PAS_DU_LABORATOIRE);
  const parBudget = budgetsDuT1.map((b) => ({ budget: b, s: entretienDeLAnnee(f, budgetsSauf(f, T, b)) }));
  const meilleurDefautsCompris = parBudget.reduce((m, x) => (x.s.ecartDeResultat > m.s.ecartDeResultat ? x : m)).budget;
  const meilleurSansLesDefauts = parBudget.reduce((m, x) => (x.s.ecartParLaDisponibilite > m.s.ecartParLaDisponibilite ? x : m)).budget;
  const verdict: Verdict = sans.ventesPerdues === 0 ? "rien-ne-se-perd" : sans.ecartParLaDisponibilite > 0 ? "l-economie-tient" : "l-economie-se-perd";
  return {
    f,
    e,
    T,
    marge,
    reference,
    unPoint,
    seuil,
    economieAuSeuil: auCentime(reference - seuil),
    reparation: e.reparationAuBudgetDeReference,
    usure: e.usureParTrimestre,
    plan,
    sans,
    surN,
    variante,
    pointsPerdusARebours,
    budgetARebours,
    aRebours,
    outilApres,
    demandeQuiCoute,
    coutMoyen: coutMoyenDUnDefaut(f),
    detection: f.qualite.controleFinal.tauxDeDetection,
    ventesParDefautLivre: f.qualite.ventesPerduesParDefautLivre,
    meilleurDefautsCompris,
    meilleurSansLesDefauts,
    verdict,
    /** Les trimestres d'entretien complet qu'il faut pour rendre l'usure d'un trimestre sans entretien. */
    trimestresDeRetour: Math.ceil(e.usureParTrimestre / (e.reparationAuBudgetDeReference - e.usureParTrimestre) - 1e-9),
  };
}

export type EntretienDeLOutil = ReturnType<typeof entretienDeLOutil>;
export type Verdict = "rien-ne-se-perd" | "l-economie-tient" | "l-economie-se-perd";

/** Le laboratoire : l'année N + 1 jouée aux 4 budgets donnés, face au plan. */
export function laboratoireDeLEntretien(x: EntretienDeLOutil, budgets: readonly number[]) {
  const s = entretienDeLAnnee(x.f, budgets);
  return { ...s, defautsEnPlus: auCentime(s.defautsEnPlus), ventesPerduesParLaQualite: auCentime(s.ventesPerduesParLaQualite) };
}

const budgetsDe = (p: Readonly<Record<string, number>>) => [p.t1!, p.t2!, p.t3!, p.t4!];

/** L'outil de NOVA, trimestre par trimestre : le document de départ. */
export function tableauDeLOutil(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = entretienDeLOutil(c);
  const f = x.f;
  return {
    titre: `La ligne de montage de ${f.entreprise}, trimestre par trimestre`,
    colonnes: ["Trimestre 1", "Trimestre 2", "Trimestre 3", "Trimestre 4"],
    lignes: [
      { libelle: `Demande de N (${f.unites})`, valeurs: f.anneeN.demande.map(qte) },
      { libelle: `Demande de N + 1 (${f.unites})`, valeurs: f.anneeNPlus1.demande.map(qte) },
      { libelle: `Capacité de la ligne à 100 % (${f.unites})`, valeurs: x.plan.trimestres.map(() => qte(f.ligne.capaciteParTrimestre)) },
      { libelle: `Ventes au plan de N + 1 (${f.unites})`, valeurs: x.plan.trimestres.map((t) => qte(t.production)) },
      { libelle: "Entretien au plan de N + 1", valeurs: f.plan.entretien.map(eur) },
    ],
  };
}

export const ENTRETENIR_L_OUTIL: Chapitre = {
  code: "entretenir-l-outil",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 4 · Soutenir le fonctionnement et le développement de la PME"],
  titre: "Entretenir l'outil : maintenance et disponibilité",
  accroche:
    "Sauter l'entretien d'un trimestre fait une économie certaine. La ligne s'use, sa disponibilité baisse, et l'année où l'outil est le goulot, la capacité perdue se paie en ventes ; une ligne mal entretenue monte aussi mal. Le seuil d'entretien, ce qu'il garde et ce qu'il ne garde pas.",
  objectifs: [
    "Calculer la disponibilité et la capacité de l'outil selon le budget d'entretien",
    "Calculer le budget sous lequel la disponibilité baisse, et le distinguer du budget de référence",
    "Comparer une économie d'entretien à la marge perdue, quand l'outil est le goulot et quand il ne l'est pas",
    "Compter les défauts qu'un entretien trop bas ajoute, et juger le meilleur budget",
    "Retrouver un budget d'entretien à rebours, et dire ce que vaut le chiffre",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ENTRETIEN,
    pourquoi:
      "l'entretien se chiffre sur la ligne de montage de NOVA, qui devient le goulot de l'atelier en N + 1 ; c'est la même PME industrielle que dans la comptabilité et le contrôle de gestion.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un trimestre sans entretien",
      notions: ["capacity", "productivity"],
      tableau: tableauDeLOutil,
      texte: (c) => {
        const x = entretienDeLOutil(c);
        const f = x.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, à l'atelier de ${f.entreprise}, sur l'année N + 1 prévue, trimestre par trimestre, avec l'année N pour témoin. La ligne de montage monte ${qte(f.ligne.capaciteParTrimestre)} ${f.unites} par trimestre quand elle est disponible à 100 %. Chaque enceinte vendue laisse ${eur(x.marge)} de marge sur coût variable, et une demande qui n'est pas servie dans son trimestre est perdue. La demande de N + 1 est une prévision : aux trimestres 2 et 4, elle dépasse déjà la ligne.`,
          `Ce que la simulation suppose de l'entretien. Sans entretien, la ligne perd ${points(x.usure)} de disponibilité au trimestre suivant. L'entretien la répare en proportion de son budget, 1 point pour ${eur(x.unPoint)}, jusqu'à ${points(x.reparation)} au budget de référence, ${eur(x.reference)} par trimestre ; au-delà, un euro de plus ne répare rien, et la disponibilité ne dépasse jamais 100 %. La ligne entre dans N + 1 à 100 % : en N, sous garantie, c'est le fabricant qui l'entretenait.`,
          `Une ligne mal entretenue monte aussi mal : sans entretien, le taux de défaut du trimestre même gagne ${points(x.e.defautsEnPlusSansEntretien)}, d'autant moins que le budget approche la référence. Un défaut coûte en moyenne ${eur(x.coutMoyen)} : le contrôle en trouve ${pct(x.detection)}, retouchés à ${eur(f.qualite.coutDUnDefautDetecte)}, les autres reviennent du client sous garantie, ${eur(f.qualite.coutDUnDefautLivre)}. Chaque défaut livré fait perdre ${qte(x.ventesParDefautLivre)} ventes, et ces défauts sont des défauts attendus, en moyenne.`,
          `Le gérant envisage de ne rien dépenser pour l'entretien au trimestre ${x.T}, pour faire une économie.`,
        ];
      },
      repere: (c) => {
        const x = entretienDeLOutil(c);
        return `Disponibilité du trimestre suivant = disponibilité du trimestre + réparation (1 point pour ${eur(x.unPoint)}, au plus ${points(x.reparation)}) − usure (${points(x.usure)}), sans dépasser 100 %. Capacité de l'outil = ${qte(x.f.ligne.capaciteParTrimestre)} × disponibilité.`;
      },
    },
    {
      id: "predire-le-seuil",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le seuil",
      notions: ["capacity", "fixed_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Avant tout calcul, pariez. Le budget de référence, ${eur(x.reference)}, répare ${points(x.reparation)} pour ${points(x.usure)} d'usure. Sous quel budget la disponibilité de la ligne se met-elle à baisser ?`;
      },
      options: (c) => {
        const x = entretienDeLOutil(c);
        const voir = "Faites varier le budget à l'étape suivante : le curseur montre où l'entretien cesse de suivre l'usure.";
        return [
          { texte: `Dès qu'on descend sous la référence, ${eur(x.reference)}`, juste: x.seuil === x.reference, retour: `Pari à vérifier. ${voir}` },
          { texte: "Sous un seuil plus bas : la référence répare plus que l'usure", juste: x.seuil < x.reference, retour: `Bon pari. ${voir}` },
          { texte: "Seulement sans aucun entretien", juste: x.seuil === 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-seuil-au-curseur",
      objectifs: [1],
      type: "curseur",
      titre: "Le budget sous lequel la ligne s'use",
      notions: ["capacity", "fixed_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Faites varier le budget d'entretien d'un trimestre, de 0 à ${eur(x.reference)}. Une droite donne le budget dépensé, l'autre ce que coûte la réparation de l'usure d'un trimestre (${points(x.usure)} à ${eur(x.unPoint)} le point). Placez le curseur sur le plus petit budget où la disponibilité ne baisse pas, puis validez.`;
      },
      grandeur: () => ({ libelle: "Budget d'entretien du trimestre", unite: "€" }),
      cible: (c) => {
        const x = entretienDeLOutil(c);
        return { attendu: Math.ceil(x.seuil - 1e-9), min: 0, max: x.reference };
      },
      zones: ["La ligne tient", "La ligne s'use"],
      rates: () => ({
        dessous: "À ce budget, l'entretien répare moins que l'usure : la disponibilité baisse.",
        dessus: "Plus bas, la ligne tient encore : cherchez le plus petit budget.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, b) => {
        const x = entretienDeLOutil(c);
        const f = x.f;
        const perte = Math.min(0, variationDeDisponibilite(f, b));
        const enceintes = f.ligne.capaciteParTrimestre - Math.floor(f.ligne.capaciteParTrimestre * (1 + perte) + 1e-9);
        const production = x.plan.trimestres[x.T - 1]!.production;
        return [
          { libelle: "Coût de la réparation de l'usure", montant: x.seuil },
          { libelle: "Économie face au budget de référence", montant: auCentime(x.reference - b) },
          { libelle: "Marge perdue au trimestre suivant, si l'outil y est le goulot", montant: auCentime(enceintes * x.marge) },
          {
            libelle: `Coût des défauts en plus, sur les ${qte(production)} ${f.unites} du trimestre`,
            montant: auCentime(production * defautsEnPlusDeLEntretien(f, b) * x.coutMoyen),
            fort: true,
          },
        ];
      },
      droites: (c) => {
        const x = entretienDeLOutil(c);
        return { produit: (b) => b, cout: () => x.seuil, libelles: ["Budget d'entretien", "Coût de la réparation de l'usure"] };
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const production = x.plan.trimestres[x.T - 1]!.production;
        return [
          `Les deux droites se croisent à ${eur(x.seuil)} : à ce budget, l'entretien répare ${points(x.usure)}, juste l'usure du trimestre. En dessous, chaque tranche de ${eur(x.unPoint)} manquante coûte 1 point, ${qte(x.f.ligne.capaciteParTrimestre / 100)} ${x.f.unites} de capacité. Au-dessus, l'entretien répare plus que l'usure, mais une ligne à 100 % ne monte pas plus haut : la référence ne sert qu'à rattraper une usure passée.`,
          `Le seuil n'est pas la référence. Mais regardez la dernière ligne : au seuil, les défauts du trimestre ne disparaissent pas, ${eur(auCentime(production * defautsEnPlusDeLEntretien(x.f, x.seuil) * x.coutMoyen))} sur ${qte(production)} ${x.f.unites}. On y reviendra.`,
        ];
      },
    },
    {
      id: "le-seuil",
      objectifs: [1],
      type: "montants",
      titre: "Le seuil d'entretien",
      notions: ["capacity", "fixed_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Calculez le budget qui répare un point de disponibilité (${eur(x.reference)} ÷ ${qte(x.reparation * 100)} points), le seuil où la réparation égale l'usure (${qte(x.usure * 100)} points × ce budget), puis ce que le seuil économise par trimestre face à la référence.`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        return [
          { libelle: "Budget qui répare un point", attendu: x.unPoint, calcul: `${eur(x.reference)} ÷ ${qte(x.reparation * 100)} = ${eur(x.unPoint)}` },
          { libelle: "Seuil d'entretien", attendu: x.seuil, calcul: `${qte(x.usure * 100)} × ${eur(x.unPoint)} = ${eur(x.seuil)}` },
          { libelle: "Économie par trimestre au seuil", attendu: x.economieAuSeuil, calcul: `${eur(x.reference)} − ${eur(x.seuil)} = ${eur(x.economieAuSeuil)}` },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        return [
          `Sous ${eur(x.seuil)}, la ligne perd de la disponibilité chaque trimestre ; au seuil, elle ne bouge plus ; au-dessus, elle en regagne, jusqu'à 100 %. Sans aucun entretien, la perte est la plus forte, ${points(x.usure)} en un trimestre, et il faut ensuite ${qte(x.trimestresDeRetour)} trimestres à la référence pour la rattraper.`,
        ];
      },
    },
    {
      id: "la-disponibilite",
      objectifs: [0],
      type: "montants",
      titre: "La ligne après le trimestre sans entretien",
      notions: ["capacity"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Sans entretien au trimestre ${x.T}, l'entretien repris ensuite à la référence : calculez la disponibilité au trimestre ${x.T + 1} (100 % − ${points(x.usure)}), la capacité de la ligne au trimestre ${x.T + 1} (${qte(x.f.ligne.capaciteParTrimestre)} × cette disponibilité), puis la disponibilité et la capacité au trimestre ${x.T + 2} (+ ${points(x.reparation)} − ${points(x.usure)}).`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const [, b, d] = x.sans.trimestres;
        const cap = x.f.ligne.capaciteParTrimestre;
        return [
          { libelle: `Disponibilité au trimestre ${x.T + 1} (%)`, attendu: auCentime(b!.disponibilite * 100), calcul: `100 % − ${points(x.usure)} = ${pct(b!.disponibilite)}`, tolerance: 0.1 },
          { libelle: `Capacité de la ligne au trimestre ${x.T + 1} (${x.f.unites})`, attendu: b!.capaciteOutil, calcul: `${qte(cap)} × ${pct(b!.disponibilite)} = ${qte(b!.capaciteOutil)}` },
          {
            libelle: `Disponibilité au trimestre ${x.T + 2} (%)`,
            attendu: auCentime(d!.disponibilite * 100),
            calcul: `${pct(b!.disponibilite)} + ${points(x.reparation)} − ${points(x.usure)} = ${pct(d!.disponibilite)}`,
            tolerance: 0.1,
          },
          { libelle: `Capacité de la ligne au trimestre ${x.T + 2} (${x.f.unites})`, attendu: d!.capaciteOutil, calcul: `${qte(cap)} × ${pct(d!.disponibilite)} = ${qte(d!.capaciteOutil)}` },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const [, b, d] = x.sans.trimestres;
        const cap = x.f.ligne.capaciteParTrimestre;
        return [
          `L'économie du trimestre ${x.T} se paie en capacité aux ${qte(x.trimestresDeRetour)} trimestres suivants : ${qte(cap - b!.capaciteOutil)} ${x.f.unites} de moins au trimestre ${x.T + 1}, ${qte(cap - d!.capaciteOutil)} au trimestre ${x.T + 2}. La ligne ne retrouve 100 % qu'au trimestre ${x.T + 3}.`,
        ];
      },
    },
    {
      id: "predire-la-perte",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la perte",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        const t = x.sans.trimestres[x.T]!;
        return `Pariez. Au trimestre ${x.T + 1}, la ligne ne peut plus monter que ${qte(t.capaciteOutil)} ${x.f.unites}, pour ${qte(x.plan.trimestres[x.T]!.demande)} demandées. Combien de ventes l'entretien sauté fait-il perdre ce trimestre ?`;
      },
      options: (c) => {
        const x = entretienDeLOutil(c);
        const t = x.sans.trimestres[x.T]!;
        const p = x.plan.trimestres[x.T]!;
        const voir = "Le curseur suivant fait varier la demande du trimestre : regardez quand la perte commence.";
        return [
          { texte: `${qte(t.ventesPerdues)} : au plan, la ligne n'en servait que ${qte(p.production)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${qte(p.demande - t.capaciteOutil)} : la demande moins la capacité qui reste`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Aucune : en N, le même entretien sauté n'en faisait perdre aucune", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-demande-qui-coute",
      objectifs: [2],
      type: "curseur",
      titre: "La demande qui fait perdre l'économie",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Faites varier la demande du trimestre ${x.T + 1}, de ${qte(x.outilApres)} (la capacité qui reste à la ligne après le trimestre sans entretien) à ${qte(x.f.ligne.capaciteParTrimestre)} (celle de la ligne à 100 %). Une droite donne la marge que l'entretien sauté fait perdre, l'autre l'entretien économisé. Placez le curseur sur la plus petite demande où l'économie se perd, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Demande du trimestre ${entretienDeLOutil(c).T + 1}`, unite: entretienDeLOutil(c).f.unites }),
      cible: (c) => {
        const x = entretienDeLOutil(c);
        return { attendu: x.demandeQuiCoute, min: x.outilApres, max: x.f.ligne.capaciteParTrimestre };
      },
      zones: ["L'économie se perd", "L'économie tient"],
      rates: () => ({
        dessous: "À cette demande, la marge perdue reste sous l'entretien économisé : l'économie tient encore.",
        dessus: "Plus bas, l'économie se perd déjà : cherchez la plus petite demande.",
      }),
      montrer: "Montrer la demande",
      lecture: (c, d) => {
        const x = entretienDeLOutil(c);
        const perdue = auCentime((d - x.outilApres) * x.marge);
        return [
          { libelle: "Marge perdue au trimestre", montant: perdue },
          { libelle: "Entretien économisé", montant: x.sans.economie },
          { libelle: "Effet sur le résultat, sans les défauts", montant: auCentime(x.sans.economie - perdue), fort: true },
        ];
      },
      droites: (c) => {
        const x = entretienDeLOutil(c);
        return { produit: (d) => (d - x.outilApres) * x.marge, cout: () => x.sans.economie, libelles: ["Marge perdue", "Entretien économisé"] };
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const n = x.f.anneeN.demande[x.T]!;
        return [
          `À partir de ${qte(x.demandeQuiCoute)} ${x.f.unites} demandées au trimestre ${x.T + 1}, la marge perdue dépasse l'entretien économisé : ${eur(x.sans.economie)} ÷ ${eur(x.marge)} = ${qte(auCentime(x.sans.economie / x.marge))}, il suffit de ${qte(x.demandeQuiCoute - x.outilApres)} ventes perdues. Sous ${qte(x.outilApres)}, rien ne se perd du tout.`,
          `Avec la demande de N (${qte(n)}), la ligne amoindrie suffit encore. Avec celle de N + 1, que la ligne plafonne à ${qte(x.f.ligne.capaciteParTrimestre)}, ${x.f.entreprise} perd ${qte(x.sans.trimestres[x.T]!.ventesPerdues)} ${x.f.unites}. C'est le calcul de l'étape suivante.`,
        ];
      },
    },
    {
      id: "le-goulot",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte l'outil quand il est le goulot",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Sans formule cette fois. Sur la demande de N + 1, l'entretien du trimestre ${x.T} sauté : calculez les ventes perdues au trimestre ${x.T + 1} et au trimestre ${x.T + 2}, la marge perdue sur l'année, puis l'effet sur le résultat de l'année sans compter les défauts (négatif s'il est défavorable).`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        const t = (i: number) => {
          const j = s.trimestres[i]!;
          const p = x.plan.trimestres[i]!;
          return `la plus petite de ${qte(p.demande)} demandées et ${qte(j.capaciteOutil)} pour la ligne : ${qte(j.ventes)} vendues, pour ${qte(p.production)} au plan, soit ${qte(j.ventesPerdues)}`;
        };
        return [
          { libelle: `Ventes perdues au trimestre ${x.T + 1} (${x.f.unites})`, attendu: s.trimestres[x.T]!.ventesPerdues, calcul: t(x.T) },
          { libelle: `Ventes perdues au trimestre ${x.T + 2} (${x.f.unites})`, attendu: s.trimestres[x.T + 1]!.ventesPerdues, calcul: t(x.T + 1) },
          { libelle: "Marge perdue sur l'année", attendu: s.margePerdue, calcul: `${qte(s.ventesPerdues)} × ${eur(x.marge)} = ${eur(s.margePerdue)}` },
          { libelle: "Effet sur le résultat, sans les défauts", attendu: s.ecartParLaDisponibilite, calcul: `${eur(s.economie)} − ${eur(s.margePerdue)} = ${eur(s.ecartParLaDisponibilite)}` },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        return [
          `Au trimestre ${x.T + 1}, la ligne est le goulot : chaque enceinte de capacité perdue est une vente perdue. Au trimestre ${x.T + 2}, la demande (${qte(x.plan.trimestres[x.T + 1]!.demande)}) laisse du jeu : la capacité perdue n'y coûte rien. Sur l'année, l'économie de ${eur(s.economie)} fait perdre ${eur(s.margePerdue)} de marge : ${eur(s.ecartParLaDisponibilite)}.`,
        ];
      },
    },
    {
      id: "verdict",
      objectifs: [2],
      type: "choix",
      titre: "L'économie valait-elle la peine ?",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Sans entretien au trimestre ${x.T}, ${x.f.entreprise} économise ${eur(x.sans.economie)} et perd ${eur(x.sans.margePerdue)} de marge sur la demande de N + 1. Que retenir ?`;
      },
      options: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        return [
          {
            texte: `L'économie se perd : l'outil limitait les ventes au trimestre ${x.T + 1}`,
            juste: x.verdict === "l-economie-se-perd",
            retour:
              x.verdict === "l-economie-se-perd"
                ? `Oui : le résultat de l'année baisse de ${eur(-s.ecartParLaDisponibilite)}, avant même de compter les défauts. La ligne était déjà le goulot au trimestre ${x.T + 1} : la moindre capacité perdue y est une vente perdue.`
                : "Non : la marge perdue reste sous l'entretien économisé.",
          },
          {
            texte: `L'économie tient cette année, malgré ${qte(x.trimestresDeRetour)} trimestres d'outil moins disponible`,
            juste: x.verdict === "l-economie-tient",
            retour:
              x.verdict === "l-economie-tient"
                ? `Oui : la marge perdue reste sous l'entretien économisé.`
                : `Non : la marge perdue (${eur(s.margePerdue)}) dépasse l'entretien économisé (${eur(s.economie)}) : le résultat baisse de ${eur(-s.ecartParLaDisponibilite)}.`,
          },
          {
            texte: "Rien ne se perd : ce n'est pas l'outil qui limitait les ventes",
            juste: x.verdict === "rien-ne-se-perd",
            retour:
              x.verdict === "rien-ne-se-perd"
                ? "Oui : la ligne amoindrie servait encore toute la demande."
                : `Non : c'était vrai en N, pas en N + 1. Au trimestre ${x.T + 1}, la ligne est le goulot, et l'entretien sauté y fait perdre ${qte(s.ventesPerdues)} ${x.f.unites}.`,
          },
        ];
      },
    },
    {
      id: "la-demande-de-n",
      objectifs: [2],
      type: "montants",
      titre: "Variante : la demande de N",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Variante : rejouez le même entretien sauté sur la demande de N, l'année témoin. Calculez la capacité de la ligne restée libre au trimestre ${x.T + 1}, les ventes perdues sur l'année, puis l'effet sur le résultat, sans compter les défauts.`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.surN;
        const t = s.trimestres[x.T]!;
        const d = x.f.anneeN.demande[x.T]!;
        return [
          { libelle: `Capacité restée libre au trimestre ${x.T + 1} (${x.f.unites})`, attendu: t.capaciteOutil - d, calcul: `${qte(t.capaciteOutil)} − ${qte(d)} demandées = ${qte(t.capaciteOutil - d)}` },
          {
            libelle: `Ventes perdues sur l'année, demande de N (${x.f.unites})`,
            attendu: s.ventesPerdues,
            calcul: `chaque trimestre, la ligne amoindrie (${s.trimestres.map((y) => qte(y.capaciteOutil)).join(", ")}) sert la demande de N (${x.f.anneeN.demande.map(qte).join(", ")}) : ${qte(s.ventesPerdues)}`,
          },
          { libelle: "Effet sur le résultat, sans les défauts, demande de N", attendu: s.ecartParLaDisponibilite, calcul: `${eur(s.economie)} − ${eur(s.margePerdue)} = ${eur(s.ecartParLaDisponibilite)}` },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        return [
          `En N, le même entretien sauté ne coûte aucune vente : il restait ${qte(x.surN.trimestres[x.T]!.capaciteOutil - x.f.anneeN.demande[x.T]!)} ${x.f.unites} de capacité libre au trimestre ${x.T + 1}. L'économie passerait entière, ${eur(x.surN.ecartParLaDisponibilite)}, avant les défauts. En N + 1, elle se perd : ${eur(x.sans.ecartParLaDisponibilite)}.`,
          "La même décision, deux résultats opposés : l'entretien ne coûte des ventes que si l'outil est le goulot. Juger une économie d'entretien sur l'année d'avant, où la ligne avait du jeu, c'est se tromper d'année.",
        ];
      },
    },
    {
      id: "les-defauts",
      objectifs: [3],
      type: "montants",
      titre: "Les défauts du trimestre sans entretien",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Sans entretien au trimestre ${x.T}, la ligne monte aussi mal, sur les ${qte(x.plan.trimestres[x.T - 1]!.production)} ${x.f.unites} du trimestre. Calculez les défauts en plus, ce qu'ils coûtent, les ventes que les défauts livrés font perdre, puis l'effet sur le résultat de l'année, défauts compris.`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        const production = x.plan.trimestres[x.T - 1]!.production;
        const p = defautsEnPlusDeLEntretien(x.f, 0);
        return [
          { libelle: "Défauts en plus", attendu: auCentime(s.defautsEnPlus), calcul: `${qte(production)} × ${pct(p)} = ${qte(auCentime(s.defautsEnPlus))}`, tolerance: 0.1 },
          {
            libelle: "Coût des défauts en plus",
            attendu: s.coutDesDefautsEnPlus,
            calcul: `${qte(auCentime(s.defautsEnPlus))} × ${eur(x.coutMoyen)} (${pct(x.detection)} × ${eur(x.f.qualite.coutDUnDefautDetecte)} + ${pct(1 - x.detection)} × ${eur(x.f.qualite.coutDUnDefautLivre)}) = ${eur(s.coutDesDefautsEnPlus)}`,
          },
          {
            libelle: "Ventes perdues par la qualité",
            attendu: auCentime(s.ventesPerduesParLaQualite),
            calcul: `${qte(auCentime(s.defautsEnPlus))} × ${pct(1 - x.detection)} livrés × ${qte(x.ventesParDefautLivre)} = ${qte(auCentime(s.ventesPerduesParLaQualite))}`,
            tolerance: 0.1,
          },
          {
            libelle: "Effet sur le résultat, défauts compris",
            attendu: s.ecartDeResultat,
            calcul: `${eur(s.ecartParLaDisponibilite)} − ${eur(s.coutDesDefautsEnPlus)} − ${qte(auCentime(s.ventesPerduesParLaQualite))} × ${eur(x.marge)} = ${eur(s.ecartDeResultat)}`,
          },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        return [
          `Défauts compris, l'entretien sauté fait perdre ${eur(-s.ecartDeResultat)} à l'année : ${eur(s.economie)} économisés, face à ${eur(s.margePerdue)} de ventes que la ligne ne monte plus, ${eur(s.coutDesDefautsEnPlus)} de retouches et de retours, et ${eur(s.margePerdueParLaQualite)} de ventes que la qualité perçue fait perdre.`,
          "Les défauts ne demandent pas que l'outil soit le goulot : ils coûtent même en N, quand la ligne a du jeu. C'est le coût de l'entretien sauté qui ne dépend pas de la demande.",
        ];
      },
    },
    {
      id: "predire-le-meilleur-budget",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur le meilleur budget",
      notions: ["capacity", "variable_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Pariez. Défauts compris, quel budget du trimestre ${x.T} donne le meilleur résultat de l'année, les autres trimestres à la référence ?`;
      },
      options: (c) => {
        const x = entretienDeLOutil(c);
        const voir = "Le laboratoire suivant trace l'effet sur le résultat selon le budget du premier trimestre.";
        return [
          { texte: `Le seuil, ${eur(x.seuil)} : la ligne tient, et l'économie reste`, juste: x.meilleurDefautsCompris === x.seuil, retour: `Pari à vérifier. ${voir}` },
          { texte: `La référence, ${eur(x.reference)}`, juste: x.meilleurDefautsCompris === x.reference, retour: `Bon pari. ${voir}` },
          { texte: "Aucun entretien : l'économie est la seule chose certaine", juste: x.meilleurDefautsCompris === 0, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-entretien",
      objectifs: [0, 3],
      type: "simulation",
      titre: "Le laboratoire de l'entretien",
      notions: ["capacity", "contribution_margin", "variable_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Réglez le budget d'entretien de chaque trimestre de N + 1, de 0 à ${eur(x.reference)}. Le tableau suit la disponibilité de la ligne, les ventes perdues, les défauts et l'effet sur le résultat de l'année face au plan ; le graphique suit l'effet selon le budget du premier trimestre. Relevez le défi.`;
      },
      leviers: (c) => {
        const x = entretienDeLOutil(c);
        return [1, 2, 3, 4].map((t) => ({
          code: `t${t}`,
          libelle: `Entretien du trimestre ${t}`,
          unite: "€",
          min: 0,
          max: x.reference,
          pas: PAS_DU_LABORATOIRE,
          depart: x.f.plan.entretien[t - 1]!,
        }));
      },
      lecture: (c, p) => {
        const x = entretienDeLOutil(c);
        const l = laboratoireDeLEntretien(x, budgetsDe(p));
        const d = laboratoireDeLEntretien(x, x.f.plan.entretien);
        return [
          ...[2, 3, 4].map((t) => ({ libelle: `Disponibilité au trimestre ${t}`, montant: auCentime(l.trimestres[t - 1]!.disponibilite * 100), unite: "%", reference: auCentime(d.trimestres[t - 1]!.disponibilite * 100) })),
          { libelle: "Disponibilité au 1er janvier suivant", montant: auCentime(l.disponibiliteApres * 100), unite: "%", reference: auCentime(d.disponibiliteApres * 100) },
          { libelle: "Ventes perdues par la ligne", montant: l.ventesPerdues, unite: x.f.unites, reference: d.ventesPerdues },
          { libelle: "Défauts en plus", montant: l.defautsEnPlus, unite: "défauts", reference: d.defautsEnPlus },
          { libelle: "Entretien économisé", montant: l.economie, reference: d.economie, effet: true },
          { libelle: "Marge perdue par la ligne", montant: -l.margePerdue, reference: -d.margePerdue, effet: true },
          { libelle: "Coût des défauts en plus", montant: -l.coutDesDefautsEnPlus, reference: -d.coutDesDefautsEnPlus, effet: true },
          { libelle: "Marge des ventes perdues par la qualité", montant: -l.margePerdueParLaQualite, reference: -d.margePerdueParLaQualite, effet: true },
          { libelle: "Effet sur le résultat, sans les défauts", montant: l.ecartParLaDisponibilite, reference: d.ecartParLaDisponibilite, effet: true },
          { libelle: "Effet sur le résultat, défauts compris", montant: l.ecartDeResultat, reference: d.ecartDeResultat, effet: true, fort: true },
        ].map((y) => ({ ...y, montant: y.montant + 0, reference: y.reference + 0 }));
      },
      // L'effet selon le budget du premier trimestre n'est pas une droite : il se plie au seuil, où la ligne cesse de s'user.
      graphique: (c) => {
        const x = entretienDeLOutil(c);
        return {
          levier: "t1",
          courbes: [
            { libelle: "Effet sur le résultat, sans les défauts", valeur: (p) => laboratoireDeLEntretien(x, budgetsDe(p)).ecartParLaDisponibilite + 0 },
            { libelle: "Effet sur le résultat, défauts compris", valeur: (p) => laboratoireDeLEntretien(x, budgetsDe(p)).ecartDeResultat + 0 },
          ],
        };
      },
      defi: (c) => {
        const x = entretienDeLOutil(c);
        const auSeuil = Math.ceil(x.seuil - 1e-9);
        const plafond = auSeuil * 4;
        return {
          consigne: "Ne perdez aucune vente par la ligne, rendez-la à 100 % au 1er janvier suivant, avec le moins d'entretien possible sur l'année.",
          atteint: (p) => {
            const l = laboratoireDeLEntretien(x, budgetsDe(p));
            return l.ventesPerdues === 0 && l.disponibiliteApres === 1 && l.entretien <= plafond;
          },
          indice: (p) => {
            const l = laboratoireDeLEntretien(x, budgetsDe(p));
            if (l.ventesPerdues > 0) return `${qte(l.ventesPerdues)} ${x.f.unites} perdues : aux trimestres 2 et 4, la ligne est le goulot et doit être à 100 %.`;
            if (l.disponibiliteApres < 1) return `La ligne finit l'année à ${pct(l.disponibiliteApres)} : l'année suivante commencerait usée.`;
            return `Aucune vente perdue, mais ${eur(l.entretien)} d'entretien sur l'année : cherchez moins.`;
          },
          solution: { t1: auSeuil, t2: auSeuil, t3: auSeuil, t4: auSeuil },
        };
      },
      explication: (c, p) => {
        const x = entretienDeLOutil(c);
        const l = laboratoireDeLEntretien(x, budgetsDe(p));
        const sauteAuT2 = laboratoireDeLEntretien(x, [x.seuil, 0, x.reference, x.seuil]);
        return [
          `${eur(l.entretien)} sur l'année : aucune vente perdue, la ligne à 100 % au 1er janvier, ${eur(l.economie)} d'entretien en moins. D'autres positions y arrivent au même prix, comme ${eur(x.seuil)}, ${eur(x.seuil / 2)}, ${eur(x.reference)} et ${eur(x.seuil)} : chaque euro coupé sous le seuil doit être rendu plus tard au-dessus. Sauter le trimestre 2 empêche la ligne de revenir à 100 % au trimestre 4 : ${qte(sauteAuT2.ventesPerdues)} ${x.f.unites} perdues.`,
          `Mais l'effet défauts compris est de ${eur(l.ecartDeResultat)} : le graphique le montre, la courbe sans les défauts culmine au seuil, celle des défauts compris à la référence. Selon ce que vous faites compter, les ventes seules ou les défauts aussi, le meilleur budget n'est pas le même : dites lequel vous retenez, et pourquoi.`,
        ];
      },
    },
    {
      id: "au-trimestre-2",
      objectifs: [2],
      type: "montants",
      titre: "Variante : sauter le trimestre 2",
      notions: ["capacity", "contribution_margin", "variable_costs"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `Variante : le gérant saute l'entretien du trimestre ${TRIMESTRE_DE_LA_VARIANTE} au lieu du trimestre ${x.T}. Refaites le raisonnement : les ventes perdues au trimestre ${TRIMESTRE_DE_LA_VARIANTE + 2}, l'effet sur le résultat sans les défauts, les défauts en plus, puis l'effet défauts compris.`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const v = x.variante;
        const k = TRIMESTRE_DE_LA_VARIANTE - 1;
        const t3 = v.trimestres[k + 1]!;
        const t4 = v.trimestres[k + 2]!;
        const production = x.plan.trimestres[k]!.production;
        return [
          {
            libelle: `Ventes perdues au trimestre ${TRIMESTRE_DE_LA_VARIANTE + 2} (${x.f.unites})`,
            attendu: t4.ventesPerdues,
            calcul: `${pct(t3.disponibilite)} + ${points(x.reparation)} − ${points(x.usure)} = ${pct(t4.disponibilite)}, soit ${qte(t4.capaciteOutil)} ${x.f.unites} pour ${qte(x.plan.trimestres[k + 2]!.production)} au plan : ${qte(t4.ventesPerdues)}`,
          },
          { libelle: "Effet sur le résultat, sans les défauts", attendu: v.ecartParLaDisponibilite, calcul: `${eur(v.economie)} − ${qte(v.ventesPerdues)} × ${eur(x.marge)} = ${eur(v.ecartParLaDisponibilite)}` },
          { libelle: "Défauts en plus", attendu: auCentime(v.defautsEnPlus), calcul: `${qte(production)} × ${pct(defautsEnPlusDeLEntretien(x.f, 0))} = ${qte(auCentime(v.defautsEnPlus))}`, tolerance: 0.1 },
          {
            libelle: "Effet sur le résultat, défauts compris",
            attendu: v.ecartDeResultat,
            calcul: `${eur(v.ecartParLaDisponibilite)} − ${qte(auCentime(v.defautsEnPlus))} × ${eur(x.coutMoyen)} − ${qte(auCentime(v.ventesPerduesParLaQualite))} × ${eur(x.marge)} = ${eur(v.ecartDeResultat)}`,
          },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const v = x.variante;
        const k = TRIMESTRE_DE_LA_VARIANTE - 1;
        return [
          `Sauté au trimestre ${TRIMESTRE_DE_LA_VARIANTE}, l'entretien ne coûte rien au trimestre ${TRIMESTRE_DE_LA_VARIANTE + 1} : la ligne à ${pct(v.trimestres[k + 1]!.disponibilite)} y sert encore les ${qte(x.plan.trimestres[k + 1]!.demande)} demandées. La perte arrive au trimestre ${TRIMESTRE_DE_LA_VARIANTE + 2}, ${qte(2)} trimestres plus tard, quand la ligne redevient le goulot sans avoir retrouvé 100 % : ${qte(v.ventesPerdues)} ${x.f.unites}.`,
          `Sans les défauts, l'économie tiendrait (${eur(v.ecartParLaDisponibilite)}) ; défauts compris, elle se perd (${eur(v.ecartDeResultat)}) : les défauts y pèsent plus qu'au trimestre ${x.T}, parce que la ligne monte ${qte(x.plan.trimestres[k]!.production)} ${x.f.unites} ce trimestre-là. Le coût d'un entretien sauté dépend du trimestre : il faut suivre l'usure jusqu'au prochain goulot.`,
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Retrouver un budget à rebours",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        const t4 = x.aRebours.trimestres[TRIMESTRE_A_REBOURS]!;
        return `À rebours. À la fin de N + 1, le responsable de l'atelier constate que la ligne n'a monté que ${qte(t4.capaciteOutil)} ${x.f.unites} au trimestre ${TRIMESTRE_A_REBOURS + 1}, disponible à ${pct(DISPONIBILITE_A_REBOURS)}. Les trimestres 1 et 2 étaient entretenus à la référence, et la ligne était à 100 % au trimestre ${TRIMESTRE_A_REBOURS}. Retrouvez les points de disponibilité perdus, le budget d'entretien du trimestre ${TRIMESTRE_A_REBOURS}, puis l'effet sur le résultat de l'année, sans les défauts.`;
      },
      champs: (c) => {
        const x = entretienDeLOutil(c);
        const r = x.aRebours;
        const pointsPerdus = auCentime(x.pointsPerdusARebours * 100);
        return [
          { libelle: "Points de disponibilité perdus", attendu: pointsPerdus, calcul: `100 % − ${pct(DISPONIBILITE_A_REBOURS)} = ${points(x.pointsPerdusARebours)}`, tolerance: 0.01 },
          {
            libelle: `Budget d'entretien du trimestre ${TRIMESTRE_A_REBOURS}`,
            attendu: x.budgetARebours,
            calcul: `la réparation n'a couvert que ${qte(x.usure * 100)} − ${qte(pointsPerdus)} = ${qte(auCentime(x.usure * 100 - pointsPerdus))} points, à ${eur(x.unPoint)} le point : ${eur(x.budgetARebours)}`,
          },
          {
            libelle: "Effet sur le résultat, sans les défauts",
            attendu: r.ecartParLaDisponibilite,
            calcul: `${eur(x.reference)} − ${eur(x.budgetARebours)} = ${eur(r.economie)} économisés, moins (${qte(x.f.ligne.capaciteParTrimestre)} − ${qte(r.trimestres[TRIMESTRE_A_REBOURS]!.capaciteOutil)}) × ${eur(x.marge)} : ${eur(r.ecartParLaDisponibilite)}`,
          },
        ];
      },
      explication: (c) => {
        const x = entretienDeLOutil(c);
        const r = x.aRebours;
        return [
          `Chaque point de disponibilité perdu dit ${eur(x.unPoint)} qui ont manqué sous le seuil : la ligne a été entretenue à ${eur(x.budgetARebours)} au trimestre ${TRIMESTRE_A_REBOURS}. L'économie de ${eur(r.economie)} a coûté ${eur(r.margePerdue)} de marge au trimestre ${TRIMESTRE_A_REBOURS + 1}, où la ligne est le goulot : ${eur(r.ecartParLaDisponibilite)}, et davantage encore défauts compris (${eur(r.ecartDeResultat)}).`,
        ];
      },
    },
    {
      id: "ce-que-vaut-le-chiffre",
      objectifs: [4],
      type: "choix",
      titre: "Ce que vaut le chiffre des ventes perdues",
      notions: ["contribution_margin", "capacity"],
      question: (c) => {
        const x = entretienDeLOutil(c);
        return `L'entretien sauté au trimestre ${x.T} fait perdre ${qte(auCentime(x.sans.ventesPerduesParLaQualite))} ventes par la qualité perçue, comptées sur l'année entière. Que vaut ce chiffre ?`;
      },
      options: (c) => {
        const x = entretienDeLOutil(c);
        const refusees = x.plan.refusees;
        return [
          {
            texte: "C'est un maximum : aux trimestres 2 et 4, une demande refusée peut remplacer une vente perdue",
            juste: true,
            retour: `Oui : la ligne refuse déjà ${qte(refusees)} ${x.f.unites} demandées aux trimestres 2 et 4. Là, un client qui ne rachète pas peut laisser sa place à un client refusé, et la vente ne se perd pas vraiment. La simulation ne le fait pas : le chiffre est un plafond, honnête si la perte tombe aux trimestres où la ligne a du jeu.`,
          },
          {
            texte: `C'est un minimum : il faudrait y ajouter les ${qte(refusees)} ${x.f.unites} que la ligne refuse`,
            juste: false,
            retour: "Non : ces enceintes sont refusées avec ou sans entretien, au plan comme dans l'année jouée. Elles ne doivent rien à l'entretien sauté.",
          },
          {
            texte: "Il faut arrondir ces ventes à l'unité, puis valoriser : une vente ne se coupe pas",
            juste: false,
            retour: "Non : ce sont des ventes attendues, une moyenne sur les défauts attendus. Arrondir avant de valoriser fausserait le calcul ; on n'arrondit qu'à l'affichage.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "contribution_margin", "variable_costs"],
      texte: (c) => {
        const x = entretienDeLOutil(c);
        const s = x.sans;
        return [
          `Chez ${x.f.entreprise}, la ligne s'use sous ${eur(x.seuil)} par trimestre, et le budget de référence, ${eur(x.reference)}, la répare plus que son usure. Un trimestre sans entretien économise ${eur(s.economie)} et fait tomber la ligne à ${pct(s.trimestres[x.T]!.disponibilite)} au trimestre suivant. En N + 1, où la ligne est le goulot au trimestre ${x.T + 1}, l'économie se perd : ${eur(s.ecartParLaDisponibilite)} sans les défauts, ${eur(s.ecartDeResultat)} défauts compris. Sur la demande de N, le même entretien sauté ne coûtait aucune vente.`,
          "L'entretien est une charge qui protège la capacité et la qualité. Une économie d'entretien se juge sur les trimestres qui suivent, jusqu'au prochain goulot : la disponibilité perdue met du temps à revenir, et elle ne coûte des ventes que si l'outil limite la production. Les défauts, eux, coûtent toujours : le seuil garde la capacité, pas la qualité.",
          "Au niveau de l'examen, vous savez calculer la disponibilité et la capacité d'un outil selon son entretien, trouver le seuil d'entretien, chiffrer une économie face à la marge perdue et aux défauts, la refaire sur une autre année ou un autre trimestre, remonter d'une capacité à un budget, et dire ce que vaut le chiffre.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Seuil d'entretien = budget de référence × usure ÷ réparation à la référence. Effet d'un entretien sauté = entretien économisé − marge des ventes perdues quand l'outil est le goulot − coût des défauts en plus − marge des ventes perdues par la qualité.",
    },
  ],
};
