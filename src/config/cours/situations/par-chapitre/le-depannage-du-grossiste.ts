import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { CelluleACompleter } from "../../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_COUT_COMPLET_PAS_A_PAS, coutCompletDeDecembre } from "../../chapitres/le-cout-complet-pas-a-pas";
import { ELECTRO_COMPOSANTS } from "../../monde/exercice-de-nova";
import { decembreDeGestion } from "../../monde/comptabilite-de-gestion";
import type { Situation } from "../types";
import { auCentime } from "../../monde/amortissement";

/**
 * CAS PRATIQUE DU CHAPITRE « LE COÛT COMPLET PAS À PAS » : LE DÉPANNAGE DU GROSSISTE (contrôle de
 * gestion, palier 4).
 *
 * En décembre, Électro-Composants fermait : NOVA a acheté 1 500 jeux à un grossiste, Composants
 * Express, un euro plus cher (monde/exercice-de-nova.ts). La gérante entend dire que ce dépannage a
 * coûté 1 500 € au résultat du mois. L'élève refait seul la fiche de stock de décembre comme si le
 * grossiste avait vendu au prix habituel (le centre approvisionnement, imputé en euros d'achats, change
 * aussi), puis compare les deux résultats : une part du surcoût est sortie avec les jeux consommés,
 * l'autre attend dans le stock du 31 décembre. La réponse demande de les distinguer.
 *
 * Comme son chapitre, le cas se joue dans le monde du cours : `decembreDeGestion` calcule décembre avec
 * le prix du grossiste en levier.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const qte = (n: number, d = 2) => (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

/** Les chiffres du cas : décembre tel qu'il a été, et décembre au prix habituel. */
export function depannageDuGrossiste(c: Pick<Cas, "code">) {
  const x = coutCompletDeDecembre(c);
  const prixHabituel = ELECTRO_COMPOSANTS.prixDuJeu;
  const sans = decembreDeGestion({ prixDuGrossiste: prixHabituel });
  const reel = x.d;
  const surcoutDesAchats = auCentime(x.lot18.quantite * (x.lot18.prix - prixHabituel));
  const surLeResultat = auCentime(sans.resultat - reel.resultat);
  const dansLeStock = auCentime(reel.stock!.final.valeur - sans.stock!.final.valeur);
  return { x, prixHabituel, sans, reel, surcoutDesAchats, surLeResultat, dansLeStock };
}

