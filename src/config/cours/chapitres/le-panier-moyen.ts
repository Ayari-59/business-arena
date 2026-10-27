import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { ARTICLES_PAR_TICKET } from "../../scenarios/sector-kpis";
import { accord, accordPluriel } from "../accords";
import { type Cas } from "../cas";
import { anneeDuCours as anneeJouee } from "../monde/annee-du-cours";
import { METIERS } from "../metiers";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PANIER MOYEN ET LA MARGE D'UNE VENTE (Bac pro MCV, palier 1 : seconde
 * professionnelle relation client, première bac pro Métiers du commerce et de la vente).
 *
 * Le geste du vendeur qui lit son trimestre : combien laisse un client (le panier moyen), ce que
 * sa vente coûte à l'entreprise (l'achat de ce qui est vendu et les frais de la vente), ce qu'il
 * en reste (la marge d'une vente), et donc ce qu'une vente de plus rapporte. À la boutique, qui
 * vend une gamme, le panier se lit aussi article par article, et l'article proposé en plus se
 * choisit sur sa marge.
 *
 * Il ne double ni « Les indicateurs du point de vente » (BTS MCO, palier 2 : le mois, le taux de
 * transformation, le coût d'acquisition, les deux leviers d'un objectif), ni « Tenir la caisse »
 * (CAP : le ticket et la monnaie) : ici, un trimestre entier, et la marge d'une vente.
 *
 * CE QUI VIENT DE L'ARÈNE. Le chiffre d'affaires, les unités vendues et le coût des ventes du
 * trimestre de l'élève (`anneeJouee`) : le coût des ventes est le chiffre d'affaires moins la
 * marge sur coût variable que l'arène calcule (le coût des unités vendues, commissions des
 * partenaires comprises). À la boutique, le prix, le coût et les ventes de chaque article.
 * Le nombre d'articles par passage en caisse est l'hypothèse que l'arène pose elle-même pour
 * son panier moyen (`ARTICLES_PAR_TICKET`, config/scenarios/sector-kpis.ts) : le cours la
 * reprend telle quelle, pour que l'élève retrouve le chiffre de l'arène.
 *
 * CE QUI N'EN VIENT PAS. Les ventes de plus chaque jour, les deux articles comparés et l'article
 * déjà dans le panier du client sont des hypothèses du cours, nommées ci-dessous, et le texte
 * le dit.
 *
 * LES ENTREPRISES DU CHAPITRE : celles où un vendeur vend à un client, un par un, et où l'arène
 * affiche un panier (`CLES_DU_PANIER`) : la boutique (un passage en caisse), le commerce en ligne
 * (une commande), le restaurant (un couvert), l'hôtel (une nuitée). Les autres fabriquent, ou
 * vendent sur devis, sur contrat ou par abonnement.
 */

/** Les entreprises du parcours : un vendeur, un client, un panier affiché par l'arène. */
export const ENTREPRISES_DE_LA_VENTE = ["boutique", "hotel", "bistrot", "ecommerce"] as const;

/** Les indicateurs de l'arène qui sont un panier : chiffre d'affaires ÷ ventes. */
export const CLES_DU_PANIER = ["panier_moyen", "ticket_moyen", "pmc"] as const;

export const POURQUOI_LA_VENTE =
  "ce chapitre suit les ventes d'un vendeur à ses clients, un par un : un passage en caisse, une commande, un couvert, une nuitée. Les autres entreprises du cours fabriquent, ou vendent sur devis, sur contrat ou par abonnement.";

/** Le trimestre du chapitre : le premier de l'année du cours. */
export const TRIMESTRE_DU_PANIER = 1;

/** Les ventes de plus que l'équipe fait chaque jour du trimestre (hypothèse du cours). */
export const VENTES_DE_PLUS_PAR_JOUR = 2;

/** Les deux articles dont l'élève lit la part dans le panier (hypothèse du cours). */
export const ARTICLES_COMPARES = ["echarpe", "pull-merinos"] as const;

