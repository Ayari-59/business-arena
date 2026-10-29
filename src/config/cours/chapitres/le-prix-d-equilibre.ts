import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  chercherLePrix as chercher,
  grille,
  marcheAuPrix,
  capacite,
  prixLePlusHautSansExcedent,
  prixLePlusProche,
  prixDeNova,
  situationDuMarche as situation,
  type Essai,
  type MarcheDuTrimestre,
  type RechercheDuPrix,
  type SituationDuMarche,
  type TrimestreLu,
} from "../monde/economie-et-marketing";
import { POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_MARCHE, dE, enUnites, rang } from "./l-offre-et-la-demande";

/**
 * CHAPITRE : LE PRIX QUI ÉQUILIBRE LE MARCHÉ (seconde, sciences économiques et sociales,
 * palier 1).
 *
 * NOVA envisage de mettre en vente, au premier trimestre, tout ce que sa ligne peut monter : 7 000
 * enceintes. Les acheteurs, eux, répondent au prix. À un prix trop bas, des acheteurs repartent sans
 * être servis (la pénurie) ; à un prix trop haut, une partie de l'offre reste sans acheteur
 * (l'excédent). L'élève cherche, comme l'économiste, le prix où la demande et l'offre se valent : le
 * prix d'équilibre. Le tâtonnement part de 59 € et avance par pas de 10 %, jusqu'au premier prix où la
 * situation s'inverse, puis essaie le milieu de l'intervalle. Puis l'expérience : un curseur (le prix
 * le plus haut sans excédent, à l'euro) et un laboratoire (le prix d'équilibre, au dixième d'euro).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/economie-et-marketing.ts) : la droite de demande du
 * premier trimestre (16 755 − 203 × prix), la ligne de 7 000 enceintes. HYPOTHÈSES DU CHAPITRE : toute
 * la ligne mise en vente ; une demande et une offre qui ne s'écartent pas de plus de 1 % de l'offre se
 * lisent comme égales (MARGE_D_EQUILIBRE). Au prix de 59 €, ce que NOVA a fabriqué (4 778 enceintes)
 * égale déjà la demande : c'est la ligne pleine qui crée l'excédent.
 *
 * CE QUI A CHANGÉ. L'arène rejouait le trimestre prix après prix, chez six entreprises ; le chapitre
 * lit la droite de NOVA seule : 4 778 enceintes demandées à 59 €, 7 173 à 47,20 €, l'équilibre entre
 * 47,20 € et 50,15 €.
 */

/** Le trimestre du chapitre : le premier de l'année. */
export const TRIMESTRE_DU_MARCHE = 1;

/** Le pas du tâtonnement : 10 % du prix à chaque essai (l'écart de prix de la fiche). */
export const PAS_DU_TATONNEMENT = 0.1;

