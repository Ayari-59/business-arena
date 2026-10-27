import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ÉVALUER SON ACTIVITÉ, QUELQUES INDICATEURS POUR PILOTER (seconde, management et
 * gestion, palier 1).
 *
 * Quatre indicateurs, quatre trimestres de l'arène : le chiffre d'affaires, les ventes, le
 * résultat de l'activité et la trésorerie de fin de trimestre. L'élève calcule l'évolution en
 * pourcentage du chiffre d'affaires et des ventes du premier au dernier trimestre, lit ce que
 * les deux pourcentages disent du prix moyen, repère le meilleur trimestre, mesure en euros ce
 * qu'ont fait le résultat et la trésorerie (un résultat peut être négatif : un pourcentage n'y
 * aurait pas de sens), puis dit ce que les indicateurs disent ensemble.
 *
 * Il ne double pas « Le tableau de bord » (palier 4 : taux de marge, seuil, indice de sécurité,
 * voyants) ni « Le tableau de bord du manager » (BTS MCO : les indicateurs du point de vente
 * rangés par axe, la demande servie) : ici, la lecture simple d'un petit nombre d'indicateurs,
 * au niveau de la seconde.
 *
 * Les chiffres sont ceux de l'année du cours (`anneeJouee`), la même que dans les autres
 * chapitres, arrondis à l'euro et à l'unité ; les pourcentages au dixième. La seule hypothèse
 * est le seuil sous lequel un prix moyen se lit comme stable (`PRIX_STABLE`).
 */

/**
 * Le prix moyen d'une vente (chiffre d'affaires ÷ ventes) se lit comme stable quand il bouge de
 * moins de 1 % : l'écart tient alors aux arrondis et au mélange des clientèles, pas à une
 * décision de prix.
 */
export const PRIX_STABLE = 0.01;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const signe = (t: number) => (t > 0 ? `+${pct(t)}` : pct(t));
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;
export const NOMS_DES_TRIMESTRES = ["premier", "deuxième", "troisième", "quatrième"] as const;

export interface IndicateursSimples {
  chiffreDAffaires: number;
  ventes: number;
  resultat: number;
  tresorerie: number;
}

/** Les quatre indicateurs de chaque trimestre de l'année du cours. */
export function indicateursDeLAnnee(code: string): IndicateursSimples[] {
  return anneeJouee(code).partie.rounds.map((tour) => {
    const r = tour.results["joueur"]!;
    return {
      chiffreDAffaires: Math.round(r.incomeStatement.revenue),
      ventes: Math.round(soldUnits(r)),
      resultat: Math.round(r.incomeStatement.operatingIncome),
      tresorerie: Math.round(r.cashFlow.closing),
    };
  });
}

/** L'évolution en pourcentage, au dixième, d'une valeur de départ à une valeur d'arrivée. */
export const evolution = (depart: number, arrivee: number) => auDixieme(((arrivee - depart) / depart) * 100);

export type Prix = "stable" | "baisse" | "hausse";
export type Lecture = "en-hausse" | "chiffre-en-hausse" | "en-baisse" | "resultat-en-hausse";

/**
 * Ce que disent deux indicateurs ensemble, d'une période à l'autre : le chiffre d'affaires et le
 * résultat montent tous deux, baissent tous deux, ou vont en sens contraires.
 */
export const lectureDe = (caMonte: boolean, resultatMonte: boolean): Lecture =>
  caMonte ? (resultatMonte ? "en-hausse" : "chiffre-en-hausse") : resultatMonte ? "resultat-en-hausse" : "en-baisse";

/** Le prix moyen d'une période à l'autre : stable à `PRIX_STABLE` près, sinon en baisse ou en hausse. */
export const prixDe = (avant: number, apres: number): Prix =>
  Math.abs(apres / avant - 1) < PRIX_STABLE ? "stable" : apres < avant ? "baisse" : "hausse";

