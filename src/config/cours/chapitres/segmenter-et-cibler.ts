import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import { ECART_DE_PRIX } from "../decision";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : SEGMENTER ET CIBLER (Bac STMG, mercatique, palier 1).
 *
 * Un marché n'est pas un bloc : il se découpe en clientèles qui n'attendent pas la même chose.
 * Le chapitre lit les clientèles de l'entreprise (leur taille, ce que l'entreprise y vend, le
 * prix qu'elles jugent normal), calcule le poids de chacune et la part de marché qu'on y tient,
 * puis compare ce qui les fait acheter (le prix, la qualité, la publicité) pour choisir une
 * cible selon l'offre.
 *
 * Les clientèles et leurs sensibilités sont celles du scénario ; les tailles, les ventes et le
 * chiffre d'affaires, celles du premier trimestre de l'arène. Le chapitre se joue chez les
 * entreprises à une seule offre : là où chaque produit a ses clientèles (une gamme), il y en
 * aurait trop pour une première lecture. Aucune hypothèse n'est ajoutée.
 */

/** Les entreprises à une seule offre, dont le marché se découpe en quelques clientèles. */
export const SEGMENTATIONS = ENTREPRISES_DU_COURS.filter((code) => !scenarioByCode(code).scenario.products);

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export interface Clientele {
  code: string;
  nom: string;
  taille: number;
  ventes: number;
  chiffreDAffaires: number;
  prixNormal: number;
  /** La demande perdue, en %, si le prix montait de l'écart que l'arène rejoue. */
  sensibilitePrix: number;
  sensibiliteQualite: number;
  sensibilitePublicite: number;
  part: number;
  poids: number;
  aGagner: number;
}

/** Les clientèles du premier trimestre, et les cibles que leurs sensibilités désignent. */
export function segmentation(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const r = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!;
  const brutes = s.market.segments
    .map((g) => ({ g, v: r.market.bySegment[g.code]! }))
    .filter(({ v }) => v.potential >= 0.5 && v.sold >= 0.5);
  const ca = brutes.reduce((t, { v }) => t + v.revenue, 0);
  const clienteles: Clientele[] = brutes.map(({ g, v }) => ({
    code: g.code,
    nom: g.name.replace(/\s*\(.*\)\s*$/, ""),
    taille: Math.round(v.potential),
    ventes: Math.round(v.sold),
    chiffreDAffaires: Math.round(v.revenue),
    prixNormal: g.refPrice,
    sensibilitePrix: auDixieme((1 - Math.pow(1 + ECART_DE_PRIX, g.priceElasticity)) * 100),
    sensibiliteQualite: g.qualitySensitivity,
    sensibilitePublicite: g.marketingSensitivity,
    part: auDixieme((v.sold / v.potential) * 100),
    poids: auDixieme((v.revenue / ca) * 100),
    aGagner: Math.round(v.potential - v.sold),
  }));
  const max = (f: (k: Clientele) => number) => clienteles.reduce((a, b) => (f(b) > f(a) ? b : a));
  return {
    clienteles,
    chiffreDAffaires: Math.round(ca),
    plusGrosse: max((k) => k.chiffreDAffaires),
    premium: max((k) => k.sensibiliteQualite),
    promotion: max((k) => k.sensibilitePrix),
    publicite: max((k) => k.sensibilitePublicite),
    reserve: max((k) => k.aGagner),
    ecart: Math.round(ECART_DE_PRIX * 100),
  };
}

/** Ce que chaque segment est pour l'entreprise, un segment par phrase, ses rôles réunis. */
function rolesParSegment(g: ReturnType<typeof segmentation>) {
  const roles: [Clientele, string][] = [
    [g.plusGrosse, "pèse le plus lourd"],
    [g.reserve, "garde le plus de clients à gagner"],
    [g.premium, "est la cible d'une offre haut de gamme"],
    [g.promotion, "est la cible d'une promotion"],
  ];
  const parSegment = new Map<string, { nom: string; roles: string[] }>();
  for (const [k, r] of roles) parSegment.set(k.code, { nom: k.nom, roles: [...(parSegment.get(k.code)?.roles ?? []), r] });
  return [...parSegment.values()].map(({ nom, roles: rs }) => `« ${nom} » ${rs.length === 1 ? rs[0] : `${rs.slice(0, -1).join(", ")} et ${rs.at(-1)}`}`);
}

