/**
 * ÉPISODE 106 — LES DESSERTS QUI PLAISENT À L'EXPORT, tel que l'interface et
 * le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi export de Corto montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 *
 * Une entrée sur un marché étranger se joue sur des années, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, le
 * résultat du trimestre plus la VAN sur cinq ans de la position prise en
 * Espagne, recalculée chaque semaine avec ce que le trimestre apprend.
 * Elle bouge quand on décide, et quand le trimestre révèle : l'accueil du
 * marché, un lot retiré, la réponse de l'importateur.
 */
import {
  CREME,
  D,
  ETIQUETTE,
  GAMMES,
  MAGASINS,
  NEUTRE,
  NOUVEAUTE,
  REFERENCEMENT,
  SCENARIOS,
  SOUTIEN,
  TAUX,
  TEST,
  chanceDAccord,
  contratDe,
  dlcALaReception,
  entreeDe,
  evenements,
  generalise,
  hasard,
  margeParPack,
  pertes,
  rotation,
  scenario,
  seuilDeGeneralisation,
  simuler,
  tableauDeBord,
  type CodeContrat,
  type CodeScenario,
  type Trimestre,
} from "@/engine/episodes/export-a-ouvrir";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/export-a-ouvrir";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const jours = (v: number) => `${nombre(v, 0)} jours`;
/** Des euros au centime : « 0,51 € ». */
const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** Un titre d'imprévu en milieu de phrase : la majuscule initiale tombe, pas celle des noms propres. */
const enPhrase = (titre: string) => titre.charAt(0).toLowerCase() + titre.slice(1);
const points = (v: number) => `${nombre(v * 100, 1)} points`;

const TELMO = { de: "Telmo Urquijo", role: "Directeur général, Distribuciones Nevaria" } as const;
const MAEWENN = { de: "Maëwenn Postec", role: "Directrice des ressources humaines" } as const;
const SABELA = { de: "Sabela Couceiro", role: "VIE export, Madrid" } as const;
const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const SUIVI = { de: "Suivi export Espagne", role: "Point hebdomadaire" } as const;

/** La valeur que la direction attend des décisions du trimestre. */
export const OBJECTIF_VALEUR = 150000;

/** Le chemin d'une partie en cours : les décisions à venir valent « ne rien changer ». */
const complet = (decisions: readonly number[]) => NEUTRE.map((n, i) => decisions[i] ?? n);

/**
 * CE QUE LA SEMAINE 1 DEMANDE : la marge annuelle que l'offre de Nevaria
 * rapporterait dans le scénario moyen, telle qu'elle est proposée (desserts
 * frais par la plateforme de Saragosse, 600 magasins), pertes et soutien
 * marketing déduits, étiquette mise à part.
 */
export const MARGE_DE_L_OFFRE =
  MAGASINS * scenario("moyen").rotation * 52 * margeParPack([0, 0, 1, 2, 0, 2], "moyen") - SOUTIEN;

/**
 * LES CHIFFRES DE LA ROUTE, dans un marché moyen, étiquette mise à part :
 * pour chaque gamme, la DLC à la réception, les pertes, la marge par pack
 * vendu, et ce qu'un magasin rapporte chaque semaine.
 */
export function chiffresDesRoutes() {
  const une = (gamme: number, s: CodeScenario = "moyen") => {
    const chemin = [0, gamme, 1, 2, 0, 2];
    const m = margeParPack(chemin, s);
    const rot = rotation(chemin, s, false);
    return {
      dlc: dlcALaReception(chemin),
      pertes: pertes(chemin, s),
      marge: m,
      parMagasin: m * rot,
    };
  };
  return { plateforme: une(0), uht: une(1), direct: une(2), plateformeFaible: une(0, "faible") };
}

/** Ce que Nevaria montre : la moyenne des six semaines du test, curiosité des deux premières comprise. */
export const moyenneDuTest = (rotationDeFond: number) =>
  rotationDeFond * (1 + (NOUVEAUTE.hausse * NOUVEAUTE.semaines) / TEST.semaines);

