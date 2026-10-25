import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord, accordPluriel } from "../accords";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE SEUIL DE RENTABILITÉ (contrôle de gestion, palier 2).
 *
 * Le même mois de janvier que le chapitre de comptabilité, vu par le contrôleur de
 * gestion : à partir de combien de ventes l'entreprise gagne-t-elle de l'argent ?
 * L'élève range les charges (variables ou fixes), calcule la marge sur coût variable,
 * bâtit le compte de résultat différentiel, puis le seuil. La simulation le lui fait
 * trouver à la main : un curseur sur les ventes, deux droites qui se croisent. Il finit
 * par la marge de sécurité et par ce que coûte une baisse de prix.
 *
 * Une entreprise peut ne pas atteindre son seuil ce mois-là (VOLT FITNESS) : chaque
 * texte dit les deux cas, et c'est une leçon de plus.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number, d = 1) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;

/** La baisse de prix de la dernière question. */
export const BAISSE_DE_PRIX = 0.1;

/** Les grandeurs du mois, calculées une fois du cas. */
export function chiffresDeGestion(c: Cas) {
  const g = c.gestion;
  const chargesVariables = auCentime(g.quantite * g.coutVariableUnitaire);
  const marge = auCentime(g.chiffreDAffaires - chargesVariables);
  const margeUnitaire = auCentime(g.prixMoyen - g.coutVariableUnitaire);
  // Le seuil se calcule sur la marge unitaire que l'élève calcule (prix moyen au centime),
  // la même que la simulation : au seuil, le curseur montre un résultat positif ou nul.
  const taux = margeUnitaire / g.prixMoyen;
  const seuilQuantite = Math.ceil(g.chargesFixes / margeUnitaire - 1e-9);
  const seuilValeur = auCentime(g.chargesFixes / taux);
  const resultat = auCentime(marge - g.chargesFixes);
  const margeDeSecurite = auCentime(g.chiffreDAffaires - seuilValeur);
  const prixBaisse = auCentime(g.prixMoyen * (1 - BAISSE_DE_PRIX));
  const margeBaisse = auCentime(prixBaisse - g.coutVariableUnitaire);
  return {
    ...g,
    chargesVariables,
    marge,
    margeUnitaire,
    taux,
    seuilQuantite,
    seuilValeur,
    resultat,
    margeDeSecurite,
    indiceDeSecurite: margeDeSecurite / g.chiffreDAffaires,
    // Le jour du mois où le chiffre d'affaires cumulé couvre les charges fixes, si les
    // ventes se répartissent également sur les 31 jours de janvier.
    pointMort: seuilValeur <= g.chiffreDAffaires ? Math.ceil((seuilValeur / g.chiffreDAffaires) * 31) : null,
    prixBaisse,
    margeBaisse,
    seuilBaisse: margeBaisse > 0 ? Math.ceil(g.chargesFixes / margeBaisse - 1e-9) : null,
  };
}

const atteint = (c: Cas) => chiffresDeGestion(c).resultat >= 0;

