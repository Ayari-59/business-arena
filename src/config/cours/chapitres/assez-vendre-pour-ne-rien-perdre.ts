import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { donneesDuMois, seuilDeRentabilite } from "../monde/couts-et-budgets";
import { AUTRES_COUTS_PAR_ENCEINTE, CHARGES_FIXES_DU_MOIS, COMPOSANTS_PAR_ENCEINTE, NOVA_GESTION } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ASSEZ VENDRE POUR NE RIEN PERDRE, LE SEUIL DE RENTABILITÉ (Bac STMG, sciences de gestion et
 * numérique de première, thème 4, question 1 : « Quelle prise en compte du temps dans la gestion ? »,
 * la prospective par le seuil de rentabilité).
 *
 * La version lycée du seuil (audit du chantier STMG, point 10) : le chapitre du contrôle de gestion
 * (palier 2) raisonne avec les mots et les outils du BTS ; celui-ci tient en quelques gestes, sur le
 * même mois de janvier de NOVA. Séparer les charges variables des charges fixes, calculer la marge sur
 * coût variable et son taux, le seuil en enceintes et en euros (le curseur), dater le point mort et lire
 * la marge de sécurité. Sans TVA, sans centres d'analyse.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : le mois de référence (1 590 enceintes à 59 €,
 * 22 € de composants et 16 € d'autres coûts par enceinte, 31 183 € de charges fixes) est celui de
 * nova-gestion.ts, et le seuil est calculé par le modèle du contrôle de gestion (couts-et-budgets.ts,
 * `seuilDeRentabilite`) : les deux chapitres trouvent le même seuil, au centime.
 */

export const ENTREPRISES_DU_SEUIL_DU_LYCEE = ["nova"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** Le seuil du mois de janvier de NOVA, par le modèle du cours. */
export const seuilDeJanvier = (leviers: Parameters<typeof donneesDuMois>[1] = {}) => seuilDeRentabilite(donneesDuMois(NOVA_GESTION, leviers));

function leMois(c: Cas): TableauDeDonnees {
  const s = seuilDeJanvier();
  return {
    titre: `Le mois de janvier de ${c.entreprise}`,
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Enceintes vendues", valeurs: [qte(s.quantite)] },
      { libelle: "Prix d'une enceinte", valeurs: [eur(s.prix)] },
      { libelle: "Composants d'une enceinte", valeurs: [eur(COMPOSANTS_PAR_ENCEINTE)] },
      { libelle: "Emballage, transport et énergie d'une enceinte", valeurs: [eur(AUTRES_COUTS_PAR_ENCEINTE)] },
      { libelle: "Loyer du mois", valeurs: [eur(CHARGES_FIXES_DU_MOIS.loyer)] },
      { libelle: "Salaires et cotisations du mois", valeurs: [eur(CHARGES_FIXES_DU_MOIS.personnel)] },
      { libelle: "Usure de la ligne de montage du mois", valeurs: [eur(CHARGES_FIXES_DU_MOIS.amortissement)] },
    ],
  };
}

