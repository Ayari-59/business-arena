import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { EMBAUCHES, rejouerLAnnee, vendues } from "../ressources-humaines";
import type { Chapitre } from "../types";


/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : RECRUTER, CE QUE COÛTE UNE EMBAUCHE ET CE QU'ELLE APPORTE (Bac STMG, ressources
 * humaines, palier 1).
 *
 * Une embauche se décide au premier trimestre, coûte son recrutement tout de suite et son salaire
 * chaque trimestre ensuite ; le salarié n'arrive qu'au trimestre suivant. Le chapitre calcule ce
 * qu'elle coûte sur l'année et ce qu'elle doit faire vendre pour se payer, puis l'arène rejoue
 * l'année avec ce salarié de plus : la capacité de l'équipe monte, mais les ventes ne suivent que
 * si l'équipe était ce qui les limitait.
 *
 * Le coût d'un recrutement, le salaire et la capacité de travail sont ceux du scénario et du
 * moteur (`hr`, src/engine/hr) ; la marge d'une unité est celle du cas (`gestion`) ; l'embauche
 * rejouée est posée dans ressources-humaines.ts (EMBAUCHES).
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const somme = (xs: number[]) => xs.reduce((t, x) => t + x, 0);

export type Verdict = "rien-de-plus" | "pas-assez" | "se-paie";

/** L'embauche : son coût, ce qu'elle doit faire vendre, et ce que l'arène en fait. */
export function recrutement(c: Cas) {
  const hr = scenarioByCode(c.code).scenario.hr!;
  const base = rejouerLAnnee(c.code, "base", () => undefined);
  const avec = rejouerLAnnee(c.code, "embauche", (t) => (t === 1 ? { hire: EMBAUCHES } : undefined));
  const trimestresAvecLui = avec.length - 1;
  const coutDuRecrutement = hr.hiringCost * EMBAUCHES;
  const salaires = hr.salaryPerEmployeePerRound * EMBAUCHES * trimestresAvecLui;
  const coutDeLEmbauche = coutDuRecrutement + salaires;
  const margeUnitaire = auCentime(c.gestion.prixMoyen - c.gestion.coutVariableUnitaire);
  const ventesPourSePayer = Math.ceil(coutDeLEmbauche / margeUnitaire - 1e-9);
  // La capacité de l'équipe, en unités par trimestre, avant et après l'arrivée du salarié.
  const capaciteAvant = Math.round(base[1]!.production.laborCapacity);
  const capaciteApres = Math.round(avec[1]!.production.laborCapacity);
  // Le trimestre où l'équipe a été la plus occupée, dans l'année jouée sans l'embauche.
  const occupations = base.map((r) => r.production.produced / r.production.laborCapacity);
  const occupationMax = Math.round(Math.max(...occupations) * 1000) / 10;
  const venduesAvant = Math.round(somme(base.map(vendues)));
  const venduesApres = Math.round(somme(avec.map(vendues)));
  const resultatAvant = Math.round(somme(base.map((r) => r.incomeStatement.operatingIncome)));
  const resultatApres = Math.round(somme(avec.map((r) => r.incomeStatement.operatingIncome)));
  const venduesEnPlus = venduesApres - venduesAvant;
  const ecartDeResultat = resultatApres - resultatAvant;
  const verdict: Verdict = ecartDeResultat > 0 ? "se-paie" : venduesEnPlus > 0 ? "pas-assez" : "rien-de-plus";
  return {
    coutDuRecrutement,
    salaireTrimestriel: hr.salaryPerEmployeePerRound,
    trimestresAvecLui,
    salaires,
    coutDeLEmbauche,
    margeUnitaire,
    ventesPourSePayer,
    capaciteAvant,
    capaciteApres,
    occupationMax,
    venduesAvant,
    venduesApres,
    venduesEnPlus,
    resultatAvant,
    resultatApres,
    ecartDeResultat,
    verdict,
  };
}

