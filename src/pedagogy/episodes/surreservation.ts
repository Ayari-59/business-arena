/**
 * ÉPISODE 61 — LES CHAMBRES VENDUES DEUX FOIS, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du revenue management de Lucile
 * montre, ce que la courbe trace, ce sur quoi le bilan la juge, et ce que ses
 * décisions révèlent d'elle.
 */
import {
  AVIS,
  BUDGET,
  D,
  GARANTIE_DES,
  HOTELS,
  JOURS_SANS_PERTE,
  NEUTRE,
  PERTE_PAR_JOUR,
  SARVELEC,
  SURRESERVATION_REFERENCE,
  evenements,
  hasard,
  sarvelecPartSiDemande,
  simuler,
  tableauDeBord,
  type Semaine,
  type Trimestre,
} from "@/engine/episodes/surreservation";
import {
  DIAGNOSTICS,
  DIRECTEUR,
  ETAPES,
  ISALINE,
  NOM_COURT,
  ROMUALD,
  OTTILIE,
  REFERENCES,
  REFLEXES,
  REPONSES,
  SATURNIN,
  pc,
} from "@/config/episodes/surreservation";
import type { Constat, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

const chambres = (v: number) => `${nombre(v, 0)} chambre${Math.round(v) > 1 ? "s" : ""}`;
const clients = (v: number) => `${nombre(v, 0)} client${Math.round(v) > 1 ? "s" : ""}`;
/** Un écart au budget : positif, le groupe fait mieux que prévu. */
const ecartAuBudget = (v: number) =>
  v >= 0 ? `${kE(v)} au-dessus du budget` : `${kE(-v)} sous le budget`;
/** « dont 3 habitués », « aucun habitué » : les fidèles parmi les délogés. */
const habitues = (v: number) =>
  v >= 0.5 ? `dont ${nombre(v, 0)} habitué${v >= 1.5 ? "s" : ""}` : "aucun habitué";
const points = (v: number) => `${nombre(v * 100, 1)} pt`;

/** Ce que les décisions révèlent, dans l'ordre où une revenue manager les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les défections par segment et le coût d'une chambre vide et d'un délogement",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    arbitrage:
      "Votre diagnostic de la semaine 1 était juste : une chambre vide et un client délogé ont chacun un coût, et le bon niveau de surréservation se calculait en les comparant, hôtel par hôtel, selon les défections de chaque segment.",
    defections:
      "En semaine 1, vous avez vu les défections des clients d'affaires : un vrai problème, mais seulement la moitié du calcul. Le même raisonnement, appliqué partout, faisait déloger au Lac, à Évian ou à Aix-les-Bains, où presque personne ne fait défection.",
    image:
      "En semaine 1, vous avez vu dans la surréservation un risque de réputation. Un délogement a un coût, chiffrable : 260 € pour un client de passage prévenu à temps. Une chambre vide aussi : la marge du soir, perdue pour toujours.",
    prix: "En semaine 1, vous avez retenu le prix moyen. Les soirs complets étaient vendus au prix du marché ; ce qui manquait, ce n'était pas un meilleur prix, c'étaient les chambres libérées par les défections, revendues à ce prix.",
  };
  const justes = ["arbitrage", "defections"];
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
    score: d === "arbitrage" ? 1 : d === "defections" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 1 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais regardé un seul des deux coûts : ni le délogement seul, en refusant de surréserver, ni la chambre vide seule, en surréservant au même niveau partout ou davantage quand la ville était pleine."
        : `Vous avez regardé un seul des deux coûts dans ${n} décision${n > 1 ? "s" : ""} sur ${ETAPES.length} : le délogement seul, en refusant ou en suspendant la surréservation, ou la chambre vide seule, en surréservant au même niveau partout ou davantage quand la ville était pleine.${
            t.remplies < 100
              ? ` Sur l'automne, ${chambres(t.vides)} sont restées vides par défection.`
              : t.deloges >= 60
                ? ` Sur l'automne, ${clients(t.deloges)} ont été délogés.`
                : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    SURRESERVATION_REFERENCE,
    "de surréservation pour le soir du salon à Chambéry-Gare",
    "chambres",
    { juste: 0.5, proche: 1.5 },
    (e) => chambres(e),
  );

  // Le calcul refait soir par soir : qui déloger, le congrès, novembre.
  const refait =
    (p.chemin[D.deloger] === 1 ? 1 : 0) +
    (p.chemin[D.congres] === 2 || p.chemin[D.congres] === 3 ? 1 : 0) +
    (p.chemin[D.novembre] === 1 && p.chemin[D.politique] === 2 ? 1 : 0);
  const soir: Constat = {
    score: refait === 3 ? 1 : refait === 2 ? 0.6 : 0,
    texte: `${
      p.chemin[D.deloger] === 1
        ? "Vous avez fait baisser le coût d'un délogement en choisissant des clients de passage, prévenus à temps."
        : `Vous avez laissé les délogements tomber sur ${p.chemin[D.deloger] === 3 ? "ceux qui refusaient le bon d'achat, souvent des habitués" : "les derniers arrivés, souvent des habitués"} : ${t.fidelesDeloges >= 1 ? `${clients(t.fidelesDeloges)} fidèles délogés, ${t.fidelesPerdus} perdu${t.fidelesPerdus > 1 ? "s" : ""}` : "peu de fidèles délogés cette fois, mais chaque délogement en risquait un"}.`
    } ${
      p.chemin[D.congres] === 2 || p.chemin[D.congres] === 3
        ? "Pendant le congrès, vous avez surréservé moins, parce qu'un délogement à Aix-les-Bains coûtait près du double et que les congressistes venaient."
        : "Pendant le congrès, vous n'avez pas refait le calcul, quand un délogement coûtait près du double et que les congressistes ne faisaient presque pas défection."
    } ${
      p.chemin[D.novembre] === 1 && p.chemin[D.politique] === 2
        ? "En novembre, vous avez remis le calcul à jour avec les défections constatées et le profil des salons."
        : "En novembre, vous n'avez pas remis un calcul à jour avec les défections constatées et le profil des salons."
    }`,
  };

  return [information, diagnostic, reflexe, calibrage, soir];
}

export function axe([information, diagnostic, reflexe, calibrage, soir]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer une chambre vide et un délogement",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les défections par segment et le coût des deux erreurs : 121 € de marge pour une chambre vide à Chambéry-Gare, 260 € pour un client de passage délogé, 1 030 € pour un habitué. Sans ces trois chiffres, toute politique de surréservation se décide à l'humeur.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Comparer les deux coûts, en espérance",
      texte:
        "Refuser de surréserver, c'est ne voir que le délogement ; surréserver de 5 % partout, c'est ne voir que la chambre vide. Ajoutez une réservation tant que la probabilité qu'elle remplisse une chambre libérée, multipliée par la marge, dépasse la probabilité qu'elle fasse déloger quelqu'un, multipliée par ce que coûte le délogement.",
    };
  }
  if (soir!.score === 0) {
    return {
      titre: "Refaire le calcul soir par soir",
      texte:
        "Le même raisonnement donne des réponses différentes selon le soir : qui l'on déloge, quand toute la ville est pleine, quand les salons changent le mélange de clients. Un niveau calculé une fois pour l'automne vieillit en quelques semaines.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Voir les deux erreurs à la fois",
      texte:
        "La surréservation arbitre entre deux erreurs qui ont chacune un prix : la chambre qui reste vide et le client qu'on déloge. Un diagnostic qui n'en voit qu'une fait choisir un niveau trop haut ou trop bas.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Calibrer vos prévisions",
      texte:
        "Refaites le calcul de la semaine 1 : 121 € ÷ (121 € + 260 €) = 32 %. La plus petite surréservation dont la probabilité d'avoir au plus autant de défections atteint 32 % est la bonne : 6 chambres. Notez vos prévisions chiffrées et comparez-les au réalisé.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

export const EPISODE_SURRESERVATION: Episode<Trimestre> = {
  code: "surreservation",
  numero: 51,
  domaine: "Coût d'une chambre vide",
  titre: "Les chambres vendues deux fois",
  resume:
    "De septembre à novembre, salons et congrès remplissent les hôtels, et des clients ne viennent pas. Fixer la surréservation en comparant, en espérance, le coût d'une chambre vide et celui d'un délogement.",
  persona:
    "Vous êtes Lucile Fabbri, revenue manager du Groupe Escale, au siège d'Annecy : vous fixez les prix et la surréservation des huit hôtels du groupe. Les directeurs d'hôtel, eux, détestent déloger un client.",
  mandat: [
    { fort: kE(BUDGET), texte: "de marge hébergement sur les soirs complets de l'automne" },
    { fort: "91 soirs complets", texte: "de septembre à novembre, dans sept hôtels" },
    { fort: "21 €", texte: "de coût variable par nuitée" },
    { fort: "nets", texte: "des délogements, des clients perdus et des avis" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la marge hébergement des soirs complets — nuitées vendues moins leur coût variable, défections encaissées comprises —, nette des coûts de délogement et de la marge des clients perdus.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre revenue management",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, les réceptions continuent de refuser des réservations les soirs complets, faute de politique.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ROMUALD,
        alerte: true,
        texte: `Pendant ce temps, faute de consigne, la réception a refusé des réservations pour le premier salon, alors que des chambres se libéreront : ${euros(perdu)} de marge perdue.`,
      };
    },
  },
  prevision: {
    libelle:
      "le nombre de réservations à accepter au-delà des 72 chambres de Chambéry-Gare, le soir du salon de la semaine 3, si l'on déloge un client de passage",
    unite: "chambres",
    placeholder: "4",
    min: 0,
    max: 20,
    step: 1,
    reel: () => SURRESERVATION_REFERENCE,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "marge",
      nom: "Marge nette des soirs complets",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine
          ? `budget à date : ${kE(l.budgetADate ?? 0)} sur ${kE(BUDGET)}`
          : `${kE(BUDGET)} de budget pour l'automne`,
      jauge: (l) =>
        l.budgetADate
          ? {
              part: Math.min(1, Math.max(0, (l.marge ?? 0) / BUDGET)),
              enRetard: (l.marge ?? 0) < l.budgetADate,
            }
          : null,
    },
    {
      cle: "to",
      nom: "Taux d'occupation des soirs complets",
      format: (v) => taux(v),
      formatEcart: points,
      sensBon: 1,
      aide: () => "chambres occupées sur chambres disponibles, depuis septembre",
    },
    {
      cle: "vides",
      nom: "Chambres vides par défection",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: () => "les soirs complets, depuis septembre",
    },
    {
      cle: "deloges",
      nom: "Clients délogés",
      format: (v) => nombre(v, 0),
      sensBon: -1,
      aide: (_, l) => `depuis septembre ; ${habitues(l.fideles ?? 0)}`,
    },
    {
      cle: "couts",
      nom: "Coût des délogements",
      format: kE,
      sensBon: -1,
      aide: () => "nuits, taxis, gestes, clients perdus, avis ; cumul",
    },
  ],
  contexte(l, decisions) {
    const ecart = l.phi ?? 1;
    return {
      vides: nombre(l.vides ?? 0, 0),
      deloges: Math.round(l.deloges ?? 0),
      fideles: Math.round(l.fideles ?? 0),
      noires: l.noires ?? 0,
      to: l.to == null ? "—" : taux(l.to),
      marge: kE(l.marge ?? 0),
      couts: kE(l.couts ?? 0),
      remplies: Math.round(l.remplies ?? 0),
      margeRemplies: kE(l.margeRemplies ?? 0),
      surreserve: (decisions[D.politique] ?? 0) !== 0,
      garantie: decisions[D.garantie] ?? 0,
      tauxConstate: l.tauxConstate == null ? "" : pc(Math.round(l.tauxConstate * 1000) / 1000),
      tauxAttendu: l.tauxAttendu == null ? "" : pc(Math.round(l.tauxAttendu * 1000) / 1000),
      ecartAutomne:
        ecart >= 1.05
          ? `plus défaillant que d'habitude, d'environ ${nombre((ecart - 1) * 100, 0)} %`
          : ecart <= 0.95
            ? `moins défaillant que d'habitude, d'environ ${nombre((1 - ecart) * 100, 0)} %`
            : "conforme à l'historique",
    };
  },
  recap(t, de, a) {
    const semaines = t.semaines.slice(de, a + 1) as Semaine[];
    const fideles = semaines.reduce((x, w) => x + w.fidelesDeloges, 0);
    return [
      ["Marge nette de la période", kE(semaines.reduce((x, w) => x + w.marge, 0))],
      [
        "Chambres vides par défection",
        nombre(
          semaines.reduce((x, w) => x + w.vides, 0),
          0,
        ),
      ],
      [
        "Clients délogés",
        `${nombre(
          semaines.reduce((x, w) => x + w.deloges, 0),
          0,
        )}${fideles >= 0.5 ? ` (${nombre(fideles, 0)} habitué${fideles >= 1.5 ? "s" : ""})` : ""}`,
      ],
    ];
  },
  courbe: {
    titre: "Ce que coûtent chambres vides et délogements, par soir complet",
    cle: "coutParSoir",
    cible: 500,
    libelleCible: "repère : 500 € par soir au plus",
    graduations: [0, 500, 1000, 2000, 4000, 6000],
    format: euros,
    details: (s) => [
      `${nombre(s.soirs!, 0)} soirs complets · surréservation moyenne ${nombre(s.surreservation!, 1)} · occupation ${taux(s.occupees! / Math.max(1, s.capacite!))}`,
      `${chambres(s.vides!)} vides · ${clients(s.deloges!)} délogé${s.deloges! > 1 ? "s" : ""} · marge ${kE(s.marge!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.garantie && (choix === 1 || choix === 3)) {
      // Sarvélec répond à la carte ou à l'acompte selon le hasard du trimestre.
      const part = sarvelecPartSiDemande(choix, graine);
      const texte =
        choix === 1
          ? part
            ? REPONSES.carteNon
            : REPONSES.carteOui
          : part
            ? REPONSES.acompteNon
            : REPONSES.acompteOui;
      return [{ ...OTTILIE, texte }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const lies: Message[] = [];
    if (arrive.sarvelec) {
      lies.push({
        ...ROMUALD,
        heure: `sem. ${GARANTIE_DES}`,
        alerte: true,
        texte: REPONSES.sarvelecParti,
      });
    }
    for (const n of arrive.soireesNoires) {
      const dir = DIRECTEUR[n.hotel] ?? ISALINE;
      lies.push({
        ...dir,
        heure: `sem. ${n.semaine}`,
        alerte: true,
        texte: `${n.deloges} clients délogés le même soir à ${NOM_COURT[n.hotel]}. Les avis à une étoile tombent sur Bookalia ; il faut payer ${euros(AVIS.cout)} de mise en avant pour remonter dans le classement.`,
      });
    }
    for (const p of arrive.pertes) {
      const dir = DIRECTEUR[p.hotel] ?? ISALINE;
      lies.push({
        ...dir,
        heure: `sem. ${p.semaine}`,
        alerte: true,
        texte: `Un habitué délogé la semaine dernière à ${NOM_COURT[p.hotel]} nous a écrit : son entreprise réserve désormais ailleurs. Environ ${euros(4000)} de marge par an.`,
      });
    }
    if (arrive.deloges >= 8 && arrive.soireesNoires.length === 0) {
      lies.push({
        ...SATURNIN,
        heure: `sem. ${a}`,
        texte: `${clients(arrive.deloges)} délogés dans le groupe ces dernières semaines${arrive.fidelesDeloges >= 1 ? `, dont ${nombre(arrive.fidelesDeloges, 0)} habitué${arrive.fidelesDeloges >= 1.5 ? "s" : ""}` : ", tous des clients de passage prévenus avant leur arrivée"}.`,
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
    titre: (t) => `${ecartAuBudget(t.objectif - BUDGET)}, délogements et clients perdus déduits`,
    formatObjectif: kE,
    noteDesBarres:
      "Marge hébergement des soirs complets, nette des délogements, des clients perdus et des avis, sous les aléas que vous avez joués : plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      return [
        {
          nom: "Marge nette des soirs complets",
          valeur: kE(t.objectif),
          aide: `budget ${kE(BUDGET)}`,
          tenu: t.objectif >= BUDGET,
        },
        {
          nom: "Taux d'occupation",
          valeur: taux(t.to),
          aide: `${chambres(t.vides)} vides par défection ; repère 96 %`,
          tenu: t.to >= 0.96,
        },
        {
          nom: "Délogements",
          valeur: clients(t.deloges),
          aide: `${habitues(t.fidelesDeloges)} ; ${t.soireesNoires.length ? `${t.soireesNoires.length} soir${t.soireesNoires.length > 1 ? "s" : ""}` : "aucun soir"} à ${AVIS.seuil} délogements ou plus`,
          tenu: t.fidelesDeloges < 2 && t.soireesNoires.length === 0,
        },
        {
          nom: "Clients perdus",
          valeur: kE(t.valeurPerdue),
          aide: `${t.fidelesPerdus ? `${t.fidelesPerdus} habitué${t.fidelesPerdus > 1 ? "s" : ""} parti${t.fidelesPerdus > 1 ? "s" : ""}` : "aucun habitué parti"}${t.sarvelecParti ? ", mais Sarvélec" : ""} ; marge annuelle`,
          tenu: t.fidelesPerdus === 0 && !t.sarvelecParti,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre[0]!.toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Les défections de l'automne",
          texte: `Cet automne, les clients ont fait défection ${
            h.phi >= 1.05
              ? `environ ${nombre((h.phi - 1) * 100, 0)} % plus souvent que d'habitude`
              : h.phi <= 0.95
                ? `environ ${nombre((1 - h.phi) * 100, 0)} % moins souvent que d'habitude`
                : "à peu près comme d'habitude"
          } ; la surréservation a rempli ${chambres(t.remplies)} que les défections auraient laissées vides.`,
        },
        {
          titre: "Les clients",
          texte: [
            t.deloges > 0
              ? `${clients(t.deloges)} délogé${t.deloges > 1 ? "s" : ""}, ${habitues(t.fidelesDeloges)}`
              : "aucun client délogé",
            t.fidelesPerdus > 0
              ? `${t.fidelesPerdus} habitué${t.fidelesPerdus > 1 ? "s" : ""} parti${t.fidelesPerdus > 1 ? "s" : ""} avec le compte de son entreprise`
              : null,
            t.sarvelecParti
              ? `Sarvélec est parti chez Orméa Hotels avec ${kE(SARVELEC.valeur)} de marge annuelle`
              : null,
            t.soireesNoires.length
              ? `des avis négatifs après ${t.soireesNoires.length} soir${t.soireesNoires.length > 1 ? "s" : ""} à ${AVIS.seuil} délogements ou plus`
              : null,
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

/** Les hôtels du modèle, pour les tests. */
export const HOTELS_DE_L_EPISODE = HOTELS;
