import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  COUT_HORAIRE_DE_L_ESCALE,
  EFFECTIF_DE_L_ESCALE,
  INTEGRATION_DE_L_ESCALE,
  SERVICES_DE_L_ESCALE,
  TUTORAT_LE_PLUS_LONG,
  integrationDeLEscale,
} from "../monde/equipe-de-l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : DE L'INDIVIDU À L'ACTEUR, SA PLACE DANS L'ÉQUIPE (Bac STMG, sciences de gestion et
 * numérique de première, thème 1, question 1 : « Comment un individu devient-il acteur dans une
 * organisation ? »).
 *
 * Inès arrive à la réception de L'ESCALE. Le chapitre la suit dans ses premières semaines : ce qui
 * la distingue (sa personnalité, sa perception, ses attitudes, ses compétences, son identité
 * numérique), la place que l'organigramme et la fiche de poste lui donnent, les groupes qu'elle
 * rejoint (leur identité, leurs normes, leurs rituels, les stéréotypes qui y circulent), les
 * relations formelles et informelles, l'autorité et le leadership, la communication
 * interpersonnelle, ses motivations et les incitations de l'hôtel. Un chiffre clôt le parcours : ce
 * qu'un départ en période d'essai coûte à l'hôtel, et le plus long tutorat que l'économie paie (le
 * curseur).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez L'ESCALE seule : l'effectif et le coût d'un salarié
 * sont ceux de la fiche de l'hôtel (l-escale.ts) ; l'organigramme, les personnes, les arrivées et les
 * départs sont des hypothèses du cours, nommées dans monde/equipe-de-l-escale.ts.
 */

