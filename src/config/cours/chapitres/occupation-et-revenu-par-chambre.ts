import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { soldUnits } from "../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../engine/types";
import { scenarioByCode } from "../../scenarios/registry";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { TRIMESTRES } from "./evaluer-son-activite";

/**
 * CHAPITRE : LE TAUX D'OCCUPATION, LE PRIX MOYEN ET LE REVENU PAR CHAMBRE (BTS MHR, palier 2).
 *
 * Les trois indicateurs de l'hébergement, sur l'année jouée, trimestre après trimestre : le taux
 * d'occupation (chambres vendues ÷ chambres disponibles), le prix moyen par chambre louée (chiffre
 * d'affaires hébergement ÷ chambres vendues) et le revenu par chambre disponible, le RevPAR
 * (chiffre d'affaires hébergement ÷ chambres disponibles, soit l'occupation multipliée par le prix
 * moyen). Puis, face à un concurrent du même trimestre qui remplit mieux à un prix plus bas,
 * pourquoi le RevPAR juge mieux un trimestre que l'occupation seule.
 *
 * IL NE DOUBLE PAS « Les indicateurs du point de vente » (BTS MCO), qui lit un mois de ventes
 * clientèle par clientèle, le panier et le remplissage d'une salle : ici, les trois chiffres que
 * l'hôtelier lit ensemble, et le troisième qui combine les deux premiers.
 *
 * LES CHIFFRES SONT CEUX DE L'ARÈNE, et ses indicateurs ceux qu'elle affiche (« Taux
 * d'occupation », « PMC », « RevPAR », config/scenarios/sector-kpis.ts). Les chambres
 * disponibles d'un trimestre sont la capacité que le moteur offre (les chambres de l'hôtel,
 * chacune une fois par nuit du trimestre) ; les chambres vendues, les nuitées vendues ; le
 * chiffre d'affaires, celui des nuitées, le seul que l'hôtel fasse dans l'arène. Tout vient de
 * l'année du cours (`anneeJouee`), où jouent aussi les deux premiers concurrents du scénario. Les
 * chambres et le chiffre d'affaires sont arrondis à l'unité et à l'euro, les taux au dixième et
 * les prix au centime, calculés sur ces arrondis. Aucune hypothèse propre au cours.
 */

/** Les entreprises du cours qui louent des chambres. */
export const HOTELS = ["hotel"] as const;

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
/** « du Comptoir », « de la Villa », « des Halles », « de L'ESCALE » : l'article se contracte. */
export const duNom = (nom: string) =>
  nom.startsWith("Le ") ? `du ${nom.slice(3)}` : nom.startsWith("Les ") ? `des ${nom.slice(4)}` : nom.startsWith("La ") ? `de la ${nom.slice(3)}` : dE(nom);
/** « au Comptoir », « à la Villa », « à L'ESCALE ». */
export const auNom = (nom: string) =>
  nom.startsWith("Le ") ? `au ${nom.slice(3)}` : nom.startsWith("Les ") ? `aux ${nom.slice(4)}` : nom.startsWith("La ") ? `à la ${nom.slice(3)}` : `à ${nom}`;
const rang = (k: number) => (k === 0 ? "1er" : `${k + 1}e`);
/** « 3e trimestre », dans une phrase. */
export const trimestre = (k: number) => `${rang(k)} trimestre`;

export interface TrimestreDHotel {
  disponibles: number;
  vendues: number;
  chiffreDAffaires: number;
  occupation: number;
  prixMoyen: number;
  revpar: number;
}

/** Les trois indicateurs d'un trimestre de l'arène, sur les chambres et le chiffre d'affaires arrondis. */
export function indicateursDuTrimestre(r: CompanyRoundResult): TrimestreDHotel {
  const disponibles = Math.round(r.production.machineCapacity);
  const vendues = Math.round(soldUnits(r));
  const chiffreDAffaires = Math.round(r.incomeStatement.revenue);
  return {
    disponibles,
    vendues,
    chiffreDAffaires,
    occupation: auDixieme((vendues / disponibles) * 100),
    prixMoyen: vendues > 0 ? auCentime(chiffreDAffaires / vendues) : 0,
    revpar: auCentime(chiffreDAffaires / disponibles),
  };
}

