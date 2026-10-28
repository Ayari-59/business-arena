import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { indicateursDuMois, prevoirLesVentes, tendanceAnnuelle, type MethodeDeTendance } from "../monde/boutique";
import { BOUTIQUES_DU_COURS, type FicheDeLaBoutique } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PRÉVOIR LES VENTES (BTS MCO, palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : la boutique
 * MAILLE & CO a une fiche figée (monde/maille-et-co.ts), avec la demande de ses trois années passées,
 * trimestre par trimestre, et la prévision se calcule par le modèle du cours (monde/boutique.ts,
 * `prevoirLesVentes`). Une évolution du moteur ne change rien ici. Décision du propriétaire (octobre
 * 2026) : le contenu du cours fait l'objet de la simulation, inspirée des entreprises de l'arène sans en
 * être le reflet exact.
 *
 * La méthode est celle de l'épreuve : les moyennes mobiles centrées sur 4 trimestres effacent la
 * saison ; la droite des moindres carrés, tracée sur elles, donne la tendance ; le rapport de chaque
 * trimestre à sa tendance, en moyenne sur les trois années puis corrigé pour que la saison se compense
 * sur l'année, donne les coefficients saisonniers ; la prévision est la tendance prolongée × le
 * coefficient. Puis la critique : tracée sur les trimestres bruts, la droite prend Noël pour de la
 * croissance, et les coefficients dérivent.
 *
 * LA DEMANDE, PAS LES VENTES. Au trimestre 4, la réserve ne tient pas le pic : les ventes plafonnent
 * sous la demande. Le chapitre prévoit la demande, et le laboratoire montre ce que donnerait la série
 * des ventes.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : progressif, mais au niveau de l'examen) :
 *   · guidé : intro, quelle-serie, les-moyennes-mobiles, la-droite (la formule est au repère ou dans
 *     la question, qui nomme les chiffres), les-coefficients-corriges (la correction est donnée) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-pente puis
 *     la-tendance-au-curseur (le trimestre où la tendance atteint le seuil d'une deuxième boutique)
 *     avant a-rebours ; predire-la-saison puis la-saison-au-curseur (la demande du trimestre 1 de N
 *     qui tient la tendance, une fois la saison retirée) avant la-prevision et le-mois-de-janvier ;
 *     predire-les-trimestres-bruts puis le-laboratoire-de-la-methode (la série, la méthode et le
 *     trimestre lu ; la série, la droite et la prévision en graphique) avant la-critique ;
 *   · autonome : les-rapports-a-la-tendance, la-prevision (ni formule ni chiffres à prendre ; le calcul
 *     de la correction montre le chemin) ;
 *   · expert : a-rebours (retrouver le trimestre où la tendance atteint un niveau), le-mois-de-janvier
 *     et ce-que-dit-janvier (un diagnostic : la saison ou la demande ?), la-critique et
 *     pourquoi-la-droite-brute-trompe (la critique de la méthode), une-autre-methode (une variante
 *     chiffrée : la droite sur les totaux annuels, qui rejoint les moyennes mobiles) ; puis la synthèse.
 *
 * LES CURSEURS LISENT EN EUROS. La lecture d'un curseur s'affiche en euros (EtapeCurseur n'a pas
 * d'unité) : les deux curseurs du chapitre traduisent donc les articles en chiffre d'affaires, au prix
 * moyen d'un article de janvier, et la question le dit à l'élève.
 */

/**
 * LE SEUIL D'UNE DEUXIÈME BOUTIQUE, hypothèse du cours : la direction ouvrira un second point de vente
 * quand la tendance dépassera 8 000 articles par trimestre, ce que la surface de vente et la réserve
 * ne peuvent plus servir.
 */
export const SEUIL_DE_LA_DEUXIEME_BOUTIQUE = 8_000;

/** Les bornes du curseur de la tendance, en rang de trimestre : de l'année N à la fin de N + 4. */
export const RANGS_DU_CURSEUR = { min: 13, max: 32 } as const;

/** Les bornes du curseur de la saison : la demande du trimestre 1 de N, en articles. */
export const DEMANDE_DU_CURSEUR = { min: 4_000, max: 6_500 } as const;

/** Les méthodes et les séries du laboratoire, codées pour leurs leviers à choix. */
export const METHODES_DU_LABORATOIRE = { "moyennes-mobiles": 1, "trimestres-bruts": 2 } as const;
export const SERIES_DU_LABORATOIRE = { demande: 1, ventes: 2 } as const;

/** La boutique du cours, seule : c'est elle qui a trois années de demande, trimestre par trimestre. */
export const ENTREPRISES_DE_LA_PREVISION: readonly string[] = ["boutique"];

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const art = (n: number) => qte(Math.round(n));
const dec = (x: number, d = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const plafond = (x: number) => Math.ceil(x - 1e-9);

/** « trimestre 1 de N − 3 » : le rang 1 est le premier trimestre de N − 3, le rang 13 celui de N. */
export function trimestreDuRang(rang: number) {
  const k = Math.floor((rang - 1) / 4) - 3;
  const annee = k === 0 ? "N" : k < 0 ? `N − ${-k}` : `N + ${k}`;
  const trimestre = ((rang - 1) % 4) + 1;
  return { annee, trimestre, libelle: `trimestre ${trimestre} de ${annee}` };
}

/** La fiche de la boutique du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLaBoutique => BOUTIQUES_DU_COURS[c.code]!;

/**
 * La prévision sur une série : la demande (celle de la fiche), ou les ventes, plafonnées au trimestre 4.
 * Le modèle du cours prévoit la demande ; pour la série des ventes, le chapitre lui donne une fiche dont
 * la demande est remplacée par les ventes, sans toucher la fiche.
 */
export function prevoirSurLaSerie(f: FicheDeLaBoutique, methode: MethodeDeTendance, serie: "demande" | "ventes") {
  const fiche = serie === "demande" ? f : { ...f, historique: f.historique.map((h) => ({ ...h, demande: h.ventes })) };
  return prevoirLesVentes(fiche, methode);
}

/** Tout ce que le chapitre et son cas demandent. */
export function previsionDesVentes(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const p = prevoirLesVentes(f);
  const brute = prevoirLesVentes(f, "trimestres-bruts");
  const annuelle = tendanceAnnuelle(f);
  const { a, b, xMoyen, yMoyen } = p.droite;
  const tendance = (t: number) => a * t + b;
  const points = p.serie.filter((s) => s.moyenneMobile !== null);
  const sommeDesCarres = points.reduce((t, s) => t + (s.rang - xMoyen) ** 2, 0);
  const sommeDesProduits = points.reduce((t, s) => t + (s.rang - xMoyen) * (s.moyenneMobile! - yMoyen), 0);
  const du = (annee: string, trimestre: number) => p.serie.find((s) => s.annee === annee && s.trimestre === trimestre)!;
  const fort = { n3: du("N-3", 4), n2: du("N-2", 4), n1: du("N-1", 4) };
  // Le seuil d'une deuxième boutique, à rebours : le rang où la tendance l'atteint.
  const rangDuSeuil = (SEUIL_DE_LA_DEUXIEME_BOUTIQUE - b) / a;
  const premierRang = plafond(rangDuSeuil);
  // Le mois de janvier de N, au rythme du trimestre : les 3 mois pèsent autant (convention du cours).
  const demandeDeJanvier = f.gamme.reduce((t, r) => t + r.demandeDuMois, 0);
  const trimestreAuRythme = 3 * demandeDeJanvier;
  const t1 = p.previsions[0]!;
  const t4 = p.previsions[3]!;
  // La droite des trimestres bruts.
  const bruts = p.serie.map((s) => ({ x: s.rang, y: s.demande }));
  const yMoyenBrut = bruts.reduce((t, s) => t + s.y, 0) / bruts.length;
  const sommeDesCarresBrute = bruts.reduce((t, s) => t + (s.x - brute.droite.xMoyen) ** 2, 0);
  const sommeDesProduitsBrute = bruts.reduce((t, s) => t + (s.x - brute.droite.xMoyen) * (s.y - yMoyenBrut), 0);
  const tendanceBrute = (t: number) => brute.droite.a * t + brute.droite.b;
  // Le prix moyen d'un article de janvier : la lecture des curseurs, en chiffre d'affaires.
  const prixMoyen = auCentime(indicateursDuMois(f).prixMoyenDeLArticle);
  return {
    f,
    p,
    brute,
    annuelle,
    a,
    b,
    xMoyen,
    yMoyen,
    tendance,
    sommeDesCarres,
    sommeDesProduits,
    fort,
    rangDuSeuil,
    premierRang,
    tendanceAuSeuil: tendance(premierRang),
    demandeDeJanvier,
    trimestreAuRythme,
    ecartDeJanvier: (trimestreAuRythme - t1.prevision) / t1.prevision,
    janvierCorrige: trimestreAuRythme / t1.coefficient,
    t1,
    t4,
    /** La plus petite demande du trimestre 1 de N qui tient la tendance, une fois la saison retirée. */
    demandeQuiTientLaTendance: plafond(t1.tendance * t1.coefficient),
    yMoyenBrut,
    sommeDesCarresBrute,
    sommeDesProduitsBrute,
    tendanceBrute,
    rapportBrut: { n3: fort.n3.demande / tendanceBrute(fort.n3.rang), n1: fort.n1.demande / tendanceBrute(fort.n1.rang) },
    /** La prévision du trimestre 4 de N par la droite des trimestres bruts : celle du consultant. */
    previsionDuConsultant: Math.round(brute.previsions[3]!.prevision),
    prixMoyen,
  };
}

export type PrevisionDesVentes = ReturnType<typeof previsionDesVentes>;

/** Le laboratoire : la prévision d'une série, par une méthode, lue à un trimestre (rang 1 à 16). */
export function laboratoireDeLaMethode(x: PrevisionDesVentes, rang: number, methode: number, serie: number) {
  const m: MethodeDeTendance = methode === METHODES_DU_LABORATOIRE["trimestres-bruts"] ? "trimestres-bruts" : "moyennes-mobiles";
  const s = serie === SERIES_DU_LABORATOIRE.ventes ? "ventes" : "demande";
  const p = prevoirSurLaSerie(x.f, m, s);
  const tendance = (t: number) => p.droite.a * t + p.droite.b;
  const coefficient = (t: number) => p.coefficients[(Math.round(t) - 1) % 4]!;
  const modele = (t: number) => tendance(t) * coefficient(t);
  const observee = (t: number) => (t <= 12 ? p.serie[Math.round(t) - 1]!.demande : modele(t));
  // Entre deux rangs, le graphique relie les points : une ligne brisée, trimestre à trimestre.
  const relie = (g: (t: number) => number, t: number) => {
    const bas = Math.min(15, Math.max(1, Math.floor(t)));
    const k = t - bas;
    return g(bas) * (1 - k) + g(bas + 1) * k;
  };
  return {
    pente: p.droite.a,
    tendance: tendance(rang),
    coefficient: coefficient(rang),
    prevision: modele(rang),
    t4DeN: p.previsions[3]!.prevision,
    anneeN: p.totalPrevu,
    courbes: { observee: (t: number) => relie(observee, t), droite: tendance, modele: (t: number) => relie(modele, t) },
  };
}

/** Les trois années, trimestre par trimestre : la demande et les ventes. */
export function tableauDesTroisAnnees(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = previsionDesVentes(c);
  return {
    titre: `${x.f.entreprise} · trois années, trimestre par trimestre`,
    colonnes: ["Rang", "Demande", "Vendu"],
    lignes: x.p.serie.map((s) => ({ libelle: trimestreDuRang(s.rang).libelle, valeurs: [String(s.rang), qte(s.demande), qte(s.ventes)] })),
  };
}

/** La série et sa tendance : les moyennes mobiles, la droite et les rapports, sauf ceux du trimestre 4. */
function tableauDeLaTendance(x: PrevisionDesVentes): TableauDeDonnees {
  return {
    titre: `${x.f.entreprise} · la demande et sa tendance`,
    colonnes: ["Demande", "Moyenne mobile centrée", "Tendance", "Demande ÷ tendance"],
    lignes: x.p.serie.map((s) => ({
      libelle: `${s.rang}. ${trimestreDuRang(s.rang).libelle}`,
      valeurs: [qte(s.demande), s.moyenneMobile === null ? "" : dec(s.moyenneMobile), dec(s.tendance), s.trimestre === 4 ? "à calculer" : dec(s.rapport, 4)],
    })),
  };
}

/** La prévision de l'année N, trimestre par trimestre : le tableau de la synthèse. */
function tableauDeLaPrevision(x: PrevisionDesVentes): TableauDeDonnees {
  return {
    titre: `${x.f.entreprise} · la prévision de la demande de N`,
    colonnes: ["Rang", "Tendance", "Coefficient saisonnier", "Prévision"],
    lignes: [
      ...x.p.previsions.map((q) => ({ libelle: `Trimestre ${q.trimestre} de N`, valeurs: [String(q.rang), dec(q.tendance), dec(q.coefficient, 4), art(q.prevision)] })),
      { libelle: "Année N", valeurs: ["", "", dec(x.p.coefficients.reduce((t, k) => t + k, 0), 4), art(x.p.totalPrevu)] },
    ],
  };
}

export const PREVOIR_LES_VENTES: Chapitre = {
  code: "prevoir-les-ventes",
  parcours: "mco",
  palier: 3,
  blocs: ["BTS MCO Bloc 3 · Assurer la gestion opérationnelle"],
  titre: "Prévoir les ventes",
  accroche:
    "Trois années de demande, trimestre par trimestre : les moyennes mobiles effacent la saison, la droite des moindres carrés donne la tendance, les coefficients saisonniers la remettent. Puis la prévision de l'année, et la critique de la méthode.",
  objectifs: [
    "Choisir la bonne série : la demande, quand les ventes ont été plafonnées",
    "Calculer des moyennes mobiles centrées et la droite des moindres carrés",
    "Calculer et corriger les coefficients saisonniers par le rapport à la tendance",
    "Prévoir les trimestres de l'année suivante, et retrouver à rebours quand la tendance atteint un niveau",
    "Corriger un trimestre des variations saisonnières, et critiquer une droite tracée sur les trimestres bruts",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PREVISION,
    pourquoi:
      "ce chapitre se joue à la boutique du cours, MAILLE & CO, la seule dont la simulation tient trois années de demande trimestre par trimestre ; le point de vente reste le même d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois années pour en prévoir une",
      notions: ["seasonality"],
      tableau: tableauDesTroisAnnees,
      texte: (c) => {
        const x = previsionDesVentes(c);
        const n1 = x.fort.n1;
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}, qui vend de la maille en centre-ville. Le tableau donne ses trois années passées, de N − 3 à N − 1, trimestre par trimestre : la demande (les articles que les clients ont voulus, vendus ou non) et les ventes.`,
          `La simulation suppose une demande qui suit une tendance régulière et une saison marquée : le trimestre 2 en vaut à peine la moitié d'un trimestre moyen, le trimestre 4, celui de Noël, le double. Au trimestre 4, la réserve ne tient pas le pic : en N − 1, ${art(n1.ventes)} articles vendus pour ${art(n1.demande)} demandés.`,
          "Prévoir, c'est séparer la tendance et la saison, puis les recomposer pour l'année N. On numérote les trimestres : le rang 1 est le trimestre 1 de N − 3, le rang 12 le trimestre 4 de N − 1, les rangs 13 à 16 sont ceux de N.",
        ];
      },
      repere: () =>
        "Moyenne mobile centrée du rang t = (y(t − 2) ÷ 2 + y(t − 1) + y(t) + y(t + 1) + y(t + 2) ÷ 2) ÷ 4. Prévision d'un trimestre = tendance de son rang × coefficient saisonnier de ce trimestre.",
    },
    {
      id: "quelle-serie",
      type: "choix",
      titre: "Les ventes, ou la demande ?",
      notions: ["seasonality", "stock"],
      tableau: tableauDesTroisAnnees,
      question: (c) => {
        const n1 = previsionDesVentes(c).fort.n1;
        return `Au trimestre 4 de N − 1, la boutique a vendu ${art(n1.ventes)} articles pour une demande de ${art(n1.demande)}. Sur quelle série faut-il bâtir la prévision ?`;
      },
      options: (c) => {
        const n1 = previsionDesVentes(c).fort.n1;
        return [
          {
            texte: "Sur la demande : les ventes du trimestre fort ont été plafonnées",
            juste: true,
            retour: "Oui. Au trimestre 4, la boutique n'a pas pu servir toute la demande : ses ventes disent ce que la réserve tenait, pas ce que les clients voulaient. Prévoir sur les ventes reconduirait la rupture l'an prochain.",
          },
          {
            texte: "Sur les ventes : c'est le seul chiffre certain",
            juste: false,
            retour: `Les ventes sont certaines, mais bornées par la réserve. Au trimestre 4 de N − 1, ${art(n1.demande - n1.ventes)} articles demandés n'ont pas été servis : les oublier, c'est prévoir trop bas, et manquer encore des ventes.`,
          },
          {
            texte: "Sur la moyenne des deux, pour ne pas trop se tromper",
            juste: false,
            retour: "Mélanger les deux séries ne corrige rien : la prévision resterait tirée vers le bas par les ventes manquées.",
          },
        ];
      },
    },
    {
      id: "les-moyennes-mobiles",
      type: "montants",
      titre: "Les moyennes mobiles centrées",
      notions: ["seasonality"],
      tableau: tableauDesTroisAnnees,
      question: () =>
        "Une moyenne mobile centrée fait la moyenne de 4 trimestres consécutifs, centrée sur le trimestre : y(t − 2) ÷ 2 + y(t − 1) + y(t) + y(t + 1) + y(t + 2) ÷ 2, le tout divisé par 4. Calculez-la aux rangs 3, 4 et 10, au centième.",
      champs: (c) => {
        const x = previsionDesVentes(c);
        const y = x.p.serie.map((s) => s.demande);
        const mm = (t: number) => ({
          libelle: `Moyenne mobile centrée du rang ${t}`,
          attendu: auCentime(x.p.serie[t - 1]!.moyenneMobile!),
          tolerance: 0.01,
          calcul: `(${qte(y[t - 3]!)} ÷ 2 + ${qte(y[t - 2]!)} + ${qte(y[t - 1]!)} + ${qte(y[t]!)} + ${qte(y[t + 1]!)} ÷ 2) ÷ 4 = ${dec(x.p.serie[t - 1]!.moyenneMobile!)}`,
        });
        return [mm(3), mm(4), mm(10)];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const [s3, s4] = [x.p.serie[2]!, x.p.serie[3]!];
        return [
          `D'un rang à l'autre, la demande passe de ${art(s3.demande)} à ${art(s4.demande)} articles ; la moyenne mobile, de ${dec(s3.moyenneMobile!)} à ${dec(s4.moyenneMobile!)}. Chaque moyenne compte une année entière, donc chaque saison une fois : la saison s'efface, il reste la tendance.`,
          "Les rangs 1, 2, 11 et 12 n'en ont pas : il manque 2 trimestres d'un côté. La série lissée compte 8 points, du rang 3 au rang 10.",
        ];
      },
    },
    {
      id: "la-droite",
      type: "montants",
      titre: "La droite des moindres carrés",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Ajustez une droite y = a x + b sur les 8 moyennes mobiles (x, le rang, de 3 à 10). La pente vaut a = Σ (x − x̄)(y − ȳ) ÷ Σ (x − x̄)², et la droite passe par le point moyen : b = ȳ − a x̄. Ici, Σ (x − x̄)² = ${qte(x.sommeDesCarres)} et Σ (x − x̄)(y − ȳ) = ${dec(x.sommeDesProduits)}. Calculez x̄, ȳ (la moyenne des 8 moyennes mobiles), a et b, au centième.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        const mm = x.p.serie.filter((s) => s.moyenneMobile !== null).map((s) => s.moyenneMobile!);
        return [
          { libelle: "Rang moyen x̄", attendu: x.xMoyen, calcul: `(3 + 4 + … + 10) ÷ 8 = ${qte(x.xMoyen)}` },
          { libelle: "Moyenne des moyennes mobiles ȳ", attendu: auCentime(x.yMoyen), tolerance: 0.01, calcul: `(${mm.map((v) => dec(v)).join(" + ")}) ÷ 8 = ${dec(x.yMoyen)}` },
          { libelle: "Pente a", attendu: auCentime(x.a), tolerance: 0.01, calcul: `${dec(x.sommeDesProduits)} ÷ ${qte(x.sommeDesCarres)} = ${dec(x.a, 4)}` },
          { libelle: "Ordonnée à l'origine b", attendu: auCentime(x.b), tolerance: 0.02, calcul: `${dec(x.yMoyen)} − ${dec(x.a, 4)} × ${qte(x.xMoyen)} = ${dec(x.b)}` },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `La tendance de ${x.f.entreprise} est y = ${dec(x.a)} x + ${dec(x.b)}. Elle passe par le point moyen (${qte(x.xMoyen)} ; ${dec(x.yMoyen)}) : c'est la droite qui rend la plus petite possible la somme des carrés des écarts entre les points et elle.`,
          `Sa pente, ${dec(x.a)} articles, est ce que la tendance gagne d'un rang au suivant.`,
        ];
      },
    },
    {
      id: "predire-la-pente",
      type: "choix",
      titre: "Pariez sur la pente",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Avant d'aller plus loin, pariez. La pente de la tendance vaut ${dec(x.a)}. Elle veut dire que la demande gagne…`;
      },
      options: (c) => {
        const x = previsionDesVentes(c);
        const voir = "Faites avancer le temps à l'étape suivante : le curseur montre ce que la tendance gagne à chaque cran.";
        return [
          { texte: `${dec(x.a)} articles par trimestre, saison retirée`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${dec(x.a)} articles par an`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${dec(x.a)} articles au même trimestre, d'une année à l'autre`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-tendance-au-curseur",
      type: "curseur",
      titre: "Faites avancer la tendance",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `La direction ouvrira une deuxième boutique quand la tendance dépassera ${art(SEUIL_DE_LA_DEUXIEME_BOUTIQUE)} articles par trimestre (hypothèse du cours). Faites avancer le rang du trimestre, de ${RANGS_DU_CURSEUR.min} (le trimestre 1 de N) à ${RANGS_DU_CURSEUR.max} : une droite donne la tendance, l'autre le seuil. Le tableau les lit en chiffre d'affaires, au prix moyen d'un article de janvier, ${eur(x.prixMoyen)}. Placez le curseur sur le premier rang où la tendance atteint le seuil, puis validez.`;
      },
      grandeur: () => ({ libelle: "Rang du trimestre", unite: "" }),
      cible: (c) => ({ attendu: previsionDesVentes(c).premierRang, min: RANGS_DU_CURSEUR.min, max: RANGS_DU_CURSEUR.max }),
      zones: ["Le seuil est atteint", "Sous le seuil"],
      rates: () => ({
        dessous: "À ce rang, la tendance n'atteint pas encore le seuil : avancez.",
        dessus: "Un rang plus tôt, la tendance atteint déjà le seuil : cherchez le premier.",
      }),
      montrer: "Montrer le premier rang",
      lecture: (c, t) => {
        const x = previsionDesVentes(c);
        return [
          { libelle: "Chiffre d'affaires de la tendance du trimestre", montant: auCentime(x.tendance(t) * x.prixMoyen) },
          { libelle: "Chiffre d'affaires du seuil", montant: auCentime(SEUIL_DE_LA_DEUXIEME_BOUTIQUE * x.prixMoyen) },
          { libelle: "Ce que la tendance a gagné depuis le rang 12", montant: auCentime((t - 12) * x.a * x.prixMoyen) },
          { libelle: "Tendance moins seuil", montant: auCentime((x.tendance(t) - SEUIL_DE_LA_DEUXIEME_BOUTIQUE) * x.prixMoyen), fort: true },
        ];
      },
      droites: (c) => {
        const x = previsionDesVentes(c);
        return { produit: (t) => x.tendance(t), cout: () => SEUIL_DE_LA_DEUXIEME_BOUTIQUE, libelles: ["Tendance du trimestre, en articles", "Seuil d'une deuxième boutique"] };
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const r = trimestreDuRang(x.premierRang);
        return [
          `La tendance atteint ${art(SEUIL_DE_LA_DEUXIEME_BOUTIQUE)} articles au rang ${x.premierRang}, le ${r.libelle} : ${dec(x.tendanceAuSeuil)} articles. Chaque cran du curseur ajoute ${dec(x.a)} articles : la pente se lit par trimestre, et 4 trimestres en font ${dec(4 * x.a)} sur une année.`,
          "C'est une tendance, saison retirée : le trimestre réel de ce rang sera plus haut ou plus bas selon sa saison. L'étape suivante retrouve ce rang par le calcul.",
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Retrouver le trimestre à rebours",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Sans le curseur cette fois. Avec la tendance y = ${dec(x.a)} x + ${dec(x.b)}, retrouvez le rang où elle vaut exactement ${art(SEUIL_DE_LA_DEUXIEME_BOUTIQUE)} articles (au centième), le premier rang entier où elle les dépasse, puis la tendance de ce rang.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        return [
          {
            libelle: "Rang où la tendance atteint le seuil",
            attendu: auCentime(x.rangDuSeuil),
            tolerance: 0.01,
            calcul: `(${art(SEUIL_DE_LA_DEUXIEME_BOUTIQUE)} − ${dec(x.b)}) ÷ ${dec(x.a)} = ${dec(x.rangDuSeuil)}`,
          },
          { libelle: "Premier rang entier au-delà du seuil", attendu: x.premierRang, calcul: `le rang entier qui suit ${dec(x.rangDuSeuil)} : ${x.premierRang}, le ${trimestreDuRang(x.premierRang).libelle}` },
          {
            libelle: "Tendance de ce rang",
            attendu: auCentime(x.tendanceAuSeuil),
            tolerance: 0.05,
            calcul: `${dec(x.a)} × ${x.premierRang} + ${dec(x.b)} = ${dec(x.tendanceAuSeuil)}`,
          },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `Remonter la droite, c'est résoudre a x + b = niveau : x = (niveau − b) ÷ a. Le rang ${dec(x.rangDuSeuil)} n'est pas un trimestre ; le seuil est franchi au rang ${x.premierRang}, le ${trimestreDuRang(x.premierRang).libelle}.`,
          `Prendre la pente pour une croissance annuelle aurait repoussé le seuil de plusieurs années : à ${dec(x.a)} articles par an, il faudrait ${qte(plafond((SEUIL_DE_LA_DEUXIEME_BOUTIQUE - x.tendance(12)) / x.a))} ans au lieu de ${x.premierRang - 12} trimestres.`,
        ];
      },
    },
    {
      id: "les-rapports-a-la-tendance",
      type: "montants",
      titre: "Le rapport de chaque trimestre à sa tendance",
      notions: ["seasonality"],
      tableau: (c) => tableauDeLaTendance(previsionDesVentes(c)),
      question: () =>
        "Le tableau donne la tendance de chaque rang et le rapport demande ÷ tendance, sauf au trimestre 4. Sans formule cette fois : calculez les rapports du trimestre 4 en N − 3, N − 2 et N − 1, au centième, puis le coefficient saisonnier brut du trimestre 4.",
      champs: (c) => {
        const x = previsionDesVentes(c);
        const r = (s: (typeof x.fort)["n3"]) => ({
          libelle: `Rapport du trimestre 4 de ${trimestreDuRang(s.rang).annee}`,
          attendu: auCentime(s.rapport),
          tolerance: 0.01,
          calcul: `${qte(s.demande)} ÷ ${dec(s.tendance)} = ${dec(s.rapport, 4)}`,
        });
        return [
          r(x.fort.n3),
          r(x.fort.n2),
          r(x.fort.n1),
          {
            libelle: "Coefficient saisonnier brut du trimestre 4",
            attendu: auCentime(x.p.coefficientsBruts[3]!),
            tolerance: 0.01,
            calcul: `(${[x.fort.n3, x.fort.n2, x.fort.n1].map((s) => dec(s.rapport, 4)).join(" + ")}) ÷ 3 = ${dec(x.p.coefficientsBruts[3]!, 4)}`,
          },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `Au trimestre 4, la demande vaut à peu près ${dec(x.p.coefficientsBruts[3]!)} fois sa tendance, et ce rapport bouge peu d'une année à l'autre : la saison se répète. Les coefficients bruts des 4 trimestres sont ${x.p.coefficientsBruts.map((k) => dec(k, 4)).join(" ; ")}.`,
        ];
      },
    },
    {
      id: "les-coefficients-corriges",
      type: "montants",
      titre: "Des coefficients qui se compensent",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Les 4 coefficients bruts (${x.p.coefficientsBruts.map((k) => dec(k, 4)).join(" ; ")}) font ${dec(x.p.sommeBrute, 4)}, et non 4 : sur une année, la saison doit se compenser. Corrigez chacun : coefficient brut × 4 ÷ ${dec(x.p.sommeBrute, 4)}. Donnez les 4 coefficients corrigés, au centième.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        return x.p.coefficients.map((k, i) => ({
          libelle: `Coefficient corrigé du trimestre ${i + 1}`,
          attendu: auCentime(k),
          tolerance: 0.01,
          calcul: `${dec(x.p.coefficientsBruts[i]!, 4)} × 4 ÷ ${dec(x.p.sommeBrute, 4)} = ${dec(k, 4)}`,
        }));
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `Corrigés, les coefficients font 4 : ce que le trimestre 4 prend au-dessus de la tendance, les 3 autres le laissent en dessous. Pour prévoir, gardez-les à 4 décimales : ${x.p.coefficients.map((k) => dec(k, 4)).join(" ; ")}. Au centième, la prévision perdrait plusieurs dizaines d'articles.`,
        ];
      },
    },
    {
      id: "predire-la-saison",
      type: "choix",
      titre: "Pariez sur le trimestre calme",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Pariez. Au trimestre 1 de N, la tendance vaut ${dec(x.t1.tendance)} articles et le coefficient du trimestre ${dec(x.t1.coefficient, 4)}. Combien d'articles faudra-t-il demander à la boutique pour que ce trimestre tienne sa tendance ?`;
      },
      options: (c) => {
        const x = previsionDesVentes(c);
        const voir = "Faites varier la demande du trimestre à l'étape suivante : le curseur montre ce qu'elle vaut une fois la saison retirée.";
        return [
          { texte: `Environ ${art(x.t1.prevision)} : la tendance × le coefficient`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${art(x.t1.tendance)} : la tendance elle-même`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `Environ ${art(x.t1.tendance / x.t1.coefficient)} : la tendance ÷ le coefficient`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-saison-au-curseur",
      type: "curseur",
      titre: "Retirez la saison",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Faites varier la demande du trimestre 1 de N, de ${art(DEMANDE_DU_CURSEUR.min)} à ${art(DEMANDE_DU_CURSEUR.max)} articles. Une droite donne cette demande corrigée des variations saisonnières (divisée par le coefficient, ${dec(x.t1.coefficient, 4)}), l'autre la tendance du trimestre. Le tableau les lit en chiffre d'affaires, au prix moyen d'un article de janvier, ${eur(x.prixMoyen)}. Placez le curseur sur la plus petite demande qui tient la tendance, puis validez.`;
      },
      grandeur: () => ({ libelle: "Demande du trimestre 1 de N", unite: "articles" }),
      cible: (c) => ({ attendu: previsionDesVentes(c).demandeQuiTientLaTendance, min: DEMANDE_DU_CURSEUR.min, max: DEMANDE_DU_CURSEUR.max }),
      zones: ["Dans la tendance", "Sous la tendance"],
      rates: () => ({
        dessous: "À cette demande, même saison retirée, le trimestre reste sous sa tendance.",
        dessus: "Plus bas, le trimestre tient encore sa tendance : cherchez la plus petite demande.",
      }),
      montrer: "Montrer la demande",
      lecture: (c, q) => {
        const x = previsionDesVentes(c);
        const k = x.t1.coefficient;
        return [
          { libelle: "Chiffre d'affaires du trimestre", montant: auCentime(q * x.prixMoyen) },
          { libelle: "Le même, corrigé des variations saisonnières", montant: auCentime((q / k) * x.prixMoyen) },
          { libelle: "Chiffre d'affaires de la tendance", montant: auCentime(x.t1.tendance * x.prixMoyen) },
          { libelle: "Corrigé moins tendance", montant: auCentime((q / k - x.t1.tendance) * x.prixMoyen), fort: true },
        ];
      },
      droites: (c) => {
        const x = previsionDesVentes(c);
        return { produit: (q) => q / x.t1.coefficient, cout: () => x.t1.tendance, libelles: ["Demande corrigée de la saison", "Tendance du trimestre 1 de N"] };
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `À ${art(x.demandeQuiTientLaTendance)} articles, le trimestre tient sa tendance : ${art(x.demandeQuiTientLaTendance)} ÷ ${dec(x.t1.coefficient, 4)} = ${dec(x.demandeQuiTientLaTendance / x.t1.coefficient)}, pour ${dec(x.t1.tendance)}. C'est la prévision du trimestre, ${dec(x.t1.prevision)} articles, à l'article supérieur : un trimestre 1 à ce niveau n'est pas en retard, même ${art(x.t1.tendance - x.t1.prevision)} articles sous la tendance. La saison l'explique.`,
          "Diviser par le coefficient retire la saison : on dit que la demande est corrigée des variations saisonnières. C'est ainsi qu'un trimestre se compare à sa tendance, et c'est l'inverse de la prévision, qui la remet en multipliant.",
        ];
      },
    },
    {
      id: "la-prevision",
      type: "montants",
      titre: "La prévision de l'année N",
      notions: ["seasonality"],
      question: () =>
        "Sans formule cette fois : prévoyez la demande des trimestres 1 et 4 de N, puis celle de toute l'année N, à l'article près, avec les coefficients corrigés à 4 décimales.",
      champs: (c) => {
        const x = previsionDesVentes(c);
        const p = x.p.previsions;
        return [
          { libelle: "Tendance du trimestre 1 de N", attendu: auCentime(x.t1.tendance), tolerance: 0.05, calcul: `${dec(x.a)} × 13 + ${dec(x.b)} = ${dec(x.t1.tendance)}` },
          { libelle: "Prévision du trimestre 1 de N", attendu: Math.round(x.t1.prevision), tolerance: 2, calcul: `${dec(x.t1.tendance)} × ${dec(x.t1.coefficient, 4)} = ${art(x.t1.prevision)}` },
          {
            libelle: "Prévision du trimestre 4 de N",
            attendu: Math.round(x.t4.prevision),
            tolerance: 2,
            calcul: `(${dec(x.a)} × 16 + ${dec(x.b)}) × ${dec(x.t4.coefficient, 4)} = ${dec(x.t4.tendance)} × ${dec(x.t4.coefficient, 4)} = ${art(x.t4.prevision)}`,
          },
          { libelle: "Prévision de l'année N", attendu: Math.round(x.p.totalPrevu), tolerance: 4, calcul: `${p.map((q) => art(q.prevision)).join(" + ")} = ${art(x.p.totalPrevu)}` },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const budget = Object.values(x.f.budget.ventesPrevues).reduce((t, v) => t + v, 0);
        return [
          `${x.f.entreprise} doit s'attendre à ${art(x.t1.prevision)} articles demandés au trimestre 1 de N et ${art(x.t4.prevision)} au trimestre 4, ${art(x.p.totalPrevu)} sur l'année. Le budget du trimestre 1 reprend la prévision, arrondie à la dizaine : ${art(budget)} articles.`,
          `Au trimestre 4, la réserve n'a servi que ${art(x.fort.n1.ventes)} articles en N − 1 : il en faudra ${art(x.t4.prevision - x.fort.n1.ventes)} de plus, ou des ventes manquées encore.`,
        ];
      },
    },
    {
      id: "le-mois-de-janvier",
      type: "montants",
      titre: "Janvier face à la prévision",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Janvier de N est passé : ${art(x.demandeDeJanvier)} articles demandés. La simulation suppose que les 3 mois d'un trimestre pèsent autant. Calculez la demande du trimestre 1 au rythme de janvier, son écart à la prévision du trimestre en pourcentage, au centième, puis cette demande corrigée des variations saisonnières. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        return [
          { libelle: "Demande du trimestre au rythme de janvier", attendu: x.trimestreAuRythme, calcul: `${art(x.demandeDeJanvier)} × 3 = ${art(x.trimestreAuRythme)}` },
          {
            libelle: "Écart à la prévision du trimestre (%)",
            attendu: auCentime(x.ecartDeJanvier * 100),
            tolerance: 0.05,
            calcul: `(${art(x.trimestreAuRythme)} − ${dec(x.t1.prevision)}) ÷ ${dec(x.t1.prevision)} × 100 = ${pct(auCentime(x.ecartDeJanvier * 100))}`,
          },
          {
            libelle: "Demande corrigée des variations saisonnières",
            attendu: auCentime(x.janvierCorrige),
            tolerance: 3,
            calcul: `${art(x.trimestreAuRythme)} ÷ ${dec(x.t1.coefficient, 4)} = ${dec(x.janvierCorrige)}, pour une tendance de ${dec(x.t1.tendance)}`,
          },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        return [
          `Au rythme de janvier, le trimestre ferait ${art(x.trimestreAuRythme)} articles, ${pct(auCentime(-x.ecartDeJanvier * 100))} sous la prévision. Corrigé de la saison, il fait ${art(x.janvierCorrige)} articles pour une tendance de ${art(x.t1.tendance)} : le même retard, puisque la prévision contient déjà la saison.`,
        ];
      },
    },
    {
      id: "ce-que-dit-janvier",
      type: "choix",
      titre: "Ce que dit janvier",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Le directeur lit : ${art(x.trimestreAuRythme)} articles au rythme de janvier, pour ${art(x.t1.prevision)} prévus. Que lui dites-vous ?`;
      },
      options: (c) => {
        const x = previsionDesVentes(c);
        return [
          {
            texte: "La demande est en retard : la saison n'y est pour rien, la prévision la contient déjà",
            juste: true,
            retour: `Oui. La prévision est la tendance × ${dec(x.t1.coefficient, 4)} : un trimestre 1 calme y est déjà compté. Le retard de ${pct(auCentime(-x.ecartDeJanvier * 100))} est celui de la demande ; il se suit en février et en mars, et les réassorts du trimestre s'ajustent.`,
          },
          {
            texte: "Rien d'anormal : le trimestre 1 est toujours le plus faible après le trimestre 2",
            juste: false,
            retour: `Non : c'est confondre la saison et l'écart. La saison explique que le trimestre 1 soit sous sa tendance de ${art(x.t1.tendance)} articles ; elle n'explique pas qu'il soit sous sa prévision, qui l'a déjà retirée.`,
          },
          {
            texte: "Il faut refaire la droite des moindres carrés avec janvier",
            juste: false,
            retour: "Non : la droite se trace sur des trimestres. Un mois n'est pas un point de la série, et un seul mois ne fait pas une tendance.",
          },
        ];
      },
    },
    {
      id: "predire-les-trimestres-bruts",
      type: "choix",
      titre: "Pariez sur les trimestres bruts",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Pariez. Et si l'on traçait la droite des moindres carrés directement sur les 12 trimestres bruts, sans les moyennes mobiles ? Sa pente, face aux ${dec(x.a)} articles de la méthode, serait…`;
      },
      options: () => {
        const voir = "Le laboratoire de l'étape suivante trace les deux droites sur la série : regardez-les.";
        return [
          { texte: "Plus forte : chaque année finit sur le trimestre de Noël", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "La même : les moindres carrés lissent déjà la saison", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Plus faible : les trimestres creux tirent la droite vers le bas", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-methode",
      type: "simulation",
      titre: "Le laboratoire de la méthode",
      notions: ["seasonality", "stock"],
      question: () =>
        "Choisissez la série (la demande, ou les ventes plafonnées) et la méthode (la droite sur les moyennes mobiles, ou sur les trimestres bruts), puis faites glisser le trimestre lu, du rang 1 (trimestre 1 de N − 3) au rang 16 (trimestre 4 de N). Le graphique trace la série puis sa prévision, la droite de tendance, et le modèle (tendance × coefficient) ; le tableau lit le trimestre choisi.",
      leviers: () => [
        { code: "rang", libelle: "Rang du trimestre lu", unite: "", min: 1, max: 16, pas: 1, depart: 12 },
        {
          code: "methode",
          libelle: "Droite tracée sur",
          unite: "",
          min: METHODES_DU_LABORATOIRE["moyennes-mobiles"],
          max: METHODES_DU_LABORATOIRE["trimestres-bruts"],
          pas: 1,
          depart: METHODES_DU_LABORATOIRE["moyennes-mobiles"],
          choix: [
            { valeur: METHODES_DU_LABORATOIRE["moyennes-mobiles"], libelle: "Les moyennes mobiles" },
            { valeur: METHODES_DU_LABORATOIRE["trimestres-bruts"], libelle: "Les trimestres bruts" },
          ],
        },
        {
          code: "serie",
          libelle: "Série",
          unite: "",
          min: SERIES_DU_LABORATOIRE.demande,
          max: SERIES_DU_LABORATOIRE.ventes,
          pas: 1,
          depart: SERIES_DU_LABORATOIRE.demande,
          choix: [
            { valeur: SERIES_DU_LABORATOIRE.demande, libelle: "La demande" },
            { valeur: SERIES_DU_LABORATOIRE.ventes, libelle: "Les ventes" },
          ],
        },
      ],
      lecture: (c, p) => {
        const x = previsionDesVentes(c);
        const l = laboratoireDeLaMethode(x, p.rang!, p.methode!, p.serie!);
        const d = laboratoireDeLaMethode(x, 12, METHODES_DU_LABORATOIRE["moyennes-mobiles"], SERIES_DU_LABORATOIRE.demande);
        return [
          { libelle: "Pente de la droite", montant: auCentime(l.pente), reference: auCentime(d.pente), unite: "articles par trimestre" },
          { libelle: "Tendance du trimestre lu", montant: Math.round(l.tendance), reference: Math.round(d.tendance), unite: "articles" },
          { libelle: "Coefficient saisonnier du trimestre lu", montant: auCentime(l.coefficient), reference: auCentime(d.coefficient), unite: "fois la tendance" },
          { libelle: "Modèle au trimestre lu (tendance × coefficient)", montant: Math.round(l.prevision), reference: Math.round(d.prevision), unite: "articles" },
          { libelle: "Prévision du trimestre 4 de N", montant: Math.round(l.t4DeN), reference: Math.round(d.t4DeN), unite: "articles", fort: true },
          { libelle: "Prévision de l'année N", montant: Math.round(l.anneeN), reference: Math.round(d.anneeN), unite: "articles" },
        ];
      },
      // La série et sa prévision ne sont pas une droite : le graphique les trace trimestre par trimestre.
      graphique: (c) => {
        const x = previsionDesVentes(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDeLaMethode(x, p.rang!, p.methode!, p.serie!).courbes;
        return {
          levier: "rang",
          unite: "articles",
          courbes: [
            { libelle: "Série observée, puis prévue", valeur: (p) => Math.round(lire(p).observee(p.rang!)) },
            { libelle: "Droite de tendance", valeur: (p) => Math.round(lire(p).droite(p.rang!)) },
            { libelle: "Tendance × coefficient", valeur: (p) => Math.round(lire(p).modele(p.rang!)) },
          ],
        };
      },
      defi: (c) => {
        const x = previsionDesVentes(c);
        const lire = (p: Readonly<Record<string, number>>) => laboratoireDeLaMethode(x, p.rang!, p.methode!, p.serie!);
        return {
          consigne: `Un consultant annonce ${art(x.previsionDuConsultant)} articles pour le trimestre 4 de N. Retrouvez la série et la méthode qui donnent ce chiffre, et lisez-le au trimestre lu.`,
          atteint: (p) => p.rang === 16 && Math.round(lire(p).prevision) === x.previsionDuConsultant,
          indice: (p) => {
            const l = lire(p);
            return p.rang !== 16
              ? `Le tableau lit le rang ${p.rang}, le ${trimestreDuRang(p.rang!).libelle} : placez le trimestre lu sur le trimestre 4 de N, le rang 16.`
              : `Cette série et cette méthode prévoient ${art(l.t4DeN)} articles au trimestre 4 de N : changez de méthode ou de série.`;
          },
          solution: { rang: 16, methode: METHODES_DU_LABORATOIRE["trimestres-bruts"], serie: SERIES_DU_LABORATOIRE.demande },
        };
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const ventes = laboratoireDeLaMethode(x, 16, METHODES_DU_LABORATOIRE["moyennes-mobiles"], SERIES_DU_LABORATOIRE.ventes);
        return [
          `Le consultant a tracé sa droite sur les trimestres bruts : sa pente vaut ${dec(x.brute.droite.a)} articles, près de 4 fois les ${dec(x.a)} de la méthode, et il prévoit ${art(x.previsionDuConsultant)} articles à Noël, ${art(x.previsionDuConsultant - x.t4.prevision)} de plus que la méthode. Sur le graphique, sa droite part sous celle des moyennes mobiles et finit bien au-dessus : chaque année finit sur Noël, et la droite prend la saison pour de la croissance.`,
          `Sur la série des ventes, la méthode prévoit ${art(ventes.t4DeN)} articles au trimestre 4 de N, contre ${art(x.t4.prevision)} sur la demande : la réserve trop petite de N − 1 serait reconduite. La bonne prévision demande la bonne série et la bonne méthode à la fois.`,
        ];
      },
    },
    {
      id: "la-critique",
      type: "montants",
      titre: "La critique des trimestres bruts",
      notions: ["seasonality"],
      tableau: tableauDesTroisAnnees,
      question: (c) => {
        const x = previsionDesVentes(c);
        return `Refaites le calcul du consultant. Sur les 12 trimestres bruts, x̄ = ${qte(x.brute.droite.xMoyen)}, ȳ = ${dec(x.yMoyenBrut)}, Σ (x − x̄)² = ${qte(x.sommeDesCarresBrute)} et Σ (x − x̄)(y − ȳ) = ${qte(auCentime(x.sommeDesProduitsBrute))}. Calculez sa pente, au centième, puis le rapport demande ÷ tendance brute du trimestre 4 de N − 3 et de N − 1, au centième.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        const { n3, n1 } = x.fort;
        const a = x.brute.droite.a;
        const b = x.brute.droite.b;
        return [
          {
            libelle: "Pente de la droite des trimestres bruts",
            attendu: auCentime(a),
            tolerance: 0.01,
            calcul: `${qte(auCentime(x.sommeDesProduitsBrute))} ÷ ${qte(x.sommeDesCarresBrute)} = ${dec(a)}, et b = ${dec(x.yMoyenBrut)} − ${dec(a)} × ${qte(x.brute.droite.xMoyen)} = ${dec(b)}`,
          },
          {
            libelle: "Rapport du trimestre 4 de N − 3 à la tendance brute",
            attendu: auCentime(x.rapportBrut.n3),
            tolerance: 0.01,
            calcul: `${qte(n3.demande)} ÷ (${dec(a)} × ${n3.rang} + ${dec(b)}) = ${qte(n3.demande)} ÷ ${dec(x.tendanceBrute(n3.rang))} = ${dec(x.rapportBrut.n3, 4)}`,
          },
          {
            libelle: "Rapport du trimestre 4 de N − 1 à la tendance brute",
            attendu: auCentime(x.rapportBrut.n1),
            tolerance: 0.01,
            calcul: `${qte(n1.demande)} ÷ (${dec(a)} × ${n1.rang} + ${dec(b)}) = ${qte(n1.demande)} ÷ ${dec(x.tendanceBrute(n1.rang))} = ${dec(x.rapportBrut.n1, 4)}`,
          },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const rapports = [x.fort.n3.rapport, x.fort.n2.rapport, x.fort.n1.rapport];
        return [
          `Sur la droite brute, le rapport du trimestre 4 tombe de ${dec(x.rapportBrut.n3)} à ${dec(x.rapportBrut.n1)} en deux ans : la saison semble s'user. Sur les moyennes mobiles, il reste entre ${dec(Math.min(...rapports))} et ${dec(Math.max(...rapports))}. Ce n'est pas la saison qui dérive : c'est la droite qui monte trop vite.`,
          `Moyenner des rapports qui dérivent donne un coefficient qui ne vaut pour aucune année, et une droite trop raide prolongée sur N donne ${art(x.previsionDuConsultant)} articles à Noël.`,
        ];
      },
    },
    {
      id: "pourquoi-la-droite-brute-trompe",
      type: "choix",
      titre: "Pourquoi la droite brute trompe",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        return `La droite des trimestres bruts monte de ${dec(x.brute.droite.a)} articles par trimestre, celle des moyennes mobiles de ${dec(x.a)}. D'où vient la différence ?`;
      },
      options: () => [
        {
          texte: "Le trimestre 4 tombe toujours en fin d'année : la droite prend la saison pour de la croissance",
          juste: true,
          retour: "Oui. Dans chaque année, la série monte du trimestre 2 au trimestre 4 ; les moindres carrés lisent ces montées comme une tendance. Les moyennes mobiles comptent chaque saison une fois par point : il ne reste que la tendance.",
        },
        {
          texte: "Elle compte 12 points au lieu de 8, et plus de points donnent plus de pente",
          juste: false,
          retour: "Non : le nombre de points ne fait pas la pente. Les 4 points de plus sont ceux des bords, et la pente monte parce que chaque année finit sur Noël.",
        },
        {
          texte: "Les ventes du trimestre 4 ont été plafonnées par la réserve",
          juste: false,
          retour: "Non : les deux droites se tracent sur la demande, qui n'est pas plafonnée. Le plafond des ventes ferait l'erreur inverse : une prévision trop basse.",
        },
      ],
    },
    {
      id: "une-autre-methode",
      type: "montants",
      titre: "Variante : la droite des totaux annuels",
      notions: ["seasonality"],
      question: (c) => {
        const x = previsionDesVentes(c);
        const [t1, t2, t3] = x.annuelle.totaux;
        return `Une autre méthode, honnête aussi : la droite des moindres carrés sur les 3 totaux annuels (${art(t1!)}, ${art(t2!)} et ${art(t3!)}, x de 1 à 3), prolongée à x = 4 pour N ; puis un coefficient du trimestre 4, moyenne de ses 3 rapports à la moyenne trimestrielle de son année. Calculez la pente annuelle, la demande prévue pour N, puis la prévision du trimestre 4 de N, avec le coefficient à 4 décimales.`;
      },
      champs: (c) => {
        const x = previsionDesVentes(c);
        const t = x.annuelle;
        const [y1, y2, y3] = t.totaux;
        const k4 = t.coefficients[3]!;
        const t4 = t.previsions[3]!;
        return [
          { libelle: "Pente annuelle", attendu: auCentime(t.droite.a), tolerance: 0.5, calcul: `(${art(y3!)} − ${art(y1!)}) ÷ 2 = ${dec(t.droite.a)}, les 3 années étant à égale distance du milieu` },
          { libelle: "Demande prévue pour l'année N", attendu: auCentime(t.anneeN), tolerance: 1, calcul: `(${art(y1!)} + ${art(y2!)} + ${art(y3!)}) ÷ 3 + ${dec(t.droite.a)} × (4 − 2) = ${dec(t.anneeN)}` },
          {
            libelle: "Prévision du trimestre 4 de N par cette méthode",
            attendu: auCentime(t4),
            tolerance: 3,
            calcul: `coefficient = (${[x.fort.n3, x.fort.n2, x.fort.n1].map((s, i) => `${qte(s.demande)} ÷ (${art(t.totaux[i]!)} ÷ 4)`).join(" + ")}) ÷ 3 = ${dec(k4, 4)} ; ${dec(t.anneeN)} ÷ 4 × ${dec(k4, 4)} = ${dec(t4)}`,
          },
        ];
      },
      explication: (c) => {
        const x = previsionDesVentes(c);
        const t = x.annuelle;
        return [
          `Les totaux annuels effacent la saison, comme les moyennes mobiles : la droite des années prévoit ${art(t.anneeN)} articles pour N, la méthode du chapitre ${art(x.p.totalPrevu)}, ${art(Math.abs(t.anneeN - x.p.totalPrevu))} d'écart. Au trimestre 4, ${art(t.previsions[3]!)} contre ${art(x.t4.prevision)}.`,
          `Deux méthodes qui retirent la saison se rejoignent ; la droite des trimestres bruts, qui la garde, prévoit ${art(x.brute.totalPrevu)} articles pour l'année. Quand deux méthodes s'accordent et qu'une troisième s'en écarte autant, c'est la troisième qu'il faut regarder.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["seasonality"],
      tableau: (c) => tableauDeLaPrevision(previsionDesVentes(c)),
      texte: (c) => {
        const x = previsionDesVentes(c);
        return [
          `On prévoit sur la demande, pas sur les ventes plafonnées. Les moyennes mobiles centrées effacent la saison ; la droite des moindres carrés tracée sur elles donne la tendance, y = ${dec(x.a)} x + ${dec(x.b)} ; le rapport de chaque trimestre à sa tendance, moyenné puis corrigé pour que les 4 coefficients fassent 4, donne la saison ; la prévision est la tendance × le coefficient : ${art(x.p.totalPrevu)} articles pour N.`,
          "Deux pièges. La pente se lit par trimestre, saison retirée. Et une droite tracée sur les trimestres bruts prend la saison pour de la croissance : sa pente gonfle, ses rapports dérivent, sa prévision s'envole. Pour juger un trimestre, on le corrige des variations saisonnières avant de comparer ce trimestre à sa tendance.",
          "Au niveau de l'examen, vous savez calculer des moyennes mobiles centrées, ajuster une droite par les moindres carrés, calculer et corriger des coefficients saisonniers, prévoir une année, retrouver à rebours quand la tendance atteint un niveau, et critiquer une méthode qui garde la saison.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "a = Σ (x − x̄)(y − ȳ) ÷ Σ (x − x̄)², b = ȳ − a x̄. Coefficient saisonnier = moyenne des rapports demande ÷ tendance, × 4 ÷ leur somme. Prévision = (a × rang + b) × coefficient. Demande corrigée des variations saisonnières = demande ÷ coefficient.",
    },
  ],
};
