import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { L_ESCALE } from "../monde/l-escale";
import { LA_TABLE_D_AUGUSTIN } from "../monde/la-table-d-augustin";
import {
  CHAMBRE_AFFAIRES,
  ETE,
  FORFAIT_WEEK_END,
  HIVER,
  PRIX_D_ETE_DU_LABORATOIRE,
  anneeAuPrixUnique,
  baisseDeLaDemande,
  chambreAffaires,
  forfaitWeekEnd,
  margeDUneNuitee,
  nuiteesDuTrimestre,
  prixDEteQuiRemplit,
  prixDesConcurrents,
  trimestreAuPrix,
} from "../monde/tarifs-de-l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LES POLITIQUES TARIFAIRES (Bac STMG, mercatique de terminale, thème 1, question 1.3 : « Le
 * prix, entre raison et illusion ? »).
 *
 * « Le prix psychologique » et « La demande répond au prix » traitent l'illusion et la sensibilité au
 * prix chez NOVA. Ce chapitre traite la raison : un hôtel qui garde le même prix toute l'année refuse
 * des clients l'été et laisse des chambres vides l'hiver. Il calcule la marge et le taux de marge d'une
 * nuitée, lit la sensibilité de la demande, passe du prix unique au prix différencié, puis au yield
 * management (le laboratoire cherche le prix d'été le plus haut qui remplit encore l'hôtel), construit
 * un forfait pour l'hiver, dit ce que finance une gratuité, et part d'un prix cible pour fixer le coût
 * à ne pas dépasser.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/tarifs-de-l-escale.ts), chez L'ESCALE seule : l'année
 * de la fiche et son modèle (hotel.ts) ; le forfait, la chambre affaires et le congrès du cas sont des
 * hypothèses nommées dans la fiche.
 */

