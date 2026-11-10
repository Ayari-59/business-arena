import { eur, nombreAuCentieme, pct as enPoints } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import {
  EMPLOIS_CREES,
  EQUIPEMENTS_D_EFFICACITE,
  HAUSSE_ATTENDUE_DU_KWH,
  KWH_ECONOMISES_PAR_AN,
  KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE,
  LEVIERS_DE_LA_FICHE,
  PRET_VERT,
  PRIX_DU_KWH,
  SUBVENTION_DE_L_EFFICACITE,
  TAUX_DE_SUBVENTION,
  criteresExtraFinanciers,
  deuxProjetsDurables,
  type LeviersDeLaTransition,
} from "../monde/investissement-durable";
import { KG_CO2_PAR_KWH } from "../monde/tableau-de-bord-durable";
import { PROJET_LIGNE_MANUELLE, PROJET_LIGNE_SEMI_AUTOMATIQUE, TAUX_DE_L_IMPOT_DES_PROJETS, TAUX_D_ACTUALISATION_DE_NOVA } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : ÉVALUER UN INVESTISSEMENT DURABLE (comptabilité générale, palier 4 ; DCG UE6, 2.4,
 * programme de 2025).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les deux projets qui s'excluent du chapitre « Le TRI et le
 * choix entre deux projets » (projets-et-financement.ts), A la seconde ligne manuelle et B la ligne
 * semi-automatique, leurs flux et leurs VAN à 9 % (finance.ts) ; la transition écologique et ses
 * hypothèses dans monde/investissement-durable.ts. NOVA retient A durable : la seconde ligne que la
 * comptabilité approfondie amortit par composants, et que le diagnostic de trois exercices retrouve
 * dans les comptes (une seule NOVA).
 *
 * L'objet : les critères extra-financiers (les objectifs de développement durable, l'éligibilité et
 * l'alignement à la taxonomie verte, les critères ESG) ; la transition dans les flux (le coût
 * supplémentaire des équipements d'efficacité, la subvention, l'électricité économisée, les risques
 * futurs réduits) et dans le taux (un prêt vert moins cher) ; un choix argumenté entre deux projets ;
 * le Donut, en lecture.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, les-odd, eligible-et-aligne, flux-ou-taux (le tri) ;
 *   · l'expérience avant la formule : predire-l-efficacite avant les-flux-de-l-efficacite ;
 *     predire-sans-aide puis le-laboratoire-de-la-transition (la hausse attendue de l'électricité, la
 *     subvention, le taux du prêt vert ; un graphique des deux VAN selon la hausse) avant argumenter ;
 *   · autonome : les-flux-de-l-efficacite, le-risque-de-b, le-taux-vert, les-criteres-extra-financiers ;
 *   · expert : argumenter, les-limites, le-donut ; et la synthèse.
 */

/** Les projets de la gamme sont ceux de NOVA. */
export const ENTREPRISES_DE_L_INVESTISSEMENT_DURABLE: readonly string[] = ["nova"];

/** Les bornes des leviers du laboratoire : la hausse attendue en €/kWh, la subvention et le taux du prêt vert en %. */
export const LEVIERS_DE_LA_TRANSITION = {
  hausse: { min: 0, max: 0.25, pas: 0.01 },
  subvention: { min: 0, max: 50, pas: 10 },
  tauxVert: { min: 2, max: 5, pas: 0.5 },
} as const;

/** La solution que montre la correction : sans aide ni prêt vert, la hausse attendue la plus basse où A durable reste devant B. */
export const SOLUTION_DE_LA_TRANSITION = { hausse: 0.18, subvention: 0, tauxVert: 5 } as const;

/** Un nombre au centième (deux décimales s'il n'est pas entier), ou à `decimales` chiffres quand on les demande. */
const qte = (n: number, decimales = 2) => (decimales === 2 ? nombreAuCentieme(n) : (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: decimales }).replace(/^-/, "−"));
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const t = TAUX_DE_L_IMPOT_DES_PROJETS;

/** Les deux projets et leurs critères, à la fiche. */
export function projetsDuChapitre(_c?: Pick<Cas, "code">) {
  return { ...deuxProjetsDurables(), extra: criteresExtraFinanciers() };
}

/** Une position du laboratoire, en leviers de la transition. */
export const leviersDeLaPosition = (p: Readonly<Record<string, number>>): LeviersDeLaTransition => ({
  prixDuKwh: PRIX_DU_KWH,
  hausseAttendue: p.hausse!,
  tauxDeSubvention: p.subvention! / 100,
  tauxVert: p.tauxVert! / 100,
});

/** Le laboratoire à une position. */
export const laboratoireDeLaTransition = (p: Readonly<Record<string, number>>) => deuxProjetsDurables(leviersDeLaPosition(p));

