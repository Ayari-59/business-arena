import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { premierDesaccord, premierSousLeSeuil, tableauDeBord, type IndicateursDuTrimestre } from "../tableau-de-bord";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TABLEAU DE BORD (contrôle de gestion, palier 4).
 *
 * L'année de l'arène en quatre trimestres et six indicateurs (`tableau-de-bord.ts`). L'élève
 * calcule ceux du dernier trimestre (taux de marge, seuil, indice de sécurité), puis lit le
 * tableau de l'année : le premier trimestre sous le seuil, un résultat et une trésorerie qui
 * vont en sens contraires, une part de marché qui dit ce que le résultat tait. Il finit par
 * ce qui n'a rien à faire au tableau de bord : un tableau de bord choisit.
 */

const pct = (x: number) => `${x.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;
const NOMS = ["premier", "deuxième", "troisième", "quatrième"] as const;

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const t = tableauDeBord(c.code);
  const ligne = (libelle: string, f: (x: IndicateursDuTrimestre) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `Le tableau de bord de ${c.entreprise}, trimestre par trimestre`,
    colonnes: TRIMESTRES.slice(0, t.length),
    lignes: [
      ligne("Chiffre d'affaires", (x) => eur(x.chiffreDAffaires)),
      ligne("Taux de marge sur coût variable", (x) => pct(x.tauxDeMarge)),
      ligne("Indice de sécurité", (x) => pct(x.indiceDeSecurite)),
      ligne("Résultat d'exploitation", (x) => eur(x.resultat)),
      ligne("Trésorerie de fin", (x) => eur(x.tresorerie)),
      ligne("Part de marché", (x) => pct(x.partDeMarche)),
    ],
  };
}

const dernier = (c: Cas) => {
  const t = tableauDeBord(c.code);
  return t[t.length - 1]!;
};

export const TABLEAU_DE_BORD: Chapitre = {
  code: "tableau-de-bord",
  parcours: "controle-de-gestion",
  palier: 4,
  titre: "Le tableau de bord",
  accroche:
    "Une année de l'arène en six indicateurs : les calculer, les lire, repérer le voyant qui s'allume, et choisir ce qui mérite d'y figurer.",
  objectifs: [
    "Calculer les indicateurs d'un trimestre : taux de marge, seuil de rentabilité, indice de sécurité",
    "Lire un tableau de bord dans le temps et repérer le voyant qui s'allume",
    "Comprendre pourquoi le résultat, la trésorerie et la part de marché se suivent ensemble",
    "Choisir des indicateurs utiles au pilotage",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Peu d'indicateurs, suivis dans le temps",
      notions: ["breakeven", "safety_margin"],
      texte: (c) => [
        `L'arène a joué une année de ${c.entreprise}, quatre trimestres. Le dirigeant ne lira pas quatre comptes de résultat, quatre bilans et quatre tableaux de trésorerie : il lui faut une page, qu'il lit en deux minutes.`,
        "Un tableau de bord retient peu d'indicateurs, ceux qui disent si l'entreprise va bien et où agir : l'activité, la rentabilité, l'argent, la position face aux concurrents. Il les suit dans le temps : c'est l'évolution qui alerte, plus que le chiffre d'un trimestre.",
      ],
      repere: () =>
        "Taux de marge = marge sur coût variable ÷ chiffre d'affaires. Seuil de rentabilité = charges fixes ÷ taux de marge. Indice de sécurité = (chiffre d'affaires − seuil) ÷ chiffre d'affaires.",
    },
    {
      id: "dernier-trimestre",
      type: "montants",
      titre: "Les indicateurs du quatrième trimestre",
      notions: ["margin_rates", "breakeven", "safety_margin"],
      question: (c) => {
        const d = dernier(c);
        return `Au quatrième trimestre, ${c.entreprise} réalise ${eur(d.chiffreDAffaires)} de chiffre d'affaires, ${eur(d.marge)} de marge sur coût variable, pour ${eur(d.chargesFixes)} de charges fixes. Calculez le taux de marge (en %, au dixième), le seuil de rentabilité du trimestre, puis l'indice de sécurité (en %, au dixième, négatif sous le seuil).`;
      },
      champs: (c) => {
        const d = dernier(c);
        return [
          {
            libelle: "Taux de marge sur coût variable (%)",
            attendu: d.tauxDeMarge,
            calcul: `${eur(d.marge)} ÷ ${eur(d.chiffreDAffaires)} = ${pct(d.tauxDeMarge)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Seuil de rentabilité du trimestre",
            attendu: d.seuil,
            calcul: `${eur(d.chargesFixes)} ÷ ${pct(d.tauxDeMarge)} ≈ ${eur(d.seuil)}`,
            // Le taux arrondi au dixième que l'élève emploie déplace le seuil d'environ un millième.
            tolerance: Math.max(2, Math.round(d.seuil * 0.003)),
          },
          {
            libelle: "Indice de sécurité (%)",
            attendu: d.indiceDeSecurite,
            calcul: `(${eur(d.chiffreDAffaires)} − ${eur(d.seuil)}) ÷ ${eur(d.chiffreDAffaires)} = ${pct(d.indiceDeSecurite)}`,
            tolerance: 0.2,
          },
        ];
      },
      explication: (c) => {
        const d = dernier(c);
        return [
          d.indiceDeSecurite >= 0
            ? `Le quatrième trimestre est au-dessus du seuil : le chiffre d'affaires pourrait baisser de ${pct(d.indiceDeSecurite)} avant que l'entreprise ne perde de l'argent.`
            : `Le quatrième trimestre est sous le seuil : il aurait fallu ${pct(-d.indiceDeSecurite)} de chiffre d'affaires en plus pour ne pas perdre d'argent.`,
        ];
      },
    },
    {
      id: "sous-le-seuil",
      type: "choix",
      titre: "Le premier voyant",
      notions: ["breakeven", "safety_margin"],
      tableau: tableauDeLAnnee,
      question: (c) =>
        `Voici le tableau de bord de l'année. Un voyant s'allume quand l'indice de sécurité devient négatif : l'entreprise vend moins que son seuil. Quel est le premier trimestre où ${c.entreprise} passe sous le seuil ?`,
      options: (c) => {
        const premier = premierSousLeSeuil(c.code);
        const t = tableauDeBord(c.code);
        return [
          ...t.map((x, i) => ({
            texte: `Le ${NOMS[i]} trimestre`,
            juste: premier === i + 1,
            retour:
              premier === i + 1
                ? `Oui : son indice de sécurité est de ${pct(x.indiceDeSecurite)}. Le chiffre d'affaires n'y couvre plus les charges fixes.`
                : x.indiceDeSecurite < 0
                  ? `Il est sous le seuil (${pct(x.indiceDeSecurite)}), mais ce n'est pas le premier.`
                  : `Son indice de sécurité est de ${pct(x.indiceDeSecurite)} : il est au-dessus du seuil.`,
          })),
          {
            texte: "Aucun : l'entreprise reste au-dessus du seuil toute l'année",
            juste: premier === null,
            retour:
              premier === null
                ? "Oui : l'indice de sécurité reste positif chaque trimestre. Le voyant ne s'allume pas, mais sa valeur dit de combien l'entreprise est à l'abri."
                : `Non : au ${NOMS[premier - 1]} trimestre, l'indice de sécurité est négatif.`,
          },
        ];
      },
    },
    {
      id: "resultat-et-tresorerie",
      type: "choix",
      titre: "Le résultat et la trésorerie",
      notions: ["cash_budget", "bfr"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const d = premierDesaccord(c.code);
        const t = tableauDeBord(c.code);
        if (!d) return "Le résultat et la trésorerie vont ici toujours dans le même sens. Pourquoi un tableau de bord suit-il pourtant les deux ?";
        const avant = t[d.de - 1]!;
        const apres = t[d.a - 1]!;
        return `Du ${NOMS[d.de - 1]} au ${NOMS[d.a - 1]} trimestre, le résultat d'exploitation passe de ${eur(avant.resultat)} à ${eur(apres.resultat)}, la trésorerie de ${eur(avant.tresorerie)} à ${eur(apres.tresorerie)} : l'un monte quand l'autre baisse. Comment est-ce possible ?`;
      },
      options: () => [
        {
          texte: "Le résultat compte les ventes et les charges quand elles naissent, la trésorerie quand elles se paient : stock, délais des clients et du fournisseur, emprunt et impôt les séparent.",
          juste: true,
          retour:
            "C'est cela. C'est pourquoi un tableau de bord suit les deux : un trimestre bénéficiaire peut vider la banque (un stock qui se constitue, des clients qui paient tard), un trimestre de perte peut la remplir (des créances anciennes qui rentrent).",
        },
        {
          texte: "C'est impossible : le tableau de bord contient une erreur.",
          juste: false,
          retour: "Ce n'est pas une erreur : le résultat et la trésorerie ne mesurent pas la même chose, ni au même moment.",
        },
        {
          texte: "La trésorerie suit le résultat avec exactement un trimestre de retard.",
          juste: false,
          retour: "Il n'y a pas de règle aussi simple : les délais, le stock, l'emprunt et l'impôt ont chacun leur rythme.",
        },
      ],
    },
    {
      id: "part-de-marche",
      type: "choix",
      titre: "La part de marché",
      notions: ["demand_market_share"],
      tableau: tableauDeLAnnee,
      question: (c) => {
        const t = tableauDeBord(c.code);
        return `La part de marché de ${c.entreprise} passe de ${pct(t[0]!.partDeMarche)} au premier trimestre à ${pct(t[t.length - 1]!.partDeMarche)} au dernier. Que dit cet indicateur que le résultat ne dit pas ?`;
      },
      options: () => [
        {
          texte: "La position face aux concurrents : on peut gagner de l'argent sur un marché qui grandit tout en y perdant du terrain.",
          juste: true,
          retour:
            "C'est cela. Le résultat dit si l'entreprise gagne de l'argent ; la part de marché dit si elle tient sa place. La seconde annonce souvent le premier, un ou deux trimestres plus tôt.",
        },
        {
          texte: "Rien de plus : la part de marché suit toujours le chiffre d'affaires.",
          juste: false,
          retour: "Le chiffre d'affaires peut monter avec le marché pendant que la part baisse : les concurrents montent plus vite.",
        },
        {
          texte: "Le niveau de la trésorerie.",
          juste: false,
          retour: "La part de marché ne dit rien de l'argent en banque : elle compare les ventes à celles des concurrents.",
        },
      ],
    },
    {
      id: "choisir",
      type: "choix",
      titre: "Ce qui n'a rien à faire au tableau de bord",
      notions: ["cash_budget"],
      question: () => "Le dirigeant veut ajouter un septième indicateur. Lequel n'a pas sa place dans son tableau de bord ?",
      options: () => [
        {
          texte: "Le nombre d'écritures passées dans le journal ce trimestre.",
          juste: true,
          retour:
            "C'est cela : il ne dit rien de la santé de l'entreprise et n'appelle aucune décision. Un indicateur a sa place s'il alerte et s'il fait agir quelqu'un.",
        },
        {
          texte: "Le délai moyen de paiement des clients.",
          juste: false,
          retour: "Il a sa place : il annonce la trésorerie des trimestres suivants, et le commercial peut agir dessus.",
        },
        {
          texte: "Le taux de clients perdus d'un trimestre à l'autre.",
          juste: false,
          retour: "Il a sa place : il annonce le chiffre d'affaires de demain, avant que le résultat ne baisse.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["breakeven", "safety_margin", "demand_market_share"],
      tableau: tableauDeLAnnee,
      texte: (c) => [
        `Vous avez calculé les indicateurs d'un trimestre et lu le tableau de bord d'une année de ${c.entreprise}.`,
        "Un bon tableau de bord tient en une page, compare chaque indicateur à lui-même dans le temps, et n'en garde que ceux qui font agir. Dans l'arène, c'est ce que vous regardez avant chaque décision.",
      ],
      repere: () =>
        "Peu d'indicateurs, suivis dans le temps ; un voyant pour chacun ; et la question qui va avec : qui agit, et comment ?",
    },
  ],
};
