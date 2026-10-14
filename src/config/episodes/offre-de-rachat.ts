/**
 * L'OFFRE DE RACHAT — le contenu de l'épisode.
 *
 * Yannig Le Goaziou dirige la Laiterie de Kerbrélan pour la famille
 * Guivarc'h. Un lundi de septembre, le Groupe Nordal remet au président une
 * offre sur 100 % des titres, à 7,5 fois l'EBE, valable six semaines. La
 * famille est divisée : une branche veut vendre, l'autre garder. Le conseil
 * d'administration attend du directeur général une recommandation, puis la
 * conduite de l'opération jusqu'au protocole. Six décisions, chacune
 * précédée de ce qu'un directeur général reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la valeur au multiple des comparables, la valeur du
 * plan réaliste par scénario, le coût des points faibles, ce que vaut le
 * complément de prix, ce que coûterait le départ des producteurs.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape, Message } from "./types";

const LENAIC = { de: "Lénaïc Guivarc'h", role: "Président" } as const;
const ALANIG = { de: "Alanig Guivarc'h", role: "Administrateur, cousin du président" } as const;
const GAIDIG = { de: "Gaïdig Guivarc'h", role: "Administratrice, tante du président" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const HOEL = {
  de: "Hoel Quiniou",
  role: "Responsable de la collecte et des relations avec les producteurs",
} as const;
const SIEBE = { de: "Siebe Hoekstra", role: "Directeur des acquisitions, Groupe Nordal" } as const;
const NICODEME = {
  de: "Nicodème Trébaol",
  role: "Président de la coopérative laitière Kérouval",
} as const;
const KONOGAN = { de: "Konogan Kerguéris", role: "Président de l'OP Lait du Méné" } as const;
const ERMENGARDE = {
  de: "Maître Ermengarde Albiach",
  role: "Avocate d'affaires de la laiterie",
} as const;
const VIGOUROUX = {
  de: "Brendan Vigouroux",
  role: "Banquier d'affaires, mandaté pour la vente",
} as const;
const NATHANAELLE = {
  de: "Nathanaëlle Kerleroux",
  role: "Associée, cabinet d'audit",
} as const;

/** L'acquéreur en lice, tel qu'il signe ses messages. */
const acquereur = (ctx: Contexte) => (ctx.acquereurCoop ? NICODEME : SIEBE);

