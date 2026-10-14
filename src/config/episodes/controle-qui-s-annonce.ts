/**
 * LE CONTRÔLE QUI S'ANNONCE — le contenu de l'épisode.
 *
 * Émilie Masson est responsable du contrôle de gestion et de la conformité
 * d'Arvel Négoce Rhône, filiale d'Arvel Distribution à Vénissieux. Un
 * contrôle de l'administration sur les délais de paiement et la facturation
 * est annoncé pour la semaine 8. Le sondage rapide fait la semaine dernière
 * n'est pas joli : des factures fournisseurs payées en retard, des remises
 * accordées sans écrit, des notes de frais approximatives. Certains proposent
 * de « remettre les dossiers d'aplomb » avant l'arrivée du contrôleur. Six
 * décisions, chacune précédée de ce qu'une responsable de la conformité
 * reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "circuit",
    t: "Les factures attendent des semaines un bon pour accord en agence, puis une signature unique : c'est le circuit de validation qui fabrique les retards",
  },
  {
    id: "arriere",
    t: "Un arriéré de vieilles factures gonfle les retards : il suffit de le purger avant le contrôle",
  },
  {
    id: "tresorerie",
    t: "La trésorerie de la filiale est trop tendue pour payer à l'échéance",
  },
  {
    id: "comptabilite",
    t: "La comptabilité fournisseurs saisit et paie trop lentement",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le contrôle est annoncé",
    jusqua: 3,
    messages: () => [
      {
        de: "Pascal Ménard",
        role: "Inspecteur, DGCCRF",
        heure: "08:05",
        alerte: true,
        texte:
          "Madame, un contrôle sur place aura lieu dans vos locaux à compter du lundi de la semaine 8. Il portera sur le respect des délais de paiement fournisseurs et des règles de facturation, sur les douze derniers mois. Merci de tenir à disposition le grand livre fournisseurs, les factures et vos accords commerciaux.",
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "08:40",
        texte:
          "Émilie, tu as vu le courrier. Le sondage de Maëlle la semaine dernière n'est pas joli : des factures payées à trois mois, des remises sans papier, des notes de frais à la louche. Je veux ton plan vendredi.",
      },
      {
        de: "Fabien Lemarchand",
        role: "Directeur commercial",
        heure: "09:15",
        texte:
          "On a sept semaines. Si on remet les dossiers d'aplomb d'ici là, il ne trouvera rien. Tu vois ce que je veux dire.",
      },
      {
        de: "Tableau de bord de la filiale",
        role: "Point hebdomadaire",
        heure: "09:30",
        texte:
          "Semaine dernière : 18 % des factures fournisseurs payées après l'échéance. Délai moyen de paiement : 52 jours. 420 factures échues non payées.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "extraction",
        titre: "Extraire le parcours des 200 dernières factures en retard",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Saisie en comptabilité : 3 jours en moyenne. Attente du bon pour accord en agence : 38 jours. Paiement une fois la facture validée : 4 jours. 61 % des retards concernent des factures de plus de 5 000 €, qui attendent en plus la signature de Lionel, seul habilité au-delà de ce montant. La trésorerie n'est pas en cause : 1,6 million d'euros disponibles et une ligne de crédit inutilisée.",
      },
      {
        id: "facture",
        titre: "Suivre une facture du courrier jusqu'au virement",
        cout: 1,
        nature: "decisive",
        resultat:
          "Une facture de plaques de plâtre de 7 800 € arrive à l'agence de Saint-Priest le 3. Elle attend dans la bannette du chef d'agence, qui la vise le vendredi suivant, puis le vendredi d'après faute de temps. Elle part au siège pour la signature de Lionel, en déplacement deux semaines. Payée le 58e jour après l'échéance. Moussa Konaté : « Je n'ai pas la délégation, et je ne vise que le vendredi. »",
      },
      {
        id: "notes",
        titre: "Relire les notes de frais du comité de direction",
        cout: 1,
        nature: "bruit",
        resultat:
          "Des additions de restaurant sans le nom des invités, deux nuits d'hôtel sans justificatif, des kilomètres arrondis : 3 400 € à régulariser sur l'année. À corriger, mais le contrôle annoncé ne porte ni sur les notes de frais ni sur la paie.",
      },
      {
        id: "remises",
        titre: "Ouvrir le fichier des remises exceptionnelles",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le sondage en avait trouvé 38 ; le fichier en laisse deviner une soixantaine. Des remises de 8 à 15 % accordées oralement à des artisans, sans accord écrit ni mention sur la facture. La règle est simple : toute réduction de prix acquise doit figurer sur la facture.",
      },
      {
        id: "conseil",
        titre: "Appeler Rachida Meziane, directrice financière du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Rachida : « Un contrôleur pardonne beaucoup mieux un écart qu'on lui montre avec son plan de correction qu'un écart qu'il trouve seul. Commence par savoir ce qu'il va trouver, et pourquoi. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que décidez-vous avant le point de vendredi ?",
    options: [
      {
        t: "Lancer un audit interne ciblé, priorisé par risque",
        d: "Maëlle et deux comptables, trois semaines : un échantillon de 200 factures, le circuit de validation et toutes les remises. 4 500 € de temps.",
      },
      {
        t: "Faire auditer tous les dossiers de l'année par un cabinet",
        d: "Toutes les factures, toutes les remises, toutes les notes de frais. 14 000 € de cabinet, plus le temps de la comptabilité ; rapport en semaine 8.",
      },
      {
        t: "Geler les paiements fournisseurs le temps de tout vérifier",
        d: "Deux semaines sans virement, chaque facture revue avant de partir. 3 000 € de temps.",
      },
      {
        t: "Attendre le contrôleur pour savoir ce qu'il cherche",
        d: "Pas de dépense, pas d'agitation. On répondra à ses questions.",
      },
    ],
    reactions: [
      [
        {
          de: "Maëlle Kerbrat",
          role: "Contrôleuse de gestion",
          texte:
            "Les 200 factures sont tirées. Premier constat : la comptabilité paie en quatre jours ce qu'on lui transmet validé. C'est avant que ça bloque.",
        },
      ],
      [
        {
          de: "Bérénice Hoarau",
          role: "Responsable de la comptabilité fournisseurs",
          texte:
            "Le cabinet démarre lundi. Il veut toutes les extractions de l'année et deux de mes comptables à plein temps pour répondre à ses questions.",
        },
      ],
      null,
      [
        {
          de: "Lionel Barthès",
          role: "Directeur de la filiale",
          texte: "Attendre ? Il arrive dans sept semaines, Émilie. Je n'aime pas ça.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le circuit des factures",
    jusqua: 5,
    messages: (ctx) => [
      {
        de: "Maëlle Kerbrat",
        role: "Contrôleuse de gestion",
        heure: "10:20",
        alerte: true,
        texte: ctx.auditCible
          ? "Audit terminé. Sur les 200 factures : 36 payées en retard, et pour 33 d'entre elles, le retard s'est fait avant le paiement, dans les agences et à la signature. 56 remises sans écrit identifiées, quatre autres probables mais introuvables."
          : `Fin de semaine 3 : ${ctx.retard} des factures de la semaine payées en retard, ${ctx.echues} factures échues non payées.`,
      },
      {
        de: "Bérénice Hoarau",
        role: "Responsable de la comptabilité fournisseurs",
        heure: "11:05",
        texte:
          "Si on veut arriver propres, je peux payer tout l'arriéré en urgence : deux semaines d'heures supplémentaires, et plus une facture échue en semaine 4.",
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "14:30",
        texte:
          "Le prestataire de dématérialisation me relance : il dit pouvoir nous équiper avant le contrôle. Tu en penses quoi ?",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "chefs",
        titre: "Interroger deux chefs d'agence sur leur bannette",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Moussa Konaté (Saint-Priest) et Ludivine Abrial (Givors) visent les factures une fois par semaine, le vendredi, quand ils ont le temps. Viser une facture prend trois minutes. Au-delà de 5 000 €, tout remonte à Lionel. Ludivine : « Si je pouvais signer jusqu'à 15 000 € et qu'on me relançait, ça partirait dans la semaine. »",
      },
      {
        id: "prestataire",
        titre: "Demander au prestataire son calendrier et ses références",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Cyril Boissonnet annonce une mise en service en semaine 6 : réception électronique des factures, relance automatique au septième jour, délégations paramétrées par montant. Sur ses dix derniers déploiements, trois ont glissé d'environ trois semaines, le temps de paramétrer les délégations.",
      },
    ],
    question: "Que faites-vous du circuit de validation ?",
    options: [
      {
        t: "Refondre le circuit : factures dématérialisées, validation suivie, délégations de signature",
        d: "Bon pour accord sous sept jours avec relance automatique, chefs d'agence signataires jusqu'à 15 000 €. 10 000 €, mise en service prévue en semaine 6.",
      },
      {
        t: "Revoir les délégations de signature et suivre les bannettes chaque lundi",
        d: "Chefs d'agence signataires jusqu'à 15 000 €, l'adjointe de Lionel en son absence, un point hebdomadaire des factures en attente. 1 500 € de temps, dès la semaine 4.",
      },
      {
        t: "Payer tout l'arriéré en urgence pour arriver propres",
        d: "Deux semaines d'heures supplémentaires à la comptabilité : les factures échues réglées d'ici la semaine 4. 3 500 €.",
      },
      {
        t: "Ne rien changer au circuit avant le contrôle",
        d: "Modifier les règles maintenant, ce serait reconnaître qu'elles posaient problème.",
      },
    ],
    reactions: [
      [
        {
          de: "Cyril Boissonnet",
          role: "Chef de projet chez le prestataire",
          texte:
            "Commande reçue. Paramétrage en semaines 4 et 5, mise en service visée en semaine 6. Je vous confirme la date dès que les délégations sont saisies.",
        },
      ],
      [
        {
          de: "Moussa Konaté",
          role: "Chef d'agence, Saint-Priest",
          texte:
            "Je signe désormais jusqu'à 15 000 €, et Bérénice me relance le lundi. Les factures de plaques ne partent plus chez Lionel.",
        },
      ],
      [
        {
          de: "Bérénice Hoarau",
          role: "Responsable de la comptabilité fournisseurs",
          texte:
            "Arriéré soldé en semaine 4, l'équipe est rincée. Mais les bannettes des agences se remplissent déjà comme avant.",
        },
      ],
      [
        {
          de: "Ludivine Abrial",
          role: "Cheffe d'agence, Givors",
          texte:
            "Rien ne change chez nous, alors. Les factures attendent le vendredi, comme d'habitude.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Les remises sans papier",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Fabien Lemarchand",
        role: "Directeur commercial",
        heure: "09:10",
        alerte: true,
        texte:
          "Pour les remises, j'ai la solution : on fait signer aux artisans des accords datés de l'an dernier, et on retire du système celles qu'on ne peut pas couvrir. Mes commerciaux s'en chargent cette semaine. Le contrôleur ne verra que des dossiers propres.",
      },
      {
        de: "Maëlle Kerbrat",
        role: "Contrôleuse de gestion",
        heure: "11:30",
        texte: `À ce jour, ${ctx.remises} remises sans justificatif identifiées dans les dossiers${
          ctx.auditCible ? "" : " ; on n'a pas encore fait le tour de toutes les agences"
        }.`,
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "15:00",
        texte: "Je ne veux pas de vagues avec les artisans. Tranche, Émilie.",
      },
    ],
    sources: [
      {
        id: "juriste",
        titre: "Demander à Clara Esteves, juriste du groupe, ce que risque chaque option",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Clara : « Une remise régularisée par un avoir et un accord daté du jour, qui dit la date réelle de la remise, c'est un manquement passé reconnu : amende réduite. Un accord antidaté, c'est un faux. Le contrôleur peut interroger les artisans ; s'il le découvre, l'amende change d'échelle, le dossier part au procureur, et plus rien de ce que vous lui direz ne sera cru. Je ne couvrirai pas ça. »",
      },
      {
        id: "artisans",
        titre: "Regarder ce que pèsent ces remises pour les agences",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une soixantaine de remises, 41 artisans, 2,3 % du chiffre d'affaires des agences. Pour une dizaine d'entre eux, la remise est le prix : la supprimer les ferait partir chez un concurrent. Les accorder par écrit, avec mention sur la facture, ne coûte rien de plus.",
      },
    ],
    question: "Que faites-vous des remises sans justificatif ?",
    options: [
      {
        t: "Régulariser les remises réelles : avoirs, accords datés du jour, mention sur les factures",
        d: "Chaque remise documentée telle qu'elle a été accordée, l'écart reconnu. Et une règle pour la suite : pas de remise sans écrit. 2 500 € de temps.",
      },
      {
        t: "Laisser Fabien « remettre les dossiers d'aplomb »",
        d: "Des accords signés avec une date antérieure, les remises non couvertes retirées du système. 5 000 € de temps commercial ; dossiers propres en semaine 6.",
      },
      {
        t: "Supprimer toutes les remises exceptionnelles dès maintenant",
        d: "Plus aucune remise hors barème jusqu'à nouvel ordre. Plus de nouveau risque.",
      },
      {
        t: "Laisser les dossiers en l'état : le contrôle porte surtout sur les délais",
        d: "Pas de temps passé sur un sujet secondaire.",
      },
    ],
    reactions: [
      [
        {
          de: "Maëlle Kerbrat",
          role: "Contrôleuse de gestion",
          texte:
            "Avoirs et accords faits, datés du jour, avec la date réelle de chaque remise. Un écart reconnu reste un écart, mais il est propre. Les commerciaux ont un modèle d'accord pour la suite.",
        },
      ],
      [
        {
          de: "Bérénice Hoarau",
          role: "Responsable de la comptabilité fournisseurs",
          texte:
            "Les commerciaux font signer les artisans. Deux m'ont appelée pour demander pourquoi on leur fait signer un papier daté de l'an dernier. Je n'ai pas su quoi leur répondre.",
        },
      ],
      [
        {
          de: "Moussa Konaté",
          role: "Chef d'agence, Saint-Priest",
          texte:
            "Trois de mes plus gros artisans m'ont dit qu'ils iraient voir ailleurs. Pour eux, la remise, c'était le prix.",
        },
      ],
      [
        {
          de: "Fabien Lemarchand",
          role: "Directeur commercial",
          texte: "Très bien. Mes commerciaux continuent comme avant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Le contrôleur arrive lundi",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Pascal Ménard",
        role: "Inspecteur, DGCCRF",
        heure: "09:00",
        alerte: true,
        texte:
          "Je serai dans vos locaux lundi à 9 heures, pour deux semaines. Merci de désigner un interlocuteur et de préparer le grand livre fournisseurs ; je tirerai sur place un échantillon de 150 factures, et je demanderai vos accords de remise.",
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "11:15",
        texte:
          "Fabien me conseille de lui donner le strict minimum, et de faire traîner le temps que les chiffres s'améliorent. Ton avis ?",
      },
      {
        de: "Tableau de bord de la filiale",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 7 : ${ctx.retard} des factures payées en retard, délai moyen ${ctx.delai}, ${ctx.echues} factures échues non payées.`,
      },
    ],
    sources: [
      {
        id: "doctrine",
        titre: "Relire comment l'administration fixe le montant d'une amende",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `L'amende tient compte de la gravité et de la durée des manquements, mais aussi de la bonne foi et des corrections déjà en place. Un écart présenté par l'entreprise, avec sa cause et un plan daté, pèse bien moins qu'un écart découvert ; une entrave au contrôle aggrave tout. ${
            ctx.auditCible
              ? "Votre audit vous permet de présenter presque tout ce qu'il va trouver, causes comprises."
              : ctx.auditFait
                ? "Ce que vous savez des écarts reste partiel : vous ne pourrez en présenter qu'une partie."
                : "Sans audit, vous ne savez pas ce qu'il va trouver."
          }`,
      },
    ],
    question: "Comment recevez-vous le contrôleur ?",
    options: [
      {
        t: "Lui remettre d'emblée une note d'autodiagnostic, et désigner une interlocutrice unique",
        d: "Les écarts trouvés, leurs causes, les corrections faites et le plan daté. Toutes les pièces sous 48 heures. 1 500 € de temps.",
      },
      {
        t: "Répondre strictement aux demandes écrites, après relecture par l'avocat",
        d: "Rien de plus que ce qui est demandé. 6 000 € d'honoraires.",
      },
      {
        t: "Fournir les pièces au compte-gouttes, le temps que les corrections fassent effet",
        d: "Chaque demande prend une semaine. Le contrôleur finira sur des chiffres plus récents.",
      },
      {
        t: "Laisser la comptabilité le recevoir, comme pour un contrôle ordinaire",
        d: "Bérénice connaît les dossiers. Vous gardez votre temps pour le reste.",
      },
    ],
    reactions: [
      [
        {
          de: "Pascal Ménard",
          role: "Inspecteur, DGCCRF",
          texte:
            "Merci pour cette note, elle me fait gagner du temps. Je vérifierai les écarts que vous signalez, et je regarderai si vos corrections tiennent.",
        },
      ],
      [
        {
          de: "Pascal Ménard",
          role: "Inspecteur, DGCCRF",
          texte: "Bien reçu. Je formaliserai donc chacune de mes demandes par écrit.",
        },
      ],
      [
        {
          de: "Pascal Ménard",
          role: "Inspecteur, DGCCRF",
          texte:
            "Trois demandes restées sans réponse. J'élargis mon échantillon à 300 factures, je reprends toutes les remises une à une, et je note le délai de vos réponses au procès-verbal.",
        },
      ],
      [
        {
          de: "Bérénice Hoarau",
          role: "Responsable de la comptabilité fournisseurs",
          texte:
            "Le contrôleur est installé en salle de réunion. Il m'a demandé qui pouvait lui expliquer le circuit de validation et les remises. Je n'ai pas su tout lui dire.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Le procès-verbal",
    jusqua: 11,
    messages: (ctx) => [
      {
        de: "Pascal Ménard",
        role: "Inspecteur, DGCCRF",
        heure: "16:00",
        alerte: true,
        texte: `Fin du contrôle sur place. Mon procès-verbal relève ${ctx.controle} de factures payées au-delà du délai légal dans l'échantillon, et ${ctx.relevees} remises sans justificatif. Vous disposez de quinze jours pour présenter vos observations écrites avant la décision.`,
      },
      {
        de: "Fabien Lemarchand",
        role: "Directeur commercial",
        heure: "16:45",
        texte: "On conteste tout. Leur échantillon ne veut rien dire, et ils le savent.",
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "17:30",
        texte: "Je veux qu'on s'en sorte au mieux. Qu'est-ce qu'on répond ?",
      },
    ],
    sources: [
      {
        id: "pv",
        titre: "Relire le procès-verbal ligne à ligne avec Clara",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les constats sont exacts, facture par facture. La méthode de tirage est celle que l'administration applique partout, et son extrapolation est prudente. Clara : « Il n'y a pas grand-chose à contester. Ce qui peut encore jouer, ce sont les corrections prouvées et des engagements datés. »",
      },
    ],
    question: "Que répondez-vous au procès-verbal ?",
    options: [
      {
        t: "Reconnaître les manquements établis, prouver les corrections et s'engager sur un calendrier",
        d: "Le taux de retard des dernières semaines, le circuit corrigé, les remises régularisées, et des engagements datés. 1 000 € de temps.",
      },
      {
        t: "Contester l'ensemble du procès-verbal, par l'avocat",
        d: "L'échantillon, la méthode et chaque constat. 7 000 € d'honoraires.",
      },
      {
        t: "Ne pas présenter d'observations",
        d: "Le contrôle est fini ; on attend la décision.",
      },
    ],
    reactions: [
      [
        {
          de: "Pascal Ménard",
          role: "Inspecteur, DGCCRF",
          texte:
            "Vos observations sont jointes au dossier. Les corrections prouvées et le calendrier seront pris en compte dans la proposition de sanction.",
        },
      ],
      null,
      [
        {
          de: "Lionel Barthès",
          role: "Directeur de la filiale",
          texte: "Pas d'observations, donc. On verra bien ce qu'ils décident.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Après le contrôle",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Pascal Ménard",
        role: "Inspecteur, DGCCRF",
        heure: "10:00",
        alerte: true,
        texte:
          "La décision vous sera notifiée en semaine 12. Elle sera assortie d'une injonction de mise en conformité, dont le respect pourra être vérifié dans les semaines qui suivent.",
      },
      {
        de: "Lionel Barthès",
        role: "Directeur de la filiale",
        heure: "11:30",
        texte: "Le contrôle est passé. On peut souffler, non ?",
      },
      {
        de: "Tableau de bord de la filiale",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Fin de semaine 11 : ${ctx.retard} des factures payées en retard, ${ctx.remises} remises sans justificatif dans les dossiers.`,
      },
    ],
    sources: [
      {
        id: "semaines",
        titre: "Regarder les factures et les remises des deux dernières semaines",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Depuis le départ du contrôleur, deux agences sur quatre ont repris l'habitude de viser le vendredi. ${
            ctx.circuitCorrige
              ? "Le circuit corrigé tient, mais les nouveaux venus ne savent pas s'en servir"
              : "Le circuit n'a pas changé : rien n'empêche les retards de revenir"
          }, et des commerciaux accordent encore des remises sans écrit. Ludivine : « Personne ne nous a jamais expliqué le délai légal, ni pourquoi une remise doit figurer sur la facture. »`,
      },
    ],
    question: "Comment finissez-vous le trimestre ?",
    options: [
      {
        t: "Former les chefs d'agence et les comptables, et instaurer un contrôle interne mensuel",
        d: "Une demi-journée par agence sur le circuit, les délais et les remises ; trente factures vérifiées chaque mois. 3 000 €.",
      },
      {
        t: "Adresser un avertissement aux chefs d'agence les plus en retard",
        d: "Une lettre de Lionel aux deux agences en cause. Ne coûte rien.",
      },
      {
        t: "Considérer le dossier comme clos",
        d: "Le contrôle est passé, la sanction tombera ; l'équipe a besoin de souffler.",
      },
    ],
    reactions: [
      [
        {
          de: "Ludivine Abrial",
          role: "Cheffe d'agence, Givors",
          texte:
            "La formation a tout remis à plat : je sais enfin ce que le délai légal veut dire pour nos fournisseurs. Et les remises passent par un écrit, sinon le logiciel les refuse.",
        },
      ],
      [
        {
          de: "Moussa Konaté",
          role: "Chef d'agence, Saint-Priest",
          texte:
            "Message reçu. Je signe tout ce qui arrive le jour même, sans trop regarder. Bérénice a déjà trouvé deux factures payées deux fois.",
        },
      ],
      [
        {
          de: "Lionel Barthès",
          role: "Directeur de la filiale",
          texte: "Bien. On passe à la clôture du trimestre.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Savoir, corriger, montrer", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Bloquer, puis minimiser", chemin: [2, 2, 3, 2, 1, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 2, 2] },
] as const;

/**
 * Les réflexes du métier sous la menace d'un contrôle : tout bloquer par peur,
 * « nettoyer » à la va-vite, ou minimiser. [décision, option].
 */
export const REFLEXES = [
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 1],
  [2, 2],
  [3, 2],
  [4, 1],
  [5, 2],
] as const;

export const REPONSES = {
  fournisseurSuspend:
    "Sans règlement de nos factures échues d'ici vendredi, nous suspendons les livraisons à vos agences. C'est la règle chez nous, désolé.",
  fournisseurPatiente:
    "Nous avons noté le gel de vos paiements. Nous attendons vos virements dès la semaine prochaine, indemnités de retard comprises.",
  contestationEntendue:
    "Après examen de vos observations, l'administration réduit l'extrapolation retenue sur une partie de l'échantillon. Le reste des constats est maintenu.",
  contestationRejetee:
    "Vos observations n'apportent aucun élément nouveau. Les constats sont maintenus, et la contestation systématique sera mentionnée dans la proposition de sanction.",
} as const;
