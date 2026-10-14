/**
 * L'INVESTISSEMENT À CHOISIR — le contenu de l'épisode.
 *
 * Myriam Duchemin dirige la plateforme logistique d'Arvel Distribution à
 * Saint-Quentin-Fallavier. Le groupe lui accorde 700 k€ d'investissements
 * pour l'an prochain ; trois dossiers concurrents attendent le comité de la
 * semaine 2 : un stockeur automatique pour les petites pièces, des chariots
 * électriques, un logiciel de gestion d'entrepôt (WMS). Une mezzanine
 * laissée inachevée par son prédécesseur attend un ordre de service. Six
 * décisions, chacune précédée de ce qu'une directrice de site reçoit
 * vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la VAN, le TRI et le délai de récupération des
 * dossiers, la sensibilité de l'extension au rattachement, la comparaison
 * des batteries, ce que rapporterait la mezzanine.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const SEGOLENE = { de: "Ségolène Marchais", role: "Directrice financière du groupe" } as const;
const DOMINIQUE = {
  de: "Dominique Ferrandon",
  role: "Directeur des opérations Rhône-Alpes",
} as const;
const SANDRO = { de: "Sandro Pinheiro", role: "Chef d'équipe préparation" } as const;
const GAELLE = { de: "Gaëlle Robineau", role: "Responsable technique du site" } as const;
const DESIRE = {
  de: "Désiré Tchakounté",
  role: "Technico-commercial, fournisseur des chariots",
} as const;
const ACHATS = { de: "Service achats", role: "Siège" } as const;
const TABLEAU = { de: "Suivi des investissements", role: "Point hebdomadaire" } as const;

/** Le fournisseur du grand projet lancé : celui du stockeur, ou l'éditeur du WMS. */
const fournisseur = (ctx: Contexte) => ({
  de: String(ctx.fournisseur),
  role: String(ctx.roleFournisseur),
});

