import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { COUT_HORAIRE_DE_L_ESCALE } from "../monde/equipe-de-l-escale";
import { DIMANCHES, EFFECTIF, ENTREPRISES_DU_DIALOGUE_SOCIAL, SEUILS, coutDeLaMajoration, majorationLaPlusHaute } from "../monde/dialogue-social-de-l-escale";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE DIALOGUE SOCIAL, CSE, NÉGOCIATION ET BDESE (Bac STMG, enseignement spécifique de ressources
 * humaines et communication de terminale, thème 3, question 3.2 : « À quelles conditions le dialogue
 * social renforce-t-il la cohésion ? »).
 *
 * Les acteurs du dialogue social (l'employeur, les élus du personnel, les syndicats, l'État), le comité
 * social et économique (son seuil, sa composition, ses missions), les formes (information, consultation,
 * concertation, négociation), les niveaux de la négociation collective (interprofessionnel, branche,
 * entreprise), la base de données économiques, sociales et environnementales (le texte de 2019 dit BDES :
 * la loi Climat et résilience du 22 août 2021 lui a ajouté l'environnement) et le bilan social, une
 * négociation chiffrée au curseur, et les conditions d'un dialogue qui renforce la cohésion.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez L'ESCALE : monde/dialogue-social-de-l-escale.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR")} %`;

export const LE_DIALOGUE_SOCIAL: Chapitre = {
  code: "le-dialogue-social",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 3 · La recherche de cohésion, un levier d'amélioration des relations de travail et du climat social"],
  titre: "Le dialogue social : CSE, négociation et BDESE",
  accroche:
    "Un hôtel élit son comité social et économique, et sa représentante demande une majoration des heures du dimanche. Qui dialogue, sous quelle forme, avec quelles informations, et comment conclure un accord.",
  objectifs: [
    "Identifier les acteurs du dialogue social",
    "Connaître le rôle et le seuil du comité social et économique",
    "Distinguer les formes et les niveaux du dialogue social",
    "Situer la BDESE et le bilan social",
    "Négocier dans une enveloppe, et réunir les conditions d'un dialogue utile",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_DIALOGUE_SOCIAL,
    pourquoi: "ce chapitre suit le dialogue entre la directrice de L'ESCALE et la représentante de son personnel.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Dialoguer pour décider",
      texte: (c) => [
        `${c.entreprise} compte ${qte(EFFECTIF)} salariés. Cette année, ils ont élu leur représentante au comité social et économique, Nadia, réceptionniste. Sa première demande : une majoration des heures travaillées le dimanche.`,
        "Le dialogue social regroupe les échanges d'informations, les consultations et les négociations entre les représentants des employeurs et ceux des salariés, sur les questions qui les concernent ensemble : les salaires, le temps de travail, les conditions de travail, l'emploi.",
      ],
      repere: () => "Dialogue social : informer, consulter, négocier, entre employeur et représentants des salariés.",
    },
    {
      id: "les-acteurs",
      objectifs: [0],
      type: "tri",
      titre: "Les acteurs du dialogue social",
      question: () => "Rangez chaque acteur.",
      categories: [
        { code: "employeur", libelle: "L'employeur" },
        { code: "elus", libelle: "Les élus du personnel" },
        { code: "syndicats", libelle: "Les syndicats" },
        { code: "etat", libelle: "L'État" },
      ],
      elements: () => [
        { libelle: "La directrice de l'hôtel", montant: 0, categorie: "employeur", pourquoi: "Elle représente l'employeur." },
        { libelle: "Nadia, élue au comité social et économique", montant: 0, categorie: "elus", pourquoi: "Élue par les salariés : une représentante du personnel." },
        { libelle: "Une fédération syndicale de l'hôtellerie, qui négocie la convention de la branche", montant: 0, categorie: "syndicats", pourquoi: "Une organisation syndicale : elle négocie au niveau de la branche." },
        { libelle: "L'inspection du travail, qui contrôle le respect du Code du travail", montant: 0, categorie: "etat", pourquoi: "L'État fixe la loi et en contrôle l'application." },
      ],
      relance: "Représente-t-il la direction, les salariés élus, une organisation syndicale, ou la puissance publique ?",
      explication: () => ["Dans une petite entreprise, le dialogue passe surtout par les élus du CSE ; le délégué syndical, que désigne un syndicat pour négocier les accords, est la règle à partir de 50 salariés."],
    },
    {
      id: "le-cse",
      type: "lecture",
      titre: "Le comité social et économique",
      texte: () => [
        `Le comité social et économique (CSE) est obligatoire dès ${qte(SEUILS.cse)} salariés, quand l'effectif est atteint ${qte(SEUILS.moisDeSuite)} mois de suite. Ses membres sont élus par les salariés, en principe pour 4 ans ; de 11 à 24 salariés, il compte 1 titulaire et 1 suppléant.`,
        `Jusqu'à 49 salariés, il présente à l'employeur les réclamations individuelles et collectives (salaires, application du Code du travail), contribue à la santé, à la sécurité et aux conditions de travail, et peut saisir l'inspection du travail. À partir de ${qte(SEUILS.bdese)} salariés, il est consulté sur les orientations stratégiques, la situation économique et la politique sociale de l'entreprise.`,
      ],
      repere: () => "CSE : dès 11 salariés · élus pour 4 ans · réclamations, santé et sécurité · consultations économiques dès 50 salariés.",
    },
    {
      id: "le-seuil-du-cse",
      objectifs: [1],
      type: "choix",
      titre: "Le seuil du CSE",
      question: (c) => `${c.entreprise} compte ${qte(EFFECTIF)} salariés depuis 2 ans. Doit-elle organiser l'élection d'un CSE ?`,
      options: () => [
        {
          texte: "Oui, dès 11 salariés pendant 12 mois de suite",
          juste: true,
          retour: `Oui : avec ${qte(EFFECTIF)} salariés depuis plus de 12 mois, l'hôtel doit organiser l'élection. Ne pas le faire serait un délit d'entrave.`,
        },
        {
          texte: "Non : le CSE n'existe qu'à partir de 50 salariés, dans les grandes entreprises",
          juste: false,
          retour: "Non : 50 salariés est le seuil de ses attributions économiques, pas celui du CSE.",
        },
        {
          texte: "Seulement si les salariés le réclament par écrit",
          juste: false,
          retour: "Non : c'est une obligation de l'employeur. Les salariés n'ont pas à le demander.",
        },
      ],
    },
    {
      id: "les-formes",
      objectifs: [2],
      type: "tri",
      titre: "Les formes du dialogue",
      question: () => "Rangez chaque échange entre la directrice et Nadia.",
      categories: [
        { code: "information", libelle: "Information" },
        { code: "consultation", libelle: "Consultation" },
        { code: "negociation", libelle: "Négociation" },
      ],
      elements: () => [
        { libelle: "La directrice annonce la date des travaux de rénovation des chambres", montant: 0, categorie: "information", pourquoi: "Elle transmet une information : le CSE en prend connaissance." },
        { libelle: "Elle demande son avis à Nadia sur le nouveau planning avant de le décider", montant: 0, categorie: "consultation", pourquoi: "Un avis recueilli avant la décision, que l'employeur prend ensuite : la consultation." },
        { libelle: "Elles discutent d'une majoration du dimanche pour signer un accord", montant: 0, categorie: "negociation", pourquoi: "Chercher un accord qui engage les deux parties : la négociation." },
      ],
      relance: "La directrice transmet-elle, demande-t-elle un avis avant de décider, ou cherche-t-elle un accord à signer ?",
      explication: () => ["Entre la consultation et la négociation, la concertation associe les représentants à la construction d'un projet, sans obligation d'aboutir à un accord."],
    },
    {
      id: "les-niveaux",
      objectifs: [2],
      type: "tri",
      titre: "Les niveaux de la négociation collective",
      question: () => "À quel niveau chaque texte a-t-il été négocié ?",
      categories: [
        { code: "interprofessionnel", libelle: "Interprofessionnel" },
        { code: "branche", libelle: "Branche" },
        { code: "entreprise", libelle: "Entreprise" },
      ],
      elements: () => [
        { libelle: "L'accord national de 2020 sur la qualité de vie et des conditions de travail", montant: 0, categorie: "interprofessionnel", pourquoi: "Signé pour tous les secteurs : un accord national interprofessionnel." },
        { libelle: "La convention collective des hôtels, cafés et restaurants", montant: 0, categorie: "branche", pourquoi: "Elle s'applique à toute la branche de l'hôtellerie et de la restauration." },
        { libelle: "Un accord sur la majoration du dimanche à L'ESCALE", montant: 0, categorie: "entreprise", pourquoi: "Négocié dans l'hôtel : un accord d'entreprise." },
      ],
      relance: "Le texte vaut-il pour tous les secteurs, pour tout un métier, ou pour un seul employeur ?",
      explication: () => ["Chaque niveau a ses sujets : l'accord d'entreprise peut adapter les règles de la branche sur beaucoup de points, mais pas sur les salaires minima, que la branche garantit."],
    },
    {
      id: "la-bdese",
      type: "lecture",
      titre: "Partager l'information : BDESE et bilan social",
      texte: () => [
        `Dialoguer suppose une information partagée. À partir de ${qte(SEUILS.bdese)} salariés, l'employeur tient une base de données économiques, sociales et environnementales (BDESE) : investissements, effectifs, rémunérations, égalité entre les femmes et les hommes, conséquences environnementales de l'activité. Le programme parle de BDES : la loi Climat et résilience de 2021 y a ajouté l'environnement.`,
        `À partir de ${qte(SEUILS.bilanSocial)} salariés, le bilan social récapitule chaque année les données sociales : emploi, rémunérations, santé et sécurité, formation, relations professionnelles. L'ESCALE n'y est pas tenue, mais rien ne l'empêche de partager ses chiffres avec Nadia.`,
      ],
      repere: () => "BDESE : dès 50 salariés, l'information des représentants. Bilan social : dès 300 salariés.",
    },
    {
      id: "bdes-ou-bdese",
      objectifs: [3],
      type: "choix",
      titre: "De la BDES à la BDESE",
      question: () => "Pourquoi la BDES est-elle devenue la BDESE ?",
      options: () => [
        {
          texte: "La loi de 2021 y a ajouté l'environnement",
          juste: true,
          retour: "Oui : la loi Climat et résilience du 22 août 2021 a élargi la base aux conséquences environnementales de l'activité. Le CSE en est informé lors de ses consultations.",
        },
        {
          texte: "Pour y ajouter les salaires de chaque salarié, nom par nom, à la demande des élus",
          juste: false,
          retour: "Non : la base présente des données d'ensemble ; elle ne publie pas la paie de chacun.",
        },
        {
          texte: "Pour la rendre obligatoire dès 11 salariés",
          juste: false,
          retour: "Non : elle reste obligatoire à partir de 50 salariés.",
        },
      ],
    },
    {
      id: "le-curseur-du-dimanche",
      objectifs: [4],
      type: "curseur",
      titre: "La majoration du dimanche",
      sens: "plus-grande",
      question: () => `L'équipe travaille ${qte(DIMANCHES.heures)} heures le dimanche dans l'année, à ${eur(COUT_HORAIRE_DE_L_ESCALE)} l'heure. La loi n'impose pas de majoration dans l'hôtellerie : elle se négocie. La directrice dispose d'une enveloppe de ${eur(DIMANCHES.enveloppe)} par an. Faites varier la majoration : une droite donne son coût sur l'année, l'autre l'enveloppe. Placez le curseur sur la plus haute majoration que l'enveloppe paie.`,
      cible: () => ({ attendu: majorationLaPlusHaute(), max: 40 }),
      grandeur: () => ({ libelle: "Majoration des heures du dimanche", unite: "%" }),
      rates: () => ({ dessous: "L'enveloppe le permet, mais un point de plus passerait-il encore ?", dessus: "Trop haut : la majoration dépasse l'enveloppe." }),
      zones: ["Dans l'enveloppe", "Hors de l'enveloppe"],
      montrer: "Montrer la majoration",
      lecture: (_c, n) => [
        { libelle: "Coût de la majoration sur l'année", montant: coutDeLaMajoration(n), fort: true },
        { libelle: "Enveloppe", montant: DIMANCHES.enveloppe },
      ],
      droites: () => ({ produit: () => DIMANCHES.enveloppe, cout: (n) => (DIMANCHES.heures * COUT_HORAIRE_DE_L_ESCALE * n) / 100, libelles: ["Enveloppe", "Coût de la majoration"] }),
      explication: () => {
        const m = majorationLaPlusHaute();
        return [`L'enveloppe paie au plus ${pct(m)} de majoration, soit ${eur(coutDeLaMajoration(m))} sur l'année. Connaître ce chiffre, et le dire, permet de négocier franchement : Nadia sait ce qui est possible, la directrice ce qu'elle peut tenir.`];
      },
    },
    {
      id: "les-conditions",
      objectifs: [4],
      type: "choix",
      titre: "Un dialogue qui renforce la cohésion",
      question: () => "À quelle condition le dialogue social renforce-t-il la cohésion de l'hôtel ?",
      options: () => [
        {
          texte: "Une information loyale, et des engagements tenus",
          juste: true,
          retour: "Oui : des représentants reconnus, une information partagée et sincère, une négociation de bonne foi, et des accords appliqués. Le dialogue construit alors la confiance ; sans cela, il n'est qu'une formalité.",
        },
        {
          texte: "Que la directrice décide seule, puis l'annonce au CSE, pour que les choses aillent plus vite",
          juste: false,
          retour: "Non : annoncer une décision déjà prise n'est pas dialoguer. Les salariés s'en aperçoivent vite.",
        },
        {
          texte: "Que l'élue obtienne tout ce qu'elle demande",
          juste: false,
          retour: "Non : un accord que l'hôtel ne peut pas payer ne sera pas tenu. Le compromis doit être possible pour les deux parties.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `Avec ${qte(EFFECTIF)} salariés, ${c.entreprise} a un CSE, mais ni délégué syndical, ni BDESE, ni bilan social. Le dialogue passe par l'information, la consultation et la négociation, à plusieurs niveaux. Sur le dimanche, l'enveloppe de ${eur(DIMANCHES.enveloppe)} paie au plus ${pct(majorationLaPlusHaute())} de majoration. Le dialogue social renforce la cohésion quand l'information est loyale et les engagements tenus.`,
        "Dans l'arène, les salaires se décident seul ; dans une vraie entreprise, ils se négocient aussi.",
      ],
      repere: () => "Acteurs · CSE · information, consultation, concertation, négociation · interprofessionnel, branche, entreprise · BDESE · bilan social · accord.",
    },
  ],
};
