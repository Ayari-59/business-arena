import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ENCEINTES_PAR_PALETTE,
  ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA,
  PETIT_PORTEUR,
  PORTEUR,
  POURQUOI_LA_PRODUCTION_DE_NOVA,
  REMPLISSAGE_VISE,
  VEHICULES,
  coutDUneTournee,
  enceintesDuMois,
  tourneeDuMois,
  trimestreDeTournees,
} from "../monde/production-et-logistique";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TAUX DE REMPLISSAGE DES VÉHICULES (2de pro GATL, le transport et la logistique,
 * palier 1).
 *
 * La tournée de CampusTech emporte chaque mois 7 palettes dans un porteur qui en prend 12. L'élève
 * calcule le taux de remplissage (58,3 %), les places vides, ce que coûte une palette quand le camion
 * roule à moitié vide et ce qu'elle coûterait s'il roulait plein, puis dit pourquoi une place vide
 * coûte. Les chiffres viennent de monde/production-et-logistique.ts (la palette, les deux camions du
 * loueur, la route : ses hypothèses) et de nova-gestion.ts (les 320 enceintes du mois).
 *
 * L'EXPÉRIENCE. Un curseur : les palettes qu'il faut charger, au moins, pour remplir le porteur aux
 * trois quarts (9). Un laboratoire : le camion et le nombre de tournées qui livrent tout le trimestre
 * de CampusTech au plus bas coût (le porteur, 2 tournées).
 *
 * Il ne double pas « Ce que coûte une livraison », qui compte la tournée et la compare à la
 * messagerie : ici, l'objet est le remplissage, et ce que coûte une place vide. CE QUI A CHANGÉ : il
 * se jouait chez ROUTE & CIE, le transporteur de l'arène ; il se joue chez NOVA.
 */

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DU_TRANSPORT: readonly string[] = ENTREPRISES_DE_LA_PRODUCTION_DE_NOVA;

/** Les bornes du curseur (les palettes chargées) et du laboratoire (les tournées du trimestre). */
const PALETTES_DU_CURSEUR = { min: 0, max: 12 } as const;
const TOURNEES_DU_LABORATOIRE = { min: 1, max: 6, pas: 1 } as const;
/** Au départ du laboratoire : le porteur, une tournée par mois, comme aujourd'hui. */
const DEPART_DU_LABORATOIRE = { vehicule: 1, tournees: 3 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10) / 10).toLocaleString("fr-FR")} %`;

const vehiculeDe = (v: number) => VEHICULES[v]!;

/** La tournée du mois, au porteur : son remplissage et ce que coûte une palette. */
export const remplissage = () => tourneeDuMois();

/** Les palettes qu'il faut charger, au moins, pour remplir le porteur au taux visé. */
export const palettesPourLeTauxVise = () => Math.ceil(PORTEUR.places * REMPLISSAGE_VISE - 1e-9);

/** Le laboratoire : la position qui livre tout le trimestre au plus bas coût. */
export function tourneesDuLaboratoire() {
  const positions = VEHICULES.flatMap((v, i) =>
    Array.from({ length: TOURNEES_DU_LABORATOIRE.max - TOURNEES_DU_LABORATOIRE.min + 1 }, (_, k) => ({ ...trimestreDeTournees(v, TOURNEES_DU_LABORATOIRE.min + k), indice: i })),
  ).filter((x) => x.aQuai === 0);
  return positions.reduce((a, b) => (b.cout < a.cout ? b : a));
}

function tableauDeLaTournee(c: Cas): TableauDeDonnees {
  const t = remplissage();
  return {
    titre: "La tournée du mois chez CampusTech",
    colonnes: ["Valeur"],
    lignes: [
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} à livrer`, valeurs: [qte(t.enceintes)] },
      { libelle: `${c.unites[0]!.toUpperCase()}${c.unites.slice(1)} par palette`, valeurs: [qte(ENCEINTES_PAR_PALETTE)] },
      { libelle: "Places du porteur (palettes)", valeurs: [qte(PORTEUR.places)] },
      { libelle: "Coût de la tournée", valeurs: [eur(t.cout.total)] },
    ],
  };
}

