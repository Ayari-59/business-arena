import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { FOND_DE_CAISSE, PART_EN_ESPECES, TENIR_LA_CAISSE, ficheDe, tableauDUnTiroir } from "../../chapitres/tenir-la-caisse";
import { DECEMBRE_N_MOINS_1, journeeEnCaisse } from "../../monde/vente-et-caisse";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « TENIR LA CAISSE » : LA CAISSE DU TRIMESTRE DE NOËL (CAP Équipier
 * polyvalent du commerce, palier 1).
 *
 * Un jour moyen de décembre, et ce soir la caisse compte plus que prévu. L'élève refait le
 * chiffre d'affaires du jour, les espèces attendues, compte le tiroir, trouve l'écart et dit ce
 * qui part au coffre.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le mois de décembre de N − 1 de MAILLE & CO
 * (monde/vente-et-caisse.ts : les ventes réglées en caisse, 231 850 € hors taxes en 30 jours ; les
 * commandes des comités d'entreprise sont facturées). Le fond de caisse et la part en espèces sont
 * ceux du chapitre ; l'erreur du soir est une hypothèse du cas, nommée ci-dessous.
 *
 * CE QUI A CHANGÉ. Le cas lisait le trimestre 4 de l'arène. Il lit maintenant décembre : 7 728,33 €
 * hors taxes par jour, 9 274 € TTC, 2 318,50 € en espèces, 2 468,50 € attendus, 2 473,50 € comptés.
 */

/** L'erreur du soir (hypothèse du cas) : un client est parti sans reprendre sa monnaie, un billet de 5 €. */
export const ERREUR_DU_SOIR = 5;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const caisseDeNoel = (c: Pick<Cas, "code">) => journeeEnCaisse(ficheDe(c), DECEMBRE_N_MOINS_1, ERREUR_DU_SOIR);

export const LA_CAISSE_DU_TRIMESTRE_DE_NOEL: Situation = {
  code: "la-caisse-du-trimestre-de-noel",
  parcours: "cap-epc",
  palier: 1,
  blocs: [],
  reprend: [TENIR_LA_CAISSE.code],
  commanditaire: "Le responsable du magasin",
  titre: "La caisse du trimestre de Noël",
  accroche: "Un jour de décembre, la caisse ne tombe pas juste. Refaire les espèces attendues, compter le tiroir, trouver l'écart et dire ce qui part au coffre.",
  objectifs: ["Calculer le chiffre d'affaires d'un jour et les espèces encaissées", "Calculer les espèces attendues avec le fond de caisse", "Compter le tiroir et trouver l'écart", "Répondre au responsable"],
  libre: false,
  entreprises: TENIR_LA_CAISSE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du responsable",
      texte: (c) => {
        const j = caisseDeNoel(c);
        return [
          `« En ${j.mois}, la boutique a vendu en caisse ${qte(j.articlesDuMois)} articles, pour ${eur(j.chiffreDuMois)} hors taxes, en ${qte(j.jours)} jours. Ce soir, c'est un jour moyen. Le matin, il y avait ${eur(FOND_DE_CAISSE)} de fond de caisse, et ${pct(PART_EN_ESPECES)} des ventes se paient en espèces. Comptez la caisse, et dites-moi si elle est juste. »`,
          `Pas de cours cette fois. Les ventes sont hors taxes : ajoutez la TVA de ${pct(j.taux)}. Le fond de caisse, la part en espèces et le tiroir sont des exemples du cours.`,
        ];
      },
      repere: () => "À rendre : les espèces attendues, le total compté, l'écart, ce qui part au coffre, et votre réponse.",
    },
    {
      id: "les-especes",
      type: "montants",
      titre: "Les espèces du jour",
      notions: ["revenue", "vat_payable"],
      question: () => "Calculez le chiffre d'affaires hors taxes d'un jour (au centime), puis le même toutes taxes, puis les espèces encaissées dans la journée.",
      champs: (c) => {
        const j = caisseDeNoel(c);
        return [
          { libelle: "Chiffre d'affaires hors taxes d'un jour", attendu: j.htDuJour, calcul: `${eur(j.chiffreDuMois)} ÷ ${qte(j.jours)} = ${eur(j.htDuJour)}` },
          { libelle: "Chiffre d'affaires TTC du jour", attendu: j.ttcDuJour, calcul: `${eur(j.htDuJour)} + ${eur(j.tvaDuJour)} = ${eur(j.ttcDuJour)}` },
          { libelle: "Espèces encaissées dans la journée", attendu: j.especes, calcul: `${eur(j.ttcDuJour)} × ${pct(PART_EN_ESPECES)} = ${eur(j.especes)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDeNoel(c);
        return [`Avec le fond de caisse, le tiroir doit contenir ${eur(FOND_DE_CAISSE)} + ${eur(j.especes)} = ${eur(j.attendu)}.`];
      },
    },
    {
      id: "le-tiroir",
      type: "montants",
      titre: "Le tiroir du soir",
      notions: ["net_treasury"],
      tableau: (c) => tableauDUnTiroir("Le tiroir compté ce soir", caisseDeNoel(c).tiroir),
      question: (c) => `Le tiroir doit contenir ${eur(caisseDeNoel(c).attendu)}. D'après le tableau, calculez le total compté, l'écart (négatif s'il manque de l'argent), puis ce qui part au coffre une fois le fond de caisse gardé pour demain.`,
      champs: (c) => {
        const j = caisseDeNoel(c);
        return [
          { libelle: "Total compté dans le tiroir", attendu: j.compte, calcul: `${j.tiroir.map((x) => `${qte(x.nombre)} × ${eur(x.valeur)}`).join(" + ")} = ${eur(j.compte)}` },
          { libelle: "Écart de caisse", attendu: j.ecart, calcul: `${eur(j.compte)} − ${eur(j.attendu)} = ${eur(j.ecart)}` },
          { libelle: "Espèces à remettre au coffre", attendu: j.auCoffre, calcul: `${eur(j.compte)} − ${eur(FOND_DE_CAISSE)} = ${eur(j.auCoffre)}` },
        ];
      },
      explication: (c) => {
        const j = caisseDeNoel(c);
        return [
          j.ecart > 0
            ? `Il y a ${eur(j.ecart)} de trop dans la caisse. Dans le cas du cours, un client est parti sans reprendre sa monnaie.`
            : j.ecart < 0
              ? `Il manque ${eur(-j.ecart)} dans la caisse.`
              : "La caisse tombe juste.",
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au responsable",
      question: (c) => {
        const j = caisseDeNoel(c);
        return `Le tiroir compte ${eur(j.compte)} au lieu de ${eur(j.attendu)}. Que répondez-vous au responsable ?`;
      },
      options: (c) => {
        const j = caisseDeNoel(c);
        const ecart = Math.abs(j.ecart);
        const sens = j.ecart > 0 ? "de trop" : "en moins";
        return [
          {
            texte: "Noter l'écart, puis remettre le reste au coffre",
            juste: true,
            retour: `Oui : ${eur(ecart)} ${sens}, écrit sur la feuille de caisse. ${eur(j.auCoffre)} partent au coffre, ${eur(FOND_DE_CAISSE)} restent pour demain. Si le client revient, on retrouve sa monnaie.`,
          },
          { texte: "La caisse est juste : un écart en plus ne compte pas", juste: false, retour: `Non : un écart compte, en plus comme en moins. Ici, ${eur(ecart)} ${sens}. Il se note sur la feuille de caisse.` },
          { texte: "Retirer l'écart du tiroir, sans rien écrire", juste: false, retour: `Non : l'argent de la caisse est au magasin. Les ${eur(ecart)} se notent et vont au coffre avec le reste.` },
        ];
      },
    },
  ],
};
