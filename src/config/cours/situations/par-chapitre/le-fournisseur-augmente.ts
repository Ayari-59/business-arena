import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { POURQUOI_PRIX_COUT_MARGE, prixCoutMarge } from "../../chapitres/prix-cout-marge";
import { ENTREPRISES_DE_LA_GESTION_DE_BASE } from "../../monde/gestion-et-information";
import type { Situation } from "../types";

/** « que » devant un nom, élidé devant une voyelle : qu'ATLAS CONSEIL. */
const que = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈÊ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/**
 * CAS PRATIQUE DU CHAPITRE « PRIX, COÛT ET MARGE » : LE FOURNISSEUR AUGMENTE SES PRIX
 * (contrôle de gestion, palier 1).
 *
 * Le fournisseur annonce une hausse de ses tarifs. Le gérant veut garder le même taux de
 * marque, et demande à quel prix il faudra vendre. L'élève refait seul le chemin du
 * chapitre : le coût d'une unité, sa marge, le taux de marque, ce qu'ils deviennent si le
 * prix ne bouge pas, puis le prix qui rend le même taux de marque.
 *
 * Le cas est neuf par sa question : c'est le coût qui bouge, pas le prix (le cas de
 * synthèse « Suivre la baisse du concurrent » fait jouer le prix). Seuls les achats
 * augmentent ; les autres coûts par unité, le prix et les quantités sont ceux du mois de
 * janvier de NOVA (monde/gestion-et-information.ts).
 */

/**
 * La hausse des prix d'achat annoncée : 8 %, l'ordre de grandeur d'une revalorisation
 * annuelle des tarifs d'un fournisseur quand les matières premières renchérissent.
 */
export const HAUSSE_DES_ACHATS = 0.08;

const auDixieme = (x: number) => Math.round(x * 10) / 10;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function fournisseurQuiAugmente(c: Cas) {
  const m = prixCoutMarge(c);
  const nouveauxAchats = auCentime(m.matiere * (1 + HAUSSE_DES_ACHATS));
  const hausseParUnite = auCentime(nouveauxAchats - m.matiere);
  const nouveauCout = auCentime(nouveauxAchats + m.autres);
  const margeSansHausseDePrix = auCentime(m.prix - nouveauCout);
  const tauxDeMarqueSansHausse = auDixieme((margeSansHausseDePrix / m.prix) * 100);
  // Garder le taux de marque, c'est garder le rapport du prix au coût : le prix suit le
  // coût dans la même proportion. L'élève qui passe par le taux de marque au dixième,
  // comme au chapitre (prix = coût ÷ (1 − taux de marque)), trouve un prix voisin :
  // l'écart entre les deux est admis.
  const nouveauPrix = auCentime((nouveauCout * m.prix) / m.cout);
  const prixParLeTaux = auCentime(nouveauCout / (1 - m.tauxDeMarque / 100));
  const hausseDuPrix = auDixieme((nouveauPrix / m.prix - 1) * 100);
  return {
    ...m,
    nouveauxAchats,
    hausseParUnite,
    nouveauCout,
    margeSansHausseDePrix,
    tauxDeMarqueSansHausse,
    nouveauPrix,
    prixParLeTaux,
    tolerancePrix: Math.max(0.05, auCentime(Math.abs(prixParLeTaux - nouveauPrix)) + 0.02),
    nouvelleMarge: auCentime(nouveauPrix - nouveauCout),
    hausseDuPrix,
    toleranceHausse: Math.max(0.1, auDixieme(Math.abs((prixParLeTaux / m.prix - 1) * 100 - hausseDuPrix)) + 0.1),
    hausseDuCout: auDixieme((nouveauCout / m.cout - 1) * 100),
    // Les erreurs classiques de la dernière question.
    prixPlusLaHausse: auCentime(m.prix + hausseParUnite),
    prixHausseDuTaux: auCentime(m.prix * (1 + HAUSSE_DES_ACHATS)),
    coutPlusTauxDeMarque: auCentime(nouveauCout * (1 + m.tauxDeMarque / 100)),
  };
}

