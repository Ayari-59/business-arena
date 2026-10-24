import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { ECART_DE_PRIX, prixRejoues } from "../decision";
import { CONTRE_PROPOSITION } from "../negociation";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : NÉGOCIER LE PRIX (BTS NDRC, palier 2).
 *
 * Avant d'entrer en négociation, le commercial connaît son plancher. Le coût complet d'une
 * unité (le coût variable et sa part des charges fixes), la marge de manœuvre qu'il laisse
 * sous le prix catalogue, la remise qu'on peut accorder sans perdre d'argent ; puis les deux
 * planchers (le coût complet pour tous les clients, le coût variable pour une affaire en plus),
 * ce que l'arène fait d'une baisse de prix accordée à tous, et les clients qui tiennent le
 * mieux le prix.
 *
 * Les chiffres sont ceux du mois du cas (`cas.gestion`), le client est celui que le cas
 * facture à échéance, la baisse de prix est celle que l'arène rejoue (`decision.ts`), la
 * sensibilité au prix est celle de chaque clientèle du scénario. Seule la contre-proposition
 * du client est une hypothèse, posée dans `negociation.ts`.
 */

/** Les entreprises où le prix se négocie affaire par affaire, avec un client professionnel. */
export const NEGOCIATIONS = ["conseil", "transport", "batiment"] as const;

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Le nom d'une clientèle, sans la parenthèse qui la décrit. */
const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, "");

/** Le prix, les coûts et les planchers d'une unité, et l'affaire que le client met sur la table. */
export function negociation(c: Cas) {
  const g = c.gestion;
  const prix = g.prixMoyen;
  const coutVariable = g.coutVariableUnitaire;
  const partDesFixes = auCentime(g.chargesFixes / g.quantite);
  const coutComplet = auCentime(coutVariable + partDesFixes);
  const margeDeManoeuvre = auCentime(prix - coutComplet);
  const remiseMaximale = auDixieme((margeDeManoeuvre / prix) * 100);
  const quantite = c.venteCredit.quantite;
  const prixRemise = auCentime(prix * (1 - ECART_DE_PRIX));
  const contreProposition = Math.round(coutVariable + (coutComplet - coutVariable) * CONTRE_PROPOSITION);
  // La remise maximale à l'unité de pourcentage : la plus grande qui laisse le prix au-dessus du coût complet.
  const remiseEntiere = Math.floor((1 - coutComplet / prix) * 100 + 1e-9);
  const [baisse, base] = prixRejoues(c.code);
  const segments = scenarioByCode(c.code).scenario.market.segments;
  const clienteles = c.marche.clienteles.map((k) => {
    const elasticite = segments.find((s) => s.code === k.code)!.priceElasticity;
    return { code: k.code, nom: nomCourt(k.nom), elasticite, perte: auDixieme((1 - Math.pow(1 + ECART_DE_PRIX, elasticite)) * 100) };
  });
  return {
    prix,
    matiere: g.matiereParUnite,
    autres: g.autresParUnite,
    autresCoutsVariables: g.autresCoutsVariables,
    coutVariable,
    chargesFixes: g.chargesFixes,
    quantiteDuMois: g.quantite,
    partDesFixes,
    coutComplet,
    margeDeManoeuvre,
    remiseMaximale,
    remiseEntiere,
    client: c.venteCredit.client,
    quantite,
    ecart: Math.round(ECART_DE_PRIX * 100),
    prixRemise,
    contreProposition,
    margeDeLaContreProposition: auCentime(contreProposition - coutVariable),
    perteSiGeneralisee: auCentime((coutComplet - contreProposition) * g.quantite),
    base: base!,
    baisse: baisse!,
    clienteles,
    tenace: clienteles.reduce((a, b) => (Math.abs(b.elasticite) < Math.abs(a.elasticite) ? b : a)),
  };
}

