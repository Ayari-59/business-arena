import { AVIS_EN_LIGNE, ENTREPRISES_DE_LA_COMMUNICATION, annonceOuCooptation, avisPourLaNoteVisee, noteApres } from "../monde/communication-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : COMMUNIQUER AVEC CHAQUE ACTEUR, INTERNE, EXTERNE, FINANCIÈRE (Bac STMG, management, sciences
 * de gestion et numérique de terminale, enseignement commun, thème 2, question 2.3 : « Communique-t-on de
 * la même manière avec tous les acteurs ? »). Il cite aussi le thème 3 de l'enseignement spécifique de
 * ressources humaines et communication (la communication interne et la marque employeur y sont
 * approfondies), en second.
 *
 * La stratégie de communication et ses deux visées (l'adhésion du personnel, l'image), ses formes
 * (descendante, ascendante, horizontale), la communication globale et intégrée, interne et externe,
 * institutionnelle et commerciale, l'identité de l'organisation (marque employeur, e-réputation, identité
 * numérique, chiffrée au curseur par les avis en ligne), la communication financière et ses
 * destinataires, la normalisation comptable, le plan d'affaires, et le triptyque cible, message, support.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/communication-de-nova.ts.
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const note = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export const COMMUNIQUER_AVEC_CHAQUE_ACTEUR: Chapitre = {
  code: "communiquer-avec-chaque-acteur",
  parcours: "stmg-management",
  palier: 1,
  blocs: [
    "STMG Thème 2 · Les organisations et les acteurs",
    "STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social",
  ],
  titre: "Communiquer avec chaque acteur : interne, externe, financière",
  accroche:
    "Le même message ne s'adresse pas de la même façon aux opérateurs, aux clients, au banquier et aux futurs salariés. Les formes de la communication, l'image en ligne, et ce que les comptes disent aux partenaires.",
  objectifs: [
    "Reconnaître les visées et les formes de la communication",
    "Distinguer communication interne et externe, institutionnelle et commerciale",
    "Mesurer un élément de l'identité numérique : l'e-réputation",
    "Adapter l'information financière à chaque partenaire",
    "Construire une communication : cible, message, support",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_COMMUNICATION,
    pourquoi: "ce chapitre suit la communication de NOVA avec son équipe, ses clients et ses partenaires.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Pourquoi communiquer",
      texte: (c) => [
        `${c.entreprise} lance sa gamme, cherche ${qte(annonceOuCooptation().postes)} opérateurs et demande un prêt à sa banque. À chaque fois, elle communique : avec son équipe, avec ses clients, avec ceux qui pourraient la rejoindre, avec ses financeurs.`,
        "La communication vise d'abord l'adhésion du personnel aux objectifs de l'organisation, et le renforcement de son image. Elle a une dimension stratégique : elle affirme une identité et fait la cohésion des membres. Elle coordonne l'action de tous et contribue au dialogue social.",
      ],
      repere: () => "Communication : faire adhérer en interne, construire l'image en externe. Elle suit une stratégie, avec ses cibles.",
    },
    {
      id: "les-formes",
      objectifs: [0],
      type: "tri",
      titre: "Descendante, ascendante, horizontale",
      question: () => "Rangez chaque communication interne de NOVA selon sa forme.",
      categories: [
        { code: "descendante", libelle: "Descendante" },
        { code: "ascendante", libelle: "Ascendante" },
        { code: "horizontale", libelle: "Horizontale" },
      ],
      elements: () => [
        { libelle: "Le président présente à l'équipe les objectifs du trimestre", montant: 0, categorie: "descendante", pourquoi: "De la direction vers les salariés : descendante." },
        { libelle: "Une note affichée annonce les nouveaux horaires de la ligne", montant: 0, categorie: "descendante", pourquoi: "Une information qui descend la ligne hiérarchique." },
        { libelle: "Un opérateur propose au président une amélioration du poste de soudure", montant: 0, categorie: "ascendante", pourquoi: "Des salariés vers la direction : ascendante." },
        { libelle: "Les opérateurs du matin passent les consignes à ceux de l'après-midi", montant: 0, categorie: "horizontale", pourquoi: "Entre personnes du même niveau : horizontale." },
      ],
      relance: "L'information va-t-elle de la direction vers l'équipe, de l'équipe vers la direction, ou entre collègues ?",
      explication: () => ["Une organisation qui n'écoute que la communication descendante se prive des idées du terrain : la communication ascendante nourrit l'amélioration continue."],
    },
    {
      id: "interne-externe",
      objectifs: [1],
      type: "tri",
      titre: "Interne ou externe, institutionnelle ou commerciale",
      question: () => "Rangez chaque action de communication de NOVA.",
      categories: [
        { code: "interne", libelle: "Interne" },
        { code: "institutionnelle", libelle: "Externe institutionnelle" },
        { code: "commerciale", libelle: "Externe commerciale" },
      ],
      elements: () => [
        { libelle: "Le journal mensuel de l'équipe, sur la messagerie interne", montant: 0, categorie: "interne", pourquoi: "Pour les salariés : la communication interne." },
        { libelle: "Une vidéo qui raconte l'histoire de NOVA et son atelier, sans montrer de prix", montant: 0, categorie: "institutionnelle", pourquoi: "Elle fait connaître l'organisation dans son ensemble : la communication institutionnelle." },
        { libelle: "Le parrainage du club de handball du territoire", montant: 0, categorie: "institutionnelle", pourquoi: "Il construit l'image de NOVA auprès des habitants, sans vendre un produit." },
        { libelle: "Une publicité pour la Studio, avec son prix de lancement", montant: 0, categorie: "commerciale", pourquoi: "Elle pousse un produit vers le marché : la communication commerciale." },
      ],
      relance: "Le message vise-t-il les salariés, l'image de l'organisation, ou la vente d'un produit ?",
      explication: () => ["Une communication globale et intégrée harmonise les deux : ce que NOVA dit à ses salariés et ce qu'elle dit au public doivent raconter la même entreprise. Les salariés sont aussi des citoyens et des clients."],
    },
    {
      id: "l-identite",
      type: "lecture",
      titre: "L'identité de l'organisation en ligne",
      texte: () => [
        "Les technologies numériques ont changé la communication. L'organisation marque sa présence par son identité numérique (son site, ses comptes sur les réseaux sociaux, ce que l'on trouve en cherchant son nom), et veille à sa réputation en ligne, l'e-réputation : avis, commentaires, articles.",
        "Elle soigne aussi sa marque employeur : l'image qu'elle donne à ceux qui pourraient venir y travailler, et à ses salariés. Une bonne marque employeur aide à attirer des talents et à les garder.",
      ],
      repere: () => "Identité numérique · e-réputation · marque employeur : trois faces de l'identité de l'organisation.",
    },
    {
      id: "le-curseur-des-avis",
      objectifs: [2],
      type: "curseur",
      titre: "Remonter sa note",
      question: (c) => {
        const a = AVIS_EN_LIGNE;
        return `${c.entreprise} compte ${qte(a.nombre)} avis en ligne, d'une note moyenne de ${note(a.moyenne)} sur ${qte(a.meilleure)}. Les revendeurs ne mettent en avant que les marques notées ${note(a.noteVisee)} ou plus. Faites varier le nombre de nouveaux avis à ${qte(a.meilleure)} sur ${qte(a.meilleure)} : une droite donne le total des notes, l'autre ce qu'il faudrait pour une moyenne de ${note(a.noteVisee)}. Placez le curseur sur le plus petit nombre d'avis qui suffit.`;
      },
      cible: () => ({ attendu: avisPourLaNoteVisee(), max: 150 }),
      grandeur: () => ({ libelle: `Nouveaux avis à ${qte(AVIS_EN_LIGNE.meilleure)} sur ${qte(AVIS_EN_LIGNE.meilleure)}`, unite: "avis" }),
      rates: () => ({ dessous: "Pas encore : la moyenne reste sous la note visée.", dessus: "La note est atteinte, mais un avis de moins suffirait-il encore ?" }),
      zones: ["Note visée atteinte", "Note visée manquée"],
      montrer: "Montrer le nombre d'avis",
      lecture: (_c, n) => {
        const r = noteApres(n);
        return [
          { libelle: "Avis en tout", montant: r.avis, unite: "avis" },
          { libelle: "Note moyenne", montant: r.moyenne, unite: `sur ${qte(AVIS_EN_LIGNE.meilleure)}`, fort: true },
        ];
      },
      droites: () => {
        const a = AVIS_EN_LIGNE;
        return { produit: (n) => a.nombre * a.moyenne + a.meilleure * n, cout: (n) => a.noteVisee * (a.nombre + n), libelles: ["Total des notes", `Total pour ${note(a.noteVisee)} de moyenne`] };
      },
      explication: () => {
        const n = avisPourLaNoteVisee();
        return [`Il faut ${qte(n)} avis à ${qte(AVIS_EN_LIGNE.meilleure)} sur ${qte(AVIS_EN_LIGNE.meilleure)} pour passer de ${note(AVIS_EN_LIGNE.moyenne)} à ${note(noteApres(n).moyenne)} : une réputation se dégrade vite et se reconstruit lentement. NOVA ne peut qu'inviter ses vrais clients à noter : acheter ou écrire de faux avis est une pratique commerciale trompeuse, interdite.`];
      },
    },
    {
      id: "la-marque-employeur",
      objectifs: [2],
      type: "choix",
      titre: "La marque employeur",
      question: () => `NOVA cherche ${qte(annonceOuCooptation().postes)} opérateurs, mais reçoit peu de candidatures. Que fait une politique de marque employeur ?`,
      options: () => [
        {
          texte: "Montrer avec ses salariés ce qu'on vit vraiment chez NOVA",
          juste: true,
          retour: "Oui : des témoignages d'opérateurs, l'atelier montré tel qu'il est, la formation et la polyvalence mises en avant. La marque employeur ne tient que si elle dit vrai : un nouveau venu déçu repart vite, et le dit.",
        },
        {
          texte: "Promettre dans l'annonce des salaires plus hauts que ceux que l'on paiera",
          juste: false,
          retour: "Non : c'est tromper les candidats. La promesse non tenue fera partir les recrues et abîmera la réputation.",
        },
        {
          texte: "Rien : la marque employeur ne concerne que les grandes entreprises connues",
          juste: false,
          retour: "Non : une petite entreprise a aussi une image d'employeur, souvent faite par le bouche-à-oreille et les avis en ligne.",
        },
      ],
    },
    {
      id: "l-information-financiere",
      objectifs: [3],
      type: "tri",
      titre: "À chaque partenaire son information financière",
      question: () => "Rangez chaque information selon le partenaire qui en a le plus besoin.",
      categories: [
        { code: "banque", libelle: "La banque" },
        { code: "associes", libelle: "Les associés" },
        { code: "salaries", libelle: "Les salariés" },
      ],
      elements: () => [
        { libelle: "La capacité de NOVA à rembourser un nouveau prêt", montant: 0, categorie: "banque", pourquoi: "Le prêteur veut savoir s'il sera remboursé." },
        { libelle: "Le plan d'affaires de la gamme, avec ses ventes et ses résultats prévus", montant: 0, categorie: "banque", pourquoi: "Il justifie la demande de financement." },
        { libelle: "Le résultat de l'année et la part qui pourrait leur être distribuée", montant: 0, categorie: "associes", pourquoi: "Les associés attendent la rentabilité de leur capital." },
        { libelle: "La santé de l'entreprise et ce qu'elle prévoit pour l'emploi", montant: 0, categorie: "salaries", pourquoi: "Les salariés veulent savoir si leur emploi est sûr et si l'entreprise grandit." },
      ],
      relance: "Qui prête, qui possède, qui travaille dans l'entreprise : qui a le plus besoin de cette information ?",
      explication: () => ["La communication financière est devenue stratégique : elle promeut la performance de l'organisation et attire les investisseurs. Elle repose sur des comptes établis selon des règles communes."],
    },
    {
      id: "la-normalisation",
      objectifs: [3],
      type: "choix",
      titre: "Pourquoi des règles comptables communes",
      question: () => "Pourquoi les comptes de NOVA doivent-ils suivre les mêmes règles que ceux de toutes les entreprises ?",
      options: () => [
        {
          texte: "Pour que les partenaires les comprennent et leur fassent confiance",
          juste: true,
          retour: "Oui : la normalisation comptable (le plan comptable, les principes) permet des échanges rapides et fiables entre les parties prenantes. Un banquier lit les comptes de NOVA comme ceux de n'importe quelle entreprise, et les compare.",
        },
        {
          texte: "Pour que chaque entreprise puisse présenter ses comptes à sa façon",
          juste: false,
          retour: "Non : c'est l'inverse. Des comptes présentés à sa façon ne se compareraient pas et inspireraient la méfiance.",
        },
        {
          texte: "Les règles ne servent qu'à calculer l'impôt, rien d'autre",
          juste: false,
          retour: "Non : elles servent d'abord à donner une image fidèle de l'entreprise à tous ceux qui lisent ses comptes. Elles évoluent avec l'environnement.",
        },
      ],
    },
    {
      id: "cible-message-support",
      objectifs: [4],
      type: "tri",
      titre: "Cible, message, support",
      question: () => "NOVA prépare sa communication de recrutement. Rangez chaque élément.",
      categories: [
        { code: "cible", libelle: "La cible" },
        { code: "message", libelle: "Le message" },
        { code: "support", libelle: "Le support" },
      ],
      elements: () => [
        { libelle: "Les jeunes du territoire qui sortent d'un bac professionnel", montant: 0, categorie: "cible", pourquoi: "À qui s'adresse-t-on : la cible." },
        { libelle: "« Chez NOVA, vous apprenez tous les postes, et votre avis compte »", montant: 0, categorie: "message", pourquoi: "Ce que l'on veut dire : le message." },
        { libelle: "Une vidéo d'opérateurs sur un réseau social que la cible utilise", montant: 0, categorie: "support", pourquoi: "Par où passe le message : le support." },
        { libelle: "Un stand au forum de l'emploi de la communauté de communes", montant: 0, categorie: "support", pourquoi: "Un autre support, en personne." },
      ],
      relance: "S'agit-il de qui l'on veut toucher, de ce que l'on veut dire, ou du moyen de le dire ?",
      explication: () => ["Le support se choisit selon la cible, et le message selon ce qui la fera venir : on ne parle pas à un futur opérateur comme à un banquier."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `${c.entreprise} ne communique pas de la même façon avec tous : vers le bas, vers le haut, entre collègues ; vers le public, pour son image ou pour vendre. Elle parle à ceux qui pourraient la rejoindre par sa marque employeur, à ses financeurs par des comptes normalisés et un plan d'affaires. Il lui faudrait ${qte(avisPourLaNoteVisee())} avis parfaits pour atteindre une note de ${note(AVIS_EN_LIGNE.noteVisee)}.`,
        "Dans l'arène, la communication se décide à chaque tour : elle agit sur la demande, comme une réputation se construit tour après tour.",
      ],
      repere: () => "Communication interne (descendante, ascendante, horizontale) et externe (institutionnelle, commerciale, financière) · identité numérique, e-réputation, marque employeur · cible, message, support.",
    },
  ],
};
