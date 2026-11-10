import { arrondi2, eur, nombreAuCentieme } from "../../../pedagogy/cours/deux-decimales";
import { CAPTEURS, ENTREPRISES_DU_NUMERIQUE, POSTES_DE_LA_LIGNE, capteurs, jourDArret, postesQuiRapportentLePlus } from "../monde/numerique-de-la-ligne";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE NUMÉRIQUE DANS LA PRODUCTION (Bac STMG, management, sciences de gestion et numérique de
 * terminale, enseignement commun, thème 1, question 1.4 : « Les transformations numériques, une chance
 * pour la production ? »).
 *
 * La dématérialisation, l'automatisation des processus et le flux de travaux (workflow), le progiciel de
 * gestion intégré qui relie la production et la gestion, l'informatique en nuage, les objets connectés,
 * l'intelligence artificielle et les données ouvertes, puis le diagramme des flux, lu sur une commande de
 * NOVA. Le laboratoire chiffre la maintenance prédictive : quels postes de la ligne équiper de capteurs
 * connectés. Le point de vue n'est pas celui du processus formalisé de première (« Le processus et le
 * PGI ») : ici, ce que le numérique change à la production.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/numerique-de-la-ligne.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les enceintes d'un poste en un jour sont une quantité : le
 * quotient à deux décimales, puis l'unité inférieure, que le corrigé nomme ; la marge perdue au
 * centime.
 */

const qte = nombreAuCentieme;

