import { CONSEIL_SITUATIONS } from "../conseil/situations";
import { patchSituationText, type SituationTextPatch } from "../situation-patch";
import type { SituationDef } from "../situation-kit";

/**
 * Situations pédagogiques d'ATLAS CONSEIL · GAMME.
 *
 * Même dramaturgie que le cabinet d'origine (reprise, créances, banc,
 * recrutement, mission au rabais, résistance, et les trois situations
 * détectées), posée sur trois offres qui se partagent les mêmes consultants.
 * Ce que la gamme ajoute : le MIX des journées vendues, et une offre qui se
 * bâtit avant de se vendre. Les situations sont HÉRITÉES du cabinet : même
 * structure, sous d'autres codes ; le texte de celles que le mix change est
 * réécrit, les autres sont reprises telles quelles.
 */

const CODE = (code: string) => code.replace(/^conseil_/, "conseilg_");

const PATCHES: Record<string, SituationTextPatch> = {
  conseil_t1_reprise: {
    title: "Douze consultants, trois offres et un projet",
    narrative:
      "Vous prenez la direction d'ATLAS CONSEIL : douze consultants, 180 000 € de factures en attente et presque rien à l'actif immobilisé. Le cabinet vend deux offres, l'audit et la conformité pour les PME et le secteur public, la transformation pour les grands comptes, et garde dans ses cartons un projet de pratique cyber : il faudra le financer avant de la vendre. Le trimestre offre 720 jours-consultants, à répartir entre les offres.",
    problem:
      "Dans un cabinet, qu'est-ce qui détermine le résultat, pourquoi le chiffre d'affaires ne suffit-il pas à le dire, et que vaut une offre qui n'existe pas encore ?",
    diagnosticLabels: [
      "Le taux d'occupation : la part des jours disponibles réellement facturés, quelle que soit l'offre",
      "Les salaires tombent que les consultants soient staffés ou sur le banc, et ils sont communs aux trois offres",
      "Le nombre de consultants, indépendamment de ce qu'ils facturent",
      "Le chiffre d'affaires seul suffit à juger la performance",
    ],
    hintTexts: [
      "Comptez d'abord ce que le cabinet peut vendre : combien de consultants, combien de jours ouvrés chacun ? Une journée d'audit et une journée de transformation consomment le même consultant.",
      "Un jour de consultant non vendu ne se rattrape pas au trimestre suivant : il disparaît, et l'offre cyber ne vend rien tant qu'elle n'est pas bâtie.",
      "Vos charges de structure sont pour l'essentiel des SALAIRES : elles ne baissent pas quand le carnet se vide, et elles ne dépendent pas de l'offre vendue.",
      "Marge par jour : audit 560 − 90 = 470 €, transformation 780 − 115 = 665 €, cyber 850 − 100 = 750 € une fois lancée. Charges de structure décaissées = 198 000 € par trimestre.",
      "Le seuil se calcule à mix constant : 198 000 € divisés par la marge MOYENNE d'une journée vendue au mix prévu. Plus de transformation dans le mix, moins de jours à vendre pour équilibrer ; et la R&D de la pratique cyber est une charge du tour, à horizon.",
    ],
    modelExplain:
      "Le seuil de rentabilité traduit la question du métier en taux d'occupation : combien de jours faut-il facturer pour couvrir des salaires qui tombent de toute façon ? Avec trois offres, il se calcule à mix constant, et le mix devient une décision.",
  },
  conseil_t3_banc: {
    title: "Des consultants sur le banc, et trois offres pour les occuper",
    narrative:
      "L'été : les décideurs sont en congés, les marchés publics ne se notifient plus, la transformation s'arrête, l'audit tourne au ralenti. Quatre de vos douze consultants n'ont aucune mission ce trimestre. Leurs salaires, eux, tombent normalement, et seuls les DSI continuent d'acheter, si vous avez une offre cyber à leur vendre.",
    problem:
      "Faut-il baisser vos tarifs pour remplir le banc, sur quelle offre, ou tenir vos prix et accepter le creux ?",
    diagnosticLabels: [
      "Une mission au-dessus des frais variables de l'offre (90 € en audit, 115 € en transformation) améliore le résultat, même très en dessous du tarif habituel",
      "Mais un tarif bradé devient la nouvelle référence du client pour toutes les missions suivantes, et l'offre bradée déteint sur les autres",
      "Il ne faut jamais descendre sous le taux journalier affiché",
      "Licencier immédiatement les quatre consultants inoccupés",
    ],
    hintTexts: [
      "Posez la question autrement : que rapporte un consultant qui reste sur le banc, quelle que soit l'offre qu'il aurait vendue ?",
      "Comparez deux scénarios pour chaque offre : mission à tarif réduit, ou aucune mission. Qu'est-ce qui change réellement dans vos charges ?",
      "Le salaire du consultant est engagé quoi qu'il arrive : c'est un coût non pertinent pour cette décision-ci.",
      "Seuls les frais de mission varient, 90 € en audit, 115 € en transformation, 100 € en cyber. Toute mission au-dessus de ce seuil améliore le résultat du tour.",
      "Mais attention au tarif de référence : brader une fois sauve un trimestre, brader systématiquement détruit le taux journalier moyen de l'offre, et d'abord celle qu'on brade. Le creux de l'été est aussi le moment où une offre cyber, qui ne connaît pas les congés, remplit le banc sans brader.",
    ],
    modelExplain:
      "L'analyse des coûts pertinents isole ce que la décision change vraiment, les frais de mission de l'offre concernée, et écarte le salaire, engagé de toute façon. Elle se fait offre par offre : brader l'audit ne brade pas la transformation.",
  },
  conseil_t5_mission_rabais: {
    title: "Trois cent quatre-vingts euros la journée d'audit",
    narrative:
      "Une collectivité propose une mission d'audit de 60 jours à 380 € la journée, très en dessous de votre tarif habituel de 560 €. Vos consultants sont salariés et payés quoi qu'il arrive ; sans cette mission, une partie d'entre eux resterait au bureau. Chaque jour de mission coûte environ 90 € de frais de déplacement et de documentation. Mais les mêmes consultants pourraient vendre de la transformation à 780 €, si le carnet s'y prêtait.",
    problem:
      "Accepter une mission bien en dessous du tarif : sabordage, ou bon calcul ? Et que change le fait que les mêmes journées pourraient se vendre sur une autre offre ?",
    diagnosticLabels: [
      "Les salaires tombent que la mission soit prise ou non : ils ne départagent pas les deux options",
      "Seuls les 90 € de frais de mission sont évités si l'on refuse : la journée laisse donc 290 €, tant qu'aucune autre offre ne réclamait ces journées",
      "Toute mission vendue sous le tarif habituel se fait à perte",
      "Puisque la marge est positive, il faut accepter toutes les missions à bas prix",
    ],
    hintTexts: [
      "Demandez-vous ce qui change réellement dans vos comptes si vous refusez cette mission.",
      "Les salaires de vos consultants sont-ils de ceux-là ? Ils tombent aussi quand le carnet est vide.",
      "Retranchez des 380 € les seuls frais que la mission engendre : ce qui reste va couvrir la structure.",
      "290 € de marge par jour valent mieux que zéro, TANT QUE le consultant n'avait rien d'autre à faire, sur aucune des trois offres.",
      "Le raisonnement marginal s'arrête net dès que la capacité est prise : accepter, c'est alors renoncer à une journée de transformation à 665 € de marge, ou de cyber à 750 €. Le coût d'opportunité se lit dans le mix.",
    ],
    modelExplain:
      "L'analyse marginale ne retient que ce que la décision change : les frais de mission, et, si les consultants sont pris, la marge de l'offre à laquelle on renonce. Le salaire, engagé de toute façon, n'a rien à y faire.",
  },
  conseil_detect_idle_cash: {
    title: "Le compte se remplit, le carnet se vide, et la pratique cyber attend",
    narrative:
      "Les grosses factures de fin de mission sont rentrées d'un coup : le compte affiche plus d'un trimestre et demi de charges de structure, sans découvert. Votre banquier propose de bloquer une partie de ce solde jusqu'au trimestre suivant, à 2 % l'an, et facture le découvert 13 %. Le carnet d'audit et de transformation, lui, est plus creux qu'il ne l'a été depuis longtemps, et la pratique cyber, qui vendrait à des DSI qui ne connaissent pas les congés, n'est pas encore financée.",
    problem:
      "Cet argent qui dort, faut-il le placer, le mettre dans l'offre cyber, ou le garder, et jusqu'à quel montant ?",
    diagnosticLabels: [
      "Une trésorerie qui dort ne coûte rien, mais ne rapporte rien non plus : c'est un manque à gagner, à 2 % en placement ou en marges futures dans une offre neuve",
      "Le montant bloqué ou investi ne pourra régler aucune facture du trimestre : il faut d'abord chiffrer ce qui va sortir, salaires compris",
      "Puisque le placement rapporte, autant y mettre la totalité du solde",
      "Placer améliore le résultat d'exploitation de l'entreprise",
    ],
    hintTexts: [
      "Comparez votre solde aux charges de structure d'un trimestre : combien de trimestres de salaires pourriez-vous payer sans facturer un seul jour ?",
      "Cet argent ne rapporte rien tant qu'il dort. Deux pour cent, c'est peu, mais c'est infiniment plus que zéro ; une offre cyber lancée rapporte 750 € par journée vendue, mais seulement une fois bâtie.",
      "Attention : le placement est bloqué jusqu'au tour suivant, et la R&D est une charge du tour. Ni l'un ni l'autre ne réglera ce qui tombera d'ici là.",
      "Projetez le trimestre à venir avec le carnet TEL QU'IL EST, offre par offre : les salaires de vos consultants tomberont, les encaissements peut-être pas.",
      "Ne bloquez que l'excédent qui survit à cette projection, et gardez une marge. Le découvert coûte six fois et demie ce que le placement rapporte : l'erreur n'est pas symétrique.",
    ],
    modelExplain:
      "Le budget de trésorerie confronte les encaissements attendus au carnet réel, offre par offre, aux salaires certains et à ce que coûte de bâtir l'offre cyber. C'est le seul document qui empêche de prendre un solde de fin de mission pour un excédent durable.",
  },
};

export const CONSEIL_GAMME_SITUATIONS: SituationDef[] = CONSEIL_SITUATIONS.map((s) => {
  const patch = PATCHES[s.code];
  const renamed: SituationDef = { ...s, code: CODE(s.code) };
  return patch ? patchSituationText(renamed, patch) : renamed;
});
