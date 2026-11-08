import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { ENTREPRISES_DU_MARCHE_DE_NOVA, POURQUOI_LE_MARCHE_DE_NOVA } from "../monde/mercatique-de-nova";
import {
  FACONS_DE_S_ADRESSER_AU_MARCHE,
  OFFRE_GLOBALE_DE_LA_ONE,
  PERSONNALISATION,
  commandeDeCampusTech,
  commandeGravee,
  gammeDuMois,
  margeDeLaGravure,
  plusPetiteCommandeGravee,
  positionsDuMarche,
} from "../monde/offre-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : POSITIONNER L'OFFRE, MARQUE, GAMME, TYPES DE MARKETING (Bac STMG, mercatique de terminale,
 * thème 1, question 1.1 : « La personnalisation de l'offre est-elle incontournable ? »).
 *
 * « Segmenter et cibler » découpe le marché de NOVA en clientèles ; ce chapitre construit l'offre qui
 * leur répond : une gamme de trois références, chacune à sa clientèle (le couple produit-marché), un
 * positionnement face à SoundBox et Auris, une offre globale (le produit, ses services, ses signes :
 * marque, design, conditionnement), une politique de marque, et les quatre façons de s'adresser au
 * marché, de la masse à l'individu. Puis l'expérience : CampusTech, client professionnel (B2B), veut le
 * logo de chaque campus gravé sur ses enceintes. Le curseur cherche la plus petite commande qui paie la
 * personnalisation.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/offre-de-nova.ts) : la gamme de nova-gestion.ts, les
 * enseignes du marché à trois, les clientèles et CampusTech de mercatique-de-nova.ts ; les hypothèses
 * de la gravure sont nommées dans la fiche.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qualite = (q: number) => q.toLocaleString("fr-FR", { maximumFractionDigits: 2 });

function laGamme(): TableauDeDonnees {
  const g = gammeDuMois();
  return {
    titre: "La gamme de NOVA, un mois",
    colonnes: g.references.map((r) => r.nom),
    lignes: [
      { libelle: "Prix hors taxes", valeurs: g.references.map((r) => eur(r.prix)) },
      { libelle: "Coût variable d'une enceinte", valeurs: g.references.map((r) => eur(r.coutVariable)) },
      { libelle: "Enceintes vendues", valeurs: g.references.map((r) => qte(r.quantite)) },
    ],
  };
}

function leMarche(): TableauDeDonnees {
  const e = positionsDuMarche();
  return {
    titre: "Les enseignes du marché",
    colonnes: e.map((x) => x.nom),
    lignes: [
      { libelle: "Prix de l'enceinte", valeurs: e.map((x) => eur(x.prix)) },
      { libelle: "Qualité perçue (1 : la NOVA One)", valeurs: e.map((x) => qualite(x.qualite)) },
    ],
  };
}

/** Pourquoi chaque référence vise sa clientèle : la sensibilité de chacune (mercatique-de-nova.ts). */
const POURQUOI_DU_COUPLE: Readonly<Record<string, string>> = {
  go: "les étudiants comparent d'abord les prix, la moins chère des trois leur répond.",
  one: "les familles, le cœur du marché, veulent une enceinte sûre à un prix raisonnable.",
  studio: "les mélomanes paient la qualité, la plus puissante des trois leur répond.",
};

const one = () => gammeDuMois().references.find((r) => r.code === "one")!;
const studio = () => gammeDuMois().references.find((r) => r.code === "studio")!;

