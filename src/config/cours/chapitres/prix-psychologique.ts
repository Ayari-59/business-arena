import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { priceEffect } from "../../../engine/market/attraction";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre } from "../types";
import { SEGMENTATIONS } from "./segmenter-et-cibler";

/**
 * CHAPITRE : LE PRIX PSYCHOLOGIQUE (Bac STMG, mercatique, palier 1).
 *
 * Le client ne juge pas un prix en euros, mais par rapport à ce qu'il trouve normal, à ce qui
 * lui paraît trop bon marché pour être sérieux, et à des seuils ronds qu'il ne veut pas franchir.
 * Le chapitre lit ces repères pour chaque clientèle, situe le prix de l'entreprise, puis mesure ce
 * que coûtent vingt centimes de part et d'autre d'un seuil psychologique.
 *
 * Les repères sont ceux du scénario (le prix jugé normal, le prix en dessous duquel le client se
 * méfie, les seuils psychologiques) ; la demande de part et d'autre du seuil, celle que calcule
 * la fonction d'attraction du moteur (`priceEffect`). Le chapitre se joue chez les entreprises à
 * une seule offre. Aucune hypothèse n'est ajoutée.
 */

/** L'écart de part et d'autre du seuil : un prix qui finit en ,90 face à un prix qui finit en ,10. */
const DE_PART_ET_D_AUTRE = 0.1;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct2 = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les repères de prix de chaque clientèle, et le seuil que le chapitre étudie. */
export function prixPsychologique(c: Cas) {
  const s = scenarioByCode(c.code).scenario;
  const r = anneeJouee(c.code).partie.rounds[0]!.results["joueur"]!;
  const prix = c.gestion.prixMoyen;
  const clienteles = s.market.segments
    .filter((g) => (r.market.bySegment[g.code]?.sold ?? 0) >= 0.5)
    .map((g) => ({
      code: g.code,
      nom: g.name.replace(/\s*\(.*\)\s*$/, ""),
      tropBas: g.minAcceptablePrice,
      normal: g.refPrice,
      seuil: g.psychThresholds[0]?.threshold ?? null,
      chiffreDAffaires: Math.round(r.market.bySegment[g.code]!.revenue),
      ecart: auDixieme((prix / g.refPrice - 1) * 100),
      segment: g,
    }));
  // Le segment du seuil : celui qui rapporte le plus parmi ceux qui ont un seuil psychologique.
  const etudie = clienteles.filter((k) => k.seuil !== null).reduce((a, b) => (b.chiffreDAffaires > a.chiffreDAffaires ? b : a));
  const seuil = etudie.seuil!;
  const sous = Math.round((seuil - DE_PART_ET_D_AUTRE) * 100) / 100;
  const dessus = Math.round((seuil + DE_PART_ET_D_AUTRE) * 100) / 100;
  const perte = auDixieme((1 - priceEffect(dessus, etudie.segment) / priceEffect(sous, etudie.segment)) * 100);
  const hausse = Math.round((dessus / sous - 1) * 10000) / 100;
  return {
    prix,
    clienteles,
    etudie,
    seuil,
    sous,
    dessus,
    perte,
    hausse,
    rapport: Math.round(perte / hausse),
    elasticite: Math.abs(etudie.segment.priceElasticity),
    avantageux: clienteles.reduce((a, b) => (b.ecart < a.ecart ? b : a)),
  };
}

