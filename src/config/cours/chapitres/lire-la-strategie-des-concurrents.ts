import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";
import { MARCHES } from "./marche-et-part-de-marche";

/**
 * CHAPITRE : LIRE LA STRATÉGIE DE SES CONCURRENTS (Stratégie et management, palier 2).
 *
 * Ce que chaque enseigne du marché a fait dans l'année du cours (`anneeJouee` : l'entreprise,
 * jouée par une gestion équilibrée, et ses deux concurrents, joués par les robots du scénario)
 * dit la stratégie qu'elle suit : son prix moyen, la qualité que les clients lui reconnaissent,
 * ses budgets de qualité et de marketing, la part du marché qu'elle prend et ce qu'elle gagne.
 * L'élève place les trois enseignes sur une carte prix / qualité (deux indices, base 100 la
 * moyenne du marché), reconnaît la stratégie de chacune, dit où se trouve l'espace libre, et
 * laquelle a réussi.
 *
 * Le chapitre « Le marché et la part de marché » calcule déjà les parts de marché : ici, elles
 * sont données, et l'objet est le positionnement de chaque enseigne.
 *
 * Ce que le moteur expose, et que le chapitre lit : les ventes et le chiffre d'affaires de
 * chaque enseigne (le prix moyen s'en déduit), sa qualité perçue en fin de trimestre (l'état de
 * l'entreprise, 1 étant la qualité de référence du marché), ses budgets de qualité et de
 * marketing (son compte de résultat), son résultat, et sa défaillance. Une enseigne défaillante
 * cesse de vendre : ses prix, sa qualité et ses budgets se lisent sur les trimestres où elle
 * vendait encore.
 *
 * VOLT FITNESS N'EN EST PAS : son chiffre d'affaires vient surtout des abonnés gardés, et ses
 * ventes du trimestre ne comptent que les nouveaux ; leur rapport ne fait pas un prix.
 */

/**
 * LA RÈGLE DE LECTURE DU COURS : une enseigne suit la domination par les coûts quand son prix
 * est à plus de 5 points sous le prix moyen du marché et sa qualité sous la qualité moyenne ; la
 * différenciation, à plus de 5 points au-dessus avec une qualité au-dessus ; sinon, elle est
 * dans une position intermédiaire. Les 5 points laissent hors des deux stratégies une enseigne
 * qui vend au prix du marché, à quelques euros près.
 */
export const ECART_D_UNE_STRATEGIE = 5;

export type StrategieLue = "couts" | "differenciation" | "intermediaire";

export const CATEGORIES_DE_STRATEGIE: readonly { code: StrategieLue; libelle: string }[] = [
  { code: "couts", libelle: "Coûts" },
  { code: "differenciation", libelle: "Différenciation" },
  { code: "intermediaire", libelle: "Intermédiaire" },
];

export const NOMS_DES_STRATEGIES_LUES: Record<StrategieLue, string> = {
  couts: "la domination par les coûts",
  differenciation: "la différenciation",
  intermediaire: "une position intermédiaire",
};

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qualiteEcrite = (q: number) => q.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
export const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

const ventesDuTrimestre = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.sold, 0);

/**
 * Le marché lu sur des trimestres de l'année du cours (tous, ou le premier seul) : chaque
 * enseigne, sa place sur la carte prix / qualité, et la stratégie qu'elle y montre.
 */
