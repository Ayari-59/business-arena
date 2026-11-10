import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_LA_SECURITE, restaurerOuPayer } from "../../monde/securite-du-si-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SÉCURISER LE SYSTÈME D'INFORMATION » : PAYER LA RANÇON ? (Bac STMG, systèmes
 * d'information de gestion de terminale, palier 1).
 *
 * Le chapitre chiffrait le plan de sauvegarde ; le cas le met à l'épreuve d'un rançongiciel : ce que
 * coûte la restauration, face à la rançon, et ce que le président doit faire. Hypothèses :
 * monde/securite-du-si-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const PAYER_LA_RANCON: Situation = {
  code: "payer-la-rancon",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: ["securiser-le-systeme-d-information"],
  commanditaire: "Le président",
  titre: "Payer la rançon ?",
  accroche: "Un rançongiciel a chiffré le serveur du site. Les pirates promettent de tout rendre contre une rançon. La sauvegarde de la nuit est intacte : que coûte la restauration, et que faut-il faire ?",
  objectifs: ["Chiffrer la restauration depuis une sauvegarde", "La comparer à la rançon demandée", "Dire au président la conduite à tenir"],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_SECURITE, pourquoi: "le cas reprend le site de NOVA et ce que coûte un jour d'arrêt." },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du président",
      texte: () => {
        const k = restaurerOuPayer();
        return [
          `« Les pirates demandent ${eur(k.rancon)} pour déchiffrer le serveur. Le prestataire peut restaurer la sauvegarde de cette nuit en ${qte(k.joursDeRestauration)} jour, pour ${eur(k.prestataire)}. Un jour sans site nous coûte ${eur(k.coutDUnJour)} de marge. Je paie, ou nous restaurons ? » Le président`,
          "Pas de cours cette fois : les notions sont celles du chapitre.",
        ];
      },
      repere: () => "À rendre : le coût de la restauration, l'écart avec la rançon, et votre réponse.",
    },
    {
      id: "le-calcul",
      type: "montants",
      titre: "Restaurer ou payer",
      question: () => "Calculez ce que coûte la restauration (le jour d'arrêt et le prestataire), puis ce qu'elle coûte de moins que la rançon.",
      champs: () => {
        const k = restaurerOuPayer();
        return [
          { libelle: "Coût de la restauration", attendu: k.restauration, calcul: `${qte(k.joursDeRestauration)} × ${eur(k.coutDUnJour)} + ${eur(k.prestataire)} = ${eur(k.restauration)}` },
          { libelle: "Écart avec la rançon", attendu: k.ecart, calcul: `${eur(k.rancon)} − ${eur(k.restauration)} = ${eur(k.ecart)}` },
        ];
      },
      explication: () => [`La restauration coûte ${eur(restaurerOuPayer().ecart)} de moins que la rançon, et elle ne dépend pas de la parole des pirates.`],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Que répondez-vous au président ?",
      options: () => [
        { texte: "Restaurer, porter plainte, et ne pas payer", juste: true, retour: "Oui : la sauvegarde hors ligne rend la rançon inutile. On isole le serveur, on garde les traces pour la plainte, on corrige la faille avant de remettre le site en ligne, et on notifie la CNIL si des données de clients ont fui." },
        { texte: "Payer : c'est plus rapide, et les pirates tiennent toujours parole", juste: false, retour: "Non : rien ne garantit qu'ils rendront les données, ni qu'ils ne recommenceront pas. Payer finance les attaques suivantes." },
        { texte: "Restaurer tout de suite, sans chercher par où les pirates sont entrés", juste: false, retour: "Non : si la faille reste ouverte, le serveur restauré sera chiffré de nouveau." },
      ],
    },
  ],
};
