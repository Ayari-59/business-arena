/**
 * FAIRE OU FAIRE FAIRE — le contenu de l'épisode.
 *
 * Maëlys Tissier est responsable des livraisons de la plateforme Arvel de
 * Corbas : neuf porteurs, neuf chauffeurs, trois cents livraisons sur chantier
 * par semaine. Transports Ventajol propose de tout reprendre à un prix par
 * livraison inférieur au coût complet de la flotte, et la direction y voit
 * plus de 50 k€ d'économie par trimestre. Six décisions, chacune précédée de
 * ce qu'une responsable des livraisons reçoit vraiment.
 *
 * Tous les chiffres que donnent les messages et les sources sont tirés des
 * constantes du modèle : le joueur peut refaire chaque calcul, et le test de
 * l'épisode vérifie qu'ils tombent juste.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  CDI,
  COUT_COMPLET,
  COUT_COMPLET_AGGLO,
  COUT_SEMAINE,
  ECONOMIE_AFFICHEE,
  EVITABLE_LOINTAINE_APRES,
  FIXES,
  FIXES_COMMUNS,
  GRAND_COMPTE,
  HEURES_SUP,
  HEURES_SUP_LOINTAINES,
  INTERIM,
  LIVRAISONS,
  LOUES,
  PENALITE_RETARD,
  PROPRES,
  RENFORT,
  RETARDS,
  SAMEDIS,
  SECOND,
  SERVICE,
  TARIFS,
  TOTAL_LIVRAISONS,
  VARIABLE,
  prixContrat,
} from "@/engine/episodes/faire-ou-faire-faire";
import type { Etape } from "./types";
import { euros, nombre, taux } from "./format";

const ANSELME = { de: "Anselme Roquebert", role: "Directeur de la plateforme de Corbas" } as const;
const APOLLINE = { de: "Apolline Vergès", role: "Contrôleuse de gestion" } as const;
const MALO = { de: "Malo Mazoyer", role: "Responsable commercial, Transports Ventajol" } as const;
const SEYDOU = { de: "Seydou Coulibaly", role: "Chef d'atelier" } as const;
const NOUR = { de: "Nour Bensalem", role: "Planificatrice des tournées" } as const;
const GISELE = { de: "Gisèle Pradier", role: "Responsable des ressources humaines" } as const;
const KAMEL = { de: "Kamel Benyahia", role: "Chauffeur" } as const;
const SACHA = { de: "Sacha Le Berre", role: "Chauffeur intérimaire" } as const;
const ARSENE = {
  de: "Arsène Ribot",
  role: "Chargé d'affaires, Loxane Véhicules Industriels",
} as const;
const AURELE = { de: "Aurèle Mangin", role: "Directeur commercial" } as const;
const VIVIANE = {
  de: "Viviane Chatelard",
  role: "Conductrice de travaux, Bâtiments Sirand",
} as const;
const FERREOL = { de: "Transports Ferréol", role: "Service commercial" } as const;

/** Un prix au centime près quand il n'est pas rond : « 83,7 € ». */
const prix = (v: number) => `${nombre(v, 1)} €`;

/** Les lignes du coût complet, par semaine, telles que le contrôle de gestion les présente. */
const LIGNES = {
  carburantAgglo: LIVRAISONS.agglo * VARIABLE.agglo,
  carburantLoin: LIVRAISONS.lointaines * VARIABLE.lointaines,
  cdi: CDI.nombre * CDI.semaine,
  interim: INTERIM.nombre * INTERIM.semaine,
  amortissement: PROPRES.nombre * PROPRES.amortissement,
  location: LOUES.nombre * LOUES.loyer,
} as const;

