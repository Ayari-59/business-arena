import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_DECISION, decision } from "../../chapitres/decider";
import { demandeAuPrix, trimestreDeDecision } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DÉCIDER : PRIX, FABRIQUER OU ACHETER » : MONTER SON PRIX ?
 * (contrôle de gestion, palier 4).
 *
 * La direction envisage de monter ses prix de 5 %. Elle sait qu'elle perdra des clients, et demande
 * combien elle peut en perdre avant que la hausse ne lui coûte. L'élève refait seul le raisonnement
 * différentiel du chapitre, dans l'autre sens : la marge d'une enceinte avant et après la hausse, la
 * plus petite quantité qui garde la marge du trimestre (un curseur la fait trouver avant le calcul),
 * les ventes que l'on peut perdre. Puis il croise ce seuil avec la demande de l'étude de marché : au
 * plan de production du trimestre, la demande dépasse encore ce que la ligne fabrique, et la hausse ne
 * fera perdre aucune vente. Il retrouve à rebours le prix le plus haut qui garde toutes les ventes.
 * La réponse demande un jugement : comparer la baisse de la demande au seuil, c'est oublier que le
 * plan, pas la demande, bornait les ventes.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `decision` et du modèle `trimestreDeDecision`. Les charges fixes du trimestre
 * valent 93 549 € (trois mois de janvier) ; elles ne bougent pas avec le prix.
 */

/**
 * La hausse de prix envisagée : 5 %, une revalorisation de tarifs qu'une entreprise peut passer à ses
 * clients d'une année sur l'autre sans changer d'offre.
 */
export const HAUSSE_DE_PRIX = 0.05;

