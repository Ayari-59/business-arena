/**
 * ÉPISODE 62 — LE SPA QUI NE SE RENTABILISE PAS SEUL, tel que l'interface et
 * le bilan le lisent.
 *
 * Le modèle (src/engine/episodes) et le contenu (src/config/episodes) sont
 * assemblés ici : ce que le dossier de Marceau montre, ce que la courbe
 * trace, ce sur quoi le bilan le juge, et ce que ses décisions révèlent de
 * lui.
 *
 * Un investissement hôtelier se joue sur douze ans, l'épisode sur un
 * trimestre : le tableau de bord suit donc la VALEUR CRÉÉE ESTIMÉE, la VAN
 * des flux différentiels du projet sur la table, ce que l'hôtel gagne de
 * plus avec lui que sans lui, recalculée chaque semaine avec ce que le
 * trimestre apprend : l'effet prix, les pré-ventes, la gêne des abonnements,
 * la banque, l'hiver de Megève. À côté, le point bas de trésorerie du groupe
 * en mars : c'est lui, et non la valeur, que le financement fait bouger.
 */
import {
  CANNIBALISATION_DOSSIER,
  D,
  EFFET_ATTENDU,
  EFFET_PRIX,
  ETUDE,
  EXTERIEURS,
  GRAND,
  HOTEL,
  HYPOTHESES_DU_DOSSIER,
  JOURS_SANS_PERTE,
  NEIGE,
  NEUTRE,
  NET_PAR_EURO,
  O,
  OBJECTIF_VALEUR,
  PERTE_PAR_JOUR,
  PLANS_NEUTRES,
  PRET,
  PRE_VENTES,
  RENOVATION,
  REVENUE,
  SEUIL_PRIX_MOYEN,
  SPA,
  TAUX,
  TRESORERIE,
  CREDIT_BAIL,
  decaissement,
  effetPivot,
  evenements,
  hasard,
  investissement,
  paiement,
  projetInstruit,
  simuler,
  surcoutCreditBail,
  tableauDeBord,
  vanProjet,
  type Hypotheses,
  type Plans,
  type Projet,
  type Trimestre,
} from "@/engine/episodes/spa-a-financer";
import {
  DIAGNOSTICS,
  DORIANE,
  ETAPES,
  TAINA,
  MAYLIS,
  LUCILE,
  PHILIBERT,
  REFERENCES,
  REFLEXES,
  REPONSES,
  SELIM,
} from "@/config/episodes/spa-a-financer";
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
const eur1 = (v: number) => `${nombre(v, 1)} €`;
const pct = (v: number) => taux(v, 0);

/** Les nuitées de forfaits que la directrice pré-vend en trois semaines à son fichier clients. */
export const PRE_VENTES_NUITEES = 310;

/** Le supplément de prix moyen qui rendrait le spa rentable à lui seul : ce que la semaine 1 demande. */
export const SEUIL_DU_SPA = SEUIL_PRIX_MOYEN;

const PROJETS: readonly (Projet | null)[] = [null, SPA, GRAND, RENOVATION];
const projetLu = (l: Lecture) => PROJETS[l.projet ?? 0] ?? null;
const SOURCES = ["dossier", "revenue", "etude", "observatoire"] as const;
const TEXTE_DE_LA_SOURCE = {
  dossier: "l'espérance du dossier, faute d'étude",
  revenue: "l'estimation du revenue management, à 3 ou 4 € près",
  etude: "l'étude du cabinet, à 1 € près",
  observatoire: "le bilan de l'Observatoire du tourisme",
} as const;

/** Les hypothèses que le tableau de bord a lues en fin de semaine. */
const hypothesesLues = (l: Lecture): Hypotheses => ({
  u: l.effet ?? EFFET_ATTENDU,
  c: l.c ?? CANNIBALISATION_DOSSIER,
  kappa: l.kappa ?? EXTERIEURS.abonnements.geneDossier,
  lambda: l.lambda ?? HYPOTHESES_DU_DOSSIER.lambda,
  indice: l.indice === 1,
  energie: l.energie === 1,
  subvention: l.subvention === 1,
  avis: l.avis === 1,
});

/**
 * LES CHIFFRES DE L'ANALYSTE en semaine 2 : la VAN du projet instruit selon
 * l'effet prix, aux hypothèses du dossier, sans plan ni clients extérieurs ;
 * celle de la rénovation ; l'effet à partir duquel le spa la bat.
 */