/** Les chances que Nevaria accepte un contrat, dites en clair. */
export const chanceDite = (p: number) =>
  p >= 0.995 ? "il l'accepte à coup sûr" : `il l'accepte ${Math.round(p * 100)} fois sur 100`;

/** Les chances que Nevaria accepte chaque contrat, avec le relais choisi en semaine 6. */
export function chancesDesContrats(decisions: readonly number[]) {
  const chemin = complet(decisions);
  const avec = (k: number) => chanceDAccord(chemin.map((c, i) => (i === D.contrat ? k : c)));
  return { troisAns: avec(0), deuxAns: avec(1), cinqAns: avec(2), simple: avec(3) };
}

const NOMS_DES_CONTRATS: Record<CodeContrat, string> = {
  troisAns: "trois ans, objectifs",
  deuxAns: "deux ans, objectifs",
  cinqAns: "cinq ans, sans objectifs",
  simple: "sans exclusivité",
};

/** Ce que les décisions révèlent, dans l'ordre où un directeur export les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, l'offre chiffrée et l'étude de marché",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    etapes:
      "Votre diagnostic de la semaine 1 était juste : l'Espagne se décidait sur ce que vos desserts supportent et sur le partage du risque avec l'importateur, en entrant par étapes.",
    dlc: "En semaine 1, vous avez vu la DLC : une vraie contrainte, qui choisit la gamme, mais pas toute la décision. Le contrat et l'ordre des engagements comptaient autant.",
    vitesse:
      "En semaine 1, vous avez retenu la vitesse ; six cents magasins d'un coup, c'est aussi six cents magasins à perdre si le marché déçoit.",
    marge:
      "En semaine 1, vous avez retenu la marge de l'importateur ; elle paie le stock, les centrales et la mise en rayon qu'une filiale devrait payer elle-même.",
  };
  const justes = ["etapes", "dlc"];
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
    score: d === "etapes" ? 1 : d === "dlc" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes d'un comité pressé : ni l'exclusivité longue signée d'enthousiasme, ni la filiale d'emblée, ni les produits phares sans regarder la route, ni le plan tenu malgré le test, ni les cinq ans accordés pour ne pas perdre l'importateur."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : signer vite ou monter sa filiale, envoyer les desserts frais, laisser l'importateur sur-étiqueter, céder au drapeau, tenir le plan, accorder ce qu'il demande.${
            t.erreurEtiquette ? " Un lot mal étiqueté a en plus été retiré des rayons." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    MARGE_DE_L_OFFRE / 1000,
    "de marge annuelle pour l'offre de Nevaria dans le scénario moyen",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const [d1, , , , d5, d6] = p.chemin;
  const issue =
    t.accord === true
      ? " Nevaria a signé."
      : t.accord === false
        ? " Nevaria a refusé et pris les desserts de Nordal : le risque de la proposition, cette fois."
        : "";
  let etapes: Constat;
  if (d1 === 1 && d5 === 1 && (d6 === 0 || d6 === 1)) {
    etapes = {
      score: 1,
      texte: `Vous êtes entré par étapes : un test, une généralisation décidée sur la rotation de fond, une exclusivité courte qui se mérite.${
        t.generalise ? issue : " Le test était sous le seuil : vous vous êtes arrêté à temps."
      }`,
    };
  } else if (d1 === 1) {
    etapes = {
      score: 0.6,
      texte: `Vous avez testé avant de vous engager, mais ${
        d5 !== 1
          ? "la suite n'a pas été décidée sur la rotation de fond du test"
          : "le contrat n'a pas gardé la main : une exclusivité longue sans objectifs ne se quitte pas, un contrat sans exclusivité se refuse"
      }.${issue}`,
    };
  } else if (d1 === 3) {
    etapes = {
      score: 0.3,
      texte:
        "Vous n'êtes pas entré en Espagne : rien n'y a été perdu, mais rien n'y a été appris, et la crème des restaurants de Nevaria est partie chez Nordal.",
    };
  } else {
    etapes = {
      score: 0,
      texte:
        d1 === 0
          ? `Vous avez signé cinq ans d'exclusivité avant d'avoir vu un pack tourner en rayon : l'accueil du marché a été ${t.scenario}, et le contrat vous y tient jusqu'au bout.`
          : "Vous avez monté une filiale d'emblée : 200 k€ de frais fixes par an pour un chiffre d'affaires qui ne les couvre pas, face aux centrales sans relais.",
    };
  }

  return [information, diagnostic, reflexe, calibrage, etapes];
}

export function axe([information, diagnostic, reflexe, calibrage, etapes]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer l'offre avant d'y répondre",
      texte:
        "Rejouez l'épisode en lisant d'abord l'offre chiffrée et l'étude de marché : la marge par pack, les pertes, le soutien marketing et les trois accueils possibles disent ce que vaut l'exclusivité qu'on vous demande.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Entrer par étapes, pas d'enthousiasme",
      texte:
        "Un marché étranger s'ouvre avec un test limité, la gamme qui supporte la route, et une exclusivité courte conditionnée à des objectifs. L'exclusivité longue signée d'enthousiasme et la filiale montée d'emblée concentrent tout le risque sur vous.",
    };
  }
  if (etapes!.score < 0.5) {
    return {
      titre: "Garder la main sur l'engagement",
      texte:
        "Ne vous engagez pour longtemps qu'une fois le marché lu : un test qui dit la rotation de fond, une généralisation décidée sur un seuil, un contrat qui se quitte si le marché décroche et se renégocie s'il tient.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Regarder ce que le produit supporte, et qui porte le risque",
      texte:
        "La DLC choisit la gamme ; le contrat répartit la valeur et le risque entre la laiterie et l'importateur. Les deux font la décision, et l'ordre des engagements aussi.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul de la marge, pertes comprises",
      texte:
        "Les packs refusés ou démarqués ont été produits et transportés : comptez ce qu'il faut livrer pour vendre, puis retirez le soutien marketing, qui est dû quoi qu'il arrive.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);
const NOMS_DES_SCENARIOS: Record<CodeScenario, string> = {
  fort: "fort",
  moyen: "moyen",
  faible: "faible",
};

export const EPISODE_EXPORT: Episode<Trimestre> = {
  code: "export-a-ouvrir",
  numero: 106,
  domaine: "Choisir son entrée sur un marché étranger",
  titre: "Les desserts qui plaisent à l'export",
  resume:
    "Un importateur espagnol propose 600 supermarchés contre cinq ans d'exclusivité. Signer, monter une filiale, ou entrer par étapes avec la gamme qui supporte la route.",
  persona:
    "Vous êtes Corto Kerouédan, directeur export de la Laiterie de Kerbrélan, entreprise familiale de 520 salariés à Loudéac et Pontivy. L'export fait 6 % du chiffre d'affaires, en Europe proche. Au salon de Paris, un importateur espagnol a goûté vos desserts ; il vous propose l'Espagne, à ses conditions.",
  mandat: [
    { fort: `${MAGASINS}`, texte: "supermarchés espagnols proposés par Nevaria" },
    { fort: "5 ans", texte: "d'exclusivité demandés, sans objectifs" },
    { fort: "28 jours", texte: "de DLC pour les desserts frais, 120 pour les UHT" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée attendue des décisions du trimestre" },
  ],
  jugement:
    "Le comité de direction juge le trimestre sur la valeur créée : le résultat du trimestre en Espagne plus la VAN, à 9 % sur cinq ans, de la position prise, recalculée en semaine 13 avec ce que le trimestre a appris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre export en Espagne",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: 2,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du comité de vendredi se boucle avec un cabinet export payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - 2) * 2500;
      if (perdu <= 0) return null;
      return {
        ...IWAN,
        alerte: true,
        texte: `Pour tenir le comité de vendredi, j'ai fait boucler ton dossier par un cabinet export : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "la marge annuelle que l'offre de Nevaria rapporterait dans le scénario moyen, pertes et soutien marketing déduits, en milliers d'euros",
    unite: "k€",
    placeholder: "100",
    min: -300,
    max: 600,
    step: 1,
    reel: () => MARGE_DE_L_OFFRE / 1000,
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
          ? `résultat du trimestre et VAN à ${taux(TAUX, 0)} sur cinq ans, avec ce que le trimestre a appris`
          : "rien n'est encore engagé",
    },
    {
      cle: "resultat",
      nom: "Résultat du trimestre en Espagne",
      format: kE,
      sensBon: 1,
      aide: () => "marge des packs vendus, moins ce qui a été dépensé",
    },
    {
      cle: "packs",
      nom: "Packs vendus dans la semaine",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine, l) =>
        semaine && l.magasins
          ? `${nombre(l.magasins, 0)} magasins en rayon`
          : "aucun magasin en rayon",
    },
    {
      cle: "dlc",
      nom: "DLC à la réception",
      format: jours,
      sensBon: 1,
      aide: (_, l) =>
        l.dlcUsine
          ? `sur ${jours(l.dlcUsine)} ; les enseignes en exigent les deux tiers`
          : "aucun pack livré",
      jauge: (l) =>
        l.dlc != null && l.dlcUsine
          ? { part: Math.min(1, l.dlc / l.dlcUsine), enRetard: l.dlc < (2 / 3) * l.dlcUsine }
          : null,
    },
    {
      cle: "pertes",
      nom: "Pertes : refus et démarque",
      format: (v) => taux(v, 1),
      formatEcart: points,
      sensBon: -1,
      aide: () => "en part des packs livrés, à la charge de la laiterie",
    },
  ],
  contexte(l, decisions): Contexte {
    const chemin = complet(decisions);
    const e = entreeDe(chemin);
    const s: CodeScenario = l.scenario != null ? SCENARIOS[l.scenario]!.id : "moyen";
    const seuil = seuilDeGeneralisation(chemin, s);
    const rot = l.rotation ?? 0;
    const routes = chiffresDesRoutes();
    const chances = chancesDesContrats(decisions);
    const route = (x: ReturnType<typeof chiffresDesRoutes>["uht"]) => ({
      dlc: jours(x.dlc),
      pertes: taux(x.pertes, 0),
      marge: centimes(x.marge),
      semaine: centimes(x.parMagasin),
    });
    const [pl, di, uh] = [route(routes.plateforme), route(routes.direct), route(routes.uht)];
    return {
      entree: e,
      dlcPlateforme: pl.dlc,
      pertesPlateforme: pl.pertes,
      margePlateforme: pl.marge,
      semainePlateforme: pl.semaine,
      dlcDirect: di.dlc,
      pertesDirect: di.pertes,
      margeDirect: di.marge,
      semaineDirect: di.semaine,
      dlcUht: uh.dlc,
      pertesUht: uh.pertes,
      margeUht: uh.marge,
      semaineUht: uh.semaine,
      pertesPlateformeFaible: taux(routes.plateformeFaible.pertes, 0),
      magasins: nombre(l.magasins ?? 0, 0),
      packs: nombre(l.packs ?? 0, 0),
      resultat: kE(l.resultat ?? 0),
      rotation: nombre(rot, 1),
      moyenneNevaria: nombre(moyenneDuTest(rot), 1),
      seuil: nombre(seuil, 1),
      audessus: rot >= seuil,
      contratEnJeu: e === "test" && l.scenario != null && generalise(chemin, s),
      chanceTroisAns: chanceDite(chances.troisAns),
      chanceDeuxAns: chanceDite(chances.deuxAns),
      chanceSimple: chanceDite(chances.simple),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    let packs = 0;
    for (let w = de; w <= a; w += 1) packs += t.semaines[w]!.packs;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      ["Packs vendus sur la période", nombre(packs, 0)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [-600000, -400000, -200000, 0, 200000, 400000, 600000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `${nombre(s.packs!, 0)} packs vendus · résultat du trimestre ${kE(s.resultat!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.relais && choix === 1) {
      // L'agence qui recrute les VIE a un candidat prêt, ou pas, selon le hasard du trimestre.
      const h = hasard(graine);
      return [{ ...MAEWENN, texte: h.semaineVie <= 9 ? REPONSES.vieTot : REPONSES.vieTard }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.reponse && (t.entree === "decline" || t.entree === "filiale")) {
      lies.push({
        ...BAPTISTIN,
        heure: "sem. 2",
        alerte: true,
        texte: `Nevaria a signé avec Nordal pour les desserts, et ne nous commande plus de crème fraîche pour ses restaurants : ${kE(CREME)} de marge par an en moins.`,
      });
    }
    if (arrive.premiersLots) {
      const exigee = (2 / 3) * GAMMES[t.gamme].dlc;
      lies.push({
        ...YSEE,
        heure: `sem. ${t.entree === "test" ? TEST.debut : 5}`,
        alerte: t.dlc < exigee + 3,
        texte:
          t.gamme === "uht"
            ? `Premiers lots livrés : ${jours(t.dlc)} de DLC à la réception, sur 120. Aucun refus.`
            : `Premiers lots livrés : ${jours(t.dlc)} de DLC à la réception, pour ${nombre(exigee, 1)} exigés. ${
                t.dlc < exigee + 3
                  ? "Au moindre retard, les enseignes refusent : chaque lot refusé est perdu pour nous."
                  : "La marge tient, mais les packs vieillissent vite en rayon."
              }`,
      });
    }
    if (arrive.vie) {
      lies.push({
        ...SABELA,
        heure: `sem. ${h.semaineVie}`,
        texte:
          "Premier tour des magasins : des facings mal placés, deux ruptures dues à des commandes oubliées. Je vois les chefs de rayon chaque semaine, et Nevaria aussi.",
      });
    }
    if (arrive.filialeVue) {
      lies.push({
        ...TELMO,
        heure: `sem. ${TEST.lecture}`,
        alerte: true,
        texte:
          "J'apprends que vous recrutez un directeur pour Madrid. Dois-je comprendre que mes jours sont comptés ? Je ne mets pas 600 magasins à votre service pour vous les rendre dans deux ans.",
      });
    }
    if (arrive.retrait) {
      lies.push({
        ...ANNAIG,
        heure: `sem. ${h.semaineErreur}`,
        alerte: true,
        texte: `Une enseigne a relevé une erreur sur les packs sur-étiquetés : la mention du lait comme allergène manque en espagnol. Retrait des lots en rayon, ${kE(ETIQUETTE.sur.retrait)} de frais, et deux semaines sans ventes le temps de relivrer.`,
      });
    }
    if (arrive.suite) {
      const prolonge = chemin[D.suite] === 2;
      lies.push({
        ...SUIVI,
        heure: "sem. 9",
        alerte: !t.generalise,
        texte: t.generalise
          ? `Généralisation lancée : ${nombre(MAGASINS - 60, 0)} magasins à référencer${
              prolonge ? " en décembre, après trois mois de test en plus" : " pour septembre"
            }, ${kE(REFERENCEMENT * (MAGASINS - 60))} de droits.`
          : chemin[D.suite] === 3
            ? "Les desserts quittent les 60 magasins du test. Nevaria garde notre crème pour ses restaurants."
            : `Rotation de fond sous le seuil${prolonge ? ", confirmée par trois mois de test en plus" : ""} : pas de généralisation. Les desserts quittent les 60 magasins ; Nevaria garde notre crème pour ses restaurants.`,
      });
    }
    if (arrive.contrat) {
      const c = contratDe(chemin);
      lies.push({
        ...TELMO,
        heure: "sem. 12",
        alerte: t.accord === false,
        texte:
          c.id === "cinqAns" ? REPONSES.accordCinqAns : t.accord ? REPONSES.accord : REPONSES.refus,
      });
    }
    if (arrive.filiale) {
      lies.push({
        ...IWAN,
        heure: "sem. 10",
        alerte: true,
        texte:
          "La filiale a obtenu ses premiers référencements : 250 magasins Salinar, à 300 € par magasin. Mercaduero reçoit notre directeur pays en septembre. Sans relais, chaque centrale se négocie seule.",
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
      t.objectif >= 0
        ? `${kE(t.objectif)} de valeur créée, estimée en semaine 13`
        : `${kE(-t.objectif)} de valeur détruite, estimée en semaine 13`,
    formatObjectif: kE,
    noteDesBarres:
      "Valeur créée par les décisions du trimestre : le résultat du trimestre en Espagne plus la VAN, à 9 % sur cinq ans, de la position prise, recalculée avec ce que le trimestre a appris, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const vend = t.packs > 0;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Pertes",
          valeur: vend ? taux(t.pertes, 1) : "aucune vente",
          aide: vend ? "refus et démarque, en part des packs livrés" : "aucun pack livré",
          tenu: vend && t.pertes <= 0.05,
        },
        {
          nom: "Nevaria",
          valeur: t.nordal ? "passé chez Nordal" : "toujours client",
          aide: t.nordal
            ? `avec la crème de ses restaurants : ${kE(CREME)} de marge par an`
            : "la crème de ses restaurants reste chez vous",
          tenu: !t.nordal,
        },
        {
          nom: "Engagement",
          valeur: t.contrat
            ? NOMS_DES_CONTRATS[t.contrat]
            : t.entree === "filiale"
              ? "une filiale"
              : "aucun",
          aide:
            t.contrat === "cinqAns"
              ? "une exclusivité qui ne se quitte pas"
              : t.entree === "filiale"
                ? "200 k€ de frais fixes par an"
                : t.contrat
                  ? "une exclusivité qui se mérite"
                  : "aucun contrat long signé",
          tenu: t.contrat !== "cinqAns" && t.entree !== "filiale",
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${enPhrase(imprevu.titre)}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le marché espagnol",
          texte: `a fait aux desserts français un accueil ${NOMS_DES_SCENARIOS[t.scenario]} : ${nombre(
            scenario(t.scenario).rotation,
            0,
          )} packs de desserts frais par magasin et par semaine, curiosité passée${
            t.entree === "decline" ? ", sans que vous le sachiez" : ""
          }.`,
        },
        {
          titre: "Nevaria",
          texte:
            t.accord === null
              ? t.entree === "signe"
                ? "a eu son contrat de cinq ans dès avril."
                : "n'a pas eu de contrat à accepter ou à refuser ce trimestre."
              : t.contrat === "cinqAns"
                ? "a signé les cinq ans qu'il demandait."
                : t.accord
                  ? `a accepté votre proposition : ${NOMS_DES_CONTRATS[t.contrat!]}. Il aurait pu la refuser.`
                  : "a refusé votre proposition et pris les desserts de Nordal, avec la crème de ses restaurants.",
        },
        {
          titre: "L'étiquette",
          texte: t.erreurEtiquette
            ? "Le sur-étiquetage a laissé passer une erreur sur les allergènes : un lot retiré."
            : h.uEtiquette < ETIQUETTE.sur.chanceErreur
              ? "Un sur-étiquetage aurait laissé passer une erreur sur les allergènes ce trimestre."
              : "Aucune erreur d'étiquette ce trimestre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
