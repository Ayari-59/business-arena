import { eur, qte } from "../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DES_RESSOURCES, PREVISION_DE_N_PLUS_2, enceintesParOperateurEtParAn, equilibreDuBilan, gpecDeN2 } from "../monde/ressources-et-gpec-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES RESSOURCES POUR PRODUIRE, DU FINANCEMENT À LA GPEC (Bac STMG, management, sciences de
 * gestion et numérique de terminale, enseignement commun, thème 1, question 1.2 : « Quelles ressources
 * pour produire ? »). Il cite aussi le thème 1 de l'enseignement spécifique de ressources humaines et
 * communication (la GPEC y est détaillée), en second.
 *
 * NOVA range ses ressources en tangibles et intangibles, choisit comment financer un investissement et
 * son exploitation, lit son fonds de roulement, son besoin en fonds de roulement et sa trésorerie nette
 * au 31 décembre N, puis fait sa gestion prévisionnelle des emplois et des compétences pour N + 2 : les
 * opérateurs qu'il faudra (au curseur), ceux qui partiront, les recrutements et les formations, et les
 * formes de la relation de travail qui donnent de la flexibilité.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/ressources-et-gpec-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les opérateurs présents et les recrutements sont des
 * quantités ; les montants au centime.
 */


export const LES_RESSOURCES_POUR_PRODUIRE: Chapitre = {
  code: "les-ressources-pour-produire",
  parcours: "stmg-management",
  palier: 1,
  blocs: [
    "STMG Thème 1 · Les organisations et l'activité de production de biens et de services",
    "STMG Thème 1 · Les compétences au service de l'organisation et l'organisation au service du développement des compétences",
  ],
  titre: "Les ressources pour produire : financement et gestion des compétences",
  accroche:
    "Produire demande une ligne, une marque, de l'argent et des compétences. Comment l'entreprise les finance, et comment elle prévoit les personnes dont elle aura besoin dans deux ans.",
  objectifs: [
    "Distinguer les ressources tangibles et intangibles",
    "Choisir un mode de financement de l'investissement ou de l'exploitation",
    "Lire le fonds de roulement, le besoin en fonds de roulement et la trésorerie nette",
    "Prévoir les emplois et les compétences : besoins, recrutements, formations",
    "Choisir une forme de relation de travail",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_RESSOURCES,
    pourquoi: "ce chapitre lit le bilan de NOVA au 31 décembre N et prévoit son équipe de montage.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Produire, c'est combiner des ressources",
      texte: (c) => [
        `Pour monter ses enceintes, ${c.entreprise} combine des ressources : une ligne de montage, un local, des composants, de l'argent, mais aussi le savoir-faire de ses opérateurs, sa marque, son fichier de clients.`,
        "Les premières se voient et se touchent : ce sont des ressources tangibles. Les autres ne se voient pas, mais elles font souvent la différence, parce qu'elles se copient mal : ce sont des ressources intangibles.",
      ],
      repere: () => "Ressources tangibles : matérielles et financières. Ressources intangibles : compétences, marque, savoir-faire, information, réputation.",
    },
    {
      id: "tangibles-ou-intangibles",
      objectifs: [0],
      type: "tri",
      titre: "Tangibles ou intangibles",
      question: (c) => `Rangez chaque ressource de ${c.entreprise}.`,
      categories: [
        { code: "tangible", libelle: "Tangible" },
        { code: "intangible", libelle: "Intangible" },
      ],
      elements: () => [
        { libelle: "La ligne de montage", montant: 0, categorie: "tangible", pourquoi: "Un équipement qu'on voit et qu'on touche." },
        { libelle: "Le stock de composants", montant: 0, categorie: "tangible", pourquoi: "Des biens physiques." },
        { libelle: "L'argent placé sur le compte à terme", montant: 0, categorie: "tangible", pourquoi: "Une ressource financière, comptée au bilan." },
        { libelle: "Le savoir-faire des opérateurs pour régler le son", montant: 0, categorie: "intangible", pourquoi: "Une compétence : elle ne se voit pas, et part avec la personne." },
        { libelle: "La marque NOVA et ses avis clients", montant: 0, categorie: "intangible", pourquoi: "Une réputation : elle ne se touche pas, mais elle fait vendre." },
      ],
      relance: "Cette ressource se voit-elle et se touche-t-elle, ou est-ce une compétence, une marque, une information ?",
      explication: () => ["Une ressource intangible se copie mal : un concurrent peut acheter la même ligne, pas le savoir-faire de l'équipe ni la réputation de la marque."],
    },
    {
      id: "financer-quoi",
      type: "lecture",
      titre: "Financer l'investissement et l'exploitation",
      texte: () => [
        "Produire demande deux sortes de financements. L'investissement (une machine, un local) se finance sur la durée : par les fonds propres (l'autofinancement, une augmentation de capital) ou par un financement externe (un emprunt, un crédit-bail, une subvention, le financement participatif).",
        "L'exploitation demande aussi de l'argent : acheter les composants, les stocker, attendre que les clients paient. C'est le besoin de financement du cycle d'exploitation, que l'entreprise doit couvrir chaque jour.",
      ],
      repere: () => "Investissement : financement durable. Exploitation : besoin en fonds de roulement, couvert par le fonds de roulement ou par la banque.",
    },
    {
      id: "les-modes-de-financement",
      objectifs: [1],
      type: "tri",
      titre: "Fonds propres ou financement externe",
      question: () => "NOVA envisage un cinquième poste de montage. Rangez chaque façon de le financer.",
      categories: [
        { code: "propres", libelle: "Fonds propres" },
        { code: "externe", libelle: "Financement externe" },
      ],
      elements: () => [
        { libelle: "Payer le poste avec les bénéfices gardés des années passées", montant: 0, categorie: "propres", pourquoi: "C'est l'autofinancement : l'entreprise se finance elle-même." },
        { libelle: "Faire entrer un nouvel associé qui apporte de l'argent", montant: 0, categorie: "propres", pourquoi: "Une augmentation de capital : des fonds propres nouveaux." },
        { libelle: "Emprunter à la banque sur 6 ans", montant: 0, categorie: "externe", pourquoi: "Une dette à rembourser, avec des intérêts : un financement externe." },
        { libelle: "Louer le poste à une société de crédit-bail, avec une option d'achat", montant: 0, categorie: "externe", pourquoi: "Le crédit-bail : l'entreprise utilise le bien sans l'acheter tout de suite." },
        { libelle: "Collecter auprès des clients sur une plateforme de financement participatif", montant: 0, categorie: "externe", pourquoi: "Le financement participatif : des particuliers financent le projet." },
      ],
      relance: "L'argent vient-il de l'entreprise et de ses associés, ou d'un prêteur, d'un bailleur, de particuliers ?",
      explication: () => ["L'entreprise arbitre selon sa stratégie, sa situation financière et son environnement : l'autofinancement ne coûte pas d'intérêts mais immobilise sa trésorerie ; l'emprunt la garde, mais il faut le rembourser."],
    },
    {
      id: "financer-l-exploitation",
      objectifs: [1],
      type: "choix",
      titre: "Le stock de Noël",
      question: () => "En novembre, NOVA achète deux fois plus de composants pour Noël ; les clients ne paieront qu'en janvier. Quel besoin faut-il couvrir ?",
      options: () => [
        {
          texte: "Un besoin d'exploitation, le temps que les ventes rentrent",
          juste: true,
          retour: "Oui : c'est le cycle d'exploitation. L'argent avancé pour le stock revient quand les clients paient. Un crédit de trésorerie de quelques mois suffit, si le fonds de roulement ne le couvre pas.",
        },
        {
          texte: "Un investissement, à financer par un emprunt sur 6 ans",
          juste: false,
          retour: "Non : le stock sera vendu dans quelques semaines. Un emprunt de 6 ans financerait un besoin qui ne dure pas.",
        },
        {
          texte: "Aucun besoin, puisque les composants seront revendus dans les enceintes",
          juste: false,
          retour: "Non : il faut payer le fournisseur avant que les clients ne paient. C'est ce décalage qui crée le besoin.",
        },
      ],
    },
    {
      id: "frng-bfr-tn",
      objectifs: [2],
      type: "montants",
      titre: "L'équilibre du bilan",
      tableau: (c) => {
        const e = equilibreDuBilan();
        return {
          titre: `Le bilan de ${c.entreprise} au 31 décembre N, en grandes masses`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Ressources stables (capitaux propres, provision, emprunt)", valeurs: [eur(e.ressourcesStables)] },
            { libelle: "Emplois stables (la ligne de montage, à sa valeur d'achat)", valeurs: [eur(e.emploisStables)] },
            { libelle: "Besoin en fonds de roulement (stocks et créances, moins les dettes du cycle)", valeurs: [eur(e.bfr)] },
          ],
        };
      },
      question: () => "Calculez le fonds de roulement net global (ressources stables moins emplois stables), puis la trésorerie nette (fonds de roulement moins besoin en fonds de roulement).",
      champs: () => {
        const e = equilibreDuBilan();
        return [
          { libelle: "Fonds de roulement net global", attendu: e.frng, calcul: `${eur(e.ressourcesStables)} − ${eur(e.emploisStables)} = ${eur(e.frng)}` },
          { libelle: "Trésorerie nette", attendu: e.tn, calcul: `${eur(e.frng)} − ${eur(e.bfr)} = ${eur(e.tn)}` },
        ];
      },
      explication: () => {
        const e = equilibreDuBilan();
        return [`Les ressources stables financent la ligne et laissent ${eur(e.frng)} de fonds de roulement, bien plus que le besoin du cycle, ${eur(e.bfr)} : la trésorerie nette est de ${eur(e.tn)}.`];
      },
    },
    {
      id: "lire-l-equilibre",
      objectifs: [2],
      type: "choix",
      titre: "Ce que dit l'équilibre",
      question: () => "Que dit ce bilan de la capacité de NOVA à financer le cinquième poste ?",
      options: () => {
        const e = equilibreDuBilan();
        return [
          {
            texte: "Sa trésorerie couvre le poste, mais l'autofinancer la réduirait",
            juste: true,
            retour: `Oui : ${eur(e.tn)} de trésorerie nette laissent de la marge. Payer comptant la réduirait ; emprunter la garderait, contre des intérêts. Les deux se défendent : c'est un arbitrage.`,
          },
          {
            texte: "Elle doit emprunter, puisque son besoin en fonds de roulement est positif",
            juste: false,
            retour: "Non : un besoin en fonds de roulement positif est normal ; ici, le fonds de roulement le couvre largement.",
          },
          {
            texte: "Rien : le bilan ne dit rien de la trésorerie",
            juste: false,
            retour: "Non : la trésorerie nette se lit justement sur le bilan, par l'écart du fonds de roulement et du besoin en fonds de roulement.",
          },
        ];
      },
    },
    {
      id: "la-gpec",
      type: "lecture",
      titre: "Prévoir les emplois et les compétences",
      texte: (c) => [
        `Avec un cinquième poste, ${c.entreprise} prévoit de monter ${qte(PREVISION_DE_N_PLUS_2)} enceintes en N + 2. Un opérateur en monte ${qte(enceintesParOperateurEtParAn())} par an. Les choix de production ont des conséquences sur les ressources humaines : il faut prévoir les personnes, et leurs compétences.`,
        "C'est la gestion prévisionnelle des emplois et des compétences (GPEC) : comparer les besoins de demain aux ressources d'aujourd'hui, en nombre (combien de personnes) et en qualité (quelles compétences), puis combler l'écart par le recrutement, la formation ou la mobilité.",
      ],
      repere: () => "GPEC : besoins futurs − ressources futures = écart, à combler par le recrutement, la formation ou d'autres formes de travail.",
    },
    {
      id: "le-curseur-des-operateurs",
      objectifs: [3],
      type: "curseur",
      titre: "Combien d'opérateurs en N + 2 ?",
      question: (c) => `Faites varier le nombre d'opérateurs de montage : une droite donne ce qu'ils peuvent monter dans l'année, l'autre les ${qte(PREVISION_DE_N_PLUS_2)} enceintes prévues. Placez le curseur sur le plus petit nombre d'opérateurs qui suffit à ${c.entreprise}.`,
      cible: () => ({ attendu: gpecDeN2().besoin, max: 8 }),
      grandeur: () => ({ libelle: "Opérateurs de montage", unite: "opérateurs" }),
      rates: () => ({ dessous: "Trop peu : la production prévue ne serait pas montée.", dessus: "Assez, mais un opérateur de moins suffirait-il encore ?" }),
      zones: ["Prévision montée", "Prévision non montée"],
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const g = gpecDeN2(q);
        return [
          { libelle: "Enceintes que l'équipe peut monter", montant: g.capacite },
          { libelle: "Enceintes prévues", montant: g.prevision },
          { libelle: "Écart", montant: g.capacite - g.prevision, fort: true },
        ];
      },
      droites: () => ({ produit: (q) => q * enceintesParOperateurEtParAn(), cout: () => PREVISION_DE_N_PLUS_2, libelles: ["Capacité de l'équipe", "Production prévue"] }),
      explication: () => {
        const g = gpecDeN2();
        return [`Il faut ${qte(g.besoin)} opérateurs : ${qte(g.besoin - 1)} n'en monteraient que ${qte((g.besoin - 1) * g.parOperateur)}. Le besoin est connu ; reste à le comparer à ceux qui seront là.`];
      },
    },
    {
      id: "les-recrutements",
      objectifs: [3],
      type: "montants",
      titre: "L'écart à combler",
      question: () => {
        const g = gpecDeN2();
        return `NOVA compte ${qte(g.effectif)} opérateurs, et ${qte(g.departs)} partira à la retraite à la fin de N + 1. Calculez les opérateurs présents en N + 2, puis les recrutements à prévoir.`;
      },
      champs: () => {
        const g = gpecDeN2();
        return [
          { libelle: "Opérateurs présents en N + 2", nature: "quantite", attendu: g.presents, calcul: `${qte(g.effectif)} − ${qte(g.departs)} = ${qte(g.presents)}` },
          { libelle: "Recrutements à prévoir", nature: "quantite", attendu: g.recrutements, calcul: `${qte(g.besoin)} − ${qte(g.presents)} = ${qte(g.recrutements)}` },
        ];
      },
      explication: () => {
        const g = gpecDeN2();
        return [`${qte(g.recrutements)} recrutements, à lancer assez tôt : un recrutement prend des semaines, et un nouveau venu monte moins vite le premier mois. C'est l'intérêt de prévoir : le départ en retraite se voit des mois à l'avance.`];
      },
    },
    {
      id: "recruter-ou-former",
      objectifs: [3],
      type: "tri",
      titre: "Recruter ou former",
      question: () => "Rangez chaque besoin de compétence de N + 2 selon la réponse la plus adaptée.",
      categories: [
        { code: "recruter", libelle: "Recruter" },
        { code: "former", libelle: "Former un salarié" },
      ],
      elements: () => [
        { libelle: "Un opérateur de plus pour tenir le cinquième poste", montant: 0, categorie: "recruter", pourquoi: "Un besoin en nombre : il faut une personne de plus." },
        { libelle: "Remplacer l'opérateur qui part à la retraite", montant: 0, categorie: "recruter", pourquoi: "Un poste qui se libère : un recrutement." },
        { libelle: "Entretenir la ligne soi-même, la garantie du fabricant étant finie", montant: 0, categorie: "former", pourquoi: "Une compétence nouvelle pour l'équipe en place : une formation." },
        { libelle: "Lire les mesures du nouveau banc de contrôle du son", montant: 0, categorie: "former", pourquoi: "Les opérateurs savent déjà monter ; ils apprennent un outil nouveau." },
      ],
      relance: "Manque-t-il une personne, ou une compétence que l'équipe en place peut acquérir ?",
      explication: () => ["La GPEC est quantitative (combien de personnes) et qualitative (quelles compétences). Former l'équipe en place la fidélise et garde son savoir-faire ; recruter apporte un nombre ou une compétence qui manque."],
    },
    {
      id: "la-relation-de-travail",
      objectifs: [4],
      type: "tri",
      titre: "Des formes de relation de travail",
      question: () => "Pour gagner en flexibilité, NOVA peut employer autrement. Rangez chaque situation selon la forme de relation de travail la plus adaptée.",
      categories: [
        { code: "cdi", libelle: "Contrat à durée indéterminée" },
        { code: "temporaire", libelle: "Contrat à durée déterminée ou intérim" },
        { code: "independant", libelle: "Travailleur indépendant" },
      ],
      elements: () => [
        { libelle: "Le cinquième opérateur, pour un poste qui durera", montant: 0, categorie: "cdi", pourquoi: "Un besoin durable : le contrat de droit commun." },
        { libelle: "Remplacer un opérateur absent pendant un congé", montant: 0, categorie: "temporaire", pourquoi: "Un besoin limité dans le temps : un CDD de remplacement ou un intérimaire." },
        { libelle: "Renforcer l'équipe les semaines avant Noël", montant: 0, categorie: "temporaire", pourquoi: "Un surcroît d'activité passager : l'intérim ou un CDD." },
        { libelle: "Faire concevoir l'emballage du pack par une graphiste", montant: 0, categorie: "independant", pourquoi: "Une mission ponctuelle, confiée à une professionnelle indépendante, souvent trouvée sur une plateforme." },
      ],
      relance: "Le besoin dure-t-il, est-il limité dans le temps, ou est-ce une mission confiée à un professionnel qui n'est pas salarié ?",
      explication: () => ["Ces formes donnent de la flexibilité à l'organisation. Le numérique les accompagne : plateformes de travail indépendant, recrutement en ligne, travail à distance."],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const e = equilibreDuBilan();
        const g = gpecDeN2();
        return [
          `${c.entreprise} produit avec des ressources tangibles et intangibles. Son fonds de roulement de ${eur(e.frng)} couvre son besoin du cycle et laisse ${eur(e.tn)} de trésorerie : de quoi choisir entre autofinancer et emprunter. Pour N + 2, il lui faut ${qte(g.besoin)} opérateurs : ${qte(g.recrutements)} recrutements et des formations.`,
          "Dans l'arène, la feuille de décision vous fait régler l'effectif et le financement : chaque choix de production y a ses conséquences sur l'équipe et la trésorerie.",
        ];
      },
      repere: () => "Fonds de roulement − besoin en fonds de roulement = trésorerie nette. GPEC : prévoir en nombre et en compétences, puis recruter, former ou employer autrement.",
    },
  ],
};
