/**
 * ÉPISODE 63 — L'ENSEIGNE QUI FRAPPE À LA PORTE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Isaline montre, ce que la
 * courbe trace, ce sur quoi le conseil de famille la juge, et ce que ses
 * décisions révèlent d'elle.
 *
 * Une affiliation se juge sur des années, l'épisode sur un trimestre : le
 * tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE par rapport au statu quo
 * — le résultat du trimestre, plus cinq ans de l'effet net de la marque sur
 * chaque hôtel affilié (trois quand une clause de sortie arrête un hôtel qui
 * perd), actualisés à 8 %, travaux compris, et la valeur des choix faits pour
 * les maisons de caractère —, recalculée chaque semaine avec ce que le
 * trimestre révèle : l'effet de la marque, la réponse d'Orméa, l'issue de la
 * négociation. La courbe suit la part des plateformes dans le chiffre
 * hébergement, semaine après semaine.
 */
import {
  AFFAIRES,
  CONTREPARTIE,
  COEF,
  CONCURRENT,
  CA_CARACTERE,
  COMMISSION,
  D,
  DIRECTE_DEPART,
  ECONOMIE_AFFAIRES,
  EFFETS,
  EXIGES,
  FRAIS,
  HORIZON,
  HOTELS,
  JOURS_SANS_PERTE,
  LIGNE,
  NEUTRE,
  OBJECTIF_VALEUR,
  OBSERVATOIRE,
  PERIMETRES,
  PERTE_PAR_JOUR,
  SCENARIOS,
  SEMAINE_REPONSE,
  SIGNATURE,
  TAUX,
  TOUS,
  ESSAI,
  DIRECT as PLAN_DIRECT,
  evenements,
  hasard,
  hotel,
  netAnnuel,
  reponseParCode,
  risqueAttendu,
  scenarioParCode,
  simuler,
  tableauDeBord,
  valeurAttendue,
  type IdHotel,
  type IdScenario,
  type Proposition,
  type Trimestre,
} from "@/engine/episodes/enseigne-a-la-porte";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/enseigne-a-la-porte";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const parAn = (v: number) => `${kE(v)}/an`;
const points = (v: number) => `${nombre(v * 100)} pt`;
/** Un taux signé, avec un vrai signe moins : « −3 % », « 12 % ». */
const signeTaux = (v: number) => (v < 0 ? `−${taux(-v, 0)}` : `+${taux(v, 0)}`);

const LUCILE = {
  de: "Lucile Fabbri",
  role: "Directrice du revenue management et de la distribution",
} as const;
const LASZLO = {
  de: "László Szentes",
  role: "Directeur du développement Europe du Sud, Orméa Hotels",
} as const;
const ROMY = { de: "Romy Castellane", role: "Directrice de L'Escale Lac" } as const;
const ANNABELLE = { de: "Annabelle Socquet", role: "Directrice de L'Escale Megève" } as const;
const KAIS = { de: "Kaïs Benamar", role: "Responsable des systèmes d'information" } as const;
const ILSE = { de: "Ilse Montmasson", role: "Contrôleuse de gestion" } as const;
const SIBYLLE = { de: "Sibylle Rouget", role: "Avocate du groupe" } as const;
const ORMEA = { de: "Odalric Fenwick", role: "Directeur général Europe, Orméa Hotels" } as const;

/** La part des plateformes que le revenue management vise dans le chiffre hébergement. */
export const CIBLE_PLATEFORMES = 0.28;

const remplir = (decisions: readonly number[]) => NEUTRE.map((n, i) => decisions[i] ?? n);

