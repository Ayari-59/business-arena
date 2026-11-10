import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { AVANCES_ESSAYEES, ENTREPRISES_DE_L_ORGANISATION_DE_LA_PRODUCTION, avancePourNoel, avanceQuiServitNoel, productivite } from "../monde/organisation-de-la-production";
import { HAUT_VERDASSE } from "../monde/haut-verdasse";
import { LIGNE_DE_MONTAGE } from "../monde/nova-capacite";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : ORGANISER LA PRODUCTION, MODES, FLUX ET LOGISTIQUE (Bac STMG, management, sciences de
 * gestion et numérique de terminale, enseignement commun, thème 1, question 1.3 : « Quels choix
 * d'organisation de la production pour concilier flexibilité, qualité et maîtrise des coûts ? »).
 *
 * L'innovation de procédés, les modes de production (à l'unité, en série, en continu, en discontinu),
 * les particularités des services (le client qui participe, le flux de travaux, le mode projet), la
 * productivité et la flexibilité de la ligne de NOVA, la logistique et la chaîne logistique, les flux
 * physiques et d'information, les flux tirés (tendus) et poussés au laboratoire (monter d'avance pour
 * Noël), la qualité, son contrôle et l'amélioration continue, jusqu'au service public, et la gestion du
 * cycle de vie des produits. Le contrôle des coûts (coût complet, coût spécifique) a son chapitre :
 * « Coût complet ou coût spécifique ».
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/organisation-de-la-production.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const dec = (x: number) => x.toLocaleString("fr-FR");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;