/** Les deux projets, côte à côte : ce que l'étude financière a déjà dit, et ce qu'elle n'a pas compté. */
function lesDeuxProjets(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = projetsDuChapitre(c);
  const invest = (p: typeof PROJET_LIGNE_MANUELLE) => p.actifs.reduce((s, a) => s + a.montant, 0);
  return {
    titre: "Les deux projets de la gamme, de N + 1 à N + 5",
    colonnes: ["A, ligne manuelle", "B, semi-automatique"],
    lignes: [
      { libelle: "Investissement, moules compris", valeurs: [eur(invest(PROJET_LIGNE_MANUELLE)), eur(invest(PROJET_LIGNE_SEMI_AUTOMATIQUE))] },
      { libelle: `VAN à ${pct(x.taux)}`, valeurs: [eur(x.vanDeA), eur(x.vanDeB)] },
      { libelle: "Opérateurs de plus", valeurs: [qte(EMPLOIS_CREES.A), qte(EMPLOIS_CREES.B)] },
      { libelle: "Électricité en plus du projet A, par an", valeurs: ["", `${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh`] },
      { libelle: "Option : équipements d'efficacité énergétique", valeurs: [eur(EQUIPEMENTS_D_EFFICACITE.montant), ""] },
      { libelle: "Électricité qu'ils économisent, par an", valeurs: [`${qte(KWH_ECONOMISES_PAR_AN)} kWh`, ""] },
      { libelle: "Subvention de l'efficacité énergétique", valeurs: [pct(TAUX_DE_SUBVENTION), ""] },
      { libelle: "Prêt vert, sur une part du projet", valeurs: [`${pct(PRET_VERT.part)} à ${pct(PRET_VERT.tauxVert)}, au lieu de ${pct(PRET_VERT.tauxClassique)}`, ""] },
      { libelle: "Prix de l'électricité, et hausse attendue", valeurs: [`${qte(PRIX_DU_KWH)} € le kWh, ${qte(HAUSSE_ATTENDUE_DU_KWH)} € de hausse`, "les mêmes"] },
    ],
  };
}

