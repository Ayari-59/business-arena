/**
 * ÉPISODE 42 — LE CONCURRENT À RACHETER, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le tableau de bord du dossier Mourgue montre, ce que
 * la courbe trace, ce sur quoi le bilan juge Idriss, et ce que ses décisions
 * révèlent de lui.
 *
 * Un rachat se juge sur des années, l'épisode sur un trimestre : le tableau
 * de bord suit donc la VALEUR CRÉÉE ESTIMÉE pour Arvel — la valeur de Mourgue
 * pour Arvel moins ce qu'il la paie si la vente se fait, la perte de ses
 * agences voisines si Sérac l'emporte —, recalculée chaque semaine avec ce
 * que le trimestre révèle : l'audit, la réaction de Sérac, la cédante, le
 * closing, le directeur commercial.
 */
import {
  ANNONCES,
  CLIENT,
  COMPLEMENT,
  D,
  DIRECTEUR,
  DILIGENCES,
  EBE_RETRAITE,
  EFFET,
  GARANTIE,
  JOURS_SANS_PERTE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PAS,
  PASSIF,
  PERTE_CLIENT,
  PERTE_PAR_JOUR,
  PERTE_SERAC,
  PLAFOND,
  SERAC,
  STOCK_AFFICHE,
  STOCK_SURVALUE,
  SYNERGIES,
  VALEUR_SYNERGIES_COUTS,
  VE_AUTONOME,
  VE_PUBLIEE,
  EXCLUSIVITE,
  evenements,
  hasard,
  simuler,
  tableauDeBord,
  type Etat,
  type Trimestre,
} from "@/engine/episodes/concurrent-a-racheter";
import {
  ANTHELME,
  BERNADETTE,
  DIAGNOSTICS,
  ETAPES,
  FELICIEN,
  MOUNIA,
  ONDINE,
  REFERENCES,
  REFLEXES,
  REPONSES,
  ROZENN,
  SIXTINE,
  VIANNEY,
} from "@/config/episodes/concurrent-a-racheter";
import type {
  Constat,
  Contexte,
  Episode,
  Lecture,
  Message,
  PartieJouee,
} from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));

const ETATS_LUS: readonly Etat[] = ["saine", "stock", "client"];

/** Le plafond de Sérac : 5,9 fois l'EBE retraité, au plus. */
export const MAX_SERAC = SERAC.multipleMax * EBE_RETRAITE;

/** L'écart que l'audit fait apparaître sur une offre bâtie sur l'EBE publié. */
const ecartEbe = (d1: number, ebeConnu: boolean) =>
  ebeConnu && d1 === 1 ? VE_PUBLIEE - VE_AUTONOME : 0;

/**
 * Le prix plafond que la vérité de la cible justifiait : celui de la semaine
 * 1, moins ce qu'elle cachait. C'est à lui que le bilan compare le prix payé.
 */
export const plafondReel = (etat: Etat) =>
  PLAFOND - (etat === "stock" ? STOCK_SURVALUE : 0) - (etat === "client" ? PERTE_CLIENT : 0);

/** Ce que l'audit a trouvé, en une phrase par poste, tel que le cabinet l'écrit. */
export function constatsDAudit(etat: Etat, complet: boolean): string[] {
  const lignes = [
    `L'EBE retraité ressort à ${kE(EBE_RETRAITE)} : le chantier de Vizille, la rémunération de la présidente et le litige clos expliquent l'écart avec l'EBE publié.`,
    etat === "stock"
      ? `L'inventaire contradictoire trouve ${kE(STOCK_SURVALUE)} de références dormantes, sans mouvement depuis plus de deux ans, gardées au prix d'achat : le stock vaut ${kE(STOCK_AFFICHE - STOCK_SURVALUE)}, pas ${kE(STOCK_AFFICHE)}.`
      : "L'inventaire contradictoire confirme le stock du bilan.",
  ];
  if (complet) {
    lignes.push(
      etat === "client"
        ? `Bâtisseurs du Grésivaudan, 18 % du chiffre d'affaires, a lancé un appel d'offres et ne renouvellera pas son contrat-cadre en mars : ${kE(CLIENT.ebe)} d'EBE par an, ${kE(PERTE_CLIENT)} de valeur.`
        : "Les contrats clients tiennent : Bâtisseurs du Grésivaudan a renouvelé son contrat-cadre pour trois ans.",
      "Le directeur commercial a été approché par Sérac.",
    );
  } else {
    lignes.push("Les contrats clients n'étaient pas dans le périmètre de l'audit.");
  }
  return lignes;
}

