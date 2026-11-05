import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { canalDe, coutDAcquisition } from "../monde/relation-client";
import {
  DUREE_DE_CONSERVATION_D_UN_PROSPECT,
  FICHIER_DE_PROSPECTION,
  OBJECTIF_DE_COMPTES_NEUFS,
  SEUILS_RFM,
  aRebours,
  comptesNeufsDuSegment,
  marcheDAtlas,
  qualiteDuFichier,
  scoreRFM,
  segmentDuCompte,
  tauxDuSegment,
  valeurVieDUnGroupe,
} from "../monde/terrain-d-atlas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DE_LA_VALEUR, POURQUOI_LE_CABINET, ficheDe } from "./valeur-d-un-client";

/**
 * CHAPITRE : LE FICHIER : QUALIFIER, SEGMENTER, CIBLER (BTS NDRC, blocs 1 et 2, palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : le cabinet ATLAS
 * CONSEIL a une fiche figée (monde/atlas-conseil.ts), et son marché, son fichier de prospection et le
 * score RFM de ses comptes se calculent par monde/terrain-d-atlas.ts, partie 1 et 2. Une évolution du
 * moteur ne change rien ici.
 *
 * L'objet : avant de prospecter, savoir qui. Le marché du cabinet en quatre segments par la taille, ce
 * qu'il en prend ; ce que vaut un compte de chaque segment face aux 15 000 € qu'il coûte à gagner ; un
 * fichier de 2 200 lignes, dont 6 sur 10 seulement sont utilisables une fois retirés les doublons, les
 * incomplets, les contacts hors cible et ceux que le RGPD fait supprimer ; le score RFM des 32 comptes,
 * qui voit ce que la méthode ABC ne voit pas (un compte neuf qui ne recommande pas) ; puis, à rebours, les
 * contacts qualifiés qu'il faut pour gagner 8 comptes, face à ceux du fichier. La décision : le segment
 * que Hugo, le commercial de la conquête, prospecte en N + 1.
 *
 * Le piège central : le nombre. Les petites PME sont trois fois plus nombreuses et remplissent le
 * fichier ; mais un compte y laisse 2 510,77 € par an, et sa valeur vie ne paie pas son coût d'acquisition.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, le-marche, la-cible, la-valeur-d-un-compte (la formule est au repère ou dans la question) ;
 *   · l'expérience avant la formule : predire-le-fichier puis trier-le-fichier avant la-qualite-du-fichier ;
 *     predire-les-contacts puis le-laboratoire-du-ciblage (taux de rendez-vous et de signature, avec le
 *     graphique des contacts nécessaires face au fichier) avant a-rebours ;
 *   · autonome : le-score-rfm, a-rebours (ni formule ni chiffres donnés, la correction montre le chemin) ;
 *   · expert : rfm-et-abc (le jugement), mieux-qualifier (une variante chiffrée), le-segment-de-hugo ;
 *     puis la synthèse.
 */

/** Les leviers du laboratoire du ciblage, en pourcentage : le taux de rendez-vous et le taux de signature des devis. */
export const LEVIERS_DU_CIBLAGE = {
  rendezVous: { min: 5, max: 25, pas: 1 },
  signature: { min: 20, max: 50, pas: 5 },
} as const;

/**
 * LA VARIANTE, hypothèse du cours : un fichier mieux qualifié (le décideur nommé, son besoin noté avant
 * l'appel) fait accepter un rendez-vous à 20 % des contacts appelés, au lieu de 10 %.
 */
export const TAUX_DE_RENDEZ_VOUS_QUALIFIE = 0.2;