export const ENTREPRISES_DES_TARIFS = ["hotel"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;

const NOMS_DES_TRIMESTRES = ["Hiver", "Printemps", "Été", "Automne"] as const;

function lAnnee(): TableauDeDonnees {
  const a = anneeAuPrixUnique();
  return {
    titre: `L'année à ${eur(L_ESCALE.prixDeLAnnee)} la nuitée, trimestre par trimestre`,
    colonnes: [...NOMS_DES_TRIMESTRES],
    lignes: [
      { libelle: "Nuitées demandées", valeurs: a.map((t) => qte(t.demande)) },
      { libelle: "Nuitées offertes", valeurs: a.map((t) => qte(t.offertes)) },
      { libelle: "Nuitées vendues", valeurs: a.map((t) => qte(t.vendues)) },
    ],
  };
}

const HAUSSE_ESSAYEE = 0.1;

export const LES_POLITIQUES_TARIFAIRES: Chapitre = {
  code: "les-politiques-tarifaires",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre"],
  titre: "Les politiques tarifaires : prix différencié, yield management, forfait",
  accroche:
    "Un hôtel au même prix toute l'année refuse des clients l'été et garde des chambres vides l'hiver. Faire payer selon le moment, réunir plusieurs prestations dans un forfait, offrir ce qui attire, et partir du prix que la cible accepte.",
  objectifs: [
    "Calculer la marge et le taux de marge d'une prestation",
    "Lire la sensibilité de la demande au prix",
    "Passer du prix unique au prix différencié et au yield management",
    "Construire un forfait et dire ce que finance une gratuité",
    "Partir du prix cible pour fixer le coût à ne pas dépasser",
  ],
  libre: false,
  prerequis: ["demande-et-prix"],
  entreprises: {
    codes: ENTREPRISES_DES_TARIFS,
    pourquoi: "ce chapitre lit l'année de L'ESCALE, trimestre par trimestre, et les clientèles qui remplissent ou non ses chambres.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un seul prix toute l'année",
      notions: ["seasonality", "occupancy_revpar"],
      tableau: lAnnee,
      texte: (c) => {
        const a = anneeAuPrixUnique();
        return [
          `${c.entreprise} compte ${qte(L_ESCALE.chambres)} chambres et affiche ${eur(L_ESCALE.prixDeLAnnee)} la nuitée toute l'année. L'été, ${qte(a[ETE - 1]!.demande)} nuitées sont demandées ; l'hiver, ${qte(a[HIVER - 1]!.demande)} seulement, pour ${qte(nuiteesDuTrimestre())} offertes chaque trimestre.`,
          "Le prix unique est simple à afficher et facile à comprendre. Il a un coût : il ne suit pas la demande.",
        ];
      },
      repere: () => "Prix unique : le même pour tous, à tout moment. Prix différencié : un prix qui change selon le client, le moment ou la quantité achetée, pour la même prestation.",
    },
    {
      id: "la-marge",
      objectifs: [0],
      type: "montants",
      titre: "Ce que laisse une nuitée",
      notions: ["margin_rates", "contribution_margin"],
      question: () => `Une nuitée occupée coûte ${eur(L_ESCALE.coutVariableParNuitee)} (ménage, linge, petit-déjeuner). Calculez la marge d'une nuitée vendue ${eur(L_ESCALE.prixDeLAnnee)}, puis le taux de marge, rapporté à ce coût, en pourcentage.`,
      champs: () => {
        const m = margeDUneNuitee();
        return [
          { libelle: "Marge d'une nuitée", attendu: m.marge, calcul: `${eur(m.prix)} − ${eur(m.cout)} = ${eur(m.marge)}` },
          { libelle: "Taux de marge (%)", attendu: m.tauxDeMarge, tolerance: 0.1, calcul: `${eur(m.marge)} ÷ ${eur(m.cout)} × 100 = ${pct(m.tauxDeMarge)}` },
        ];
      },
      explication: () => {
        const m = margeDUneNuitee();
        return [`Chaque nuitée vendue laisse ${eur(m.marge)} pour payer le personnel, le loyer et l'entretien, qui ne bougent pas. Une chambre vide ne coûte presque rien de plus, mais ne rapporte rien : la remplir, même moins cher, rapporte tant que le prix dépasse ${eur(m.cout)}.`];
      },
    },
    {
      id: "la-sensibilite",
      objectifs: [1],
      type: "choix",
      titre: "La demande répond au prix",
      notions: ["price_elasticity"],
      question: () => `La demande de l'hôtel a une élasticité de ${L_ESCALE.elasticite.toLocaleString("fr-FR").replace(/^-/, "−")} : un prix plus haut de 1 % fait perdre environ ${Math.abs(L_ESCALE.elasticite).toLocaleString("fr-FR")} % de la demande. Que devient la demande si l'hôtel monte son prix de ${pct(HAUSSE_ESSAYEE * 100)} ?`,
      options: () => [
        { texte: `Elle baisse d'environ ${pct(baisseDeLaDemande(HAUSSE_ESSAYEE))}`, juste: true, retour: `Oui : la demande perd ${pct(baisseDeLaDemande(HAUSSE_ESSAYEE))}, un peu plus que la hausse du prix. Les clients de l'hôtel sont sensibles au prix : ils comparent, et partent chez un concurrent.` },
        { texte: `Elle baisse de ${pct(HAUSSE_ESSAYEE * 100)}, comme le prix`, juste: false, retour: "Non : avec une élasticité plus forte que 1 en valeur absolue, la demande baisse plus vite que le prix ne monte." },
        { texte: "Elle ne bouge pas : un client garde son hôtel", juste: false, retour: "Non : la plupart des clients comparent les prix avant de réserver. Seule une partie reste fidèle quoi qu'il arrive." },
      ],
    },
    {
      id: "refusees-et-vides",
      objectifs: [1, 2],
      type: "montants",
      titre: "Ce que coûte le prix unique",
      notions: ["seasonality", "occupancy_revpar"],
      tableau: lAnnee,
      question: () => "Calculez les nuitées refusées l'été (demandées au-delà de ce que l'hôtel offre), puis les nuitées restées vides l'hiver.",
      champs: () => {
        const e = trimestreAuPrix(ETE);
        const h = trimestreAuPrix(HIVER);
        return [
          { libelle: "Nuitées refusées l'été", attendu: e.refusees, calcul: `${qte(e.demande)} − ${qte(e.offertes)} = ${qte(e.refusees)}` },
          { libelle: "Nuitées vides l'hiver", attendu: h.vides, calcul: `${qte(h.offertes)} − ${qte(h.vendues)} = ${qte(h.vides)}` },
        ];
      },
      explication: () => {
        const e = trimestreAuPrix(ETE);
        const h = trimestreAuPrix(HIVER);
        return [`L'été, ${qte(e.refusees)} nuitées sont refusées : des clients auraient payé plus cher. L'hiver, ${qte(h.vides)} restent vides : un prix plus bas en aurait rempli une partie. Le même prix est trop bas l'été, et trop haut l'hiver.`];
      },
    },
    {
      id: "differencier",
      objectifs: [2],
      type: "choix",
      titre: "Un prix selon la saison",
      notions: ["seasonality", "price_elasticity"],
      question: () => "Que faire du prix pour mieux suivre la demande ?",
      options: () => [
        { texte: "Le monter l'été, le baisser l'hiver", juste: true, retour: "Oui : c'est un prix différencié selon le moment. L'été, un prix plus haut garde les clients qui le paient et ne refuse plus que ceux qui ne le paieraient pas. L'hiver, un prix plus bas attire des clients qui ne seraient pas venus." },
        { texte: "Le baisser toute l'année pour attirer plus", juste: false, retour: "Non : l'été, l'hôtel est déjà plein. Baisser le prix n'y vendrait pas une nuitée de plus, et chaque nuitée y rapporterait moins." },
        { texte: "Le monter toute l'année : la demande est forte", juste: false, retour: "Non : elle n'est forte que l'été. L'hiver, un prix plus haut viderait encore des chambres déjà vides." },
      ],
    },
    {
      id: "le-laboratoire-de-l-ete",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire du prix d'été",
      notions: ["occupancy_revpar", "price_elasticity", "seasonality"],
      question: (c) =>
        `Faites varier le prix de la nuitée l'été. Le tableau donne la demande (qui baisse quand le prix monte), les nuitées vendues, les clients refusés et le chiffre d'affaires du trimestre. Le graphique montre la demande face aux ${qte(nuiteesDuTrimestre())} nuitées qu'offre ${c.entreprise}. Relevez le défi.`,
      leviers: () => [{ code: "prix", libelle: "Prix de la nuitée l'été", unite: "€", ...PRIX_D_ETE_DU_LABORATOIRE, depart: L_ESCALE.prixDeLAnnee }],
      lecture: (_c, p) => {
        const t = trimestreAuPrix(ETE, p.prix!);
        const d = trimestreAuPrix(ETE);
        return [
          { libelle: "Nuitées demandées", montant: t.demande, unite: "nuitées", reference: d.demande },
          { libelle: "Nuitées vendues", montant: t.vendues, unite: "nuitées", reference: d.vendues },
          { libelle: "Nuitées refusées", montant: t.refusees, unite: "nuitées", reference: d.refusees },
          { libelle: "Nuitées vides", montant: t.vides, unite: "nuitées", reference: d.vides },
          { libelle: "Chiffre d'affaires de l'été", montant: t.chiffreDAffaires, reference: d.chiffreDAffaires, fort: true },
        ];
      },
      graphique: () => ({
        levier: "prix",
        unite: "nuitées",
        courbes: [
          { libelle: "Nuitées demandées", valeur: (p) => trimestreAuPrix(ETE, p.prix!).demande },
          { libelle: "Nuitées offertes", valeur: () => nuiteesDuTrimestre() },
        ],
      }),
      defi: () => {
        const juste = prixDEteQuiRemplit();
        return {
          consigne: "Trouvez le prix d'été le plus haut, à l'euro, auquel l'hôtel reste plein : aucune chambre vide.",
          atteint: (p) => p.prix === juste,
          indice: (p) => {
            const t = trimestreAuPrix(ETE, p.prix!);
            return t.vides > 0
              ? `À ${eur(p.prix!)}, ${qte(t.vides)} nuitées restent vides : le prix est trop haut.`
              : `À ${eur(p.prix!)}, l'hôtel est plein et refuse encore ${qte(t.refusees)} nuitées : un prix plus haut le remplirait-il encore ?`;
          },
          solution: { prix: juste },
        };
      },
      montrer: "Montrer le prix",
      explication: (_c, p) => {
        const t = trimestreAuPrix(ETE, p.prix!);
        const d = trimestreAuPrix(ETE);
        const apres = trimestreAuPrix(ETE, p.prix! + 1);
        return [
          `Défi relevé : à ${eur(p.prix!)}, l'hôtel reste plein et l'été rapporte ${eur(t.chiffreDAffaires)}, ${eur(t.chiffreDAffaires - d.chiffreDAffaires)} de plus qu'au prix unique, pour les mêmes nuitées vendues. À ${eur(p.prix! + 1)}, ${qte(apres.vides)} nuitées resteraient vides.`,
          "Vendre chaque chambre au prix le plus haut que la demande accepte, au bon moment : c'est le principe du yield management.",
        ];
      },
    },
    {
      id: "le-yield-management",
      objectifs: [2],
      type: "choix",
      titre: "Le yield management",
      notions: ["occupancy_revpar"],
      question: (c) => `Le yield management, ou gestion du rendement, va plus loin qu'un prix par saison. Que fait ${c.entreprise} quand elle le pratique ?`,
      options: () => [
        { texte: "Elle change le prix selon le remplissage prévu", juste: true, retour: "Oui : le prix d'une même chambre change selon la date, le remplissage déjà atteint et le délai avant l'arrivée. Une chambre vide ne se stocke pas : le soir venu, elle est perdue." },
        { texte: "Elle donne le même prix à tous, réservé tôt ou tard", juste: false, retour: "Non : c'est le prix unique. Le yield management fait payer différemment selon le moment de la réservation." },
        { texte: "Elle baisse le prix chaque fois qu'un concurrent le baisse", juste: false, retour: "Non : c'est s'aligner sur la concurrence. Le yield management part de sa propre demande et de ses chambres libres." },
      ],
    },
    {
      id: "le-forfait",
      objectifs: [3],
      type: "montants",
      titre: "Un forfait pour l'hiver",
      notions: ["contribution_margin"],
      question: () => {
        const f = FORFAIT_WEEK_END;
        return `Pour remplir l'hiver, l'hôtel propose un forfait week-end : ${qte(f.nuitees)} nuitées et ${qte(f.diners)} dîners à LA TABLE D'AUGUSTIN, pour ${eur(f.prix)}. Le bistrot vend un dîner ${eur(LA_TABLE_D_AUGUSTIN.prixDeLAnnee)} et le cède à l'hôtel pour ${eur(f.prixDuDinerAchete)}. Calculez ce que le client paierait sans forfait, puis la marge que le forfait laisse à l'hôtel.`;
      },
      champs: () => {
        const k = forfaitWeekEnd();
        return [
          { libelle: "Prix sans forfait", attendu: k.sansForfait, calcul: `${qte(k.nuitees)} × ${eur(L_ESCALE.prixDeLAnnee)} + ${qte(k.diners)} × ${eur(LA_TABLE_D_AUGUSTIN.prixDeLAnnee)} = ${eur(k.sansForfait)}` },
          { libelle: "Marge du forfait", attendu: k.marge, calcul: `${eur(k.prix)} − (${qte(k.nuitees)} × ${eur(L_ESCALE.coutVariableParNuitee)} + ${qte(k.diners)} × ${eur(k.prixDuDinerAchete)}) = ${eur(k.marge)}` },
        ];
      },
      explication: () => {
        const k = forfaitWeekEnd();
        return [`Le client économise ${eur(k.economie)} et n'a qu'un prix à regarder. L'hôtel garde ${eur(k.marge)}, moins que ${qte(k.nuitees)} nuitées vendues seules (${eur(k.margeDesNuiteesSeules)}) ; mais l'hiver, ces chambres seraient restées vides.`];
      },
    },
    {
      id: "pourquoi-un-forfait",
      objectifs: [3],
      type: "choix",
      titre: "Pourquoi un forfait",
      notions: ["seasonality"],
      question: () => "Pourquoi le forfait se vend-il l'hiver, et pas l'été ?",
      options: () => {
        const e = trimestreAuPrix(ETE);
        const h = trimestreAuPrix(HIVER);
        return [
          { texte: "L'hiver, il remplit des chambres vides", juste: true, retour: `Oui : l'hiver, ${qte(h.vides)} nuitées sont vides ; chaque forfait vendu y ajoute de la marge. L'été, l'hôtel est plein : un forfait y prendrait la place d'un client qui paie le prix entier.` },
          { texte: "L'été, les clients n'aiment pas les forfaits", juste: false, retour: `Non : ce n'est pas un goût des clients. L'été, l'hôtel refuse déjà ${qte(e.refusees)} nuitées : il n'a pas besoin de vendre moins cher.` },
          { texte: "Un forfait se vend toujours à perte", juste: false, retour: `Non : celui-ci laisse ${eur(forfaitWeekEnd().marge)} à l'hôtel. Il rapporte moins par nuitée, pas rien.` },
        ];
      },
    },
    {
      id: "la-gratuite",
      objectifs: [3],
      type: "choix",
      titre: "Ce qui est offert",
      notions: ["contribution_margin"],
      question: (c) => `${c.entreprise} offre le petit-déjeuner aux enfants qui dorment dans la chambre de leurs parents. Une gratuité ne coûte-t-elle rien ?`,
      options: () => [
        { texte: "Si : elle se paie par le prix des parents", juste: true, retour: "Oui : le petit-déjeuner a un coût, compris dans les coûts d'une nuitée. La gratuité attire les familles, et c'est le prix de la chambre qui la finance." },
        { texte: "Non : ce qui est offert ne coûte rien", juste: false, retour: "Non : les produits du petit-déjeuner s'achètent. Rien n'est gratuit pour l'entreprise : ce qu'elle offre se paie ailleurs." },
        { texte: "Si, et elle fait perdre de l'argent sur chaque famille", juste: false, retour: "Non : la famille paie la chambre, dont la marge couvre largement un petit-déjeuner. La gratuité est un argument, financé par le reste de l'offre." },
      ],
    },
    {
      id: "le-prix-cible",
      objectifs: [4],
      type: "montants",
      titre: "Partir du prix cible",
      notions: ["price_floor", "margin_rates"],
      question: () => {
        const k = CHAMBRE_AFFAIRES;
        return `L'hôtel prépare une chambre affaires, avec un bureau et un départ tardif. Les entreprises remboursent au plus ${eur(k.prixCible)} la nuitée à leurs salariés : c'est le prix cible. L'hôtel veut garder ${eur(k.margeVisee)} de marge par nuitée. Calculez le coût à ne pas dépasser (le coût cible), puis le coût prévu : ${eur(L_ESCALE.coutVariableParNuitee)} par nuitée, plus ${eur(k.coutDesServices)} pour le bureau et le départ tardif.`;
      },
      champs: () => {
        const k = chambreAffaires();
        return [
          { libelle: "Coût cible", attendu: k.coutCible, calcul: `${eur(k.prixCible)} − ${eur(k.margeVisee)} = ${eur(k.coutCible)}` },
          { libelle: "Coût prévu", attendu: k.coutPrevu, calcul: `${eur(L_ESCALE.coutVariableParNuitee)} + ${eur(k.coutDesServices)} = ${eur(k.coutPrevu)}` },
        ];
      },
      explication: () => {
        const k = chambreAffaires();
        return [
          k.tient
            ? `Le coût prévu, ${eur(k.coutPrevu)}, reste sous le coût cible, ${eur(k.coutCible)} : la chambre affaires peut se vendre au prix que les entreprises acceptent, et laisse ${eur(k.margeAuPrixCible)}.`
            : `Le coût prévu, ${eur(k.coutPrevu)}, dépasse le coût cible, ${eur(k.coutCible)} : il faut revoir les services avant de lancer la chambre.`,
        ];
      },
    },
    {
      id: "raison-et-illusion",
      objectifs: [4],
      type: "choix",
      titre: "Le prix, entre raison et illusion ?",
      notions: ["psych_price", "price_floor"],
      question: () => {
        const [comptoir, terminus] = prixDesConcurrents(ETE);
        return `La question du programme : le prix, entre raison et illusion ? Le Comptoir affiche ${eur(comptoir!.prix)} et ${terminus!.nom} ${eur(terminus!.prix)} l'été. Comment se fixe un prix ?`;
      },
      options: () => [
        { texte: "Entre le coût, la demande et les concurrents", juste: true, retour: "Oui : le coût fixe le plancher (la raison), la demande et le prix que la cible accepte fixent le plafond, les concurrents situent l'offre. Et la façon d'afficher le prix (un forfait, une gratuité, un prix rond ou non) joue sur la perception : l'illusion." },
        { texte: "À partir du seul coût, plus une marge", juste: false, retour: "Non : un prix calculé sur le coût seul ignore ce que les clients acceptent de payer. L'été, il laisserait de l'argent ; l'hiver, il viderait des chambres." },
        { texte: "En copiant le prix du concurrent le moins cher", juste: false, retour: "Non : les clients ne comparent pas que les prix. L'hôtel le moins cher n'est pas le mieux placé pour tous." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["occupancy_revpar", "seasonality", "price_floor"],
      texte: (c) => {
        const e = trimestreAuPrix(ETE, prixDEteQuiRemplit());
        return [
          `Le prix unique de ${c.entreprise} est trop bas l'été et trop haut l'hiver. À ${eur(e.prix)}, l'été reste plein et rapporte plus ; l'hiver se remplit avec un forfait. La gratuité attire, financée par le reste de l'offre, et le prix cible fixe le coût à tenir.`,
          "Dans l'arène, relevez à chaque tour les clients refusés et les chambres vides : ils disent si votre prix suit la demande.",
        ];
      },
      repere: () => "Taux de marge = marge ÷ coût × 100. Yield management : le prix le plus haut que la demande accepte, au bon moment. Coût cible = prix cible − marge visée.",
    },
  ],
};
