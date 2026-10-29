import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accord } from "../accords";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_GESTION,
  PAS_DES_QUANTITES,
  baisseDePrixEtudiee,
  margeDuMois,
  prixPlancherDuMois,
  quantitePourGarderLaMarge,
} from "../monde/gestion-et-information";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : PRIX, COÛT ET MARGE (contrôle de gestion, palier 1).
 *
 * La première marche du contrôle de gestion, pour le lycée : ce qu'une unité vendue coûte à
 * l'entreprise, ce qu'elle rapporte, et ce qui reste entre les deux. La marge par unité, ses
 * deux taux (sur le coût, sur le prix), la marge du mois, et ce qu'il en reste une fois
 * payées les charges fixes ; puis le prix plancher (un curseur), l'effet d'une baisse de prix, les
 * ventes qu'il faudrait pour garder la marge du mois (un laboratoire), et la place de la TVA.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : le mois de janvier du contrôle de
 * gestion (nova-gestion.ts, lu par monde/gestion-et-information.ts) : 1 590 enceintes à 59 € hors
 * taxes, 22 € de composants et 16 € d'autres coûts par enceinte, 31 183 € de charges fixes. La
 * baisse de prix étudiée est l'écart de prix de la fiche, 10 %.
 *
 * CE QUI A CHANGÉ. Le chapitre se jouait dans les neuf entreprises, sur le mois figé de chacune ; à
 * la boutique, il donnait au mois un chiffre d'affaires de 85 610 €, que la fiche de MAILLE & CO
 * compte 87 450 €. Il se joue maintenant chez NOVA seule, où les chiffres étaient déjà ceux de la
 * fiche (aucun ne change) ; ses cas « Le fournisseur augmente ses prix » et « Suivre la baisse du
 * concurrent » aussi.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/** La baisse de prix étudiée : celle que le chapitre « Décider » étudie, l'écart de prix de la fiche. */
export const BAISSE_DE_PRIX = baisseDePrixEtudiee();

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const auDixieme = (x: number) => Math.round(x * 10) / 10;

export const POURQUOI_PRIX_COUT_MARGE =
  "ce chapitre lit le mois de janvier de NOVA, celui que le contrôle de gestion du cours suit, avec ses prix, ses coûts et ses charges fixes.";

/**
 * Le prix plancher : le plus bas, à l'euro, qui couvre les charges fixes du mois quand les
 * quantités ne bougent pas. Le curseur va du coût d'une unité à un tiers au-dessus du plus
 * grand des deux prix, l'actuel et le plancher.
 */
export function prixPlancher(c: Cas) {
  const m = prixCoutMarge(c);
  const plancher = prixPlancherDuMois(FICHE_DE_GESTION);
  return { ...m, plancher, min: Math.floor(m.cout), max: Math.ceil(Math.max(plancher, m.prix) * 1.3) };
}

/** Le prix, le coût et la marge d'une unité, et ceux du mois : ceux de la fiche de NOVA. */
export function prixCoutMarge(_c: Cas) {
  const m = margeDuMois(FICHE_DE_GESTION);
  const prixBaisse = auCentime(m.prix * (1 - BAISSE_DE_PRIX));
  const margeBaissee = auCentime(prixBaisse - m.cout);
  return {
    prix: m.prix,
    matiere: m.composants,
    autres: m.autres,
    autresCoutsVariables: m.autresCoutsVariables,
    cout: m.cout,
    marge: m.marge,
    tauxDeMarge: m.tauxDeMarge,
    tauxDeMarque: m.tauxDeMarque,
    quantite: m.quantite,
    margeDuMois: m.margeDuMois,
    chargesFixes: m.chargesFixes,
    resultat: m.resultat,
    prixBaisse,
    margeBaissee,
    baisseDeLaMarge: auDixieme(((m.marge - margeBaissee) / m.marge) * 100),
    tauxTva: m.tauxDeTva,
    prixTtc: m.prixTtc,
  };
}

