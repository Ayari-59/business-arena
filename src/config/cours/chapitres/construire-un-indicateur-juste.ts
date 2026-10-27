import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import type { Chapitre, TableauDeDonnees } from "../types";
import { MARCHES } from "./marche-et-part-de-marche";

/**
 * CHAPITRE : CONSTRUIRE UN INDICATEUR JUSTE (Bac STMG, systèmes d'information de gestion,
 * palier 1).
 *
 * Un indicateur se définit avant de se calculer : sa formule, son unité, sa période, sa source.
 * L'exemple est le prix moyen du marché sur l'année du cours (`anneeJouee` : l'entreprise et ses
 * deux concurrents), et le piège classique de la moyenne de ratios face au ratio des sommes : la
 * moyenne simple des prix des enseignes donne à chacune le même poids, qu'elle vende peu ou
 * beaucoup ; le prix moyen pondéré par les ventes (chiffre d'affaires total ÷ ventes totales) dit
 * ce que les clients du marché ont payé en moyenne. L'élève calcule les deux, dit lequel répond à
 * la question, puis l'indice de prix de l'entreprise avec chacun, et ce que l'indicateur faux
 * ferait décider.
 *
 * L'ARÈNE EN DONNE UN EXEMPLE. Le benchmark concurrentiel de l'arène affiche une « Moyenne du
 * marché » qui est la moyenne simple des prix moyens des entreprises (services/game-view.service.ts,
 * `buildBenchmark`), et calcule l'indice de compétitivité-prix sur elle. Le chapitre le cite, sans
 * rien y changer.
 *
 * Le prix de chaque enseigne est son chiffre d'affaires de l'année divisé par ses ventes, comme
 * dans « Lire la stratégie de ses concurrents » ; une enseigne qui cesse de vendre garde le prix
 * de ses trimestres de vente. Aucune autre hypothèse que la règle de lecture `ECART_ALIGNE`.
 *
 * VOLT FITNESS N'EN EST PAS : son chiffre d'affaires compte les cotisations des abonnés gardés, et
 * ses ventes ne comptent que les nouveaux ; leur rapport ne fait pas un prix.
 */

/**
 * LA RÈGLE DE LECTURE DU COURS : un indice de prix à moins de 5 points de 100 se lit comme
 * aligné sur le marché ; en dessous de 95, l'entreprise vend moins cher que le marché ; au-dessus
 * de 105, plus cher. C'est, à 5 % près, la lecture du benchmark de l'arène
 * (components/competitive-benchmark.tsx : un indice de compétitivité entre 0,95 et 1,05 y dit
 * « aligné sur le marché »).
 */
export const ECART_ALIGNE = 5;

export type Position = "dessous" | "aligne" | "dessus";
export type ErreurDeDecision = "monter" | "baisser" | "rester" | "aucune";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article (« du Comptoir »). */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

/** « à » devant un nom, contracté devant l'article (« au Comptoir »). */
const aE = (nom: string) => (/^Le /.test(nom) ? `au ${nom.slice(3)}` : /^Les /.test(nom) ? `aux ${nom.slice(4)}` : `à ${nom}`);

const NOMS_DES_POSITIONS: Record<Position, string> = {
  dessous: "moins chère que le marché",
  aligne: "au prix du marché",
  dessus: "plus chère que le marché",
};

/** La place d'un indice de prix, selon la règle du cours. */
export const positionDe = (indice: number): Position =>
  indice < 100 - ECART_ALIGNE ? "dessous" : indice > 100 + ECART_ALIGNE ? "dessus" : "aligne";

