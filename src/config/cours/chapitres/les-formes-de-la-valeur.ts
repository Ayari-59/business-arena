import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { L_ESCALE } from "../monde/l-escale";
import { AVIS_DE_L_ESCALE, NOTES_DES_CONCURRENTS, coutCompletDUneNuitee, prixPlancher, resultatADemandeEgale, valeurDeLEscale } from "../monde/valeur-de-l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES FORMES DE LA VALEUR, FINANCIÈRE, PARTENARIALE, PERÇUE (Bac STMG, sciences de gestion
 * et numérique de première, thème 3, question 1 : « Peut-on mesurer la contribution de chaque acteur à
 * la création de valeur ? »).
 *
 * Les chapitres de gestion du cours mesurent déjà la valeur ajoutée et son partage, le résultat, la
 * marge. Celui-ci apporte ce que l'audit y trouvait absent : la valeur perçue par le client (image,
 * notoriété, satisfaction, avis, réputation), la valeur actionnariale et boursière, la valeur
 * partenariale, et la relation entre le prix, le coût et la qualité, au niveau du lycée. Il se joue à
 * L'ESCALE, un hôtel que ses clients notent en ligne, face à deux concurrents, l'un moins cher et moins
 * bien noté, l'autre plus cher et mieux noté. Le curseur cherche le plus bas prix qui couvre le coût
 * complet d'une nuitée l'hiver.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez L'ESCALE seule : l'année de l'hôtel, ses coûts, son
 * équipe et le prix de ses concurrents sont ceux de la fiche (l-escale.ts, hotel.ts) ; les avis et les
 * notes des concurrents sont des hypothèses du cours, nommées dans monde/valeur-de-l-escale.ts.
 */