export const PRIX_COUT_MARGE: Chapitre = {
  code: "prix-cout-et-marge",
  parcours: "controle-de-gestion",
  palier: 1,
  blocs: [
    "STMG Thème 3 · Création de valeur et performance",
    "STMG Thème 3 · Accompagner la prise de décision",
  ],
  titre: "Prix, coût et marge",
  accroche:
    "Ce qu'une unité vendue rapporte, ce qu'elle coûte, ce qui reste entre les deux : la marge. Et pourquoi une belle marge ne suffit pas toujours à gagner de l'argent.",
  objectifs: [
    "Calculer le coût d'une unité et la marge qu'elle laisse",
    "Calculer le taux de marge et le taux de marque",
    "Passer de la marge par unité à la marge du mois, puis au résultat",
    "Mesurer l'effet d'une baisse de prix sur la marge",
    "Dire pourquoi la marge se calcule hors taxes",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_PRIX_COUT_MARGE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui reste entre le prix et le coût",
      notions: ["margin_rates"],
      texte: (c) => {
        const m = prixCoutMarge(c);
        return [
          `${c.entreprise} vend en moyenne chaque ${c.unite} ${eur(m.prix)} hors taxes : c'est son prix moyen du mois dans la simulation du cours. Pour chacune de ses ventes, elle dépense ${eur(m.matiere)} d'achats et ${eur(m.autres)} d'autres coûts (${m.autresCoutsVariables}).`,
          "Entre le prix et le coût, il reste la marge. C'est elle qui paie le reste : le loyer, les salaires, l'équipement.",
        ];
      },
      repere: () => "Marge = prix de vente − coût. Elle se calcule pour une unité, puis pour toutes les unités vendues.",
    },
    {
      id: "marge-unitaire",
      objectifs: [0],
      type: "montants",
      titre: "La marge d'une unité",
      notions: ["margin_rates"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `${majuscule(accord(c, "un"))} ${c.unite} ${accord(c, "vendu")} rapporte ${eur(m.prix)} et coûte ${eur(m.matiere)} d'achats plus ${eur(m.autres)} d'autres coûts. Calculez le coût d'une unité, puis la marge qu'elle laisse.`;
      },
      champs: (c) => {
        const m = prixCoutMarge(c);
        return [
          { libelle: "Coût d'une unité", attendu: m.cout, calcul: `${eur(m.matiere)} + ${eur(m.autres)} = ${eur(m.cout)}` },
          { libelle: "Marge d'une unité", attendu: m.marge, calcul: `${eur(m.prix)} − ${eur(m.cout)} = ${eur(m.marge)}` },
        ];
      },
      explication: (c) => {
        const m = prixCoutMarge(c);
        return [`Chaque ${c.unite} ${accord(c, "vendu")} laisse ${eur(m.marge)} à ${c.entreprise}, une fois payé ce qu'elle a coûté.`];
      },
    },
    {
      id: "les-taux",
      objectifs: [1],
      type: "montants",
      titre: "Taux de marge, taux de marque",
      notions: ["margin_rates", "markup_coefficient"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `La marge de ${eur(m.marge)} se compare au coût, ou au prix. Le taux de marge la rapporte au coût, le taux de marque au prix de vente. Calculez les deux, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const m = prixCoutMarge(c);
        return [
          { libelle: "Taux de marge (%)", attendu: m.tauxDeMarge, calcul: `${eur(m.marge)} ÷ ${eur(m.cout)} × 100 = ${pct(m.tauxDeMarge)}`, tolerance: 0.1 },
          { libelle: "Taux de marque (%)", attendu: m.tauxDeMarque, calcul: `${eur(m.marge)} ÷ ${eur(m.prix)} × 100 = ${pct(m.tauxDeMarque)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const m = prixCoutMarge(c);
        return [
          `Même marge, deux taux : ${pct(m.tauxDeMarge)} du coût, ${pct(m.tauxDeMarque)} du prix. Le taux de marque est toujours le plus petit, parce que le prix est plus grand que le coût. Un commerçant dit souvent « je marge à tant » : demandez-lui s'il parle du coût ou du prix.`,
        ];
      },
    },
    {
      id: "le-mois",
      objectifs: [2],
      type: "montants",
      titre: "La marge du mois, et ce qu'il en reste",
      notions: ["contribution_margin", "fixed_costs"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `En un mois, ${c.entreprise} vend ${qte(m.quantite)} ${c.unites}. Ses charges fixes du mois (le loyer, le personnel, l'usure de l'équipement) sont de ${eur(m.chargesFixes)}. Calculez la marge du mois, puis ce qu'il reste une fois les charges fixes payées.`;
      },
      champs: (c) => {
        const m = prixCoutMarge(c);
        return [
          { libelle: "Marge du mois", attendu: m.margeDuMois, calcul: `${eur(m.marge)} × ${qte(m.quantite)} = ${eur(m.margeDuMois)}` },
          { libelle: "Résultat du mois", attendu: m.resultat, calcul: `${eur(m.margeDuMois)} − ${eur(m.chargesFixes)} = ${eur(m.resultat)}` },
        ];
      },
      explication: (c) => {
        const m = prixCoutMarge(c);
        return [
          m.resultat >= 0
            ? `La marge couvre les charges fixes, et il reste ${eur(m.resultat)} : ${c.entreprise} gagne de l'argent ce mois-ci.`
            : `La marge ne couvre pas les charges fixes : il manque ${eur(-m.resultat)}. Avec un taux de marge de ${pct(m.tauxDeMarge)}, ${c.entreprise} perd pourtant de l'argent ce mois-ci : elle ne vend pas assez.`,
          "Combien faut-il vendre pour que la marge couvre tout juste les charges fixes ? C'est le seuil de rentabilité, au palier suivant.",
        ];
      },
    },
    {
      id: "prix-plancher",
      objectifs: [3],
      type: "curseur",
      titre: "Le prix plancher",
      notions: ["margin_rates", "breakeven"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `Les quantités restent les mêmes : ${qte(m.quantite)} ${c.unites} par mois. Faites varier le prix d'une unité, et placez le curseur sur le prix le plus bas, à l'euro, qui ne fait pas perdre d'argent à ${c.entreprise}.`;
      },
      grandeur: () => ({ libelle: "Prix d'une unité", unite: "€" }),
      cible: (c) => {
        const p = prixPlancher(c);
        return { attendu: p.plancher, min: p.min, max: p.max };
      },
      lecture: (c, prix) => {
        const m = prixCoutMarge(c);
        const marge = auCentime(prix - m.cout);
        const margeDuMois = auCentime(marge * m.quantite);
        return [
          { libelle: "Marge d'une unité", montant: marge },
          { libelle: "Marge du mois", montant: margeDuMois },
          { libelle: "Charges fixes", montant: m.chargesFixes },
          { libelle: "Résultat du mois", montant: auCentime(margeDuMois - m.chargesFixes), fort: true },
        ];
      },
      droites: (c) => {
        const m = prixCoutMarge(c);
        return { produit: (prix) => (prix - m.cout) * m.quantite, cout: () => m.chargesFixes, libelles: ["Marge du mois", "Charges fixes"] };
      },
      rates: () => ({
        dessous: "À ce prix, la marge du mois ne paie pas les charges fixes.",
        dessus: "Plus bas, la marge paie encore les charges fixes : cherchez le prix le plus bas.",
      }),
      montrer: "Montrer le prix plancher",
      explication: (c) => {
        const p = prixPlancher(c);
        return [
          p.plancher <= p.prix
            ? `Sous ${eur(p.plancher)}, ${c.entreprise} perd de l'argent à quantités égales. Son prix actuel, ${eur(p.prix)}, lui laisse ${eur(auCentime(p.prix - p.plancher))} de marge de manœuvre.`
            : `À quantités égales, il faudrait vendre au moins ${eur(p.plancher)} pour ne pas perdre d'argent : le prix actuel, ${eur(p.prix)}, est trop bas pour ce volume. L'autre issue est de vendre davantage.`,
          "Les deux droites se croisent au prix plancher : la marge du mois monte avec le prix, les charges fixes ne bougent pas.",
        ];
      },
    },
    {
      id: "baisse-de-prix",
      objectifs: [3],
      type: "montants",
      titre: "Et si le prix baissait ?",
      notions: ["margin_rates", "price_elasticity"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `${c.entreprise} envisage de baisser son prix de ${pct(BAISSE_DE_PRIX * 100)} : ${eur(m.prix)} deviendrait ${eur(m.prixBaisse)}. Le coût d'une unité ne change pas. Que devient la marge d'une unité, et de combien baisse-t-elle, en pourcentage ?`;
      },
      champs: (c) => {
        const m = prixCoutMarge(c);
        return [
          { libelle: "Nouvelle marge d'une unité", attendu: m.margeBaissee, calcul: `${eur(m.prixBaisse)} − ${eur(m.cout)} = ${eur(m.margeBaissee)}` },
          {
            libelle: "Baisse de la marge (%)",
            attendu: m.baisseDeLaMarge,
            calcul: `(${eur(m.marge)} − ${eur(m.margeBaissee)}) ÷ ${eur(m.marge)} × 100 = ${pct(m.baisseDeLaMarge)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const m = prixCoutMarge(c);
        return [
          `Le prix baisse de ${pct(BAISSE_DE_PRIX * 100)}, la marge de ${pct(m.baisseDeLaMarge)} : toute la baisse est prise sur la marge, le coût ne bouge pas. Pour garder la même marge du mois, il faudrait vendre davantage. Le chapitre « Décider », au palier 4, regarde si les clients suivent.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-quantites",
      objectifs: [3],
      type: "simulation",
      titre: "Vendre plus pour garder la marge",
      notions: ["contribution_margin", "price_elasticity"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `Au prix baissé, ${eur(m.prixBaisse)}, chaque ${c.unite} ne laisse plus que ${eur(m.margeBaissee)}. Faites varier les ${c.unites} vendues dans le mois, et cherchez combien il en faudrait pour que la marge du mois reste à ${eur(m.margeDuMois)}.`;
      },
      leviers: (c) => [{ code: "quantite", libelle: `${majuscule(c.unites)} vendues dans le mois`, unite: c.unites, min: 1_500, max: 3_000, pas: PAS_DES_QUANTITES, depart: prixCoutMarge(c).quantite }],
      lecture: (c, p) => {
        const m = prixCoutMarge(c);
        const apres = margeDuMois(FICHE_DE_GESTION, { prix: m.prixBaisse, quantite: p.quantite! });
        return [
          { libelle: "Marge d'une unité, au prix baissé", montant: apres.marge, reference: m.marge },
          { libelle: "Marge du mois", montant: apres.margeDuMois, reference: m.margeDuMois, fort: true },
          { libelle: "Résultat du mois", montant: apres.resultat, reference: m.resultat },
        ];
      },
      defi: (c) => {
        const { auPas } = quantitePourGarderLaMarge(FICHE_DE_GESTION);
        const m = prixCoutMarge(c);
        return {
          consigne: `Trouvez le plus petit nombre d'${c.unites}, à la dizaine, qui garde au prix baissé une marge du mois d'au moins ${eur(m.margeDuMois)}.`,
          atteint: (p) => p.quantite === auPas,
          indice: (p) => {
            const apres = margeDuMois(FICHE_DE_GESTION, { prix: m.prixBaisse, quantite: p.quantite! });
            return apres.margeDuMois < m.margeDuMois
              ? `La marge du mois tombe à ${eur(apres.margeDuMois)} : il manque ${eur(auCentime(m.margeDuMois - apres.margeDuMois))}. Il faut vendre davantage.`
              : `La marge du mois atteint ${eur(apres.margeDuMois)} : moins de ${c.unites} suffirait-il ?`;
          },
          solution: { quantite: auPas },
        };
      },
      explication: (c, p) => {
        const m = prixCoutMarge(c);
        const { juste } = quantitePourGarderLaMarge(FICHE_DE_GESTION);
        const hausse = auDixieme((p.quantite! / m.quantite - 1) * 100);
        return [
          `Défi relevé : ${qte(p.quantite!)} ${c.unites} au lieu de ${qte(m.quantite)}, soit ${pct(hausse)} de ventes en plus, pour une baisse de prix de ${pct(BAISSE_DE_PRIX * 100)}. Au plus juste, il en faudrait ${qte(juste)}.`,
          `Une petite baisse de prix demande beaucoup de ventes en plus, parce qu'elle se prend tout entière sur la marge. Les clients suivront-ils ? C'est la question du chapitre « Décider », au palier 4.`,
        ];
      },
    },
    {
      id: "hors-taxes",
      objectifs: [4],
      type: "choix",
      titre: "Avec ou sans la TVA ?",
      notions: ["vat_payable"],
      question: (c) => {
        const m = prixCoutMarge(c);
        return `Le client paie ${eur(m.prixTtc)} pour ${accord(c, "un")} ${c.unite} : ${eur(m.prix)} hors taxes, plus ${pct(m.tauxTva * 100)} de TVA. Pour calculer la marge, quel prix faut-il prendre ?`;
      },
      options: (c) => {
        const m = prixCoutMarge(c);
        return [
          {
            texte: `Le prix hors taxes, ${eur(m.prix)} : la TVA ne fait que passer par l'entreprise, elle la reverse à l'État.`,
            juste: true,
            retour: "C'est cela. L'entreprise collecte la TVA pour l'État et la lui reverse : ce n'est pas un revenu. Les coûts se comptent aussi hors taxes, puisque la TVA payée sur les achats se récupère.",
          },
          {
            texte: `Le prix toutes taxes comprises, ${eur(m.prixTtc)} : c'est ce que le client paie vraiment.`,
            juste: false,
            retour: "Le client paie bien ce prix, mais la TVA ne reste pas à l'entreprise : elle la reverse à l'État. Compter la TVA dans la marge la gonflerait.",
          },
          {
            texte: "Peu importe, du moment qu'on prend le même pour toutes les unités.",
            juste: false,
            retour: "Cela importe : avec le prix taxes comprises, la marge comprendrait de l'argent qui appartient à l'État.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["margin_rates"],
      texte: (c) => {
        const m = prixCoutMarge(c);
        return [
          `Vous savez ce qu'${accord(c, "un")} ${c.unite} rapporte à ${c.entreprise} : ${eur(m.marge)} de marge, soit ${pct(m.tauxDeMarge)} du coût et ${pct(m.tauxDeMarque)} du prix, et ce que devient cette marge quand le prix baisse.`,
          "Dans l'arène, le prix est votre première décision : chaque tour, regardez la marge qu'il laisse, et le nombre d'unités qu'il fait vendre.",
        ];
      },
      repere: () =>
        "Marge = prix − coût (hors taxes). Taux de marge = marge ÷ coût. Taux de marque = marge ÷ prix. Une baisse de prix se prend tout entière sur la marge.",
    },
  ],
};
