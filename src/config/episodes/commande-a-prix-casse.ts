/**
 * LA COMMANDE À PRIX CASSÉ — le contenu de l'épisode.
 *
 * Nadège Pujol dirige le centre de découpe et de façonnage de panneaux
 * d'Arvel Distribution, à Vénissieux : une scie à panneaux, un centre
 * d'usinage, neuf opérateurs et un chef d'atelier, qui débitent et usinent
 * des panneaux bois, plâtre et composite pour les artisans et les agences. Un
 * promoteur demande 1 600 panneaux à 39 €, sous le coût complet de 46 € que
 * la contrôleuse de gestion vient de lui rappeler. Six décisions, chacune
 * précédée de ce qu'une directrice d'atelier reçoit vraiment.
 *
 * Les chiffres que les sources donnent sont tirés des constantes du modèle :
 * ce que le joueur lit est ce que la simulation calcule.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  ACTIVITE_NORMALE,
  AVANCE,
  CAPACITE,
  CHARGES_FIXES,
  COMMANDE,
  COUT_COMPLET,
  COUT_VARIABLE,
  CV,
  DEUXIEME_EQUIPE,
  ELASTICITE,
  EN_PLUS,
  FIDELITE,
  HEURES_SUP_MAX,
  LOT,
  MARGE_TARIF,
  MCV_POINTE,
  MCV_REGULIERE,
  PART_FIXE,
  PERDU_PAR_RETARD,
  PRIX_CONTRE,
  PRIX_REGULIER,
  REMISE_GROS,
  REMISE_VOLUME,
  REVISION,
  RIOULT,
  SAISON,
  SEMAINES,
  SOUS_TRAITANT,
  SURCOUT_HS,
} from "@/engine/episodes/commande-a-prix-casse";
import { euros, kE, nombre, taux } from "./format";
import type { Etape } from "./types";

/** Un prix au centime : « 3,50 € ». */
export const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const THAIS = { de: "Thaïs Ventura", role: "Responsable des achats, Habitat Cévral" } as const;
const YUNA = { de: "Yuna Kerdraon", role: "Contrôleuse de gestion" } as const;
const DRISS = { de: "Driss Ouakili", role: "Chef d'atelier" } as const;
const EDGAR = { de: "Edgar Lamarque", role: "Directeur commercial de la région" } as const;
const MARCEL = { de: "Marcel Rioult", role: "Gérant, Agencements Rioult" } as const;
const MIRKO = { de: "Mirko Jovanovic", role: "Technicien du constructeur de la scie" } as const;
const LYDIE = { de: "Lydie Marcon", role: "Gérante, Façonnage Mézière" } as const;
const TABLEAU = { de: "Tableau de bord de l'atelier", role: "Point hebdomadaire" } as const;

/** Le volume habituel des semaines creuses, et celui de la pleine saison. */
const CREUX = ACTIVITE_NORMALE * SAISON[1]!;
const POINTE = ACTIVITE_NORMALE * SAISON[10]!;
/** Ce que Rioult achète en moyenne par semaine, et sur les semaines 5 à 13. */
export const VOLUME_RIOULT = RIOULT.part * ACTIVITE_NORMALE;
export const RIOULT_RESTE_DU_TRIMESTRE =
  RIOULT.part * ACTIVITE_NORMALE * SAISON.slice(RIOULT.effet).reduce((s, x) => s + x, 0);
/** Ce que coûteraient deux jours d'arrêt de la scie en pleine saison, au premier ordre. */
export const COUT_ARRET_EN_POINTE =
  HEURES_SUP_MAX * SURCOUT_HS +
  (CAPACITE * REVISION.arret - HEURES_SUP_MAX) * PERDU_PAR_RETARD * MCV_REGULIERE;