export const DIAGNOSTICS = [
  {
    id: "evitables",
    t: "Le coût complet mêle des coûts qui disparaîtraient avec le transporteur et d'autres qui resteraient : seuls les premiers se comparent à son prix",
  },
  {
    id: "lointaines",
    t: "Les tournées lointaines coûtent trop cher à faire soi-même : kilomètres, intérimaires, heures supplémentaires",
  },
  {
    id: "productivite",
    t: "Les chauffeurs ne font pas assez de livraisons par jour : la flotte est sous-employée",
  },
  {
    id: "flotte",
    t: "La flotte vieillit : il faut renouveler les porteurs pour faire baisser le coût par livraison",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "L'offre de Ventajol",
    jusqua: 2,
    messages: () => [
      {
        ...ANSELME,
        heure: "08:10",
        alerte: true,
        texte: `Maëlys, Transports Ventajol propose de reprendre toutes nos livraisons : ${euros(TARIFS.agglo)} en agglomération, ${euros(TARIFS.lointaines)} dans les zones lointaines. Apolline a fait le calcul : chez nous, une livraison coûte ${euros(COUT_COMPLET)} tout compris. Ça fait ${euros(ECONOMIE_AFFICHEE)} par semaine, plus de 50 k€ par trimestre. Je veux ta recommandation vendredi.`,
      },
      {
        ...MALO,
        heure: "09:00",
        texte:
          "Madame Tissier, comme convenu, notre offre est valable jusqu'à vendredi. Nous pouvons démarrer en semaine 3 : notre dépôt de Bourgoin est à vingt minutes de vos chantiers du Nord-Isère, et nos chauffeurs connaissent l'agglomération.",
      },
      {
        ...KAMEL,
        heure: "10:30",
        texte:
          "Au garage, tout le monde parle d'un transporteur qui reprendrait les tournées. Les gars veulent savoir s'ils gardent leur camion.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "couts",
        titre: `Décomposer le coût complet de ${euros(COUT_COMPLET)} avec Apolline`,
        cout: 1,
        nature: "decisive",
        resultat: `Par semaine, pour ${TOTAL_LIVRAISONS} livraisons : carburant, péages, pneus et entretien, ${euros(LIGNES.carburantAgglo)} en agglomération (${euros(VARIABLE.agglo)} par livraison) et ${euros(LIGNES.carburantLoin)} dans les zones lointaines (${euros(VARIABLE.lointaines)}) ; six chauffeurs en CDI, ${euros(LIGNES.cdi)} ; trois intérimaires, ${euros(LIGNES.interim)} ; heures supplémentaires des tournées lointaines, ${euros(HEURES_SUP_LOINTAINES)} ; amortissement des six porteurs achetés, ${euros(LIGNES.amortissement)} ; location des trois porteurs des zones lointaines, ${euros(LIGNES.location)} ; assurance de la flotte, ${euros(FIXES.assurance)} ; loyer du garage, ${euros(FIXES.garage)} ; encadrement, ${euros(FIXES.encadrement)} ; quote-part des frais du siège, ${euros(FIXES.structure)}. Total : ${euros(COUT_SEMAINE)}, soit ${euros(COUT_COMPLET)} par livraison.`,
      },
      {
        id: "contrats",
        titre: "Lire les contrats : chauffeurs, location, garage",
        cout: 1,
        nature: "decisive",
        resultat: `Les six chauffeurs en CDI font l'agglomération ; la direction exclut tout licenciement ce trimestre, et le quai n'aura pas de poste à leur offrir avant l'été. Les trois intérimaires tiennent les ${LIVRAISONS.lointaines} livraisons lointaines de la semaine : leur mission s'arrête avec une semaine de préavis, et les heures supplémentaires avec elle. La location des trois porteurs est ferme jusqu'à la fin de la semaine ${LOUES.finDeContrat} : ses loyers sont dus quoi qu'il arrive. Les six porteurs achetés ne se revendraient qu'au tiers de leur valeur comptable. Le bail du garage court jusqu'en 2029, l'assurance de la flotte est annuelle, et ni l'encadrement ni la quote-part du siège ne baisseraient.`,
      },
      {
        id: "tournee",
        titre: "Suivre une tournée lointaine",
        cout: 1,
        nature: "utile",
        resultat: `Avec Sacha, intérimaire, vers Bourgoin et La Tour-du-Pin : 190 km, six arrêts, retour au garage à 18 h 40. En agglomération, un chauffeur fait sept arrêts en 70 km. Sur les chantiers du Nord-Isère, ${taux(RETARDS.lointaines, 0)} des livraisons arrivent en retard, contre ${taux(RETARDS.agglo, 0)} en agglomération.`,
      },
      {
        id: "ratios",
        titre: "Comparer avec les autres plateformes du groupe",
        cout: 1,
        nature: "bruit",
        resultat: `Coût complet par livraison : 61 € à Saint-Priest, 68 € à Villefranche, ${euros(COUT_COMPLET)} à Corbas. Corbas est dans la moyenne du groupe.`,
      },
      {
        id: "conseil",
        titre: "Appeler Thérèse Aguettaz, votre ancienne cheffe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Thérèse : « Son prix, ne le compare pas à ton coût complet. Demande-toi ce qui disparaîtrait de tes comptes s'il roulait à ta place, et à partir de quand. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous pour vendredi ?",
    options: [
      {
        t: "Tout confier à Ventajol dès la semaine 3",
        d: `${euros(TARIFS.agglo)} et ${euros(TARIFS.lointaines)} la livraison, contre ${euros(COUT_COMPLET)} de coût complet : ${euros(ECONOMIE_AFFICHEE)} d'économie par semaine selon le calcul de la direction.`,
      },
      {
        t: "Lui confier les tournées lointaines dès la semaine 3, et garder l'agglomération",
        d: `${LIVRAISONS.lointaines} livraisons par semaine à ${euros(TARIFS.lointaines)} ; les missions des trois intérimaires s'arrêtent. L'agglomération reste aux six chauffeurs.`,
      },
      {
        t: "Tout garder en interne et décliner l'offre",
        d: "Rien ne change : la flotte continue de tout livrer.",
      },
      {
        t: "Attendre la fin de la location des porteurs, puis tout lui confier en semaine 7",
        d: "Plus de loyers pour des porteurs vides ; l'économie affichée commence un mois plus tard.",
      },
    ],
    reactions: [
      [
        {
          ...KAMEL,
          texte:
            "On nous dit qu'on reste salariés. Mais à partir de la semaine 3, sans tournée, on vient faire quoi ?",
        },
      ],
      [
        {
          ...SACHA,
          texte:
            "Ma mission s'arrête vendredi prochain. Dommage, je commençais à connaître les chantiers de l'Isère. Bonne continuation.",
        },
        {
          ...MALO,
          texte:
            "Nous prenons vos tournées lointaines lundi en semaine 3. Merci de votre confiance.",
        },
      ],
      [
        {
          ...ANSELME,
          texte: "Bon. Tu me montreras tes chiffres : je n'aime pas laisser 50 k€ sur la table.",
        },
      ],
      [
        {
          ...ANSELME,
          texte: "D'accord pour attendre la fin de la location. Mais en semaine 7, on bascule.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le contrat de Ventajol",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...MALO,
        heure: "11:00",
        alerte: true,
        texte: ctx.confie
          ? "Madame Tissier, voici nos trois formules pour les livraisons que vous nous confiez. Le contrat s'appliquera aussi à tout ce que vous nous donnerez ensuite, vos pointes comprises."
          : "Madame Tissier, même sans volume aujourd'hui, un contrat-cadre vous garantit nos prix et notre priorité le jour où vous aurez besoin de nous, dans vos pointes par exemple. Voici nos trois formules.",
      },
      {
        ...APOLLINE,
        heure: "14:30",
        texte:
          "Maëlys, Anselme veut un contrat signé lundi. Moi, je regarde le prix par livraison ; regarde le reste.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "references",
        titre: "Appeler deux clients de Ventajol",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un négoce de Vienne : « Très bien jusqu'au printemps dernier. Puis il a perdu quatre chauffeurs, partis chez un messager : pendant six semaines, un quart de nos livraisons en retard, et nos pointes refusées. » Un fabricant de menuiseries : « Il applique sa révision trimestrielle dès que le contrat le permet : +8 % l'an dernier. »",
      },
      {
        id: "penalites",
        titre: "Relire ce que vos clients facturent pour un retard",
        cout: 0.5,
        nature: "utile",
        resultat: `Les contrats-cadres des grands comptes prévoient ${euros(PENALITE_RETARD)} par livraison en retard : l'équipe qui attend sur le chantier. Bâtiments Sirand, votre plus gros client du Nord-Isère, va plus loin : ${euros(GRAND_COMPTE.penalite)}, 5 % de ses commandes du trimestre, si plus de ${taux(GRAND_COMPTE.seuil, 0)} de ses livraisons arrivent en retard sur les trois dernières semaines. C'est vous qui payez, quel que soit le transporteur.`,
      },
    ],
    question: "Quel contrat signez-vous ?",
    options: [
      {
        t: "Le prix le plus bas : 3 € de moins, contre 120 livraisons garanties par semaine",
        d: `${euros(prixContrat(0, "agglo"))} et ${euros(prixContrat(0, "lointaines"))} la livraison, prix ferme un an. Ce qui manque aux 120 livraisons est facturé quand même.`,
      },
      {
        t: "Le tarif proposé, sans engagement de volume",
        d: `${euros(prixContrat(1, "agglo"))} et ${euros(prixContrat(1, "lointaines"))} la livraison, révisables chaque trimestre.`,
      },
      {
        t: "Un engagement de service : 2 € de plus, prix ferme, retards pénalisés",
        d: `${euros(prixContrat(2, "agglo"))} et ${euros(prixContrat(2, "lointaines"))} pendant un an ; au-delà de ${taux(SERVICE.seuil, 0)} de retards, Ventajol vous verse ${euros(SERVICE.penalite)} par livraison en retard.`,
      },
      {
        t: "Pas de contrat : faire appel à lui au coup par coup",
        d: `Au tarif du jour, ${euros(prixContrat(3, "agglo"))} et ${euros(prixContrat(3, "lointaines"))}, sans priorité quand il est chargé.`,
      },
    ],
    reactions: [
      [
        {
          ...MALO,
          texte: "Contrat signé : 120 livraisons par semaine au minimum. Nous sommes ravis.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "Contrat signé. Nos tarifs sont révisables chaque trimestre, comme pour tous nos clients.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "Nous signons. Nos retards seront suivis chaque semaine : c'est notre intérêt autant que le vôtre.",
        },
      ],
      [
        {
          ...MALO,
          texte: "Comme vous voudrez. Appelez-nous la veille, nous ferons au mieux.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La location des porteurs arrive à échéance",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ARSENE,
        heure: "09:15",
        alerte: true,
        texte: `Madame Tissier, la location de vos trois porteurs s'achève à la fin de la semaine ${LOUES.finDeContrat}. Nous vous proposons de la renouveler pour quatre ans avec 8 % de remise : ${euros(LOUES.renouvele)} par semaine et par porteur au lieu de ${euros(LOUES.loyer)}. Sans réponse, elle se prolonge au tarif courte durée, ${euros(LOUES.courteDuree)}.`,
      },
      {
        ...SEYDOU,
        heure: "10:40",
        texte: ctx.lointainesConfiees
          ? `Les trois porteurs loués dorment au garage depuis que Ventajol fait l'Isère. Mais leurs grues, on les a payées ${euros(LOUES.amenagements)} en 2022 : les rendre, c'est jeter cet argent.`
          : `Les trois porteurs loués tournent bien. Et leurs grues, on les a payées ${euros(LOUES.amenagements)} en 2022 : les rendre, c'est jeter cet argent.`,
      },
      {
        ...ANSELME,
        heure: "17:05",
        texte: "Tu me dis lundi ce qu'on fait des porteurs ?",
      },
    ],
    sources: [
      {
        id: "evitable",
        titre: "Recalculer ce qu'une livraison lointaine coûtera à partir de la semaine 7",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `À son échéance, la location devient un coût évitable. Faite par la flotte, une livraison lointaine coûterait alors ${euros(VARIABLE.lointaines)} de carburant et de péages, ${prix((INTERIM.nombre * INTERIM.semaine) / LIVRAISONS.lointaines)} d'intérimaires, ${prix(HEURES_SUP_LOINTAINES / LIVRAISONS.lointaines)} d'heures supplémentaires et ${prix((LOUES.nombre * LOUES.loyer) / LIVRAISONS.lointaines)} de location : ${prix(EVITABLE_LOINTAINE_APRES)} qui disparaissent si elle est confiée. Ventajol la fait à ${ctx.prixLointaines}.${
            ctx.lointainesConfiees
              ? ` Les tournées lointaines sont déjà confiées : garder les trois porteurs, c'est payer leur loyer pour qu'ils restent au garage.`
              : ""
          }`,
      },
      {
        id: "amenagements",
        titre: "Demander à la comptabilité ce que valent les grues",
        cout: 0.5,
        nature: "utile",
        resultat: `Les grues et les plateaux, ${euros(LOUES.amenagements)} payés à la signature en 2022, ont été amortis sur la durée du contrat. Cet argent est dépensé, que vous renouveliez ou non : le loueur ne les reprend pas, et ne les refacture pas non plus.`,
      },
    ],
    question: "Que faites-vous des trois porteurs loués ?",
    options: [
      {
        t: "Renouveler pour quatre ans, avec la remise de 8 %",
        d: `${euros(LOUES.renouvele)} par semaine et par porteur ; les grues payées en 2022 continuent de servir.`,
      },
      {
        t: "Rendre les porteurs et confier les tournées lointaines à Ventajol",
        d: "Plus de loyers à partir de la semaine 7 ; les tournées lointaines au tarif du contrat, si ce n'est déjà fait.",
      },
      {
        t: "Prolonger trois mois au tarif courte durée, et décider plus tard",
        d: `${euros(LOUES.courteDuree)} par semaine et par porteur ; les porteurs restent à disposition.`,
      },
    ],
    reactions: [
      [{ ...ARSENE, texte: "Merci de votre confiance : contrat renouvelé pour quatre ans." }],
      [
        {
          ...SEYDOU,
          texte: `Les porteurs partent à la fin de la semaine ${LOUES.finDeContrat}. Je démonte nos outillages et je range le garage.`,
        },
      ],
      [
        {
          ...ARSENE,
          texte: "C'est noté : prolongation au tarif courte durée jusqu'à la fin du trimestre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "La pointe de printemps",
    jusqua: 8,
    messages: () => [
      {
        ...AURELE,
        heure: "08:30",
        alerte: true,
        texte:
          "Les chantiers redémarrent : les commerciaux annoncent 20 à 40 % de livraisons en plus en agglomération, des semaines 8 à 10. Je compte sur vous pour qu'aucun client n'attende.",
      },
      {
        ...NOUR,
        heure: "11:15",
        texte: `Avec six chauffeurs, on passe 216 livraisons par semaine en agglomération, près de 250 avec les heures supplémentaires. Au-delà, ça part le lendemain.`,
      },
      {
        ...KAMEL,
        heure: "16:50",
        texte:
          "Les samedis, on veut bien, s'ils sont payés. Mais trois semaines d'affilée, on va le sentir.",
      },
    ],
    sources: [
      {
        id: "pointe",
        titre: "Reprendre ce qu'a coûté la pointe de l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'an dernier, la flotte a tout fait elle-même. Une livraison de plus en semaine coûtait ${euros(HEURES_SUP.cout)} d'heures majorées, le samedi ${euros(SAMEDIS.cout)}, carburant en plus ; avec la fatigue, les retards de l'agglomération étaient passés de ${taux(RETARDS.agglo, 0)} à ${taux(RETARDS.agglo + SAMEDIS.retard, 0)}, à ${euros(PENALITE_RETARD)} pièce. Les salaires des chauffeurs, eux, étaient payés de toute façon : ce n'est pas eux qui ont coûté.`,
      },
      {
        id: "capacite",
        titre: "Demander à Ventajol ce qu'il pourra prendre",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.priorite
            ? `Malo : « Vous êtes sous contrat, vous passez en priorité, à ${ctx.prixAgglo} la livraison. Mais tout le monde a la même pointe : je prendrai l'essentiel, pas forcément tout. »`
            : `Malo : « Sans contrat, je vous prendrai ce qui reste quand mes clients sous contrat seront servis, à ${ctx.prixAgglo}. Au printemps, il ne reste pas grand-chose. »`,
      },
    ],
    question: "Comment passez-vous la pointe ?",
    options: [
      {
        t: "Heures supplémentaires et samedis : nos chauffeurs sont déjà payés",
        d: `Jusqu'à ${HEURES_SUP.livraisons + SAMEDIS.livraisons} livraisons de plus par semaine, en heures majorées.`,
      },
      {
        t: "Confier le surplus à Ventajol",
        d: "Au tarif de votre contrat, ou au tarif du jour sans contrat.",
      },
      {
        t: "Deux équipages de renfort pendant trois semaines",
        d: `Deux intérimaires à ${euros(RENFORT.interim / 2)} par semaine, sur des porteurs loués ${euros(RENFORT.location / 2)} la semaine, ou sur les vôtres s'ils sont libres. ${RENFORT.livraisons} livraisons de plus.`,
      },
      {
        t: "Ne rien prévoir : ce qui ne passe pas part le lendemain",
        d: "Aucun coût d'avance.",
      },
    ],
    reactions: [
      [{ ...KAMEL, texte: "On fera les samedis. Mais le lundi, on démarrera déjà fatigués." }],
      [
        {
          ...NOUR,
          texte: "Chaque soir, j'enverrai à Ventajol ce qui dépasse. On verra ce qu'il prend.",
        },
      ],
      [
        {
          ...GISELE,
          texte:
            "Deux chauffeurs intérimaires commencent en semaine 8, tous deux habilités à la grue.",
        },
      ],
      [
        {
          ...NOUR,
          texte:
            "D'accord. Je préviens les commerciaux : certaines livraisons glisseront au lendemain.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le coût complet monte",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...APOLLINE,
        heure: "09:00",
        alerte: true,
        texte: ctx.coutCompletAgglo
          ? `Maëlys, j'ai mis à jour le coût complet : une livraison d'agglomération faite par la flotte revient à ${ctx.coutCompletAgglo} cette semaine, contre ${euros(COUT_COMPLET_AGGLO)} au début du trimestre. Ventajol la fait à ${ctx.prixAgglo}.`
          : `Maëlys, la flotte ne livre plus rien en agglomération : tout le coût de la plateforme repose maintenant sur Ventajol, à ${ctx.prixAgglo} la livraison, et sur des chauffeurs qui attendent.`,
      },
      {
        ...ANSELME,
        heure: "09:20",
        texte: ctx.coutCompletAgglo
          ? "Tu vois : chez nous, ça monte, chez lui, ça ne bouge pas. Je propose de lui confier aussi l'agglomération dès la semaine 10."
          : "Il faudra bien que ces chauffeurs servent à quelque chose. On en reparle au comité.",
      },
    ],
    sources: [
      {
        id: "repartition",
        titre: "Demander à Apolline d'où vient la hausse",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Apolline : « Rien n'a changé dans ce que coûte une livraison de plus ou de moins en agglomération : ${euros(VARIABLE.agglo)} de carburant et d'usure ; les six chauffeurs et les porteurs achetés sont payés de toute façon. Ce qui change, c'est la répartition : les ${euros(FIXES_COMMUNS)} hebdomadaires de garage, d'assurance, d'encadrement et de siège se partageaient entre ${TOTAL_LIVRAISONS} livraisons ; ${
            ctx.lointainesConfiees
              ? "elles ne se partagent plus qu'entre celles de l'agglomération"
              : "la pointe et ses heures supplémentaires s'y ajoutent"
          }${ctx.louesLibres ? ", avec le loyer des porteurs loués qui ne roulent plus" : ""}. »`,
      },
      {
        id: "drh",
        titre: "Redemander à Gisèle ce que deviendraient les chauffeurs",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Gisèle : « Rien n'a changé : pas de licenciement ce trimestre, pas de poste au quai avant l'été. Si l'agglomération part, les six chauffeurs restent payés, à attendre au dépôt. »",
      },
    ],
    question: "Que répondez-vous à Anselme ?",
    options: [
      {
        t: "Confier aussi l'agglomération à Ventajol dès la semaine 10",
        d: "Au tarif du contrat, sous le coût complet que calcule Apolline.",
      },
      {
        t: "Garder l'agglomération : comparer son prix au seul coût évitable",
        d: "La flotte continue de livrer l'agglomération.",
      },
      {
        t: "Lui confier la moitié de l'agglomération, l'ouest lyonnais, pour essayer",
        d: `${LIVRAISONS.agglo / 2} livraisons par semaine au tarif du contrat ; la moitié des chauffeurs garde une tournée.`,
      },
    ],
    reactions: [
      [
        {
          ...KAMEL,
          texte: "Le camion reste au garage, et moi je viens faire quoi ? Du rangement ?",
        },
      ],
      [{ ...ANSELME, texte: "Bon. Tu présenteras ça au comité, avec tes chiffres." }],
      [
        {
          ...KAMEL,
          texte: "Un jour sur deux, on attend au dépôt qu'une tournée se libère.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le transporteur dérape",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...VIVIANE,
        heure: "08:05",
        alerte: true,
        texte: `Madame Tissier, ${ctx.retardLointaines} de vos livraisons sur nos chantiers du Nord-Isère sont arrivées en retard cette semaine. Je vous rappelle notre contrat-cadre : au-delà de ${taux(GRAND_COMPTE.seuil, 0)} sur les trois dernières semaines du trimestre, nous appliquons la pénalité de 5 % de nos commandes.`,
      },
      {
        ...NOUR,
        heure: "10:20",
        texte: ctx.confie
          ? `Ventajol est à ${ctx.retardTransporteur} de retards cette semaine : il a perdu des chauffeurs.${
              ctx.hausse
                ? " Et son courrier est arrivé : +9 % à partir de la semaine 11, au titre de la révision trimestrielle."
                : ""
            }`
          : `Ventajol ne livre rien pour nous, mais ses clients se plaignent : ${ctx.retardTransporteur} de retards cette semaine.`,
      },
      {
        ...ANSELME,
        heure: "12:00",
        texte: "Sirand, c'est notre plus gros client en Isère. Qu'est-ce que tu fais ?",
      },
    ],
    sources: [
      {
        id: "suivi",
        titre: "Lire le suivi des retards de Ventajol, semaine par semaine",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Ses retards sont passés de ${taux(RETARDS.transporteur, 0)} à ${ctx.retardTransporteur}${
            ctx.derapage ? ` depuis la semaine ${ctx.derapage}` : ""
          } : quatre chauffeurs partis chez un messager, et des recrutements sans date. ${
            ctx.service
              ? `Votre engagement de service lui fait reverser ${euros(SERVICE.penalite)} par livraison en retard au-delà de ${taux(SERVICE.seuil, 0)} ; la pénalité de Sirand, elle, resterait pour vous.`
              : "Votre contrat ne prévoit rien sur ses retards : ce que vos clients facturent reste pour vous."
          }`,
      },
      {
        id: "second",
        titre: "Demander une offre à Transports Ferréol",
        cout: 0.5,
        nature: "utile",
        resultat: `Transports Ferréol peut reprendre dès la semaine 11 la moitié des tournées lointaines, dont tous les chantiers de Sirand : ${euros(SECOND.lointaines)} la livraison, et ${euros(SECOND.miseEnPlace)} de mise en place (repérage des chantiers, une semaine en doublon). Ses retards : ${taux(RETARDS.transporteur, 0)}.`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Laisser faire : il va recruter",
        d: "Rien ne change.",
      },
      {
        t: "Mettre Ventajol en demeure : un plan de redressement sous huit jours",
        d: "Un point chaque matin sur vos tournées ; s'il ne suit pas, mise en concurrence au trimestre prochain.",
      },
      {
        t: "Reprendre les tournées lointaines en interne dès la semaine 11",
        d: "Trois intérimaires, et trois porteurs loués à la semaine si les vôtres sont partis.",
      },
      {
        t: "Confier la moitié des tournées lointaines, dont Sirand, à un second transporteur",
        d: `Transports Ferréol, à ${euros(SECOND.lointaines)} la livraison, et ${euros(SECOND.miseEnPlace)} de mise en place.`,
      },
    ],
    reactions: [
      [
        {
          ...NOUR,
          texte:
            "Les retards continuent. Les conducteurs de travaux de Sirand m'appellent directement, maintenant.",
        },
      ],
      null,
      [
        {
          ...GISELE,
          texte: "Trois chauffeurs intérimaires commencent lundi en semaine 11.",
        },
      ],
      [
        {
          ...FERREOL,
          texte:
            "Nous reprenons lundi les chantiers de Bâtiments Sirand et la moitié de vos tournées lointaines.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Comparer aux coûts évitables", chemin: [1, 2, 1, 1, 1, 1] },
  { nom: "Suivre le coût complet", chemin: [0, 0, 1, 1, 0, 0] },
  { nom: "Attentiste", chemin: [2, 3, 2, 3, 1, 0] },
] as const;

/**
 * Les réflexes du métier : comparer un prix au coût complet, ou raisonner sur
 * un coût déjà engagé au lieu de celui qu'on peut encore éviter. [décision, option]
 *
 *   · tout confier, tout de suite ou à l'échéance de la location : le prix
 *     est sous le coût complet, pas sous le coût évitable ;
 *   · le prix unitaire le plus bas contre un volume garanti : un coût fixe
 *     de plus, créé pour gagner 3 € ;
 *   · renouveler la location pour ne pas « jeter » les grues déjà payées ;
 *   · les samedis parce que les chauffeurs sont « déjà payés » : ce qui coûte,
 *     ce sont les heures majorées et la fatigue, pas leur salaire ;
 *   · confier l'agglomération parce que son coût complet monte, quand seule
 *     la répartition des frais communs a changé.
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
] as const;

export const REPONSES = {
  redressement:
    "Vous avez raison. Deux chauffeurs embauchés cette semaine, nos meilleurs sur vos tournées dès la semaine 12, et notre révision de prix est suspendue pour vous.",
  refus:
    "Je comprends votre position. Mais je n'aurai personne de plus avant le mois prochain : nous faisons au mieux.",
  derapage: (retard: string) =>
    `Ventajol a perdu des chauffeurs : ${retard} de ses livraisons pour nous sont arrivées en retard cette semaine.`,
  hausse:
    "Révision trimestrielle : nos tarifs augmentent de 9 % à partir de la semaine 11, conformément à votre contrat.",
  sirand: `Sur les trois dernières semaines, plus de ${taux(GRAND_COMPTE.seuil, 0)} de vos livraisons sur nos chantiers sont arrivées en retard. La pénalité de notre contrat-cadre s'applique : ${euros(GRAND_COMPTE.penalite)}, déduits de votre prochaine facture.`,
} as const;
