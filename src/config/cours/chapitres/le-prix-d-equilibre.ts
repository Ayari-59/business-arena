import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";
import {
  ENTREPRISES_DU_MARCHE,
  dE,
  lireLeMarche,
  marcheDeReference,
  rang,
  stockDuDebut,
  type MarcheDuTrimestre,
} from "./l-offre-et-la-demande";

/**
 * CHAPITRE : LE PRIX QUI ÉQUILIBRE LE MARCHÉ (seconde, sciences économiques et sociales,
 * palier 1).
 *
 * Au début d'un trimestre, l'entreprise a décidé ce qu'elle met en vente ; les acheteurs, eux,
 * répondent au prix. À un prix trop bas, des acheteurs repartent sans être servis (la pénurie) ;
 * à un prix trop haut, une partie de l'offre reste sans acheteur, en stock ou en chambres vides
 * (l'excédent). L'élève cherche, comme l'économiste, le prix où la demande et l'offre se valent :
 * le prix d'équilibre.
 *
 * LA RECHERCHE EST JOUÉE PAR L'ARÈNE. Le trimestre est rejoué (`rejouerAvec`, clés
 * « le-prix-d-equilibre:t<trimestre>-… ») avec un autre prix, et rien d'autre : la quantité mise
 * en vente ce trimestre-là est celle que le bon gestionnaire avait décidée avant que le prix ne
 * change (le test vérifie qu'elle est la même à tous les prix). Le prix part de celui de l'année
 * et avance par pas de `PAS_DU_TATONNEMENT` du prix de l'année, vers le haut tant que la demande
 * dépasse l'offre, vers le bas tant que l'offre dépasse la demande, jusqu'au premier prix où la
 * situation s'inverse (`ESSAIS_AU_PLUS` pas au plus) : le tâtonnement du marché. Puis l'arène
 * rejoue le trimestre au milieu de l'intervalle trouvé, pour serrer le prix.
 *
 * Chaque prix est posé, jamais multiplié : le formulaire reconduirait la décision reçue. Seul le
 * trimestre étudié change ; les trimestres d'après, le bon gestionnaire réagit, mais le chapitre
 * ne les lit pas. Rien ne change avant le trimestre étudié : aucune défaillance ne peut le
 * précéder.
 *
 * LA MARGE D'ÉQUILIBRE (hypothèse du cours) : une demande et une offre qui ne s'écartent pas de
 * plus de `MARGE_D_EQUILIBRE` de l'offre se lisent comme égales. Le moteur ne tombe jamais sur
 * l'égalité exacte, et un écart de quelques unités ne change pas la lecture de l'économiste.
 *
 * Ce que le chapitre ne double pas : « La demande répond au prix » (bac STMG) mesure ce qu'une
 * hausse fait au chiffre d'affaires ; « Remplir l'hôtel » cherche le prix qui rapporte le plus
 * selon la saison ; « Décider : prix, fabriquer ou acheter » raisonne en marge. Ici, ni chiffre
 * d'affaires ni marge : le prix qui accorde la demande et l'offre, ce que l'économiste appelle
 * l'équilibre du marché.
 */

/** Le trimestre que le chapitre rejoue : le premier de l'année. */
export const TRIMESTRE_DU_MARCHE = 1;

/** Le pas du tâtonnement : 10 % du prix de l'année à chaque essai. */
export const PAS_DU_TATONNEMENT = 0.1;

/** Le nombre d'essais au plus, de part et d'autre du prix de l'année ; au-delà, le chapitre refuse de se calculer. */
export const ESSAIS_AU_PLUS = 8;

/** L'écart entre la demande et l'offre qui se lit comme l'équilibre : 1 % de l'offre (hypothèse du cours). */
export const MARGE_D_EQUILIBRE = 0.01;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export type SituationDuMarche = "penurie" | "excedent" | "equilibre";

/** Pénurie, excédent ou équilibre : la demande et l'offre d'un trimestre comparées, à la marge d'équilibre près. */
export function situationDuMarche(m: Pick<MarcheDuTrimestre, "demande" | "offre">): SituationDuMarche {
  if (Math.abs(m.demande - m.offre) <= MARGE_D_EQUILIBRE * m.offre) return "equilibre";
  return m.demande > m.offre ? "penurie" : "excedent";
}