/** Les bornes du curseur des ventes perdues, en enceintes. */
export const VENTES_PERDUES_DU_CURSEUR = { min: 0, max: 1_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export type Verdict = "aucune-vente-perdue" | "perte-supportable" | "perte-trop-forte";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function monterSonPrix(c: Pick<Cas, "code">) {
  const k = decision(c);
  const b = k.base;
  const margeUnitaire = b.margeFabriquee;
  const nouveauPrix = auCentime(b.prix * (1 + HAUSSE_DE_PRIX));
  // Comme au chapitre : le coût variable d'une enceinte ne bouge pas, toute la hausse va à la marge.
  const margeHaussee = auCentime(margeUnitaire + b.prix * HAUSSE_DE_PRIX);
  // La plus petite quantité qui garde au moins la marge du trimestre.
  const quantiteMinimale = Math.ceil(b.marge / margeHaussee - 1e-9);
  const perte = b.ventes - quantiteMinimale;
  // Les erreurs classiques : perdre autant de ventes que le prix monte ; garder le chiffre d'affaires au lieu de la marge.
  const perteCommeLePrix = Math.round(b.ventes * HAUSSE_DE_PRIX);
  const perteAChiffreEgal = b.ventes - Math.ceil(b.ventes / (1 + HAUSSE_DE_PRIX) - 1e-9);
  // Le croisement avec l'étude de marché : la demande au nouveau prix, au plan de production du trimestre.
  const apres = trimestreDeDecision(k.f, { prix: nouveauPrix });
  const baisseDeLaDemande = b.demande - apres.demande;
  const ventesPerdues = b.ventes - apres.ventes;
  // Le calcul à rebours : le prix le plus haut, au centime, où la demande couvre encore la production.
  let prixLimite = Math.floor(((k.d.demande.aPrixNul - b.production) / k.d.demande.perdueParEuro) * 100 + 1e-9) / 100;
  while (demandeAuPrix(k.f, prixLimite) < b.production) prixLimite = auCentime(prixLimite - 0.01);
  const verdict: Verdict = ventesPerdues === 0 ? "aucune-vente-perdue" : ventesPerdues <= perte ? "perte-supportable" : "perte-trop-forte";
  return {
    k,
    b,
    margeUnitaire,
    nouveauPrix,
    margeHaussee,
    quantiteMinimale,
    perte,
    pourcentage: auDixieme((perte / b.ventes) * 100),
    hausseDeLaMarge: auDixieme((margeHaussee / margeUnitaire - 1) * 100),
    perteCommeLePrix,
    perteAChiffreEgal,
    apres,
    baisseDeLaDemande,
    ventesPerdues,
    prixLimite,
    verdict,
  };
}

export const MONTER_SON_PRIX: Situation = {
  code: "monter-son-prix",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["decider-prix-fabriquer-acheter"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_DECISION,
    pourquoi: "ce cas reprend le chapitre « Décider : prix, fabriquer ou acheter », qui se calcule sur le premier trimestre de NOVA dans la simulation du cours.",
  },
  commanditaire: "La direction",
  titre: "Monter son prix ?",
  accroche:
    "La direction envisage une hausse de prix et sait qu'elle perdra des clients. Combien peut-elle en perdre avant que la hausse ne lui coûte, et combien en perdra-t-elle vraiment ?",
  objectifs: [
    "Calculer la marge d'une unité avant et après une hausse de prix",
    "Calculer la plus petite quantité qui garde la marge sur coût variable, et les ventes que l'on peut perdre",
    "Croiser ce seuil avec la demande et le plan de production, et retrouver à rebours le prix qui garde toutes les ventes",
    "Rendre à la direction une réponse qui tranche, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const r = monterSonPrix(c);
        return [
          `« Nous pensons monter nos prix de ${pct(HAUSSE_DE_PRIX * 100)} le trimestre prochain. Nous perdrons des clients, c'est certain. Combien de ventes ${r.k.f.entreprise} peut-elle perdre, au plus, sans que sa marge sur coût variable ne baisse ? Et combien en perdrons-nous vraiment ? L'étude de marché est jointe. Les charges fixes, elles, ne bougeront pas, ni le plan de production. »`,
          "Pas de cours cette fois : vous avez les chiffres du premier trimestre, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const r = monterSonPrix(c);
        const d = r.k.d;
        return {
          titre: `Le premier trimestre · ${r.k.f.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Enceintes fabriquées et vendues (le plan du trimestre)", valeurs: [qte(r.b.ventes)] },
            { libelle: "Prix d'une enceinte, hors taxes", valeurs: [eur(r.b.prix)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(r.b.chiffreDAffaires)] },
            { libelle: "Marge sur coût variable du trimestre", valeurs: [eur(r.b.marge)] },
            { libelle: "Charges fixes du trimestre", valeurs: [eur(d.chargesFixes)] },
            { libelle: "Capacité de la ligne, par trimestre", valeurs: [`${qte(d.capacite)} enceintes`] },
            { libelle: "Demande au prix p, selon l'étude de marché", valeurs: [`${qte(d.demande.aPrixNul)} − ${qte(d.demande.perdueParEuro)} × p enceintes, à l'enceinte inférieure`] },
            { libelle: "Hausse de prix envisagée", valeurs: [pct(HAUSSE_DE_PRIX * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : la marge d'une enceinte avant et après la hausse, les ventes que l'on peut perdre, ce que la demande fera au nouveau prix, le prix le plus haut qui garde toutes les ventes, et votre réponse.",
    },
    {
      id: "marge-unitaire",
      type: "montants",
      titre: "La marge d'une enceinte",
      notions: ["contribution_margin"],
      question: () =>
        `Calculez la marge sur coût variable d'une enceinte au premier trimestre (au centime), le prix après la hausse de ${pct(HAUSSE_DE_PRIX * 100)}, puis la marge d'une enceinte à ce prix. Le coût variable d'une enceinte ne change pas.`,
      champs: (c) => {
        const r = monterSonPrix(c);
        return [
          { libelle: "Marge d'une enceinte aujourd'hui", attendu: r.margeUnitaire, calcul: `${eur(r.b.marge)} ÷ ${qte(r.b.ventes)} = ${eur(r.margeUnitaire)}` },
          { libelle: "Prix après la hausse", attendu: r.nouveauPrix, calcul: `${eur(r.b.prix)} × (1 + ${pct(HAUSSE_DE_PRIX * 100)}) = ${eur(r.nouveauPrix)}` },
          { libelle: "Marge d'une enceinte après la hausse", attendu: r.margeHaussee, tolerance: 0.02, calcul: `${eur(r.margeUnitaire)} + ${pct(HAUSSE_DE_PRIX * 100)} × ${eur(r.b.prix)} = ${eur(r.margeHaussee)}` },
        ];
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `Le prix monte de ${pct(HAUSSE_DE_PRIX * 100)}, mais la marge d'une enceinte de ${pct(r.hausseDeLaMarge)} : toute la hausse va à la marge, le coût variable ne bouge pas. Chaque enceinte vendue au nouveau prix rapporte ${eur(r.margeHaussee)} au lieu de ${eur(r.margeUnitaire)}.`,
        ];
      },
    },
    {
      id: "les-ventes-au-curseur",
      type: "curseur",
      titre: "Les ventes perdues, au curseur",
      notions: ["contribution_margin", "price_elasticity"],
      question: (c) => {
        const r = monterSonPrix(c);
        return `Au nouveau prix, faites varier les ventes perdues sur le trimestre. Placez le curseur sur le plus grand nombre d'enceintes perdues qui garde au moins la marge du trimestre, ${eur(r.b.marge)}, puis validez.`;
      },
      grandeur: () => ({ libelle: "Ventes perdues au nouveau prix", unite: "enceintes" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: monterSonPrix(c).perte, min: VENTES_PERDUES_DU_CURSEUR.min, max: VENTES_PERDUES_DU_CURSEUR.max }),
      zones: ["Marge gardée", "Marge perdue"],
      rates: () => ({
        dessous: "La marge tient encore avec plus de ventes perdues : cherchez le plus grand nombre.",
        dessus: "À ce nombre de ventes perdues, la hausse fait baisser la marge.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, x) => {
        const r = monterSonPrix(c);
        const marge = auCentime((r.b.ventes - x) * r.margeHaussee);
        return [
          { libelle: "Marge au nouveau prix", montant: marge },
          { libelle: "Marge du trimestre", montant: r.b.marge },
          { libelle: "Différence", montant: auCentime(marge - r.b.marge), fort: true },
        ];
      },
      droites: (c) => {
        const r = monterSonPrix(c);
        return { produit: (x) => (r.b.ventes - x) * r.margeHaussee, cout: () => r.b.marge, libelles: ["Marge au nouveau prix", "Marge du trimestre"] };
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `Jusqu'à ${qte(r.perte)} enceintes perdues, la marge tient : ${pct(r.pourcentage)} des ventes, bien plus que les ${pct(HAUSSE_DE_PRIX * 100)} de la hausse. Reste à savoir combien la demande en fera perdre.`,
        ];
      },
    },
    {
      id: "ventes-perdues",
      type: "montants",
      titre: "Les ventes que l'on peut perdre",
      notions: ["contribution_margin", "price_elasticity"],
      question: () =>
        "Formalisez : la plus petite quantité qui garde au moins la marge du trimestre (à l'enceinte supérieure), les ventes que l'on peut donc perdre, et leur part des ventes du trimestre, en pourcentage au dixième.",
      champs: (c) => {
        const r = monterSonPrix(c);
        return [
          { libelle: "Plus petite quantité qui garde la marge", attendu: r.quantiteMinimale, calcul: `${eur(r.b.marge)} ÷ ${eur(r.margeHaussee)}, à l'enceinte supérieure = ${qte(r.quantiteMinimale)}` },
          { libelle: "Ventes que l'on peut perdre, au plus", attendu: r.perte, calcul: `${qte(r.b.ventes)} − ${qte(r.quantiteMinimale)} = ${qte(r.perte)}` },
          { libelle: "Part des ventes du trimestre (%)", attendu: r.pourcentage, tolerance: 0.1, calcul: `${qte(r.perte)} ÷ ${qte(r.b.ventes)} × 100 ≈ ${pct(r.pourcentage)}` },
        ];
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `Tant que la hausse ne fait pas perdre plus de ${qte(r.perte)} enceintes sur le trimestre, la marge de ${r.k.f.entreprise} ne baisse pas ; comme les charges fixes ne bougent pas, son résultat non plus.`,
        ];
      },
    },
    {
      id: "la-demande-au-nouveau-prix",
      type: "montants",
      titre: "Ce que la demande fera",
      notions: ["price_elasticity", "capacity"],
      question: (c) => {
        const r = monterSonPrix(c);
        return `Croisez avec l'étude de marché, au plan de production du trimestre (${qte(r.b.production)} enceintes). Calculez la demande au nouveau prix, la demande qui resterait sans réponse, le prix le plus haut, au centime, qui garde les ${qte(r.b.ventes)} ventes, puis le résultat du trimestre au nouveau prix.`;
      },
      champs: (c) => {
        const r = monterSonPrix(c);
        const d = r.k.d;
        return [
          { libelle: "Enceintes demandées au nouveau prix", attendu: r.apres.demande, calcul: `${qte(d.demande.aPrixNul)} − ${qte(d.demande.perdueParEuro)} × ${eur(r.nouveauPrix)}, à l'enceinte inférieure = ${qte(r.apres.demande)}` },
          { libelle: "Demande sans réponse au nouveau prix", attendu: r.apres.nonServie, calcul: `${qte(r.apres.demande)} − ${qte(r.apres.ventes)} = ${qte(r.apres.nonServie)}` },
          {
            libelle: "Prix le plus haut qui garde toutes les ventes",
            attendu: r.prixLimite,
            calcul: `${qte(d.demande.aPrixNul)} − ${qte(d.demande.perdueParEuro)} × p ≥ ${qte(r.b.production)}, soit p ≤ (${qte(d.demande.aPrixNul)} − ${qte(r.b.production)}) ÷ ${qte(d.demande.perdueParEuro)} ≈ ${eur(r.prixLimite)}`,
          },
          {
            libelle: "Résultat du trimestre au nouveau prix",
            attendu: r.apres.resultat,
            calcul: `${qte(r.apres.ventes)} × ${eur(r.margeHaussee)} − ${eur(d.chargesFixes)} = ${eur(r.apres.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const r = monterSonPrix(c);
        return [
          `La demande baisse de ${qte(r.baisseDeLaDemande)} enceintes, de ${qte(r.b.demande)} à ${qte(r.apres.demande)}, mais elle reste au-dessus de la production : ${r.ventesPerdues === 0 ? "aucune vente n'est perdue" : `${qte(r.ventesPerdues)} ventes sont perdues`}. Au prix du trimestre, ${qte(r.b.nonServie)} clients repartaient déjà sans enceinte : la hausse ne fait que réduire cette file. Le résultat passe de ${eur(r.b.resultat)} à ${eur(r.apres.resultat)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["contribution_margin", "price_elasticity"],
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const r = monterSonPrix(c);
        const aucune = r.verdict === "aucune-vente-perdue";
        return [
          {
            texte: `Nous pouvons en perdre ${qte(r.perte)}, et nous n'en perdrons aucune : à ${eur(r.nouveauPrix)}, la demande dépasse encore notre production`,
            juste: aucune,
            retour: aucune
              ? `Oui. La marge supporte ${qte(r.perte)} ventes perdues, ${pct(r.pourcentage)} ; mais au plan de ${qte(r.b.production)} enceintes, la demande à ${eur(r.nouveauPrix)}, ${qte(r.apres.demande)}, dépasse encore la production. Le résultat monte de ${eur(r.b.resultat)} à ${eur(r.apres.resultat)}, et le prix pourrait monter jusqu'à ${eur(r.prixLimite)} sans perdre une vente.`
              : `Non : au nouveau prix, la demande tombe à ${qte(r.apres.demande)}, sous la production.`,
          },
          {
            texte: `Pas plus de ${qte(r.perteCommeLePrix)} enceintes, soit ${pct(HAUSSE_DE_PRIX * 100)} de nos ventes, autant que la hausse du prix`,
            juste: false,
            retour: `Non : le prix monte de ${pct(HAUSSE_DE_PRIX * 100)}, mais la marge d'une enceinte de ${pct(r.hausseDeLaMarge)}. C'est la marge qu'il faut garder, et elle supporte ${qte(r.perte)} enceintes perdues.`,
          },
          {
            texte: `Jusqu'à ${qte(r.perteAChiffreEgal)} enceintes : à ce volume, le chiffre d'affaires reste le même`,
            juste: false,
            retour: `Non : garder le chiffre d'affaires n'est pas garder la marge. Chaque vente perdue retire aussi son coût variable : on peut en perdre davantage, ${qte(r.perte)}, avant que la marge ne baisse.`,
          },
          {
            texte: `Renoncer : la demande baisserait de ${qte(r.baisseDeLaDemande)} enceintes, plus que les ${qte(r.perte)} que la marge supporte, et le résultat du trimestre en souffrirait`,
            juste: !aucune && r.verdict === "perte-trop-forte",
            retour: aucune
              ? `Non : c'est confondre la demande et les ventes. Les ventes étaient bornées par le plan de production, ${qte(r.b.production)} enceintes, pas par la demande, ${qte(r.b.demande)} : la demande peut baisser de ${qte(r.b.demande - r.b.production)} avant qu'une seule vente ne soit perdue.`
              : `La demande tombe sous la production : ${qte(r.ventesPerdues)} ventes perdues.`,
          },
        ];
      },
    },
  ],
};