/** L'article déjà dans le panier du client, à qui le vendeur en propose un second (hypothèse du cours). */
export const ARTICLE_DU_CLIENT = "pull-col-rond";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Le trimestre de l'élève dans l'année du cours. */
export function trimestreDeLArene(c: Cas, trimestre: number): CompanyRoundResult {
  const r = anneeJouee(c.code).partie.rounds[trimestre - 1]?.results["joueur"];
  if (!r) throw new Error(`Pas de trimestre ${trimestre} chez ${c.code}`);
  return r;
}

/** Ce qu'on compte comme une vente : un passage en caisse à la boutique, l'unité du métier ailleurs. */
export function venteDuMetier(c: Cas) {
  if (aUneGamme(c)) return { singulier: "passage en caisse", pluriel: "passages en caisse", unitesParVente: ARTICLES_PAR_TICKET };
  return { singulier: c.unite, pluriel: c.unites, unitesParVente: 1 };
}

/** La boutique vend une gamme : plusieurs articles, chacun à son prix. */
export const aUneGamme = (c: Pick<Cas, "code">) => (scenarioByCode(c.code).scenario.products?.length ?? 0) > 1;

/** Le nom que l'arène donne à son panier, dans ses indicateurs du métier. */
export function nomDuPanierDansLArene(c: Cas): string {
  const kpi = scenarioByCode(c.code).kpis.find((k) => (CLES_DU_PANIER as readonly string[]).includes(k.key));
  if (!kpi) throw new Error(`Pas d'indicateur de panier pour ${c.code}`);
  return kpi.label;
}

/** Le panier, le coût et la marge d'une vente, sur un trimestre de l'arène. */
export function venteDuTrimestre(c: Cas, trimestre: number) {
  const r = trimestreDeLArene(c, trimestre);
  const segments = Object.values(r.market.bySegment);
  const vente = venteDuMetier(c);
  const unites = Math.round(segments.reduce((t, v) => t + v.sold, 0));
  const chiffreDAffaires = Math.round(r.incomeStatement.revenue);
  // Le coût des ventes : le chiffre d'affaires moins la marge sur coût variable de l'arène.
  const coutDesVentes = Math.round(r.incomeStatement.revenue - r.incomeStatement.grossMargin);
  const ventes = Math.round(unites / vente.unitesParVente);
  const panier = auCentime(chiffreDAffaires / ventes);
  const coutDUneVente = auCentime(coutDesVentes / ventes);
  const marge = auCentime(panier - coutDUneVente);
  const jours = scenarioByCode(c.code).scenario.roundDays;
  const ventesEnPlus = VENTES_DE_PLUS_PAR_JOUR * jours;
  // Un seul prix : chaque clientèle paie la même chose à 1 % près (la commission mise à part).
  const prixDesClienteles = segments.filter((v) => v.sold > 0).map((v) => v.revenue / v.sold);
  const prixUnique = !aUneGamme(c) && Math.max(...prixDesClienteles) <= Math.min(...prixDesClienteles) * 1.01;
  return {
    trimestre,
    vente,
    unites,
    chiffreDAffaires,
    coutDesVentes,
    commissions: Math.round(r.incomeStatement.commissionCost ?? 0),
    ventes,
    panier,
    coutDUneVente,
    marge,
    prixUnique,
    jours,
    ventesEnPlus,
    caEnPlus: auCentime(ventesEnPlus * panier),
    margeEnPlus: auCentime(ventesEnPlus * marge),
  };
}

/** Les articles de la gamme, au trimestre : ventes, chiffre d'affaires, prix, coût, marge, part du panier. */
export function articlesDuTrimestre(c: Cas, trimestre: number) {
  const s = scenarioByCode(c.code).scenario;
  const r = trimestreDeLArene(c, trimestre);
  const { ventes } = venteDuTrimestre(c, trimestre);
  return (s.products ?? []).map((p) => {
    const a = r.products?.[p.code];
    if (!a) throw new Error(`Pas d'article ${p.code} chez ${c.code}`);
    const prix = auCentime(a.price);
    const cout = auCentime(a.unitVariableCost);
    const chiffreDAffaires = Math.round(a.revenue);
    return {
      code: p.code,
      nom: p.name,
      vendus: Math.round(a.sold),
      chiffreDAffaires,
      prix,
      cout,
      marge: auCentime(prix - cout),
      dansLePanier: auCentime(chiffreDAffaires / ventes),
    };
  });
}

