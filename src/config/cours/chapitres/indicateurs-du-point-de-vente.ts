import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { ARTICLES_PAR_TICKET } from "../../scenarios/sector-kpis";
import { accord, accordPluriel } from "../accords";
import type { Cas } from "../cas";
import { OBJECTIF_DE_HAUSSE } from "../point-de-vente";
import type { Chapitre } from "../types";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : LES INDICATEURS DU POINT DE VENTE (BTS MCO, palier 2).
 *
 * Ce que le manager lit chaque soir : le chiffre d'affaires, le nombre de clients, le panier
 * moyen, et l'indicateur qui fait son métier. Chez MAILLE & CO, le taux de transformation et
 * les ventes manquées faute de stock ; chez PIXEL & CO, ce que coûte un nouveau client ; chez
 * LA TABLE D'AUGUSTIN, le remplissage de la salle. Puis les deux leviers d'un objectif de
 * chiffre d'affaires : plus de clients, ou un panier plus rempli.
 *
 * LES INDICATEURS SONT CEUX DE L'ARÈNE. Chaque calcul est celui que l'arène affiche dans ses
 * « Indicateurs du métier » (`config/scenarios/sector-kpis.ts`), sur le marché du premier
 * trimestre ramené à un mois (`cas.marche`). L'arène ne compte pas les entrées en magasin ni
 * les visites du site : son taux de transformation rapporte les ventes à la demande que le
 * marché a adressée à l'entreprise, et le chapitre le dit. La seule hypothèse du cours,
 * l'objectif de progression, est dans `point-de-vente.ts`.
 */

const auDixieme = (x: number) => Math.round(x * 10) / 10;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « de commandes », mais « d'articles » : l'élision devant une voyelle. */
const dE = (mot: string) => (/^[aeiouyéèê]/i.test(mot) ? `d'${mot}` : `de ${mot}`);

/** Le nom de l'indicateur du panier, tel que l'arène l'affiche pour ce métier. */
export function nomDuPanier(c: Cas): string {
  const kpi = scenarioByCode(c.code).kpis.find((k) => k.key === "panier_moyen" || k.key === "ticket_moyen");
  if (!kpi) throw new Error(`Pas d'indicateur de panier pour ${c.code}`);
  return kpi.label;
}

/** Ce que l'on compte comme un client : un passage en caisse, une commande, un couvert. */
export function clientDe(c: Cas) {
  if (c.code === "boutique") return { singulier: "passage en caisse", pluriel: "passages en caisse", unitesParClient: ARTICLES_PAR_TICKET };
  return { singulier: c.unite, pluriel: c.unites, unitesParClient: 1 };
}

/** Les indicateurs du mois, tels que l'arène les calcule. */
export function indicateurs(c: Cas) {
  const m = c.marche;
  const demande = m.clienteles.reduce((t, x) => t + x.demande, 0);
  const ventes = m.clienteles.reduce((t, x) => t + x.vendu, 0);
  const manque = m.clienteles.reduce((t, x) => t + x.manque, 0);
  const chiffreDAffaires = m.clienteles.reduce((t, x) => t + x.chiffreDAffaires, 0);
  const client = clientDe(c);
  const clients = Math.round(ventes / client.unitesParClient);
  const panier = auCentime(chiffreDAffaires / clients);
  const prixMoyen = auCentime(chiffreDAffaires / ventes);
  const acquisition = m.clienteles.find((x) => x.code === "acquisition");
  const caVise = Math.round(chiffreDAffaires * (1 + OBJECTIF_DE_HAUSSE));
  return {
    nomDuPanier: nomDuPanier(c),
    client,
    demande,
    ventes,
    manque,
    chiffreDAffaires,
    clients,
    panier,
    prixMoyen,
    transformation: auDixieme((ventes / demande) * 100),
    caManque: Math.round(manque * prixMoyen),
    capacite: m.capacite,
    remplissage: auDixieme((ventes / m.capacite) * 100),
    libres: m.capacite - ventes,
    marketing: m.marketing,
    nouveaux: acquisition?.vendu ?? 0,
    cac: acquisition ? auCentime(m.marketing / acquisition.vendu) : 0,
    margeParCommande: auCentime(c.gestion.prixMoyen - c.gestion.coutVariableUnitaire),
    caVise,
    panierVise: auCentime(caVise / clients),
    clientsVises: Math.ceil(caVise / panier - 1e-9),
  };
}

