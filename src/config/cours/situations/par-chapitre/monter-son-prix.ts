import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../../accords";
import type { Cas } from "../../cas";
import { prixRejoues } from "../../decision";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER : PRIX, FABRIQUER OU ACHETER » : MONTER SON PRIX ?
 * (contrôle de gestion, palier 4).
 *
 * La direction envisage de monter ses prix. Elle sait qu'elle perdra des clients, et
 * demande combien elle peut en perdre avant que la hausse ne lui coûte. L'élève refait
 * seul le raisonnement différentiel du chapitre, dans l'autre sens : la marge d'une unité
 * avant et après la hausse, la plus petite quantité qui garde la marge du trimestre, les
 * ventes que l'on peut perdre, puis la phrase qu'il rend.
 *
 * Le cas est neuf par sa question : le chapitre cherche les ventes qu'une baisse oblige à
 * gagner ; ici, c'est une hausse, plus modeste, et l'on cherche les ventes qu'elle permet
 * de perdre. Les chiffres sont ceux du premier trimestre de l'arène, au prix du
 * trimestre (`prixRejoues`), comme au chapitre ; les charges fixes ne bougent pas.
 */

/**
 * La hausse de prix envisagée : 5 %, une revalorisation de tarifs qu'une entreprise peut
 * passer à ses clients d'une année sur l'autre sans changer d'offre.
 */
export const HAUSSE_DE_PRIX = 0.05;

const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function monterSonPrix(c: Cas) {
  const b = prixRejoues(c.code)[1]!;
  const margeUnitaire = auCentime(b.marge / b.quantite);
  const nouveauPrix = auCentime(b.prix * (1 + HAUSSE_DE_PRIX));
  // Comme au chapitre : le coût variable d'une unité ne bouge pas, toute la hausse va à la marge.
  const margeHaussee = auCentime(margeUnitaire + b.prix * HAUSSE_DE_PRIX);
  // La plus petite quantité qui garde au moins la marge du trimestre.
  const quantiteMinimale = Math.ceil(b.marge / margeHaussee - 1e-9);
  const perte = b.quantite - quantiteMinimale;
  // Les erreurs classiques : perdre autant de ventes que le prix monte ; garder le chiffre d'affaires au lieu de la marge.
  const perteCommeLePrix = Math.round(b.quantite * HAUSSE_DE_PRIX);
  const perteAChiffreEgal = b.quantite - Math.ceil(b.quantite / (1 + HAUSSE_DE_PRIX) - 1e-9);
  return {
    ...b,
    margeUnitaire,
    nouveauPrix,
    margeHaussee,
    quantiteMinimale,
    perte,
    pourcentage: auDixieme((perte / b.quantite) * 100),
    perteCommeLePrix,
    perteAChiffreEgal,
  };
}

