import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  CPF,
  ENTREPRISES_DES_COMPETENCES,
  FORMATION_AU_POSTE,
  OPERATEURS_A_FORMER,
  PROJET_DE_MEHDI,
  anneesPourLaCertification,
  compteApres,
  formationDuPoste,
  repartitionDuPlan,
} from "../monde/competences-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : DÉVELOPPER LES COMPÉTENCES, PLAN, CPF ET EMPLOYABILITÉ (Bac STMG, enseignement spécifique de
 * ressources humaines et communication de terminale, thème 1, question 1.3 : « La gestion des compétences
 * garantit-elle l'employabilité ? »).
 *
 * La formation continue et ses formes (le présentiel, l'e-learning, la formation en situation de travail),
 * le plan de développement des compétences et les obligations de l'employeur (adapter au poste, maintenir
 * la capacité à occuper un emploi ; une formation obligatoire est du temps de travail), le compte personnel
 * de formation (crédité en euros, mobilisé par le seul salarié), chiffré au curseur, le projet de
 * transition professionnelle, la mobilité et le parcours, l'employabilité. Le laboratoire bâtit une
 * action du plan : présentiel ou e-learning, dans le budget. « Former pour être plus efficace » chiffre ce
 * qu'un stage rapporte à la production.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/competences-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");

