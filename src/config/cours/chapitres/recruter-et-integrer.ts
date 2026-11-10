import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTONNOIR, ENTREPRISES_DU_RECRUTEMENT, RETOUR_DES_SAISONNIERS, SAISONNIERS, candidaturesNecessaires, entonnoir, fidelisation } from "../monde/recrutement-de-l-escale";
import { COUT_HORAIRE_DE_L_ESCALE } from "../monde/equipe-de-l-escale";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RECRUTER ET INTÉGRER, DU BESOIN À LA FIDÉLISATION (Bac STMG, enseignement spécifique de
 * ressources humaines et communication de terminale, thème 1, question 1.1 : « Le recrutement suffit-il
 * à répondre aux besoins en compétences de l'organisation ? »).
 *
 * Compétences, qualification et potentiel ; le processus de recrutement (le besoin, la fiche de poste et
 * le profil, la recherche interne et externe, l'e-recrutement, la sélection et ce que la loi interdit de
 * demander) ; les formes de la relation de travail (CDI, contrat saisonnier, intérim, apprentissage) ;
 * l'accueil et l'intégration ; la fidélisation, chiffrée. La GPEC et le recrutement de NOVA sont dans
 * « Les ressources pour produire » (partie commune, 1.2), qui cite ce thème en second.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez L'ESCALE : monde/recrutement-de-l-escale.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

export const RECRUTER_ET_INTEGRER: Chapitre = {
  code: "recruter-et-integrer",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences"],
  titre: "Recruter et intégrer : du besoin à la fidélisation",
  accroche:
    "Un hôtel doit trouver ses saisonniers pour l'été. Définir le besoin, chercher les candidats, choisir le contrat, accueillir, puis donner envie de revenir : recruter ne suffit pas, il faut aussi garder.",
  objectifs: [
    "Distinguer qualification, compétence et potentiel",
    "Suivre le processus de recrutement, du besoin à la sélection",
    "Chiffrer les candidatures qu'un recrutement demande",
    "Choisir la forme de la relation de travail",
    "Intégrer et fidéliser pour ne pas recruter deux fois",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_RECRUTEMENT,
    pourquoi: "ce chapitre suit le recrutement des saisonniers de L'ESCALE, dont le cours tient l'équipe et le coût du travail.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un été à préparer",
      texte: (c) => [
        `L'été, le tourisme de loisirs remplit ${c.entreprise}. Pour juillet et août, la directrice doit recruter ${qte(SAISONNIERS)} saisonniers : aux étages, au petit-déjeuner, à la réception.`,
        "Recruter, c'est trouver des compétences qui manquent. Mais le recrutement n'est qu'une réponse parmi d'autres : la gestion prévisionnelle des emplois et des compétences (GPEC) cherche aussi dans l'équipe, par la formation et la mobilité, et cherche à garder ceux qui sont là.",
      ],
      repere: () => "Le besoin en compétences se couvre en recrutant, en formant, en déplaçant, et en fidélisant.",
    },
    {
      id: "qualification-competence-potentiel",
      objectifs: [0],
      type: "tri",
      titre: "Qualification, compétence, potentiel",
      question: () => "La directrice lit la candidature de Léa, pour le petit-déjeuner. Rangez chaque élément.",
      categories: [
        { code: "qualification", libelle: "Qualification" },
        { code: "competence", libelle: "Compétence" },
        { code: "potentiel", libelle: "Potentiel" },
      ],
      elements: () => [
        { libelle: "Un CAP de commercialisation et services en hôtel, café, restaurant", montant: 0, categorie: "qualification", pourquoi: "Un diplôme reconnu atteste un niveau : c'est la qualification." },
        { libelle: "Servir seule une salle de 40 couverts sans faire attendre", montant: 0, categorie: "competence", pourquoi: "Un savoir-faire mis en œuvre dans une situation de travail : une compétence." },
        { libelle: "Calmer un client mécontent avec le sourire", montant: 0, categorie: "competence", pourquoi: "Un savoir-être qui se voit au travail : une compétence aussi." },
        { libelle: "L'envie d'apprendre la réception, et un jour de diriger le service", montant: 0, categorie: "potentiel", pourquoi: "Ce qu'elle pourrait devenir : son potentiel, qui dessine son parcours professionnel." },
      ],
      relance: "S'agit-il d'un titre reconnu, d'un savoir-faire montré au travail, ou de ce qu'elle pourrait devenir ?",
      explication: () => ["La qualification se lit sur un diplôme ou une classification ; la compétence se constate au travail ; le potentiel se devine, et se développe par un parcours."],
    },
    {
      id: "le-processus",
      type: "lecture",
      titre: "Le processus de recrutement",
      texte: () => [
        "Recruter suit des étapes : définir le besoin (le poste, la période, le budget), écrire la fiche de poste et le profil recherché, chercher les candidats, en interne ou à l'extérieur. Puis sélectionner (tri des candidatures, entretiens, mise en situation), décider, accueillir et intégrer.",
        "L'e-recrutement fait passer plusieurs étapes en ligne : l'offre sur un site d'emploi ou un réseau social professionnel, la candidature sur le site de l'hôtel, le premier tri. Il touche plus de candidats, mais il en apporte aussi beaucoup qui ne conviennent pas.",
      ],
      repere: () => "Besoin · fiche de poste et profil · recherche · sélection · décision · accueil et intégration.",
    },
    {
      id: "d-abord-en-interne",
      objectifs: [1],
      type: "choix",
      titre: "Chercher d'abord dans l'équipe",
      question: (c) => `Chez ${c.entreprise}, une femme de chambre à temps partiel demande depuis l'hiver à travailler davantage. Que fait la directrice avant de publier son offre pour les étages ?`,
      options: () => [
        {
          texte: "Elle lui propose d'abord les heures de l'été",
          juste: true,
          retour: "Oui : c'est un recrutement interne, rapide et sans risque d'erreur sur la personne. Le Code du travail donne d'ailleurs aux salariés à temps partiel une priorité pour un emploi de leur catégorie, à temps complet ou plus long.",
        },
        {
          texte: "Rien : un recrutement se fait toujours à l'extérieur, pour apporter du sang neuf à l'équipe",
          juste: false,
          retour: "Non : le recrutement externe apporte des compétences nouvelles, mais l'interne motive, coûte moins et va plus vite. Les deux se combinent.",
        },
        {
          texte: "Elle publie l'offre, et lui dit d'y répondre comme tout le monde, sans rien lui proposer",
          juste: false,
          retour: "Non : elle connaît déjà son travail. L'ignorer décourage une salariée qui veut s'investir.",
        },
      ],
    },
    {
      id: "trouver-les-candidats",
      objectifs: [1],
      type: "tri",
      titre: "Où chercher",
      question: () => "Rangez chaque façon de trouver des candidats.",
      categories: [
        { code: "interne", libelle: "Recherche interne" },
        { code: "externe", libelle: "Recherche externe classique" },
        { code: "en-ligne", libelle: "E-recrutement" },
      ],
      elements: () => [
        { libelle: "Proposer à un réceptionniste de nuit de passer de jour", montant: 0, categorie: "interne", pourquoi: "Un salarié change de poste : une mobilité interne." },
        { libelle: "Un stand au forum de l'emploi saisonnier de la ville", montant: 0, categorie: "externe", pourquoi: "Rencontrer des candidats en personne, hors de l'hôtel." },
        { libelle: "L'offre déposée à l'agence France Travail", montant: 0, categorie: "externe", pourquoi: "Le service public de l'emploi : une recherche externe." },
        { libelle: "L'offre publiée sur un site d'emploi et sur le site de l'hôtel", montant: 0, categorie: "en-ligne", pourquoi: "Diffusée et reçue en ligne : de l'e-recrutement." },
      ],
      relance: "Le candidat est-il déjà dans l'équipe ? Le cherche-t-on en personne, ou en ligne ?",
      explication: () => ["Chaque canal a son coût et son rendement : on compare ce que coûte une recrue par chaque voie, pas seulement le prix de l'annonce."],
    },
    {
      id: "le-curseur-des-candidatures",
      objectifs: [2],
      type: "curseur",
      titre: "Combien de candidatures ?",
      question: () => {
        const e = ENTONNOIR;
        return `Sur les sites d'emploi, la directrice retient pour un entretien ${pct(e.tauxDEntretien)} des candidatures, et ${pct(e.tauxDEmbauche)} des entretiens aboutissent à une embauche. Faites varier le nombre de candidatures reçues : une droite donne les recrues attendues, l'autre les ${qte(SAISONNIERS)} saisonniers à trouver. Placez le curseur sur le plus petit nombre de candidatures qui suffit.`;
      },
      cible: () => ({ attendu: candidaturesNecessaires(), max: 200 }),
      grandeur: () => ({ libelle: "Candidatures reçues", unite: "candidatures" }),
      rates: () => ({ dessous: "Pas encore : il manquerait des saisonniers.", dessus: "Assez, mais une candidature de moins suffirait-elle encore ?" }),
      zones: ["Saisonniers trouvés", "Saisonniers manquants"],
      montrer: "Montrer le nombre de candidatures",
      lecture: (_c, n) => {
        const k = entonnoir(n);
        return [
          { libelle: "Entretiens", montant: k.entretiens },
          { libelle: "Recrues attendues", montant: k.recrues, fort: true },
        ];
      },
      droites: () => ({ produit: (n) => n * ENTONNOIR.tauxDEntretien * ENTONNOIR.tauxDEmbauche, cout: () => SAISONNIERS, libelles: ["Recrues attendues", "Saisonniers à trouver"] }),
      explication: () => {
        const n = candidaturesNecessaires();
        return [`Il faut ${qte(n)} candidatures pour ${qte(entonnoir(n).entretiens)} entretiens et ${qte(SAISONNIERS)} recrues : un recrutement se prépare tôt, et un profil bien écrit fait monter les taux de l'entonnoir, donc baisser le nombre de candidatures à trier.`];
      },
    },
    {
      id: "la-question-d-entretien",
      objectifs: [1],
      type: "choix",
      titre: "Ce qu'on peut demander",
      question: () => "Pendant un entretien pour le petit-déjeuner, quelle question la directrice peut-elle poser ?",
      options: () => [
        {
          texte: "« Avez-vous déjà servi un buffet de 80 personnes ? »",
          juste: true,
          retour: "Oui : la question a un lien direct et nécessaire avec le poste. C'est la seule règle : le Code du travail interdit de demander ce qui ne sert pas à apprécier la capacité à occuper l'emploi.",
        },
        {
          texte: "« Avez-vous des enfants, et qui les gardera en juillet pendant que vous travaillez ? »",
          juste: false,
          retour: "Non : la situation de famille ne dit rien de la capacité à tenir le poste. La retenir pour choisir serait une discrimination, interdite.",
        },
        {
          texte: "« De quelle origine êtes-vous ? »",
          juste: false,
          retour: "Non : l'origine fait partie des critères de discrimination que la loi interdit, à l'embauche comme ensuite.",
        },
      ],
    },
    {
      id: "la-forme-du-contrat",
      objectifs: [3],
      type: "tri",
      titre: "La forme de la relation de travail",
      question: () => "Quel contrat convient à chaque besoin de l'hôtel ?",
      categories: [
        { code: "cdi", libelle: "CDI" },
        { code: "saisonnier", libelle: "Contrat saisonnier" },
        { code: "interim", libelle: "Intérim" },
        { code: "apprentissage", libelle: "Apprentissage" },
      ],
      elements: () => [
        { libelle: "Un chef de réception, pour l'année et les suivantes", montant: 0, categorie: "cdi", pourquoi: "Un emploi durable, lié à l'activité normale : le contrat à durée indéterminée, la forme normale du contrat de travail." },
        { libelle: "Deux femmes de chambre pour juillet et août", montant: 0, categorie: "saisonnier", pourquoi: "Un travail qui revient chaque année à la même saison : un CDD saisonnier." },
        { libelle: "Un remplaçant dès demain pour un serveur malade", montant: 0, categorie: "interim", pourquoi: "Une agence d'intérim fournit quelqu'un tout de suite : elle l'emploie, l'hôtel paie l'agence." },
        { libelle: "Un jeune qui prépare un BTS en alternance", montant: 0, categorie: "apprentissage", pourquoi: "Il se forme à l'école et dans l'hôtel : un contrat d'apprentissage." },
      ],
      relance: "Le besoin dure-t-il, revient-il chaque saison, presse-t-il, ou mêle-t-il travail et formation ?",
      explication: () => ["Le CDD et l'intérim ne servent qu'à des cas que la loi énumère (un remplacement, un surcroît temporaire, un emploi saisonnier) : ils ne pourvoient pas un emploi durable."],
    },
    {
      id: "l-indemnite",
      objectifs: [3],
      type: "choix",
      titre: "À la fin du contrat saisonnier",
      question: () => "Un CDD ordinaire ouvre droit, à son terme, à une indemnité de fin de contrat. Qu'en est-il d'un contrat saisonnier ?",
      options: () => [
        {
          texte: "Le Code du travail ne la prévoit pas",
          juste: true,
          retour: "Oui : le contrat saisonnier en est exclu par la loi (une convention collective peut prévoir mieux). Le saisonnier reçoit en revanche son indemnité de congés payés.",
        },
        {
          texte: "Elle est due, comme pour tout contrat à durée déterminée, quelle que soit sa raison",
          juste: false,
          retour: "Non : la loi l'écarte pour les emplois saisonniers, comme pour les contrats conclus avec des jeunes pendant leurs vacances scolaires.",
        },
        {
          texte: "Elle est doublée, parce que le contrat est court",
          juste: false,
          retour: "Non : aucune règle ne la double. Le contrat saisonnier n'y ouvre pas droit.",
        },
      ],
    },
    {
      id: "integrer",
      type: "lecture",
      titre: "Accueillir et intégrer",
      texte: () => [
        "Un recrutement ne s'arrête pas à la signature. L'accueil (le poste prêt, l'équipe prévenue, un livret d'accueil qui présente l'hôtel, ses règles et ses usages) puis l'intégration (un tuteur, des objectifs pour les premières semaines, un point à la fin de la période d'essai) font qu'une recrue reste.",
        "La période d'essai permet à chacun de rompre librement : pour un CDD, elle ne dépasse pas 1 jour par semaine de contrat, dans la limite de 2 semaines pour un contrat de 6 mois au plus. Une recrue mal accueillie peut partir dès la première semaine.",
      ],
      repere: () => "Accueil · livret d'accueil · tuteur · période d'essai · intégration.",
    },
    {
      id: "le-premier-jour",
      objectifs: [4],
      type: "choix",
      titre: "Le premier jour d'un saisonnier",
      question: () => "Quel premier jour aide le plus un saisonnier à rester tout l'été ?",
      options: () => [
        {
          texte: "Un tuteur qui l'accueille, lui montre le travail et reste son repère",
          juste: true,
          retour: "Oui : un tuteur transmet les savoir-faire et les règles non écrites de l'équipe. Le saisonnier se sent attendu, et apprend vite.",
        },
        {
          texte: "Un badge, un uniforme et le planning du mois, puis directement au travail avec l'équipe",
          juste: false,
          retour: "Non : il est seul face à un travail qu'il ne connaît pas. C'est ainsi que l'on perd les recrues pendant leur période d'essai.",
        },
        {
          texte: "Une journée de lecture du règlement intérieur",
          juste: false,
          retour: "Non : le règlement doit être connu, mais une journée de lecture n'apprend ni le métier ni l'équipe.",
        },
      ],
    },
    {
      id: "fideliser",
      objectifs: [4],
      type: "montants",
      titre: "Ce que la fidélisation fait gagner",
      question: (c) => {
        const k = fidelisation();
        const r = RETOUR_DES_SAISONNIERS;
        return `Un nouveau saisonnier coûte à ${c.entreprise} son recrutement (${eur(k.recrutement)}) et ${qte(k.heuresDeFormation)} heures de formation, à ${eur(COUT_HORAIRE_DE_L_ESCALE)} l'heure. ${qte(r.revenants)} saisonniers de l'été reviendraient l'été suivant pour une prime de retour de ${eur(r.prime)}, avec ${qte(r.heuresDeRemiseANiveau)} heures de remise à niveau. Calculez le coût de chacun, puis l'économie.`;
      },
      champs: () => {
        const k = fidelisation();
        const r = RETOUR_DES_SAISONNIERS;
        return [
          { libelle: "Coût d'un nouveau saisonnier", attendu: k.nouveau, calcul: `${eur(k.recrutement)} + ${qte(k.heuresDeFormation)} h × ${eur(COUT_HORAIRE_DE_L_ESCALE)} = ${eur(k.nouveau)}` },
          { libelle: "Coût d'un saisonnier qui revient", attendu: k.revenant, calcul: `${eur(r.prime)} + ${qte(r.heuresDeRemiseANiveau)} h × ${eur(COUT_HORAIRE_DE_L_ESCALE)} = ${eur(k.revenant)}` },
          { libelle: "Économie de l'été suivant", attendu: k.economie, calcul: `${qte(r.revenants)} × (${eur(k.nouveau)} − ${eur(k.revenant)}) = ${eur(k.economie)}` },
        ];
      },
      explication: () => {
        const k = fidelisation();
        return [`Faire revenir ${qte(k.revenants)} saisonniers économise ${eur(k.economie)}, et l'hôtel retrouve des gens qui connaissent ses clients. La fidélisation fait partie de la réponse au besoin en compétences : chaque départ évité est un recrutement de moins.`];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = fidelisation();
        return [
          `${c.entreprise} définit son besoin, cherche d'abord dans l'équipe, puis à l'extérieur et en ligne : ${qte(candidaturesNecessaires())} candidatures pour ${qte(SAISONNIERS)} saisonniers. Elle choisit le contrat selon le besoin, accueille avec un tuteur, et fait revenir ses saisonniers, ce qui lui économise ${eur(k.economie)}. Le recrutement seul ne suffit pas : il faut aussi intégrer, former et fidéliser.`,
          "Dans l'arène, une embauche décidée tard arrive après la saison : le recrutement se prépare un tour à l'avance.",
        ];
      },
      repere: () => "Qualification, compétence, potentiel · processus de recrutement · e-recrutement · CDI, saisonnier, intérim, apprentissage · accueil, intégration, fidélisation.",
    },
  ],
};