export const DIAGNOSTICS = [
  {
    id: "trois-reperes",
    t: "Une offre se juge contre trois repères : ce que vaut la laiterie si elle reste indépendante, sur un plan réaliste et actualisé ; ce que d'autres acquéreurs paieraient ; et ses conditions. Il faut les établir avant de répondre, sans laisser l'offre expirer",
  },
  {
    id: "sous-le-marche",
    t: "L'offre est en dessous du multiple des transactions comparables : il faut obtenir de Nordal qu'il relève son prix",
  },
  {
    id: "fenetre",
    t: "Une offre à 7,5 fois l'EBE, dans un marché laitier aussi incertain, est une fenêtre qui ne se rouvrira pas : il faut la saisir avant qu'elle n'expire",
  },
  {
    id: "independance",
    t: "La laiterie vaut plus pour la famille et pour ses producteurs que ce qu'un groupe en offrira : la question est de préserver son indépendance",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "L'offre de Nordal",
    jusqua: 2,
    messages: () => [
      {
        ...LENAIC,
        heure: "07:45",
        alerte: true,
        texte:
          "Yannig, Nordal m'a remis ce matin une offre sur 100 % des titres : 7,5 fois l'EBE, 97,5 M€ de valeur d'entreprise, la dette reprise. Valable six semaines, et ils demandent l'exclusivité. Le conseil se réunit jeudi ; j'attends ta recommandation. Septembre, octobre, novembre : on a le trimestre pour décider.",
      },
      {
        ...ALANIG,
        heure: "09:10",
        texte:
          "Ma branche détient 40 % et n'a jamais vu un dividende digne de ce nom. 97,5 M€, c'est inespéré avec ce que fait le prix du lait. On signe avant qu'ils changent d'avis.",
      },
      {
        ...GAIDIG,
        heure: "11:30",
        texte:
          "Mon père a fondé cette laiterie avec trois cents producteurs du Méné. On ne la vend pas à Nordal, qui ferme ce qu'il achète. Je voterai contre.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comparables",
        titre: "Rassembler les cessions de laiteries comparables",
        cout: 1,
        nature: "decisive",
        resultat:
          "Cinq cessions de laiteries de produits frais depuis quatre ans, en multiple de l'EBE : une laiterie de produits frais de Mayenne rachetée par un groupe laitier, 7,4 ; les desserts lactés d'une coopérative du Sud-Ouest, 7,8 ; une laiterie spécialisée dans les MDD, dans le Nord, reprise par un fonds, 8,1 ; un fabricant de yaourts de marque régionale en Auvergne, 8,5 ; une marque de yaourts biologiques haut de gamme, très disputée, 10,9. Les praticiens retiennent la médiane, qu'un cas hors norme ne déplace pas. EBE de la laiterie au dernier exercice : 13,0 M€, 7 % de 185 M€ de chiffre d'affaires.",
      },
      {
        id: "plan",
        titre: "Faire refaire le plan d'affaires par Iwan Szymanski, version réaliste",
        cout: 1,
        nature: "decisive",
        resultat:
          "Iwan Szymanski : « J'ai repris le plan de la direction avec trois scénarios de marché laitier, flux actualisés à 8 %. Marché porteur, à peu près trois chances sur dix : 112 M€ de valeur d'entreprise. Marché moyen, un peu moins d'une chance sur deux : 97 M€. Marché dégradé, une chance sur quatre : 78 M€. Ce plan ne compte pas les points faibles qu'un audit trouverait ; le stérilisateur de la ligne UHT de Pontivy date de 1998, et la station d'épuration de Loudéac frôle les seuils de son arrêté. Pour passer de la valeur d'entreprise à celle des titres, il faut retirer 16 M€ de dette financière nette. »",
      },
      {
        id: "nordal",
        titre: "Chercher ce que Nordal a fait lors de ses derniers rachats",
        cout: 0.5,
        nature: "utile",
        resultat:
          "En 2024, Nordal a racheté une laiterie normande après un second tour discret face à un fonds : son offre est passée de 7,2 à 8,0 fois l'EBE. En 2023, il s'est retiré d'une enchère ouverte en Vendée : « nous ne participons pas aux enchères ». Il demande toujours l'exclusivité d'emblée. Après le rachat normand, il a supprimé les tournées de collecte les plus éloignées de l'usine.",
      },
      {
        id: "banquier",
        titre: "Recevoir le banquier d'affaires qui propose ses services",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Brendan Vigouroux : « Le plan de votre direction donne 121 M€. Mettez la laiterie aux enchères, envoyez le dossier à quinze acquéreurs, et je vous obtiens dix fois l'EBE : 130 M€. Ma rémunération : 300 k€ de forfait et 1,5 % du prix. » Son estimation suppose un marché porteur et aucun point faible.",
      },
      {
        id: "conseil",
        titre: "Appeler Pétronille Le Scouarnec, qui a vendu la laiterie qu'elle dirigeait",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Pétronille Le Scouarnec : « Une offre se juge contre trois choses : ce que vaut ta laiterie si la famille la garde, calculé honnêtement ; ce que d'autres paieraient ; et ce qu'il y a derrière le prix, les conditions. Ne donne pas l'exclusivité avant de savoir, et ne refuse pas avant d'avoir calculé. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au conseil ?",
    options: [
      {
        t: "Accepter l'offre et signer l'exclusivité qu'il demande, avant qu'elle n'expire",
        d: "97,5 M€ de valeur d'entreprise, sous réserve de son audit. Nordal seul en lice pendant huit semaines.",
      },
      {
        t: "La décliner : la laiterie est familiale et n'est pas à vendre",
        d: "Nordal est remercié. La laiterie poursuit son plan.",
      },
      {
        t: "Ni oui ni non : établir la valeur de la laiterie indépendante et sonder discrètement un second acquéreur, sans exclusivité",
        d: "Nordal est informé que le conseil étudie son offre dans le délai. Une approche confidentielle de la coopérative Kérouval.",
      },
      {
        t: "Confier à une banque d'affaires la mise aux enchères de la laiterie",
        d: "300 k€ de forfait et 1,5 % du prix en cas de vente. Le dossier part à une quinzaine d'acquéreurs.",
      },
    ],
    reactions: [
      [
        {
          ...LENAIC,
          texte:
            "Le conseil suit ta recommandation, à une voix près. La lettre d'exclusivité part ce soir chez Nordal. Gaïdig a demandé que son opposition figure au procès-verbal.",
        },
      ],
      [
        {
          ...LENAIC,
          texte:
            "Le conseil décline l'offre. Alanig a voté contre et parle de faire racheter sa branche par quelqu'un d'autre. J'écris à Nordal.",
        },
      ],
      [
        {
          ...LENAIC,
          texte:
            "Le conseil te suit : ni oui ni non, pas d'exclusivité. J'écris à Nordal que nous étudions son offre dans le délai. Approche Kérouval, mais que rien ne sorte.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ouvrir les comptes à un concurrent",
    jusqua: 4,
    messages: (ctx) => {
      const m: Message[] = [];
      if (ctx.nordal) {
        m.push({
          ...SIEBE,
          heure: "09:00",
          alerte: true,
          texte: ctx.exclusivite
            ? "Merci pour l'exclusivité. Nos équipes sont prêtes : comptes, contrats clients, marges par enseigne, prix de cession des MDD, contrats des producteurs. Pouvez-vous ouvrir la data room lundi ?"
            : "Nous comprenons que le conseil étudie notre offre. Pour la confirmer, il nous faut auditer : comptes, contrats clients, marges par enseigne, prix de cession des MDD, contrats des producteurs. Notre offre court jusqu'au vendredi de la semaine 6.",
        });
      } else if (ctx.enchere) {
        m.push({
          ...VIGOUROUX,
          heure: "09:00",
          texte:
            "Nordal s'est retiré, mais le dossier circule : quatre marques d'intérêt, dont une coopérative bretonne. Tous demandent à auditer avant de faire une offre.",
        });
      } else {
        m.push({
          ...SIEBE,
          heure: "09:00",
          texte: "Nous prenons acte de la décision de votre conseil. Notre porte reste ouverte.",
        });
      }
      m.push({
        ...ALANIG,
        heure: "10:40",
        texte: ctx.nordal
          ? "Ouvre-leur tout, tout de suite. Chaque jour perdu, c'est un risque qu'ils retirent leur offre."
          : "Je maintiens qu'on aurait dû discuter. Fais au moins faire un audit sérieux de la maison, qu'on sache ce qu'elle vaut.",
      });
      return m;
    },
    reevaluation: true,
    sources: [
      {
        id: "points-faibles",
        titre: "Demander à Klervi Nédélec et Djibril Ouedraogo ce qu'un audit trouverait",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Klervi Nédélec : « Le stérilisateur de la ligne UHT n°2 de Pontivy a vingt-huit ans. Une chance sur deux qu'un expert conclue à son remplacement sous deux ans : 3,5 M€. » Djibril Ouedraogo : « Les rejets de la station d'épuration de Loudéac frôlent les seuils ; deux chances sur cinq qu'une mise aux normes s'impose : 2,5 M€. » Nathanaëlle Kerleroux, associée d'un cabinet d'audit : « Un acquéreur qui découvre un point faible demande en général 1,4 à 2 fois son coût. Chiffré d'avance par un audit vendeur, il se négocie sur son coût, guère au-delà. L'audit vendeur : 350 k€, trois semaines. Et une coopérative ne fait d'offre qu'au vu de comptes audités. »",
      },
      {
        id: "avocate",
        titre: "Consulter Maître Albiach sur l'accès d'un concurrent aux données",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Maître Ermengarde Albiach : « Nordal est votre premier concurrent. Vos marges par enseigne et vos prix de cession MDD sont des informations sensibles : on les réserve à une équipe restreinte, ses conseils extérieurs, qui ne rapportent que des synthèses. S'il voit tout et n'achète pas, il saura exactement où vous attaquer aux prochains appels d'offres MDD : chez un fromager du Finistère, un cas semblable a coûté environ 1,5 M€ de valeur. »",
      },
    ],
    question: "Comment ouvrez-vous les comptes ?",
    options: [
      {
        t: "Ouvrir toute la data room à Nordal dès lundi, pour tenir le délai de son offre",
        d: "Comptes, contrats, marges par enseigne, prix de cession MDD : tout est accessible à ses équipes.",
      },
      {
        t: "Faire d'abord un audit vendeur, puis ouvrir une data room où les points faibles sont chiffrés, les données sensibles réservées à une équipe restreinte",
        d: "350 k€ et trois semaines. Les marges par enseigne ne sont vues que par les conseils extérieurs de l'acquéreur.",
      },
      {
        t: "Ouvrir une data room limitée, les données sensibles réservées à une équipe restreinte",
        d: "Rien à payer ; l'audit de l'acquéreur commence la semaine prochaine.",
      },
      {
        t: "Refuser tout audit tant que Nordal n'a pas amélioré son offre",
        d: "Nordal est mis devant son prix. Il peut le prendre mal.",
      },
    ],
    reactions: [
      [{ ...IWAN, texte: "Data room ouverte. Les équipes de Nordal y étaient dès lundi 8 h." }],
      [
        {
          ...NATHANAELLE,
          texte:
            "Nous commençons lundi par Pontivy et la station de Loudéac. Premières conclusions dans deux semaines.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "Data room limitée ouverte ; les marges par enseigne ne sont accessibles qu'aux conseils extérieurs.",
        },
      ],
      [
        {
          ...LENAIC,
          texte:
            "J'ai écrit à Siebe Hoekstra : pas d'audit tant que le prix n'a pas bougé. Il m'a répondu qu'il en parlait à son comité.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "L'offre expire dans deux semaines",
    jusqua: 6,
    messages: (ctx) => {
      const m: Message[] = [];
      if (ctx.auditVendeur) {
        m.push({
          ...NATHANAELLE,
          heure: "08:30",
          alerte: !ctx.aucunPoint,
          texte: ctx.aucunPoint
            ? "Audit vendeur terminé : ni le stérilisateur de Pontivy ni la station de Loudéac ne demandent de travaux à court terme. Rien à provisionner."
            : `Audit vendeur terminé : ${ctx.points}. Total chiffré : ${ctx.cout}. C'est désormais dans la data room.`,
        });
      }
      if (ctx.sondee) {
        m.push({
          ...NICODEME,
          heure: "10:15",
          alerte: !!ctx.coop,
          texte: ctx.coop
            ? `Notre conseil d'administration a examiné le dossier : la coopérative Kérouval ferait une offre à ${ctx.coopMultiple} fois l'EBE, ${ctx.coopVE} de valeur d'entreprise, en prix ferme, avec les contrats de vos producteurs repris tels quels. Nos banques suivent.`
            : "Notre conseil d'administration a examiné le dossier. Nous ne ferons pas d'offre : trop tôt pour nous, et trop d'inconnues dans les chiffres.",
        });
      }
      if (ctx.auditRefuse && !ctx.rejet) {
        m.push({
          ...SIEBE,
          heure: "11:00",
          alerte: !!ctx.retraitAudit,
          texte: ctx.retraitAudit
            ? "Notre comité ne fait pas d'offre ferme sans audit. Nous retirons notre offre."
            : "Notre comité maintient l'offre, mais nous auditerons en trois semaines au lieu de six : nous provisionnerons largement ce que nous n'aurons pas le temps de vérifier.",
        });
      }
      if (ctx.nordal) {
        m.push({
          ...SIEBE,
          heure: "14:00",
          alerte: true,
          texte: ctx.exclusivite
            ? "Notre audit avance. Nous vous adresserons le rapport et notre offre ferme en semaine 6."
            : "Je vous rappelle que notre offre expire vendredi prochain. Nous attendons la réponse de votre conseil.",
        });
      }
      m.push({
        ...ALANIG,
        heure: "17:20",
        texte: ctx.exclusivite
          ? "L'exclusivité est signée : qu'on en finisse, et vite."
          : ctx.nordal
            ? "Une offre qui expire, ça se prend. Ne jouez pas avec 97,5 M€."
            : "Il n'y a plus grand-chose sur la table. Je te l'avais dit.",
      });
      m.push({
        ...GAIDIG,
        heure: "18:05",
        texte: "Laissez-la expirer, et n'en parlons plus.",
      });
      return m;
    },
    sources: [
      {
        id: "plafond-nordal",
        titre: "Calculer ce que Nordal peut payer, et ce qu'il fait face à un rival",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Les synergies de Nordal avec la laiterie (collecte, emballages, transport frigorifique) lui permettent de payer jusqu'à 8,5 fois l'EBE sans détruire de valeur pour lui. Dans un second tour discret, face à une offre concurrente crédible, il a suivi presque à chaque fois, en passant devant d'environ 0,35 fois l'EBE. Seul en lice et prié d'améliorer, il a relevé une fois sur trois, et s'est retiré une fois sur sept. Sous exclusivité, il ne relève jamais : il n'a aucune raison de le faire. ${
            ctx.coop
              ? `Face aux ${ctx.coopMultiple} fois de Kérouval, il pourrait aller jusqu'à ${ctx.nordalSiSuit}.`
              : "Aujourd'hui, aucune autre offre n'est sur la table."
          }`,
      },
      {
        id: "offre-coop",
        titre: "Relire avec Maître Albiach ce que contient chaque offre",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${
            ctx.nordal
              ? "Nordal : 7,5 fois l'EBE, prix indicatif, sous réserve de son audit, valable jusqu'au vendredi de la semaine 6. "
              : "Nordal n'est plus en lice. "
          }${
            ctx.coop
              ? `Kérouval : ${ctx.coopMultiple} fois l'EBE, en prix ferme sous réserve d'un audit léger, les contrats des producteurs repris tels quels. `
              : ""
          }Une lettre d'intention signée cette semaine engage à négocier en exclusivité ; un second tour se mène par une lettre de procédure adressée à chacun, avec une date de remise des offres.`,
      },
    ],
    question: "Que faites-vous avant que l'offre de Nordal n'expire ?",
    options: [
      {
        t: "Accepter la meilleure offre sur la table avant que celle de Nordal n'expire",
        d: "Une lettre d'intention signée cette semaine ; plus de second tour.",
      },
      {
        t: "Organiser un second tour : offres améliorées de chaque acquéreur la semaine prochaine, en disant à Nordal qu'il n'est plus seul",
        d: "Une lettre de procédure à chacun. Nordal peut relever son offre, la maintenir, ou se retirer.",
      },
      {
        t: "Demander à Nordal de prolonger son offre de six semaines, sans lui parler d'un autre acquéreur",
        d: "Du temps pour finir le plan. Nordal peut refuser.",
      },
      {
        t: "Laisser expirer l'offre : la laiterie reste indépendante",
        d: "Le conseil poursuit le plan d'affaires ; personne d'autre n'est approché.",
      },
    ],
    reactions: [
      [
        {
          ...ERMENGARDE,
          texte:
            "Lettre d'intention signée avec l'offre la plus haute. L'audit de l'acquéreur se termine en semaine 6.",
        },
      ],
      [
        {
          ...ERMENGARDE,
          texte:
            "Les lettres de procédure sont parties : offres améliorées attendues mercredi prochain, offres fermes après audit.",
        },
      ],
      [{ ...LENAIC, texte: "La demande de prolongation est partie ce matin. Réponse lundi." }],
      [
        {
          ...GAIDIG,
          texte: "Merci. La laiterie restera aux Guivarc'h, et à ses producteurs.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le rapport d'audit",
    jusqua: 8,
    messages: (ctx) => {
      if (!ctx.vente) {
        return [
          {
            ...IWAN,
            heure: "09:00",
            texte:
              "Aucun acquéreur en lice : il n'y a pas de rapport d'audit à discuter. Le plan de la laiterie indépendante suit son cours.",
          },
        ];
      }
      return [
        {
          ...acquereur(ctx),
          heure: "09:30",
          alerte: !ctx.aucunPoint,
          texte: ctx.aucunPoint
            ? "Notre audit est terminé. Il ne trouve rien qui justifie de revoir notre prix ; nous préparons le protocole."
            : `Notre audit est terminé : ${ctx.points}. Nous en tirons une baisse de prix de ${ctx.demande}, à intégrer à notre offre ferme.`,
        },
        {
          ...ALANIG,
          heure: "12:10",
          texte: ctx.aucunPoint
            ? "Parfait. On avance."
            : "Accepte. Ce n'est rien à côté du prix, et on ne va pas tout perdre pour quelques millions.",
        },
      ];
    },
    sources: [
      {
        id: "chiffrage",
        titre: "Rapprocher la baisse demandée du coût réel des points trouvés",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.vente
            ? "Aucun acquéreur en lice : rien à rapprocher."
            : ctx.aucunPoint
              ? "L'audit n'a rien trouvé : il n'y a rien à concéder."
              : `Coût réel des points trouvés : ${ctx.cout}${
                  ctx.auditVendeur
                    ? ", chiffré par l'audit vendeur, que l'acquéreur avait en main"
                    : ", selon nos propres devis"
                }. La baisse demandée, ${ctx.demande}, en vaut ${ctx.facteurDemande} fois : le reste est une provision pour risque, et un levier de négociation.`,
      },
      {
        id: "pratique",
        titre: "Demander à Maître Albiach comment réagit un acquéreur à qui l'on refuse une baisse",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Maître Ermengarde Albiach : « Refuser toute baisse sur un point que l'audit a vraiment trouvé, c'est risquer le retrait : l'acquéreur tient son prix trois fois sur dix s'il sait qu'un autre attend derrière lui, deux fois sur dix sinon. Contester le chiffre, en revanche, se fait : avec un audit vendeur, la baisse se ramène au coût réel ; sans, une contre-expertise à 120 k€ y parvient presque neuf fois sur dix quand un rival attend, deux fois sur trois sinon. »",
      },
    ],
    question: "Que répondez-vous à la baisse demandée ?",
    options: [
      {
        t: "Accepter la baisse demandée, pour ne pas perdre l'acquéreur",
        d: "Le prix baisse du montant demandé ; la signature reste en vue.",
      },
      {
        t: "Refuser toute baisse : le prix annoncé est le prix",
        d: "L'acquéreur tient son prix, ou se retire.",
      },
      {
        t: "Ne concéder que le coût chiffré des points trouvés, et contester le reste, chiffres à l'appui",
        d: "Avec l'audit vendeur s'il a été fait ; sinon, une contre-expertise à 120 k€.",
      },
    ],
    reactions: [
      [
        {
          ...ERMENGARDE,
          texte: "Baisse acceptée. Nous recevrons le projet de protocole en semaine 8.",
        },
      ],
      [
        {
          ...LENAIC,
          texte: "J'ai fait savoir que notre prix ne bougerait pas. On verra s'ils tiennent.",
        },
      ],
      [
        {
          ...IWAN,
          texte:
            "Nos chiffres sont partis ce matin, poste par poste. Nous concédons le coût, pas la provision.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le protocole de cession",
    jusqua: 10,
    messages: (ctx) =>
      !ctx.venteFinale
        ? [
            {
              ...IWAN,
              heure: "09:00",
              texte:
                "Aucun protocole à négocier : la laiterie reste indépendante. Je prépare le budget de l'an prochain.",
            },
          ]
        : [
            {
              ...acquereur(ctx),
              heure: "10:00",
              alerte: true,
              texte: `Voici notre projet de protocole : ${ctx.affiche} affichés pour la valeur d'entreprise, dont ${ctx.ferme4} payés à la signature et jusqu'à 6 M€ de complément de prix selon l'EBE 2027. Garantie d'actif et de passif sans plafond, cinq ans. C'est notre meilleure proposition.`,
            },
            {
              ...ALANIG,
              heure: "11:45",
              texte: `${ctx.affiche} affichés : c'est le chiffre le plus haut qu'on ait vu depuis le début. Signe, avant qu'ils ne changent d'avis.`,
            },
          ],
    sources: [
      {
        id: "complement",
        titre: "Calculer ce que vaut le complément de prix, scénario par scénario",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.venteFinale
            ? "Aucun protocole à négocier : rien à calculer."
            : `Le complément se verse de 0 à 6 M€ quand l'EBE 2027 passe de 13,0 à 14,6 M€. Le plan réaliste prévoit 14,8 M€ en marché porteur, 13,4 en marché moyen, 11,6 en marché dégradé ; l'acquéreur imputera à la laiterie ${ctx.fraisDeGroupe} de frais de groupe par an, qui réduisent d'autant l'EBE mesuré. Aux probabilités de la note de conjoncture, le complément vaut ${ctx.complementAttendu} en espérance, pour 4 M€ de prix ferme abandonnés. Une variante est possible : 2 M€ de prix ferme contre 3 M€ si les volumes de 2027 tiennent, ce qui suppose que Celtis reconduise ses MDD (quatre fois sur cinq) et que les producteurs renouvellent leurs contrats.`,
      },
      {
        id: "garantie",
        titre: "Demander à Maître Albiach ce que coûte une garantie sans plafond",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Maître Ermengarde Albiach : « La garantie couvre le passif que personne n'a vu : un redressement, un litige, une pollution ancienne. ${
            ctx.auditVendeur
              ? "Après votre audit vendeur, on peut l'attendre autour de 0,4 M€."
              : "Sans audit vendeur, comptez autour de 1 M€ en espérance, avec des cas bien pires."
          } Plafonnée à 10 % du prix, sur trois ans, avec une franchise, elle en laisse à peu près la moitié à votre charge. »`,
      },
    ],
    question: "Quelle structure de prix négociez-vous ?",
    options: [
      {
        t: "Accepter la structure proposée : c'est le prix affiché le plus haut",
        d: "4 M€ de prix ferme en moins, jusqu'à 6 M€ de complément selon l'EBE 2027 ; garantie sans plafond, cinq ans.",
      },
      {
        t: "Tout en prix ferme, avec une garantie plafonnée à 10 % du prix, sur trois ans",
        d: "Le prix ferme du second tour ; pas de complément.",
      },
      {
        t: "Un complément limité, indexé sur les volumes, et une garantie plafonnée",
        d: "2 M€ de prix ferme en moins, 3 M€ de complément si les volumes de 2027 tiennent.",
      },
      {
        t: "Garder le complément sur l'EBE, mais plafonner la garantie",
        d: "4 M€ de prix ferme en moins, jusqu'à 6 M€ de complément ; garantie plafonnée à 10 %, trois ans.",
      },
    ],
    reactions: [
      [{ ...ERMENGARDE, texte: "Structure acceptée telle quelle. Nous rédigeons le protocole." }],
      [
        {
          ...ERMENGARDE,
          texte:
            "L'acquéreur accepte un prix entièrement ferme et une garantie plafonnée, en grinçant des dents.",
        },
      ],
      [
        {
          ...ERMENGARDE,
          texte:
            "Accord sur un complément de 3 M€ indexé sur les volumes de 2027, et une garantie plafonnée.",
        },
      ],
      [
        {
          ...ERMENGARDE,
          texte: "Complément sur l'EBE maintenu ; la garantie est plafonnée à 10 % sur trois ans.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les producteurs du Méné",
    jusqua: 13,
    messages: (ctx) => {
      if (!ctx.venteFinale) {
        return [
          {
            ...KONOGAN,
            heure: "09:00",
            texte:
              "Les producteurs ont appris qu'il y avait eu des offres. Ils renouvelleront leurs contrats avec la laiterie en mars, comme toujours. Merci de nous avoir gardés.",
          },
        ];
      }
      if (ctx.acquereurCoop) {
        return [
          {
            ...KONOGAN,
            heure: "09:00",
            texte:
              "Les producteurs savent que la coopérative Kérouval reprend leurs contrats tels quels. Ils renouvelleront en mars.",
          },
          {
            ...NICODEME,
            heure: "14:30",
            texte: "Le protocole est prêt. Nous pouvons signer en semaine 13.",
          },
        ];
      }
      return [
        {
          ...KONOGAN,
          heure: "08:30",
          alerte: true,
          texte:
            "Notre assemblée générale a voté hier soir. Les producteurs qui livrent 86 millions de litres, plus du tiers de la collecte, ne renouvelleront pas leurs contrats-cadres avec Nordal sans garanties écrites dans l'acte de cession : collecte de toutes les exploitations pendant cinq ans, formule de prix inchangée, et les deux usines maintenues. Un collecteur de la Manche les attend.",
        },
        {
          ...SIEBE,
          heure: "11:00",
          texte:
            "Le protocole est prêt. Les relations avec les producteurs, c'est notre affaire après la signature. Signons en semaine 13, comme prévu.",
        },
        {
          ...ALANIG,
          heure: "12:30",
          texte: "Ils bluffent. Où iraient-ils vendre leur lait ? On ne rouvre rien.",
        },
      ];
    },
    sources: [
      {
        id: "vote",
        titre: "Chiffrer avec Hoel Quiniou ce que coûterait le départ des producteurs",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.venteFinale || ctx.acquereurCoop
            ? "Hoel Quiniou : « Les producteurs renouvelleront : rien à chiffrer. »"
            : `Hoel Quiniou : « Je connais ceux qui ont voté : trois fois sur cinq, ils partiront vraiment, la Manche les prend. Remplacer 86 millions de litres en lait spot, à 40 € de plus les 1 000 litres, coûterait ${ctx.surcoutSpot} par an ; le protocole prévoit d'ailleurs une clause : si moins de 90 % du lait est sous contrat au 31 décembre, le prix baisse de 8 M€. Écrire leurs garanties, Nordal le chiffrera à 1,2 M€ de prix en moins, emploi compris. Une prime de fidélité de 1,5 M€ payée par la famille ramènerait le risque à une fois sur quatre, sans rien écrire. »`,
      },
      {
        id: "independante",
        titre: "Demander à Iwan Szymanski ce que vaudrait la laiterie si l'on renonçait",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Iwan Szymanski : « Indépendante, la laiterie vaut aujourd'hui ${ctx.independante} de valeur d'entreprise, ${ctx.titresIndependante} pour les titres, frais engagés déduits, et toujours selon le marché laitier que la note de mi-novembre dira. La vente en cours vaut ${ctx.valeur} pour les titres. »`,
      },
    ],
    question: "Que faites-vous du protocole ?",
    options: [
      {
        t: "Signer le protocole tel qu'il est négocié : les producteurs n'ont pas d'autre débouché",
        d: "Signature en semaine 13, aux conditions du protocole.",
      },
      {
        t: "Rouvrir le protocole pour y écrire les garanties des producteurs et le maintien des deux usines et des emplois, quitte à céder sur le prix",
        d: "L'acquéreur retirera ce que lui coûtent les engagements ; signature en semaine 13.",
      },
      {
        t: "Offrir aux producteurs une prime de fidélité de 1,5 M€, payée par la famille sur le prix de cession",
        d: "Rien n'est écrit dans le protocole ; la prime est versée à la signature.",
      },
      {
        t: "Suspendre la vente : la laiterie reste indépendante",
        d: "Le protocole n'est pas signé ; les frais engagés sont perdus.",
      },
    ],
    reactions: [
      [
        {
          ...ERMENGARDE,
          texte: "Protocole inchangé. Signature fixée au vendredi de la semaine 13.",
        },
      ],
      [
        {
          ...HOEL,
          texte:
            "J'ai lu le nouvel article à Konogan Kerguéris au téléphone. Il le présentera à l'assemblée de décembre.",
        },
      ],
      null,
      [
        {
          ...GAIDIG,
          texte: "Enfin. Je n'ai jamais voulu qu'on vende à ces conditions.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Juger l'offre contre ses trois repères", chemin: [2, 1, 1, 2, 2, 1] },
  { nom: "Signer avant l'expiration", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [1, 3, 3, 0, 0, 0] },
] as const;

/**
 * Les réflexes du vendeur pressé, ou attaché : accepter l'offre telle quelle
 * avant qu'elle n'expire, ou la refuser par principe ; tout ouvrir pour aller
 * vite ; signer sans second tour ; accepter la baisse pour ne pas perdre
 * l'acquéreur ; croire au prix affiché ; ne rien rouvrir. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  enchereReste:
    "Nous ne participons pas d'ordinaire aux enchères. Pour la Laiterie de Kerbrélan, nous ferons une exception : notre offre est maintenue, sans plus.",
  enchereRetrait:
    "Nous ne participons pas aux enchères. Nous retirons notre offre. Bonne chance dans votre processus.",
  primeAcceptee:
    "Le bureau de l'OP recommandera de renouveler. Mais la prime ne remplace pas une garantie écrite : je ne peux pas répondre de tout le monde.",
  primeRefusee:
    "Le bureau prend la prime, mais la question reste la collecte des fermes éloignées. Certains partiront quand même.",
} as const;
