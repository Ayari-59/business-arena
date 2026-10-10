/**
 * ÉPISODE 107 — LA GAMME VÉGÉTALE, telle que l'interface et le bilan la lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord d'Herveline montre, ce que la
 * courbe trace, ce sur quoi le conseil la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * Une stratégie se joue sur des années, l'épisode sur un trimestre : le
 * tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, le résultat du
 * trimestre plus la VAN sur cinq ans de la position prise, recalculée chaque
 * semaine avec ce que le trimestre apprend : la riposte de Nordal, le
 * réachat mesuré, le scénario que le panel révèle en semaine 12. Elle part
 * en dessous de zéro : ne rien faire laisse la gamme Nordal prendre des
 * clients à nos crèmes desserts.
 */
import {
  CA_CENTRAL_TROIS_ANS,
  D,
  DEBUT_TEST,
  EFFET,
  JOURS_SANS_PERTE,
  LIGNE,
  MAGASINS_OPALINE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  REVELATION,
  SCENARIOS,
  SEMAINES,
  SEUILS,
  TAUX,
  caGamme,
  enRayon,
  evenements,
  hasard,
  reservationPartielle,
  simuler,
  tableauDeBord,
  type Trimestre,
} from "@/engine/episodes/gamme-vegetale";
import {
  DIAGNOSTICS,
  ETAPES,
  ME,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/gamme-vegetale";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const LENAIC = { de: "Lénaïc Guivarc'h", role: "Président" } as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const ENVEL = { de: "Envel Danzé", role: "Directeur commercial, Fabrique Ardaven" } as const;
const TIEMOKO = {
  de: "Tiémoko Larvor",
  role: "Chef de groupe ultra-frais, Opaline",
} as const;
const VALERIEN = { de: "Valérien Tréguer", role: "Chargé d'études, institut de panel" } as const;

/** Ce que la prévision de la semaine 1 demande : le chiffre d'affaires de la troisième année, scénario central, en k€. */
export const CA_TROIS_ANS_K = CA_CENTRAL_TROIS_ANS / 1000;

const ETATS = ["aucune", "pivot", "large", "prolonge"] as const;

/** Ce que la proposition de la semaine 9 engage, dit en une phrase pour les sources de la semaine 11. */
export function suiteTexte(etat: (typeof ETATS)[number]): string {
  switch (etat) {
    case "large":
      return `Le conseil va élargir la gamme aux trois enseignes en septembre : dans le scénario central, ${ME(caGamme("central", 1))} de chiffre d'affaires la première année en année pleine, ${ME(caGamme("central", 3))} la troisième.`;
    case "pivot":
      return `Le conseil va garder deux références à l'avoine chez Opaline : dans le scénario central, environ ${kE(0.2 * caGamme("central", 1))} de chiffre d'affaires la première année, ${kE(0.2 * caGamme("central", 3))} la troisième.`;
    case "prolonge":
      return `Le test se prolonge chez Opaline jusqu'en septembre : quatre références, environ ${kE((0.25 * caGamme("central", 1)) / 2)} de chiffre d'affaires d'ici là dans le scénario central.`;
    default:
      return "";
  }
}

/** Ce que les décisions révèlent, dans l'ordre où une directrice du marketing les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'étude du rayon et le plan de la gamme",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    test: "Votre diagnostic de la semaine 1 était juste : personne ne savait si le rayon continuerait de croître, et un test réversible achetait l'information avant d'engager une ligne.",
    allergenes:
      "En semaine 1, vous avez vu la contrainte des allergènes : elle est réelle, mais elle ne dit pas quand investir. La vraie question était l'incertitude sur le rayon, qu'un test lève à peu de frais.",
    premier:
      "En semaine 1, vous avez cru que le rayon irait au premier qui aurait une ligne ; un marché qui peut plafonner ou reculer ne récompense pas le premier, il punit celui qui a figé son capital.",
    cannibalisation:
      "En semaine 1, vous avez craint la cannibalisation ; elle coûte 3,6 % du chiffre d'affaires de la gamme, quand la gamme Nordal, sans gamme à nous, prendrait bien davantage à nos crèmes desserts.",
  };
  const justes = ["test", "allergenes"];
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
    score: d === "test" ? 1 : d === "allergenes" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'un comité pressé : ni la ligne pour occuper le terrain, ni l'abandon d'un marché « qui n'est pas le nôtre », ni la foi dans les commandes, ni le bruit qui réveille Nordal, ni l'engagement signé sur l'enthousiasme des premières semaines."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : investir pour occuper le terrain ou laisser passer, juger sur les commandes, faire du bruit, s'engager sur les premières semaines, tenir ce qu'on a annoncé, figer la ligne.${
            t.nordal ? " Le Groupe Nordal a riposté par ses promotions." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    CA_TROIS_ANS_K,
    "de chiffre d'affaires la troisième année, dans le scénario central",
    "k€",
    { juste: 100, proche: 300 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const base = p.chemin[D.strategie];
  const d2 = p.chemin[D.mesure];
  const d5 = p.chemin[D.revision];
  const marche = `Le rayon a connu ${SCENARIOS[t.scenario].nom}`;
  let texte: string;
  let score: number;
  if (base === 0) {
    score = 0;
    texte = `Vous avez figé ${ME(LIGNE.investissement)} avant de rien savoir du rayon. ${marche}${
      t.scenario === "essor"
        ? " : cette fois, le pari a payé ; il aurait perdu sept fois sur dix."
        : " : la ligne tournera loin de sa capacité."
    }`;
  } else if (base === 3) {
    score = 0;
    texte = `Vous avez laissé passer sans rien apprendre : ni test, ni mesure. ${marche}, et la gamme Nordal prend des clients à nos crèmes desserts.`;
  } else if (d5 === 1 && d2 === 1) {
    score = 1;
    texte = `Vous avez mesuré le réachat avec la carte de fidélité et décidé sur lui, selon des critères écrits d'avance : ${nombre(t.signal ?? 0, 0)} % mesurés, ${
      t.etat === "large"
        ? "l'élargissement"
        : t.etat === "pivot"
          ? "les deux références à l'avoine"
          : "l'arrêt"
    }. ${marche}.`;
  } else if (d5 === 1) {
    score = 0.6;
    texte = `Vous avez appliqué vos critères, mais à une mesure qui ne mesurait pas le réachat : ${
      d2 === 0
        ? "les commandes le surestiment toujours, remplissage et nouveauté compris"
        : "la dégustation ne l'annonce qu'à sept points près"
    }. ${marche}.`;
  } else if (d5 === 0) {
    score = 0;
    texte = `Vous avez élargi comme annoncé, sans lire le réachat : tenir le cap contre un test décevant est le piège. ${marche}.`;
  } else if (d5 === 2) {
    score = 0.6;
    texte = `Vous avez prolongé le test plutôt que décider : six mois de plus pour apprendre ce que le test disait déjà, et Celtis qui n'attend pas. ${marche}.`;
  } else {
    score = 0;
    texte = `Vous avez arrêté sans lire le test : un test se fait pour être lu. ${marche}.`;
  }
  const revision: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, revision];
}

export function axe([information, diagnostic, reflexe, calibrage, revision]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer le rayon avant de choisir",
      texte:
        "Rejouez l'épisode en lisant d'abord l'étude du rayon et le plan de la gamme : les trois scénarios, leurs probabilités et le réachat des gammes qui ont tenu disent ce qu'un test peut vous apprendre, et ce que la ligne risque.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne rien figer avant de savoir",
      texte:
        "Sur un marché incertain, la ligne se commande quand les volumes la justifient : achetez d'abord l'information par un test réversible, payez le droit de continuer plutôt que l'engagement, et décidez sur ce que les clients font, pas sur les commandes.",
    };
  }
  if (revision!.score === 0) {
    return {
      titre: "Lire le test, et changer de cap",
      texte:
        "Un test ne vaut que s'il peut faire changer d'avis : mesurez le réachat, écrivez avant les seuils qui feront élargir, garder ou arrêter, et tenez-vous-y même quand les commandes disent le contraire.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Raisonner en scénarios",
      texte:
        "Ni la course au premier entrant, ni la peur de la cannibalisation, ni même la contrainte des allergènes ne décident seules : l'incertitude sur le rayon décide, et elle se réduit par un test avant de s'acheter par une ligne.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du chiffre d'affaires",
      texte:
        "Posez-le dans l'ordre : le rayon dans trois ans au taux du scénario central, la part visée cette année-là, puis le passage du prix consommateur au prix net de cession. C'est là que se glissent les écarts.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) =>
  w <= 0 ? t.semaines[1]!.valeur - t.semaines[1]!.variation : t.semaines[w]!.valeur;

const NOMS_DES_ETATS: Record<(typeof ETATS)[number], string> = {
  aucune: "aucune gamme",
  pivot: "deux références chez Opaline",
  large: "trois enseignes",
  prolonge: "test prolongé",
};

export const EPISODE_VEGETAL: Episode<Trimestre> = {
  code: "gamme-vegetale",
  numero: 107,
  domaine: "Lancer une innovation sur un marché incertain",
  titre: "La gamme végétale",
  resume:
    "Un rayon qui croît de 15 % par an, un concurrent qui s'y installe, une ligne à 3,2 M€. Acheter l'information avant l'usine, et lire le test honnêtement.",
  persona:
    "Vous êtes Herveline Daniélou, directrice marketing et innovation de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac et Pontivy : yaourts, fromage blanc, crèmes desserts, 185 M€ de chiffre d'affaires. Le rayon des desserts végétaux monte, le Groupe Nordal vient d'y entrer, et le conseil d'administration attend votre recommandation.",
  mandat: [
    {
      fort: ME(LIGNE.investissement),
      texte: "pour une ligne végétale dédiée, si le conseil la vote",
    },
    { fort: "janvier à mars", texte: "le trimestre, jusqu'au conseil de fin mars" },
    { fort: taux(TAUX, 0), texte: "le taux d'actualisation des projets d'innovation" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
  ],
  jugement:
    "Le conseil juge le trimestre sur la valeur créée : le résultat du trimestre plus la VAN sur cinq ans de la position prise, recalculée en semaine 13 avec ce que le trimestre a révélé, érosion de nos crèmes desserts comprise.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre gamme végétale",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du conseil se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...IWAN,
        alerte: true,
        texte: `Pour tenir le délai du conseil, j'ai fait boucler votre dossier par un cabinet : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "le chiffre d'affaires annuel de la gamme la troisième année, dans le scénario central, en milliers d'euros",
    unite: "k€",
    placeholder: "2000",
    min: 0,
    max: 20000,
    step: 10,
    reel: () => CA_TROIS_ANS_K,
  },

  simuler: (chemin, graine, j) => simuler(chemin, graine, j),
  lire: (decisions, graine, j, semaine) => ({ ...tableauDeBord(decisions, graine, j, semaine) }),
  indicateurs: [
    {
      cle: "valeur",
      nom: "Valeur créée estimée",
      format: kE,
      sensBon: 1,
      aide: (semaine, l) =>
        semaine >= REVELATION
          ? "VAN sur cinq ans, scénario du rayon connu"
          : `VAN sur cinq ans ; essor jugé à ${taux(l.essor ?? SCENARIOS.essor.chance, 0)}`,
    },
    {
      cle: "commandes",
      nom: "Commandes de la semaine",
      format: kE,
      sensBon: 1,
      aide: (semaine) =>
        semaine >= DEBUT_TEST ? "ce que les enseignes commandent" : "aucune gamme en rayon",
    },
    {
      cle: "reachat",
      nom: "Réachat mesuré",
      format: (v) => `${nombre(v, 1)} %`,
      formatEcart: (v) => `${nombre(v, 1)} pt`,
      sensBon: 1,
      aide: () => `carte de fidélité Opaline ; seuils ${SEUILS.garder} et ${SEUILS.elargir} %`,
    },
    {
      cle: "engage",
      nom: "Sommes engagées",
      format: kE,
      sensBon: -1,
      aide: () =>
        `ligne, contrats et frais du trimestre ; la ligne seule : ${ME(LIGNE.investissement)}`,
      jauge: (l) => ({
        part: Math.min(1, (l.engage ?? 0) / LIGNE.investissement),
        enRetard: (l.engage ?? 0) >= LIGNE.investissement,
      }),
    },
    {
      cle: "nordal",
      nom: "Remise du Groupe Nordal",
      format: (v) => taux(v, 0),
      formatEcart: (v) => `${nombre(v * 100, 0)} pt`,
      sensBon: -1,
      aide: () => "sur sa gamme végétale, cette semaine",
    },
  ],
  contexte(l, decisions): Contexte {
    const base = decisions[D.strategie] ?? NEUTRE[D.strategie];
    const chemin = NEUTRE.map((n, i) => decisions[i] ?? n);
    const etat = l.etat !== null && l.etat !== undefined ? ETATS[l.etat] : undefined;
    const suite = enRayon(chemin) && etat !== undefined && etat !== "aucune";
    const objectif = l.objectifCumul ?? 0;
    return {
      enRayon: enRayon(chemin),
      faconnier: enRayon(chemin),
      ligne: base === 0,
      carte: decisions[D.mesure] === 1,
      degustation: decisions[D.mesure] === 2,
      promo: decisions[D.lancement] === 2,
      riposte: (l.riposte ?? 0) > 0,
      commandesCumul: kE(l.commandesCumul ?? 0),
      pctObjectif: objectif > 0 ? taux((l.commandesCumul ?? 0) / objectif, 0) : "—",
      remplissage: kE(l.remplissage ?? 0),
      rotation: nombre(l.rotation ?? 0, 1),
      rotationMoyenne: nombre(l.rotationMoyenne ?? 0, 1),
      signal: `${nombre(l.signal ?? 0, 0)} %`,
      suite,
      suiteTexte: suite ? suiteTexte(etat!) : "",
      valeur: kE(l.valeur ?? 0),
      engage: kE(l.engage ?? 0),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Sommes engagées, sem. ${a}`, kE(s.engage)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [250000, 500000, 750000, 1000000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `engagé ${kE(s.engage!)} · commandes ${kE(s.commandes!)}${
        s.nordal! > 0 ? ` · Nordal à −${taux(s.nordal!, 0)}` : ""
      }`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.faconnier && choix === 1) {
      // Le façonnier garde tous les créneaux, ou la moitié, selon le hasard du trimestre.
      return [
        {
          ...ENVEL,
          texte: reservationPartielle(graine)
            ? REPONSES.reservationPartielle
            : REPONSES.reservationComplete,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.arrivee) {
      const s = t.semaines[DEBUT_TEST]!;
      lies.push({
        ...NAIM,
        heure: `sem. ${DEBUT_TEST}`,
        texte: `La gamme est en rayon${
          chemin[D.strategie] === 2
            ? " dans les trois enseignes"
            : ` dans les ${MAGASINS_OPALINE} magasins Opaline de l'Ouest`
        }. Première commande pour remplir les rayons : ${kE(s.commandes)}.`,
      });
    }
    if (arrive.nordal) {
      lies.push({
        ...BAPTISTIN,
        heure: `sem. ${h.semaineNordal}`,
        alerte: true,
        texte: enRayon(chemin)
          ? "Le Groupe Nordal passe toute sa gamme végétale à −34 % pendant quatre semaines, dans les trois enseignes. Nos ventes vont en prendre un coup."
          : "Le Groupe Nordal passe toute sa gamme végétale à −34 % pendant quatre semaines : il occupe les linéaires avant notre arrivée de juillet.",
      });
    }
    if (arrive.degustation) {
      lies.push({
        ...MORWENNA,
        heure: "sem. 5",
        texte: `La dégustation est faite : nos recettes à l'avoine sont préférées à celles de Nordal ; l'institut en déduit un réachat d'environ ${nombre(t.signal ?? 0, 0)} %, à sept points près.`,
      });
    }
    if (arrive.lecture && chemin[D.mesure] === 1) {
      lies.push({
        ...TIEMOKO,
        heure: "sem. 9",
        texte: `Les données de la carte sont prêtes : ${nombre(t.signal ?? 0, 0)} % des acheteurs de votre gamme l'ont rachetée dans les six semaines.`,
      });
    }
    if (arrive.revision && chemin[D.revision] === 1) {
      const texte = !enRayon(chemin)
        ? chemin[D.strategie] === 0
          ? REPONSES.sansTest
          : null
        : t.etat === "large"
          ? REPONSES.elargir
          : t.etat === "pivot"
            ? REPONSES.garder
            : REPONSES.arreter;
      if (texte) lies.push({ ...YANNIG, heure: `sem. ${EFFET[D.revision]}`, texte });
    }
    if (
      a >= EFFET[D.production] &&
      de <= EFFET[D.production] &&
      chemin[D.production] === 0 &&
      enRayon(chemin) &&
      t.etat === "aucune"
    ) {
      lies.push({ ...LENAIC, heure: `sem. ${EFFET[D.production]}`, texte: REPONSES.ligneInutile });
    }
    if (
      a >= SEMAINES &&
      de <= SEMAINES &&
      chemin[D.production] === 2 &&
      enRayon(chemin) &&
      t.etat !== "aucune"
    ) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${SEMAINES}`,
        alerte: t.incident,
        texte: t.incident ? REPONSES.incident : REPONSES.pasDIncident,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.panel) {
      imprevus.push({
        ...VALERIEN,
        heure: `sem. ${REVELATION}`,
        texte: REPONSES.panel[t.scenario],
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
      "Valeur créée par les décisions du trimestre : le résultat du trimestre plus la VAN sur cinq ans de la position prise, érosion de nos crèmes desserts comprise, recalculée avec ce que le trimestre a révélé, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const mesure = t.semaines[SEMAINES]!.reachat;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Ligne dédiée",
          valeur: t.ligne === null ? "non commandée" : "commandée",
          aide:
            t.ligne === null
              ? "aucun capital figé avant de connaître les volumes"
              : `${ME(LIGNE.investissement)} engagés ; le rayon a connu ${SCENARIOS[t.scenario].nom}`,
          tenu: t.ligne === null || t.scenario === "essor",
        },
        {
          nom: "Réachat",
          valeur: mesure >= 0 ? `${nombre(mesure, 0)} % mesurés` : "non mesuré",
          aide:
            mesure >= 0
              ? `carte de fidélité ; vrai réachat : ${nombre(t.reachat, 0)} %`
              : "ni carte de fidélité, ni test en rayon",
          tenu: mesure >= 0,
        },
        {
          nom: "Riposte de Nordal",
          valeur: t.nordal ? "promotions à −34 %" : "aucune",
          aide: t.nordal ? "quatre semaines sur sa gamme végétale" : "Nordal n'a pas vu de menace",
          tenu: !t.nordal,
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
          titre: "Le rayon",
          texte: `a connu ${SCENARIOS[t.scenario].nom} : ${
            t.scenario === "repli" ? "−" : "+"
          }${taux(Math.abs(SCENARIOS[t.scenario].croissance), 0)} par an. Le vrai réachat de la gamme d'essai était de ${nombre(t.reachat, 0)} %.`,
        },
        {
          titre: "Le Groupe Nordal",
          texte: t.nordal
            ? `a riposté en semaine ${h.semaineNordal} par des promotions à −34 % sur sa gamme, pendant quatre semaines.`
            : "n'a pas riposté.",
        },
        {
          titre: "La gamme après mars",
          texte: `${NOMS_DES_ETATS[t.etat]}${
            t.partielle ? " ; le façonnier n'a gardé que la moitié des créneaux réservés" : ""
          }${t.penalite > 0 ? ` ; ${kE(t.penalite)} de pénalité au façonnier` : ""}${
            t.incident ? " ; des traces de lait trouvées aux essais de la ligne partagée" : ""
          }.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
