/**
 * LES CHUTES DE LA NUIT — le contenu de l'épisode.
 *
 * Ernestine Vaillandet est l'infirmière coordinatrice (IDEC) de l'EHPAD de
 * Chalon-sur-Saône, 90 places, à l'Association Solvanne. L'été a compté 41
 * chutes, dont 29 la nuit, et deux fractures. Des familles demandent des
 * barrières de lit, le médecin coordonnateur parle de contentions. Six
 * décisions, d'octobre à décembre, chacune précédée de ce qu'une IDEC reçoit
 * vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule. Les résidents sont
 * désignés comme dans une déclaration d'événement indésirable : par leur
 * initiale, sauf Mme Lamboley, dont le fils se manifeste.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "causes",
    t: "Les chutes se concentrent sur une douzaine de résidents, au lever entre 5 h et 7 h et après les psychotropes du soir : des causes précises, qu'on peut traiter une à une",
  },
  {
    id: "psychotropes",
    t: "Les somnifères et les anxiolytiques du soir font tomber les résidents : c'est l'ordonnance qu'il faut revoir",
  },
  {
    id: "surveillance",
    t: "La nuit manque de bras : trois soignants pour 90 résidents ne peuvent pas surveiller tout le monde",
  },
  {
    id: "fragilite",
    t: "Les résidents admis sont de plus en plus dépendants : les chutes suivent la montée de la dépendance",
  },
] as const;

const TABLEAU = "Carnéo · événements indésirables";
const SIGISMOND = { de: "Sigismond Ravanel", role: "Directeur de l'EHPAD" } as const;
const MURESAN = { de: "Dr Ioana Mureșan", role: "Médecin coordonnateur" } as const;
const NAFISSATOU = { de: "Nafissatou Sakho", role: "Aide-soignante de nuit" } as const;
const BOURGEAT = { de: "Anastase Bourgeat", role: "Pharmacien référent" } as const;
const GARAUDET = { de: "Lucrèce Garaudet", role: "Kinésithérapeute" } as const;
const LAMBOLEY = { de: "Médard Lamboley", role: "Fils de Mme Lamboley, résidente" } as const;
const SIRUGUE = {
  de: "Madeleine Sirugue",
  role: "Directrice qualité et gestion des risques, siège",
} as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Quarante et une chutes",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Bilan trimestriel",
        heure: "07:30",
        alerte: true,
        texte:
          "Juillet à septembre : 41 chutes déclarées, dont 29 entre 22 h et 7 h. Deux fractures : un col du fémur en août, un poignet en septembre.",
      },
      {
        ...SIGISMOND,
        heure: "08:45",
        texte:
          "Ernestine, la fille de M. R. a écrit au siège après sa fracture d'août, et deux familles m'ont demandé des barrières de lit au dernier conseil de la vie sociale. La direction générale veut un quart de chutes en moins. Propose-moi un plan vendredi.",
      },
      {
        ...MURESAN,
        heure: "10:10",
        texte:
          "Pour les résidents qui tombent la nuit, je peux prescrire des barrières, et une ceinture pour ceux qui se relèvent. Il faut les protéger d'eux-mêmes.",
      },
      {
        ...NAFISSATOU,
        heure: "06:55",
        texte:
          "On est trois la nuit pour 90. Vers 5 h, ça sonne de partout en même temps : on ne peut pas être dans toutes les chambres.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "declarations",
        titre: "Analyser les 41 déclarations de chute une par une, dans Carnéo",
        cout: 1.5,
        nature: "decisive",
        resultat:
          "28 des 41 chutes concernent douze résidents ; les 78 autres en totalisent 13, surtout le jour. Sur les 29 chutes de nuit, 19 ont eu lieu entre 5 h et 7 h, presque toutes au lever pour aller seul aux toilettes : dans la chambre ou la salle de bains, lumière éteinte, pieds nus ou en chaussons ouverts. Neuf des douze reçoivent un hypnotique ou un anxiolytique à 20 h ; ils font 22 de leurs 28 chutes. Sur les trois derniers hivers, décembre a compté un quart de chutes de plus que l'automne.",
      },
      {
        id: "nuit",
        titre: "Passer une nuit avec l'équipe, de 21 h à 7 h",
        cout: 1,
        nature: "decisive",
        resultat:
          "La tournée de change passe à 1 h et à 4 h, dans toutes les chambres, au même rythme. Entre 4 h 30 et 7 h, plus personne ne passe : l'équipe prépare les transmissions et les premiers levers. À 5 h 40, M. D. se lève, cherche l'interrupteur, avance dans le noir vers la salle de bains ; Nafissatou arrive à temps, cette fois. Les sonnettes s'allument par vagues entre 5 h et 6 h 30.",
      },
      {
        id: "contention",
        titre: "Relire les recommandations nationales sur la contention",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une barrière retire un quart des chutes du lit, mais le résident qui l'enjambe tombe de plus haut : plus de trois fois plus de fractures. Une contention se prescrit, se motive, se réévalue, s'explique à la famille ; elle demande une surveillance toutes les deux heures, près de quatre heures d'aide-soignante par semaine et par résident, et fait perdre la marche en quelques semaines.",
      },
      {
        id: "gmp",
        titre: "Comparer le GMP et le taux de chute aux autres EHPAD de l'association",
        cout: 1,
        nature: "bruit",
        resultat:
          "GMP de Chalon : 742, contre 731 en moyenne dans les six EHPAD. 1,8 chute par résident et par an, dans la moyenne des établissements de cette taille.",
      },
      {
        id: "conseil",
        titre: "Appeler Euphrasie Malatray, IDEC de l'EHPAD de Beaune",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Euphrasie : « Avant de parler barrières, regarde à quelle heure et chez qui on tombe. Chez nous, c'était le lever du matin, et trois ordonnances. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel plan présentez-vous au directeur vendredi ?",
    options: [
      {
        t: "Poser des barrières de lit la nuit chez les résidents qui ont chuté la nuit, sur prescription du médecin coordonnateur",
        d: "Quatorze résidents de plus sous barrière, dès la semaine 2 : 95 € par barrière. Les familles seront rassurées.",
      },
      {
        t: "Ajouter une aide-soignante de nuit, de 21 h à 7 h, sans changer l'organisation",
        d: "Une ronde de plus chaque nuit. 3 400 € par semaine en intérim chez Soralis les deux premières semaines, puis 1 700 € en CDD.",
      },
      {
        t: "Analyser les chutes avec l'équipe de nuit, et organiser une tournée ciblée au petit matin, avec lumière et chaussage",
        d: "Deux réunions d'analyse (600 €), des veilleuses à détection et des chaussures fermées pour les douze (1 400 €), une prise de poste avancée à 5 h 30 (150 € par semaine).",
      },
      {
        t: "Rappeler à l'équipe de nuit les consignes de surveillance",
        d: "Une note de service, et un point à chaque relève. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...NAFISSATOU,
          texte:
            "Les barrières sont posées. Les nuits sont plus calmes dans le couloir, mais M. D. passe la jambe par-dessus à 5 h, et Mme F. crie qu'on l'a enfermée.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte:
            "Soralis nous envoie quelqu'un dès lundi. Ça se voit dans le budget de la section soins, et ça ne se finance pas en cours d'année.",
        },
      ],
      [
        {
          ...NAFISSATOU,
          texte:
            "On a fait la liste ensemble : douze noms, et l'heure à laquelle chacun se lève. À 5 h 30, Ophélia passe chez eux en premier, avec la lumière et les chaussures. C'est la première fois qu'on nous demande comment ça se passe.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte:
            "Une note de service ? Les familles vont me demander ce qui a changé, concrètement.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les traitements du soir",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...MURESAN,
        heure: "11:20",
        alerte: true,
        texte:
          "Ernestine, l'équipe de nuit me demande quelque chose de plus fort pour ceux qui se lèvent à 5 h. Si on les fait dormir jusqu'à 7 h, il n'y a plus de lever dangereux.",
      },
      {
        ...BOURGEAT,
        heure: "14:05",
        texte:
          "Je peux relire les ordonnances avec le Dr Mureșan si vous voulez, en commission. Il faudra l'accord des médecins traitants.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 2 : ${ctx.chutes} chutes, dont ${ctx.chutesNuit} la nuit. ${ctx.contentions} résidents sous barrière.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "ordonnances",
        titre: "Relire les ordonnances des douze avec le pharmacien",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Neuf des douze prennent un hypnotique ou un anxiolytique le soir, quatre en prennent deux. Sept prescriptions ont plus d'un an sans réévaluation. Arrêter d'un coup expose à un sevrage : la diminution se fait par paliers, sur quatre semaines au moins, et les chutes ne baissent qu'une fois les paliers passés. Un hypnotique plus fort allonge la somnolence au réveil : le lever de 5 h devient plus dangereux, pas moins.",
      },
      {
        id: "medecins",
        titre: "Appeler les médecins traitants des neuf",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Trois médecins traitants suivent les neuf résidents. Deux acceptent une revue en commission ; le troisième, qui en suit trois, veut d'abord voir les propositions par écrit.",
      },
      {
        id: "transmissions",
        titre: "Relire les transmissions de nuit du mois",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Des nuits agitées, des résidents qui appellent, des changes à refaire. Les transmissions disent beaucoup de ce qui s'est passé, peu de l'heure et de qui.",
      },
    ],
    question: "Que faites-vous des traitements du soir ?",
    options: [
      {
        t: "Revoir les traitements des douze en commission avec le médecin coordonnateur, le pharmacien et les médecins traitants, et diminuer les hypnotiques par paliers",
        d: "Une commission en semaine 3, puis un suivi palier par palier : 900 €. Rien ne bougera avant plusieurs semaines.",
      },
      {
        t: "Demander au médecin coordonnateur un somnifère plus fort pour les résidents qui se lèvent la nuit",
        d: "Une prescription dès la semaine prochaine. Les nuits seront plus calmes.",
      },
      {
        t: "Lancer la revue des traitements des 90 résidents",
        d: "Résident par résident, par ordre de chambre, sur dix semaines : 4 200 € de vacations du pharmacien et de temps médical.",
      },
      {
        t: "Laisser les médecins traitants revoir les ordonnances à leurs prochaines visites",
        d: "Ne coûte rien. Les visites s'étalent sur le trimestre.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...NAFISSATOU,
          texte:
            "Ils dorment, c'est vrai. Mais à 5 h, quand ils se lèvent quand même, ils ne tiennent pas debout.",
        },
      ],
      null,
      [
        {
          ...MURESAN,
          texte:
            "D'accord. Je leur laisse un mot dans le dossier ; ils le liront à leur prochain passage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le fils de Mme Lamboley",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...LAMBOLEY,
        heure: "17:40",
        alerte: true,
        texte:
          "Ma mère est encore tombée cette nuit. C'est la troisième fois depuis l'été. Je veux une barrière à son lit, ce soir. Sinon j'écris à l'ARS.",
      },
      {
        ...MURESAN,
        heure: "18:10",
        texte: "Je peux faire la prescription maintenant, si vous voulez. Ce sera plus simple.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:30",
        texte: `Depuis le 1er octobre : ${ctx.chutesCumul} chutes, ${ctx.fractures} fracture(s). Repère à date : ${ctx.objectifADate} au plus.`,
      },
    ],
    sources: [
      {
        id: "mere",
        titre: "Relire les chutes de Mme Lamboley et son projet personnalisé",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Mme Lamboley, 88 ans, marche seule avec un déambulateur. Trois chutes depuis juillet, toutes entre 5 h 30 et 6 h 30, en allant aux toilettes ; aucune blessure grave. Elle tient à se lever seule : c'est écrit dans son projet personnalisé. ${
            ctx.analyse
              ? "Elle fait partie des douze de la tournée du matin : depuis trois semaines, elle n'est plus tombée qu'une fois, avant l'arrivée d'Ophélia."
              : "Personne ne passe chez elle avant 7 h."
          }`,
      },
      {
        id: "droit",
        titre: "Demander au siège ce que dit le droit",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Madeleine Sirugue : « Une contention ne se pose pas à la demande d'une famille : elle se prescrit quand rien d'autre ne suffit, se réévalue, et s'explique au résident. Une plainte à l'ARS déclenche une demande d'explications ; à la troisième déclaration grave du trimestre, attends-toi à une inspection. »",
      },
      {
        id: "cvs",
        titre: "Relire le compte rendu du dernier conseil de la vie sociale",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le conseil de la vie sociale a parlé des repas, des animations de Noël, et des chutes : « les familles s'inquiètent ».",
      },
    ],
    question: "Que répondez-vous au fils de Mme Lamboley ?",
    options: [
      {
        t: "Poser la barrière, comme il le demande",
        d: "Une prescription du Dr Mureșan, une barrière posée ce soir : 95 €. Il est rassuré.",
      },
      {
        t: "Le recevoir avec le médecin coordonnateur : lui montrer les chutes de sa mère, expliquer les risques de la barrière, lui proposer un lit bas et un tapis inscrits au projet personnalisé",
        d: "Un rendez-vous d'une heure mardi. Un lit à hauteur variable et un tapis au sol : 1 300 €.",
      },
      {
        t: "Installer un lit bas et un tapis, sans le recevoir",
        d: "1 300 €. L'équipe lui expliquera à sa prochaine visite.",
      },
      {
        t: "Lui répondre par écrit que l'établissement ne pose pas de contention sans indication médicale",
        d: "Un courrier de la direction, relu par le médecin coordonnateur. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...LAMBOLEY,
          texte: "Merci. Je dormirai mieux.",
        },
      ],
      [
        {
          ...LAMBOLEY,
          texte:
            "Je viendrai mardi. Mais je veux comprendre pourquoi on ne fait pas ce qu'on demande.",
        },
      ],
      [
        {
          ...NAFISSATOU,
          texte:
            "Le lit bas est installé. Elle s'y est faite tout de suite ; son fils n'a pas encore vu.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte: "Le courrier est parti. J'espère qu'il s'en contentera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Bouger, ou protéger",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...GARAUDET,
        heure: "12:15",
        texte:
          "Ernestine, j'ai fait le bilan de marche des douze. Huit peuvent suivre un atelier d'équilibre. Les autres, il faudrait au moins des protecteurs de hanche.",
      },
      {
        ...MURESAN,
        heure: "15:30",
        texte:
          "Le plus simple serait de les installer au fauteuil en salle commune dans la journée : on les a sous les yeux, ils ne tombent pas.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Semaine 6 : ${ctx.chutes} chutes. Depuis le 1er octobre : ${ctx.chutesCumul}, et ${ctx.fractures} fracture(s).`,
      },
    ],
    sources: [
      {
        id: "bilan",
        titre: "Relire le bilan de marche et d'équilibre des douze avec la kinésithérapeute",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Huit des douze peuvent suivre un atelier d'activité physique adaptée deux fois par semaine ; d'après les ateliers de Beaune, les chutes baissent au bout de trois ou quatre semaines, et jusqu'à près de la moitié chez ceux qui le suivent. Les protecteurs de hanche n'empêchent pas la chute : ils changent la fracture. Celle du col du fémur devient une contusion ou une fracture du poignet, sans hospitalisation longue. Un résident installé au fauteuil toute la journée perd la marche en quelques semaines.",
      },
      {
        id: "observance",
        titre: "Demander à Beaune comment les protecteurs ont été portés",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Euphrasie Malatray : « Les premières semaines, presque tous. Au bout de trois mois, un sur deux les oublie ou les refuse : c'est inconfortable la nuit. »",
      },
      {
        id: "fauteuils",
        titre: "Compter les fauteuils disponibles en salle commune",
        cout: 0.5,
        nature: "bruit",
        resultat: "Quatorze fauteuils de repos en salle commune, dont six inoccupés l'après-midi.",
      },
    ],
    question: "Que décidez-vous pour les douze, le jour ?",
    options: [
      {
        t: "Lancer un atelier d'activité physique adaptée, deux séances par semaine",
        d: "Équilibre, marche, se relever du sol, avec une enseignante en activité physique adaptée : 260 € par semaine. Les premiers effets demandent plusieurs semaines.",
      },
      {
        t: "Installer au fauteuil, en salle commune, les résidents qui chutent, pour les avoir sous les yeux",
        d: "Ne coûte rien. Ils seront surveillés toute la journée.",
      },
      {
        t: "Équiper les douze de protecteurs de hanche",
        d: "Trois culottes par résident : 2 600 €. À porter jour et nuit ; certains les refuseront.",
      },
      {
        t: "Ne rien changer : la kinésithérapeute passe déjà deux fois par semaine",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          de: "Fanja Rabemananjara",
          role: "Enseignante en activité physique adaptée",
          texte:
            "Première séance mardi : huit résidents, et Mme Lamboley qui a voulu essayer de se relever du tapis. Elle a réussi au troisième essai.",
        },
      ],
      [
        {
          ...GARAUDET,
          texte:
            "Ils sont au fauteuil, en effet. M. D. ne marche plus jusqu'à la salle à manger ; il faut maintenant deux personnes pour le lever.",
        },
      ],
      [
        {
          ...NAFISSATOU,
          texte:
            "Les protecteurs sont distribués. Neuf sur douze les portent ; il faut négocier tous les soirs avec Mme F.",
        },
      ],
      [
        {
          ...GARAUDET,
          texte: "Je continue mes passages. Pour les douze, ça ne suffira pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Des capteurs pour la nuit",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...SIGISMOND,
        heure: "09:30",
        texte:
          "La centrale d'achat de l'association propose des capteurs de sortie de lit reliés aux téléphones de l'équipe de nuit. On peut équiper tout l'établissement, ou quelques chambres. Qu'est-ce que tu en penses ?",
      },
      {
        ...NAFISSATOU,
        heure: "06:50",
        texte:
          "Si c'est pour sonner dans les 90 chambres, on ne s'en sortira pas. On préférerait passer partout toutes les heures, au moins on voit.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Depuis le 1er octobre : ${ctx.chutesCumul} chutes, dont la moitié de nuit, et ${ctx.fractures} fracture(s). Repère à date : ${ctx.objectifADate} au plus.`,
      },
    ],
    sources: [
      {
        id: "essai",
        titre: "Appeler l'EHPAD de Montbard, qui a essayé les capteurs",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Montbard a équipé ses 70 chambres : plus de cent alertes par nuit, dont neuf sur dix pour un résident qui se retourne. Au bout de trois semaines, l'équipe ne répondait plus. Sur un essai limité à dix résidents choisis d'après leurs chutes, une dizaine d'alertes par nuit, presque toutes entre 5 h et 6 h 30 : l'aide-soignante de la tournée arrivait avant le lever. Une ronde toutes les heures, essayée l'hiver d'avant, réveillait les résidents : plus de confusion, et plus de chutes au milieu de la nuit.",
      },
      {
        id: "brochure",
        titre: "Lire la brochure du fournisseur",
        cout: 0.5,
        nature: "bruit",
        resultat: "« Jusqu'à 70 % de chutes en moins » : la brochure ne dit ni où, ni comment.",
      },
    ],
    question: "Que décidez-vous pour la nuit ?",
    options: [
      {
        t: "Équiper les 90 chambres de capteurs de sortie de lit",
        d: "Mise en service en semaine 10 : 2 500 €, puis 600 € par semaine d'abonnement.",
      },
      {
        t: "Équiper de capteurs les douze qui se lèvent seuls, reliés au téléphone de l'aide-soignante de la tournée",
        d: "Mise en service en semaine 10 : 700 €, puis 45 € par semaine.",
      },
      {
        t: "Instaurer une ronde toutes les heures dans toutes les chambres",
        d: "Ne coûte rien : l'équipe de nuit passera partout, toutes les heures.",
      },
      {
        t: "Pas de capteurs, pas de ronde de plus",
        d: "Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...NAFISSATOU,
          texte:
            "Ça sonne sans arrêt. Cette nuit, cent vingt alertes. À 5 h, on ne savait plus lesquelles comptaient.",
        },
      ],
      [
        {
          ...NAFISSATOU,
          texte:
            "Une dizaine d'alertes par nuit, et on sait chez qui aller. Cette nuit, on est arrivées avant le lever de Mme Lamboley.",
        },
      ],
      [
        {
          ...NAFISSATOU,
          texte:
            "On passe toutes les heures. Les résidents se réveillent, certains ne se rendorment plus, M. G. s'est levé à 3 h pour s'habiller.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte: "Je dis à la centrale qu'on ne prend rien pour l'instant.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les contentions avant l'hiver",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...SIRUGUE,
        heure: "10:00",
        alerte: true,
        texte: `Ernestine, les prescriptions de contention de Chalon arrivent à échéance en décembre. ${ctx.contentions} résidents ont une barrière la nuit. Le siège veut savoir ce que vous renouvelez.`,
      },
      {
        ...MURESAN,
        heure: "11:45",
        texte:
          "La grippe arrive, l'équipe va être réduite. Je propose de tout renouveler, et d'en ajouter pour les agités le temps de l'épidémie.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "18:00",
        texte: `Depuis le 1er octobre : ${ctx.chutesCumul} chutes, ${ctx.fractures} fracture(s). Coût des chutes à date : ${ctx.cout}.`,
      },
    ],
    sources: [
      {
        id: "registre",
        titre: "Relire le registre des contentions, résident par résident",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${ctx.contentions} résidents ont une barrière la nuit. Pour trois seulement, l'indication tient encore : un risque de chute du lit pendant un soin, une agitation que rien d'autre n'apaise. Les autres ont une prescription reconduite sans réévaluation, ou posée à la demande d'une famille. Chaque contention coûte une surveillance toutes les deux heures. Levée d'un coup, sans lit bas ni tapis ni passage au lever, elle laisse un résident qui a perdu l'habitude de se lever seul : il tombe davantage pendant des semaines.`,
      },
      {
        id: "familles",
        titre: "Demander au siège comment prévenir les familles",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Madeleine Sirugue : « Une contention qu'on lève sans prévenir, c'est une famille sur trois qui réclame. Une réévaluation expliquée, avec ce qu'on met à la place, presque aucune. »",
      },
    ],
    question: "Que faites-vous des contentions pour l'hiver ?",
    options: [
      {
        t: "Tout renouveler, et en ajouter pour les résidents agités pendant l'épidémie",
        d: "Quatre barrières de plus en semaine 11 : 95 € chacune. L'équipe réduite sera tranquille.",
      },
      {
        t: "Réévaluer chaque contention avec le médecin coordonnateur, l'équipe et la famille ; lever celles qui ne se justifient plus, avec un lit bas, un tapis et un passage au lever",
        d: "Une réunion par résident en semaine 11 : 300 €, et 120 € par contention levée.",
      },
      {
        t: "Lever toutes les contentions dès lundi",
        d: "Ne coûte rien. Plus aucune barrière la nuit.",
      },
      {
        t: "Renouveler les prescriptions en l'état",
        d: "Le Dr Mureșan signe les renouvellements. Ne coûte rien.",
      },
    ],
    reactions: [
      [
        {
          ...NAFISSATOU,
          texte:
            "Quatre barrières de plus. Il faut passer toutes les deux heures dans des chambres de plus en plus nombreuses ; on a moins de temps pour les levers.",
        },
      ],
      [
        {
          ...MURESAN,
          texte:
            "On a vu chaque résident, chaque famille. On en garde trois, motivées et datées. Les autres ont un lit bas, un tapis, et sont sur la liste de la tournée du matin.",
        },
      ],
      [
        {
          ...SIGISMOND,
          texte:
            "Plus de barrières du tout, du jour au lendemain. Mon téléphone sonne : des familles qui n'étaient pas prévenues.",
        },
      ],
      [
        {
          ...MURESAN,
          texte: "C'est signé. On en reparlera au printemps.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Analyser, puis traiter les causes", chemin: [2, 0, 1, 0, 1, 1] },
  { nom: "Contenir et surveiller", chemin: [0, 1, 0, 1, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : contenir (barrières, somnifère plus
 * fort, fauteuil) ou surveiller sans cibler (une veilleuse de plus, des capteurs partout, une
 * ronde toutes les heures).
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 1],
  [2, 0],
  [3, 1],
  [4, 0],
  [4, 2],
  [5, 0],
] as const;

export const REPONSES = {
  medecinAccepte:
    "Les trois médecins traitants ont accepté la revue en commission : les neuf ordonnances seront diminuées par paliers.",
  medecinRefuse:
    "Deux médecins traitants ont accepté la revue. Le troisième, qui suit trois des neuf, garde ses ordonnances en l'état pour l'instant.",
  filsAccepte:
    "J'ai vu les chutes de ma mère, et ce qu'on fait le matin. D'accord pour le lit bas. Je n'écrirai pas à l'ARS.",
  filsPlainte: "J'ai écrit à l'ARS. Ma mère tombe, et on me répond par des principes.",
} as const;