export function lireLeMarche(c: Cas, trimestres: readonly number[]) {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const tours = trimestres.map((t) => partie.rounds[t - 1]!);
  const marche = Math.round(
    tours.reduce((t, tour) => t + Object.values(tour.results["joueur"]!.market.bySegment).reduce((s, v) => s + v.potential, 0), 0),
  );
  const ids = ["joueur", ...def.bots.slice(0, 2).map((b) => b.id)];
  const brutes = ids.map((id) => {
    const resultats = tours.map((t) => t.results[id]!);
    const vendus = resultats.map(ventesDuTrimestre);
    // Les trimestres où l'enseigne vendait : une enseigne défaillante n'a plus ni prix ni budgets.
    const actifs = trimestres.filter((_, k) => vendus[k]! > 0);
    const dernier = actifs.at(-1)!;
    const ventes = Math.round(vendus.reduce((a, b) => a + b, 0));
    const chiffreDAffaires = Math.round(resultats.reduce((a, r) => a + r.incomeStatement.revenue, 0));
    const fin = partie.rounds[trimestres.at(-1)! - 1]!.results[id]!;
    return {
      id,
      nom: id === "joueur" ? c.entreprise : def.bots.find((b) => b.id === id)!.name,
      ventes,
      chiffreDAffaires,
      prix: auCentime(chiffreDAffaires / ventes),
      qualite: auCentieme(partie.rounds[dernier - 1]!.companies.find((x) => x.id === id)!.perceivedQuality),
      budgetQualite: Math.round(resultats.reduce((a, r) => a + r.incomeStatement.qualityCost, 0) / actifs.length),
      budgetMarketing: Math.round(resultats.reduce((a, r) => a + r.incomeStatement.marketingCost, 0) / actifs.length),
      part: auDixieme((ventes / marche) * 100),
      resultat: Math.round(resultats.reduce((a, r) => a + r.incomeStatement.netIncome, 0)),
      trimestresDeVente: actifs.length,
      /** Le premier trimestre sans vente, quand l'enseigne a cessé de vendre avant la fin. */
      sortie: dernier < trimestres.at(-1)! ? dernier + 1 : null,
      defaillante: fin.defaillant === true,
    };
  });
  // Le prix moyen du marché : ce que les clients des trois enseignes ont payé en moyenne.
  const prixDuMarche = auCentime(brutes.reduce((a, e) => a + e.chiffreDAffaires, 0) / brutes.reduce((a, e) => a + e.ventes, 0));
  const sommeDesQualites = brutes.reduce((a, e) => a + e.qualite, 0);
  const qualiteMoyenne = sommeDesQualites / brutes.length;
  // L'indice se calcule sur la qualité moyenne telle que l'élève l'écrit : au centième.
  const qualiteMoyenneEcrite = auCentieme(qualiteMoyenne);
  const enseignes = brutes.map((e) => {
    const indicePrix = Math.round((e.prix / prixDuMarche) * 100);
    const indiceQualite = Math.round((e.qualite / qualiteMoyenneEcrite) * 100);
    const strategie: StrategieLue =
      indicePrix < 100 - ECART_D_UNE_STRATEGIE && indiceQualite < 100
        ? "couts"
        : indicePrix > 100 + ECART_D_UNE_STRATEGIE && indiceQualite > 100
          ? "differenciation"
          : "intermediaire";
    return { ...e, indicePrix, indiceQualite, strategie };
  });
  return {
    trimestres,
    marche,
    enseignes,
    entreprise: enseignes[0]!,
    concurrents: enseignes.slice(1),
    prixDuMarche,
    sommeDesQualites: auCentieme(sommeDesQualites),
    qualiteMoyenne,
    /** La qualité moyenne, telle que l'élève l'écrit : au centième. */
    qualiteMoyenneEcrite,
  };
}

export type Enseigne = ReturnType<typeof lireLeMarche>["enseignes"][number];

/** Les quatre trimestres de l'année du cours. */
const ANNEE = [1, 2, 3, 4] as const;

/**
 * L'ESPACE LIBRE DE LA CARTE, selon la règle du cours : la place qu'une enseigne défaillante
 * a laissée vide, ou, s'il n'y en a pas, le plus grand écart de prix entre deux enseignes
 * voisines qui vendent encore.
 */
