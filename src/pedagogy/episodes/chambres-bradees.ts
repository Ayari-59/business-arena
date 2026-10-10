/**
 * ÉPISODE 49 — LES CHAMBRES QU'ON BRADE, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord de L'Escale Lac montre, ce que la
 * courbe trace, ce sur quoi le bilan juge Romy, et ce que ses décisions
 * révèlent d'elle.
 */
import {
  BUDGET_ETE,
  BUDGET_TRIMESTRE,
  D,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  PERTE_PONTS,
  REVPAR_BUDGET,
  SCENARIOS,
  brenvalAccepte,
  evenements,
  hasard,
  meerlandAttend,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/chambres-bradees";
import {
  ANALYSE_ETE,
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
  ecart,
  kESigne,
} from "@/config/episodes/chambres-bradees";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const points = (v: number) => `${nombre(v * 100)} pt`;

const LUCILE = { de: "Lucile Fabbri", role: "Revenue manager, siège" } as const;
const CLODOMIR = { de: "Clodomir Jolivet", role: "Responsable des ventes" } as const;
const LUDMILA = { de: "Ludmila Ferrouillat", role: "Cheffe de réception" } as const;
const KERSTIN = { de: "Kerstin Aaltonen", role: "Chargée de compte, Bookalia" } as const;
const ALBIN = { de: "Albin Cachat", role: "Directeur, Autocars Brenval" } as const;
const MARIJKE = { de: "Marijke Hoogstraten", role: "Achats hôtels, Meerland Reizen" } as const;

/** La prévision de la semaine 1, en k€ : la perte nette sur les ponts d'une baisse de 15 % sur les plateformes. */
export const PERTE_PONTS_KE = PERTE_PONTS / 1000;
/** Le budget de l'objectif : le trimestre et l'été. */
export const BUDGET = BUDGET_TRIMESTRE + BUDGET_ETE;
/** La part directe en dessous de laquelle le canal direct n'a pas progressé. */
export const PART_DIRECTE_VISEE = 0.42;

/** Ce que les décisions révèlent, dans l'ordre où une directrice d'hôtel les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le pick-up par segment et la production par canal",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    segments:
      "Votre diagnostic de la semaine 1 était juste : le retard du pick-up était un trompe-l'œil. Les ponts et les week-ends étaient en avance ; l'écart venait d'un séminaire non reconduit et de nuits de semaine qui ne se réservent jamais si tôt.",
    semaine:
      "En semaine 1, vous avez vu les nuits de semaine : c'est bien là que l'hôtel avait de la place, mais pas de là que venait le retard. Les 210 nuitées d'écart étaient celles d'un séminaire non reconduit, et les ponts étaient en avance.",
    prix: "En semaine 1, vous avez jugé L'Escale Lac trop chère ; ses prix étaient dans la moyenne haute du lac, comme l'an dernier, et ses ponts se vendaient plus vite que l'an dernier.",
    visibilite:
      "En semaine 1, vous avez retenu un manque de visibilité sur les plateformes ; elles vendaient déjà plus de la moitié des nuitées, et les ponts étaient en avance.",
  };
  const justes = ["segments", "semaine"];
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
    score: d === "segments" ? 1 : d === "semaine" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? `Vous n'avez jamais cherché à remplir à tout prix : ni baisse sur les plateformes, ni groupe sur un pont plein, ni vente flash. Sur le trimestre, taux d'occupation ${taux(t.to, 0)}, prix moyen ${euros(t.pm)}, RevPAR ${euros(t.revpar)}.`
        : `Vous avez cherché à remplir plutôt qu'à mieux vendre ${n} fois sur ${ETAPES.length} décisions. Sur le trimestre, taux d'occupation ${taux(t.to, 0)}, mais prix moyen ${euros(t.pm)} et RevPAR ${euros(t.revpar)} : une baisse paie d'abord les clients qui seraient venus, et chaque nuitée vendue par les plateformes laisse 17 % de commission.`,
  };

  const calibrage = constatCalibrage(
    p,
    PERTE_PONTS_KE,
    "de revenu net perdu sur les ponts par une baisse de 15 % sur les plateformes",
    "k€",
    { juste: 1, proche: 3 },
    (e) => `${nombre(e)} k€`,
  );

  const leviers = [
    p.chemin[D.pickup] === 2,
    p.chemin[D.direct] === 1,
    p.chemin[D.ete] === 1,
    p.chemin[D.juin] === 1,
  ];
  const tenus = leviers.filter(Boolean).length;
  const segmenter: Constat = {
    score: tenus === 4 ? 1 : tenus >= 2 ? 0.6 : 0,
    texte: `${
      leviers[0]
        ? "Vous avez répondu au retard par des restrictions — durée minimale sur les ponts, non remboursable en semaine — plutôt que par une baisse."
        : "Vous n'avez pas posé de restrictions là où la demande dépassait les chambres."
    } ${
      leviers[1]
        ? `Le tarif membre, parité respectée, a fait passer la part directe à ${taux(t.partDirecte, 0)} en moyenne sur le trimestre.`
        : `Sans tarif membre, la part directe est restée à ${taux(t.partDirecte, 0)} en moyenne sur le trimestre.`
    } ${
      leviers[2]
        ? "Au signal de fin mai, vous avez revu l'été date par date."
        : "Au signal de fin mai, vous n'avez pas revu l'été date par date."
    } ${
      leviers[3]
        ? "En juin, vous avez réservé l'offre de semaine à vos clients, sans toucher aux prix publics."
        : "En juin, vous n'avez pas ciblé les nuits de semaine."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, segmenter];
}

export function axe([information, diagnostic, reflexe, calibrage, segmenter]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Lire le pick-up avant de toucher au prix",
      texte:
        "Rejouez l'épisode en décomposant d'abord le pick-up par segment et par canal : les ponts étaient en avance, et le retard venait d'un séminaire non reconduit et de nuits de semaine qui se réservent à quelques jours.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Piloter le revenu net, pas le taux d'occupation",
      texte:
        "Une baisse générale se paie sur chaque nuitée qu'on aurait vendue de toute façon, et la commission des plateformes s'ajoute. Regardez le RevPAR et le revenu net de commissions : ce sont eux qui disent si une chambre de plus valait la baisse.",
    };
  }
  if (segmenter!.score === 0) {
    return {
      titre: "Segmenter plutôt que baisser",
      texte:
        "Une durée minimale de séjour là où la demande dépasse les chambres, un non remboursable là où elle manque, un tarif réservé à vos clients sur votre site : chaque levier vise un segment sans rien céder aux autres.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Chercher d'où vient le retard",
      texte:
        "Un pick-up global en retard se lit segment par segment : chacun a sa fenêtre de réservation. Ce qui se réserve tard n'est pas en retard, et un groupe perdu ne se rattrape pas par le prix.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la semaine 1 : nuits de ponts, chambres, occupation, part des plateformes, prix moyen, 15 % de baisse, et la commission qu'on ne paie plus sur ce qu'on ne touche plus. Notez vos prévisions et comparez-les au réalisé.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode avec d'autres aléas et les mêmes décisions : un autre été, d'autres imprévus. Si le résultat tient, votre méthode tient.",
  };
}

const nomDeLEte = (s: number) => SCENARIOS[s]!.nom;

export const EPISODE_YIELD: Episode<Trimestre> = {
  code: "chambres-bradees",
  numero: 49,
  domaine: "Revenue management",
  titre: "Les chambres qu'on brade",
  resume:
    "Un hôtel au bord du lac d'Annecy, un pick-up en retard, et tout le monde veut baisser les prix sur les plateformes. Piloter le RevPAR et le revenu net, segment par segment et canal par canal.",
  persona:
    "Vous êtes Romy Castellane, directrice de L'Escale Lac, l'hôtel 4 étoiles du Groupe Escale au bord du lac d'Annecy : 84 chambres, un restaurant, une clientèle de loisirs qui vient surtout l'été. Ludmila Ferrouillat est votre cheffe de réception, Clodomir Jolivet votre responsable des ventes ; vous travaillez avec Lucile Fabbri, revenue manager du siège. Votre trimestre : avril à juin, les vacances de printemps, quatre ponts en mai et l'avant-saison — et, pendant ce temps, une bonne part de juillet-août se réserve.",
  mandat: [
    {
      fort: kE(BUDGET_TRIMESTRE),
      texte: "de revenu hébergement net de commissions, d'avril à juin",
    },
    { fort: kE(BUDGET_ETE), texte: "pour juillet-août, au budget du siège" },
    { fort: euros(REVPAR_BUDGET), texte: "de RevPAR en moyenne sur le trimestre" },
    { fort: "17 %", texte: "de commission sur chaque nuitée vendue par Bookalia et Voyagio" },
  ],
  jugement:
    "Le Groupe Escale juge le trimestre sur le revenu hébergement net de commissions : celui des séjours d'avril à juin, plus celui de l'été tel qu'on peut l'estimer fin juin, frais des actions déduits. Le taux d'occupation n'y entre pas.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre hôtel",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les demandes de séminaires restent sans réponse et les grilles restent figées.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...CLODOMIR,
        alerte: true,
        texte: `Pendant ce temps, deux demandes de séminaires sont parties chez l'Orméa, faute de réponse : ${euros(perdu)} de revenu perdu.`,
      };
    },
  },
  prevision: {
    libelle:
      "le revenu net de commissions que coûterait, sur les douze nuits de ponts de mai, une baisse de 15 % des nuitées vendues par Bookalia et Voyagio, à l'occupation de l'an dernier, en milliers d'euros",
    unite: "k€",
    placeholder: "20",
    min: 0,
    max: 200,
    step: 0.1,
    reel: () => PERTE_PONTS_KE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "revpar",
      nom: "RevPAR",
      format: euros,
      sensBon: 1,
      aide: (semaine) =>
        `${semaine ? `semaine ${semaine}` : "la semaine dernière"} ; budget ${euros(REVPAR_BUDGET)} en moyenne`,
    },
    {
      cle: "to",
      nom: "Taux d'occupation",
      format: (v) => taux(v, 0),
      formatEcart: points,
      sensBon: 1,
      aide: () => "chambres vendues sur chambres disponibles",
    },
    {
      cle: "pm",
      nom: "Prix moyen",
      format: euros,
      sensBon: 1,
      aide: () => "par nuitée vendue, petit-déjeuner compris",
    },
    {
      cle: "net",
      nom: "Revenu net de commissions",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `cumulé ; budget à date ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET_TRIMESTRE)}`
          : `${kE(BUDGET_TRIMESTRE)} de budget d'avril à juin`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.net ?? 0) / BUDGET_TRIMESTRE)),
              enRetard: (l.net ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "pickup",
      nom: "Pick-up du reste du trimestre",
      format: (v) => ecart(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => "nuitées déjà réservées, sur l'an dernier à la même date",
    },
  ],
  contexte(l, decisions) {
    return {
      pickup: ecart(l.pickup ?? 0),
      carnet: nombre(l.carnet ?? 0, 0),
      revpar: euros(l.revpar ?? 0),
      to: taux(l.to ?? 0, 0),
      pm: euros(l.pm ?? 0),
      direct: taux(l.direct ?? 0, 0),
      pickupEte: ecart(l.pickupEte ?? 0),
      scenario: l.scenario ?? -1,
      membres: nombre(l.membres ?? 0, 0),
      plateformesMoinsCheres: decisions[D.pickup] === 0,
      dureeMin: decisions[D.pickup] === 2,
      tarifMembre: decisions[D.direct] === 1,
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const n = semaines.length;
    return [
      [`RevPAR, sem. ${de} à ${a}`, euros(semaines.reduce((x, w) => x + w.revpar, 0) / n)],
      [`Taux d'occupation, sem. ${de} à ${a}`, taux(semaines.reduce((x, w) => x + w.to, 0) / n, 0)],
      ["Revenu net de la période", kE(semaines.reduce((x, w) => x + w.net, 0))],
    ];
  },
  courbe: {
    titre: "RevPAR, semaine par semaine",
    cle: "revpar",
    cible: REVPAR_BUDGET,
    libelleCible: `budget : ${euros(REVPAR_BUDGET)} en moyenne`,
    graduations: [50, 100, 150, 200],
    format: euros,
    details: (s) => [
      `taux d'occupation ${taux(s.to!, 0)} · prix moyen ${euros(s.pm!)}`,
      `revenu net ${kE(s.net!)} · part directe ${taux(s.direct!, 0)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.groupe && choix === 2) {
      // Brenval répond à la contre-proposition selon le hasard du trimestre.
      return [
        { ...ALBIN, texte: brenvalAccepte(graine) ? REPONSES.brenvalOui : REPONSES.brenvalNon },
      ];
    }
    if (etape === D.allotement && choix === 3) {
      return [
        {
          ...MARIJKE,
          texte: meerlandAttend(graine) ? REPONSES.meerlandAttend : REPONSES.meerlandPart,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const lies: Message[] = [];
    if (arrive.groupeLoge) {
      lies.push(
        t.groupe === "pont"
          ? {
              ...LUDMILA,
              heure: "sem. 7",
              alerte: true,
              texte:
                "Le groupe Brenval est arrivé pour l'Ascension. Depuis lundi, j'ai refusé une trentaine de demandes de clients individuels pour le jeudi et le vendredi : complet.",
            }
          : {
              ...LUDMILA,
              heure: "sem. 8",
              texte:
                "Le groupe Brenval est arrivé lundi : 36 chambres sur des nuits qui seraient restées à moitié vides. Le restaurant a fait trois beaux services de groupe.",
            },
      );
    }
    if (chemin[D.direct] === 2 && de <= 7 && a >= 7) {
      lies.push({
        ...KERSTIN,
        heure: "sem. 7",
        alerte: arrive.bookalia,
        texte: arrive.bookalia ? REPONSES.bookaliaSanctionne : REPONSES.bookaliaPrevient,
      });
      if (arrive.bookalia) {
        lies.push({
          ...LUCILE,
          heure: "sem. 7",
          texte:
            "Les réservations Bookalia ont baissé de 15 % depuis lundi : nous sommes passés en troisième page sur Annecy.",
        });
      }
    }
    if (arrive.analyse) {
      lies.push({
        ...LUCILE,
        heure: "sem. 7",
        texte: meerlandAttend(graine)
          ? ANALYSE_ETE[t.scenario]!
          : `L'analyse est prête : l'été s'annonce ${nomDeLEte(t.scenario)}. Mais Meerland n'a pas attendu : elle a signé avec l'Orméa Annecy Lac.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    return { lies, imprevus };
  },
  imprevus: (graine) =>
    hasard(graine).imprevus.map((x) => ({ semaine: x.semaine, titre: x.imprevu.titre })),

  bilan: {
    titre: (t) =>
      `${kE(t.objectif)} de revenu hébergement net, été compris : ${kESigne(t.objectif - BUDGET)} sur le budget`,
    formatObjectif: kE,
    noteDesBarres:
      "Revenu hébergement net de commissions — séjours d'avril à juin, plus l'été estimé fin juin, frais des actions déduits — sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Revenu net d'avril à juin",
          valeur: kE(t.revenuTrimestre),
          aide: `net de commissions ; budget ${kE(BUDGET_TRIMESTRE)}`,
          tenu: t.revenuTrimestre >= BUDGET_TRIMESTRE,
        },
        {
          nom: "RevPAR du trimestre",
          valeur: euros(t.revpar),
          aide: `taux d'occupation ${taux(t.to, 0)}, prix moyen ${euros(t.pm)} ; budget ${euros(REVPAR_BUDGET)}`,
          tenu: t.revpar >= REVPAR_BUDGET,
        },
        {
          nom: "Part directe",
          valeur: taux(t.partDirecte, 0),
          aide: `des nuitées d'individuels, en moyenne ; 38 % en mars, visée ${taux(PART_DIRECTE_VISEE, 0)}`,
          tenu: t.partDirecte >= PART_DIRECTE_VISEE,
        },
        {
          nom: "L'été",
          valeur: kE(t.valeurEte),
          aide: `estimé fin juin, été ${nomDeLEte(t.scenario)}${t.allotement ? `, ${t.allotement} chambres chez Meerland` : ""} ; budget ${kE(BUDGET_ETE)}`,
          tenu: t.valeurEte >= BUDGET_ETE,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "L'été",
          texte: `s'est annoncé ${nomDeLEte(t.scenario)} (environ ${
            t.scenario === 0 ? "trois" : t.scenario === 1 ? "cinq" : "deux"
          } étés sur dix)${
            t.meerlandParti
              ? " ; Meerland n'a pas attendu l'analyse et a signé avec l'Orméa"
              : t.allotement
                ? ` ; ${t.allotement} chambres par nuit sont allées à Meerland`
                : ""
          }.`,
        },
        {
          titre: "Les partenaires",
          texte: [
            t.groupe === "pont"
              ? "Brenval a logé sur le pont de l'Ascension"
              : t.groupe === "semaine"
                ? "Brenval a accepté les nuits de semaine après le pont"
                : "Brenval a logé ailleurs",
            t.bookalia ? "Bookalia a fait reculer l'hôtel dans ses résultats" : null,
          ]
            .filter(Boolean)
            .join(", ")
            .concat("."),
        },
      ];
    },
  },
  comportements,
  axe,
};
