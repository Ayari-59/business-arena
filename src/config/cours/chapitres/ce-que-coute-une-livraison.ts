import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ENCEINTES_PAR_PALETTE,
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  MESSAGERIE_PAR_PALETTE,
  PORTEUR,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  ROUTE_DE_CAMPUSTECH,
  livraisonsDuMois,
  tourneeDuMois,
  type ModeDeLivraison,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : CE QUE COÛTE UNE LIVRAISON (2de pro GATL, palier 1).
 *
 * Chaque mois, NOVA livre 320 enceintes à CampusTech, son client professionnel (nova-gestion.ts). Elle
 * loue pour la journée un porteur de 12 palettes avec son chauffeur, et fait la route : 240 km aller
 * et retour. Le chapitre calcule ce que coûte la tournée (la journée du camion et du chauffeur, qui
 * ne dépend pas du chargement ; la route, qui dépend des kilomètres), ce que coûtent une palette et
 * une enceinte livrées, puis compare la tournée à la messagerie (85 € la palette).
 *
 * L'EXPÉRIENCE. Un curseur : le plus petit nombre de palettes à partir duquel la tournée coûte moins
 * que la messagerie (6). Un laboratoire : la façon la moins chère de livrer le mois (une tournée).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/production-et-logistique.ts : la palette, le
 * porteur, la route et la messagerie sont ses hypothèses). CE QUI A CHANGÉ : il se jouait chez
 * ROUTE & CIE, le transporteur de l'arène, qui ne connaît pas les kilomètres ; il se joue chez NOVA.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_LA_LIVRAISON: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** Les bornes du curseur (les palettes livrées en une tournée). */
const PALETTES_DU_CURSEUR = { min: 0, max: 12 } as const;

/** Les deux leviers du laboratoire : la façon de livrer, et le nombre de livraisons dans le mois. */
const MODES: readonly { valeur: number; mode: ModeDeLivraison; libelle: string }[] = [
  { valeur: 0, mode: "messagerie", libelle: "La messagerie" },
  { valeur: 1, mode: "tournee", libelle: "Une tournée au porteur" },
];
const FOIS: readonly number[] = [1, 2, 4];
/** Au départ du laboratoire : la messagerie, deux fois par mois, comme CampusTech le demandait l'an passé. */
const DEPART_DU_LABORATOIRE = { mode: 0, fois: 2 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");

const modeDe = (v: number) => MODES.find((m) => m.valeur === v)!.mode;

/** La tournée du mois et ce qu'elle coûte. */
export const coutDUneLivraison = () => tourneeDuMois();

/** Les palettes à partir desquelles la tournée coûte moins que la messagerie. */
export const palettesQuiPaientLaTournee = () => Math.ceil(tourneeDuMois().cout.total / MESSAGERIE_PAR_PALETTE - 1e-9);

/** La façon la moins chère de livrer le mois, parmi les positions du laboratoire. */
export function livraisonDuLaboratoire() {
  const positions = MODES.flatMap((m) => FOIS.map((n) => ({ mode: m.valeur, fois: n, cout: livraisonsDuMois(m.mode, n).cout })));
  return positions.reduce((a, b) => (b.cout < a.cout ? b : a));
}

function tableauDeLaTournee(c: Cas): TableauDeDonnees {
  const t = tourneeDuMois();
  return {
    titre: `La tournée du mois chez CampusTech`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} à livrer`, valeurs: [qte(t.enceintes)] },
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} par palette`, valeurs: [qte(ENCEINTES_PAR_PALETTE)] },
      { libelle: "Location du porteur, pour la journée", valeurs: [eur(PORTEUR.location)] },
      { libelle: "Chauffeur, pour la journée", valeurs: [eur(PORTEUR.chauffeur)] },
      { libelle: "Kilomètres, aller et retour", valeurs: [qte(ROUTE_DE_CAMPUSTECH.km)] },
      { libelle: "Gazole et péages, par kilomètre", valeurs: [eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm)] },
      { libelle: "Messagerie, par palette", valeurs: [eur(MESSAGERIE_PAR_PALETTE)] },
    ],
  };
}