export const DIAGNOSTICS = [
  {
    id: "marginal",
    t: "L'atelier a de la capacité libre jusqu'à la pleine saison, et ses charges fixes sont payées quoi qu'il façonne : ce qui compte, c'est ce que la commande ajoute aux coûts, et les semaines qu'elle occupe",
  },
  {
    id: "saison",
    t: "La pleine saison va saturer l'atelier : le vrai risque est de manquer de capacité en semaines 9 à 11",
  },
  {
    id: "perte",
    t: "La commande est vendue à perte : 39 € ne couvrent pas les 46 € du coût complet",
  },
  {
    id: "couts",
    t: "L'atelier coûte trop cher : à 46 € le panneau, il n'est plus compétitif",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Un promoteur à 39 € le panneau",
    jusqua: 2,
    messages: () => [
      {
        ...THAIS,
        heure: "08:20",
        alerte: true,
        texte: `Madame Pujol, Habitat Cévral lance les 80 logements de la résidence Les Vergnes, à Saint-Fons. Il nous faut ${nombre(COMMANDE.quantite)} panneaux mélaminés débités et chantés pour les placards et les cuisines, ${COMMANDE.rythme} par semaine des semaines ${COMMANDE.de} à ${COMMANDE.a}. Notre prix : ${COMMANDE.prix} € le panneau. J'ai besoin de votre réponse vendredi.`,
      },
      {
        ...YUNA,
        heure: "09:10",
        texte: `Nadège, je te renvoie la fiche de coût : notre coût complet est de ${COUT_COMPLET} € par panneau. À ${COMMANDE.prix} €, on perd ${COUT_COMPLET - COMMANDE.prix} € sur chaque panneau, ${euros((COUT_COMPLET - COMMANDE.prix) * COMMANDE.quantite)} sur la commande. Je ne vois pas comment on la signe.`,
      },
      {
        ...EDGAR,
        heure: "09:40",
        texte:
          "Ne laisse pas filer Cévral. Ils construisent quatre cents logements par an dans l'Est lyonnais, et ils n'ont pas encore d'atelier attitré.",
      },
      {
        ...DRISS,
        heure: "10:05",
        texte:
          "Depuis trois semaines, on finit les débits le jeudi midi. Le vendredi, l'équipe range et affûte.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "fiche",
        titre: "Décomposer la fiche de coût avec Yuna",
        cout: 1,
        nature: "decisive",
        resultat: `Les ${COUT_COMPLET} € du coût complet se décomposent en ${COUT_VARIABLE} € de coût variable — ${CV.panneau} € de panneau brut, ${centimes(CV.chants)} de chants et de consommables, ${centimes(CV.energie)} d'énergie et d'usure des lames — et ${PART_FIXE} € de charges fixes : les ${euros(CHARGES_FIXES)} par semaine de l'atelier (salaires de l'équipe et du chef d'atelier, amortissement de la scie et du centre d'usinage, loyer, entretien), répartis sur une activité normale de ${ACTIVITE_NORMALE} panneaux. Yuna : « Les salaires sont mensualisés, 35 heures : ils sont payés que la scie tourne ou non. »`,
      },
      {
        id: "charge",
        titre: "Regarder le plan de charge des treize semaines avec Driss",
        cout: 1,
        nature: "decisive",
        resultat: `En heures normales, l'atelier façonne ${nombre(CAPACITE)} panneaux par semaine. Le carnet des semaines 1 à 7 tourne autour de ${nombre(CREUX)} : plus de ${nombre(Math.floor((CAPACITE - CREUX) / 10) * 10)} panneaux de capacité libre chaque semaine. La pleine saison des agenceurs, des semaines 9 à 11, monte à ${nombre(POINTE)}. Au-delà de ${nombre(CAPACITE)}, Driss peut faire ${HEURES_SUP_MAX} panneaux de plus en heures supplémentaires, à ${SURCOUT_HS} € de plus par panneau ; au-delà encore, ce sont les clients habituels qui attendent.`,
      },
      {
        id: "contrat",
        titre: "Lire le projet de contrat de Cévral",
        cout: 0.5,
        nature: "utile",
        resultat: `Livraisons de ${COMMANDE.rythme} panneaux par semaine, fractionnées par cage d'escalier ; chants reposés à la demande ; facturation sur le tarif catalogue, avec une remise de chantier. Paiement à 45 jours. Les poseurs du promoteur sont des artisans du secteur : la moitié sont déjà clients de l'atelier.`,
      },
      {
        id: "siege",
        titre: "Recalculer le coût avec la clé de répartition du siège",
        cout: 0.5,
        nature: "bruit",
        resultat: `Avec les frais de structure du siège (informatique, direction, comptabilité), répartis à 4 € par panneau, le coût complet « groupe » monte à ${COUT_COMPLET + 4} €. Le siège facture ces frais à l'atelier par un forfait mensuel.`,
      },
      {
        id: "conseil",
        titre: "Demander conseil à Véra Domingues",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Véra : « Ne te demande pas si 39 € couvrent le coût complet. Demande-toi ce que la commande ajoute à tes coûts, et quelles semaines elle occupe. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à Habitat Cévral ?",
    options: [
      {
        t: `Refuser : à ${COMMANDE.prix} €, la commande est sous notre coût complet de ${COUT_COMPLET} €`,
        d: "On ne vend pas à perte. Cévral ira voir ailleurs.",
      },
      {
        t: `Contre-proposer ${PRIX_CONTRE} €, notre coût complet`,
        d: "Pas un euro en dessous. Thaïs Ventura dira oui, ou pas.",
      },
      {
        t: `Accepter ${COMMANDE.prix} € comme un prix de chantier, à nos conditions`,
        d: "Livraison par camions complets sur un seul site, facturation sous une référence de chantier, sans reprise ni découpe à la demande. Cévral garde son prix.",
      },
      {
        t: `Accepter ${COMMANDE.prix} € aux conditions de Cévral`,
        d: "Livraisons fractionnées par cage d'escalier, chants à la demande, tarif catalogue remisé. Un peu plus de manutention.",
      },
    ],
    reactions: [
      [
        {
          ...THAIS,
          texte: "Dommage. Un atelier de Saint-Priest nous fait le prix ; nous signons avec lui.",
        },
        {
          ...DRISS,
          texte: "On finira encore les débits le jeudi midi.",
        },
      ],
      null,
      [
        {
          ...THAIS,
          texte:
            "Des camions complets et une seule référence, ça nous va : nos poseurs n'ont besoin de rien d'autre. Premier camion en semaine 3.",
        },
      ],
      [
        {
          ...THAIS,
          texte:
            "Parfait. Nos poseurs passeront prendre les panneaux à l'atelier au fil des cages d'escalier.",
        },
        {
          ...DRISS,
          texte: "Il va falloir préparer des petits lots, cage par cage. On s'organisera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Préparer la pleine saison",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...DRISS,
        heure: "15:30",
        alerte: true,
        texte: ctx.signee
          ? `Les agenceurs annoncent leur pleine saison : ${nombre(POINTE)} panneaux par semaine des semaines 9 à 11. Avec les ${COMMANDE.rythme} panneaux de Cévral jusqu'en semaine ${COMMANDE.a}, on sera à ${ctx.chargePointe} en semaines 9 et 10. Il faut que je sache comment on s'organise.`
          : `Les agenceurs annoncent leur pleine saison : ${nombre(POINTE)} panneaux par semaine des semaines 9 à 11, juste notre capacité en heures normales. Il faut que je sache comment on s'organise.`,
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.volume} panneaux façonnés pour ${nombre(CAPACITE)} de capacité. Coût complet de la semaine : ${ctx.coutComplet} par panneau.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "plan",
        titre: "Simuler le plan de charge avec Driss",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.signee
            ? `Au rythme de Cévral, ${COMMANDE.rythme} panneaux par semaine jusqu'en semaine ${COMMANDE.a}, la charge monte à ${nombre(POINTE + COMMANDE.rythme)} en semaines 9 et 10 : ${HEURES_SUP_MAX} en heures supplémentaires, et une centaine de panneaux d'habitués qui attendent chaque semaine. En fabriquant la commande d'avance, ${AVANCE.rythme} par semaine des semaines ${AVANCE.de} à ${AVANCE.a}, les semaines creuses passent à ${nombre(CREUX + AVANCE.rythme)} panneaux et la pleine saison reste à ${nombre(POINTE)}. Stocker les panneaux finis coûte ${centimes(AVANCE.stockage)} par panneau, racks loués et double manutention : ${euros(AVANCE.stockage * COMMANDE.quantite)} pour la commande.`
            : `Sans commande, les semaines creuses restent à ${nombre(CREUX)} panneaux, et la pleine saison monte à ${nombre(POINTE)}, juste notre capacité : les semaines où la demande dépasse les prévisions, il faudra des heures supplémentaires.`,
      },
      {
        id: "equipe",
        titre: "Chiffrer une deuxième équipe avec les ressources humaines",
        cout: 0.5,
        nature: "utile",
        resultat: `Une équipe d'après-midi ajouterait ${DEUXIEME_EQUIPE.capacite} panneaux de capacité par semaine, pour ${euros(DEUXIEME_EQUIPE.cout)} par semaine de primes d'équipe, de chef d'équipe et d'intérim, engagés jusqu'à la fin du trimestre : ${euros(DEUXIEME_EQUIPE.cout * (SEMAINES - DEUXIEME_EQUIPE.de + 1))} de la semaine ${DEUXIEME_EQUIPE.de} à la ${SEMAINES}.`,
      },
      {
        id: "confrere",
        titre: "Appeler Façonnage Mézière, un confrère sous-traitant",
        cout: 0.5,
        nature: "utile",
        resultat: `Lydie Marcon peut prendre les débordements de la pleine saison : ${euros(SOUS_TRAITANT.forfait)} de réservation, puis ${SOUS_TRAITANT.surcout} € de plus par panneau que ce qu'il vous coûte à l'atelier.`,
      },
    ],
    question: "Comment organisez-vous les semaines qui viennent ?",
    options: [
      {
        t: "Produire au fil des commandes, et faire des heures supplémentaires s'il le faut",
        d: "Cévral au rythme du contrat, s'il est signé. Rien à engager aujourd'hui.",
      },
      {
        t: "Fabriquer d'avance, dans les semaines creuses, tout ce qui peut l'être",
        d: `La commande de Cévral, si elle est signée, faite des semaines ${AVANCE.de} à ${AVANCE.a} et stockée jusqu'aux livraisons : ${centimes(AVANCE.stockage)} par panneau de racks et de manutention.`,
      },
      {
        t: `Ouvrir une deuxième équipe dès la semaine ${DEUXIEME_EQUIPE.de}`,
        d: `${DEUXIEME_EQUIPE.capacite} panneaux de capacité en plus par semaine, ${euros(DEUXIEME_EQUIPE.cout)} par semaine jusqu'à la fin du trimestre.`,
      },
      {
        t: "Réserver le confrère sous-traitant pour la pleine saison",
        d: `${euros(SOUS_TRAITANT.forfait)} de réservation ; il prend ce qui déborde au-delà des heures supplémentaires, à ${SOUS_TRAITANT.surcout} € de plus par panneau.`,
      },
    ],
    reactions: [
      [{ ...DRISS, texte: "D'accord. On verra en semaine 9." }],
      [
        {
          ...DRISS,
          texte:
            "Je cale le planning : tout ce qui peut se faire avant la pleine saison se fera dans les semaines creuses.",
        },
      ],
      [
        {
          de: "Ressources humaines",
          role: "Vénissieux",
          texte:
            "L'agence d'intérim nous propose quatre opérateurs pour l'équipe d'après-midi. Démarrage en semaine 4.",
        },
      ],
      [
        {
          ...LYDIE,
          texte: "C'est noté : vous avez une place réservée chez nous jusqu'à la fin du trimestre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Rioult veut le même prix",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...MARCEL,
        heure: "10:15",
        alerte: true,
        texte: ctx.fractionne
          ? `Madame Pujol, mes poseurs travaillent aussi sur le chantier de Cévral. J'ai vu vos bons de livraison : ${COMMANDE.prix} € le panneau chanté, sur votre tarif catalogue. Je vous en paie ${PRIX_REGULIER}. Je veux le même prix sur toutes mes commandes, sinon je vais voir ailleurs.`
          : ctx.prixChantier
            ? `Madame Pujol, on me dit que vous faites des prix à ${COMMANDE.prix} € pour Cévral. Je vous achète ${nombre(VOLUME_RIOULT)} panneaux par semaine depuis douze ans : je veux le même prix sur toutes mes commandes, sinon je vais voir ailleurs.`
            : `Madame Pujol, Cévral a fait le tour des ateliers de la région à ${COMMANDE.prix} € le panneau. Si un atelier peut faire ce prix, vous pouvez le faire aussi : je veux ${COMMANDE.prix} € sur toutes mes commandes, sinon je vais voir ailleurs.`,
      },
      {
        ...EDGAR,
        heure: "11:00",
        texte: `Rioult, c'est ${taux(RIOULT.part, 0)} du volume de l'atelier. On ne peut pas le perdre avant la pleine saison.`,
      },
    ],
    sources: [
      {
        id: "rioult",
        titre: "Regarder ce que pèse Agencements Rioult",
        cout: 0.5,
        nature: "decisive",
        resultat: `Rioult, c'est ${taux(RIOULT.part, 0)} du volume régulier : ${nombre(VOLUME_RIOULT)} panneaux par semaine en moyenne, à ${PRIX_REGULIER} €, soit ${MCV_REGULIERE} € de marge sur coût variable par panneau. À ${RIOULT.prix} €, il n'en resterait que ${RIOULT.prix - COUT_VARIABLE} : sur les neuf semaines qui restent, l'écart dépasse ${kE(Math.floor(((PRIX_REGULIER - RIOULT.prix) * RIOULT_RESTE_DU_TRIMESTRE) / 1000) * 1000)}. Ses commandes ne sont pas du volume en plus : il en a besoin pour ses chantiers, quel que soit le prix.`,
      },
      {
        id: "commerciaux",
        titre: "Demander aux commerciaux ce qu'ils entendent",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.fractionne
            ? `Trois autres clients ont vu passer les bons de livraison de Cévral et posent la question. Les poseurs comparent leurs prix entre eux, et le prix de ${COMMANDE.prix} € figure sur le tarif catalogue, comme le leur.`
            : ctx.prixChantier
              ? "Le prix de Cévral circule, mais ceux qui en parlent savent que c'est un prix de camion complet, sous une référence de chantier, sans reprise ni découpe à la demande : ce n'est pas le service qu'ils achètent."
              : "Rioult a reçu le devis d'un concurrent pour la pleine saison. Les autres clients ne demandent rien de particulier.",
      },
    ],
    question: "Que répondez-vous à Marcel Rioult ?",
    options: [
      {
        t: `Lui accorder ${RIOULT.prix} € sur tout son volume, pour le garder`,
        d: `${RIOULT.prix} € couvrent largement nos ${COUT_VARIABLE} € de coût variable. Rioult reste.`,
      },
      {
        t: "Refuser net : nos prix sont nos prix",
        d: "Le tarif catalogue, comme pour tout le monde. Rioult décidera.",
      },
      {
        t: "Lui expliquer ce qu'est un prix de chantier, et le lui proposer pour du volume en plus",
        d: `Camions complets, une seule livraison, en semaines creuses : ${EN_PLUS.prix} € pour ce qu'il ne nous commande pas aujourd'hui. Le reste au tarif.`,
      },
      {
        t: `Lui faire un geste de fidélité de ${taux(FIDELITE, 0)} sur ses commandes du trimestre`,
        d: `Environ ${euros(Math.round((FIDELITE * PRIX_REGULIER * RIOULT_RESTE_DU_TRIMESTRE) / 100) * 100)} d'ici la fin du trimestre. Rioult a laissé entendre qu'un geste lui suffirait.`,
      },
    ],
    reactions: [
      [
        {
          ...MARCEL,
          texte: "Voilà qui est raisonnable. Je vous envoie mes commandes de la pleine saison.",
        },
      ],
      [{ ...MARCEL, texte: "C'est noté. Je vais réfléchir." }],
      [
        {
          ...MARCEL,
          texte:
            "Un prix de camion complet, je comprends. J'ai deux chantiers que je faisais faire ailleurs : je vous les envoie dès la semaine prochaine. Pour le reste, je vais réfléchir.",
        },
      ],
      [{ ...MARCEL, texte: "Merci du geste. On continue ensemble." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Cévral en redemande",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...THAIS,
        heure: "09:00",
        alerte: true,
        texte: ctx.signee
          ? `Madame Pujol, vos panneaux sont parfaits. Nous lançons la seconde tranche : ${nombre(LOT.quantite)} panneaux de plus, ${LOT.rythme} par semaine des semaines ${LOT.de} à ${LOT.a}, à ${COMMANDE.prix} €. Vous pouvez suivre ?`
          : `Madame Pujol, l'atelier qui avait pris notre commande ne suit plus. Il nous reste ${nombre(LOT.quantite)} panneaux à faire, ${LOT.rythme} par semaine des semaines ${LOT.de} à ${LOT.a}, à ${COMMANDE.prix} €. Vous pouvez les prendre ?`,
      },
      {
        ...EDGAR,
        heure: "09:30",
        texte: `${COMMANDE.prix} €, c'est ${COMMANDE.prix - COUT_VARIABLE} € au-dessus du coût variable. Prends-les : c'est de la marge en plus, comme la dernière fois.`,
      },
      {
        ...DRISS,
        heure: "10:00",
        texte: `Pour mémoire : en semaines 9 et 10, on attend ${ctx.chargePointe} panneaux par semaine, pour ${nombre(CAPACITE)} de capacité.`,
      },
    ],
    sources: [
      {
        id: "marginal",
        titre: "Calculer avec Driss ce que coûte un panneau de plus en pleine saison",
        cout: 0.5,
        nature: "decisive",
        resultat: `En semaines 9 à 12, l'atelier est déjà plein. Les ${HEURES_SUP_MAX} premiers panneaux au-delà de ${nombre(CAPACITE)} se font en heures supplémentaires : ${COUT_VARIABLE + SURCOUT_HS} € le panneau. Au-delà, chaque panneau de Cévral prend la place d'un panneau d'habitué : un sur deux part chez un concurrent avec ses ${MCV_REGULIERE} € de marge, l'autre attend la semaine suivante, quand l'atelier est encore plein. Un panneau qui fait attendre un habitué coûte ainsi au moins ${COUT_VARIABLE + MCV_POINTE} €. Après la pleine saison, la semaine ${LOT.apresDe} retrouve de la place.`,
      },
      {
        id: "calendrier",
        titre: "Demander à Thaïs Ventura si le calendrier peut bouger",
        cout: 0.5,
        nature: "utile",
        resultat: `Thaïs : « Les poseurs attaquent les cuisines en semaine ${LOT.de}. Si vous ne pouvez livrer qu'à partir de la semaine ${LOT.apresDe}, on peut commencer par les placards, mais je ne vous promets rien. Et je n'ai pas de budget pour payer plus. »`,
      },
    ],
    question: "Que répondez-vous à Cévral ?",
    options: [
      {
        t: `Accepter à ${COMMANDE.prix} € : le prix couvre toujours notre coût variable`,
        d: `${nombre(LOT.quantite)} panneaux, ${LOT.rythme} par semaine des semaines ${LOT.de} à ${LOT.a}. ${COMMANDE.prix - COUT_VARIABLE} € au-dessus du coût variable, comme la première commande.`,
      },
      {
        t: "Accepter, à condition de livrer après la pleine saison",
        d: `${LOT.rythme} par semaine à partir de la semaine ${LOT.apresDe}, le reste au trimestre prochain. Thaïs Ventura dira si ses poseurs peuvent attendre.`,
      },
      {
        t: `Accepter en pleine saison, mais à ${LOT.prixPointe} €`,
        d: "Le prix de ce que coûte un panneau de plus quand l'atelier est plein. Cévral dira oui, ou pas.",
      },
      {
        t: "Décliner : l'atelier est plein en pleine saison",
        d: "On garde la capacité pour les habitués.",
      },
    ],
    reactions: [
      [{ ...THAIS, texte: "Merci ! Premier camion de la seconde tranche en semaine 9." }],
      null,
      null,
      [{ ...THAIS, texte: "Je comprends. Nous trouverons une autre solution." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La scie doit être révisée",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...MIRKO,
        heure: "08:30",
        alerte: true,
        texte: `Madame Pujol, votre scie à panneaux atteint ses 4 000 heures : le carnet d'entretien prévoit une révision, deux jours d'arrêt. J'ai un créneau la semaine prochaine, en semaine ${REVISION.semaine}.`,
      },
      {
        ...DRISS,
        heure: "09:15",
        texte:
          "Deux jours d'arrêt, ça ne coûte rien : l'équipe fera le nettoyage et l'inventaire, elle est payée de toute façon.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Semaine 8 : ${ctx.volume} panneaux façonnés. Charge attendue en semaines 9 et 10 : ${ctx.chargePointe} panneaux par semaine, pour ${nombre(CAPACITE)} de capacité.`,
      },
    ],
    sources: [
      {
        id: "arret",
        titre: "Chiffrer avec Yuna ce que coûtent deux jours d'arrêt en semaine 9",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les salaires sont payés de toute façon, mais en semaine ${REVISION.semaine} l'atelier est plein : deux jours d'arrêt, ce sont ${nombre(CAPACITE * REVISION.arret)} panneaux de capacité en moins. Les ${HEURES_SUP_MAX} premiers se rattrapent en heures supplémentaires ; les autres font attendre des habitués, dont la moitié part chez un concurrent avec ${MCV_REGULIERE} € de marge chacun. Au total, près de ${euros(COUT_ARRET_EN_POINTE)}, sans compter les retards qui débordent sur la semaine suivante. Après la pleine saison, quand l'atelier a de la capacité libre, le même arrêt ne coûte presque rien.`,
      },
      {
        id: "carnet",
        titre: "Lire le carnet d'entretien et les statistiques du constructeur",
        cout: 0.5,
        nature: "utile",
        resultat: `Dernière révision il y a quatorze mois. Selon le constructeur, une scie qui dépasse l'échéance de quelques semaines tombe en panne une fois sur quatre avant la révision suivante ; sous contrôle vibratoire hebdomadaire (${euros(REVISION.surveillance)} d'ici la fin du trimestre), une fois sur vingt. Une panne, c'est trois jours d'arrêt et ${euros(REVISION.reparation)} de réparation.`,
      },
      {
        id: "weekend",
        titre: "Demander un devis pour une révision le week-end",
        cout: 0.5,
        nature: "utile",
        resultat: `Le constructeur peut intervenir un samedi et un dimanche : ${euros(REVISION.weekend)} de majorations pour son technicien et deux opérateurs. Pas une heure d'atelier perdue.`,
      },
    ],
    question: "Quand faites-vous réviser la scie ?",
    options: [
      {
        t: `En semaine ${REVISION.semaine}, comme le prévoit le carnet`,
        d: "Deux jours d'arrêt. Pas de surcoût : l'équipe fait le nettoyage et l'inventaire.",
      },
      {
        t: "Le week-end, en heures majorées",
        d: `${euros(REVISION.weekend)} de majorations. La scie ne s'arrête pas en semaine.`,
      },
      {
        t: "Après la pleine saison, sous contrôle vibratoire chaque semaine",
        d: `${euros(REVISION.surveillance)} de contrôles d'ici là. La révision passe au trimestre prochain, en semaine creuse.`,
      },
      {
        t: "Au trimestre prochain, sans rien changer",
        d: "Aucun coût ce trimestre.",
      },
    ],
    reactions: [
      [{ ...DRISS, texte: "Arrêt lundi et mardi. On en profite pour l'inventaire." }],
      [{ ...MIRKO, texte: "Samedi 7 heures, j'arrive avec les pièces." }],
      [
        {
          ...MIRKO,
          texte:
            "Je passe chaque lundi avec l'analyseur. Si la scie dérive, on l'arrête avant la casse.",
        },
      ],
      [{ ...DRISS, texte: "Bon. On croise les doigts." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le coût complet a bougé",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...YUNA,
        heure: "11:00",
        alerte: true,
        texte: `Nadège, j'ai recalculé le coût complet sur les dix premières semaines : ${ctx.volumeMoyen} panneaux façonnés par semaine en moyenne, et un coût complet de ${ctx.coutCompletRecalcule} par panneau, au lieu de ${COUT_COMPLET} €.`,
      },
      {
        ...EDGAR,
        heure: "11:30",
        texte: ctx.coutEnBaisse
          ? `Notre tarif, c'est le coût complet plus ${taux(MARGE_TARIF, 0)}. Avec ${ctx.coutCompletRecalcule}, il devrait être à ${ctx.tarifRecalcule}, pas à ${PRIX_REGULIER} €. Baissons-le dès lundi : on gagnera des clients.`
          : `Notre tarif, c'est le coût complet plus ${taux(MARGE_TARIF, 0)}. Avec ${ctx.coutCompletRecalcule}, il devrait être à ${ctx.tarifRecalcule}. Il faut le remonter dès lundi, sinon on travaille pour rien.`,
      },
      {
        ...DRISS,
        heure: "14:00",
        texte: `Les semaines 12 et 13 s'annoncent plus calmes : ${nombre(ACTIVITE_NORMALE * SAISON[12]!)} puis ${nombre(CREUX)} panneaux d'habitués.`,
      },
    ],
    sources: [
      {
        id: "cout",
        titre: "Décomposer avec Yuna ce qui a bougé dans le coût complet",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le coût variable n'a pas bougé : ${COUT_VARIABLE} € par panneau. Les charges fixes non plus : ${euros(CHARGES_FIXES)} par semaine. Seule leur part par panneau a changé, parce que l'atelier a façonné ${ctx.volumeMoyen} panneaux par semaine au lieu des ${ACTIVITE_NORMALE} de l'activité normale. Faire un panneau de plus coûte toujours ${COUT_VARIABLE} €, et au trimestre prochain, sans commande exceptionnelle, la part des charges fixes reviendra à ${PART_FIXE} €.`,
      },
      {
        id: "clients",
        titre: "Demander aux commerciaux comment les clients réagissent au prix",
        cout: 0.5,
        nature: "utile",
        resultat: `En fin de saison, une baisse de tarif fait venir peu de monde : pour 1 % de baisse, les agenceurs commandent environ ${nombre(ELASTICITE.baisse)} % de plus. Une hausse les envoie chez les concurrents : ${nombre(ELASTICITE.hausse)} % de volume en moins pour 1 % de hausse. Plusieurs agenceurs regrouperaient chez un seul atelier les commandes qu'ils partagent, pour un prix de camion complet.`,
      },
    ],
    question: "Que faites-vous du tarif pour la fin du trimestre ?",
    options: [
      {
        t: "Répercuter le nouveau coût complet dans le tarif catalogue",
        d: `Le coût complet plus ${taux(MARGE_TARIF, 0)}, comme toujours, dès la semaine 11, pour tous les clients.`,
      },
      {
        t: "Garder le tarif tel qu'il est",
        d: `${PRIX_REGULIER} € le panneau, comme depuis le début de l'année.`,
      },
      {
        t: `Garder le tarif, et offrir ${taux(REMISE_VOLUME.remise, 0)} aux commandes groupées en camion complet en semaines ${REMISE_VOLUME.de} et 13`,
        d: `Une seule livraison et moins de réglages : ${REMISE_VOLUME.economie} € de coût en moins par panneau. Une offre limitée aux deux semaines creuses.`,
      },
      {
        t: `Baisser de ${taux(REMISE_GROS.remise, 0)} le tarif des vingt plus gros clients, pour les fidéliser`,
        d: "La moitié du volume, à partir de la semaine 11.",
      },
    ],
    reactions: [
      [{ ...EDGAR, texte: "Le nouveau tarif part lundi chez tous les clients." }],
      [{ ...EDGAR, texte: "Comme tu veux. Je n'aurai rien de neuf à leur dire." }],
      [
        {
          ...EDGAR,
          texte:
            "Trois agenceurs ont déjà regroupé chez nous leurs commandes de fin de trimestre, en camions complets.",
        },
      ],
      [{ ...EDGAR, texte: "Les gros clients apprécient. Ils commandent comme d'habitude." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Raisonner à la marge, capacité comprise", chemin: [2, 1, 2, 1, 2, 2] },
  { nom: "Les réflexes du coût", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [0, 0, 1, 3, 3, 1] },
] as const;

/**
 * Les options que l'erreur de l'épisode fait choisir : [décision, option].
 * Juger au coût complet quand l'atelier a de la place (refuser, ou exiger le
 * coût complet ; répercuter dans le tarif un coût complet qui ne bouge qu'avec
 * le volume) ; juger au coût variable quand il est plein ou que le volume
 * viendrait de toute façon (aligner Rioult, prendre le second lot en pleine
 * saison, arrêter la scie en pleine saison parce que « l'équipe est payée de
 * toute façon »).
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  contreOui: `Nous avons regardé de près : vos panneaux sont meilleurs que ceux d'à côté. D'accord pour ${PRIX_CONTRE} €. Premier camion en semaine 3.`,
  contreNon: `${PRIX_CONTRE} €, c'est hors de notre budget. Un atelier de Saint-Priest nous fait ${COMMANDE.prix} € ; nous signons avec lui.`,
  apresOui: `Nous commencerons par les placards : livrez-nous les panneaux de cuisine à partir de la semaine ${LOT.apresDe}, ${LOT.rythme} par semaine.`,
  apresNon:
    "Nos poseurs ne peuvent pas attendre la semaine 12 : nous confions la seconde tranche à un autre atelier.",
  pointeOui: `C'est cher, mais nos poseurs ne peuvent pas attendre. D'accord pour ${LOT.prixPointe} €, à partir de la semaine ${LOT.de}.`,
  pointeNon: `${LOT.prixPointe} €, c'est hors de notre budget. Nous confions la seconde tranche à un autre atelier.`,
  rioultPart:
    "Madame Pujol, j'ai confié plus de la moitié de mes débits à un autre atelier. On verra pour la suite.",
  rioultReste: "J'ai réfléchi. Je reste chez vous, aux conditions que vous m'avez données.",
  ebruite: `Trois clients ont vu passer les bons de livraison de Cévral à ${COMMANDE.prix} €. Les commerciaux ont dû concéder des remises pour les garder.`,
  panne: `La scie a cassé un roulement de lame ce matin : trois jours d'arrêt en pleine saison, et ${euros(REVISION.reparation)} de réparation.`,
} as const;
