/**
 * L'APPEL D'OFFRES — le contenu de l'épisode.
 *
 * Vincent Lambertin est responsable grands comptes d'Arvel Distribution :
 * avec deux chargés d'affaires et une chargée d'études de prix, il suit
 * quatorze grands comptes et répond à leurs consultations. Balmes Habitat, un
 * bailleur social, lance l'appel d'offres de l'année ; deux autres
 * consultations tombent la même semaine, et l'équipe est déjà pleine. Six
 * décisions, chacune précédée de ce qu'un responsable grands comptes reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "grille",
    t: "Le marché se gagnera sur la valeur technique, à condition d'y mettre l'équipe : il faut choisir ses dossiers",
  },
  {
    id: "charge",
    t: "L'équipe est trop chargée : il manque du monde pour répondre à tout",
  },
  {
    id: "prix",
    t: "Le marché se jouera sur le prix : il faudra passer sous les concurrents",
  },
  {
    id: "sortant",
    t: "Le sortant est indélogeable : l'appel d'offres est écrit pour lui",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois consultations, une équipe",
    jusqua: 2,
    messages: () => [
      {
        de: "Veille des marchés publics",
        role: "Envoi automatique",
        heure: "07:30",
        alerte: true,
        texte:
          "Nouvel avis : Balmes Habitat, accord-cadre de fourniture de matériaux pour la rénovation de 1 200 logements, trois ans, environ 2,4 M€. Remise des offres : vendredi de la semaine 5.",
      },
      {
        de: "Odile Varenne",
        role: "Directrice commerciale régionale",
        heure: "08:45",
        texte:
          "Vincent, Balmes, c'est le dossier de l'année : trois ans de volume, et Gabriac les livre depuis neuf ans. La direction attend 40 k€ de marge nouvelle signée ce trimestre, frais de réponse compris. Dis-moi vendredi comment tu t'organises.",
      },
      {
        de: "Leïla Ouazzani",
        role: "Chargée d'affaires",
        heure: "09:20",
        texte:
          "Il y a aussi Maisons Ardanel, remise en semaine 3 — 400 lignes de gros œuvre et des échantillons — et le Haut-Garon, outillage et équipements de protection, remise en semaine 4. Et Vauclair attend six devis. On fait comment ?",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "grille",
        titre: "Lire le règlement de consultation de Balmes",
        cout: 1,
        nature: "decisive",
        resultat:
          "Prix : 40 points. Valeur technique : 60 points, en quatre intitulés — logistique et livraisons, délais de réapprovisionnement, démarche environnementale, accompagnement des entreprises — dont le détail sera « précisé en réponse aux questions ». La note prix suit une formule linéaire : chaque pour cent au-dessus de l'offre la moins chère retire 0,8 point. Nos trois dernières réponses à des bailleurs ont obtenu entre 31 et 38 sur 60 en technique, avec le mémoire type.",
      },
      {
        id: "charge",
        titre: "Faire le plan de charge de l'équipe",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les comptes en place prennent 14 des 20 jours de l'équipe chaque semaine. Il en reste 6 pour les offres, soit 30 jusqu'à la remise de Balmes. Ardanel en demande 12 d'ici la semaine 3, le Haut-Garon 4 à 6, Balmes de 10 à 18 selon le mémoire. En semaines 2 et 3, tout tomberait en même temps.",
      },
      {
        id: "historique",
        titre: "Relire nos réponses de l'an dernier",
        cout: 1,
        nature: "utile",
        resultat:
          "Onze réponses, deux marchés gagnés, 19 000 € de préparation. Ardanel : trois consultations, trois fois le sortant reconduit ; leur grille donne 80 % au prix. Le Haut-Garon nous achète déjà de l'outillage au comptoir de Vénissieux : un dossier à notre portée.",
      },
      {
        id: "concurrents",
        titre: "Comparer nos prix à ceux des concurrents",
        cout: 1,
        nature: "bruit",
        resultat:
          "Grandval Distribution affiche 5 à 6 % sous notre tarif sur le second œuvre. Gabriac, le sortant, a des prix proches des nôtres. Sur le papier, nous sommes les plus chers des trois.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Odile",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Odile : « Avant de compter tes prix, compte tes jours. Et lis ce qu'ils notent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment engagez-vous l'équipe ?",
    options: [
      {
        t: "Répondre aux trois consultations : on ne laisse passer aucune affaire",
        d: "Chacun prend un dossier en plus de ses clients. Ne coûte rien de plus.",
      },
      {
        t: "Mettre l'équipe sur Balmes, répondre au Haut-Garon sur le mémoire type, décliner Ardanel",
        d: "Un courrier poli à Ardanel. Le Haut-Garon en version légère, quatre jours.",
      },
      {
        t: "Tout miser sur Balmes, et décliner les deux autres",
        d: "Deux courriers de désistement. Toute l'équipe disponible pour Balmes.",
      },
      {
        t: "Prendre un renfort intérimaire, et répondre aux trois",
        d: "Un assistant d'offres pendant quatre semaines, 2 000 € par semaine, le temps qu'il apprenne nos produits.",
      },
    ],
    reactions: [
      [
        {
          de: "Maxence Tissot",
          role: "Chargé d'affaires",
          texte:
            "Je prends Ardanel en plus de mes clients. Quatre cents lignes de bordereau : je vais y passer mes soirées.",
        },
      ],
      [
        {
          de: "Leïla Ouazzani",
          role: "Chargée d'affaires",
          texte:
            "Ardanel a pris notre désistement sans surprise : « comme d'habitude ». On attaque Balmes demain matin.",
        },
      ],
      [
        {
          de: "Leïla Ouazzani",
          role: "Chargée d'affaires",
          texte:
            "Deux désistements envoyés. Le Haut-Garon a paru surpris : « vous êtes pourtant déjà notre fournisseur au comptoir ».",
        },
      ],
      [
        {
          de: "Agence d'intérim",
          role: "Partenaire ressources humaines",
          texte:
            "Nous vous envoyons Bilal, assistant commercial expérimenté. Il commence mardi ; comptez une semaine pour qu'il connaisse vos produits.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les questions à l'acheteuse",
    jusqua: 3,
    messages: (ctx) => [
      {
        de: "Plateforme des marchés",
        role: "Avis aux candidats",
        heure: "11:00",
        alerte: true,
        texte:
          "Balmes Habitat : les questions des candidats sont reçues jusqu'au mercredi de la semaine 3. Les réponses seront publiées pour tous les candidats.",
      },
      {
        de: "Linh Pham",
        role: "Chargée d'études de prix",
        heure: "15:40",
        texte:
          "J'ai lu le cahier des charges. Il parle d'« interventions en milieu occupé » sans dire combien de logements. Si les locataires sont là pendant les travaux, on ne livre pas pareil : petits lots, créneaux, étages. Ça change notre coût.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Charge de l'équipe en semaine 2 : ${ctx.charge} de sa capacité. Devis clients en attente : ${ctx.devis}. Dossier Balmes : ${ctx.dossier}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dce",
        titre: "Relire le cahier des charges avec Linh",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trois pages sur les « interventions en milieu occupé » : livraison par logement, protection des parties communes, enlèvement des emballages le jour même. Le règlement promet des sous-critères « précisés en réponse aux questions ». Rien sur la part de logements occupés, alors que notre coût de livraison en dépend : deux points de marge d'écart.",
      },
      {
        id: "gabriac",
        titre: "Demander à Leïla ce qu'elle sait de Gabriac chez Balmes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un gardien de résidence, client du comptoir, lui a raconté : Gabriac livre des palettes entières au pied des immeubles, et les locataires s'en plaignent au bailleur. Gabriac connaît les sites, mais sa note technique n'est pas acquise.",
      },
    ],
    question: "Posez-vous des questions à Balmes ?",
    options: [
      {
        t: "Ne poser aucune question : inutile de montrer notre jeu",
        d: "Les concurrents liraient nos questions et les réponses. Ne prend pas de temps.",
      },
      {
        t: "Poser trois questions écrites : la part de logements occupés, les sous-critères, les volumes par année",
        d: "Une demi-journée de Linh et de vous. Les réponses seront publiées pour tous.",
      },
      {
        t: "Appeler Raphaël Mendy, le responsable technique de Balmes, qu'on connaît bien",
        d: "Un déjeuner, une demi-journée. Il saura nous dire ce qui compte.",
      },
      {
        t: "Attendre les questions des autres candidats, et lire les réponses publiées",
        d: "Ne coûte rien. Gabriac et Grandval poseront peut-être les bonnes questions.",
      },
    ],
    reactions: [
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte:
            "Bien noté. Je chiffre avec ce qu'on a, et je compte les livraisons comme pour nos clients habituels.",
        },
      ],
      [
        {
          de: "Margot Kerguelen",
          role: "Responsable des marchés, Balmes Habitat",
          texte:
            "Réponses publiées : 60 % des logements seront occupés pendant les travaux ; livraison par logement, sur créneau. Sous-critères techniques : logistique et livraisons 25 points, délais de réapprovisionnement 15, démarche environnementale 10, accompagnement des entreprises 10. Volumes : 300, 450 et 450 logements par an.",
        },
      ],
      [
        {
          de: "Raphaël Mendy",
          role: "Responsable technique, Balmes Habitat",
          texte:
            "Vincent, tu sais bien que je ne peux rien te dire pendant la consultation. Pose ta question sur la plateforme, comme tout le monde. Je préviens Margot que tu as appelé : c'est la règle.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le mémoire technique",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: "Odile Varenne",
        role: "Directrice commerciale régionale",
        heure: "09:10",
        alerte: true,
        texte:
          "Où en est Balmes ? Le mémoire, c'est soixante points sur cent. Je ne veux pas revoir le copier-coller de l'an dernier.",
      },
      {
        de: "Maxence Tissot",
        role: "Chargé d'affaires",
        heure: "14:30",
        texte: ctx.deborde
          ? `On a passé la semaine sur les bordereaux. Vauclair a relancé deux fois pour ses devis, il y en a ${ctx.devis} en attente. Je ne vois pas quand on écrit quoi que ce soit pour Balmes.`
          : "Les clients en place sont à jour. On a de la place la semaine prochaine pour le mémoire Balmes.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Charge de l'équipe en semaine 3 : ${ctx.charge} de sa capacité. Dossier Balmes : ${ctx.dossier}. Remise dans deux semaines.`,
      },
    ],
    sources: [
      {
        id: "criteres",
        titre: "Relire la grille avec ce que l'on sait de Balmes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${
            ctx.grille
              ? "Logistique et livraisons : 25 points ; délais de réapprovisionnement : 15 ; démarche environnementale : 10 ; accompagnement : 10."
              : "Les sous-critères n'ont pas été publiés : quatre intitulés, sans pondération."
          } ${
            ctx.sites
              ? "60 % des logements seront occupés : le jury lira d'abord comment on livre un logement habité."
              : "On ne sait pas combien de logements seront occupés."
          } Notre mémoire type parle de notre histoire, de nos agences et de notre catalogue : rien sur les livraisons en site occupé, rien sur les délais de réassort, rien sur les emballages.`,
      },
      {
        id: "cabinet",
        titre: "Demander un devis à un cabinet de rédaction d'offres",
        cout: 0.5,
        nature: "utile",
        resultat:
          "7 000 €, premier jet en dix jours. Le cabinet écrit bien et connaît les bailleurs ; il ne connaît ni nos dépôts ni nos chauffeurs. Deux jours de relecture de notre côté.",
      },
    ],
    question: "Comment écrivez-vous le mémoire ?",
    options: [
      {
        t: "Reprendre le mémoire type de l'agence, et l'adapter à Balmes",
        d: "Trois jours. Le document a déjà servi onze fois.",
      },
      {
        t: "Répondre critère par critère : plan de livraison en site occupé, stock dédié, délais de réassort, reprise des emballages",
        d: "Neuf jours de l'équipe, avec le chef de dépôt et les chauffeurs.",
      },
      {
        t: "Un dossier exhaustif : toutes nos références, le catalogue complet, cent vingt pages",
        d: "Dix jours. Montrer tout ce qu'on sait faire.",
      },
      {
        t: "Confier la rédaction à un cabinet spécialisé",
        d: "7 000 €, deux jours de relecture. L'équipe reste sur ses clients.",
      },
    ],
    reactions: [
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte:
            "Mémoire type adapté : j'ai changé le nom du client, les photos et l'organigramme.",
        },
      ],
      [
        {
          de: "Leïla Ouazzani",
          role: "Chargée d'affaires",
          texte:
            "Le chef de dépôt a dessiné le plan de livraison résidence par résidence, avec les créneaux et les étages. Ça, Gabriac ne l'a jamais fait.",
        },
      ],
      [
        {
          de: "Maxence Tissot",
          role: "Chargé d'affaires",
          texte:
            "Cent vingt pages, on a tout mis. Je ne suis pas sûr que quelqu'un les lise jusqu'au bout.",
        },
      ],
      [
        {
          de: "Cabinet de rédaction",
          role: "Prestataire",
          texte:
            "Premier jet dans dix jours. Pouvez-vous nous envoyer vos plans de dépôt et vos délais de livraison ? Nous ne les trouvons pas dans vos documents.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le prix",
    jusqua: 7,
    messages: (ctx) => [
      {
        de: "Linh Pham",
        role: "Chargée d'études de prix",
        heure: "10:00",
        alerte: true,
        texte:
          "Le bordereau est chiffré au tarif grands comptes. Avant le dépôt de vendredi prochain, il faut décider du prix. Grandval sera 5 à 6 % sous nous, c'est sûr.",
      },
      {
        de: "Odile Varenne",
        role: "Directrice commerciale régionale",
        heure: "11:30",
        texte:
          "Je ne veux pas perdre Balmes pour trois points de remise. Mais je ne veux pas non plus d'un marché qui nous coûte de l'argent pendant trois ans. C'est toi qui signes.",
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Dossier Balmes : ${ctx.dossier}. Coûts de préparation engagés depuis le début du trimestre : ${ctx.prepa}.`,
      },
    ],
    sources: [
      {
        id: "plancher",
        titre: "Calculer le coût complet du marché et le prix plancher",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Marge brute au tarif grands comptes : 15 %. Coût du service — livraisons, stock dédié, suivi, retours : 10 % du chiffre d'affaires${
            ctx.sites
              ? ", livraisons par logement comprises"
              : " ; deux points de plus si les logements sont occupés et qu'on ne l'a pas prévu"
          }. Marge nette au tarif : 5 %. Notre plancher, 2 % de marge nette, est à 3 % sous le tarif. Chaque point de remise coûte 22 000 € sur les trois ans ; à 6 % de remise, le marché perd de l'argent chaque année.`,
      },
      {
        id: "formule",
        titre: "Simuler la note prix avec la formule de Balmes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Si Grandval remet 5,5 % sous notre tarif : au tarif, nous aurions 35,3 points sur 40 ; à 3 % de remise, 37,9 ; à 6 %, 40. Baisser de 6 % rapporte moins de cinq points. À 4 % au-dessus du tarif, nous en perdrions trois de plus.",
      },
    ],
    question: "Quel prix remettez-vous ?",
    options: [
      {
        t: "Baisser de 6 % pour passer sous Grandval",
        d: "Le prix le plus bas de la consultation, selon toute vraisemblance.",
      },
      {
        t: "Remettre notre tarif grands comptes, et défendre l'offre technique",
        d: "Le prix que nos clients en place paient déjà.",
      },
      {
        t: "Ajouter 4 % de marge de sécurité : trois ans, c'est long",
        d: "Pour couvrir les surprises des chantiers et des prix fournisseurs.",
      },
      {
        t: "Baisser de 3 %, jusqu'au plancher, pour mettre les chances de notre côté",
        d: "2 % de marge nette, pas un euro de moins.",
      },
    ],
    reactions: [
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte:
            "C'est saisi. À ce prix-là, si les chantiers sont compliqués, on travaille pour rien pendant trois ans.",
        },
      ],
      [
        {
          de: "Leïla Ouazzani",
          role: "Chargée d'affaires",
          texte: "Dossier déposé vendredi à 11 h, au tarif. Linh a relu le bordereau deux fois.",
        },
      ],
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte: "Saisi à 4 % au-dessus du tarif. On sera sans doute les plus chers des trois.",
        },
      ],
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte:
            "Saisi à 3 % sous le tarif. On est au plancher : plus aucune marge de manœuvre en négociation.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "La négociation",
    jusqua: 10,
    messages: () => [
      {
        de: "Margot Kerguelen",
        role: "Responsable des marchés, Balmes Habitat",
        heure: "09:00",
        alerte: true,
        texte:
          "Votre offre fait partie des trois retenues pour la négociation. Les offres sont serrées. Nous attendons de chaque candidat sa meilleure et dernière offre pour le vendredi de la semaine 8 ; un effort de l'ordre de 5 % sur les prix est attendu.",
      },
      {
        de: "Odile Varenne",
        role: "Directrice commerciale régionale",
        heure: "10:15",
        texte:
          "On y est. Cinq pour cent, c'est ce qu'ils demandent à tout le monde. Ne me ramène pas un marché à perte.",
      },
    ],
    sources: [
      {
        id: "marge",
        titre: "Recalculer la marge du marché avant de répondre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec le prix remis, la marge nette du marché serait de ${ctx.marge} (plancher : 2 %). Une remise de 5 % la ramènerait à ${ctx.margeApres}. Chaque point accordé coûte 22 000 € sur trois ans. Le dépôt estime que des commandes groupées par résidence, passées 72 heures à l'avance, réduiraient le coût du service d'un point et demi.`,
      },
      {
        id: "rivaux",
        titre: "Demander à Leïla ce que font les concurrents",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Grandval a fait savoir qu'il « ferait l'effort » ; Gabriac traîne des pieds. Dans ce genre de négociation, les candidats lâchent en général entre 1 et 4 %. Balmes ne dira pas qui est devant.",
      },
    ],
    question: "Que répondez-vous à Balmes ?",
    options: [
      {
        t: "Accorder les 5 % demandés pour emporter le marché",
        d: "Ce que l'acheteuse attend.",
      },
      {
        t: "Accorder 2 % en échange de commandes groupées par résidence, passées 72 heures à l'avance",
        d: "Une contrepartie écrite dans le marché ; le dépôt organise les tournées.",
      },
      {
        t: "Maintenir l'offre telle quelle : notre prix est juste",
        d: "Pas d'effort, une lettre qui rappelle nos engagements.",
      },
      {
        t: "Garder le prix, et ajouter la reprise gratuite des emballages et des chutes",
        d: "Un camion repart chargé ; un peu moins d'un point de marge.",
      },
    ],
    reactions: [
      [
        {
          de: "Linh Pham",
          role: "Chargée d'études de prix",
          texte:
            "Meilleure et dernière offre envoyée, à 5 % de moins. Je n'ose pas recalculer la marge.",
        },
      ],
      [
        {
          de: "Margot Kerguelen",
          role: "Responsable des marchés, Balmes Habitat",
          texte:
            "Votre proposition de commandes groupées nous intéresse : nos gardiens réclament moins de livraisons. Elle est intégrée à votre offre finale.",
        },
      ],
      [
        {
          de: "Margot Kerguelen",
          role: "Responsable des marchés, Balmes Habitat",
          texte: "Nous prenons acte du maintien de votre offre.",
        },
      ],
      [
        {
          de: "Margot Kerguelen",
          role: "Responsable des marchés, Balmes Habitat",
          texte:
            "La reprise des emballages répond à une demande de nos locataires. Elle est intégrée à votre offre finale.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le premier client s'impatiente",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Odile Varenne",
        role: "Directrice commerciale régionale",
        heure: "08:30",
        texte: `${
          ctx.balmesGagne
            ? "Bravo pour Balmes. Maintenant, il faut le livrer, et garder les autres."
            : "Balmes est perdu ; c'est le jeu. Ne perdons pas ce qu'on a."
        } Frédéric Vautrin veut te voir.`,
      },
      {
        de: "Frédéric Vautrin",
        role: "Acheteur, Groupe Vauclair",
        heure: "11:20",
        alerte: true,
        texte: `Vincent, on renouvelle notre accord pour l'an prochain. ${
          ctx.neglige
            ? "Ce trimestre, vos devis sont arrivés en retard, et nos conducteurs de travaux ont dû commander ailleurs."
            : "Votre service a été correct ce trimestre."
        } Un concurrent nous propose 5 % de moins sur nos trente références principales. Alignez-vous, ou nous changeons de fournisseur au 1er janvier.`,
      },
      {
        de: "Tableau de bord de l'équipe",
        role: "Fiche client",
        heure: "11:30",
        texte:
          "Groupe Vauclair : premier compte de l'équipe, 700 000 € d'achats par an, 8 % de marge nette.",
      },
    ],
    sources: [
      {
        id: "devis",
        titre: "Reprendre l'historique des devis de Vauclair ce trimestre",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.neglige
            ? `${ctx.devisRetard} devis rendus en retard ce trimestre, presque tous pendant les semaines des appels d'offres. Le conducteur de travaux a commandé deux fois chez un confrère, faute de réponse. Ce que Frédéric reproche d'abord, c'est le service ; le prix vient après.`
            : "Les devis sont partis dans les délais. Vauclair met ses fournisseurs en concurrence chaque fin d'année ; ses trente références principales font 60 % de ses achats. Il n'a jamais quitté un fournisseur qui le servait bien.",
      },
      {
        id: "offre",
        titre: "Vérifier l'offre du concurrent",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'offre vient de Grandval : 5 % de moins sur les trente références, livraison à J+2 au lieu de J+1, pas de livraison sur chantier le samedi. Sur le reste de la gamme, Grandval est à notre prix.",
      },
    ],
    question: "Que proposez-vous à Vauclair ?",
    options: [
      {
        t: "S'aligner : 5 % de remise sur tout l'accord",
        d: "Vauclair reste, à coup sûr. 35 000 € de marge en moins sur l'année.",
      },
      {
        t: "Une revue d'affaires : rattraper les devis, un interlocuteur dédié, et 1,5 % sur les trente références qui comptent",
        d: "Deux jours de Leïla en semaine 11, et un effort ciblé.",
      },
      {
        t: "Refuser : notre prix est juste, et notre service le vaut",
        d: "Une lettre ferme et courtoise.",
      },
      {
        t: "Laisser Maxence, qui suit le compte, négocier au mieux",
        d: "Vous restez sur le démarrage des marchés du trimestre prochain.",
      },
    ],
    reactions: [
      [
        {
          de: "Frédéric Vautrin",
          role: "Acheteur, Groupe Vauclair",
          texte: "Merci, c'est signé. On se revoit l'an prochain : même heure, même discussion.",
        },
      ],
      [
        {
          de: "Frédéric Vautrin",
          role: "Acheteur, Groupe Vauclair",
          texte:
            "Leïla est passée avec les devis en retard et la liste des trente références. On se voit en fin de mois pour signer, ou pas.",
        },
      ],
      [
        {
          de: "Frédéric Vautrin",
          role: "Acheteur, Groupe Vauclair",
          texte: "Je prends note. Vous aurez notre réponse avant la fin du mois.",
        },
      ],
      [
        {
          de: "Maxence Tissot",
          role: "Chargé d'affaires",
          texte: "Je m'en occupe. Frédéric est remonté ; je ferai ce que je peux.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  {
    nom: "Qualifier, lire la grille, tenir son prix",
    chemin: [1, 1, 1, 1, 1, 1],
  },
  { nom: "Répondre à tout, baisser le prix", chemin: [0, 2, 2, 0, 0, 0] },
  { nom: "Attentiste", chemin: [0, 0, 0, 2, 2, 3] },
] as const;

/**
 * Les réflexes du métier sous la pression d'une consultation : répondre à
 * tout, et baisser le prix pour gagner — à Balmes, en négociation, et pour
 * garder un client : [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  publieesSites:
    "Un candidat a demandé la part de logements occupés. Réponse de Balmes : 60 %, livraison par logement, sur créneau. Personne n'a interrogé Balmes sur les sous-critères.",
  publieesRien:
    "Deux questions publiées : le format des fichiers de prix, et la date de la visite des résidences. Rien sur les logements occupés ni sur la notation.",
  surcharge:
    "Ça fait quatre jours que j'attends le devis des portes palières. J'ai commandé chez un confrère.",
  ardanelGagne:
    "Votre offre est retenue pour l'an prochain, aux prix remis. Nos prix cibles sont tenus : on compte sur vous.",
  ardanelPerdu:
    "Nous avons reconduit notre fournisseur actuel. Merci pour votre offre et vos échantillons.",
  garonGagne:
    "Le marché d'outillage et d'équipements de protection vous est attribué pour deux ans. Premier bon de commande la semaine prochaine.",
  garonPerdu:
    "Le marché est attribué à un autre candidat. Votre offre était correcte, mais votre mémoire restait général.",
  erreur:
    "En préparant la négociation, je relis le bordereau : la ligne 214, la colle à carrelage, est chiffrée au sac au lieu de la palette. On ne peut plus la corriger. Si on gagne, ce prix nous engage trois ans : environ 15 000 € de perdus.",
  surcout:
    "Premières commandes Balmes : 60 % des logements sont occupés, il faut livrer par logement, sur créneau. Ce n'était pas dans notre prix : le dépôt estime le surcoût à deux points de marge, pendant trois ans.",
  vauclairResteRevue:
    "On reste avec vous pour l'an prochain. Ce qui a compté, c'est d'avoir de nouveau quelqu'un en face.",
  vauclairResteFerme:
    "On reste avec vous. Grandval ne livre pas le samedi, et nos conducteurs de travaux y tiennent.",
  vauclairResteRemise:
    "Vauclair reste. Mais Frédéric n'a rien voulu entendre : j'ai dû lâcher 3 % pour le garder.",
  vauclairPart:
    "Nous passons chez Grandval au 1er janvier. Merci pour ces années ; nous vous consulterons de nouveau.",
} as const;