/** Le fichier se lit sur les comptes et les canaux du cabinet du cours, ATLAS CONSEIL. */
export const ENTREPRISES_DU_FICHIER: readonly string[] = ENTREPRISES_DE_LA_VALEUR;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 1) => `${(Math.round(x * 100 * 10 ** d) / 10 ** d + 0).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auCentiemeDePct = (x: number) => Math.round(x * 10_000) / 100 + 0;
/** « d'ATLAS CONSEIL », « de NOVA » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le fichier et la cible du cabinet : tout ce que le chapitre et son cas demandent. */
export function fichierDuCabinet(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const marche = marcheDAtlas(f);
  const petites = marche.de("petites-pme");
  const moyennes = marche.de("pme-moyennes");
  const grands = marche.de("grands-comptes");
  const publics = marche.de("public");
  const cac = coutDAcquisition(f).cac;
  const valeurPetite = valeurVieDUnGroupe(f.comptes.filter((k) => segmentDuCompte(k) === "petites-pme"));
  const neufsMoyens = comptesNeufsDuSegment(f, "pme-moyennes");
  const valeurNeuveMoyenne = valeurVieDUnGroupe(neufsMoyens);
  const q = qualiteDuFichier();
  const rfm = scoreRFM(f);
  const t = tauxDuSegment("pme-moyennes");
  const rebours = aRebours();
  const qualifie = aRebours({ tauxDeRendezVous: TAUX_DE_RENDEZ_VOUS_QUALIFIE });
  const utilisables = FICHIER_DE_PROSPECTION.utilisablesParSegment["pme-moyennes"];
  const comptesAvecLeFichierQualifie = auCentime(utilisables * TAUX_DE_RENDEZ_VOUS_QUALIFIE * t.devisParRendezVous * t.tauxDeSignature);
  const prospection = canalDe(f, "prospection");
  return {
    f,
    marche,
    petites,
    moyennes,
    grands,
    publics,
    cac,
    valeurPetite,
    neufsMoyens,
    valeurNeuveMoyenne,
    q,
    rfm,
    t,
    rebours,
    qualifie,
    utilisables,
    comptesAvecLeFichierQualifie,
    objectif: OBJECTIF_DE_COMPTES_NEUFS,
    hugo: f.commerciaux.find((k) => k.code === "conquete")!.prenom,
    nadia: f.commerciaux.find((k) => k.code === "entreprises")!.prenom,
    coutDUnContact: auCentime(prospection.cout / prospection.contacts),
  };
}

export type FichierDuCabinet = ReturnType<typeof fichierDuCabinet>;

/** Les contacts nécessaires, devis et rendez-vous pour une position du laboratoire (taux en %). */
export function laboratoireDuCiblage(_x: FichierDuCabinet, rendezVousEnPct: number, signatureEnPct: number) {
  const r = aRebours({ tauxDeRendezVous: rendezVousEnPct / 100, tauxDeSignature: signatureEnPct / 100 });
  return { devis: r.devis, rendezVous: r.rendezVous, contacts: r.contacts, utilisables: r.utilisables, manquants: r.manquants, suffit: r.suffit };
}

/** Le marché du cabinet, segment par segment : le document de départ. */
export function tableauDuMarche(x: FichierDuCabinet): TableauDeDonnees {
  return {
    titre: `Le marché ${dE(x.f.entreprise)}, segment par segment`,
    colonnes: ["Entreprises", "Part qui achète", "Journées par acheteur", "Comptes du cabinet"],
    lignes: x.marche.segments.map((s) => ({ libelle: s.nom, valeurs: [qte(s.entreprises), pct(s.partQuiAchete, 0), qte(s.journeesParAcheteur), qte(s.comptes)] })),
  };
}

/** Les 32 comptes, leur récence, leurs commandes et leur chiffre d'affaires : le document du score RFM. */
export function tableauRFM(x: FichierDuCabinet): TableauDeDonnees {
  return {
    titre: "Les comptes de l'année N, récence, commandes et montant",
    colonnes: ["Récence (mois)", "Commandes", "Chiffre d'affaires"],
    lignes: x.rfm.comptes.map((k) => ({ libelle: k.nom, valeurs: [qte(k.recence), qte(k.commandes), eur(k.chiffreDAffaires)] })),
  };
}

const grille = () =>
  `Récence : 3 jusqu'à ${qte(SEUILS_RFM.recence.trois)} mois, 2 jusqu'à ${qte(SEUILS_RFM.recence.deux)} mois, 1 au-delà. Fréquence : 3 dès ${qte(SEUILS_RFM.frequence.trois)} commandes, 2 dès ${qte(SEUILS_RFM.frequence.deux)}, 1 pour une seule. Montant : 3 dès ${eur(SEUILS_RFM.montant.trois)}, 2 dès ${eur(SEUILS_RFM.montant.deux)}, 1 en dessous.`;

export const LE_FICHIER_ET_LA_CIBLE: Chapitre = {
  code: "le-fichier-et-la-cible",
  parcours: "ndrc",
  palier: 4,
  blocs: ["BTS NDRC Bloc 1 · Relation client et négociation-vente", "BTS NDRC Bloc 2 · Relation client à distance et digitalisation"],
  titre: "Le fichier : qualifier, segmenter, cibler",
  accroche:
    "Avant d'appeler, savoir qui. Le marché du cabinet en segments, ce que vaut un compte de chacun, un fichier dont 6 lignes sur 10 servent, le score RFM des clients, puis les contacts qu'il faut pour gagner 8 comptes.",
  objectifs: [
    "Mesurer un marché par segment et la part qu'y prend l'entreprise",
    "Choisir une cible sur la taille de son marché et la valeur de ses comptes",
    "Qualifier un fichier : doublons, complétude, cible et règles du RGPD",
    "Calculer un score RFM et le croiser avec la méthode ABC",
    "Retrouver à rebours les contacts qualifiés qu'il faut pour gagner des comptes",
  ],
  libre: false,
  prerequis: ["cout-d-acquisition", "portefeuille-abc"],
  ensuite: ["organiser-le-secteur"],
  entreprises: { codes: ENTREPRISES_DU_FICHIER, pourquoi: POURQUOI_LE_CABINET },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le marché du cabinet",
      notions: ["segmentation", "demand_market_share"],
      tableau: (c) => tableauDuMarche(fichierDuCabinet(c)),
      texte: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.f.entreprise}, le cabinet qui vend ses journées de conseil et de formation. En N, il a gagné ${qte(x.objectif)} comptes neufs ; ${x.hugo}, le commercial de la conquête, doit en gagner autant en N + 1. Avant d'appeler, il faut savoir qui appeler.`,
          "La simulation range les entreprises de la région en quatre segments, par leur taille. Pour chacun, elle donne le nombre d'entreprises, la part qui achète du conseil dans l'année, les journées qu'achète une entreprise qui achète, et les comptes que le cabinet y a déjà.",
          `Le fichier de prospection est dans le CRM du cabinet : ${qte(x.q.lignes)} lignes, les contacts de la prospection, des salons et de la campagne digitale de N. Un fichier se qualifie avant de servir, et un client se lit par ce qu'il achète, quand et combien.`,
        ];
      },
      repere: () => "Marché en journées = entreprises × part qui achète × journées par acheteur. Part de marché = journées du cabinet ÷ journées du marché.",
    },
    {
      id: "le-marche",
      objectifs: [0],
      type: "montants",
      titre: "Ce que pèse chaque segment",
      notions: ["segmentation", "demand_market_share"],
      tableau: (c) => tableauDuMarche(fichierDuCabinet(c)),
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Calculez les journées qu'achètent dans l'année les PME moyennes et les ETI, puis les petites PME. Le cabinet leur a vendu ${qte(x.moyennes.journees)} et ${qte(x.petites.journees)} journées : calculez sa part de marché dans chacun des deux segments, en pourcentage au centième.`;
      },
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const m = x.moyennes;
        const p = x.petites;
        return [
          { libelle: "Journées achetées par les PME moyennes et les ETI", attendu: m.journeesDuMarche, calcul: `${qte(m.entreprises)} × ${pct(m.partQuiAchete, 0)} × ${qte(m.journeesParAcheteur)} = ${qte(m.journeesDuMarche)} journées` },
          { libelle: "Journées achetées par les petites PME", attendu: p.journeesDuMarche, calcul: `${qte(p.entreprises)} × ${pct(p.partQuiAchete, 0)} × ${qte(p.journeesParAcheteur)} = ${qte(p.journeesDuMarche)} journées` },
          { libelle: "Part de marché chez les PME moyennes (%)", attendu: auCentiemeDePct(m.partDeMarche), tolerance: 0.05, calcul: `${qte(m.journees)} ÷ ${qte(m.journeesDuMarche)} = ${pct(m.partDeMarche, 2)}` },
          { libelle: "Part de marché chez les petites PME (%)", attendu: auCentiemeDePct(p.partDeMarche), tolerance: 0.05, calcul: `${qte(p.journees)} ÷ ${qte(p.journeesDuMarche)} = ${pct(p.partDeMarche, 2)}` },
        ];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Les petites PME sont ${qte(x.petites.entreprises)}, ${qte(x.petites.entreprises / x.moyennes.entreprises)} fois plus que les PME moyennes ; mais elles n'achètent que ${qte(x.petites.journeesDuMarche)} journées, quand les PME moyennes et les ETI en achètent ${qte(x.moyennes.journeesDuMarche)}. Le nombre d'entreprises ne fait pas la taille d'un marché.`,
          `Le cabinet prend ${pct(x.moyennes.partDeMarche, 2)} du marché des PME moyennes : il lui en reste ${qte(x.moyennes.journeesRestantes)} journées à prendre. Dans le secteur public, il en prend déjà ${pct(x.publics.partDeMarche, 1)}.`,
        ];
      },
    },
    {
      id: "la-cible",
      objectifs: [1],
      type: "choix",
      titre: "Le segment qui laisse le plus à prendre",
      notions: ["segmentation", "demand_market_share"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `${x.hugo} cherche le segment où il reste le plus de journées à prendre, hors des grandes entreprises, que suit déjà le commercial des grands comptes. Lequel lui indiquez-vous ?`;
      },
      options: (c) => {
        const x = fichierDuCabinet(c);
        return [
          {
            texte: "Les PME moyennes et les ETI",
            juste: true,
            retour: `Oui : ${qte(x.moyennes.journeesRestantes)} journées y restent à prendre, contre ${qte(x.petites.journeesRestantes)} chez les petites PME et ${qte(x.publics.journeesRestantes)} dans le public. C'est aussi le segment où le cabinet a gagné ses comptes neufs de N : il y a sa place, celle du cabinet qui forme les managers des entreprises qui grandissent.`,
          },
          {
            texte: `Les petites PME : ${qte(x.petites.entreprises)} entreprises, le plus grand nombre`,
            juste: false,
            retour: `Non : elles sont nombreuses, mais elles n'achètent que ${qte(x.petites.journeesDuMarche)} journées dans l'année. Il n'en reste que ${qte(x.petites.journeesRestantes)} à prendre.`,
          },
          {
            texte: `Le secteur public, où le cabinet prend déjà ${pct(x.publics.partDeMarche, 1)}`,
            juste: false,
            retour: `Non : une forte part de marché dit que le cabinet y est déjà bien placé, pas qu'il y reste le plus à prendre (${qte(x.publics.journeesRestantes)} journées). Et le public achète sur appel d'offres, au prix le plus bas.`,
          },
        ];
      },
    },
    {
      id: "la-valeur-d-un-compte",
      objectifs: [1],
      type: "montants",
      titre: "Ce que vaut un compte du segment",
      notions: ["customer_lifetime_value", "customer_acquisition_cost", "segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Un compte neuf, comme un petit compte, a ${pct(x.valeurNeuveMoyenne.attrition, 0)} de risque de partir chaque année. Calculez la marge moyenne d'une petite PME du portefeuille (${qte(x.valeurPetite.comptes)} comptes), puis sa valeur vie (marge ÷ attrition). Faites de même pour les ${qte(x.valeurNeuveMoyenne.comptes)} PME moyennes gagnées en N.`;
      },
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const p = x.valeurPetite;
        const m = x.valeurNeuveMoyenne;
        return [
          { libelle: "Marge moyenne d'une petite PME", attendu: p.marge, calcul: `${eur(x.petites.marge)} ÷ ${qte(p.comptes)} = ${eur(p.marge)}` },
          { libelle: "Valeur vie d'une petite PME", attendu: p.valeurVie, tolerance: 1, calcul: `${eur(p.marge)} ÷ ${pct(p.attrition, 0)} = ${eur(p.valeurVie)}` },
          { libelle: "Marge moyenne d'une PME moyenne gagnée en N", attendu: m.marge, calcul: `(${x.neufsMoyens.map((k) => eur(k.marge)).join(" + ")}) ÷ ${qte(m.comptes)} = ${eur(m.marge)}` },
          { libelle: "Valeur vie d'une PME moyenne gagnée en N", attendu: m.valeurVie, tolerance: 1, calcul: `${eur(m.marge)} ÷ ${pct(m.attrition, 0)} = ${eur(m.valeurVie)}` },
        ];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Un compte coûte ${eur(x.cac)} à gagner (le chapitre du coût d'acquisition). Une petite PME vaut ${eur(x.valeurPetite.valeurVie)} sur sa vie : la gagner fait perdre de l'argent, même si elle reste client. Une PME moyenne vaut ${eur(x.valeurNeuveMoyenne.valeurVie)} : ${qte(Math.floor((x.valeurNeuveMoyenne.valeurVie / x.cac) * 10) / 10)} fois ce qu'elle coûte.`,
          "Une cible se choisit sur deux chiffres : ce que le segment achète, et ce que vaut un compte qu'on y gagne, face à ce qu'il coûte.",
        ];
      },
    },
    {
      id: "predire-le-fichier",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le fichier",
      notions: ["segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Avant de compter, pariez. Le fichier a ${qte(x.q.lignes)} lignes. Combien ${x.hugo} pourra-t-il en appeler ?`;
      },
      options: () => {
        const voir = "Rangez les lignes du fichier à l'étape suivante : le tri montre ce qui reste.";
        return [
          { texte: "Environ 6 lignes sur 10", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Environ 9 sur 10 : seuls les doublons sautent", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Toutes : ce sont des contacts professionnels", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "trier-le-fichier",
      objectifs: [2],
      type: "tri",
      titre: "Ranger les lignes du fichier",
      notions: ["segmentation"],
      question: () => "Rangez chaque groupe de lignes du fichier : à fusionner, à compléter, à écarter de la cible, à supprimer selon le RGPD, ou à garder pour la prospection.",
      categories: [
        { code: "fusionner", libelle: "Fusionner" },
        { code: "completer", libelle: "Compléter" },
        { code: "ecarter", libelle: "Écarter" },
        { code: "supprimer", libelle: "Supprimer" },
        { code: "garder", libelle: "Garder" },
      ],
      elements: (c) => {
        const x = fichierDuCabinet(c);
        const k = FICHIER_DE_PROSPECTION;
        return [
          { libelle: `${qte(k.doublons)} lignes en double, une entreprise venue par deux canaux`, montant: 0, categorie: "fusionner", pourquoi: "Une entreprise ne se compte qu'une fois : on garde une ligne, et on y réunit ce que les deux savaient." },
          { libelle: `${qte(k.incomplets)} contacts sans nom de décideur ni moyen de le joindre`, montant: 0, categorie: "completer", pourquoi: "Une ligne incomplète ne s'appelle pas, mais elle peut se compléter : une recherche, un appel au standard." },
          { libelle: `${qte(k.horsCible)} contacts de moins de 10 salariés, étudiants ou concurrents`, montant: 0, categorie: "ecarter", pourquoi: "Ils ne sont pas dans la cible du cabinet : les appeler coûte du temps sans espoir de compte." },
          { libelle: `${qte(k.opposes)} prospects qui ont refusé d'être recontactés`, montant: 0, categorie: "supprimer", pourquoi: "Le droit d'opposition du RGPD : un prospect qui le demande ne doit plus être sollicité." },
          {
            libelle: `${qte(k.sansNouvellesDepuisTroisAns)} prospects sans nouvelles depuis plus de ${qte(DUREE_DE_CONSERVATION_D_UN_PROSPECT)} ans`,
            montant: 0,
            categorie: "supprimer",
            pourquoi: `Au-delà de ${qte(DUREE_DE_CONSERVATION_D_UN_PROSPECT)} ans sans contact venu du prospect, la CNIL recommande de supprimer ses données.`,
          },
          { libelle: `${qte(x.q.utilisables)} contacts complets, dans la cible`, montant: 0, categorie: "garder", pourquoi: "Ce sont les contacts que le commercial peut appeler, en rappelant d'où vient le contact et comment s'y opposer." },
        ];
      },
      relance: "Demandez-vous si la ligne peut servir telle quelle, si elle peut servir une fois reprise, ou si la loi interdit de la garder.",
      explication: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Un fichier se qualifie en quatre gestes : dédoublonner, compléter, cibler, et retirer ce que le RGPD interdit de garder. Il reste ${qte(x.q.utilisables)} contacts que ${x.hugo} peut appeler.`,
          "Entre professionnels, appeler ou écrire à l'adresse professionnelle d'un décideur est permis, si le message touche à son métier ; il doit savoir d'où vient le contact et pouvoir s'y opposer à tout moment.",
        ];
      },
    },
    {
      id: "la-qualite-du-fichier",
      objectifs: [2],
      type: "montants",
      titre: "La qualité du fichier",
      notions: ["segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        const k = FICHIER_DE_PROSPECTION;
        return `Sur les ${qte(x.q.lignes)} lignes : ${qte(k.doublons)} doublons, ${qte(k.incomplets)} contacts incomplets, ${qte(k.horsCible)} hors cible, ${qte(k.opposes + k.sansNouvellesDepuisTroisAns)} à supprimer selon le RGPD. Calculez les contacts uniques, le taux de complétude (complets ÷ uniques, en %), les contacts qualifiés, les contacts utilisables, puis leur part dans les lignes du fichier (en %).`;
      },
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const q = x.q;
        const k = FICHIER_DE_PROSPECTION;
        return [
          { libelle: "Contacts uniques", attendu: q.uniques, calcul: `${qte(q.lignes)} − ${qte(k.doublons)} = ${qte(q.uniques)}` },
          { libelle: "Taux de complétude (%)", attendu: auCentiemeDePct(q.tauxDeCompletude), tolerance: 0.05, calcul: `(${qte(q.uniques)} − ${qte(k.incomplets)}) ÷ ${qte(q.uniques)} = ${qte(q.complets)} ÷ ${qte(q.uniques)} = ${pct(q.tauxDeCompletude, 2)}` },
          { libelle: "Contacts qualifiés", attendu: q.qualifies, calcul: `${qte(q.complets)} − ${qte(k.horsCible)} = ${qte(q.qualifies)}` },
          { libelle: "Contacts utilisables", attendu: q.utilisables, calcul: `${qte(q.qualifies)} − ${qte(k.opposes)} − ${qte(k.sansNouvellesDepuisTroisAns)} = ${qte(q.utilisables)}` },
          { libelle: "Part utilisable du fichier (%)", attendu: auCentiemeDePct(q.partUtilisable), tolerance: 0.05, calcul: `${qte(q.utilisables)} ÷ ${qte(q.lignes)} = ${pct(q.partUtilisable, 2)}` },
        ];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        const k = FICHIER_DE_PROSPECTION.utilisablesParSegment;
        return [
          `${pct(x.q.partUtilisable, 0)} du fichier servent. Rangés par segment, les ${qte(x.q.utilisables)} contacts utilisables font ${qte(k["petites-pme"])} petites PME, ${qte(k["pme-moyennes"])} PME moyennes et ETI, ${qte(k["grands-comptes"])} grandes entreprises et ${qte(k.public)} organismes publics.`,
          "Le segment le plus fourni du fichier est celui qui vaut le moins : un fichier se remplit de ceux qui répondent le plus, pas de ceux qui achètent le plus.",
        ];
      },
    },
    {
      id: "le-score-rfm",
      objectifs: [3],
      type: "montants",
      titre: "Le score RFM des clients",
      notions: ["customer_portfolio", "segmentation"],
      tableau: (c) => tableauRFM(fichierDuCabinet(c)),
      question: () =>
        `Le score RFM note chaque client sur trois critères, de 1 à 3 : la récence de sa dernière mission, la fréquence de ses commandes, le montant de ses achats. ${grille()} Le score est la somme des trois notes. Calculez celui de la Banque Ferrand et Associés, des Verreries Lumen et de l'Imprimerie Garance, puis comptez les clients fidèles (8 ou 9).`,
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const d = (code: string) => {
          const k = x.rfm.de(code);
          return { libelle: `Score RFM, ${k.nom}`, attendu: k.score, calcul: `${qte(k.recence)} mois : ${qte(k.r)} ; ${qte(k.commandes)} ${k.commandes > 1 ? "commandes" : "commande"} : ${qte(k.f)} ; ${eur(k.chiffreDAffaires)} : ${qte(k.m)} ; ${qte(k.r)} + ${qte(k.f)} + ${qte(k.m)} = ${qte(k.score)}` };
        };
        const fideles = x.rfm.groupes.find((g) => g.code === "fideles")!.comptes;
        return [d("ferrand"), d("lumen"), d("garance"), { libelle: "Clients fidèles (score de 8 ou 9)", attendu: fideles.length, calcul: `${fideles.map((k) => k.nom).join(", ")} : ${qte(fideles.length)} comptes` }];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        const n = (code: string) => qte(x.rfm.groupes.find((g) => g.code === code)!.comptes.length);
        return [
          `Le portefeuille se range en quatre groupes : ${n("fideles")} fidèles, ${n("a-developper")} à développer, ${n("a-reveiller")} à réveiller et ${n("en-sommeil")} en sommeil. Le score ne dit pas seulement qui achète beaucoup, comme la méthode ABC : il dit qui achète encore, et souvent.`,
          `La Banque Ferrand et Associés n'a commandé que ${qte(x.rfm.de("ferrand").commandes)} missions, mais récentes et grosses : elle est fidèle. Les Verreries Lumen, gagnées en N, n'ont commandé qu'une fois, il y a ${qte(x.rfm.de("lumen").recence)} mois.`,
        ];
      },
    },
    {
      id: "rfm-et-abc",
      objectifs: [3],
      type: "choix",
      titre: "Ce que voit le score RFM",
      notions: ["customer_portfolio", "churn_rate"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        const l = x.rfm.de("lumen");
        return `Les Verreries Lumen sont en classe ${l.classe} par la méthode ABC, et leur score RFM est de ${qte(l.score)}. ${x.nadia}, qui suit le compte, vous demande quoi en faire.`;
      },
      options: (c) => {
        const x = fichierDuCabinet(c);
        const l = x.rfm.de("lumen");
        return [
          {
            texte: "La relancer vite : un compte neuf qui ne recommande pas part",
            juste: true,
            retour: `Oui : gagnée en N par un salon, elle n'a commandé qu'une mission, il y a ${qte(l.recence)} mois. Son risque de départ est de ${pct(l.attrition, 0)} ; la relancer coûte un appel, la regagner coûterait ${eur(x.cac)}.`,
          },
          {
            texte: "Rien de plus : un compte de classe C se suit à distance, une fois par an",
            juste: false,
            retour: `Non : la classe dit ce qu'elle a acheté, pas ce qu'elle achètera. Son score RFM la met parmi les comptes à réveiller : c'est maintenant qu'elle se garde ou se perd.`,
          },
          {
            texte: `L'abandonner : elle ne pèse que ${pct(l.chiffreDAffaires / x.f.comptes.reduce((t, k) => t + k.chiffreDAffaires, 0), 1)} des ventes`,
            juste: false,
            retour: `Non : un compte neuf a coûté ${eur(x.cac)} à gagner, et il ne laisse sa valeur vie que s'il revient. Le poids de sa première année ne dit pas ce qu'il vaudra.`,
          },
        ];
      },
    },
    {
      id: "predire-les-contacts",
      objectifs: [4],
      type: "choix",
      titre: "Pariez sur les contacts",
      notions: ["conversion_rate", "segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Avant de calculer, pariez. Aux taux de N chez les PME moyennes (${pct(x.t.tauxDeRendezVous, 0)} de rendez-vous, ${pct(x.t.devisParRendezVous, 0)} de devis par rendez-vous, ${pct(x.t.tauxDeSignature, 0)} de devis signés), combien de contacts ${x.hugo} doit-il appeler pour gagner ${qte(x.objectif)} comptes ?`;
      },
      options: (c) => {
        const x = fichierDuCabinet(c);
        const voir = "Le laboratoire suivant remonte l'entonnoir à l'envers : faites varier les taux et lisez les contacts qu'il faut.";
        return [
          { texte: "Environ 900", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Environ 200", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Les ${qte(x.utilisables)} du fichier y suffisent`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-du-ciblage",
      objectifs: [4],
      type: "simulation",
      titre: "Le laboratoire du ciblage",
      notions: ["conversion_rate", "segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Pour ${qte(x.objectif)} comptes de PME moyennes, faites varier le taux de rendez-vous (les contacts appelés qui acceptent un rendez-vous) et le taux de signature des devis. Un rendez-vous sur ${qte(1 / x.t.devisParRendezVous)} mène toujours à un devis. Le tableau remonte l'entonnoir, chaque marche à l'unité supérieure, et compare les contacts nécessaires aux ${qte(x.utilisables)} contacts utilisables du fichier.`;
      },
      leviers: (c) => {
        const x = fichierDuCabinet(c);
        const l = LEVIERS_DU_CIBLAGE;
        return [
          { code: "rendezVous", libelle: "Taux de rendez-vous", unite: "%", min: l.rendezVous.min, max: l.rendezVous.max, pas: l.rendezVous.pas, depart: auCentime(x.t.tauxDeRendezVous * 100) },
          { code: "signature", libelle: "Devis signés", unite: "%", min: l.signature.min, max: l.signature.max, pas: l.signature.pas, depart: auCentime(x.t.tauxDeSignature * 100) },
        ];
      },
      lecture: (c, p) => {
        const x = fichierDuCabinet(c);
        const l = laboratoireDuCiblage(x, p.rendezVous!, p.signature!);
        const d = laboratoireDuCiblage(x, x.t.tauxDeRendezVous * 100, x.t.tauxDeSignature * 100);
        return [
          { libelle: "Devis à remettre", montant: l.devis, reference: d.devis, unite: "devis" },
          { libelle: "Rendez-vous à obtenir", montant: l.rendezVous, reference: d.rendezVous, unite: "rendez-vous" },
          { libelle: "Contacts à appeler", montant: l.contacts, reference: d.contacts, unite: "contacts" },
          { libelle: "Contacts utilisables du fichier", montant: l.utilisables, unite: "contacts" },
          { libelle: "Contacts qui manquent", montant: l.manquants, reference: d.manquants, unite: "contacts", fort: true },
        ];
      },
      graphique: (c) => {
        const x = fichierDuCabinet(c);
        return {
          levier: "rendezVous",
          unite: "contacts",
          courbes: [
            { libelle: "Contacts à appeler", valeur: (p) => laboratoireDuCiblage(x, p.rendezVous!, p.signature!).contacts },
            { libelle: "Contacts utilisables du fichier", valeur: () => x.utilisables },
          ],
        };
      },
      defi: (c) => {
        const x = fichierDuCabinet(c);
        return {
          consigne: `Trouvez des taux qui permettent de gagner ${qte(x.objectif)} comptes avec les seuls contacts utilisables du fichier.`,
          atteint: (p) => laboratoireDuCiblage(x, p.rendezVous!, p.signature!).suffit,
          indice: (p) => {
            const l = laboratoireDuCiblage(x, p.rendezVous!, p.signature!);
            return `Il manque encore ${qte(l.manquants)} contacts : montez le taux de rendez-vous, ou celui des devis signés.`;
          },
          solution: { rendezVous: auCentime(TAUX_DE_RENDEZ_VOUS_QUALIFIE * 100), signature: auCentime(x.t.tauxDeSignature * 100) },
        };
      },
      explication: (c, p) => {
        const x = fichierDuCabinet(c);
        const l = laboratoireDuCiblage(x, p.rendezVous!, p.signature!);
        return [
          `À ${qte(p.rendezVous!)} % de rendez-vous et ${qte(p.signature!)} % de devis signés, il faut ${qte(l.contacts)} contacts : le fichier suffit. Aux taux de N, il en faudrait ${qte(x.rebours.contacts)}, et ${qte(x.rebours.manquants)} manqueraient.`,
          "La marche du bas pèse le plus : doubler le taux de rendez-vous divise de moitié les contacts à trouver. Un contact mieux qualifié vaut mieux que 2 contacts de plus.",
        ];
      },
    },
    {
      id: "a-rebours",
      objectifs: [4],
      type: "montants",
      titre: "Les contacts qu'il faut",
      notions: ["conversion_rate", "segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Sans formule cette fois. Pour gagner ${qte(x.objectif)} comptes de PME moyennes aux taux de N, calculez les devis à remettre, les rendez-vous à obtenir, puis les contacts à appeler (chaque marche à l'unité supérieure), et les contacts qui manquent au fichier.`;
      },
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const r = x.rebours;
        return [
          { libelle: "Devis à remettre", attendu: r.devis, calcul: `${qte(r.comptes)} ÷ ${pct(r.tauxDeSignature, 0)} = ${qte(auCentime(r.comptes / r.tauxDeSignature))}, soit ${qte(r.devis)} devis` },
          { libelle: "Rendez-vous à obtenir", attendu: r.rendezVous, calcul: `${qte(r.devis)} ÷ ${pct(r.devisParRendezVous, 0)} = ${qte(r.rendezVous)} rendez-vous` },
          { libelle: "Contacts à appeler", attendu: r.contacts, calcul: `${qte(r.rendezVous)} ÷ ${pct(r.tauxDeRendezVous, 0)} = ${qte(r.contacts)} contacts` },
          { libelle: "Contacts qui manquent au fichier", attendu: r.manquants, calcul: `${qte(r.contacts)} − ${qte(r.utilisables)} = ${qte(r.manquants)}` },
        ];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Un objectif de comptes se lit à l'envers dans l'entonnoir : les devis, puis les rendez-vous, puis les contacts. À ${eur(x.coutDUnContact)} le contact appelé (le coût de la prospection de N ÷ ses appels), les ${qte(x.rebours.contacts)} contacts coûteraient ${eur(x.rebours.contacts * x.coutDUnContact)}.`,
          `Le fichier n'a que ${qte(x.utilisables)} PME moyennes utilisables. Il faut en trouver d'autres, ou mieux transformer celles qu'il a.`,
        ];
      },
    },
    {
      id: "mieux-qualifier",
      objectifs: [4],
      type: "montants",
      titre: "Variante : un fichier mieux qualifié",
      notions: ["conversion_rate", "segmentation"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Variante : ${x.hugo} qualifie chaque contact avant de l'appeler (le décideur nommé, son besoin noté). Un contact sur ${qte(1 / TAUX_DE_RENDEZ_VOUS_QUALIFIE)} accepte alors un rendez-vous, au lieu d'un sur ${qte(1 / x.t.tauxDeRendezVous)} ; les autres taux ne changent pas. Calculez les contacts à appeler pour ${qte(x.objectif)} comptes, puis les comptes attendus des ${qte(x.utilisables)} contacts du fichier, au centième.`;
      },
      champs: (c) => {
        const x = fichierDuCabinet(c);
        const t = x.t;
        return [
          { libelle: "Contacts à appeler, fichier qualifié", attendu: x.qualifie.contacts, calcul: `${qte(x.qualifie.rendezVous)} rendez-vous ÷ ${pct(TAUX_DE_RENDEZ_VOUS_QUALIFIE, 0)} = ${qte(x.qualifie.contacts)} contacts` },
          {
            libelle: "Comptes attendus des contacts du fichier",
            attendu: x.comptesAvecLeFichierQualifie,
            tolerance: 0.05,
            calcul: `${qte(x.utilisables)} × ${pct(TAUX_DE_RENDEZ_VOUS_QUALIFIE, 0)} × ${pct(t.devisParRendezVous, 0)} × ${pct(t.tauxDeSignature, 0)} = ${qte(x.comptesAvecLeFichierQualifie)} comptes`,
          },
        ];
      },
      explication: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Qualifiés, les ${qte(x.utilisables)} contacts du fichier donnent ${qte(x.comptesAvecLeFichierQualifie)} comptes attendus : l'objectif tient sans acheter une ligne. ${x.hugo} appelle ${qte(x.qualifie.contacts)} contacts au lieu de ${qte(x.rebours.contacts)}, et passe le temps gagné à préparer ses appels.`,
        ];
      },
    },
    {
      id: "le-segment-de-hugo",
      objectifs: [1],
      type: "choix",
      titre: "Le segment de la conquête en N + 1",
      notions: ["segmentation", "customer_lifetime_value"],
      question: (c) => {
        const x = fichierDuCabinet(c);
        return `Le directeur demande quel segment ${x.hugo} doit prospecter en N + 1, et comment. Que lui proposez-vous ?`;
      },
      options: (c) => {
        const x = fichierDuCabinet(c);
        const k = FICHIER_DE_PROSPECTION.utilisablesParSegment;
        return [
          {
            texte: "Les PME moyennes, en qualifiant chaque contact avant l'appel",
            juste: true,
            retour: `Oui : le segment achète ${qte(x.moyennes.journeesDuMarche)} journées, un compte y vaut ${eur(x.valeurNeuveMoyenne.valeurVie)} pour ${eur(x.cac)} de coût, et ses ${qte(x.utilisables)} contacts qualifiés suffisent à ${qte(x.objectif)} comptes.`,
          },
          {
            texte: `Les petites PME : avec ${qte(k["petites-pme"])} contacts, c'est le plus gros stock du fichier`,
            juste: false,
            retour: `Non : aucun de leurs devis n'a été signé en N, et un compte y vaut ${eur(x.valeurPetite.valeurVie)} sur sa vie, moins que les ${eur(x.cac)} qu'il coûte à gagner.`,
          },
          {
            texte: `Le secteur public, où notre part de marché est la plus forte`,
            juste: false,
            retour: `Non : le public achète sur appel d'offres, où le prix décide ; et ses comptes laissent ${eur(x.publics.margeParJournee)} par journée, contre ${eur(x.moyennes.margeParJournee)} pour les PME moyennes.`,
          },
          {
            texte: `Les PME moyennes, en achetant ${qte(x.rebours.manquants)} lignes pour atteindre ${qte(x.rebours.contacts)} contacts`,
            juste: false,
            retour: `Pas d'abord : acheter des lignes ajoute des contacts aux taux de N. Qualifier ceux qu'on a double le taux de rendez-vous, et l'objectif tient avec le fichier.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation", "customer_portfolio", "conversion_rate"],
      tableau: (c) => {
        const x = fichierDuCabinet(c);
        return {
          titre: "Les segments, du marché au fichier",
          colonnes: ["Journées du marché", "Part du cabinet", "Contacts du fichier"],
          lignes: x.marche.segments.map((s) => ({ libelle: s.nom, valeurs: [qte(s.journeesDuMarche), pct(s.partDeMarche, 1), qte(FICHIER_DE_PROSPECTION.utilisablesParSegment[s.code])] })),
        };
      },
      texte: (c) => {
        const x = fichierDuCabinet(c);
        return [
          `Un segment se mesure par ce qu'il achète, pas par le nombre de ses entreprises. Chez ${x.f.entreprise}, les PME moyennes et les ETI achètent ${qte(x.moyennes.journeesDuMarche)} journées, et un compte neuf y vaut ${eur(x.valeurNeuveMoyenne.valeurVie)} : c'est la cible de la conquête.`,
          `Un fichier se qualifie avant de servir : ${pct(x.q.partUtilisable, 0)} des lignes restent une fois retirés les doublons, les incomplets, les contacts hors cible et ce que le RGPD fait supprimer. Le score RFM lit les clients par la récence, la fréquence et le montant : il repère les comptes à réveiller que la méthode ABC laisse en classe C.`,
          "Au niveau de l'examen, vous savez mesurer un marché par segment, choisir une cible sur la valeur de ses comptes, qualifier un fichier, calculer un score RFM, et remonter l'entonnoir pour trouver les contacts qu'il faut.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Contacts à appeler = comptes visés ÷ taux de signature ÷ devis par rendez-vous ÷ taux de rendez-vous, chaque marche à l'unité supérieure.",
    },
  ],
};