export const CE_QUE_COUTE_UNE_LIVRAISON: Chapitre = {
  code: "ce-que-coute-une-livraison",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion"],
  titre: "Ce que coûte une livraison",
  accroche: "La journée du camion et du chauffeur, le gazole et les péages de la route : ce que coûte une tournée, ce que coûte une palette livrée, et quand la messagerie revient moins cher.",
  objectifs: [
    "Calculer le coût d'une tournée",
    "Distinguer ce qui dépend des kilomètres et ce qui n'en dépend pas",
    "Calculer le coût d'une palette et d'un produit livrés",
    "Comparer une tournée et la messagerie",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_LIVRAISON, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une tournée chez CampusTech",
      notions: ["variable_costs", "fixed_costs"],
      tableau: tableauDeLaTournee,
      texte: (c) => [
        `Chaque mois, ${c.entreprise} livre ${qte(tourneeDuMois().enceintes)} ${c.unites} à CampusTech. Elle n'a pas de camion : elle loue pour la journée un porteur de ${qte(PORTEUR.places)} palettes avec son chauffeur, et fait la route jusqu'à l'entrepôt du client.`,
        "La journée du camion et du chauffeur coûte la même chose, que le porteur parte plein ou presque vide. La route, elle, coûte selon les kilomètres : le gazole et les péages.",
        `Un transporteur de messagerie propose aussi de prendre chaque palette, pour ${eur(MESSAGERIE_PAR_PALETTE)}.`,
      ],
      repere: () => "Coût d'une tournée = location + chauffeur + kilomètres × coût d'un kilomètre.",
    },
    {
      id: "la-tournee",
      objectifs: [0, 1],
      type: "montants",
      titre: "Ce que coûte la tournée",
      notions: ["variable_costs", "fixed_costs"],
      tableau: tableauDeLaTournee,
      question: () => "Calculez ce que coûte la journée (location et chauffeur), ce que coûte la route (kilomètres × gazole et péages), puis la tournée entière.",
      champs: () => {
        const t = tourneeDuMois();
        return [
          { libelle: "La journée du porteur et du chauffeur", attendu: t.cout.journee, calcul: `${eur(t.cout.location)} + ${eur(t.cout.chauffeur)} = ${eur(t.cout.journee)}` },
          { libelle: "La route", attendu: t.cout.route, calcul: `${qte(ROUTE_DE_CAMPUSTECH.km)} × ${eur(ROUTE_DE_CAMPUSTECH.gazoleEtPeagesParKm)} = ${eur(t.cout.route)}` },
          { libelle: "La tournée", attendu: t.cout.total, calcul: `${eur(t.cout.journee)} + ${eur(t.cout.route)} = ${eur(t.cout.total)}` },
        ];
      },
      explication: () => {
        const t = tourneeDuMois();
        return [`La journée pèse ${eur(t.cout.journee)} sur ${eur(t.cout.total)} : l'essentiel de la tournée se paie avant le premier kilomètre.`];
      },
    },
    {
      id: "par-palette",
      objectifs: [2],
      type: "montants",
      titre: "Ce que coûte une palette livrée",
      notions: ["full_unit_cost"],
      tableau: tableauDeLaTournee,
      question: (c) => `Calculez les palettes de la tournée (une palette entamée part entière), ce que coûte une palette livrée, puis une ${c.unite} livrée (au centime).`,
      champs: () => {
        const t = tourneeDuMois();
        return [
          { libelle: "Palettes de la tournée", attendu: t.palettes, calcul: `${qte(t.enceintes)} ÷ ${qte(ENCEINTES_PAR_PALETTE)}, à la palette supérieure : ${qte(t.palettes)}`, tolerance: 0 },
          { libelle: "Coût d'une palette livrée", attendu: t.parPalette, calcul: `${eur(t.cout.total)} ÷ ${qte(t.palettes)} = ${eur(t.parPalette)}` },
          { libelle: "Coût d'une enceinte livrée", attendu: t.parEnceinte, calcul: `${eur(t.cout.total)} ÷ ${qte(t.enceintes)} = ${eur(t.parEnceinte)}` },
        ];
      },
      explication: (c) => {
        const t = tourneeDuMois();
        return [`Livrer une ${c.unite} à CampusTech coûte ${eur(t.parEnceinte)}. Ce coût est déjà compté dans les coûts variables de chaque ${c.unite} : il en est une petite part.`];
      },
    },
    {
      id: "tournee-ou-messagerie",
      objectifs: [3],
      type: "choix",
      titre: "La tournée ou la messagerie ?",
      notions: ["full_unit_cost", "make_or_buy"],
      question: () => `Pour livrer le mois de CampusTech, vaut-il mieux la tournée ou la messagerie, à ${eur(MESSAGERIE_PAR_PALETTE)} la palette ?`,
      options: () => {
        const t = tourneeDuMois();
        return [
          { texte: "La tournée", juste: t.economie > 0, retour: t.economie > 0 ? `Oui : ${eur(t.cout.total)}, contre ${qte(t.palettes)} × ${eur(MESSAGERIE_PAR_PALETTE)} = ${eur(t.messagerie)} par la messagerie : ${eur(t.economie)} d'économisés.` : "Non." },
          { texte: "La messagerie", juste: t.economie <= 0, retour: t.economie <= 0 ? "Oui." : `Non : la messagerie coûterait ${eur(t.messagerie)}, plus que la tournée (${eur(t.cout.total)}).` },
          { texte: "La messagerie, car un camion à moitié vide gaspille", juste: false, retour: `Non : même à moitié vide, le porteur coûte moins que ${qte(t.palettes)} palettes en messagerie.` },
        ];
      },
    },
    {
      id: "les-palettes-qui-paient",
      objectifs: [1, 3],
      type: "curseur",
      titre: "Les palettes qui paient la tournée",
      notions: ["full_unit_cost", "fixed_costs"],
      question: () =>
        `Faites varier les palettes à livrer en une fois. Une droite donne ce qu'elles coûteraient en messagerie (${eur(MESSAGERIE_PAR_PALETTE)} chacune), l'autre ce que coûte la tournée (${eur(tourneeDuMois().cout.total)}, quel que soit le chargement). Placez le curseur sur le plus petit nombre de palettes à partir duquel la tournée coûte moins, puis validez.`,
      grandeur: () => ({ libelle: "Palettes à livrer", unite: "palettes" }),
      cible: () => ({ attendu: palettesQuiPaientLaTournee(), ...PALETTES_DU_CURSEUR }),
      zones: ["La tournée coûte moins", "La messagerie coûte moins"],
      rates: () => ({
        dessous: "Avec si peu de palettes, la messagerie coûte moins que la tournée.",
        dessus: "La tournée coûte moins, mais c'était déjà vrai avec moins de palettes : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les palettes",
      lecture: (_c, q) => {
        const t = tourneeDuMois();
        return [
          { libelle: "Coût en messagerie", montant: q * MESSAGERIE_PAR_PALETTE, fort: true },
          { libelle: "Coût de la tournée", montant: t.cout.total },
          { libelle: "Économie de la tournée", montant: q * MESSAGERIE_PAR_PALETTE - t.cout.total },
        ];
      },
      droites: () => {
        const t = tourneeDuMois();
        return { produit: (q) => q * MESSAGERIE_PAR_PALETTE, cout: () => t.cout.total, libelles: ["Coût en messagerie", "Coût de la tournée"] };
      },
      explication: () => {
        const n = palettesQuiPaientLaTournee();
        const t = tourneeDuMois();
        return [
          `Dès ${qte(n)} palettes, la tournée coûte moins : ${qte(n)} × ${eur(MESSAGERIE_PAR_PALETTE)} = ${eur(n * MESSAGERIE_PAR_PALETTE)}, plus que ${eur(t.cout.total)}. CampusTech en reçoit ${qte(t.palettes)} : la tournée l'emporte, de peu.`,
          "Une tournée coûte la même chose quel que soit le chargement : plus elle emporte de palettes, moins chacune coûte.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-livraison",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la livraison",
      notions: ["full_unit_cost"],
      question: (c) => `Choisissez comment livrer les ${qte(tourneeDuMois().enceintes)} ${c.unites} du mois à CampusTech, et en combien de fois. Le tableau donne les palettes de chaque livraison et ce que coûte le mois. Relevez le défi.`,
      leviers: () => [
        { code: "mode", libelle: "Façon de livrer", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DU_LABORATOIRE.mode, choix: MODES.map((m) => ({ valeur: m.valeur, libelle: m.libelle })) },
        { code: "fois", libelle: "Livraisons dans le mois", unite: "livraisons", min: 1, max: 4, pas: 1, depart: DEPART_DU_LABORATOIRE.fois, choix: FOIS.map((n) => ({ valeur: n, libelle: `${n} par mois` })) },
      ],
      lecture: (c, p) => {
        const x = livraisonsDuMois(modeDe(p.mode!), p.fois!);
        const d = livraisonsDuMois(modeDe(DEPART_DU_LABORATOIRE.mode), DEPART_DU_LABORATOIRE.fois);
        return [
          { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} par livraison`, montant: x.parLivraison, unite: c.unites, reference: d.parLivraison },
          { libelle: "Palettes par livraison", montant: x.palettes, unite: "palettes", reference: d.palettes },
          { libelle: "Coût du mois", montant: x.cout, reference: d.cout, fort: true },
        ];
      },
      defi: () => {
        const juste = livraisonDuLaboratoire();
        return {
          consigne: "Livrez le mois de CampusTech au plus bas coût.",
          atteint: (p) => p.mode === juste.mode && p.fois === juste.fois,
          indice: (p) => {
            const x = livraisonsDuMois(modeDe(p.mode!), p.fois!);
            return `Ainsi, le mois coûte ${eur(x.cout)}. Une tournée coûte la même chose pleine ou vide ; la messagerie se paie à la palette, et une palette entamée part entière.`;
          },
          solution: { mode: juste.mode, fois: juste.fois },
        };
      },
      explication: (_c, p) => {
        const x = livraisonsDuMois(modeDe(p.mode!), p.fois!);
        return [
          `Défi relevé : une seule tournée par mois, ${eur(x.cout)}. Chaque livraison de plus paie une journée de camion de plus, ou des palettes entamées en messagerie.`,
          "Livrer moins souvent, en chargeant plus, fait baisser le coût de chaque palette ; mais le client doit pouvoir attendre et stocker.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["full_unit_cost"],
      texte: (c) => {
        const t = tourneeDuMois();
        return [
          `La tournée de CampusTech coûte ${eur(t.cout.total)} : ${eur(t.cout.journee)} de journée, ${eur(t.cout.route)} de route. Elle livre ${qte(t.palettes)} palettes, à ${eur(t.parPalette)} chacune, soit ${eur(t.parEnceinte)} par ${c.unite}.`,
          "Une livraison a un coût qui ne dépend pas du chargement (la journée du camion et du chauffeur) et un coût qui dépend de la route. Plus le camion emporte, moins chaque palette coûte : c'est ce qui décide entre une tournée et la messagerie.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : cherchez, dans l'analyse des coûts, ce que coûte le transport d'une unité.",
        ];
      },
      repere: () => "Coût d'une palette livrée = coût de la tournée ÷ palettes livrées.",
    },
  ],
};
