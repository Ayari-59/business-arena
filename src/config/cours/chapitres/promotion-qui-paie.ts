import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accordPluriel } from "../accords";
import type { Cas } from "../cas";
import { ECART_DE_PRIX, prixRejoues } from "../decision";
import type { Chapitre } from "../types";
import { COMMERCES } from "./taux-de-marque";

/**
 * CHAPITRE : LA PROMOTION QUI PAIE (BTS MCO, palier 4).
 *
 * Une remise sur tout le trimestre : ce qu'elle retire à chaque vente, le volume qu'il
 * faudrait vendre en plus pour garder la même marge, puis ce que l'arène a vraiment vendu à
 * ce prix. Selon le commerce, la promotion paie, ou elle ne vend rien de plus parce que le
 * rayon ou la salle ne pouvaient pas suivre.
 *
 * Aucune hypothèse : la remise est l'écart de prix que l'arène rejoue au chapitre « Décider »
 * (`ECART_DE_PRIX`), et le trimestre rejoué à ce prix (`prixRejoues`) donne les ventes, les
 * ventes manquées et la production. La marge se calcule ici comme dans tout le parcours :
 * les ventes multipliées par le prix moins le coût variable d'une unité.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;

/** La promotion, calculée puis jouée par l'arène. */
export function promotion(c: Cas) {
  const [baisse, normal] = prixRejoues(c.code) as [ReturnType<typeof prixRejoues>[number], ReturnType<typeof prixRejoues>[number]];
  const cvu = c.gestion.coutVariableUnitaire;
  const prix = normal.prix;
  const prixPromo = auCentime(prix * (1 - ECART_DE_PRIX));
  const mcv = auCentime(prix - cvu);
  const mcvPromo = auCentime(prixPromo - cvu);
  const margeNormale = Math.round(normal.quantite * mcv);
  const volumeNecessaire = Math.ceil(margeNormale / mcvPromo - 1e-9);
  const margePromo = Math.round(baisse.quantite * mcvPromo);
  const aSuivi = baisse.quantite > normal.quantite * 1.01;
  return {
    remise: ECART_DE_PRIX * 100,
    cvu,
    prix,
    prixPromo,
    mcv,
    mcvPromo,
    baisseDeLaMarge: auDixieme(((mcv - mcvPromo) / mcv) * 100),
    quantite: normal.quantite,
    margeNormale,
    volumeNecessaire,
    hausseNecessaire: auDixieme((volumeNecessaire / normal.quantite - 1) * 100),
    quantitePromo: baisse.quantite,
    margePromo,
    gain: margePromo - margeNormale,
    perdues: normal.perdues,
    perduesPromo: baisse.perdues,
    aSuivi,
  };
}