/** Le rang d'une sensibilité parmi les clientèles, en mots : la plus forte, la plus faible, entre les deux. */
function rang(k: Clientele, toutes: Clientele[], f: (x: Clientele) => number) {
  const tries = [...toutes].sort((a, b) => f(b) - f(a));
  const i = tries.findIndex((x) => x.code === k.code);
  return i === 0 ? "la plus forte" : i === tries.length - 1 ? "la plus faible" : "moyenne";
}

export const SEGMENTER_ET_CIBLER: Chapitre = {
  code: "segmenter-et-cibler",
  parcours: "stmg",
  palier: 1,
  blocs: [
    "STMG Thème 1 · La définition de l'offre",
  ],
  titre: "Segmenter et cibler",
  accroche:
    "Un marché se découpe en clientèles qui n'attendent pas la même chose. Lesquelles pèsent le plus, où reste-t-il des clients à gagner, et laquelle viser selon l'offre ?",
  objectifs: [
    "Lire les segments d'un marché",
    "Calculer le poids d'un segment et la part de marché qu'on y tient",
    "Comparer ce qui fait acheter chaque segment : le prix, la qualité, la publicité",
    "Choisir une cible selon l'offre",
  ],
  libre: false,
  entreprises: {
    codes: SEGMENTATIONS,
    pourquoi: "ce chapitre lit les clientèles d'une entreprise à une seule offre ; dans une gamme, chaque produit a les siennes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les clientèles du marché",
      notions: ["segmentation"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Le marché ${dE(c.entreprise)} n'est pas un bloc : il se découpe en ${qte(g.clienteles.length)} clientèles, des segments qui n'achètent pas pour les mêmes raisons ni au même prix.`,
          "Le tableau donne, pour le premier trimestre de l'arène, la taille de chaque segment (ce qu'il aurait pu acheter), ce que l'entreprise y a vendu, ce qu'il lui a rapporté, et le prix qu'il juge normal.",
        ];
      },
      tableau: (c) => {
        const g = segmentation(c);
        return {
          titre: "Les segments, premier trimestre",
          colonnes: g.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: `Taille du segment (${c.unites})`, valeurs: g.clienteles.map((k) => qte(k.taille)) },
            { libelle: `Ventes ${dE(c.entreprise)}`, valeurs: g.clienteles.map((k) => qte(k.ventes)) },
            { libelle: "Chiffre d'affaires", valeurs: g.clienteles.map((k) => eur(k.chiffreDAffaires)) },
            { libelle: "Prix jugé normal", valeurs: g.clienteles.map((k) => eur(k.prixNormal)) },
          ],
        };
      },
      repere: () => "Poids d'un segment = son chiffre d'affaires ÷ le chiffre d'affaires total × 100. Part de marché dans un segment = ventes ÷ taille du segment × 100.",
    },
    {
      id: "poids",
      type: "montants",
      titre: "Le poids d'un segment",
      notions: ["segmentation", "demand_market_share"],
      question: (c) => {
        const g = segmentation(c);
        const k = g.plusGrosse;
        return `Le segment « ${k.nom} » a rapporté ${eur(k.chiffreDAffaires)} sur ${eur(g.chiffreDAffaires)}. Calculez son poids dans le chiffre d'affaires, puis la part de marché que l'entreprise y tient (${qte(k.ventes)} ventes sur ${qte(k.taille)}), en pourcentage au dixième, et le nombre d'achats du segment qu'elle n'a pas servis.`;
      },
      champs: (c) => {
        const k = segmentation(c).plusGrosse;
        const g = segmentation(c);
        return [
          { libelle: "Poids du segment (%)", attendu: k.poids, calcul: `${eur(k.chiffreDAffaires)} ÷ ${eur(g.chiffreDAffaires)} × 100 = ${pct(k.poids)}`, tolerance: 0.1 },
          { libelle: "Part de marché dans le segment (%)", attendu: k.part, calcul: `${qte(k.ventes)} ÷ ${qte(k.taille)} × 100 = ${pct(k.part)}`, tolerance: 0.1 },
          { libelle: "Achats du segment non servis", attendu: k.aGagner, calcul: `${qte(k.taille)} − ${qte(k.ventes)} = ${qte(k.aGagner)}` },
        ];
      },
      explication: (c) => {
        const k = segmentation(c).plusGrosse;
        return [
          `Le segment « ${k.nom} » fait ${pct(k.poids)} du chiffre d'affaires : c'est le cœur de clientèle ${dE(c.entreprise)}. Pourtant l'entreprise n'y tient que ${pct(k.part)} du marché : ${qte(k.aGagner)} achats possibles sont allés ailleurs.`,
        ];
      },
    },
    {
      id: "reserve",
      type: "choix",
      titre: "Où sont les clients à gagner",
      notions: ["segmentation"],
      question: (c) => `Dans quel segment ${c.entreprise} a-t-elle le plus de clients à gagner, c'est-à-dire le plus d'achats possibles qu'elle n'a pas servis ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.reserve.code,
          retour:
            k.code === g.reserve.code
              ? `Oui : ${qte(k.taille)} achats possibles, ${qte(k.ventes)} servis, soit ${qte(k.aGagner)} à gagner. C'est le segment où une action commerciale a le plus de place pour grandir.`
              : `Non : ${qte(k.aGagner)} achats à gagner, contre ${qte(g.reserve.aGagner)} dans le segment « ${g.reserve.nom} ».`,
        }));
      },
    },
    {
      id: "sensibilites",
      type: "lecture",
      titre: "Ce qui fait acheter chaque segment",
      notions: ["segmentation", "price_elasticity"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Chaque segment réagit à sa façon. Si ${c.entreprise} montait son prix de ${qte(g.ecart)} %, certains partiraient beaucoup, d'autres presque pas. De même, certains choisissent sur la qualité, d'autres se laissent convaincre par la publicité.`,
          "Le tableau range ces sensibilités : c'est ce qui permet de choisir une cible selon l'offre qu'on veut lui faire.",
        ];
      },
      tableau: (c) => {
        const g = segmentation(c);
        return {
          titre: "Les sensibilités de chaque segment",
          colonnes: g.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: `Demande perdue si le prix monte de ${qte(g.ecart)} %`, valeurs: g.clienteles.map((k) => pct(k.sensibilitePrix)) },
            { libelle: "Sensibilité à la qualité", valeurs: g.clienteles.map((k) => rang(k, g.clienteles, (x) => x.sensibiliteQualite)) },
            { libelle: "Sensibilité à la publicité", valeurs: g.clienteles.map((k) => rang(k, g.clienteles, (x) => x.sensibilitePublicite)) },
          ],
        };
      },
    },
    {
      id: "cible-premium",
      type: "choix",
      titre: "Une cible pour une offre haut de gamme",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => `${c.entreprise} imagine une offre haut de gamme : meilleure qualité, prix plus élevé. Quel segment cibler en priorité ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.premium.code,
          retour:
            k.code === g.premium.code
              ? `Oui : c'est le segment le plus sensible à la qualité, et une hausse de prix de ${qte(g.ecart)} % ne lui ferait perdre que ${pct(k.sensibilitePrix)} de sa demande. Il paie pour mieux, et juge normal un prix de ${eur(k.prixNormal)}.`
              : `Non : ce segment est moins sensible à la qualité que « ${g.premium.nom} », et perdrait ${pct(k.sensibilitePrix)} de sa demande pour ${qte(g.ecart)} % de hausse.`,
        }));
      },
    },
    {
      id: "cible-promotion",
      type: "choix",
      titre: "Une cible pour une promotion",
      notions: ["segmentation", "price_elasticity"],
      question: (c) => `${c.entreprise} prépare une promotion : un prix baissé pendant quelques semaines. Quel segment réagira le plus ?`,
      options: (c) => {
        const g = segmentation(c);
        return g.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === g.promotion.code,
          retour:
            k.code === g.promotion.code
              ? `Oui : c'est le segment le plus sensible au prix. Une hausse de ${qte(g.ecart)} % lui ferait perdre ${pct(k.sensibilitePrix)} de sa demande ; une baisse l'attire autant. Une promotion vise ce segment, et coûte cher si elle est offerte à ceux qui auraient acheté de toute façon.`
              : `Non : ce segment réagit moins au prix (${pct(k.sensibilitePrix)} de demande perdue pour ${qte(g.ecart)} % de hausse) que « ${g.promotion.nom} » (${pct(g.promotion.sensibilitePrix)}).`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation"],
      texte: (c) => {
        const g = segmentation(c);
        return [
          `Chez ${c.entreprise}, ${rolesParSegment(g).join(" ; ")}.`,
          "Segmenter, c'est découper le marché en groupes qui achètent pour les mêmes raisons ; cibler, c'est choisir ceux qu'on veut servir ; positionner, c'est leur faire une offre qui leur parle. Une même entreprise peut viser plusieurs segments, avec une offre pour chacun.",
        ];
      },
      repere: () => "Segmenter : découper le marché en groupes homogènes. Cibler : choisir les segments à servir. Positionner : construire l'offre qui leur parle.",
    },
  ],
};
