import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_PILOTER_UN_CENTRE, centresDuChapitre } from "../../chapitres/piloter-un-centre";
import { auCentime } from "../../monde/amortissement";
import { OFFRE_DU_SOUS_TRAITANT, leviersDuMois, resultatsDesCentres } from "../../monde/centres-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « PILOTER UN CENTRE » : LE SOUS-TRAITANT BAISSE SON PRIX (contrôle de
 * gestion, palier 4).
 *
 * Le sous-traitant offre l'enceinte finie à 48 € au lieu de 52 € (OFFRE_DU_SOUS_TRAITANT,
 * monde/centres-de-nova.ts). L'atelier cède au prix de marché, 52 € : la responsable commerciale veut
 * acheter dehors. L'élève chiffre, sur janvier, ce que deviendraient les deux centres et NOVA si elle
 * achetait au sous-traitant, puis si l'atelier alignait son prix de cession sur la nouvelle offre ; sa
 * réponse doit distinguer ce qui est bon pour le centre et ce qui est bon pour l'entreprise.
 *
 * Comme son chapitre, le cas se joue dans le monde du cours : `resultatsDesCentres` calcule chaque
 * hypothèse, l'offre en levier.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const par = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));

/** Les chiffres du cas : janvier au prix de marché, janvier acheté dehors, janvier cédé au prix de l'offre. */
export function sousTraitantMoinsCher(c: Pick<Cas, "code">) {
  const x = centresDuChapitre(c);
  const offre = OFFRE_DU_SOUS_TRAITANT;
  const base = { ...leviersDuMois(x.f), prixDuSousTraitant: offre };
  const aujourdhui = x.trois.marche;
  const dehors = resultatsDesCentres(x.f, { ...base, fournisseur: "sous-traitant" });
  const aligne = resultatsDesCentres(x.f, { ...base, cession: offre });
  return { x, offre, aujourdhui, dehors, aligne, perte: auCentime(aligne.nova - dehors.nova) };
}