/** L'année en quatre indicateurs, leurs évolutions, et ce qu'ils disent ensemble. */
export function activiteDeLAnnee(c: Cas) {
  const t = indicateursDeLAnnee(c.code);
  const premier = t[0]!;
  const dernier = t[t.length - 1]!;
  const prixPremier = auCentime(premier.chiffreDAffaires / premier.ventes);
  const prixDernier = auCentime(dernier.chiffreDAffaires / dernier.ventes);
  const resultats = t.map((x) => x.resultat);
  const chiffres = t.map((x) => x.chiffreDAffaires);
  const meilleur = resultats.indexOf(Math.max(...resultats));
  return {
    trimestres: t,
    premier,
    dernier,
    evolutionDuChiffre: evolution(premier.chiffreDAffaires, dernier.chiffreDAffaires),
    evolutionDesVentes: evolution(premier.ventes, dernier.ventes),
    prixPremier,
    prixDernier,
    prix: prixDe(prixPremier, prixDernier),
    /** Le trimestre (0 à 3) au meilleur résultat de l'activité. */
    meilleur,
    /** Le trimestre (0 à 3) au plus gros chiffre d'affaires. */
    plusGrosChiffre: chiffres.indexOf(Math.max(...chiffres)),
    ecartDeResultat: dernier.resultat - premier.resultat,
    ecartDeTresorerie: dernier.tresorerie - premier.tresorerie,
    lecture: lectureDe(dernier.chiffreDAffaires > premier.chiffreDAffaires, dernier.resultat > premier.resultat),
  };
}

