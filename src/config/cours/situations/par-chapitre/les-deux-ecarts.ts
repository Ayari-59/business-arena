import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../../scenarios/registry";
import type { Cas } from "../../cas";
import {
  ARTICLES_PAR_CARTON,
  RECEVOIR_UNE_LIVRAISON,
  accordeA,
  commandeDuTrimestre,
  de,
  qte,
  trimestreDuCours,
} from "../../chapitres/recevoir-une-livraison";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RECEVOIR UNE LIVRAISON » : LES DEUX ÉCARTS (CAP Équipier polyvalent
 * du commerce, palier 1).
 *
 * Le chapitre a trouvé un carton manquant sur une ligne. Ici, la livraison suivante a deux
 * écarts qui s'annulent : un carton manque sur une ligne, un carton est en trop sur une autre.
 * Le total du bon tombe juste, et la responsable du magasin voudrait signer sur ce seul total.
 * L'élève refait les deux totaux, contrôle ligne par ligne, chiffre ce que le magasin paierait
 * pour des articles jamais reçus, et répond.
 *
 * La commande est celle de l'arène au deuxième trimestre de l'année du cours (`commandeDuTrimestre`),
 * le prix d'achat est celui du fournisseur que le moteur a servi (coût d'achat de la référence ×
 * coefficient du fournisseur). Les deux cartons sont des HYPOTHÈSES DU COURS : le moteur livre
 * toujours la commande entière.
 *
 * LA BONNE RÉPONSE EST LA MÊME PARTOUT : écrire les deux écarts sur le bon. Ce qui se calcule, ce
 * sont les totaux qui tombent juste, les deux écarts et ce que coûterait une signature sans réserve.
 */

/** Le trimestre de la livraison du cas : celui qui suit la livraison du chapitre. */
export const TRIMESTRE_DU_CAS = 2;

/**
 * UN CARTON MANQUE SUR LA LIGNE LA PLUS GROSSE, UN CARTON EST EN TROP SUR LA PLUS PETITE :
 * hypothèse du cours, pour que les deux écarts s'annulent dans le total.
 */
export const CARTONS_DE_CHAQUE_ECART = 1;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

export function deuxEcarts(c: Cas) {
  const commande = commandeDuTrimestre(c.code, TRIMESTRE_DU_CAS);
  const { lignes } = commande;
  const manque = lignes.reduce((a, b) => (b.commandee > a.commandee ? b : a));
  const enTrop = lignes.reduce((a, b) => (b.commandee < a.commandee ? b : a));
  const ecart = CARTONS_DE_CHAQUE_ECART * ARTICLES_PAR_CARTON;
  const comptes = lignes.map((l) => ({
    ...l,
    surLeBon: l.commandee,
    comptee: l.code === manque.code ? l.commandee - ecart : l.code === enTrop.code ? l.commandee + ecart : l.commandee,
  }));
  const r = trimestreDuCours(c.code, TRIMESTRE_DU_CAS).products![manque.code]!;
  const produit = (scenarioByCode(c.code).scenario.products ?? []).find((p) => p.code === manque.code)!;
  const prixDAchat = auCentime(produit.materialCostPerUnit * (r.supplier?.costMultiplier ?? 1));
  return {
    ...commande,
    comptes,
    manque: comptes.find((l) => l.code === manque.code)!,
    enTrop: comptes.find((l) => l.code === enTrop.code)!,
    ecart,
    totalSurLeBon: comptes.reduce((t, l) => t + l.surLeBon, 0),
    totalCompte: comptes.reduce((t, l) => t + l.comptee, 0),
    prixDAchat,
    payesSansEtreRecus: auCentime(ecart * prixDAchat),
  };
}

