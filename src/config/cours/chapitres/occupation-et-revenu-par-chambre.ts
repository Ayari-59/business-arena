import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { anneeAuTarif, concurrentsDe, lHotelEnIndicateurs, type IndicateursDHotel } from "../monde/concurrence-hoteliere";
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
 */

/** Les entreprises du cours qui louent des chambres. */
export const HOTELS = ["hotel"] as const;

/** Les colonnes d'une année, trimestre par trimestre. */
const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
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
    },
  };
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
      question: () =>
        "Additionnez les quatre trimestres, puis calculez le taux d'occupation de l'année (au dixième), son prix moyen et son RevPAR (au centime).",
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
          `Au ${trimestre(k.trimestre)}, ${k.rival.nom} louait plus cher mais remplissait moins : son RevPAR était plus bas. Un prix moyen haut ne suffit pas, un hôtel plein non plus : le RevPAR juge les deux à la fois.`,
          "Dans l'arène, les chiffres de votre hôtel seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "RevPAR = chiffre d'affaires hébergement ÷ chambres disponibles = taux d'occupation × prix moyen.",
    },
  ],
};