export function strategiesDesConcurrents(c: Cas) {
  const m = lireLeMarche(c, ANNEE);
  const partie = m.enseignes.find((e) => e.defaillante) ?? null;
  const restantes = m.enseignes.filter((e) => !e.defaillante).sort((a, b) => a.indicePrix - b.indicePrix);
  const ecarts = restantes.slice(1).map((haut, k) => ({ bas: restantes[k]!, haut, points: haut.indicePrix - restantes[k]!.indicePrix }));
  const plusGrand = ecarts.reduce((g, x) => (x.points > g.points ? x : g), ecarts[0]!);
  const meilleure = [...m.enseignes].sort((a, b) => b.resultat - a.resultat)[0]!;
  return { ...m, partie, restantes, ecarts, plusGrand, meilleure };
}

/** Comment une enseigne a quitté le marché : « a cessé de vendre au T3 », ou « finit l'année en défaillance ». */
const quitte = (e: Enseigne) => (e.sortie ? `a cessé de vendre au T${e.sortie}` : "finit l'année en défaillance");

export const LIRE_LA_STRATEGIE_DES_CONCURRENTS: Chapitre = {
  code: "lire-la-strategie-des-concurrents",
  parcours: "strategie",
  palier: 2,
  blocs: [
    "STMG Thème 3 · Les choix stratégiques des organisations",
    "DCG UE7 · Management des organisations",
    "BUT TC · Participer à la stratégie marketing et commerciale de l'organisation",
  ],
  titre: "Lire la stratégie de ses concurrents",
  accroche:
    "Leurs prix, la qualité que leur reconnaissent les clients, ce qu'ils dépensent et ce qu'ils gagnent : ce que chaque concurrent a fait dans l'année dit sa stratégie. Placer chacun sur la carte du marché, et y trouver l'espace libre.",
  objectifs: [
    "Calculer un indice de prix et un indice de qualité",
    "Situer l'entreprise et ses concurrents sur une carte prix / qualité",
    "Reconnaître la stratégie de chaque concurrent : coûts, différenciation ou position intermédiaire",
    "Repérer l'espace libre du marché",
    "Dire quelle stratégie a réussi dans l'année",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi: "ce chapitre lit le prix moyen de chaque enseigne dans ses ventes, et chez VOLT FITNESS le chiffre d'affaires vient d'abord des abonnés gardés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que chaque enseigne a fait dans l'année",
      notions: ["demand_market_share", "segmentation"],
      texte: (c) => {
        const k = strategiesDesConcurrents(c);
        const [a, b] = k.concurrents;
        return [
          `Sur l'année du cours, ${c.entreprise} a affronté ${a!.nom} et ${b!.nom}. Une stratégie ne s'annonce pas : elle se lit dans ce que chaque enseigne fait, trimestre après trimestre.`,
          "Le tableau donne, pour chacune, ses ventes et son chiffre d'affaires de l'année, la qualité que ses clients lui reconnaissent en fin d'année (1 est la qualité de référence du marché), ce qu'elle a dépensé en moyenne chaque trimestre en qualité et en marketing, sa part du marché et son résultat.",
          ...(k.partie
            ? [`${k.partie.nom} ${quitte(k.partie)} : sa qualité et ses budgets sont ceux des trimestres où elle vendait encore.`]
            : []),
        ];
      },
      tableau: (c) => {
        const k = strategiesDesConcurrents(c);
        return {
          titre: "L'année du cours, enseigne par enseigne",
          colonnes: k.enseignes.map((e) => e.nom),
          lignes: [
            { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.enseignes.map((e) => qte(e.ventes)) },
            { libelle: "Chiffre d'affaires de l'année", valeurs: k.enseignes.map((e) => eur(e.chiffreDAffaires)) },
            { libelle: "Prix moyen", valeurs: k.enseignes.map((e) => eur(e.prix)) },
            { libelle: "Qualité perçue", valeurs: k.enseignes.map((e) => qualiteEcrite(e.qualite)) },
            { libelle: "Budget qualité par trimestre", valeurs: k.enseignes.map((e) => eur(e.budgetQualite)) },
            { libelle: "Budget marketing par trimestre", valeurs: k.enseignes.map((e) => eur(e.budgetMarketing)) },
            { libelle: "Part de marché", valeurs: k.enseignes.map((e) => pct(e.part)) },
            { libelle: "Résultat de l'année", valeurs: k.enseignes.map((e) => eur(e.resultat)) },
            { libelle: "Trimestres de vente", valeurs: k.enseignes.map((e) => String(e.trimestresDeVente)) },
          ],
        };
      },
      repere: () =>
        "Indice de prix = prix de l'enseigne ÷ prix moyen du marché × 100. Indice de qualité = qualité perçue ÷ qualité moyenne × 100. Au-dessus de 100, l'enseigne est plus chère, ou jugée meilleure, que la moyenne.",
    },
    {
      id: "carte",
      type: "montants",
      titre: "Situer l'entreprise sur la carte",
      notions: ["demand_market_share", "price_elasticity"],
      question: (c) => {
        const k = strategiesDesConcurrents(c);
        return `Le prix moyen du marché est ce que les clients des trois enseignes ont payé en moyenne : leur chiffre d'affaires réuni, divisé par leurs ventes réunies. La qualité moyenne est la moyenne des trois qualités perçues. Calculez-les, au centime et au centième, puis les deux indices ${dE(c.entreprise)}, à l'unité (${c.entreprise} vend à ${eur(k.entreprise.prix)}, avec une qualité perçue de ${qualiteEcrite(k.entreprise.qualite)}).`;
      },
      champs: (c) => {
        const k = strategiesDesConcurrents(c);
        const e = k.entreprise;
        const ca = k.enseignes.reduce((a, x) => a + x.chiffreDAffaires, 0);
        const ventes = k.enseignes.reduce((a, x) => a + x.ventes, 0);
        return [
          { libelle: "Prix moyen du marché", attendu: k.prixDuMarche, calcul: `${eur(ca)} ÷ ${qte(ventes)} = ${eur(k.prixDuMarche)}`, tolerance: 0.01 },
          {
            libelle: `Indice de prix ${dE(c.entreprise)}`,
            attendu: e.indicePrix,
            calcul: `${eur(e.prix)} ÷ ${eur(k.prixDuMarche)} × 100 = ${qte(e.indicePrix)}`,
            tolerance: 1,
          },
          {
            libelle: "Qualité moyenne du marché",
            attendu: k.qualiteMoyenneEcrite,
            calcul: `(${k.enseignes.map((x) => qualiteEcrite(x.qualite)).join(" + ")}) ÷ ${k.enseignes.length} = ${qualiteEcrite(k.qualiteMoyenneEcrite)}`,
            tolerance: 0.01,
          },
          {
            libelle: `Indice de qualité ${dE(c.entreprise)}`,
            attendu: e.indiceQualite,
            calcul: `${qualiteEcrite(e.qualite)} ÷ ${qualiteEcrite(k.qualiteMoyenneEcrite)} × 100 = ${qte(e.indiceQualite)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const e = k.entreprise;
        const prix = e.indicePrix > 100 ? "plus chère que la moyenne" : e.indicePrix < 100 ? "moins chère que la moyenne" : "au prix moyen";
        const qualite = e.indiceQualite > 100 ? "jugée meilleure que la moyenne" : e.indiceQualite < 100 ? "jugée moins bonne que la moyenne" : "jugée comme la moyenne";
        return [
          `Sur la carte, ${c.entreprise} se place à ${qte(e.indicePrix)} en prix et ${qte(e.indiceQualite)} en qualité : ${prix}, et ${qualite}. Le point 100, 100 est le centre de la carte : la moyenne du marché.`,
          "Le prix moyen du marché pèse chaque enseigne par ses ventes : celle qui vend le plus le tire vers son prix.",
        ];
      },
    },
    {
      id: "strategies",
      type: "tri",
      titre: "La stratégie de chacun",
      notions: ["segmentation", "demand_market_share"],
      tableau: (c) => {
        const k = strategiesDesConcurrents(c);
        return {
          titre: "La carte prix / qualité du marché (base 100 : la moyenne)",
          colonnes: k.enseignes.map((e) => e.nom),
          lignes: [
            { libelle: "Indice de prix", valeurs: k.enseignes.map((e) => qte(e.indicePrix)) },
            { libelle: "Indice de qualité", valeurs: k.enseignes.map((e) => qte(e.indiceQualite)) },
          ],
        };
      },
      question: () =>
        `Rangez chaque enseigne, montrée à son prix moyen. Elle suit la domination par les coûts si son indice de prix est sous ${100 - ECART_D_UNE_STRATEGIE} et son indice de qualité sous 100 ; la différenciation, si son indice de prix dépasse ${100 + ECART_D_UNE_STRATEGIE} et son indice de qualité 100 ; sinon, elle tient une position intermédiaire.`,
      categories: CATEGORIES_DE_STRATEGIE,
      elements: (c) => {
        const k = strategiesDesConcurrents(c);
        const e = k.entreprise;
        return k.enseignes.map((x) => ({
          libelle: x.nom,
          montant: x.prix,
          categorie: x.strategie,
          pourquoi:
            `Prix ${qte(x.indicePrix)}, qualité ${qte(x.indiceQualite)} : ${NOMS_DES_STRATEGIES_LUES[x.strategie]}. ` +
            (x === e
              ? `Budget qualité de ${eur(x.budgetQualite)} par trimestre, marketing de ${eur(x.budgetMarketing)}.`
              : `Budget qualité de ${eur(x.budgetQualite)} par trimestre, contre ${eur(e.budgetQualite)} chez ${c.entreprise} ; marketing de ${eur(x.budgetMarketing)}, contre ${eur(e.budgetMarketing)}.`),
        }));
      },
      explication: (c) => {
        const k = strategiesDesConcurrents(c);
        const parStrategie = (s: StrategieLue) => k.enseignes.filter((x) => x.strategie === s).map((x) => x.nom);
        const couts = parStrategie("couts");
        const diff = parStrategie("differenciation");
        const budgets = k.enseignes.map((x) => x.budgetQualite);
        // Les budgets confirment la lecture quand la stratégie de coûts dépense le moins en qualité, la différenciation le plus.
        const confirment =
          k.enseignes.every((x) => x.strategie !== "couts" || x.budgetQualite === Math.min(...budgets)) &&
          k.enseignes.every((x) => x.strategie !== "differenciation" || x.budgetQualite === Math.max(...budgets));
        return [
          `${couts.length > 0 ? `${couts.join(" et ")} ${couts.length > 1 ? "suivent" : "suit"} la domination par les coûts` : "Aucune enseigne ne suit la domination par les coûts"} ; ${diff.length > 0 ? `${diff.join(" et ")} ${diff.length > 1 ? "suivent" : "suit"} la différenciation` : "aucune ne suit la différenciation"}.`,
          confirment
            ? "Les budgets confirment la carte : la stratégie de coûts dépense le moins en qualité, la différenciation le plus. On ne différencie pas une offre sans payer sa qualité."
            : "Les budgets ne suivent pas tout à fait la carte : la qualité perçue vient aussi des trimestres passés, avec retard sur la dépense.",
        ];
      },
    },
    {
      id: "espace",
      type: "choix",
      titre: "L'espace libre",
      notions: ["segmentation"],
      question: (c) =>
        `L'espace libre de la carte est la place qu'aucune enseigne n'occupe : celle qu'une enseigne a laissée en quittant le marché, ou, à défaut, le plus grand écart d'indice de prix entre deux enseignes voisines. Pour ${c.entreprise}, où se trouve-t-il ?`,
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const p = k.partie;
        const g = k.plusGrand;
        const ou = p
          ? `la place ${dE(p.nom)}, qui ${quitte(p)}`
          : `entre ${g.bas.nom} (${qte(g.bas.indicePrix)}) et ${g.haut.nom} (${qte(g.haut.indicePrix)}), ${qte(g.points)} points d'écart`;
        const options = k.ecarts.map((x) => ({
          texte: `Entre ${x.bas.nom} et ${x.haut.nom}`,
          juste: !p && x === g,
          retour:
            !p && x === g
              ? `Oui : ${qte(x.points)} points d'indice de prix entre ${x.bas.nom} (${qte(x.bas.indicePrix)}) et ${x.haut.nom} (${qte(x.haut.indicePrix)}), le plus grand écart entre deux enseignes voisines. Une offre placée là aurait le moins de concurrents directs.`
              : p
                ? `Non : ${x.bas.nom} et ${x.haut.nom} vendent toujours, à ${qte(x.points)} points d'écart. L'espace libre est ${ou}.`
                : `Non : ${qte(x.points)} points d'écart seulement. L'espace libre est ${ou}.`,
          }));
        if (p) {
          options.push({
            texte: `La place laissée par ${p.nom}`,
            juste: true,
            retour: `Oui : ${p.nom} ${quitte(p)}. L'enseigne vendait à l'indice ${qte(p.indicePrix)} en prix et ${qte(p.indiceQualite)} en qualité, et prenait ${pct(p.part)} du marché sur l'année : ${NOMS_DES_STRATEGIES_LUES[p.strategie]}, que plus personne ne tient. Sa case de la carte est vide.`,
          });
        }
        options.push({
          texte: "Aucun : chaque place de la carte est tenue",
          juste: false,
          retour: `Non : l'espace libre est ${ou}.`,
        });
        return options;
      },
    },
    {
      id: "reussite",
      type: "choix",
      titre: "Quelle stratégie a réussi ?",
      notions: ["income_statement", "demand_market_share"],
      question: () => "Sur l'année du cours, laquelle des trois enseignes a le meilleur résultat ?",
      options: (c) => {
        const k = strategiesDesConcurrents(c);
        const b = k.meilleure;
        const autres = k.enseignes.filter((x) => x !== b);
        return k.enseignes.map((x) => ({
          texte: `${x.nom}, ${NOMS_DES_STRATEGIES_LUES[x.strategie]}`,
          juste: x === b,
          retour:
            x === b
              ? `Oui : ${eur(b.resultat)} sur l'année, avec ${pct(b.part)} du marché, contre ${autres.map((a) => `${eur(a.resultat)} pour ${a.nom}`).join(" et ")}. ${
                  k.partie && k.partie !== b
                    ? `${k.partie.nom} ${quitte(k.partie)} : une stratégie ne vaut que si le marché paie ce qu'elle coûte.`
                    : "La part de marché ne dit pas tout : c'est le résultat qui dit si la stratégie paie."
                }`
              : `Non : ${x.nom} finit l'année à ${eur(x.resultat)}, contre ${eur(b.resultat)} pour ${b.nom}.`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation"],
      texte: (c) => {
        const k = strategiesDesConcurrents(c);
        const [a, b] = k.concurrents;
        return [
          `Sur le marché ${dE(c.entreprise)}, ${a!.nom} suit ${NOMS_DES_STRATEGIES_LUES[a!.strategie]}, ${b!.nom} ${NOMS_DES_STRATEGIES_LUES[b!.strategie]}, et ${c.entreprise} ${NOMS_DES_STRATEGIES_LUES[k.entreprise.strategie]}. ${k.meilleure.nom} a le meilleur résultat de l'année.`,
          "Lire la stratégie d'un concurrent, c'est le placer sur une carte prix / qualité, puis vérifier dans ses budgets qu'il paie ce qu'il annonce. La carte dit aussi où se trouvent les places libres ; reste à savoir si des clients les attendent, et si une offre y paierait ses coûts.",
        ];
      },
      repere: () =>
        "Indice de prix = prix ÷ prix moyen du marché × 100 ; indice de qualité = qualité perçue ÷ qualité moyenne × 100. Prix bas et qualité basse : les coûts. Prix haut et qualité haute : la différenciation.",
    },
  ],
};