export const ASSEZ_VENDRE_POUR_NE_RIEN_PERDRE: Chapitre = {
  code: "assez-vendre-pour-ne-rien-perdre",
  parcours: "stmg-management",
  palier: 1,
  // lot C STMG : le seuil sert aussi la gestion et finance de terminale (3.4, « la notion de seuil de
  // rentabilité abordée en première vient en appui de l'étude des coûts partiels »), citée en second.
  blocs: ["STMG Thème 4 · Temps et risque", "STMG Thème 3 · Accompagner la prise de décision"],
  titre: "Assez vendre pour ne rien perdre : le seuil de rentabilité",
  accroche:
    "Combien d'enceintes faut-il vendre dans le mois pour payer le loyer, les salaires et l'usure de la ligne ? Et quel jour du mois l'entreprise commence-t-elle à gagner de l'argent ?",
  objectifs: [
    "Séparer les charges variables des charges fixes",
    "Calculer la marge sur coût variable et son taux",
    "Calculer le seuil de rentabilité en quantité et en valeur",
    "Dater le point mort et lire la marge de sécurité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_SEUIL_DU_LYCEE,
    pourquoi: "ce chapitre lit le mois de janvier de NOVA, dont le cours tient les ventes, le coût d'une enceinte et les charges fixes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un mois, des charges qui tombent quoi qu'on vende",
      notions: ["breakeven"],
      tableau: leMois,
      texte: (c) => [
        `En janvier, ${c.entreprise} a vendu ${qte(seuilDeJanvier().quantite)} enceintes. Certaines charges suivent les ventes : chaque enceinte demande ses composants, son emballage, son transport, son énergie. D'autres tombent chaque mois, qu'on vende ou non : le loyer, les salaires, l'usure de la ligne.`,
        "Le seuil de rentabilité est le chiffre d'affaires à atteindre pour que la marge des ventes paie ces charges fixes. En dessous, le mois perd de l'argent ; au-dessus, il en gagne. C'est un outil de prospective : on le calcule avant le mois, pour savoir ce qu'il faut vendre.",
      ],
      repere: () => "Seuil de rentabilité : le chiffre d'affaires pour lequel le résultat est nul. La marge sur coût variable y égale les charges fixes.",
    },
    {
      id: "variables-ou-fixes",
      objectifs: [0],
      type: "tri",
      titre: "Variables ou fixes",
      tableau: leMois,
      question: () => "Rangez chaque charge de janvier : varie-t-elle avec le nombre d'enceintes vendues, ou reste-t-elle la même ?",
      categories: [
        { code: "variable", libelle: "Variable" },
        { code: "fixe", libelle: "Fixe" },
      ],
      elements: () => {
        const s = seuilDeJanvier();
        return [
          { libelle: "Composants des enceintes vendues", montant: s.quantite * COMPOSANTS_PAR_ENCEINTE, categorie: "variable", pourquoi: "Une enceinte de plus, un jeu de composants de plus." },
          { libelle: "Emballage, transport et énergie des enceintes", montant: s.quantite * AUTRES_COUTS_PAR_ENCEINTE, categorie: "variable", pourquoi: "Chaque enceinte emballée et transportée les coûte." },
          { libelle: "Loyer du local", montant: CHARGES_FIXES_DU_MOIS.loyer, categorie: "fixe", pourquoi: "Le même chaque mois, quelles que soient les ventes." },
          { libelle: "Salaires et cotisations", montant: CHARGES_FIXES_DU_MOIS.personnel, categorie: "fixe", pourquoi: "L'équipe est payée au mois, pas à l'enceinte." },
          { libelle: "Usure de la ligne de montage", montant: CHARGES_FIXES_DU_MOIS.amortissement, categorie: "fixe", pourquoi: "La ligne s'amortit sur sa durée, quelle que soit la production du mois." },
        ];
      },
      explication: () => {
        const s = seuilDeJanvier();
        return [`Les charges variables font ${eur(s.chargesVariables)}, soit ${eur(s.coutVariableUnitaire)} par enceinte ; les charges fixes ${eur(s.chargesFixes)}.`];
      },
    },
    {
      id: "la-marge",
      objectifs: [1],
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["contribution_margin", "variable_costs", "fixed_costs"],
      question: () => "Calculez la marge sur coût variable d'une enceinte, celle du mois, et le résultat de janvier.",
      champs: () => {
        const s = seuilDeJanvier();
        return [
          { libelle: "Marge sur coût variable d'une enceinte", attendu: s.margeUnitaire, calcul: `${eur(s.prix)} − ${eur(s.coutVariableUnitaire)} = ${eur(s.margeUnitaire)}` },
          { libelle: "Marge sur coût variable du mois", attendu: s.marge, calcul: `${qte(s.quantite)} × ${eur(s.margeUnitaire)} = ${eur(s.marge)}` },
          { libelle: "Résultat de janvier", attendu: s.resultat, calcul: `${eur(s.marge)} − ${eur(s.chargesFixes)} = ${eur(s.resultat)}` },
        ];
      },
      explication: () => {
        const s = seuilDeJanvier();
        return [`Chaque enceinte vendue laisse ${eur(s.margeUnitaire)} pour payer les charges fixes. Il en faut assez pour couvrir les ${eur(s.chargesFixes)} du mois : au-delà, chaque enceinte fait du bénéfice.`];
      },
    },
    {
      id: "le-seuil",
      objectifs: [1, 2],
      type: "montants",
      titre: "Le seuil, en enceintes et en euros",
      notions: ["breakeven", "margin_rates"],
      question: () => "Calculez le taux de marge sur coût variable (au centième de point), le seuil en enceintes (à l'unité supérieure), et le seuil en chiffre d'affaires (charges fixes ÷ taux de marge, à 10 € près).",
      champs: () => {
        const s = seuilDeJanvier();
        const taux = auCentieme(s.tauxDeMarge * 100);
        return [
          { libelle: "Taux de marge sur coût variable (%)", attendu: taux, calcul: `${eur(s.margeUnitaire)} ÷ ${eur(s.prix)} × 100 = ${pct(taux)}`, tolerance: 0.01 },
          { libelle: "Seuil en enceintes", attendu: s.seuilQuantite!, calcul: `${eur(s.chargesFixes)} ÷ ${eur(s.margeUnitaire)} = ${qte(Math.round(s.seuilExact! * 10) / 10)}, soit ${qte(s.seuilQuantite!)} enceintes`, tolerance: 0 },
          { libelle: "Seuil en chiffre d'affaires", attendu: s.seuilValeur!, calcul: `${eur(s.chargesFixes)} ÷ (${eur(s.margeUnitaire)} ÷ ${eur(s.prix)}) = ${eur(s.seuilValeur!)}, sur le taux exact`, tolerance: 10 },
        ];
      },
      explication: () => {
        const s = seuilDeJanvier();
        return [`Il faut vendre ${qte(s.seuilQuantite!)} enceintes, ${eur(s.seuilValeur!)} de chiffre d'affaires, pour que le mois ne perde rien. Le seuil en euros se calcule sur le taux exact : un taux arrondi le décale de quelques euros.`];
      },
    },
    {
      id: "le-curseur-du-seuil",
      objectifs: [2],
      type: "curseur",
      titre: "Trouver le seuil",
      notions: ["breakeven"],
      question: (c) => {
        const s = seuilDeJanvier();
        return `Faites varier les enceintes vendues en janvier : une droite donne le chiffre d'affaires, l'autre les charges du mois (${eur(s.chargesFixes)} de charges fixes et ${eur(s.coutVariableUnitaire)} par enceinte). Placez le curseur sur le plus petit nombre d'enceintes qui ne fait rien perdre à ${c.entreprise}.`;
      },
      cible: () => ({ attendu: seuilDeJanvier().seuilQuantite!, max: 2_500 }),
      lecture: (_c, q) => {
        const s = seuilDeJanvier({ quantite: q });
        return [
          { libelle: "Chiffre d'affaires", montant: s.chiffreDAffaires },
          { libelle: "Charges variables", montant: s.chargesVariables },
          { libelle: "Charges fixes", montant: s.chargesFixes },
          { libelle: "Résultat", montant: s.resultat, fort: true },
        ];
      },
      droites: () => {
        const s = seuilDeJanvier();
        return { produit: (q) => q * s.prix, cout: (q) => s.chargesFixes + q * s.coutVariableUnitaire, libelles: ["Chiffre d'affaires", "Charges du mois"] };
      },
      explication: () => {
        const s = seuilDeJanvier();
        const avant = seuilDeJanvier({ quantite: s.seuilQuantite! - 1 });
        const au = seuilDeJanvier({ quantite: s.seuilQuantite! });
        return [`À ${qte(s.seuilQuantite! - 1)} enceintes, le mois perd ${eur(-avant.resultat)} ; à ${qte(s.seuilQuantite!)}, il gagne ${eur(au.resultat)}. Les deux droites se croisent au seuil : à gauche la perte, à droite le bénéfice.`];
      },
    },
    {
      id: "point-mort-et-securite",
      objectifs: [3],
      type: "montants",
      titre: "Le point mort et la marge de sécurité",
      notions: ["dead_point", "safety_margin"],
      question: (c) => `Les ventes de ${c.entreprise} sont régulières sur les ${qte(seuilDeJanvier().jours)} jours de janvier. Calculez la marge de sécurité (chiffre d'affaires moins seuil), l'indice de sécurité (au dixième de point), et le jour de janvier où le seuil est atteint.`,
      champs: () => {
        const s = seuilDeJanvier();
        const indice = Math.round(s.indiceDeSecurite! * 1000) / 10;
        return [
          { libelle: "Marge de sécurité", attendu: s.margeDeSecurite!, calcul: `${eur(s.chiffreDAffaires)} − ${eur(s.seuilValeur!)} = ${eur(s.margeDeSecurite!)}`, tolerance: 10 },
          { libelle: "Indice de sécurité (%)", attendu: indice, calcul: `${eur(s.margeDeSecurite!)} ÷ ${eur(s.chiffreDAffaires)} × 100 = ${pct(indice)}`, tolerance: 0.1 },
          { libelle: "Jour du point mort", attendu: s.pointMort!, calcul: `${eur(s.seuilValeur!)} ÷ ${eur(s.chiffreDAffaires)} × ${qte(s.jours)} jours = ${qte(Math.round((s.seuilValeur! / s.chiffreDAffaires) * s.jours * 100) / 100)}, le ${qte(s.pointMort!)} janvier`, tolerance: 0 },
        ];
      },
      explication: () => {
        const s = seuilDeJanvier();
        return [`Le ${qte(s.pointMort!)} janvier, les ventes du mois ont payé les charges fixes : les jours suivants font le bénéfice. Les ventes pourraient baisser de ${eur(s.margeDeSecurite!)} avant que le mois ne perde : une marge mince.`];
      },
    },
    {
      id: "lire-le-seuil",
      objectifs: [3],
      type: "choix",
      titre: "Ce que dit le seuil",
      question: () => "Le président prévoit pour février une baisse de 10 % des ventes de janvier. Que lui dit le seuil ?",
      options: () => {
        const s = seuilDeJanvier();
        const fevrier = Math.round(s.quantite * 0.9);
        const perd = fevrier < s.seuilQuantite!;
        return [
          { texte: perd ? "Février passera sous le seuil : il perdra de l'argent" : "Février restera au-dessus du seuil", juste: true, retour: `Oui : ${qte(fevrier)} enceintes, ${perd ? "moins" : "plus"} que les ${qte(s.seuilQuantite!)} du seuil. Une baisse de 10 % dépasse l'indice de sécurité de ${pct(Math.round(s.indiceDeSecurite! * 1000) / 10)} : c'est l'alerte que le seuil sert à donner, avant le mois.` },
          { texte: perd ? "Février restera au-dessus du seuil, puisque janvier a gagné de l'argent" : "Février passera sous le seuil et perdra de l'argent", juste: false, retour: `Non : ${qte(fevrier)} enceintes ${perd ? "sont sous" : "restent au-dessus"} du seuil de ${qte(s.seuilQuantite!)}.` },
          { texte: "Rien : le seuil ne vaut que pour le mois où on l'a calculé", juste: false, retour: "Non : tant que le prix, le coût d'une enceinte et les charges fixes ne bougent pas, le seuil est le même chaque mois. C'est ce qui en fait un outil de prévision." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const s = seuilDeJanvier();
        return [
          `En janvier, chaque enceinte de ${c.entreprise} laisse ${eur(s.margeUnitaire)} de marge, ${pct(auCentieme(s.tauxDeMarge * 100))} de son prix. Il faut en vendre ${qte(s.seuilQuantite!)}, ${eur(s.seuilValeur!)} de chiffre d'affaires, pour payer les ${eur(s.chargesFixes)} de charges fixes : le point mort tombe le ${qte(s.pointMort!)} janvier.`,
          "Le seuil se calcule avant d'agir : il dit ce qu'il faut vendre, et alerte quand une baisse prévue mangerait la marge de sécurité. Dans l'arène, l'écran d'analyse des coûts donne le seuil de chaque tour.",
        ];
      },
      repere: () => "Seuil en quantité = charges fixes ÷ marge sur coût variable unitaire. Seuil en valeur = charges fixes ÷ taux de marge. Point mort = seuil ÷ chiffre d'affaires × jours de la période.",
    },
  ],
};