export const PROMOTION_QUI_PAIE: Chapitre = {
  code: "promotion-qui-paie",
  parcours: "mco",
  palier: 4,
  blocs: [
    "BTS MCO Bloc 2 · Animer et dynamiser l'offre commerciale",
    "Bac pro MCV Bloc 4A · Animer et gérer l'espace commercial",
  ],
  titre: "La promotion qui paie",
  accroche:
    "Une remise attire des clients, mais elle se paie sur chaque vente, même celles qui auraient eu lieu sans elle. Combien faut-il vendre en plus ? Et l'arène les a-t-elle vendus ?",
  objectifs: [
    "Calculer ce qu'une remise retire à la marge d'une unité",
    "Calculer le volume nécessaire pour garder la même marge",
    "Comparer ce volume à ce que le marché a vraiment acheté",
    "Dire ce qui empêche une promotion de payer",
  ],
  libre: false,
  entreprises: {
    codes: COMMERCES,
    pourquoi: "ce chapitre suit une promotion de point de vente, qui accueille ou livre ses clients un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une remise sur tout le trimestre",
      notions: ["markdown", "contribution_margin"],
      texte: (c) => {
        const p = promotion(c);
        return [
          `Au premier trimestre, ${c.entreprise} vend ${qte(p.quantite)} ${c.unites} au prix moyen de ${eur(p.prix)} hors taxes. Chaque ${c.unite} lui coûte ${eur(p.cvu)} de coûts variables.`,
          `Le manager propose une promotion : ${pct(p.remise)} de remise sur tout le trimestre. Elle attirera des clients ; elle s'appliquera aussi à tous ceux qui seraient venus sans elle.`,
        ];
      },
      repere: () => "Volume nécessaire = marge sans promotion ÷ marge d'une unité en promotion.",
    },
    {
      id: "marge-unitaire",
      type: "montants",
      titre: "Ce que la remise retire",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const p = promotion(c);
        return `Calculez le prix en promotion (${pct(p.remise)} de moins que ${eur(p.prix)}), la marge sur coût variable d'une unité au prix normal puis en promotion, et la baisse de cette marge en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const p = promotion(c);
        return [
          { libelle: "Prix en promotion", attendu: p.prixPromo, calcul: `${eur(p.prix)} × ${(1 - p.remise / 100).toLocaleString("fr-FR")} = ${eur(p.prixPromo)}` },
          { libelle: "Marge d'une unité au prix normal", attendu: p.mcv, calcul: `${eur(p.prix)} − ${eur(p.cvu)} = ${eur(p.mcv)}` },
          { libelle: "Marge d'une unité en promotion", attendu: p.mcvPromo, calcul: `${eur(p.prixPromo)} − ${eur(p.cvu)} = ${eur(p.mcvPromo)}` },
          { libelle: "Baisse de la marge d'une unité (%)", attendu: p.baisseDeLaMarge, calcul: `(${eur(p.mcv)} − ${eur(p.mcvPromo)}) ÷ ${eur(p.mcv)} × 100 = ${pct(p.baisseDeLaMarge)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const p = promotion(c);
        return [
          `${pct(p.remise)} de remise sur le prix, c'est ${pct(p.baisseDeLaMarge)} de marge en moins sur chaque ${c.unite} : la remise se prend tout entière sur la marge, jamais sur le coût.`,
        ];
      },
    },
    {
      id: "volume-necessaire",
      type: "montants",
      titre: "Combien vendre en plus",
      notions: ["markdown", "contribution_margin"],
      question: (c) => {
        const p = promotion(c);
        return `Sans promotion, le trimestre laisse ${qte(p.quantite)} × ${eur(p.mcv)} de marge. Calculez cette marge (à l'euro), le volume qu'il faudrait vendre en promotion pour la garder (arrondi au-dessus), puis la hausse des ventes que cela suppose, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const p = promotion(c);
        return [
          { libelle: "Marge du trimestre sans promotion", attendu: p.margeNormale, calcul: `${qte(p.quantite)} × ${eur(p.mcv)} = ${eur(p.margeNormale)}`, tolerance: 1 },
          { libelle: "Volume nécessaire en promotion", attendu: p.volumeNecessaire, calcul: `${eur(p.margeNormale)} ÷ ${eur(p.mcvPromo)} = ${qte(p.volumeNecessaire)}`, tolerance: 1 },
          { libelle: "Hausse des ventes nécessaire (%)", attendu: p.hausseNecessaire, calcul: `(${qte(p.volumeNecessaire)} ÷ ${qte(p.quantite)} − 1) × 100 = ${pct(p.hausseNecessaire)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const p = promotion(c);
        return [`Pour que ${pct(p.remise)} de remise ne coûte rien, il faut vendre ${pct(p.hausseNecessaire)} de plus. Une petite remise demande un gros surcroît de ventes.`];
      },
    },
    {
      id: "l-arene-joue",
      type: "montants",
      titre: "L'arène a joué la promotion",
      notions: ["markdown", "price_elasticity"],
      question: (c) => {
        const p = promotion(c);
        return `L'arène a rejoué le trimestre au prix promotionnel, toutes les autres décisions restant les mêmes : ${c.entreprise} a vendu ${qte(p.quantitePromo)} ${c.unites}. Calculez la marge du trimestre en promotion (à l'euro), puis ce que la promotion a fait gagner ou perdre (négatif si elle a coûté).`;
      },
      champs: (c) => {
        const p = promotion(c);
        return [
          { libelle: "Marge du trimestre en promotion", attendu: p.margePromo, calcul: `${qte(p.quantitePromo)} × ${eur(p.mcvPromo)} = ${eur(p.margePromo)}`, tolerance: 1 },
          { libelle: "Gain ou perte de la promotion", attendu: p.gain, calcul: `${eur(p.margePromo)} − ${eur(p.margeNormale)} = ${eur(p.gain)}`, tolerance: 2 },
        ];
      },
      explication: (c) => {
        const p = promotion(c);
        return [
          p.gain >= 0
            ? `La promotion a payé : ${qte(p.quantitePromo)} ${c.unites} ${accordPluriel(c, "vendu")}, au-delà des ${qte(p.volumeNecessaire)} nécessaires, et ${eur(p.gain)} de marge en plus.`
            : `La promotion a coûté ${eur(-p.gain)} de marge : ${qte(p.quantitePromo)} ${c.unites} ${accordPluriel(c, "vendu")}, loin des ${qte(p.volumeNecessaire)} nécessaires.`,
        ];
      },
    },
    {
      id: "pourquoi",
      type: "choix",
      titre: "Pourquoi elle a payé, ou non",
      notions: ["markdown", "stock", "capacity"],
      question: (c) => {
        const p = promotion(c);
        return `En promotion, ${c.entreprise} a vendu ${qte(p.quantitePromo)} ${c.unites} contre ${qte(p.quantite)} au prix normal, et manqué ${qte(p.perduesPromo)} ventes contre ${qte(p.perdues)}. Qu'est-ce qui explique d'abord le résultat ?`;
      },
      options: (c) => {
        const p = promotion(c);
        // Trois issues : la promotion a payé (les ventes ont suivi au-delà du volume nécessaire), les
        // ventes ont suivi sans l'atteindre (la remise coûte plus qu'elle ne rapporte), ou l'offre bloquait.
        const paye = p.aSuivi && p.quantitePromo >= p.volumeNecessaire;
        const pasAssez = p.aSuivi && !paye;
        const suivi = {
          texte: "Les clients ont répondu à la remise, et l'entreprise a pu les servir.",
          juste: paye,
          retour: paye
            ? `Oui. La remise a attiré assez de clients, et ${c.entreprise} avait de quoi les servir : ${qte(p.quantitePromo)} ventes pour ${qte(p.volumeNecessaire)} nécessaires.`
            : pasAssez
              ? `Ils ont répondu, et ${c.entreprise} les a servis, mais pas en nombre suffisant : ${qte(p.quantitePromo)} ventes pour ${qte(p.volumeNecessaire)} nécessaires. Cela n'explique pas le résultat.`
              : `Les clients ont bien répondu (les ventes manquées ont grimpé à ${qte(p.perduesPromo)}), mais ${c.entreprise} n'a pas pu les servir.`,
        };
        const insuffisant = {
          texte: "Les clients ont suivi, mais pas assez pour payer la remise donnée sur chaque vente.",
          juste: pasAssez,
          retour: pasAssez
            ? `Oui. ${c.entreprise} a vendu ${qte(p.quantitePromo - p.quantite)} ${c.unites} de plus, mais il en fallait ${qte(p.volumeNecessaire - p.quantite)} pour garder sa marge : la remise, payée sur chaque vente, coûte plus que le volume ne rapporte.`
            : paye
              ? `Au contraire : ${qte(p.quantitePromo)} ventes, c'est au moins les ${qte(p.volumeNecessaire)} qu'il fallait pour garder la marge.`
              : `Les ventes n'ont presque pas bougé : ce n'est pas l'élan des clients qui a manqué, c'est l'offre.`,
        };
        const bloque = {
          texte: "L'entreprise ne pouvait pas vendre plus : son stock ou sa capacité étaient déjà au maximum.",
          juste: !p.aSuivi,
          retour: !p.aSuivi
            ? `Oui. Les ventes n'ont presque pas bougé, mais les ventes manquées sont passées de ${qte(p.perdues)} à ${qte(p.perduesPromo)} : la demande était là, l'offre ne suivait pas. La remise a été donnée à des clients qui seraient venus de toute façon.`
            : `Au contraire : ${c.entreprise} a vendu ${qte(p.quantitePromo - p.quantite)} ${c.unites} de plus, elle avait de quoi servir le surplus.`,
        };
        return [
          suivi,
          insuffisant,
          bloque,
          {
            texte: "La remise était trop faible pour être vue.",
            juste: false,
            retour: "La demande a bien bougé avec le prix : c'est ce qui se passe derrière, le stock ou la salle, qui décide si la promotion paie.",
          },
        ];
      },
    },
    {
      id: "avant-de-lancer",
      type: "choix",
      titre: "Avant de lancer une promotion",
      notions: ["markdown"],
      question: () => "Quelle vérification le manager doit-il faire avant de lancer une promotion ?",
      options: () => [
        {
          texte: "S'assurer que le stock, l'équipe ou la salle pourront servir le surplus de ventes nécessaire.",
          juste: true,
          retour: "Oui. Une promotion ne paie que si elle vend le volume nécessaire, et ce volume, il faut pouvoir le servir. Sinon la remise ne fait que baisser la marge des ventes qui auraient eu lieu.",
        },
        {
          texte: "Choisir la remise la plus forte possible, pour attirer le plus de monde.",
          juste: false,
          retour: "Plus la remise est forte, plus le volume nécessaire grimpe : au-delà d'un certain point, aucune affluence ne la rembourse.",
        },
        {
          texte: "Vérifier que le chiffre d'affaires augmentera.",
          juste: false,
          retour: "Le chiffre d'affaires peut monter pendant que la marge baisse : c'est la marge qu'il faut regarder.",
        },
      ],
    },
  ],
};