export const ENTREPRISES_DE_L_ACTEUR = ["hotel"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

function organigramme(c: Cas): TableauDeDonnees {
  return {
    titre: `L'organigramme de ${c.entreprise}`,
    colonnes: ["Responsable", "Salariés", "Mission"],
    lignes: SERVICES_DE_L_ESCALE.map((s) => ({ libelle: s.nom, valeurs: [s.responsable, qte(s.effectif), s.mission] })),
  };
}

export const DE_L_INDIVIDU_A_L_ACTEUR: Chapitre = {
  code: "de-l-individu-a-l-acteur",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · De l'individu à l'acteur"],
  titre: "De l'individu à l'acteur : sa place dans l'équipe",
  accroche:
    "Inès arrive à la réception d'un hôtel de 14 salariés. Ce qu'elle apporte, la place que l'organisation lui donne, les groupes qu'elle rejoint, et ce que coûte un nouveau qui repart avant d'avoir trouvé sa place.",
  objectifs: [
    "Distinguer ce qui fait un individu : personnalité, perception, attitudes, compétences",
    "Lire la place formelle d'un salarié : organigramme, fiche de poste, hiérarchie",
    "Reconnaître un groupe, sa culture, ses normes, et les relations informelles",
    "Distinguer l'autorité du leadership, la motivation de l'incitation",
    "Chiffrer ce que coûte un salarié qui part avant d'être intégré",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTEUR,
    pourquoi: "ce chapitre suit l'arrivée d'une réceptionniste à L'ESCALE, dont le cours tient l'organigramme, l'équipe et ce qu'elle coûte.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une nouvelle à la réception",
      notions: ["staff_turnover"],
      tableau: organigramme,
      texte: (c) => [
        `Inès commence lundi à la réception de ${c.entreprise}, un hôtel de ${qte(EFFECTIF_DE_L_ESCALE)} salariés. Elle arrive avec ce qu'elle est : sa personnalité (calme, méthodique), ses émotions du premier jour, sa façon de percevoir les clients, ses attitudes envers le travail et ses compétences, apprises en BTS et dans un premier emploi.`,
        "L'organisation, elle, lui donne une place : un poste dans un service, un responsable, des tâches écrites dans une fiche de poste. Entre les deux, il y a l'équipe, ses habitudes et ses relations. Devenir acteur, c'est trouver sa place dans les trois.",
      ],
      repere: () => "Un individu devient acteur de l'organisation quand ce qu'il est rencontre la place qu'on lui donne et le groupe qu'il rejoint.",
    },
    {
      id: "la-perception",
      objectifs: [0],
      type: "choix",
      titre: "Le même client, deux lectures",
      question: () =>
        "Un client arrive tard, fatigué, et parle sèchement. Karim, réceptionniste depuis neuf ans, y voit un voyageur épuisé à servir vite ; Inès croit qu'on lui reproche une erreur. Qu'est-ce qui explique ces deux lectures d'une même scène ?",
      options: () => [
        { texte: "La perception : chacun lit la scène à travers son vécu", juste: true, retour: "Oui : la perception trie et interprète ce que l'on voit. L'expérience de Karim lui fait lire la fatigue ; Inès, inquiète le premier jour, lit un reproche. L'émotion du moment pèse aussi ; la garder pour soi et répondre calmement, c'est le contrôle de soi." },
        { texte: "La compétence : Karim sait accueillir un client, Inès ne le sait pas encore", juste: false, retour: "Non : Inès sait accueillir, elle l'a appris. Ce qui diffère ici, c'est la façon d'interpréter la même scène, avant toute action." },
        { texte: "La hiérarchie : Karim a l'autorité, il voit donc juste", juste: false, retour: "Non : Karim n'est pas le responsable de la réception, et l'autorité ne donne pas une meilleure lecture d'une scène." },
      ],
    },
    {
      id: "ce-qui-fait-l-individu",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui fait l'individu",
      question: () => "Rangez chaque trait d'Inès : relève-t-il de sa personnalité, de son attitude, ou de ses compétences ?",
      categories: [
        { code: "personnalite", libelle: "Personnalité" },
        { code: "attitude", libelle: "Attitude" },
        { code: "competence", libelle: "Compétence" },
      ],
      elements: () => [
        { libelle: "Elle reste calme quand plusieurs clients attendent", montant: 0, categorie: "personnalite", pourquoi: "Un trait stable, qu'elle avait avant l'hôtel et qu'elle aura après : la personnalité." },
        { libelle: "Elle aime apprendre et pose beaucoup de questions", montant: 0, categorie: "personnalite", pourquoi: "La curiosité est un trait de caractère : elle tient à la personne." },
        { libelle: "Elle pense que le client a souvent raison", montant: 0, categorie: "attitude", pourquoi: "Une attitude : une opinion qui la dispose à agir d'une certaine façon. Elle peut changer avec l'expérience." },
        { libelle: "Elle trouve le travail de nuit fatigant mais utile", montant: 0, categorie: "attitude", pourquoi: "Un jugement, positif ou négatif, sur un objet du travail : une attitude." },
        { libelle: "Elle parle anglais et espagnol", montant: 0, categorie: "competence", pourquoi: "Une compétence : un savoir qu'elle met en œuvre au poste." },
        { libelle: "Elle maîtrise le logiciel de réservation", montant: 0, categorie: "competence", pourquoi: "Un savoir-faire appris, qui se vérifie à la tâche : une compétence." },
      ],
      relance: "Demandez-vous : ce trait tient-il à la personne, à son jugement sur le travail, ou à ce qu'elle a appris ?",
      explication: () => [
        "La personnalité est stable ; l'attitude est une disposition qui peut évoluer ; la compétence s'apprend et se vérifie. Le recrutement juge surtout les compétences ; l'intégration joue sur les attitudes.",
      ],
    },
    {
      id: "la-fiche-de-poste",
      objectifs: [1],
      type: "tri",
      titre: "La fiche de poste et le profil de compétences",
      tableau: organigramme,
      question: () =>
        "La fiche de poste de réceptionniste liste ce que le poste demande. Rangez chaque ligne du profil de compétences : un savoir, un savoir-faire ou un savoir-être ?",
      categories: [
        { code: "savoir", libelle: "Savoir" },
        { code: "savoir-faire", libelle: "Savoir-faire" },
        { code: "savoir-etre", libelle: "Savoir-être" },
      ],
      elements: () => [
        { libelle: "Connaître les tarifs et les conditions d'annulation", montant: 0, categorie: "savoir", pourquoi: "Une connaissance à avoir en tête : un savoir." },
        { libelle: "Connaître les règles d'hygiène et de sécurité de l'hôtel", montant: 0, categorie: "savoir", pourquoi: "Des règles à connaître : un savoir." },
        { libelle: "Enregistrer une arrivée dans le logiciel", montant: 0, categorie: "savoir-faire", pourquoi: "Une tâche à exécuter : un savoir-faire." },
        { libelle: "Encaisser un séjour et éditer la facture", montant: 0, categorie: "savoir-faire", pourquoi: "Un geste professionnel : un savoir-faire." },
        { libelle: "Rester courtois face à un client mécontent", montant: 0, categorie: "savoir-etre", pourquoi: "Un comportement attendu : un savoir-être." },
      ],
      relance: "Demandez-vous : faut-il le connaître, savoir le faire, ou savoir se comporter ?",
      explication: (c) => [
        `La fiche de poste situe Inès dans l'organigramme de ${c.entreprise} : elle rend compte au chef de réception, qui rend compte à la directrice. C'est la hiérarchie, la ligne d'autorité. Le profil de compétences dit ce qu'il faut savoir, savoir faire et savoir être pour tenir le poste.`,
      ],
    },
    {
      id: "formel-ou-informel",
      objectifs: [2],
      type: "tri",
      titre: "Les relations formelles et informelles",
      question: () => "Rangez chaque relation que vit Inès : est-elle prévue par l'organisation (formelle), ou née entre les personnes (informelle) ?",
      categories: [
        { code: "formelle", libelle: "Formelle" },
        { code: "informelle", libelle: "Informelle" },
      ],
      elements: () => [
        { libelle: "Le chef de réception fixe son planning de la semaine", montant: 0, categorie: "formelle", pourquoi: "Le planning relève du responsable du service : une relation prévue par l'organigramme." },
        { libelle: "Elle remet la caisse à l'équipe de nuit, avec une fiche signée", montant: 0, categorie: "formelle", pourquoi: "Une procédure écrite, avec un document : une relation formelle." },
        { libelle: "Karim lui montre comment calmer un client pressé", montant: 0, categorie: "informelle", pourquoi: "Personne ne l'a demandé à Karim : il le fait de lui-même, une relation informelle." },
        { libelle: "Elle déjeune avec deux femmes de chambre", montant: 0, categorie: "informelle", pourquoi: "Une affinité, hors de tout service : une relation informelle." },
        { libelle: "Elle signale à la gouvernante une chambre à refaire", montant: 0, categorie: "formelle", pourquoi: "La liaison entre la réception et les étages est prévue : une relation formelle." },
      ],
      relance: "Demandez-vous : l'organisation l'a-t-elle prévue, ou est-elle née entre les personnes ?",
      explication: () => [
        "L'organisation prévoit des relations : qui décide, qui transmet, qui rend compte. Les relations informelles naissent à côté. Elles peuvent aider (Karim forme sans qu'on le lui demande) ou gêner (un clan qui retient l'information).",
      ],
    },
    {
      id: "autorite-ou-leadership",
      objectifs: [3],
      type: "choix",
      titre: "L'autorité et le leadership",
      question: () =>
        "Les réceptionnistes demandent conseil à Karim avant d'aller voir le chef de réception, et suivent ses avis. Karim n'a pourtant aucun titre. Que détient-il ?",
      options: () => [
        { texte: "Un leadership : une influence que les autres lui reconnaissent", juste: true, retour: "Oui : le leadership tient à la personne, à son expérience et à la confiance qu'elle inspire. L'autorité, elle, tient au poste : c'est le chef de réception qui l'a." },
        { texte: "L'autorité, puisque toute l'équipe suit ses avis plus que ceux de son chef", juste: false, retour: "Non : l'autorité est le pouvoir de décider que donne le poste. Karim ne peut ni fixer un planning ni sanctionner : il influence, il ne commande pas." },
        { texte: "Un statut de responsable, que l'usage a fini par lui donner", juste: false, retour: "Non : son statut reste celui de réceptionniste. Son influence est réelle, mais elle n'est écrite nulle part." },
      ],
    },
    {
      id: "le-groupe-et-sa-culture",
      objectifs: [2],
      type: "choix",
      titre: "Le groupe, sa culture, ses rituels",
      question: () =>
        "À la réception, chaque relève commence par un café debout derrière le comptoir ; on se tutoie ; on ne quitte pas son poste sans avoir lu la main courante. Comment nomme-t-on ces habitudes partagées ?",
      options: () => [
        { texte: "La culture du groupe, ses normes et ses rituels", juste: true, retour: "Oui : le café de la relève est un rituel ; le tutoiement, un code ; lire la main courante avant de partir est une norme, une règle que le groupe fait respecter. Les adopter donne à Inès le sentiment d'appartenir au groupe, et au groupe son identité." },
        { texte: "Le règlement intérieur, que la directrice a écrit", juste: false, retour: "Non : rien de cela n'est écrit. Le groupe se donne lui-même ces habitudes, et les transmet aux nouveaux." },
        { texte: "La personnalité de chacun des réceptionnistes", juste: false, retour: "Non : ces habitudes sont partagées par tout le groupe, quel que soit le caractère de chacun." },
      ],
    },
    {
      id: "le-stereotype",
      objectifs: [2],
      type: "choix",
      titre: "Un stéréotype",
      question: () => "« Les jeunes ne restent jamais : inutile de trop la former », dit un ancien en parlant d'Inès. De quoi s'agit-il ?",
      options: () => [
        { texte: "Un stéréotype : une idée toute faite sur un groupe", juste: true, retour: "Oui : il prête à Inès ce qu'il croit vrai de tous les jeunes, sans la connaître. Un stéréotype peut nourrir une discrimination : la former moins, c'est rendre son départ plus probable." },
        { texte: "Une norme du groupe, que chacun doit respecter", juste: false, retour: "Non : une norme dit comment se conduire. Ici, c'est un jugement sur un groupe de personnes, appliqué à une seule." },
        { texte: "Une information fiable, tirée des départs de l'année", juste: false, retour: "Non : quelques départs ne disent rien d'Inès. Généraliser à partir d'une catégorie, c'est le stéréotype." },
      ],
    },
    {
      id: "l-attribution",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi a-t-il agi ainsi ?",
      question: () =>
        "Un client a crié à la réception. « Il est mal élevé », dit un collègue. Inès apprend ensuite que le client avait attendu 40 minutes sous la pluie un taxi que l'hôtel avait oublié de commander. Qu'a fait le collègue ?",
      options: () => [
        { texte: "Une erreur d'attribution : il a cherché la cause dans la personne", juste: true, retour: "Oui : expliquer un comportement, c'est l'attribuer à une cause. On l'attribue volontiers au caractère de l'autre, quand la situation l'explique souvent mieux. Nos représentations (« un client qui crie est un client difficile ») orientent ce jugement." },
        { texte: "Un jugement juste : crier à la réception n'est jamais acceptable", juste: false, retour: "Ce n'est pas la question : la conduite du client est une chose, sa cause en est une autre. Ici, l'oubli de l'hôtel explique la colère." },
        { texte: "Une communication réussie : il a dit clairement ce qu'il pensait du client", juste: false, retour: "Non : il a jugé la personne sans connaître la situation. Ce jugement, répété, devient un stéréotype." },
      ],
    },
    {
      id: "la-communication",
      objectifs: [2],
      type: "choix",
      titre: "Une consigne mal passée",
      question: () =>
        "Le soir, Inès dit à l'oral à son collègue de nuit qu'un client part à 5 h et a payé. Le collègue, au téléphone au même moment, comprend « paiera ». Le matin, le client est relancé pour rien. Qu'a-t-il manqué à cette communication ?",
      options: () => [
        { texte: "Un retour du récepteur, et un canal moins exposé au bruit", juste: true, retour: "Oui : le message est passé dans le bruit (le téléphone), sans que le récepteur le reformule. Écrit dans la main courante, ou redit par le collègue, il aurait été vérifié. Toute communication a un émetteur, un récepteur, un message, un canal, et gagne à un retour." },
        { texte: "Un émetteur plus ancien, que le collègue aurait mieux écouté", juste: false, retour: "Non : l'ancienneté de l'émetteur ne protège pas du bruit. C'est le canal et l'absence de retour qui ont fait l'erreur." },
        { texte: "Rien : l'erreur vient du client, qui aurait dû garder sa facture", juste: false, retour: "Non : la consigne était juste au départ ; elle s'est déformée entre l'émetteur et le récepteur." },
      ],
    },
    {
      id: "argumenter-et-desamorcer",
      objectifs: [3],
      type: "choix",
      titre: "Argumenter, désamorcer un conflit",
      question: () =>
        "À 14 h, un client attend une chambre que les étages n'ont pas finie. Inès appelle la gouvernante, qui s'agace : « On fait ce qu'on peut. » Comment Inès obtient-elle la chambre sans conflit ?",
      options: () => [
        { texte: "Elle argumente avec des faits, et propose une solution", juste: true, retour: "Oui : « Le client part en réunion à 15 h ; s'il pose ses bagages à la bagagerie, la chambre peut attendre 14 h 30. » Elle influence par des arguments, sans autorité sur la gouvernante. Elle désamorce le conflit en cherchant ce qui arrange les deux services." },
        { texte: "Elle rappelle que le client a toujours raison, et exige la chambre tout de suite", juste: false, retour: "Non : elle n'a pas d'autorité sur les étages, et exiger durcit le conflit. L'influence passe par les arguments." },
        { texte: "Elle se plaint de la gouvernante à la directrice, qui tranchera", juste: false, retour: "Non : remonter tout de suite le conflit le grossit, et abîme la relation entre les deux services. Il se règle d'abord entre elles." },
      ],
    },
    {
      id: "identite-numerique",
      objectifs: [0],
      type: "choix",
      titre: "L'identité numérique",
      question: (c) =>
        `Inès publie sur son compte personnel une photo de l'équipe en tenue, devant le comptoir, avec le nom de ${c.entreprise}. Un client mécontent la retrouve et lui écrit. Que retenir de son identité numérique ?`,
      options: () => [
        { texte: "Ce qu'elle publie la relie à l'hôtel, aux yeux de tous", juste: true, retour: "Oui : l'identité numérique est l'ensemble des traces qu'une personne laisse en ligne. Une photo en tenue l'associe à l'hôtel, et elle engage aussi ses collègues, photographiés. L'hôtel a un réseau social d'entreprise, réservé à l'équipe, pour ce qui n'a pas à sortir." },
        { texte: "Rien : un compte personnel n'engage jamais son employeur", juste: false, retour: "Non : le compte est personnel, mais la photo montre l'hôtel et l'équipe. Les traces en ligne ne restent pas dans le cercle qu'on imagine." },
        { texte: "Elle aurait dû publier sur le compte officiel de l'hôtel", juste: false, retour: "Non : le compte officiel parle au nom de l'hôtel, et seule la personne qui en a la charge y publie. Le bon réflexe est de demander l'accord des collègues photographiés." },
      ],
    },
    {
      id: "motivation-et-incitation",
      objectifs: [3],
      type: "tri",
      titre: "Ce qui motive, ce qui incite",
      question: () =>
        "Rangez ce qui pousse Inès à bien travailler : une motivation qui vient d'elle (intrinsèque), ou une incitation que l'hôtel lui offre (extrinsèque) ?",
      categories: [
        { code: "intrinseque", libelle: "Motivation intrinsèque" },
        { code: "extrinseque", libelle: "Incitation extrinsèque" },
      ],
      elements: () => [
        { libelle: "Le plaisir de régler le problème d'un client", montant: 0, categorie: "intrinseque", pourquoi: "La satisfaction vient de la tâche elle-même : une motivation intrinsèque." },
        { libelle: "L'envie de progresser vers un poste de chef de réception", montant: 0, categorie: "intrinseque", pourquoi: "Un projet personnel, qui la pousse de l'intérieur." },
        { libelle: "La prime trimestrielle liée aux avis des clients", montant: 0, categorie: "extrinseque", pourquoi: "Une récompense offerte par l'hôtel : une incitation." },
        { libelle: "Les repas offerts pendant le service", montant: 0, categorie: "extrinseque", pourquoi: "Un avantage donné par l'employeur : une incitation." },
      ],
      relance: "Demandez-vous : cela vient-il d'elle, ou est-ce l'hôtel qui le lui offre ?",
      explication: () => [
        "Une incitation peut entretenir une motivation, mais ne la remplace pas : une prime ne rend pas une tâche intéressante. La directrice compte sur les deux, et sur l'accueil des premières semaines.",
      ],
    },
    {
      id: "le-cout-d-un-depart",
      objectifs: [4],
      type: "montants",
      titre: "Ce que coûte un départ",
      notions: ["staff_turnover"],
      question: (c) => {
        const i = INTEGRATION_DE_L_ESCALE;
        return `En N, ${c.entreprise} a accueilli ${qte(i.arrivees)} salariés ; ${qte(i.departs)} sont partis pendant leur période d'essai. Remplacer un départ coûte ${eur(i.recrutement)} de recrutement et ${qte(i.heuresDeFormation)} heures de formation, à ${eur(COUT_HORAIRE_DE_L_ESCALE)} l'heure. Avec un tuteur, la directrice attend ${qte(i.departsAvecTutorat)} seul départ. Calculez le coût d'un départ et l'économie que le tutorat ferait.`;
      },
      champs: () => {
        const i = INTEGRATION_DE_L_ESCALE;
        const k = integrationDeLEscale();
        return [
          { libelle: "Coût de la formation d'un remplaçant", attendu: k.formation, calcul: `${qte(i.heuresDeFormation)} h × ${eur(COUT_HORAIRE_DE_L_ESCALE)} = ${eur(k.formation)}` },
          { libelle: "Coût d'un départ", attendu: k.coutDUnDepart, calcul: `${eur(i.recrutement)} + ${eur(k.formation)} = ${eur(k.coutDUnDepart)}` },
          { libelle: "Économie du tutorat", attendu: k.economie, calcul: `(${qte(i.departs)} − ${qte(i.departsAvecTutorat)}) × ${eur(k.coutDUnDepart)} = ${eur(k.economie)}` },
        ];
      },
      explication: () => {
        const k = integrationDeLEscale();
        return [
          `Chaque départ coûte ${eur(k.coutDUnDepart)}, sans compter le service moins bien rendu pendant le remplacement. Éviter ${qte(k.departsEvites)} départs économise ${eur(k.economie)} : c'est ce que le tutorat peut coûter au plus.`,
        ];
      },
    },
    {
      id: "le-tutorat",
      objectifs: [4],
      type: "curseur",
      titre: "Le plus long tutorat qui se paie",
      notions: ["staff_turnover"],
      sens: "plus-grande",
      question: (c) =>
        `Un tuteur donne des heures à chaque arrivant, payées ${eur(COUT_HORAIRE_DE_L_ESCALE)} l'heure, pour les ${qte(INTEGRATION_DE_L_ESCALE.arrivees)} arrivants de l'année. Faites varier les heures de tutorat par arrivant : une droite donne l'économie des départs évités, l'autre le coût du tutorat. Placez le curseur sur le plus grand nombre d'heures que l'économie paie encore chez ${c.entreprise}.`,
      grandeur: () => ({ libelle: "Heures de tutorat par arrivant", unite: "h" }),
      cible: () => ({ attendu: TUTORAT_LE_PLUS_LONG, max: 60 }),
      zones: ["Le tutorat se paie", "Le tutorat coûte plus qu'il n'économise"],
      rates: () => ({ dessous: "L'économie paie encore davantage d'heures : cherchez plus haut.", dessus: "À ce nombre d'heures, le tutorat coûte plus que les départs qu'il évite." }),
      montrer: "Montrer les heures",
      lecture: (_c, h) => {
        const k = integrationDeLEscale(h);
        return [
          { libelle: "Économie des départs évités", montant: k.economie },
          { libelle: "Coût du tutorat", montant: k.coutDuTutorat },
          { libelle: "Ce que le tutorat rapporte", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({
        produit: () => integrationDeLEscale().economie,
        cout: (h) => integrationDeLEscale(h).coutDuTutorat,
        libelles: ["Économie des départs évités", "Coût du tutorat"],
      }),
      explication: () => {
        const k = integrationDeLEscale(TUTORAT_LE_PLUS_LONG);
        const plus = integrationDeLEscale(TUTORAT_LE_PLUS_LONG + 1);
        return [
          `À ${qte(TUTORAT_LE_PLUS_LONG)} heures par arrivant, le tutorat coûte ${eur(k.coutDuTutorat)}, sous les ${eur(k.economie)} qu'il économise ; à ${qte(TUTORAT_LE_PLUS_LONG + 1)} heures, il coûterait ${eur(plus.coutDuTutorat)}.`,
          "Le calcul ne dit pas tout : un arrivant bien accueilli comprend plus vite les normes du groupe, rencontre ceux qui ont le leadership, et devient plus tôt un acteur de l'équipe.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Chez ${c.entreprise}, Inès arrive avec sa personnalité, ses perceptions, ses attitudes et ses compétences. L'organisation lui donne une place formelle : un poste dans l'organigramme, une fiche de poste, une hiérarchie. Le groupe lui offre une identité, une culture, des normes et des rituels, et des relations informelles où certains exercent un leadership sans autorité.`,
        `Devenir acteur prend du temps, et ce temps se gère : un départ en période d'essai coûte ${eur(integrationDeLEscale().coutDUnDepart)}, et jusqu'à ${qte(TUTORAT_LE_PLUS_LONG)} heures de tutorat par arrivant se paient. Dans l'arène, l'hôtel joue les embauches et les salaires ; la place de chacun, elle, se construit dans l'équipe.`,
      ],
      repere: () => "Individu (personnalité, perception, attitudes, compétences) + place formelle (organigramme, fiche de poste) + groupe (culture, normes, relations informelles) = un acteur de l'organisation.",
    },
  ],
};