export const LE_NUMERIQUE_DANS_LA_PRODUCTION: Chapitre = {
  code: "le-numerique-dans-la-production",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Le numérique dans la production : données, flux de travaux et objets connectés",
  accroche:
    "Des commandes qui ne passent plus par le papier, une ligne qui prévient avant de tomber en panne, des données publiques qui deviennent un service : ce que le numérique change à la production, chiffres à l'appui.",
  objectifs: [
    "Distinguer dématérialisation, automatisation et flux de travaux",
    "Reconnaître le rôle du progiciel de gestion intégré et des nouvelles technologies",
    "Lire un diagramme des flux",
    "Chiffrer l'apport d'objets connectés à la production",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_NUMERIQUE,
    pourquoi: "ce chapitre suit la ligne de montage de NOVA et ses commandes.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des données pour produire",
      texte: (c) => [
        `Chaque commande reçue par ${c.entreprise}, chaque enceinte montée, chaque kit livré laisse des données de gestion. Exploitées par le système d'information, elles deviennent de l'information : ce qu'il faut monter demain, ce qu'il faut commander, la machine qui faiblit.`,
        "Le numérique permet alors d'automatiser une partie de la production et de son pilotage. Un progiciel de gestion intégré (PGI) relie le système de production et le système de gestion : une seule base de données, partagée par l'atelier, le commercial et la comptabilité.",
      ],
      repere: () => "Donnée de gestion → information → décision ou action automatique. Le PGI partage les mêmes données entre tous les services.",
    },
    {
      id: "trois-mots",
      objectifs: [0],
      type: "tri",
      titre: "Dématérialiser, automatiser, faire circuler",
      question: () => "Rangez chaque changement chez NOVA.",
      categories: [
        { code: "dematerialisation", libelle: "Dématérialisation" },
        { code: "automatisation", libelle: "Automatisation d'un processus" },
        { code: "workflow", libelle: "Flux de travaux (workflow)" },
      ],
      elements: () => [
        { libelle: "Les bons de livraison sont signés sur une tablette au lieu du papier", montant: 0, categorie: "dematerialisation", pourquoi: "Le document existe toujours, mais sous forme numérique : la dématérialisation." },
        { libelle: "Les factures des fournisseurs arrivent en fichier, sans courrier", montant: 0, categorie: "dematerialisation", pourquoi: "Le support papier disparaît : la dématérialisation." },
        { libelle: "Le stock de kits passe sous le point de commande et la commande part seule chez le fournisseur", montant: 0, categorie: "automatisation", pourquoi: "Une tâche faite par la machine, sans personne : l'automatisation." },
        { libelle: "Une commande de plus de 200 enceintes va d'abord au président pour validation, puis à l'atelier", montant: 0, categorie: "workflow", pourquoi: "Le document passe d'une personne à l'autre selon des règles : le flux de travaux." },
      ],
      relance: "Le papier disparaît-il, une tâche se fait-elle sans personne, ou un document circule-t-il d'une personne à l'autre selon des règles ?",
      explication: () => ["Les trois vont souvent ensemble : un document dématérialisé peut circuler par un flux de travaux, et certaines étapes s'automatisent."],
    },
    {
      id: "le-pgi",
      objectifs: [1],
      type: "choix",
      titre: "Ce que change le PGI",
      question: () => "Avant le PGI, l'atelier, le commercial et la comptabilité tenaient chacun leur tableau. Qu'apporte une base de données partagée ?",
      options: () => [
        {
          texte: "Une donnée saisie une fois, vue à jour par tous les services",
          juste: true,
          retour: "Oui : la commande saisie par le commercial apparaît aussitôt à l'atelier et en comptabilité. Moins de ressaisies, moins d'erreurs, et un patrimoine d'information partagé.",
        },
        {
          texte: "Chaque service garde ses propres chiffres, mais dans des fichiers plus jolis",
          juste: false,
          retour: "Non : c'est justement ce que le PGI supprime. Tous les services lisent la même base.",
        },
        {
          texte: "Plus besoin de personne pour décider : le logiciel choisit les commandes",
          juste: false,
          retour: "Non : le PGI fournit l'information ; les décisions restent humaines, sauf les tâches qu'on choisit d'automatiser.",
        },
      ],
    },
    {
      id: "les-technologies",
      objectifs: [1],
      type: "tri",
      titre: "Nuage, objets connectés, intelligence artificielle, données ouvertes",
      question: () => "Rangez chaque usage selon la technologie qu'il met en œuvre.",
      categories: [
        { code: "nuage", libelle: "Informatique en nuage" },
        { code: "objets", libelle: "Objets connectés" },
        { code: "ia", libelle: "Intelligence artificielle" },
        { code: "ouvertes", libelle: "Données ouvertes" },
      ],
      elements: () => [
        { libelle: "Le PGI hébergé chez un prestataire, consulté par internet depuis l'atelier ou la maison", montant: 0, categorie: "nuage", pourquoi: "Le logiciel et les données sont sur des serveurs distants : l'informatique en nuage." },
        { libelle: "Les enceintes vendues se mettent à jour à distance, sans retour au magasin", montant: 0, categorie: "nuage", pourquoi: "Le produit se configure et se maintient à distance, par le nuage." },
        { libelle: "Un capteur sur le poste de soudure mesure ses vibrations toutes les secondes", montant: 0, categorie: "objets", pourquoi: "Un objet relié au réseau qui recueille des données : un objet connecté." },
        { libelle: "Un logiciel apprend des pannes passées et prévient avant la prochaine", montant: 0, categorie: "ia", pourquoi: "L'apprentissage automatique : l'algorithme s'améliore par les données." },
        { libelle: `Les horaires des équipements publiés en libre accès par la ${HAUT_VERDASSE.nom}`, montant: 0, categorie: "ouvertes", pourquoi: "Des données qu'une administration met à disposition de tous : des données ouvertes. NOVA peut s'en servir pour un service nouveau." },
      ],
      relance: "S'agit-il d'un service à distance, d'un objet qui mesure, d'un algorithme qui apprend, ou de données mises à disposition de tous ?",
      explication: () => ["Ces technologies se combinent : les capteurs recueillent, le nuage stocke, l'intelligence artificielle prévoit. Elles permettent une amélioration continue des processus, et de nouveaux services."],
    },
    {
      id: "le-diagramme-des-flux",
      objectifs: [2],
      type: "tri",
      titre: "Lire un diagramme des flux",
      question: () => "Une commande de CampusTech traverse NOVA. Le diagramme des flux montre qui envoie quoi à qui. Rangez chaque flux selon l'acteur qui le reçoit.",
      categories: [
        { code: "client", libelle: "CampusTech, le client" },
        { code: "atelier", libelle: "L'atelier de NOVA" },
        { code: "fournisseur", libelle: "Le fournisseur de composants" },
      ],
      elements: () => [
        { libelle: "1. La confirmation de commande, envoyée par le service commercial", montant: 0, categorie: "client", pourquoi: "Le commercial confirme au client ce qui sera livré, et quand." },
        { libelle: "2. L'ordre de montage, créé par le PGI", montant: 0, categorie: "atelier", pourquoi: "Le PGI transmet à l'atelier ce qu'il faut monter." },
        { libelle: "3. La commande de kits, partie quand le stock baisse", montant: 0, categorie: "fournisseur", pourquoi: "NOVA commande au fournisseur ce que le montage va consommer." },
        { libelle: "4. Le bon de livraison des kits, signé à réception", montant: 0, categorie: "atelier", pourquoi: "Les kits arrivent à l'atelier, avec leur bon." },
        { libelle: "5. La facture des enceintes livrées", montant: 0, categorie: "client", pourquoi: "La comptabilité facture le client." },
      ],
      relance: "Pour chaque flux, demandez-vous : qui en a besoin pour agir ?",
      explication: () => ["Le diagramme des flux représente la circulation des informations entre les acteurs, internes et externes, dans l'ordre. Il montre où un flux peut être dématérialisé ou automatisé."],
    },
    {
      id: "un-jour-d-arret",
      objectifs: [3],
      type: "montants",
      titre: "Ce que coûte un jour d'arrêt",
      question: () => {
        const j = jourDArret();
        return `La ligne monte ${qte(j.capacite)} enceintes par trimestre, sur ${qte(j.postes)} postes et ${qte(j.jours)} jours de montage. Calculez ce qu'un poste monte en un jour (à l'enceinte inférieure), puis la marge qu'un jour d'arrêt de ce poste fait perdre, à ${eur(j.marge)} par enceinte.`;
      },
      champs: () => {
        const j = jourDArret();
        return [
          { libelle: "Enceintes d'un poste en un jour", nature: "quantite", attendu: j.parJour, calcul: `${qte(j.capacite)} ÷ ${qte(j.postes)} ÷ ${qte(j.jours)} = ${qte(arrondi2(j.capacite / j.postes / j.jours))}, soit ${qte(j.parJour)} enceintes entières : la dernière, entamée, n'est pas montée` },
          { libelle: "Marge perdue par jour d'arrêt", attendu: j.margePerdue, calcul: `${qte(j.parJour)} × ${eur(j.marge)} = ${eur(j.margePerdue)}` },
        ];
      },
      explication: () => [`Chaque jour où un poste est en panne coûte ${eur(jourDArret().margePerdue)} de marge : la ligne ne monte qu'au rythme de son poste le plus lent.`],
    },
    {
      id: "le-laboratoire-des-capteurs",
      objectifs: [3],
      type: "simulation",
      titre: "Quels postes équiper de capteurs ?",
      question: () => {
        const arrets = POSTES_DE_LA_LIGNE.map((p) => `${p.nom} ${qte(p.joursDArret)}`).join(", ");
        return `Sans capteurs, les postes tombent en panne quelques jours par an (${arrets}). Équipé de capteurs connectés, un poste prévient avant la panne, et l'arrêt se planifie en ${qte(CAPTEURS.arretPlanifie)} journée. Un poste équipé coûte ${eur(CAPTEURS.coutParPosteEtParAn)} par an. Faites varier le nombre de postes équipés, des plus fragiles aux moins fragiles.`;
      },
      leviers: () => [{ code: "postes", libelle: "Postes équipés de capteurs", unite: "postes", min: 0, max: POSTES_DE_LA_LIGNE.length, pas: 1, depart: 0 }],
      lecture: (_c, p) => {
        const k = capteurs(p.postes!);
        return [
          { libelle: "Jours d'arrêt évités dans l'année", montant: k.evites, unite: "jours" },
          { libelle: "Marge sauvée", montant: k.marge },
          { libelle: "Coût des capteurs", montant: k.cout },
          { libelle: "Ce que les capteurs rapportent", montant: k.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = postesQuiRapportentLePlus();
        return {
          consigne: "Trouvez le nombre de postes équipés qui rapporte le plus dans l'année.",
          atteint: (p) => p.postes === juste,
          indice: (p) => {
            const k = capteurs(p.postes!);
            return `À ${qte(p.postes!)} postes équipés, les capteurs laissent ${eur(k.gain)}. Un poste de plus, ou de moins, ferait-il mieux ?`;
          },
          solution: { postes: juste },
        };
      },
      explication: (_c, p) => {
        const k = capteurs(p.postes!);
        const suivant = capteurs(p.postes! + 1);
        return [
          `Défi relevé : équiper les ${qte(p.postes!)} postes les plus fragiles rapporte ${eur(k.gain)}. Le suivant tombe trop rarement en panne : ses capteurs coûteraient plus que ce qu'ils sauvent, et le gain tomberait à ${eur(suivant.gain)}.`,
          "Le numérique n'est une chance que là où il rapporte plus qu'il ne coûte.",
        ];
      },
    },
    {
      id: "l-algorithme-prevoit",
      objectifs: [1],
      type: "choix",
      titre: "Ce que fait l'algorithme",
      question: () => "L'application des capteurs n'a pas été programmée panne par panne. Comment prévoit-elle la prochaine ?",
      options: () => [
        {
          texte: "Elle apprend des données des pannes passées",
          juste: true,
          retour: "Oui : c'est l'apprentissage automatique. Plus elle reçoit de données, mieux elle reconnaît les signes d'une panne qui vient. Elle peut aussi se tromper : un technicien vérifie l'alerte.",
        },
        {
          texte: "Elle devine au hasard, et tombe juste une fois sur deux",
          juste: false,
          retour: "Non : elle s'appuie sur des mesures, comparées à celles qui ont précédé les pannes passées.",
        },
        {
          texte: "Un technicien lui écrit chaque matin la panne qui va arriver",
          juste: false,
          retour: "Non : personne ne connaît la panne à l'avance. L'algorithme la déduit des données.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const n = postesQuiRapportentLePlus();
        return [
          `Chez ${c.entreprise}, le numérique dématérialise les documents, automatise des tâches, fait circuler les commandes par un flux de travaux et partage les données par le PGI. Les capteurs connectés et l'intelligence artificielle préviennent les pannes : sur ${qte(n)} postes, ils rapportent ${eur(capteurs(n).gain)} par an.`,
          "Dans l'arène, l'entretien de votre outil se décide à chaque tour : une ligne mieux surveillée produit plus longtemps.",
        ];
      },
      repere: () => "Dématérialiser · automatiser · faire circuler (workflow) · partager (PGI) · nuage, objets connectés, intelligence artificielle, données ouvertes · diagramme des flux.",
    },
  ],
};
