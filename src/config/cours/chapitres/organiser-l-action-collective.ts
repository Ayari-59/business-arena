import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DE_L_ACTION_COLLECTIVE, FONDATEUR_SEUL, ressourcesDeLaCreation, seulOuOrganise } from "../monde/action-collective-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ORGANISER L'ACTION COLLECTIVE (Bac STMG, management de première, question 1.1, palier 1).
 *
 * De l'action individuelle à l'organisation, sur l'histoire de NOVA : le fondateur montait seul ses
 * enceintes ; NOVA réunit des associés, une banque, une ligne et une équipe autour d'un objectif
 * commun. L'élève compare ce que monte une personne seule et un opérateur de la ligne, cherche au
 * curseur combien de personnes seules il faudrait pour faire ce que fait l'équipe organisée, sépare
 * les intérêts individuels de l'intérêt collectif, voit ce qu'apporte le cadre juridique (la SAS), et
 * range les ressources de NOVA dans leurs cinq familles.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : monde/action-collective-de-nova.ts, qui
 * pose le fondateur seul (hypothèses du cours) et lit tout le reste dans les fiches de NOVA.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dixieme = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const pct = (t: number) => `${dixieme(t)} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const CATEGORIES_DES_INTERETS = [
  { code: "individuel", libelle: "Un intérêt individuel" },
  { code: "collectif", libelle: "L'intérêt collectif de l'organisation" },
] as const;

export const FAMILLES_DE_RESSOURCES = [
  { code: "humaines", libelle: "Ressources humaines" },
  { code: "financieres", libelle: "Ressources financières" },
  { code: "materielles", libelle: "Ressources matérielles" },
  { code: "immaterielles", libelle: "Ressources immatérielles" },
  { code: "technologiques", libelle: "Ressources technologiques" },
] as const;

export const ORGANISER_L_ACTION_COLLECTIVE: Chapitre = {
  code: "organiser-l-action-collective",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · À la rencontre du management des organisations"],
  titre: "Organiser l'action collective",
  accroche:
    "Seul, le fondateur montait quelques centaines d'enceintes par trimestre. Organisés autour d'un objectif commun, avec un cadre juridique et des ressources réunies, ils en montent des milliers. Pourquoi l'action collective s'organise.",
  objectifs: [
    "Distinguer l'action individuelle et l'action collective organisée",
    "Mesurer ce que l'organisation apporte à l'efficacité",
    "Séparer les intérêts individuels et l'intérêt collectif",
    "Dire ce qu'apporte le cadre juridique d'une organisation",
    "Ranger les ressources d'une organisation dans leurs cinq familles",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ACTION_COLLECTIVE,
    pourquoi: "ce chapitre suit l'histoire de NOVA, de son fondateur seul à l'entreprise organisée dont le cours tient les comptes et l'équipe.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Avant NOVA, un homme seul",
      notions: ["productivity"],
      texte: (c) => {
        const s = seulOuOrganise();
        return [
          `Avant ${c.entreprise}, son fondateur montait des enceintes seul, dans un atelier de quartier. Il achetait les composants, montait, vendait, tenait ses comptes. Sur ses heures du mois, il n'en passait que ${qte(FONDATEUR_SEUL.heuresDeMontageParMois)} au montage, et sans poste de série une enceinte lui prenait ${dixieme(FONDATEUR_SEUL.heuresParEnceinte)} heure. C'est une action individuelle.`,
          `Aujourd'hui, ${c.entreprise} réunit des associés, une banque, une ligne de ${qte(ressourcesDeLaCreation().postes)} postes et ${qte(s.operateurs)} opérateurs, qui montent chacun une enceinte en ${dixieme(s.heuresParEnceinte)} heure. Ils partagent un objectif commun (fabriquer et vendre des enceintes, durablement) et s'organisent pour l'atteindre : chacun a son rôle, des règles, un dirigeant. C'est une action collective organisée, une organisation.`,
        ];
      },
      repere: () => "Une organisation : un groupe de personnes, un objectif commun, des rôles répartis et des règles, pour durer.",
    },
    {
      id: "groupe-ou-organisation",
      objectifs: [0],
      type: "choix",
      titre: "Un groupe ou une organisation ?",
      question: () => "Le samedi, quatre amis montent ensemble des enceintes pour leur plaisir, chacun à son rythme, sans rien se répartir. Est-ce une organisation ?",
      options: () => [
        {
          texte: "Non : il leur manque un objectif commun et des rôles répartis",
          juste: true,
          retour: "Juste. Ils agissent côte à côte, et chacun fait tout, pour lui. Une organisation suppose un objectif commun, une répartition des tâches et des règles, dans la durée.",
        },
        {
          texte: "Oui : dès que plusieurs personnes travaillent ensemble, c'est une organisation",
          juste: false,
          retour: "Non : être plusieurs ne suffit pas. Sans objectif commun ni rôles répartis, c'est une somme d'actions individuelles.",
        },
        {
          texte: "Oui, s'ils vendent ce qu'ils montent, même sans se répartir le travail",
          juste: false,
          retour: "Non : vendre ne fait pas une organisation. Ce qui la fait, c'est l'objectif commun, la répartition des rôles et des règles.",
        },
      ],
    },
    {
      id: "seul-ou-organise",
      objectifs: [1],
      type: "montants",
      titre: "Ce que monte une personne, seule ou organisée",
      notions: ["productivity"],
      tableau: (c) => {
        const s = seulOuOrganise();
        return {
          titre: `Le temps de montage, seul ou sur la ligne ${dE(c.entreprise)}`,
          colonnes: ["Seul", "Sur la ligne"],
          lignes: [
            { libelle: "Heures de montage par mois", valeurs: [qte(FONDATEUR_SEUL.heuresDeMontageParMois), qte(s.heuresDeMontage)] },
            { libelle: "Heure par enceinte", valeurs: [dixieme(FONDATEUR_SEUL.heuresParEnceinte), s.heuresParEnceinte.toLocaleString("fr-FR")] },
          ],
        };
      },
      question: () =>
        "Calculez les enceintes qu'une personne seule monte en un mois, celles qu'un opérateur de la ligne monte en un mois, puis combien de fois plus monte l'opérateur (au dixième).",
      champs: () => {
        const s = seulOuOrganise();
        return [
          { libelle: "Enceintes par mois, seul", attendu: s.seulParMois, calcul: `${qte(FONDATEUR_SEUL.heuresDeMontageParMois)} ÷ ${dixieme(FONDATEUR_SEUL.heuresParEnceinte)} = ${dixieme(s.seulParMois)}`, tolerance: 0.5 },
          { libelle: "Enceintes par mois, sur la ligne", attendu: s.operateurParMois, calcul: `${qte(s.heuresDeMontage)} ÷ ${s.heuresParEnceinte.toLocaleString("fr-FR")} = ${qte(s.operateurParMois)}`, tolerance: 0 },
          { libelle: "Combien de fois plus", attendu: s.rapport, calcul: `${qte(s.operateurParMois)} ÷ ${dixieme(s.seulParMois)} = ${dixieme(s.rapport)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const s = seulOuOrganise();
        return [
          `Sur la ligne, un opérateur monte ${dixieme(s.rapport)} fois plus qu'une personne seule : il ne fait que monter, sur un poste conçu pour cela, pendant que d'autres achètent, vendent et tiennent les comptes de ${c.entreprise}. La répartition des tâches rend l'action collective plus efficace que la somme des actions individuelles.`,
        ];
      },
    },
    {
      id: "combien-de-personnes-seules",
      objectifs: [1],
      type: "curseur",
      titre: "Combien de personnes seules pour faire autant ?",
      notions: ["productivity", "capacity"],
      question: (c) => {
        const s = seulOuOrganise();
        return `Organisée, l'équipe ${dE(c.entreprise)} monte ${qte(s.equipe)} enceintes par trimestre. Une personne seule en monte ${qte(s.seulParTrimestre)}. Faites varier le nombre de personnes qui travailleraient chacune seule : une droite donne ce qu'elles monteraient ensemble, l'autre ce que monte l'équipe. Placez le curseur sur le plus petit nombre de personnes seules qui monterait autant.`;
      },
      grandeur: () => ({ libelle: "Personnes travaillant chacune seule", unite: "personnes" }),
      cible: () => ({ attendu: seulOuOrganise().artisansPourLEquipe, min: 1, max: 20 }),
      zones: ["Elles montent autant que l'équipe", "Elles montent moins que l'équipe"],
      rates: () => ({ dessous: "Avec si peu de personnes seules, on ne monte pas autant que l'équipe organisée.", dessus: "Ce nombre suffit, mais un plus petit suffirait aussi : cherchez le plus petit." }),
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const s = seulOuOrganise();
        return [
          { libelle: "Enceintes montées par les personnes seules, par trimestre", montant: n * s.seulParTrimestre, fort: true },
          { libelle: "Enceintes montées par l'équipe organisée, par trimestre", montant: s.equipe },
        ];
      },
      droites: () => {
        const s = seulOuOrganise();
        return { produit: (n) => n * s.seulParTrimestre, cout: () => s.equipe, libelles: ["Personnes seules", "Équipe organisée"] };
      },
      explication: (c) => {
        const s = seulOuOrganise();
        return [
          `Il faudrait ${qte(s.artisansPourLEquipe)} personnes travaillant chacune seule pour monter les ${qte(s.equipe)} enceintes que ${qte(s.operateurs)} opérateurs organisés montent chaque trimestre chez ${c.entreprise}, avec un dirigeant qui prend le reste.`,
          "L'action collective se justifie par une plus grande efficacité : le même travail demande moins de personnes, parce que chacune fait ce qu'elle fait le mieux.",
        ];
      },
    },
    {
      id: "interets",
      objectifs: [2],
      type: "tri",
      titre: "Intérêts individuels, intérêt collectif",
      question: (c) => `Rangez chaque attente : est-ce l'intérêt d'une personne ou d'un groupe de personnes, ou l'intérêt collectif ${dE(c.entreprise)} ?`,
      categories: CATEGORIES_DES_INTERETS,
      elements: () => [
        { libelle: "Un opérateur veut un salaire plus haut", montant: 0, categorie: "individuel", pourquoi: "C'est l'intérêt de l'opérateur : il est légitime, mais il ne vise que lui." },
        { libelle: "Les associés veulent un dividende plus gros", montant: 0, categorie: "individuel", pourquoi: "C'est l'intérêt des associés, qui ont apporté le capital : il ne se confond pas avec celui de l'entreprise." },
        { libelle: "Garder de quoi entretenir la ligne pour l'année suivante", montant: 0, categorie: "collectif", pourquoi: "Une ligne entretenue fait vivre l'entreprise, et avec elle les emplois et les dividendes à venir." },
        { libelle: "Servir tous les clients qui demandent une enceinte", montant: 0, categorie: "collectif", pourquoi: "C'est l'objectif commun : vendre, pour que l'entreprise dure." },
        { libelle: "Le président veut partir plus tôt le vendredi", montant: 0, categorie: "individuel", pourquoi: "C'est son intérêt personnel, pas celui de l'organisation qu'il dirige." },
      ],
      relance: "Qui en profite d'abord : une personne (ou un groupe de personnes), ou l'entreprise tout entière, pour durer ?",
      explication: (c) => [
        `Chez ${c.entreprise}, chacun vient avec ses intérêts : un salaire, un dividende, du temps libre. L'organisation les réunit autour d'un intérêt collectif, durer et atteindre son objectif. Les deux ne s'opposent pas toujours, mais quand ils s'opposent, c'est aux règles et au dirigeant de trancher.`,
      ],
    },
    {
      id: "conflit-d-interets",
      objectifs: [2],
      type: "choix",
      titre: "Quand les intérêts s'opposent",
      question: () => "Les opérateurs demandent une hausse de salaire ; les associés préfèrent garder l'argent pour investir. Comment l'organisation tranche-t-elle ?",
      options: () => [
        {
          texte: "Le président décide, selon les règles de l'entreprise, après avoir entendu chacun",
          juste: true,
          retour: "Oui : l'organisation a un dirigeant et des règles pour arbitrer. Il écoute les opérateurs et les associés, et cherche ce qui sert l'objectif commun, par exemple une hausse plus faible et une prime si l'objectif est tenu.",
        },
        {
          texte: "Chacun fait ce qu'il veut : les opérateurs ralentissent, les associés retirent leur argent",
          juste: false,
          retour: "Non : c'est le retour à l'action individuelle, et l'entreprise n'atteint plus son objectif. L'organisation existe justement pour éviter cela.",
        },
        {
          texte: "Le plus nombreux l'emporte toujours : les opérateurs, qui sont quatre",
          juste: false,
          retour: "Non : l'entreprise n'est pas une assemblée où le nombre décide de tout. Les règles disent qui décide de quoi, et le président arbitre.",
        },
      ],
    },
    {
      id: "cadre-juridique",
      objectifs: [3],
      type: "choix",
      titre: "Le cadre juridique",
      question: (c) => {
        const r = ressourcesDeLaCreation();
        return `En janvier de l'année N, les associés créent ${c.entreprise}, une SAS : ils apportent ${eur(r.apport)} au capital, et c'est la société qui emprunte ${eur(r.emprunt)} et achète la ligne. Que lui apporte ce cadre juridique ?`;
      },
      options: () => [
        {
          texte: "Une existence propre : la société signe, emprunte et possède en son nom",
          juste: true,
          retour: "Oui : la SAS est une personne morale. C'est elle qui signe les contrats, doit l'emprunt et possède la ligne ; les associés ne risquent en principe que leur apport. Le cadre juridique fixe aussi qui dirige (le président) et qui approuve les comptes (l'assemblée des associés).",
        },
        {
          texte: "Rien de plus : le fondateur aurait pu signer l'emprunt seul, cela revient au même",
          juste: false,
          retour: "Non : signé par le fondateur seul, l'emprunt aurait engagé ses biens personnels, et l'entreprise n'aurait pas d'existence propre pour durer après lui.",
        },
        {
          texte: "Il garantit des bénéfices aux associés, qui ont apporté le capital",
          juste: false,
          retour: "Non : aucun cadre juridique ne garantit un bénéfice. Il donne une existence propre à l'organisation et fixe ses règles.",
        },
      ],
    },
    {
      id: "part-des-associes",
      objectifs: [4],
      type: "montants",
      titre: "L'argent de départ",
      question: (c) => {
        const r = ressourcesDeLaCreation();
        return `Pour démarrer, ${c.entreprise} réunit l'apport des associés (${eur(r.apport)}) et l'emprunt à la banque (${eur(r.emprunt)}). Calculez l'argent réuni, puis la part apportée par les associés, en pourcentage au dixième.`;
      },
      champs: () => {
        const r = ressourcesDeLaCreation();
        return [
          { libelle: "Argent réuni au départ", attendu: r.apport + r.emprunt, calcul: `${eur(r.apport)} + ${eur(r.emprunt)} = ${eur(r.apport + r.emprunt)}`, tolerance: 0 },
          { libelle: "Part des associés (%)", attendu: r.partDesAssocies, calcul: `${eur(r.apport)} ÷ ${eur(r.apport + r.emprunt)} × 100 = ${pct(r.partDesAssocies)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = ressourcesDeLaCreation();
        return [
          `Les associés apportent ${pct(r.partDesAssocies)} de l'argent de départ, la banque le reste. Ces ressources financières paient la ligne de montage (${eur(r.ligne)} hors taxes), une ressource matérielle : une organisation réunit des ressources qu'aucun de ses membres n'aurait seul.`,
          `${c.entreprise} réunit ainsi des ressources de cinq familles : il reste à les ranger.`,
        ];
      },
    },
    {
      id: "familles-de-ressources",
      objectifs: [4],
      type: "tri",
      titre: "Les cinq familles de ressources",
      question: (c) => `Rangez chaque ressource ${dE(c.entreprise)} dans sa famille.`,
      categories: FAMILLES_DE_RESSOURCES,
      elements: (c) => {
        const r = ressourcesDeLaCreation();
        return [
          { libelle: `Les ${qte(r.operateurs)} opérateurs de montage et leur savoir-faire`, montant: 0, categorie: "humaines", pourquoi: "Des personnes et leurs compétences : des ressources humaines." },
          { libelle: "L'apport des associés", montant: r.apport, categorie: "financieres", pourquoi: "De l'argent, apporté au capital : une ressource financière." },
          { libelle: "L'emprunt à la banque", montant: r.emprunt, categorie: "financieres", pourquoi: "De l'argent, prêté : une ressource financière." },
          { libelle: `La ligne de ${qte(r.postes)} postes de montage`, montant: r.ligne, categorie: "materielles", pourquoi: "Un bien physique qui sert à produire : une ressource matérielle." },
          { libelle: `La marque ${c.entreprise} et la confiance des clients`, montant: 0, categorie: "immaterielles", pourquoi: "On ne la touche pas, mais elle fait vendre : une ressource immatérielle." },
          { libelle: "Le procédé de montage et le logiciel qui pilote la ligne", montant: 0, categorie: "technologiques", pourquoi: "Une technique et un outil numérique de production : des ressources technologiques." },
        ];
      },
      relance: "Est-ce une personne, de l'argent, un bien qu'on touche, quelque chose qu'on ne touche pas, ou une technique ?",
      explication: (c) => [
        `${c.entreprise} mobilise les cinq familles de ressources : humaines, financières, matérielles, immatérielles et technologiques. Organiser, c'est aussi les coordonner : une ligne sans opérateurs, ou une marque sans enceintes à vendre, ne produit rien.`,
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const s = seulOuOrganise();
        return [
          `Seul, le fondateur montait ${qte(s.seulParTrimestre)} enceintes par trimestre. Organisée, l'équipe ${dE(c.entreprise)} en monte ${qte(s.equipe)} : il faudrait ${qte(s.artisansPourLEquipe)} personnes seules pour faire autant. L'organisation est plus efficace parce qu'elle répartit les tâches et réunit des ressources qu'aucun membre n'aurait seul.`,
          "Elle a un objectif commun, un cadre juridique qui lui donne une existence propre, des règles et un dirigeant qui arbitre entre les intérêts de chacun. Dans l'arène, chaque partie se joue en équipe : la même question s'y pose à chaque tour.",
        ];
      },
      repere: () => "Action collective organisée : un objectif commun, des rôles, des règles, un cadre juridique. Cinq familles de ressources : humaines, financières, matérielles, immatérielles, technologiques.",
    },
  ],
};