/** Le trimestre `trimestre` de l'année du cours, rejoué au prix `prix` : seul ce prix change. */
export function marcheAuPrix(code: string, trimestre: number, prix: number, cle: string): MarcheDuTrimestre {
  const annee = rejouerAvec(code, `le-prix-d-equilibre:t${trimestre}-${cle}`, (tour, d) => (tour === trimestre ? { ...d, price: prix } : undefined));
  return lireLeMarche(annee[trimestre - 1]!, stockDuDebut(code, trimestre), prix);
}

/** Un essai du tâtonnement : le prix, son écart au prix de l'année (en pas), et le marché à ce prix. */
export interface Essai extends MarcheDuTrimestre {
  pas: number;
}

export type OuEstLEquilibre = "sous-le-milieu" | "au-milieu" | "au-dessus-du-milieu";

/**
 * LE TÂTONNEMENT : du prix de l'année, par pas de 10 %, jusqu'au premier prix où la situation
 * s'inverse ; puis le trimestre rejoué au milieu de l'intervalle.
 */
export function chercherLePrix(code: string, trimestre: number) {
  const depart = marcheDeReference(code, trimestre);
  const situation = situationDuMarche(depart);
  // Pénurie (ou équilibre par une demande au moins égale) : le prix monte ; excédent : il baisse.
  const sens = depart.demande >= depart.offre ? 1 : -1;
  const essais: Essai[] = [{ pas: 0, ...depart }];
  for (let k = 1; k <= ESSAIS_AU_PLUS; k++) {
    const facteur = Math.round((1 + sens * k * PAS_DU_TATONNEMENT) * 100) / 100;
    const m = marcheAuPrix(code, trimestre, auCentime(depart.prix * facteur), `prix-x${facteur}`);
    essais.push({ pas: sens * k, ...m });
    if ((m.demande - m.offre) * sens <= 0) break;
  }
  const dernier = essais.at(-1)!;
  const avant = essais.at(-2)!;
  if ((dernier.demande - dernier.offre) * sens > 0) {
    throw new Error(`Le marché de ${code} ne s'inverse pas en ${ESSAIS_AU_PLUS} pas de ${PAS_DU_TATONNEMENT * 100} %`);
  }
  const [bas, haut] = avant.prix < dernier.prix ? [avant, dernier] : [dernier, avant];
  const prixDuMilieu = auCentime((bas.prix + haut.prix) / 2);
  const milieu = marcheAuPrix(code, trimestre, prixDuMilieu, "milieu");
  const equilibre: OuEstLEquilibre =
    situationDuMarche(milieu) === "equilibre" ? "au-milieu" : milieu.demande > milieu.offre ? "au-dessus-du-milieu" : "sous-le-milieu";
  return {
    trimestre,
    depart,
    situation,
    sens,
    essais,
    avant,
    dernier,
    bas,
    haut,
    milieu,
    equilibre,
    /** Le prix d'équilibre est au-dessus du prix de l'année (pénurie) ou en dessous (excédent). */
    auDessus: sens > 0,
  };
}

export type RechercheDuPrix = ReturnType<typeof chercherLePrix>;

/** La recherche du chapitre : le 1er trimestre de l'année. */
export const prixDEquilibre = (c: Cas) => chercherLePrix(c.code, TRIMESTRE_DU_MARCHE);

/** « 64,90 €, 10 % plus cher » : le libellé d'un prix essayé. */
export const libelleDeLEssai = (e: Essai) =>
  e.pas === 0
    ? `${eur(e.prix)}, prix de l'année`
    : `${eur(e.prix)}, ${Math.round(Math.abs(e.pas) * PAS_DU_TATONNEMENT * 100)} % ${e.pas > 0 ? "plus cher" : "moins cher"}`;

/** L'écart entre la demande et l'offre, et son calcul. */
export const ecartDemandeOffre = (m: MarcheDuTrimestre) => m.demande - m.offre;
export const calculDeLEcart = (m: MarcheDuTrimestre) => `${qte(m.demande)} − ${qte(m.offre)} = ${qte(m.demande - m.offre)}`;

/** Une quantité et son unité, au singulier pour une seule : « 1 jour-conseil », « 266 enceintes ». */
export const enUnites = (n: number, c: Pick<Cas, "unite" | "unites">) => `${qte(n)} ${Math.abs(n) <= 1 ? c.unite : c.unites}`;