export const LE_FOURNISSEUR_AUGMENTE: Situation = {
  code: "le-fournisseur-augmente",
  parcours: "controle-de-gestion",
  palier: 1,
  blocs: [],
  reprend: ["prix-cout-et-marge"],
  commanditaire: "Le gérant",
  titre: "Le fournisseur augmente ses prix",
  accroche:
    "Le fournisseur annonce une hausse de ses tarifs. Le gérant veut garder le même taux de marque : à quel prix faudra-t-il vendre ?",
  objectifs: [
    "Calculer le coût d'une unité, sa marge et son taux de marque",
    "Mesurer ce qu'une hausse des achats retire à la marge quand le prix ne bouge pas",
    "Calculer le prix de vente qui garde le même taux de marque",
    "Rédiger une réponse chiffrée au gérant",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_GESTION_DE_BASE, pourquoi: POURQUOI_PRIX_COUT_MARGE },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => [
        `« Notre fournisseur augmente ses prix de ${pct(HAUSSE_DES_ACHATS * 100)} le mois prochain. Je ne veux pas ${que(c.entreprise)} y perde : je veux garder le même taux de marque qu'aujourd'hui. À quel prix de vente moyen, hors taxes, faudra-t-il passer ? »`,
        "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous de l'enchaîner.",
      ],
      tableau: (c) => {
        const r = fournisseurQuiAugmente(c);
        return {
          titre: `Les chiffres du mois · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `Prix de vente moyen d'${accord(c, "un")} ${c.unite}, hors taxes`, valeurs: [eur(r.prix)] },
            { libelle: "Achats par unité vendue, aujourd'hui", valeurs: [eur(r.matiere)] },
            { libelle: `Autres coûts par unité (${r.autresCoutsVariables})`, valeurs: [eur(r.autres)] },
            { libelle: "Hausse annoncée des prix d'achat", valeurs: [pct(HAUSSE_DES_ACHATS * 100)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le taux de marque d'aujourd'hui, ce qu'il devient si le prix ne bouge pas, le prix qui le garde, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "La marge d'aujourd'hui",
      notions: ["margin_rates", "markup_coefficient"],
      question: () =>
        "Commencez par aujourd'hui : le coût d'une unité, la marge qu'elle laisse, puis le taux de marque, en pourcentage, au dixième.",
      champs: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          { libelle: "Coût d'une unité", attendu: r.cout, calcul: `${eur(r.matiere)} + ${eur(r.autres)} = ${eur(r.cout)}` },
          { libelle: "Marge d'une unité", attendu: r.marge, calcul: `${eur(r.prix)} − ${eur(r.cout)} = ${eur(r.marge)}` },
          { libelle: "Taux de marque (%)", attendu: r.tauxDeMarque, tolerance: 0.1, calcul: `${eur(r.marge)} ÷ ${eur(r.prix)} × 100 = ${pct(r.tauxDeMarque)}` },
        ];
      },
      explication: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          `Aujourd'hui, ${pct(r.tauxDeMarque)} du prix de vente restent à ${c.entreprise} une fois payé ce que coûte l'unité. C'est ce taux que le gérant veut garder.`,
        ];
      },
    },
    {
      id: "sans-toucher-au-prix",
      type: "montants",
      titre: "Si le prix ne bouge pas",
      notions: ["margin_rates"],
      question: () =>
        `Seuls les achats augmentent de ${pct(HAUSSE_DES_ACHATS * 100)}. Si le prix de vente ne bouge pas, que deviennent les achats par unité, le coût d'une unité, sa marge, et le taux de marque (au dixième) ?`,
      champs: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          { libelle: "Achats par unité après la hausse", attendu: r.nouveauxAchats, calcul: `${eur(r.matiere)} × (1 + ${pct(HAUSSE_DES_ACHATS * 100)}) = ${eur(r.nouveauxAchats)}` },
          { libelle: "Nouveau coût d'une unité", attendu: r.nouveauCout, calcul: `${eur(r.nouveauxAchats)} + ${eur(r.autres)} = ${eur(r.nouveauCout)}` },
          { libelle: "Marge d'une unité, au prix d'aujourd'hui", attendu: r.margeSansHausseDePrix, calcul: `${eur(r.prix)} − ${eur(r.nouveauCout)} = ${eur(r.margeSansHausseDePrix)}` },
          { libelle: "Taux de marque, au prix d'aujourd'hui (%)", attendu: r.tauxDeMarqueSansHausse, tolerance: 0.1, calcul: `${eur(r.margeSansHausseDePrix)} ÷ ${eur(r.prix)} × 100 = ${pct(r.tauxDeMarqueSansHausse)}` },
        ];
      },
      explication: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          `Sans toucher au prix, toute la hausse, ${eur(r.hausseParUnite)} par unité, se prend sur la marge : le taux de marque passe de ${pct(r.tauxDeMarque)} à ${pct(r.tauxDeMarqueSansHausse)}. Le coût d'une unité, lui, ne monte que de ${pct(r.hausseDuCout)} : les autres coûts ne bougent pas.`,
        ];
      },
    },
    {
      id: "le-nouveau-prix",
      type: "montants",
      titre: "Le prix qui garde le taux de marque",
      notions: ["margin_rates", "markup_coefficient"],
      question: () =>
        "Le taux de marque rapporte la marge au prix de vente : le coût est donc la part du prix qui ne reste pas. Quel prix hors taxes garde le taux de marque d'aujourd'hui avec le nouveau coût ? De combien monte-t-il, en pourcentage, au dixième ?",
      champs: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          {
            libelle: "Nouveau prix de vente, hors taxes",
            attendu: r.nouveauPrix,
            tolerance: r.tolerancePrix,
            calcul: `${eur(r.nouveauCout)} ÷ (1 − ${pct(r.tauxDeMarque)}) ≈ ${eur(r.prixParLeTaux)} ; sans arrondir le taux, ${eur(r.nouveauCout)} × ${eur(r.prix)} ÷ ${eur(r.cout)} = ${eur(r.nouveauPrix)}`,
          },
          {
            libelle: "Hausse du prix de vente (%)",
            attendu: r.hausseDuPrix,
            tolerance: r.toleranceHausse,
            calcul: `(${eur(r.nouveauPrix)} ÷ ${eur(r.prix)} − 1) × 100 = ${pct(r.hausseDuPrix)}`,
          },
        ];
      },
      explication: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          `À ${eur(r.nouveauPrix)}, chaque ${c.unite} laisse ${eur(r.nouvelleMarge)} de marge, et le taux de marque redevient ${pct(r.tauxDeMarque)}. Garder un taux, c'est faire monter le prix dans la même proportion que le coût, et non comme les seuls achats.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const r = fournisseurQuiAugmente(c);
        return [
          {
            texte: `Il faudra vendre ${eur(r.nouveauPrix)} hors taxes, soit ${pct(r.hausseDuPrix)} de plus`,
            juste: true,
            retour: `Oui : le coût passe de ${eur(r.cout)} à ${eur(r.nouveauCout)}, ${pct(r.hausseDuCout)} de plus, et le prix doit le suivre dans la même proportion : ${eur(r.nouveauCout)} × ${eur(r.prix)} ÷ ${eur(r.cout)} = ${eur(r.nouveauPrix)}. À ce prix, la marge est de ${eur(r.nouvelleMarge)}, toujours ${pct(r.tauxDeMarque)} du prix.`,
          },
          {
            texte: `Il suffira d'ajouter la hausse au prix : ${eur(r.prixPlusLaHausse)} hors taxes, pour la même marge`,
            juste: false,
            retour: `Non : la marge d'une unité resterait de ${eur(r.marge)}, mais rapportée à un prix plus élevé. Le taux de marque tomberait sous ${pct(r.tauxDeMarque)}, et le gérant veut garder le taux.`,
          },
          {
            texte: `Il faudra monter le prix de ${pct(HAUSSE_DES_ACHATS * 100)}, comme les achats : ${eur(r.prixHausseDuTaux)} hors taxes`,
            juste: false,
            retour: `Non : seuls les achats augmentent de ${pct(HAUSSE_DES_ACHATS * 100)}. Le coût d'une unité ne monte que de ${pct(r.hausseDuCout)}, et le prix n'a pas à monter plus que lui pour garder le taux.`,
          },
          {
            texte: `Il faudra vendre ${eur(r.coutPlusTauxDeMarque)} : le nouveau coût majoré de notre taux de marque`,
            juste: false,
            retour: `Non : c'est confondre le taux de marque et le taux de marge. Le taux de marque se calcule sur le prix, pas sur le coût : majorer le coût de ${pct(r.tauxDeMarque)} donne un prix bien trop bas.`,
          },
        ];
      },
    },
  ],
};
