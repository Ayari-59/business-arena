import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { AUTRES_COUTS_VARIABLES, BOUTIQUES_DU_COURS, type CodeDeReference, type FicheDeLaBoutique } from "../monde/maille-et-co";
import {
  ARTICLES_COMPARES,
  OBJECTIF_DE_PANIER,
  VENTES_DE_PLUS_PAR_JOUR,
  articleAConseiller,
  articlesDuMois,
  articlesEssayes,
  articlesPourLObjectif,
  coutDUnVendeurEnPlus,
  journeeEnCaisse,
  margeDesVentesEnPlus,
  moisAuxArticles,
  panierDuMois,
  ventesPourLeVendeur,
} from "../monde/vente-et-caisse";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE PANIER MOYEN ET LA MARGE D'UNE VENTE (Bac pro MCV, palier 1 : seconde
 * professionnelle relation client, première bac pro Métiers du commerce et de la vente).
 *
 * Le geste du vendeur qui lit son mois : combien laisse un client (le panier moyen), ce que sa
 * vente coûte à la boutique (l'achat de ce qui est vendu et les frais de la vente), ce qu'il en
 * reste (la marge d'une vente), et donc ce qu'une vente de plus rapporte. Le panier se lit aussi
 * article par article, et l'article proposé en plus se choisit sur sa marge. Puis l'expérience :
 * un curseur (combien de ventes de plus par jour paient un vendeur de plus ?) et un laboratoire
 * (combien d'articles par passage en caisse portent le panier à l'objectif ?).
 *
 * Il ne double ni « Les indicateurs du point de vente » (BTS MCO, palier 2 : le trafic, le taux
 * de transformation, les deux leviers d'un objectif), ni « Tenir la caisse » (CAP : le ticket et
 * la monnaie) : ici, la marge d'une vente.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le mois de janvier de MAILLE & CO (monde/maille-et-co.ts),
 * réglé en caisse : 940 passages, 1 330 articles, 77 250 € hors taxes (les huit commandes des comités
 * d'entreprise, 10 200 €, facturées et réglées à 45 jours, ne passent pas en caisse, comme le dit
 * « Tenir la caisse » : audit pédagogique, P1-7) ; le coût d'une vente est le coût
 * variable des articles vendus (le prix d'achat et les autres coûts variables de la fiche). Le
 * vendeur de plus est celui de l'équipe de la fiche (2 000 € brut, 42 % de cotisations
 * patronales). Les calculs sont dans monde/vente-et-caisse.ts.
 *
 * HYPOTHÈSES DU COURS, dites à l'élève : les deux ventes de plus chaque jour, les deux articles
 * comparés, l'article déjà dans le panier du client, l'objectif de panier de 100 €.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait le premier trimestre de l'arène chez quatre entreprises (à la
 * boutique : 2 876 passages en caisse, un panier de 88,78 €, une marge de 45,43 € par vente). Il se
 * joue maintenant chez MAILLE & CO seule, sur janvier en caisse : un panier de 82,18 €, un coût de
 * 40,74 €, une marge de 41,44 € par vente. Le laboratoire fait varier les articles du mois, à partir
 * de ceux de janvier.
 */

/** Les entreprises du parcours de la vente : la boutique du cours, où un vendeur sert ses clients un par un. */
export const ENTREPRISES_DE_LA_VENTE = ["boutique"] as const;

export const POURQUOI_LA_VENTE =
  "ce chapitre suit les ventes de la boutique du cours, MAILLE & CO, client par client : un passage en caisse, un panier, une marge.";

/** La course du curseur des ventes de plus par jour : assez longue pour que le départ, au quart, ne tombe pas sur la réponse. */
export const VENTES_SUR_LE_CURSEUR = 16;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

const du = (c: Cas) => panierDuMois(ficheDe(c));
const articleDe = (c: Cas, code: CodeDeReference) => articlesDuMois(ficheDe(c)).find((a) => a.code === code)!;
type Article = ReturnType<typeof articlesDuMois>[number];

/** Ce que coûte une vente, en mots. */
const CE_QUE_COUTE_UNE_VENTE = `l'achat de ce qui est vendu et ses frais (${AUTRES_COUTS_VARIABLES})`;

/** Le tableau d'un mois : chiffre d'affaires, articles, passages en caisse, coût des ventes. */
export function tableauDuMois(c: Cas, k: ReturnType<typeof panierDuMois>): TableauDeDonnees {
  return {
    titre: `${c.entreprise} · le mois de ${k.mois}, réglé en caisse`,
    colonnes: [k.mois.charAt(0).toUpperCase() + k.mois.slice(1)],
    lignes: [
      { libelle: "Chiffre d'affaires hors taxes", valeurs: [eur(k.chiffreDAffaires)] },
      { libelle: "Articles vendus", valeurs: [qte(k.articles)] },
      { libelle: "Passages en caisse", valeurs: [qte(k.tickets)] },
      { libelle: "Coût des ventes", valeurs: [eur(k.coutDesVentes)] },
    ],
  };
}

export function tableauDesArticles(c: Cas): TableauDeDonnees {
  return {
    titre: "Les articles du rayon en janvier",
    colonnes: ["Articles vendus", "Chiffre d'affaires HT"],
    lignes: articlesDuMois(ficheDe(c)).map((a) => ({ libelle: a.nom, valeurs: [qte(a.vendus), eur(a.chiffreDAffaires)] })),
  };
}

export function tableauDesMarges(c: Cas): TableauDeDonnees {
  return {
    titre: "Le prix et le coût de chaque article",
    colonnes: ["Prix hors taxes", "Coût d'un article"],
    lignes: articlesDuMois(ficheDe(c)).map((a) => ({ libelle: a.nom, valeurs: [eur(a.prix), eur(a.cout)] })),
  };
}

export const LE_PANIER_MOYEN: Chapitre = {
  code: "le-panier-moyen",
  parcours: "vente",
  palier: 1,
  blocs: ["Bac pro MCV · Bloc 1 · Conseiller et vendre", "Bac pro MCV · Bloc 2 · Suivre les ventes"],
  titre: "Le panier moyen et la marge d'une vente",
  accroche: "Combien laisse un client, combien coûte sa vente, combien elle rapporte : le panier moyen et la marge d'une vente, sur un mois de la boutique.",
  objectifs: [
    "Calculer le panier moyen d'un mois",
    "Calculer le coût et la marge d'une vente",
    "Dire ce qu'une vente de plus rapporte",
    "Choisir l'article à proposer en plus, d'après sa marge",
    "Voir ce qu'un article de plus par client fait au panier",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_VENTE, pourquoi: POURQUOI_LA_VENTE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le mois du vendeur",
      notions: ["average_basket", "revenue"],
      tableau: (c) => tableauDuMois(c, du(c)),
      texte: (c) => [
        `Vous vendez chez ${c.entreprise}. Chaque jour, vous servez des clients. Mais combien laisse un client, et que rapporte sa vente ?`,
        `Le tableau donne le mois de janvier réglé en caisse : le chiffre d'affaires hors taxes, les articles vendus, les passages en caisse, et le coût des ventes. Ce coût, c'est ${CE_QUE_COUTE_UNE_VENTE}.`,
        `Les commandes des comités d'entreprise (${eur(journeeEnCaisse(ficheDe(c)).chiffreFacture)} hors taxes) ne passent pas en caisse : elles sont facturées et réglées plus tard. Elles ne comptent donc pas dans le panier moyen, qui mesure ce que laisse un client du magasin.`,
        "À la caisse, un client achète souvent plus d'un article : une vente, c'est un passage en caisse.",
      ],
      repere: () => "Panier moyen = chiffre d'affaires encaissé en caisse ÷ passages en caisse.",
    },
    {
      id: "le-panier",
      type: "montants",
      titre: "Le panier moyen",
      notions: ["average_basket"],
      question: (c) => {
        const k = du(c);
        return `Calculez le panier moyen de janvier : ${eur(k.chiffreDAffaires)} de chiffre d'affaires encaissé en caisse divisé par ${qte(k.tickets)} passages en caisse, au centime.`;
      },
      champs: (c) => {
        const k = du(c);
        return [{ libelle: "Panier moyen", attendu: k.panier, calcul: `${eur(k.chiffreDAffaires)} ÷ ${qte(k.tickets)} = ${eur(k.panier)}` }];
      },
      explication: (c) => [
        `Une vente laisse en moyenne ${eur(du(c).panier)} hors taxes.`,
        "Le panier monte quand le client prend un article de plus, ou un article plus cher : c'est le travail du vendeur.",
      ],
    },
    {
      id: "le-panier-par-article",
      type: "montants",
      titre: "Le panier, article par article",
      notions: ["average_basket", "assortment"],
      tableau: tableauDesArticles,
      question: (c) => {
        const k = du(c);
        const [a, b] = ARTICLES_COMPARES.map((x) => articleDe(c, x));
        return `Le panier moyen se lit aussi article par article. La part d'un article dans le panier = son chiffre d'affaires ÷ les ${qte(k.tickets)} passages en caisse. Calculez-la pour l'article « ${a!.nom} », puis pour l'article « ${b!.nom} », au centime.`;
      },
      champs: (c) => {
        const k = du(c);
        return ARTICLES_COMPARES.map((x) => {
          const a = articleDe(c, x);
          return { libelle: `Part de l'article « ${a.nom} » dans le panier`, attendu: a.dansLePanier, calcul: `${eur(a.chiffreDAffaires)} ÷ ${qte(k.tickets)} = ${eur(a.dansLePanier)}` };
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
        return `Les ventes de janvier ont coûté ${eur(k.coutDesVentes)} à ${c.entreprise}. Calculez le coût d'une vente : ce coût divisé par les ${qte(k.tickets)} passages en caisse. Puis la marge d'une vente : le panier moyen moins le coût d'une vente.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: "Coût d'une vente", attendu: k.coutDUneVente, calcul: `${eur(k.coutDesVentes)} ÷ ${qte(k.tickets)} = ${eur(k.coutDUneVente)}` },
          { libelle: "Marge d'une vente", attendu: k.marge, calcul: `${eur(k.panier)} − ${eur(k.coutDUneVente)} = ${eur(k.marge)}` },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [
          `Sur ${eur(k.panier)} payés par le client, ${eur(k.coutDUneVente)} repartent dans ${CE_QUE_COUTE_UNE_VENTE}. Il reste ${eur(k.marge)} à ${c.entreprise} : la marge d'une vente.`,
          "C'est avec cette marge que la boutique paie son loyer, ses salaires, et fait son bénéfice.",
        ];
      },
    },
    {
      id: "une-vente-de-plus",
      type: "choix",
      titre: "Ce qu'une vente de plus rapporte",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => `Un client de plus achète chez ${c.entreprise}, avec le panier moyen. Que rapporte cette vente de plus à la boutique ?`,
      options: (c) => {
        const k = du(c);
        return [
          { texte: `${eur(k.marge)}, la marge d'une vente`, juste: true, retour: `Oui : le client paie ${eur(k.panier)}, sa vente coûte ${eur(k.coutDUneVente)}. Le loyer et les salaires ne bougent pas pour un client de plus : toute la marge est gagnée.` },
          { texte: `${eur(k.panier)}, le panier moyen`, juste: false, retour: `Non : le panier, c'est ce que le client paie. Mais sa vente coûte ${eur(k.coutDUneVente)} à la boutique. Il reste ${eur(k.marge)}.` },
          { texte: "Rien, tant que le loyer n'est pas payé", juste: false, retour: `Non : le loyer se paie avec ou sans ce client. La vente de plus ajoute sa marge, ${eur(k.marge)}, et c'est elle qui aide à payer le loyer.` },
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
        return `Exemple du cours : votre équipe fait ${qte(VENTES_DE_PLUS_PAR_JOUR)} ventes de plus chaque jour, pendant les ${qte(k.jours)} jours du mois. Calculez les ventes en plus, puis le chiffre d'affaires en plus et la marge en plus.`;
      },
      champs: (c) => {
        const k = du(c);
        return [
          { libelle: "Ventes en plus sur le mois", attendu: k.ventesEnPlus, calcul: `${qte(VENTES_DE_PLUS_PAR_JOUR)} × ${qte(k.jours)} = ${qte(k.ventesEnPlus)}` },
          { libelle: "Chiffre d'affaires en plus", attendu: k.caEnPlus, calcul: `${qte(k.ventesEnPlus)} × ${eur(k.panier)} = ${eur(k.caEnPlus)}` },
          { libelle: "Marge en plus", attendu: k.margeEnPlus, calcul: `${qte(k.ventesEnPlus)} × ${eur(k.marge)} = ${eur(k.margeEnPlus)}` },
        ];
      },
      explication: (c) => {
        const k = du(c);
        return [`${qte(k.ventesEnPlus)} ventes de plus font ${eur(k.caEnPlus)} de chiffre d'affaires. Mais la boutique ne gagne que ${eur(k.margeEnPlus)} de plus : c'est la marge qui dit ce qu'une vente rapporte, pas le chiffre d'affaires.`];
      },
    },
    {
      id: "l-article-a-proposer",
      type: "choix",
      titre: "L'article à proposer en plus",
      notions: ["contribution_margin", "average_basket"],
      tableau: tableauDesMarges,
      question: (c) => `Un client passe en caisse avec l'article « ${articleAConseiller(ficheDe(c)).client.nom} ». Vous lui proposez un second article. Lequel rapporte le plus de marge à ${c.entreprise} ?`,
      options: (c) => {
        const { meilleur, plusVendu, moinsCher } = articleAConseiller(ficheDe(c));
        const calcul = (a: Article) => `${eur(a.prix)} − ${eur(a.cout)} = ${eur(a.marge)}`;
        return [
          { texte: meilleur.nom, juste: true, retour: `Oui : ${calcul(meilleur)} de marge, le plus du rayon. Le panier monte, et la marge avec.` },
          { texte: plusVendu.nom, juste: false, retour: `Non : c'est l'un des articles qui se vendent le plus, mais il ne laisse que ${calcul(plusVendu)}. L'article « ${meilleur.nom} » laisse ${eur(meilleur.marge)}.` },
          { texte: moinsCher.nom, juste: false, retour: `Non : il est facile à ajouter, mais il ne laisse que ${calcul(moinsCher)}. L'article « ${meilleur.nom} » laisse ${eur(meilleur.marge)}.` },
        ];
      },
    },
    {
      id: "le-vendeur-en-plus",
      type: "curseur",
      titre: "Un vendeur de plus",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const v = coutDUnVendeurEnPlus(ficheDe(c));
        return `La responsable pense embaucher un vendeur de plus, à temps plein : ${eur(v.brut)} brut par mois, ${eur(v.cout)} avec les cotisations patronales. Faites varier les ventes de plus qu'il ferait chaque jour : une droite donne la marge qu'elles rapportent dans le mois, l'autre ce que coûte le vendeur. Placez le curseur sur le plus petit nombre de ventes de plus par jour qui paie son coût, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ventes de plus chaque jour", unite: "ventes" }),
      cible: (c) => ({ attendu: ventesPourLeVendeur(ficheDe(c)), min: 0, max: VENTES_SUR_LE_CURSEUR }),
      zones: ["Le vendeur rapporte plus qu'il ne coûte", "Le vendeur coûte plus qu'il ne rapporte"],
      rates: () => ({
        dessous: "Avec si peu de ventes de plus, la marge gagnée ne paie pas le vendeur.",
        dessus: "Ces ventes paient le vendeur, mais moins suffirait : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les ventes",
      lecture: (c, q) => [
        { libelle: "Ventes de plus dans le mois", montant: q * ficheDe(c).joursDuMois },
        { libelle: "Marge gagnée dans le mois", montant: margeDesVentesEnPlus(ficheDe(c), q), fort: true },
        { libelle: "Coût du vendeur dans le mois", montant: coutDUnVendeurEnPlus(ficheDe(c)).cout },
      ],
      droites: (c) => ({ produit: (q) => margeDesVentesEnPlus(ficheDe(c), q), cout: () => coutDUnVendeurEnPlus(ficheDe(c)).cout, libelles: ["Marge des ventes de plus", "Coût du vendeur"] }),
      explication: (c) => {
        const f = ficheDe(c);
        const q = ventesPourLeVendeur(f);
        return [
          `Il faut ${qte(q)} ventes de plus par jour : ${qte(q * f.joursDuMois)} ventes à ${eur(du(c).marge)} de marge font ${eur(margeDesVentesEnPlus(f, q))}, plus que les ${eur(coutDUnVendeurEnPlus(f).cout)} du vendeur. Avec ${qte(q - 1)}, la marge, ${eur(margeDesVentesEnPlus(f, q - 1))}, ne le paie pas.`,
          "Un vendeur se paie avec la marge des ventes qu'il fait en plus, jamais avec leur chiffre d'affaires.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-panier",
      type: "simulation",
      titre: "Le laboratoire du panier",
      notions: ["average_basket", "contribution_margin"],
      question: (c) => {
        const k = du(c);
        return `La responsable veut un panier moyen d'au moins ${eur(OBJECTIF_DE_PANIER)}. Le panier, c'est le nombre d'articles par passage en caisse (l'indice de vente) × le prix moyen d'un article, ${eur(k.prixMoyenDeLArticle)}. Faites varier les articles vendus dans le mois, en partant des ${qte(k.articles)} de janvier, les ${qte(k.tickets)} passages en caisse gardés, et relevez le défi.`;
      },
      leviers: (c) => [{ code: "articles", libelle: "Articles vendus dans le mois", unite: "articles", ...articlesEssayes(ficheDe(c)), depart: du(c).articles }],
      lecture: (c, p) => {
        const f = ficheDe(c);
        const x = moisAuxArticles(f, p.articles!);
        const depart = moisAuxArticles(f, du(c).articles);
        return [
          { libelle: "Articles par passage en caisse", montant: x.indice, unite: "articles", reference: depart.indice },
          { libelle: "Panier moyen", montant: x.panier, reference: depart.panier, fort: true },
          { libelle: "Marge d'une vente", montant: x.marge, reference: depart.marge },
          { libelle: "Marge du mois", montant: x.margeDuMois, reference: depart.margeDuMois },
        ];
      },
      graphique: (c) => ({
        levier: "articles",
        courbes: [
          { libelle: "Panier moyen", valeur: (p) => moisAuxArticles(ficheDe(c), p.articles!).panier },
          { libelle: "Objectif de panier", valeur: () => OBJECTIF_DE_PANIER },
        ],
      }),
      defi: (c) => {
        const juste = articlesPourLObjectif(ficheDe(c));
        return {
          consigne: `Trouvez le plus petit nombre d'articles vendus dans le mois qui porte le panier moyen à ${eur(OBJECTIF_DE_PANIER)} au moins.`,
          atteint: (p) => p.articles === juste,
          indice: (p) => {
            const x = moisAuxArticles(ficheDe(c), p.articles!);
            return x.panier < OBJECTIF_DE_PANIER
              ? `Le panier est de ${eur(x.panier)} : il manque ${eur(OBJECTIF_DE_PANIER - x.panier)}. Il faut un peu plus d'articles par client.`
              : `Le panier atteint ${eur(x.panier)}, l'objectif est dépassé : un peu moins d'articles suffirait-il ?`;
          },
          solution: { articles: juste },
        };
      },
      explication: (c, p) => {
        const k = du(c);
        const x = moisAuxArticles(ficheDe(c), p.articles!);
        return [
          `Défi relevé : avec ${qte(x.articles)} articles, ${qte(x.articles - k.articles)} de plus qu'en janvier, l'indice de vente passe à ${qte(x.indice)} article par passage en caisse ; le panier monte à ${eur(x.panier)}, et la marge d'une vente à ${eur(x.marge)}. Sur le mois, la marge passe à ${eur(x.margeDuMois)}.`,
          "Faire prendre un article de plus à un client sur quelques-uns suffit : c'est la vente additionnelle, le geste du vendeur qui propose.",
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
        const { meilleur, moinsCher } = articleAConseiller(ficheDe(c));
        return [
          `Chez ${c.entreprise}, en janvier : un panier moyen de ${eur(k.panier)}, une vente qui coûte ${eur(k.coutDUneVente)}, une marge de ${eur(k.marge)} par vente.`,
          "Une vente de plus rapporte sa marge, pas son prix : le loyer et les salaires sont déjà là.",
          `Le panier se remplit aussi article par article : proposer l'article « ${meilleur.nom} » rapporte ${eur(meilleur.marge)} de marge, l'article « ${moinsCher.nom} » ${eur(moinsCher.marge)}. Dans l'arène, les chiffres de votre entreprise seront différents : le calcul du panier sera le même.`,
        ];
      },
      repere: () => "Marge d'une vente = panier moyen − coût d'une vente.",
    },
  ],
};
