import { arrondi, arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { referenceDe } from "./boutique";
import type { CodeDeClientele, CodeDeReference, FicheDeLaBoutique } from "./maille-et-co";
import { carteDeFidelite, passantsDeJanvier, TAUX_DE_DEPART_PAR_MOIS } from "./vente-et-caisse";

/**
 * LE MONDE DU COURS : LA CLIENTÈLE DE MAILLE & CO, SA ZONE ET SON FICHIER (le BTS MCO, bloc 1 :
 * développer la relation client et assurer la vente conseil).
 *
 * La fiche de la boutique (monde/maille-et-co.ts) donne le mois de janvier clientèle par clientèle :
 * 680 entrées et 340 passages des clientes fidèles (38 825 € hors taxes), 3 160 entrées et 600 passages
 * des passants (38 425 €), 8 commandes des comités d'entreprise, hors caisse. Le bac pro y a ajouté la
 * carte de fidélité (monde/vente-et-caisse.ts) : une cliente fidèle passe une fois par mois, 5 % des
 * clientes de la carte ne reviennent pas chaque mois. Ce module ne change aucun de ces chiffres : il
 * dit OÙ habitent ces clients (la zone de chalandise), CE QU'ILS RÉPONDENT à une enquête (l'étude),
 * COMMENT les vendeurs les servent un samedi (la vente conseil) et CE QU'ILS VALENT quand ils restent
 * (la fidélisation). Chaque donnée nouvelle est une constante nommée, commentée ; la garde
 * tests/cours/clientele-de-la-boutique.test.ts refait chaque chiffre à la main.
 *
 * CONVENTIONS. La dépense des ménages se compte toutes taxes comprises, comme ce qu'ils paient : la
 * part de marché compare donc le chiffre d'affaires encaissé en caisse, TTC, à la dépense de la zone.
 * Les comités d'entreprise ne sont pas des ménages : ils restent hors de la zone. Les marges sont des
 * marges sur coût variable, hors taxes, comme dans tout le parcours.
 */

const auCentime = arrondi2;
/** Au dix-millième : une proportion de la copie, deux décimales en pourcentage (0,3242 pour 32,42 %). */
const auDixMillieme = (x: number) => arrondi(x, 4);
const somme = (xs: readonly number[]) => xs.reduce((t, x) => t + x, 0);

/** Le chiffre d'affaires TTC d'une clientèle de janvier : ses articles × l'étiquette. */
function chiffreTtcDe(f: FicheDeLaBoutique, code: CodeDeClientele) {
  const k = f.clienteles.find((x) => x.code === code)!;
  const ht = somme(f.gamme.map((r) => k.achats[r.code] * r.prixHt));
  return { tickets: k.tickets, entrees: k.entrees, ht, ttc: auCentime(ht * (1 + f.gamme[0]!.tauxTva)) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. LA ZONE DE CHALANDISE
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeZone = "primaire" | "secondaire" | "tertiaire";

export interface ZoneDeChalandise {
  code: CodeDeZone;
  nom: string;
  /** Le temps d'accès en voiture ou en bus, tracé en courbes isochrones. */
  acces: string;
  /** Les habitants de la zone (recensement de l'INSEE, hypothèse du cours). */
  population: number;
  /** L'indice de disparité de la dépense en habillement : 1,10 dépense 10 % de plus que la moyenne nationale. */
  idc: number;
  /** Les surfaces de vente de maille où les habitants de la zone achètent, MAILLE & CO comprise, en m². */
  surfaceDeMaille: number;
}

/**
 * LES TROIS ZONES (hypothèse du cours). La zone primaire, à moins de 10 minutes, est le centre-ville et
 * ses quartiers : 28 000 habitants, plus aisés que la moyenne (indice 1,10). La secondaire, de 10 à 20
 * minutes, réunit les communes de la première couronne ; la tertiaire, de 20 à 30 minutes, s'étend
 * jusqu'au centre commercial périphérique. Les surfaces de maille sont celles d'un relevé des
 * concurrents : 800 m² au centre-ville (dont les 120 m² de la boutique), 1 200 m² pour qui habite la
 * première couronne, 4 800 m² au-delà, centre commercial compris.
 */
export const ZONES: readonly ZoneDeChalandise[] = [
  { code: "primaire", nom: "Zone primaire", acces: "moins de 10 minutes", population: 28_000, idc: 1.1, surfaceDeMaille: 800 },
  { code: "secondaire", nom: "Zone secondaire", acces: "de 10 à 20 minutes", population: 52_000, idc: 0.95, surfaceDeMaille: 1_200 },
  { code: "tertiaire", nom: "Zone tertiaire", acces: "de 20 à 30 minutes", population: 75_000, idc: 0.9, surfaceDeMaille: 4_800 },
];

/**
 * LA DÉPENSE EN MAILLE D'UN HABITANT EN JANVIER (hypothèse du cours) : 9 € TTC, la dépense moyenne
 * nationale du mois en pulls, gilets, écharpes et bonnets. La dépense commercialisable d'une zone est
 * sa population × cette dépense × l'indice de disparité.
 */
export const DEPENSE_DE_JANVIER_PAR_HABITANT = 9;

/**
 * D'OÙ VIENNENT LES CLIENTS (hypothèse du cours) : le relevé des codes postaux en caisse et les adresses
 * du fichier de la carte. Les clientes fidèles habitent pour 60 % la zone primaire, 30 % la secondaire,
 * 10 % la tertiaire ; les passants pour 35 %, 30 % et 15 %, et 20 % viennent d'au-delà (touristes,
 * personnes de passage). Un passant fait un passage ; une cliente fidèle aussi, une fois par mois.
 */
export const ORIGINE_DES_CLIENTS: Readonly<Record<"fideles" | "passants", Readonly<Record<CodeDeZone | "horsZone", number>>>> = {
  fideles: { primaire: 0.6, secondaire: 0.3, tertiaire: 0.1, horsZone: 0 },
  passants: { primaire: 0.35, secondaire: 0.3, tertiaire: 0.15, horsZone: 0.2 },
};

/**
 * L'OBJECTIF DE LA DIRECTION (hypothèse du cours, le même que celui du chapitre des indicateurs) : 10 %
 * de chiffre d'affaires en caisse de plus qu'en janvier, à aller chercher dans la zone.
 */
export const HAUSSE_VISEE_DANS_LA_ZONE = 0.1;

/**
 * LA LOI DE REILLY (hypothèse du cours) : le centre commercial périphérique offre 1 800 m² de maille, à
 * 14 km du centre-ville (800 m²), par la même route. La commune de Vauclair, sur cette route, est à 8 km
 * du centre-ville et à 6 km du centre commercial ; elle compte 6 000 habitants.
 */
export const POLES_DE_REILLY = {
  centreVille: { nom: "le centre-ville", surface: 800 },
  centreCommercial: { nom: "le centre commercial", surface: 1_800 },
  distance: 14_000,
} as const;
export const COMMUNE_DE_VAUCLAIR = { nom: "Vauclair", versLeCentreVille: 8_000, versLeCentreCommercial: 6_000, population: 6_000 } as const;

/**
 * LA ZONE DE L'UNITÉ COMMERCIALE VIRTUELLE (hypothèse du cours) : le site de la boutique, qui présente
 * la collection et prend des commandes à retirer en boutique, a reçu 4 000 visites en janvier ;
 * l'outil de mesure d'audience les situe par la géolocalisation. Les 48 retraits de janvier (le click
 * & collect, payé en caisse au retrait) sont comptés parmi les 940 passages : ils ne changent rien au mois.
 */
export const VISITES_DU_SITE: Readonly<Record<CodeDeZone | "horsZone", number>> = { primaire: 900, secondaire: 1_100, tertiaire: 700, horsZone: 1_300 };
export const RETRAITS_DE_JANVIER = 48;

/** Les clients de janvier, zone par zone : la dépense, le chiffre d'affaires, la part de marché, l'emprise. */
export function zoneDeChalandise(f: FicheDeLaBoutique) {
  const fid = chiffreTtcDe(f, "fideles");
  const pas = chiffreTtcDe(f, "passants");
  const zones = ZONES.map((z) => {
    const depense = auCentime(z.population * DEPENSE_DE_JANVIER_PAR_HABITANT * z.idc);
    const fideles = Math.round(fid.tickets * ORIGINE_DES_CLIENTS.fideles[z.code]);
    const passants = Math.round(pas.tickets * ORIGINE_DES_CLIENTS.passants[z.code]);
    const chiffre = auCentime(fid.ttc * ORIGINE_DES_CLIENTS.fideles[z.code] + pas.ttc * ORIGINE_DES_CLIENTS.passants[z.code]);
    const partTheorique = f.surfaceDeVente / z.surfaceDeMaille;
    return {
      ...z,
      depense,
      fideles,
      passants,
      clients: fideles + passants,
      chiffre,
      part: chiffre / depense,
      emprise: (fideles + passants) / z.population,
      partTheorique,
      chiffreTheorique: auCentime(partTheorique * depense),
      potentiel: auCentime(partTheorique * depense - chiffre),
      nonCapte: auCentime(depense - chiffre),
      visites: VISITES_DU_SITE[z.code],
    };
  });
  const horsZone = { passants: Math.round(pas.tickets * ORIGINE_DES_CLIENTS.passants.horsZone), chiffre: auCentime(pas.ttc * ORIGINE_DES_CLIENTS.passants.horsZone) };
  const chiffreEnCaisse = auCentime(fid.ttc + pas.ttc);
  const visites = somme(Object.values(VISITES_DU_SITE));
  return {
    zones,
    zone: (code: CodeDeZone) => zones.find((z) => z.code === code)!,
    horsZone,
    fideles: fid,
    passants: pas,
    chiffreEnCaisse,
    depense: auCentime(somme(zones.map((z) => z.depense))),
    objectif: auCentime(chiffreEnCaisse * HAUSSE_VISEE_DANS_LA_ZONE),
    visites,
    partDesVisitesHorsZone: VISITES_DU_SITE.horsZone / visites,
    retraits: RETRAITS_DE_JANVIER,
    partDesRetraits: RETRAITS_DE_JANVIER / (fid.tickets + pas.tickets),
    panierTtcDesPassants: auCentime(pas.ttc / pas.tickets),
  };
}

/** La loi de Reilly : le rapport des dépenses attirées par A et par B, et la part de A. */
export function reilly(surfaceA: number, surfaceB: number, distanceA: number, distanceB: number) {
  const rapport = (surfaceA / surfaceB) * (distanceB / distanceA) ** 2;
  return { rapport, partDeA: rapport / (1 + rapport) };
}

/** La part de la dépense d'un lieu qui va au centre-ville, à une distance donnée du centre-ville sur la route du centre commercial (de 0 à 1). */
export function partDuCentreVille(distance: number) {
  const { centreVille: a, centreCommercial: b, distance: d } = POLES_DE_REILLY;
  const versA = a.surface * (d - distance) ** 2;
  return versA / (versA + b.surface * distance ** 2);
}

/** Le point de rupture (Converse) : la distance au centre-ville où les deux pôles attirent autant. */
export const pointDeRupture = () => POLES_DE_REILLY.distance / (1 + Math.sqrt(POLES_DE_REILLY.centreCommercial.surface / POLES_DE_REILLY.centreVille.surface));

/**
 * LE NOUVEAU CONCURRENT (hypothèse du cas « Un tract pour quelle zone ? ») : une enseigne de maille
 * ouvre 300 m² dans une commune de la première couronne. Les habitants de la zone secondaire ont
 * désormais 1 500 m² de maille à leur portée ; les autres zones ne bougent pas.
 */
export const NOUVEAU_CONCURRENT = { zone: "secondaire" as CodeDeZone, surface: 300 };

/** La zone secondaire après l'ouverture du concurrent : sa part théorique et ce qu'il reste à y prendre. */
export function zoneAvecLeConcurrent(f: FicheDeLaBoutique) {
  const k = zoneDeChalandise(f);
  const z = k.zone(NOUVEAU_CONCURRENT.zone);
  const surface = z.surfaceDeMaille + NOUVEAU_CONCURRENT.surface;
  const partTheorique = f.surfaceDeVente / surface;
  const potentiel = auCentime(partTheorique * z.depense - z.chiffre);
  const t = k.zone("tertiaire");
  const manque = auCentime(k.objectif - potentiel);
  return { k, z, surface, partTheorique, potentiel, tertiaire: t, manque, pointsDansLaTertiaire: (manque / t.depense) * 100 };
}

/** Gagner des points de part de marché dans une zone : le chiffre d'affaires gagné, la part atteinte, et si elle reste sous la part théorique. */
export function gagnerDansLaZone(f: FicheDeLaBoutique, code: CodeDeZone, points: number) {
  const k = zoneDeChalandise(f);
  const z = k.zone(code);
  const p = Math.round(points * 10) / 10;
  const gagne = auCentime((z.depense * p) / 100);
  const partApres = z.part + p / 100;
  return {
    zone: z,
    points: p,
    gagne,
    partApres,
    sousLaPartTheorique: partApres <= z.partTheorique + 1e-9,
    atteintLObjectif: gagne >= k.objectif - 1e-9,
    objectif: k.objectif,
  };
}

/** La plus petite hausse de part de marché (au dixième de point) qui atteint l'objectif dans une zone. */
export const pointsPourLObjectif = (f: FicheDeLaBoutique, code: CodeDeZone) => Math.ceil(((zoneDeChalandise(f).objectif / zoneDeChalandise(f).zone(code).depense) * 100 - 1e-9) * 10) / 10;

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'ÉTUDE : INTERROGER LES CLIENTS
// ═════════════════════════════════════════════════════════════════════════════

/** LE TAUX DE SONDAGE (hypothèse du cours) : un client sur quatre des passages du mois, comités compris. */
export const TAUX_DE_SONDAGE = 0.25;

/**
 * L'ÉCHANTILLON OBTENU (hypothèse du cours) : l'enquêtrice a interrogé à la caisse, surtout le mardi
 * matin, quand les clientes fidèles viennent. Elle a rempli ses 237 questionnaires, mais avec 120
 * fidèles et 115 passants au lieu de 85 et 150.
 */
export const ECHANTILLON_OBTENU: Readonly<Record<CodeDeClientele, number>> = { fideles: 120, passants: 115, comites: 2 };

export type CodeDeService = "retouches" | "nocturne" | "dimanche" | "livraison";
export const SERVICES: readonly { code: CodeDeService; libelle: string }[] = [
  { code: "retouches", libelle: "Des retouches en boutique" },
  { code: "nocturne", libelle: "Une nocturne le jeudi, jusqu'à 21 h" },
  { code: "dimanche", libelle: "Une ouverture le dimanche matin" },
  { code: "livraison", libelle: "La livraison à domicile" },
];

/** LA QUESTION 1 (hypothèse du cours) : « Quel service vous ferait venir plus souvent ? », une réponse par client. */
export const REPONSES_SERVICE: Readonly<Record<CodeDeClientele, Readonly<Record<CodeDeService, number>>>> = {
  fideles: { retouches: 54, nocturne: 24, dimanche: 18, livraison: 24 },
  passants: { retouches: 23, nocturne: 46, dimanche: 23, livraison: 23 },
  comites: { retouches: 0, nocturne: 0, dimanche: 0, livraison: 2 },
};

export type CodeDInfluence = "vitrine" | "avis" | "proche" | "habitude";
export const INFLUENCES: readonly { code: CodeDInfluence; libelle: string }[] = [
  { code: "vitrine", libelle: "La vitrine" },
  { code: "avis", libelle: "Les avis en ligne et les réseaux sociaux" },
  { code: "proche", libelle: "Le conseil d'un proche" },
  { code: "habitude", libelle: "L'habitude" },
];

/** LA QUESTION 2 (hypothèse du cours) : « Qu'est-ce qui vous a fait entrer aujourd'hui ? », une réponse par client. */
export const REPONSES_INFLUENCE: Readonly<Record<CodeDeClientele, Readonly<Record<CodeDInfluence, number>>>> = {
  fideles: { vitrine: 18, avis: 12, proche: 18, habitude: 72 },
  passants: { vitrine: 46, avis: 35, proche: 23, habitude: 11 },
  comites: { vitrine: 0, avis: 0, proche: 2, habitude: 0 },
};

/** Le coefficient de la confiance à 95 % : la marge d'incertitude d'une proportion p sur n réponses est 1,96 × √(p(1 − p) ÷ n). */
export const COEFFICIENT_DE_CONFIANCE = 1.96;
export const margeDIncertitude = (p: number, n: number) => COEFFICIENT_DE_CONFIANCE * Math.sqrt((p * (1 - p)) / n);

const CLIENTELES_DE_L_ETUDE: readonly CodeDeClientele[] = ["fideles", "passants", "comites"];

/** L'étude du service : population mère, quotas, échantillon obtenu, tri à plat brut, tri croisé, redressement, marge. */
export function etudeDuService(f: FicheDeLaBoutique) {
  const population = Object.fromEntries(CLIENTELES_DE_L_ETUDE.map((c) => [c, f.clienteles.find((x) => x.code === c)!.tickets])) as Record<CodeDeClientele, number>;
  const populationMere = somme(Object.values(population));
  const quotas = Object.fromEntries(CLIENTELES_DE_L_ETUDE.map((c) => [c, Math.round(population[c] * TAUX_DE_SONDAGE)])) as Record<CodeDeClientele, number>;
  const taille = somme(Object.values(quotas));
  const obtenu = somme(Object.values(ECHANTILLON_OBTENU));
  // Chaque ligne de la copie, arrondie : les poids, des coefficients, au dix-millième (au centième, 0,71 et
  // 1,30 déplaceraient la population de 0,16 réponse) ; les réponses redressées au centième ; les
  // proportions, l'écart et la marge au dix-millième (deux décimales en pourcentage ou en points).
  const poids = Object.fromEntries(CLIENTELES_DE_L_ETUDE.map((c) => [c, auDixMillieme(quotas[c] / ECHANTILLON_OBTENU[c])])) as Record<CodeDeClientele, number>;
  const brut = Object.fromEntries(SERVICES.map((s) => [s.code, somme(CLIENTELES_DE_L_ETUDE.map((c) => REPONSES_SERVICE[c][s.code]))])) as Record<CodeDeService, number>;
  const redresse = Object.fromEntries(SERVICES.map((s) => [s.code, auCentime(somme(CLIENTELES_DE_L_ETUDE.map((c) => REPONSES_SERVICE[c][s.code] * poids[c])))])) as Record<CodeDeService, number>;
  const croise = (c: CodeDeClientele, s: CodeDeService) => REPONSES_SERVICE[c][s] / ECHANTILLON_OBTENU[c];
  const pNocturne = auDixMillieme(redresse.nocturne / taille);
  const pRetouches = auDixMillieme(redresse.retouches / taille);
  const ecart = auDixMillieme(pNocturne - pRetouches);
  const marge = auDixMillieme(margeDIncertitude(pNocturne, taille));
  // La plus petite taille d'échantillon dont la marge d'incertitude passe sous l'écart des deux services :
  // le quotient au centième, puis l'unité au-dessus.
  const tailleCalculee = auCentime((COEFFICIENT_DE_CONFIANCE ** 2 * pNocturne * (1 - pNocturne)) / ecart ** 2);
  const tailleQuiDepartage = Math.ceil(tailleCalculee - 1e-9);
  return { population, populationMere, quotas, taille, obtenu, poids, brut, redresse, croise, pNocturne, pRetouches, ecart, marge, tailleCalculee, tailleQuiDepartage };
}

/** Ce que répondrait un échantillon brut de `fideles` clientes fidèles et du reste en passants (235 au total, plus les deux comités), sans redressement. */
export function echantillonBrut(fideles: number) {
  const passants = ECHANTILLON_OBTENU.fideles + ECHANTILLON_OBTENU.passants - fideles;
  const total = fideles + passants + ECHANTILLON_OBTENU.comites;
  const part = (s: CodeDeService) =>
    (fideles * (REPONSES_SERVICE.fideles[s] / ECHANTILLON_OBTENU.fideles) + passants * (REPONSES_SERVICE.passants[s] / ECHANTILLON_OBTENU.passants) + REPONSES_SERVICE.comites[s]) / total;
  return { fideles, passants, total, part };
}

/** L'étude des facteurs d'influence : la part de chaque raison d'entrer, clientèle par clientèle. */
export const partDInfluence = (c: CodeDeClientele, i: CodeDInfluence) => REPONSES_INFLUENCE[c][i] / ECHANTILLON_OBTENU[c];

/**
 * LE FICHIER DE LA CARTE (hypothèse du cours) : 1 260 cartes ouvertes depuis son lancement, rangées par
 * la date du dernier achat. Les 340 clientes de janvier sont parmi les 640 du premier rang. Une partie
 * seulement a accepté de recevoir les offres par SMS ou par courriel (case cochée à l'inscription).
 */
export const FICHIER_DE_LA_CARTE: readonly { code: "recentes" | "anciennes" | "dormantes"; dernierAchat: string; cartes: number; consentement: number }[] = [
  { code: "recentes", dernierAchat: "moins d'un an", cartes: 640, consentement: 300 },
  { code: "anciennes", dernierAchat: "de 1 à 3 ans", cartes: 380, consentement: 110 },
  { code: "dormantes", dernierAchat: "plus de 3 ans", cartes: 240, consentement: 90 },
];

/**
 * LA DURÉE DE CONSERVATION (référentiel de la CNIL pour la gestion commerciale) : les données d'un client
 * qui n'achète plus se gardent 3 ans après son dernier achat, puis s'effacent ou s'anonymisent. // À VÉRIFIER
 * Le délai de réponse à une demande d'accès est d'un mois (RGPD, article 12). // À VÉRIFIER
 */
export const ANS_DE_CONSERVATION = 3;
export const MOIS_POUR_REPONDRE_A_UNE_DEMANDE = 1;

/** LE COÛT D'UN SMS ENVOYÉ (hypothèse du cours, le tarif du prestataire de la boutique) : 0,08 € hors taxes. */
export const COUT_D_UN_SMS = 0.08;

/** Le fichier de la carte : ce qui se garde, ce qui s'efface, et à qui une offre peut s'envoyer. */
export function fichierDeLaCarte() {
  const garde = FICHIER_DE_LA_CARTE.filter((r) => r.code !== "dormantes");
  const aEffacer = FICHIER_DE_LA_CARTE.find((r) => r.code === "dormantes")!.cartes;
  const destinataires = somme(garde.map((r) => r.consentement));
  return {
    cartes: somme(FICHIER_DE_LA_CARTE.map((r) => r.cartes)),
    gardees: somme(garde.map((r) => r.cartes)),
    aEffacer,
    destinataires,
    sansConsentement: somme(FICHIER_DE_LA_CARTE.map((r) => r.consentement)) - destinataires,
    coutDeLaCampagne: auCentime(destinataires * COUT_D_UN_SMS),
  };
}

/**
 * L'ÉTUDE DU CAS « FAUT-IL LIVRER À DOMICILE ? » (hypothèse du cas) : une deuxième enquête, en ligne cette
 * fois, par un lien au bas du ticket. Les passants y ont plus répondu : 50 fidèles, 185 passants et les
 * 2 comités. « Feriez-vous livrer vos achats à domicile ? » : 15 fidèles, 74 passants et les 2 comités
 * répondent oui. La direction lance la livraison si au moins 30 % des clients l'utiliseraient.
 */
export const ECHANTILLON_DE_LA_LIVRAISON: Readonly<Record<CodeDeClientele, number>> = { fideles: 50, passants: 185, comites: 2 };
export const OUI_A_LA_LIVRAISON: Readonly<Record<CodeDeClientele, number>> = { fideles: 15, passants: 74, comites: 2 };
export const SEUIL_DE_LANCEMENT_DE_LA_LIVRAISON = 0.3;

/** L'enquête de la livraison : poids, oui redressés, part brute et redressée, marge, borne basse. */
export function etudeDeLaLivraison(f: FicheDeLaBoutique) {
  const { quotas, taille } = etudeDuService(f);
  // Les lignes de la copie : les poids au dix-millième (des coefficients), les oui redressés au centième, la
  // part et la marge au dix-millième.
  const poids = Object.fromEntries(CLIENTELES_DE_L_ETUDE.map((c) => [c, auDixMillieme(quotas[c] / ECHANTILLON_DE_LA_LIVRAISON[c])])) as Record<CodeDeClientele, number>;
  const ouiBruts = somme(Object.values(OUI_A_LA_LIVRAISON));
  const ouiRedresses = auCentime(somme(CLIENTELES_DE_L_ETUDE.map((c) => OUI_A_LA_LIVRAISON[c] * poids[c])));
  const p = auDixMillieme(ouiRedresses / taille);
  const marge = auDixMillieme(margeDIncertitude(p, taille));
  return { quotas, taille, poids, ouiBruts, partBrute: auDixMillieme(ouiBruts / taille), ouiRedresses, part: p, marge, borneBasse: auDixMillieme(p - marge), borneHaute: auDixMillieme(p + marge) };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. LA VENTE CONSEIL : UN SAMEDI DE JANVIER, TROIS VENDEURS
// ═════════════════════════════════════════════════════════════════════════════

export interface VendeurDuSamedi {
  /** Le code du salarié dans l'équipe de la fiche. */
  code: "vendeur" | "vendeuse-partiel" | "etudiante";
  /** Les clients qu'il a accueillis et conseillés dans la journée. */
  prisEnCharge: number;
  /** Les passages en caisse qu'il a conclus. */
  tickets: number;
  /** Les articles vendus, référence par référence. */
  ventes: Readonly<Record<CodeDeReference, number>>;
  /** Les écharpes ajoutées à l'achat d'un cardigan, sur sa proposition (la vente additionnelle). */
  echarpesAvecLeCardigan: number;
}

/**
 * UN SAMEDI DE JANVIER (hypothèse du cours) : les 240 entrées de l'affluence du samedi (la fiche), dont
 * 200 accueillies par trois vendeurs de l'équipe ; 40 sont ressorties sans contact. Les trois vendeurs
 * concluent 57 passages et 85 articles. La vente additionnelle : une écharpe proposée avec le cardigan ;
 * la montée en gamme : le pull mérinos plutôt que le col rond, à qui vient pour un pull. C'est une
 * journée, pas le mois : le tableau de bord mensuel des vendeurs reste celui du management de l'équipe.
 */
export const SAMEDI_DES_VENDEURS: readonly VendeurDuSamedi[] = [
  { code: "vendeur", prisEnCharge: 80, tickets: 24, ventes: { "col-rond": 8, merinos: 4, cardigan: 10, echarpe: 8, bonnet: 6 }, echarpesAvecLeCardigan: 3 },
  { code: "vendeuse-partiel", prisEnCharge: 70, tickets: 21, ventes: { "col-rond": 9, merinos: 1, cardigan: 9, echarpe: 9, bonnet: 6 }, echarpesAvecLeCardigan: 6 },
  { code: "etudiante", prisEnCharge: 50, tickets: 12, ventes: { "col-rond": 6, merinos: 0, cardigan: 5, echarpe: 3, bonnet: 1 }, echarpesAvecLeCardigan: 1 },
];

/**
 * LE PARCOURS OMNICANAL DU SAMEDI (hypothèse du cours) : 19 des 57 clients passés en caisse avaient vu
 * l'article sur le site avant de venir (le ROPO : chercher en ligne, acheter en boutique). Au retrait
 * d'une commande, un client sur quatre accepte l'article que le vendeur lui propose en plus.
 */
export const VUS_EN_LIGNE_LE_SAMEDI = 19;
export const ACCEPTATION_AU_RETRAIT = 0.25;

/** Le défi de la formation : 150 € de marge en plus par samedi. */
export const MARGE_VISEE_PAR_SAMEDI = 150;

export type CodeDeTechnique = "additionnelle" | "gamme";

/** La marge sur coût variable d'un article d'une référence. */
const margeDe = (f: FicheDeLaBoutique, code: CodeDeReference) => {
  const r = referenceDe(f, code);
  return auCentime(r.prixHt - r.coutDAchat - r.autresCoutsVariables);
};

/** Les indicateurs d'un vendeur sur une journée. */
export function indicateursDuVendeur(f: FicheDeLaBoutique, v: VendeurDuSamedi) {
  const articles = somme(Object.values(v.ventes));
  const chiffre = auCentime(somme(f.gamme.map((r) => v.ventes[r.code] * r.prixHt)));
  const marge = auCentime(somme(f.gamme.map((r) => v.ventes[r.code] * margeDe(f, r.code))));
  const pulls = v.ventes["col-rond"] + v.ventes.merinos;
  const salarie = f.equipe.find((s) => s.code === v.code)!;
  return {
    ...v,
    poste: salarie.poste,
    articles,
    chiffre,
    marge,
    transformation: v.tickets / v.prisEnCharge,
    indice: articles / v.tickets,
    panier: chiffre / v.tickets,
    margeParClient: marge / v.prisEnCharge,
    cardigans: v.ventes.cardigan,
    venteAdditionnelle: v.echarpesAvecLeCardigan / v.ventes.cardigan,
    pulls,
    merinos: v.ventes.merinos,
    monteeEnGamme: v.ventes.merinos / pulls,
  };
}

/** Le samedi des trois vendeurs, et ce que vaut chaque technique. */
export function samediDesVendeurs(f: FicheDeLaBoutique) {
  const vendeurs = SAMEDI_DES_VENDEURS.map((v) => indicateursDuVendeur(f, v));
  const tickets = somme(vendeurs.map((v) => v.tickets));
  const margeDUneEcharpe = margeDe(f, "echarpe");
  const margeDeLaMontee = auCentime(margeDe(f, "merinos") - margeDe(f, "col-rond"));
  const meilleur = (t: CodeDeTechnique) => Math.max(...vendeurs.map((v) => (t === "additionnelle" ? v.venteAdditionnelle : v.monteeEnGamme)));
  const entrees = somme(f.affluence.samedi);
  // La marge moyenne d'un article vendu en caisse en janvier : celle des fidèles et des passants.
  const carte = carteDeFidelite(f);
  const passants = passantsDeJanvier(f);
  const margeDUnArticleEnCaisse = auCentime((carte.marge + passants.marge) / (carte.articles + passants.articles));
  return {
    vendeurs,
    vendeur: (code: VendeurDuSamedi["code"]) => vendeurs.find((v) => v.code === code)!,
    entrees,
    prisEnCharge: somme(vendeurs.map((v) => v.prisEnCharge)),
    sansContact: entrees - somme(vendeurs.map((v) => v.prisEnCharge)),
    tickets,
    articles: somme(vendeurs.map((v) => v.articles)),
    chiffre: auCentime(somme(vendeurs.map((v) => v.chiffre))),
    margeDUneEcharpe,
    margeDeLaMontee,
    meilleur,
    vusEnLigne: VUS_EN_LIGNE_LE_SAMEDI,
    partDuRopo: VUS_EN_LIGNE_LE_SAMEDI / tickets,
    retraits: RETRAITS_DE_JANVIER,
    articlesAuRetrait: Math.round(RETRAITS_DE_JANVIER * ACCEPTATION_AU_RETRAIT),
    margeDUnArticleEnCaisse,
    margeAuRetrait: auCentime(Math.round(RETRAITS_DE_JANVIER * ACCEPTATION_AU_RETRAIT) * margeDUnArticleEnCaisse),
  };
}

/** La marge gagnée par samedi si chaque vendeur sous un taux visé (de 0 à 1) l'atteignait, pour une technique. */
export function gainDeLaFormation(f: FicheDeLaBoutique, technique: CodeDeTechnique, taux: number) {
  const s = samediDesVendeurs(f);
  const lignes = s.vendeurs.map((v) => {
    const base = technique === "additionnelle" ? v.cardigans : v.pulls;
    const actuel = technique === "additionnelle" ? v.venteAdditionnelle : v.monteeEnGamme;
    const enPlus = Math.max(0, taux - actuel) * base;
    return { code: v.code, poste: v.poste, base, actuel, enPlus };
  });
  const unitaire = technique === "additionnelle" ? s.margeDUneEcharpe : s.margeDeLaMontee;
  const ventesEnPlus = somme(lignes.map((l) => l.enPlus));
  return { technique, taux, lignes, unitaire, ventesEnPlus, marge: auCentime(ventesEnPlus * unitaire), meilleur: s.meilleur(technique) };
}

/**
 * LE DROIT DE RÉTRACTATION (code de la consommation, articles L. 221-18 et suivants) : 14 jours pour un
 * contrat conclu à distance ou hors établissement, à compter de la réception du bien ; le professionnel
 * rembourse au plus tard 14 jours après la décision du client ; s'il n'a pas informé le client de ce
 * droit, le délai est prolongé de 12 mois. Un achat conclu en boutique n'en a pas. // À VÉRIFIER
 */
export const JOURS_DE_RETRACTATION = 14;
export const JOURS_POUR_REMBOURSER = 14;
export const MOIS_DE_PROLONGATION_SANS_INFORMATION = 12;

/**
 * LA COMMANDE EN LIGNE (hypothèse du cours) : un pull mérinos commandé et payé sur le site, retiré en
 * boutique le 6 mars ; la cliente annonce le 15 mars qu'elle se rétracte, et rapporte le pull intact.
 */
export const COMMANDE_EN_LIGNE = { reference: "merinos" as CodeDeReference, retrait: 6, decision: 15, mois: "mars" };

/** La rétractation de la commande en ligne : le dernier jour pour se rétracter, la somme et la date du remboursement. */
export function retractation(f: FicheDeLaBoutique) {
  const r = referenceDe(f, COMMANDE_EN_LIGNE.reference);
  return {
    ...COMMANDE_EN_LIGNE,
    nom: r.nom,
    rembourse: r.prixTtc,
    dernierJour: COMMANDE_EN_LIGNE.retrait + JOURS_DE_RETRACTATION,
    remboursementAuPlusTard: COMMANDE_EN_LIGNE.decision + JOURS_POUR_REMBOURSER,
  };
}

/**
 * LE SAMEDI APRÈS LA FORMATION (hypothèse du cas « Le samedi après la formation ») : l'étudiante, formée
 * à la montée en gamme et à la vente additionnelle par le vendeur, accueille encore 50 clients ; elle
 * conclut 14 passages.
 */
export const SAMEDI_APRES_LA_FORMATION: VendeurDuSamedi = {
  code: "etudiante",
  prisEnCharge: 50,
  tickets: 14,
  ventes: { "col-rond": 4, merinos: 2, cardigan: 5, echarpe: 4, bonnet: 2 },
  echarpesAvecLeCardigan: 2,
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. LA FIDÉLISATION
// ═════════════════════════════════════════════════════════════════════════════

/**
 * L'ENQUÊTE DE SATISFACTION (hypothèse du cours) : 200 clients ont noté la boutique de 0 à 10, par le
 * lien du ticket. Le rang du tableau est la note : 6 clients ont mis 3, 38 ont mis 10.
 */
export const NOTES_DE_SATISFACTION: readonly number[] = [0, 0, 0, 6, 8, 14, 22, 30, 40, 42, 38];

/** LES RÉCLAMATIONS DE JANVIER (hypothèse du cours), par motif, pour 940 passages en caisse. */
export const RECLAMATIONS_DU_MOIS: readonly { code: "defaut" | "echange" | "attente"; libelle: string; nombre: number }[] = [
  { code: "defaut", libelle: "Un article défectueux", nombre: 9 },
  { code: "echange", libelle: "Un échange de taille refusé", nombre: 6 },
  { code: "attente", libelle: "L'attente en caisse", nombre: 4 },
];

/**
 * LA REMISE DE LA CARTE (hypothèse du cours) : aujourd'hui, la carte enregistre les achats sans rien
 * rendre. Le prestataire du programme annonce qu'une remise sur chaque achat ferait tomber les départs
 * de 5 % à 4 % par mois.
 */
export const DEPARTS_AVEC_LA_REMISE = 0.04;
export const REMISE_ETUDIEE = 0.05;

/**
 * L'E-RÉPUTATION (hypothèse du cours) : la note de la boutique sur les sites d'avis passe de 4,5 à 4,1
 * sur 5, après des avis sur l'attente en caisse. Chaque dixième de point perdu fait 2 % d'entrées de
 * passants en moins (une étude de l'enseigne de la rue, hypothèse) ; ils achètent comme en janvier.
 */
export const NOTE_EN_LIGNE = { avant: 4.5, apres: 4.1 } as const;
export const ENTREES_PERDUES_PAR_DIXIEME = 0.02;

/**
 * LA RÉCLAMATION (hypothèse du cours) : une cliente rapporte un pull mérinos acheté il y a 8 mois, dont
 * la maille a filé au premier lavage, fait selon l'étiquette. La garantie légale de conformité court
 * 2 ans à compter de la délivrance, et le défaut est présumé exister dès l'achat pendant ces 2 ans ; le
 * vendeur répare ou remplace, au choix du client, dans les 30 jours, sinon il rembourse.
 * (Code de la consommation, articles L. 217-3 et suivants.) // À VÉRIFIER
 */
export const RECLAMATION_DU_MERINOS = { reference: "merinos" as CodeDeReference, moisDepuisLAchat: 8 };
export const MOIS_DE_GARANTIE_LEGALE = 24;
export const JOURS_POUR_REPARER_OU_REMPLACER = 30;

/**
 * LE CAS « LA CARTE DU PRESTATAIRE » (hypothèse du cas) : le prestataire propose 8 % de remise ; une
 * boutique comparable, qui l'a lancée, voit ses départs tomber à 4,5 % seulement.
 */
export const REMISE_DU_PRESTATAIRE = 0.08;
export const DEPARTS_D_UNE_BOUTIQUE_COMPARABLE = 0.045;

/** La satisfaction : réponses, note moyenne, promoteurs (9 et 10), détracteurs (0 à 6), NPS ; et les réclamations. */
export function satisfaction(f: FicheDeLaBoutique) {
  const reponses = somme(NOTES_DE_SATISFACTION);
  const points = somme(NOTES_DE_SATISFACTION.map((n, note) => n * note));
  const promoteurs = NOTES_DE_SATISFACTION[9]! + NOTES_DE_SATISFACTION[10]!;
  const detracteurs = somme(NOTES_DE_SATISFACTION.slice(0, 7));
  const passages = somme(f.clienteles.filter((c) => c.delaiDeReglement === 0).map((c) => c.tickets));
  const reclamations = somme(RECLAMATIONS_DU_MOIS.map((r) => r.nombre));
  return {
    reponses,
    noteMoyenne: points / reponses,
    promoteurs,
    passifs: reponses - promoteurs - detracteurs,
    detracteurs,
    partDesPromoteurs: promoteurs / reponses,
    partDesDetracteurs: detracteurs / reponses,
    nps: Math.round(((promoteurs - detracteurs) / reponses) * 100),
    passages,
    reclamations,
    tauxDeReclamations: reclamations / passages,
    partDesDefauts: RECLAMATIONS_DU_MOIS.find((r) => r.code === "defaut")!.nombre / reclamations,
  };
}

/** La valeur d'une cliente fidèle : la marge d'un passage, une remise de la carte, les départs. */
export function valeurDUneCliente(f: FicheDeLaBoutique, remise = 0, departs = TAUX_DE_DEPART_PAR_MOIS) {
  const carte = carteDeFidelite(f);
  const panierHt = auCentime(carte.chiffreDAffaires / carte.tickets);
  const remiseDUnPassage = auCentime(remise * panierHt);
  const margeDUnPassage = auCentime(carte.margeDUnPassage - remiseDUnPassage);
  return {
    clientes: carte.clientes,
    panierHt,
    remiseDUnPassage,
    margeDUnPassage,
    departs,
    fidelite: 1 - departs,
    dureeDeVie: 1 / departs,
    valeur: auCentime(margeDUnPassage / departs),
    chiffreDuMois: carte.chiffreDAffaires,
    remiseDuMois: auCentime(remise * carte.chiffreDAffaires),
  };
}

/** La plus forte remise, en % entier, qui garde la valeur d'une cliente au moins à celle d'aujourd'hui, pour des départs donnés. */
export function remiseQuiTient(f: FicheDeLaBoutique, departs: number, max = 20) {
  const base = valeurDUneCliente(f).valeur;
  let r = -1;
  for (let x = 0; x <= max; x++) if (valeurDUneCliente(f, x / 100, departs).valeur >= base) r = x;
  return r;
}

/** L'e-réputation qui baisse : les entrées, les passages et la marge des passants perdus dans le mois. */
export function eReputation(f: FicheDeLaBoutique) {
  const p = passantsDeJanvier(f);
  const dixiemes = Math.round((NOTE_EN_LIGNE.avant - NOTE_EN_LIGNE.apres) * 10);
  const baisse = dixiemes * ENTREES_PERDUES_PAR_DIXIEME;
  // Les lignes de la copie : les entrées et les passages au centième, puis à l'unité la plus proche ;
  // la transformation à deux décimales en pourcentage.
  const entreesCalculees = auCentime(p.entrees * baisse);
  const entreesPerdues = Math.round(entreesCalculees);
  const transformation = auDixMillieme(p.tauxDeTransformation);
  const passagesCalcules = auCentime(entreesPerdues * transformation);
  const passagesPerdus = Math.round(passagesCalcules);
  return { ...NOTE_EN_LIGNE, dixiemes, baisse, entrees: p.entrees, entreesCalculees, entreesPerdues, transformation, passagesCalcules, passagesPerdus, margeDUneVente: p.margeDUneVente, margePerdue: auCentime(passagesPerdus * p.margeDUneVente) };
}

/** La réclamation du mérinos : ce que coûte le remplacement, et le résultat de la vente remplacée ou remboursée. */
export function reclamation(f: FicheDeLaBoutique) {
  const r = referenceDe(f, RECLAMATION_DU_MERINOS.reference);
  const cout = auCentime(r.coutDAchat + r.autresCoutsVariables);
  const marge = auCentime(r.prixHt - cout);
  return {
    ...RECLAMATION_DU_MERINOS,
    nom: r.nom,
    prixTtc: r.prixTtc,
    prixHt: r.prixHt,
    cout,
    marge,
    sousGarantie: RECLAMATION_DU_MERINOS.moisDepuisLAchat <= MOIS_DE_GARANTIE_LEGALE,
    resultatSiRemplace: auCentime(marge - cout),
    resultatSiRembourse: auCentime(-cout),
  };
}