/** Ce que dit un marché à un prix, en une phrase : « la demande dépasse l'offre de 984 enceintes, et des acheteurs repartent sans être servis ». */
export function constat(m: MarcheDuTrimestre, c: Pick<Cas, "unite" | "unites">): string {
  const s = situationDuMarche(m);
  if (s === "penurie") return `la demande dépasse l'offre de ${enUnites(m.demande - m.offre, c)}, et des acheteurs repartent sans être servis`;
  if (s === "excedent") return `l'offre dépasse la demande de ${enUnites(m.offre - m.demande, c)}, et une partie reste sans acheteur`;
  return `la demande et l'offre se valent, à ${enUnites(Math.abs(m.demande - m.offre), c)} près`;
}

/** La situation au prix de l'année, à choisir : pénurie, excédent ou équilibre. */
export function optionsDeLaSituation(m: MarcheDuTrimestre, c: Pick<Cas, "unite" | "unites">) {
  const s = situationDuMarche(m);
  return [
    {
      texte: "En pénurie : des acheteurs repartent sans être servis",
      juste: s === "penurie",
      retour: s === "penurie" ? `Oui : ${constat(m, c)}.` : `Non : ${constat(m, c)}.`,
    },
    {
      texte: "En excédent : une partie de l'offre reste invendue",
      juste: s === "excedent",
      retour: s === "excedent" ? `Oui : ${constat(m, c)}.` : `Non : ${constat(m, c)}.`,
    },
    {
      texte: "À l'équilibre : la demande et l'offre se valent à peu près",
      juste: s === "equilibre",
      retour:
        s === "equilibre"
          ? `Oui : ${constat(m, c)}, moins de ${Math.round(MARGE_D_EQUILIBRE * 100)} % de l'offre.`
          : `Non : ${constat(m, c)}. L'écart dépasse ${Math.round(MARGE_D_EQUILIBRE * 100)} % de l'offre.`,
    },
  ];
}

/** Les trois réponses à « où est le prix d'équilibre ? », une fois l'intervalle coupé en deux. */
export function optionsDuMilieu(p: RechercheDuPrix, c: Pick<Cas, "unite" | "unites">) {
  const faits = `à ${eur(p.milieu.prix)}, ${constat(p.milieu, c)}`;
  return [
    {
      texte: `Entre ${eur(p.bas.prix)} et ${eur(p.milieu.prix)}`,
      juste: p.equilibre === "sous-le-milieu",
      retour:
        p.equilibre === "sous-le-milieu"
          ? `Oui : ${faits}. Le prix du milieu est déjà trop haut ; l'équilibre est en dessous.`
          : `Non : ${faits}.`,
    },
    {
      texte: `Entre ${eur(p.milieu.prix)} et ${eur(p.haut.prix)}`,
      juste: p.equilibre === "au-dessus-du-milieu",
      retour:
        p.equilibre === "au-dessus-du-milieu"
          ? `Oui : ${faits}. Le prix du milieu est encore trop bas ; l'équilibre est au-dessus.`
          : `Non : ${faits}.`,
    },
    {
      texte: `Tout près de ${eur(p.milieu.prix)}`,
      juste: p.equilibre === "au-milieu",
      retour:
        p.equilibre === "au-milieu"
          ? `Oui : ${faits}, moins de ${Math.round(MARGE_D_EQUILIBRE * 100)} % de l'offre.`
          : `Non : ${faits}. L'écart dépasse ${Math.round(MARGE_D_EQUILIBRE * 100)} % de l'offre.`,
    },
  ];
}

/** Où est le prix d'équilibre, en quelques mots : « entre 59 € et 61,95 € », « tout près de 61,95 € ». */
export const ouEstLePrix = (p: RechercheDuPrix) =>
  p.equilibre === "au-milieu"
    ? `tout près de ${eur(p.milieu.prix)}`
    : p.equilibre === "sous-le-milieu"
      ? `entre ${eur(p.bas.prix)} et ${eur(p.milieu.prix)}`
      : `entre ${eur(p.milieu.prix)} et ${eur(p.haut.prix)}`;

export function tableauDuDepart(c: Cas, p: RechercheDuPrix): TableauDeDonnees {
  const m = p.depart;
  return {
    titre: `Le marché ${dE(c.entreprise)} au ${rang(p.trimestre)} trimestre, au prix de l'année, en ${c.unites}`,
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
    titre: `Le ${rang(p.trimestre)} trimestre rejoué, prix après prix, en ${c.unites}`,
    colonnes: ["Demande reçue", "Mise en vente"],
    lignes: p.essais.map((e) => ({ libelle: libelleDeLEssai(e), valeurs: [qte(e.demande), qte(e.offre)] })),
  };
}