/** Le métier qui a des ventes manquées, celui qui achète son trafic, celui qui remplit une salle. */
const aDesRuptures = (c: Cas) => indicateurs(c).manque > 0;
const acheteSonTrafic = (c: Cas) => c.marche.clienteles.some((x) => x.code === "acquisition");
const remplitUneSalle = (c: Cas) => scenarioByCode(c.code).kpis.some((k) => k.key === "remplissage");

export const INDICATEURS_DU_POINT_DE_VENTE: Chapitre = {
  code: "indicateurs-du-point-de-vente",
  parcours: "mco",
  palier: 2,
  blocs: [
    "BTS MCO Bloc 3 · Assurer la gestion opérationnelle",
  ],
  titre: "Les indicateurs du point de vente",
  accroche:
    "Ce que le manager lit chaque soir : le chiffre d'affaires, les clients, le panier moyen, et l'indicateur qui fait son métier. Puis deux façons d'atteindre un objectif.",
  objectifs: [
    "Lire les ventes d'un mois, clientèle par clientèle",
    "Calculer le panier moyen, ou le ticket moyen",
    "Calculer l'indicateur du métier : taux de transformation, coût d'acquisition ou taux de remplissage",
    "Chiffrer ce que coûtent des ventes manquées",
    "Comparer deux leviers pour atteindre un objectif de chiffre d'affaires",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre suit les indicateurs d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le soir, à la fermeture",
      notions: ["average_basket", "conversion_rate"],
      texte: (c) => {
        const k = indicateurs(c);
        return [
          `Le soir, le manager de ${c.entreprise} ne lit pas le compte de résultat : il lit quelques chiffres, toujours les mêmes. Combien a-t-on vendu, à combien de clients, pour quel ${k.nomDuPanier.toLowerCase()}, et l'indicateur qui fait le métier.`,
          "Le tableau donne le mois de l'arène, clientèle par clientèle : la demande que le marché a adressée à l'entreprise, ce qu'elle a vendu, ce qu'elle a manqué faute de stock ou de place, et ce que chaque clientèle a rapporté hors taxes.",
        ];
      },
      repere: () => "Un indicateur se lit toujours comparé : au mois dernier, à l'objectif, ou au magasin voisin.",
      tableau: (c) => tableauDuMois(c),
    },
    {
      id: "le-mois",
      type: "montants",
      titre: "Les ventes du mois",
      notions: ["revenue"],
      tableau: (c) => tableauDuMois(c),
      question: (c) => `Additionnez les clientèles : quel chiffre d'affaires hors taxes ${c.entreprise} a-t-elle fait ce mois-ci, et combien ${dE(c.unites)} a-t-elle ${accordPluriel(c, "vendu")} ?`,
      champs: (c) => {
        const k = indicateurs(c);
        const lignes = c.marche.clienteles;
        return [
          { libelle: "Chiffre d'affaires du mois", attendu: k.chiffreDAffaires, calcul: `${lignes.map((x) => eur(x.chiffreDAffaires)).join(" + ")} = ${eur(k.chiffreDAffaires)}` },
          { libelle: `${majuscule(c.unites)} ${accordPluriel(c, "vendu")}`, attendu: k.ventes, calcul: `${lignes.map((x) => qte(x.vendu)).join(" + ")} = ${qte(k.ventes)}` },
        ];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [`${c.entreprise} a vendu ${qte(k.ventes)} ${c.unites} pour ${eur(k.chiffreDAffaires)}, soit ${eur(k.prixMoyen)} en moyenne par ${c.unite}.`];
      },
    },
    {
      id: "le-panier",
      type: "montants",
      titre: "Le panier moyen",
      notions: ["average_basket"],
      question: (c) => {
        const k = indicateurs(c);
        return k.client.unitesParClient > 1
          ? `Un client achète souvent plus d'un article. Comme l'arène, comptez ${qte(k.client.unitesParClient)} article par passage en caisse. Calculez le nombre de passages en caisse du mois (à l'unité), puis le ${k.nomDuPanier.toLowerCase()} : le chiffre d'affaires divisé par les passages.`
          : `Chez ${c.entreprise}, un client, c'est ${accord(c, "un")} ${c.unite}. Calculez le ${k.nomDuPanier.toLowerCase()} du mois : le chiffre d'affaires divisé par le nombre de ${c.unites}.`;
      },
      champs: (c) => {
        const k = indicateurs(c);
        const panier = {
          libelle: k.nomDuPanier,
          attendu: k.panier,
          calcul: `${eur(k.chiffreDAffaires)} ÷ ${qte(k.clients)} = ${eur(k.panier)}`,
          // Le nombre de passages arrondi à l'unité déplace le panier de quelques centimes.
          tolerance: 0.05,
        };
        return k.client.unitesParClient > 1
          ? [{ libelle: "Passages en caisse", attendu: k.clients, calcul: `${qte(k.ventes)} ÷ ${qte(k.client.unitesParClient)} = ${qte(k.clients)}`, tolerance: 1 }, panier]
          : [panier];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [
          `Chaque ${k.client.singulier} rapporte en moyenne ${eur(k.panier)} hors taxes. C'est le chiffre que l'arène affiche dans ses indicateurs du métier, sous le nom « ${k.nomDuPanier} ».`,
        ];
      },
    },
    {
      id: "transformation",
      type: "montants",
      titre: "Le taux de transformation",
      notions: ["conversion_rate", "stock"],
      si: aDesRuptures,
      tableau: (c) => tableauDuMois(c),
      question: (c) => {
        const k = indicateurs(c);
        return `L'arène ne compte pas les entrées en boutique : son taux de transformation rapporte les ventes à la demande adressée à ${c.entreprise} (${qte(k.demande)} ${c.unites}). Calculez-le, au dixième, puis les ventes manquées du mois, et ce qu'elles auraient rapporté au prix moyen de ${eur(k.prixMoyen)} (à l'euro).`;
      },
      champs: (c) => {
        const k = indicateurs(c);
        return [
          { libelle: "Taux de transformation (%)", attendu: k.transformation, calcul: `${qte(k.ventes)} ÷ ${qte(k.demande)} × 100 = ${pct(k.transformation)}`, tolerance: 0.1 },
          { libelle: "Ventes manquées", attendu: k.manque, calcul: `${c.marche.clienteles.map((x) => qte(x.manque)).join(" + ")} = ${qte(k.manque)}`, tolerance: 1 },
          { libelle: "Chiffre d'affaires manqué", attendu: k.caManque, calcul: `${qte(k.manque)} × ${eur(k.prixMoyen)} = ${eur(k.caManque)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [
          `Sur ${qte(k.demande)} ${c.unites} ${accordPluriel(c, "demandé")}, ${c.entreprise} en a vendu ${qte(k.ventes)} : ${pct(k.transformation)}. Les ${qte(k.manque)} autres sont repartis faute d'article en rayon, soit ${eur(k.caManque)} de chiffre d'affaires laissés au concurrent.`,
        ];
      },
    },
    {
      id: "pourquoi-manquees",
      type: "choix",
      titre: "Le rayon vide",
      notions: ["stock", "conversion_rate"],
      si: aDesRuptures,
      question: (c) => `Des clients sont venus pour ${qte(indicateurs(c).manque)} ${c.unites} que ${c.entreprise} n'avait pas. Quelle décision de l'arène agit d'abord sur ces ventes manquées ?`,
      options: (c) => {
        const v = scenarioByCode(c.code).vocabulary;
        return [
          {
            texte: `Mettre plus d'articles en rayon : la décision « ${v.productionPlanLabel} ».`,
            juste: true,
            retour: "Oui. Une vente manquée est une vente que le client voulait faire : il suffisait d'avoir l'article. Commander plus a un coût (le stock qui reste), mais chaque rupture est du chiffre d'affaires perdu.",
          },
          {
            texte: "Augmenter le budget marketing pour attirer plus de clients.",
            juste: false,
            retour: "Plus de clients, sans plus d'articles, ce sont plus de clients qui repartent les mains vides : les ventes manquées augmentent.",
          },
          {
            texte: "Baisser le prix de vente.",
            juste: false,
            retour: "Un prix plus bas attire encore plus de demande, sur un rayon qui ne peut déjà pas la servir. Il faut d'abord de quoi vendre.",
          },
        ];
      },
    },
    {
      id: "acquisition",
      type: "montants",
      titre: "Ce que coûte un nouveau client",
      notions: ["customer_acquisition_cost"],
      si: acheteSonTrafic,
      tableau: (c) => tableauDuMois(c),
      question: (c) => {
        const k = indicateurs(c);
        return `${c.entreprise} achète son trafic : ${eur(k.marketing)} de budget marketing ce mois-ci, pour ${qte(k.nouveaux)} commandes de nouveaux clients. Calculez le coût d'acquisition d'un nouveau client (au centime), puis la marge d'une commande : ${eur(c.gestion.prixMoyen)} de prix moyen, moins ${eur(c.gestion.coutVariableUnitaire)} de coûts variables.`;
      },
      champs: (c) => {
        const k = indicateurs(c);
        return [
          { libelle: "Coût d'acquisition", attendu: k.cac, calcul: `${eur(k.marketing)} ÷ ${qte(k.nouveaux)} = ${eur(k.cac)}` },
          { libelle: "Marge d'une commande", attendu: k.margeParCommande, calcul: `${eur(c.gestion.prixMoyen)} − ${eur(c.gestion.coutVariableUnitaire)} = ${eur(k.margeParCommande)}` },
        ];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [
          k.cac < k.margeParCommande
            ? `Un nouveau client coûte ${eur(k.cac)} et sa première commande laisse ${eur(k.margeParCommande)} : il rapporte dès le premier achat. S'il revient, chaque commande suivante ne coûte plus rien en acquisition.`
            : `Un nouveau client coûte ${eur(k.cac)} et sa première commande ne laisse que ${eur(k.margeParCommande)} : il faut qu'il revienne pour que la dépense se rembourse.`,
        ];
      },
    },
    {
      id: "remplissage",
      type: "montants",
      titre: "Le taux de remplissage",
      notions: ["capacity"],
      si: remplitUneSalle,
      question: (c) => {
        const k = indicateurs(c);
        return `La salle de ${c.entreprise} peut servir ${qte(k.capacite)} ${c.unites} par mois ; elle en a servi ${qte(k.ventes)}. Calculez le taux de remplissage, au dixième, puis le nombre de ${c.unites} restés libres.`;
      },
      champs: (c) => {
        const k = indicateurs(c);
        return [
          { libelle: "Taux de remplissage (%)", attendu: k.remplissage, calcul: `${qte(k.ventes)} ÷ ${qte(k.capacite)} × 100 = ${pct(k.remplissage)}`, tolerance: 0.1 },
          { libelle: `${majuscule(c.unites)} libres`, attendu: k.libres, calcul: `${qte(k.capacite)} − ${qte(k.ventes)} = ${qte(k.libres)}` },
        ];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [
          `${pct(k.remplissage)} de la salle est occupée. Les ${qte(k.libres)} ${c.unites} libres ne coûtent rien de plus en loyer ni en brigade : chacun d'eux, vendu, serait presque tout entier de la marge.`,
        ];
      },
    },
    {
      id: "deux-leviers",
      type: "montants",
      titre: "Deux leviers pour un objectif",
      notions: ["average_basket", "revenue"],
      question: (c) => {
        const k = indicateurs(c);
        return `La direction fixe un objectif : ${pct(OBJECTIF_DE_HAUSSE * 100)} de chiffre d'affaires en plus. Calculez le chiffre d'affaires visé (à l'euro), puis les deux façons d'y arriver : le ${k.nomDuPanier.toLowerCase()} nécessaire avec autant de ${k.client.pluriel}, ou le nombre de ${k.client.pluriel} nécessaire avec le même ${k.nomDuPanier.toLowerCase()} (arrondi au-dessus).`;
      },
      champs: (c) => {
        const k = indicateurs(c);
        return [
          { libelle: "Chiffre d'affaires visé", attendu: k.caVise, calcul: `${eur(k.chiffreDAffaires)} × ${(1 + OBJECTIF_DE_HAUSSE).toLocaleString("fr-FR")} = ${eur(k.caVise)}`, tolerance: 1 },
          { libelle: `${k.nomDuPanier} nécessaire`, attendu: k.panierVise, calcul: `${eur(k.caVise)} ÷ ${qte(k.clients)} = ${eur(k.panierVise)}`, tolerance: 0.05 },
          { libelle: `${majuscule(k.client.pluriel)} nécessaires`, attendu: k.clientsVises, calcul: `${eur(k.caVise)} ÷ ${eur(k.panier)} = ${qte(k.clientsVises)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = indicateurs(c);
        return [
          `Pour ${eur(k.caVise)}, il faut ou bien ${eur(k.panierVise)} par ${k.client.singulier} au lieu de ${eur(k.panier)}, ou bien ${qte(k.clientsVises)} ${k.client.pluriel} au lieu de ${qte(k.clients)}. Le chiffre d'affaires, c'est toujours des clients multipliés par un panier.`,
        ];
      },
    },
    {
      id: "quel-levier",
      type: "choix",
      titre: "Le levier le moins cher",
      notions: ["average_basket", "customer_acquisition_cost"],
      question: (c) => `Pour ${c.entreprise}, lequel des deux leviers coûte en général le moins ?`,
      options: (c) => {
        const k = indicateurs(c);
        return [
          {
            texte: `Remplir le panier : le client est déjà là.`,
            juste: true,
            retour: `Oui. Vendre un peu plus à chaque ${k.client.singulier} (un conseil, un produit complémentaire, une montée en gamme) ne demande pas d'attirer quelqu'un de nouveau. Attirer un client, au contraire, se paie en publicité, en promotions ou en emplacement.`,
          },
          {
            texte: "Attirer plus de clients : le panier ne se commande pas.",
            juste: false,
            retour: "Le panier se travaille : la vente additionnelle, le merchandising, les offres groupées. Et chaque nouveau client a un coût d'acquisition.",
          },
          {
            texte: "Les deux coûtent pareil : seul le résultat compte.",
            juste: false,
            retour: "Ils n'ont pas le même coût. Le client présent coûte peu à servir davantage ; le client à venir coûte d'abord ce qu'il faut pour le faire venir.",
          },
        ];
      },
    },
  ],
};

/** Le mois de l'arène, clientèle par clientèle. */
function tableauDuMois(c: Cas) {
  return {
    titre: `${c.entreprise} · le mois, clientèle par clientèle`,
    colonnes: ["Demande", "Vendu", "Manqué", "Chiffre d'affaires HT"],
    lignes: c.marche.clienteles.map((x) => ({
      libelle: x.nom,
      valeurs: [qte(x.demande), qte(x.vendu), qte(x.manque), eur(x.chiffreDAffaires)],
    })),
  };
}