/** Ce que les décisions révèlent, dans l'ordre où un directeur du développement les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les trois qui permettaient de calculer la valeur de Mourgue et le prix plafond",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    prix: "Votre diagnostic de la semaine 1 était juste : le prix maximal se calcule avant d'entrer dans la vente, sur un EBE retraité et des synergies sûres, et seul l'audit peut le faire baisser.",
    synergies:
      "En semaine 1, vous avez vu que les synergies font la valeur du rachat : c'est vrai, mais il fallait encore les trier (les synergies de revenus ne se tiennent qu'au tiers), partir de l'EBE retraité, et laisser l'audit dire ce que la cible cache.",
    course:
      "En semaine 1, vous avez vu Sérac comme le danger. Mais la cible laissée à Sérac coûte 220 k€ à Arvel ; la payer trop cher en coûte bien plus.",
    marche:
      "En semaine 1, vous avez pris le multiple du marché sur l'EBE publié ; or 200 k€ de cet EBE ne se répéteront pas, et le multiple ne dit rien de ce que Mourgue vaut pour Arvel.",
  };
  const justes = ["prix", "synergies"];
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
    score: d === "prix" ? 1 : d === "synergies" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes de l'acquéreur pressé : ni surenchérir pour écarter Sérac, ni renoncer à l'audit pour aller vite, ni défendre l'offre annoncée contre ce que l'audit avait trouvé, ni signer sans protéger ce qui restait incertain."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : surenchérir pour écarter Sérac, aller vite sans audit, défendre l'offre déjà annoncée, suivre l'enchère quel qu'en soit le prix, signer sans garantie solide.${
            t.directeurParti ? " Le directeur commercial est en plus parti avec ses clients." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    VE_AUTONOME / 1000,
    "de valeur d'entreprise pour Mourgue Matériaux, synergies non comprises",
    "k€",
    { juste: 100, proche: 400 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const dr = t.deroule;
  const juste = plafondReel(t.etat);
  let texte: string;
  let score: number;
  if (dr.achete && dr.prix > juste) {
    score = 0;
    texte = `Vous avez payé Mourgue ${kE(dr.prix)} en prix ferme, quand ce qu'elle valait pour Arvel ne justifiait pas plus de ${kE(juste)} : le prix plafond, moins ce que la cible cachait. La différence, ce sont des synergies données à la cédante, ou des problèmes payés au prix d'une entreprise saine. C'est la malédiction du vainqueur : on gagne parce qu'on a le plus surestimé la cible.`;
  } else if (dr.achete) {
    score = 1;
    texte = `Vous avez acheté Mourgue ${kE(dr.prix)} en prix ferme${
      dr.complement > 0
        ? `, plus un complément de ${kE(dr.complement)} dû seulement si l'EBE tient deux ans (${
            t.rachat!.complementVerse > 0
              ? "il tient : il sera versé"
              : "il ne tient pas : rien ne sera versé"
          })`
        : ""
    }, sans dépasser ${kE(juste)}, le prix plafond diminué de ce que la cible cachait : les synergies restent à Arvel.`;
  } else if (dr.motif === "battu") {
    score = 1;
    texte = `Sérac a payé Mourgue plus que ce qu'elle valait pour vous, et vous l'avez laissé faire : c'est lui qui porte la malédiction du vainqueur. Ses agences voisines coûteront ${kE(PERTE_SERAC)} à Arvel, bien moins qu'une surenchère.`;
  } else if (dr.motif === "retrait") {
    score = 0.6;
    texte =
      "Vous vous êtes retiré après l'audit. Mieux vaut renoncer que surpayer ; mais au bon prix, avec des garanties, ce rachat créait de la valeur.";
  } else if (dr.motif === "rupture") {
    score = 0.3;
    texte =
      "La cédante a rompu après une baisse qu'elle a prise pour un retrade : revenir sur un chiffre que les comptes montraient déjà, ou baisser sans justification, ruine la confiance. Ce que l'audit découvre se révise ; le reste se calcule avant l'offre.";
  } else {
    score = 0.3;
    texte = `Vous n'avez pas fait d'offre : Sérac a eu Mourgue sans concurrence, et vos agences voisines perdront ${kE(PERTE_SERAC)}. Ne pas surpayer ne veut pas dire ne pas acheter.`;
  }
  const prix: Constat = { score, texte };

  return [information, diagnostic, reflexe, calibrage, prix];
}

export function axe([information, diagnostic, reflexe, calibrage, prix]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Chiffrer la cible avant d'offrir",
      texte:
        "Rejouez l'épisode en ouvrant d'abord les comptes, les transactions comparables et le chiffrage des synergies : la valeur de Mourgue se calcule sur l'EBE retraité, et le prix plafond se fixe avant d'entrer dans la vente.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Ne pas payer pour gagner",
      texte:
        "Dans une vente aux enchères, le vainqueur est souvent celui qui a le plus surestimé la cible. Fixez votre prix maximal avant la négociation, faites auditer, révisez l'offre de ce que l'audit trouve, et laissez la cible au concurrent plutôt que de lui céder vos synergies.",
    };
  }
  if (prix!.score === 0) {
    return {
      titre: "Tenir le prix plafond",
      texte:
        "Le plafond, c'est la valeur de la cible seule plus les synergies sûres, moins ce que le rachat coûte. Ce qui dépasse se paie en complément conditionnel, jamais en prix ferme : perdre la cible coûte moins cher que la surpayer.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Calculer le prix avant de négocier",
      texte:
        "Un rachat se prépare en trois chiffres : la valeur de la cible seule, sur un EBE retraité ; les synergies, triées entre sûres et espérées ; le prix plafond qui s'en déduit. Le marché et le concurrent n'entrent pas dans ce calcul.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Retraiter l'EBE avant d'appliquer le multiple",
      texte:
        "Retirez ce qui ne se répétera pas (un chantier exceptionnel), ajoutez ce qui manque aux comptes d'une entreprise familiale (une rémunération de dirigeant au prix du marché), réintégrez les charges non récurrentes. Puis appliquez le multiple : on obtient une valeur d'entreprise, dette non déduite.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

/** Ce que les messages et les sources lisent de la situation. */
function contexte(l: Lecture, decisions: readonly number[]): Contexte {
  const d1 = decisions[D.offre] ?? NEUTRE[D.offre];
  const d2 = decisions[D.diligence];
  const diligence = d2 === undefined ? "" : DILIGENCES[d2]!;
  const etat = ETATS_LUS[l.etat ?? 0]!;
  const offre = l.offre ?? 0;
  const plafond = l.plafond ?? PLAFOND;
  const prix = l.prix ?? 0;
  const ebeConnu = l.ebeConnu === 1;
  const audit = l.stockConnu === 1;
  const ecart = ecartEbe(d1, ebeConnu);
  const risques = l.risques ?? 0;
  const annonce = l.annonceSerac ?? 0;
  const exclusif = d2 === 2;
  const serac = l.seracRetire ? (exclusif ? "exclu" : "retrait") : annonce ? "surenchere" : "";
  const besoin = annonce + PAS - plafond;
  const complement = Math.round(besoin / COMPLEMENT.decote / 10000) * 10000;
  const complementPourEgaler =
    serac !== "surenchere"
      ? "Personne ne surenchérit : un geste ne nous achèterait rien."
      : besoin <= 0
        ? `L'offre de Sérac, ${kE(annonce)}, reste sous notre plafond : la suivre ne nous fait rien payer de plus que ce que Mourgue vaut pour nous.`
        : `Pour passer devant l'offre de Sérac, ${kE(annonce)}, en restant à notre plafond en prix ferme, il faudrait un complément de prix de ${kE(complement)} : la cédante le compte pour ${taux(COMPLEMENT.decote, 0)} de son montant, et nous ne le verserions que si l'EBE tient deux ans.`;
  const lignes = audit ? constatsDAudit(etat, diligence === "complete") : [];
  return {
    enLice: l.enLice === 1,
    achete: l.achete === 1,
    offre: kE(offre),
    plafond: kE(plafond),
    indicativeSerac: kE(l.indicativeSerac ?? 0),
    exclusiviteDemande:
      offre >= EXCLUSIVITE
        ? `confirmez votre offre de ${kE(offre)}`
        : `portez votre offre à ${kE(EXCLUSIVITE)}`,
    surcoutExclusivite:
      offre >= EXCLUSIVITE
        ? "Notre offre ne bouge pas"
        : `${kE(EXCLUSIVITE - offre)} de plus sur une affaire de cette taille, c'est une broutille`,
    diligence,
    audit,
    risquesTrouves: risques > 0 || ecart > 0,
    auditResume:
      risques > 0
        ? `Nous avons trouvé ${kE(risques)} de risques chiffrés que les comptes ne montraient pas.`
        : "Rien de ce que nous avons audité ne s'écarte des comptes, une fois l'EBE retraité.",
    auditDetail: lignes.join(" "),
    offreRevisee: kE(offre - ecart - risques),
    plafondRevise: kE(plafond - ecart - risques),
    exclusif,
    serac,
    annonceSerac: kE(annonce),
    complementPourEgaler,
    perteSerac: kE(PERTE_SERAC),
    maxSerac: kE(MAX_SERAC),
    stockSerac:
      audit && etat === "stock"
        ? `, moins les ${kE(STOCK_SURVALUE)} de stock dormant qu'il aura trouvés comme nous`
        : "",
    prix: kE(prix),
    garantieCedante: kE(GARANTIE.cedante.plafond * prix),
    sequestre: kE(GARANTIE.arvel.sequestre * prix),
  };
}