/** Les bornes du curseur (à l'euro) et du laboratoire (au demi-euro). */
const PRIX_DU_CURSEUR = { min: 40, max: 59 } as const;
const PRIX_DU_LABORATOIRE = { min: 45, max: 59, pas: 0.1 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export type { SituationDuMarche };

const f = (c: Cas) => mercatiqueDe(c);
const pourCent = (c: Cas) => Math.round(f(c).margeDEquilibre * 100);

/** Pénurie, excédent ou équilibre, à 1 % de l'offre près. */
export const situationDuMarche = (c: Cas, m: Pick<MarcheDuTrimestre, "demande" | "offre">) => situation(f(c), m);

/** La recherche d'un trimestre : le tâtonnement et l'essai au milieu. */
export const chercherLePrix = (c: Cas, trimestre: TrimestreLu): RechercheDuPrix => chercher(f(c), trimestre);

/** L'offre du chapitre : toute la ligne, mise en vente au 1er trimestre (hypothèse du chapitre). */
export const offreDuChapitre = (c: Cas) => capacite(f(c));

/** La recherche du chapitre : le 1er trimestre, toute la ligne mise en vente. */
export const prixDEquilibre = (c: Cas) => chercher(f(c), TRIMESTRE_DU_MARCHE, offreDuChapitre(c));

/** « 64,90 €, 10 % plus cher » : le libellé d'un prix essayé. */
export const libelleDeLEssai = (e: Essai) =>
  e.pas === 0
    ? `${eur(e.prix)}, prix de départ`
    : `${eur(e.prix)}, ${Math.round(Math.abs(e.pas) * PAS_DU_TATONNEMENT * 100)} % ${e.pas > 0 ? "plus cher" : "moins cher"}`;

/** L'écart entre la demande et l'offre, et son calcul. */
export const ecartDemandeOffre = (m: MarcheDuTrimestre) => m.demande - m.offre;
export const calculDeLEcart = (m: MarcheDuTrimestre) => `${qte(m.demande)} − ${qte(m.offre)} = ${qte(m.demande - m.offre)}`;

/** Ce que dit un marché à un prix, en une phrase. */
export function constat(m: MarcheDuTrimestre, c: Cas): string {
  const s = situationDuMarche(c, m);
  if (s === "penurie") return `la demande dépasse l'offre de ${enUnites(m.demande - m.offre, c)}, et des acheteurs repartent sans être servis`;
  if (s === "excedent") return `l'offre dépasse la demande de ${enUnites(m.offre - m.demande, c)}, et une partie reste sans acheteur`;
  return `la demande et l'offre se valent, à ${enUnites(Math.abs(m.demande - m.offre), c)} près`;
}

/** La situation à un prix, à choisir : pénurie, excédent ou équilibre. */
export function optionsDeLaSituation(m: MarcheDuTrimestre, c: Cas) {
  const s = situationDuMarche(c, m);
  return [
    { texte: "En pénurie : des acheteurs repartent sans être servis", juste: s === "penurie", retour: s === "penurie" ? `Oui : ${constat(m, c)}.` : `Non : ${constat(m, c)}.` },
    { texte: "En excédent : une partie de l'offre reste invendue", juste: s === "excedent", retour: s === "excedent" ? `Oui : ${constat(m, c)}.` : `Non : ${constat(m, c)}.` },
    {
      texte: "À l'équilibre : la demande et l'offre se valent",
      juste: s === "equilibre",
      retour: s === "equilibre" ? `Oui : ${constat(m, c)}, moins de ${pourCent(c)} % de l'offre.` : `Non : ${constat(m, c)}. L'écart dépasse ${pourCent(c)} % de l'offre.`,
    },
  ];
}

/** Les trois réponses à « où est le prix d'équilibre ? », une fois l'intervalle coupé en deux. */
export function optionsDuMilieu(p: RechercheDuPrix, c: Cas) {
  const faits = `à ${eur(p.milieu.prix)}, ${constat(p.milieu, c)}`;
  return [
    {
      texte: `Entre ${eur(p.bas.prix)} et ${eur(p.milieu.prix)}`,
      juste: p.equilibre === "sous-le-milieu",
      retour: p.equilibre === "sous-le-milieu" ? `Oui : ${faits}. Le prix du milieu est déjà trop haut ; l'équilibre est en dessous.` : `Non : ${faits}.`,
    },
    {
      texte: `Entre ${eur(p.milieu.prix)} et ${eur(p.haut.prix)}`,
      juste: p.equilibre === "au-dessus-du-milieu",
      retour: p.equilibre === "au-dessus-du-milieu" ? `Oui : ${faits}. Le prix du milieu est encore trop bas ; l'équilibre est au-dessus.` : `Non : ${faits}.`,
    },
    {
      texte: `Tout près de ${eur(p.milieu.prix)}`,
      juste: p.equilibre === "au-milieu",
      retour: p.equilibre === "au-milieu" ? `Oui : ${faits}, moins de ${pourCent(c)} % de l'offre.` : `Non : ${faits}. L'écart dépasse ${pourCent(c)} % de l'offre.`,
    },
  ];
}

/** Où est le prix d'équilibre, en quelques mots. */
export const ouEstLePrix = (p: RechercheDuPrix) =>
  p.equilibre === "au-milieu"
    ? `tout près de ${eur(p.milieu.prix)}`
    : p.equilibre === "sous-le-milieu"
      ? `entre ${eur(p.bas.prix)} et ${eur(p.milieu.prix)}`
      : `entre ${eur(p.milieu.prix)} et ${eur(p.haut.prix)}`;

export function tableauDuDepart(c: Cas, p: RechercheDuPrix): TableauDeDonnees {
  const m = p.depart;
  return {
    titre: `Le marché ${dE(c.entreprise)} au ${rang(p.trimestre)} trimestre, en ${c.unites}`,
    colonnes: [`À ${eur(m.prix)}`],
    lignes: [
      { libelle: "Demande reçue", valeurs: [qte(m.demande)] },
      { libelle: "Quantité mise en vente", valeurs: [qte(m.offre)] },
      { libelle: "Quantité échangée", valeurs: [qte(m.echangee)] },
      { libelle: "Demande non servie", valeurs: [qte(m.nonServie)] },
      { libelle: "Offre non vendue", valeurs: [qte(m.nonVendue)] },
    ],
  };
}

export function tableauDuTatonnement(c: Cas, p: RechercheDuPrix): TableauDeDonnees {
  return {
    titre: `Le ${rang(p.trimestre)} trimestre, prix après prix, en ${c.unites}`,
    colonnes: ["Demande reçue", "Mise en vente"],
    lignes: p.essais.map((e) => ({ libelle: libelleDeLEssai(e), valeurs: [qte(e.demande), qte(e.offre)] })),
  };
}

export function tableauDuMilieu(c: Cas, p: RechercheDuPrix): TableauDeDonnees {
  const cols = [p.bas, p.milieu, p.haut];
  return {
    titre: `Le ${rang(p.trimestre)} trimestre au milieu de l'intervalle, en ${c.unites}`,
    colonnes: cols.map((m) => `À ${eur(m.prix)}`),
    lignes: [
      { libelle: "Demande reçue", valeurs: cols.map((m) => qte(m.demande)) },
      { libelle: "Mise en vente", valeurs: cols.map((m) => qte(m.offre)) },
    ],
  };
}

/** Le prix d'équilibre du laboratoire, au dixième d'euro : celui de la grille où la demande s'écarte le moins de l'offre. */
export const prixDuLaboratoire = (c: Cas) => prixLePlusProche(f(c), grille(PRIX_DU_LABORATOIRE.min, PRIX_DU_LABORATOIRE.max, PRIX_DU_LABORATOIRE.pas), offreDuChapitre(c));

export const LE_PRIX_D_EQUILIBRE: Chapitre = {
  code: "le-prix-d-equilibre",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "Le prix qui équilibre le marché",
  accroche:
    "Trop bas, des acheteurs repartent sans rien ; trop haut, l'offre reste sans acheteur. Chercher, prix après prix, celui où la demande et l'offre se valent.",
  objectifs: [
    "Reconnaître une pénurie et un excédent sur un marché",
    "Dire dans quel sens le prix doit bouger pour rapprocher la demande de l'offre",
    "Chercher le prix d'équilibre par essais successifs",
    "Situer le prix d'équilibre entre deux prix essayés",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_MARCHE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une offre décidée d'avance, des acheteurs qui répondent au prix",
      notions: ["demand_market_share", "stock"],
      tableau: (c) => tableauDuDepart(c, prixDEquilibre(c)),
      texte: (c) => {
        const p = prixDEquilibre(c);
        return [
          `Au ${rang(p.trimestre)} trimestre, ${c.entreprise} envisage de mettre en vente tout ce que sa ligne peut monter : ${qte(p.depart.offre)} ${c.unites}. Les acheteurs, eux, répondent au prix : à ${eur(p.depart.prix)}, ils en demandent ${qte(p.depart.demande)}.`,
          "L'économiste raisonne ainsi : la quantité mise en vente est fixée pour le trimestre, et c'est le prix qui fait bouger la demande. À un autre prix, les acheteurs répondent autrement ; la quantité mise en vente reste la même.",
        ];
      },
      repere: () =>
        "Pénurie : la demande dépasse l'offre, des acheteurs repartent sans être servis. Excédent : l'offre dépasse la demande, une partie reste sans acheteur. Équilibre : la demande et l'offre se valent.",
    },
    {
      id: "penurie-ou-excedent",
      objectifs: [0],
      type: "choix",
      titre: "Pénurie ou excédent",
      notions: ["demand_market_share", "stock"],
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Au prix ${dE(c.entreprise)}, ${eur(p.depart.prix)}, dans quelle situation se trouve son marché ?`;
      },
      options: (c) => optionsDeLaSituation(prixDEquilibre(c).depart, c),
    },
    {
      id: "dans-quel-sens",
      objectifs: [1],
      type: "choix",
      titre: "Dans quel sens bouger le prix",
      notions: ["price_elasticity"],
      question: () => "Pour que la demande se rapproche de la quantité mise en vente, dans quel sens faudrait-il faire bouger le prix ?",
      options: (c) => {
        const p = prixDEquilibre(c);
        return [
          {
            texte: "Monter le prix",
            juste: p.situation === "penurie",
            retour:
              p.situation === "penurie"
                ? "Oui : un prix plus haut fait renoncer une partie des acheteurs. La demande descend vers l'offre, et moins d'acheteurs repartent sans rien."
                : "Non : un prix plus haut ferait partir des acheteurs, et plus d'offre encore resterait sans acheteur.",
          },
          {
            texte: "Baisser le prix",
            juste: p.situation === "excedent",
            retour:
              p.situation === "excedent"
                ? "Oui : un prix plus bas attire des acheteurs. La demande monte vers l'offre, et moins d'offre reste sans acheteur."
                : "Non : un prix plus bas attirerait d'autres acheteurs, qu'on ne pourrait pas servir.",
          },
          {
            texte: "Ne pas toucher au prix",
            juste: p.situation === "equilibre",
            retour:
              p.situation === "equilibre"
                ? `Oui : la demande et l'offre se valent déjà, à moins de ${pourCent(c)} % de l'offre près.`
                : `Non : ${constat(p.depart, c)}. Tant que l'écart demeure, le prix a une raison de bouger.`,
          },
        ];
      },
    },
    {
      id: "le-tatonnement",
      objectifs: [2],
      type: "montants",
      titre: "Le marché cherche son prix à tâtons",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: (c) => tableauDuTatonnement(c, prixDEquilibre(c)),
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Un marché cherche son prix à tâtons : tant que des acheteurs repartent sans être servis, le prix monte ; tant que l'offre reste sans acheteur, il baisse. Le tableau le fait pour ${c.entreprise}, par pas de ${Math.round(PAS_DU_TATONNEMENT * 100)} % du prix, jusqu'au premier prix où la situation s'inverse. Calculez l'écart entre la demande reçue et la quantité mise en vente au prix de départ, puis au dernier prix essayé, ${eur(p.dernier.prix)} (négatif quand l'offre dépasse la demande).`;
      },
      champs: (c) => {
        const p = prixDEquilibre(c);
        return [
          { libelle: `Demande − offre, à ${eur(p.depart.prix)}`, attendu: ecartDemandeOffre(p.depart), calcul: calculDeLEcart(p.depart), tolerance: 0 },
          { libelle: `Demande − offre, à ${eur(p.dernier.prix)}`, attendu: ecartDemandeOffre(p.dernier), calcul: calculDeLEcart(p.dernier), tolerance: 0 },
        ];
      },
      explication: (c) => {
        const p = prixDEquilibre(c);
        return [
          `L'écart change de signe entre ${eur(p.avant.prix)} et ${eur(p.dernier.prix)} : à ${eur(p.avant.prix)}, ${constat(p.avant, c)} ; à ${eur(p.dernier.prix)}, ${constat(p.dernier, c)}.`,
          `La quantité mise en vente n'a pas bougé : ${qte(p.depart.offre)} ${c.unites} à chaque prix. Seule la demande a répondu au prix.`,
        ];
      },
    },
    {
      id: "l-intervalle",
      objectifs: [3],
      type: "choix",
      titre: "Entre deux prix essayés",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuTatonnement(c, prixDEquilibre(c)),
      question: (c) => `Entre quels prix se trouve le prix qui équilibre le marché ${dE(c.entreprise)} au ${rang(TRIMESTRE_DU_MARCHE)} trimestre ?`,
      options: (c) => {
        const p = prixDEquilibre(c);
        const raison = `à ${eur(p.bas.prix)}, ${constat(p.bas, c)} ; à ${eur(p.haut.prix)}, ${constat(p.haut, c)}`;
        return [
          { texte: `Entre ${eur(p.bas.prix)} et ${eur(p.haut.prix)}`, juste: true, retour: `Oui : ${raison}. Le prix où la demande et l'offre se valent est entre les deux.` },
          { texte: `En dessous de ${eur(p.bas.prix)}`, juste: false, retour: `Non : ${raison}. En dessous de ${eur(p.bas.prix)}, la demande dépasserait l'offre plus encore.` },
          { texte: `Au-dessus de ${eur(p.haut.prix)}`, juste: false, retour: `Non : ${raison}. Au-dessus de ${eur(p.haut.prix)}, l'offre dépasserait la demande plus encore.` },
        ];
      },
    },
    {
      id: "au-milieu",
      objectifs: [2],
      type: "montants",
      titre: "Un essai au milieu de l'intervalle",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: (c) => tableauDuMilieu(c, prixDEquilibre(c)),
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Pour serrer le prix, essayons le milieu de l'intervalle : (${eur(p.bas.prix)} + ${eur(p.haut.prix)}) ÷ 2 = ${eur(p.milieu.prix)}. Calculez l'écart entre la demande reçue et la quantité mise en vente à ce prix (négatif quand l'offre dépasse la demande).`;
      },
      champs: (c) => {
        const p = prixDEquilibre(c);
        return [{ libelle: `Demande − offre, à ${eur(p.milieu.prix)}`, attendu: ecartDemandeOffre(p.milieu), calcul: calculDeLEcart(p.milieu), tolerance: 0 }];
      },
      explication: (c) => {
        const p = prixDEquilibre(c);
        return [`À ${eur(p.milieu.prix)}, ${constat(p.milieu, c)}.`];
      },
    },
    {
      id: "le-prix-trouve",
      objectifs: [3],
      type: "choix",
      titre: "Le prix d'équilibre, serré de plus près",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuMilieu(c, prixDEquilibre(c)),
      question: (c) => `Après ce dernier essai, où se trouve le prix qui équilibre le marché ${dE(c.entreprise)} ?`,
      options: (c) => optionsDuMilieu(prixDEquilibre(c), c),
    },
    {
      id: "le-prix-sans-excedent",
      objectifs: [0, 3],
      type: "curseur",
      titre: "Le prix le plus haut sans excédent",
      notions: ["price_elasticity", "stock"],
      question: (c) =>
        `Faites varier le prix, à l'euro, avec les ${qte(offreDuChapitre(c))} ${c.unites} mises en vente. Une courbe donne ce que les acheteurs veulent dépenser à ce prix, l'autre ce que vaut toute l'offre à ce prix : tant que la seconde dépasse la première, des ${c.unites} restent sans acheteur. Placez le curseur sur le prix le plus haut auquel toute l'offre trouve acheteur, puis validez.`,
      grandeur: () => ({ libelle: "Prix de l'enceinte", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: prixLePlusHautSansExcedent(f(c), offreDuChapitre(c)), ...PRIX_DU_CURSEUR }),
      zones: ["Toute l'offre trouve acheteur", "Une partie de l'offre reste sans acheteur"],
      rates: () => ({
        dessous: "À ce prix, toute l'offre trouve acheteur, mais un prix plus haut le permettrait encore : cherchez le plus haut.",
        dessus: "À ce prix, l'offre dépasse la demande : une partie reste sans acheteur.",
      }),
      montrer: "Montrer le prix",
      lecture: (c, q) => {
        const m = marcheAuPrix(f(c), { prix: q, offre: offreDuChapitre(c) });
        return [
          { libelle: "Ce que les acheteurs veulent dépenser", montant: m.demande * q },
          { libelle: "Ce que vaut toute l'offre", montant: m.offre * q },
          { libelle: "Chiffre d'affaires des ventes", montant: m.echangee * q, fort: true },
        ];
      },
      droites: (c) => ({
        produit: (q) => marcheAuPrix(f(c), { prix: q, offre: offreDuChapitre(c) }).demande * q,
        cout: (q) => offreDuChapitre(c) * q,
        libelles: ["Ce que les acheteurs veulent dépenser", "Ce que vaut toute l'offre"],
      }),
      explication: (c) => {
        const p = prixLePlusHautSansExcedent(f(c), offreDuChapitre(c));
        const a = marcheAuPrix(f(c), { prix: p, offre: offreDuChapitre(c) });
        const b = marcheAuPrix(f(c), { prix: p + 1, offre: offreDuChapitre(c) });
        return [
          `À ${eur(p)}, les acheteurs demandent ${qte(a.demande)} ${c.unites}, au moins les ${qte(a.offre)} mises en vente : rien ne reste. À ${eur(p + 1)}, ils n'en demandent que ${qte(b.demande)} : ${enUnites(b.nonVendue, c)} restent sans acheteur.`,
          "Le prix d'équilibre est entre ces deux prix : l'euro ne suffit plus à le dire, il faut serrer davantage.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-equilibre",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de l'équilibre",
      notions: ["price_elasticity", "demand_market_share"],
      question: (c) =>
        `Faites varier le prix, au dixième d'euro, avec les ${qte(offreDuChapitre(c))} ${c.unites} mises en vente. Le tableau dit la demande et son écart avec l'offre. Relevez le défi.`,
      leviers: (c) => [{ code: "prix", libelle: "Prix de l'enceinte", unite: "€", ...PRIX_DU_LABORATOIRE, depart: prixDeNova(f(c)) }],
      lecture: (c, p) => {
        const m = marcheAuPrix(f(c), { prix: p.prix!, offre: offreDuChapitre(c) });
        const d = marcheAuPrix(f(c), { offre: offreDuChapitre(c) });
        return [
          { libelle: "Demande reçue", montant: m.demande, unite: c.unites, reference: d.demande },
          { libelle: "Quantité mise en vente", montant: m.offre, unite: c.unites },
          { libelle: "Demande − offre", montant: m.demande - m.offre, unite: c.unites, reference: d.demande - d.offre, fort: true },
        ];
      },
      graphique: (c) => ({
        levier: "prix",
        unite: c.unites,
        courbes: [
          { libelle: "Demande reçue", valeur: (p) => marcheAuPrix(f(c), { prix: p.prix!, offre: offreDuChapitre(c) }).demande },
          { libelle: "Quantité mise en vente", valeur: () => offreDuChapitre(c) },
        ],
      }),
      defi: (c) => {
        const juste = prixDuLaboratoire(c);
        return {
          consigne: "Trouvez le prix, au dixième d'euro, auquel la demande s'écarte le moins de l'offre.",
          atteint: (p) => Math.abs(p.prix! - juste) < 1e-9,
          indice: (p) => {
            const m = marcheAuPrix(f(c), { prix: p.prix!, offre: offreDuChapitre(c) });
            return `À ${eur(m.prix)}, ${constat(m, c)} : ${m.demande > m.offre ? "il faut monter le prix" : "il faut baisser le prix"}.`;
          },
          solution: { prix: juste },
        };
      },
      explication: (c, p) => {
        const m = marcheAuPrix(f(c), { prix: p.prix!, offre: offreDuChapitre(c) });
        return [
          `Défi relevé : à ${eur(m.prix)}, ${constat(m, c)}. Dix centimes plus bas ou plus haut, l'écart serait plus grand.`,
          "C'est le prix d'équilibre : celui où la quantité demandée égale la quantité offerte.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const p = prixDEquilibre(c);
        const juste = prixDuLaboratoire(c);
        return [
          `Au prix ${dE(c.entreprise)}, ${eur(p.depart.prix)}, ${constat(p.depart, c)}. Le prix qui équilibre son marché au ${rang(p.trimestre)} trimestre se trouve ${ouEstLePrix(p)}, à ${eur(juste)} au dixième d'euro près : ${p.auDessus ? "au-dessus" : "en dessous"} de son prix.`,
          "Sur un marché, quand la demande dépasse l'offre, les vendeurs peuvent monter leur prix ; quand l'offre dépasse la demande, ils doivent le baisser pour vendre. Le prix tend ainsi vers le prix d'équilibre, celui où la quantité demandée égale la quantité offerte : ni acheteur sans offre, ni offre sans acheteur.",
          "Ce prix n'est pas fixé une fois pour toutes : il bouge avec la saison, avec les concurrents, et avec ce que les vendeurs mettent en vente. Dans l'arène, la colonne « Manqué » du marché du tour dit de quel côté vous êtes.",
        ];
      },
      repere: () => "Prix d'équilibre : le prix auquel la quantité demandée égale la quantité offerte. En dessous, pénurie ; au-dessus, excédent.",
    },
  ],
};