export const LE_TAUX_DE_REMPLISSAGE: Chapitre = {
  code: "le-taux-de-remplissage",
  parcours: "logistique",
  palier: 1,
  blocs: ["2de pro GATL · 4 · Traiter les flux physiques en relation avec les données de gestion", "2de pro GATL · 2 · Organiser et planifier l'activité"],
  titre: "Le taux de remplissage des véhicules",
  accroche: "Ce que le camion peut emporter, ce qu'il emporte vraiment, et ce que coûte une place vide. Puis le camion et le nombre de tournées qui livrent au plus juste.",
  objectifs: [
    "Calculer le taux de remplissage d'un véhicule",
    "Calculer ce que coûte une palette selon le remplissage",
    "Expliquer pourquoi une place vide coûte",
    "Choisir un véhicule et une fréquence de livraison",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_TRANSPORT, pourquoi: POURQUOI_LA_PRODUCTION_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que le camion peut emporter",
      notions: ["capacity"],
      tableau: tableauDeLaTournee,
      texte: (c) => [
        `Chaque mois, ${c.entreprise} livre CampusTech avec un porteur loué pour la journée, qui prend ${qte(PORTEUR.places)} palettes. La tournée coûte la même chose, que le camion parte plein ou presque vide.`,
        "Le taux de remplissage dit quelle part de la place du camion sert vraiment : les palettes chargées ÷ les palettes qu'il peut prendre.",
      ],
      repere: () => "Taux de remplissage = palettes chargées ÷ places du véhicule × 100.",
    },
    {
      id: "le-remplissage",
      objectifs: [0],
      type: "montants",
      titre: "Le remplissage de la tournée",
      notions: ["capacity"],
      tableau: tableauDeLaTournee,
      question: () => "Calculez les palettes de la tournée (une palette entamée part entière), le taux de remplissage (au dixième), puis les places vides.",
      champs: () => {
        const t = remplissage();
        return [
          { libelle: "Palettes de la tournée", attendu: t.palettes, calcul: `${qte(t.enceintes)} ÷ ${qte(ENCEINTES_PAR_PALETTE)}, à la palette supérieure : ${qte(t.palettes)}`, tolerance: 0 },
          { libelle: "Taux de remplissage (%)", attendu: Math.round(t.remplissage * 10) / 10, calcul: `${qte(t.palettes)} ÷ ${qte(t.places)} × 100 = ${pct(t.remplissage)}`, tolerance: 0.1 },
          { libelle: "Places vides", attendu: t.vides, calcul: `${qte(t.places)} − ${qte(t.palettes)} = ${qte(t.vides)}`, tolerance: 0 },
        ];
      },
      explication: () => {
        const t = remplissage();
        return [`Le porteur roule rempli à ${pct(t.remplissage)} : ${qte(t.vides)} places sur ${qte(t.places)} partent vides, chaque mois.`];
      },
    },
    {
      id: "la-place-vide",
      objectifs: [1],
      type: "montants",
      titre: "Ce que coûte une place vide",
      notions: ["fixed_costs", "full_unit_cost"],
      tableau: tableauDeLaTournee,
      question: () => "Calculez ce que coûte une palette chargée aujourd'hui (tournée ÷ palettes chargées), ce qu'elle coûterait si le porteur partait plein, puis ce que coûtent les places vides (places vides × coût d'une palette, porteur plein).",
      champs: () => {
        const t = remplissage();
        const vides = Math.round(t.vides * t.parPalettePlein * 100) / 100;
        return [
          { libelle: "Coût d'une palette, aujourd'hui", attendu: t.parPalette, calcul: `${eur(t.cout.total)} ÷ ${qte(t.palettes)} = ${eur(t.parPalette)}` },
          { libelle: "Coût d'une palette, porteur plein", attendu: t.parPalettePlein, calcul: `${eur(t.cout.total)} ÷ ${qte(t.places)} = ${eur(t.parPalettePlein)}` },
          { libelle: "Coût des places vides", attendu: vides, calcul: `${qte(t.vides)} × ${eur(t.parPalettePlein)} = ${eur(vides)}` },
        ];
      },
      explication: () => {
        const t = remplissage();
        return [`Une place vide ne coûte rien de plus à la tournée, mais elle est payée quand même : les palettes chargées portent tout le coût, ${eur(t.parPalette)} chacune au lieu de ${eur(t.parPalettePlein)}.`];
      },
    },
    {
      id: "pourquoi",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi une place vide coûte",
      notions: ["fixed_costs"],
      question: () => "Pourquoi une place vide fait-elle monter le coût de chaque palette livrée ?",
      options: () => [
        { texte: "La tournée coûte pareil, pleine ou vide", juste: true, retour: "Oui : la journée du camion, le chauffeur et la route se paient quel que soit le chargement. Moins il y a de palettes, plus chacune en porte." },
        { texte: "Un camion vide consomme plus de gazole", juste: false, retour: "Non : un camion plus léger consomme plutôt moins. C'est le partage du coût de la tournée sur moins de palettes qui fait monter le coût de chacune." },
        { texte: "Le loueur fait payer chaque place vide en plus du camion", juste: false, retour: "Non : le loueur fait payer la journée du camion, pas les places. Les places vides sont payées sans rien emporter." },
      ],
    },
    {
      id: "remplir-aux-trois-quarts",
      objectifs: [0],
      type: "curseur",
      titre: "Remplir aux trois quarts",
      notions: ["capacity"],
      question: () =>
        `NOVA vise un porteur rempli à ${pct(REMPLISSAGE_VISE * 100)}. Faites varier les palettes chargées : une droite donne les palettes chargées, l'autre ${pct(REMPLISSAGE_VISE * 100)} des ${qte(PORTEUR.places)} places. Placez le curseur sur le plus petit nombre de palettes qui atteint ce taux, puis validez.`,
      grandeur: () => ({ libelle: "Palettes chargées", unite: "palettes" }),
      cible: () => ({ attendu: palettesPourLeTauxVise(), ...PALETTES_DU_CURSEUR }),
      zones: ["Le taux visé est atteint", "Le camion roule trop vide"],
      rates: () => ({
        dessous: "Avec si peu de palettes, le camion reste sous le taux visé.",
        dessus: "Le taux visé est atteint, mais avec moins de palettes aussi : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer les palettes",
      lecture: (_c, q) => [
        { libelle: "Palettes chargées", montant: q, fort: true },
        { libelle: "Palettes du taux visé", montant: PORTEUR.places * REMPLISSAGE_VISE },
        { libelle: "Coût d'une palette chargée", montant: q > 0 ? Math.round((coutDUneTournee().total / q) * 100) / 100 : 0 },
      ],
      droites: () => ({ produit: (q) => q, cout: () => PORTEUR.places * REMPLISSAGE_VISE, libelles: ["Palettes chargées", "Palettes du taux visé"] }),
      explication: () => {
        const n = palettesPourLeTauxVise();
        const t = remplissage();
        return [
          `Il faut ${qte(n)} palettes : ${qte(n)} ÷ ${qte(PORTEUR.places)} = ${pct((n / PORTEUR.places) * 100)}. La tournée du mois n'en emporte que ${qte(t.palettes)} ; pour remplir le porteur, il faudrait livrer plus à la fois, ou prendre un camion plus petit.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-tournees",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire des tournées",
      notions: ["capacity", "fixed_costs"],
      question: (c) => {
        const t = trimestreDeTournees(PORTEUR, DEPART_DU_LABORATOIRE.tournees);
        return `CampusTech reçoit ${qte(t.enceintes)} ${c.unites} par trimestre, et accepte d'être livrée moins souvent si chaque livraison couvre ses ventes jusqu'à la suivante. Choisissez le camion (${qte(PETIT_PORTEUR.places)} ou ${qte(PORTEUR.places)} palettes) et le nombre de tournées du trimestre, en partant d'une tournée par mois au porteur. Relevez le défi.`;
      },
      leviers: () => [
        { code: "vehicule", libelle: "Camion", unite: "", min: 0, max: 1, pas: 1, depart: DEPART_DU_LABORATOIRE.vehicule, choix: VEHICULES.map((v, i) => ({ valeur: i, libelle: v.nom })) },
        { code: "tournees", libelle: "Tournées du trimestre", unite: "tournées", ...TOURNEES_DU_LABORATOIRE, depart: DEPART_DU_LABORATOIRE.tournees },
      ],
      lecture: (_c, p) => {
        const x = trimestreDeTournees(vehiculeDe(p.vehicule!), p.tournees!);
        const d = trimestreDeTournees(vehiculeDe(DEPART_DU_LABORATOIRE.vehicule), DEPART_DU_LABORATOIRE.tournees);
        return [
          { libelle: "Palettes de chaque tournée", montant: x.palettesParTournee, unite: "palettes", reference: d.palettesParTournee },
          { libelle: "Palettes restées à quai", montant: x.aQuai, unite: "palettes", reference: d.aQuai },
          { libelle: "Taux de remplissage", montant: Math.round(x.remplissage * 10) / 10, unite: "%", reference: Math.round(d.remplissage * 10) / 10 },
          { libelle: "Coût des tournées du trimestre", montant: x.cout, reference: d.cout, fort: true },
        ];
      },
      defi: () => {
        const juste = tourneesDuLaboratoire();
        return {
          consigne: "Livrez tout le trimestre, sans palette restée à quai, au plus bas coût.",
          atteint: (p) => p.vehicule === juste.indice && p.tournees === juste.tournees,
          indice: (p) => {
            const x = trimestreDeTournees(vehiculeDe(p.vehicule!), p.tournees!);
            return x.aQuai > 0
              ? `${qte(x.aQuai)} palettes restent à quai : chaque tournée en a ${qte(x.palettesParTournee)} pour ${qte(x.vehicule.places)} places.`
              : `Tout part, pour ${eur(x.cout)}, rempli à ${pct(x.remplissage)}. Une tournée de moins tiendrait-elle ?`;
          },
          solution: { vehicule: juste.indice, tournees: juste.tournees },
        };
      },
      explication: (_c, p) => {
        const x = trimestreDeTournees(vehiculeDe(p.vehicule!), p.tournees!);
        return [
          `Défi relevé : ${qte(x.tournees)} tournées au ${x.vehicule.code === "porteur" ? "porteur" : "petit porteur"}, remplies à ${pct(x.remplissage)}, pour ${eur(x.cout)}. Moins de tournées mieux remplies coûtent moins qu'un camion plus petit qui roule plus souvent.`,
          "Remplir un camion, c'est d'abord livrer moins souvent, en chargeant plus à la fois.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "fixed_costs"],
      texte: (c) => {
        const t = remplissage();
        return [
          `La tournée de CampusTech emporte ${qte(t.palettes)} palettes pour ${qte(t.places)} places : ${pct(t.remplissage)} de remplissage, et chaque palette coûte ${eur(t.parPalette)} au lieu de ${eur(t.parPalettePlein)} si le camion partait plein. Elle livre ${qte(enceintesDuMois())} ${c.unites} chaque mois.`,
          "Un véhicule coûte presque autant plein que vide : chaque place vide est payée sans rien rapporter. Remplir mieux, c'est livrer moins souvent, grouper les envois, ou choisir un véhicule à la mesure du chargement.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : comparez ce que vos équipements peuvent faire et ce qu'ils font vraiment.",
        ];
      },
      repere: () => "Coût d'une palette = coût de la tournée ÷ palettes chargées : il baisse quand le remplissage monte.",
    },
  ],
};