/** Les enseignes du marché sur l'année, et les deux façons de calculer le prix moyen du marché. */
export function indicateurDuPrix(c: Cas) {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const ids = ["joueur", ...def.bots.slice(0, 2).map((b) => b.id)];
  const enseignes = ids.map((id) => {
    const resultats = partie.rounds.map((t) => t.results[id]!);
    const ventes = Math.round(resultats.reduce((t, r) => t + Object.values(r.market.bySegment).reduce((s, v) => s + v.sold, 0), 0));
    const chiffreDAffaires = Math.round(resultats.reduce((t, r) => t + r.incomeStatement.revenue, 0));
    return {
      id,
      nom: id === "joueur" ? c.entreprise : def.bots.find((b) => b.id === id)!.name,
      ventes,
      chiffreDAffaires,
      /** Le prix moyen de l'enseigne, au centime, tel que le tableau le montre. */
      prix: auCentime(chiffreDAffaires / ventes),
    };
  });
  const entreprise = enseignes[0]!;
  const sommeDesPrix = auCentime(enseignes.reduce((t, e) => t + e.prix, 0));
  const ventesTotales = enseignes.reduce((t, e) => t + e.ventes, 0);
  const chiffreTotal = enseignes.reduce((t, e) => t + e.chiffreDAffaires, 0);
  // La moyenne simple : chaque enseigne compte pour une, quelles que soient ses ventes.
  const moyenneSimple = auCentime(sommeDesPrix / enseignes.length);
  // Le prix moyen pondéré : chaque vente compte pour une.
  const prixPondere = auCentime(chiffreTotal / ventesTotales);
  const indiceSimple = Math.round((entreprise.prix / moyenneSimple) * 100);
  const indicePondere = Math.round((entreprise.prix / prixPondere) * 100);
  const positionSimple = positionDe(indiceSimple);
  const positionPonderee = positionDe(indicePondere);
  const erreur: ErreurDeDecision =
    positionSimple === positionPonderee ? "aucune" : positionSimple === "dessous" ? "monter" : positionSimple === "dessus" ? "baisser" : "rester";
  const plusVendue = [...enseignes].sort((a, b) => b.ventes - a.ventes)[0]!;
  const moinsChere = [...enseignes].sort((a, b) => a.prix - b.prix)[0]!;
  return {
    enseignes,
    entreprise,
    sommeDesPrix,
    ventesTotales,
    chiffreTotal,
    moyenneSimple,
    prixPondere,
    ecart: auCentime(moyenneSimple - prixPondere),
    indiceSimple,
    indicePondere,
    positionSimple,
    positionPonderee,
    erreur,
    plusVendue,
    moinsChere,
  };
}

export function tableDesEnseignes(c: Cas): TableauDeDonnees {
  const k = indicateurDuPrix(c);
  return {
    titre: "L'année du cours, enseigne par enseigne",
    colonnes: k.enseignes.map((e) => e.nom),
    lignes: [
      { libelle: `Ventes de l'année (${c.unites})`, valeurs: k.enseignes.map((e) => qte(e.ventes)) },
      { libelle: "Chiffre d'affaires de l'année", valeurs: k.enseignes.map((e) => eur(e.chiffreDAffaires)) },
      { libelle: "Prix moyen (chiffre d'affaires ÷ ventes)", valeurs: k.enseignes.map((e) => eur(e.prix)) },
    ],
  };
}

/** Ce que la moyenne simple fait croire, par rapport au prix moyen pondéré. */
function ceQueCroitLEntreprise(c: Cas) {
  const k = indicateurDuPrix(c);
  if (k.positionSimple === k.positionPonderee) {
    return `Avec la moyenne simple comme avec le prix pondéré, ${c.entreprise} est ${NOMS_DES_POSITIONS[k.positionPonderee]} (indices ${qte(k.indiceSimple)} et ${qte(k.indicePondere)}).`;
  }
  return `Avec la moyenne simple, ${c.entreprise} se croit ${NOMS_DES_POSITIONS[k.positionSimple]} (indice ${qte(k.indiceSimple)}) ; avec le prix pondéré, elle est ${NOMS_DES_POSITIONS[k.positionPonderee]} (indice ${qte(k.indicePondere)}).`;
}

