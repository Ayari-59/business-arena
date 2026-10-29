import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { RECEVOIR_UNE_LIVRAISON, accordeA, de, ficheDe, motsDe, qte } from "../../chapitres/recevoir-une-livraison";
import { ARTICLES_PAR_CARTON, livraisonAvecDeuxEcarts } from "../../monde/vente-et-caisse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECEVOIR UNE LIVRAISON » : LES DEUX ÉCARTS (CAP Équipier polyvalent
 * du commerce, palier 1).
 *
 * Le chapitre a trouvé un carton manquant sur une ligne. Ici, la livraison de février a deux
 * écarts qui s'annulent : un carton manque sur une ligne, un carton est en trop sur une autre.
 * Le total du bon tombe juste, et la responsable du magasin voudrait signer sur ce seul total.
 * L'élève refait les deux totaux, contrôle ligne par ligne, chiffre ce que le magasin paierait
 * pour des articles jamais reçus, et répond.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le bon du façonnier de MAILLE & CO et ses prix d'achat
 * (monde/vente-et-caisse.ts). HYPOTHÈSES DU CAS : en février, le façonnier livre les mêmes
 * quantités qu'en janvier ; un carton manque sur la ligne la plus grosse, un carton est en trop sur
 * la plus petite.
 *
 * LA BONNE RÉPONSE EST LA MÊME PARTOUT : écrire les deux écarts sur le bon.
 *
 * CE QUI A CHANGÉ. Le cas lisait la commande du trimestre 2 de l'arène. Il lit maintenant le bon de
 * février : 1 000 articles, 10 pulls col rond manquants, 10 pulls mérinos en trop, 250 € payés pour
 * rien sans réserve.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/** Les deux écarts, avec les mots de chaque ligne. */
export function deuxEcarts(c: Pick<Cas, "code">) {
  const s = livraisonAvecDeuxEcarts(ficheDe(c));
  const mots = <T extends { code: Parameters<typeof motsDe>[0] }>(l: T) => ({ ...l, ...motsDe(l.code) });
  return { ...s, comptes: s.comptes.map(mots), manque: mots(s.manque), enTrop: mots(s.enTrop) };
}

