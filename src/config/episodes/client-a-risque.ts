/**
 * LE CLIENT À RISQUE — le contenu de l'épisode.
 *
 * Gauthier Jacquin est responsable du crédit clients d'Arvel Distribution
 * pour la région lyonnaise : il fixe les limites d'encours, choisit les
 * garanties et suit les signaux. Une entreprise générale qui gagne un gros
 * chantier demande 500 k€ d'encours, un artisan fidèle laisse revenir une
 * traite impayée, un jeune promoteur veut un compte, un couvreur tombe en
 * redressement judiciaire. Six décisions, chacune précédée de ce qu'un
 * responsable du crédit reçoit vraiment.
 *
 * Les chiffres des sources viennent des constantes du modèle : ce que le
 * joueur lit est ce que le trimestre fera. Les sources portent leur NATURE —
 * décisive, utile, bruit, aide — que le joueur ne voit pas : c'est le bilan
 * qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  ACOMPTE,
  ACOMPTE_HALVANE,
  CHANTIER_HEBDO,
  COMPTES_RETARD,
  COMPTES_SIGNAUX,
  COUT_STOCK_BRONDEL,
  CREANCE_BRONDEL,
  ENCOURS_CORVELLE,
  ENCOURS_GUENARD,
  ENCOURS_PALIER,
  FRAIS_AVOCAT,
  FRAIS_CAUTION,
  GUENARD_HEBDO,
  HALVANE_HEBDO,
  HAUSSE_DEMANDEE,
  LIMITE_CORVELLE,
  LIMITE_DEMANDEE,
  LIMITE_HALVANE,
  LIMITE_SURVEILLANCE,
  PD_CORVELLE,
  PD_GUENARD,
  PD_HALVANE,
  PRIME_PORTEFEUILLE,
  PRIX_CESSION,
  QUOTITE,
  RECUPERATION_HALVANE,
  RECUPERATION_MOYENNE,
  RETARDS_HEBDO,
  SEMAINES_CHANTIER,
  SIGNAUX_HEBDO,
  STOCK_BRONDEL,
  TAUX_MARGE,
  TAUX_MARGE_CHANTIER,
  TAUX_MARGE_GUENARD,
  TAUX_MARGE_HALVANE,
  TAUX_PRIME,
  TRAITE_GUENARD,
} from "@/engine/episodes/client-a-risque";
import { euros, kE, taux } from "./format";
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "perteAttendue",
    t: "Une vente à crédit ne vaut que sa marge moins la perte attendue : l'encours demandé se chiffre en risque, pas en chiffre d'affaires",
  },
  { id: "fragilite", t: "Corvelle est fragile : sa trésorerie ne suit pas sa croissance" },
  {
    id: "procedure",
    t: "Le commercial a promis la limite sans passer par le crédit : c'est un problème de procédure",
  },
  {
    id: "delais",
    t: "Les clients paient de plus en plus tard : c'est le délai de paiement qu'il faut réduire",
  },
] as const;

const EDITH = { de: "Edith Carrère", role: "Directrice administrative et financière" } as const;
const QUENTIN = { de: "Quentin Marsal", role: "Responsable grands comptes" } as const;
const SOLINE = { de: "Soline Abadie", role: "Analyste crédit" } as const;
const XAVIER = { de: "Xavier Lenglet", role: "Chef comptable" } as const;
const CHEIKH = { de: "Cheikh Faye", role: "Directeur financier, Corvelle Bâtiment" } as const;
const JOEL = { de: "Joël Guénard", role: "Gérant, Guénard Plâtrerie Peinture" } as const;
const NOLAN = { de: "Nolan Ferhat", role: "Attaché commercial, agence de Vénissieux" } as const;
const MALO = { de: "Malo Desrosiers", role: "Président, Halvane Patrimoine" } as const;
export const ASSUREUR = {
  de: "Ilona Szabo",
  role: "Chargée de souscription, l'assureur-crédit",
} as const;
export const MANDATAIRE = { de: "Maître Constance Ribot", role: "Mandataire judiciaire" } as const;
export const AVOCATE = { de: "Maître Yuna Kerboul", role: "Avocate d'Arvel" } as const;
const VEILLE = { de: "Veille juridique", role: "Alerte BODACC" } as const;

/** La marge du chantier des Terrasses sur le trimestre, au prix chantier. */
export const MARGE_CHANTIER = CHANTIER_HEBDO * SEMAINES_CHANTIER * TAUX_MARGE_CHANTIER;
/** Ce que Guénard rapporte chaque semaine. */
export const MARGE_GUENARD = GUENARD_HEBDO * TAUX_MARGE_GUENARD;
/** Ce qu'un fonds paierait la créance Brondel. */
export const PRIX_FONDS = CREANCE_BRONDEL * PRIX_CESSION;
export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Corvelle veut 500 k€",
    jusqua: 2,
    messages: () => [
      {
        de: "Logiciel de crédit",
        role: "Demande de relèvement de limite",
        heure: "07:50",
        alerte: true,
        texte: `Corvelle Bâtiment : demande de relèvement de la limite d'encours de ${kE(LIMITE_CORVELLE)} à ${kE(LIMITE_DEMANDEE)}, saisie par Quentin Marsal. Encours actuel : ${kE(ENCOURS_CORVELLE)}.`,
      },
      {
        ...QUENTIN,
        heure: "08:20",
        texte:
          "Gauthier, Corvelle a gagné les Terrasses de Gerland : 96 logements, plus d'un million d'euros de matériaux, et c'est chez nous qu'ils veulent les acheter. Premières livraisons la semaine prochaine. Il me faut les 500 k€ aujourd'hui, sinon ils signent chez le concurrent.",
      },
      {
        ...EDITH,
        heure: "09:05",
        texte:
          "On a fini l'an dernier au double du budget de pertes sur créances. Avant de dire oui à Corvelle, dis-moi ce que ce chantier nous rapporte une fois le risque payé. Ta réponse vendredi.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "dossier",
        titre: "Analyser le dossier financier de Corvelle",
        cout: 1,
        nature: "decisive",
        resultat: `Comptes du dernier exercice : 38 M€ de chiffre d'affaires, 0,4 % de résultat net, 2,1 M€ de capitaux propres, une trésorerie nette négative depuis deux ans. L'assureur-crédit cote Corvelle 7 sur 10 : à cette cote, la probabilité de défaut dans le trimestre est de ${taux(PD_CORVELLE, 0)}. Sur une demande d'agrément de ce type, il accorde la totalité trois fois sur dix, la moitié une fois sur deux, et refuse le reste.`,
      },
      {
        id: "procedures",
        titre: "Relire les procédures collectives des cinq dernières années",
        cout: 1,
        nature: "decisive",
        resultat: `Vingt-trois clients en redressement ou en liquidation judiciaire. Sur leurs créances chirographaires, Arvel a récupéré en moyenne ${taux(RECUPERATION_MOYENNE, 0)} du montant hors taxes : ${taux(1 - RECUPERATION_MOYENNE, 0)} ont été perdus. La réserve de propriété n'a servi que pour des marchandises encore en stock chez le client ; sur un chantier, les matériaux sont posés dans la semaine. Tous les montants s'entendent hors taxes : la TVA d'une créance devenue irrécouvrable se récupère.`,
      },
      {
        id: "chantier",
        titre: "Chiffrer le chantier avec l'agence",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les Terrasses : ${kE(CHANTIER_HEBDO)} HT de livraisons par semaine à partir de la semaine 2, soit ${kE(CHANTIER_HEBDO * SEMAINES_CHANTIER)} sur le trimestre. Au prix chantier négocié, la marge sur coût variable est de ${taux(TAUX_MARGE_CHANTIER, 0)}, contre ${taux(TAUX_MARGE, 0)} au tarif : ${kE(MARGE_CHANTIER)} sur le trimestre. Payées à 60 jours, les factures porteront l'encours à ${kE(ENCOURS_PALIER)} dès la semaine 9.`,
      },
      {
        id: "commercial",
        titre: "Écouter Quentin sur l'enjeu commercial",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Corvelle est notre troisième client, et le chantier ferait de nous son fournisseur principal pour deux ans. « Une entreprise de 38 M€ de chiffre d'affaires ne disparaît pas du jour au lendemain. Et le concurrent leur propose 90 jours. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Edith",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Edith : « Ne me dis pas combien on vend. Dis-moi ce qui reste une fois payé le risque, et ce que coûte ce qui nous en protège. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à la demande de Corvelle ?",
    options: [
      {
        t: "Accorder les 500 k€ demandés, en compte ouvert",
        d: "Tout le chantier livré, payé à 60 jours. Aucun coût, aucune garantie.",
      },
      {
        t: "Accorder 500 k€ et demander à l'assureur-crédit de couvrir l'encours",
        d: `Prime de ${taux(TAUX_PRIME)} du chiffre d'affaires assuré. L'assureur dira en semaine 2 ce qu'il agrée ; il couvre ${taux(QUOTITE, 0)} de la perte, dans cette limite.`,
      },
      {
        t: `Accorder 500 k€ contre un acompte de ${taux(ACOMPTE, 0)} à la commande`,
        d: "Moins d'encours à risque. Corvelle prévient qu'elle ne pourra pas tout avancer.",
      },
      {
        t: "Refuser : la limite reste à 150 k€",
        d: "Aucun risque de plus. Corvelle se fournira ailleurs pour le chantier.",
      },
    ],
    reactions: [
      [
        {
          ...QUENTIN,
          texte: "Merci ! Je préviens Corvelle : les premières livraisons partent lundi.",
        },
      ],
      null,
      [
        {
          ...CHEIKH,
          texte:
            "Avancer 30 % de chaque commande, notre trésorerie ne le permet pas. Nous prendrons la moitié du chantier chez vous, l'autre chez un confrère qui ne demande pas d'acompte.",
        },
      ],
      [
        {
          ...QUENTIN,
          texte:
            "Ils ont signé le chantier chez le concurrent. On garde leurs achats courants, c'est tout.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Une traite de Guénard revient impayée",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Banque",
        role: "Avis d'impayé",
        heure: "09:10",
        alerte: true,
        texte: `Lettre de change-relevé de ${kE(TRAITE_GUENARD)} tirée sur Guénard Plâtrerie Peinture : retournée impayée, motif « provision insuffisante ».`,
      },
      {
        ...SOLINE,
        heure: "10:30",
        texte: `Guénard est à ${ctx.encoursGuenard} d'encours pour ${kE(ENCOURS_GUENARD)} de limite. Le logiciel bloquera son compte lundi matin, sauf décision contraire de ta part.`,
      },
      {
        ...NOLAN,
        heure: "11:15",
        texte:
          "Joël Guénard est passé à l'agence ce matin, très gêné. Il dit qu'il réglera. Je fais quoi s'il revient charger lundi ?",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "historique",
        titre: "Relire l'historique du compte Guénard",
        cout: 0.5,
        nature: "decisive",
        resultat: `Client depuis 1998, sans une seule perte. Il paie à 72 jours en moyenne pour 30 jours contractuels, mais il a toujours payé : c'est sa première traite impayée en vingt-six ans. ${kE(GUENARD_HEBDO)} d'achats HT par semaine, au tarif artisan : ${taux(TAUX_MARGE_GUENARD, 0)} de marge sur coût variable, soit ${euros(MARGE_GUENARD)} par semaine. La SARL est propriétaire de son atelier ; la grille d'Arvel lui donne ${taux(PD_GUENARD, 0)} de probabilité de défaut dans le trimestre.`,
      },
      {
        id: "appel",
        titre: "Appeler Joël Guénard",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Mon plus gros client, un bailleur social, m'a payé avec un mois de retard. Je peux vous régler la traite en trois fois d'ici six semaines. » Il ajoute, sans insister, qu'un concurrent lui propose d'ouvrir un compte depuis un an.",
      },
      {
        id: "portefeuille",
        titre: "Comparer avec les retards du portefeuille",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "La moitié des artisans du portefeuille paient au-delà de 60 jours, et le retard moyen a pris quatre jours en un an.",
      },
    ],
    question: "Que faites-vous pour Guénard ?",
    options: [
      {
        t: "Laisser le blocage s'appliquer jusqu'au paiement de la traite",
        d: "Plus aucune livraison tant que les 18 k€ ne sont pas réglés.",
      },
      {
        t: "Le passer au paiement comptant",
        d: "Plus de crédit : il paie à l'enlèvement. Aucun nouvel encours.",
      },
      {
        t: "Garder sa limite et accepter de régler la traite en trois fois",
        d: "Les livraisons continuent ; un point avec lui chaque mois.",
      },
      {
        t: `Exiger une caution bancaire de ${kE(ENCOURS_GUENARD)} pour continuer à livrer`,
        d: "Sa banque garantit l'encours ; la caution lui coûte des frais et mobilise sa ligne de crédit.",
      },
    ],
    reactions: [
      [
        {
          ...NOLAN,
          texte:
            "Je lui ai dit que son compte était bloqué. Il n'a rien répondu, il est reparti les mains vides.",
        },
      ],
      [
        {
          ...JOEL,
          texte:
            "Payer comptant, je ne peux pas : mes clients me paient à 60 jours. Je prendrai chez vous ce que je peux payer à l'enlèvement.",
        },
      ],
      [
        {
          ...JOEL,
          texte: "Merci de votre confiance. Vous aurez les trois versements, je m'y engage.",
        },
      ],
      [
        {
          ...JOEL,
          texte:
            "Ma banque me prend 1,5 % par an et bloque d'autant ma ligne de crédit. J'achèterai une partie ailleurs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Un nouveau client veut un compte",
    jusqua: 6,
    messages: () => [
      {
        ...QUENTIN,
        heure: "09:40",
        alerte: true,
        texte: `Halvane Patrimoine réhabilite une ancienne usine à Oullins : 18 logements. ${kE(HALVANE_HEBDO)} d'achats par semaine dès lundi, jusqu'à la fin du trimestre, payés à 60 jours. Il leur faut un compte à ${kE(LIMITE_HALVANE)}.`,
      },
      {
        ...ASSUREUR,
        heure: "11:00",
        texte:
          "Agrément refusé sur Halvane Patrimoine : société récente, comptes non publiés. Nous ne couvrirons pas ce risque.",
      },
      {
        ...MALO,
        heure: "14:30",
        texte:
          "Nos corps d'état attendent les matériaux. Nous démarrons lundi si le compte est ouvert.",
      },
    ],
    sources: [
      {
        id: "greffe",
        titre: "Interroger le greffe et la grille de score",
        cout: 0.5,
        nature: "decisive",
        resultat: `Société créée il y a vingt mois, au capital de 10 k€, comptes déposés avec option de confidentialité. Le prêt du programme n'est pas encore signé : 40 % des logements sont vendus. À ce profil, la grille d'Arvel donne ${taux(PD_HALVANE, 0)} de probabilité de défaut dans le trimestre, et ${taux(RECUPERATION_HALVANE, 0)} de récupération en moyenne. Marge sur coût variable des achats d'Halvane : ${taux(TAUX_MARGE_HALVANE, 0)}.`,
      },
      {
        id: "dirigeant",
        titre: "Se renseigner sur le dirigeant",
        cout: 0.5,
        nature: "utile",
        resultat: `Malo Desrosiers détient deux SCI propriétaires d'un immeuble de rapport à Villeurbanne, sans hypothèque : une caution personnelle de ${kE(LIMITE_HALVANE)} n'est pas disproportionnée à ses biens et revenus. Il accepte un acompte de ${taux(ACOMPTE_HALVANE, 0)} et une caution, mais ne peut pas payer tout comptant. Sur les cautions de ce type, Arvel a été payé huit fois sur dix sans procès ; appeler une caution coûte ${kE(FRAIS_CAUTION)} de frais.`,
      },
    ],
    question: "Ouvrez-vous un compte à Halvane ?",
    options: [
      {
        t: "Ouvrir le compte à 150 k€, à 60 jours",
        d: "Tout le programme livré à crédit, sans garantie.",
      },
      {
        t: "Refuser d'ouvrir le compte",
        d: "Aucun risque, aucune vente.",
      },
      {
        t: "Ouvrir le compte au comptant seulement",
        d: "Chaque commande payée à l'enlèvement. Halvane dit qu'il ne pourra pas tout payer d'avance.",
      },
      {
        t: `Ouvrir 150 k€ contre un acompte de ${taux(ACOMPTE_HALVANE, 0)} et la caution personnelle du dirigeant`,
        d: `Un acte de caution à faire signer ; ${kE(FRAIS_CAUTION)} de frais s'il faut l'appeler.`,
      },
    ],
    reactions: [
      [{ ...MALO, texte: "Parfait. Nos premières commandes partent lundi." }],
      [
        {
          ...QUENTIN,
          texte:
            "Halvane a ouvert un compte chez le concurrent. Dix-huit logements de matériaux qui partent ailleurs.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "Payer chaque commande d'avance, nous ne pouvons le faire que pour une partie. Le reste, nous le prendrons ailleurs.",
        },
      ],
      [
        {
          ...MALO,
          texte:
            "L'acte de caution est signé, l'acompte suivra chaque commande. Nous démarrons lundi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Corvelle paie en retard et demande plus",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...SOLINE,
        heure: "09:00",
        alerte: true,
        texte: `Corvelle a réglé ses factures de mars avec douze jours de retard. Encours : ${ctx.encoursCorvelle}, pour une limite de ${ctx.limiteCorvelle}.`,
      },
      {
        ...CHEIKH,
        heure: "10:45",
        texte: `Notre promoteur paie nos situations de travaux avec trois semaines de retard. Pouvez-vous porter notre limite à ${ctx.limiteDemandee} le temps que ça se régularise ? Nos commandes ne changent pas.`,
      },
      {
        ...QUENTIN,
        heure: "11:20",
        texte: "On ne va pas braquer notre troisième client pour douze jours de retard ?",
      },
    ],
    sources: [
      {
        id: "signaux",
        titre: "Relire ce qui a précédé les défauts passés",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Un retard isolé n'a précédé un défaut qu'une fois sur vingt. Ce qui annonce un défaut, c'est l'accumulation : un retard qui s'allonge, un privilège de l'URSSAF ou du Trésor inscrit au greffe, un client qui demande plus d'encours pour le même volume, c'est-à-dire qui veut payer plus tard. Huit défauts sur dix en ont montré au moins deux, trois semaines avant. L'assureur-crédit, qui voit les paiements de tous ses assurés, réduit ses agréments en moyenne deux semaines avant la publication du premier privilège.",
      },
      {
        id: "promoteur",
        titre: "Se renseigner sur le promoteur des Terrasses",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un promoteur solide, mais sa banque a décalé un déblocage de fonds : il paie toutes ses entreprises avec trois semaines de retard depuis un mois. Corvelle a d'autres chantiers, et d'autres fournisseurs à payer.",
      },
    ],
    question: "Que répondez-vous à Corvelle ?",
    options: [
      {
        t: `Accorder les ${kE(HAUSSE_DEMANDEE)} supplémentaires`,
        d: "Pour le même volume de commandes, le temps que le promoteur régularise.",
      },
      {
        t: "Garder la limite et la revoir chaque semaine sur les signaux",
        d: `Ramenée à ${kE(LIMITE_SURVEILLANCE)} au deuxième signal. Un point chaque lundi avec Soline.`,
      },
      {
        t: "Garder la limite sans changer le suivi",
        d: "Un retard de douze jours n'est pas un défaut.",
      },
      {
        t: "Bloquer les livraisons jusqu'au paiement du retard",
        d: "Plus rien ne part tant que les factures de mars ne sont pas soldées.",
      },
    ],
    reactions: [
      [
        {
          ...CHEIKH,
          texte: "Merci, cela nous donne de l'air jusqu'à ce que le promoteur paie.",
        },
      ],
      [
        {
          ...SOLINE,
          texte:
            "Corvelle est en surveillance : retards, privilèges, alertes de l'assureur. Je te fais le point chaque lundi.",
        },
      ],
      [{ ...QUENTIN, texte: "Merci de ne pas avoir dramatisé." }],
      [
        {
          ...CHEIKH,
          texte:
            "Vous bloquez un chantier pour douze jours de retard ? Nous confions la suite des Terrasses à un autre fournisseur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Brondel Couverture en redressement judiciaire",
    jusqua: 10,
    messages: () => [
      {
        ...VEILLE,
        heure: "08:00",
        alerte: true,
        texte:
          "Jugement d'ouverture d'une procédure de redressement judiciaire : SARL Brondel Couverture, Saint-Genis-Laval. Mandataire judiciaire : Maître Constance Ribot. Publié au BODACC ce jour.",
      },
      {
        ...SOLINE,
        heure: "09:30",
        texte: `Brondel nous doit ${kE(CREANCE_BRONDEL)} HT. Leur dépôt est encore plein de zinc et de tuiles de chez nous, et nos conditions générales de vente comportent une clause de réserve de propriété.`,
      },
      {
        ...XAVIER,
        heure: "11:00",
        texte: `Je propose de passer les ${kE(CREANCE_BRONDEL)} en perte dès ce mois-ci et de tourner la page : on ne reverra jamais cet argent.`,
      },
    ],
    sources: [
      {
        id: "procedure",
        titre: "Lire le jugement et ce qu'il impose",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les créanciers ont deux mois à compter de la publication au BODACC pour déclarer leur créance au mandataire judiciaire ; une créance non déclarée est inopposable à la procédure et ne reçoit aucun dividende. Les marchandises vendues sous réserve de propriété se revendiquent dans les trois mois, si elles se retrouvent en nature. En comptabilité, la créance n'est pas irrécouvrable, elle est douteuse : elle passe au compte 416 et se déprécie (dotation au compte 6817, dépréciation au compte 491) du hors-taxe qu'on ne pense pas récupérer. La perte sur créance irrécouvrable (compte 654) ne se constate qu'à la clôture de la procédure, et la dépréciation est alors reprise.",
      },
      {
        id: "stock",
        titre: "Faire l'inventaire de nos marchandises chez Brondel",
        cout: 0.5,
        nature: "utile",
        resultat: `${kE(STOCK_BRONDEL)} HT de zinc et de tuiles, encore sur palettes, avec les numéros de lots de nos factures. Repris, ils rentreraient en stock à leur coût d'achat, ${kE(COUT_STOCK_BRONDEL)}. L'avocate demande ${euros(FRAIS_AVOCAT)} ; l'administrateur conteste souvent, et sur nos dossiers la revendication a abouti six fois sur dix. Sur le reste, le mandataire versera un dividende : ${taux(RECUPERATION_MOYENNE, 0)} en moyenne dans le bâtiment.`,
      },
      {
        id: "presse",
        titre: "Lire la presse locale sur Brondel",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le dirigeant évoque un hiver pluvieux, des chantiers décalés et un gros client public qui paie à 90 jours. « Nous allons nous en sortir. »",
      },
    ],
    question: "Que faites-vous de la créance Brondel ?",
    options: [
      {
        t: "Passer la créance en perte et clore le dossier",
        d: `${kE(CREANCE_BRONDEL)} en charges ce mois-ci ; plus de temps passé sur Brondel.`,
      },
      {
        t: "Déclarer la créance au mandataire",
        d: "Un formulaire et les factures, avant l'échéance des deux mois.",
      },
      {
        t: "Déclarer la créance et revendiquer les marchandises encore en stock",
        d: `Avec l'avocate : ${euros(FRAIS_AVOCAT)}. L'administrateur peut contester.`,
      },
      {
        t: `Céder la créance à un fonds pour ${taux(PRIX_CESSION, 0)} de sa valeur`,
        d: `${euros(PRIX_FONDS)} encaissés sous huit jours, sans recours ; le dossier est clos.`,
      },
    ],
    reactions: [
      [
        {
          ...XAVIER,
          texte:
            "C'est passé en perte. Je note que la créance n'a pas été déclarée : le commissaire aux comptes posera la question.",
        },
      ],
      [
        {
          ...MANDATAIRE,
          texte:
            "Déclaration de créance reçue et inscrite au passif de la SARL Brondel Couverture.",
        },
      ],
      [
        {
          ...AVOCATE,
          texte:
            "La créance est déclarée et la demande de revendication est partie chez l'administrateur. Réponse sous trois semaines.",
        },
      ],
      [
        {
          de: "Talmont Créances",
          role: "Fonds de rachat de créances",
          texte: "Fonds virés. La créance Brondel nous appartient désormais.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La direction veut serrer la vis",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...EDITH,
        heure: "08:30",
        alerte: true,
        texte: `Après Brondel${ctx.corvelleDefaut ? " et Corvelle" : ""}, le comité de direction veut bloquer jusqu'à la clôture tous les comptes en retard de plus de 30 jours : ${COMPTES_RETARD} comptes. Donne-moi ton avis lundi.`,
      },
      {
        ...QUENTIN,
        heure: "09:15",
        texte:
          "Bloquer 140 comptes à trois semaines de la clôture, c'est rater le trimestre. La moitié des artisans paient tard, et ils ont toujours payé.",
      },
      ...(ctx.corvelleDefaut
        ? [
            {
              ...SOLINE,
              heure: "10:00",
              texte:
                "Corvelle est en redressement judiciaire : son encours est gelé et la créance déclarée.",
            },
          ]
        : ctx.signauxCorvelle
          ? [
              {
                ...SOLINE,
                heure: "10:00",
                texte:
                  "Corvelle cumule maintenant les signaux : elle ne paie plus à l'échéance, et l'URSSAF a inscrit un privilège cette semaine.",
              },
            ]
          : []),
    ],
    sources: [
      {
        id: "balance",
        titre: "Croiser la balance âgée et les signaux",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur les ${COMPTES_RETARD} comptes en retard de plus de 30 jours, ${COMPTES_SIGNAUX} cumulent au moins deux signaux : impayé, retard qui s'allonge, privilège inscrit, changement de banque. Ils commandent ${kE(SIGNAUX_HEBDO)} HT par semaine, à ${taux(TAUX_MARGE, 0)} de marge sur coût variable. C'est parmi eux que se sont trouvés neuf des onze défauts des deux dernières années ; à la clôture, huit sur dix sont encore en retard, et le commissaire aux comptes fait déprécier la moitié de ce qu'ils doivent. Les ${COMPTES_RETARD - COMPTES_SIGNAUX} autres paient tard, mais paient : ${kE(RETARDS_HEBDO)} de commandes par semaine, Guénard parmi eux.`,
      },
      {
        id: "police",
        titre: "Demander à l'assureur-crédit une police sur les artisans",
        cout: 0.5,
        nature: "utile",
        resultat: `Prime minimale de ${euros(PRIME_PORTEFEUILLE)} pour le premier trimestre. Trois semaines d'étude des 400 comptes, pendant lesquelles rien n'est couvert ; et l'assureur n'agréera pas les comptes à signaux.`,
      },
    ],
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: `Bloquer les ${COMPTES_RETARD} comptes en retard de plus de 30 jours`,
        d: "Jusqu'à la clôture. Ceux qui règlent leur retard sont débloqués.",
      },
      {
        t: `Passer au comptant les ${COMPTES_SIGNAUX} comptes qui cumulent les signaux, livrer les autres`,
        d: "Une lettre et un appel à chacun ; les commerciaux préviennent leurs clients.",
      },
      {
        t: "Assurer tout le portefeuille artisans auprès de l'assureur-crédit",
        d: `${euros(PRIME_PORTEFEUILLE)} de prime pour le trimestre ; les livraisons continuent pendant l'étude.`,
      },
      {
        t: "Ne rien changer d'ici la clôture",
        d: "Les limites restent ce qu'elles sont.",
      },
    ],
    reactions: [
      [
        {
          ...NOLAN,
          texte:
            "Les artisans bloqués vont charger chez le concurrent. Certains ne reviendront pas.",
        },
      ],
      [
        {
          ...SOLINE,
          texte: `Les ${COMPTES_SIGNAUX} lettres sont parties. Les autres comptes sont livrés normalement.`,
        },
      ],
      [
        {
          ...ASSUREUR,
          texte: "Nous lançons l'étude des 400 comptes. Résultats dans trois semaines.",
        },
      ],
      [
        {
          ...EDITH,
          texte: "Je dirai au comité que tu ne vois pas de raison de bouger.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer le risque et le couvrir", chemin: [1, 2, 3, 1, 2, 1] },
  { nom: "Accorder aux gros, couper les petits", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 0, 1, 2, 1, 3] },
] as const;

/**
 * Les deux réflexes du crédit, [décision, option] : raisonner en chiffre
 * d'affaires (accorder l'encours parce que la commande est grosse, ou parce
 * que le client demande), ou tout couper au premier signal (bloquer
 * l'artisan fidèle, bloquer Corvelle pour douze jours de retard, bloquer
 * tous les comptes en retard). Refuser Corvelle d'emblée (D1) n'y figure
 * pas : c'est le statu quo de l'attentiste, pas une réponse à un signal.
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 3],
  [3, 0],
  [5, 0],
] as const;

export const REPONSES = {
  agrementTotal: `Agrément accordé sur Corvelle Bâtiment à hauteur de ${kE(LIMITE_DEMANDEE)}, quotité garantie ${taux(QUOTITE, 0)}.`,
  agrementMoitie:
    "Agrément limité à 250 k€ sur Corvelle Bâtiment : à cette cote, nous ne suivons pas au-delà. Quotité garantie 90 %.",
  agrementRefuse:
    "Agrément refusé sur Corvelle Bâtiment : nous ne couvrons pas ce risque. Les frais d'étude restent dus.",
  alerteAssureur:
    "Les incidents de paiement de Corvelle Bâtiment se multiplient chez nos assurés : nous ramenons notre agrément à zéro pour les livraisons à venir. Les factures déjà émises restent couvertes.",
  retardCorvelle:
    "Corvelle n'a rien réglé depuis deux semaines : les factures arrivées à échéance restent impayées.",
  privilege:
    "Inscription d'un privilège de l'URSSAF sur Corvelle Bâtiment : 85 k€ de cotisations impayées.",
  reduction: `Deuxième signal sur Corvelle : comme convenu, sa limite est ramenée à ${kE(LIMITE_SURVEILLANCE)}. Les livraisons attendront que l'encours redescende.`,
  guenardParti:
    "Joël Guénard a réglé sa traite et ouvert un compte chez le concurrent. Il ne reviendra pas.",
  guenardReste: "Joël Guénard a réglé sa traite et repris ses achats. Un peu froissé.",
  guenardDefaut:
    "Guénard Plâtrerie Peinture est placée en liquidation judiciaire après la défaillance de son principal client.",
  halvaneDefaut:
    "Halvane Patrimoine est en cessation de paiements : la banque n'a pas signé le prêt du programme.",
  cautionPayee:
    "Malo Desrosiers, appelé en caution, a payé ce que devait Halvane. Il ne reste que les frais.",
  cautionContestee:
    "Malo Desrosiers conteste son engagement de caution : le recouvrement est incertain, la créance est dépréciée.",
  revendicationOk: `L'administrateur a reconnu nos marchandises : ${kE(STOCK_BRONDEL)} de zinc et de tuiles reviennent au dépôt.`,
  revendicationKo:
    "L'administrateur conteste : une partie des palettes a été posée, le reste n'est pas identifiable lot par lot. La revendication échoue.",
} as const;
