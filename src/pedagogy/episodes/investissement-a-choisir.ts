/**
 * ÉPISODE 37 — L'INVESTISSEMENT À CHOISIR, tel que l'interface et le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le suivi des investissements de Myriam montre, ce
 * que la courbe trace, ce sur quoi le bilan la juge, et ce que ses décisions
 * révèlent d'elle.
 *
 * La valeur d'un investissement se joue sur des années, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, la VAN
 * de tout ce que les décisions ont engagé, recalculée chaque semaine avec ce
 * que le trimestre apprend. Elle bouge quand on décide, et quand le
 * trimestre révèle : surcoût, retard, cadence, volumes, rattachement.
 */
import {
  ANNONCES,
  CADENCE_DEPART,
  CLAUSE,
  D,
  ENVELOPPE,
  FLUX_DU_DOSSIER,
  JOURS_SANS_PERTE,
  MISE_EN_SERVICE,
  NEUTRE,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  RATTACHEMENT,
  STOCKEUR,
  TARIF,
  TAUX,
  WMS,
  evenements,
  garantieAcceptee,
  hasard,
  offreDeReprise,
  sensibiliteExtension,
  simuler,
  tableauDeBord,
  valeurExtension,
  van,
  type GrandProjet,
  type Trimestre,
} from "@/engine/episodes/investissement-a-choisir";
import {
  DIAGNOSTICS,
  ETAPES,
  REFERENCES,
  REFLEXES,
  REPONSES,
} from "@/config/episodes/investissement-a-choisir";
import type { Constat, Contexte, Episode, Message, PartieJouee } from "@/config/episodes/types";
import { euros, kE, nombre, taux } from "@/config/episodes/format";
import { constatCalibrage, constatInformation } from "./bilan";

/** Un montant signé : « +54 k€ », « −90 k€ ». */
const kES = (v: number) => (Math.round(v / 1000) > 0 ? `+${kE(v)}` : kE(v));
const semaines = (v: number) => `${nombre(v, 0)} sem.`;

const SEGOLENE = { de: "Ségolène Marchais", role: "Directrice financière du groupe" } as const;
const ACHATS = { de: "Service achats", role: "Siège" } as const;
const GAELLE = { de: "Gaëlle Robineau", role: "Responsable technique du site" } as const;
const SANDRO = { de: "Sandro Pinheiro", role: "Chef d'équipe préparation" } as const;
const AIME = { de: "Aimé Margerie", role: "Ingénieur, bureau de contrôle" } as const;
const RAMON = {
  de: "Ramón Arrieta",
  role: "Négociant en matériel de stockage d'occasion",
} as const;
const FOURNISSEURS = {
  stockeur: { de: "Simon Cazenave", role: "Ingénieur commercial, fabricant du stockeur" },
  wms: { de: "Priya Ramanathan", role: "Cheffe de projet, éditeur du WMS" },
} as const;

/** La VAN du stockeur au dossier, au taux du groupe : ce que la prévision de la semaine 1 demande. */
export const VAN_DU_STOCKEUR = van(FLUX_DU_DOSSIER.stockeur, TAUX);

const projetDe = (decisions: readonly number[]): GrandProjet | null => {
  const d = decisions[D.portefeuille] ?? NEUTRE[D.portefeuille];
  return d === 0 ? WMS : d === 3 ? null : STOCKEUR;
};

/**
 * LES CHIFFRES QUE L'ANALYSTE MONTRE, aux hypothèses du dossier : ce que
 * vaut l'extension selon que le groupe rattache ou non les agences du
 * Nord-Isère, achetée en semaine 3, en semaine 9, ou une fois le
 * rattachement confirmé.
 */
export function chiffresDeLExtension(p: GrandProjet, clause: boolean, taux = TAUX) {
  const delai = clause ? CLAUSE.delai : TARIF.delai;
  const aLaSignature = sensibiliteExtension(
    p,
    { prix: p.extension.prix, commande: 0, delai: 0 },
    taux,
  );
  const maintenant = sensibiliteExtension(
    p,
    { prix: p.extension.prix, commande: TARIF.finDuPrix, delai },
    taux,
  );
  const attenteOui = valeurExtension(
    p,
    { taux, niveau: 1, cadence: 1, rattachement: true },
    {
      prix: clause ? p.extension.prix : p.extension.prix * (1 + TARIF.hausse),
      commande: RATTACHEMENT.semaine,
      delai,
    },
  );
  const seconde = sensibiliteExtension(
    p,
    { prix: p.extension.prix, commande: TARIF.finDuPrix, delai, rang: 2 },
    taux,
  );
  return {
    aLaSignature,
    maintenant,
    attente: { siOui: attenteOui, esperance: RATTACHEMENT.chance * attenteOui },
    seconde,
  };
}

