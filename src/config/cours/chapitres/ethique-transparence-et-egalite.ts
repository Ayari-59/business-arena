import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import { CLUB_SOUTENU, DONS_ESSAYES, ENTREPRISES_DE_L_ETHIQUE, MECENAT, don, donMaximal, ecartDeRemuneration, plafondDuMecenat } from "../monde/ethique-de-nova";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ÉTHIQUE, TRANSPARENCE ET ÉGALITÉ (Bac STMG, management, sciences de gestion et numérique de
 * terminale, enseignement commun, thème 3, question 3.1 : « Les organisations peuvent-elles s'affranchir
 * des questions de société ? »).
 *
 * L'éthique (sa définition, son origine), la déontologie, l'éthique dans les affaires et dans les
 * organisations publiques et associatives, les actions dont la sincérité se discute (lobbying,
 * greenwashing, social washing), la normalisation comptable et la transparence de l'information
 * financière, la lutte contre les discriminations et l'égalité entre les femmes et les hommes (un écart
 * de rémunération à calculer), et l'organisation civique : le mécénat, chiffré au laboratoire, et la
 * démocratie participative. La version de palier 4 (« La responsabilité sociétale ») chiffre un label ;
 * celle-ci est au niveau du lycée.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/ethique-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : l'écart de rémunération se donne à deux décimales, à un centième
 * près (au dixième, avant).
 */