/** Le message de clôture sur ce que la cible cachait, et ce que les garanties en rendent. */
function messagesDuClosing(chemin: readonly number[], t: Trimestre): Message[] {
  const dr = t.deroule;
  const sortie: Message[] = [];
  const heure = `sem. ${ANNONCES.closing}`;
  if (t.etat === "stock" && !dr.stockConnu) {
    sortie.push({
      ...MOUNIA,
      heure,
      alerte: true,
      texte: `L'inventaire de clôture trouve ${kE(STOCK_SURVALUE)} de références dormantes gardées au prix d'achat. La garantie de passif ne les couvre pas : c'était au prix de les compter.`,
    });
  }
  if (t.etat === "client" && !dr.clientConnu) {
    sortie.push({
      ...ANTHELME,
      heure,
      alerte: true,
      texte: `Bâtisseurs du Grésivaudan ne renouvelle pas son contrat-cadre : ils ont choisi un négoce de Chambéry sur appel d'offres. C'est 18 % du chiffre d'affaires, ${kE(CLIENT.ebe)} d'EBE par an.`,
    });
  }
  const recupere = t.rachat?.recupere ?? 0;
  const d5 = chemin[D.garantie];
  sortie.push({
    ...ONDINE,
    heure,
    alerte: t.passif && recupere < PASSIF.montant * 0.9,
    texte: !t.passif
      ? "Le contrôle URSSAF est clos sans redressement."
      : d5 === 2
        ? `L'URSSAF notifie un redressement de ${kE(PASSIF.montant)}. Sans garantie, il est pour nous.`
        : recupere > 0
          ? `L'URSSAF notifie un redressement de ${kE(PASSIF.montant)}. La garantie en couvre ${kE(recupere)}${
              d5 === 1 ? ", pris sur le séquestre" : ""
            }.`
          : `L'URSSAF notifie un redressement de ${kE(PASSIF.montant)}. Mme Mourgue a déjà distribué le prix à ses enfants : il faudra plaider, sans grand espoir.`,
  });
  return sortie;
}