export const ENTREPRISES_DE_LA_VALEUR = ["hotel"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const note = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} sur 5`;

const HIVER = 1;

function lesTroisHotels(c: Cas): TableauDeDonnees {
  const k = valeurDeLEscale();
  const [comptoir, terminus] = L_ESCALE.concurrents;
  return {
    titre: "Trois hôtels de la ville",
    colonnes: [c.entreprise, comptoir!.nom, terminus!.nom],
    lignes: [
      { libelle: "Prix de la nuitée", valeurs: [eur(L_ESCALE.prixDeLAnnee), eur(comptoir!.prix[0]!), eur(terminus!.prix[1]!)] },
      { libelle: "Note moyenne des clients en ligne", valeurs: [note(k.noteMoyenne), note(NOTES_DES_CONCURRENTS[0]!), note(NOTES_DES_CONCURRENTS[1]!)] },
    ],
  };
}

function lesAvis(): TableauDeDonnees {
  return {
    titre: "Les avis publiés par les clients dans l'année",
    colonnes: ["Avis"],
    lignes: ([5, 4, 3, 2, 1] as const).map((e) => ({ libelle: `${e} étoile${e > 1 ? "s" : ""}`, valeurs: [qte(AVIS_DE_L_ESCALE[e])] })),
  };
}

export const LES_FORMES_DE_LA_VALEUR: Chapitre = {
  code: "les-formes-de-la-valeur",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Création de valeur et performance"],
  titre: "Les formes de la valeur : financière, partenariale, perçue",
  accroche:
    "Un hôtel crée de la valeur pour ses associés, ses salariés, ses clients. La première se lit dans les comptes ; celle des clients se lit dans leurs avis. Et un prix ne tient que si la qualité perçue le justifie, et s'il couvre le coût.",
  objectifs: [
    "Distinguer la valeur financière, la valeur partenariale et la valeur perçue",
    "Mesurer la valeur perçue : notoriété, image, satisfaction, avis, réputation",
    "Relier le prix, le coût et la qualité perçue",
    "Dire ce que sont la valeur actionnariale et la valeur boursière",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_VALEUR,
    pourquoi: "ce chapitre lit l'année de L'ESCALE et les avis de ses clients, face aux deux hôtels concurrents de la ville.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois hôtels, trois promesses",
      notions: ["brand_capital"],
      tableau: lesTroisHotels,
      texte: (c) => {
        const k = valeurDeLEscale();
        return [
          `${c.entreprise} a vendu ${qte(k.vendues)} nuitées dans l'année, à ${eur(L_ESCALE.prixDeLAnnee)}. Ses associés regardent le résultat ; ses ${qte(L_ESCALE.equipe.effectif)} salariés, leurs salaires ; ses clients, ce qu'ils ont reçu pour leur argent, et ils le disent en ligne.`,
          "Chacun voit une forme de la valeur créée : la valeur financière pour les associés, la valeur partenariale pour toutes les parties prenantes, la valeur perçue par les clients. Les trois se tiennent : sans clients satisfaits, pas de résultat.",
        ];
      },
      repere: () => "Valeur financière (le résultat, pour les associés) ; valeur partenariale (ce que reçoit chaque partie prenante) ; valeur perçue (ce que le client pense recevoir pour son prix).",
    },
    {
      id: "le-partage",
      objectifs: [0],
      type: "montants",
      titre: "Ce que reçoit chaque partie prenante",
      notions: ["income_statement"],
      question: (c) => {
        const k = valeurDeLEscale();
        return `Sur l'année, ${c.entreprise} a fait ${eur(k.chiffreDAffaires)} de chiffre d'affaires et un résultat de ${eur(k.resultat)} ; ses salariés lui ont coûté ${eur(k.personnel)}. Calculez, au dixième de point, la part du chiffre d'affaires qui revient aux salariés, puis celle qui reste aux associés.`;
      },
      champs: () => {
        const k = valeurDeLEscale();
        return [
          { libelle: "Part des salariés (%)", attendu: k.partDesSalariesPct, calcul: `${eur(k.personnel)} ÷ ${eur(k.chiffreDAffaires)} × 100 = ${pct(k.partDesSalariesPct)}`, tolerance: 0.1 },
          { libelle: "Part des associés (%)", attendu: k.partDesAssociesPct, calcul: `${eur(k.resultat)} ÷ ${eur(k.chiffreDAffaires)} × 100 = ${pct(k.partDesAssociesPct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = valeurDeLEscale();
        return [
          `Les salariés reçoivent ${pct(k.partDesSalariesPct)} de ce que paient les clients, les associés ${pct(k.partDesAssociesPct)} avant l'impôt ; le reste va aux fournisseurs (le linge, l'énergie, le petit-déjeuner, le loyer). C'est la valeur partenariale : chaque partie prenante reçoit une part de la valeur créée. La valeur financière n'en est qu'une, celle des associés.`,
        ];
      },
    },
    {
      id: "les-mots-de-la-valeur-percue",
      objectifs: [1],
      type: "tri",
      titre: "Notoriété, image, satisfaction, réputation",
      question: (c) => `Rangez chaque fait sur ${c.entreprise} : dit-il sa notoriété, son image, la satisfaction d'un client, ou sa réputation ?`,
      categories: [
        { code: "notoriete", libelle: "Notoriété" },
        { code: "image", libelle: "Image" },
        { code: "satisfaction", libelle: "Satisfaction" },
        { code: "reputation", libelle: "Réputation" },
      ],
      elements: () => [
        { libelle: "60 % des habitants citent l'hôtel quand on leur demande où dormir en ville", montant: 0, categorie: "notoriete", pourquoi: "Être connu, cité spontanément : la notoriété." },
        { libelle: "On l'associe à un accueil familial et à des chambres calmes", montant: 0, categorie: "image", pourquoi: "Ce que l'hôtel évoque dans l'esprit des gens : son image." },
        { libelle: "Un client remplit le questionnaire de départ : séjour conforme à ce qu'il attendait", montant: 0, categorie: "satisfaction", pourquoi: "L'écart entre ce qu'il attendait et ce qu'il a reçu : la satisfaction." },
        { libelle: "La note moyenne affichée sur les sites de réservation", montant: 0, categorie: "reputation", pourquoi: "L'opinion publique faite des avis de tous : la réputation, ici en ligne." },
      ],
      relance: "Demandez-vous : est-ce être connu, ce qu'on évoque, le jugement d'un client sur son séjour, ou l'opinion de tous ?",
      explication: () => [
        "La valeur perçue se construit dans l'esprit des clients : il faut être connu (la notoriété), évoquer quelque chose de juste (l'image), tenir sa promesse à chaque séjour (la satisfaction). Les avis publiés, les recommandations d'un client à un autre et les indicateurs des médias sociaux (abonnés, mentions, partages) font la réputation, que lisent les clients suivants. Certains se comptent (une note, un nombre d'avis), d'autres se lisent (ce que disent les commentaires) : la valeur perçue se mesure par des indicateurs quantitatifs et qualitatifs.",
      ],
    },
    {
      id: "les-avis",
      objectifs: [1],
      type: "montants",
      titre: "Mesurer la satisfaction",
      notions: ["brand_capital"],
      tableau: lesAvis,
      question: () => "À partir des avis de l'année, calculez la note moyenne (au centième) et le taux de satisfaction, la part des avis à 4 ou 5 étoiles (au dixième de point).",
      champs: () => {
        const k = valeurDeLEscale();
        return [
          { libelle: "Note moyenne (sur 5)", attendu: k.noteMoyenne, calcul: `(5 × ${qte(AVIS_DE_L_ESCALE[5])} + 4 × ${qte(AVIS_DE_L_ESCALE[4])} + 3 × ${qte(AVIS_DE_L_ESCALE[3])} + 2 × ${qte(AVIS_DE_L_ESCALE[2])} + 1 × ${qte(AVIS_DE_L_ESCALE[1])}) ÷ ${qte(k.nombreDAvis)} = ${qte(k.points)} ÷ ${qte(k.nombreDAvis)} = ${note(k.noteMoyenne)}` },
          { libelle: "Taux de satisfaction (%)", attendu: k.tauxDeSatisfactionPct, calcul: `(${qte(AVIS_DE_L_ESCALE[5])} + ${qte(AVIS_DE_L_ESCALE[4])}) ÷ ${qte(k.nombreDAvis)} × 100 = ${pct(k.tauxDeSatisfactionPct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const k = valeurDeLEscale();
        return [
          `${pct(k.tauxDeSatisfactionPct)} des clients sont satisfaits, pour une note moyenne de ${note(k.noteMoyenne)}. Les ${qte(AVIS_DE_L_ESCALE[1] + AVIS_DE_L_ESCALE[2])} avis à une ou deux étoiles pèsent plus que leur nombre : ce sont eux que lisent d'abord les clients qui hésitent, et la réponse que l'hôtel leur fait compte aussi.`,
        ];
      },
    },
    {
      id: "prix-et-qualite",
      objectifs: [2],
      type: "choix",
      titre: "Le prix et la qualité perçue",
      tableau: lesTroisHotels,
      question: (c) => `Face à ses deux concurrents, où se place ${c.entreprise} ?`,
      options: () => [
        { texte: "Entre les deux : un prix et une note intermédiaires", juste: true, retour: "Oui : Le Comptoir est moins cher et moins bien noté, le Terminus plus cher et mieux noté. Un client compare ce qu'il paie à la qualité qu'il perçoit : c'est le rapport qualité-prix, et chaque hôtel en promet un." },
        { texte: "Le plus cher, puisque sa note est la meilleure des trois", juste: false, retour: "Non : le Terminus est à la fois plus cher et mieux noté. L'ESCALE est au milieu, sur le prix comme sur la note." },
        { texte: "Le moins bien placé : ni le moins cher, ni le mieux noté des trois", juste: false, retour: "Non : être au milieu est une position, celle d'un bon rapport qualité-prix. Les clients qui la cherchent la choisissent." },
      ],
    },
    {
      id: "le-prix-plancher",
      objectifs: [2],
      type: "curseur",
      titre: "Le plus bas prix de l'hiver",
      notions: ["full_unit_cost"],
      sens: "plus-petite",
      question: (c) => {
        const k = coutCompletDUneNuitee(HIVER);
        return `L'hiver, ${c.entreprise} vend ${qte(k.vendues)} nuitées. Chacune coûte ${eur(L_ESCALE.coutVariableParNuitee)}, et les charges fixes du trimestre sont de ${eur(L_ESCALE.chargesFixesParTrimestre)}. À demande égale, faites varier le prix de la nuitée : une droite donne le chiffre d'affaires, l'autre le coût de l'hiver. Placez le curseur sur le plus bas prix, à l'euro, qui couvre le coût complet.`;
      },
      grandeur: () => ({ libelle: "Prix de la nuitée", unite: "€" }),
      cible: () => ({ attendu: prixPlancher(HIVER), min: 60, max: 100 }),
      zones: ["Le prix couvre le coût complet", "Le prix ne couvre pas le coût complet"],
      rates: () => ({ dessous: "À ce prix, l'hiver ne couvre pas ses coûts.", dessus: "L'hiver couvre déjà ses coûts à un prix plus bas : cherchez plus bas." }),
      montrer: "Montrer le prix",
      lecture: (_c, p) => {
        const k = resultatADemandeEgale(HIVER, p);
        return [
          { libelle: "Chiffre d'affaires de l'hiver", montant: k.chiffreDAffaires },
          { libelle: "Coût de l'hiver", montant: k.couts },
          { libelle: "Résultat de l'hiver", montant: k.resultat, fort: true },
        ];
      },
      droites: () => ({
        produit: (p) => resultatADemandeEgale(HIVER, p).chiffreDAffaires,
        cout: () => resultatADemandeEgale(HIVER, 0).couts,
        libelles: ["Chiffre d'affaires de l'hiver", "Coût de l'hiver"],
      }),
      explication: (c) => {
        const k = coutCompletDUneNuitee(HIVER);
        const [comptoir] = L_ESCALE.concurrents;
        return [
          `Une nuitée d'hiver coûte ${eur(k.coutComplet)} à ${c.entreprise} : sous ${eur(prixPlancher(HIVER))}, l'hiver perd de l'argent. ${comptoir!.nom} affiche ${eur(comptoir!.prix[0]!)} : ${c.entreprise} ne peut pas le suivre sans vendre sous son coût.`,
          "Le prix se tient entre deux bornes : le coût, en dessous duquel l'hôtel perd, et la valeur que le client perçoit, au-dessus de laquelle il part. La qualité perçue est ce qui écarte ces deux bornes.",
        ];
      },
    },
    {
      id: "valeur-actionnariale",
      objectifs: [3],
      type: "choix",
      titre: "Valeur actionnariale et valeur boursière",
      question: (c) => `${c.entreprise} est une SARL : ses parts ne s'achètent pas en bourse. Qu'est-ce que ses associés appellent la valeur de leur placement ?`,
      options: () => [
        { texte: "Les dividendes reçus, et ce que valent leurs parts", juste: true, retour: "Oui : c'est la valeur actionnariale, ce que l'entreprise rapporte à ceux qui y ont placé leur argent. Pour une société cotée en bourse, la valeur boursière s'y ajoute : le cours de l'action × le nombre d'actions, que le marché fixe chaque jour selon ce qu'il attend des résultats." },
        { texte: "La valeur boursière, que le marché fixe chaque jour pour toutes les sociétés", juste: false, retour: "Non : seules les sociétés cotées ont une valeur boursière. Les parts d'une SARL se vendent de gré à gré, entre associés ou à un repreneur." },
        { texte: "Le chiffre d'affaires de l'année, qui leur revient en entier", juste: false, retour: "Non : le chiffre d'affaires paie d'abord les salariés, les fournisseurs et l'État ; les associés n'ont droit qu'à ce qui reste." },
      ],
    },
    {
      id: "des-valeurs-qui-s-opposent",
      objectifs: [0],
      type: "choix",
      titre: "Quand les valeurs s'opposent",
      question: () => "Un associé propose de supprimer le petit-déjeuner servi en salle et de le remplacer par un distributeur : le résultat monterait. Que risque l'hôtel ?",
      options: () => [
        { texte: "De gagner en valeur financière et d'en perdre en valeur perçue", juste: true, retour: "Oui : l'économie se lit tout de suite dans le résultat ; la perte de qualité se lit ensuite dans les avis, puis dans les nuitées vendues. Les formes de la valeur ne montent pas toujours ensemble." },
        { texte: "Rien : le résultat monte, et c'est la seule valeur qui compte pour un hôtel", juste: false, retour: "Non : le résultat de demain dépend des clients d'aujourd'hui. Une valeur perçue qui baisse finit par faire baisser la valeur financière." },
        { texte: "De perdre ses salariés de salle, qui préfèrent servir", juste: false, retour: "Ce n'est pas le premier risque : c'est la qualité perçue par les clients, et leurs avis, qui sont en jeu." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = valeurDeLEscale();
        return [
          `${c.entreprise} crée de la valeur pour toutes ses parties prenantes : ${pct(k.partDesSalariesPct)} de son chiffre d'affaires revient à ses salariés, ${pct(k.partDesAssociesPct)} reste à ses associés avant l'impôt. Ses clients la perçoivent : ${pct(k.tauxDeSatisfactionPct)} de satisfaits, une note de ${note(k.noteMoyenne)}.`,
          `Le prix se tient entre le coût (${eur(coutCompletDUneNuitee(HIVER).coutComplet)} la nuitée d'hiver) et la valeur perçue. La valeur actionnariale se lit dans les dividendes et la valeur des parts ; la valeur boursière, pour une société cotée, dans son cours. Dans l'arène, l'hôtel fixe son prix à chaque tour : ses clients répondent à ce qu'ils perçoivent.`,
        ];
      },
      repere: () => "Le prix doit couvrir le coût ; la valeur perçue doit justifier le prix.",
    },
  ],
};