type Article = ReturnType<typeof articlesDuTrimestre>[number];

const articleDe = (c: Cas, code: string): Article => {
  const a = articlesDuTrimestre(c, TRIMESTRE_DU_PANIER).find((x) => x.code === code);
  if (!a) throw new Error(`Pas d'article ${code} chez ${c.code}`);
  return a;
};

/**
 * L'article à proposer en plus : celui qui laisse le plus de marge, face au plus vendu et au
 * moins cher des autres, que l'élève prendrait d'instinct.
 */
export function articleAConseiller(c: Cas) {
  const autres = articlesDuTrimestre(c, TRIMESTRE_DU_PANIER).filter((a) => a.code !== ARTICLE_DU_CLIENT);
  const meilleur = autres.reduce((m, a) => (a.marge > m.marge ? a : m));
  const reste = autres.filter((a) => a !== meilleur);
  const plusVendu = reste.reduce((m, a) => (a.vendus > m.vendus ? a : m));
  const moinsCher = reste.filter((a) => a !== plusVendu).reduce((m, a) => (a.prix < m.prix ? a : m));
  return { client: articleDe(c, ARTICLE_DU_CLIENT), meilleur, plusVendu, moinsCher };
}

const du = (c: Cas) => venteDuTrimestre(c, TRIMESTRE_DU_PANIER);

/** « d'un couvert », « d'une nuitée ». */
const dUn = (c: Cas) => `d'${accord(c, "un")} ${c.unite}`;

/** Ce que coûte une vente, en mots : l'achat, les frais du métier, les commissions s'il y en a. */
function ceQueCouteUneVente(c: Cas): string {
  const k = du(c);
  const frais = METIERS[c.code]!.autresCoutsVariables;
  const base = `l'achat de ce qui est vendu et ses frais (${frais})`;
  return k.commissions > 0 ? `${base}, plus les commissions des places de marché` : base;
}

export function tableauDuTrimestre(c: Cas, trimestre = TRIMESTRE_DU_PANIER): TableauDeDonnees {
  const k = venteDuTrimestre(c, trimestre);
  return {
    titre: `${c.entreprise} · le trimestre ${trimestre} de l'arène`,
    colonnes: [`Trimestre ${trimestre}`],
    lignes: [
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(k.chiffreDAffaires)] },
      { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, valeurs: [qte(k.unites)] },
      { libelle: "Coût des ventes", valeurs: [eur(k.coutDesVentes)] },
    ],
  };
}

export function tableauDesArticles(c: Cas): TableauDeDonnees {
  return {
    titre: `Les articles du rayon au trimestre ${TRIMESTRE_DU_PANIER}`,
    colonnes: ["Articles vendus", "Chiffre d'affaires HT"],
    lignes: articlesDuTrimestre(c, TRIMESTRE_DU_PANIER).map((a) => ({ libelle: a.nom, valeurs: [qte(a.vendus), eur(a.chiffreDAffaires)] })),
  };
}

export function tableauDesMarges(c: Cas): TableauDeDonnees {
  return {
    titre: `Le prix et le coût de chaque article au trimestre ${TRIMESTRE_DU_PANIER}`,
    colonnes: ["Prix hors taxes", "Coût d'un article"],
    lignes: articlesDuTrimestre(c, TRIMESTRE_DU_PANIER).map((a) => ({ libelle: a.nom, valeurs: [eur(a.prix), eur(a.cout)] })),
  };
}

