import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeAuTarif, concurrentsDe, lHotelEnIndicateurs, type IndicateursDHotel } from "../monde/concurrence-hoteliere";
import { trimestreDeLHotel } from "../monde/hotel";
import { HOTELS_DU_COURS, type FicheDeLHotel } from "../monde/l-escale";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE TAUX D'OCCUPATION, LE PRIX MOYEN ET LE REVENU PAR CHAMBRE (BTS MHR, palier 2).
 *
 * Les trois indicateurs de l'hébergement, sur une année, trimestre après trimestre : le taux
 * d'occupation (chambres vendues ÷ chambres disponibles), le prix moyen par chambre louée (chiffre
 * d'affaires hébergement ÷ chambres vendues) et le revenu par chambre disponible, le RevPAR
 * (chiffre d'affaires hébergement ÷ chambres disponibles, soit l'occupation multipliée par le prix
 * moyen). Puis, face à un concurrent du même trimestre qui loue ses chambres plus cher et en
 * remplit moins, pourquoi le RevPAR juge mieux un trimestre que le prix moyen seul.
 *
 * IL NE DOUBLE PAS « Les indicateurs du point de vente » (BTS MCO), qui lit un mois de ventes
 * clientèle par clientèle, le panier et le remplissage d'une salle : ici, les trois chiffres que
 * l'hôtelier lit ensemble, et le troisième qui combine les deux premiers. Ni « Remplir l'hôtel :
 * le prix selon la saison » (palier 3), qui fait varier le prix d'un trimestre à l'autre : ici, le
 * prix est celui de l'année.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène. L'hôtel est
 * L'ESCALE (monde/l-escale.ts), et son année est celle du chapitre « le prix selon la saison » au
 * prix unique : toutes les chambres en vente chaque nuit, au prix de l'année, la demande de chaque
 * clientèle posée par la fiche, l'hôtel vend la plus petite de la demande et des chambres
 * disponibles (monde/hotel.ts). Les deux hôtels de comparaison sont les concurrents de la fiche,
 * posés tels quels (monde/concurrence-hoteliere.ts). Les taux sont au dixième, les prix au centime.
 * Une évolution du moteur de l'arène ne change rien ici.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, occupation, prix-moyen, revpar (la formule est au repère, la question nomme ce
 *     qu'il faut diviser) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-le-revpar
 *     puis le-terminus-au-curseur (les chambres que le concurrent plus cher devait vendre pour
 *     rapporter autant par chambre disponible) avant revpar ; predire-la-promotion puis
 *     la-promotion-au-curseur (les chambres qu'une baisse de prix doit faire vendre pour garder la
 *     marge, face à celles qui gardent le RevPAR) avant deux-seuils ;
 *   · autonome : l-annee, face-au-concurrent, qui-vend-le-mieux, pourquoi-le-revpar, deux-seuils (ni
 *     formule ni chiffres à prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : le-laboratoire-du-revpar (le prix du trimestre creux et le coût d'une chambre occupée :
 *     trouver un prix qui monte le RevPAR et fait baisser le résultat), decomposer-l-ecart (l'écart de
 *     RevPAR entre deux hôtels, en effet de l'occupation et effet du prix, comme un écart sur volume et
 *     un écart sur prix), a-rebours (le prix moyen, les chambres vendues et le chiffre d'affaires d'un
 *     concurrent, à partir de son RevPAR et de son taux d'occupation), la-limite-du-revpar (une
 *     critique de l'indicateur) ; puis la synthèse.
 */

/** Les entreprises du cours qui louent des chambres. */
export const HOTELS = ["hotel"] as const;

/**
 * LA PROMOTION DU TRIMESTRE CREUX, hypothèse du cours : une nuitée 10 % moins chère au trimestre où
 * l'hôtel remplit le moins, les autres trimestres gardant le prix de l'année.
 */
export const BAISSE_DE_LA_PROMOTION = 0.1;

/** Les bornes du curseur du concurrent : les chambres qu'il vend au trimestre comparé. */
export const CHAMBRES_DU_CONCURRENT = { min: 1_000 } as const;

/**
 * LE LABORATOIRE DU REVPAR : le prix de la nuitée au trimestre creux (de 50 à 100 €, par 10 centimes)
 * et ce que coûte une nuitée occupée (de 15 à 30 €, par euro).
 */
export const PRIX_DU_LABORATOIRE = { min: 50, max: 100, pas: 0.1 } as const;
export const COUT_DU_LABORATOIRE = { min: 15, max: 30, pas: 1 } as const;

/** Les colonnes d'une année, trimestre par trimestre. */
const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « du Comptoir », « de la Villa », « des Halles », « de L'ESCALE » : l'article se contracte. */
export const duNom = (nom: string) =>
  nom.startsWith("Le ") ? `du ${nom.slice(3)}` : nom.startsWith("Les ") ? `des ${nom.slice(4)}` : nom.startsWith("La ") ? `de la ${nom.slice(3)}` : dE(nom);
/** « au Comptoir », « à la Villa », « à L'ESCALE ». */
export const auNom = (nom: string) =>
  nom.startsWith("Le ") ? `au ${nom.slice(3)}` : nom.startsWith("Les ") ? `aux ${nom.slice(4)}` : nom.startsWith("La ") ? `à la ${nom.slice(3)}` : `à ${nom}`;
const rang = (k: number) => (k === 0 ? "1er" : `${k + 1}e`);
/** « 3e trimestre », dans une phrase (k compté à partir de 0). */
export const trimestre = (k: number) => `${rang(k)} trimestre`;

/** La fiche de l'hôtel du cours. */
export const ficheDeLHotel = (c: Pick<Cas, "code">): FicheDeLHotel => HOTELS_DU_COURS[c.code]!;

/** L'année de l'hôtel au prix de l'année, ses trois indicateurs, et le concurrent qui loue plus cher sans mieux vendre. */
export function occupation(c: Pick<Cas, "code">) {
  const f = ficheDeLHotel(c);
  const modele = anneeAuTarif(f);
  const hotel = lHotelEnIndicateurs(f, modele);
  const t = hotel.trimestres;
  const occupations = t.map((x) => x.occupation);
  const meilleur = occupations.indexOf(Math.max(...occupations));
  const plusFaible = occupations.indexOf(Math.min(...occupations));
  const concurrents = concurrentsDe(f);
  // Le premier trimestre où un concurrent, avec autant de chambres, loue plus cher et en tire moins
  // par chambre disponible : il en a forcément rempli moins.
  let comparaison: { trimestre: number; concurrent: number } | null = null;
  for (let k = 0; k < t.length && !comparaison; k++) {
    const i = concurrents.findIndex(
      (x) => x.trimestres[k]!.disponibles === t[k]!.disponibles && x.trimestres[k]!.prixMoyen > t[k]!.prixMoyen && x.trimestres[k]!.revpar < t[k]!.revpar,
    );
    if (i >= 0) comparaison = { trimestre: k, concurrent: i };
  }
  if (!comparaison) throw new Error(`Aucun concurrent ${dE(f.entreprise)} ne loue plus cher sans mieux vendre`);
  const k = comparaison.trimestre;
  const rival = concurrents[comparaison.concurrent]!;
  const autre = concurrents.find((x) => x !== rival)!;
  // Le trimestre où l'hôtel a refusé le plus de nuitées, faute de chambres : le taux d'occupation ne le voit pas.
  const refusees = modele.trimestres.map((x) => x.refusees);
  const lePlusRefuse = refusees.indexOf(Math.max(...refusees));
  const h = t[k]!;
  const r = rival.trimestres[k]!;
  const a = autre.trimestres[k]!;
  const prixDuRival = rival.prix[k]!;
  const dispo = h.disponibles;
  // Le curseur du concurrent : les chambres qu'il devait vendre, à son prix, pour rapporter autant que
  // l'hôtel par chambre disponible (même nombre de chambres disponibles).
  const chambresPourEgaler = Math.ceil(h.chiffreDAffaires / prixDuRival - 1e-9);
  // L'écart de RevPAR (concurrent moins hôtel) en deux effets, comme un écart sur volume (l'occupation,
  // au prix moyen de l'hôtel) et un écart sur prix (sur l'occupation du concurrent).
  const effetOccupation = auCentime(((r.vendues - h.vendues) * h.prixMoyen) / dispo);
  const effetPrix = auCentime(((r.prixMoyen - h.prixMoyen) * r.vendues) / dispo);
  // À rebours : ce que publient les chiffres de l'autre concurrent, son RevPAR et son taux d'occupation.
  const publie = { revpar: a.revpar, occupation: a.occupation };
  // La promotion du trimestre creux : les chambres qui gardent le RevPAR, et celles qui gardent la marge.
  const kc = plusFaible;
  const creux = t[kc]!;
  const prixPromo = auCentime(f.prixDeLAnnee * (1 - BAISSE_DE_LA_PROMOTION));
  const margeAuTarif = auCentime((f.prixDeLAnnee - f.coutVariableParNuitee) * creux.vendues);
  const margePromo = auCentime(prixPromo - f.coutVariableParNuitee);
  const promo = trimestreDeLHotel(f, kc + 1, prixPromo);
  return {
    f,
    chambres: f.chambres,
    nuits: f.joursParTrimestre,
    /** Le prix de la nuitée, le même aux quatre trimestres. */
    prix: f.prixDeLAnnee,
    trimestres: t,
    annee: hotel.annee,
    meilleur,
    plusFaible,
    /** Le trimestre où le plus de nuitées demandées n'ont pas trouvé de chambre, et combien. */
    refus: { trimestre: lePlusRefuse, nuitees: refusees[lePlusRefuse]! },
    comparaison: {
      trimestre: k,
      hotel: t[k]!,
      rival: { nom: rival.nom, ...rival.trimestres[k]! },
      autre: { nom: autre.nom, ...autre.trimestres[k]! },
      prixDuRival,
      chambresPourEgaler,
      effetOccupation,
      effetPrix,
      ecartDeRevpar: auCentime(r.revpar - h.revpar),
    },
    aRebours: {
      nom: autre.nom,
      publie,
      vendues: Math.round((publie.occupation / 100) * dispo),
      chiffreDAffaires: auCentime(publie.revpar * dispo),
      prixMoyen: auCentime(publie.revpar / (publie.occupation / 100)),
      vrai: a,
    },
    promotion: {
      trimestre: kc,
      creux,
      prix: prixPromo,
      margeAuTarif,
      margeParChambre: margePromo,
      pourLeRevpar: Math.ceil(creux.chiffreDAffaires / prixPromo - 1e-9),
      pourLaMarge: Math.ceil(margeAuTarif / margePromo - 1e-9),
      simulee: promo,
      ecartDeResultat: auCentime(promo.resultat - modele.trimestres[kc]!.resultat),
    },
  };
}

export type Occupation = ReturnType<typeof occupation>;

/** Les prix que le laboratoire propose, de son minimum à son maximum, par son pas. */
const prixDuLaboratoire = () => {
  const p = PRIX_DU_LABORATOIRE;
  return Array.from({ length: Math.round((p.max - p.min) / p.pas) + 1 }, (_, i) => auCentime(p.min + i * p.pas));
};

/**
 * LE LABORATOIRE DU REVPAR : le trimestre creux de l'hôtel, rejoué par le modèle de l'hôtel à un prix et
 * à un coût de la nuitée occupée quelconques (la fiche n'est pas changée : le coût n'est remplacé que
 * dans la copie que le laboratoire rejoue). Le défi : un RevPAR plus haut qu'au prix de l'année, et un
 * résultat du trimestre plus bas qu'à ce prix, au même coût. Sa solution : au coût de la fiche, le plus
 * haut prix, à l'euro, qui le relève.
 */
export function laboratoireDuRevpar(c: Pick<Cas, "code">) {
  const o = occupation(c);
  const f = o.f;
  const n = o.plusFaible + 1;
  const rejoue = (prix: number, cout: number) => {
    const t = trimestreDeLHotel({ ...f, coutVariableParNuitee: cout }, n, prix);
    return { ...t, occupation: auDixieme((t.vendues / t.offertes) * 100), revpar: auCentime(t.chiffreDAffaires / t.offertes), prixMoyen: auCentime(t.chiffreDAffaires / t.vendues) };
  };
  const depart = { prix: f.prixDeLAnnee, cout: f.coutVariableParNuitee };
  const atteint = (p: Readonly<Record<string, number>>) => {
    const x = rejoue(p.prix!, p.cout!);
    const auTarif = rejoue(f.prixDeLAnnee, p.cout!);
    return x.revpar > auTarif.revpar && x.resultat < auTarif.resultat;
  };
  const prix = prixDuLaboratoire()
    .filter((p) => Number.isInteger(p))
    .reverse()
    .find((p) => atteint({ prix: p, cout: depart.cout }));
  if (prix === undefined) throw new Error(`${f.entreprise} : le laboratoire du RevPAR n'a pas de solution`);
  return { o, f, trimestre: n, rejoue, depart, atteint, solution: { prix, cout: depart.cout } };
}

/** L'année de l'hôtel, trimestre par trimestre. */
export function tableauDeLHotel(c: Cas): TableauDeDonnees {
  const o = occupation(c);
  const t = o.trimestres;
  const ligne = (libelle: string, g: (x: IndicateursDHotel) => string) => ({ libelle, valeurs: t.map(g) });
  return {
    titre: `L'hébergement ${dE(o.f.entreprise)}, trimestre par trimestre`,
    colonnes: TRIMESTRES.slice(0, t.length),
    lignes: [
      ligne("Chambres disponibles", (x) => qte(x.disponibles)),
      ligne("Chambres vendues", (x) => qte(x.vendues)),
      ligne("Chiffre d'affaires hébergement HT", (x) => eur(x.chiffreDAffaires)),
    ],
  };
}

/** Le trimestre de la comparaison, pour les trois hôtels de la ville. */
export function tableauDesTroisHotels(c: Cas): TableauDeDonnees {
  const o = occupation(c);
  const k = o.comparaison;
  const ligne = (nom: string, x: IndicateursDHotel) => ({ libelle: nom, valeurs: [qte(x.disponibles), qte(x.vendues), eur(x.chiffreDAffaires)] });
  return {
    titre: `Les hôtels de la ville au ${trimestre(k.trimestre)}`,
    colonnes: ["Chambres disponibles", "Chambres vendues", "Chiffre d'affaires HT"],
    lignes: [ligne(o.f.entreprise, k.hotel), ligne(k.rival.nom, k.rival), ligne(k.autre.nom, k.autre)],
  };
}

export const OCCUPATION_ET_REVENU_PAR_CHAMBRE: Chapitre = {
  code: "occupation-et-revenu-par-chambre",
  parcours: "mhr",
  palier: 2,
  blocs: ["BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration"],
  titre: "Le taux d'occupation, le prix moyen et le revenu par chambre",
  accroche:
    "Les trois chiffres que l'hôtelier lit ensemble : la part des chambres vendues, le prix moyen d'une chambre louée, et le revenu par chambre disponible qui les combine. Et pourquoi l'hôtel qui loue le plus cher n'est pas toujours celui qui vend le mieux.",
  objectifs: [
    "Compter les chambres disponibles d'un trimestre",
    "Calculer le taux d'occupation, trimestre par trimestre",
    "Calculer le prix moyen par chambre louée",
    "Calculer le RevPAR, et le retrouver par l'occupation et le prix moyen",
    "Juger un trimestre au RevPAR plutôt qu'au prix moyen seul",
    "Décomposer un écart de RevPAR, et chiffrer ce qu'une baisse de prix doit faire vendre",
  ],
  libre: false,
  entreprises: {
    codes: HOTELS,
    pourquoi: "ce chapitre compte des chambres louées à la nuit, et elle n'en loue pas.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une chambre, une nuit",
      notions: ["occupancy_revpar", "capacity"],
      texte: (c) => {
        const o = occupation(c);
        return [
          `Ce chapitre se joue dans la simulation du cours. ${o.f.entreprise} a ${qte(o.chambres)} chambres. Un trimestre compte ${qte(o.nuits)} nuits : chaque chambre peut se louer une fois par nuit, l'hôtel a donc ${qte(o.trimestres[0]!.disponibles)} chambres disponibles par trimestre. Une nuitée vendue, c'est une chambre louée pour une nuit.`,
          `Dans la simulation, ${o.f.entreprise} met toutes ses chambres en vente chaque nuit, au même prix toute l'année, ${eur(o.prix)} la nuitée, et ne vend que des nuitées : tout son chiffre d'affaires est celui de l'hébergement. Ses clientèles lui demandent plus ou moins de nuitées selon la saison ; l'hôtel vend ce qu'on lui demande, dans la limite de ses chambres.`,
          `Une chambre qui reste vide ce soir ne se revendra pas demain. Une nuitée occupée coûte ${eur(o.f.coutVariableParNuitee)} à l'hôtel (ménage, linge, petit-déjeuner) ; ses autres charges, ${eur(o.f.chargesFixesParTrimestre)} par trimestre, tombent que les chambres soient louées ou non.`,
        ];
      },
      repere: () =>
        "Taux d'occupation = chambres vendues ÷ chambres disponibles × 100. Prix moyen = chiffre d'affaires hébergement ÷ chambres vendues. RevPAR = chiffre d'affaires hébergement ÷ chambres disponibles = taux d'occupation × prix moyen.",
      tableau: tableauDeLHotel,
    },
    {
      id: "occupation",
      type: "montants",
      titre: "Le taux d'occupation",
      notions: ["occupancy_revpar", "seasonality"],
      tableau: tableauDeLHotel,
      question: () => "Calculez le taux d'occupation de chaque trimestre : les chambres vendues divisées par les chambres disponibles, en pourcentage, au dixième.",
      champs: (c) =>
        occupation(c).trimestres.map((x, k) => ({
          libelle: `Taux d'occupation, ${TRIMESTRES[k]} (%)`,
          attendu: x.occupation,
          calcul: `${qte(x.vendues)} ÷ ${qte(x.disponibles)} × 100 = ${pct(x.occupation)}`,
          tolerance: 0.1,
        })),
      explication: (c) => {
        const o = occupation(c);
        const faible = o.trimestres[o.plusFaible]!;
        const plein = o.trimestres[o.refus.trimestre]!;
        return [
          `L'hôtel est le plus rempli au ${trimestre(o.meilleur)} (${pct(o.trimestres[o.meilleur]!.occupation)}), le moins au ${trimestre(o.plusFaible)} (${pct(faible.occupation)}). Sur ${qte(faible.disponibles)} chambres disponibles, ${qte(faible.disponibles - faible.vendues)} sont restées vides ce trimestre-là.`,
          o.refus.nuitees > 0
            ? `Au ${trimestre(o.refus.trimestre)}, l'hôtel affiche ${pct(plein.occupation)}, et ${qte(o.refus.nuitees)} nuitées demandées n'ont pas trouvé de chambre. Le taux d'occupation ne les voit pas : il dit combien de chambres sont vides, pas combien de clients sont repartis, ni pourquoi.`
            : "Le taux d'occupation dit combien de chambres sont vides ; il ne dit pas pourquoi.",
        ];
      },
    },
    {
      id: "prix-moyen",
      type: "montants",
      titre: "Le prix moyen par chambre louée",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const o = occupation(c);
        return `Calculez le prix moyen par chambre louée du ${trimestre(o.meilleur)} et du ${trimestre(o.plusFaible)} : le chiffre d'affaires hébergement divisé par les chambres vendues, au centime.`;
      },
      champs: (c) => {
        const o = occupation(c);
        return [o.meilleur, o.plusFaible].map((k) => {
          const x = o.trimestres[k]!;
          return { libelle: `Prix moyen, ${TRIMESTRES[k]}`, attendu: x.prixMoyen, calcul: `${eur(x.chiffreDAffaires)} ÷ ${qte(x.vendues)} = ${eur(x.prixMoyen)}` };
        });
      },
      explication: (c) => {
        const o = occupation(c);
        return [
          `Le prix moyen est de ${eur(o.prix)} à chaque trimestre : ${o.f.entreprise} loue toutes ses chambres au même prix toute l'année, et son chiffre d'affaires ne bouge qu'avec l'occupation.`,
          "Le prix moyen se calcule sur les chambres louées : il ne voit pas les chambres restées vides.",
        ];
      },
    },
    {
      id: "predire-le-revpar",
      type: "choix",
      titre: "Pariez sur le concurrent plus cher",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        const plus = pct(Math.round((k.prixDuRival / k.hotel.prixMoyen - 1) * 1000) / 10);
        return `Avant de calculer, pariez. Au ${trimestre(k.trimestre)}, ${o.f.entreprise} loue ses chambres ${eur(k.hotel.prixMoyen)} et en remplit ${pct(k.hotel.occupation)}. ${k.rival.nom} les loue ${eur(k.prixDuRival)}, ${plus} plus cher, avec autant de chambres. Pour rapporter autant par chambre disponible, combien doit-il en remplir ?`;
      },
      options: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        const voir = "Faites vendre ses chambres au concurrent, au curseur de l'étape suivante.";
        const ecartEnPoints = Math.round((k.prixDuRival / k.hotel.prixMoyen - 1) * 100);
        return [
          { texte: `Au moins ${pct(k.hotel.occupation)}, comme ${o.f.entreprise}`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Environ ${pct(Math.round(k.hotel.occupation - ecartEnPoints))} : ${qte(ecartEnPoints)} points de moins`, juste: false, retour: `Pari à vérifier. ${voir}` },
          {
            texte: `Environ ${pct(Math.floor((k.chambresPourEgaler / k.hotel.disponibles) * 100))} : son prix compense`,
            juste: true,
            retour: `Bon pari. ${voir}`,
          },
        ];
      },
    },
    {
      id: "le-terminus-au-curseur",
      type: "curseur",
      titre: "Le concurrent au curseur",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return `Faites vendre ${auNom(k.rival.nom)} de ${qte(CHAMBRES_DU_CONCURRENT.min)} à ${qte(k.hotel.disponibles)} chambres au ${trimestre(k.trimestre)}, à ${eur(k.prixDuRival)}. Une droite donne ce que lui rapporte chaque chambre disponible, l'autre ce que rapporte chaque chambre disponible ${auNom(o.f.entreprise)}. Placez le curseur sur le moins de chambres vendues où il rapporte autant, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Chambres vendues ${duNom(occupation(c).comparaison.rival.nom)}`, unite: "chambres" }),
      cible: (c) => {
        const k = occupation(c).comparaison;
        return { attendu: k.chambresPourEgaler, min: CHAMBRES_DU_CONCURRENT.min, max: k.hotel.disponibles };
      },
      zones: ["Le concurrent rapporte plus par chambre", "L'hôtel du cours rapporte plus par chambre"],
      rates: (c) => {
        const o = occupation(c);
        return {
          dessous: `Avec si peu de chambres vendues, le concurrent rapporte moins que ${o.f.entreprise} par chambre disponible.`,
          dessus: "Moins de chambres vendues suffiraient encore : cherchez le plus petit nombre.",
        };
      },
      montrer: "Montrer le nombre de chambres",
      lecture: (c, n) => {
        const o = occupation(c);
        const k = o.comparaison;
        const revpar = auCentime((k.prixDuRival * n) / k.hotel.disponibles);
        return [
          { libelle: `Chiffre d'affaires ${duNom(k.rival.nom)}`, montant: auCentime(k.prixDuRival * n) },
          { libelle: `RevPAR ${duNom(k.rival.nom)}`, montant: revpar },
          { libelle: `RevPAR ${dE(o.f.entreprise)}`, montant: k.hotel.revpar },
          { libelle: "Écart de RevPAR", montant: auCentime(revpar - k.hotel.revpar), fort: true },
        ];
      },
      droites: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return {
          produit: (n) => (k.prixDuRival * n) / k.hotel.disponibles,
          cout: () => k.hotel.chiffreDAffaires / k.hotel.disponibles,
          libelles: [`Ce que rapporte une chambre disponible ${duNom(k.rival.nom)}`, `Ce que rapporte une chambre disponible ${auNom(o.f.entreprise)}`],
        };
      },
      explication: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        const taux = auDixieme((k.chambresPourEgaler / k.hotel.disponibles) * 100);
        return [
          `Il fallait ${qte(k.chambresPourEgaler)} chambres vendues, ${pct(taux)} d'occupation, pour rapporter ${eur(k.hotel.revpar)} par chambre disponible comme ${o.f.entreprise} ; ${k.rival.nom} en a vendu ${qte(k.rival.vendues)}.`,
          `Ce qu'une chambre disponible rapporte, c'est la part des chambres louées multipliée par leur prix : ${pct(taux)} × ${eur(k.prixDuRival)}, comme ${pct(k.hotel.occupation)} × ${eur(k.hotel.prixMoyen)}. Ce produit a un nom, le RevPAR : l'étape suivante le fait calculer.`,
        ];
      },
    },
    {
      id: "revpar",
      type: "montants",
      titre: "Le revenu par chambre disponible",
      notions: ["occupancy_revpar"],
      tableau: tableauDeLHotel,
      question: () =>
        "Calculez le RevPAR de chaque trimestre : le chiffre d'affaires hébergement divisé par les chambres disponibles, louées ou non, au centime.",
      champs: (c) =>
        occupation(c).trimestres.map((x, k) => ({
          libelle: `RevPAR, ${TRIMESTRES[k]}`,
          attendu: x.revpar,
          calcul: `${eur(x.chiffreDAffaires)} ÷ ${qte(x.disponibles)} = ${eur(x.revpar)}`,
        })),
      explication: (c) => {
        const o = occupation(c);
        const x = o.trimestres[o.plusFaible]!;
        return [
          `Le RevPAR se retrouve par les deux autres indicateurs : au ${trimestre(o.plusFaible)}, ${pct(x.occupation)} × ${eur(x.prixMoyen)} = ${eur(auCentime((x.occupation / 100) * x.prixMoyen))}, à l'arrondi du taux près.`,
          "Il compte toutes les chambres disponibles, les vides comprises : une chambre vide fait baisser le RevPAR, une chambre bradée aussi.",
        ];
      },
    },
    {
      id: "l-annee",
      type: "montants",
      titre: "L'année en trois chiffres",
      notions: ["occupancy_revpar"],
      tableau: tableauDeLHotel,
      question: () => "Sans formule cette fois. Calculez les trois indicateurs de l'année : son taux d'occupation (au dixième), son prix moyen et son RevPAR (au centime).",
      champs: (c) => {
        const a = occupation(c).annee;
        return [
          { libelle: "Taux d'occupation de l'année (%)", attendu: a.occupation, calcul: `${qte(a.vendues)} ÷ ${qte(a.disponibles)} × 100 = ${pct(a.occupation)}`, tolerance: 0.1 },
          { libelle: "Prix moyen de l'année", attendu: a.prixMoyen, calcul: `${eur(a.chiffreDAffaires)} ÷ ${qte(a.vendues)} = ${eur(a.prixMoyen)}` },
          { libelle: "RevPAR de l'année", attendu: a.revpar, calcul: `${eur(a.chiffreDAffaires)} ÷ ${qte(a.disponibles)} = ${eur(a.revpar)}` },
        ];
      },
      explication: (c) => {
        const o = occupation(c);
        const a = o.annee;
        return [
          `Sur l'année, ${o.f.entreprise} a vendu ${pct(a.occupation)} de ses chambres, à ${eur(a.prixMoyen)} en moyenne : chaque chambre disponible lui a rapporté ${eur(a.revpar)} par nuit.`,
        ];
      },
    },
    {
      id: "face-au-concurrent",
      type: "montants",
      titre: "Le concurrent plus cher",
      notions: ["occupancy_revpar", "price_elasticity"],
      tableau: tableauDesTroisHotels,
      question: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return `Deux hôtels de la ville servent de comparaison, avec autant de chambres que ${o.f.entreprise}. Dans la simulation, leurs chiffres sont posés tels quels : comme ${o.f.entreprise}, ils ne vendent que des nuitées. Au ${trimestre(k.trimestre)}, calculez le prix moyen ${duNom(k.rival.nom)}, puis son RevPAR, au centime.`;
      },
      champs: (c) => {
        const r = occupation(c).comparaison.rival;
        return [
          { libelle: `Prix moyen ${duNom(r.nom)}`, attendu: r.prixMoyen, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.vendues)} = ${eur(r.prixMoyen)}` },
          { libelle: `RevPAR ${duNom(r.nom)}`, attendu: r.revpar, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.disponibles)} = ${eur(r.revpar)}` },
        ];
      },
      explication: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return [
          `${k.rival.nom} loue plus cher : ${eur(k.rival.prixMoyen)} la chambre en moyenne, contre ${eur(k.hotel.prixMoyen)} ${auNom(o.f.entreprise)}. Mais il n'a rempli que ${pct(k.rival.occupation)} de ses chambres, contre ${pct(k.hotel.occupation)}. Chaque chambre disponible lui rapporte ${eur(k.rival.revpar)}, contre ${eur(k.hotel.revpar)} ${auNom(o.f.entreprise)}.`,
        ];
      },
    },
    {
      id: "qui-vend-le-mieux",
      type: "choix",
      titre: "Le juge du trimestre",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return `Au ${trimestre(k.trimestre)}, lequel des deux hôtels a le mieux vendu ses chambres : ${o.f.entreprise} ou ${k.rival.nom} ?`;
      },
      options: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        const nom = o.f.entreprise;
        return [
          {
            texte: `${nom} : chaque chambre disponible lui a rapporté plus.`,
            juste: true,
            retour: `Oui. Les deux hôtels ont ${qte(k.hotel.disponibles)} chambres disponibles, et l'essentiel de leurs charges tombe que les chambres soient louées ou non. Avec autant de chambres, le RevPAR le plus haut est le plus gros chiffre d'affaires : ${eur(k.hotel.chiffreDAffaires)} contre ${eur(k.rival.chiffreDAffaires)}.`,
          },
          {
            texte: `${k.rival.nom} : son prix moyen est le plus élevé des deux.`,
            juste: false,
            retour: `Il a loué chaque chambre ${eur(k.rival.prixMoyen)} au lieu de ${eur(k.hotel.prixMoyen)}, mais il n'en a rempli que ${pct(k.rival.occupation)}, contre ${pct(k.hotel.occupation)}. L'occupation a plus baissé que le prix n'a monté : il a fait moins de chiffre d'affaires avec autant de chambres.`,
          },
          {
            texte: "Les deux se valent : l'un loue plus cher, l'autre remplit plus.",
            juste: false,
            retour: `Le RevPAR les départage, parce qu'il multiplie l'occupation par le prix moyen : ${eur(k.hotel.revpar)} par chambre disponible ${auNom(nom)}, ${eur(k.rival.revpar)} pour ${k.rival.nom}.`,
          },
        ];
      },
    },
    {
      id: "pourquoi-le-revpar",
      type: "choix",
      titre: "Pourquoi le RevPAR",
      notions: ["occupancy_revpar", "price_elasticity"],
      question: () => "Pourquoi l'hôtelier juge-t-il un trimestre au RevPAR plutôt qu'au prix moyen seul ?",
      options: (c) => {
        const k = occupation(c).comparaison;
        return [
          {
            texte: "Il compte les chambres remplies et le prix de chacune.",
            juste: true,
            retour: `Oui. Louer plus cher fait monter le prix moyen et baisser l'occupation : le RevPAR dit lequel des deux l'emporte. Au ${trimestre(k.trimestre)}, c'est la baisse de l'occupation qui l'a emporté pour ${k.rival.nom}.`,
          },
          {
            texte: "Il ne dépend que de l'occupation : le prix ne change rien au revenu.",
            juste: false,
            retour: "Le RevPAR, c'est l'occupation multipliée par le prix moyen : un prix plus bas le fait baisser autant qu'une chambre vide de plus.",
          },
          {
            texte: "Il se calcule sur les chambres vendues, et oublie donc les chambres vides.",
            juste: false,
            retour: "C'est le prix moyen qui se calcule sur les chambres vendues. Le RevPAR se calcule sur les chambres disponibles : les chambres vides y pèsent.",
          },
        ];
      },
    },
    {
      id: "predire-la-promotion",
      type: "choix",
      titre: "Pariez sur la promotion",
      notions: ["occupancy_revpar", "contribution_margin"],
      question: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return `Pariez encore. Au ${trimestre(p.trimestre)}, le plus creux, ${o.f.entreprise} baisse la nuitée de ${pct(BAISSE_DE_LA_PROMOTION * 100)}, à ${eur(p.prix)}. Pour garder son résultat, l'hôtel doit-il vendre autant de chambres en plus que pour garder son RevPAR ?`;
      },
      options: (c) => {
        const o = occupation(c);
        const voir = "Le curseur de l'étape suivante compte les chambres qu'il faut, à ce prix.";
        return [
          { texte: "Autant : le RevPAR et le résultat suivent les mêmes chambres", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Plus : chaque chambre louée coûte aussi ${eur(o.f.coutVariableParNuitee)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Moins : les charges fixes sont déjà payées", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-promotion-au-curseur",
      type: "curseur",
      titre: "La promotion au curseur",
      notions: ["occupancy_revpar", "contribution_margin"],
      question: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return `Faites varier les chambres vendues au ${trimestre(p.trimestre)}, à ${eur(p.prix)}. Une droite donne la marge sur coûts variables du trimestre à ce prix (chaque chambre louée rapporte ${eur(p.prix)} et coûte ${eur(o.f.coutVariableParNuitee)}), l'autre la marge du trimestre au prix de l'année, ${eur(p.margeAuTarif)}. Placez le curseur sur le moins de chambres qui garde la marge, puis validez.`;
      },
      grandeur: (c) => {
        const p = occupation(c).promotion;
        return { libelle: `Chambres vendues à ${eur(p.prix)}`, unite: "chambres" };
      },
      cible: (c) => {
        const p = occupation(c).promotion;
        return { attendu: p.pourLaMarge, min: Math.floor(p.creux.vendues / 1000) * 1000, max: p.creux.disponibles };
      },
      zones: ["La promotion paie", "La promotion coûte"],
      rates: () => ({
        dessous: "Avec si peu de chambres vendues, la promotion fait baisser la marge du trimestre.",
        dessus: "Moins de chambres suffiraient encore : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre de chambres",
      lecture: (c, n) => {
        const o = occupation(c);
        const p = o.promotion;
        const marge = auCentime(p.margeParChambre * n);
        return [
          { libelle: `RevPAR à ${eur(p.prix)}`, montant: auCentime((p.prix * n) / p.creux.disponibles) },
          { libelle: `RevPAR à ${eur(o.prix)}`, montant: p.creux.revpar },
          { libelle: `Marge sur coûts variables à ${eur(p.prix)}`, montant: marge },
          { libelle: `Marge sur coûts variables à ${eur(o.prix)}`, montant: p.margeAuTarif },
          { libelle: "Écart de marge", montant: auCentime(marge - p.margeAuTarif), fort: true },
        ];
      },
      droites: (c) => {
        const p = occupation(c).promotion;
        return {
          produit: (n) => p.margeParChambre * n,
          cout: () => p.margeAuTarif,
          libelles: [`Marge à ${eur(p.prix)}`, "Marge au prix de l'année"],
        };
      },
      explication: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return [
          `Il faut ${qte(p.pourLaMarge)} chambres vendues pour garder la marge, quand ${qte(p.pourLeRevpar)} suffisent à garder le RevPAR. Entre les deux, le RevPAR monte et le résultat baisse : chaque chambre louée en plus coûte ${eur(o.f.coutVariableParNuitee)} de ménage, de linge et de petit-déjeuner, que le RevPAR ne voit pas.`,
          `À ${eur(p.prix)}, la simulation en vend ${qte(p.simulee.vendues)} : ${p.ecartDeResultat >= 0 ? `la promotion paie, de ${eur(p.ecartDeResultat)} sur le trimestre` : `la promotion coûte ${eur(-p.ecartDeResultat)} au trimestre`}.`,
        ];
      },
    },
    {
      id: "deux-seuils",
      type: "montants",
      titre: "Deux seuils pour une promotion",
      notions: ["occupancy_revpar", "contribution_margin"],
      question: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return `À ${eur(p.prix)} la nuitée, au ${trimestre(p.trimestre)}, calculez les chambres que l'hôtel doit vendre pour garder son RevPAR, puis la marge d'une chambre louée, puis les chambres qu'il doit vendre pour garder sa marge sur coûts variables (arrondies à l'unité supérieure).`;
      },
      champs: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return [
          {
            libelle: "Chambres à vendre pour garder le RevPAR",
            attendu: p.pourLeRevpar,
            calcul: `${eur(p.creux.chiffreDAffaires)} ÷ ${eur(p.prix)} = ${qte(p.pourLeRevpar)}`,
            tolerance: 1,
          },
          { libelle: "Marge d'une chambre louée en promotion", attendu: p.margeParChambre, calcul: `${eur(p.prix)} − ${eur(o.f.coutVariableParNuitee)} = ${eur(p.margeParChambre)}` },
          {
            libelle: "Chambres à vendre pour garder la marge",
            attendu: p.pourLaMarge,
            calcul: `(${eur(o.prix)} − ${eur(o.f.coutVariableParNuitee)}) × ${qte(p.creux.vendues)} ÷ ${eur(p.margeParChambre)} = ${eur(p.margeAuTarif)} ÷ ${eur(p.margeParChambre)} = ${qte(p.pourLaMarge)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const o = occupation(c);
        const p = o.promotion;
        return [
          `Garder le RevPAR, c'est garder le chiffre d'affaires : ${qte(p.pourLeRevpar)} chambres. Garder le résultat, c'est garder la marge : ${qte(p.pourLaMarge)} chambres, ${qte(p.pourLaMarge - p.pourLeRevpar)} de plus. Une baisse de prix se juge au second seuil.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-revpar",
      type: "simulation",
      titre: "Le laboratoire du RevPAR",
      notions: ["occupancy_revpar", "price_elasticity", "contribution_margin"],
      question: (c) => {
        const l = laboratoireDuRevpar(c);
        return `Rejouez le ${trimestre(l.trimestre - 1)} ${dE(l.f.entreprise)}, le plus creux. Deux leviers : le prix de la nuitée, auquel la demande répond (un prix plus haut de 1 % en fait perdre environ ${qte(-l.f.elasticite)} %), et ce que coûte une nuitée occupée. Le tableau suit l'occupation, le prix moyen, le RevPAR et le résultat du trimestre. Relevez le défi : il cache un piège.`;
      },
      leviers: (c) => {
        const l = laboratoireDuRevpar(c);
        return [
          { code: "prix", libelle: "Prix de la nuitée", unite: "€", ...PRIX_DU_LABORATOIRE, depart: l.depart.prix },
          { code: "cout", libelle: "Coût d'une nuitée occupée", unite: "€", ...COUT_DU_LABORATOIRE, depart: l.depart.cout },
        ];
      },
      lecture: (c, p) => {
        const l = laboratoireDuRevpar(c);
        const x = l.rejoue(p.prix!, p.cout!);
        const d = l.rejoue(l.depart.prix, l.depart.cout);
        return [
          { libelle: "Nuitées demandées", montant: x.demande, reference: d.demande, unite: "nuitées" },
          { libelle: "Nuitées vendues", montant: x.vendues, reference: d.vendues, unite: "nuitées" },
          { libelle: "Taux d'occupation", montant: x.occupation, reference: d.occupation, unite: "%" },
          { libelle: "Prix moyen", montant: x.prixMoyen, reference: d.prixMoyen },
          { libelle: "RevPAR", montant: x.revpar, reference: d.revpar, fort: true },
          { libelle: "Résultat du trimestre", montant: x.resultat, reference: d.resultat },
          { libelle: "Effet sur le résultat du trimestre", montant: auCentime(x.resultat - d.resultat) + 0, reference: 0, effet: true, fort: true },
        ];
      },
      // Le RevPAR et la marge par chambre disponible selon le prix : ni l'un ni l'autre n'est une droite.
      graphique: (c) => {
        const l = laboratoireDuRevpar(c);
        return {
          levier: "prix",
          courbes: [
            { libelle: "RevPAR", valeur: (p) => l.rejoue(p.prix!, p.cout!).revpar },
            {
              libelle: "Marge par chambre disponible",
              valeur: (p) => {
                const x = l.rejoue(p.prix!, p.cout!);
                return auCentime((x.chiffreDAffaires - x.coutsVariables) / x.offertes);
              },
            },
          ],
        };
      },
      defi: (c) => {
        const l = laboratoireDuRevpar(c);
        return {
          consigne: `Trouvez un prix qui fait monter le RevPAR du trimestre au-dessus de celui du prix de l'année (${eur(l.f.prixDeLAnnee)}), et qui fait pourtant baisser son résultat, au même coût d'une nuitée.`,
          atteint: l.atteint,
          indice: (p) => {
            const x = l.rejoue(p.prix!, p.cout!);
            const t = l.rejoue(l.f.prixDeLAnnee, p.cout!);
            return x.revpar <= t.revpar
              ? `Le RevPAR vaut ${eur(x.revpar)}, pas plus qu'à ${eur(l.f.prixDeLAnnee)} (${eur(t.revpar)}) : il reste des chambres vides à remplir.`
              : `Le RevPAR monte (${eur(x.revpar)}), mais le résultat aussi : ${eur(x.resultat)} contre ${eur(t.resultat)}. Descendez plus bas, jusqu'à remplir l'hôtel.`;
          },
          solution: l.solution,
        };
      },
      montrer: "Montrer un prix piège",
      explication: (c, p) => {
        const l = laboratoireDuRevpar(c);
        const x = l.rejoue(p.prix!, p.cout!);
        const t = l.rejoue(l.f.prixDeLAnnee, p.cout!);
        return [
          `À ${eur(p.prix!)}, l'hôtel vend ${qte(x.vendues)} nuitées sur ${qte(x.offertes)} : le RevPAR passe de ${eur(t.revpar)} à ${eur(x.revpar)}, et le résultat du trimestre de ${eur(t.resultat)} à ${eur(x.resultat)}. Le RevPAR ne compte que le chiffre d'affaires : chaque nuitée louée en plus coûte ${eur(p.cout!)}, et chaque nuitée déjà vendue part moins cher.`,
          "Faites monter le coût d'une nuitée occupée : la marge par chambre disponible s'écarte du RevPAR, et les prix pièges sont plus nombreux. Le RevPAR juge le revenu des chambres ; le résultat se juge à la marge.",
        ];
      },
    },
    {
      id: "decomposer-l-ecart",
      type: "montants",
      titre: "Décomposer l'écart de RevPAR",
      notions: ["occupancy_revpar", "price_elasticity"],
      tableau: tableauDesTroisHotels,
      question: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return `Au ${trimestre(k.trimestre)}, ${k.rival.nom} rapporte ${eur(Math.abs(k.ecartDeRevpar))} de moins par chambre disponible que ${o.f.entreprise}. Décomposez cet écart (${k.rival.nom} moins ${o.f.entreprise}) comme un écart sur volume et un écart sur prix : l'effet de l'occupation, valorisé au prix moyen ${dE(o.f.entreprise)}, puis l'effet du prix, sur l'occupation ${duNom(k.rival.nom)}, et vérifiez leur somme. Négatif pour un effet défavorable au concurrent.`;
      },
      champs: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        const d = qte(k.hotel.disponibles);
        return [
          {
            libelle: "Effet de l'occupation",
            attendu: k.effetOccupation,
            calcul: `(${qte(k.rival.vendues)} − ${qte(k.hotel.vendues)}) × ${eur(k.hotel.prixMoyen)} ÷ ${d} = ${eur(k.effetOccupation)}`,
            tolerance: 0.1,
          },
          {
            libelle: "Effet du prix",
            attendu: k.effetPrix,
            calcul: `(${eur(k.rival.prixMoyen)} − ${eur(k.hotel.prixMoyen)}) × ${qte(k.rival.vendues)} ÷ ${d} = ${eur(k.effetPrix)}`,
            tolerance: 0.05,
          },
          {
            libelle: "Écart de RevPAR",
            attendu: k.ecartDeRevpar,
            calcul: `${eur(k.effetOccupation)} + ${eur(k.effetPrix)} = ${eur(k.ecartDeRevpar)}, soit ${eur(k.rival.revpar)} − ${eur(k.hotel.revpar)}`,
          },
        ];
      },
      explication: (c) => {
        const o = occupation(c);
        const k = o.comparaison;
        return [
          `Le prix plus haut rapporte au concurrent ${eur(k.effetPrix)} par chambre disponible ; ses chambres vides lui en coûtent ${eur(Math.abs(k.effetOccupation))}. C'est la même décomposition qu'un écart sur chiffre d'affaires : la quantité au prix de référence, le prix sur la quantité réelle, et rien n'est compté deux fois.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le concurrent, à rebours",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const o = occupation(c);
        const r = o.aRebours;
        return `L'observatoire de l'hôtellerie de la ville ne publie que deux chiffres par hôtel. Au ${trimestre(o.comparaison.trimestre)}, pour ${r.nom} : un RevPAR de ${eur(r.publie.revpar)} et un taux d'occupation de ${pct(r.publie.occupation)}, sur ${qte(o.comparaison.hotel.disponibles)} chambres disponibles. Retrouvez son prix moyen, ses chambres vendues et son chiffre d'affaires.`;
      },
      champs: (c) => {
        const o = occupation(c);
        const r = o.aRebours;
        const d = o.comparaison.hotel.disponibles;
        return [
          { libelle: `Prix moyen ${duNom(r.nom)}`, attendu: r.prixMoyen, calcul: `${eur(r.publie.revpar)} ÷ ${pct(r.publie.occupation)} = ${eur(r.prixMoyen)}`, tolerance: 0.05 },
          { libelle: `Chambres vendues ${duNom(r.nom)}`, attendu: r.vendues, calcul: `${pct(r.publie.occupation)} × ${qte(d)} = ${qte(r.vendues)}`, tolerance: 3 },
          { libelle: `Chiffre d'affaires ${duNom(r.nom)}`, attendu: r.chiffreDAffaires, calcul: `${eur(r.publie.revpar)} × ${qte(d)} = ${eur(r.chiffreDAffaires)}`, tolerance: 10 },
        ];
      },
      explication: (c) => {
        const o = occupation(c);
        const r = o.aRebours;
        return [
          `Le RevPAR est le taux d'occupation multiplié par le prix moyen : divisé par le taux, il rend le prix moyen. Le vrai prix ${duNom(r.nom)} est de ${eur(r.vrai.prixMoyen)}, pour ${qte(r.vrai.vendues)} chambres vendues et ${eur(r.vrai.chiffreDAffaires)} : les petits écarts viennent des arrondis des chiffres publiés, au dixième et au centime.`,
        ];
      },
    },
    {
      id: "la-limite-du-revpar",
      type: "choix",
      titre: "Ce que le RevPAR ne voit pas",
      notions: ["occupancy_revpar", "contribution_margin"],
      question: (c) => `Le propriétaire veut juger le directeur ${dE(occupation(c).f.entreprise)} au seul RevPAR, trimestre après trimestre. Qu'en dites-vous ?`,
      options: (c) => {
        const o = occupation(c);
        const l = laboratoireDuRevpar(c);
        const x = l.rejoue(l.solution.prix, l.solution.cout);
        const t = l.rejoue(o.prix, l.solution.cout);
        return [
          {
            texte: "Le RevPAR ne voit pas ce que coûte une chambre occupée",
            juste: true,
            retour: `Oui. Au laboratoire, à ${eur(l.solution.prix)}, le RevPAR monte de ${eur(t.revpar)} à ${eur(x.revpar)} et le résultat baisse de ${eur(auCentime(t.resultat - x.resultat))}. Le RevPAR mesure le revenu des chambres : il se lit avec la marge, ou avec le résultat par chambre disponible.`,
          },
          {
            texte: "Il suffit : un RevPAR plus haut, c'est toujours plus de résultat",
            juste: false,
            retour: `Non : à ${eur(l.solution.prix)}, le RevPAR monte et le résultat baisse. Chaque chambre louée en plus coûte ${eur(o.f.coutVariableParNuitee)}.`,
          },
          {
            texte: "Mieux vaut le juger au taux d'occupation, qui voit les chambres vides",
            juste: false,
            retour: "Non : le taux d'occupation ne voit pas le prix, et un hôtel bradé se remplit. C'est le défaut inverse, en pire.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["occupancy_revpar"],
      texte: (c) => {
        const o = occupation(c);
        const a = o.annee;
        const k = o.comparaison;
        return [
          `Le taux d'occupation dit quelle part des chambres est louée, le prix moyen à quel prix elles partent, et le RevPAR combine les deux. Sur l'année, ${o.f.entreprise} a loué ${pct(a.occupation)} de ses chambres à ${eur(a.prixMoyen)} en moyenne : ${eur(a.revpar)} par chambre disponible.`,
          `Au ${trimestre(k.trimestre)}, ${k.rival.nom} louait plus cher mais remplissait moins : son RevPAR était plus bas. Un prix moyen haut ne suffit pas, un hôtel plein non plus : le RevPAR juge les deux à la fois. Mais il ne voit pas le coût d'une chambre occupée : une baisse de prix se juge à la marge qu'elle garde, pas au seul RevPAR.`,
          "Au niveau de l'examen, vous savez calculer les trois indicateurs d'un trimestre et d'une année, retrouver le prix moyen à partir du RevPAR et de l'occupation, décomposer un écart de RevPAR en effet de l'occupation et effet du prix, chiffrer les chambres qu'une promotion doit faire vendre, et dire ce que le RevPAR ne mesure pas.",
          "Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "RevPAR = chiffre d'affaires hébergement ÷ chambres disponibles = taux d'occupation × prix moyen.",
    },
  ],
};