export const LES_DEUX_ECARTS: Situation = {
  code: "les-deux-ecarts",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [RECEVOIR_UNE_LIVRAISON.code],
  commanditaire: "La responsable du magasin",
  titre: "Les deux écarts",
  accroche: "Le total du bon de livraison tombe juste, et la responsable veut signer. Mais deux lignes ne tombent pas juste. Compter, chiffrer, et lui répondre.",
  objectifs: ["Comparer le total du bon et le total compté", "Contrôler une livraison ligne par ligne", "Chiffrer ce que coûte un bon signé sans réserve", "Répondre à sa responsable avant de signer"],
  libre: false,
  entreprises: RECEVOIR_UNE_LIVRAISON.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      texte: (c) => {
        const s = deuxEcarts(c);
        return [
          `« La livraison de février du façonnier est arrivée. Le bon annonce ${qte(s.totalSurLeBon)} articles, et vous en avez compté ${qte(s.totalCompte)}. Le total tombe juste : je peux signer sans rien écrire ? »`,
          `Pas de cours cette fois. Vous avez le bon de livraison et votre compte, carton par carton. Le cours imagine que le façonnier livre en février ce qu'il a livré en janvier, en cartons de ${qte(ARTICLES_PAR_CARTON)} articles, avec deux écarts.`,
        ];
      },
      tableau: (c) => {
        const s = deuxEcarts(c);
        return {
          titre: "Le bon de livraison et votre compte",
          colonnes: ["Sur le bon de livraison", "Compté dans les cartons"],
          lignes: s.comptes.map((x) => ({ libelle: x.nom, valeurs: [qte(x.surLeBon), qte(x.comptee)] })),
        };
      },
      repere: () => "À rendre : les deux totaux, les écarts ligne par ligne, ce que coûterait un bon signé sans réserve, et votre réponse.",
    },
    {
      id: "totaux",
      type: "montants",
      titre: "Les deux totaux",
      notions: ["stock"],
      question: () => "Additionnez la colonne du bon de livraison, puis celle de votre compte.",
      champs: (c) => {
        const s = deuxEcarts(c);
        return [
          { libelle: "Total sur le bon de livraison", attendu: s.totalSurLeBon, calcul: `${s.comptes.map((x) => qte(x.surLeBon)).join(" + ")} = ${qte(s.totalSurLeBon)}` },
          { libelle: "Total compté dans les cartons", attendu: s.totalCompte, calcul: `${s.comptes.map((x) => qte(x.comptee)).join(" + ")} = ${qte(s.totalCompte)}` },
        ];
      },
      explication: (c) => [`Les deux totaux font ${qte(deuxEcarts(c).totalCompte)}. Un total juste ne prouve pas que chaque ligne est juste.`],
    },
    {
      id: "lignes",
      type: "montants",
      titre: "Ligne par ligne",
      notions: ["stock"],
      question: (c) => {
        const s = deuxEcarts(c);
        return `Comparez chaque ligne. Combien ${de(s.manque.pluriel)} manquent ? Combien ${de(s.enTrop.pluriel)} sont en trop ?`;
      },
      champs: (c) => {
        const s = deuxEcarts(c);
        return [
          { libelle: `${s.manque.nom} : articles manquants`, attendu: s.manque.surLeBon - s.manque.comptee, calcul: `${qte(s.manque.surLeBon)} − ${qte(s.manque.comptee)} = ${qte(s.manque.surLeBon - s.manque.comptee)}` },
          { libelle: `${s.enTrop.nom} : articles en trop`, attendu: s.enTrop.comptee - s.enTrop.surLeBon, calcul: `${qte(s.enTrop.comptee)} − ${qte(s.enTrop.surLeBon)} = ${qte(s.enTrop.comptee - s.enTrop.surLeBon)}` },
        ];
      },
      explication: (c) => {
        const s = deuxEcarts(c);
        return [`${qte(s.ecart)} ${s.manque.pluriel} manquent, ${qte(s.ecart)} ${s.enTrop.pluriel} sont en trop : les deux écarts s'annulent dans le total, et c'est pour cela qu'il ne les montre pas.`];
      },
    },
    {
      id: "sans-reserve",
      type: "montants",
      titre: "Un bon signé sans réserve",
      notions: ["stock"],
      question: (c) => {
        const s = deuxEcarts(c);
        return `Signé sans rien écrire, le bon dit que les ${qte(s.manque.surLeBon)} ${s.manque.pluriel} sont ${accordeA(s.manque.feminin, "arrivé")} : le façonnier les facturera tous. Les ${s.manque.pluriel} s'achètent ${eur(s.manque.prixDAchat)} pièce. Combien le magasin paierait-il pour des articles qu'il n'a pas reçus ?`;
      },
      champs: (c) => {
        const s = deuxEcarts(c);
        return [{ libelle: "Payé sans être reçu", attendu: s.payesSansEtreRecus, calcul: `${qte(s.ecart)} × ${eur(s.manque.prixDAchat)} = ${eur(s.payesSansEtreRecus)}` }];
      },
      explication: (c) => {
        const s = deuxEcarts(c);
        return [`${eur(s.payesSansEtreRecus)} payés pour rien. Et les ${qte(s.ecart)} ${s.enTrop.pluriel} en trop ne sont pas un cadeau : le façonnier peut les facturer ou venir les reprendre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Que répondez-vous à la responsable du magasin ?",
      options: (c) => {
        const s = deuxEcarts(c);
        const manquants = `${qte(s.ecart)} ${s.manque.pluriel} ${accordeA(s.manque.feminin, "manquant")}`;
        const enTrop = `${qte(s.ecart)} ${s.enTrop.pluriel} en trop`;
        return [
          { texte: "Écrire les deux écarts sur le bon, puis signer", juste: true, retour: `Oui : « ${manquants}, ${enTrop} », écrit sur le bon avant de signer. Sans cette réserve, le magasin paierait ${eur(s.payesSansEtreRecus)} pour des articles jamais reçus.` },
          {
            texte: "Signer sans rien écrire : le total tombe juste",
            juste: false,
            retour: `Non : le total tombe juste parce que deux écarts s'annulent. ${manquants.charAt(0).toUpperCase()}${manquants.slice(1)} seraient ${accordeA(s.manque.feminin, "payé")} ${eur(s.payesSansEtreRecus)} sans être ${accordeA(s.manque.feminin, "arrivé")}.`,
          },
          { texte: "Écrire seulement le manquant, et garder les articles en plus", juste: false, retour: `Non : les ${enTrop} se signalent aussi. Gardés sans rien écrire, le stock ne correspond plus aux papiers, et le façonnier peut les facturer plus tard.` },
        ];
      },
    },
  ],
};