export const PRIX_PSYCHOLOGIQUE: Chapitre = {
  code: "prix-psychologique",
  parcours: "stmg",
  palier: 1,
  blocs: [
    "STMG Thème 1 · La définition de l'offre",
    "BUT TC · Conduire les actions marketing",
    "BUT GACO · Concevoir la démarche marketing",
  ],
  titre: "Le prix psychologique",
  accroche:
    "Le client ne juge pas un prix en euros : il le compare à ce qu'il trouve normal, et refuse de franchir certains seuils. Ce que valent vingt centimes au bon endroit.",
  objectifs: [
    "Lire les repères de prix d'une clientèle : prix jugé normal, prix trop bas, seuil psychologique",
    "Situer le prix de l'entreprise face au prix jugé normal",
    "Mesurer l'effet d'un seuil psychologique sur la demande",
    "Expliquer les prix qui finissent en ,90",
  ],
  libre: false,
  entreprises: {
    codes: SEGMENTATIONS,
    pourquoi: "ce chapitre lit les repères de prix des clientèles d'une entreprise à une seule offre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que le client trouve normal",
      notions: ["psych_price"],
      texte: (c) => {
        const p = prixPsychologique(c);
        return [
          `Pour connaître le prix qu'un client accepte, le mercaticien lui pose deux questions : en dessous de quel prix douteriez-vous de la qualité ? Au-dessus de quel prix renonceriez-vous ? Entre les deux se trouve le prix qu'il juge normal.`,
          `Dans l'arène, chaque clientèle a ses repères. ${c.entreprise} vend à ${eur(p.prix)} : le tableau dit comment chaque clientèle le reçoit.`,
        ];
      },
      tableau: (c) => {
        const p = prixPsychologique(c);
        return {
          titre: "Les repères de prix de chaque clientèle",
          colonnes: p.clienteles.map((k) => k.nom),
          lignes: [
            { libelle: "Méfiance en dessous de", valeurs: p.clienteles.map((k) => eur(k.tropBas)) },
            { libelle: "Prix jugé normal", valeurs: p.clienteles.map((k) => eur(k.normal)) },
            { libelle: "Seuil psychologique", valeurs: p.clienteles.map((k) => (k.seuil === null ? "aucun" : eur(k.seuil))) },
          ],
        };
      },
      repere: () => "Prix psychologique : celui que le client juge acceptable, entre le prix qui le fait douter de la qualité et celui qui le fait renoncer.",
    },
    {
      id: "ecart",
      type: "montants",
      titre: "Le prix face au prix jugé normal",
      notions: ["psych_price"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `${c.entreprise} vend à ${eur(p.prix)}. La clientèle « ${p.etudie.nom} » juge normal un prix de ${eur(p.etudie.normal)}. Calculez l'écart du prix de l'entreprise au prix jugé normal, en pourcentage au dixième (positif s'il est plus cher), puis ce qui sépare le prix de l'entreprise du seuil psychologique de ${eur(p.seuil)}.`;
      },
      champs: (c) => {
        const p = prixPsychologique(c);
        return [
          { libelle: "Écart au prix jugé normal (%)", attendu: p.etudie.ecart, calcul: `(${eur(p.prix)} ÷ ${eur(p.etudie.normal)} − 1) × 100 = ${pct(p.etudie.ecart)}`, tolerance: 0.1 },
          { libelle: "Écart au seuil psychologique (€)", attendu: Math.round((p.seuil - p.prix) * 100) / 100, calcul: `${eur(p.seuil)} − ${eur(p.prix)} = ${eur(Math.round((p.seuil - p.prix) * 100) / 100)}` },
        ];
      },
      explication: (c) => {
        const p = prixPsychologique(c);
        return [
          p.prix < p.seuil
            ? `Le prix ${dE(c.entreprise)} reste sous le seuil de ${eur(p.seuil)} : il pourrait monter de ${eur(Math.round((p.seuil - p.prix) * 100) / 100)} avant d'atteindre ce seuil.`
            : `Le prix ${dE(c.entreprise)} est déjà au-dessus du seuil de ${eur(p.seuil)} : cette clientèle le perçoit comme passé de l'autre côté.`,
        ];
      },
    },
    {
      id: "avantageux",
      type: "choix",
      titre: "La clientèle qui trouve le prix avantageux",
      notions: ["psych_price", "segmentation"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `Au même prix de ${eur(p.prix)}, pour quelle clientèle ${c.entreprise} paraît-elle la plus avantageuse, comparée au prix que cette clientèle juge normal ?`;
      },
      options: (c) => {
        const p = prixPsychologique(c);
        return p.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === p.avantageux.code,
          retour:
            k.code === p.avantageux.code
              ? `Oui : elle juge normal ${eur(k.normal)}, et ${c.entreprise} vend à ${eur(p.prix)}, ${k.ecart < 0 ? `${pct(Math.abs(k.ecart))} moins cher` : k.ecart === 0 ? "exactement ce prix, quand les autres clientèles le trouvent plus cher" : `${pct(k.ecart)} plus cher, le plus petit écart des clientèles`}. Le même prix n'est pas reçu de la même façon par toutes les clientèles.`
              : `Non : elle juge normal ${eur(k.normal)}, et le prix de l'entreprise est ${k.ecart === 0 ? "exactement à ce niveau" : `${pct(Math.abs(k.ecart))} ${k.ecart < 0 ? "en dessous" : "au-dessus"}`}.`,
        }));
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Vingt centimes de part et d'autre du seuil",
      notions: ["psych_price", "price_elasticity"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `Pour la clientèle « ${p.etudie.nom} », l'arène calcule qu'en passant de ${eur(p.sous)} à ${eur(p.dessus)}, ${c.entreprise} perdrait ${pct(p.perte)} de sa demande. Calculez la hausse de prix, en pourcentage au centième, puis le rapport entre la demande perdue et la hausse de prix, à l'unité.`;
      },
      champs: (c) => {
        const p = prixPsychologique(c);
        return [
          { libelle: "Hausse de prix (%)", attendu: p.hausse, calcul: `(${eur(p.dessus)} ÷ ${eur(p.sous)} − 1) × 100 = ${pct2(p.hausse)}`, tolerance: 0.01 },
          { libelle: "Demande perdue ÷ hausse de prix", attendu: p.rapport, calcul: `${qte(p.perte)} ÷ ${qte(p.hausse)} = ${qte(p.rapport)}`, tolerance: Math.max(1, Math.round(p.rapport * 0.1)) },
        ];
      },
      explication: (c) => {
        const p = prixPsychologique(c);
        return [
          `Loin du seuil, chaque point de prix en plus coûte environ ${qte(p.elasticite)} ${p.elasticite < 2 ? "point" : "points"} de demande à cette clientèle. Au seuil de ${eur(p.seuil)}, une hausse de ${pct2(p.hausse)} en coûte ${pct(p.perte)} : ${qte(p.rapport)} fois plus que la hausse elle-même. Le client ne voit pas vingt centimes : il voit un prix qui passe la barre.`,
        ];
      },
    },
    {
      id: "virgule-quatre-vingt-dix",
      type: "choix",
      titre: "Pourquoi tant de prix finissent en ,90",
      notions: ["psych_price"],
      question: (c) => {
        const p = prixPsychologique(c);
        return `${c.entreprise} hésite entre ${eur(p.sous)} et ${eur(p.dessus)}. Que lui conseiller ?`;
      },
      options: (c) => {
        const p = prixPsychologique(c);
        return [
          {
            texte: `${eur(p.sous)} : rester sous le seuil psychologique`,
            juste: true,
            retour: `Oui : ${eur(p.sous)} garde la clientèle sous la barre de ${eur(p.seuil)}. Vingt centimes de moins sur chaque vente, mais ${pct(p.perte)} de demande gardée : c'est pourquoi tant de prix finissent en ,90 ou en ,99.`,
          },
          {
            texte: `${eur(p.dessus)} : vingt centimes de plus sur chaque vente`,
            juste: false,
            retour: `Non : vingt centimes de plus par vente, mais ${pct(p.perte)} de la demande perdue. Sur cent ventes, l'entreprise gagnerait vingt euros, mais perdrait environ ${qte(Math.round(p.perte))} ventes.`,
          },
          {
            texte: "C'est pareil : vingt centimes ne changent rien",
            juste: false,
            retour: `Non : pour un client, ${eur(p.sous)} et ${eur(p.dessus)} ne sont pas du même côté de la barre de ${eur(p.seuil)}. L'arène le chiffre : ${pct(p.perte)} de demande en moins.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["psych_price"],
      texte: (c) => {
        const p = prixPsychologique(c);
        return [
          `Un prix se juge par rapport à des repères : le prix normal de chaque clientèle, celui qui la fait douter, et les seuils ronds. Chez ${c.entreprise}, franchir le seuil de ${eur(p.seuil)} pour vingt centimes coûterait ${pct(p.perte)} de la demande de la clientèle « ${p.etudie.nom} ».`,
          "Fixer un prix, c'est donc tenir compte du coût (pour ne pas perdre d'argent), de la concurrence (pour rester dans la course) et de la psychologie du client (pour rester dans ce qu'il accepte).",
        ];
      },
      repere: () => "Un prix psychologique se place sous un seuil rond (9,90 € plutôt que 10 €) et dans la zone que la clientèle juge acceptable.",
    },
  ],
};