export function tableauDesQuatreTrimestres(c: Cas): TableauDeDonnees {
  const t = indicateursDeLAnnee(c.code);
  const ligne = (libelle: string, f: (x: IndicateursSimples) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `L'année ${dE(c.entreprise)}, trimestre par trimestre`,
    colonnes: TRIMESTRES.slice(0, t.length),
    lignes: [
      ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
      ligne(`Ventes (${c.unites})`, (x) => qte(x.ventes)),
      ligne("Résultat de l'activité", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin de trimestre", (x) => eur(x.tresorerie)),
    ],
  };
}

export const EVALUER_SON_ACTIVITE: Chapitre = {
  code: "evaluer-son-activite",
  parcours: "seconde-mg",
  palier: 1,
  blocs: ["2de MG · Évaluer et évoluer, du pilotage aux développements numériques"],
  titre: "Évaluer son activité : quelques indicateurs pour piloter",
  accroche:
    "Le chiffre d'affaires, les ventes, le résultat, la trésorerie : quatre indicateurs suivis trimestre après trimestre, leur évolution en pourcentage, et ce qu'ils disent ensemble de l'activité.",
  objectifs: [
    "Lire quelques indicateurs d'activité dans le temps",
    "Calculer une évolution en pourcentage",
    "Relier l'évolution du chiffre d'affaires à celle des ventes et du prix",
    "Dire, indicateurs à l'appui, si l'activité va mieux ou moins bien",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Quatre indicateurs, quatre trimestres",
      notions: ["dashboard", "revenue"],
      tableau: tableauDesQuatreTrimestres,
      texte: (c) => [
        `L'arène a joué une année ${dE(c.entreprise)}, en quatre trimestres. Pour savoir si l'activité va bien, la dirigeante ne relit pas tous les comptes : elle suit quelques indicateurs, toujours les mêmes, d'un trimestre à l'autre.`,
        `Le chiffre d'affaires dit combien l'entreprise a vendu en euros ; les ventes, combien ${dE(c.unites)} ; le résultat de l'activité, ce qu'elle a gagné ou perdu en travaillant ; la trésorerie, l'argent qu'elle a en banque à la fin du trimestre.`,
      ],
      repere: () => "Évolution en % = (valeur d'arrivée − valeur de départ) ÷ valeur de départ × 100.",
    },
    {
      id: "evolutions",
      type: "montants",
      titre: "L'évolution du chiffre d'affaires et des ventes",
      notions: ["revenue", "dashboard"],
      tableau: tableauDesQuatreTrimestres,
      question: () =>
        "Calculez, en pourcentage et au dixième, l'évolution du chiffre d'affaires du premier au quatrième trimestre, puis celle des ventes. Une baisse donne un pourcentage négatif.",
      champs: (c) => {
        const k = activiteDeLAnnee(c);
        return [
          {
            libelle: "Évolution du chiffre d'affaires, du 1er au 4e trimestre (%)",
            attendu: k.evolutionDuChiffre,
            calcul: `(${eur(k.dernier.chiffreDAffaires)} − ${eur(k.premier.chiffreDAffaires)}) ÷ ${eur(k.premier.chiffreDAffaires)} × 100 = ${pct(k.evolutionDuChiffre)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Évolution des ventes, du 1er au 4e trimestre (%)",
            attendu: k.evolutionDesVentes,
            calcul: `(${qte(k.dernier.ventes)} − ${qte(k.premier.ventes)}) ÷ ${qte(k.premier.ventes)} × 100 = ${pct(k.evolutionDesVentes)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = activiteDeLAnnee(c);
        return [
          `Du premier au quatrième trimestre, le chiffre d'affaires ${dE(c.entreprise)} évolue de ${signe(k.evolutionDuChiffre)}, ses ventes de ${signe(k.evolutionDesVentes)}. Un pourcentage permet de comparer des indicateurs qui ne se comptent pas dans la même unité : des euros d'un côté, des ${c.unites} de l'autre.`,
        ];
      },
    },
    {
      id: "le-prix-moyen",
      // Chez VOLT FITNESS, le chiffre d'affaires compte aussi les abonnés gardés, que les
      // ventes du trimestre ne comptent pas : son rapport aux ventes ne fait pas un prix.
      si: (c) => c.code !== "fitness",
      type: "choix",
      titre: "Ce que disent les deux pourcentages",
      notions: ["revenue"],
      question: (c) => {
        const k = activiteDeLAnnee(c);
        return `Du premier au quatrième trimestre, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)} et les ventes de ${signe(k.evolutionDesVentes)}. Qu'en conclure sur le prix moyen d'une vente ?`;
      },
      options: (c) => {
        const k = activiteDeLAnnee(c);
        const prix =
          k.prixPremier === k.prixDernier
            ? `Le prix moyen (chiffre d'affaires ÷ ventes) reste à ${eur(k.prixPremier)}.`
            : `Le prix moyen (chiffre d'affaires ÷ ventes) passe de ${eur(k.prixPremier)} à ${eur(k.prixDernier)}.`;
        return [
          {
            texte: "Il n'a presque pas bougé : les deux évoluent ensemble",
            juste: k.prix === "stable",
            retour: k.prix === "stable" ? `Oui. ${prix} Quand le prix ne bouge pas, le chiffre d'affaires suit les ventes.` : `Non. ${prix}`,
          },
          {
            texte: "Il a baissé : le chiffre d'affaires évolue moins bien que les ventes",
            juste: k.prix === "baisse",
            retour:
              k.prix === "baisse"
                ? `Oui. ${prix} L'entreprise vend davantage d'unités, mais chacune rapporte moins en moyenne : une baisse de prix, ou plus de ventes parmi les produits les moins chers.`
                : `Non. ${prix}`,
          },
          {
            texte: "Il a monté : le chiffre d'affaires évolue mieux que les ventes",
            juste: k.prix === "hausse",
            retour:
              k.prix === "hausse"
                ? `Oui. ${prix} Chaque vente rapporte plus en moyenne : une hausse de prix, ou plus de ventes parmi les produits les plus chers.`
                : `Non. ${prix}`,
          },
        ];
      },
    },
    {
      id: "le-meilleur-trimestre",
      type: "choix",
      titre: "Le meilleur trimestre",
      notions: ["income_statement", "seasonality"],
      tableau: tableauDesQuatreTrimestres,
      question: (c) => `Quel trimestre a donné à ${c.entreprise} le meilleur résultat de l'activité ?`,
      options: (c) => {
        const k = activiteDeLAnnee(c);
        return k.trimestres.map((x, i) => ({
          texte: `Le ${NOMS_DES_TRIMESTRES[i]} trimestre`,
          juste: i === k.meilleur,
          retour:
            i === k.meilleur
              ? `Oui : ${eur(x.resultat)} de résultat de l'activité, le meilleur de l'année. ${
                  k.plusGrosChiffre === k.meilleur
                    ? "C'est aussi le trimestre du plus gros chiffre d'affaires."
                    : `Ce n'est pourtant pas celui du plus gros chiffre d'affaires, le ${NOMS_DES_TRIMESTRES[k.plusGrosChiffre]} : vendre le plus ne veut pas dire gagner le plus.`
                }`
              : `Non : ${eur(x.resultat)} de résultat de l'activité, contre ${eur(k.trimestres[k.meilleur]!.resultat)} au ${NOMS_DES_TRIMESTRES[k.meilleur]} trimestre.`,
        }));
      },
    },
    {
      id: "resultat-et-tresorerie",
      type: "montants",
      titre: "Le résultat et la trésorerie",
      notions: ["income_statement", "net_treasury"],
      tableau: tableauDesQuatreTrimestres,
      question: () =>
        "Un résultat peut être négatif : partir d'une perte rendrait un pourcentage trompeur. Mesurez donc en euros, du premier au quatrième trimestre, l'écart de résultat de l'activité, puis l'écart de trésorerie (une baisse donne un écart négatif).",
      champs: (c) => {
        const k = activiteDeLAnnee(c);
        return [
          {
            libelle: "Écart de résultat de l'activité, du 1er au 4e trimestre",
            attendu: k.ecartDeResultat,
            calcul: `${eur(k.dernier.resultat)} − ${retranche(k.premier.resultat)} = ${eur(k.ecartDeResultat)}`,
            tolerance: 1,
          },
          {
            libelle: "Écart de trésorerie, du 1er au 4e trimestre",
            attendu: k.ecartDeTresorerie,
            calcul: `${eur(k.dernier.tresorerie)} − ${retranche(k.premier.tresorerie)} = ${eur(k.ecartDeTresorerie)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = activiteDeLAnnee(c);
        return [
          `Le résultat de l'activité ${k.ecartDeResultat > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeResultat))}, la trésorerie ${k.ecartDeTresorerie > 0 ? "monte" : "baisse"} de ${eur(Math.abs(k.ecartDeTresorerie))}. ${
            (k.ecartDeResultat > 0) === (k.ecartDeTresorerie > 0)
              ? "Ici, les deux vont dans le même sens."
              : k.ecartDeTresorerie > 0
                ? "Ici, ils vont en sens contraires : la trésorerie, c'est l'argent accumulé en banque ; elle monte tant qu'il entre plus d'argent qu'il n'en sort, même quand le résultat d'un trimestre baisse."
                : "Ici, ils vont en sens contraires : la trésorerie, c'est l'argent accumulé en banque ; elle peut baisser quand le résultat monte, si l'argent sort plus vite qu'il ne rentre (un emprunt à rembourser, des clients qui paient tard, du stock à payer)."
          }`,
        ];
      },
    },
    {
      id: "va-t-elle-bien",
      type: "choix",
      titre: "L'activité va-t-elle mieux ?",
      notions: ["dashboard", "revenue", "income_statement"],
      tableau: tableauDesQuatreTrimestres,
      question: (c) => {
        const k = activiteDeLAnnee(c);
        return `Du premier au quatrième trimestre, chiffre d'affaires ${signe(k.evolutionDuChiffre)}, résultat de l'activité de ${eur(k.premier.resultat)} à ${eur(k.dernier.resultat)}. L'activité ${dE(c.entreprise)} va-t-elle mieux à la fin de l'année qu'au début ?`;
      },
      options: (c) => {
        const k = activiteDeLAnnee(c);
        const chiffres = `Chiffre d'affaires ${signe(k.evolutionDuChiffre)}, résultat ${k.ecartDeResultat > 0 ? "en hausse" : "en baisse"} de ${eur(Math.abs(k.ecartDeResultat))}, trésorerie ${k.ecartDeTresorerie > 0 ? "en hausse" : "en baisse"} de ${eur(Math.abs(k.ecartDeTresorerie))}.`;
        const lecture = (l: Lecture, oui: string) => ({ juste: k.lecture === l, retour: k.lecture === l ? `Oui. ${chiffres} ${oui}` : `Non. ${chiffres}` });
        return [
          {
            texte: "Oui : chiffre d'affaires et résultat en hausse",
            ...lecture("en-hausse", "L'entreprise vend davantage, avec un meilleur résultat : les deux indicateurs les plus importants vont dans le bon sens."),
          },
          {
            texte: "En partie : chiffre d'affaires en hausse, mais résultat en baisse",
            ...lecture("chiffre-en-hausse", "Vendre plus ne suffit pas : les charges ont augmenté plus que le chiffre d'affaires. C'est là qu'il faut regarder."),
          },
          {
            texte: "Non : chiffre d'affaires et résultat en baisse",
            ...lecture("en-baisse", "L'entreprise vend moins qu'au premier trimestre, avec un moins bon résultat. Avant de s'inquiéter, on regarde les autres trimestres : un trimestre creux n'est pas une année."),
          },
          {
            texte: "En partie : chiffre d'affaires en baisse, mais résultat en hausse",
            ...lecture("resultat-en-hausse", "L'entreprise vend moins, mais ses charges ont baissé plus que son chiffre d'affaires : son résultat est meilleur."),
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard", "seasonality"],
      texte: (c) => {
        const k = activiteDeLAnnee(c);
        return [
          `Chez ${c.entreprise}, du premier au quatrième trimestre, le chiffre d'affaires évolue de ${signe(k.evolutionDuChiffre)} et le résultat de l'activité passe de ${eur(k.premier.resultat)} à ${eur(k.dernier.resultat)}. Le meilleur trimestre de l'année est le ${NOMS_DES_TRIMESTRES[k.meilleur]}.`,
          "Un indicateur seul dit peu ; quelques indicateurs lus ensemble disent beaucoup : vend-on plus, à quel prix, gagne-t-on davantage, l'argent suit-il ? Et comparer deux trimestres ne suffit pas toujours : un trimestre peut être creux par saison. On suit donc les mêmes indicateurs, trimestre après trimestre.",
        ];
      },
      repere: () => "Piloter, c'est suivre peu d'indicateurs, toujours les mêmes, et lire leur évolution ensemble.",
    },
  ],
};
