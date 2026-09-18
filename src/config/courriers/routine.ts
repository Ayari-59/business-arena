import type { CourrierDef } from "./types";

/**
 * UNE ENVELOPPE N'EST JAMAIS VIDE.
 *
 * Le tirage d'un tour peut ne rien donner. L'écran affichait alors « aucune
 * carte ce tour » : un vide, à l'endroit même où l'élève venait chercher
 * quelque chose. Le facteur, lui, passe tous les jours. Quand rien de notable
 * ne tombe, il apporte donc un courrier de routine — un accusé de réception,
 * une attestation, un avis d'échéance. Rien qui change les comptes, tout ce
 * qu'une entreprise reçoit vraiment.
 *
 * Ce n'est pas du remplissage. Trier ce qui appelle une décision de ce qui
 * appelle un classement EST une compétence de gestion, et ces courriers-là
 * disent au passage une obligation réelle : déposer ses comptes, être à jour
 * de ses cotisations, déclarer sa TVA, payer sa prime.
 *
 * Leur `code` commence par `routine_` et ne correspond à AUCUN événement du
 * moteur : ces courriers ne sont jamais tirés, jamais distribués par
 * l'enseignant, jamais appliqués. Ils ne sont que lus.
 */
export const COURRIERS_DE_ROUTINE: CourrierDef[] = [
  {
    code: "routine_situation_comptable",
    expediteur: "Cabinet Delvaux · Expertise comptable",
    objet: "Situation intermédiaire au terme du trimestre",
    corps:
      "Vous trouverez ci-joint la situation arrêtée à la fin du trimestre. Le rapprochement bancaire est en concordance et aucune anomalie ne ressort de nos contrôles. Nous restons à votre disposition avant la prochaine clôture.",
    signataire: "Votre expert-comptable",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "Une situation intermédiaire ne se subit pas : c'est le moment de vérifier que les comptes disent ce que vous croyez avoir fait.",
    nature: "internal",
    pli: "simple",
    emoji: "📊",
    scope: "team",
  },
  {
    code: "routine_attestation_vigilance",
    expediteur: "Organisme de recouvrement des cotisations sociales",
    objet: "Délivrance de votre attestation de vigilance",
    corps:
      "Vous êtes à jour de vos déclarations et du paiement de vos cotisations à la date de la présente. L'attestation jointe est valable six mois et vous sera demandée par tout donneur d'ordres pour un marché supérieur à cinq mille euros.",
    signataire: "Le service des entreprises",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "Sans attestation de vigilance, pas de marché : être à jour de ses cotisations est aussi une condition commerciale.",
    nature: "macro",
    pli: "simple",
    emoji: "📄",
    scope: "team",
  },
  {
    code: "routine_depot_des_comptes",
    expediteur: "Greffe du tribunal de commerce",
    objet: "Accusé de réception du dépôt de vos comptes annuels",
    corps:
      "Vos comptes annuels ont été déposés et enregistrés au registre du commerce et des sociétés. Ils sont désormais consultables par tout tiers qui en fait la demande, sauf option pour la confidentialité.",
    signataire: "Le greffier",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "Vos comptes sont publics : vos concurrents, vos fournisseurs et vos clients peuvent les lire comme vous lisez les leurs.",
    nature: "macro",
    pli: "simple",
    emoji: "🗂️",
    scope: "team",
  },
  {
    code: "routine_echeance_assurance",
    expediteur: "Assurances du Littoral · Service des contrats",
    objet: "Avis d'échéance de votre contrat multirisque",
    corps:
      "Votre prime annuelle est appelée à la date d'échéance figurant sur l'avis joint. Les garanties et les franchises restent inchangées. Toute modification de votre activité doit nous être signalée sous quinze jours.",
    signataire: "Le service des contrats",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "La prime se paie tous les ans, le sinistre arrive une fois : c'est cet écart-là que l'assurance vend, et qu'on juge trop cher jusqu'au jour où il sert.",
    nature: "internal",
    pli: "simple",
    emoji: "🛡️",
    scope: "team",
  },
  {
    code: "routine_releve_bancaire",
    expediteur: "Agence bancaire · Service des relevés",
    objet: "Relevé trimestriel et arrêté de compte",
    corps:
      "Vous trouverez le détail des mouvements de la période ainsi que l'arrêté des agios et commissions. Sauf réclamation de votre part sous un mois, cet arrêté sera réputé approuvé.",
    signataire: "Le service des relevés",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "Un arrêté de compte non contesté devient définitif : les frais qu'on ne lit pas sont des frais qu'on accepte.",
    nature: "internal",
    pli: "simple",
    emoji: "🏦",
    scope: "team",
  },
  {
    code: "routine_tva",
    expediteur: "Service des impôts des entreprises",
    objet: "Accusé de réception de votre déclaration de TVA",
    corps:
      "Votre déclaration a été enregistrée et le paiement correspondant encaissé. Aucune observation n'est formulée à ce stade. Le droit de reprise de l'administration court jusqu'à la fin de la troisième année suivant celle de l'exigibilité.",
    signataire: "L'inspecteur des finances publiques",
    effet: "Aucun effet sur ce trimestre",
    enJeu:
      "La TVA que vous encaissez ne vous appartient jamais : elle transite par votre trésorerie, et la confondre avec du résultat est l'erreur classique.",
    nature: "macro",
    pli: "simple",
    emoji: "🧾",
    scope: "team",
  },
];

/**
 * Le courrier apporté quand rien n'est tombé, choisi sur le tour et sur la
 * partie. Déterministe : revenir sur la page ne change pas la lettre, et deux
 * équipes de la même partie reçoivent la même — c'est un courrier de routine,
 * pas un tirage.
 */
export function courrierDeRoutine(gameId: string, round: number): CourrierDef {
  let empreinte = round;
  for (const caractere of gameId) empreinte = (empreinte * 31 + caractere.charCodeAt(0)) >>> 0;
  return COURRIERS_DE_ROUTINE[empreinte % COURRIERS_DE_ROUTINE.length]!;
}

/** Un courrier sans effet sur les comptes : celui qu'on classe, pas celui qu'on traite. */
export function estUnCourrierDeRoutine(code: string): boolean {
  return code.startsWith("routine_");
}
