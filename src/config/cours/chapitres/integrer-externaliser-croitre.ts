import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  ENTREPRISES_DE_LA_CHAINE,
  FILIALE,
  SOUS_TRAITEES_ESSAYEES,
  faireOuFaireFaire,
  noelSousTraite,
  sousTraiteesQuiServentNoel,
  volumeOuIntegrerPaie,
  type Maillon,
  type ModeDeCroissance,
} from "../monde/chaine-de-valeur-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : INTÉGRER, EXTERNALISER, CROÎTRE (Bac STMG, management de première, question 3.1, palier 1).
 *
 * La chaîne de valeur de NOVA, maillon par maillon : ce qu'elle fait elle-même et ce qu'elle confie à
 * d'autres. L'élève range les maillons, chiffre le montage intégré face au sous-traitant, cherche au
 * curseur le volume à partir duquel monter soi-même coûte moins, sert les clients de Noël en faisant
 * monter le surplus au laboratoire, puis distingue croissance interne, croissance externe et
 * partenariat (NOVA DIFFUSION, AUDIO COMPTOIR, CampusTech) et pèse l'internationalisation.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : monde/chaine-de-valeur-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export const MAILLONS: readonly { code: Maillon; libelle: string }[] = [
  { code: "integre", libelle: "Intégré : NOVA le fait elle-même" },
  { code: "externalise", libelle: "Externalisé : confié à un autre" },
];

export const MODES_DE_CROISSANCE: readonly { code: ModeDeCroissance; libelle: string }[] = [
  { code: "interne", libelle: "Croissance interne" },
  { code: "externe", libelle: "Croissance externe" },
  { code: "partenariat", libelle: "Partenariat" },
];