export const POSITIONNER_L_OFFRE: Chapitre = {
  code: "positionner-l-offre",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre"],
  titre: "Positionner l'offre : marque, gamme, types de marketing",
  accroche:
    "Une gamme, des clientèles, des concurrents. Où placer chaque offre, sous quelle marque, et jusqu'où la personnaliser pour un client qui la demande ?",
  objectifs: [
    "Lire une gamme : ses références et leur poids",
    "Positionner une offre face aux concurrents",
    "Décrire l'offre globale et la politique de marque",
    "Distinguer le marketing de masse, différencié, concentré et individualisé",
    "Chiffrer ce que coûte et rapporte une offre personnalisée à un client professionnel",
  ],
  libre: false,
  prerequis: ["segmenter-et-cibler"],
  ensuite: ["prix-psychologique"],
  entreprises: { codes: ENTREPRISES_DU_MARCHE_DE_NOVA, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une gamme d'enceintes",
      notions: ["segmentation"],
      tableau: laGamme,
      texte: (c) => [
        `${c.entreprise} ne vend plus une seule enceinte : la NOVA Go, petite et bon marché, la NOVA One, celle du lancement, et la NOVA Studio, plus chère et plus puissante. Ensemble, elles forment sa gamme.`,
        "Le tableau donne un mois de ventes en gamme. Construire l'offre, c'est décider ce que chaque référence promet, à qui, à quel prix et sous quel nom.",
      ],
      repere: () => "La gamme : l'ensemble des produits qu'une entreprise propose. Sa largeur compte les familles de produits ; sa profondeur, les références d'une même famille.",
    },
    {
      id: "le-poids",
      objectifs: [0],
      type: "montants",
      titre: "Le poids de chaque référence",
      notions: ["segmentation"],
      tableau: laGamme,
      question: () => "Calculez le chiffre d'affaires du mois pour toute la gamme, puis la part de la NOVA One dans ce chiffre d'affaires, en pourcentage au dixième.",
      champs: () => {
        const g = gammeDuMois();
        const o = one();
        return [
          { libelle: "Chiffre d'affaires de la gamme", attendu: g.chiffreDAffaires, calcul: g.references.map((r) => `${qte(r.quantite)} × ${eur(r.prix)}`).join(" + ") + ` = ${eur(g.chiffreDAffaires)}` },
          { libelle: "Part de la NOVA One (%)", attendu: o.part, tolerance: 0.1, calcul: `${eur(o.chiffreDAffaires)} ÷ ${eur(g.chiffreDAffaires)} × 100 = ${pct(o.part)}` },
        ];
      },
      explication: (c) => {
        const s = studio();
        return [
          `La NOVA One fait ${pct(one().part)} du chiffre d'affaires : c'est le produit phare de ${c.entreprise}. La Studio, avec peu d'enceintes, en fait déjà ${pct(s.part)}, parce qu'elle se vend ${eur(s.prix)} et laisse ${eur(s.marge)} par enceinte.`,
        ];
      },
    },
    {
      id: "le-positionnement",
      objectifs: [1],
      type: "choix",
      titre: "Où se place la NOVA One",
      notions: ["segmentation", "brand_capital"],
      tableau: leMarche,
      question: () => "Le positionnement, c'est la place qu'une offre occupe dans l'esprit des clients face aux offres concurrentes. Où se place la NOVA One ?",
      options: () => {
        const [nova, soundbox, auris] = positionsDuMarche();
        return [
          {
            texte: "Au milieu du marché, par son prix et sa qualité",
            juste: true,
            retour: `Oui : ${eur(nova!.prix)}, entre ${soundbox!.nom} (${eur(soundbox!.prix)}) et ${auris!.nom} (${eur(auris!.prix)}), et une qualité perçue entre les deux. Ce positionnement promet un bon rapport entre la qualité et le prix.`,
          },
          { texte: "Sur le prix le plus bas du marché", juste: false, retour: `Non : ${soundbox!.nom} vend moins cher, ${eur(soundbox!.prix)}. Ce positionnement est le sien.` },
          { texte: "Sur le haut de gamme, la meilleure qualité perçue", juste: false, retour: `Non : ${auris!.nom} est mieux perçue (${qualite(auris!.qualite)}) et plus chère. Le haut du marché lui appartient ; ${nova!.nom} y monte avec la Studio.` },
        ];
      },
    },
    {
      id: "le-couple-produit-marche",
      objectifs: [0, 3],
      type: "tri",
      titre: "Une référence pour chaque clientèle",
      notions: ["segmentation"],
      question: () => "Chaque référence vise d'abord une clientèle : c'est le couple produit-marché. Rangez chaque enceinte sous la clientèle qu'elle vise.",
      categories: gammeDuMois().references.map((r) => ({ code: r.clientele.code, libelle: r.clientele.nom })),
      elements: () =>
        gammeDuMois().references.map((r) => ({
          libelle: `${r.nom}, à ${eur(r.prix)}`,
          montant: 0,
          categorie: r.clientele.code,
          pourquoi: `${r.nom} : ${POURQUOI_DU_COUPLE[r.code]}`,
        })),
      relance: "Quelle clientèle compare d'abord les prix, laquelle paie la qualité ?",
      explication: () => ["La Go répond aux étudiants, qui comparent les prix ; la One aux familles, le cœur du marché ; la Studio aux mélomanes, qui paient la qualité. Une référence par clientèle : c'est déjà une offre différenciée."],
    },
    {
      id: "l-offre-globale",
      objectifs: [2],
      type: "tri",
      titre: "Le produit, ses services, ses signes",
      notions: ["brand_capital"],
      question: () => "Le client n'achète pas qu'un objet : il achète une offre globale. Rangez chaque élément de l'offre de la NOVA One.",
      categories: [
        { code: "produit", libelle: "Le produit lui-même" },
        { code: "services", libelle: "Les services associés" },
        { code: "signes", libelle: "Les signes : marque, design, conditionnement" },
      ],
      elements: () => OFFRE_GLOBALE_DE_LA_ONE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.composante, pourquoi: x.pourquoi })),
      relance: "Cet élément change-t-il l'enceinte elle-même, ce qui l'entoure, ou la façon de la reconnaître ?",
      explication: () => ["L'offre globale réunit le produit, ses services et ses signes. Des enceintes au son égal ne se vendent pas pareil si l'une est mieux livrée, mieux garantie ou mieux reconnue : la qualité perçue tient à tout l'ensemble."],
    },
    {
      id: "la-marque",
      objectifs: [2],
      type: "choix",
      titre: "Une marque pour toute la gamme",
      notions: ["brand_capital"],
      question: (c) => `Les enceintes de la gamme portent le nom ${c.entreprise}, suivi d'un nom propre à chacune. Quelle politique de marque est-ce ?`,
      options: (c) => [
        { texte: "Une marque gamme pour toute une famille", juste: true, retour: `Oui : un même nom couvre des produits de la même famille, les enceintes. La réputation de la One profite à la Go et à la Studio, et inversement : un défaut sur l'une touche les trois.` },
        { texte: "Une marque produit, un nom par enceinte", juste: false, retour: `Non : avec une marque produit, chaque enceinte aurait un nom sans rapport avec les autres, et ${c.entreprise} n'apparaîtrait pas.` },
        { texte: "Une marque de distributeur, celle d'un magasin", juste: false, retour: "Non : une marque de distributeur appartient à l'enseigne qui revend (comme une grande surface). Ici, la marque est celle du fabricant." },
      ],
    },
    {
      id: "quatre-facons",
      objectifs: [3],
      type: "tri",
      titre: "De la masse à l'individu",
      notions: ["segmentation"],
      question: () => "Rangez chaque façon de s'adresser au marché sous le type de marketing qu'elle pratique.",
      categories: [
        { code: "masse", libelle: "Marketing de masse" },
        { code: "differencie", libelle: "Marketing différencié" },
        { code: "concentre", libelle: "Marketing concentré" },
        { code: "individualise", libelle: "Marketing individualisé" },
      ],
      elements: () => FACONS_DE_S_ADRESSER_AU_MARCHE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.type, pourquoi: x.pourquoi })),
      relance: "Combien de segments l'offre vise-t-elle : tous, plusieurs, un seul, ou un client ?",
      explication: () => ["Plus l'offre se rapproche du client, plus elle lui convient, et plus elle coûte : une seule offre pour tous se fabrique en grandes séries ; une offre pour un seul client demande un travail à part."],
    },
    {
      id: "un-client-professionnel",
      objectifs: [4],
      type: "choix",
      titre: "Vendre à un professionnel",
      notions: ["distribution_commission"],
      question: (c) => `${commandeDeCampusTech().nom} achète ${qte(commandeDeCampusTech().quantite)} enceintes par mois à ${c.entreprise} pour les revendre sur les campus. En quoi ce client professionnel (B2B) diffère-t-il d'un particulier (B2C) ?`,
      options: () => [
        { texte: "Il achète en volume, et les conditions se négocient", juste: true, retour: "Oui : un client professionnel achète pour revendre ou pour son activité, en grandes quantités ; le prix, le délai de paiement et l'offre elle-même se discutent, contrat à l'appui." },
        { texte: "Il achète sur un coup de cœur, comme un particulier", juste: false, retour: "Non : l'achat d'un professionnel est raisonné, souvent décidé à plusieurs, et répété." },
        { texte: "Il paie toujours comptant, à la commande", juste: false, retour: "Non : c'est le particulier qui paie à la commande. Un professionnel paie à échéance, après un délai convenu." },
      ],
    },
    {
      id: "la-gravure",
      objectifs: [4],
      type: "montants",
      titre: "Ce que rapporte la gravure",
      notions: ["contribution_margin"],
      question: () => {
        const p = PERSONNALISATION;
        const k = commandeDeCampusTech();
        return `${k.nom} demande le logo de chaque campus gravé sur ses enceintes. Chaque commande gravée demande un réglage de la machine, ${eur(p.reglageParCommande)} ; chaque gravure coûte ${eur(p.gravureParEnceinte)}, et NOVA facture ${eur(p.supplementFacture)} de plus par enceinte gravée. Calculez ce que la gravure laisse sur une enceinte, avant le réglage, puis ce que rapporte une commande gravée de ${qte(k.quantite)} enceintes, réglage payé.`;
      },
      champs: () => {
        const p = PERSONNALISATION;
        const k = commandeGravee(commandeDeCampusTech().quantite);
        return [
          { libelle: "Ce que laisse la gravure, par enceinte", attendu: margeDeLaGravure(), calcul: `${eur(p.supplementFacture)} − ${eur(p.gravureParEnceinte)} = ${eur(margeDeLaGravure())}` },
          { libelle: "Gain de la commande gravée", attendu: k.gain, calcul: `${qte(k.quantite)} × ${eur(margeDeLaGravure())} − ${eur(p.reglageParCommande)} = ${eur(k.gain)}` },
        ];
      },
      explication: (c) => {
        const k = commandeGravee(commandeDeCampusTech().quantite);
        return [`Une commande de ${qte(k.quantite)} enceintes gravées rapporte ${eur(k.gain)} de plus à ${c.entreprise}. Le réglage se paie une fois par commande : plus la commande est grosse, plus il se dilue.`];
      },
    },
    {
      id: "la-plus-petite-commande",
      objectifs: [4],
      type: "curseur",
      titre: "La plus petite commande gravée",
      notions: ["contribution_margin", "breakeven"],
      question: () => {
        const p = PERSONNALISATION;
        return `Faites varier le nombre d'enceintes d'une commande gravée : une droite donne ce que facture le supplément, l'autre ce que coûtent le réglage (${eur(p.reglageParCommande)}) et les gravures. Placez le curseur sur la plus petite commande que le supplément paie, puis validez.`;
      },
      grandeur: () => ({ libelle: "Enceintes de la commande gravée", unite: "enceintes" }),
      cible: () => ({ attendu: plusPetiteCommandeGravee(), max: 2 * commandeDeCampusTech().quantite }),
      zones: ["La gravure paie", "La gravure coûte plus qu'elle ne rapporte"],
      rates: () => ({
        dessous: "À ce nombre, le supplément ne paie pas encore le réglage : la commande est trop petite.",
        dessus: "Cette commande paie la gravure, mais une plus petite la paierait aussi : cherchez la plus petite.",
      }),
      montrer: "Montrer la commande",
      lecture: (_c, q) => {
        const k = commandeGravee(q);
        return [
          { libelle: "Supplément facturé", montant: k.supplement },
          { libelle: "Réglage et gravures", montant: k.cout },
          { libelle: "Gain de la commande", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({
        produit: (q) => commandeGravee(q).supplement,
        cout: (q) => commandeGravee(q).cout,
        libelles: ["Supplément facturé", "Réglage et gravures"],
      }),
      explication: () => {
        const s = plusPetiteCommandeGravee();
        return [
          `À ${qte(s)} enceintes, le supplément paie le réglage et les gravures : ${eur(commandeGravee(s).gain)} de gain. En dessous, la personnalisation coûte plus qu'elle ne rapporte.`,
          "Personnaliser se fait donc au-delà d'un volume, ou contre un supplément plus fort quand la commande est petite.",
        ];
      },
    },
    {
      id: "incontournable",
      objectifs: [3, 4],
      type: "choix",
      titre: "La personnalisation est-elle incontournable ?",
      notions: ["segmentation"],
      question: (c) => `La question du programme : la personnalisation de l'offre est-elle incontournable ? Que répondez-vous pour ${c.entreprise} ?`,
      options: () => [
        { texte: "Non : elle se décide selon le client", juste: true, retour: `Oui : la gravure paie à partir de ${qte(plusPetiteCommandeGravee())} enceintes, et ${commandeDeCampusTech().nom} l'attend. Le particulier, lui, achète une enceinte de la gamme : la gamme différenciée lui suffit.` },
        { texte: "Oui : chaque client veut une offre faite pour lui", juste: false, retour: "Non : beaucoup de clients préfèrent un produit standard bien placé, à un bon prix. Personnaliser pour tous coûterait plus que ce que les clients paieraient." },
        { texte: "Non : une seule offre pour tous coûte toujours moins", juste: false, retour: `Non : la commande gravée de ${qte(commandeDeCampusTech().quantite)} enceintes rapporte ${eur(commandeGravee(commandeDeCampusTech().quantite).gain)} de plus. L'offre standard coûte moins à fabriquer, pas forcément moins à vendre.` },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation", "brand_capital"],
      texte: (c) => [
        `${c.entreprise} segmente, cible, puis positionne : une gamme d'une marque, trois références pour trois clientèles, au milieu du marché pour la One. L'offre globale y ajoute services et signes, qui font la qualité perçue.`,
        `La personnalisation va plus loin : elle répond à un client précis, et se paie. Dans l'arène, relevez le prix et la qualité des concurrents à chaque tour : votre offre est-elle toujours placée là où vous le voulez ?`,
      ],
      repere: () => "Segmenter, cibler, positionner : à qui l'on s'adresse, avec quelle offre, et quelle place elle doit tenir face aux concurrents dans l'esprit des clients.",
    },
  ],
};