export const LE_PANIER_MOYEN: Chapitre = {
  code: "le-panier-moyen",
  parcours: "vente",
  palier: 1,
  blocs: ["Bac pro MCV · Bloc 1 · Conseiller et vendre", "Bac pro MCV · Bloc 2 · Suivre les ventes"],
  titre: "Le panier moyen et la marge d'une vente",
  accroche:
    "Combien laisse un client, combien coûte sa vente, combien elle rapporte : le panier moyen et la marge d'une vente, sur un trimestre de l'arène.",
  objectifs: [
    "Calculer le panier moyen d'un trimestre",
    "Calculer le coût et la marge d'une vente",
    "Dire ce qu'une vente de plus rapporte",
    "Choisir l'article à proposer en plus, d'après sa marge",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_VENTE, pourquoi: POURQUOI_LA_VENTE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le trimestre du vendeur",
      notions: ["average_basket", "revenue"],
      tableau: (c) => tableauDuTrimestre(c),
      texte: (c) => {
        const k = du(c);
        return [
          `Vous vendez chez ${c.entreprise}. Chaque jour, vous servez des clients. Mais combien laisse un client, et que rapporte sa vente ?`,
          `Le tableau donne le trimestre ${k.trimestre} de l'arène : le chiffre d'affaires hors taxes, les ${c.unites} ${accordPluriel(c, "vendu")}, et le coût des ventes. Ce coût, c'est ${ceQueCouteUneVente(c)}.`,
          aUneGamme(c)
            ? `À la caisse, un client achète souvent plus d'un article. L'arène compte ${qte(ARTICLES_PAR_TICKET)} article par passage en caisse : une vente, c'est un passage en caisse.`
            : `Chez ${c.entreprise}, une vente, c'est ${accord(c, "un")} ${c.unite}.`,
        ];
      },
      repere: () => "Panier moyen = chiffre d'affaires ÷ nombre de ventes.",
    },
    {
      id: "le-panier",
      type: "montants",
      titre: "Le panier moyen",
      notions: ["average_basket"],
      question: (c) => {
        const k = du(c);
        return aUneGamme(c)
          ? `Comptez d'abord les passages en caisse du trimestre : ${qte(k.unites)} articles ÷ ${qte(ARTICLES_PAR_TICKET)}, à l'unité. Puis calculez le panier moyen : le chiffre d'affaires divisé par les passages en caisse, au centime.`
          : `Calculez le panier moyen du trimestre : ${eur(k.chiffreDAffaires)} de chiffre d'affaires divisé par ${qte(k.ventes)} ${c.unites}, au centime.`;
      },
      champs: (c) => {
        const k = du(c);
        const panier = {
          libelle: "Panier moyen",
          attendu: k.panier,
          calcul: `${eur(k.chiffreDAffaires)} ÷ ${qte(k.ventes)} = ${eur(k.panier)}`,
          // Les passages arrondis à l'unité déplacent le panier de quelques centimes.
          tolerance: aUneGamme(c) ? 0.05 : 0.01,
        };
        return aUneGamme(c)
          ? [{ libelle: "Passages en caisse", attendu: k.ventes, calcul: `${qte(k.unites)} ÷ ${qte(ARTICLES_PAR_TICKET)} = ${qte(k.ventes)}`, tolerance: 1 }, panier]
          : [panier];
      },
      explication: (c) => {
        const k = du(c);
        return [
          `Une vente laisse en moyenne ${eur(k.panier)} hors taxes. L'arène affiche ce chiffre, à quelques centimes près, dans ses indicateurs du métier : « ${nomDuPanierDansLArene(c)} ».`,
          k.prixUnique
            ? `Ici, le panier moyen est le prix ${dUn(c)} : dans l'arène, chaque ${c.unite} se vend au même prix. En vrai, il monte quand le client prend plus, et le vendeur y est pour quelque chose.`
            : "Le panier monte quand le client prend un article de plus, ou un article plus cher : c'est le travail du vendeur.",
        ];
      },
    },
    {
      id: "le-panier-par-article",
      type: "montants",
      titre: "Le panier, article par article",
      notions: ["average_basket", "assortment"],
      si: aUneGamme,
      tableau: tableauDesArticles,
      question: (c) => {
        const k = du(c);
        const [a, b] = ARTICLES_COMPARES.map((x) => articleDe(c, x));
        return `Le panier moyen se lit aussi article par article. La part d'un article dans le panier = son chiffre d'affaires ÷ les ${qte(k.ventes)} passages en caisse. Calculez-la pour l'article « ${a!.nom} », puis pour l'article « ${b!.nom} », au centime.`;
      },
      champs: (c) => {
        const k = du(c);
        return ARTICLES_COMPARES.map((x) => {
          const a = articleDe(c, x);
          return {
            libelle: `Part de l'article « ${a.nom} » dans le panier`,
            attendu: a.dansLePanier,
            calcul: `${eur(a.chiffreDAffaires)} ÷ ${qte(k.ventes)} = ${eur(a.dansLePanier)}`,
          };
        });
      },
      explication: (c) => {
        const [a, b] = ARTICLES_COMPARES.map((x) => articleDe(c, x)) as [Article, Article];
        const [plusVendu, autre] = a.vendus >= b.vendus ? [a, b] : [b, a];
        return [
          autre.dansLePanier > plusVendu.dansLePanier
            ? `L'article « ${plusVendu.nom} » se vend ${qte(plusVendu.vendus)} fois, l'article « ${autre.nom} » ${qte(autre.vendus)} fois. Pourtant, c'est le second qui pèse le plus dans le panier : ${eur(autre.dansLePanier)}, contre ${eur(plusVendu.dansLePanier)}. Il est plus cher.`
            : `L'article « ${plusVendu.nom} » se vend ${qte(plusVendu.vendus)} fois, l'article « ${autre.nom} » ${qte(autre.vendus)} fois. Le premier pèse aussi le plus dans le panier : ${eur(plusVendu.dansLePanier)}, contre ${eur(autre.dansLePanier)}.`,
          "Ajoutez les parts de tous les articles du rayon : vous retrouvez le panier moyen, à quelques centimes près.",
        ];
      },
    },
    {
      id: "la-marge",
      type: "montants",
      titre: "Le coût et la marge d'une vente",
      notions: ["variable_costs", "contribution_margin"],
      question: (c) => {
        const k = du(c);
        return `Les ventes du trimestre ont coûté ${eur(k.coutDesVentes)} à ${c.entreprise}. Calculez le coût d'une vente : ce coût divisé par les ${qte(k.ventes)} ${k.vente.pluriel}. Puis la marge d'une vente : le panier moyen moins le coût d'une vente.`;
      },
      champs: (c) => {
        const k = du(c);
        const tolerance = aUneGamme(c) ? 0.05 : 0.01;
        return [
          { libelle: "Coût d'une vente", attendu: k.coutDUneVente, calcul: `${eur(k.coutDesVentes)} ÷ ${qte(k.ventes)} = ${eur(k.coutDUneVente)}`, tolerance },
          { libelle: "Marge d'une vente", attendu: k.marge, calcul: `${eur(k.panier)} − ${eur(k.coutDUneVente)} = ${eur(k.marge)}`, tolerance },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          `Sur ${eur(k.panier)} payés par le client, ${eur(k.coutDUneVente)} repartent dans ${ceQueCouteUneVente(c)}. Il reste ${eur(k.marge)} à ${c.entreprise} : la marge d'une vente.`,
          "C'est avec cette marge que l'entreprise paie son loyer, ses salaires, et fait son bénéfice.",
        ];
      },
    },
    {
      id: "une-vente-de-plus",
      type: "choix",
      titre: "Ce qu'une vente de plus rapporte",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => `Un client de plus achète chez ${c.entreprise}, avec le panier moyen. Que rapporte cette vente de plus à l'entreprise ?`,
      options: (c) => {
        const k = du(c);
        return [
          {
            texte: `${eur(k.marge)}, la marge d'une vente`,
            juste: true,
            retour: `Oui : le client paie ${eur(k.panier)}, sa vente coûte ${eur(k.coutDUneVente)}. Le loyer et les salaires ne bougent pas pour un client de plus : toute la marge est gagnée.`,
          },
          {
            texte: `${eur(k.panier)}, le panier moyen`,
            juste: false,
            retour: `Non : le panier, c'est ce que le client paie. Mais sa vente coûte ${eur(k.coutDUneVente)} à l'entreprise. Il reste ${eur(k.marge)}.`,
          },
          {
            texte: "Rien, tant que le loyer n'est pas payé",
            juste: false,
            retour: `Non : le loyer se paie avec ou sans ce client. La vente de plus ajoute sa marge, ${eur(k.marge)}, et c'est elle qui aide à payer le loyer.`,
          },
        ];
      },
    },
    {
      id: "chaque-jour",
      type: "montants",
      titre: "Des ventes de plus chaque jour",
      notions: ["contribution_margin", "revenue"],
      question: (c) => {
        const k = du(c);
        return `Exemple du cours : votre équipe fait ${qte(VENTES_DE_PLUS_PAR_JOUR)} ventes de plus chaque jour, pendant les ${qte(k.jours)} jours du trimestre. Calculez les ventes en plus, puis le chiffre d'affaires en plus et la marge en plus.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: "Ventes en plus sur le trimestre", attendu: k.ventesEnPlus, calcul: `${qte(VENTES_DE_PLUS_PAR_JOUR)} × ${qte(k.jours)} = ${qte(k.ventesEnPlus)}` },
          { libelle: "Chiffre d'affaires en plus", attendu: k.caEnPlus, calcul: `${qte(k.ventesEnPlus)} × ${eur(k.panier)} = ${eur(k.caEnPlus)}`, tolerance: 1 },
          { libelle: "Marge en plus", attendu: k.margeEnPlus, calcul: `${qte(k.ventesEnPlus)} × ${eur(k.marge)} = ${eur(k.margeEnPlus)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          `${qte(k.ventesEnPlus)} ventes de plus font ${eur(k.caEnPlus)} de chiffre d'affaires. Mais l'entreprise ne gagne que ${eur(k.margeEnPlus)} de plus : c'est la marge qui dit ce qu'une vente rapporte, pas le chiffre d'affaires.`,
        ];
      },
    },
    {
      id: "l-article-a-proposer",
      type: "choix",
      titre: "L'article à proposer en plus",
      notions: ["contribution_margin", "average_basket"],
      si: aUneGamme,
      tableau: tableauDesMarges,
      question: (c) => {
        const { client } = articleAConseiller(c);
        return `Un client passe en caisse avec l'article « ${client.nom} ». Vous lui proposez un second article. Lequel rapporte le plus de marge à ${c.entreprise} ?`;
      },
      options: (c) => {
        const { meilleur, plusVendu, moinsCher } = articleAConseiller(c);
        const calcul = (a: Article) => `${eur(a.prix)} − ${eur(a.cout)} = ${eur(a.marge)}`;
        return [
          { texte: meilleur.nom, juste: true, retour: `Oui : ${calcul(meilleur)} de marge, le plus du rayon. Le panier monte, et la marge avec.` },
          {
            texte: plusVendu.nom,
            juste: false,
            retour: `Non : c'est l'un des articles qui se vendent le plus, mais il ne laisse que ${calcul(plusVendu)}. L'article « ${meilleur.nom} » laisse ${eur(meilleur.marge)}.`,
          },
          {
            texte: moinsCher.nom,
            juste: false,
            retour: `Non : il est facile à ajouter, mais il ne laisse que ${calcul(moinsCher)}. L'article « ${meilleur.nom} » laisse ${eur(meilleur.marge)}.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["average_basket", "contribution_margin"],
      texte: (c) => {
        const k = du(c);
        const lignes = [
          `Chez ${c.entreprise}, au trimestre ${k.trimestre} : un panier moyen de ${eur(k.panier)}, une vente qui coûte ${eur(k.coutDUneVente)}, une marge de ${eur(k.marge)} par vente.`,
          "Une vente de plus rapporte sa marge, pas son prix : le loyer et les salaires sont déjà là.",
        ];
        if (aUneGamme(c)) {
          const { meilleur, moinsCher } = articleAConseiller(c);
          lignes.push(`Le panier se remplit aussi article par article : proposer l'article « ${meilleur.nom} » rapporte ${eur(meilleur.marge)} de marge, l'article « ${moinsCher.nom} » ${eur(moinsCher.marge)}.`);
        }
        return lignes;
      },
      repere: () => "Marge d'une vente = panier moyen − coût d'une vente.",
    },
  ],
};
