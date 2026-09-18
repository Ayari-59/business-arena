import type { CourrierDef } from "../types";

/**
 * LA LIASSE RSE — transverse à tous les secteurs.
 *
 * Ces courriers ne sont pas tirés par le scénario mais par le STANDING RSE de
 * l'entreprise : c'est sa conduite des trimestres passés qui les appelle. D'où
 * des expéditeurs qui jugent — un organisme certificateur, une inspection, une
 * agence de financement, la presse — plutôt que des partenaires d'affaires.
 */
export const RSE_COURRIERS: CourrierDef[] = [
  {
    code: "rse_label",
    expediteur: "Organisme certificateur Véritas Sociale",
    objet: "Attribution du label Entreprise responsable",
    corps:
      "À l'issue de l'audit conduit dans vos locaux, le comité de labellisation a retenu votre candidature. Le label vous est attribué pour trois ans et peut être apposé sur vos supports commerciaux. Il sera réexaminé si vos engagements venaient à faiblir.",
    signataire: "La présidente du comité",
    effet: "Attractivité renforcée pendant plusieurs tours",
    enJeu:
      "Un capital de marque se construit lentement — l'engagement RSE d'hier soutient la demande d'aujourd'hui.",
    nature: "market",
    pli: "recommande",
    emoji: "🏅",
    scope: "team",
  },
  {
    code: "rse_bad_buzz",
    expediteur: "Rédaction du quotidien régional · Service enquêtes",
    objet: "Demande de droit de réponse avant publication",
    corps:
      "Notre enquête à paraître compare vos engagements affichés et vos pratiques constatées, et relève plusieurs écarts. Conformément à nos règles, nous vous offrons la possibilité de répondre avant la parution, prévue en fin de semaine.",
    signataire: "Le chef du service enquêtes",
    effet: "Demande en baisse ce tour",
    enJeu:
      "On ne s'affiche pas responsable à moitié : un standing entre-deux expose plus qu'il ne protège.",
    nature: "market",
    pli: "recommande",
    emoji: "📢",
    scope: "team",
  },
  {
    code: "rse_sanction",
    expediteur: "Direction régionale de l'environnement · Pôle contrôles",
    objet: "Notification de sanction administrative",
    corps:
      "Le contrôle inopiné du mois écoulé a établi un écart entre vos déclarations et la situation constatée sur site. Une amende administrative vous est notifiée, exigible sous trente jours. Les voies et délais de recours figurent au verso.",
    signataire: "L'inspectrice des installations classées",
    effet: "Amende — charge exceptionnelle ce tour",
    enJeu:
      "Le risque RSE n'est pas que d'image : la réglementation a un coût, comptabilisé hors exploitation.",
    nature: "macro",
    pli: "recommande",
    emoji: "⚖️",
    scope: "team",
  },
  {
    code: "rse_subvention",
    expediteur: "Agence de la transition écologique · Service des aides",
    objet: "Décision d'attribution d'une aide à l'investissement propre",
    corps:
      "Votre dossier a été retenu au titre du soutien aux procédés sobres. L'aide sera versée en une fois, sur justification de la dépense engagée. Elle constitue une subvention d'exploitation et devra être comptabilisée comme telle.",
    signataire: "La directrice régionale",
    effet: "Aide — produit exceptionnel ce tour",
    enJeu:
      "L'investissement responsable peut être cofinancé : une subvention améliore le résultat hors exploitation.",
    nature: "macro",
    pli: "recommande",
    emoji: "💶",
    scope: "team",
  },
];