export function chiffresDuDossier(p: Projet) {
  const h = HYPOTHESES_DU_DOSSIER;
  const selon = (u: number) => vanProjet(p, PLANS_NEUTRES, { ...h, u });
  return {
    faible: selon(EFFET_PRIX.faible.valeur),
    moyen: selon(EFFET_PRIX.moyen.valeur),
    fort: selon(EFFET_PRIX.fort.valeur),
    renovation: vanProjet(RENOVATION, PLANS_NEUTRES, h),
    pivot: effetPivot(p, PLANS_NEUTRES, h),
  };
}

/** Ce que le financement d'un montant donne à voir en semaine 11. */
export function chiffresDuFinancement(montant: number, neige: boolean, reporte = false) {
  const pret = PRET.quotite * montant;
  // Un vote reporté décale les travaux d'un an : rien n'en sort avant ce point bas de mars.
  const bas = (option: number) =>
    TRESORERIE.pointBas - (reporte ? 0 : decaissement(option, montant)) - (neige ? NEIGE : 0);
  return {
    pret,
    annuitePret: paiement(pret, PRET.taux, PRET.duree),
    frais: PRET.frais * pret,
    apport: montant - pret,
    loyer: paiement(montant, CREDIT_BAIL.taux, CREDIT_BAIL.duree),
    surcoutCB: surcoutCreditBail(montant),
    basEmprunt: bas(O.financement.emprunt),
    basCB: bas(O.financement.creditBail),
    basComptant: bas(O.financement.comptant),
  };
}

/** Ce que les décisions révèlent, dans l'ordre où un directeur financier les apprend. */
export function comportements(p: PartieJouee, t: Trimestre): Constat[] {
  const information = constatInformation(
    { etapes: ETAPES },
    p,
    "en semaine 1, le compte du spa et les chiffres de l'hôtel, sans lesquels on ne pose pas l'hôtel avec et sans spa",
  );

  const d = p.diagnostic;
  const lecture: Record<string, string> = {
    differentiel:
      "Votre diagnostic de la semaine 1 était juste : un spa d'hôtel se juge sur ce qu'il change à tout l'hôtel, moins ce qui serait venu de toute façon, et non sur son propre compte.",
    prix: "En semaine 1, vous avez vu la grande incertitude, l'effet sur le prix moyen ; mais il ne fait pas tout : les week-ends de basse saison, les séminaires et les habitués qui viendraient de toute façon comptent aussi.",
    deficit:
      "En semaine 1, vous avez jugé le spa sur son propre compte d'exploitation. Les clients de l'hôtel y entrent sans payer : ce qu'il rapporte est dans le prix des chambres, pas dans son compte.",
    chiffre:
      "En semaine 1, vous avez retenu le chiffre d'affaires global de la directrice : des recettes, pas des marges, et des forfaits et des séminaires qui, pour une bonne part, existaient déjà.",
  };
  const justes = ["differentiel", "prix"];
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
    score: d === "differentiel" ? 1 : d === "prix" ? 0.6 : 0,
    texte: (lecture[d] ?? "") + suite,
  };

  const n = REFLEXES.filter(([dec, o]) => p.chemin[dec] === o).length;
  const reflexe: Constat = {
    score: n === 0 ? 1 : n <= 2 ? 0.6 : 0,
    texte:
      n === 0
        ? "Vous n'avez jamais cédé aux réflexes du dossier d'investissement : ni juger le spa sur son compte ou sur le chiffre d'affaires de l'hôtel, ni décider sans établir l'effet prix, ni compter des séminaires qui existent déjà, ni équilibrer le spa aux dépens des chambres, ni croire qu'un financement rend un projet rentable."
        : `Vous avez choisi ${n} fois le réflexe qui rassure : juger le spa sur son propre compte ou sur le chiffre d'affaires de l'hôtel, décider sans établir l'effet prix, compter des séminaires qui existent déjà, équilibrer le compte du spa aux dépens des chambres, ne pas rouvrir le dossier, croire que le crédit-bail rend le projet rentable.`,
  };

  const calibrage = constatCalibrage(
    p,
    SEUIL_DU_SPA,
    "de supplément de prix moyen pour rendre le spa rentable à lui seul",
    "€",
    { juste: 0.5, proche: 1.5 },
    (e) => `${nombre(e, 1)} €`,
  );

  const instruit = projetInstruit(p.chemin);
  const etude = p.chemin[D.etude];
  const conseil = p.chemin[D.conseil];
  const issue = t.adopte
    ? t.adopte.spa
      ? `l'effet s'est révélé ${t.scenario}, ${t.u} €, et ${t.adopte.nom} a été adopté`
      : `l'effet s'est révélé ${t.scenario}, ${t.u} €, et la rénovation a été adoptée`
    : "";
  let savoir: Constat;
  if (!instruit || !instruit.spa) {
    savoir = {
      score: 0,
      texte:
        "Vous avez écarté le spa avant d'avoir établi ce qu'il ferait au prix moyen des chambres : la seule chose qui pouvait le départager de la rénovation.",
    };
  } else if (conseil === O.conseil.chiffres && etude === O.etude.cabinet) {
    savoir = {
      score: 1,
      texte: `Vous avez payé l'étude, puis laissé ses chiffres décider devant le conseil : ${issue}. L'information n'a de valeur que si elle peut changer la décision ; vous lui en avez laissé la possibilité.`,
    };
  } else if (conseil === O.conseil.chiffres && etude === O.etude.revenue) {
    savoir = {
      score: 0.6,
      texte: `Vous avez laissé les chiffres décider, mais avec une estimation gratuite à 3 ou 4 € près, qui peut se tromper de scénario : ${issue}.`,
    };
  } else if (conseil === O.conseil.reporter) {
    savoir = {
      score: 0.6,
      texte:
        "Vous avez fait reporter le vote à mars pour attendre le bilan de l'Observatoire : le conseil votera en sachant, mais l'hôtel perd une saison. Une étude commandée en octobre donnait la même réponse à temps.",
    };
  } else if (etude === O.etude.cabinet) {
    savoir = {
      score: 0,
      texte: `Vous avez payé l'étude, puis présenté le dossier d'octobre sans en tenir compte : ${euros(ETUDE.prix)} pour une information qui ne pouvait plus rien changer.`,
    };
  } else {
    savoir = {
      score: 0,
      texte: `Vous avez présenté le spa au conseil sans avoir établi son effet sur le prix moyen, alors que, faible, il en faisait un plus mauvais placement que la rénovation : ${issue}.`,
    };
  }

  return [information, diagnostic, reflexe, calibrage, savoir];
}