export const LE_SOUS_TRAITANT_BAISSE_SON_PRIX: Situation = {
  code: "le-sous-traitant-baisse-son-prix",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["piloter-un-centre"],
  commanditaire: "La responsable commerciale",
  titre: "Le sous-traitant baisse son prix",
  accroche: "Le sous-traitant offre l'enceinte à 48 €, l'atelier la cède à 52 €. La responsable commerciale veut acheter dehors : est-ce bon pour son centre, et pour NOVA ?",
  objectifs: [
    "Calculer le résultat de chaque centre et de l'entreprise quand un centre achète à l'extérieur",
    "Recalculer le partage quand le prix de cession suit le prix de marché",
    "Rendre une réponse qui distingue l'intérêt du centre et celui de l'entreprise",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_PILOTER_UN_CENTRE,
    pourquoi: "ce cas reprend le chapitre « Piloter un centre », qui se calcule sur les deux centres de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable commerciale",
      texte: (c) => {
        const n = sousTraitantMoinsCher(c);
        return [
          `« Le sous-traitant m'offre l'enceinte finie à ${eur(n.offre)}. L'atelier me la cède à ${eur(n.x.marche)}. Si j'achète dehors, mon centre gagne ${eur(n.x.q * (n.x.marche - n.offre))} de plus par mois. Je compte le faire dès le mois prochain : vous êtes d'accord ? »`,
          "Pas de cours cette fois : vous avez les chiffres de janvier et la méthode du chapitre. Chiffrez les deux centres et NOVA si elle achète dehors, puis si l'atelier alignait son prix de cession sur l'offre.",
        ];
      },
      tableau: (c) => {
        const { x, offre } = sousTraitantMoinsCher(c);
        return {
          titre: `Janvier · ${x.f.entreprise}`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Enceintes vendues dans le mois", valeurs: [`${qte(x.q)} à ${eur(x.m.prix)} HT`] },
            { libelle: "Coût variable d'une enceinte à l'atelier", valeurs: [eur(x.cv)] },
            { libelle: "Charges fixes de l'atelier", valeurs: [eur(x.fixes.atelier)] },
            { libelle: "Charges fixes du service commercial", valeurs: [eur(x.fixes.commercial)] },
            { libelle: "Prix de cession de l'atelier, au prix de marché", valeurs: [eur(x.marche)] },
            { libelle: "Offre du sous-traitant", valeurs: [eur(offre)] },
          ],
        };
      },
      repere: () => "À rendre : les résultats des deux centres et de NOVA si le service commercial achète dehors, puis si l'atelier cède au prix de l'offre, et votre réponse.",
    },
    {
      id: "si-elle-achete-dehors",
      type: "montants",
      titre: "Si le service commercial achète dehors",
      notions: ["make_or_buy", "fixed_costs"],
      question: (c) => {
        const n = sousTraitantMoinsCher(c);
        return `Supposez que le service commercial achète au sous-traitant, à ${eur(n.offre)}, les ${qte(n.x.q)} enceintes de janvier. L'atelier ne cède plus rien, mais garde ses charges fixes. Calculez le résultat du service commercial, celui de l'atelier, puis celui de NOVA.`;
      },
      champs: (c) => {
        const n = sousTraitantMoinsCher(c);
        const d = n.dehors;
        return [
          { libelle: "Résultat du service commercial", attendu: d.commercial.resultat, calcul: `${eur(d.commercial.ventes)} − ${qte(n.x.q)} × ${eur(n.offre)} − ${eur(n.x.fixes.commercial)} = ${eur(d.commercial.resultat)}` },
          { libelle: "Résultat de l'atelier", attendu: d.atelier.resultat, calcul: `ses charges fixes : ${eur(d.atelier.resultat)}` },
          { libelle: "Résultat de NOVA", attendu: d.nova, calcul: `${eur(d.commercial.resultat)} + ${par(d.atelier.resultat)} = ${eur(d.nova)}` },
        ];
      },
      explication: (c) => {
        const n = sousTraitantMoinsCher(c);
        return [`Le service commercial gagne ${eur(n.dehors.commercial.resultat)} au lieu de ${eur(n.aujourdhui.commercial.resultat)} ; NOVA passe de ${eur(n.aujourdhui.nova)} à ${eur(n.dehors.nova)}.`];
      },
    },
    {
      id: "si-l-atelier-suit-le-marche",
      type: "montants",
      titre: "Si l'atelier suit le marché",
      notions: ["make_or_buy", "contribution_margin"],
      question: (c) => {
        const n = sousTraitantMoinsCher(c);
        return `Supposez maintenant que l'atelier garde les enceintes et aligne son prix de cession sur l'offre, ${eur(n.offre)}. Calculez le résultat de l'atelier, celui du service commercial, celui de NOVA, puis ce que NOVA gagne par rapport à l'achat dehors.`;
      },
      champs: (c) => {
        const n = sousTraitantMoinsCher(c);
        const a = n.aligne;
        return [
          { libelle: "Résultat de l'atelier, au prix de l'offre", attendu: a.atelier.resultat, calcul: `${qte(n.x.q)} × (${eur(n.offre)} − ${eur(n.x.cv)}) − ${eur(n.x.fixes.atelier)} = ${eur(a.atelier.resultat)}` },
          { libelle: "Résultat du service commercial, au prix de l'offre", attendu: a.commercial.resultat, calcul: `${eur(a.commercial.ventes)} − ${eur(a.commercial.achats)} − ${eur(n.x.fixes.commercial)} = ${eur(a.commercial.resultat)}` },
          { libelle: "Résultat de NOVA, au prix de l'offre", attendu: a.nova, calcul: `${par(a.atelier.resultat)} + ${eur(a.commercial.resultat)} = ${eur(a.nova)}` },
          { libelle: "Ce que NOVA gagne à garder l'atelier", attendu: n.perte, calcul: `${eur(a.nova)} − ${par(n.dehors.nova)} = ${eur(n.perte)}, soit ${qte(n.x.q)} × (${eur(n.offre)} − ${eur(n.x.cv)})` },
        ];
      },
      explication: (c) => {
        const n = sousTraitantMoinsCher(c);
        return [
          `Le service commercial gagne autant que s'il achetait dehors, ${eur(n.aligne.commercial.resultat)} ; NOVA garde ses ${eur(n.aligne.nova)}. L'atelier perd ${eur(-n.aligne.atelier.resultat)} : c'est le prix d'un marché plus bas, et de ses enceintes non fabriquées, qu'il faudra regarder dans son reporting.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable commerciale",
      notions: ["make_or_buy"],
      question: () => "Quelle réponse lui rendez-vous ?",
      options: (c) => {
        const n = sousTraitantMoinsCher(c);
        return [
          {
            texte: `Non : l'atelier fournit, mais à ${eur(n.offre)}`,
            juste: true,
            retour: `Oui. Acheter dehors coûterait ${eur(n.perte)} à NOVA par mois : chaque enceinte paierait ${eur(n.offre)} au sous-traitant au lieu de ${eur(n.x.cv)} de coût variable, et les charges fixes de l'atelier resteraient. Aligner le prix de cession sur le marché donne au service commercial ce que l'offre lui promettait, sans que NOVA y perde.`,
          },
          {
            texte: `Oui : son centre gagnerait ${eur(n.dehors.commercial.resultat - n.aujourdhui.commercial.resultat)} de plus chaque mois`,
            juste: false,
            retour: `Non : ce que gagne son centre, NOVA le perd, et plus encore : ${eur(n.perte)} par mois, parce que l'atelier garde ses charges fixes.`,
          },
          {
            texte: `Non : l'atelier garde son prix de ${eur(n.x.marche)}, c'est le prix de marché`,
            juste: false,
            retour: `Non : le marché est maintenant à ${eur(n.offre)}. Un prix de cession au-dessus du marché pousse le service commercial à acheter dehors, ce qui coûte à NOVA.`,
          },
          {
            texte: `Oui, et fermer l'atelier : il perdrait ${eur(-n.aligne.atelier.resultat)} au prix de l'offre`,
            juste: false,
            retour: `Non : sa perte vient de ses charges fixes, qui ne disparaîtraient pas dans le mois. Il couvre ${eur(auCentime(n.x.q * (n.offre - n.x.cv)))} de charges fixes que l'achat dehors laisserait sans rien en face.`,
          },
        ];
      },
    },
  ],
};