export const DIAGNOSTICS = [
  {
    id: "van",
    t: "Les trois dossiers n'ont ni la même taille ni la même durée : il faut les comparer à la VAN, au taux du groupe, et retenir la combinaison qui crée le plus de valeur dans l'enveloppe",
  },
  {
    id: "enveloppe",
    t: "L'enveloppe ne permet pas tout : il faut d'abord faire tenir le plus de projets possible dans 700 k€",
  },
  {
    id: "delai",
    t: "Les volumes sont incertains : il faut les projets qui se remboursent le plus vite",
  },
  {
    id: "tri",
    t: "Il faut les projets les plus rentables, ceux qui ont le meilleur TRI",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Trois dossiers, une enveloppe",
    jusqua: 2,
    messages: () => [
      {
        ...SEGOLENE,
        heure: "08:15",
        alerte: true,
        texte:
          "Myriam, le comité d'investissement se réunit vendredi prochain. Ton enveloppe pour l'an prochain : 700 k€. Tu as trois dossiers sur la table et ils ne tiennent pas tous dedans. J'attends ta recommandation, chiffrée.",
      },
      {
        ...DOMINIQUE,
        heure: "09:00",
        texte:
          "Les chariots se remboursent en moins de trois ans, le WMS en quatre. Le stockeur, c'est six ans, et le TRI le plus faible des trois. À ta place, je ne me compliquerais pas la vie.",
      },
      {
        ...SANDRO,
        heure: "10:20",
        texte:
          "En petites pièces, on plafonne à 62 lignes à l'heure et on finit les journées avec des intérimaires. Ce qu'il nous faut, c'est arrêter de courir dans les allées.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "dossiers",
        titre: "Remettre les trois dossiers au même format",
        cout: 1,
        nature: "decisive",
        resultat:
          "Stockeur automatique : 480 k€ d'investissement, plus 80 k€ de stock à constituer au démarrage pour les 2 000 références que la place libérée permet d'ajouter, récupérés en fin de projet. 95 k€ de flux nets par an pendant dix ans, maintenance déduite ; les tours se revendront 50 k€ au bout de dix ans. Le fournisseur n'a calculé ni VAN ni TRI. Chariots électriques : 140 k€, 48 k€ d'économies par an pendant six ans, batteries à remplacer la quatrième année (40 k€), revente 10 k€ ; VAN à 8 % : 59 k€, TRI : 21 %, délai de récupération : 2,9 ans. Logiciel de gestion d'entrepôt : 250 k€, 20 k€ la première année, le temps du déploiement, puis 78 k€ par an pendant cinq ans ; VAN à 8 % : 57 k€, TRI : 14 %, délai de récupération : 3,9 ans.",
      },
      {
        id: "regles",
        titre: "Relire la note de la direction financière sur les investissements",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Taux d'actualisation du groupe : 8 %. Les flux des dossiers sont des flux nets de trésorerie après impôt, en fin d'année ; l'investissement et le stock de départ se comptent en début de projet, le stock et la valeur résiduelle se récupèrent la dernière année. Le comité retient les projets à la VAN, dans la limite de l'enveloppe de chaque site : 700 k€ d'investissements pour la plateforme, stock non compris. Une enveloppe non utilisée retourne au groupe.",
      },
      {
        id: "fournisseur",
        titre: "Recevoir l'ingénieur commercial du stockeur",
        cout: 1,
        nature: "bruit",
        resultat:
          "Simon Cazenave : « Avec les 30 % de lignes en plus que vous aurez d'ici trois ans, et nos 165 lignes à l'heure, le stockeur se rembourse en moins de quatre ans. Je vous conseillerais même la version à huit tours. » Ses chiffres supposent la croissance qu'il annonce et la cadence de sa plaquette, sans le stock à constituer.",
      },
      {
        id: "volumes",
        titre: "Extraire l'historique des volumes de préparation",
        cout: 0.5,
        nature: "utile",
        resultat:
          "1 150 petites lignes par jour en moyenne cette année, stables depuis trois ans, à 4 % près d'une semaine à l'autre. Le groupe étudie le rattachement des six agences du Nord-Isère à la plateforme : 30 % de petites lignes en plus à partir d'avril, si le comité de direction dit oui mi-décembre. Aucun des dossiers ne le compte.",
      },
      {
        id: "conseil",
        titre: "Appeler Ismaël Rigal, contrôleur de gestion du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Ismaël Rigal : « Ne classe pas des projets de tailles et de durées différentes au TRI ni au délai de récupération. Le comité veut savoir combien chacun crée de valeur, en euros, au taux du groupe, et ce que l'enveloppe permet d'en faire tenir. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au comité ?",
    options: [
      {
        t: "Les chariots et le WMS : les deux meilleurs TRI, les deux délais de récupération les plus courts",
        d: "390 k€ sur 700. Le WMS en service en semaine 10, les chariots livrés en semaine 11.",
      },
      {
        t: "Le stockeur et les chariots : la plus forte VAN que l'enveloppe permet",
        d: "620 k€ sur 700, et 80 k€ de stock à financer. Le stockeur en service en semaine 10, les chariots en semaine 11.",
      },
      {
        t: "Le stockeur seul, en gardant 220 k€ de réserve pour les aléas",
        d: "480 k€ sur 700. Le stockeur en service en semaine 10.",
      },
      {
        t: "Reporter les trois dossiers au comité de mars, le temps de les fiabiliser",
        d: "Rien n'est engagé ce trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...SEGOLENE,
          texte:
            "Le comité valide les chariots et le WMS : 390 k€. Deux beaux TRI. Les 310 k€ restants retournent au groupe.",
        },
      ],
      [
        {
          ...SEGOLENE,
          texte:
            "Le comité valide le stockeur et les chariots : 620 k€. Le stockeur a le TRI le plus faible des trois, mais c'est lui qui crée le plus de valeur : l'argument a porté.",
        },
      ],
      [
        {
          ...SEGOLENE,
          texte:
            "Le comité valide le stockeur : 480 k€. Les 220 k€ restants retournent au groupe ; une réserve, on la demande quand on en a besoin.",
        },
      ],
      [
        {
          ...SEGOLENE,
          texte:
            "Le comité prend acte. L'enveloppe de la plateforme est redistribuée aux autres sites ; on en reparlera en mars.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le fournisseur pousse la version étendue",
    jusqua: 4,
    messages: (ctx) => [
      ctx.grand === "stockeur"
        ? {
            ...fournisseur(ctx),
            heure: "15:30",
            alerte: true,
            texte:
              "Madame Duchemin, félicitations pour le comité. Avant de signer : avec la croissance qui vous attend, six tours seront trop justes dans deux ans. La version à huit tours, c'est 70 k€ de plus aujourd'hui ; plus tard, ce sera plus cher et plus long.",
          }
        : ctx.grand === "wms"
          ? {
              ...fournisseur(ctx),
              heure: "15:30",
              alerte: true,
              texte:
                "Madame Duchemin, félicitations pour le comité. Avec la croissance qui vous attend, prenez tout de suite les licences pour quarante utilisateurs et le module vocal : 30 k€ de plus aujourd'hui ; plus tard, ce sera plus cher et plus long.",
            }
          : {
              ...fournisseur(ctx),
              heure: "15:30",
              alerte: true,
              texte:
                "Dommage pour le comité. Si vous représentez le stockeur en mars, pensez à la version à huit tours : avec la croissance qui vous attend, six seront trop justes.",
            },
      {
        ...ACHATS,
        heure: "16:10",
        texte: ctx.grand
          ? "Le contrat est prêt à signer. Le fournisseur accepte de discuter une clause d'extension, ou une garantie de cadence, si vous la demandez."
          : "Rien à signer cette fois-ci. Nous gardons les offres pour le comité de mars.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "sensibilite",
        titre: "Calculer ce que rapporterait l'extension, selon les volumes",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.grand
            ? `La version de base absorbe 10 % de petites lignes en plus ; l'extension ne sert qu'au-delà. Achetée maintenant, elle crée ${ctx.extOui} de VAN si le groupe rattache les agences du Nord-Isère (30 % de lignes en plus à partir d'avril), et elle en détruit ${ctx.extNon} s'il ne le fait pas, maintenance comprise. À quatre chances sur dix, c'est ${ctx.extEsperance} en espérance. Les 30 % de croissance du fournisseur, c'est le rattachement tenu pour acquis.`
            : "Aucun grand projet n'a été retenu : il n'y a rien à étendre ce trimestre.",
      },
      {
        id: "reference",
        titre: "Appeler les plateformes du groupe équipées par le même fournisseur",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur les quatre plateformes du groupe équipées par ce fournisseur, la cadence mesurée la première année est restée en moyenne 3 % sous celle du dossier, 12 % sous pour la moins bonne, et bien en dessous de la plaquette partout. Le fournisseur a accepté une fois sur deux de garantir la cadence, contre 1 % du prix.",
      },
    ],
    question: "Que signez-vous ?",
    options: [
      {
        t: "La version étendue, tout de suite",
        d: "Le supplément se paie à la commande, la maintenance augmente en proportion. La capacité absorbe 45 % de volume en plus.",
      },
      {
        t: "La version de base, en exigeant une garantie de cadence assortie d'indemnités",
        d: "Le fournisseur demandera 1 % du prix en plus. Il acceptera, ou pas.",
      },
      {
        t: "La version de base, avec une clause d'extension à prix et délai garantis pendant un an",
        d: "2 000 € pour la clause. L'extension se commande seulement si on en a besoin, livrée en huit semaines.",
      },
      {
        t: "La version de base, sans plus",
        d: "Rien de plus à payer. Après novembre, une extension se paiera au nouveau tarif, avec six mois de délai.",
      },
    ],
    reactions: [
      [
        {
          ...ACHATS,
          texte:
            "Commande passée pour la version étendue. Le fournisseur nous remercie de notre confiance.",
        },
      ],
      null,
      [
        {
          ...ACHATS,
          texte:
            "Clause signée : prix et délai de l'extension garantis jusqu'à la fin de l'an prochain.",
        },
      ],
      [{ ...ACHATS, texte: "Commande passée pour la version de base." }],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "La mezzanine inachevée",
    jusqua: 6,
    messages: () => [
      {
        ...DOMINIQUE,
        heure: "09:10",
        alerte: true,
        texte:
          "Myriam, l'entreprise de la mezzanine attend ton ordre de service pour reprendre. On y a mis 210 k€ avec ton prédécesseur, je les ai défendus au comité l'an dernier. On ne va pas les jeter.",
      },
      {
        ...GAELLE,
        heure: "11:00",
        texte:
          "Pour finir la mezzanine : 90 k€ et quatre semaines. Les éléments déjà livrés sont stockés chez l'entreprise, à 1 500 € par mois tant qu'on ne décide rien.",
      },
    ],
    sources: [
      {
        id: "rapport",
        titre: "Chiffrer ce que la mezzanine rapporterait une fois finie",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Finie, elle ajouterait 800 m² de préparation : 11 k€ de gains par an pendant dix ans${
            ctx.stockeur
              ? ", mais 4 k€ seulement avec le stockeur, qui prend les petites pièces qu'elle devait accueillir"
              : ""
          } ; 4 k€ de plus par an si le rattachement se fait. Le seul premier niveau, pour le vrac, coûterait 50 k€ et rapporterait 6 k€ par an. Arrêtée, les éléments livrés se revendent entre 24 et 36 k€, démontage 4 k€. Les 210 k€ déjà payés ne reviendront dans aucun des cas.`,
      },
      {
        id: "controle",
        titre: "Interroger le bureau de contrôle",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Aimé Margerie : « La structure a été calculée avant la nouvelle norme sur les charges d'exploitation. Sur ce type d'ouvrage, nous exigeons un renfort une fois sur deux : 25 k€. Nous le saurons à la reprise du chantier. »",
      },
    ],
    question: "Que faites-vous de la mezzanine ?",
    options: [
      {
        t: "La terminer : 210 k€ y sont déjà",
        d: "90 k€ pour finir, livrée en semaine 9.",
      },
      {
        t: "Ne terminer que le premier niveau, pour le stockage en vrac",
        d: "50 k€ ; ni picking, ni petites pièces.",
      },
      {
        t: "Arrêter le chantier et revendre les éléments livrés",
        d: "4 k€ de démontage ; le prix dépendra des offres.",
      },
      {
        t: "Geler le chantier en attendant d'y voir plus clair",
        d: "1 500 € par mois de stockage chez l'entreprise. La décision est reportée.",
      },
    ],
    reactions: [
      [{ ...DOMINIQUE, texte: "Merci. On ne laisse pas un chantier en plan." }],
      [
        {
          ...GAELLE,
          texte: "Le premier niveau reprend lundi. Les sacs de vrac y seront bien, à l'abri.",
        },
      ],
      null,
      [{ ...GAELLE, texte: "Je préviens l'entreprise. Les éléments restent chez eux." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Plomb ou lithium",
    jusqua: 8,
    messages: (ctx) => [
      ctx.chariots
        ? {
            ...DESIRE,
            heure: "10:00",
            alerte: true,
            texte:
              "Madame Duchemin, il faut figer la commande des chariots cette semaine pour une livraison en semaine 11. Batteries au plomb, comme au dossier, ou lithium-ion ? Le lithium, c'est 36 k€ de plus.",
          }
        : {
            ...DESIRE,
            heure: "10:00",
            alerte: true,
            texte:
              "Madame Duchemin, le comité n'a pas retenu nos chariots. Notre offre reste valable jusqu'à la fin de l'année, en plomb ou en lithium-ion, si vous voulez la représenter.",
          },
      {
        ...DOMINIQUE,
        heure: "11:30",
        texte:
          "Prends le plomb. 36 k€ de plus, ça rallonge le délai de récupération, et le comité a validé 140 k€, pas 176.",
      },
    ],
    sources: [
      {
        id: "batteries",
        titre: "Comparer les deux batteries sur toute la vie des chariots",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur six ans de double équipe, le plomb (70 k€ pour les dix chariots) tient 1 200 cycles, soit quatre ans, puis se remplace pour 40 k€ ; il lui faut aussi des batteries de rechange et une salle de charge ventilée. Le lithium (106 k€) tient 3 000 cycles : aucun remplacement, 4 k€ d'énergie et d'entretien en moins par an, et des batteries qui valent encore 6 k€ à la revente des chariots.",
      },
      {
        id: "heures",
        titre: "Relever les compteurs horaires des chariots au gaz",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${ctx.heures} heures par chariot en moyenne sur les douze derniers mois, pour 2 900 au dossier : les économies, comme celles du lithium, suivent les heures.`,
      },
    ],
    question: "Quelle commande passez-vous ?",
    options: [
      {
        t: "Passer au lithium-ion",
        d: "36 k€ de plus à la commande ; ni remplacement en cours de vie, ni batteries de rechange.",
      },
      {
        t: "Garder le plomb prévu au dossier",
        d: "Ce que le comité a validé, au prix validé.",
      },
      {
        t: "Reporter la livraison au printemps pour mettre trois fournisseurs en concurrence",
        d: "Les chariots au gaz tournent quatre mois de plus ; 5 % de remise espérée.",
      },
    ],
    reactions: [
      [
        {
          ...DESIRE,
          texte:
            "C'est noté : dix chariots en lithium-ion, livrés en semaine 11 avec leurs chargeurs.",
        },
      ],
      [
        {
          ...DESIRE,
          texte:
            "C'est noté : dix chariots au plomb et dix batteries de rechange, livrés en semaine 11.",
        },
      ],
      [
        {
          ...SANDRO,
          texte: "Encore un hiver avec les chariots au gaz. On ouvrira les portes du quai.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Commander l'extension ?",
    jusqua: 11,
    messages: (ctx) => [
      ctx.grand
        ? {
            ...fournisseur(ctx),
            heure: "09:40",
            alerte: true,
            texte: ctx.etendue
              ? "Votre version étendue s'installe. Si le rattachement se fait et que les volumes dépassent encore nos prévisions, une seconde extension serait prudente : je peux la réserver dès maintenant, au prix d'aujourd'hui."
              : "Le prix de l'extension n'est garanti que jusqu'à fin novembre. Si le rattachement se fait, il faudra être prêts en avril : je vous conseille de commander maintenant.",
          }
        : {
            ...TABLEAU,
            heure: "09:40",
            texte: "Aucun grand projet en cours : rien à étendre.",
          },
      {
        ...DOMINIQUE,
        heure: "11:15",
        texte:
          "Le rattachement, c'est fait à 90 %. Le comité de direction en parle mi-décembre, mais tout le monde sait que c'est acquis.",
      },
      ...(ctx.grand
        ? [
            {
              ...TABLEAU,
              heure: "18:00",
              texte: `Mise en service prévue en semaine ${ctx.miseEnService}. Surcoût du chantier connu à ce jour : ${ctx.surcout}. Enveloppe engagée : ${ctx.engage} sur ${ctx.enveloppe}.`,
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "seuil",
        titre: "Calculer ce que vaut l'extension, maintenant ou après la décision du groupe",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.grand
            ? "Aucun grand projet en cours : il n'y a rien à étendre."
            : ctx.etendue
              ? `La version étendue absorbe déjà les 30 % du rattachement. Une seconde extension ne servirait à rien : ${ctx.secondeExtension} de VAN, maintenance comprise.`
              : `Commandée maintenant${
                  ctx.clause
                    ? ", au prix bloqué par la clause, livrée en huit semaines"
                    : ", au prix d'aujourd'hui, livrée en 24 semaines"
                } : ${ctx.maintenantOui} si le groupe dit oui, ${ctx.maintenantNon} s'il dit non, soit ${ctx.maintenantEsperance} en espérance. Commandée en semaine 12 seulement s'il dit oui${
                  ctx.clause
                    ? ", au même prix et dans le même délai"
                    : ", au tarif de décembre (15 % de plus) et en 24 semaines, des gains perdus au printemps"
                } : ${ctx.attenteOui} si oui, rien si non, soit ${ctx.attenteEsperance} en espérance.`,
      },
      {
        id: "comite",
        titre: "Demander à Ségolène Marchais où en est le rattachement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le comité de direction examinera le dossier mi-décembre, en semaine 12. Deux des six agences y sont opposées, et le coût des tournées n'est pas encore chiffré : rien n'est décidé. Pour elle, une chance sur trois ou sur deux, pas plus.",
      },
    ],
    question: "Que faites-vous de l'extension ?",
    options: [
      {
        t: "Y renoncer : la version de base suffira",
        d: "Rien à payer. Si le rattachement se fait, les lignes en trop se prépareront à la main.",
      },
      {
        t: "La commander maintenant, pour être prêts au printemps",
        d: "Au prix d'aujourd'hui ; installée avant l'été.",
      },
      {
        t: "Attendre la décision du groupe, et ne la commander que si le rattachement est confirmé",
        d: "Rien à payer d'ici là ; la commande partira mi-décembre, ou pas.",
      },
    ],
    reactions: [
      [{ ...ACHATS, texte: "Pas d'extension : nous l'indiquons au fournisseur." }],
      [{ ...ACHATS, texte: "Commande d'extension passée, au prix de novembre." }],
      [
        {
          ...ACHATS,
          texte: "Nous attendons la décision du groupe. Le bon de commande est prêt, non signé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Le contrat de maintenance",
    jusqua: 13,
    messages: (ctx) => [
      ctx.grand
        ? {
            ...fournisseur(ctx),
            heure: "10:30",
            alerte: true,
            texte: `Pour la maintenance, deux formules : le contrat annuel, ${ctx.contratAnnuel} payés à la fin de chaque année, ou cinq ans payés d'avance, ${ctx.contratPrepaye} au lieu de ${ctx.contratCinqAns}. Sans contrat, nous intervenons au tarif horaire.`,
          }
        : {
            ...TABLEAU,
            heure: "10:30",
            texte: "Aucun équipement neuf à maintenir ce trimestre.",
          },
      {
        ...ACHATS,
        heure: "14:00",
        texte: ctx.grand
          ? `Prépayer, c'est ${ctx.contratEconomie} d'économie, et ça soulage les budgets des quatre années suivantes. On signe ?`
          : "Rien à signer.",
      },
    ],
    sources: [
      {
        id: "actualiser",
        titre: "Poser les deux formules au taux du groupe",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.grand
            ? `Le contrat annuel se paie à terme échu : ${ctx.contratAnnuel} à la fin de chacune des cinq années. Le prépaiement : ${ctx.contratPrepaye} à la signature. Taux du groupe : ${ctx.taux}. Sans contrat, les sites équipés paient en moyenne autant d'interventions que le contrat, plus les pannes non couvertes.`
            : "Aucun équipement neuf : rien à comparer.",
      },
      {
        id: "pannes",
        titre: "Demander aux sites équipés leurs pannes des premières semaines",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.grand
            ? `Quatre sites sur dix ont eu une panne de jeunesse dans les trois premières semaines. Sans contrat, elle a coûté ${ctx.contratPanne} d'intervention et une semaine de gains perdue ; sous contrat, rien.`
            : "Aucun équipement neuf : rien à demander.",
      },
    ],
    question: "Quelle formule de maintenance retenez-vous ?",
    options: [
      {
        t: "Le contrat annuel, payé en fin d'année",
        d: "Le prix annuel du contrat, à la fin de chacune des cinq années.",
      },
      {
        t: "Pas de contrat : payer les interventions à la demande",
        d: "Rien à payer d'avance ; chaque intervention se facture au tarif horaire.",
      },
      {
        t: "Prépayer les cinq ans, avec la remise du fournisseur",
        d: "Le prix de cinq années moins 15 %, payé à la signature.",
      },
    ],
    reactions: [
      [{ ...ACHATS, texte: "Contrat annuel signé : visite préventive chaque trimestre." }],
      [{ ...ACHATS, texte: "Pas de contrat : le fournisseur interviendra à la demande." }],
      [{ ...ACHATS, texte: "Prépaiement signé et réglé. Cinq ans de tranquillité." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "La valeur avant le délai", chemin: [1, 2, 2, 0, 2, 0] },
  { nom: "Le retour le plus rapide", chemin: [0, 0, 0, 1, 1, 2] },
  { nom: "Attentiste", chemin: [3, 3, 3, 1, 0, 1] },
] as const;

/**
 * Les réflexes du métier devant un investissement : choisir au TRI ou au
 * délai de récupération, prendre les prévisions du fournisseur pour argent
 * comptant, poursuivre parce qu'on y a déjà mis de l'argent, oublier les flux
 * différés. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 1],
  [4, 1],
  [5, 2],
] as const;

export const REPONSES = {
  garantieAcceptee:
    "Le fournisseur accepte de garantir la cadence du dossier à 5 % près pendant trois ans, avec indemnités, contre 1 % du prix en plus. C'est signé.",
  garantieRefusee:
    "Le fournisseur refuse toute garantie de cadence : « nos chiffres parlent d'eux-mêmes ». Nous signons la version de base.",
  offreHaute:
    "Je vous reprends l'ensemble pour 36 000 € : poteaux, poutres, planchers et escalier. Démontage à votre charge.",
  offreBasse:
    "24 000 €, c'est mon dernier prix : le marché de l'occasion est plein de rayonnages en ce moment. Démontage à votre charge.",
  renfort:
    "La reprise du chantier l'a confirmé : la structure doit être renforcée avant toute mise en charge. 25 k€ de plus.",
  pasDeRenfort: "La structure passe sans renfort. Bon pour la mise en charge.",
  rattachementOui:
    "Le comité de direction a tranché : les six agences du Nord-Isère seront livrées par Saint-Quentin-Fallavier à partir d'avril. Le groupe abonde ton enveloppe de 100 k€.",
  rattachementNon:
    "Le comité de direction renonce au rattachement : les agences du Nord-Isère restent livrées par Grenoble.",
  extensionCommandee: "Rattachement confirmé : l'extension est commandée.",
  pasDExtension: "Pas de rattachement : pas d'extension. Rien n'a été dépensé.",
} as const;