export const ORGANISER_LA_PRODUCTION: Chapitre = {
  code: "organiser-la-production",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 1 · Les organisations et l'activité de production de biens et de services"],
  titre: "Organiser la production : modes, flux et logistique",
  accroche:
    "Monter en série ou à la demande, attendre la commande ou produire d'avance, contrôler ou améliorer sans cesse : les choix qui rendent une production flexible, de qualité et à coût maîtrisé.",
  objectifs: [
    "Identifier un mode de production et les particularités d'un service",
    "Mesurer la productivité et la flexibilité d'une production",
    "Distinguer flux physiques et d'information, flux tendus et poussés",
    "Distinguer le contrôle qualité et l'amélioration continue",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ORGANISATION_DE_LA_PRODUCTION,
    pourquoi: "ce chapitre suit la ligne de montage de NOVA, ses opérateurs et la demande de N + 1.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Organiser la production, une démarche réfléchie",
      texte: (c) => [
        `${c.entreprise} monte ses enceintes sur une ligne de ${qte(LIGNE_DE_MONTAGE.postes)} postes. Avant de choisir comment produire, une organisation s'interroge sur ses procédés : une méthode plus souple, un poste mieux pensé, une livraison plus rapide. C'est l'innovation de procédés.`,
        "Ses choix portent ensuite sur le mode de production, sur les flux de matières et d'informations, et sur la qualité. Ils décident de sa réactivité face à la demande, et de sa compétitivité.",
      ],
      repere: () => "Innovation de procédés : une méthode de production ou de distribution nouvelle ou nettement améliorée.",
    },
    {
      id: "les-modes",
      objectifs: [0],
      type: "tri",
      titre: "Les modes de production",
      question: () => "Rangez chaque production selon son mode.",
      categories: [
        { code: "unitaire", libelle: "À l'unité" },
        { code: "serie", libelle: "En série" },
        { code: "continu", libelle: "En continu" },
      ],
      elements: () => [
        { libelle: "La sonorisation sur mesure du gymnase intercommunal, étudiée pour sa salle", montant: 0, categorie: "unitaire", pourquoi: "Un produit unique, conçu pour un client : la production à l'unité." },
        { libelle: "Les enceintes NOVA One, montées par lots identiques sur la ligne", montant: 0, categorie: "serie", pourquoi: "Des produits identiques, en grand nombre : la production en série." },
        { libelle: "Le papier des cartons d'emballage, produit jour et nuit par une machine qui ne s'arrête pas", montant: 0, categorie: "continu", pourquoi: "Un flux qui ne s'interrompt pas : la production en continu." },
        { libelle: "L'eau potable que la communauté traite et distribue à toute heure", montant: 0, categorie: "continu", pourquoi: "Un service rendu sans interruption : la production en continu." },
      ],
      relance: "Le produit est-il unique, fabriqué en lots identiques, ou sort-il d'un flux qui ne s'arrête jamais ?",
      explication: () => ["Entre la série et le continu, la production en discontinu enchaîne des lots différents sur les mêmes machines. Le mode dépend du produit et de la demande : on ne monte pas un stade comme une enceinte."],
    },
    {
      id: "produire-un-service",
      objectifs: [0],
      type: "choix",
      titre: "Produire un service",
      question: () => `À la piscine de la ${HAUT_VERDASSE.nom}, l'usager réserve son créneau en ligne, la réservation part toute seule au maître-nageur, puis il vient nager. Qu'est-ce qui est propre à la production d'un service ?`,
      options: () => [
        {
          texte: "Le client participe à la production, et l'information circule seule",
          juste: true,
          retour: "Oui : l'usager réserve lui-même, et le flux de travaux automatisé (workflow) transmet la demande. Un service ne se stocke pas : il se produit quand le client est là.",
        },
        {
          texte: "Rien : un service se produit d'avance et se stocke, comme une enceinte",
          juste: false,
          retour: "Non : un créneau de piscine qui n'est pas utilisé est perdu. Un service se produit au moment où il est consommé.",
        },
        {
          texte: "Le client n'intervient jamais, tout se décide au guichet",
          juste: false,
          retour: "Non : ici, le client fait lui-même une partie du travail en réservant en ligne.",
        },
      ],
    },
    {
      id: "la-productivite",
      objectifs: [1],
      type: "montants",
      titre: "La productivité de la ligne",
      question: () => {
        const p = productivite(1);
        return `Une enceinte demande ${dec(p.heuresParEnceinte)} heure de montage ; un opérateur monte ${qte(p.heuresParMois)} heures par mois. La ligne peut monter ${qte(p.capacite)} enceintes par trimestre, et les clients en demandent ${qte(p.demande)} au 1er trimestre de N + 1. Calculez les enceintes montées par heure, par opérateur sur un trimestre, et le taux d'utilisation de la ligne au 1er trimestre (au dixième).`;
      },
      champs: () => {
        const p = productivite(1);
        return [
          { libelle: "Enceintes par heure de montage", attendu: p.parHeure, calcul: `1 ÷ ${dec(p.heuresParEnceinte)} = ${qte(p.parHeure)}` },
          { libelle: "Enceintes par opérateur sur un trimestre", attendu: p.parOperateur, calcul: `${qte(p.heuresParMois)} × 3 × ${qte(p.parHeure)} = ${qte(p.parOperateur)}`, tolerance: 0 },
          { libelle: "Taux d'utilisation de la ligne (%)", attendu: p.utilisationPct, calcul: `${qte(p.demande)} ÷ ${qte(p.capacite)} × 100 = ${pct(p.utilisationPct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const p = productivite(1);
        const q2 = productivite(2);
        return [`Au 1er trimestre, la ligne tourne à ${pct(p.utilisationPct)} : elle a du jeu. Au 2e, les clients demandent ${qte(q2.demande)} enceintes pour ${qte(q2.capacite)} : elle est pleine. La flexibilité, c'est pouvoir suivre ces variations.`];
      },
    },
    {
      id: "la-logistique",
      type: "lecture",
      titre: "La logistique et la chaîne logistique",
      texte: () => [
        "La logistique fait arriver au bon endroit, au bon moment, ce qu'il faut : les composants au pied de la ligne, les enceintes chez les clients. La gestion de la chaîne logistique (supply chain management) la pilote d'un bout à l'autre, du fournisseur au client.",
        "Deux flux la traversent : les flux physiques (les biens qui se déplacent) et les flux d'informations (les commandes, les bons de livraison, les factures, qui les déclenchent et les suivent). Optimiser ces flux crée de la valeur.",
      ],
      repere: () => "Flux physique : une marchandise qui se déplace. Flux d'information : ce qui la commande, l'annonce ou la suit.",
    },
    {
      id: "deux-flux",
      objectifs: [2],
      type: "tri",
      titre: "Flux physique ou flux d'information",
      question: () => "Rangez chaque mouvement de la chaîne logistique de NOVA.",
      categories: [
        { code: "physique", libelle: "Flux physique" },
        { code: "information", libelle: "Flux d'information" },
      ],
      elements: () => [
        { libelle: "Les kits de composants livrés par le fournisseur", montant: 0, categorie: "physique", pourquoi: "Des biens qui se déplacent." },
        { libelle: "Les palettes d'enceintes chargées pour CampusTech", montant: 0, categorie: "physique", pourquoi: "Des produits finis qui partent chez le client." },
        { libelle: "La commande de kits envoyée au fournisseur", montant: 0, categorie: "information", pourquoi: "Elle déclenche le flux physique, sans rien déplacer elle-même." },
        { libelle: "Le suivi de la livraison, consulté en ligne par le client", montant: 0, categorie: "information", pourquoi: "Une information qui accompagne la marchandise." },
      ],
      relance: "Est-ce une marchandise qui se déplace, ou une information qui la commande et la suit ?",
      explication: () => ["Le flux d'information précède et accompagne le flux physique. Mieux il circule, moins il faut de stock pour se protéger des surprises."],
    },
    {
      id: "tendus-ou-pousses",
      objectifs: [2],
      type: "choix",
      titre: "Flux tendus ou poussés",
      question: () => "NOVA ne monte que ce que les clients ont déjà commandé, sans stock d'enceintes finies. Comment s'appelle cette organisation des flux ?",
      options: () => [
        {
          texte: "Les flux tendus : la commande tire la production",
          juste: true,
          retour: "Oui : en flux tendus (ou tirés), on produit à la demande, avec peu de stock. Les flux poussés produisent d'avance sur une prévision, et stockent.",
        },
        {
          texte: "Les flux poussés : la prévision pousse la production",
          juste: false,
          retour: "Non : en flux poussés, on produit d'avance sur une prévision, et on stocke ce qui n'est pas encore vendu.",
        },
        {
          texte: "Ni l'un ni l'autre : sans stock, il n'y a pas de flux",
          juste: false,
          retour: "Non : les flux existent toujours ; c'est leur organisation qui change.",
        },
      ],
    },
    {
      id: "le-laboratoire-des-flux",
      objectifs: [2],
      type: "simulation",
      titre: "Pousser le flux pour Noël",
      question: () => {
        const a = avancePourNoel(0);
        return `À Noël, les clients demanderont ${qte(a.demandeDeNoel)} enceintes ; la ligne n'en monte que ${qte(a.capaciteDeNoel)}. En flux tendus, la différence est refusée. Au 3e trimestre, la ligne a ${qte(a.libreAuT3)} enceintes de place libre. Faites varier ce que NOVA monte d'avance au 3e trimestre : chaque enceinte gardée coûte ${eur(a.coutDuStock)} de stockage, chaque enceinte vendue de plus rapporte ${eur(a.marge)} de marge.`;
      },
      leviers: () => [{ code: "avance", libelle: "Enceintes montées d'avance au 3e trimestre", unite: "enceintes", ...AVANCES_ESSAYEES, depart: AVANCES_ESSAYEES.min }],
      lecture: (_c, p) => {
        const a = avancePourNoel(p.avance!);
        return [
          { libelle: "Enceintes en stock à la fin du 3e trimestre", montant: a.stock, unite: "enceintes" },
          { libelle: "Clients refusés à Noël", montant: a.refuseesANoel, unite: "enceintes" },
          { libelle: "Marge gagnée sur les ventes de plus", montant: a.margeGagnee },
          { libelle: "Coût du stockage", montant: a.stockage },
          { libelle: "Ce que l'avance rapporte", montant: a.gain, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = avanceQuiServitNoel();
        return {
          consigne: "Trouvez la plus petite avance, de 100 en 100, qui ne refuse plus aucun client à Noël.",
          atteint: (p) => p.avance === juste,
          indice: (p) => {
            const a = avancePourNoel(p.avance!);
            return a.refuseesANoel > 0 ? `À ${qte(p.avance!)} enceintes d'avance, ${qte(a.refuseesANoel)} clients sont encore refusés à Noël.` : `À ${qte(p.avance!)}, plus personne n'est refusé : une avance plus petite suffirait-elle ?`;
          },
          solution: { avance: juste },
        };
      },
      explication: (_c, p) => {
        const a = avancePourNoel(p.avance!);
        return [
          `Défi relevé : ${qte(p.avance!)} enceintes montées d'avance servent tout Noël. Elles coûtent ${eur(a.stockage)} de stockage et rapportent ${eur(a.margeGagnee)} de marge : ${eur(a.gain)} de mieux qu'en flux tendus. Au-delà, la ligne est pleine, et l'avance ne monte plus rien.`,
        ];
      },
    },
    {
      id: "choisir-ses-flux",
      objectifs: [2],
      type: "choix",
      titre: "Tendus toute l'année ?",
      question: () => "Que retenir de ce laboratoire pour l'organisation des flux de NOVA ?",
      options: () => [
        {
          texte: "Tendus le reste de l'année, poussés avant Noël",
          juste: true,
          retour: "Oui : les flux tendus évitent de payer du stock quand la ligne suffit ; avant un pic qu'elle ne peut pas suivre, produire d'avance coûte moins que perdre des clients.",
        },
        {
          texte: "Poussés toute l'année : un stock d'enceintes ne coûte jamais rien",
          juste: false,
          retour: "Non : chaque enceinte gardée coûte son stockage, et immobilise de l'argent. Sans pic à servir, le stock ne rapporte rien.",
        },
        {
          texte: "Tendus toute l'année : refuser quelques clients à Noël est sans conséquence",
          juste: false,
          retour: "Non : chaque client refusé, c'est une marge perdue, et un client qui ira chez un concurrent.",
        },
      ],
    },
    {
      id: "la-qualite",
      type: "lecture",
      titre: "La qualité, un enjeu concurrentiel",
      texte: () => [
        "La qualité ne se résume pas à des normes : c'est un enjeu de concurrence. Le contrôle qualité vérifie le produit et écarte les défauts ; l'amélioration continue cherche, pas à pas, à ne plus les produire, en apprenant de chaque erreur.",
        `La qualité vaut aussi pour les services, et pour les services publics : à la ${HAUT_VERDASSE.nom}, c'est une information claire, un accueil personnalisé, des démarches plus simples et des délais plus courts.`,
      ],
      repere: () => "Contrôle qualité : vérifier et écarter. Amélioration continue : progresser pas à pas pour ne plus produire le défaut.",
    },
    {
      id: "controler-ou-ameliorer",
      objectifs: [3],
      type: "tri",
      titre: "Contrôler ou améliorer",
      question: () => "Rangez chaque pratique de qualité.",
      categories: [
        { code: "controle", libelle: "Contrôle qualité" },
        { code: "amelioration", libelle: "Amélioration continue" },
      ],
      elements: () => [
        { libelle: "Écouter chaque enceinte au poste de fin de ligne et écarter celles qui grésillent", montant: 0, categorie: "controle", pourquoi: "On vérifie le produit fini et on écarte le défaut." },
        { libelle: "Prélever 1 enceinte sur 50 pour un essai complet au laboratoire", montant: 0, categorie: "controle", pourquoi: "Un contrôle par échantillon : il mesure sans corriger." },
        { libelle: "Réunir l'équipe chaque semaine pour chercher la cause du défaut le plus fréquent", montant: 0, categorie: "amelioration", pourquoi: "On apprend de l'erreur pour ne plus la produire : l'amélioration continue." },
        { libelle: "Changer le serrage d'une vis après avoir vu qu'elle se desserrait au transport", montant: 0, categorie: "amelioration", pourquoi: "Un petit pas qui supprime une cause de défaut : l'amélioration continue." },
      ],
      relance: "La pratique vérifie-t-elle le produit pour écarter un défaut, ou cherche-t-elle à ne plus le produire ?",
      explication: () => ["Le contrôle reste nécessaire, mais il ne fait que trier : l'amélioration continue réduit le coût de la non-qualité à sa source."],
    },
    {
      id: "le-cycle-de-vie",
      objectifs: [3],
      type: "choix",
      titre: "Penser le produit jusqu'à sa fin de vie",
      question: () => "NOVA conçoit une enceinte dont la batterie se change sans outil et dont les composants se recyclent. Qu'est-ce que cette démarche ?",
      options: () => [
        {
          texte: "La gestion du cycle de vie du produit, jusqu'à sa fin de vie",
          juste: true,
          retour: "Oui : la gestion du cycle de vie (Product Lifecycle Management) suit le produit de sa conception à son recyclage. Elle pèse sur les coûts, et répond aux attentes de développement durable.",
        },
        {
          texte: "Un contrôle qualité, puisque la batterie est vérifiée à la sortie de la ligne",
          juste: false,
          retour: "Non : il ne s'agit pas de vérifier l'enceinte, mais de penser dès sa conception à sa réparation et à son recyclage.",
        },
        {
          texte: "Une perte d'argent, puisque l'enceinte durera plus longtemps",
          juste: false,
          retour: "Non : une enceinte réparable fidélise le client, et le recyclage des composants a une valeur. La démarche se chiffre.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const a = avancePourNoel(avanceQuiServitNoel());
        return [
          `${c.entreprise} monte en série, en flux tendus le plus souvent. Avant Noël, pousser le flux de ${qte(a.avance)} enceintes rapporte ${eur(a.gain)}. La qualité se contrôle en fin de ligne et s'améliore sans cesse ; le produit se pense jusqu'à son recyclage.`,
          "Dans l'arène, la demande de chaque tour et la capacité de votre outil disent si vous devez produire à la commande ou d'avance.",
        ];
      },
      repere: () => "Mode de production · productivité et flexibilité · flux physiques et d'information · flux tendus ou poussés · contrôle et amélioration continue · cycle de vie.",
    },
  ],
};