export function axe([information, diagnostic, reflexe, calibrage, savoir]: readonly Constat[]): {
  titre: string;
  texte: string;
} {
  if (information!.score < 0.5) {
    return {
      titre: "Poser l'hôtel avec et sans spa",
      texte:
        "Rejouez l'épisode en lisant d'abord le compte du spa et les chiffres de l'hôtel dans Hostéo : c'est avec eux qu'on calcule ce que le spa change à tout l'hôtel, et le prix moyen qui le rendrait rentable à lui seul.",
    };
  }
  if (reflexe!.score === 0) {
    return {
      titre: "Juger le spa sur tout l'hôtel, pas sur son compte",
      texte:
        "Un équipement d'hôtel se juge sur ses flux différentiels : ce que l'hôtel gagne de plus avec lui que sans lui, moins ce qui serait venu de toute façon. Ni son compte propre, ni le chiffre d'affaires de l'hôtel, ni les loyers d'un crédit-bail ne le disent.",
    };
  }
  if (savoir!.score === 0) {
    return {
      titre: "Payer pour savoir, et s'en servir",
      texte:
        "Quand une hypothèse fait basculer la décision, comme l'effet d'un spa sur le prix moyen, l'information qui la tranche vaut son prix, à condition de laisser ses chiffres décider.",
    };
  }
  if (diagnostic!.score < 1) {
    return {
      titre: "Raisonner en flux différentiels",
      texte:
        "Listez ce que le projet change à l'hôtel, ligne par ligne, et retirez ce qui serait arrivé sans lui : les habitués des week-ends, les séminaires venus d'un autre hôtel du groupe. C'est ce différentiel, actualisé, qui se compare à la rénovation.",
    };
  }
  if (calibrage!.score < 1) {
    return {
      titre: "Refaire le calcul du seuil",
      texte:
        "La VAN du spa seul : l'investissement, un EBE négatif pendant douze ans, le renouvellement de la sixième année, la valeur résiduelle. Divisez ce qui manque par l'annuité, puis par ce qu'un euro de prix moyen rapporte, commissions déduites.",
    };
  }
  return {
    titre: "Vérifier que ce n'était pas de la chance",
    texte:
      "Rejouez l'épisode sous un autre hasard avec les mêmes décisions. Si le résultat tient, votre méthode tient.",
  };
}

