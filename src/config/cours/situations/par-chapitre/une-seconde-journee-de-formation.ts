import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import {
  ADOPTION_DE_LA_PREMIERE_ANNEE,
  CE_QUE_COUTE_UN_OUTIL_NUMERIQUE,
  FORMATION_PAR_UTILISATEUR,
  PART_DES_VENTES_RETROUVEES,
  outilNumerique,
} from "../../chapitres/ce-que-coute-un-outil-numerique";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CE QUE COÛTE ET RAPPORTE UN OUTIL NUMÉRIQUE » : UNE SECONDE JOURNÉE
 * DE FORMATION (Bac STMG, systèmes d'information de gestion, palier 1).
 *
 * Le chapitre a montré que le gain de l'outil suit son adoption, et que la première année, une
 * partie de l'équipe s'en passe. La responsable administrative en tire une question : une seconde
 * journée de formation pour chaque utilisateur, au prix de la première, ferait monter l'adoption.
 * Se paie-t-elle ? L'élève recalcule le gain annuel de l'outil, le gain à chaque taux d'adoption,
 * ce que la journée coûte et ce qu'elle rapporte chaque année.
 *
 * Le cas est neuf par sa question : le chapitre mesure un outil, le cas une dépense pour le faire
 * adopter. Les chiffres sont ceux du chapitre (`outilNumerique`, chez NOVA, dans le monde du cours :
 * l'effectif, les ventes que le retard des chiffres fait manquer, la marge d'une enceinte, l'offre du
 * prestataire) ; la seule hypothèse ajoutée est l'adoption après la seconde journée, nommée
 * ci-dessous. Le cas se jouait dans huit entreprises de l'arène.
 *
 * Le verdict se calcule : selon ce que l'outil rapporte, la journée se paie dès la première année,
 * dans d'autres il lui faut l'année suivante, selon ce que l'outil rapporte face au nombre de
 * personnes à former.
 */

/**
 * L'ADOPTION APRÈS LA SECONDE JOURNÉE, hypothèse du cas : faite après quelques semaines d'usage,
 * sur les vraies questions de l'équipe, elle ramène la plupart des réticents ; 90 % de l'équipe se
 * sert alors de l'outil.
 */
export const ADOPTION_APRES_LA_SECONDE_JOURNEE = 0.9;

/** L'horizon de la réponse : la journée se juge sur la première année, puis avec l'année suivante. */
export const HORIZON_EN_ANNEES = 2;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

export type Verdict = "des-la-premiere-annee" | "sur-l-horizon" | "pas-sur-l-horizon";

/** La seconde journée de formation : ce qu'elle coûte, ce qu'elle rapporte chaque année, et quand elle se paie. */
export function secondeJournee(c: Cas) {
  const o = outilNumerique(c);
  const cout = o.utilisateurs * FORMATION_PAR_UTILISATEUR;
  const gainApres = auCentime(o.gain * ADOPTION_APRES_LA_SECONDE_JOURNEE);
  const gainEnPlus = auCentime(gainApres - o.gainAdopte);
  const solde = auCentime(gainEnPlus - cout);
  const soldeSurLHorizon = auCentime(gainEnPlus * HORIZON_EN_ANNEES - cout);
  const verdict: Verdict = solde >= 0 ? "des-la-premiere-annee" : soldeSurLHorizon >= 0 ? "sur-l-horizon" : "pas-sur-l-horizon";
  return { o, cout, gainApres, gainEnPlus, solde, soldeSurLHorizon, verdict };
}

const AVANT = Math.round(ADOPTION_DE_LA_PREMIERE_ANNEE * 100);
const APRES = Math.round(ADOPTION_APRES_LA_SECONDE_JOURNEE * 100);
const PART = Math.round(PART_DES_VENTES_RETROUVEES * 100);
const H = HORIZON_EN_ANNEES;

export const UNE_SECONDE_JOURNEE_DE_FORMATION: Situation = {
  code: "une-seconde-journee-de-formation",
  parcours: "stmg-sig",
  palier: 1,
  blocs: [],
  reprend: [CE_QUE_COUTE_UN_OUTIL_NUMERIQUE.code],
  commanditaire: "La responsable administrative",
  titre: "Une seconde journée de formation",
  accroche:
    "L'outil est installé, mais une partie de l'équipe s'en passe. Une seconde journée de formation ferait monter l'adoption : ce qu'elle coûte, ce qu'elle rapporte chaque année, et quand elle se paie.",
  objectifs: [
    "Calculer le gain annuel d'un outil numérique selon son taux d'adoption",
    "Calculer ce qu'une formation coûte et ce qu'elle rapporte chaque année",
    "Dire quand une dépense de formation se rembourse",
    "Répondre à la responsable administrative, chiffre à l'appui",
  ],
  libre: false,
  entreprises: CE_QUE_COUTE_UN_OUTIL_NUMERIQUE.entreprises,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition de la responsable administrative",
      texte: (c) => [
        `« Le logiciel de gestion commerciale est installé, mais cette année, seuls ${AVANT} % d'entre nous s'en servent vraiment. Le prestataire propose une seconde journée de formation pour chaque utilisateur, au prix de la première, et il assure qu'ensuite ${APRES} % de l'équipe s'en servira. Cette journée se paie-t-elle pour ${c.entreprise}, et quand ? »`,
        `Pas de cours cette fois : les chiffres de l'outil sont ceux du chapitre. Le gain de l'outil reste une hypothèse du cas : ${PART} % des ventes que le retard des chiffres fait manquer, chiffrées à la marge d'une ${c.unite}. Le gain suit la part de l'équipe qui se sert de l'outil.`,
      ],
      tableau: (c) => {
        const s = secondeJournee(c);
        return {
          titre: `L'outil ${dE(c.entreprise)}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Utilisateurs (l'effectif)", valeurs: [qte(s.o.utilisateurs)] },
            { libelle: "Seconde journée de formation, par utilisateur", valeurs: [eur(FORMATION_PAR_UTILISATEUR)] },
            { libelle: `Ventes manquées à cause du retard des chiffres (${c.unites})`, valeurs: [qte(s.o.ventesManquees)] },
            { libelle: "Part de ces ventes que l'outil fait retrouver, si toute l'équipe s'en sert", valeurs: [`${PART} %`] },
            { libelle: "Marge sur coût variable moyenne d'une unité vendue", valeurs: [eur(s.o.marge)] },
            { libelle: "Adoption cette année", valeurs: [`${AVANT} %`] },
            { libelle: "Adoption promise après la seconde journée", valeurs: [`${APRES} %`] },
          ],
        };
      },
      repere: () => "À rendre : le gain de l'outil à chaque taux d'adoption, ce que la journée coûte et rapporte, et votre réponse.",
    },
    {
      id: "gain",
      type: "montants",
      titre: "Le gain selon l'adoption",
      notions: ["contribution_margin"],
      question: () =>
        `Calculez le gain annuel de l'outil si toute l'équipe s'en sert (les ventes retrouvées, à l'unité, multipliées par la marge), puis ce gain quand ${AVANT} % de l'équipe s'en sert, et quand ${APRES} % s'en sert.`,
      champs: (c) => {
        const s = secondeJournee(c);
        return [
          {
            libelle: "Gain annuel si toute l'équipe s'en sert",
            attendu: s.o.gain,
            calcul: `${qte(s.o.ventesManquees)} × ${PART} % = ${qte(s.o.ventesRetrouvees)} ; ${qte(s.o.ventesRetrouvees)} × ${eur(s.o.marge)} = ${eur(s.o.gain)}`,
            tolerance: 1,
          },
          { libelle: `Gain annuel à ${AVANT} % d'adoption`, attendu: s.o.gainAdopte, calcul: `${eur(s.o.gain)} × ${AVANT} % = ${eur(s.o.gainAdopte)}`, tolerance: 1 },
          { libelle: `Gain annuel à ${APRES} % d'adoption`, attendu: s.gainApres, calcul: `${eur(s.o.gain)} × ${APRES} % = ${eur(s.gainApres)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const s = secondeJournee(c);
        return [
          `Passer de ${AVANT} % à ${APRES} % d'adoption fait gagner ${eur(s.gainEnPlus)} de plus chaque année, sans payer un euro d'abonnement de plus : l'abonnement se paie déjà pour toute l'équipe.`,
        ];
      },
    },
    {
      id: "journee",
      type: "montants",
      titre: "Ce que la journée coûte et rapporte",
      notions: ["irr_payback"],
      question: () =>
        "Calculez ce que coûte la seconde journée pour toute l'équipe, le gain qu'elle ajoute chaque année, et le solde de la première année (gain en plus moins coût de la journée).",
      champs: (c) => {
        const s = secondeJournee(c);
        return [
          { libelle: "Coût de la seconde journée", attendu: s.cout, calcul: `${qte(s.o.utilisateurs)} × ${eur(FORMATION_PAR_UTILISATEUR)} = ${eur(s.cout)}` },
          { libelle: "Gain en plus chaque année", attendu: s.gainEnPlus, calcul: `${eur(s.gainApres)} − ${eur(s.o.gainAdopte)} = ${eur(s.gainEnPlus)}`, tolerance: 1 },
          { libelle: "Solde de la première année", attendu: s.solde, calcul: `${eur(s.gainEnPlus)} − ${eur(s.cout)} = ${eur(s.solde)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const s = secondeJournee(c);
        return [
          s.solde >= 0
            ? `La journée coûte ${eur(s.cout)} une fois, et rapporte ${eur(s.gainEnPlus)} chaque année : elle est payée avant la fin de la première année.`
            : `La journée coûte ${eur(s.cout)} une fois, et rapporte ${eur(s.gainEnPlus)} chaque année : la première année ne suffit pas à la payer. Sur ${H} ans, le solde est de ${eur(s.soldeSurLHorizon)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la responsable",
      question: () => "Quelle réponse envoyez-vous à la responsable administrative ?",
      options: (c) => {
        const s = secondeJournee(c);
        return [
          {
            texte: "Oui, la journée se paie dès la première année",
            juste: s.verdict === "des-la-premiere-annee",
            retour:
              s.verdict === "des-la-premiere-annee"
                ? `Oui : ${eur(s.gainEnPlus)} de gain en plus dès la première année, pour ${eur(s.cout)} de formation. La promesse du prestataire reste une hypothèse : il faudra vérifier, à la fin de l'année, combien de personnes se servent vraiment de l'outil.`
                : `Non : la première année, la journée rapporte ${eur(s.gainEnPlus)}, moins que ses ${eur(s.cout)}.`,
          },
          {
            texte: "Oui, mais il lui faut encore l'année suivante",
            juste: s.verdict === "sur-l-horizon",
            retour:
              s.verdict === "sur-l-horizon"
                ? `Oui : la première année, le solde est de ${eur(s.solde)} ; sur ${H} ans, il passe à ${eur(s.soldeSurLHorizon)}. La journée se paie, à condition que l'équipe garde l'outil, et que l'adoption promise se vérifie.`
                : s.verdict === "des-la-premiere-annee"
                  ? `Non : elle se paie dès la première année, avec un solde de ${eur(s.solde)}.`
                  : `Non : même sur ${H} ans, le solde reste de ${eur(s.soldeSurLHorizon)}.`,
          },
          {
            texte: "Non : même l'an prochain, elle ne se paie pas",
            juste: s.verdict === "pas-sur-l-horizon",
            retour:
              s.verdict === "pas-sur-l-horizon"
                ? `Oui : ${eur(s.gainEnPlus)} par an ne paient pas ${eur(s.cout)} de formation en ${H} ans (solde de ${eur(s.soldeSurLHorizon)}). Mieux vaut accompagner l'équipe autrement.`
                : `Non : sur ${H} ans, la journée rapporte ${eur(auCentime(s.gainEnPlus * H))}, plus que ses ${eur(s.cout)}.`,
          },
        ];
      },
    },
  ],
};