/** Les hôtels d'un périmètre, dits comme le conseil les dirait. */
export function nommer(ids: readonly IdHotel[]): string {
  if (ids.length === 0) return "aucun hôtel";
  if (ids.length === HOTELS.length) return "les huit hôtels";
  const noms = ids.map((id) =>
    id === "lac" ? hotel(id).nom : hotel(id).nom.replace("L'Escale ", ""),
  );
  return noms.length === 1 ? noms[0]! : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`;
}

const LIGNES_ANNONCEES = [
  "les huit hôtels sous enseigne Orméa",
  "que nous resterions indépendants",
  "un périmètre différencié, chiffré hôtel par hôtel",
  "que nous demanderions du temps",
] as const;

const COMME_AILLEURS: Record<IdScenario, string> = {
  faible: "trois sur dix",
  moyen: "quatre ou cinq sur dix",
  fort: "deux ou trois sur dix",
};

/** La proposition faite en semaine 9, telle que les messages la lisent. */
function propositionLue(decisions: readonly number[], s: IdScenario | null): Proposition {
  const c = remplir(decisions);
  const p = c[D.perimetre];
  if (p === 0) return LIGNE[c[D.ligne]!]!;
  if (p === 1) return c[D.essai] === 1 && s === "faible" ? "aucun" : "affaires";
  if (p === 2) return "annemasse";
  return "reporter";
}

const somme = (xs: readonly number[]) => xs.reduce((a, x) => a + x, 0);
const CARACTERE: readonly IdHotel[] = ["lac", "evian", "megeve"];

/** Ce que les décisions révèlent, dans l'ordre où une directrice générale les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de chiffrer, hôtel par hôtel, les canaux et ce que la marque apporte",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    portefeuille:
      "Votre diagnostic de la semaine 1 était juste : une marque vaut ce qu'elle apporte à des clients qui ne vous connaissent pas, beaucoup dans les hôtels d'affaires, presque rien dans les maisons de caractère. Un périmètre différencié, testé et négocié avec des clauses de sortie, en découlait.",
    commissions:
      "En semaine 1, vous avez vu les commissions des plateformes : un vrai levier, mais pas tout. Les redevances se paient sur tout le chiffre, les maisons de caractère y perdent leur prime, et un contrat de dix ans se négocie.",
    taille:
      "En semaine 1, vous avez cru que la taille protège : les conditions de groupe font gagner un point de redevance, mais sur des hôtels où la marque n'apporte rien, c'est payer moins cher une perte.",
    independance:
      "En semaine 1, vous avez vu l'indépendance à défendre en bloc : vrai pour les maisons de caractère, faux pour les hôtels d'affaires, à qui une marque apporte des clients et que l'Arcadelle peut prendre sous enseigne.",
  };
  const justes = ["portefeuille", "commissions"];
  let suite = "";
  const r = p.reevaluation;
  if (r.choix === "corrige" && r.principal) {
    if (justes.includes(r.principal) && !justes.includes(d)) {
      suite = " En semaine 2, vous l'avez corrigé à bon escient.";
    } else if (!justes.includes(r.principal) && justes.includes(d)) {
      suite = " En semaine 2, vous avez abandonné une bonne piste.";
    }
  } else if (!justes.includes(d)) {
    suite = " En semaine 2, vous l'avez maintenu.";
  }
  const diagnostic: Constat = {
    score: d === "portefeuille" ? 1 : d === "commissions" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez cédé à aucun réflexe d'une direction pressée : ni tout affilier pour les conditions de groupe, ni tout refuser, ni signer sans tester, ni acheter de la visibilité à une plateforme, ni signer le contrat type, ni tenir la ligne contre les chiffres, ni céder pour conclure."
        : `Vous avez choisi ${n} fois le réflexe d'une direction pressée : tout affilier pour les conditions de groupe ou tout refuser, signer sans tester, acheter de la visibilité à une plateforme, signer le contrat type, tenir la ligne annoncée contre les chiffres, céder pour conclure.`,
  };

  const calibrage = constatCalibrage(
    p,
    ECONOMIE_AFFAIRES / 1000,
    "d'économie annuelle de commissions des plateformes dans les deux hôtels d'affaires",
    "k€",
    { juste: 8, proche: 20 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const signes = t.signe.hotels;
  const caractere = signes.some((id) => CARACTERE.includes(id));
  const mixtes = signes.some((id) => hotel(id).type === "mixte");
  const sortie = p.chemin[D.contrat] !== 0;
  let portefeuille: Constat;
  if (caractere) {
    portefeuille = {
      score: 0,
      texte: `Vous avez mis sous enseigne ${nommer(signes.filter((id) => CARACTERE.includes(id)))} : des maisons qui vivent de leur emplacement et de leurs habitués paieront des redevances sur leurs propres clients, et y perdront leur prime de caractère.`,
    };
  } else if (signes.length > 0) {
    portefeuille =
      !mixtes && sortie
        ? {
            score: 1,
            texte: `Vous avez affilié ${nommer(signes)}, là où la marque apporte des clients, avec une clause de sortie, et gardé indépendantes les maisons de caractère.`,
          }
        : {
            score: 0.6,
            texte: mixtes
              ? `Vous avez affilié ${nommer(signes)} : les hôtels mixtes ajoutés pour conclure coûtent plus que ce qu'ils rapportent.`
              : `Vous avez affilié ${nommer(signes)}, le bon périmètre, mais sans clause de sortie : si la marque déçoit, en sortir coûtera trois ans de redevances.`,
          };
  } else if (
    t.proposition === "aucun" &&
    p.chemin[D.perimetre] === 1 &&
    t.scenario.id === "faible"
  ) {
    portefeuille = {
      score: 1,
      texte:
        "L'essai a montré que la marque n'apportait presque rien à vos hôtels d'affaires : vous n'avez rien signé, à raison.",
    };
  } else if (t.proposition === "affaires" || t.proposition === "annemasse") {
    portefeuille = {
      score: p.chemin[D.reponse] === 3 ? 0.6 : 1,
      texte:
        p.chemin[D.reponse] === 3
          ? "Vous avez proposé le bon périmètre, puis renoncé à signer : Annemasse reste à découvert."
          : "Vous avez proposé le bon périmètre et tenu ; Orméa n'a pas signé cette fois : la proposition était juste, le tirage ne l'a pas été.",
    };
  } else if (t.proposition === "reporter") {
    portefeuille = {
      score: 0.6,
      texte:
        "Vous avez reporté la décision à l'automne : c'est garder une option, au prix d'un trimestre et du risque qu'Orméa n'attende pas.",
    };
  } else {
    portefeuille = {
      score: 0,
      texte:
        "Vous avez refusé en bloc : les maisons de caractère y gagnent, les hôtels d'affaires y perdent les clients qu'une marque leur apporterait, et Orméa peut s'affilier l'Arcadelle à Annemasse.",
    };
  }

  return [information, diagnostic, reflexe, calibrage, portefeuille];
}

export function axe([
  information,
  diagnostic,
  reflexe,
  calibrage,
  portefeuille,
]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer hôtel par hôtel avant de répondre",
      texte:
        "Rejouez l'épisode en décomposant d'abord le chiffre et les canaux de chaque hôtel, et en interrogeant les hôteliers que la chaîne a affiliés : ce que la marque apporte dépend du type d'hôtel, et cela se lit dans les chiffres.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ni tout, ni rien : un portefeuille",
      texte:
        "Une enseigne ne s'accepte ni ne se refuse en bloc. Elle vaut pour les hôtels dont les clients ne vous connaissent pas encore, qu'elle amène par sa distribution et sa fidélité ; elle coûte aux maisons qui vivent de leurs habitués. Testez là où la saison le permet, et négociez la sortie avant d'entrer.",
    };
  }
  if (portefeuille!.score === 0) {
    return {
      titre: "Une marque par type d'hôtel",
      texte:
        "Un hôtel d'affaires gagne à une marque : contrats entreprises, système de réservation, fidélité. Une maison de caractère y perd sa prime et paie des redevances sur ses propres clients : son levier est la clientèle directe, pas une enseigne.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Ce que vaut une marque dépend du client",
      texte:
        "Les commissions économisées ne sont qu'une partie du calcul : les redevances se paient sur tout le chiffre, la prime de caractère s'efface sous une enseigne, et un contrat de dix ans sans clause de sortie transforme une erreur en dépendance.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul des commissions économisées",
      texte:
        "Partez du chiffre des deux hôtels d'affaires, 5,6 M€, et des points que la marque rapatrie des plateformes selon les références (10, 20 ou 24, à trois, quatre ou cinq, deux ou trois chances sur dix) : 18 points en espérance, à 17 % de commission.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

const NOMS_REPONSE = {
  accepte: "a accepté notre périmètre",
  contre: "a exigé Évian et Megève en plus",
  refuse: "a voulu les huit hôtels ou rien",
} as const;

export const EPISODE_ENSEIGNE: Episode<Trimestre> = {
  code: "enseigne-a-la-porte",
  numero: 63,
  domaine: "Indépendance ou affiliation",
  titre: "L'enseigne qui frappe à la porte",
  resume:
    "Une chaîne internationale propose d'affilier vos huit hôtels à sa marque. Chiffrer ce qu'elle apporte à chaque hôtel, tester là où la saison le permet, et négocier un périmètre et une sortie plutôt que tout ou rien.",
  persona:
    "Vous êtes Isaline Perraud, directrice générale du Groupe Escale : huit hôtels et cinq restaurants en Savoie et Haute-Savoie, 46 M€ de chiffre d'affaires dont 24 M€ d'hébergement, 640 salariés permanents. Orméa Hotels, chaîne internationale, propose d'affilier les huit hôtels à sa marque ; le conseil de famille attend votre recommandation pour la fin mars.",
  mandat: [
    {
      fort: "24 M€",
      texte: "de chiffre d'affaires hébergement, 498 chambres dans huit hôtels",
    },
    {
      fort: "17 %",
      texte: "de commission moyenne versée à Bookalia et Voyagio",
    },
    {
      fort: `${nombre(COEF, 2)} ans`,
      texte: `d'effet net : ce que vaut une affiliation, ${HORIZON} ans actualisés à ${taux(TAUX, 0)}`,
    },
    {
      fort: kE(OBJECTIF_VALEUR),
      texte: "la valeur que le conseil de famille attend de votre décision",
    },
  ],
  jugement:
    "Le conseil de famille juge le trimestre sur la valeur créée estimée en semaine 13, par rapport au statu quo : le résultat du trimestre, plus cinq ans de l'effet net de la marque sur chaque hôtel affilié et des choix faits pour les maisons de caractère, actualisés à 8 %, travaux compris, recalculée avec ce que le trimestre a révélé.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre groupe",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les appels d'offres hébergement des entreprises genevoises se bouclent sans vous.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        de: "Romuald Aubertin",
        role: "Directeur de L'Escale Annemasse",
        alerte: true,
        texte: `Pendant qu'on étudiait, deux entreprises genevoises ont bouclé leurs appels d'offres hébergement sans nous : ${euros(perdu)} de chiffre perdu.`,
      };
    },
  },
  prevision: {
    libelle:
      "l'économie annuelle de commissions des plateformes qu'apporterait l'affiliation d'Annemasse et de Chambéry-Gare, en espérance, en milliers d'euros",
    unite: "k€",
    placeholder: "150",
    min: 0,
    max: 1000,
    step: 1,
    reel: () => ECONOMIE_AFFAIRES / 1000,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `par rapport au statu quo ; attendue par le conseil : ${kE(OBJECTIF_VALEUR)}`
          : "huit hôtels indépendants",
      jauge: (l) => ({
        part: Math.min(1, Math.max(0, (l.valeur ?? 0) / OBJECTIF_VALEUR)),
        enRetard: (l.valeur ?? 0) < OBJECTIF_VALEUR,
      }),
    },
    {
      cle: "plateformes",
      nom: "Part des plateformes",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: -1,
      aide: (semaine) =>
        semaine
          ? `du chiffre hébergement de la semaine ; cible : ${taux(CIBLE_PLATEFORMES, 0)}`
          : "du chiffre hébergement, de janvier à mars",
    },
    {
      cle: "redevances",
      nom: "Redevances Orméa",
      format: parAn,
      sensBon: -1,
      aide: () => "ce que la marque prélèverait chaque année sur ce qui est sur la table",
    },
    {
      cle: "ecart",
      nom: "Résultat du trimestre",
      format: kE,
      sensBon: 1,
      aide: () => "écart au budget cumulé depuis la semaine 1",
    },
    {
      cle: "directe",
      nom: "Clientèle directe des maisons",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: 1,
      aide: (semaine) =>
        semaine
          ? `à L'Escale Lac, Évian et Megève, projetée ; ${taux(DIRECTE_DEPART, 0)} aujourd'hui`
          : "à L'Escale Lac, Évian et Megève",
    },
  ],
  contexte(l, decisions): Contexte {
    const c = remplir(decisions);
    const s = scenarioParCode(l.scenario);
    const rep = reponseParCode(l.reponse);
    const prop = propositionLue(decisions, s);
    const essai =
      decisions[D.essai] === 1 ? "affaires" : decisions[D.essai] === 2 ? "caractere" : "aucun";
    // Ce que l'essai a mesuré dans les deux hôtels d'affaires, aux redevances d'un périmètre partiel.
    const aff = s ? AFFAIRES.map((id) => netAnnuel(hotel(id), s, FRAIS)) : [];
    const termesType = [...c];
    termesType[D.contrat] = 1;
    const ids =
      prop === "huit" || prop === "affaires" || prop === "annemasse" ? PERIMETRES[prop] : [];
    return {
      essai,
      scenario: s ?? "",
      nomScenario: s ? SCENARIOS.find((x) => x.id === s)!.nom : "",
      commeAilleurs: s ? COMME_AILLEURS[s] : "",
      rapatrie: s ? `${nombre(EFFETS.affaires.rapatrie[s] * 100, 0)} points` : "",
      hausse: s ? signeTaux(EFFETS.affaires.hausse[s]) : "",
      effetChiffre: s
        ? EFFETS.affaires.hausse[s] < 0
          ? `fait perdre ${taux(-EFFETS.affaires.hausse[s], 0)} de chiffre d'affaires hébergement`
          : `ajouté ${taux(EFFETS.affaires.hausse[s], 0)} de chiffre d'affaires hébergement`
        : "",
      apportAffaires: s ? kES(somme(aff.map((x) => x.apport))) : "",
      economieAffaires: s ? kE(somme(aff.map((x) => x.economie))) : "",
      redevancesAffaires: s ? kE(somme(aff.map((x) => x.redevances))) : "",
      netAffaires: s ? kES(somme(aff.map((x) => x.net))) : "",
      valeurAffaires: s ? kE(valeurAttendue(termesType, AFFAIRES, false, s)) : "",
      ligneAnnoncee: LIGNES_ANNONCEES[c[D.ligne]!]!,
      reponse: rep ?? "",
      proposition: prop,
      perimetre: nommer(ids),
      valeurProposee: kE(valeurAttendue(c, ids, false, s)),
      coutExiges: kE(-valeurAttendue(c, EXIGES, true, s)),
      coutContrepartie: kE(-valeurAttendue(c, CONTREPARTIE, false, s)),
      valeurHuit: kE(valeurAttendue(c, TOUS, false, s)),
      risqueConcurrent: taux(risqueAttendu(c, s), 0),
      patience: l.patience === 1 ? "oui" : l.patience === 0 ? "non" : "",
      valeur: kE(l.valeur ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Part des plateformes, sem. ${a}`, taux(s.plateformes, 1)],
    ];
  },
  courbe: {
    titre: "Part des plateformes dans le chiffre hébergement, semaine par semaine",
    cle: "plateformes",
    cible: CIBLE_PLATEFORMES,
    libelleCible: `cible du revenue management : ${taux(CIBLE_PLATEFORMES, 0)}`,
    graduations: [0.2, 0.25, 0.3, 0.35],
    format: (v) => taux(v, 0),
    details: (s) => [
      `${taux(s.plateformes!, 1)} du chiffre par les plateformes · valeur estimée ${kE(s.valeur!)}`,
      `résultat du trimestre ${kE(s.ecart!)} · redevances Orméa ${parAn(s.redevances!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.caractere && choix === 1) {
      // Les premiers retours des habitués annoncent ce que le programme rapatriera.
      const bien = hasard(graine).adoption >= PLAN_DIRECT.attendu;
      return [{ ...ROMY, texte: bien ? REPONSES.directBien : REPONSES.directLent }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.essai) {
      lies.push({
        ...LUCILE,
        heure: `sem. ${ESSAI.debut}`,
        texte: chemin[D.essai] === 1 ? REPONSES.essaiAffaires : REPONSES.essaiCaractere,
      });
    }
    if (arrive.habitues) {
      lies.push({ ...ANNABELLE, heure: "sem. 6", alerte: true, texte: REPONSES.habitues });
    }
    if (arrive.resultats && chemin[D.essai] === 1) {
      lies.push({
        ...LUCILE,
        heure: `sem. ${ESSAI.resultats}`,
        alerte: t.scenario.id === "faible",
        texte: `Fin de l'essai : la marque a rapatrié ${nombre(EFFETS.affaires.rapatrie[t.scenario.id] * 100, 0)} points de chiffre des plateformes à Annemasse et à Chambéry-Gare, et ${t.scenario.id === "faible" ? "fait perdre" : "ajouté"} ${taux(Math.abs(EFFETS.affaires.hausse[t.scenario.id]), 0)} de chiffre : ${t.scenario.nom}.`,
      });
    }
    if (arrive.reponse) {
      const message =
        t.reponse === "accepte"
          ? REPONSES.accepte
          : t.reponse === "contre"
            ? REPONSES.contre
            : t.reponse === "refuse"
              ? REPONSES.refuse
              : t.proposition === "reporter"
                ? t.patience
                  ? REPONSES.patiente
                  : REPONSES.impatiente
                : REPONSES.aucun;
      lies.push({
        ...LASZLO,
        heure: `sem. ${SEMAINE_REPONSE}`,
        alerte: t.reponse !== "accepte",
        texte: message,
      });
    }
    if (arrive.adoption) {
      lies.push({
        ...KAIS,
        heure: `sem. ${PLAN_DIRECT.resultats}`,
        texte: `Six semaines de Cercle Escale : au rythme des inscriptions, ${nombre(t.adoption * 100)} points du chiffre de L'Escale Lac, d'Évian et de Megève passeront des plateformes au direct, soit ${kE(t.adoption * CA_CARACTERE * (COMMISSION - PLAN_DIRECT.remise))} de commissions évitées par an, tarif membre déduit.`,
      });
    }
    if (arrive.signature) {
      const signes = t.signe.hotels;
      lies.push(
        signes.length > 0
          ? {
              ...SIBYLLE,
              heure: `sem. ${SIGNATURE}`,
              alerte: signes.some((id) => CARACTERE.includes(id)),
              texte: `Le contrat est signé pour ${nommer(signes)}${t.signe.collection ? ", Évian et Megève sous le label « Orméa Collection »" : ""}. Droits d'entrée versés : ${kE(signes.length * 20000)}.`,
            }
          : { ...ILSE, heure: `sem. ${SIGNATURE}`, texte: REPONSES.rienSigne },
      );
      if (!signes.includes("annemasse") && t.concurrent > 0) {
        lies.push({
          ...ORMEA,
          heure: `sem. ${SIGNATURE}`,
          alerte: true,
          texte: `Orméa poursuivra son développement dans le Genevois. Nous avons ouvert des discussions avec plusieurs hôtels d'Annemasse.`,
        });
      }
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.observatoire) {
      imprevus.push({
        ...ILSE,
        heure: `sem. ${OBSERVATOIRE}`,
        texte: `L'Observatoire hôtelier des Alpes publie ses chiffres : dans les hôtels d'affaires affiliés de la région, la marque a eu ${t.scenario.nom}, ${nombre(EFFETS.affaires.rapatrie[t.scenario.id] * 100, 0)} points de chiffre rapatriés des plateformes.`,
      });
    }
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée estimée en semaine 13, par rapport au statu quo : le résultat du trimestre, plus cinq ans de l'effet net de la marque sur les hôtels affiliés et des choix faits pour les maisons de caractère, actualisés à 8 %, travaux compris, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const signes = t.signe.hotels;
      const caractere = signes.some((id) => CARACTERE.includes(id));
      return [
        {
          nom: "Valeur",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; attendue par le conseil : ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Périmètre",
          valeur: signes.length ? `${signes.length} hôtel${signes.length > 1 ? "s" : ""}` : "aucun",
          aide: signes.length ? `affiliés : ${nommer(signes)}` : "rien de signé avec Orméa",
          tenu: !caractere,
        },
        {
          nom: "Redevances",
          valeur: parAn(t.semaines[13]!.redevances),
          aide: "à verser à Orméa chaque année",
          tenu: !caractere,
        },
        {
          nom: "Annemasse",
          valeur: signes.includes("annemasse")
            ? "sous enseigne"
            : `risque ${taux(t.concurrent, 0)}`,
          aide: signes.includes("annemasse")
            ? "Orméa ne cherchera pas d'autre hôtel"
            : "qu'Orméa s'affilie l'Arcadelle",
          tenu: signes.includes("annemasse") || t.concurrent <= CONCURRENT.chance.faible,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const liste = [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre[0]!.toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "La marque",
          texte: `a eu ${t.scenario.nom} sur la clientèle d'affaires : ${nombre(EFFETS.affaires.rapatrie[t.scenario.id] * 100, 0)} points de chiffre rapatriés des plateformes (trois chances sur dix d'un effet faible, quatre ou cinq d'un effet moyen, deux ou trois d'un effet fort).`,
        },
        {
          titre: "Orméa",
          texte: t.reponse
            ? `${NOMS_REPONSE[t.reponse]} en semaine 10.${
                t.chances
                  ? ` Avec vos choix, ses chances étaient : accepter ${taux(t.chances.accepte, 0)}, exiger plus ${taux(t.chances.contre, 0)}, refuser ${taux(t.chances.refuse, 0)}.`
                  : ""
              } Au bout de la négociation : ${t.signe.hotels.length ? nommer(t.signe.hotels) : "rien de signé"}.`
            : t.proposition === "reporter"
              ? `a ${t.patience ? "accepté" : "refusé"} d'attendre l'automne (sept chances sur dix).`
              : "n'a rien eu à répondre : aucun périmètre ne lui a été proposé.",
        },
      ];
      if (t.signe.hotels.length === 0 || !t.signe.hotels.includes("annemasse")) {
        liste.push({
          titre: "L'Arcadelle",
          texte: `pourrait passer sous enseigne Orméa : ${taux(t.concurrent, 0)} de risque en fin de trimestre, compté dans la valeur.`,
        });
      }
      liste.push({
        titre: "Le Cercle Escale",
        texte: `aurait rapatrié ${nombre(t.adoption * 100)} points du chiffre des maisons de caractère vers le direct, s'il était lancé (de deux à dix chez les hôtels qui l'ont fait, six et demi en moyenne).`,
      });
      if (t.habitues) {
        liste.push({
          titre: "Les habitués de Megève",
          texte: "ont été délogés pendant l'essai, aux vacances de février.",
        });
      }
      return liste;
    },
  },
  comportements,
  axe,
};
