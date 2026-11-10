import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { POSITIONNER_L_OFFRE } from "../../chapitres/positionner-l-offre";
import { PERSONNALISATION, commandeDeCampusTech, commandeGravee, margeDeLaGravure, plusPetiteCommandeGravee, supplementQuiPaie } from "../../monde/offre-de-nova";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « POSITIONNER L'OFFRE » : CAMPUSTECH VEUT SON LOGO (Bac STMG, mercatique
 * de terminale, palier 1).
 *
 * Un nouveau campus de CampusTech commande des enceintes gravées à son logo, mais en petite quantité
 * (PERSONNALISATION.commandeDuCas, 150 enceintes). Le président veut savoir s'il faut accepter au
 * supplément habituel. L'élève refait le calcul du chapitre (le gain d'une commande gravée), constate
 * qu'elle est sous la plus petite commande qui paie, et cherche le supplément qui la rendrait payante.
 * Le cas est neuf par sa question : le chapitre trouve le volume qui paie au supplément fixé ; le cas
 * fixe le volume et cherche le supplément.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

/** Les chiffres de la réponse, calculés une fois. */
export function campusTechVeutSonLogo() {
  const q = PERSONNALISATION.commandeDuCas;
  const k = commandeGravee(q);
  const supplement = supplementQuiPaie(q);
  return { quantite: q, gain: k.gain, seuil: plusPetiteCommandeGravee(), supplement, gainAuSupplement: Math.round((q * (supplement - PERSONNALISATION.gravureParEnceinte) - PERSONNALISATION.reglageParCommande) * 100) / 100 };
}

export const CAMPUSTECH_VEUT_SON_LOGO: Situation = {
  code: "campustech-veut-son-logo",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["positionner-l-offre"],
  commanditaire: "Le président",
  titre: "CampusTech veut son logo",
  accroche: "Un nouveau campus veut des enceintes gravées à son logo, mais il en commande peu. Accepter au supplément habituel, refuser, ou proposer un autre prix ?",
  objectifs: ["Chiffrer le gain d'une commande personnalisée", "Trouver le supplément qui paie une petite commande", "Répondre au président, chiffres à l'appui"],
  libre: false,
  entreprises: POSITIONNER_L_OFFRE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du président",
      texte: () => {
        const r = campusTechVeutSonLogo();
        const p = PERSONNALISATION;
        return [
          `« Le nouveau campus de ${commandeDeCampusTech().nom} veut ${qte(r.quantite)} enceintes gravées à son logo. On lui fait le supplément habituel de ${eur(p.supplementFacture)} par enceinte ? Je veux savoir ce que nous y gagnons. » Le président`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. Chaque commande gravée demande un réglage de ${eur(p.reglageParCommande)}, et chaque gravure coûte ${eur(p.gravureParEnceinte)}.`,
        ];
      },
      repere: () => "À rendre : le gain de la commande au supplément habituel, le plus petit supplément qui la paie, et votre réponse.",
    },
    {
      id: "au-supplement-habituel",
      type: "montants",
      titre: "Au supplément habituel",
      notions: ["contribution_margin"],
      question: () => `Calculez ce que la gravure laisse sur une enceinte avant le réglage, puis le gain de la commande de ${qte(campusTechVeutSonLogo().quantite)} enceintes, réglage payé.`,
      champs: () => {
        const r = campusTechVeutSonLogo();
        const p = PERSONNALISATION;
        return [
          { libelle: "Ce que laisse la gravure, par enceinte", attendu: margeDeLaGravure(), calcul: `${eur(p.supplementFacture)} − ${eur(p.gravureParEnceinte)} = ${eur(margeDeLaGravure())}` },
          { libelle: "Gain de la commande", attendu: r.gain, calcul: `${qte(r.quantite)} × ${eur(margeDeLaGravure())} − ${eur(p.reglageParCommande)} = ${eur(r.gain)}` },
        ];
      },
      explication: () => {
        const r = campusTechVeutSonLogo();
        return [`Au supplément habituel, la commande ${r.gain < 0 ? `perd ${eur(-r.gain)}` : `rapporte ${eur(r.gain)}`} : elle est sous les ${qte(r.seuil)} enceintes à partir desquelles la gravure paie son réglage.`];
      },
    },
    {
      id: "le-supplement-qui-paie",
      type: "montants",
      titre: "Le supplément qui paie",
      notions: ["contribution_margin", "price_floor"],
      question: () => `Calculez le plus petit supplément par enceinte, au centime supérieur, qui paie la gravure et le réglage d'une commande de ${qte(campusTechVeutSonLogo().quantite)} enceintes.`,
      champs: () => {
        const r = campusTechVeutSonLogo();
        const p = PERSONNALISATION;
        return [{ libelle: "Supplément qui paie, par enceinte", attendu: r.supplement, calcul: `${eur(p.gravureParEnceinte)} + ${eur(p.reglageParCommande)} ÷ ${qte(r.quantite)} = ${eur(r.supplement)}` }];
      },
      explication: () => {
        const r = campusTechVeutSonLogo();
        return [`Le réglage se partage sur peu d'enceintes : chacune doit en porter plus. À ${eur(r.supplement)}, la commande ne perd plus rien.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au président",
      question: () => "Quelle phrase envoyez-vous au président ?",
      options: () => {
        const r = campusTechVeutSonLogo();
        return [
          { texte: `Proposons ${eur(r.supplement)} par enceinte gravée`, juste: true, retour: `Oui : au supplément habituel, la commande perd ${eur(-r.gain)}. À ${eur(r.supplement)}, elle paie sa gravure et son réglage ; le campus garde son logo, et NOVA ne perd rien.` },
          { texte: "Acceptons au supplément habituel, la commande rapporte", juste: false, retour: `Non : ${qte(r.quantite)} enceintes, c'est moins que les ${qte(r.seuil)} à partir desquelles la gravure paie. La commande perdrait ${eur(-r.gain)}.` },
          { texte: "Refusons : une petite commande ne se personnalise pas", juste: false, retour: `Non : elle se personnalise, à un autre prix. À ${eur(r.supplement)} par enceinte, elle ne coûte plus rien à NOVA, et le client professionnel reste satisfait.` },
        ];
      },
    },
  ],
};