export function tableauDuMilieu(c: Cas, p: RechercheDuPrix): TableauDeDonnees {
  const cols = [p.bas, p.milieu, p.haut];
  return {
    titre: `Le ${rang(p.trimestre)} trimestre rejoué au milieu de l'intervalle, en ${c.unites}`,
    colonnes: cols.map((m) => `À ${eur(m.prix)}`),
    lignes: [
      { libelle: "Demande reçue", valeurs: cols.map((m) => qte(m.demande)) },
      { libelle: "Mise en vente", valeurs: cols.map((m) => qte(m.offre)) },
    ],
  };
}

export const LE_PRIX_D_EQUILIBRE: Chapitre = {
  code: "le-prix-d-equilibre",
  parcours: "seconde-ses",
  palier: 1,
  blocs: ["2de SES · Comment se forment les prix sur un marché ?"],
  titre: "Le prix qui équilibre le marché",
  accroche:
    "Trop bas, des acheteurs repartent sans rien ; trop haut, l'offre reste sans acheteur. L'arène rejoue le trimestre prix après prix pour trouver celui où la demande et l'offre se valent.",
  objectifs: [
    "Reconnaître une pénurie et un excédent sur un marché",
    "Dire dans quel sens le prix doit bouger pour rapprocher la demande de l'offre",
    "Chercher le prix d'équilibre par essais successifs",
    "Situer le prix d'équilibre entre deux prix essayés",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_MARCHE,
    pourquoi:
      "ce chapitre lit un seul marché, celui d'une offre unique vendue à l'unité : une gamme a un marché par article, et un club de sport sert d'abord ses abonnés.",
  },
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
          `Au début du ${rang(p.trimestre)} trimestre, ${c.entreprise} a décidé ce qu'elle mettait en vente : ${qte(p.depart.offre)} ${c.unites}. Les acheteurs, eux, répondent au prix : à ${eur(p.depart.prix)}, ils en ont demandé ${qte(p.depart.demande)}.`,
          "L'économiste raisonne ainsi : la quantité mise en vente est fixée pour le trimestre, et c'est le prix qui fait bouger la demande. L'arène peut rejouer ce trimestre à un autre prix, avec les mêmes concurrents : les acheteurs répondent au nouveau prix, la quantité mise en vente reste la même.",
        ];
      },
      repere: () =>
        "Pénurie : la demande dépasse l'offre, des acheteurs repartent sans être servis. Excédent : l'offre dépasse la demande, une partie reste sans acheteur. Équilibre : la demande et l'offre se valent.",
    },
    {
      id: "penurie-ou-excedent",
      type: "choix",
      titre: "Pénurie ou excédent",
      notions: ["demand_market_share", "stock"],
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Au prix de l'année, ${eur(p.depart.prix)}, dans quelle situation se trouve le marché ${dE(c.entreprise)} ?`;
      },
      options: (c) => optionsDeLaSituation(prixDEquilibre(c).depart, c),
    },
    {
      id: "dans-quel-sens",
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
                : p.situation === "excedent"
                  ? "Non : l'offre dépasse déjà la demande. Un prix plus haut ferait partir d'autres acheteurs, et plus d'offre encore resterait sans acheteur."
                  : "Non : la demande et l'offre se valent déjà. Un prix plus haut ferait partir des acheteurs, et une partie de l'offre resterait sans acheteur.",
          },
          {
            texte: "Baisser le prix",
            juste: p.situation === "excedent",
            retour:
              p.situation === "excedent"
                ? "Oui : un prix plus bas attire des acheteurs. La demande monte vers l'offre, et moins d'offre reste sans acheteur."
                : p.situation === "penurie"
                  ? "Non : la demande dépasse déjà l'offre. Un prix plus bas attirerait d'autres acheteurs, qui repartiraient sans rien."
                  : "Non : la demande et l'offre se valent déjà. Un prix plus bas attirerait des acheteurs qu'on ne pourrait pas servir.",
          },
          {
            texte: "Ne pas toucher au prix",
            juste: p.situation === "equilibre",
            retour:
              p.situation === "equilibre"
                ? `Oui : la demande et l'offre se valent déjà, à moins de ${Math.round(MARGE_D_EQUILIBRE * 100)} % de l'offre près. Le prix est à l'équilibre.`
                : `Non : ${constat(p.depart, c)}. Tant que l'écart demeure, le prix a une raison de bouger.`,
          },
        ];
      },
    },
    {
      id: "le-tatonnement",
      type: "montants",
      titre: "Le marché cherche son prix à tâtons",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: (c) => tableauDuTatonnement(c, prixDEquilibre(c)),
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Un marché cherche son prix à tâtons : tant que des acheteurs repartent sans être servis, le prix monte ; tant que l'offre reste sans acheteur, il baisse. L'arène l'a fait pour ${c.entreprise}, par pas de ${Math.round(PAS_DU_TATONNEMENT * 100)} % du prix de l'année, jusqu'au premier prix où la situation s'inverse. Calculez l'écart entre la demande reçue et la quantité mise en vente au prix de l'année, puis au dernier prix essayé, ${eur(p.dernier.prix)} (négatif quand l'offre dépasse la demande).`;
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
      type: "choix",
      titre: "Entre deux prix essayés",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuTatonnement(c, prixDEquilibre(c)),
      question: (c) => `Entre quels prix se trouve le prix qui équilibre le marché ${dE(c.entreprise)} au ${rang(TRIMESTRE_DU_MARCHE)} trimestre ?`,
      options: (c) => {
        const p = prixDEquilibre(c);
        const raison = `à ${eur(p.bas.prix)}, ${constat(p.bas, c)} ; à ${eur(p.haut.prix)}, ${constat(p.haut, c)}`;
        return [
          {
            texte: `Entre ${eur(p.bas.prix)} et ${eur(p.haut.prix)}`,
            juste: true,
            retour: `Oui : ${raison}. Le prix où la demande et l'offre se valent est entre les deux.`,
          },
          {
            texte: `En dessous de ${eur(p.bas.prix)}`,
            juste: false,
            retour: `Non : ${raison}. En dessous de ${eur(p.bas.prix)}, la demande dépasserait l'offre plus encore.`,
          },
          {
            texte: `Au-dessus de ${eur(p.haut.prix)}`,
            juste: false,
            retour: `Non : ${raison}. Au-dessus de ${eur(p.haut.prix)}, l'offre dépasserait la demande plus encore.`,
          },
        ];
      },
    },
    {
      id: "au-milieu",
      type: "montants",
      titre: "Un essai au milieu de l'intervalle",
      notions: ["price_elasticity", "demand_market_share"],
      tableau: (c) => tableauDuMilieu(c, prixDEquilibre(c)),
      question: (c) => {
        const p = prixDEquilibre(c);
        return `Pour serrer le prix, l'arène rejoue le trimestre au milieu de l'intervalle : (${eur(p.bas.prix)} + ${eur(p.haut.prix)}) ÷ 2 = ${eur(p.milieu.prix)}. Calculez l'écart entre la demande reçue et la quantité mise en vente à ce prix (négatif quand l'offre dépasse la demande).`;
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
      type: "choix",
      titre: "Le prix d'équilibre, serré de plus près",
      notions: ["price_elasticity"],
      tableau: (c) => tableauDuMilieu(c, prixDEquilibre(c)),
      question: (c) => `Après ce dernier essai, où se trouve le prix qui équilibre le marché ${dE(c.entreprise)} ?`,
      options: (c) => optionsDuMilieu(prixDEquilibre(c), c),
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["demand_market_share", "price_elasticity"],
      texte: (c) => {
        const p = prixDEquilibre(c);
        return [
          `Au prix de l'année, ${eur(p.depart.prix)}, ${constat(p.depart, c)}. Le prix qui équilibre le marché ${dE(c.entreprise)} au ${rang(p.trimestre)} trimestre se trouve ${ouEstLePrix(p)} : ${p.auDessus ? "au-dessus" : "en dessous"} du prix de l'année.`,
          "Sur un marché, quand la demande dépasse l'offre, les vendeurs peuvent monter leur prix ; quand l'offre dépasse la demande, ils doivent le baisser pour vendre. Le prix tend ainsi vers le prix d'équilibre, celui où la quantité demandée égale la quantité offerte : ni acheteur sans offre, ni offre sans acheteur.",
          "Ce prix n'est pas fixé une fois pour toutes : il bouge avec la saison, avec les concurrents, et avec ce que les vendeurs mettent en vente le trimestre suivant.",
        ];
      },
      repere: () =>
        "Prix d'équilibre : le prix auquel la quantité demandée égale la quantité offerte. En dessous, pénurie ; au-dessus, excédent.",
    },
  ],
};