export const MONTER_SON_PRIX: Situation = {
  code: "monter-son-prix",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["decider-prix-fabriquer-acheter"],
  commanditaire: "La direction",
  titre: "Monter son prix ?",
  accroche:
    "La direction envisage une hausse de prix et sait qu'elle perdra des clients. Combien peut-elle en perdre avant que la hausse ne lui coûte ?",
  objectifs: [
    "Calculer la marge d'une unité avant et après une hausse de prix",
    "Calculer la plus petite quantité qui garde la marge sur coût variable",
    "Mesurer les ventes qu'une hausse de prix permet de perdre",
    "Rédiger une réponse chiffrée à la direction",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => [
        `« Nous pensons monter nos prix de ${pct(HAUSSE_DE_PRIX * 100)} le trimestre prochain. Nous perdrons des clients, c'est certain. Combien de ventes ${c.entreprise} peut-elle perdre, au plus, sans que sa marge sur coût variable ne baisse ? Les charges fixes, elles, ne bougeront pas. »`,
        "Pas de cours cette fois : vous avez les chiffres du premier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = monterSonPrix(c);
        return {
          titre: `Le premier trimestre · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Unités vendues (${c.unites})`, valeurs: [qte(r.quantite)] },
            { libelle: "Prix moyen, hors taxes", valeurs: [eur(r.prix)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(r.chiffreDAffaires)] },
            { libelle: "Marge sur coût variable du trimestre", valeurs: [eur(r.marge)] },
            { libelle: "Hausse de prix envisagée", valeurs: [pct(HAUSSE_DE_PRIX * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge d'une unité avant et après la hausse, la plus petite quantité qui garde la marge du trimestre, les ventes que l'on peut perdre, et votre réponse.",
    },
    {
      id: "marge-unitaire",
      type: "montants",
      titre: "La marge d'une unité",
      notions: ["contribution_margin"],
      question: () =>
        `Calculez la marge sur coût variable d'une unité au premier trimestre (au centime), le prix après la hausse de ${pct(HAUSSE_DE_PRIX * 100)}, puis la marge d'une unité à ce prix. Le coût variable d'une unité ne change pas.`,
      champs: (c) => {
        const r = monterSonPrix(c);
        return [
          { libelle: "Marge d'une unité aujourd'hui", attendu: r.margeUnitaire, tolerance: 0.01, calcul: `${eur(r.marge)} ÷ ${qte(r.quantite)} = ${eur(r.margeUnitaire)}` },
          { libelle: "Prix après la hausse", attendu: r.nouveauPrix, tolerance: 0.01, calcul: `${eur(r.prix)} × (1 + ${pct(HAUSSE_DE_PRIX * 100)}) = ${eur(r.nouveauPrix)}` },
          {
            libelle: "Marge d'une unité après la hausse",
            attendu: r.margeHaussee,
            tolerance: 0.02,
            calcul: `${eur(r.margeUnitaire)} + ${pct(HAUSSE_DE_PRIX * 100)} × ${eur(r.prix)} = ${eur(r.margeHaussee)}`,
          },
        ];
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `Le prix monte de ${pct(HAUSSE_DE_PRIX * 100)}, mais la marge d'une unité de ${pct(auDixieme((r.margeHaussee / r.margeUnitaire - 1) * 100))} : toute la hausse va à la marge, le coût variable ne bouge pas. Chaque ${c.unite} ${accord(c, "vendu")} au nouveau prix rapporte ${eur(r.margeHaussee)} au lieu de ${eur(r.margeUnitaire)}.`,
        ];
      },
    },
    {
      id: "ventes-perdues",
      type: "montants",
      titre: "Les ventes que l'on peut perdre",
      notions: ["contribution_margin", "price_elasticity"],
      question: () =>
        "Au nouveau prix, quelle est la plus petite quantité qui garde au moins la marge du trimestre (à l'unité supérieure) ? Combien de ventes peut-on donc perdre, au plus, et quelle part des ventes du trimestre cela fait-il, en pourcentage, au dixième ?",
      champs: (c) => {
        const r = monterSonPrix(c);
        return [
          {
            libelle: "Plus petite quantité qui garde la marge",
            attendu: r.quantiteMinimale,
            calcul: `${eur(r.marge)} ÷ ${eur(r.margeHaussee)}, arrondi à l'unité supérieure = ${qte(r.quantiteMinimale)}`,
          },
          { libelle: "Ventes que l'on peut perdre, au plus", attendu: r.perte, calcul: `${qte(r.quantite)} − ${qte(r.quantiteMinimale)} = ${qte(r.perte)}` },
          {
            libelle: "Part des ventes du trimestre (%)",
            attendu: r.pourcentage,
            tolerance: 0.1,
            calcul: `${qte(r.perte)} ÷ ${qte(r.quantite)} × 100 = ${pct(r.pourcentage)}`,
          },
        ];
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `Tant que la hausse ne fait pas perdre plus de ${qte(r.perte)} ${c.unites} sur le trimestre, la marge de ${c.entreprise} ne baisse pas ; comme les charges fixes ne bougent pas, son résultat non plus. Au-delà, elle y perd. Reste à savoir comment les clients réagiront : c'est l'élasticité de la demande au prix, que l'arène fait jouer.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const r = monterSonPrix(c);
        return [
          {
            texte: `Nous pouvons perdre jusqu'à ${qte(r.perte)} ${c.unites}, ${pct(r.pourcentage)} de nos ventes`,
            juste: true,
            retour: `Oui : ${eur(r.marge)} de marge à garder, à ${eur(r.margeHaussee)} par unité, demandent ${qte(r.quantiteMinimale)} ${c.unites} au lieu de ${qte(r.quantite)}. La marge d'une unité monte plus que le prix, en proportion : la hausse supporte donc plus de ${pct(HAUSSE_DE_PRIX * 100)} de ventes perdues.`,
          },
          {
            texte: `Pas plus de ${qte(r.perteCommeLePrix)} ${c.unites}, soit ${pct(HAUSSE_DE_PRIX * 100)} de nos ventes, autant que la hausse du prix`,
            juste: false,
            retour: `Non : le prix monte de ${pct(HAUSSE_DE_PRIX * 100)}, mais la marge d'une unité de ${pct(auDixieme((r.margeHaussee / r.margeUnitaire - 1) * 100))}. C'est la marge qu'il faut garder, et elle supporte ${qte(r.perte)} ${c.unites} ${accordPluriel(c, "perdu")}.`,
          },
          {
            texte: `Jusqu'à ${qte(r.perteAChiffreEgal)} ${c.unites} : à ce volume, le chiffre d'affaires reste le même`,
            juste: false,
            retour: `Non : garder le chiffre d'affaires n'est pas garder la marge. Chaque vente perdue retire aussi son coût variable : on peut en perdre un peu plus, ${qte(r.perte)}, avant que la marge ne baisse.`,
          },
        ];
      },
    },
  ],
};
