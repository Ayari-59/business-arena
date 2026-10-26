import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { NEGOCIATIONS } from "../../chapitres/negocier-le-prix";
import { tableauCommercial } from "../../chapitres/tableau-de-bord-commercial";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TABLEAU DE BORD COMMERCIAL » : L'OBJECTIF DE TAUX DE
 * SERVICE (BTS NDRC, palier 4).
 *
 * La direction veut fixer un objectif pour l'an prochain : servir une part minimale de la
 * demande adressée. Avant de décider des moyens, elle demande ce que vaut cet objectif.
 * L'élève refait seul le chemin du chapitre, sur l'année entière : la demande, les ventes
 * et le taux de service de l'année, les ventes que l'objectif demande, puis ce qu'elles
 * représentent en chiffre d'affaires et en marge, et la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre comparait les trimestres entre eux, sans
 * objectif ; la direction en pose un. Les quatre trimestres sont ceux de l'arène, lus par
 * `tableauCommercial`.
 */

/**
 * Le taux de service visé : 90 % de la demande adressée. C'est l'objectif courant d'un
 * fournisseur d'entreprises, qui sait qu'il ne servira jamais toute la demande (pointes,
 * délais impossibles), mais qu'un client sur dix éconduit est déjà beaucoup.
 */
export const TAUX_DE_SERVICE_VISE = 0.9;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const somme = (v: readonly number[]) => v.reduce((t, x) => t + x, 0);

/** L'année additionnée, et ce que vaut l'objectif. */
export function objectifDeService(c: Cas) {
  const k = tableauCommercial(c);
  const demande = somme(k.trimestres.map((t) => t.demande));
  const ventes = somme(k.trimestres.map((t) => t.ventes));
  const chiffreDAffaires = somme(k.trimestres.map((t) => t.chiffreDAffaires));
  const marge = somme(k.trimestres.map((t) => t.marge));
  // Les ventes visées s'arrondissent à l'unité supérieure : une de moins manquerait l'objectif.
  const ventesVisees = Math.ceil(demande * TAUX_DE_SERVICE_VISE - 1e-9);
  const ventesEnPlus = ventesVisees - ventes;
  const prixMoyen = auCentime(chiffreDAffaires / ventes);
  const margeParVente = auCentime(marge / ventes);
  return {
    k,
    vise: TAUX_DE_SERVICE_VISE * 100,
    demande,
    ventes,
    chiffreDAffaires,
    marge,
    service: auDixieme((ventes / demande) * 100),
    ventesVisees,
    ventesEnPlus,
    prixMoyen,
    margeParVente,
    caEnPlus: auCentime(ventesEnPlus * prixMoyen),
    margeEnPlus: auCentime(ventesEnPlus * margeParVente),
    // Les erreurs classiques : viser toute la demande, et appliquer l'écart de taux aux
    // ventes au lieu de la demande.
    toutLeManque: demande - ventes,
    surLaMauvaiseBase: Math.round((TAUX_DE_SERVICE_VISE - ventes / demande) * ventes),
  };
}