export const NEGOCIER_LE_PRIX: Chapitre = {
  code: "negocier-le-prix",
  parcours: "ndrc",
  palier: 2,
  titre: "Négocier le prix : marge de manœuvre et prix plancher",
  accroche:
    "Le client demande une remise. Jusqu'où descendre sans perdre d'argent ? Quand accepter un prix sous le coût complet ? Et quels clients tiennent le mieux le prix ?",
  objectifs: [
    "Calculer le coût complet d'une unité",
    "Calculer la marge de manœuvre et la remise maximale",
    "Décider d'une remise demandée par un client",
    "Distinguer le plancher de tous les clients et celui d'une affaire en plus",
    "Mesurer ce qu'une baisse de prix accordée à tous rapporte vraiment",
    "Repérer les clients les moins sensibles au prix",
  ],
  libre: false,
  entreprises: {
    codes: NEGOCIATIONS,
    pourquoi: "ce chapitre suit une négociation avec un client professionnel, là où le prix se discute affaire par affaire.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le client demande une remise",
      notions: ["full_unit_cost", "price_floor"],
      texte: (c) => {
        const n = negociation(c);
        return [
          `${majuscule(n.client)} veut confier à ${c.entreprise} ${qte(n.quantite)} ${c.unites}, et demande un geste sur le prix catalogue de ${eur(n.prix)}.`,
          "Avant d'entrer en négociation, le commercial connaît son plancher : le prix sous lequel l'affaire fait perdre de l'argent. Entre ce plancher et le prix catalogue, il a sa marge de manœuvre.",
        ];
      },
      tableau: (c) => {
        const n = negociation(c);
        return {
          titre: `Les chiffres du mois, chez ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Prix catalogue (hors taxes)", valeurs: [eur(n.prix)] },
            { libelle: "Coût d'achat par unité", valeurs: [eur(n.matiere)] },
            { libelle: `Autres coûts par unité (${n.autresCoutsVariables})`, valeurs: [eur(n.autres)] },
            { libelle: "Charges fixes du mois", valeurs: [eur(n.chargesFixes)] },
            { libelle: `${majuscule(c.unites)} vendus dans le mois`, valeurs: [qte(n.quantiteDuMois)] },
          ],
        };
      },
      repere: () => "Coût complet unitaire = coût variable unitaire + charges fixes ÷ quantité vendue. Marge de manœuvre = prix catalogue − coût complet.",
    },
    {
      id: "cout-complet",
      type: "montants",
      titre: "Le coût complet d'une unité",
      notions: ["variable_costs", "full_unit_cost"],
      question: (c) => {
        const n = negociation(c);
        return `Calculez le coût variable d'une unité, la part des charges fixes qu'elle porte (${eur(n.chargesFixes)} pour ${qte(n.quantiteDuMois)} ${c.unites}, au centime), puis son coût complet.`;
      },
      champs: (c) => {
        const n = negociation(c);
        return [
          { libelle: "Coût variable unitaire", attendu: n.coutVariable, calcul: `${eur(n.matiere)} + ${eur(n.autres)} = ${eur(n.coutVariable)}` },
          { libelle: "Part des charges fixes par unité", attendu: n.partDesFixes, calcul: `${eur(n.chargesFixes)} ÷ ${qte(n.quantiteDuMois)} = ${eur(n.partDesFixes)}` },
          { libelle: "Coût complet unitaire", attendu: n.coutComplet, calcul: `${eur(n.coutVariable)} + ${eur(n.partDesFixes)} = ${eur(n.coutComplet)}` },
        ];
      },
      explication: (c) => {
        const n = negociation(c);
        return [
          `Une unité coûte ${eur(n.coutVariable)} à produire ou à livrer, et porte ${eur(n.partDesFixes)} du loyer, de l'équipe et de l'équipement. Vendue sous ${eur(n.coutComplet)} à tous les clients, elle fait perdre de l'argent à ${c.entreprise}.`,
        ];
      },
    },
    {
      id: "marge-de-manoeuvre",
      type: "montants",
      titre: "La marge de manœuvre",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociation(c);
        return `Le prix catalogue est de ${eur(n.prix)}, le coût complet de ${eur(n.coutComplet)}. Calculez la marge de manœuvre par unité, puis la remise maximale qu'elle permet, en pourcentage du prix catalogue, au dixième.`;
      },
      champs: (c) => {
        const n = negociation(c);
        return [
          { libelle: "Marge de manœuvre par unité", attendu: n.margeDeManoeuvre, calcul: `${eur(n.prix)} − ${eur(n.coutComplet)} = ${eur(n.margeDeManoeuvre)}` },
          { libelle: "Remise maximale (%)", attendu: n.remiseMaximale, calcul: `${eur(n.margeDeManoeuvre)} ÷ ${eur(n.prix)} × 100 = ${pct(n.remiseMaximale)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const n = negociation(c);
        return [
          `Le commercial peut céder jusqu'à ${eur(n.margeDeManoeuvre)} par unité, soit ${pct(n.remiseMaximale)} du prix catalogue, avant que l'affaire ne cesse de payer sa part des charges fixes. Chaque euro cédé sort directement du bénéfice.`,
        ];
      },
    },
    {
      id: "remise-demandee",
      type: "choix",
      titre: "Une remise demandée",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociation(c);
        return `${majuscule(n.client)} demande ${n.ecart} % de remise, soit ${eur(n.prixRemise)} au lieu de ${eur(n.prix)}. Le commercial peut-il l'accorder sans faire perdre d'argent à ${c.entreprise} ?`;
      },
      options: (c) => {
        const n = negociation(c);
        const tient = n.prixRemise >= n.coutComplet;
        return [
          {
            texte: "Oui : le prix remisé reste au-dessus du coût complet",
            juste: tient,
            retour: tient
              ? `Oui : ${eur(n.prixRemise)} couvre le coût complet de ${eur(n.coutComplet)}. La remise de ${n.ecart} % reste sous la remise maximale de ${pct(n.remiseMaximale)} ; elle coûte ${eur(n.prix - n.prixRemise)} de bénéfice par unité, mais l'affaire en laisse encore ${eur(n.prixRemise - n.coutComplet)}.`
              : `Non : ${eur(n.prixRemise)} est sous le coût complet de ${eur(n.coutComplet)}. La remise de ${n.ecart} % dépasse la remise maximale de ${pct(n.remiseMaximale)}.`,
          },
          {
            texte: "Non : le prix remisé passe sous le coût complet",
            juste: !tient,
            retour: tient
              ? `Non : ${eur(n.prixRemise)} reste au-dessus du coût complet de ${eur(n.coutComplet)}, et la remise de ${n.ecart} % reste sous la remise maximale de ${pct(n.remiseMaximale)}.`
              : `Oui : à ${eur(n.prixRemise)}, chaque unité vendue à ce client manque ${eur(n.coutComplet - n.prixRemise)} pour payer sa part des charges fixes.`,
          },
          {
            texte: "Non : une remise fait toujours perdre de l'argent",
            juste: false,
            retour: `Non : une remise réduit le bénéfice, elle ne crée une perte que sous le coût complet de ${eur(n.coutComplet)}. Entre les deux, le commercial négocie sur sa marge de manœuvre.`,
          },
        ];
      },
    },
    {
      id: "remise-maximale",
      type: "curseur",
      titre: "Jusqu'où céder",
      notions: ["price_floor"],
      question: (c) => {
        const n = negociation(c);
        return `Sur l'affaire de ${qte(n.quantite)} ${c.unites}, faites varier la remise accordée, et placez le curseur sur la plus forte, au pourcentage entier, qui laisse le prix remisé au-dessus du coût complet.`;
      },
      grandeur: () => ({ libelle: "Remise accordée", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => {
        const n = negociation(c);
        return { attendu: n.remiseEntiere, max: Math.min(90, n.remiseEntiere + 15) };
      },
      lecture: (c, remise) => {
        const n = negociation(c);
        const prix = auCentime(n.prix * (1 - remise / 100));
        const ca = auCentime(prix * n.quantite);
        const cout = auCentime(n.coutComplet * n.quantite);
        return [
          { libelle: "Prix remisé par unité", montant: prix },
          { libelle: "Chiffre d'affaires de l'affaire", montant: ca },
          { libelle: "Coût complet de l'affaire", montant: cout },
          { libelle: "Résultat de l'affaire", montant: auCentime(ca - cout), fort: true },
        ];
      },
      droites: (c) => {
        const n = negociation(c);
        return {
          produit: (r) => n.quantite * n.prix * (1 - r / 100),
          cout: () => n.quantite * n.coutComplet,
          libelles: ["Chiffre d'affaires de l'affaire", "Coût complet de l'affaire"],
        };
      },
      zones: ["L'affaire paie ses coûts", "L'affaire fait perdre"],
      rates: () => ({
        dessous: "Plus fort, la remise laisse encore l'affaire au-dessus de ses coûts : cherchez la plus forte.",
        dessus: "À cette remise, le prix passe sous le coût complet : l'affaire fait perdre de l'argent.",
      }),
      montrer: "Montrer la remise maximale",
      explication: (c) => {
        const n = negociation(c);
        return [
          `Jusqu'à ${qte(n.remiseEntiere)} %, l'affaire paie ses coûts variables et sa part des charges fixes. Au-delà, ${c.entreprise} perd de l'argent sur chaque unité de cette affaire.`,
        ];
      },
    },
    {
      id: "deux-planchers",
      type: "choix",
      titre: "Sous le coût complet",
      notions: ["price_floor", "contribution_margin"],
      question: (c) => {
        const n = negociation(c);
        return `${majuscule(n.client)} fait une contre-proposition : ${eur(n.contreProposition)} l'unité, sous le coût complet (${eur(n.coutComplet)}) mais au-dessus du coût variable (${eur(n.coutVariable)}). ${c.entreprise} peut-elle l'accepter ?`;
      },
      options: (c) => {
        const n = negociation(c);
        return [
          {
            texte: "Pour cette affaire seulement, si elle occupe une capacité qui resterait libre",
            juste: true,
            retour: `Oui : sur des ${c.unites} qui ne se vendraient pas autrement, chaque unité rapporte ${eur(n.margeDeLaContreProposition)} de plus qu'elle ne coûte, et ces euros paient une partie des charges fixes qui tombent de toute façon. Le coût variable est le plancher d'une affaire en plus.`,
          },
          {
            texte: "Oui, et pour tous les clients : le prix couvre le coût variable",
            juste: false,
            retour: `Non : à ${eur(n.contreProposition)} pour tous les clients, les ${qte(n.quantiteDuMois)} ${c.unites} du mois ne paieraient plus les charges fixes, et ${c.entreprise} perdrait ${eur(n.perteSiGeneralisee)} par mois. Le coût complet est le plancher de tous les clients.`,
          },
          {
            texte: "Non, jamais : le prix est sous le coût complet",
            juste: false,
            retour: `Pas forcément : si l'affaire s'ajoute à l'activité sans prendre la place d'un client au prix catalogue, ses ${eur(n.margeDeLaContreProposition)} par unité au-dessus du coût variable paient une partie des charges fixes, qui tombent de toute façon.`,
          },
        ];
      },
    },
    {
      id: "baisse-pour-tous",
      type: "choix",
      titre: "Une baisse accordée à tous",
      notions: ["price_elasticity", "contribution_margin"],
      tableau: (c) => {
        const n = negociation(c);
        return {
          titre: "Le premier trimestre de l'arène, rejoué à deux prix",
          colonnes: ["Prix catalogue", `Prix baissé de ${n.ecart} %`],
          lignes: [
            { libelle: "Prix", valeurs: [eur(n.base.prix), eur(n.baisse.prix)] },
            { libelle: `${majuscule(c.unites)} vendus`, valeurs: [qte(n.base.quantite), qte(n.baisse.quantite)] },
            { libelle: "Chiffre d'affaires", valeurs: [eur(n.base.chiffreDAffaires), eur(n.baisse.chiffreDAffaires)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(n.base.marge), eur(n.baisse.marge)] },
          ],
        };
      },
      question: (c) => {
        const n = negociation(c);
        return `L'arène a rejoué le premier trimestre, chez ${c.entreprise}, avec un prix ${n.ecart} % plus bas pour tous les clients, sans rien changer d'autre. Qu'a donné la baisse ?`;
      },
      options: (c) => {
        const n = negociation(c);
        const plusDeVentes = n.baisse.quantite > n.base.quantite;
        const plusDeMarge = n.baisse.marge > n.base.marge;
        const ecartDeMarge = eur(Math.abs(n.base.marge - n.baisse.marge));
        return [
          {
            texte: "Les mêmes ventes, et moins de marge",
            juste: !plusDeVentes && !plusDeMarge,
            retour: !plusDeVentes
              ? `Oui : ${c.entreprise} a vendu ${qte(n.baisse.quantite)} ${c.unites}, autant qu'au prix catalogue : son plan de production ne lui permettait pas d'en servir plus ce trimestre. Chaque client a payé moins pour la même chose : ${ecartDeMarge} de marge en moins.`
              : `Non : la baisse a fait vendre ${qte(n.baisse.quantite)} ${c.unites} au lieu de ${qte(n.base.quantite)}.`,
          },
          {
            texte: "Plus de ventes, et plus de marge",
            juste: plusDeVentes && plusDeMarge,
            retour: plusDeVentes && plusDeMarge
              ? `Oui : ${qte(n.baisse.quantite - n.base.quantite)} ${c.unites} de plus ont compensé la marge cédée sur chacun : ${ecartDeMarge} de marge en plus.`
              : `Non : ${plusDeVentes ? "les ventes ont monté, mais pas assez pour compenser la marge cédée sur chaque unité" : "les ventes n'ont pas bougé"}.`,
          },
          {
            texte: "Plus de ventes, mais moins de marge",
            juste: plusDeVentes && !plusDeMarge,
            retour: plusDeVentes && !plusDeMarge
              ? `Oui : ${qte(n.baisse.quantite - n.base.quantite)} ${c.unites} de plus n'ont pas compensé la marge cédée sur chacun : ${ecartDeMarge} de marge en moins.`
              : `Non : ${plusDeVentes ? "les ventes en plus ont compensé la marge cédée" : "les ventes n'ont pas bougé"}.`,
          },
        ];
      },
    },
    {
      id: "qui-tient-le-prix",
      type: "choix",
      titre: "Les clients qui tiennent le prix",
      notions: ["price_elasticity", "segmentation"],
      tableau: (c) => {
        const n = negociation(c);
        return {
          titre: `Si ${c.entreprise} montait son prix de ${n.ecart} %`,
          colonnes: ["Demande perdue (environ)"],
          lignes: n.clienteles.map((k) => ({ libelle: k.nom, valeurs: [pct(k.perte)] })),
        };
      },
      question: (c) => `Le tableau dit, pour chaque clientèle, chez ${c.entreprise}, la part de la demande qu'une hausse de prix ferait perdre, toutes choses égales par ailleurs. Avec quels clients le commercial peut-il tenir son prix le plus fermement ?`,
      options: (c) => {
        const n = negociation(c);
        return n.clienteles.map((k) => ({
          texte: k.nom,
          juste: k.code === n.tenace.code,
          retour:
            k.code === n.tenace.code
              ? `Oui : une hausse de ${n.ecart} % ne leur ferait perdre qu'environ ${pct(k.perte)} de la demande. Ce sont les clients qui achètent la relation, la fiabilité ou l'urgence avant le prix : ceux auprès de qui une remise se cède le moins.`
              : `Non : une hausse de ${n.ecart} % leur ferait perdre environ ${pct(k.perte)} de la demande, plus que pour la clientèle « ${n.tenace.nom} » (${pct(n.tenace.perte)}). Ils comparent davantage, et la remise y pèse plus dans la décision.`,
        }));
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["price_floor", "full_unit_cost", "price_elasticity"],
      texte: (c) => {
        const n = negociation(c);
        return [
          `${c.entreprise} vend ${eur(n.prix)} une unité qui lui coûte ${eur(n.coutComplet)} tout compris : sa marge de manœuvre est de ${eur(n.margeDeManoeuvre)}, soit une remise de ${pct(n.remiseMaximale)} au plus pour un client régulier.`,
          `Sous le coût complet, il n'y a de place que pour une affaire en plus, sur une capacité qui resterait libre, et jamais au-dessous du coût variable de ${eur(n.coutVariable)}. Une baisse accordée à tous se paie sur chaque vente : elle ne rapporte que si elle fait vendre assez en plus.`,
        ];
      },
      repere: () => "Plancher pour tous les clients : le coût complet. Plancher d'une affaire en plus, sur une capacité libre : le coût variable. Entre le prix catalogue et le plancher : la marge de manœuvre.",
    },
  ],
};
