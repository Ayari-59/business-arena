/**
 * LA FACTURE D'ÉNERGIE DE L'USINE — le contenu de l'épisode.
 *
 * Djibril Ouedraogo est responsable énergie et travaux neufs de la Laiterie de
 * Kerbrélan. La facture d'électricité et de gaz de l'usine de Loudéac est
 * passée de 2,9 à 5,1 M€ en deux ans. Le directeur financier veut signer un
 * prix fixe sur trois ans pour tout le volume, au niveau actuel ; la
 * production propose d'arrêter une ligne aux heures les plus chères. Juillet
 * commence, avec les groupes froids à plein régime et une canicule possible.
 * Six décisions, chacune précédée de ce qu'un responsable énergie d'usine
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  ACHEMINEMENT,
  AIR,
  BUDGET,
  CONTRAT,
  COUTS,
  DERIVE,
  ECART_HEURES,
  ECLAIRAGE,
  ECONOMIE_LIGNE,
  ELEC,
  ELEC_AN,
  FROID,
  FUITES_KW,
  GAZ_AN,
  GAZ_NEP,
  GAZ_VAPEUR,
  HEURES_AN,
  INVESTISSEMENTS,
  LED,
  LIGNE,
  MARGE_INDEXE,
  PERTE_PANNE,
  POMPE,
  PREPARATION,
  PRIX_ELEC,
  PRIX_GAZ,
  PROCESS,
  PROFIL,
  RECUPERATION,
  REGLAGES,
  RELEVE_FROID,
  RETOUR_FUITES,
  TERME_SUIVANTS,
  TOURNEE,
  UTILITES,
} from "@/engine/episodes/energie-de-l-usine";
import { euros, kE, nombre, taux } from "./format";

export const DIAGNOSTICS = [
  {
    id: "usages",
    t: "Personne ne sait où part l'énergie : le froid, l'eau chaude des nettoyages et un air comprimé qui fuit font l'essentiel de la consommation, et rien n'est mesuré usage par usage",
  },
  {
    id: "prix",
    t: "C'est le prix : la facture a suivi le marché de gros, et le contrat indexé y expose l'usine",
  },
  {
    id: "heures",
    t: "Les lignes tournent aux heures où l'électricité est la plus chère",
  },
  {
    id: "vetuste",
    t: "Les équipements sont vétustes : sans remplacer les groupes froids et les compresseurs, rien ne bougera",
  },
] as const;

const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const GURVAN = { de: "Gurvan Kerebel", role: "Responsable de production de Loudéac" } as const;
const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
const ERWANN = {
  de: "Erwann Tromeur",
  role: "Chef de l'atelier de conditionnement de Loudéac",
} as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const BRIVAEL = { de: "Brivael Kerivel", role: "Technicien des utilités" } as const;
const HILARION = { de: "Hilarion Le Hir", role: "Chargé d'affaires, Kervolt Énergie" } as const;
const LAVINIA = { de: "Lavinia Petrescu", role: "Chargée d'affaires, Thermaval" } as const;
const BARTOSZ = { de: "Bartosz Wójcik", role: "Ingénieur, Énerlys Conseil" } as const;
const TABLEAU = { de: "Suivi énergie", role: "Point hebdomadaire" } as const;

/** Un nombre de MWh, arrondi. */
const mwh = (v: number) => `${nombre(v, 0)} MWh`;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "La facture a presque doublé",
    jusqua: 2,
    messages: () => [
      {
        ...IWAN,
        heure: "08:05",
        alerte: true,
        texte: `Djibril, la facture d'énergie de Loudéac est passée de 2,9 à 5,1 M€ en deux ans. Kervolt Énergie nous propose un prix fixe sur trois ans, au niveau actuel, pour tout notre volume d'électricité : je veux le signer avant la fin de l'été, et ne plus avoir de surprise. Le budget du trimestre est de ${kE(BUDGET)}, tout compris.`,
      },
      {
        ...GURVAN,
        heure: "08:40",
        texte:
          "Les fins de journée sont les heures les plus chères. Je peux arrêter la ligne 5 de 17 à 21 heures et rattraper le samedi. Dis-moi si on y va dès la semaine prochaine.",
      },
      {
        ...EFFLAM,
        heure: "09:15",
        texte:
          "Le comité de direction attend un plan pour l'énergie à la rentrée. Deux limites : on ne touche ni à la sécurité des aliments ni au taux de service des enseignes.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "releves",
        titre: "Relever les sous-compteurs existants, et l'usine un dimanche, lignes arrêtées",
        cout: 1,
        nature: "decisive",
        resultat: `Les six sous-compteurs posés il y a deux ans n'avaient jamais été relevés. Une semaine d'été, l'électricité se répartit ainsi : froid ${mwh(FROID)} (${taux(FROID / ELEC, 0)}), process ${mwh(PROCESS)}, air comprimé ${mwh(AIR)}, utilités ${mwh(UTILITES)}, soit ${mwh(ELEC)}. Le gaz : ${mwh(GAZ_NEP)} pour l'eau chaude des nettoyages en place, ${mwh(GAZ_VAPEUR)} pour la vapeur des pasteurisateurs. Les compresseurs consomment ${mwh(Math.round(AIR * 52))} par an. Le dimanche, lignes arrêtées et aucun nettoyage en cours, ils appellent encore ${FUITES_KW} kW : c'est ce que perd le réseau, qui reste sous pression ${nombre(HEURES_AN, 0)} heures par an.`,
      },
      {
        id: "facture",
        titre: "Décomposer la facture et le contrat d'électricité",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur les douze derniers mois : ${mwh(ELEC_AN)} d'électricité et ${mwh(GAZ_AN)} de gaz. L'électricité revient à ${nombre(PRIX_ELEC, 0)} €/MWh tout compris : ${ACHEMINEMENT} € d'acheminement et de taxes, le reste indexé sur la moyenne mensuelle du marché de gros (le prix de base × ${nombre(PROFIL, 2)} pour la forme de consommation de l'usine, plus ${MARGE_INDEXE} € de marge). Le gaz est à prix fixe, ${PRIX_GAZ} €/MWh tout compris, jusqu'à la fin de l'an prochain. L'heure de consommation ne change pas le prix de la fourniture : seul l'acheminement distingue les heures pleines des heures creuses, de ${ECART_HEURES} €/MWh en été.`,
      },
      {
        id: "ligne",
        titre: "Chiffrer avec Gurvan l'arrêt de la ligne 5 aux heures chères",
        cout: 0.5,
        nature: "utile",
        resultat: `La ligne 5 appelle ${nombre(LIGNE.puissance, 2)} MW. Arrêtée de 17 à 21 heures, cinq jours sur sept : ${LIGNE.heures} heures, ${nombre(LIGNE.puissance * LIGNE.heures, 1)} MWh consommés à d'autres heures, qui ne font gagner que l'écart d'acheminement : ${euros(ECONOMIE_LIGNE)} par semaine. Ce qu'on ne produit pas se rattrape le samedi en heures majorées (${euros(LIGNE.heuresDecalees)} par semaine), et pas entièrement : les yaourts aromatisés ne se produisent pas d'avance, leur DLC ne le permet pas. Ysée Bescond estime les pénalités logistiques et les ventes perdues à ${euros(LIGNE.ruptures)} par semaine.`,
      },
      {
        id: "ratios",
        titre: "Comparer la consommation par tonne à celle d'autres laiteries",
        cout: 1,
        nature: "bruit",
        resultat:
          "Loudéac consomme 0,33 MWh par tonne de produits finis ; le panel régional des laiteries de produits frais va de 0,28 à 0,41. Rien d'anormal à première vue.",
      },
      {
        id: "conseil",
        titre:
          "Appeler Gweltaz Le Gac, conseiller énergie de la chambre de commerce et d'industrie",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gweltaz Le Gac : « Dans une laiterie, l'argent part dans le froid, l'eau chaude et l'air comprimé. Mesurez usage par usage avant de toucher au contrat : on ne couvre bien que ce qu'on sait consommer. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle est votre première décision ?",
    options: [
      {
        t: "Arrêter la ligne 5 de 17 à 21 heures, aux heures les plus chères",
        d: "La proposition de Gurvan, de la semaine 2 à la fin août. Rattrapage le samedi. Effet immédiat sur les heures chères.",
      },
      {
        t: "Lancer une campagne de sous-comptage par usage et de détection des fuites",
        d: `Des compteurs sur le froid, l'eau chaude des NEP, l'air comprimé et la vapeur, et une tournée aux ultrasons. ${euros(COUTS.campagne)}, premiers relevés en fin de semaine.`,
      },
      {
        t: "Commander un audit énergétique complet à un bureau d'études",
        d: `Un rapport complet, avec un plan d'action chiffré. ${euros(COUTS.audit)}, remis en semaine 5.`,
      },
      {
        t: "Se concentrer sur le contrat : c'est le prix qui a fait la facture",
        d: "Préparer la signature avec Iwan. Rien ne change à l'usine d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...ERWANN,
          texte:
            "La ligne 5 s'arrête à 17 heures. Pour le samedi, j'ai six volontaires sur dix : on ne rattrapera pas tout.",
        },
      ],
      [
        {
          ...BRIVAEL,
          texte:
            "Les compteurs sont posés et la tournée aux ultrasons est faite. J'ai réparé en passant les plus grosses fuites : un raccord de la ligne 3 sifflait depuis des mois.",
        },
      ],
      [
        {
          ...BARTOSZ,
          texte:
            "Nous commençons les relevés lundi. Vous aurez le rapport et le plan d'action en semaine 5.",
        },
      ],
      [
        {
          ...IWAN,
          texte: "Bien. Je relance Kervolt pour l'offre à trois ans.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les premiers relevés",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...KLERVI,
        heure: "10:20",
        alerte: true,
        texte: ctx.campagne
          ? "Les relevés sont là. Mon équipe peut réparer les fuites étiquetées et reprendre les réglages en deux semaines, si on me donne le budget."
          : "Sans relevés, je ne sais pas par où commencer. Le dimanche, on entend des fuites partout ; lesquelles comptent, je n'en sais rien.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Électricité consommée cette semaine : ${ctx.elec}. Prix de l'électricité au contrat indexé : ${ctx.prix}. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "campagne",
        titre: "Lire les résultats de la tournée des fuites et des relevés",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.campagne
            ? `214 fuites repérées et étiquetées : raccords, purges bloquées ouvertes, flexibles poreux ; 40 d'entre elles font les deux tiers de la puissance perdue. Le réseau est réglé à 7,5 bars quand les machines en demandent 6,5. Les groupes froids tournent à haute pression fixe toute l'année. Douze purgeurs de vapeur sur quarante fuient. Réparer et régler : ${euros(COUTS.reglages)}, deux semaines. Klervi compte supprimer ${taux(REGLAGES.fuitesMesure, 0)} des fuites, ${taux(REGLAGES.hpMesure, 0)} de l'électricité du froid et ${taux(REGLAGES.purgeursMesure, 0)} de la vapeur.`
            : `Sans relevés par usage ni tournée aux ultrasons, l'équipe de Klervi peut chercher les fuites à l'oreille un dimanche et reprendre les réglages à l'estime : ${euros(COUTS.reglages)}, deux semaines. D'expérience, on trouve ainsi un tiers des fuites, et la moitié de ce que donneraient des réglages mesurés.`,
      },
      {
        id: "compresseur",
        titre: "Demander une offre pour un compresseur à vitesse variable",
        cout: 0.5,
        nature: "utile",
        resultat: `Un compresseur à vitesse variable : ${euros(INVESTISSEMENTS.compresseur.montant)}, livré en semaine 10. Il produit le même air avec ${taux(INVESTISSEMENTS.compresseur.gain, 0)} d'électricité en moins. Les fuites, il les alimente aussi.`,
      },
    ],
    question: "Que traitez-vous en premier ?",
    options: [
      {
        t: "Réparer les fuites et reprendre les réglages",
        d: `Fuites d'air, pression du réseau, haute pression des groupes froids, purgeurs de vapeur. ${euros(COUTS.reglages)}, effet dès la semaine 4.`,
      },
      {
        t: "Remplacer un compresseur par un compresseur à vitesse variable",
        d: `${euros(INVESTISSEMENTS.compresseur.montant)} d'investissement, livré en semaine 10. ${taux(INVESTISSEMENTS.compresseur.gain, 0)} d'électricité en moins sur l'air comprimé.`,
      },
      {
        t: "Envoyer une note à tous les ateliers : éteindre, fermer, signaler les fuites",
        d: `Une affiche par atelier et un message du directeur industriel. ${euros(COUTS.note)}.`,
      },
      {
        t: "Attendre le nouveau contrat : c'est le prix qui fait la facture",
        d: "Rien ne change à l'usine.",
      },
    ],
    reactions: [
      [
        {
          ...KLERVI,
          texte:
            "Fuites réparées, réseau à 6,5 bars, haute pression flottante sur les groupes froids, purgeurs changés. Le dimanche, les compresseurs s'arrêtent enfin de temps en temps.",
        },
      ],
      [
        {
          ...KLERVI,
          texte: "Commande passée. Le compresseur arrive en semaine 10.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "La note est affichée dans tous les ateliers. Deux opérateurs ont signalé une fuite chacun.",
        },
      ],
      [
        {
          ...KLERVI,
          texte: "D'accord. On continue comme avant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Une canicule s'annonce",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...EFFLAM,
        heure: "08:30",
        alerte: true,
        texte:
          "Les prévisions annoncent une vague de chaleur possible dans les prochaines semaines. L'été dernier, on a eu chaud pour les chambres froides. Qu'est-ce qu'on prévoit ?",
      },
      {
        ...GURVAN,
        heure: "10:45",
        texte:
          "Pendant la canicule, on pourrait remonter les chambres froides de 4 à 6 °C : les groupes souffleraient, et la facture aussi. Les produits sortent du tunnel à 4 °C de toute façon.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Électricité consommée cette semaine : ${ctx.elec}. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus.`,
      },
    ],
    sources: [
      {
        id: "qualite",
        titre: "Demander à Annaïg ce que dit le plan de maîtrise sanitaire",
        cout: 0.5,
        nature: "decisive",
        resultat: `Annaïg Le Dantec : « Nos durées de vie, de 24 à 35 jours, ont été validées par des études de vieillissement avec un stockage à 4 °C. À 6 °C, elles ne sont plus garanties, et les enseignes exigent de recevoir les produits avec au moins les deux tiers de leur DLC. Remonter la consigne économiserait ${taux(RELEVE_FROID, 0)} du froid, deux à trois mille euros par semaine. Le plan de maîtrise sanitaire ne le permet pas : si un autocontrôle de fin de vie est non conforme, les lots sont bloqués ; si un lot livré est en cause, c'est un retrait-rappel. »`,
      },
      {
        id: "groupes",
        titre: "Faire le point avec Klervi sur les groupes froids",
        cout: 0.5,
        nature: "decisive",
        resultat: `Klervi Nédélec : « Deux étés sur les trois derniers, un groupe froid a décroché pendant une vague de chaleur : condenseurs encrassés, haute pression en sécurité. Une panne de deux jours en pleine canicule, c'est une chambre de produits finis à déclasser et des ruptures : environ ${kE(PERTE_PANNE)}. Nettoyer les condenseurs, poser des rideaux à lanières, pré-refroidir l'air des condenseurs et produire l'eau glacée la nuit : ${euros(COUTS.preparation)} ; le risque de panne en est plus que divisé par deux, et le froid consomme ${taux(PREPARATION.froid, 0)} de moins, ${taux(PREPARATION.canicule, 0)} de plus pendant la canicule. Un groupe mobile de secours, raccordé six semaines, coûte ${euros(COUTS.location)} et reprend une panne en quelques heures. »`,
      },
      {
        id: "meteo",
        titre: "Lire les prévisions saisonnières et l'historique du marché en canicule",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les prévisionnistes donnent environ une chance sur quatre à une forte canicule (trois semaines), quatre sur dix à une vague modérée (deux semaines), le reste à un été ordinaire. Pendant les dernières canicules, le prix de gros de l'électricité a monté de 30 à 70 %, et le froid de l'usine de 15 à 30 %.",
      },
    ],
    question: "Comment préparez-vous l'usine ?",
    options: [
      {
        t: "Remonter de 2 °C les consignes des chambres froides pendant la canicule",
        d: `La proposition de Gurvan. Environ ${taux(RELEVE_FROID, 0)} de froid en moins pendant quatre semaines. Aucun coût.`,
      },
      {
        t: "Préparer les groupes froids à la canicule",
        d: `Condenseurs nettoyés, rideaux à lanières, pré-refroidissement, eau glacée produite la nuit. ${euros(COUTS.preparation)}.`,
      },
      {
        t: "Préparer les groupes froids et louer un groupe mobile de secours",
        d: `La préparation, et un groupe de secours raccordé six semaines. ${euros(COUTS.preparation + COUTS.location)} en tout.`,
      },
      {
        t: "Ne rien changer : les groupes ont tenu l'an dernier",
        d: "Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          ...ANNAIG,
          texte:
            "Je note par écrit mon désaccord : la consigne de 4 °C fait partie du plan de maîtrise sanitaire. Je renforce les autocontrôles de fin de vie.",
        },
      ],
      [
        {
          ...KLERVI,
          texte:
            "Condenseurs nettoyés, rideaux posés, l'eau glacée se fait la nuit. Les groupes sont prêts.",
        },
      ],
      [
        {
          ...KLERVI,
          texte:
            "Préparation faite, et le groupe de secours est raccordé derrière la chambre 3. On dormira mieux.",
        },
      ],
      [
        {
          ...GURVAN,
          texte: "On verra bien. Ils ont tenu l'an dernier.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "La chaleur des groupes froids",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...LAVINIA,
        heure: "09:00",
        alerte: true,
        texte: `Monsieur Ouedraogo, voici notre offre de récupération de chaleur sur les condenseurs de vos groupes froids, pour préchauffer l'eau des NEP : ${kE(INVESTISSEMENTS.recuperation.montant)}. Le dossier de certificats d'économies d'énergie doit partir avant la fin du mois. Nous proposons aussi une version avec pompe à chaleur haute température, qui couvrirait ${taux(INVESTISSEMENTS.pompe.gain, 0)} des NEP.`,
      },
      {
        ...EFFLAM,
        heure: "11:30",
        texte:
          "Le comité aime l'idée de la pompe à chaleur : c'est de la décarbonation qu'on peut montrer aux enseignes. Iwan, lui, veut un délai de récupération.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Électricité consommée cette semaine : ${ctx.elec}. Prix de l'électricité au contrat indexé : ${ctx.prix}. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus.`,
      },
    ],
    sources: [
      {
        id: "nep",
        titre: "Comparer l'offre aux besoins d'eau chaude des NEP",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.mesure
            ? `Les relevés de l'eau chaude des NEP sont nets : ${mwh(GAZ_NEP)} de gaz par semaine, surtout en fin de poste, quand les groupes froids tournent encore. La chaleur des condenseurs en couvrirait ${taux(INVESTISSEMENTS.recuperation.gain, 0)} : ${mwh(RECUPERATION.gazEvite)} de gaz évités par an, ${kE(RECUPERATION.gain)} à ${PRIX_GAZ} €/MWh. Investissement : ${kE(INVESTISSEMENTS.recuperation.montant)}, dont ${kE(INVESTISSEMENTS.recuperation.aide)} de certificats d'économies d'énergie attendus. Délai de récupération : ${nombre(RECUPERATION.delai, 1)} ans ; sur dix ans à 8 %, l'annuité est de ${kE(RECUPERATION.annuite)}.`
            : `Sans relevés de l'eau chaude des NEP, Thermaval a dimensionné l'installation sur la puissance des groupes froids : elle promet ${taux(INVESTISSEMENTS.recuperation.gain, 0)} du gaz des NEP (${mwh(GAZ_NEP)} par semaine), sans savoir si la chaleur sera là aux heures où les nettoyages tournent. Investissement : ${kE(INVESTISSEMENTS.recuperation.montant)}, dont ${kE(INVESTISSEMENTS.recuperation.aide)} de certificats attendus.`,
      },
      {
        id: "pompe",
        titre: "Chiffrer la version avec pompe à chaleur",
        cout: 0.5,
        nature: "utile",
        resultat: `Pompe à chaleur et récupération : ${kE(INVESTISSEMENTS.pompe.montant)}, dont ${kE(INVESTISSEMENTS.pompe.aide)} de certificats. ${taux(INVESTISSEMENTS.pompe.gain, 0)} du gaz des NEP évité, ${mwh(POMPE.gazEvite)} par an. Mais la pompe consomme ${mwh(POMPE.elec)} d'électricité par an (coefficient de performance de ${nombre(INVESTISSEMENTS.pompe.cop, 1)}), à ${nombre(PRIX_ELEC, 0)} €/MWh. Gain net : ${kE(POMPE.gain)} par an, pour une annuité de ${kE(POMPE.annuite)}.`,
      },
      {
        id: "palmares",
        titre: "Lire le palmarès des laiteries « bas carbone » de la presse professionnelle",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Trois laiteries y sont citées pour leurs pompes à chaleur, photos à l'appui. L'article ne donne ni montant investi ni économies mesurées.",
      },
    ],
    question: "Quel investissement engagez-vous ?",
    options: [
      {
        t: "Signer la récupération de chaleur sur les groupes froids",
        d: `${kE(INVESTISSEMENTS.recuperation.montant)}, dont ${kE(INVESTISSEMENTS.recuperation.aide)} de certificats attendus. Mise en service en semaine 12.`,
      },
      {
        t: "Signer la version avec pompe à chaleur haute température",
        d: `${kE(INVESTISSEMENTS.pompe.montant)}, dont ${kE(INVESTISSEMENTS.pompe.aide)} de certificats. ${taux(INVESTISSEMENTS.pompe.gain, 0)} du gaz des NEP. Mise en service en semaine 13.`,
      },
      {
        t: "Reporter l'investissement au budget de l'an prochain",
        d: "Aucune dépense cette année.",
      },
      {
        t: "Remplacer la chaudière vapeur par une chaudière à condensation",
        d: `${kE(INVESTISSEMENTS.chaudiere.montant)}, dont ${kE(INVESTISSEMENTS.chaudiere.aide)} de certificats. ${taux(INVESTISSEMENTS.chaudiere.gain, 0)} de gaz en moins, en semaine 12.`,
      },
    ],
    reactions: [
      null,
      null,
      [
        {
          ...LAVINIA,
          texte:
            "Nous gardons votre dossier. Les certificats d'économies d'énergie, eux, n'attendront pas forcément.",
        },
      ],
      [
        {
          ...KLERVI,
          texte: "Commande passée chez le chauffagiste. Pose en semaine 12.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le contrat d'électricité",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...HILARION,
        heure: "09:10",
        alerte: true,
        texte: `Monsieur Ouedraogo, notre offre à prix fixe sur trois ans, ${CONTRAT.triennal} €/MWh hors acheminement pour tout votre volume actuel (${mwh(ELEC_AN)} par an), est valable jusqu'à ce soir. Le contrat démarrerait en semaine 10.`,
      },
      {
        ...IWAN,
        heure: "09:40",
        texte:
          "Djibril, on signe. Trois ans sans surprise, c'est ce que le comité attend. Le marché a assez joué avec nous.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Prix de l'électricité au contrat indexé cette semaine : ${ctx.prix}. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus.`,
      },
    ],
    sources: [
      {
        id: "offres",
        titre: "Lire les offres de Kervolt et le marché à terme",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Kervolt propose quatre structures, à partir de la semaine 10. Trois ans à prix fixe : ${CONTRAT.triennal} €/MWh, sur un volume contractuel de ${mwh(ELEC_AN)} par an ; en deçà de ${taux(CONTRAT.tolerance, 0)}, chaque MWh non consommé est facturé ${CONTRAT.penalite} €. Pour un an : un ruban à prix fixe sur ${taux(CONTRAT.partRuban, 0)} du volume prévu, au prix à terme plus ${CONTRAT.margeRuban} €, le reste indexé ; ou tout le volume prévu à prix fixe, forme comprise, au prix à terme × ${nombre(PROFIL, 2)} plus ${nombre(CONTRAT.margeFixe, 1)} €, avec la même clause de volume. Rester indexé : le prix de base × ${nombre(PROFIL, 2)} plus ${MARGE_INDEXE} €. Le marché à terme des douze prochains mois cote ${ctx.aTerme} de base, soit ${ctx.aTermeIndexe} au contrat indexé ; les deux années suivantes, ${taux(1 - TERME_SUIVANTS[0], 0)} et ${taux(1 - TERME_SUIVANTS[1], 0)} de moins.`,
      },
      {
        id: "volumes",
        titre: "Projeter la consommation des douze prochains mois",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.mesure
            ? `Avec les réglages et les investissements déjà décidés, les relevés projettent ${ctx.volumeMesure} d'électricité sur les douze prochains mois, contre ${mwh(ELEC_AN)} sur les douze derniers. Le talon — le froid, les utilités, l'air comprimé — tourne jour et nuit : plus de la moitié du volume ne bouge pas avec la production.`
            : `Sans relevés par usage, on ne connaît que le volume des douze derniers mois : ${mwh(ELEC_AN)}. Ce que les économies en cours retireront, personne ne peut le dire : c'est ce volume qui servira de volume prévu.`,
      },
      {
        id: "presse",
        titre: "Lire les analyses de marché de la presse spécialisée",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les analystes ne s'accordent pas : les uns voient le marché remonter cet hiver, les autres baisser avec la production renouvelable. Aucun ne s'engage sur un chiffre.",
      },
    ],
    question: "Quel contrat signez-vous ?",
    options: [
      {
        t: "Signer l'offre à trois ans de Kervolt, sur tout le volume actuel",
        d: `${CONTRAT.triennal} €/MWh pendant trois ans, ${mwh(ELEC_AN)} par an. Plus de surprise sur le prix.`,
      },
      {
        t: "Couvrir 60 % du volume prévu à prix fixe pour un an, le reste au prix du marché",
        d: `Un ruban au prix à terme plus ${CONTRAT.margeRuban} €/MWh ; le reste indexé.`,
      },
      {
        t: "Prendre un prix fixe d'un an sur tout le volume prévu",
        d: `Le prix à terme, forme comprise, plus ${nombre(CONTRAT.margeFixe, 1)} €/MWh. Aucune exposition au marché pendant un an.`,
      },
      {
        t: "Rester au prix du marché",
        d: "Le contrat indexé actuel continue.",
      },
    ],
    reactions: [
      [
        {
          ...HILARION,
          texte: "Merci de votre confiance. Le contrat démarre en semaine 10, pour trois ans.",
        },
      ],
      [
        {
          ...HILARION,
          texte:
            "Ruban réservé pour un an. Le reste suit le marché : je vous envoie le prix chaque mois.",
        },
      ],
      [
        {
          ...HILARION,
          texte: "Prix fixe signé pour un an. Vous savez ce que vous paierez.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "Je ne suis pas rassuré. Si le marché remonte cet hiver, c'est toi qui l'expliqueras au comité.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La rentrée",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...EFFLAM,
        heure: "08:30",
        alerte: true,
        texte: `Le comité de septembre veut savoir ce que l'usine garde de l'été, et ce qu'on fait d'ici la fin du trimestre. Coût de l'énergie à date : ${ctx.couts}, pour ${ctx.budgetADate} prévus.`,
      },
      {
        ...GURVAN,
        heure: "10:10",
        texte:
          "Pour finir sous le budget, je peux arrêter la ligne 5 aux heures chères jusqu'à fin septembre.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Électricité consommée cette semaine : ${ctx.elec}. Fuites d'air comprimé : ${ctx.fuites}.`,
      },
    ],
    sources: [
      {
        id: "derive",
        titre: "Demander à Klervi ce que deviennent les réglages et les fuites",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Klervi Nédélec : « Sur un réseau d'air, ${taux(RETOUR_FUITES, 0)} des fuites réparées reviennent dans l'année si personne ne repasse ; une tournée aux ultrasons en trouve encore ${taux(TOURNEE, 0)}. Les réglages des groupes froids et des purgeurs dérivent aussi : d'environ ${taux(DERIVE, 0)} en un an, sans suivi. » Un suivi mensuel par usage, avec un indicateur d'énergie par atelier revu en comité d'usine, et une tournée des fuites chaque trimestre : ${euros(COUTS.suivi)} cette année, puis ${euros(COUTS.suiviAnnuel)} par an.${
            ctx.mesure
              ? ""
              : ` Il faudra d'abord poser les sous-compteurs : ${euros(COUTS.sousCompteurs)}.`
          }`,
      },
      {
        id: "led",
        titre: "Chiffrer le relamping LED de l'usine",
        cout: 0.5,
        nature: "utile",
        resultat: `L'éclairage consomme ${mwh(ECLAIRAGE)} par semaine. Des LED en économiseraient la moitié : ${mwh(LED.mwh)} par an, ${kE(LED.gain)} à ${nombre(PRIX_ELEC, 0)} €/MWh. Investissement : ${kE(INVESTISSEMENTS.led.montant)}, soit une annuité de ${kE(LED.annuite)}.`,
      },
    ],
    question: "Que faites-vous d'ici la fin du trimestre ?",
    options: [
      {
        t: "Mettre en place un suivi mensuel par usage et une tournée des fuites chaque trimestre",
        d: `Un indicateur d'énergie par atelier, revu en comité d'usine. ${euros(COUTS.suivi)} cette année, ${euros(COUTS.suiviAnnuel)} par an.`,
      },
      {
        t: "Arrêter la ligne 5 aux heures chères jusqu'à fin septembre",
        d: "La proposition de Gurvan, pour finir sous le budget. Rattrapage le samedi.",
      },
      {
        t: "Lancer le relamping LED de l'usine",
        d: `${kE(INVESTISSEMENTS.led.montant)} d'investissement, posé en semaine 13.`,
      },
      {
        t: "Ne rien changer d'ici la fin du trimestre",
        d: "Le plan de l'été continue.",
      },
    ],
    reactions: [
      [
        {
          ...BRIVAEL,
          texte:
            "Première tournée du suivi faite : 31 nouvelles fuites étiquetées, dont 9 sur des raccords déjà réparés en juillet.",
        },
      ],
      [
        {
          ...ERWANN,
          texte:
            "La ligne 5 s'arrête de nouveau à 17 heures. Le samedi, les volontaires se font rares à la rentrée.",
        },
      ],
      [
        {
          ...KLERVI,
          texte: "Commande passée. Les luminaires seront posés la dernière semaine de septembre.",
        },
      ],
      [
        {
          ...EFFLAM,
          texte: "Entendu. On fera le point au comité d'octobre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Mesurer, réparer, puis couvrir", chemin: [1, 0, 1, 0, 1, 0] },
  { nom: "Le prix et l'horaire", chemin: [0, 3, 0, 2, 0, 1] },
  { nom: "Attentiste", chemin: [3, 3, 3, 2, 3, 3] },
] as const;

/**
 * Les options réflexes, [décision, option] : arrêter une ligne aux heures
 * chères (l'été, puis en septembre), relever la consigne des chambres froides
 * pour économiser, signer trois ans de prix fixe sur tout le volume actuel.
 */
export const REFLEXES = [
  [0, 0],
  [2, 0],
  [4, 0],
  [5, 1],
] as const;

export const REPONSES = {
  aideAccordee: (aide: number) =>
    `Bonne nouvelle : le dossier de certificats d'économies d'énergie est accepté en entier, ${kE(aide)}. Les travaux commencent la semaine prochaine.`,
  aideReduite: (aide: number, demandee: number) =>
    `Le dossier de certificats d'économies d'énergie est accepté, mais réduit à ${kE(aide)} au lieu de ${kE(demandee)} : une partie des travaux ne rentre pas dans la fiche standard. Les travaux commencent la semaine prochaine.`,
} as const;