export const LE_DEPANNAGE_DU_GROSSISTE: Situation = {
  code: "le-depannage-du-grossiste",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["le-cout-complet-pas-a-pas"],
  commanditaire: "La gérante",
  titre: "Le dépannage du grossiste",
  accroche: "Le grossiste de décembre a vendu ses jeux un euro plus cher. Combien ce dépannage a-t-il vraiment coûté au résultat du mois ?",
  objectifs: [
    "Refaire le coût d'achat et la fiche de stock au coût moyen pondéré à un autre prix d'achat",
    "Distinguer ce qu'un surcoût d'achat retire au résultat du mois et ce qu'il laisse dans le stock",
    "Rendre à la gérante une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_COUT_COMPLET_PAS_A_PAS,
    pourquoi: "ce cas reprend le chapitre « Le coût complet pas à pas », qui se calcule sur le mois de décembre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la gérante",
      texte: (c) => {
        const n = depannageDuGrossiste(c);
        return [
          `« En décembre, ${n.x.lot18.libelle.replace(/^livraison de /, "")} nous a vendu ${qte(n.x.lot18.quantite)} jeux à ${eur(n.x.lot18.prix)}, quand ${ELECTRO_COMPOSANTS.nom} les vend ${eur(n.prixHabituel)}. On me dit que ce dépannage a coûté ${eur(n.surcoutDesAchats)} au résultat de décembre. Est-ce vrai ? »`,
          "Pas de cours cette fois : vous avez les chiffres de décembre et la méthode du chapitre. Refaites le mois comme si le grossiste avait vendu au prix habituel, et comparez.",
        ];
      },
      tableau: (c) => {
        const { x, reel } = depannageDuGrossiste(c);
        return {
          titre: `Décembre tel qu'il a été · ${x.f.entreprise}`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Livraison du 10 décembre", valeurs: [`${qte(x.lot10.quantite)} jeux à ${eur(x.lot10.prix)}`] },
            { libelle: "Livraison du 18 décembre", valeurs: [`${qte(x.lot18.quantite)} jeux à ${eur(x.lot18.prix)}`] },
            { libelle: `Centre approvisionnement (unité d'œuvre : ${x.f.centres.unitesDOeuvre.approvisionnement.libelle})`, valeurs: [eur(x.r.principaux.approvisionnement)] },
            { libelle: "Jeux sortis sur les bons", valeurs: [`${qte(x.s.quantiteSortie)} jeux`] },
            { libelle: "Coût moyen pondéré de la période, au centime", valeurs: [eur(x.s.cmup)] },
            { libelle: "Stock théorique au 31 décembre", valeurs: [`${qte(x.s.final.quantite)} jeux, ${eur(x.s.final.valeur)}`] },
            { libelle: "Résultat analytique de décembre", valeurs: [eur(reel.resultat)] },
          ],
        };
      },
      repere: () => "À rendre : la fiche de stock au prix habituel, le résultat de décembre à ce prix, ce que le dépannage a retiré au résultat et ce qu'il laisse dans le stock, et votre réponse.",
    },
    {
      id: "la-fiche-au-prix-habituel",
      type: "a-completer",
      titre: "Décembre au prix habituel",
      notions: ["weighted_average_cost", "full_unit_cost"],
      question: (c) => {
        const { prixHabituel } = depannageDuGrossiste(c);
        return `Supposez que le grossiste ait vendu ses jeux ${eur(prixHabituel)}. Le centre approvisionnement garde ses charges, mais ses unités d'œuvre changent avec les achats. Refaites le coût d'achat des deux livraisons, puis la fiche de stock au coût moyen pondéré.`;
      },
      grille: (c) => {
        const { sans, x } = depannageDuGrossiste(c);
        const s = sans.stock!;
        const lots = [sans.lots.find((l) => l.jour === 10)!, sans.lots.find((l) => l.jour === 18)!];
        return {
          titre: "La fiche de stock de décembre, au prix habituel",
          colonnes: ["Quantité", "Coût unitaire", "Montant"],
          lignes: [
            {
              libelle: "Unités d'œuvre de l'approvisionnement",
              cellules: [
                aSaisir(sans.nombre.approvisionnement, `${eur(sans.achats)} d'achats ÷ 100 = ${qte(sans.nombre.approvisionnement)} unités`, { unite: "UO", indice: "les achats du mois, en centaines d'euros" }),
                aSaisir(sans.cout.approvisionnement, `${eur(x.r.principaux.approvisionnement)} ÷ ${qte(sans.nombre.approvisionnement)} = ${qte(x.r.principaux.approvisionnement / sans.nombre.approvisionnement, 4)} €, au centime ${eur(sans.cout.approvisionnement)}`, { indice: "le total du centre divisé par ses unités d'œuvre, au centime" }),
                aSaisir(sans.imputees.approvisionnement, `${lots.map((l) => eur(l.approvisionnement)).join(" + ")} = ${eur(sans.imputees.approvisionnement)}`),
              ],
            },
            ...lots.map((l) => ({
              libelle: `Livraison du ${l.jour} décembre, au coût d'achat`,
              cellules: [
                donnee(l.quantite, "jeux"),
                aSaisir(l.coutUnitaire, `${eur(l.coutDAchat)} ÷ ${qte(l.quantite)} = ${qte(l.coutUnitaire, 4)} €`, { indice: "le coût d'achat de la livraison divisé par ses jeux" }),
                aSaisir(l.coutDAchat, `${eur(l.achats)} + ${qte(l.unites)} unités × ${eur(sans.cout.approvisionnement)} = ${eur(l.coutDAchat)}`, { indice: "le prix d'achat et sa part du centre approvisionnement" }),
              ],
            })),
            {
              libelle: "Total disponible",
              fort: true,
              totalDe: { plus: [1, 2] },
              cellules: [
                aSaisir(s.entrees.quantite, `${qte(lots[0]!.quantite)} + ${qte(lots[1]!.quantite)} = ${qte(s.entrees.quantite)} jeux`, { unite: "jeux" }),
                aSaisir(s.cmup, `${eur(s.disponible)} ÷ ${qte(s.entrees.quantite)}, au centime : ${eur(s.cmup)}`, { horsTotal: true, indice: "le disponible divisé par ses jeux, au centime" }),
                aSaisir(s.disponible, `${eur(lots[0]!.coutDAchat)} + ${eur(lots[1]!.coutDAchat)} = ${eur(s.disponible)}`),
              ],
            },
            { libelle: "Sorties de décembre", cellules: [donnee(s.quantiteSortie, "jeux"), VIDE, aSaisir(s.sorties, `${s.lignesDeSortie.map((l) => `${qte(l.quantite)} × ${eur(s.cmup)}`).join(" + ")} = ${eur(s.sorties)}`, { indice: "chaque bon de sortie au coût moyen" })] },
            { libelle: "Stock théorique au 31 décembre", cellules: [aSaisir(s.final.quantite, `${qte(s.entrees.quantite)} − ${qte(s.quantiteSortie)} = ${qte(s.final.quantite)} jeux`, { unite: "jeux" }), VIDE, aSaisir(s.final.valeur, `${qte(s.final.quantite)} × ${eur(s.cmup)} = ${eur(s.final.valeur)}`)] },
          ],
        };
      },
      explication: (c) => {
        const { sans, x } = depannageDuGrossiste(c);
        return [`Au prix habituel, un jeu sortirait à ${eur(sans.stock!.cmup)} au lieu de ${eur(x.s.cmup)} : le dépannage a renchéri tous les jeux du mois, les anciens comme les nouveaux, puisqu'ils sortent au même coût moyen.`];
      },
    },
    {
      id: "ce-que-coute-le-depannage",
      type: "montants",
      titre: "Ce que le dépannage a coûté",
      notions: ["weighted_average_cost", "full_unit_cost"],
      question: () =>
        "Les autres charges du mois ne bougent pas. Calculez le résultat de décembre au prix habituel, ce que le dépannage a retiré au résultat de décembre, puis ce qu'il laisse dans le stock du 31 décembre.",
      champs: (c) => {
        const n = depannageDuGrossiste(c);
        return [
          { libelle: "Résultat de décembre au prix habituel", attendu: n.sans.resultat, calcul: `${eur(n.reel.resultat)} + (${eur(n.reel.matieres)} − ${eur(n.sans.matieres)}) de jeux consommés en moins = ${eur(n.sans.resultat)}` },
          { libelle: "Ce que le dépannage a retiré au résultat", attendu: n.surLeResultat, calcul: `${eur(n.sans.resultat)} − ${eur(n.reel.resultat)} = ${eur(n.surLeResultat)}` },
          { libelle: "Ce que le dépannage laisse dans le stock", attendu: n.dansLeStock, calcul: `${eur(n.reel.stock!.final.valeur)} − ${eur(n.sans.stock!.final.valeur)} = ${eur(n.dansLeStock)}` },
        ];
      },
      explication: (c) => {
        const n = depannageDuGrossiste(c);
        return [
          `${eur(n.surLeResultat)} pèsent sur décembre, ${eur(n.dansLeStock)} attendent dans le stock : ensemble, les ${eur(n.surcoutDesAchats)} du surcoût, que le coût moyen a répartis entre les jeux sortis et les jeux restés.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la gérante",
      notions: ["weighted_average_cost"],
      question: (c) => `Le dépannage a-t-il coûté ${eur(depannageDuGrossiste(c).surcoutDesAchats)} au résultat de décembre ? Quelle réponse lui rendez-vous ?`,
      options: (c) => {
        const n = depannageDuGrossiste(c);
        return [
          {
            texte: `Non : ${eur(n.surLeResultat)} sur décembre, le reste est en stock`,
            juste: true,
            retour: `Oui. Le coût moyen a fait sortir avec les ${qte(n.x.s.quantiteSortie)} jeux consommés une part du surcoût, ${eur(n.surLeResultat)} ; les ${qte(n.x.s.final.quantite)} jeux restés en portent ${eur(n.dansLeStock)}, que janvier consommera.`,
          },
          {
            texte: `Oui : un euro de plus sur chacun des ${qte(n.x.lot18.quantite)} jeux du grossiste`,
            juste: false,
            retour: `Non : c'est le surcoût des achats, pas celui du mois. Tous les jeux achetés ne sont pas sortis : ${eur(n.dansLeStock)} restent dans le stock du 31 décembre.`,
          },
          {
            texte: "Rien sur le résultat : le coût moyen efface le prix du grossiste",
            juste: false,
            retour: `Non : le coût moyen lisse le prix, il ne l'efface pas. Chaque jeu sorti coûte ${eur(auCentime(n.x.s.cmup - n.sans.stock!.cmup))} de plus.`,
          },
          {
            texte: `${eur(n.surLeResultat)}, et autant de plus en janvier quand le stock sortira`,
            juste: false,
            retour: `Non : le stock ne garde que ${eur(n.dansLeStock)} du surcoût, pas ${eur(n.surLeResultat)}. Ce qui reste à janvier est ce que décembre n'a pas consommé.`,
          },
        ];
      },
    },
  ],
};