/** Ce que les décisions révèlent, dans l'ordre où une directrice de site les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, les deux qui permettaient de calculer et de comparer les VAN",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    van: "Votre diagnostic de la semaine 1 était juste : des projets de tailles et de durées différentes se comparent à la VAN, au taux du groupe, dans la limite de l'enveloppe.",
    enveloppe:
      "En semaine 1, vous avez vu le rationnement : une vraie contrainte, mais pas un critère. Faire tenir le plus de projets dans l'enveloppe n'est pas en tirer le plus de valeur.",
    delai:
      "En semaine 1, vous avez retenu le délai de récupération ; il ignore tout ce qui vient après, et le stockeur rapporte encore quatre ans une fois remboursé.",
    tri: "En semaine 1, vous avez retenu le TRI ; un pourcentage ne dit pas combien d'euros un projet crée. Le stockeur, au TRI le plus faible, en crée le plus.",
  };
  const justes = ["van", "enveloppe"];
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
    score: d === "van" ? 1 : d === "enveloppe" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes de l'investisseur pressé : ni classer au TRI ou au délai de récupération, ni croire le fournisseur sur parole, ni poursuivre pour ne pas perdre ce qui est dépensé, ni oublier ce qui se paie plus tard."
        : `Vous avez choisi ${n} fois sur ${ETAPES.length} le réflexe qui rassure : classer au TRI ou au délai de récupération, prendre les prévisions du fournisseur pour argent comptant, poursuivre parce que l'argent est déjà dépensé, oublier ce qui se paie plus tard.${
            t.renfort ? " Le bureau de contrôle a en plus exigé un renfort de la mezzanine." : ""
          }`,
  };

  const calibrage = constatCalibrage(
    p,
    VAN_DU_STOCKEUR / 1000,
    "de VAN pour le stockeur, au taux du groupe",
    "k€",
    { juste: 5, proche: 15 },
    (e) => `${nombre(e, 0)} k€`,
  );

  const d2 = p.chemin[D.fournisseur];
  const d5 = p.chemin[D.extension];
  const issue = t.rattachement
    ? "Le groupe a rattaché les agences du Nord-Isère"
    : "Le groupe a renoncé au rattachement";
  let texte: string;
  if (d2 === 0) {
    texte = `Vous avez acheté la version étendue sur la foi des prévisions du fournisseur : elle ne servait que si le groupe rattachait les agences du Nord-Isère, quatre fois sur dix. ${
      t.rattachement
        ? "Il l'a fait : cette fois, le pari a payé ; il aurait perdu six fois sur dix."
        : "Il ne l'a pas fait : la capacité restera vide."
    }`;
  } else if (d5 === 1) {
    texte = `Vous avez commandé l'extension avant la décision du groupe, sur sa seule probabilité. ${issue}.`;
  } else if (d2 === 2 && d5 === 2) {
    texte = `Vous avez gardé le droit d'étendre sans l'obligation : une clause à ${euros(CLAUSE.prix)}, puis la commande seulement si le rattachement était confirmé. ${issue}${
      t.rattachement
        ? " : l'extension arrive à temps, au prix bloqué."
        : " : vous n'avez rien dépensé pour une capacité inutile."
    }`;
  } else if (d5 === 2) {
    texte =
      "Vous avez attendu la décision du groupe avant de commander l'extension, sans vous garantir ni le prix ni le délai : si elle sert, elle coûte plus cher et arrive plus tard.";
  } else {
    texte =
      "Vous avez renoncé à l'extension : pas de pari perdu, mais rien de prêt si le rattachement se fait.";
  }
  const option: Constat = {
    score: d2 === 0 || d5 === 1 ? 0 : d2 === 2 && d5 === 2 ? 1 : 0.6,
    texte,
  };

  return [information, diagnostic, reflexe, calibrage, option];
}

export function axe([information, diagnostic, reflexe, calibrage, option]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Refaire le calcul avant de classer",
      texte:
        "Rejouez l'épisode en mettant d'abord les trois dossiers au même format, avec la note de la direction financière : le stockeur n'avait pas de VAN, et c'est elle qui départage les projets.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Juger en euros, pas en pourcentage ni en années",
      texte:
        "Le TRI et le délai de récupération rassurent, mais ne disent pas combien un projet crée. Comparez des VAN au taux du groupe, flux à venir seulement, valeur résiduelle, stock récupéré et dépenses différées compris.",
    };
  }
  if (option!.score === 0) {
    return {
      titre: "Garder le choix plutôt que parier",
      texte:
        "Quand une dépense ne sert que si un événement incertain arrive, payez le droit de la faire plus tard, et décidez quand vous saurez. Les prévisions d'un fournisseur sont un argument de vente, pas une hypothèse de calcul.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Comparer des projets à la VAN",
      texte:
        "Des projets de tailles et de durées différentes ne se classent ni au TRI ni au délai de récupération : seule la VAN dit ce que chacun crée, et l'enveloppe se remplit avec la combinaison qui en crée le plus.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire vos calculs de VAN",
      texte:
        "Posez les flux année par année : l'investissement et le stock au départ, la valeur résiduelle et le stock récupéré la dernière année. C'est là que se glissent les écarts.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre aléa avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);

export const EPISODE_INVESTISSEMENT: Episode<Trimestre> = {
  code: "investissement-a-choisir",
  numero: 37,
  domaine: "Choix d'investissement",
  titre: "L'investissement à choisir",
  resume:
    "Une enveloppe de 700 k€, trois projets qui ne tiennent pas ensemble, une mezzanine inachevée et un fournisseur pressant. Juger à la VAN, et ne payer que ce qui sert.",
  persona:
    "Vous êtes Myriam Duchemin, directrice de la plateforme logistique d'Arvel Distribution à Saint-Quentin-Fallavier : 32 000 m², 85 personnes, les commandes des agences de la région préparées chaque nuit. Le groupe vous confie 700 k€ d'investissements pour l'an prochain, et trois dossiers se les disputent.",
  mandat: [
    { fort: kE(ENVELOPPE), texte: "d'investissements pour l'an prochain, stock non compris" },
    { fort: taux(TAUX, 0), texte: "le taux d'actualisation du groupe" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
    { fort: `semaine ${MISE_EN_SERVICE}`, texte: "la mise en service prévue des projets retenus" },
  ],
  jugement:
    "Votre direction juge le trimestre sur la valeur créée : la VAN, au taux du groupe, de tout ce que vos décisions ont engagé, recalculée en semaine 13 avec ce que le trimestre a appris, dépenses perdues comprises.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Vos investissements",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, le dossier du comité se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...SEGOLENE,
        alerte: true,
        texte: `Pour tenir le délai du comité, j'ai fait boucler ton dossier par le cabinet du groupe : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle: "la VAN du stockeur automatique au taux de 8 %, en milliers d'euros",
    unite: "k€",
    placeholder: "100",
    min: -500,
    max: 1000,
    step: 1,
    reel: () => VAN_DU_STOCKEUR / 1000,
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
        semaine
          ? `VAN à ${taux(l.taux ?? TAUX, 0)}, avec ce que le trimestre a appris`
          : "rien n'est encore engagé",
    },
    {
      cle: "engage",
      nom: "Enveloppe engagée",
      format: kE,
      sensBon: -1,
      aide: (_, l) => `sur ${kE(l.enveloppe ?? ENVELOPPE)} pour l'an prochain`,
      jauge: (l) => ({
        part: Math.min(1, (l.engage ?? 0) / (l.enveloppe ?? ENVELOPPE)),
        enRetard: (l.engage ?? 0) > (l.enveloppe ?? ENVELOPPE),
      }),
    },
    {
      cle: "volumes",
      nom: "Petites lignes par jour",
      format: (v) => nombre(v, 0),
      sensBon: 1,
      aide: (semaine) =>
        semaine ? `semaine ${semaine} ; dossier : 1 150` : "moyenne de l'année : 1 150",
    },
    {
      cle: "cadence",
      nom: "Cadence de préparation",
      format: (v) => `${nombre(v, 0)} lignes/h`,
      sensBon: 1,
      aide: () => `petites pièces ; ${CADENCE_DEPART} avant tout projet`,
    },
    {
      cle: "retard",
      nom: "Retard de mise en service",
      format: semaines,
      sensBon: -1,
      aide: () => `mise en service prévue en semaine ${MISE_EN_SERVICE}`,
    },
  ],
  contexte(l, decisions): Contexte {
    const p = projetDe(decisions);
    const fournisseur = FOURNISSEURS[p?.id ?? "stockeur"];
    const clause = decisions[D.fournisseur] === 2;
    const c = p ? chiffresDeLExtension(p, clause, l.taux ?? TAUX) : null;
    const m = p ?? STOCKEUR;
    return {
      grand: p?.id ?? "",
      fournisseur: fournisseur.de,
      roleFournisseur: fournisseur.role,
      stockeur: p === STOCKEUR,
      chariots: decisions[D.portefeuille] === 0 || decisions[D.portefeuille] === 1,
      etendue: decisions[D.fournisseur] === 0,
      clause,
      valeur: kE(l.valeur ?? 0),
      engage: kE(l.engage ?? 0),
      enveloppe: kE(l.enveloppe ?? ENVELOPPE),
      taux: taux(l.taux ?? TAUX, 0),
      surcout: kE(l.surcout ?? 0),
      miseEnService: l.miseEnService ?? MISE_EN_SERVICE,
      heures: nombre(l.heures ?? 0, 0),
      extOui: c ? kE(c.aLaSignature.siOui) : "",
      extNon: c ? kE(-c.aLaSignature.siNon) : "",
      extEsperance: c ? kES(c.aLaSignature.esperance) : "",
      maintenantOui: c ? kES(c.maintenant.siOui) : "",
      maintenantNon: c ? kES(c.maintenant.siNon) : "",
      maintenantEsperance: c ? kES(c.maintenant.esperance) : "",
      attenteOui: c ? kES(c.attente.siOui) : "",
      attenteEsperance: c ? kES(c.attente.esperance) : "",
      secondeExtension: c ? kES(c.seconde.esperance) : "",
      contratAnnuel: kE(m.maintenance),
      contratPrepaye: kE(m.contrat.prepaye),
      contratCinqAns: kE(5 * m.maintenance),
      contratEconomie: kE(5 * m.maintenance - m.contrat.prepaye),
      contratPanne: kE(m.contrat.panne),
    };
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Enveloppe engagée, sem. ${a}`, `${kE(s.engage)} sur ${kE(s.enveloppe)}`],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [100000, 200000, 300000, 400000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `engagé ${kE(s.engage!)} sur ${kE(s.enveloppe!)} · ${nombre(s.volumes!, 0)} petites lignes/jour`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.fournisseur && choix === 1) {
      // Le fournisseur répond à la demande de garantie selon le hasard du trimestre.
      return [
        {
          ...ACHATS,
          texte: garantieAcceptee(graine) ? REPONSES.garantieAcceptee : REPONSES.garantieRefusee,
        },
      ];
    }
    if (etape === D.mezzanine && choix === 2) {
      return [
        {
          ...RAMON,
          texte: offreDeReprise(graine) > 30000 ? REPONSES.offreHaute : REPONSES.offreBasse,
        },
      ];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const p = t.grand;
    const lies: Message[] = [];
    if (p && arrive.surcout) {
      const qui = p === STOCKEUR ? GAELLE : FOURNISSEURS.wms;
      const cause =
        p === STOCKEUR
          ? "Le sondage de la dalle sous les tours est mauvais : il faut la renforcer"
          : "L'interface avec l'ERP du groupe demande plus de travail que prévu";
      lies.push({
        ...qui,
        heure: `sem. ${ANNONCES.surcout}`,
        alerte: t.surcout >= 1000,
        texte:
          t.surcout >= 1000
            ? `${cause}, ${kE(t.surcout)} de plus.`
            : "Le chantier tient son budget : aucun surcoût à ce stade.",
      });
    }
    if (p && arrive.retard) {
      lies.push({
        ...FOURNISSEURS[p.id],
        heure: `sem. ${ANNONCES.retard}`,
        alerte: h.retard > 0,
        texte:
          h.retard > 0
            ? `Notre installation prend ${h.retard} semaine${h.retard > 1 ? "s" : ""} de retard : mise en service en semaine ${MISE_EN_SERVICE + t.semaines[ANNONCES.retard]!.retard}. Chaque semaine de retard, ce sont des gains qui n'arrivent pas.`
            : `Notre installation tient son planning : mise en service en semaine ${MISE_EN_SERVICE + t.semaines[ANNONCES.retard]!.retard}${
                t.semaines[ANNONCES.retard]!.retard > 0 ? ", avec le retard des interfaces" : ""
              }.`,
      });
    }
    if (arrive.renfort) {
      lies.push({
        ...AIME,
        heure: `sem. ${ANNONCES.retard}`,
        alerte: t.renfort,
        texte: t.renfort ? REPONSES.renfort : REPONSES.pasDeRenfort,
      });
    }
    if (p && arrive.essais) {
      const indemnites = t.garantie && t.cadence < 0.95;
      lies.push({
        ...SANDRO,
        heure: `sem. ${MISE_EN_SERVICE}`,
        alerte: t.cadence < 0.95,
        texte: `Essais de cadence : ${nombre(p.cadence * t.cadence, 0)} lignes à l'heure, pour ${p.cadence} au dossier.${
          indemnites
            ? " La garantie joue : le fournisseur versera des indemnités pendant trois ans."
            : ""
        }`,
      });
    }
    if (p && arrive.rattachement && chemin[D.extension] === 2 && chemin[D.fournisseur] !== 0) {
      lies.push({
        ...ACHATS,
        heure: `sem. ${RATTACHEMENT.semaine}`,
        texte: t.rattachement ? REPONSES.extensionCommandee : REPONSES.pasDExtension,
      });
    }
    if (p && arrive.panne) {
      const couvert = chemin[D.maintenance] !== 1;
      lies.push({
        ...SANDRO,
        heure: `sem. ${h.semainePanne}`,
        alerte: !couvert,
        texte: couvert
          ? `Panne de jeunesse sur ${p.nom} lundi : le technicien du contrat est venu dans la journée, rien à payer.`
          : `Panne de jeunesse sur ${p.nom} : ${kE(p.contrat.panne)} d'intervention au tarif horaire, et une semaine de préparation à la main.`,
      });
    }
    const imprevus = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.rattachement) {
      imprevus.push({
        ...SEGOLENE,
        heure: `sem. ${RATTACHEMENT.semaine}`,
        texte: t.rattachement ? REPONSES.rattachementOui : REPONSES.rattachementNon,
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
      "Valeur créée par les décisions du trimestre : la VAN, au taux du groupe, de tout ce qu'elles ont engagé, recalculée avec ce que le trimestre a appris, sous les aléas que vous avez joués. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const p = t.grand;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Enveloppe",
          valeur: `${kE(t.engage)} engagés`,
          aide: `sur ${kE(t.enveloppe)}${t.enveloppe > ENVELOPPE ? ", rattachement compris" : ""}`,
          tenu: t.engage <= t.enveloppe,
        },
        {
          nom: "Mise en service",
          valeur: p
            ? MISE_EN_SERVICE + t.retard <= 13
              ? `semaine ${MISE_EN_SERVICE + t.retard}`
              : "après la semaine 13"
            : "aucun projet",
          aide: p ? `prévue en semaine ${MISE_EN_SERVICE}` : "aucun grand projet lancé",
          tenu: p !== null && t.retard <= 2,
        },
        {
          nom: "Cadence de préparation",
          valeur: `${nombre(p ? p.cadence * t.cadence : CADENCE_DEPART, 0)} lignes/h`,
          aide: p ? `aux essais ; dossier : ${p.cadence}` : `aujourd'hui : ${CADENCE_DEPART}`,
          tenu: p !== null && t.cadence >= 0.95,
        },
      ];
    },
    hasard(t, graine) {
      const h = hasard(graine);
      const p = t.grand;
      return [
        ...h.imprevus.map(({ imprevu, semaine }) => ({
          titre: `Semaine ${semaine}, ${imprevu.titre.toLowerCase()}`,
          texte: imprevu.texte,
        })),
        {
          titre: "Le groupe",
          texte: t.rattachement
            ? "a rattaché les agences du Nord-Isère : 30 % de petites lignes en plus à partir d'avril."
            : "a renoncé au rattachement des agences du Nord-Isère.",
        },
        {
          titre: "Le chantier",
          texte: p
            ? `Pour ${p.nom}, un surcoût de ${kE(t.surcout)}, ${t.retard} semaine${t.retard > 1 ? "s" : ""} de retard, une cadence mesurée à ${taux(t.cadence, 0)} de celle du dossier${
                t.panne ? ", et une panne de jeunesse" : ""
              }.`
            : `Aucun grand projet n'a été lancé ; il aurait connu un surcoût de ${taux(h.surcout, 1)} du prix, ${h.retard} semaine${h.retard > 1 ? "s" : ""} de retard et une cadence à ${taux(h.cadence, 0)} du dossier.`,
        },
        {
          titre: "La mezzanine",
          texte:
            t.offre !== null
              ? `Le négociant a offert ${kE(t.offre)} pour les éléments livrés.`
              : t.mezzanineOption === 0
                ? t.renfort
                  ? "Le bureau de contrôle a exigé un renfort de 25 k€ à la reprise du chantier."
                  : "Le bureau de contrôle n'a pas exigé de renfort : une chance sur deux."
                : "Le chantier n'a pas repris : ni renfort, ni revente ce trimestre.",
        },
      ];
    },
  },
  comportements,
  axe,
};
