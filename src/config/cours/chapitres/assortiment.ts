import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { gammeDuMois, type ReferenceDuMois } from "../gamme";
import type { Chapitre } from "../types";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : L'ASSORTIMENT, MARGE ET VOLUME (BTS MCO, palier 4).
 *
 * Les références d'un même point de vente ne rapportent pas pareil : celle qui fait le plus
 * de chiffre d'affaires n'est pas toujours celle qui laisse le plus de marge. Le chapitre
 * calcule la marge de chaque référence, la classe selon son volume et sa marge par unité
 * (locomotive, produit de volume, produit de marge, référence à revoir), puis pose la
 * question du manager : faut-il retirer celle qui rapporte le moins ?
 *
 * Aucune hypothèse : la gamme est celle que l'arène joue au niveau où le commerce passe en
 * gamme (`gamme.ts`, le chapitre « Coût par produit » s'en sert déjà), ramenée à un mois. Les
 * seuils du classement sont les moyennes de la gamme elle-même : une référence vend
 * beaucoup si elle vend plus que la moyenne de ses voisines.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export const FAMILLES_D_ASSORTIMENT = [
  { code: "locomotive", libelle: "Locomotive" },
  { code: "volume", libelle: "Produit de volume" },
  { code: "marge", libelle: "Produit de marge" },
  { code: "a-revoir", libelle: "À revoir" },
] as const;

type Famille = (typeof FAMILLES_D_ASSORTIMENT)[number]["code"];

const gammeDe = (c: Cas) => {
  const g = gammeDuMois(c.code);
  if (!g) throw new Error(`${c.code} ne joue pas de gamme`);
  return g;
};

/** Chaque référence : sa marge, sa part du chiffre d'affaires et de la marge, sa famille. */
export function assortiment(c: Cas) {
  const g = gammeDe(c);
  const refs = g.references;
  const mcvUnitaire = (r: ReferenceDuMois) => auCentime(r.prix - r.coutVariableUnitaire);
  const mcv = (r: ReferenceDuMois) => Math.round(r.quantite * mcvUnitaire(r));
  const caTotal = refs.reduce((t, r) => t + r.chiffreDAffaires, 0);
  const mcvTotale = refs.reduce((t, r) => t + mcv(r), 0);
  const volumeMoyen = refs.reduce((t, r) => t + r.quantite, 0) / refs.length;
  const margeMoyenne = refs.reduce((t, r) => t + mcvUnitaire(r), 0) / refs.length;
  const famille = (r: ReferenceDuMois): Famille => {
    const fortVolume = r.quantite >= volumeMoyen;
    const forteMarge = mcvUnitaire(r) >= margeMoyenne;
    return fortVolume ? (forteMarge ? "locomotive" : "volume") : forteMarge ? "marge" : "a-revoir";
  };
  const lignes = refs.map((r) => ({
    ...r,
    mcvUnitaire: mcvUnitaire(r),
    mcv: mcv(r),
    partDuCa: auDixieme((r.chiffreDAffaires / caTotal) * 100),
    partDeLaMarge: auDixieme((mcv(r) / mcvTotale) * 100),
    famille: famille(r),
  }));
  const parCa = [...lignes].sort((a, b) => b.chiffreDAffaires - a.chiffreDAffaires);
  const parMarge = [...lignes].sort((a, b) => b.mcv - a.mcv);
  return {
    libelle: g.libelle,
    niveau: g.niveau,
    lignes,
    caTotal,
    mcvTotale,
    volumeMoyen: Math.round(volumeMoyen),
    margeMoyenne: auCentime(margeMoyenne),
    premiereEnCa: parCa[0]!,
    premiereEnMarge: parMarge[0]!,
    derniere: parMarge[parMarge.length - 1]!,
  };
}

const tableauDeLaGamme = (c: Cas) => ({
  titre: `${c.entreprise} · ${assortiment(c).libelle}, sur un mois de l'arène`,
  colonnes: ["Vendus", "Prix HT", "Coût variable", "Chiffre d'affaires HT"],
  lignes: gammeDe(c).references.map((r) => ({
    libelle: r.nom,
    valeurs: [qte(r.quantite), eur(r.prix), eur(r.coutVariableUnitaire), eur(r.chiffreDAffaires)],
  })),
});

export const ASSORTIMENT: Chapitre = {
  code: "assortiment",
  parcours: "mco",
  palier: 4,
  titre: "L'assortiment : marge et volume",
  accroche:
    "La référence qui fait le plus de chiffre d'affaires n'est pas toujours celle qui rapporte le plus. Marge par référence, familles de l'assortiment, et la question du rayon : laquelle retirer ?",
  objectifs: [
    "Calculer la marge sur coût variable de chaque référence",
    "Comparer la part d'une référence dans le chiffre d'affaires et dans la marge",
    "Classer les références selon leur volume et leur marge par unité",
    "Décider du sort d'une référence peu rentable",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre compare les références d'un point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Plusieurs références, un seul rayon",
      notions: ["assortment"],
      texte: (c) => {
        const a = assortiment(c);
        return [
          `À partir du niveau ${a.niveau} de l'arène, ${c.entreprise} vend ${a.libelle}. Le tableau donne un mois de ce trimestre, référence par référence : ce qui s'est vendu, à quel prix, et ce que chaque unité coûte en coûts variables.`,
          "Le manager ne regarde pas seulement ce que chaque référence vend : il regarde ce qu'elle laisse. Une référence qui fait beaucoup de chiffre avec une petite marge peut rapporter moins qu'une autre, plus discrète.",
        ];
      },
      repere: () => "Marge d'une référence = quantité vendue × (prix − coût variable unitaire).",
      tableau: tableauDeLaGamme,
    },
    {
      id: "marges",
      type: "montants",
      titre: "La marge de chaque référence",
      notions: ["contribution_margin", "assortment"],
      tableau: tableauDeLaGamme,
      question: () => "Calculez la marge sur coût variable du mois de chaque référence, à l'euro.",
      champs: (c) =>
        assortiment(c).lignes.map((r) => ({
          libelle: `Marge · ${r.nom}`,
          attendu: r.mcv,
          calcul: `${qte(r.quantite)} × (${eur(r.prix)} − ${eur(r.coutVariableUnitaire)}) = ${eur(r.mcv)}`,
          tolerance: 1,
        })),
      explication: (c) => {
        const a = assortiment(c);
        return [`Ensemble, les références laissent ${eur(a.mcvTotale)} de marge ce mois-ci. ${a.premiereEnMarge.nom} en apporte le plus : ${eur(a.premiereEnMarge.mcv)}.`];
      },
    },
    {
      id: "chiffre-et-marge",
      type: "montants",
      titre: "Le chiffre d'affaires ne dit pas tout",
      notions: ["assortment"],
      tableau: tableauDeLaGamme,
      question: (c) => {
        const a = assortiment(c);
        return `${a.premiereEnCa.nom} fait le plus de chiffre d'affaires. Calculez sa part du chiffre d'affaires de la gamme (${eur(a.caTotal)}), puis sa part de la marge (${eur(a.mcvTotale)}), en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const a = assortiment(c);
        const r = a.premiereEnCa;
        return [
          { libelle: "Part du chiffre d'affaires (%)", attendu: r.partDuCa, calcul: `${eur(r.chiffreDAffaires)} ÷ ${eur(a.caTotal)} × 100 = ${pct(r.partDuCa)}`, tolerance: 0.1 },
          { libelle: "Part de la marge (%)", attendu: r.partDeLaMarge, calcul: `${eur(r.mcv)} ÷ ${eur(a.mcvTotale)} × 100 = ${pct(r.partDeLaMarge)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = assortiment(c).premiereEnCa;
        return [
          r.partDeLaMarge >= r.partDuCa
            ? `${r.nom} pèse ${pct(r.partDuCa)} du chiffre d'affaires et ${pct(r.partDeLaMarge)} de la marge : elle rapporte encore plus qu'elle ne vend.`
            : `${r.nom} pèse ${pct(r.partDuCa)} du chiffre d'affaires, mais seulement ${pct(r.partDeLaMarge)} de la marge : sa marge par unité est plus faible que celle des autres. Un rayon se pilote à la marge.`,
        ];
      },
    },
    {
      id: "familles",
      type: "tri",
      titre: "Les familles de l'assortiment",
      notions: ["assortment"],
      question: (c) => {
        const a = assortiment(c);
        return `Classez chaque référence. Elle vend beaucoup si elle dépasse la moyenne de la gamme (${qte(a.volumeMoyen)} unités par mois) ; elle marge fort si sa marge par unité dépasse la moyenne (${eur(a.margeMoyenne)}). Une locomotive fait les deux ; un produit de volume vend beaucoup avec une petite marge ; un produit de marge vend peu mais marge fort ; le reste est à revoir.`;
      },
      categories: FAMILLES_D_ASSORTIMENT,
      elements: (c) =>
        assortiment(c).lignes.map((r) => ({
          libelle: r.nom,
          montant: r.mcv,
          categorie: r.famille,
          pourquoi: `${qte(r.quantite)} unités (moyenne ${qte(assortiment(c).volumeMoyen)}), ${eur(r.mcvUnitaire)} de marge par unité (moyenne ${eur(assortiment(c).margeMoyenne)}).`,
        })),
      explication: () => [
        "Chaque famille a son rôle : la locomotive fait vivre le rayon, le produit de volume attire, le produit de marge enrichit, la référence à revoir doit justifier sa place.",
      ],
    },
    {
      id: "retirer",
      type: "choix",
      titre: "Faut-il retirer la dernière ?",
      notions: ["assortment", "contribution_margin"],
      question: (c) => {
        const r = assortiment(c).derniere;
        return `${r.nom} laisse la plus petite marge du rayon : ${eur(r.mcv)} par mois. Faut-il la retirer de l'assortiment ?`;
      },
      options: (c) => {
        const r = assortiment(c).derniere;
        return [
          {
            texte: "Pas forcément : elle couvre ses coûts variables et apporte une marge, et elle peut faire venir des clients.",
            juste: true,
            retour: `Oui. ${r.nom} laisse ${eur(r.mcv)} par mois après ses coûts variables : la retirer, c'est perdre cette somme, alors que le loyer et l'équipe restent à payer. Avant de la retirer, on regarde la place qu'elle prend, le stock qu'elle immobilise, et les clients qu'elle amène.`,
          },
          {
            texte: "Oui : une référence qui rapporte le moins coûte forcément de l'argent.",
            juste: false,
            retour: `Elle rapporte le moins, mais elle rapporte : ${eur(r.mcv)} de marge par mois. Elle ne coûterait de l'argent que si son prix ne couvrait pas son coût variable.`,
          },
          {
            texte: "Oui : il vaut toujours mieux garder moins de références.",
            juste: false,
            retour: "Un assortiment trop court fait partir des clients qui ne trouvent pas ce qu'ils cherchent. La largeur de l'offre est un choix, pas une économie automatique.",
          },
        ];
      },
    },
  ],
};