export const DEVELOPPER_LES_COMPETENCES: Chapitre = {
  code: "developper-les-competences",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences"],
  titre: "Développer les compétences : plan, CPF et employabilité",
  accroche:
    "Un nouveau poste à apprendre pour toute l'équipe, un opérateur qui veut devenir technicien : qui décide de la formation, qui la paie, et ce qu'elle change pour garder un emploi demain.",
  objectifs: [
    "Distinguer le plan de développement des compétences, le CPF et la transition professionnelle",
    "Situer les obligations de formation de l'employeur",
    "Chiffrer les droits du compte personnel de formation",
    "Choisir entre formation en présentiel et e-learning",
    "Relier mobilité, parcours et employabilité",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPETENCES,
    pourquoi: "ce chapitre suit la formation des opérateurs de NOVA et le projet de l'un d'eux.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des compétences qui vieillissent",
      texte: (c) => [
        `${c.entreprise} change son poste de soudure, et ses ${qte(OPERATEURS_A_FORMER)} opérateurs doivent l'apprendre. L'un d'eux, ${PROJET_DE_MEHDI.prenom}, voudrait aller plus loin : devenir technicien de maintenance.`,
        "Les techniques changent, les métiers aussi : une compétence qui n'est pas entretenue perd sa valeur. L'employabilité, c'est la capacité d'une personne à garder son emploi ou à en retrouver un. La formation continue l'entretient, tout au long de la vie professionnelle.",
      ],
      repere: () => "Employabilité : pouvoir garder un emploi, ou en retrouver un. La formation continue l'entretient.",
    },
    {
      id: "qui-decide",
      objectifs: [0],
      type: "tri",
      titre: "Qui décide de la formation",
      question: () => "Rangez chaque formation selon le dispositif qui la porte.",
      categories: [
        { code: "plan", libelle: "Plan de développement des compétences" },
        { code: "cpf", libelle: "Compte personnel de formation" },
        { code: "transition", libelle: "Projet de transition professionnelle" },
      ],
      elements: () => [
        { libelle: "La formation de toute l'équipe au nouveau poste de soudure", montant: 0, categorie: "plan", pourquoi: "L'employeur l'organise pour adapter les salariés à leur poste : le plan." },
        { libelle: "La formation au nouveau logiciel de suivi de la ligne", montant: 0, categorie: "plan", pourquoi: "Une décision de l'employeur, pour le travail de demain : le plan." },
        { libelle: "Un cours d'anglais que Mehdi choisit seul, le samedi", montant: 0, categorie: "cpf", pourquoi: "Le salarié décide et mobilise ses droits : le CPF." },
        { libelle: "Quitter la ligne plusieurs mois, en restant payé, pour se former au métier d'infirmier", montant: 0, categorie: "transition", pourquoi: "Changer de métier par une formation certifiante longue : le projet de transition professionnelle." },
      ],
      relance: "Qui en a l'initiative : l'employeur, pour le poste, ou le salarié, pour lui-même ? Et s'agit-il de changer de métier ?",
      explication: () => ["L'employeur construit le plan pour les besoins de l'organisation ; le salarié dispose de son CPF pour son propre projet. Les deux se rejoignent quand le projet du salarié sert aussi l'entreprise."],
    },
    {
      id: "le-plan",
      type: "lecture",
      titre: "Le plan de développement des compétences",
      texte: () => [
        "Le Code du travail oblige l'employeur à adapter les salariés à leur poste et à veiller au maintien de leur capacité à occuper un emploi. Le plan de développement des compétences rassemble les actions qu'il décide pour cela.",
        "Une formation peut se suivre en présentiel, en e-learning (à distance, à son rythme, souvent avec un tuteur), ou en situation de travail, au poste même. Une formation que la loi ou une convention rend obligatoire pour tenir le poste se suit pendant le temps de travail.",
      ],
      repere: () => "Plan : l'employeur décide · adapter au poste, maintenir l'employabilité · présentiel, e-learning, situation de travail.",
    },
    {
      id: "la-formation-obligatoire",
      objectifs: [1],
      type: "choix",
      titre: "Une formation obligatoire",
      question: () => "La formation au nouveau poste de soudure est obligatoire pour y travailler. Comment se suit-elle ?",
      options: () => [
        {
          texte: "Pendant le temps de travail, payée comme du travail",
          juste: true,
          retour: "Oui : une formation obligatoire pour tenir le poste est du temps de travail effectif, et la rémunération est maintenue. C'est à l'employeur de l'organiser.",
        },
        {
          texte: "Le samedi, sur le temps libre des opérateurs, puisqu'elle leur apporte une compétence",
          juste: false,
          retour: "Non : elle sert d'abord le poste que l'employeur leur confie. Elle se suit pendant le temps de travail.",
        },
        {
          texte: "Chaque opérateur la paie avec son CPF",
          juste: false,
          retour: "Non : c'est l'obligation de l'employeur, sur son plan. Le CPF appartient au salarié.",
        },
      ],
    },
    {
      id: "le-cpf",
      type: "lecture",
      titre: "Le compte personnel de formation",
      texte: () => [
        `Le compte personnel de formation (CPF) suit le salarié toute sa vie professionnelle, d'un employeur à l'autre. Il est crédité en euros : ${eur(CPF.parAn)} par an pour un salarié qui travaille au moins à mi-temps, dans la limite de ${eur(CPF.plafond)} (davantage pour un salarié peu qualifié).`,
        "Il ne se mobilise qu'avec l'accord de son titulaire, pour une action éligible : une formation certifiante, un bilan de compétences, une validation des acquis de l'expérience. Suivie hors du temps de travail, la formation n'a pas à être autorisée par l'employeur. L'employeur peut abonder le compte, c'est-à-dire y ajouter des droits, pour un projet qui l'intéresse aussi.",
      ],
      repere: () => "CPF : en euros, au salarié, d'un emploi à l'autre · mobilisé par lui seul · abondement possible de l'employeur.",
    },
    {
      id: "le-curseur-du-compte",
      objectifs: [2],
      type: "curseur",
      titre: "Quand le compte suffit-il ?",
      question: () => {
        const p = PROJET_DE_MEHDI;
        return `La certification de technicien de maintenance coûte ${eur(p.certification)}. Le compte de ${p.prenom} porte déjà ${eur(p.dejaAcquis)}, et reçoit ${eur(CPF.parAn)} par an. Faites varier les années de travail : une droite donne son compte, l'autre le prix de la certification. Placez le curseur sur la première année où le compte la paie.`;
      },
      cible: () => ({ attendu: anneesPourLaCertification(), max: 7 }),
      grandeur: () => ({ libelle: "Années de travail", unite: "ans" }),
      rates: () => ({ dessous: "Pas encore : il manque des droits.", dessus: "Le compte suffit, mais une année plus tôt suffisait-il déjà ?" }),
      zones: ["Certification payée", "Droits insuffisants"],
      montrer: "Montrer l'année",
      lecture: (_c, n) => [
        { libelle: "Droits sur le compte", montant: compteApres(n), fort: true },
        { libelle: "Prix de la certification", montant: PROJET_DE_MEHDI.certification },
      ],
      droites: () => ({ produit: (n) => PROJET_DE_MEHDI.dejaAcquis + CPF.parAn * n, cout: () => PROJET_DE_MEHDI.certification, libelles: ["Droits sur le compte", "Prix de la certification"] }),
      explication: () => {
        const n = anneesPourLaCertification();
        return [`Seul, ${PROJET_DE_MEHDI.prenom} attendrait ${qte(n)} ans, avec ${eur(compteApres(n))} sur son compte. Le CPF finance des projets, mais lentement : l'abondement de l'employeur, ou une part du plan, peut avancer le départ en formation.`];
      },
    },
    {
      id: "imposer-le-cpf",
      objectifs: [0],
      type: "choix",
      titre: "Le compte de qui ?",
      question: (c) => `Pour économiser son budget, ${c.entreprise} peut-elle demander aux opérateurs d'utiliser leur CPF pour la formation au poste de soudure ?`,
      options: () => [
        {
          texte: "Non, le compte ne se mobilise qu'avec l'accord du salarié",
          juste: true,
          retour: "Oui, c'est la règle : le CPF appartient au salarié. L'employeur peut lui proposer d'y recourir, jamais l'imposer, et la formation au poste reste son obligation.",
        },
        {
          texte: "Oui : les droits ont été acquis en travaillant chez elle, ils lui reviennent",
          juste: false,
          retour: "Non : les droits sont attachés à la personne, qui les garde en changeant d'emploi.",
        },
        {
          texte: "Oui, à condition de prévenir les opérateurs un mois à l'avance par une note de service",
          juste: false,
          retour: "Non : aucun délai ne remplace l'accord exprès du titulaire du compte.",
        },
      ],
    },
    {
      id: "le-laboratoire-de-la-formation",
      objectifs: [3],
      type: "simulation",
      titre: "Présentiel ou e-learning",
      question: () => {
        const f = FORMATION_AU_POSTE;
        return `Les ${qte(OPERATEURS_A_FORMER)} opérateurs doivent apprendre le nouveau poste. Une journée en présentiel chez le fabricant coûte ${eur(f.presentiel)} par opérateur, le parcours en e-learning avec un tuteur ${eur(f.eLearning)}. Le plan y consacre ${eur(f.budget)}, et les ${qte(f.referents)} futurs référents du poste doivent le manipuler avec le formateur. Répartissez les opérateurs.`;
      },
      leviers: () => [
        { code: "presentiel", libelle: "Opérateurs formés en présentiel", unite: "opérateurs", min: 0, max: OPERATEURS_A_FORMER, pas: 1, depart: 0 },
        { code: "eLearning", libelle: "Opérateurs formés en e-learning", unite: "opérateurs", min: 0, max: OPERATEURS_A_FORMER, pas: 1, depart: 0 },
      ],
      lecture: (_c, p) => {
        const k = formationDuPoste(p.presentiel!, p.eLearning!);
        return [
          { libelle: "Opérateurs formés", montant: k.formes, unite: "opérateurs" },
          { libelle: "Coût de la formation", montant: k.cout },
          { libelle: "Reste du budget", montant: k.reste, effet: true, fort: true },
        ];
      },
      defi: () => {
        const s = repartitionDuPlan();
        const f = FORMATION_AU_POSTE;
        return {
          consigne: `Formez toute l'équipe, les ${qte(f.referents)} référents en présentiel, sans dépasser le budget.`,
          atteint: (p) => formationDuPoste(p.presentiel!, p.eLearning!).tenu,
          indice: (p) => {
            const k = formationDuPoste(p.presentiel!, p.eLearning!);
            if (k.formes !== OPERATEURS_A_FORMER) return `${qte(k.formes)} opérateurs formés sur ${qte(OPERATEURS_A_FORMER)} : toute l'équipe doit l'être.`;
            if (k.presentiel < f.referents) return `Les ${qte(f.referents)} référents doivent passer par le présentiel.`;
            return `La formation coûte ${eur(k.cout)}, plus que le budget de ${eur(f.budget)}.`;
          },
          solution: s,
        };
      },
      explication: (_c, p) => {
        const k = formationDuPoste(p.presentiel!, p.eLearning!);
        return [
          `Défi relevé : ${qte(k.presentiel)} référents en présentiel, ${qte(k.eLearning)} opérateurs en e-learning, pour ${eur(k.cout)}. Le présentiel coûte plus, mais il apprend le geste ; l'e-learning forme vite et moins cher, et les référents accompagnent ensuite leurs collègues au poste.`,
        ];
      },
    },
    {
      id: "les-mobilites",
      objectifs: [4],
      type: "tri",
      titre: "Mobilité et parcours",
      question: () => "Rangez chaque mouvement d'un salarié de NOVA.",
      categories: [
        { code: "fonctionnelle", libelle: "Mobilité fonctionnelle" },
        { code: "verticale", libelle: "Promotion" },
        { code: "geographique", libelle: "Mobilité géographique" },
      ],
      elements: () => [
        { libelle: "Mehdi passe de la ligne à la maintenance", montant: 0, categorie: "fonctionnelle", pourquoi: "Il change de métier dans l'entreprise : une mobilité fonctionnelle." },
        { libelle: "Un opérateur devient chef d'équipe", montant: 0, categorie: "verticale", pourquoi: "Il monte dans la hiérarchie : une promotion." },
        { libelle: "Un opérateur suit NOVA dans son nouvel atelier, dans une autre ville", montant: 0, categorie: "geographique", pourquoi: "Il change de lieu de travail : une mobilité géographique." },
      ],
      relance: "Le salarié change-t-il de métier, de niveau dans la hiérarchie, ou de lieu ?",
      explication: () => ["Chaque mobilité construit un parcours professionnel. Elle fait circuler les compétences dans l'organisation et rend le salarié plus employable, ailleurs aussi."],
    },
    {
      id: "la-transition",
      type: "lecture",
      titre: "Changer de métier",
      texte: () => [
        "Le projet de transition professionnelle permet à un salarié de s'absenter, en restant rémunéré, pour suivre une formation certifiante qui le prépare à un autre métier. Il mobilise son CPF, sous conditions d'ancienneté, et son dossier est examiné par une commission régionale paritaire, Transitions Pro.",
        "C'est un droit du salarié pour son projet, même s'il quitte ensuite l'entreprise : son employabilité dépasse l'organisation où il travaille.",
      ],
      repere: () => "Transition professionnelle : un autre métier, une formation certifiante, l'absence rémunérée.",
    },
    {
      id: "l-employabilite",
      objectifs: [4],
      type: "choix",
      titre: "La gestion des compétences garantit-elle l'employabilité ?",
      question: (c) => `${c.entreprise} forme ses opérateurs, les fait changer de poste et soutient le projet de Mehdi. Leur emploi est-il garanti pour autant ?`,
      options: () => [
        {
          texte: "Non, elle le favorise sans le garantir",
          juste: true,
          retour: "Oui : des compétences entretenues rendent plus employable, ici ou ailleurs. Mais un marché qui baisse, un métier qui disparaît, ou un salarié qui ne s'en saisit pas peuvent l'emporter : l'employabilité se partage entre l'organisation et le salarié.",
        },
        {
          texte: "Oui : un salarié formé chaque année ne peut plus jamais perdre son emploi",
          juste: false,
          retour: "Non : la formation ne protège pas d'un licenciement économique ou d'une fermeture. Elle aide à retrouver un emploi.",
        },
        {
          texte: "Non, et c'est inutile : un salarié trop formé finit toujours par partir",
          juste: false,
          retour: "Non : un salarié qu'on fait progresser a aussi des raisons de rester. La formation fidélise autant qu'elle rend mobile.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const s = repartitionDuPlan();
        return [
          `${c.entreprise} adapte ses opérateurs au poste par son plan : ${qte(s.presentiel)} en présentiel, ${qte(s.eLearning)} en e-learning, pour ${eur(formationDuPoste(s.presentiel, s.eLearning).cout)}. ${PROJET_DE_MEHDI.prenom} dispose de son CPF, qui paierait sa certification dans ${qte(anneesPourLaCertification())} ans. La mobilité et la transition professionnelle construisent un parcours. La gestion des compétences favorise l'employabilité, sans la garantir.`,
          "Dans l'arène, le budget de formation se décide à chaque tour : il coûte tout de suite, et rapporte par une équipe qui produit mieux.",
        ];
      },
      repere: () => "Formation continue · plan de développement des compétences · CPF · e-learning · mobilité · parcours · transition professionnelle · employabilité.",
    },
  ],
};
