import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { RETABLISSEMENT_PAR_ENTRETIEN, seuilDEntretien } from "../../../engine/production";
import { soldUnits } from "../../../engine/simulation/runGame";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : ENTRETENIR L'OUTIL, MAINTENANCE ET DISPONIBILITÉ (BTS GPME, palier 3, bloc 4).
 *
 * Sauter l'entretien d'un trimestre fait une économie certaine, tout de suite. Ce qu'elle coûte
 * vient ensuite : l'outil s'use, sa disponibilité baisse au trimestre suivant, et il lui faut
 * deux trimestres d'entretien complet pour revenir à 100 %. Le chapitre calcule la disponibilité
 * et la capacité de l'outil après le trimestre sauté, le budget sous lequel la disponibilité
 * baisse, puis l'arène rejoue l'année : l'économie face à la marge perdue ensuite.
 *
 * Tout vient du moteur. La disponibilité évolue chaque trimestre selon `updateAvailability`
 * (src/engine/production) : elle perd `availabilityDecay` × (1 − budget ÷ référence) et regagne
 * `RETABLISSEMENT_PAR_ENTRETIEN` × `availabilityDecay` × (budget ÷ référence), jusqu'à 100 % ; la
 * référence est celle du métier multipliée par l'exigence d'entretien du parc
 * (`referenceDEntretien`) ; arrondie à l'euro, c'est le budget que la gestion de l'arène engage
 * chaque trimestre, celui que le chapitre appelle la référence. Le budget où la
 * disponibilité cesse de baisser est `seuilDEntretien`. Là où le scénario l'active
 * (`qualityCosts.maintenanceDefectSensitivity`, au bistrot), un entretien sous la référence du métier
 * fait aussi monter les rebuts du trimestre même : une étape de plus, qui ne se joue que là.
 *
 * L'entretien sauté vaut pour toutes les entreprises du cours : la disponibilité de l'outil y
 * baisse partout (la garde le vérifie). Là où l'outil n'est pas ce qui limite l'activité, rien ne
 * se perd, et le chapitre le dit. Ailleurs, des ventes se perdent : la marge perdue reste sous
 * l'économie (« l'économie tient »), ou la dépasse (« l'économie se perd »). Les trois lectures
 * se rencontrent dans l'année du cours ; la garde dit lesquelles, entreprise par entreprise.
 *
 * La gestion de l'arène reconduit sa décision du trimestre d'avant : l'année rejouée coupe
 * l'entretien au trimestre 1 et le reprend ensuite au budget que la gestion engage dans l'année
 * du cours (`entretienDeLAnnee`).
 */

/** Le trimestre sans entretien : le premier de l'année, pour que l'arène en montre toute la suite. */
export const TRIMESTRE_SANS_ENTRETIEN = 1;

/** L'indice du trimestre dans l'année rejouée (le moteur compte les trimestres à partir de 1). */
const rang = (trimestre: number) => trimestre - 1;

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export type Verdict = "rien-ne-se-perd" | "l-economie-tient" | "l-economie-se-perd";

/**
 * Le budget d'entretien que la gestion engage au trimestre `t` de l'année du cours. La gestion de
 * l'arène reconduit sa décision du trimestre d'avant : un rejeu qui coupe l'entretien un trimestre
 * doit le reprendre ensuite, sinon l'outil resterait sans entretien toute l'année.
 */
export const entretienDeLAnnee = (code: string, t: number) => anneeDeReference(code)[rang(t)]!.incomeStatement.maintenanceCost;

/** L'année du cours rejouée sans entretien au trimestre 1, l'entretien repris ensuite au budget de référence. */
export function anneeSansEntretien(code: string) {
  return rejouerAvec(code, "entretenir-l-outil:sans-entretien-au-trimestre-1", (t, d) =>
    t === TRIMESTRE_SANS_ENTRETIEN ? { ...d, maintenanceBudget: 0 } : { ...d, maintenanceBudget: entretienDeLAnnee(code, t) },
  );
}

/** La sensibilité des rebuts à l'entretien, dans le scénario : 0 là où l'entretien n'y joue pas. */
export const sensibiliteDesRebuts = (code: string) => scenarioByCode(code).scenario.qualityCosts?.maintenanceDefectSensitivity ?? 0;

/** L'outil sans entretien un trimestre : sa disponibilité, sa capacité, le seuil, les rebuts, et l'année. */
export function entretienDeLOutil(c: Cas) {
  const scenario = scenarioByCode(c.code).scenario;
  const reference = anneeDeReference(c.code);
  const sans = anneeSansEntretien(c.code);
  const t1 = rang(TRIMESTRE_SANS_ENTRETIEN);
  // Le budget de référence est celui que la gestion engage, et que l'arène facture.
  const budget = auCentime(entretienDeLAnnee(c.code, TRIMESTRE_SANS_ENTRETIEN));
  const perte = scenario.production.availabilityDecay;
  const regain = RETABLISSEMENT_PAR_ENTRETIEN * perte;
  // La capacité de l'outil à 100 % : celle de l'année jouée avec l'entretien, au trimestre qui suit.
  const capacite = Math.round(reference[t1 + 1]!.production.machineCapacity);
  const disponibiliteApres = auDixieme((1 - perte) * 100);
  const disponibiliteEnsuite = auDixieme((1 - perte + regain) * 100);
  const capaciteApres = Math.round(capacite * (1 - perte));
  const capaciteEnsuite = Math.round(capacite * (1 - perte + regain));
  const seuil = auCentime(seuilDEntretien(budget));
  // Les trimestres d'entretien complet qu'il faut pour rendre à l'outil ce qu'un trimestre sans entretien lui a pris.
  const trimestresDeRetour = Math.ceil(perte / regain - 1e-9);
  const avecT1 = reference[t1]!;
  const sansT1 = sans[t1]!;
  const rebutsAvant = Math.round(avecT1.qualityCosts?.defectUnits ?? 0);
  const rebutsApres = Math.round(sansT1.qualityCosts?.defectUnits ?? 0);
  const coutDesRebutsAvant = Math.round(avecT1.qualityCosts?.internalFailure ?? 0);
  const coutDesRebutsApres = Math.round(sansT1.qualityCosts?.internalFailure ?? 0);
  const margeT1Avant = Math.round(avecT1.incomeStatement.grossMargin);
  const margeT1Apres = Math.round(sansT1.incomeStatement.grossMargin);
  const entretienAvant = auCentime(surLAnnee(reference, (r) => r.incomeStatement.maintenanceCost));
  // L'année sans entretien au trimestre 1 dépense le budget de référence de moins (la garde le vérifie
  // sur ce que l'arène facture) : écrit ainsi, l'écart du tableau tombe au centime sur le budget lu plus haut.
  const entretienApres = auCentime(entretienAvant - budget);
  // Les ventes perdues au trimestre sans entretien (les rebuts, là où ils jouent) et ensuite (l'outil moins disponible).
  const ventesPerduesT1 = Math.round(soldUnits(avecT1)) - Math.round(soldUnits(sansT1));
  const venduesAvant = Math.round(surLAnnee(reference, soldUnits));
  const venduesApres = Math.round(surLAnnee(sans, soldUnits));
  const margeAvant = Math.round(surLAnnee(reference, (r) => r.incomeStatement.grossMargin));
  const margeApres = Math.round(surLAnnee(sans, (r) => r.incomeStatement.grossMargin));
  const resultatAvant = Math.round(surLAnnee(reference, (r) => r.incomeStatement.operatingIncome));
  const resultatApres = Math.round(surLAnnee(sans, (r) => r.incomeStatement.operatingIncome));
  const economie = budget;
  const margePerdue = margeAvant - margeApres;
  const ecartDeResultat = resultatApres - resultatAvant;
  const verdict: Verdict =
    Math.abs(margePerdue) < 1 && venduesAvant === venduesApres
      ? "rien-ne-se-perd"
      : ecartDeResultat > 0
        ? "l-economie-tient"
        : "l-economie-se-perd";
  return {
    budget,
    perte: auDixieme(perte * 100),
    regain: auDixieme(regain * 100),
    retablissement: Math.round(RETABLISSEMENT_PAR_ENTRETIEN * 100),
    capacite,
    disponibiliteApres,
    disponibiliteEnsuite,
    capaciteApres,
    capaciteEnsuite,
    trimestresDeRetour,
    capaciteReelleApres: Math.round(sans[t1 + 1]!.production.machineCapacity),
    capaciteReelleEnsuite: Math.round(sans[t1 + 2]!.production.machineCapacity),
    capaciteAvecEnsuite: Math.round(reference[t1 + 2]!.production.machineCapacity),
    seuil,
    economieAuSeuil: auCentime(budget - seuil),
    sensibilite: sensibiliteDesRebuts(c.code),
    perissable: scenario.perishable === true,
    produitesT1: Math.round(avecT1.production.produced),
    venduesT1: Math.round(soldUnits(avecT1)),
    rebutsAvant,
    rebutsApres,
    rebutsEnPlus: rebutsApres - rebutsAvant,
    coutDesRebutsAvant,
    coutDesRebutsApres,
    coutDesRebutsEnPlus: coutDesRebutsApres - coutDesRebutsAvant,
    margeT1Avant,
    margeT1Apres,
    margeT1Perdue: margeT1Avant - margeT1Apres,
    entretienAvant,
    entretienApres,
    economie,
    venduesAvant,
    venduesApres,
    ventesPerdues: venduesAvant - venduesApres,
    ventesPerduesT1,
    ventesPerduesEnsuite: venduesAvant - venduesApres - ventesPerduesT1,
    margeAvant,
    margeApres,
    margePerdue,
    resultatAvant,
    resultatApres,
    ecartDeResultat,
    verdict,
  };
}

const T = TRIMESTRE_SANS_ENTRETIEN;

export const ENTRETENIR_L_OUTIL: Chapitre = {
  code: "entretenir-l-outil",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 4 · Soutenir le fonctionnement et le développement de la PME"],
  titre: "Entretenir l'outil : maintenance et disponibilité",
  accroche:
    "Sauter l'entretien d'un trimestre fait une économie certaine. L'outil s'use, sa disponibilité baisse, et la capacité perdue se paie ensuite en ventes : l'arène rejoue l'année sans entretien au premier trimestre.",
  objectifs: [
    "Calculer la disponibilité et la capacité de l'outil après un trimestre sans entretien",
    "Calculer le budget d'entretien sous lequel la disponibilité baisse",
    "Comparer l'économie d'un trimestre à la marge perdue ensuite",
    "Juger une économie d'entretien sur l'année entière",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un trimestre sans entretien",
      notions: ["capacity", "productivity"],
      texte: (c) => {
        const r = entretienDeLOutil(c);
        return [
          `Chaque trimestre, ${c.entreprise} dépense ${eur(r.budget)} pour entretenir son outil : c'est le budget de référence de son parc, arrondi à l'euro. Le gérant envisage de ne rien y consacrer au trimestre ${T}, pour faire une économie.`,
          `Dans l'arène, l'outil s'use chaque trimestre. Sans entretien, il perd ${pct(r.perte)} de disponibilité ; l'entretien le répare, et un euro dépensé rétablit ${r.retablissement} % de ce qu'un euro manquant laisse s'user. Au budget de référence, l'outil regagne donc ${pct(r.regain)} par trimestre, jusqu'à 100 %. La disponibilité se joue au trimestre suivant : un outil moins disponible produit moins.`,
          r.sensibilite > 0
            ? `Chez ${c.entreprise}, un entretien trop bas fait aussi monter les rebuts du trimestre même : jusqu'à ${pct(auDixieme(r.sensibilite * 100))} de rebuts en plus, sans entretien du tout.`
            : `Chez ${c.entreprise}, l'arène ne fait pas jouer l'entretien sur les rebuts : seule la disponibilité de l'outil en dépend.`,
        ];
      },
      tableau: (c) => {
        const r = entretienDeLOutil(c);
        return {
          titre: `L'outil ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Budget d'entretien d'un trimestre (référence du parc)", valeurs: [eur(r.budget)] },
            { libelle: `Capacité de l'outil disponible à 100 % (${c.unites} par trimestre)`, valeurs: [qte(r.capacite)] },
            { libelle: "Disponibilité perdue en un trimestre sans entretien", valeurs: [pct(r.perte)] },
            { libelle: "Disponibilité regagnée en un trimestre au budget de référence", valeurs: [pct(r.regain)] },
          ],
        };
      },
      repere: () =>
        "Variation de la disponibilité = disponibilité regagnée × (budget ÷ référence) − disponibilité perdue × (1 − budget ÷ référence), sans dépasser 100 %.",
    },
    {
      id: "disponibilite",
      type: "montants",
      titre: "L'outil après le trimestre sans entretien",
      notions: ["capacity"],
      question: (c) =>
        `Sans entretien au trimestre ${T}, calculez la disponibilité de l'outil au trimestre ${T + 1} (en %), puis sa capacité au trimestre ${T + 1} et au trimestre ${T + 2}, une fois l'entretien repris au budget de référence (en ${c.unites}).`,
      champs: (c) => {
        const r = entretienDeLOutil(c);
        return [
          { libelle: `Disponibilité au trimestre ${T + 1} (%)`, attendu: r.disponibiliteApres, calcul: `100 % − ${pct(r.perte)} = ${pct(r.disponibiliteApres)}`, tolerance: 0.1 },
          {
            libelle: `Capacité de l'outil au trimestre ${T + 1} (${c.unites})`,
            attendu: r.capaciteApres,
            calcul: `${qte(r.capacite)} × ${pct(r.disponibiliteApres)} = ${qte(r.capaciteApres)}`,
            tolerance: 1,
          },
          {
            libelle: `Capacité de l'outil au trimestre ${T + 2} (${c.unites})`,
            attendu: r.capaciteEnsuite,
            calcul: `${qte(r.capacite)} × (${pct(r.disponibiliteApres)} + ${pct(r.regain)}) = ${qte(r.capaciteEnsuite)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = entretienDeLOutil(c);
        return [
          `L'économie du trimestre ${T} se paie en capacité aux ${r.trimestresDeRetour} trimestres suivants : ${qte(r.capacite - r.capaciteApres)} ${c.unites} de moins au trimestre ${T + 1}, ${qte(r.capacite - r.capaciteEnsuite)} au trimestre ${T + 2}. Il faut ${r.trimestresDeRetour} trimestres d'entretien complet pour que l'outil retrouve 100 %.`,
        ];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le budget sous lequel l'outil s'use",
      notions: ["capacity", "fixed_costs"],
      question: (c) => {
        const r = entretienDeLOutil(c);
        return `Cherchez le budget où ce que l'entretien répare égale ce que l'outil perd : ${pct(r.regain)} × (budget ÷ ${eur(r.budget)}) = ${pct(r.perte)} × (1 − budget ÷ ${eur(r.budget)}). C'est le budget sous lequel la disponibilité baisse. Calculez-le, puis ce qu'il économise par trimestre par rapport à la référence.`;
      },
      champs: (c) => {
        const r = entretienDeLOutil(c);
        const diviseur = (1 + RETABLISSEMENT_PAR_ENTRETIEN).toLocaleString("fr-FR");
        return [
          { libelle: "Budget sous lequel la disponibilité baisse", attendu: r.seuil, calcul: `${eur(r.budget)} ÷ ${diviseur} = ${eur(r.seuil)}`, tolerance: 1 },
          { libelle: "Économie par trimestre au seuil", attendu: r.economieAuSeuil, calcul: `${eur(r.budget)} − ${eur(r.seuil)} = ${eur(r.economieAuSeuil)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = entretienDeLOutil(c);
        return [
          `En dessous de ${eur(r.seuil)}, l'outil perd de la disponibilité chaque trimestre ; au-dessus, il en regagne, jusqu'à 100 %. Dans l'arène, un outil déjà à 100 % y reste dès que le budget atteint ce seuil : le budget de référence le rétablit plus vite après une usure. Sans aucun entretien, la perte est la plus forte, ${pct(r.perte)} en un trimestre.`,
        ];
      },
    },
    {
      id: "rebuts",
      type: "montants",
      titre: "Les rebuts du trimestre",
      notions: ["variable_costs", "contribution_margin"],
      si: (c) => sensibiliteDesRebuts(c.code) > 0,
      tableau: (c) => {
        const r = entretienDeLOutil(c);
        return {
          titre: `Le trimestre ${T} ${dE(c.entreprise)}, avec et sans entretien`,
          colonnes: ["Avec entretien", "Sans entretien"],
          lignes: [
            { libelle: `Rebuts (${c.unites})`, valeurs: [qte(r.rebutsAvant), qte(r.rebutsApres)] },
            { libelle: "Coût des rebuts", valeurs: [eur(r.coutDesRebutsAvant), eur(r.coutDesRebutsApres)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.margeT1Avant), eur(r.margeT1Apres)] },
          ],
        };
      },
      question: (c) =>
        `Sans entretien, les rebuts du trimestre ${T} montent. Calculez les rebuts en plus (en ${c.unites}), ce qu'ils coûtent de plus, et la marge sur coût variable perdue au trimestre ${T}.`,
      champs: (c) => {
        const r = entretienDeLOutil(c);
        return [
          { libelle: `Rebuts en plus (${c.unites})`, attendu: r.rebutsEnPlus, calcul: `${qte(r.rebutsApres)} − ${qte(r.rebutsAvant)} = ${qte(r.rebutsEnPlus)}`, tolerance: 1 },
          { libelle: "Coût des rebuts en plus", attendu: r.coutDesRebutsEnPlus, calcul: `${eur(r.coutDesRebutsApres)} − ${eur(r.coutDesRebutsAvant)} = ${eur(r.coutDesRebutsEnPlus)}`, tolerance: 1 },
          { libelle: `Marge perdue au trimestre ${T}`, attendu: r.margeT1Perdue, calcul: `${eur(r.margeT1Avant)} − ${retranche(r.margeT1Apres)} = ${eur(r.margeT1Perdue)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = entretienDeLOutil(c);
        return [
          r.perissable && r.produitesT1 > r.venduesT1 && r.margeT1Perdue < r.coutDesRebutsEnPlus
            ? `Les rebuts en plus coûtent ${eur(r.coutDesRebutsEnPlus)}, mais la marge du trimestre ne baisse que de ${eur(r.margeT1Perdue)}. ${c.entreprise} produit ${qte(r.produitesT1)} ${c.unites} ce trimestre et en vend ${qte(r.venduesT1)} : son activité ne se stocke pas, et ce qui n'est pas vendu est perdu dans le trimestre. Une partie des rebuts prend donc la place d'invendus qui étaient perdus de toute façon.`
            : `Les rebuts en plus coûtent ${eur(r.coutDesRebutsEnPlus)} : produits et payés, ils ne se vendent pas, et la marge du trimestre baisse de ${eur(r.margeT1Perdue)}.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = entretienDeLOutil(c);
        return {
          titre: "L'année jouée, avec et sans entretien au premier trimestre",
          colonnes: ["Avec entretien", `Sans entretien au trimestre ${T}`],
          lignes: [
            { libelle: `Capacité de l'outil au trimestre ${T + 1} (${c.unites})`, valeurs: [qte(r.capacite), qte(r.capaciteReelleApres)] },
            { libelle: `Capacité de l'outil au trimestre ${T + 2} (${c.unites})`, valeurs: [qte(r.capaciteAvecEnsuite), qte(r.capaciteReelleEnsuite)] },
            { libelle: "Entretien de l'année", valeurs: [eur(r.entretienAvant), eur(r.entretienApres)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.venduesAvant), qte(r.venduesApres)] },
            { libelle: "Marge sur coût variable de l'année", valeurs: [eur(r.margeAvant), eur(r.margeApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(r.resultatAvant), eur(r.resultatApres)] },
          ],
        };
      },
      question: () =>
        `L'arène a rejoué l'année sans entretien au trimestre ${T}, l'entretien repris ensuite au budget de référence ; les autres décisions sont celles de la même gestion, qui prévoit chaque trimestre sa production d'après la demande du trimestre d'avant, ventes manquées comprises. Calculez l'entretien économisé, la marge sur coût variable perdue sur l'année, et l'écart de résultat de l'activité.`,
      champs: (c) => {
        const r = entretienDeLOutil(c);
        return [
          { libelle: "Entretien économisé", attendu: r.economie, calcul: `${eur(r.entretienAvant)} − ${eur(r.entretienApres)} = ${eur(r.economie)}`, tolerance: 1 },
          { libelle: "Marge perdue sur l'année", attendu: r.margePerdue, calcul: `${eur(r.margeAvant)} − ${retranche(r.margeApres)} = ${eur(r.margePerdue)}`, tolerance: 1 },
          { libelle: "Écart de résultat", attendu: r.ecartDeResultat, calcul: `${eur(r.resultatApres)} − ${retranche(r.resultatAvant)} = ${eur(r.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = entretienDeLOutil(c);
        return [
          r.verdict === "rien-ne-se-perd"
            ? `L'outil a perdu de la capacité, mais les ventes ${dE(c.entreprise)} n'ont pas bougé : ce n'est pas l'outil qui limitait son activité. L'économie de ${eur(r.economie)} passe entière au résultat.`
            : r.ventesPerduesEnsuite > 0
              ? `L'outil moins disponible fait vendre ${qte(r.ventesPerduesEnsuite)} ${c.unites} de moins après le trimestre ${T}${r.ventesPerduesT1 > 0 ? `, et les rebuts du trimestre ${T} ${qte(r.ventesPerduesT1)} de moins` : ""} : la marge perdue sur l'année atteint ${eur(r.margePerdue)}, pour ${eur(r.economie)} d'entretien économisé. La perte ne se lit pas qu'au trimestre où l'outil manque : c'est l'année entière qui fait le compte.`
              : `L'outil a perdu de la capacité sans coûter de vente ensuite : ce sont les rebuts du trimestre ${T} qui font vendre ${qte(r.ventesPerdues)} ${c.unites} de moins sur l'année, et la marge perdue atteint ${eur(r.margePerdue)}, pour ${eur(r.economie)} d'entretien économisé.`,
          `L'écart de résultat, ${eur(r.ecartDeResultat)}, est l'entretien économisé moins la marge perdue : dans l'arène, rien d'autre n'a changé.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "L'économie valait-elle la peine ?",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const r = entretienDeLOutil(c);
        return `Sans entretien au trimestre ${T}, ${c.entreprise} économise ${eur(r.economie)} et perd ${eur(r.margePerdue)} de marge sur l'année. Que retenir ?`;
      },
      options: (c) => {
        const r = entretienDeLOutil(c);
        return [
          {
            texte: "L'économie se perd ensuite : la marge perdue dépasse l'entretien économisé",
            juste: r.verdict === "l-economie-se-perd",
            retour:
              r.verdict === "l-economie-se-perd"
                ? `Oui : le résultat de l'année baisse de ${eur(-r.ecartDeResultat)}. L'outil moins disponible a fait perdre ${eur(r.margePerdue)} de marge, plus que les ${eur(r.economie)} d'entretien économisés : l'économie d'un trimestre a coûté ensuite.`
                : `Non : la marge perdue (${eur(r.margePerdue)}) reste sous l'entretien économisé (${eur(r.economie)}), et le résultat monte de ${eur(r.ecartDeResultat)}.`,
          },
          {
            texte: `L'économie tient cette année, malgré ${r.trimestresDeRetour} trimestres d'outil moins disponible`,
            juste: r.verdict === "l-economie-tient",
            retour:
              r.verdict === "l-economie-tient"
                ? `Oui : le résultat monte de ${eur(r.ecartDeResultat)}, parce que la marge perdue (${eur(r.margePerdue)}) reste sous l'entretien économisé. Mais l'outil a été moins disponible ${r.trimestresDeRetour} trimestres, et ${c.entreprise} a vendu ${qte(r.ventesPerdues)} ${c.unites} de moins. Répétée chaque trimestre, l'économie userait l'outil un peu plus à chaque fois.`
                : r.verdict === "rien-ne-se-perd"
                  ? "Non : l'outil a été moins disponible, mais les ventes n'en ont pas souffert : rien ne s'est perdu."
                  : `Non : le résultat baisse de ${eur(-r.ecartDeResultat)} : la marge perdue dépasse l'entretien économisé.`,
          },
          {
            texte: "Rien ne se perd : ce n'est pas l'outil qui limitait les ventes",
            juste: r.verdict === "rien-ne-se-perd",
            retour:
              r.verdict === "rien-ne-se-perd"
                ? `Oui : l'outil a perdu de la capacité, mais il en restait plus que l'activité n'en demandait. L'économie de ${eur(r.economie)} passe au résultat. Ce ne serait plus vrai le jour où l'outil deviendrait le facteur qui limite les ventes.`
                : `Non : l'outil moins disponible a fait perdre ${eur(r.margePerdue)} de marge sur l'année.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity"],
      texte: (c) => {
        const r = entretienDeLOutil(c);
        return [
          `Chez ${c.entreprise}, un trimestre sans entretien économise ${eur(r.economie)}, fait tomber la disponibilité de l'outil à ${pct(r.disponibiliteApres)} au trimestre suivant, et fait perdre ${eur(r.margePerdue)} de marge sur l'année. Sous ${eur(r.seuil)} par trimestre, l'outil s'use.`,
          "L'entretien est une charge qui protège la capacité. Une économie d'entretien se juge sur les trimestres qui suivent : la disponibilité perdue met du temps à revenir, et elle ne coûte que si l'outil limite l'activité.",
        ];
      },
      repere: () => "Capacité disponible = capacité de l'outil × disponibilité ; sous le seuil d'entretien, la disponibilité baisse.",
    },
  ],
};