export const CONSTRUIRE_UN_INDICATEUR_JUSTE: Chapitre = {
  code: "construire-un-indicateur-juste",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 3 · Information, action et décision"],
  titre: "Construire un indicateur juste",
  accroche:
    "Un indicateur a une formule, une unité, une période et une source. Le prix moyen du marché, calculé de deux façons sur les chiffres de l'année : la moyenne des prix des enseignes, ou le chiffre d'affaires total divisé par les ventes totales. L'une des deux trompe, et fait prendre une mauvaise décision.",
  objectifs: [
    "Définir un indicateur : sa formule, son unité, sa période, sa source",
    "Calculer une moyenne simple et une moyenne pondérée",
    "Dire pourquoi la moyenne de ratios n'est pas le ratio des sommes",
    "Mesurer ce qu'un indicateur faux ferait décider",
  ],
  libre: false,
  entreprises: {
    codes: MARCHES,
    pourquoi:
      "ce chapitre calcule le prix de chaque enseigne en divisant son chiffre d'affaires par ses ventes, et chez VOLT FITNESS le chiffre d'affaires compte aussi les abonnés gardés, que les ventes ne comptent pas.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un indicateur à construire",
      notions: ["dashboard", "revenue"],
      tableau: tableDesEnseignes,
      texte: (c) => {
        const k = indicateurDuPrix(c);
        const [a, b] = k.enseignes.slice(1);
        return [
          `La direction ${dE(c.entreprise)} veut savoir si elle vend plus cher ou moins cher que le marché, face à ses concurrents, ${a!.nom} et ${b!.nom}. Il lui faut un indicateur : le prix moyen du marché, auquel comparer son propre prix.`,
          "Un indicateur est un chiffre calculé toujours de la même façon, pour être suivi et comparé. Avant tout calcul, on le définit : sa formule (ce qu'on divise par quoi), son unité (en quoi il se compte), sa période (sur quel temps) et sa source (d'où viennent les données). Une définition floue donne un chiffre que chacun calcule à sa façon.",
        ];
      },
      repere: () => "Un indicateur = une formule, une unité, une période, une source. Sans elles, deux personnes calculent deux chiffres différents sous le même nom.",
    },
    {
      id: "la-fiche",
      type: "choix",
      titre: "La fiche de l'indicateur",
      notions: ["dashboard"],
      question: () => "Quelle fiche définit complètement le prix moyen du marché ?",
      // La bonne réponse est la même dans toutes les entreprises : la question porte sur la définition.
      options: (c) => [
        {
          texte: `Le chiffre d'affaires des enseignes divisé par leurs ventes, en euros par ${c.unite}, sur l'année, d'après la table des ventes`,
          juste: true,
          retour: "Oui : la formule, l'unité, la période et la source y sont. Deux personnes qui suivent cette fiche trouvent le même chiffre.",
        },
        {
          texte: "Le prix auquel les enseignes du marché vendent en général, tel que chacun le voit dans leurs vitrines, leurs catalogues et leurs publicités",
          juste: false,
          retour: "Non : pas de formule (quelles enseignes, quel calcul ?), pas d'unité, pas de période. Chacun en tirerait un chiffre différent.",
        },
        {
          texte: "Le chiffre d'affaires de toutes les enseignes réunies sur l'année, en euros, d'après les comptes de chaque enseigne",
          juste: false,
          retour: "Non : la période et la source y sont, mais la formule mesure la taille du marché en euros, pas un prix. Un prix se compte en euros par unité vendue.",
        },
      ],
    },
    {
      id: "deux-calculs",
      type: "montants",
      titre: "Deux calculs du prix moyen",
      notions: ["revenue", "demand_market_share"],
      tableau: tableDesEnseignes,
      question: () =>
        "Calculez le prix moyen du marché de deux façons, au centime : la moyenne simple des prix des enseignes (leur somme divisée par le nombre d'enseignes), puis le prix moyen pondéré par les ventes (le chiffre d'affaires total divisé par les ventes totales).",
      champs: (c) => {
        const k = indicateurDuPrix(c);
        return [
          {
            libelle: "Moyenne simple des prix",
            attendu: k.moyenneSimple,
            calcul: `(${k.enseignes.map((e) => eur(e.prix)).join(" + ")}) ÷ ${qte(k.enseignes.length)} = ${eur(k.sommeDesPrix)} ÷ ${qte(k.enseignes.length)} = ${eur(k.moyenneSimple)}`,
            tolerance: 0.01,
          },
          {
            libelle: "Prix moyen pondéré par les ventes",
            attendu: k.prixPondere,
            calcul: `${eur(k.chiffreTotal)} ÷ ${qte(k.ventesTotales)} = ${eur(k.prixPondere)}`,
            tolerance: 0.01,
          },
        ];
      },
      explication: (c) => {
        const k = indicateurDuPrix(c);
        const sens = k.ecart > 0 ? "plus haute" : k.ecart < 0 ? "plus basse" : "égale";
        const pourquoi =
          k.ecart === 0
            ? "Les deux calculs tombent ici sur le même chiffre : c'est un hasard des ventes, pas une règle."
            : k.plusVendue === k.moinsChere && k.ecart > 0
              ? `${k.plusVendue.nom}, l'enseigne la moins chère, est aussi celle qui vend le plus (${qte(k.plusVendue.ventes)} ${c.unites}) : le prix pondéré penche vers son prix ; la moyenne simple ne lui donne pas plus de poids qu'aux autres.`
              : `${k.plusVendue.nom} vend le plus (${qte(k.plusVendue.ventes)} ${c.unites}) : le prix pondéré penche vers son prix ; la moyenne simple ne lui donne pas plus de poids qu'aux autres.`;
        return [`La moyenne simple est ${sens} que le prix pondéré, de ${eur(Math.abs(k.ecart))}. ${pourquoi}`];
      },
    },
    {
      id: "lequel-est-juste",
      type: "choix",
      titre: "Lequel est juste ?",
      notions: ["revenue"],
      question: (c) => {
        const k = indicateurDuPrix(c);
        return `La direction veut connaître le prix moyen payé par les clients du marché, en euros par ${c.unite}. Lequel des deux chiffres lui répond : ${eur(k.moyenneSimple)} ou ${eur(k.prixPondere)} ?`;
      },
      // La bonne réponse est la même dans toutes les entreprises : le ratio des sommes.
      options: (c) => {
        const k = indicateurDuPrix(c);
        const p = k.plusVendue;
        return [
          {
            texte: "Le prix pondéré : chaque vente du marché y compte une fois",
            juste: true,
            retour: `Oui : ${eur(k.chiffreTotal)} payés pour ${qte(k.ventesTotales)} ${c.unites}, soit ${eur(k.prixPondere)} en moyenne. Une moyenne de prix doit peser chaque prix par les ventes qu'il a faites : c'est le ratio des sommes, pas la moyenne des ratios.`,
          },
          {
            texte: "La moyenne simple : chaque enseigne du marché y compte une fois",
            juste: false,
            retour: `Non : elle donne autant de poids à une enseigne qui vend peu qu'${aE(p.nom)}, qui vend ${qte(p.ventes)} ${c.unites}. Elle dit le prix d'une enseigne prise au hasard, pas ce qu'un client paie en moyenne.`,
          },
          {
            texte: "Les deux se valent : ce sont deux moyennes des mêmes prix",
            juste: false,
            retour: `Non : ${eur(k.moyenneSimple)} et ${eur(k.prixPondere)}, ${eur(Math.abs(k.ecart))} d'écart. Les deux ne répondent pas à la même question, et une seule répond à celle de la direction.`,
          },
        ];
      },
    },
    {
      id: "deux-indices",
      type: "montants",
      titre: "L'indice de prix, de deux façons",
      notions: ["price_elasticity", "dashboard"],
      question: (c) => {
        const k = indicateurDuPrix(c);
        return `L'indice de prix compare le prix de l'entreprise à celui du marché : prix de l'entreprise ÷ prix du marché × 100. Calculez-le à l'unité pour ${c.entreprise} (prix moyen : ${eur(k.entreprise.prix)}), avec la moyenne simple, puis avec le prix pondéré.`;
      },
      champs: (c) => {
        const k = indicateurDuPrix(c);
        return [
          {
            libelle: "Indice de prix, avec la moyenne simple",
            attendu: k.indiceSimple,
            calcul: `${eur(k.entreprise.prix)} ÷ ${eur(k.moyenneSimple)} × 100 = ${qte(k.indiceSimple)}`,
            tolerance: 1,
          },
          {
            libelle: "Indice de prix, avec le prix pondéré",
            attendu: k.indicePondere,
            calcul: `${eur(k.entreprise.prix)} ÷ ${eur(k.prixPondere)} × 100 = ${qte(k.indicePondere)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => [
        `${ceQueCroitLEntreprise(c)} Selon la règle du cours, un indice entre ${100 - ECART_ALIGNE} et ${100 + ECART_ALIGNE} est au prix du marché.`,
      ],
    },
    {
      id: "ce-que-l-erreur-ferait-decider",
      type: "choix",
      titre: "Ce que l'erreur ferait décider",
      notions: ["price_elasticity", "demand_market_share"],
      question: (c) => `${ceQueCroitLEntreprise(c)} Si la direction se fiait à la moyenne simple, que déciderait-elle ?`,
      options: (c) => {
        const k = indicateurDuPrix(c);
        const vrai = `Le prix que paient les clients du marché est ${eur(k.prixPondere)} ; ${c.entreprise} vend à ${eur(k.entreprise.prix)}, indice ${qte(k.indicePondere)}.`;
        const non = `Non. ${vrai}`;
        return [
          {
            texte: "Monter son prix à tort : elle se croirait moins chère que le marché",
            juste: k.erreur === "monter",
            retour:
              k.erreur === "monter"
                ? `Oui. ${vrai} Elle ne vend pas sous le marché : en montant son prix, elle passerait au-dessus de ce que paient les clients, et risquerait de perdre des ventes qu'elle croyait garder.`
                : non,
          },
          {
            texte: "Baisser son prix à tort : elle se croirait plus chère que le marché",
            juste: k.erreur === "baisser",
            retour:
              k.erreur === "baisser"
                ? `Oui. ${vrai} Elle n'est pas au-dessus du marché : en baissant son prix, elle perdrait de la marge sur chaque vente sans raison.`
                : non,
          },
          {
            texte: "Garder son prix à tort : elle se croirait au prix du marché",
            juste: k.erreur === "rester",
            retour:
              k.erreur === "rester"
                ? `Oui. ${vrai} Elle n'est pas au prix du marché : l'indicateur faux lui cacherait un écart qu'il faudrait corriger.`
                : non,
          },
          {
            texte: "La même chose : les deux indices la placent dans la même zone",
            juste: k.erreur === "aucune",
            retour:
              k.erreur === "aucune"
                ? `Oui. ${vrai} Ici, l'erreur ne change pas la décision : les deux indices tombent dans la même zone. Mais l'indicateur reste faux, et il tromperait le jour où les ventes se répartiraient autrement.`
                : non,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = indicateurDuPrix(c);
        return [
          `Chez ${c.entreprise}, le prix moyen du marché vaut ${eur(k.prixPondere)} pondéré par les ventes, et ${eur(k.moyenneSimple)} en moyenne simple des prix. ${ceQueCroitLEntreprise(c)}`,
          "La moyenne de ratios n'est pas le ratio des sommes. Un prix moyen, un taux moyen, une part moyenne se calculent en divisant un total par un total : chaque élément pèse alors ce qu'il représente. La moyenne simple des ratios donne le même poids au petit et au gros, et ne répond qu'à une autre question.",
          "Le benchmark concurrentiel de l'arène affiche une « Moyenne du marché » : c'est la moyenne simple des prix moyens des entreprises, et son indice de compétitivité-prix se calcule sur elle. Elle dit le prix d'une enseigne typique, pas ce que paie un client moyen. Avant de lire un indicateur, on lit sa fiche.",
        ];
      },
      repere: () => "Prix moyen du marché = chiffre d'affaires total ÷ ventes totales. Une moyenne de ratios se pondère : on divise la somme des numérateurs par la somme des dénominateurs.",
    },
  ],
};
