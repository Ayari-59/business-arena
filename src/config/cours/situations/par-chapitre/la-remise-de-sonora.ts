import { arrondi2, eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter } from "../../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_METHODE_ABC } from "../../chapitres/les-couts-a-base-d-activites";
import { methodeABC, venteAuxCoutsDeJanvier } from "../../monde/couts-par-activites";
import { FACTURE_SONORA_DE_SEPTEMBRE, MONTANTS_DES_FACTURES_SONORA, SONORA } from "../../monde/exercice-de-nova";
import { OPERATEURS } from "../../monde/nova-capacite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LES COÛTS À BASE D'ACTIVITÉS : LA MÉTHODE ABC » : LA REMISE DE SONORA
 * (contrôle de gestion, palier 4).
 *
 * En septembre N, Sonora a commandé 400 enceintes avec 5 % de remise (exercice-de-nova.ts) : 56,05 €
 * hors taxes l'enceinte. L'expert-comptable fait remarquer que c'est sous le coût de revient des
 * centres d'analyse. L'élève chiffre la commande par la méthode ABC, aux coûts d'inducteurs de janvier
 * (le dernier calcul de NOVA, fait sur un mois sans stock) : 1 commande, 1 envoi, 400 enceintes.
 * La commande couvre son coût complet ; par les centres, elle paraissait vendue à perte.
 *
 * HYPOTHÈSES DU CAS : la commande est livrée en un seul envoi ; les coûts des inducteurs et des unités
 * d'œuvre sont ceux de janvier ; l'escompte que Sonora a pris est un produit financier cédé, que le
 * coût de revient n'incorpore pas.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les volumes consommés sont des grandeurs au centième ; le
 * résultat par les centres d'analyse attend le centime (à 1 € près, avant), et la demande donne le
 * coût de revient de la commande par les centres.
 */

const qte = nombreAuCentieme;

/** La commande de Sonora : 1 commande, 1 envoi (hypothèse du cas). */
export const ENVOIS_DE_SONORA = 1;

const donnee = (valeur: number): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Les chiffres du cas. */
export function remiseDeSonora(_c?: Pick<Cas, "code">) {
  const enceintes = SONORA.premiereCommande.enceintes;
  const prix = arrondi2(MONTANTS_DES_FACTURES_SONORA.septembre.netCommercial / enceintes);
  const v = venteAuxCoutsDeJanvier({ enceintes, prix, commandes: 1, envois: ENVOIS_DE_SONORA });
  return { enceintes, prix, v, abc: methodeABC(), remise: FACTURE_SONORA_DE_SEPTEMBRE.reductions[0]!.taux };
}