export const ETHIQUE_TRANSPARENCE_ET_EGALITE: Chapitre = {
  code: "ethique-transparence-et-egalite",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les organisations et la société"],
  titre: "Éthique, transparence et égalité",
  accroche:
    "Un cadeau à l'agent qui choisit le fournisseur, une enceinte dite « écologique » qui ne l'est qu'à moitié, un écart de salaire entre femmes et hommes, un don au club du territoire : les questions de société qu'aucune organisation n'évite.",
  objectifs: [
    "Distinguer éthique, déontologie et obligation légale",
    "Reconnaître une pratique dont la sincérité se discute",
    "Relier la transparence aux règles comptables",
    "Mesurer une inégalité et reconnaître une discrimination",
    "Chiffrer un mécénat et reconnaître la démocratie participative",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ETHIQUE,
    pourquoi: "ce chapitre suit les choix de NOVA face aux questions de société de son territoire.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Qu'est-ce que l'éthique ?",
      texte: (c) => [
        "L'éthique, c'est la réflexion sur ce qu'il est bien ou mal de faire, au-delà de ce que la loi impose. Dans les organisations, elle s'est imposée après des événements qui ont choqué : des affaires de corruption, de grandes faillites où des comptes avaient été maquillés.",
        `${c.entreprise} n'y échappe pas : elle vend à des clients publics, emploie des salariés, communique sur ses produits, publie ses comptes. À chaque fois, ses parties prenantes la jugent aussi sur sa sincérité.`,
      ],
      repere: () => "Éthique : ce qu'on choisit de faire parce que c'est juste. Déontologie : les règles d'une profession. Loi : ce qui s'impose à tous.",
    },
    {
      id: "ethique-deontologie-loi",
      objectifs: [0],
      type: "tri",
      titre: "Éthique, déontologie ou loi",
      question: () => "Rangez chaque règle que suit NOVA.",
      categories: [
        { code: "ethique", libelle: "Un choix éthique" },
        { code: "deontologie", libelle: "Une règle de déontologie" },
        { code: "loi", libelle: "Une obligation légale" },
      ],
      elements: () => [
        { libelle: "Ne pas acheter de composants à une usine qui fait travailler des enfants, même moins chère", montant: 0, categorie: "ethique", pourquoi: "NOVA va au-delà de ce que la loi française impose à une petite entreprise : un choix éthique." },
        { libelle: "L'expert-comptable de NOVA ne conseille pas en même temps son concurrent direct sur le même dossier", montant: 0, categorie: "deontologie", pourquoi: "Une règle que se donne la profession : la déontologie." },
        { libelle: "Payer chaque salarié au moins au salaire minimum", montant: 0, categorie: "loi", pourquoi: "La loi l'impose à tous." },
        { libelle: "Établir chaque année des comptes qui donnent une image fidèle", montant: 0, categorie: "loi", pourquoi: "Le code de commerce l'impose." },
      ],
      relance: "La règle s'impose-t-elle à tous, à une profession, ou NOVA la choisit-elle d'elle-même ?",
      explication: () => ["L'éthique des affaires commence là où la loi s'arrête : elle dit ce qu'une organisation s'interdit alors que rien ne l'y oblige."],
    },
    {
      id: "un-cadeau",
      objectifs: [0],
      type: "choix",
      titre: "Un cadeau à l'agent public",
      question: () => `La ${HAUT_VERDASSE.nom} choisit un fournisseur pour sonoriser son gymnase. Un commercial de NOVA propose d'offrir une enceinte à l'agent qui prépare le choix. Qu'en dire ?`,
      options: () => [
        {
          texte: "C'est interdit : on ne cherche pas à influencer un agent public",
          juste: true,
          retour: "Oui : offrir un avantage à un agent pour obtenir un marché, c'est de la corruption ; l'accepter aussi. L'éthique des organisations publiques exige que le choix se fasse sur l'offre, en concurrence, au grand jour.",
        },
        {
          texte: "C'est un geste commercial normal, que tout le monde pratique",
          juste: false,
          retour: "Non : un cadeau à celui qui décide d'un marché public fausse la concurrence. Ce n'est pas une habitude acceptable, c'est un délit.",
        },
        {
          texte: "C'est permis, à condition que l'enceinte soit d'une petite valeur",
          juste: false,
          retour: "Non : la valeur n'y change rien quand le cadeau vise à obtenir le marché.",
        },
      ],
    },
    {
      id: "sincere-ou-non",
      objectifs: [1],
      type: "tri",
      titre: "Sincère, ou de façade ?",
      question: () => "Rangez chaque pratique.",
      categories: [
        { code: "sincere", libelle: "Engagement sincère" },
        { code: "greenwashing", libelle: "Greenwashing" },
        { code: "socialwashing", libelle: "Social washing" },
      ],
      elements: () => [
        { libelle: "Reprendre et recycler les enceintes usagées, avec les chiffres publiés", montant: 0, categorie: "sincere", pourquoi: "L'action est réelle et se vérifie." },
        { libelle: "Écrire « enceinte écologique » sur la Studio parce que son carton est recyclé", montant: 0, categorie: "greenwashing", pourquoi: "Un détail présenté comme un engagement pour l'environnement : du greenwashing." },
        { libelle: "Afficher « entreprise inclusive » sans avoir jamais recruté de personne en situation de handicap", montant: 0, categorie: "socialwashing", pourquoi: "Un engagement social affiché, sans les actes : du social washing." },
      ],
      relance: "La pratique s'appuie-t-elle sur des actes vérifiables, ou présente-t-elle un détail comme un engagement ?",
      explication: () => ["Le lobbying, l'action pour peser sur une décision publique, soulève la même question : il est légal s'il est transparent, et se discute quand il défend un intérêt privé contre l'intérêt général."],
    },
    {
      id: "la-transparence",
      type: "lecture",
      titre: "La transparence des comptes",
      texte: () => [
        "Une organisation contribue à une image transparente de son activité par une information financière fiable. C'est le rôle de la normalisation comptable : des règles et des principes communs, que toutes les entreprises appliquent, pour que leurs comptes se lisent et se comparent.",
        "Le principe de prudence, par exemple, oblige à constater une perte probable dès qu'on la connaît, même si elle n'est pas encore certaine. Maquiller les comptes, c'est tromper les associés, les prêteurs, les salariés et l'État.",
      ],
      repere: () => "Image fidèle : des comptes sincères, réguliers, établis selon des règles communes. La transparence est une exigence éthique et légale.",
    },
    {
      id: "la-creance-de-sonora",
      objectifs: [2],
      type: "choix",
      titre: "La créance de Sonora",
      question: () => "Fin décembre, le client Sonora est en redressement judiciaire : une partie de ce qu'il doit à NOVA ne sera sans doute jamais payée. Un associé propose de n'en rien dire dans les comptes de l'année, pour afficher un meilleur résultat. Que répondre ?",
      options: () => [
        {
          texte: "Non : la perte probable se constate dès cette année",
          juste: true,
          retour: "Oui : c'est le principe de prudence. Les comptes doivent montrer la perte probable par une dépréciation de la créance. Cacher le risque tromperait ceux qui lisent les comptes.",
        },
        {
          texte: "Oui : tant que Sonora n'a pas fermé, rien n'est perdu, on peut attendre",
          juste: false,
          retour: "Non : la prudence oblige à constater une perte probable sans attendre qu'elle soit certaine.",
        },
        {
          texte: "Oui, si l'expert-comptable ne s'en aperçoit pas",
          juste: false,
          retour: "Non : ce serait des comptes volontairement faux. L'éthique ne dépend pas du risque d'être découvert.",
        },
      ],
    },
    {
      id: "l-ecart-de-remuneration",
      objectifs: [3],
      type: "montants",
      titre: "L'écart entre femmes et hommes",
      question: () => {
        const e = ecartDeRemuneration();
        return `En N + 2, NOVA compte ${qte(e.femmes.effectif)} femmes payées en moyenne ${eur(e.femmes.salaire)} bruts par mois, et ${qte(e.hommes.effectif)} hommes payés en moyenne ${eur(e.hommes.salaire)}. Calculez l'écart de salaire moyen, puis cet écart rapporté au salaire moyen des hommes (à deux décimales).`;
      },
      champs: () => {
        const e = ecartDeRemuneration();
        return [
          { libelle: "Écart de salaire moyen", attendu: e.ecart, calcul: `${eur(e.hommes.salaire)} − ${eur(e.femmes.salaire)} = ${eur(e.ecart)}` },
          { libelle: "Écart rapporté au salaire des hommes (%)", attendu: e.ecartPct, calcul: `${eur(e.ecart)} ÷ ${eur(e.hommes.salaire)} × 100 = ${pct(e.ecartPct)}` },
        ];
      },
      explication: () => {
        const e = ecartDeRemuneration();
        return [`Les femmes gagnent en moyenne ${pct(e.ecartPct)} de moins. Un écart moyen ne prouve pas une discrimination (les postes peuvent différer) ; il oblige à chercher s'il existe, à poste égal, un écart sans raison. Les entreprises d'au moins 50 salariés publient chaque année un index de l'égalité professionnelle, dont c'est le premier indicateur.`];
      },
    },
    {
      id: "discrimination-ou-non",
      objectifs: [3],
      type: "tri",
      titre: "Discrimination, ou critère légitime ?",
      question: () => "NOVA recrute un opérateur. Rangez chaque critère de choix.",
      categories: [
        { code: "discrimination", libelle: "Une discrimination, interdite" },
        { code: "legitime", libelle: "Un critère lié au poste" },
      ],
      elements: () => [
        { libelle: "Écarter une candidate parce qu'elle pourrait avoir un enfant", montant: 0, categorie: "discrimination", pourquoi: "La situation de famille et le sexe sont des critères interdits." },
        { libelle: "Préférer un candidat parce qu'il habite le quartier « mieux fréquenté »", montant: 0, categorie: "discrimination", pourquoi: "Le lieu de résidence est un critère interdit." },
        { libelle: "Demander de savoir lire un plan de câblage", montant: 0, categorie: "legitime", pourquoi: "Une compétence que le poste demande." },
        { libelle: "Aménager le poste pour un candidat en fauteuil, compétent pour le montage", montant: 0, categorie: "legitime", pourquoi: "Le handicap n'est pas un motif de refus : l'employeur aménage le poste quand il le peut." },
      ],
      relance: "Le critère tient-il au travail à faire, ou à la personne (son sexe, sa famille, son origine, son adresse, son handicap) ?",
      explication: () => ["La loi interdit plus de 25 critères de discrimination. Lutter contre les discriminations, c'est aussi agir : recruter sur les compétences, aménager les postes, viser l'égalité entre les femmes et les hommes."],
    },
    {
      id: "l-organisation-civique",
      type: "lecture",
      titre: "Le mécénat et la démocratie participative",
      texte: () => {
        const p = plafondDuMecenat();
        return [
          `Au-delà de ses propres buts, une organisation peut agir pour l'intérêt général. Par le mécénat, elle donne à une association : la loi réduit alors son impôt de ${pct(MECENAT.taux * 100)} du don, dans la limite de ${eur(MECENAT.plafondFixe)} ou de ${qte(MECENAT.partDuChiffreDAffaires * 1000)} ‰ du chiffre d'affaires, le plus élevé des deux (pour NOVA, ${eur(p.plafond)}).`,
          "Par la démocratie participative, elle associe ses membres ou ses usagers aux décisions : un vote des salariés sur l'association à soutenir, un budget participatif où les habitants choisissent des projets.",
        ];
      },
      repere: () => "Mécénat : un don sans contrepartie à une œuvre d'intérêt général, avec une réduction d'impôt. Démocratie participative : associer aux décisions ceux qu'elles concernent.",
    },
    {
      id: "le-laboratoire-du-mecenat",
      objectifs: [4],
      type: "simulation",
      titre: "Un don au club",
      question: () => `NOVA veut soutenir le ${CLUB_SOUTENU.nom}, une association d'intérêt général. Le président ne veut pas que le don coûte à NOVA plus de ${eur(MECENAT.budgetNet)}, une fois la réduction d'impôt déduite. Faites varier le don.`,
      leviers: () => [{ code: "don", libelle: "Don au club", unite: "€", ...DONS_ESSAYES, depart: DONS_ESSAYES.min }],
      lecture: (_c, p) => {
        const d = don(p.don!);
        return [
          { libelle: "Don au club", montant: d.montant },
          { libelle: "Réduction d'impôt", montant: d.reduction },
          { libelle: "Ce que le don coûte vraiment à NOVA", montant: d.coutNet, fort: true },
        ];
      },
      defi: () => {
        const juste = donMaximal();
        return {
          consigne: `Trouvez le plus gros don, de ${eur(DONS_ESSAYES.pas)} en ${eur(DONS_ESSAYES.pas)}, qui ne coûte pas plus de ${eur(MECENAT.budgetNet)} à NOVA.`,
          atteint: (p) => p.don === juste,
          indice: (p) => {
            const d = don(p.don!);
            return d.coutNet > MECENAT.budgetNet ? `À ${eur(p.don!)}, le don coûte ${eur(d.coutNet)} : c'est trop.` : `À ${eur(p.don!)}, le don ne coûte que ${eur(d.coutNet)} : un don plus gros tiendrait-il encore ?`;
          },
          solution: { don: juste },
        };
      },
      explication: (_c, p) => {
        const d = don(p.don!);
        return [`Défi relevé : un don de ${eur(d.montant)} ne coûte que ${eur(d.coutNet)} à NOVA ; l'État en prend ${eur(d.reduction)} à sa charge par la réduction d'impôt. Le club reçoit bien plus que ce que NOVA dépense.`];
      },
    },
    {
      id: "la-democratie-participative",
      objectifs: [4],
      type: "choix",
      titre: "Qui choisit l'association ?",
      question: () => "Le président hésite entre le club de handball et l'épicerie solidaire du territoire. Une démarche participative, ce serait :",
      options: () => [
        {
          texte: "Laisser les salariés voter, sur deux projets présentés",
          juste: true,
          retour: "Oui : associer les salariés au choix développe la démocratie participative en interne, et renforce leur adhésion. Le budget reste fixé par la direction.",
        },
        {
          texte: "Choisir seul, puis annoncer la décision dans le journal interne",
          juste: false,
          retour: "Non : c'est une communication descendante, pas une participation.",
        },
        {
          texte: "Donner au club du président de NOVA, qui en est supporter",
          juste: false,
          retour: "Non : ce serait servir un intérêt personnel avec l'argent de l'entreprise, pas une démarche civique.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const d = don(donMaximal());
        const e = ecartDeRemuneration();
        return [
          `${c.entreprise} ne peut pas s'affranchir des questions de société : elle refuse de corrompre, se méfie du greenwashing, publie des comptes fidèles, mesure son écart de salaire entre femmes et hommes (${pct(e.ecartPct)}) et lutte contre les discriminations. Son don de ${eur(d.montant)} au club ne lui coûte que ${eur(d.coutNet)}.`,
          "Dans l'arène, l'engagement sociétal se décide aussi : il coûte d'abord, et se juge sur la durée, auprès des clients comme des salariés.",
        ];
      },
      repere: () => "Éthique, déontologie, loi · sincérité (greenwashing, social washing, lobbying) · transparence et normalisation · égalité et non-discrimination · mécénat et démocratie participative.",
    },
  ],
};