export const EVALUER_UN_INVESTISSEMENT_DURABLE: Chapitre = {
  code: "evaluer-un-investissement-durable",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["DCG UE6 · Finance d'entreprise"],
  titre: "Évaluer un investissement durable",
  accroche:
    "À 9 %, la ligne semi-automatique a la meilleure VAN. Faites entrer la transition écologique dans les flux (un coût de plus, une subvention, une hausse de l'électricité évitée) et dans le taux (un prêt vert). Ajoutez les objectifs de développement durable, la taxonomie verte et les critères ESG : le choix se retourne, et il faut l'argumenter.",
  objectifs: [
    "Apprécier un projet par des critères extra-financiers : objectifs de développement durable, taxonomie verte, critères ESG",
    "Intégrer la transition écologique dans les flux d'un projet : coût supplémentaire, subvention, risques futurs réduits",
    "Intégrer un financement vert dans le taux d'actualisation, et en mesurer l'effet sur la VAN",
    "Argumenter le choix entre deux projets avec des considérations financières et extra-financières",
  ],
  libre: false,
  prerequis: ["la-valeur-actuelle-nette", "le-tri-et-le-choix-entre-deux-projets"],
  entreprises: {
    codes: ENTREPRISES_DE_L_INVESTISSEMENT_DURABLE,
    pourquoi: "le chapitre reprend les projets de la gamme de NOVA, ceux des chapitres sur la VAN et le TRI, dans la simulation du cours.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux projets, et ce que la VAN n'a pas compté",
      notions: ["discounting", "csr_index"],
      tableau: lesDeuxProjets,
      texte: (c) => {
        const x = projetsDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, au 1er janvier N + 1. NOVA lance sa gamme sur une seconde ligne, et hésite entre deux projets qui s'excluent : A, une ligne manuelle, et B, une ligne semi-automatique. Au coût du capital de son activité, ${pct(x.taux)}, B l'emporte : ${eur(x.vanDeB)} de VAN contre ${eur(x.vanDeA)}.`,
          "Cette VAN a été calculée en univers certain, sur des flux d'aujourd'hui. Elle ne compte ni l'électricité dont le prix va monter, ni une aide publique à l'efficacité énergétique, ni un financement vert moins cher, ni ce que chaque projet fait à l'environnement et aux salariés. Le programme demande d'aller au-delà du seul calcul financier.",
          `Ce que la simulation suppose : l'électricité coûte ${qte(PRIX_DU_KWH)} € le kWh, et une hausse moyenne de ${qte(HAUSSE_ATTENDUE_DU_KWH)} € est attendue sur les cinq ans. B consomme ${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh de plus par an que le projet A ; A peut recevoir des équipements d'efficacité énergétique (${eur(EQUIPEMENTS_D_EFFICACITE.montant)}, subventionnés à ${pct(TAUX_DE_SUBVENTION)}) et un prêt vert. L'impôt est de ${pct(t)}.`,
        ];
      },
      repere: () => "Un investissement durable se juge en trois temps : ses critères extra-financiers, la transition dans ses flux, la transition dans son taux.",
    },
    {
      id: "les-odd",
      objectifs: [0],
      type: "choix",
      titre: "Les objectifs de développement durable",
      notions: ["csr_index"],
      question: () =>
        "Les Nations unies ont fixé 17 objectifs de développement durable (ODD) pour 2030. Une entreprise s'en sert pour dire à quoi contribue un projet. Lesquels A durable sert-il le plus directement ?",
      options: () => [
        {
          texte: "Le 7 et le 13 (énergie, climat), et le 8 par ses emplois",
          juste: true,
          retour:
            "Oui. L'ODD 7 (énergie propre et d'un coût abordable) et l'ODD 13 (lutte contre les changements climatiques) par l'électricité économisée ; l'ODD 8 (travail décent et croissance) par deux postes au lieu d'un. Le 12 (consommation et production responsables) se discute : la ligne ne change ni les composants ni les emballages.",
        },
        {
          texte: "Tous les 17 : un projet qui économise de l'énergie contribue à chacun des objectifs de développement durable",
          juste: false,
          retour: "Citer tous les ODD, c'est n'en démontrer aucun : un projet se rattache aux quelques objectifs auxquels il contribue de façon mesurable.",
        },
        {
          texte: "Le 3, bonne santé et bien-être, parce que l'atelier sera mieux éclairé",
          juste: false,
          retour: "L'éclairage aide, mais c'est un effet secondaire. Le cœur du projet est l'énergie, le climat et l'emploi.",
        },
      ],
    },
    {
      id: "eligible-et-aligne",
      objectifs: [0],
      type: "choix",
      titre: "Éligible, aligné",
      notions: ["csr_index"],
      question: (c) => {
        const x = projetsDuChapitre(c);
        return `La taxonomie verte européenne classe les activités qui contribuent à six objectifs environnementaux. Les équipements d'efficacité énergétique du projet A (${eur(EQUIPEMENTS_D_EFFICACITE.montant)}) relèvent d'une activité qu'elle liste : ils sont éligibles. La ligne et les moules, non. Que faut-il de plus pour que ces ${eur(EQUIPEMENTS_D_EFFICACITE.montant)}, soit ${pct(x.extra.partAligneeDeA)} de l'investissement, soient alignés ?`;
      },
      options: () => [
        {
          texte: "Remplir ses critères techniques, ne nuire à aucun autre objectif, respecter les garanties sociales",
          juste: true,
          retour:
            "Oui. Éligible : l'activité figure dans la taxonomie. Aligné : elle y contribue substantiellement selon des critères techniques chiffrés, elle ne cause de préjudice important à aucun des cinq autres objectifs (le principe « ne pas nuire »), et l'entreprise respecte des garanties minimales (droits humains, droit du travail). La part alignée se mesure en chiffre d'affaires, en investissements ou en charges.",
        },
        {
          texte: "Rien : une activité éligible est alignée dès qu'elle est réalisée par l'entreprise, quel que soit son résultat",
          juste: false,
          retour: "Éligible ne veut pas dire aligné : beaucoup d'activités éligibles ne remplissent pas les critères techniques. C'est tout l'écart entre les deux taux que publient les grandes entreprises.",
        },
        {
          texte: "Que toute la ligne soit éligible, moules compris",
          juste: false,
          retour: "L'alignement se juge activité par activité, dépense par dépense : une part alignée de l'investissement suffit à la compter, le reste ne l'est pas.",
        },
      ],
    },
    {
      id: "flux-ou-taux",
      objectifs: [1, 2],
      type: "tri",
      titre: "Dans les flux, ou dans le taux",
      notions: ["discounting"],
      tableau: lesDeuxProjets,
      question: () =>
        "La transition écologique entre dans la décision par deux portes : les flux de trésorerie du projet, ou son taux d'actualisation. Rangez chaque montant.",
      categories: [
        { code: "flux", libelle: "Dans les flux du projet" },
        { code: "taux", libelle: "Dans le taux d'actualisation" },
      ],
      elements: (c) => {
        const x = projetsDuChapitre(c);
        const interetsEpargnes = auCentime(PRET_VERT.part * x.extra.investissementDeA * (PRET_VERT.tauxClassique - PRET_VERT.tauxVert));
        return [
          { libelle: "Le coût des équipements d'efficacité, à la date 0", montant: EQUIPEMENTS_D_EFFICACITE.montant, categorie: "flux", pourquoi: "Un coût supplémentaire de l'investissement : un décaissement à la date 0." },
          { libelle: "La subvention de l'efficacité énergétique", montant: SUBVENTION_DE_L_EFFICACITE, categorie: "flux", pourquoi: "Un encaissement à la date 0, imposé ensuite au rythme où il est viré au résultat." },
          { libelle: "L'électricité économisée chaque année, au prix d'aujourd'hui", montant: x.efficacite.economieAuPrixDuJour, categorie: "flux", pourquoi: "Une charge en moins chaque année, après impôt : un flux d'exploitation." },
          { libelle: "La hausse attendue que le projet A durable évite chaque année", montant: x.efficacite.risqueEvite, categorie: "flux", pourquoi: "Un risque futur réduit : une hausse qu'on ne paiera pas, dans les flux, chaque année." },
          { libelle: "La hausse attendue que B subit chaque année", montant: x.risque.avantImpot, categorie: "flux", pourquoi: "Un risque futur de B, chiffré en flux : la hausse sur l'électricité qu'il consomme en plus." },
          { libelle: "Les intérêts que le prêt vert épargne la première année", montant: interetsEpargnes, categorie: "taux", pourquoi: "Le financement ne se met pas dans les flux d'un projet : son coût est porté par le taux. Un prêt moins cher baisse le taux d'actualisation." },
        ];
      },
      relance: "Ce montant change-t-il ce que le projet encaisse ou décaisse, ou ce que coûte l'argent qui le finance ?",
      explication: () => [
        "Une règle de la VAN : on juge un investissement sans son financement, dont le coût est dans le taux. Le coût supplémentaire, la subvention, l'énergie économisée et les risques réduits sont des flux ; le prêt vert change le taux.",
        "Les compter deux fois (des intérêts épargnés dans les flux et un taux plus bas) serait l'erreur classique.",
      ],
    },
    {
      id: "predire-l-efficacite",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur l'efficacité",
      notions: ["discounting"],
      question: () =>
        `Avant de calculer, pariez. Les équipements d'efficacité coûtent ${eur(EQUIPEMENTS_D_EFFICACITE.montant)}, ${eur(EQUIPEMENTS_D_EFFICACITE.montant - SUBVENTION_DE_L_EFFICACITE)} après subvention, et économisent ${qte(KWH_ECONOMISES_PAR_AN)} kWh par an. À ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, sur cinq ans, leur VAN est…`,
      options: (c) => {
        const x = projetsDuChapitre(c);
        const v = x.vanDeLEfficacite;
        const voir = "Calculez leurs flux à l'étape suivante.";
        const pari = (juste: boolean) => `${juste ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Largement positive : l'énergie rembourse vite", juste: v > 5_000, retour: pari(v > 5_000) },
          { texte: "Proche de zéro", juste: Math.abs(v) <= 5_000, retour: pari(Math.abs(v) <= 5_000) },
          { texte: "Nettement négative : on paie pour la planète", juste: v < -5_000, retour: pari(v < -5_000) },
        ];
      },
    },
    {
      id: "les-flux-de-l-efficacite",
      objectifs: [1],
      type: "montants",
      titre: "Les flux de l'efficacité énergétique",
      notions: ["discounting", "depreciation"],
      question: () =>
        `Les flux que les équipements ajoutent à A, après impôt à ${pct(t)}. À la date 0 : le coût moins la subvention. Chaque année : l'électricité économisée au prix attendu (le prix d'aujourd'hui plus la hausse), après impôt, plus l'économie d'impôt sur la dotation (6 ans), moins l'impôt sur la quote-part de subvention virée au résultat (un sixième). La dernière année, en plus : la revente à 60 % de la valeur nette comptable, nette d'impôt, moins l'impôt sur le sixième de subvention qui restait. Puis la VAN à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}.`,
      champs: (c) => {
        const x = projetsDuChapitre(c);
        const e = x.efficacite;
        const r = TAUX_D_ACTUALISATION_DE_NOVA;
        const termes = e.flux.slice(1).map((f, i) => `${eur(f)} × ${qte(1 + r)}^−${i + 1}`);
        return [
          { libelle: "Flux de la date 0", attendu: e.flux[0]!, calcul: `− ${eur(EQUIPEMENTS_D_EFFICACITE.montant)} + ${eur(e.subvention)} = ${eur(e.flux[0]!)}` },
          {
            libelle: "Flux d'une année ordinaire",
            attendu: e.annuel,
            calcul: `${qte(KWH_ECONOMISES_PAR_AN)} kWh × (${qte(PRIX_DU_KWH)} + ${qte(HAUSSE_ATTENDUE_DU_KWH)}) × ${qte(1 - t)} + ${eur(e.dotation)} × ${qte(t)} − ${eur(e.quotePart)} × ${qte(t)} = ${eur(e.economieApresImpot)} + ${eur(auCentime(e.dotation * t))} − ${eur(auCentime(e.quotePart * t))} = ${eur(e.annuel)}`,
          },
          {
            libelle: "Flux de la dernière année",
            attendu: e.flux.at(-1)!,
            calcul: `${eur(e.annuel)} + ${eur(e.residuel.nette)} de revente nette (${eur(e.residuel.prixDeCession)} + ${eur(-e.residuel.impot)} d'impôt économisé sur la moins-value) − ${eur(e.resteDeSubvention)} × ${qte(t)} = ${eur(e.flux.at(-1)!)}`,
          },
          { libelle: "VAN des équipements d'efficacité", attendu: x.vanDeLEfficacite, calcul: `${eur(e.flux[0]!)} + ${termes.join(" + ")} = ${eur(x.vanDeLEfficacite)}` },
        ];
      },
      explication: (c) => {
        const x = projetsDuChapitre(c);
        const e = x.efficacite;
        return [
          `Les équipements rapportent juste un peu plus qu'ils ne coûtent : ${eur(x.vanDeLEfficacite)} de VAN. Sans la hausse attendue, l'économie serait de ${eur(e.economieAuPrixDuJour)} par an avant impôt, au lieu de ${eur(auCentime(e.economieAuPrixDuJour + e.risqueEvite))} : le risque futur réduit fait une bonne part de leur valeur. Sans la subvention, leur VAN serait négative.`,
          `A durable vaut donc la VAN du projet A plus celle de ses équipements : ${eur(x.vanDeA)} + ${eur(x.vanDeLEfficacite)} = ${eur(x.vanDeADurableA9)}, à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}. Encore loin de B.`,
        ];
      },
    },
    {
      id: "le-risque-de-b",
      objectifs: [1],
      type: "montants",
      titre: "Le risque futur de B",
      notions: ["discounting"],
      question: () =>
        `Sans formule cette fois. B consomme ${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh de plus que le projet A chaque année ; à prix d'aujourd'hui, ses flux les comptent déjà. Chiffrez la hausse attendue qu'il subit chaque année, avant puis après impôt, la VAN de ce risque sur cinq ans à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, et la VAN de B qui en tient compte.`,
      champs: (c) => {
        const x = projetsDuChapitre(c);
        const k = x.risque;
        return [
          { libelle: "Hausse attendue, avant impôt", attendu: k.avantImpot, calcul: `${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} kWh × ${qte(HAUSSE_ATTENDUE_DU_KWH)} € = ${eur(k.avantImpot)}` },
          { libelle: "Hausse attendue, après impôt", attendu: k.apresImpot, calcul: `${eur(k.avantImpot)} × ${qte(1 - t)} = ${eur(k.apresImpot)}` },
          { libelle: "VAN du risque", attendu: x.vanDuRisque, calcul: `− ${eur(k.apresImpot)} × (1 − ${qte(1 + TAUX_D_ACTUALISATION_DE_NOVA)}^−5) ÷ ${qte(TAUX_D_ACTUALISATION_DE_NOVA)} = ${eur(x.vanDuRisque)}` },
          { libelle: "VAN de B, le risque compris", attendu: x.vanDeBAvecLeRisque, calcul: `${eur(x.vanDeB)} ${x.vanDuRisque < 0 ? "−" : "+"} ${eur(Math.abs(x.vanDuRisque))} = ${eur(x.vanDeBAvecLeRisque)}` },
        ];
      },
      explication: (c) => {
        const x = projetsDuChapitre(c);
        return [
          `Le risque futur coûte ${eur(-x.vanDuRisque)} à B en valeur actuelle : la VAN de B tombe à ${eur(x.vanDeBAvecLeRisque)}. Un projet qui consomme plus d'énergie porte plus de risque de transition ; le chiffrer en flux, c'est ne pas le laisser hors du calcul.`,
          `B reste devant A durable à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} (${eur(x.vanDeADurableA9)}). Reste la seconde porte : le taux.`,
        ];
      },
    },
    {
      id: "le-taux-vert",
      objectifs: [2],
      type: "montants",
      titre: "Le prêt vert, dans le taux",
      notions: ["discounting", "loan_schedule"],
      question: () =>
        `La banque finance ${pct(PRET_VERT.part)} du projet A durable par un prêt vert à ${pct(PRET_VERT.tauxVert)} au lieu de ${pct(PRET_VERT.tauxClassique)} : une part de l'investissement est alignée, et le projet réduit le risque énergétique. Le taux d'actualisation du projet A durable est le coût du capital, ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}, moins l'économie du prêt vert après impôt : part × écart de taux × (1 − ${pct(t)}). Calculez-le en pour cent, puis la VAN du projet A durable à ce taux.`,
      champs: (c) => {
        const x = projetsDuChapitre(c);
        return [
          {
            libelle: "Taux d'actualisation du projet A durable (%)",
            attendu: auCentime(x.tauxVert * 100),
            calcul: `${pct(TAUX_D_ACTUALISATION_DE_NOVA)} − ${qte(PRET_VERT.part)} × (${pct(PRET_VERT.tauxClassique)} − ${pct(PRET_VERT.tauxVert)}) × ${qte(1 - t)} = ${pct(x.tauxVert)}`,
            tolerance: 0.01,
          },
          {
            libelle: "VAN du projet A durable au taux vert",
            attendu: x.vanDeADurable,
            calcul: `les flux du projet A durable (${x.aDurable.map((f) => eur(f)).join(" ; ")}), actualisés à ${pct(x.tauxVert)} = ${eur(x.vanDeADurable)}`,
          },
        ];
      },
      explication: (c) => {
        const x = projetsDuChapitre(c);
        return [
          `Au taux vert, A durable vaut ${eur(x.vanDeADurable)}, devant B et son risque (${eur(x.vanDeBAvecLeRisque)}). Le taux joue sur tous les flux du projet A, pas seulement sur ceux de l'efficacité : ${eur(auCentime(x.vanDeADurable - x.vanDeADurableA9))} de VAN en plus pour un peu moins d'un point de taux.`,
          "Un financement vert moins cher et plus facile à obtenir est une réalité pour les projets alignés : la banque les compte dans ses actifs verts et les juge moins risqués. C'est aussi la limite du calcul : sans ce prêt, le classement se retourne.",
        ];
      },
    },
    {
      id: "predire-sans-aide",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sans aide",
      notions: ["discounting"],
      question: () =>
        "Avant le laboratoire, pariez. Sans la subvention et sans le prêt vert, avec la hausse attendue de la fiche, A durable resterait-il devant B ?",
      options: () => {
        const x = deuxProjetsDurables({ tauxDeSubvention: 0, tauxVert: PRET_VERT.tauxClassique });
        const devant = x.vanDeADurable >= x.vanDeBAvecLeRisque;
        const voir = "Faites-le dans le laboratoire, à l'étape suivante.";
        const pari = (juste: boolean) => `${juste ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Oui : l'énergie économisée et le risque évité y suffisent largement", juste: devant, retour: pari(devant) },
          { texte: "Non : B repasserait devant", juste: !devant, retour: pari(!devant) },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-transition",
      objectifs: [1, 2, 3],
      type: "simulation",
      titre: "Le laboratoire de la transition",
      notions: ["discounting", "csr_index"],
      question: () =>
        "Faites varier la hausse attendue de l'électricité, la subvention de l'efficacité et le taux du prêt vert (au taux classique, plus de prêt vert). Le tableau suit la VAN du projet A durable, à son taux, et celle de B avec son risque. Relevez le défi.",
      leviers: () => [
        { code: "hausse", libelle: "Hausse attendue de l'électricité", unite: "€ par kWh", ...LEVIERS_DE_LA_TRANSITION.hausse, depart: LEVIERS_DE_LA_FICHE.hausseAttendue },
        { code: "subvention", libelle: "Subvention de l'efficacité", unite: "%", ...LEVIERS_DE_LA_TRANSITION.subvention, depart: auCentime(LEVIERS_DE_LA_FICHE.tauxDeSubvention * 100) },
        { code: "tauxVert", libelle: "Taux du prêt vert", unite: "%", ...LEVIERS_DE_LA_TRANSITION.tauxVert, depart: auCentime(LEVIERS_DE_LA_FICHE.tauxVert * 100) },
      ],
      lecture: (c, p) => {
        const x = projetsDuChapitre(c);
        const l = laboratoireDeLaTransition(p);
        return [
          { libelle: "Taux d'actualisation du projet A durable", montant: auCentime(l.tauxVert * 100), unite: "%", reference: auCentime(x.tauxVert * 100) },
          { libelle: "VAN du projet A durable, à son taux", montant: l.vanDeADurable, reference: x.vanDeADurable, fort: true },
          { libelle: "VAN de B, son risque compris", montant: l.vanDeBAvecLeRisque, reference: x.vanDeBAvecLeRisque, fort: true },
          { libelle: "L'avance du projet A durable sur B", montant: auCentime(l.vanDeADurable - l.vanDeBAvecLeRisque), reference: 0, effet: true },
        ];
      },
      defi: () => ({
        consigne:
          "Retirez la subvention et le prêt vert (taux du prêt vert à 5 %, le taux classique). Trouvez la hausse attendue de l'électricité la plus basse où A durable reste devant B.",
        atteint: (p) => {
          if (p.subvention !== 0 || p.tauxVert !== auCentime(PRET_VERT.tauxClassique * 100)) return false;
          const l = laboratoireDeLaTransition(p);
          const avant = laboratoireDeLaTransition({ ...p, hausse: auCentime(p.hausse! - LEVIERS_DE_LA_TRANSITION.hausse.pas) });
          return l.vanDeADurable >= l.vanDeBAvecLeRisque && (p.hausse! <= 0 || avant.vanDeADurable < avant.vanDeBAvecLeRisque);
        },
        indice: (p) => {
          if (p.subvention !== 0) return "La subvention est encore là : mettez-la à 0 %.";
          if (p.tauxVert !== auCentime(PRET_VERT.tauxClassique * 100)) return "Le prêt vert est encore là : mettez son taux à 5 %, celui du prêt classique.";
          const l = laboratoireDeLaTransition(p);
          if (l.vanDeADurable < l.vanDeBAvecLeRisque) return `À cette hausse, B garde ${eur(auCentime(l.vanDeBAvecLeRisque - l.vanDeADurable))} d'avance : la hausse doit être plus forte.`;
          return "A durable passe devant, mais une hausse plus basse suffirait : cherchez la plus basse.";
        },
        solution: { ...SOLUTION_DE_LA_TRANSITION },
      }),
      graphique: () => ({
        levier: "hausse",
        courbes: [
          { libelle: "VAN du projet A durable", valeur: (p) => laboratoireDeLaTransition(p).vanDeADurable },
          { libelle: "VAN de B, son risque compris", valeur: (p) => laboratoireDeLaTransition(p).vanDeBAvecLeRisque },
        ],
      }),
      explication: (_c, p) => {
        const l = laboratoireDeLaTransition(p);
        return [
          `Sans aide ni prêt vert, il faut s'attendre à ${qte(p.hausse!)} € de hausse par kWh pour que le projet A durable passe devant : ${eur(l.vanDeADurable)} contre ${eur(l.vanDeBAvecLeRisque)}. Les deux courbes se croisent : plus la hausse attendue est forte, plus B, qui consomme plus, perd de valeur, et plus A durable en gagne.`,
          "La décision tient donc à trois hypothèses : la hausse attendue, la subvention et le prêt vert. Une décision durable se défend en disant lesquelles elle retient, et ce qui la renverserait.",
        ];
      },
    },
    {
      id: "les-criteres-extra-financiers",
      objectifs: [0],
      type: "montants",
      titre: "Les critères extra-financiers",
      notions: ["csr_index"],
      tableau: lesDeuxProjets,
      question: () =>
        `Chiffrez les critères environnementaux sur les cinq ans du projet. L'électricité que le projet A durable consomme en moins que B chaque année (les kWh de plus de B, et ceux que les équipements économisent). Les tonnes de CO2 évitées sur cinq ans (au facteur du réseau, ${qte(KG_CO2_PAR_KWH, 3)} kg par kWh). Et la part de l'investissement du projet A durable alignée sur la taxonomie, en pour cent au centième.`,
      champs: (c) => {
        const x = projetsDuChapitre(c);
        const e = x.extra;
        return [
          { libelle: "Électricité en moins chaque année (kWh)", nature: "grandeur", attendu: e.kwhEcartParAn, calcul: `${qte(KWH_EN_PLUS_DE_LA_SEMI_AUTOMATIQUE)} + ${qte(KWH_ECONOMISES_PAR_AN)} = ${qte(e.kwhEcartParAn)} kWh` },
          { libelle: "CO2 évité sur cinq ans (tonnes)", nature: "grandeur", attendu: e.tonnesEviteesSurCinqAns, calcul: `${qte(e.kwhEcartParAn)} × ${qte(KG_CO2_PAR_KWH, 3)} × 5 ÷ 1 000 = ${qte(e.tonnesEviteesSurCinqAns)} t`, tolerance: 0.01 },
          { libelle: "Part alignée du projet A durable (%)", attendu: auCentime(e.partAligneeDeA * 100), calcul: `${eur(EQUIPEMENTS_D_EFFICACITE.montant)} ÷ ${eur(e.investissementDeA)} × 100 = ${pct(e.partAligneeDeA)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = projetsDuChapitre(c);
        return [
          `${qte(x.extra.tonnesEviteesSurCinqAns)} tonnes de CO2 en cinq ans : peu, parce que l'électricité du réseau français émet peu. Le gain environnemental du projet A durable est surtout de l'énergie économisée, et le risque qui va avec ; un même projet dans un pays à l'électricité charbonnée éviterait bien plus.`,
          `Les critères ESG complètent : A crée ${qte(EMPLOIS_CREES.A)} postes et B ${qte(EMPLOIS_CREES.B)} (social), mais B épargne aux opérateurs des gestes répétitifs (social aussi) ; A dépend moins d'un fournisseur de maintenance spécialisé (gouvernance). Un critère extra-financier se chiffre quand il le peut, et se discute toujours.`,
        ];
      },
    },
    {
      id: "argumenter",
      objectifs: [3],
      type: "choix",
      titre: "Argumenter le choix",
      notions: ["discounting", "csr_index"],
      question: () => "Le dirigeant doit présenter son choix aux associés. Quel argumentaire rendez-vous ?",
      options: (c) => {
        const x = projetsDuChapitre(c);
        return [
          {
            texte: "A durable : meilleure VAN au taux vert, moins de risque, plus d'emplois, une part alignée",
            juste: true,
            retour: `Oui : ${eur(x.vanDeADurable)} contre ${eur(x.vanDeBAvecLeRisque)}, un risque énergétique plus faible, deux emplois, ${pct(x.extra.partAligneeDeA)} d'investissement aligné et un prêt vert obtenu. L'argumentaire dit aussi ses conditions : sans la subvention ni le prêt vert, il faudrait une hausse de l'électricité bien plus forte pour que le projet A durable l'emporte.`,
          },
          {
            texte: "B : sa VAN à 9 % est la plus forte, et une décision d'investissement ne se prend que sur des critères financiers",
            juste: false,
            retour: "C'est la VAN d'hier : elle oublie le risque énergétique, l'aide et le financement vert, et le programme demande de juger aussi sur des critères extra-financiers.",
          },
          {
            texte: "A durable, parce qu'un projet vert est toujours préférable, quelle que soit sa VAN",
            juste: false,
            retour: "Un projet qui détruit de la valeur fragilise l'entreprise qui le porte. L'argument tient parce que le projet A durable est aussi le meilleur choix financier, une fois la transition comptée.",
          },
        ];
      },
    },
    {
      id: "les-limites",
      objectifs: [0, 3],
      type: "choix",
      titre: "Les limites de l'exercice",
      notions: ["csr_index"],
      question: () =>
        "Un associé objecte : « Vous avez fabriqué un projet vert pour obtenir un prêt moins cher. » Quelle réponse tient compte des limites de l'évaluation ?",
      options: () => [
        {
          texte: "Les hypothèses sont publiées, les économies se mesureront chaque année",
          juste: true,
          retour:
            "Oui. Le risque de verdissement de façade existe. Il se combat par des hypothèses dites (la hausse attendue, l'économie de kWh, le facteur d'émission) et des indicateurs suivis après l'investissement (les kWh par enceinte du tableau de bord durable). Pour la part alignée, la banque contrôle les critères techniques de la taxonomie. NOVA, petite entreprise, n'a pas à publier sa part alignée : elle le fait pour sa banque.",
        },
        {
          texte: "Il a raison, mais c'est sans importance : seul compte le taux obtenu, quelle que soit la réalité des économies",
          juste: false,
          retour: "Un prêt vert obtenu sur des économies qui ne viennent pas expose à le perdre, et à perdre la confiance de la banque. La réalité des économies compte.",
        },
        {
          texte: "Les tonnes de CO2 évitées suffisent à prouver la sincérité du projet",
          juste: false,
          retour: "Elles sont faibles, l'électricité française émettant peu : elles ne prouvent rien seules. Ce qui convainc, c'est la mesure, dans la durée, de ce qui était promis.",
        },
      ],
    },
    {
      id: "le-donut",
      type: "lecture",
      titre: "Le Donut, pour situer le choix",
      notions: ["csr_index"],
      texte: (c) => {
        const x = projetsDuChapitre(c);
        return [
          "L'économiste Kate Raworth a proposé en 2017 de représenter le développement durable par un donut. C'est un anneau entre un plancher social (l'emploi, le revenu, la santé, l'éducation, que nul ne doit manquer) et un plafond écologique (le climat, les ressources, la biodiversité, que l'activité ne doit pas dépasser). Une économie prospère reste dans l'anneau.",
          `Appliqué au choix de NOVA, le donut dit pourquoi aucun critère ne suffit seul. A durable renforce le plancher social (${qte(EMPLOIS_CREES.A)} emplois) et éloigne du plafond (${qte(x.extra.kwhEcartParAn)} kWh de moins par an) ; B gagnait sur la VAN d'hier, et sur la pénibilité des gestes. Le chiffre financier reste nécessaire : une entreprise qui perd de l'argent ne tient ni le plancher ni le plafond longtemps.`,
        ];
      },
      repere: () => "Rester entre un plancher social et un plafond écologique : le donut se lit avec la VAN, pas à sa place.",
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["discounting", "csr_index"],
      tableau: lesDeuxProjets,
      texte: (c) => {
        const x = projetsDuChapitre(c);
        return [
          `Vous avez rejoué le choix de NOVA : B devant à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} (${eur(x.vanDeB)}). Puis A durable devant (${eur(x.vanDeADurable)} contre ${eur(x.vanDeBAvecLeRisque)}) une fois comptés le coût supplémentaire, la subvention, la hausse attendue de l'électricité et le prêt vert.`,
          "Le laboratoire l'a montré : la décision dépend d'hypothèses qu'il faut dire. Les ODD disent à quoi le projet contribue, la taxonomie sépare l'éligible de l'aligné, les critères ESG complètent ce que l'argent ne mesure pas.",
          "Au niveau de l'examen, vous savez intégrer la transition écologique dans les flux d'un projet (coût supplémentaire, subvention, risques futurs réduits) et dans son taux d'actualisation (un financement vert). Vous savez mobiliser les objectifs de développement durable, la taxonomie verte et les critères ESG, et argumenter un choix entre deux projets.",
          "Dans l'arène, les investissements de votre entreprise seront différents : la démarche, elle, est la même.",
        ];
      },
      repere: () =>
        "Transition dans les flux : − coût supplémentaire + subvention + économies et risques évités, après impôt. Transition dans le taux : coût du capital − part financée × écart de taux × (1 − t).",
    },
  ],
};