export const EPISODE_RACHAT: Episode<Trimestre> = {
  code: "concurrent-a-racheter",
  numero: 42,
  domaine: "Croissance externe",
  titre: "Le concurrent à racheter",
  resume:
    "Un négoce familial de quatre agences est à vendre, et un concurrent adossé à un fonds le convoite. Calculer son prix avant de négocier, faire auditer, et ne pas payer pour gagner.",
  persona:
    "Vous êtes Idriss Zerrouki, directeur du développement d'Arvel Distribution : une trentaine d'agences en Auvergne-Rhône-Alpes, le siège à Lyon. Mourgue Matériaux, quatre agences en Isère, est à vendre ; Sérac Matériaux, un groupe adossé à un fonds, est sur les rangs. Vous conduisez le dossier, et le comité de direction vous suit.",
  mandat: [
    {
      fort: "4 agences",
      texte: "Voiron, Crolles, Vizille et La Mure, 21,5 M€ de chiffre d'affaires",
    },
    { fort: kE(1500000), texte: "d'EBE au dernier exercice, tel que les comptes le présentent" },
    { fort: "13 semaines", texte: "de l'offre indicative au closing" },
    {
      fort: kE(OBJECTIF_VALEUR),
      texte: "de valeur créée au moins, attendus par le comité de direction",
    },
  ],
  jugement:
    "Le comité de direction juge le dossier sur la valeur créée pour Arvel, estimée en semaine 13 : ce que Mourgue vaut pour Arvel moins ce que vous l'avez payée si vous l'achetez, ce que perdent vos agences voisines si Sérac l'emporte, frais d'audit compris.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Le dossier Mourgue",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la lettre d'offre se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...ROZENN,
        alerte: true,
        texte: `Pour tenir la date des offres indicatives, j'ai fait boucler la lettre par un cabinet : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "la valeur d'entreprise de Mourgue Matériaux, synergies non comprises, en milliers d'euros",
    unite: "k€",
    placeholder: "7000",
    min: 0,
    max: 20000,
    step: 10,
    reel: () => VE_AUTONOME / 1000,
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
        semaine ? "pour Arvel, avec ce que le trimestre a révélé" : "rien n'est encore engagé",
    },
    {
      cle: "offre",
      nom: "Offre d'Arvel",
      format: (v) => (v ? kE(v) : "aucune"),
      sensBon: -1,
      aide: (_, l) =>
        l.achete
          ? `prix signé ; plafond ${kE(l.plafond ?? PLAFOND)}`
          : l.enLice
            ? `valeur d'entreprise ; plafond ${kE(l.plafond ?? PLAFOND)}`
            : "hors de la vente",
      jauge: (l) =>
        l.offre
          ? {
              part: Math.min(1, (l.offre ?? 0) / (l.plafond || PLAFOND)),
              enRetard: (l.offre ?? 0) > (l.plafond || PLAFOND),
            }
          : null,
    },
    {
      cle: "serac",
      nom: "Offre de Sérac",
      format: (v) => (v ? kE(v) : "retiré"),
      sensBon: -1,
      aide: (_, l) =>
        l.seracRetire
          ? "Sérac n'est plus dans la vente"
          : "la dernière connue, en valeur d'entreprise",
    },
    {
      cle: "risques",
      nom: "Risques chiffrés",
      format: kE,
      sensBon: -1,
      aide: (semaine) =>
        semaine >= ANNONCES.audit ? "ce que l'audit a trouvé hors des comptes" : "rien d'audité",
    },
    {
      cle: "frais",
      nom: "Frais d'audit",
      format: kE,
      sensBon: -1,
      aide: () => "engagés, que la vente se fasse ou non",
    },
  ],
  contexte,
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [
        s.achete ? `Prix signé, sem. ${a}` : `Offre d'Arvel, sem. ${a}`,
        s.offre ? kE(s.offre) : "hors de la vente",
      ],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [100000, 250000, 500000, 750000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `offre d'Arvel ${s.offre ? kE(s.offre) : "aucune"} · Sérac ${s.serac ? kE(s.serac) : "retiré"}`,
    ],
  },
  reactions(etape, choix, graine) {
    const h = hasard(graine);
    if (etape === D.garantie && choix === 1) {
      return [
        {
          ...ONDINE,
          texte:
            h.uSequestre < GARANTIE.arvel.chance
              ? REPONSES.sequestreAccepte
              : REPONSES.sequestreCher,
        },
      ];
    }
    if (etape === D.directeur && choix === 3) {
      return [
        {
          ...BERNADETTE,
          texte:
            h.uBaisse < DIRECTEUR.chanceBaisse ? REPONSES.baisseAcceptee : REPONSES.baisseRefusee,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const dr = t.deroule;
    const lies: Message[] = [];
    if (arrive.exclusivite) {
      lies.push({
        ...FELICIEN,
        heure: `sem. ${EFFET[D.diligence]}`,
        texte: `Le protocole d'exclusivité est signé, à ${kE(Math.max(dr.offre, EXCLUSIVITE))}. Sérac est informé que le processus est suspendu.`,
      });
    }
    if (arrive.audit) {
      lies.push({
        ...SIXTINE,
        heure: `sem. ${ANNONCES.audit}`,
        alerte: dr.risques > 0,
        texte: constatsDAudit(t.etat, dr.diligence === "complete").join(" "),
      });
    }
    if (arrive.reponse) {
      lies.push({
        ...FELICIEN,
        heure: `sem. ${ANNONCES.rupture}`,
        alerte: dr.motif === "rupture" || dr.motif === "retrait",
        texte:
          dr.motif === "rupture"
            ? "Mme Mourgue prend très mal votre baisse : « Ils avaient mes comptes depuis le premier jour. » Elle met fin aux discussions avec Arvel et poursuit avec Sérac."
            : dr.motif === "retrait"
              ? "Nous prenons acte de votre retrait. Mme Mourgue poursuit avec Sérac."
              : dr.diligence === "exclusivite"
                ? `Offre ferme reçue : ${kE(dr.offreFerme)}. Je prépare le protocole avec Mme Mourgue.`
                : `Offre ferme reçue : ${kE(dr.offreFerme)}. Je la transmets à Mme Mourgue, et Sérac en sera informé.`,
      });
    }
    if (arrive.serac && dr.serac !== "exclu" && dr.motif !== "retrait") {
      lies.push({
        ...FELICIEN,
        heure: `sem. ${ANNONCES.serac}`,
        alerte: dr.serac === "surenchere",
        texte:
          dr.serac === "surenchere"
            ? `Sérac surenchérit : ${kE(dr.annonceSerac ?? 0)}, et dit que c'est son offre finale.`
            : "Sérac se retire : votre offre est au-dessus de ce que son fonds accepte de payer.",
      });
    }
    if (arrive.protocole && dr.achete) {
      lies.push({
        ...FELICIEN,
        heure: `sem. ${ANNONCES.protocole}`,
        texte: `Protocole d'accord signé : Mourgue Matériaux à Arvel pour ${kE(dr.prix)} de valeur d'entreprise${
          dr.complement > 0
            ? `, plus un complément de prix de ${kE(dr.complement)} si l'EBE tient deux ans`
            : ""
        }. Closing en semaine ${ANNONCES.closing}.`,
      });
    }
    if (arrive.seracAchete) {
      lies.push({
        ...VIANNEY,
        heure: `sem. ${ANNONCES.protocole}`,
        alerte: true,
        texte:
          dr.motif === "battu"
            ? `Sérac signe le rachat de Mourgue, à ${kE(dr.plafondSerac)} : plus que notre plafond. Il va falloir défendre Grenoble-Sud et Moirans.`
            : "Sérac signe le rachat de Mourgue. Il va falloir défendre Grenoble-Sud et Moirans.",
      });
    }
    if (arrive.achats) {
      lies.push({
        ...MOUNIA,
        heure: `sem. ${ANNONCES.achats}`,
        alerte: t.realisation < SYNERGIES.realisationCouts,
        texte: `Les fournisseurs de Mourgue ont répondu : nous tiendrons ${taux(t.realisation, 0)} des synergies de coûts, soit ${kE(VALEUR_SYNERGIES_COUTS * t.realisation)} de valeur.`,
      });
    }
    if (arrive.closing) lies.push(...messagesDuClosing(chemin, t));
    if (arrive.directeur) {
      lies.push({
        ...ANTHELME,
        heure: `sem. ${ANNONCES.directeur}`,
        alerte: t.directeurParti,
        texte: t.directeurParti
          ? "Monsieur Zerrouki, j'ai accepté l'offre de Sérac. Je pars à la fin de mon préavis. Je suis désolé."
          : "Je reste. On a du travail : les artisans de Voiron attendent l'outillage d'Arvel.",
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
      "Valeur créée pour Arvel : ce que Mourgue vaut pour Arvel moins ce qu'il l'a payée, ou la perte de ses agences si Sérac l'emporte, frais d'audit compris, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const dr = t.deroule;
      const r = t.rachat;
      const total = dr.prix + (r?.complementVerse ?? 0);
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Prix payé",
          valeur: dr.achete ? kE(total) : "pas de rachat",
          aide: dr.achete
            ? `${r!.complementVerse > 0 ? `dont ${kE(r!.complementVerse)} de complément ; ` : ""}plafond ${kE(plafondReel(t.etat))} en prix ferme, ce que cachait la cible déduit`
            : "Mourgue est chez Sérac",
          tenu: dr.achete && dr.prix <= plafondReel(t.etat),
        },
        {
          nom: "Passif URSSAF",
          valeur: !dr.achete
            ? "sans objet"
            : t.passif
              ? `${kE(r!.recupere)} récupérés`
              : "pas de redressement",
          aide: dr.achete
            ? t.passif
              ? `sur ${kE(PASSIF.montant)} de redressement`
              : "le contrôle est clos"
            : "aucun rachat",
          tenu: dr.achete && (!t.passif || r!.recupere >= PASSIF.montant * 0.9),
        },
        {
          nom: "Directeur commercial",
          valeur: dr.achete ? (t.directeurParti ? "parti chez Sérac" : "resté") : "—",
          aide: dr.achete ? "et ses clients avec lui" : "aucun rachat",
          tenu: dr.achete && !t.directeurParti,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const dr = t.deroule;
      const cible =
        t.etat === "stock"
          ? `cachait ${kE(STOCK_SURVALUE)} de stock dormant gardé au prix d'achat : une cible sur trois.`
          : t.etat === "client"
            ? `cachait le départ de Bâtisseurs du Grésivaudan, 18 % du chiffre d'affaires, ${kE(PERTE_CLIENT)} de valeur : une cible sur quatre.`
            : "ne cachait rien que l'EBE retraité ne dise : quatre fois sur dix.";
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.charAt(0).toLowerCase()}${imprevu.titre.slice(1)}`,
          texte: imprevu.texte,
        })),
        { titre: "Mourgue", texte: cible },
        {
          titre: "Sérac",
          texte: `ne serait pas allé au-delà de ${kE(dr.plafondSerac)}, soit ${nombre(
            h.multipleSerac,
            1,
          )} fois l'EBE retraité${t.etat === "stock" ? ", moins le stock dormant qu'il avait trouvé" : ""}.${
            dr.serac === "surenchere"
              ? " Il a surenchéri."
              : dr.serac === "retrait"
                ? " Votre offre ferme l'a fait se retirer."
                : ""
          }`,
        },
        {
          titre: "Le contrôle URSSAF",
          texte: t.passif
            ? `s'est conclu par un redressement de ${kE(PASSIF.montant)}, quatre fois sur dix.`
            : "s'est clos sans redressement, six fois sur dix.",
        },
        {
          titre: "Anthelme Rostaing",
          texte: dr.achete
            ? t.directeurParti
              ? "est parti chez Sérac avec une partie de ses clients."
              : "est resté."
            : "a suivi la vente depuis Mourgue.",
        },
      ];
    },
  },
  comportements,
  axe,
};
