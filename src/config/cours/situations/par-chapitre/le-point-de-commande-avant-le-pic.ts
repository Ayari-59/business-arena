import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { accord } from "../../accords";
import type { Cas } from "../../cas";
import { JOURS_DE_SECURITE, LE_STOCK_DE_SECURITE, stockEtPointDeCommande } from "../../chapitres/le-stock-de-securite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE STOCK DE SÉCURITÉ ET LE POINT DE COMMANDE » : LE POINT DE COMMANDE
 * AVANT LE PIC (2de pro GATL, palier 1).
 *
 * Le chapitre a calculé le point de commande sur la demande du trimestre de base, puis montré le
 * trimestre suivant, où la demande a dépassé ce que le stock pouvait servir. Ici, le responsable
 * de l'entrepôt connaît la demande du pic avant qu'il commence (celle que l'arène a ensuite
 * adressée à l'entreprise) et demande s'il peut garder son point de commande. L'élève recalcule le
 * point de commande sur la demande du pic, chiffre ce que l'ancien laisserait sans réponse à chaque
 * réassort, et répond.
 *
 * Les chiffres sont ceux du chapitre (`stockEtPointDeCommande` : la base, le pic, le délai et la
 * sécurité du cours) ; le pic et ses ventes perdues sont ceux du moteur.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** L'ancien point de commande, le nouveau, et ce que l'ancien laisse sans réponse au pic. */
export function pointDeCommandeDuPic(c: Cas) {
  const k = stockEtPointDeCommande(c);
  const parJour = Math.ceil(k.pic.demande / k.jours);
  const pendantLeDelai = parJour * k.delai;
  const securite = parJour * JOURS_DE_SECURITE;
  const nouveauPoint = pendantLeDelai + securite;
  const perdues = Math.max(0, pendantLeDelai - k.pointDeCommande);
  return {
    k,
    parJour,
    pendantLeDelai,
    securite,
    nouveauPoint,
    /** Ce que l'ancien point laisse sans réponse à chaque réassort, et ce que cela coûte. */
    perdues,
    chiffreDAffairesPerdu: auCentime(perdues * k.pic.prix),
    /** Sans stock de sécurité, au pic : le point de commande ne garde que le délai. */
    sansSecurite: pendantLeDelai,
  };
}

export const LE_POINT_DE_COMMANDE_AVANT_LE_PIC: Situation = {
  code: "le-point-de-commande-avant-le-pic",
  parcours: "logistique",
  palier: 1,
  blocs: [],
  reprend: [LE_STOCK_DE_SECURITE.code],
  commanditaire: "Le responsable de l'entrepôt",
  titre: "Le point de commande avant le pic",
  accroche:
    "La demande va monter au trimestre suivant. Le responsable de l'entrepôt veut garder son point de commande : recalculer celui du pic, chiffrer ce que l'ancien laisserait sans réponse, et lui répondre.",
  objectifs: [
    "Recalculer une demande par jour et un point de commande",
    "Calculer ce qui manque quand le point de commande est trop bas",
    "Répondre au responsable de l'entrepôt, chiffres à l'appui",
  ],
  libre: false,
  entreprises: LE_STOCK_DE_SECURITE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable de l'entrepôt",
      texte: (c) => {
        const p = pointDeCommandeDuPic(c);
        return [
          `« Au trimestre ${p.k.pic.trimestre}, le service commercial attend ${qte(p.k.pic.demande)} ${c.unites}, contre ${qte(p.k.base.demande)} au trimestre ${p.k.base.trimestre}. Notre point de commande est de ${qte(p.k.pointDeCommande)} : je voudrais le garder. Dites-moi ce qu'il devrait être, et ce que l'ancien nous ferait perdre. »`,
          `Pas de cours cette fois : vous avez la demande des trimestres ${p.k.base.trimestre} et ${p.k.pic.trimestre}, le délai du fournisseur et le stock de sécurité que garde ${c.entreprise}. La demande attendue est celle que l'arène a ensuite vraiment adressée à l'entreprise.`,
        ];
      },
      tableau: (c) => {
        const p = pointDeCommandeDuPic(c);
        return {
          titre: `${c.entreprise} · avant le trimestre ${p.k.pic.trimestre}`,
          colonnes: [`Trimestre ${p.k.base.trimestre}`, `Trimestre ${p.k.pic.trimestre}`],
          lignes: [
            { libelle: `Demande des clients (${c.unites})`, valeurs: [qte(p.k.base.demande), qte(p.k.pic.demande)] },
            { libelle: "Jours du trimestre", valeurs: [qte(p.k.jours), qte(p.k.jours)] },
            { libelle: "Délai du fournisseur (jours)", valeurs: [qte(p.k.delai), qte(p.k.delai)] },
            { libelle: "Stock de sécurité (jours de demande)", valeurs: [qte(JOURS_DE_SECURITE), qte(JOURS_DE_SECURITE)] },
            { libelle: "Point de commande", valeurs: [qte(p.k.pointDeCommande), "?"] },
          ],
        };
      },
      repere: () => "À rendre : le point de commande du pic, ce que l'ancien laisserait sans réponse, et votre réponse.",
    },
    {
      id: "nouveau-point",
      type: "montants",
      titre: "Le point de commande du pic",
      notions: ["stock"],
      question: (c) => {
        const p = pointDeCommandeDuPic(c);
        return `Calculez la demande par jour du trimestre ${p.k.pic.trimestre}, arrondie à l'unité supérieure, puis le point de commande qui va avec : la consommation pendant les ${qte(p.k.delai)} jours du délai, plus ${qte(JOURS_DE_SECURITE)} jours de sécurité.`;
      },
      champs: (c) => {
        const p = pointDeCommandeDuPic(c);
        return [
          {
            libelle: `Demande par jour au trimestre ${p.k.pic.trimestre}`,
            attendu: p.parJour,
            calcul: `${qte(p.k.pic.demande)} ÷ ${qte(p.k.jours)} = ${deux(p.k.pic.demande / p.k.jours)}, soit ${qte(p.parJour)} en arrondissant au-dessus`,
          },
          {
            libelle: "Nouveau point de commande",
            attendu: p.nouveauPoint,
            calcul: `${qte(p.parJour)} × ${qte(p.k.delai)} + ${qte(p.parJour)} × ${qte(JOURS_DE_SECURITE)} = ${qte(p.pendantLeDelai)} + ${qte(p.securite)} = ${qte(p.nouveauPoint)}`,
          },
        ];
      },
      explication: (c) => {
        const p = pointDeCommandeDuPic(c);
        return [`À ${qte(p.parJour)} ${c.unites} par jour, il faut recommander quand le stock descend à ${qte(p.nouveauPoint)}, et non plus à ${qte(p.k.pointDeCommande)}.`];
      },
    },
    {
      id: "ancien-point",
      type: "montants",
      titre: "Avec l'ancien point de commande",
      notions: ["stock", "revenue"],
      question: (c) => {
        const p = pointDeCommandeDuPic(c);
        return `Le responsable garde ${qte(p.k.pointDeCommande)}. Il recommande donc quand il reste ${qte(p.k.pointDeCommande)} ${c.unites}. Calculez ce que les clients demandent pendant les ${qte(p.k.delai)} jours du délai, au rythme du pic, puis ce qui manquerait à chaque réassort.`;
      },
      champs: (c) => {
        const p = pointDeCommandeDuPic(c);
        return [
          { libelle: "Demande pendant le délai", attendu: p.pendantLeDelai, calcul: `${qte(p.parJour)} × ${qte(p.k.delai)} = ${qte(p.pendantLeDelai)}` },
          {
            libelle: `${majuscule(c.unites)} sans réponse à chaque réassort`,
            attendu: p.perdues,
            calcul:
              p.perdues > 0
                ? `${qte(p.pendantLeDelai)} − ${qte(p.k.pointDeCommande)} = ${qte(p.perdues)}`
                : `${qte(p.pendantLeDelai)} ≤ ${qte(p.k.pointDeCommande)} : ${accord(c, "aucun")}`,
          },
        ];
      },
      explication: (c) => {
        const p = pointDeCommandeDuPic(c);
        return [
          p.perdues > 0
            ? `Le stock serait vide avant la livraison : ${qte(p.perdues)} ${c.unites} sans réponse à chaque réassort, soit ${eur(p.chiffreDAffairesPerdu)} de chiffre d'affaires à ${eur(p.k.pic.prix)} par ${c.unite}. Et le stock de sécurité aurait déjà servi : il ne resterait rien pour un retard.`
            : `Le stock tiendrait jusqu'à la livraison : l'ancien point de commande couvre encore le délai, mais il n'y aurait presque plus de sécurité.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: () => "Quelle réponse envoyez-vous au responsable de l'entrepôt ?",
      options: (c) => {
        const p = pointDeCommandeDuPic(c);
        const arene = `Dans l'arène, faute de stock, le trimestre ${p.k.pic.trimestre} a perdu ${qte(p.k.perdues)} ${c.unites}.`;
        return [
          {
            texte: `Passer à ${qte(p.nouveauPoint)}, calculé sur la demande du pic`,
            juste: p.perdues > 0,
            retour:
              p.perdues > 0
                ? `Oui : à ${qte(p.parJour)} par jour, le point de commande passe à ${qte(p.nouveauPoint)}. Avec l'ancien, chaque réassort laisserait ${qte(p.perdues)} ${c.unites} sans réponse. ${arene}`
                : `Non : l'ancien point couvre encore le délai au rythme du pic. Le recalculer reste prudent, mais il ne fait pas perdre de ventes.`,
          },
          {
            texte: `Garder ${qte(p.k.pointDeCommande)} : le stock de sécurité suffira`,
            juste: p.perdues === 0,
            retour:
              p.perdues === 0
                ? `Oui : au rythme du pic, ${qte(p.pendantLeDelai)} ${c.unites} partent pendant le délai, pas plus que les ${qte(p.k.pointDeCommande)} du point de commande.`
                : `Non : pendant le délai, les clients demandent ${qte(p.pendantLeDelai)} ${c.unites}, plus que les ${qte(p.k.pointDeCommande)} du point de commande. Il en manquerait ${qte(p.perdues)} à chaque réassort. ${arene}`,
          },
          {
            texte: "Supprimer le stock de sécurité pour moins stocker",
            juste: false,
            retour: `Non : sans sécurité, le point de commande du pic tombe à ${qte(p.sansSecurite)}, juste ce que les clients prennent pendant le délai. Au moindre retard du fournisseur, le client repart sans rien.`,
          },
        ];
      },
    },
  ],
};