/** L'année de l'hôtel, ses trois indicateurs, et le concurrent qui remplit mieux sans mieux vendre. */
export function occupation(c: Cas) {
  const def = scenarioByCode(c.code);
  const { partie } = anneeJouee(c.code);
  const t = partie.rounds.map((tour) => indicateursDuTrimestre(tour.results["joueur"]!));
  const chambres = Math.round(partie.rounds[0]!.results["joueur"]!.production.machineCapacity / def.scenario.roundDays);
  const disponibles = t.reduce((s, x) => s + x.disponibles, 0);
  const vendues = t.reduce((s, x) => s + x.vendues, 0);
  const chiffreDAffaires = t.reduce((s, x) => s + x.chiffreDAffaires, 0);
  const occupations = t.map((x) => x.occupation);
  const meilleur = occupations.indexOf(Math.max(...occupations));
  const plusFaible = occupations.indexOf(Math.min(...occupations));
  // Le prix moyen exact, sur les nuitées et le chiffre d'affaires du moteur : l'arrondi des chambres
  // à l'unité déplace d'un centime celui que l'élève calcule.
  const prixExacts = partie.rounds.map((tour) => {
    const r = tour.results["joueur"]!;
    return auCentime(r.incomeStatement.revenue / soldUnits(r));
  });
  // Les deux premiers concurrents du scénario jouent l'année du cours avec l'hôtel (`anneeJouee`).
  const concurrents = def.bots.slice(0, 2).map((b) => ({
    nom: b.name,
    trimestres: partie.rounds.map((tour) => indicateursDuTrimestre(tour.results[b.id]!)),
  }));
  // Le premier trimestre où un concurrent remplit mieux ses chambres et en tire moins par chambre disponible.
  let comparaison: { trimestre: number; concurrent: number } | null = null;
  for (let k = 0; k < t.length && !comparaison; k++) {
    const i = concurrents.findIndex((x) => x.trimestres[k]!.occupation > t[k]!.occupation && x.trimestres[k]!.revpar < t[k]!.revpar);
    if (i >= 0) comparaison = { trimestre: k, concurrent: i };
  }
  if (!comparaison) throw new Error(`Aucun concurrent ${dE(c.entreprise)} ne remplit mieux sans mieux vendre`);
  const k = comparaison.trimestre;
  const rival = concurrents[comparaison.concurrent]!;
  const autre = concurrents[1 - comparaison.concurrent]!;
  const perdues = Math.round(Object.values(partie.rounds[plusFaible]!.results["joueur"]!.market.bySegment).reduce((s, x) => s + x.lost, 0));
  return {
    chambres,
    nuits: def.scenario.roundDays,
    trimestres: t,
    annee: {
      disponibles,
      vendues,
      chiffreDAffaires,
      occupation: auDixieme((vendues / disponibles) * 100),
      prixMoyen: auCentime(chiffreDAffaires / vendues),
      revpar: auCentime(chiffreDAffaires / disponibles),
    },
    meilleur,
    plusFaible,
    /** Les nuitées demandées et non servies au trimestre le plus faible. */
    perdues,
    /** Le prix moyen exact de chaque trimestre. */
    prixExacts,
    /** Le prix moyen exact n'a pas bougé de l'année, au centime près. */
    tarifTenu: Math.max(...prixExacts) - Math.min(...prixExacts) < 0.01,
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
  const t = occupation(c).trimestres;
  const ligne = (libelle: string, f: (x: TrimestreDHotel) => string) => ({ libelle, valeurs: t.map(f) });
  return {
    titre: `L'hébergement ${dE(c.entreprise)}, trimestre par trimestre`,
    colonnes: TRIMESTRES.slice(0, t.length),
    lignes: [
      ligne("Chambres disponibles", (x) => qte(x.disponibles)),
      ligne("Chambres vendues", (x) => qte(x.vendues)),
      ligne("Chiffre d'affaires hébergement HT", (x) => eur(x.chiffreDAffaires)),
    ],
  };
}

/** Le trimestre de la comparaison, pour les trois hôtels de l'arène. */
export function tableauDesTroisHotels(c: Cas): TableauDeDonnees {
  const o = occupation(c);
  const k = o.comparaison;
  const ligne = (nom: string, x: TrimestreDHotel) => ({ libelle: nom, valeurs: [qte(x.disponibles), qte(x.vendues), eur(x.chiffreDAffaires)] });
  return {
    titre: `Les hôtels de l'arène au ${trimestre(k.trimestre)}`,
    colonnes: ["Chambres disponibles", "Chambres vendues", "Chiffre d'affaires HT"],
    lignes: [ligne(c.entreprise, k.hotel), ligne(k.rival.nom, k.rival), ligne(k.autre.nom, k.autre)],
  };
}

const parTrimestre = (o: ReturnType<typeof occupation>, f: (x: TrimestreDHotel) => string) =>
  o.trimestres.map((x, k) => `${f(x)} au ${trimestre(k)}`).join(", ");

export const OCCUPATION_ET_REVENU_PAR_CHAMBRE: Chapitre = {
  code: "occupation-et-revenu-par-chambre",
  parcours: "mhr",
  palier: 2,
  blocs: ["BTS MHR Bloc 4 · Pilotage de la production de services en hôtellerie restauration"],
  titre: "Le taux d'occupation, le prix moyen et le revenu par chambre",
  accroche:
    "Les trois chiffres que l'hôtelier lit ensemble : la part des chambres vendues, le prix moyen d'une chambre louée, et le revenu par chambre disponible qui les combine. Et pourquoi un hôtel plein n'est pas toujours celui qui vend le mieux.",
  objectifs: [
    "Compter les chambres disponibles d'un trimestre",
    "Calculer le taux d'occupation, trimestre par trimestre",
    "Calculer le prix moyen par chambre louée",
    "Calculer le RevPAR, et le retrouver par l'occupation et le prix moyen",
    "Juger un trimestre au RevPAR plutôt qu'à l'occupation seule",
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
          `${c.entreprise} a ${qte(o.chambres)} chambres. Un trimestre de l'arène compte ${qte(o.nuits)} nuits : chaque chambre peut se louer une fois par nuit, l'hôtel a donc ${qte(o.trimestres[0]!.disponibles)} chambres disponibles par trimestre. Une nuitée vendue, c'est une chambre louée pour une nuit.`,
          `Dans l'arène, ${c.entreprise} ne vend que des nuitées : tout son chiffre d'affaires est celui de l'hébergement. Une chambre qui reste vide ce soir ne se revendra pas demain, et les charges de l'hôtel tombent qu'elle soit louée ou non.`,
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
        return [
          `L'hôtel est le plus rempli au ${trimestre(o.meilleur)} (${pct(o.trimestres[o.meilleur]!.occupation)}), le moins au ${trimestre(o.plusFaible)} (${pct(faible.occupation)}). Sur ${qte(faible.disponibles)} chambres disponibles, ${qte(faible.disponibles - faible.vendues)} sont restées vides ce trimestre-là.`,
          o.perdues > 0
            ? `Pourtant, ce trimestre, ${qte(o.perdues)} nuitées demandées n'ont pas été servies : l'hôtel n'en avait pas mis assez en vente. Le taux d'occupation dit combien de chambres sont vides ; il ne dit pas pourquoi.`
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
          o.tarifTenu
            ? `Le prix moyen exact est de ${eur(o.prixExacts[0]!)} à chaque trimestre : les centimes d'écart viennent de l'arrondi des chambres vendues. ${c.entreprise} a tenu son tarif toute l'année, et son chiffre d'affaires n'a bougé qu'avec l'occupation.`
            : `Le prix moyen a bougé d'un trimestre à l'autre : ${parTrimestre(o, (x) => eur(x.prixMoyen))}. Le chiffre d'affaires a suivi l'occupation et le prix à la fois.`,
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
        const x = o.trimestres[o.meilleur]!;
        return [
          `Le RevPAR se retrouve par les deux autres indicateurs : au ${trimestre(o.meilleur)}, ${pct(x.occupation)} × ${eur(x.prixMoyen)} = ${eur(auCentime((x.occupation / 100) * x.prixMoyen))}, à l'arrondi du taux près.`,
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
        const a = occupation(c).annee;
        return [
          `Sur l'année, ${c.entreprise} a vendu ${pct(a.occupation)} de ses chambres, à ${eur(a.prixMoyen)} en moyenne : chaque chambre disponible lui a rapporté ${eur(a.revpar)} par nuit.`,
        ];
      },
    },
    {
      id: "face-au-concurrent",
      type: "montants",
      titre: "Le concurrent plus rempli",
      notions: ["occupancy_revpar", "price_elasticity"],
      tableau: tableauDesTroisHotels,
      question: (c) => {
        const k = occupation(c).comparaison;
        return `Au ${trimestre(k.trimestre)}, deux concurrents jouent la même année que ${c.entreprise}, avec autant de chambres. Calculez le taux d'occupation ${duNom(k.rival.nom)} (au dixième), puis son RevPAR (au centime).`;
      },
      champs: (c) => {
        const r = occupation(c).comparaison.rival;
        return [
          { libelle: `Taux d'occupation ${duNom(r.nom)} (%)`, attendu: r.occupation, calcul: `${qte(r.vendues)} ÷ ${qte(r.disponibles)} × 100 = ${pct(r.occupation)}`, tolerance: 0.1 },
          { libelle: `RevPAR ${duNom(r.nom)}`, attendu: r.revpar, calcul: `${eur(r.chiffreDAffaires)} ÷ ${qte(r.disponibles)} = ${eur(r.revpar)}` },
        ];
      },
      explication: (c) => {
        const k = occupation(c).comparaison;
        return [
          `${k.rival.nom} remplit mieux : ${pct(k.rival.occupation)} de ses chambres, contre ${pct(k.hotel.occupation)} ${auNom(c.entreprise)}. Mais il loue ses chambres ${eur(k.rival.prixMoyen)} en moyenne, contre ${eur(k.hotel.prixMoyen)}. Chaque chambre disponible lui rapporte ${eur(k.rival.revpar)}, contre ${eur(k.hotel.revpar)} ${auNom(c.entreprise)}.`,
        ];
      },
    },
    {
      id: "qui-vend-le-mieux",
      type: "choix",
      titre: "Le juge du trimestre",
      notions: ["occupancy_revpar"],
      question: (c) => {
        const k = occupation(c).comparaison;
        return `Au ${trimestre(k.trimestre)}, lequel des deux hôtels a le mieux vendu ses chambres : ${c.entreprise} ou ${k.rival.nom} ?`;
      },
      options: (c) => {
        const k = occupation(c).comparaison;
        return [
          {
            texte: `${c.entreprise} : chaque chambre disponible lui a rapporté plus.`,
            juste: true,
            retour: `Oui. Les deux hôtels ont ${qte(k.hotel.disponibles)} chambres disponibles, et leurs charges tombent que les chambres soient louées ou non. Avec autant de chambres, le RevPAR le plus haut est le plus gros chiffre d'affaires : ${eur(k.hotel.chiffreDAffaires)} contre ${eur(k.rival.chiffreDAffaires)}.`,
          },
          {
            texte: `${k.rival.nom} : son taux d'occupation est le plus élevé des deux.`,
            juste: false,
            retour: `Il a rempli plus de chambres, mais à ${eur(k.rival.prixMoyen)} au lieu de ${eur(k.hotel.prixMoyen)}. Le prix de chaque chambre a plus baissé que l'occupation n'a monté : il a fait moins de chiffre d'affaires avec le même hôtel.`,
          },
          {
            texte: `${k.autre.nom} : il loue ses chambres au prix moyen le plus haut.`,
            juste: false,
            retour: `Son prix moyen est le plus haut (${eur(k.autre.prixMoyen)}), mais il n'a rempli que ${pct(k.autre.occupation)} de ses chambres : son RevPAR, ${eur(k.autre.revpar)}, est le plus bas des trois. Et la question compare deux hôtels.`,
          },
        ];
      },
    },
    {
      id: "pourquoi-le-revpar",
      type: "choix",
      titre: "Pourquoi le RevPAR",
      notions: ["occupancy_revpar", "price_elasticity"],
      question: () => "Pourquoi l'hôtelier juge-t-il un trimestre au RevPAR plutôt qu'au taux d'occupation seul ?",
      options: (c) => {
        const k = occupation(c).comparaison;
        return [
          {
            texte: "Il compte les chambres remplies et le prix de chacune.",
            juste: true,
            retour: `Oui. Remplir en bradant fait monter l'occupation et baisser le prix moyen : le RevPAR dit lequel des deux l'emporte. C'est ce qui est arrivé ${auNom(k.rival.nom)} au ${trimestre(k.trimestre)}.`,
          },
          {
            texte: "Il ne dépend que du prix : l'occupation ne change rien au revenu.",
            juste: false,
            retour: "Le RevPAR, c'est l'occupation multipliée par le prix moyen : une chambre vide de plus le fait baisser autant qu'un prix plus bas.",
          },
          {
            texte: "Il se calcule sur les chambres vendues, et oublie donc les chambres vides.",
            juste: false,
            retour: "C'est le prix moyen qui se calcule sur les chambres vendues. Le RevPAR se calcule sur les chambres disponibles : les chambres vides y pèsent.",
          },
        ];
      },
    },
  ],
};