const valeurA = (t: Trimestre, w: number) => (w <= 0 ? 0 : t.semaines[w]!.valeur);
const NOM_FINANCEMENT = ["l'emprunt", "le crédit-bail", "la trésorerie du groupe"] as const;

export const EPISODE_SPA: Episode<Trimestre> = {
  code: "spa-a-financer",
  numero: 62,
  domaine: "Investir dans un hôtel",
  titre: "Le spa qui ne se rentabilise pas seul",
  resume:
    "Un spa de 1,4 M€ qui perd de l'argent sur son propre compte, une rénovation plus sûre, un conseil de famille qui hésite. Juger l'investissement sur tout l'hôtel, payer pour savoir, et ne pas confondre financement et valeur.",
  persona:
    "Vous êtes Marceau Dupré, directeur administratif et financier du Groupe Escale, groupe familial d'hôtellerie-restauration de Savoie et Haute-Savoie : huit hôtels, cinq restaurants, siège à Annecy. D'octobre à décembre, pendant la préparation du budget, vous instruisez pour le conseil de famille le projet de spa de L'Escale Évian, 4 étoiles de 66 chambres au bord du Léman, face à la rénovation des chambres et au statu quo, et vous montez son financement avec la Banque des Aravis.",
  mandat: [
    {
      fort: `${nombre(SPA.investissement / 1e6, 1)} M€`,
      texte: `le spa du dossier, face à la rénovation des chambres (${kE(RENOVATION.investissement)}) ou à rien`,
    },
    { fort: taux(TAUX, 0), texte: "le taux du groupe, flux avant impôt, sur douze ans" },
    { fort: kE(OBJECTIF_VALEUR), texte: "de valeur créée au moins par les décisions du trimestre" },
    { fort: kE(TRESORERIE.seuil), texte: "le point bas de trésorerie du groupe à tenir en mars" },
  ],
  jugement:
    "Le conseil de famille juge le trimestre sur la valeur créée : la VAN, au taux du groupe, des flux différentiels du projet adopté, ce que l'hôtel gagne de plus avec lui que sans lui, recalculée en semaine 13 avec ce que le trimestre a appris, moins le surcoût du financement et les sommes engagées.",
  duree: "une vingtaine de minutes",
  nomDuTableau: "Votre dossier",

  diagnostics: DIAGNOSTICS,
  etapes: ETAPES,
  neutre: NEUTRE,
  references: REFERENCES,

  enquete: {
    joursSansPerte: JOURS_SANS_PERTE,
    consigne:
      "Chaque vérification prend du temps, et au-delà de deux jours d'enquête, la note du conseil de famille se boucle dans l'urgence, avec un cabinet payé à la journée.",
    perte(j) {
      const perdu = Math.max(0, j - JOURS_SANS_PERTE) * PERTE_PAR_JOUR;
      if (perdu <= 0) return null;
      return {
        ...MAYLIS,
        alerte: true,
        texte: `Pour tenir la date du conseil, j'ai fait boucler la note par le cabinet du groupe : ${euros(perdu)} d'honoraires.`,
      };
    },
  },
  prevision: {
    libelle:
      "le supplément de prix moyen par nuitée qui, à lui seul, rendrait nulle la VAN du spa, en euros",
    unite: "€",
    placeholder: "10",
    min: 0,
    max: 60,
    step: 0.1,
    reel: () => SEUIL_DU_SPA,
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
        semaine && l.projet
          ? `VAN à ${taux(TAUX, 0)} des flux différentiels, avec ce que le trimestre a appris`
          : "rien n'est encore engagé",
    },
    {
      cle: "prixVise",
      nom: "Prix moyen visé",
      format: eur1,
      formatEcart: eur1,
      sensBon: 1,
      aide: (_, l) => {
        const p = projetLu(l);
        if (!p) return `sans projet : ${HOTEL.prixMoyen} € aujourd'hui`;
        if (!p.spa) return "avec la rénovation des chambres";
        const source = SOURCES[l.source ?? 0] ?? "dossier";
        return `effet du spa : ${eur1(l.effet ?? EFFET_ATTENDU)}, selon ${TEXTE_DE_LA_SOURCE[source]}`;
      },
    },
    {
      cle: "differentiel",
      nom: "Flux différentiel annuel",
      format: kE,
      sensBon: 1,
      aide: () => "ce que le projet change à l'hôtel chaque année, habitués déduits",
    },
    {
      cle: "tresorerie",
      nom: "Point bas de trésorerie en mars",
      format: kE,
      sensBon: 1,
      aide: () => `trésorerie du groupe ; seuil de sécurité : ${kE(TRESORERIE.seuil)}`,
      jauge: (l) => ({
        part: Math.max(0, Math.min(1, (l.tresorerie ?? 0) / TRESORERIE.pointBas)),
        enRetard: (l.tresorerie ?? 0) < TRESORERIE.seuil,
      }),
    },
    {
      cle: "engage",
      nom: "Engagé ce trimestre",
      format: kE,
      sensBon: -1,
      aide: () => "avant-projet, études, recrutement",
    },
  ],
  contexte(l, decisions): Contexte {
    const instruit = projetInstruit(decisions.length ? decisions : [3]);
    const p = projetLu(l);
    const hyp = hypothesesLues(l);
    const plans: Plans = {
      seminaires: decisions[D.seminaires] ?? PLANS_NEUTRES.seminaires,
      exterieurs: decisions[D.exterieurs] ?? PLANS_NEUTRES.exterieurs,
    };
    const ctx: Record<string, string | number | boolean> = {
      projet: p?.id ?? "",
      spaInstruit: instruit?.spa === true,
      source: SOURCES[l.source ?? 0] ?? "dossier",
      sourceTexte: TEXTE_DE_LA_SOURCE[SOURCES[l.source ?? 0] ?? "dossier"],
      effet: eur1(hyp.u),
      cannibalisation: pct(hyp.c),
      preVentes: PRE_VENTES_NUITEES,
    };
    if (instruit?.spa) {
      const c = chiffresDuDossier(instruit);
      ctx.vanFaible = kE(c.faible);
      ctx.vanMoyen = kE(c.moyen);
      ctx.vanFort = kE(c.fort);
      ctx.pivot = eur1(c.pivot);
      const ab = EXTERIEURS.abonnements;
      ctx.pertePrix = kE(ab.geneDossier * hyp.u * NET_PAR_EURO);
      ctx.perteForfaits = kE(
        (1 - hyp.c) * instruit.forfaits * ab.pertesForfaits * HOTEL.margeNuitee,
      );
      ctx.vanInstruit = kE(vanProjet(instruit, plans, hyp));
      ctx.vanRenovationActuelle = kE(vanProjet(RENOVATION, plans, hyp));
      ctx.pivotActuel = eur1(effetPivot(instruit, plans, hyp));
    } else if (instruit) {
      ctx.vanInstruit = kE(vanProjet(instruit, plans, hyp));
    }
    ctx.vanRenovation = kE(vanProjet(RENOVATION, PLANS_NEUTRES, HYPOTHESES_DU_DOSSIER));
    if (p) {
      const f = chiffresDuFinancement(
        investissement(p, hyp),
        l.neige === 1,
        instruit?.spa === true && decisions[D.conseil] === O.conseil.reporter,
      );
      ctx.nomAdopteDe = p.spa ? `du ${p.nom.slice(3)}` : `de ${p.nom}`;
      ctx.van = kE(l.van ?? 0);
      ctx.montantPret = kE(f.pret);
      ctx.annuitePret = kE(f.annuitePret);
      ctx.frais = kE(f.frais);
      ctx.apport = kE(f.apport);
      ctx.loyer = kE(f.loyer);
      ctx.surcoutCB = kE(f.surcoutCB);
      ctx.basEmprunt = kE(f.basEmprunt);
      ctx.basCB = kE(f.basCB);
      ctx.basComptant = kE(f.basComptant);
    }
    return ctx;
  },
  recap(t, de, a) {
    const s = t.semaines[a]!;
    return [
      [`Valeur créée estimée, sem. ${a}`, kE(s.valeur)],
      ["Variation sur la période", kES(s.valeur - valeurA(t, de - 1))],
      [`Point bas de trésorerie prévu, sem. ${a}`, kE(s.tresorerie)],
    ];
  },
  courbe: {
    titre: "Valeur créée estimée, semaine par semaine",
    cle: "valeur",
    cible: OBJECTIF_VALEUR,
    libelleCible: `objectif : ${kE(OBJECTIF_VALEUR)} au moins`,
    graduations: [100000, 200000, 400000, 600000, 800000],
    format: kE,
    details: (s) => [
      `valeur estimée ${kE(s.valeur!)} · ${kES(s.variation!)} dans la semaine`,
      `flux différentiel ${kE(s.differentiel!)} par an · prix moyen visé ${eur1(s.prixVise!)}`,
    ],
  },
  reactions(etape, choix, graine) {
    if (etape === D.seminaires && choix === O.seminaires.transfert) {
      // Les clients d'Aix répondent au transfert selon le hasard du trimestre.
      const refus = Math.round(hasard(graine).lambda * 20);
      return [{ ...TAINA, texte: REPONSES.transfert(refus) }];
    }
    return null;
  },
  evenements(chemin, graine, de, a) {
    const arrive = evenements(chemin, graine, de, a);
    const t = simuler(chemin, graine);
    const h = hasard(graine);
    const lies: Message[] = [];
    if (arrive.revenue) {
      lies.push({
        ...LUCILE,
        heure: `sem. ${REVENUE.semaine}`,
        texte: `D'après les prix des comparables sur Bookalia et Voyagio, avant et après leur spa, j'estime l'effet du spa à ${eur1(h.uRevenue)} de prix moyen, à 3 ou 4 € près.`,
      });
    }
    if (arrive.etude) {
      lies.push({
        ...DORIANE,
        heure: `sem. ${ETUDE.semaine}`,
        alerte: h.scenario === "faible",
        texte: `Conclusion de notre étude : le spa relèverait votre prix moyen de ${h.u} €. ${
          h.scenario === "faible"
            ? "Vos clients de loisirs viennent pour le lac, pas pour un spa : l'effet est faible."
            : h.scenario === "fort"
              ? "Votre clientèle suisse en est très demandeuse : l'effet est fort."
              : "C'est l'effet moyen des hôtels de notre panel."
        }`,
      });
    }
    if (arrive.preVentes) {
      lies.push({
        ...LUCILE,
        heure: `sem. ${PRE_VENTES}`,
        alerte: h.c > CANNIBALISATION_DOSSIER,
        texte: `J'ai croisé les ${PRE_VENTES_NUITEES} nuitées de forfaits pré-vendues avec le fichier de Hostéo : ${pct(h.c)} ont été achetées par des clients qui avaient déjà séjourné chez nous en basse saison. Le dossier en supposait ${pct(CANNIBALISATION_DOSSIER)}.`,
      });
    }
    if (arrive.enquete) {
      lies.push({
        ...LUCILE,
        heure: `sem. ${EXTERIEURS.semaineEnquete}`,
        alerte: true,
        texte: `Enquête auprès de nos clients sur le spa ouvert aux abonnés le week-end : d'après leurs réponses, l'effet du spa sur le prix moyen perdrait ${pct(h.kappa)}. Le dossier en supposait ${pct(EXTERIEURS.abonnements.geneDossier)}.`,
      });
    }
    if (arrive.conseil) {
      lies.push({
        ...PHILIBERT,
        heure: `sem. 11`,
        texte: t.reporte
          ? "Le conseil de famille reporte son vote à mars, après le bilan de l'Observatoire. Les travaux de cet hiver sont décommandés : l'ouverture glisse d'un an."
          : t.adopte
            ? `Le conseil de famille adopte ${t.adopte.nom} de L'Escale Évian.${
                t.instruit && t.adopte !== t.instruit
                  ? " Aliénor a défendu son spa jusqu'au bout ; les chiffres ont parlé."
                  : ""
              }`
            : "Le conseil de famille n'a rien à voter pour Évian.",
      });
    }
    if (arrive.banque && t.pret !== null) {
      lies.push({
        ...SELIM,
        heure: "sem. 12",
        alerte: !t.pret,
        texte: t.pret ? REPONSES.accord : REPONSES.refus,
      });
    }
    if (arrive.tension && t.adopte) {
      lies.push({
        ...MAYLIS,
        heure: "sem. 12",
        alerte: t.tension < 0,
        texte:
          t.tension < 0
            ? `Point bas de mars prévu à ${kE(t.tresorerie)}, sous le seuil de ${kE(TRESORERIE.seuil)} : il faudra tirer la ligne de crise. ${kE(-t.tension)} de commissions, d'agios et d'escomptes perdus.`
            : `Point bas de mars prévu à ${kE(t.tresorerie)}, au-dessus du seuil de ${kE(TRESORERIE.seuil)}${
                t.tresorerie < TRESORERIE.seuil + TRESORERIE.hiver ? ", de peu" : ""
              }.`,
      });
    }
    const imprevus: Message[] = arrive.imprevus.map(({ imprevu, semaine }) => ({
      de: imprevu.de,
      role: imprevu.role,
      heure: `sem. ${semaine}`,
      texte: imprevu.texte,
    }));
    if (arrive.observatoire) {
      imprevus.push({
        de: "Observatoire du tourisme",
        role: "Bilan des 4 étoiles du Léman",
        heure: "sem. 12",
        texte: REPONSES.observatoire[h.scenario],
      });
      imprevus.push({
        ...MAYLIS,
        heure: "sem. 12",
        texte: h.hiver
          ? `Megève démarre mal : les réservations de février sont en retard. Le point bas de mars perdra ${kE(TRESORERIE.hiver)} de plus.`
          : "Megève démarre bien : les réservations de février sont au niveau de l'an dernier.",
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
      "Valeur créée par les décisions du trimestre : la VAN, au taux du groupe, des flux différentiels du projet adopté, recalculée avec ce que le trimestre a appris, moins le surcoût du financement et les sommes engagées, sous le hasard que vous avez joué. Plus la barre est longue, mieux c'est. L'échelle ne part pas de zéro.",
    tuiles(t) {
      const p = t.adopte;
      return [
        {
          nom: "Valeur créée",
          valeur: kE(t.objectif),
          aide: `estimée en semaine 13 ; objectif ${kE(OBJECTIF_VALEUR)}`,
          tenu: t.objectif >= OBJECTIF_VALEUR,
        },
        {
          nom: "Projet adopté",
          valeur: p ? (t.reporte ? "vote reporté" : p.nom) : "aucun",
          aide: p
            ? `VAN des flux différentiels : ${kE(t.van)}${t.reporte ? ", un an plus tard" : ""}`
            : "rien n'a été instruit",
          tenu: p !== null && t.van > 0,
        },
        {
          nom: "Trésorerie du groupe",
          valeur: `${kE(t.tresorerie)} en mars`,
          aide: `point bas ; seuil de sécurité ${kE(TRESORERIE.seuil)}`,
          tenu: t.tresorerie >= TRESORERIE.seuil,
        },
        {
          nom: "Financement",
          valeur: p ? (NOM_FINANCEMENT[t.financementChoisi] ?? "") : "aucun",
          aide: p
            ? `${kE(-t.financement)} de plus qu'un emprunt au prix du marché${
                t.pret === false ? ", après le refus de la banque" : ""
              }`
            : "rien à financer",
          tenu: p !== null && -t.financement <= 20000,
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
          titre: "L'effet du spa sur le prix moyen",
          texte: `${t.u} € : un effet ${t.scenario}, comme environ ${pct(EFFET_PRIX[t.scenario].chance)} des spas d'hôtels de lac.${
            t.instruit?.spa && t.adopte && !t.adopte.spa
              ? " Le conseil a adopté la rénovation."
              : ""
          }`,
        },
        {
          titre: "Les forfaits bien-être",
          texte: `${pct(t.c)} des nuitées pré-vendues l'ont été à des habitués, qui seraient venus de toute façon.`,
        },
        {
          titre: "La banque et l'hiver",
          texte: `${
            t.pret === null
              ? "Vous n'avez pas demandé de prêt."
              : t.pret
                ? "La Banque des Aravis a accordé le prêt."
                : "La Banque des Aravis a refusé le prêt."
          } Megève a ${t.hiver ? "mal" : "bien"} démarré l'hiver.`,
        },
      ];
    },
  },
  comportements,
  axe,
};
