import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_SYSTEME_D_INFORMATION, controleDeJuin } from "../../monde/systeme-d-information-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE SYSTÈME D'INFORMATION DE NOVA » : CONTRÔLER LES ADRESSES À LA SAISIE ?
 * (Bac STMG, systèmes d'information de gestion de terminale, palier 1).
 *
 * Le chapitre trouvait le nombre de commandes qui paie le contrôle des adresses ; le cas le chiffre sur
 * le mois de juin, et fait dire où le processus change. Hypothèses : monde/systeme-d-information-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const CONTROLER_LES_ADRESSES_A_LA_SAISIE: Situation = {
  code: "controler-les-adresses-a-la-saisie",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["le-systeme-d-information-de-nova"],
  commanditaire: "Le président",
  titre: "Contrôler les adresses à la saisie ?",
  accroche: "En juin, les colis revenus pour une adresse fausse se sont multipliés. Faut-il brancher un contrôle des adresses sur le site, et qu'est-ce que cela change au travail de l'atelier ?",
  objectifs: ["Chiffrer le coût d'une donnée de mauvaise qualité", "Le comparer au contrôle qui l'évite", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DU_SYSTEME_D_INFORMATION, pourquoi: "le cas reprend les commandes du site de NOVA et ses colis revenus." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = controleDeJuin();
        return [
          `« En juin, sur ${qte(k.commandes)} commandes, ${qte(k.colis)} colis nous sont revenus pour une adresse fausse, à ${eur(k.coutDUnColis)} chacun. Le service de complétion d'adresses coûte ${eur(k.abonnement)} par mois. Est-ce que nous le prenons ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût des colis revenus, ce que laisse le contrôle, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Ce que coûtent les adresses fausses",
      question: () => "Calculez ce qu'ont coûté les colis revenus en juin, puis ce que le contrôle laisserait à NOVA une fois son abonnement payé.",
      champs: () => {
        const k = controleDeJuin();
        return [
          { libelle: "Coût des colis revenus", attendu: k.cout, calcul: `${qte(k.colis)} × ${eur(k.coutDUnColis)} = ${eur(k.cout)}` },
          { libelle: "Ce que laisse le contrôle", attendu: k.gain, calcul: `${eur(k.cout)} − ${eur(k.abonnement)} = ${eur(k.gain)}` },
        ];
      },
      explication: () => [`Le contrôle laisse ${eur(controleDeJuin().gain)} dès le mois de juin, sans compter les clients qui attendent leur enceinte.`],
    },
    {
      id: "le-processus",
      type: "choix",
      titre: "Où le travail change",
      question: () => "Que change le contrôle au processus d'expédition ?",
      options: () => [
        { texte: "Une tâche de plus à la commande, et moins de colis à réexpédier", juste: true, retour: "Oui : la vérification se fait pendant l'acquisition, par le client lui-même. L'atelier réexpédie moins, et le transporteur livre du premier coup." },
        { texte: "L'opérateur doit vérifier chaque adresse à la main avant d'étiqueter le colis", juste: false, retour: "Non : le contrôle est automatique, au moment de la saisie. Il n'ajoute rien à l'atelier." },
        { texte: "Rien : le processus ne change pas, seul l'outil change", juste: false, retour: "Non : une tâche s'ajoute à l'activité de commande, et une autre disparaît presque, la réexpédition." },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => {
        const k = controleDeJuin();
        return [
          { texte: "Prendre le contrôle des adresses", juste: true, retour: `Oui : il laisse ${eur(k.gain)} par mois, et la donnée juste dès la saisie sert ensuite tous les métiers : l'expédition, la facturation, la relation client.` },
          { texte: "Demander au transporteur de deviner les adresses incomplètes", juste: false, retour: "Non : la donnée resterait fausse dans la base, et le colis pourrait se perdre." },
          { texte: "Attendre décembre, où les commandes seront plus nombreuses, pour décider", juste: false, retour: `Non : le contrôle se paie déjà en juin, avec ${qte(k.commandes)} commandes.` },
        ];
      },
    },
  ],
};