export const RECRUTER: Chapitre = {
  code: "recruter",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  titre: "Recruter : ce que coûte une embauche, ce qu'elle apporte",
  accroche:
    "Une embauche coûte son recrutement tout de suite et un salaire chaque trimestre ensuite. Elle ne rapporte que si le travail manquait : l'arène rejoue l'année avec un salarié de plus.",
  objectifs: [
    "Calculer le coût d'une embauche sur l'année",
    "Calculer les ventes qu'une embauche doit apporter pour se payer",
    "Lire ce qu'une embauche change à la capacité de l'équipe",
    "Juger une embauche sur les ventes qu'elle apporte réellement",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un salarié de plus",
      notions: ["payroll", "capacity"],
      texte: (c) => {
        const r = recrutement(c);
        return [
          `${c.entreprise} envisage d'embaucher un salarié au premier trimestre. Le recrutement (annonce, entretiens, intégration) coûte ${eur(r.coutDuRecrutement)} tout de suite ; le salarié n'arrive qu'au trimestre suivant, et coûte alors ${eur(r.salaireTrimestriel)} chaque trimestre.`,
          `En échange, l'équipe peut produire davantage. Mais dans l'année jouée, elle n'a jamais été occupée à plus de ${pct(r.occupationMax)} de ce qu'elle pouvait faire : ${r.occupationMax >= 99.5 ? "le travail a manqué au moins un trimestre." : "il lui restait de la marge à chaque trimestre."}`,
        ];
      },
      tableau: (c) => {
        const r = recrutement(c);
        return {
          titre: `L'embauche ${dE(c.entreprise)}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Coût du recrutement", valeurs: [eur(r.coutDuRecrutement)] },
            { libelle: "Coût du salarié par trimestre", valeurs: [eur(r.salaireTrimestriel)] },
            { libelle: "Trimestres où il est présent", valeurs: [String(r.trimestresAvecLui)] },
            { libelle: `Marge d'une unité vendue (prix moins coût variable)`, valeurs: [eur(r.margeUnitaire)] },
          ],
        };
      },
      repere: () => "Une embauche se paie si les ventes qu'elle apporte laissent assez de marge pour couvrir son coût.",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûte l'embauche, ce qu'elle doit faire vendre",
      notions: ["payroll", "contribution_margin"],
      question: (c) => `Calculez le coût de l'embauche sur l'année (le recrutement, plus le salaire des trimestres où il est présent), puis le nombre ${dE(c.unites)} à vendre en plus pour le couvrir (coût ÷ marge d'une unité, arrondi à l'unité supérieure).`,
      champs: (c) => {
        const r = recrutement(c);
        return [
          { libelle: "Coût de l'embauche sur l'année", attendu: r.coutDeLEmbauche, calcul: `${eur(r.coutDuRecrutement)} + ${eur(r.salaireTrimestriel)} × ${r.trimestresAvecLui} = ${eur(r.coutDeLEmbauche)}`, tolerance: 1 },
          { libelle: `Ventes à faire en plus (${c.unites})`, attendu: r.ventesPourSePayer, calcul: `${eur(r.coutDeLEmbauche)} ÷ ${eur(r.margeUnitaire)} = ${qte(r.ventesPourSePayer)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = recrutement(c);
        return [
          `Pour se payer, l'embauche doit faire vendre ${qte(r.ventesPourSePayer)} ${c.unites} de plus dans l'année. Ce n'est pas le salarié qui crée ces ventes : il faut des clients pour les acheter, et que l'équipe actuelle n'ait pas pu les servir.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: "L'arène rejoue l'année",
      notions: ["capacity", "productivity"],
      tableau: (c) => {
        const r = recrutement(c);
        return {
          titre: "L'année jouée, sans et avec l'embauche",
          colonnes: ["Sans", "Avec"],
          lignes: [
            { libelle: `Capacité de l'équipe au deuxième trimestre, quand le salarié arrive (${c.unites})`, valeurs: [qte(r.capaciteAvant), qte(r.capaciteApres)] },
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: [qte(r.venduesAvant), qte(r.venduesApres)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(r.resultatAvant), eur(r.resultatApres)] },
          ],
        };
      },
      question: (c) => `L'arène a rejoué l'année avec l'embauche, tout le reste identique. Calculez la capacité gagnée par trimestre, les ventes en plus sur l'année (en ${c.unites}), et l'écart de résultat de l'activité.`,
      champs: (c) => {
        const r = recrutement(c);
        return [
          { libelle: `Capacité gagnée par trimestre (${c.unites})`, attendu: r.capaciteApres - r.capaciteAvant, calcul: `${qte(r.capaciteApres)} − ${qte(r.capaciteAvant)} = ${qte(r.capaciteApres - r.capaciteAvant)}`, tolerance: 1 },
          { libelle: `Ventes en plus (${c.unites})`, attendu: r.venduesEnPlus, calcul: `${qte(r.venduesApres)} − ${qte(r.venduesAvant)} = ${qte(r.venduesEnPlus)}`, tolerance: 1 },
          { libelle: "Écart de résultat", attendu: r.ecartDeResultat, calcul: `${eur(r.resultatApres)} − ${retranche(r.resultatAvant)} = ${eur(r.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = recrutement(c);
        return [
          r.venduesEnPlus > 0
            ? `L'équipe pouvait produire ${qte(r.capaciteApres - r.capaciteAvant)} ${c.unites} de plus par trimestre, et l'arène en a vendu ${qte(r.venduesEnPlus)} de plus sur l'année : ${r.occupationMax >= 99.5 ? "certains trimestres, le travail manquait vraiment." : "même sans être saturée, l'équipe vend davantage avec une personne de plus."}`
            : `L'équipe pouvait produire ${qte(r.capaciteApres - r.capaciteAvant)} ${c.unites} de plus par trimestre, mais l'arène n'en a pas vendu une de plus : ce n'est pas le travail qui limitait les ventes, ce sont les clients, ou l'équipement.`,
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "L'embauche s'est-elle payée ?",
      notions: ["payroll", "capacity"],
      question: (c) => {
        const r = recrutement(c);
        return `Avec l'embauche, le résultat de l'activité ${dE(c.entreprise)} passe de ${eur(r.resultatAvant)} à ${eur(r.resultatApres)} sur l'année. Que conclure ?`;
      },
      options: (c) => {
        const r = recrutement(c);
        return [
          {
            texte: "Elle n'a rien fait vendre de plus : l'équipe n'était pas ce qui limitait les ventes",
            juste: r.verdict === "rien-de-plus",
            retour:
              r.verdict === "rien-de-plus"
                ? `Oui : les ventes n'ont pas bougé, et l'embauche a coûté ${eur(-r.ecartDeResultat)} au résultat. Avant de recruter, il faut vérifier que le travail manque : ici, l'équipe avait de la marge.`
                : `Non : elle a fait vendre ${qte(r.venduesEnPlus)} ${c.unites} de plus.`,
          },
          {
            texte: "Elle a fait vendre davantage, mais pas assez pour couvrir son coût",
            juste: r.verdict === "pas-assez",
            retour:
              r.verdict === "pas-assez"
                ? `Oui : ${qte(r.venduesEnPlus)} ${c.unites} de plus, quand il en fallait ${qte(r.ventesPourSePayer)} pour la payer. Le travail manquait par moments, pas assez pour un salarié entier toute l'année.`
                : r.verdict === "se-paie"
                  ? `Non : elle a fait vendre assez pour couvrir son coût, et le résultat monte.`
                  : "Non : elle n'a rien fait vendre de plus.",
          },
          {
            texte: "Elle se paie : les ventes en plus couvrent son coût",
            juste: r.verdict === "se-paie",
            retour:
              r.verdict === "se-paie"
                ? `Oui : le résultat monte de ${eur(r.ecartDeResultat)}. L'équipe limitait les ventes, et le salarié de plus les a débloquées.`
                : `Non : le résultat baisse de ${eur(-r.ecartDeResultat)}. ${r.venduesEnPlus > 0 ? `Les ventes en plus (${qte(r.venduesEnPlus)} ${c.unites}) ne couvrent pas les ${eur(r.coutDeLEmbauche)} de l'embauche.` : "Aucune vente de plus ne vient couvrir son coût."}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["payroll"],
      texte: (c) => {
        const r = recrutement(c);
        return [
          `Chez ${c.entreprise}, une embauche coûte ${eur(r.coutDeLEmbauche)} sur l'année et devrait faire vendre ${qte(r.ventesPourSePayer)} ${c.unites} de plus pour se payer ; l'arène en a vendu ${qte(r.venduesEnPlus)} de plus.`,
          "Recruter se décide sur ce qui limite l'activité : si ce sont les clients ou l'équipement, un salarié de plus n'ajoute qu'une charge. Et l'embauche se prépare tôt : elle coûte dès qu'on la décide, et le salarié n'arrive qu'au trimestre suivant.",
        ];
      },
      repere: () => "Ventes à faire en plus = coût de l'embauche ÷ marge d'une unité.",
    },
  ],
};