export const INTEGRER_EXTERNALISER_CROITRE: Chapitre = {
  code: "integrer-externaliser-croitre",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les choix stratégiques des organisations"],
  titre: "Intégrer, externaliser, croître",
  accroche:
    "Des composants achetés, des enceintes montées sur sa ligne, vendues en direct et par une chaîne de magasins : ce que NOVA fait elle-même et ce qu'elle confie à d'autres. Puis la façon de grandir, seule, en rachetant ou avec des partenaires.",
  objectifs: [
    "Repérer les maillons de la chaîne de valeur, intégrés ou externalisés",
    "Chiffrer le choix de faire ou de faire faire",
    "Distinguer croissance interne, croissance externe et partenariat",
    "Peser une intégration et une internationalisation",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_CHAINE,
    pourquoi: "ce chapitre suit la chaîne de valeur de NOVA, dont le cours tient les coûts, la ligne, le sous-traitant, la demande et la filiale.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La chaîne de valeur",
      notions: ["vertical_integration"],
      texte: (c) => [
        `Une enceinte ${dE(c.entreprise)} passe par une chaîne d'activités : acheter les composants, les monter, les livrer, les vendre, répondre aux clients après la vente. Chaque maillon ajoute de la valeur : c'est la chaîne de valeur.`,
        "Pour chaque maillon, l'entreprise choisit : le faire elle-même (l'intégrer) ou le confier à un partenaire (l'externaliser). Et pour grandir, elle choisit aussi comment : seule, en rachetant une autre entreprise, ou en s'alliant.",
      ],
      repere: () => "Intégrer : faire soi-même un maillon de la chaîne de valeur. Externaliser : le confier à un partenaire.",
    },
    {
      id: "les-maillons",
      objectifs: [0],
      type: "tri",
      titre: "Ce que NOVA fait, ce qu'elle confie",
      notions: ["vertical_integration"],
      question: (c) => `Rangez chaque maillon de la chaîne ${dE(c.entreprise)} aujourd'hui : intégré ou externalisé ?`,
      categories: MAILLONS,
      elements: () => [
        { libelle: "Le montage des enceintes sur la ligne", montant: 0, categorie: "integre", pourquoi: "Ses opérateurs, sa ligne : intégré." },
        { libelle: "La vente aux particuliers sur son site", montant: 0, categorie: "integre", pourquoi: "Elle vend elle-même, sans intermédiaire : intégré." },
        { libelle: "La fabrication des composants", montant: 0, categorie: "externalise", pourquoi: "Achetés à Électro-Composants Lyon : externalisé." },
        { libelle: "La vente en magasin, par CampusTech", montant: 0, categorie: "externalise", pourquoi: "Une chaîne de magasins revend ses enceintes : externalisé." },
        { libelle: "Le transport des livraisons", montant: 0, categorie: "externalise", pourquoi: "Confié à un transporteur : externalisé." },
      ],
      relance: "Ce maillon est-il fait par les salariés et les équipements de l'entreprise, ou par une autre entreprise ?",
      explication: (c) => [
        `${c.entreprise} garde le cœur de son métier, le montage, et la relation directe avec une partie de ses clients ; elle confie le reste à des spécialistes. Ce partage n'est pas figé : chaque maillon se rejuge quand les volumes ou les prix changent.`,
      ],
    },
    {
      id: "faire-ou-faire-faire",
      objectifs: [1],
      type: "montants",
      titre: "Faire ou faire faire",
      notions: ["make_or_buy"],
      tableau: (c) => {
        const k = faireOuFaireFaire();
        return {
          titre: `Le montage d'un trimestre ${dE(c.entreprise)}, à pleine ligne`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Enceintes montées", valeurs: [qte(k.enceintes)] },
            { libelle: "Coût variable d'une enceinte montée par NOVA", valeurs: [eur(k.coutVariable)] },
            { libelle: "Paie de l'équipe et usure de la ligne du trimestre", valeurs: [eur(k.fixes)] },
            { libelle: "Prix du sous-traitant pour une enceinte finie", valeurs: [eur(k.sousTraitant)] },
          ],
        };
      },
      question: () =>
        "Si NOVA confiait tout le montage au sous-traitant, elle n'aurait plus ni paie d'opérateurs ni ligne à user (le local resterait). Calculez le coût du montage intégré du trimestre, son coût par enceinte (au centime), et ce que NOVA économise en montant elle-même.",
      champs: () => {
        const k = faireOuFaireFaire();
        return [
          { libelle: "Coût du montage intégré du trimestre", attendu: k.integre, calcul: `${eur(k.coutVariable)} × ${qte(k.enceintes)} + ${eur(k.fixes)} = ${eur(k.integre)}`, tolerance: 1 },
          { libelle: "Coût par enceinte, intégré", attendu: k.integreParEnceinte, calcul: `${eur(k.integre)} ÷ ${qte(k.enceintes)} = ${eur(k.integreParEnceinte)}`, tolerance: 0.01 },
          { libelle: "Économie du montage intégré", attendu: k.economie, calcul: `${eur(k.sousTraitant)} × ${qte(k.enceintes)} − ${eur(k.integre)} = ${eur(k.economie)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = faireOuFaireFaire();
        return [
          `À pleine ligne, une enceinte montée par ${c.entreprise} coûte ${eur(k.integreParEnceinte)}, contre ${eur(k.sousTraitant)} chez le sous-traitant : intégrer le montage économise ${eur(k.economie)} par trimestre. Mais les charges fixes se paient quel que soit le volume : à petit volume, le calcul s'inverse.`,
        ];
      },
    },
    {
      id: "le-volume-qui-decide",
      objectifs: [1],
      type: "curseur",
      titre: "Le volume qui fait pencher",
      notions: ["make_or_buy", "fixed_costs"],
      question: (c) => {
        const k = faireOuFaireFaire();
        return `Faites varier les enceintes montées dans le trimestre. Une droite donne ce que coûterait le sous-traitant (${eur(k.sousTraitant)} l'enceinte), l'autre ce que coûte le montage intégré ${dE(c.entreprise)} (${eur(k.coutVariable)} l'enceinte, plus ${eur(k.fixes)} de charges fixes). Placez le curseur sur le plus petit volume, à l'enceinte, où monter soi-même coûte moins.`;
      },
      grandeur: () => ({ libelle: "Enceintes montées dans le trimestre", unite: "enceintes" }),
      cible: () => ({ attendu: volumeOuIntegrerPaie(), max: 7_000 }),
      zones: ["Monter soi-même coûte moins", "Faire monter coûte moins"],
      rates: () => ({ dessous: "À ce volume, les charges fixes pèsent trop : le sous-traitant coûte moins.", dessus: "À ce volume, monter soi-même coûte déjà moins, et un peu plus bas aussi : cherchez le plus petit." }),
      montrer: "Montrer le volume",
      lecture: (_c, q) => {
        const k = faireOuFaireFaire(Math.max(1, q));
        return [
          { libelle: "Coût du sous-traitant", montant: q * k.sousTraitant },
          { libelle: "Coût du montage intégré", montant: q * k.coutVariable + k.fixes, fort: true },
        ];
      },
      droites: () => {
        const k = faireOuFaireFaire();
        return { produit: (q) => q * k.sousTraitant, cout: (q) => q * k.coutVariable + k.fixes, libelles: ["Sous-traitant", "Montage intégré"] };
      },
      explication: (c) => {
        const v = volumeOuIntegrerPaie();
        const k = faireOuFaireFaire();
        return [
          `À partir de ${qte(v)} enceintes par trimestre, monter soi-même coûte moins : chaque enceinte de plus coûte ${eur(k.sousTraitant - k.coutVariable)} de moins qu'au sous-traitant, et finit par payer les charges fixes. ${c.entreprise} en monte bien davantage : elle a raison d'intégrer son montage.`,
          "Externaliser un maillon convient quand le volume est faible, ou quand la capacité manque : on paie alors le service sans porter ses charges fixes.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-noel",
      objectifs: [1],
      type: "simulation",
      titre: "Faire monter ce que la ligne ne peut pas",
      notions: ["make_or_buy", "capacity"],
      question: (c) => {
        const k = noelSousTraite(0);
        return `À Noël de N + 1, les clients demanderont ${qte(k.demande)} enceintes ${dE(c.entreprise)}, et la ligne n'en monte que ${qte(k.ligne)}. Le sous-traitant peut livrer le surplus, à ${eur(k.margeDuSousTraite)} de marge l'enceinte. Faites varier les enceintes commandées au sous-traitant ; une enceinte commandée sans client reste sur les bras.`;
      },
      leviers: () => [{ code: "sousTraitees", libelle: "Enceintes commandées au sous-traitant", unite: "enceintes", ...SOUS_TRAITEES_ESSAYEES, depart: SOUS_TRAITEES_ESSAYEES.min }],
      lecture: (_c, p) => {
        const k = noelSousTraite(p.sousTraitees!);
        const d = noelSousTraite(0);
        return [
          { libelle: "Clients refusés", montant: k.refusees, unite: "enceintes", reference: d.refusees },
          { libelle: "Enceintes commandées sans client", montant: k.sansClient, unite: "enceintes" },
          { libelle: "Marge en plus du trimestre", montant: k.margeEnPlus, reference: d.margeEnPlus, effet: true, fort: true },
        ];
      },
      defi: () => {
        const juste = sousTraiteesQuiServentNoel();
        return {
          consigne: `Trouvez la plus petite commande au sous-traitant, de ${qte(SOUS_TRAITEES_ESSAYEES.pas)} en ${qte(SOUS_TRAITEES_ESSAYEES.pas)}, qui ne refuse aucun client à Noël.`,
          atteint: (p) => p.sousTraitees === juste,
          indice: (p) => {
            const k = noelSousTraite(p.sousTraitees!);
            return k.refusees > 0 ? `Avec ${qte(p.sousTraitees!)} enceintes commandées, ${qte(k.refusees)} clients repartent encore.` : `Aucun client refusé, mais ${qte(k.sansClient)} enceintes restent sans client : moins suffirait.`;
          },
          solution: { sousTraitees: juste },
        };
      },
      explication: (c, p) => {
        const k = noelSousTraite(p.sousTraitees!);
        return [
          `Défi relevé : ${qte(p.sousTraitees!)} enceintes commandées servent tous les clients de Noël et rapportent ${eur(k.margeEnPlus)} de marge en plus à ${c.entreprise}. L'externalisation complète ici l'intégration : la ligne monte ce qu'elle peut, le sous-traitant le surplus.`,
        ];
      },
    },
    {
      id: "integrer-la-distribution",
      objectifs: [3],
      type: "choix",
      titre: "Intégrer la distribution",
      notions: ["vertical_integration"],
      question: (c) => `En N + 1, ${c.entreprise} crée ${FILIALE.nom}, une filiale de distribution dont elle détient ${pct(FILIALE.partDeNova)}, pour revendre ses enceintes aux magasins de hi-fi. Que gagne-t-elle à intégrer ce maillon ?`,
      options: () => [
        {
          texte: "Elle maîtrise la vente et garde la marge du revendeur",
          juste: true,
          retour: "Oui : en intégrant la distribution, l'entreprise contrôle la façon dont ses enceintes sont vendues et garde la marge qu'un intermédiaire aurait prise. En échange, elle porte les salaires, le stock et le risque de la filiale.",
        },
        {
          texte: "Elle ne court plus aucun risque, puisque la filiale vend à sa place",
          juste: false,
          retour: "Non : intégrer, c'est prendre le risque du maillon. Si la filiale vend mal, c'est NOVA qui perd.",
        },
        {
          texte: "Elle n'a plus besoin de clients particuliers ni de CampusTech",
          juste: false,
          retour: "Non : la filiale ajoute un canal, elle ne remplace pas les autres. NOVA garde son site et CampusTech.",
        },
      ],
    },
    {
      id: "modes-de-croissance",
      objectifs: [2],
      type: "tri",
      titre: "Croître : seule, en rachetant, ou à plusieurs",
      question: (c) => `Rangez chaque projet de croissance ${dE(c.entreprise)} selon son mode.`,
      categories: MODES_DE_CROISSANCE,
      elements: () => [
        { libelle: "Acheter une seconde ligne de montage", montant: 0, categorie: "interne", pourquoi: "Elle développe ses propres moyens : croissance interne." },
        { libelle: `Créer ${FILIALE.nom}, une filiale nouvelle`, montant: 0, categorie: "interne", pourquoi: "Une structure créée par l'entreprise elle-même : croissance interne." },
        { libelle: `Faire prendre ${pct(FILIALE.partDansLaBoutique)} d'${FILIALE.boutique} par sa filiale`, montant: 0, categorie: "externe", pourquoi: "Une entreprise qui existe déjà, rachetée : croissance externe." },
        { libelle: "Signer avec CampusTech pour être vendue dans tous ses magasins", montant: 0, categorie: "partenariat", pourquoi: "Un accord entre deux entreprises qui restent indépendantes : un partenariat." },
        { libelle: "Concevoir une enceinte avec un bureau d'études, dans une société commune", montant: 0, categorie: "partenariat", pourquoi: "Une coentreprise, dirigée à deux : un partenariat." },
      ],
      relance: "L'entreprise grandit-elle par ses propres moyens, en prenant le contrôle d'une entreprise qui existe, ou en s'alliant sans fusionner ?",
      explication: () => ["La croissance interne est plus lente mais maîtrisée ; la croissance externe est rapide mais coûteuse et risquée ; le partenariat partage les moyens et les risques, et aussi le pouvoir."],
    },
    {
      id: "pourquoi-racheter",
      objectifs: [2],
      type: "choix",
      titre: "Pourquoi racheter ?",
      question: () => `Pour vendre en boutique, la filiale pourrait ouvrir sa propre boutique, ou prendre ${pct(FILIALE.partDansLaBoutique)} d'${FILIALE.boutique}, qui existe déjà. Qu'apporte la croissance externe ?`,
      options: () => [
        {
          texte: "La rapidité : une boutique, ses clients, ses vendeurs, tout de suite",
          juste: true,
          retour: "Oui : racheter donne d'un coup ce qui prendrait des années à construire. Le prix d'achat est plus élevé, et il faut faire travailler ensemble deux entreprises qui n'ont pas la même histoire.",
        },
        {
          texte: "Un coût plus faible : racheter revient toujours moins cher que créer",
          juste: false,
          retour: "Non : on paie aussi la clientèle et le nom de la boutique. La croissance externe coûte souvent plus cher ; elle va plus vite.",
        },
        {
          texte: "Aucun risque : une boutique qui existe a déjà fait ses preuves",
          juste: false,
          retour: "Non : on peut se tromper sur sa valeur, et l'intégrer au groupe est difficile. La croissance externe est rapide, pas sans risque.",
        },
      ],
    },
    {
      id: "a-l-international",
      objectifs: [3],
      type: "choix",
      titre: "Grandir à l'international",
      question: (c) => `${c.entreprise} veut vendre en Belgique. Elle peut passer par un distributeur belge, ou ouvrir sa propre filiale à Bruxelles. Comment choisir ?`,
      options: () => [
        {
          texte: "Le distributeur pour essayer, la filiale si le marché se confirme",
          juste: true,
          retour: "Oui : le distributeur engage peu de moyens mais garde une partie de la marge et la relation avec les clients ; la filiale coûte plus et risque plus, mais donne le contrôle. Beaucoup d'entreprises commencent par l'un et finissent par l'autre.",
        },
        {
          texte: "La filiale tout de suite : à l'étranger, on ne peut faire confiance qu'à soi",
          juste: false,
          retour: "Non : ouvrir une filiale engage beaucoup d'argent sur un marché qu'on ne connaît pas encore. Un partenaire local réduit ce risque.",
        },
        {
          texte: "Ni l'un ni l'autre : une PME n'a rien à gagner à l'international",
          juste: false,
          retour: "Non : vendre à l'étranger ouvre de nouveaux clients, et répartit le risque d'un seul marché.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = faireOuFaireFaire();
        const v = volumeOuIntegrerPaie();
        return [
          `${c.entreprise} intègre son montage : à pleine ligne, il lui coûte ${eur(k.integreParEnceinte)} l'enceinte contre ${eur(k.sousTraitant)} au sous-traitant, et le calcul ne s'inverserait que sous ${qte(v)} enceintes par trimestre. Elle externalise ce qu'elle ne sait pas faire mieux, et le surplus que sa ligne ne peut monter.`,
          "Pour grandir, elle crée (croissance interne), rachète (croissance externe) ou s'allie (partenariat), en France ou à l'étranger. Dans l'arène, quand la capacité manque, des clients repartent sans être servis : le même choix s'y pose.",
        ];
      },
      repere: () => "Intégrer ou externaliser : selon le volume, la capacité et le savoir-faire. Croissance interne : par ses moyens. Externe : par rachat. Partenariat : par alliance.",
    },
  ],
};