export const SEUIL_DE_RENTABILITE: Chapitre = {
  code: "seuil-de-rentabilite",
  parcours: "controle-de-gestion",
  palier: 2,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
    "BUT GACO · Participer au pilotage interne de l'organisation",
  ],
  titre: "Le seuil de rentabilité",
  accroche:
    "Le même mois de janvier, vu par le contrôleur de gestion : à partir de combien de ventes l'entreprise gagne-t-elle de l'argent ? Vous le calculez, puis vous le trouvez sur la simulation.",
  objectifs: [
    "Distinguer les charges variables des charges fixes",
    "Calculer la marge sur coût variable, par unité et en taux",
    "Bâtir un compte de résultat différentiel",
    "Calculer le seuil de rentabilité en quantité et en valeur, et le point mort",
    "Mesurer la marge de sécurité et l'effet d'une baisse de prix",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La question du dirigeant",
      notions: ["fixed_costs", "variable_costs"],
      texte: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `En janvier, ${c.entreprise} a vendu ${qte(g.quantite)} ${c.unites}, pour ${eur(g.chiffreDAffaires)} hors taxes : un prix moyen de ${eur(g.prixMoyen)}.`,
          `Le dirigeant pose une seule question : à partir de combien de ${c.unites} ${accordPluriel(c, "vendu")} par mois l'entreprise gagne-t-elle de l'argent ? La comptabilité générale dit ce qui s'est passé ; le contrôle de gestion aide à décider ce qui va se passer.`,
          "Pour répondre, il faut d'abord savoir quelles charges grandissent avec les ventes, et lesquelles restent les mêmes quoi qu'on vende.",
        ];
      },
      repere: () =>
        "Une charge variable suit les quantités vendues : deux fois plus de ventes, deux fois plus de charge. Une charge fixe ne bouge pas, dans les limites de la capacité de l'entreprise.",
    },
    {
      id: "classement",
      type: "tri",
      titre: "Variables ou fixes",
      notions: ["fixed_costs", "variable_costs"],
      question: (c) => `Voici les charges de ${c.entreprise} en janvier. Rangez chacune : variable ou fixe ?`,
      categories: [
        { code: "variable", libelle: "Variable" },
        { code: "fixe", libelle: "Fixe" },
      ],
      elements: (c) => {
        const g = c.gestion;
        return [
          {
            libelle: "Achats consommés",
            montant: auCentime(g.quantite * g.matiereParUnite),
            categorie: "variable",
            pourquoi: `${eur(g.matiereParUnite)} par ${c.unite} : sans vente, pas d'achat.`,
          },
          {
            libelle: `Autres coûts par ${c.unite} (${g.autresCoutsVariables})`,
            montant: auCentime(g.quantite * g.autresParUnite),
            categorie: "variable",
            pourquoi: `${eur(g.autresParUnite)} par ${c.unite} : ils suivent les ventes.`,
          },
          {
            libelle: "Loyer du local",
            montant: c.loyer.montant,
            categorie: "fixe",
            pourquoi: "Le même chaque mois, quoi qu'on vende.",
          },
          {
            libelle: "Personnel (salaires et cotisations)",
            montant: c.personnel.cout,
            categorie: "fixe",
            pourquoi: `Les ${qte(c.personnel.effectif)} salariés sont payés le même salaire, que le mois soit bon ou mauvais.`,
          },
          {
            libelle: "Usure de l'équipement (amortissement)",
            montant: c.gestion.amortissement,
            categorie: "fixe",
            pourquoi: `L'équipement s'use au fil du temps : ${eur(c.immobilisation.ht)} répartis sur ${qte(c.gestion.dureeAmortissementMois)} mois.`,
          },
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `Les charges variables de janvier font ${eur(g.chargesVariables)}, soit ${eur(g.coutVariableUnitaire)} par ${c.unite}. Les charges fixes font ${eur(g.chargesFixes)}, quoi qu'on vende.`,
          "Le personnel est fixe ici : ce mois-là, l'effectif ne change pas avec les ventes. Une entreprise qui paierait ses vendeurs à la commission en aurait une part variable.",
        ];
      },
    },
    {
      id: "marge-unitaire",
      type: "montants",
      titre: "La marge sur coût variable",
      notions: ["contribution_margin", "margin_rates"],
      question: (c) =>
        `Chaque ${c.unite} se vend en moyenne ${eur(c.gestion.prixMoyen)} hors taxes et coûte ${eur(c.gestion.matiereParUnite)} d'achats et ${eur(c.gestion.autresParUnite)} d'autres coûts variables. Calculez :`,
      champs: (c) => {
        const g = chiffresDeGestion(c);
        return [
          { libelle: "Coût variable unitaire", attendu: g.coutVariableUnitaire, calcul: `${eur(g.matiereParUnite)} + ${eur(g.autresParUnite)} = ${eur(g.coutVariableUnitaire)}` },
          { libelle: "Marge sur coût variable unitaire", attendu: g.margeUnitaire, calcul: `${eur(g.prixMoyen)} − ${eur(g.coutVariableUnitaire)} = ${eur(g.margeUnitaire)}` },
          {
            libelle: "Taux de marge sur coût variable, en %",
            attendu: auCentime(g.taux * 100),
            tolerance: 0.1,
            calcul: `${eur(g.margeUnitaire)} ÷ ${eur(g.prixMoyen)} = ${pct(g.taux)}`,
          },
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `Chaque ${c.unite} ${accord(c, "vendu")} laisse ${eur(g.margeUnitaire)} une fois payés ses coûts variables. C'est cette marge, et elle seule, qui sert à payer les charges fixes ; ce qui reste ensuite est le bénéfice.`,
          `Le taux, ${pct(g.taux)}, dit la même chose pour 1 € de chiffre d'affaires : ${pct(g.taux)} de chaque euro vendu restent pour couvrir les charges fixes.`,
        ];
      },
    },
    {
      id: "resultat-differentiel",
      type: "montants",
      titre: "Le compte de résultat différentiel",
      notions: ["contribution_margin", "income_statement"],
      question: (c) =>
        `Présentez le résultat de janvier en séparant charges variables et charges fixes : ${qte(c.gestion.quantite)} ${c.unites} ${accordPluriel(c, "vendu")}.`,
      champs: (c) => {
        const g = chiffresDeGestion(c);
        return [
          { libelle: "Chiffre d'affaires", attendu: g.chiffreDAffaires, calcul: `les ventes de janvier, hors taxes : ${eur(g.chiffreDAffaires)}` },
          { libelle: "Charges variables", attendu: g.chargesVariables, calcul: `${qte(g.quantite)} × ${eur(g.coutVariableUnitaire)} = ${eur(g.chargesVariables)}` },
          { libelle: "Marge sur coût variable", attendu: g.marge, calcul: `${eur(g.chiffreDAffaires)} − ${eur(g.chargesVariables)} = ${eur(g.marge)}` },
          { libelle: "Charges fixes", attendu: g.chargesFixes, calcul: `${eur(c.loyer.montant)} + ${eur(c.personnel.cout)} + ${eur(g.amortissement)} = ${eur(g.chargesFixes)}` },
          { libelle: "Résultat", attendu: g.resultat, calcul: `${eur(g.marge)} − ${eur(g.chargesFixes)} = ${eur(g.resultat)}` },
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return [
          g.resultat >= 0
            ? `La marge couvre les charges fixes et laisse ${eur(g.resultat)} de bénéfice.`
            : `La marge, ${eur(g.marge)}, ne couvre pas les charges fixes : ${c.entreprise} perd ${eur(-g.resultat)} en janvier.`,
          "Le compte de résultat de la comptabilité générale range les charges par nature (achats, loyer, salaires). Celui-ci les range par comportement : c'est ce qui permet de prévoir.",
        ];
      },
    },
    {
      id: "une-de-plus",
      type: "choix",
      titre: "Une vente de plus",
      notions: ["contribution_margin"],
      question: (c) => `Si ${c.entreprise} vend ${accord(c, "un")} ${c.unite} de plus en janvier, de combien son résultat augmente-t-il ?`,
      options: (c) => {
        const g = chiffresDeGestion(c);
        return [
          { texte: `De ${eur(g.prixMoyen)} : le prix de vente.`, juste: false, retour: `Il faut aussi payer ses coûts variables, ${eur(g.coutVariableUnitaire)}.` },
          {
            texte: `De ${eur(g.margeUnitaire)} : la marge sur coût variable unitaire.`,
            juste: true,
            retour: "Les charges fixes sont déjà là : une vente de plus n'apporte que sa marge, mais toute sa marge.",
          },
          {
            texte: `De ${eur(auCentime(g.prixMoyen - (g.chargesVariables + g.chargesFixes) / g.quantite))} : le prix moins le coût complet par ${c.unite}.`,
            juste: false,
            retour: "Le coût complet répartit les charges fixes sur les ventes ; or une vente de plus ne les augmente pas. Raisonner au coût complet fait refuser des ventes rentables.",
          },
        ];
      },
    },
    {
      id: "seuil",
      type: "montants",
      titre: "Le seuil de rentabilité",
      notions: ["breakeven"],
      question: (c) =>
        `Le seuil de rentabilité est le niveau de ventes où la marge couvre tout juste les charges fixes : le résultat est nul. Calculez-le pour ${c.entreprise}.`,
      champs: (c) => {
        const g = chiffresDeGestion(c);
        return [
          {
            libelle: `En quantité (${c.unites}, arrondi à l'unité supérieure)`,
            attendu: g.seuilQuantite,
            tolerance: 1,
            calcul: `${eur(g.chargesFixes)} ÷ ${eur(g.margeUnitaire)} ≈ ${qte(g.seuilQuantite)} ${c.unites}`,
          },
          {
            libelle: "En valeur (chiffre d'affaires)",
            attendu: g.seuilValeur,
            tolerance: Math.max(1, g.seuilValeur * 0.005),
            calcul: `${eur(g.chargesFixes)} ÷ ${pct(g.taux)} ≈ ${eur(g.seuilValeur)}`,
          },
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `En dessous de ${qte(g.seuilQuantite)} ${c.unites} par mois, ${c.entreprise} perd de l'argent ; au-dessus, chaque ${c.unite} ajoute ${eur(g.margeUnitaire)} au bénéfice.`,
          atteint(c)
            ? `En janvier, avec ${qte(g.quantite)} ${c.unites}, le seuil est dépassé.`
            : `En janvier, avec ${qte(g.quantite)} ${c.unites}, le seuil n'est pas atteint : il manque ${qte(g.seuilQuantite - g.quantite)} ${c.unites}.`,
        ];
      },
    },
    {
      id: "simulation",
      type: "curseur",
      titre: "Le seuil sur la simulation",
      notions: ["breakeven", "dead_point"],
      question: (c) =>
        `Faites varier les ventes de ${c.entreprise} sur un mois. Placez le curseur sur le plus petit nombre de ${c.unites} qui ne fait pas perdre d'argent, puis validez.`,
      cible: (c) => {
        const g = chiffresDeGestion(c);
        return { attendu: g.seuilQuantite, max: Math.ceil(Math.max(g.seuilQuantite * 2, g.quantite * 1.3) / 10) * 10 };
      },
      lecture: (c, q) => {
        const g = chiffresDeGestion(c);
        const ca = auCentime(q * g.prixMoyen);
        const cv = auCentime(q * g.coutVariableUnitaire);
        return [
          { libelle: "Chiffre d'affaires", montant: ca },
          { libelle: "Charges variables", montant: cv },
          { libelle: "Marge sur coût variable", montant: auCentime(ca - cv) },
          { libelle: "Charges fixes", montant: g.chargesFixes },
          { libelle: "Résultat", montant: auCentime(ca - cv - g.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const g = chiffresDeGestion(c);
        return {
          produit: (q) => q * g.prixMoyen,
          cout: (q) => g.chargesFixes + q * g.coutVariableUnitaire,
          libelles: ["Chiffre d'affaires", "Coût total (fixes + variables)"],
        };
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `Les deux droites se croisent au seuil : à ${qte(g.seuilQuantite)} ${c.unites}, le chiffre d'affaires couvre le coût total. À gauche, la zone de perte ; à droite, la zone de bénéfice.`,
          "Le coût total ne part pas de zéro : même sans rien vendre, les charges fixes sont là. C'est tout le sens du seuil.",
        ];
      },
    },
    {
      id: "securite",
      type: "montants",
      titre: "La marge de sécurité",
      notions: ["safety_margin", "dead_point"],
      question: () =>
        "De combien les ventes de janvier pourraient-elles baisser avant que l'entreprise ne perde de l'argent ? Calculez la marge de sécurité (chiffre d'affaires moins seuil en valeur ; négative si le seuil n'est pas atteint) et l'indice de sécurité (la marge rapportée au chiffre d'affaires).",
      champs: (c) => {
        const g = chiffresDeGestion(c);
        return [
          {
            libelle: "Marge de sécurité",
            attendu: g.margeDeSecurite,
            tolerance: Math.max(1, Math.abs(g.seuilValeur) * 0.005),
            calcul: `${eur(g.chiffreDAffaires)} − ${eur(g.seuilValeur)} = ${eur(g.margeDeSecurite)}`,
          },
          {
            libelle: "Indice de sécurité, en %",
            attendu: auCentime(g.indiceDeSecurite * 100),
            tolerance: 0.5,
            calcul: `${eur(g.margeDeSecurite)} ÷ ${eur(g.chiffreDAffaires)} = ${pct(g.indiceDeSecurite)}`,
          },
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        return g.pointMort !== null
          ? [
              `Les ventes pourraient baisser de ${pct(g.indiceDeSecurite)} avant que ${c.entreprise} ne perde de l'argent.`,
              `Si les ventes se répartissent également sur le mois, le seuil est atteint le ${g.pointMort} janvier : c'est le point mort. Chaque jour de vente ensuite est du bénéfice.`,
            ]
          : [
              `La marge de sécurité est négative : il faudrait vendre ${eur(-g.margeDeSecurite)} de plus pour atteindre le seuil. Le point mort n'est pas atteint en janvier.`,
              "Pour en sortir, trois leviers : vendre plus, gagner plus par vente (prix, coûts variables), ou alléger les charges fixes.",
            ];
      },
    },
    {
      id: "baisse-de-prix",
      type: "montants",
      titre: "Et si le prix baissait ?",
      notions: ["breakeven", "operating_leverage", "price_elasticity"],
      question: (c) =>
        `Un concurrent casse ses prix. ${c.entreprise} envisage de baisser le sien de ${pct(BAISSE_DE_PRIX, 0)}. Les coûts ne changent pas. Calculez :`,
      champs: (c) => {
        const g = chiffresDeGestion(c);
        return [
          { libelle: "Nouveau prix moyen", attendu: g.prixBaisse, calcul: `${eur(g.prixMoyen)} × ${pct(1 - BAISSE_DE_PRIX, 0)} = ${eur(g.prixBaisse)}` },
          { libelle: "Nouvelle marge sur coût variable unitaire", attendu: g.margeBaisse, calcul: `${eur(g.prixBaisse)} − ${eur(g.coutVariableUnitaire)} = ${eur(g.margeBaisse)}` },
          ...(g.seuilBaisse !== null
            ? [
                {
                  libelle: `Nouveau seuil en quantité (${c.unites})`,
                  attendu: g.seuilBaisse,
                  tolerance: 1,
                  calcul: `${eur(g.chargesFixes)} ÷ ${eur(g.margeBaisse)} ≈ ${qte(g.seuilBaisse)} ${c.unites}`,
                },
              ]
            : []),
        ];
      },
      explication: (c) => {
        const g = chiffresDeGestion(c);
        if (g.seuilBaisse === null) return ["À ce prix, chaque vente coûte plus qu'elle ne rapporte : il n'y a plus de seuil."];
        return [
          `Le prix baisse de ${pct(BAISSE_DE_PRIX, 0)}, mais la marge par ${c.unite} baisse de ${pct(1 - g.margeBaisse / g.margeUnitaire, 0)} : les coûts variables, eux, n'ont pas bougé.`,
          `Le seuil passe de ${qte(g.seuilQuantite)} à ${qte(g.seuilBaisse)} ${c.unites} : il faudrait vendre ${pct(g.seuilBaisse / g.seuilQuantite - 1, 0)} de plus seulement pour ne pas perdre d'argent. Une baisse de prix ne se décide qu'en sachant combien de ventes elle doit gagner.`,
        ];
      },
    },
    {
      id: "leviers",
      type: "choix",
      titre: "Abaisser le seuil",
      notions: ["breakeven", "operating_leverage"],
      question: (c) => `Que peut faire ${c.entreprise} pour abaisser son seuil de rentabilité ?`,
      options: () => [
        {
          texte: "Vendre davantage.",
          juste: false,
          retour: "Vendre plus éloigne du seuil (la marge de sécurité grandit), mais ne déplace pas le seuil lui-même.",
        },
        {
          texte: "Gagner plus sur chaque vente, ou réduire ses charges fixes.",
          juste: true,
          retour: "Le seuil est le rapport des charges fixes à la marge unitaire : on l'abaisse en réduisant le numérateur ou en augmentant le dénominateur.",
        },
        {
          texte: "Baisser son prix pour vendre plus.",
          juste: false,
          retour: "Baisser le prix réduit la marge par vente : le seuil monte, comme vous venez de le calculer.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["breakeven", "safety_margin"],
      texte: (c) => {
        const g = chiffresDeGestion(c);
        return [
          `Vous savez dire au dirigeant de ${c.entreprise} combien il doit vendre pour ne pas perdre d'argent : ${qte(g.seuilQuantite)} ${c.unites} par mois, ${eur(g.seuilValeur)} de chiffre d'affaires.`,
          "Ce raisonnement suppose un prix moyen stable et des charges fixes qui ne bougent pas. Au palier 3, le coût complet répartit les charges entre plusieurs produits ; au palier 4, les budgets et les écarts comparent ce qui était prévu à ce qui s'est passé.",
          `Dans l'arène, ${c.entreprise} se pilote trimestre après trimestre : son tableau de bord affiche ce seuil, qui bouge à chaque décision de prix, d'achat ou d'embauche.`,
        ];
      },
      repere: () =>
        "Seuil de rentabilité = charges fixes ÷ marge sur coût variable unitaire. Une vente de plus apporte sa marge, pas son prix.",
    },
  ],
};