export const LES_DEUX_ECARTS: Situation = {
  code: "les-deux-ecarts",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [RECEVOIR_UNE_LIVRAISON.code],
  commanditaire: "La responsable du magasin",
  titre: "Les deux écarts",
  accroche:
    "Le total du bon de livraison tombe juste, et la responsable veut signer. Mais deux lignes ne tombent pas juste. Compter, chiffrer, et lui répondre.",
  objectifs: [
    "Comparer le total du bon et le total compté",
    "Contrôler une livraison ligne par ligne",
    "Chiffrer ce que coûte un bon signé sans réserve",
    "Répondre à sa responsable avant de signer",
  ],
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
          `« La livraison du trimestre ${TRIMESTRE_DU_CAS} est arrivée de chez notre fournisseur (${s.fournisseur}). Le bon annonce ${qte(s.totalSurLeBon)} articles, et vous en avez compté ${qte(s.totalCompte)}. Le total tombe juste : je peux signer sans rien écrire ? »`,
          `Pas de cours cette fois. Vous avez le bon de livraison et votre compte, carton par carton. La commande est celle de l'arène ; les cartons de ${qte(ARTICLES_PAR_CARTON)} articles et les écarts sont imaginés par le cours, car dans l'arène la livraison arrive toujours complète.`,
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
          {
            libelle: "Total sur le bon de livraison",
            attendu: s.totalSurLeBon,
            calcul: `${s.comptes.map((x) => qte(x.surLeBon)).join(" + ")} = ${qte(s.totalSurLeBon)}`,
          },
          {
            libelle: "Total compté dans les cartons",
            attendu: s.totalCompte,
            calcul: `${s.comptes.map((x) => qte(x.comptee)).join(" + ")} = ${qte(s.totalCompte)}`,
          },
        ];
      },
      explication: (c) => {
        const s = deuxEcarts(c);
        return [`Les deux totaux font ${qte(s.totalCompte)}. Un total juste ne prouve pas que chaque ligne est juste.`];
      },
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
          {
            libelle: `${s.manque.nom} : articles manquants`,
            attendu: s.manque.surLeBon - s.manque.comptee,
            calcul: `${qte(s.manque.surLeBon)} − ${qte(s.manque.comptee)} = ${qte(s.manque.surLeBon - s.manque.comptee)}`,
          },
          {
            libelle: `${s.enTrop.nom} : articles en trop`,
            attendu: s.enTrop.comptee - s.enTrop.surLeBon,
            calcul: `${qte(s.enTrop.comptee)} − ${qte(s.enTrop.surLeBon)} = ${qte(s.enTrop.comptee - s.enTrop.surLeBon)}`,
          },
        ];
      },
      explication: (c) => {
        const s = deuxEcarts(c);
        return [
          `${qte(s.ecart)} ${s.manque.pluriel} manquent, ${qte(s.ecart)} ${s.enTrop.pluriel} sont en trop : les deux écarts s'annulent dans le total, et c'est pour cela qu'il ne les montre pas.`,
        ];
      },
    },
    {
      id: "sans-reserve",
      type: "montants",
      titre: "Un bon signé sans réserve",
      notions: ["stock"],
      question: (c) => {
        const s = deuxEcarts(c);
        return `Signé sans rien écrire, le bon dit que les ${qte(s.manque.surLeBon)} ${s.manque.pluriel} sont ${accordeA(s.manque.feminin, "arrivé")} : le fournisseur les facturera tous. Chez le fournisseur, les ${s.manque.pluriel} s'achètent ${eur(s.prixDAchat)} pièce. Combien le magasin paierait-il pour des articles qu'il n'a pas reçus ?`;
      },
      champs: (c) => {
        const s = deuxEcarts(c);
        return [
          {
            libelle: "Payé sans être reçu",
            attendu: s.payesSansEtreRecus,
            calcul: `${qte(s.ecart)} × ${eur(s.prixDAchat)} = ${eur(s.payesSansEtreRecus)}`,
          },
        ];
      },
      explication: (c) => {
        const s = deuxEcarts(c);
        return [
          `${eur(s.payesSansEtreRecus)} payés pour rien. Et les ${qte(s.ecart)} ${s.enTrop.pluriel} en trop ne sont pas un cadeau : le fournisseur peut les facturer ou venir les reprendre.`,
        ];
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
          {
            texte: "Écrire les deux écarts sur le bon, puis signer",
            juste: true,
            retour: `Oui : « ${manquants}, ${enTrop} », écrit sur le bon avant de signer. Sans cette réserve, le magasin paierait ${eur(s.payesSansEtreRecus)} pour des articles jamais reçus.`,
          },
          {
            texte: "Signer sans rien écrire : le total tombe juste",
            juste: false,
            retour: `Non : le total tombe juste parce que deux écarts s'annulent. ${manquants.charAt(0).toUpperCase()}${manquants.slice(1)} seraient ${accordeA(s.manque.feminin, "payé")} ${eur(s.payesSansEtreRecus)} sans être ${accordeA(s.manque.feminin, "arrivé")}.`,
          },
          {
            texte: "Écrire seulement le manquant, et garder les articles en plus",
            juste: false,
            retour: `Non : les ${enTrop} se signalent aussi. Gardés sans rien écrire, le stock ne correspond plus aux papiers, et le fournisseur peut les facturer plus tard.`,
          },
        ];
      },
    },
  ],
};