export const L_OBJECTIF_DE_TAUX_DE_SERVICE: Situation = {
  code: "l-objectif-de-taux-de-service",
  parcours: "ndrc",
  palier: 4,
  blocs: [],
  reprend: ["tableau-de-bord-commercial"],
  commanditaire: "La direction",
  titre: "L'objectif de taux de service",
  accroche:
    "La direction veut servir l'an prochain une part minimale de la demande. Avant d'y mettre des moyens, elle demande ce que vaut cet objectif en ventes et en marge.",
  objectifs: [
    "Additionner une année de tableau de bord et calculer son taux de service",
    "Traduire un objectif de taux de service en ventes à réaliser",
    "Chiffrer ce que valent ces ventes en chiffre d'affaires et en marge",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce cas suit l'activité commerciale d'une entreprise qui négocie avec des clients professionnels.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = objectifDeService(c);
        return [
          `« Pour l'an prochain, je veux un objectif clair : servir au moins ${pct(r.vise)} de la demande que le marché nous adresse. À demande égale à celle de cette année, que représente cet objectif en ventes, en chiffre d'affaires et en marge ? Je dois savoir ce qu'il vaut avant de décider des moyens à y mettre. »`,
          "Pas de cours cette fois : vous avez le tableau de bord de l'année, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const { k } = objectifDeService(c);
        return {
          titre: `Le tableau de bord commercial de l'année · ${c.entreprise}`,
          colonnes: k.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: k.trimestres.map((t) => eur(t.chiffreDAffaires)) },
            { libelle: `Demande adressée (${c.unites})`, valeurs: k.trimestres.map((t) => qte(t.demande)) },
            { libelle: `Ventes (${c.unites})`, valeurs: k.trimestres.map((t) => qte(t.ventes)) },
            { libelle: "Marge sur les ventes", valeurs: k.trimestres.map((t) => eur(t.marge)) },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de service de l'année, les ventes que demande l'objectif, ce qu'elles valent en chiffre d'affaires et en marge, et votre réponse.",
    },
    {
      id: "annee",
      type: "montants",
      titre: "L'année en chiffres",
      notions: ["dashboard"],
      question: () =>
        "Additionnez les quatre trimestres : la demande adressée de l'année, les ventes de l'année, puis calculez le taux de service de l'année, en pourcentage au dixième.",
      champs: (c) => {
        const r = objectifDeService(c);
        return [
          { libelle: "Demande adressée de l'année", attendu: r.demande, calcul: `${r.k.trimestres.map((t) => qte(t.demande)).join(" + ")} = ${qte(r.demande)}` },
          { libelle: "Ventes de l'année", attendu: r.ventes, calcul: `${r.k.trimestres.map((t) => qte(t.ventes)).join(" + ")} = ${qte(r.ventes)}` },
          { libelle: "Taux de service de l'année (%)", attendu: r.service, tolerance: 0.1, calcul: `${qte(r.ventes)} ÷ ${qte(r.demande)} × 100 = ${pct(r.service)}` },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `Sur l'année, ${c.entreprise} a servi ${pct(r.service)} de la demande qu'elle recevait : ${qte(r.demande - r.ventes)} ${c.unites} ${accordPluriel(c, "demandé")} ne se sont pas ${accordPluriel(c, "vendu")}. L'objectif de la direction porte sur ce taux.`,
        ];
      },
    },
    {
      id: "objectif",
      type: "montants",
      titre: "Ce que demande l'objectif",
      notions: ["dashboard", "capacity"],
      question: (c) => {
        const r = objectifDeService(c);
        return `À demande égale, combien de ${c.unites} faut-il vendre dans l'année pour servir ${pct(r.vise)} de la demande (à l'unité supérieure) ? Combien de plus que cette année ?`;
      },
      champs: (c) => {
        const r = objectifDeService(c);
        return [
          { libelle: "Ventes visées", attendu: r.ventesVisees, tolerance: 1, calcul: `${qte(r.demande)} × ${pct(r.vise)}, arrondi au-dessus = ${qte(r.ventesVisees)}` },
          { libelle: "Ventes en plus", attendu: r.ventesEnPlus, tolerance: 1, calcul: `${qte(r.ventesVisees)} − ${qte(r.ventes)} = ${qte(r.ventesEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `L'objectif ne demande pas de servir toute la demande, mais ${qte(r.ventesEnPlus)} ${c.unites} de plus dans l'année. Le taux de service se calcule sur la demande : c'est elle qu'on multiplie par l'objectif, pas les ventes.`,
        ];
      },
    },
    {
      id: "valeur",
      type: "montants",
      titre: "Ce que vaut l'objectif",
      notions: ["dashboard", "contribution_margin"],
      question: () =>
        "Calculez le prix moyen d'une vente de l'année (chiffre d'affaires ÷ ventes, au centime) et la marge moyenne d'une vente (marge ÷ ventes, au centime), puis le chiffre d'affaires et la marge que rapporteraient les ventes en plus.",
      champs: (c) => {
        const r = objectifDeService(c);
        const tol = Math.max(1, Math.round(r.ventesEnPlus * 0.01));
        return [
          { libelle: "Prix moyen d'une vente", attendu: r.prixMoyen, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.ventes)} = ${eur(r.prixMoyen)}` },
          { libelle: "Marge moyenne d'une vente", attendu: r.margeParVente, calcul: `${eur(r.marge)} ÷ ${qte(r.ventes)} = ${eur(r.margeParVente)}` },
          { libelle: "Chiffre d'affaires en plus", attendu: r.caEnPlus, tolerance: tol, calcul: `${qte(r.ventesEnPlus)} × ${eur(r.prixMoyen)} = ${eur(r.caEnPlus)}` },
          { libelle: "Marge en plus", attendu: r.margeEnPlus, tolerance: tol, calcul: `${qte(r.ventesEnPlus)} × ${eur(r.margeParVente)} = ${eur(r.margeEnPlus)}` },
        ];
      },
      explication: (c) => {
        const r = objectifDeService(c);
        return [
          `Tenir l'objectif rapporterait ${eur(r.margeEnPlus)} de marge par an à ${c.entreprise}. C'est le plafond de ce que la direction peut dépenser pour y arriver (capacité, personnel, planification) : au-delà, l'objectif coûterait plus qu'il ne rapporte.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = objectifDeService(c);
        return [
          {
            texte: `Viser ${qte(r.ventesEnPlus)} ventes de plus, soit ${eur(r.margeEnPlus)} de marge`,
            juste: true,
            retour: `Oui : ${pct(r.vise)} de ${qte(r.demande)} demandes, c'est ${qte(r.ventesVisees)} ventes, ${qte(r.ventesEnPlus)} de plus que cette année ; à ${eur(r.margeParVente)} de marge chacune, l'objectif vaut ${eur(r.margeEnPlus)} par an.`,
          },
          {
            texte: `Viser ${qte(r.toutLeManque)} ventes de plus : toute la demande non servie`,
            juste: false,
            retour: `Non : ce serait servir toute la demande, pas ${pct(r.vise)}. L'objectif laisse de côté ${qte(r.demande - r.ventesVisees)} demandes : il ne faut que ${qte(r.ventesEnPlus)} ventes de plus.`,
          },
          {
            texte: `Viser ${qte(r.ventesEnPlus)} ventes de plus, soit ${eur(r.caEnPlus)} de marge`,
            juste: false,
            retour: `Non : ${eur(r.caEnPlus)}, c'est le chiffre d'affaires de ces ventes. Il faut en retirer les coûts variables : chaque vente laisse ${eur(r.margeParVente)} de marge, soit ${eur(r.margeEnPlus)} en tout.`,
          },
          {
            texte: `Viser ${qte(r.surLaMauvaiseBase)} ventes de plus : l'écart de taux appliqué aux ventes`,
            juste: false,
            retour: `Non : un taux de service se calcule sur la demande. L'écart entre ${pct(r.vise)} et ${pct(r.service)} s'applique aux ${qte(r.demande)} demandes, pas aux ${qte(r.ventes)} ventes : ${qte(r.ventesEnPlus)} ventes de plus.`,
          },
        ];
      },
    },
  ],
};