export const LA_REMISE_DE_SONORA: Situation = {
  code: "la-remise-de-sonora",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["les-couts-a-base-d-activites"],
  commanditaire: "L'expert-comptable",
  titre: "La remise de Sonora",
  accroche: `Sonora a eu ${qte(SONORA.remise * 100)} % de remise sur ${qte(SONORA.premiereCommande.enceintes)} enceintes. L'expert-comptable y voit une vente à perte : la méthode ABC lui donne-t-elle raison ?`,
  objectifs: [
    "Chiffrer une commande par la méthode ABC, à des coûts d'inducteurs donnés",
    "Comparer son coût à celui des centres d'analyse",
    "Rendre à l'expert-comptable une réponse chiffrée sur le prix accordé",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_METHODE_ABC,
    pourquoi: "ce cas reprend le chapitre « Les coûts à base d'activités : la méthode ABC », qui se calcule sur le mois de janvier de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La remarque de l'expert-comptable",
      texte: () => {
        const { enceintes, prix, v, remise } = remiseDeSonora();
        return [
          `« En septembre, vous avez vendu ${qte(enceintes)} enceintes à Sonora avec ${qte(remise * 100)} % de remise, ${eur(prix)} l'enceinte. Vos centres d'analyse disent ${eur(arrondi2(v.centres.unitaire))} de coût de revient à ce prix, ${eur(v.centres.coutDeRevient)} pour la commande : vous avez vendu à perte. »`,
          `Pas de cours cette fois : vous avez les coûts d'inducteurs de janvier, le dernier calcul fait par la méthode ABC. La commande de Sonora a été ${qte(1)} commande et ${qte(ENVOIS_DE_SONORA)} envoi. L'escompte que Sonora a pris est financier : le coût de revient ne le compte pas.`,
        ];
      },
      tableau: () => {
        const { abc, enceintes, prix } = remiseDeSonora();
        return {
          titre: "Les coûts d'inducteurs de janvier, et la commande de Sonora",
          colonnes: ["Donnée"],
          lignes: [
            ...abc.activites.map((a) => ({ libelle: `${a.libelle}, par ${a.inducteur.libelle}`, valeurs: [eur(a.coutDeLInducteur)] })),
            { libelle: "Enceintes de la commande", valeurs: [qte(enceintes)] },
            { libelle: "Prix d'une enceinte après la remise, hors taxes", valeurs: [eur(prix)] },
            { libelle: "Heures de montage d'une enceinte", valeurs: [qte(OPERATEURS.heuresParEnceinte)] },
            { libelle: "Charges directes d'une enceinte (composants et autres coûts)", valeurs: [eur(arrondi2(remiseDeSonora().v.directes / enceintes))] },
          ],
        };
      },
      repere: () => "À rendre : les charges indirectes de la commande par activité, son coût de revient, son résultat par la méthode ABC et par les centres, et votre réponse.",
    },
    {
      id: "les-activites-de-la-commande",
      type: "a-completer",
      titre: "Ce que la commande consomme",
      notions: ["full_unit_cost"],
      question: () => "Pour chaque activité, le volume d'inducteur que la commande consomme × le coût de l'inducteur de janvier. Puis le total des charges indirectes de la commande.",
      grille: () => {
        const { v, enceintes } = remiseDeSonora();
        const volume: Readonly<Record<string, string>> = {
          approvisionner: `${qte(enceintes)} jeux, un par enceinte`,
          monter: `${qte(enceintes)} × ${qte(OPERATEURS.heuresParEnceinte)} heure = ${qte(enceintes * OPERATEURS.heuresParEnceinte)} heures`,
          expedier: `${qte(ENVOIS_DE_SONORA)} envoi`,
          commandes: `${qte(1)} commande`,
          administrer: `${eur(v.chiffreDAffaires)} ÷ 100 = ${qte(v.chiffreDAffaires / 100)}`,
        };
        return {
          titre: "Les charges indirectes de la commande de Sonora",
          colonnes: ["Volume consommé", "Coût d'un inducteur", "Montant"],
          lignes: [
            ...v.imputations.map((x) => ({
              libelle: x.libelle,
              cellules: [
                aSaisir(x.volume, volume[x.code]!, { nature: "grandeur", horsTotal: true, indice: "ce que la commande demande de l'inducteur : ses enceintes, ses heures, son envoi, sa commande, son chiffre d'affaires" }),
                { ...donnee(x.coutDeLInducteur), horsTotal: true },
                aSaisir(x.montant, `${qte(x.volume)} × ${eur(x.coutDeLInducteur)} = ${eur(x.montant)}`),
              ],
            })),
            { libelle: "Charges indirectes de la commande", fort: true, totalDe: { plus: v.imputations.map((_, i) => i) }, cellules: [{ valeur: null }, { valeur: null }, aSaisir(v.indirectes, `${v.imputations.map((x) => eur(x.montant)).join(" + ")} = ${eur(v.indirectes)}`)] },
          ],
        };
      },
      explication: () => {
        const { v } = remiseDeSonora();
        const e = v.imputations.filter((x) => x.code === "expedier" || x.code === "commandes");
        return [`La commande et son envoi ne coûtent que ${eur(arrondi2(e.reduce((t, x) => t + x.montant, 0)))} : c'est le montage et l'approvisionnement qui pèsent, comme pour toute enceinte.`];
      },
    },
    {
      id: "le-resultat-de-la-commande",
      type: "montants",
      titre: "Le résultat de la commande",
      notions: ["full_unit_cost"],
      question: () => "Calculez le coût de revient de la commande par la méthode ABC, son résultat, puis son résultat par les centres d'analyse.",
      champs: () => {
        const { v } = remiseDeSonora();
        return [
          { libelle: "Coût de revient de la commande, méthode ABC", attendu: v.coutDeRevient, calcul: `${eur(v.indirectes)} + ${eur(v.directes)} = ${eur(v.coutDeRevient)}` },
          { libelle: "Résultat de la commande, méthode ABC", attendu: v.resultat, calcul: `${eur(v.chiffreDAffaires)} − ${eur(v.coutDeRevient)} = ${eur(v.resultat)}` },
          { libelle: "Résultat de la commande, centres d'analyse", attendu: v.centres.resultat, calcul: `${eur(v.chiffreDAffaires)} − ${eur(v.centres.coutDeRevient)} = ${eur(v.centres.resultat)}` },
        ];
      },
      explication: () => {
        const { v } = remiseDeSonora();
        return [`Par la méthode ABC, une enceinte de Sonora revient à ${eur(arrondi2(v.unitaire))} ; par les centres, à ${eur(arrondi2(v.centres.unitaire))}. L'écart vient des commandes et des colis : les centres font payer à Sonora sa part de ceux de la vente en ligne.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'expert-comptable",
      notions: ["full_unit_cost"],
      question: () => "Que répondez-vous à l'expert-comptable ?",
      options: () => {
        const { v } = remiseDeSonora();
        return [
          { texte: `Non : la commande laisse ${eur(v.resultat)}`, juste: true, retour: `Oui. Par la méthode ABC, la commande consomme peu des activités qui coûtent cher en ligne : ${eur(arrondi2(v.unitaire))} par enceinte, sous le prix accordé. Le coût des centres, ${eur(arrondi2(v.centres.unitaire))}, lui faisait porter une part des colis des particuliers.` },
          { texte: `Oui : elle perd ${eur(-v.centres.resultat)}, le coût de revient le dit`, juste: false, retour: `Non : ce coût de revient est celui des centres d'analyse, qui répartissent les commandes et les colis selon le chiffre d'affaires. Une commande de ${qte(v.vente.enceintes)} enceintes en ${qte(ENVOIS_DE_SONORA)} envoi ne les consomme presque pas.` },
          { texte: "Oui : toute remise sous le coût moyen d'une enceinte est une perte", juste: false, retour: "Non : le coût moyen mêle des ventes qui ne coûtent pas la même chose. Celui que la commande consomme vraiment est plus bas que le prix accordé." },
          { texte: "On ne peut pas savoir sans le coût variable de la commande", juste: false, retour: "Non : la question porte sur le coût complet, et la méthode ABC le donne, aux coûts d'inducteurs de janvier. Le coût variable dirait autre chose : si la commande valait mieux que rien." },
        ];
      },
    },
  ],
};
