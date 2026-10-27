import type { CompanyRoundResult } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import type { Cas } from "../cas";
import { anneeDeReference, rejouerAvec } from "../gestion-de-la-pme";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE CLIENT QUI REVIENT ET LE CLIENT QUI PART (Bac pro Métiers du commerce et de la
 * vente, terminale, palier 2).
 *
 * Le vendeur d'une salle de sport voit ses adhérents revenir chaque trimestre, ou partir. Le
 * chapitre compte ceux qui reviennent et ceux qui partent, ce que vaut un adhérent gardé toute
 * l'année (sa marge), ce que coûte un adhérent qui part, puis ce que coûtent des adhérents
 * refusés faute de place : l'arène rejoue l'année avec moins de places un trimestre.
 *
 * CE QUE L'ARÈNE SIMULE DE LA FIDÉLITÉ, ET RIEN DE PLUS.
 *  · Partout, la part de clientèle du trimestre d'avant rend l'entreprise plus attirante au
 *    trimestre suivant (`loyaltyEffect`, engine/market/attraction.ts : 1 + fidélité de la
 *    clientèle × part du tour d'avant). Cette part est celle de la demande, pas des ventes :
 *    un client refusé faute de stock ne la fait pas baisser. Aucun client n'y est compté.
 *  · Chez VOLT FITNESS seulement (bloc `subscription` du scénario), les clients sont comptés un
 *    par un : le portefeuille d'adhérents. À chaque trimestre, une part s'en va (l'attrition :
 *    la qualité perçue du service, le prix rapporté à celui de référence, une salle occupée
 *    au-delà du seuil de saturation, la saison), le reste revient et se sert d'abord sur les
 *    places proposées ; l'adhérent qui revient sans trouver de place est perdu, et les nouveaux
 *    n'ont que les places restantes (engine/simulation, `subServed`, `unserved`).
 *  · L'arène ne mesure pas la satisfaction : ces causes en tiennent lieu.
 *
 * D'où la restriction : compter qui revient et qui part n'a d'objet que là où l'arène compte
 * ses clients. Le chapitre ne double pas « La valeur d'un client » (BTS NDRC, palier 3 : taux
 * d'attrition, valeur vie client, coût d'acquisition, portefeuille d'équilibre) : ici, des
 * soustractions et des sommes sur l'année, et l'année rejouée.
 *
 * Les chiffres sont ceux de l'année du cours (`anneeDeReference`) et d'un rejeu
 * (`rejouerAvec`, clé « le-client-qui-revient:… ») où seul le nombre d'abonnements proposés
 * change, au seul trimestre des travaux, à une valeur posée sur l'année du cours. Les travaux,
 * leur trimestre et les places qu'ils ferment sont des hypothèses du cours, nommées ci-dessous.
 */

/** Les entreprises du chapitre : celles dont l'arène compte les clients un par un (un abonnement). */
export const ENTREPRISES_DE_L_ABONNEMENT = ["fitness"] as const;

/** Le trimestre dont le chapitre lit les départs : le deuxième, après la vague de janvier. */
export const TRIMESTRE_DES_DEPARTS = 2;

/**
 * LES TRAVAUX (hypothèse du cours) : au printemps, le deuxième trimestre, un plateau de la salle
 * ferme pour être rénové. La salle ne propose que 70 % des abonnements qu'elle proposait dans
 * l'année du cours ce trimestre-là (le champ « Adhérents à accueillir » du formulaire).
 */
export const TRIMESTRE_DES_TRAVAUX = 2;
export const PART_DES_PLACES_OUVERTES = 0.7;

/**
 * Deux coûts « à peu près égaux » à 5 % près : en deçà, le chapitre ne dit pas que l'un dépasse
 * l'autre (hypothèse du cours, pour que le verdict ne tienne pas à un arrondi).
 */
export const ECART_NEGLIGEABLE = 0.05;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const T = (n: number) => `T${n}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const ordinal = (n: number) => (n === 1 ? "premier" : n === 2 ? "deuxième" : n === 3 ? "troisième" : "quatrième");

/** Un trimestre du portefeuille, en adhérents entiers : les départs et les nouveaux se recomposent. */
export interface TrimestreDesAdherents {
  trimestre: number;
  /** Les places proposées : les adhérents que la salle peut accueillir ce trimestre (« Adhérents à accueillir »). */
  places: number;
  debut: number;
  partis: number;
  gardes: number;
  nouveaux: number;
  /** Les adhérents servis : ceux qui paient le trimestre, et ouvrent le suivant. */
  fin: number;
  /** L'abonnement du trimestre : le chiffre d'affaires rapporté aux adhérents servis. */
  abonnement: number;
  /** La marge du trimestre : ce qui reste du chiffre d'affaires une fois payés les coûts variables. */
  marge: number;
}

/**
 * Les quatre trimestres d'une année, en adhérents entiers. Une salle défaillante ne sert plus
 * personne les trimestres suivants : on tranche avant de compter (aucune ne l'est dans l'année
 * du cours, la garde le vérifie).
 */
export function trimestresDesAdherents(annee: readonly CompanyRoundResult[]): TrimestreDesAdherents[] {
  return annee.map((r, i) => {
    const eteinte = annee.slice(0, i).some((x) => x.defaillant);
    const s = r.subscription;
    if (eteinte || !s) return { trimestre: i + 1, places: 0, debut: 0, partis: 0, gardes: 0, nouveaux: 0, fin: 0, abonnement: 0, marge: 0 };
    const debut = Math.round(s.opening);
    const gardes = Math.round(s.retained);
    const fin = Math.round(s.closing);
    return {
      trimestre: i + 1,
      places: Math.round(r.production.planned),
      debut,
      partis: debut - gardes,
      gardes,
      nouveaux: fin - gardes,
      fin,
      abonnement: s.closing > 0 ? auCentime(r.incomeStatement.revenue / s.closing) : 0,
      marge: Math.round(r.incomeStatement.grossMargin),
    };
  });
}

/** L'année du cours rejouée avec les travaux : moins d'abonnements proposés, au seul trimestre des travaux. */
export function anneeAvecLesTravaux(code: string, trimestre: number, part: number, cle: string) {
  const places = Math.round(anneeDeReference(code)[trimestre - 1]!.production.planned * part);
  return {
    places,
    annee: rejouerAvec(code, `le-client-qui-revient:${cle}`, (t, d) => (t === trimestre ? { ...d, productionPlan: places } : undefined)),
  };
}

/** Ce que coûtent des travaux qui ferment des places un trimestre : les refusés, les adhérents et la marge perdus. */
export function lesTravaux(c: Cas, trimestre: number, part: number, cle: string) {
  const reference = trimestresDesAdherents(anneeDeReference(c.code));
  const { places, annee } = anneeAvecLesTravaux(c.code, trimestre, part, cle);
  const avec = trimestresDesAdherents(annee);
  const k = trimestre - 1;
  const refuses = reference[k]!.fin - avec[k]!.fin;
  const margeDeLAnnee = (a: readonly TrimestreDesAdherents[]) => a.reduce((t, x) => t + x.marge, 0);
  const margePerdue = margeDeLAnnee(reference) - margeDeLAnnee(avec);
  const margePerdueAuTrimestre = reference[k]!.marge - avec[k]!.marge;
  const coutVariable = coutVariableParAdherent(c);
  const margeDUnTrimestre = auCentime(reference[k]!.abonnement - coutVariable);
  const parRefuse = refuses > 0 ? auCentime(margePerdue / refuses) : 0;
  const rapport = margeDUnTrimestre > 0 ? parRefuse / margeDUnTrimestre : 0;
  const verdict: "plus" | "autant" | "moins" =
    rapport > 1 + ECART_NEGLIGEABLE ? "plus" : rapport < 1 - ECART_NEGLIGEABLE ? "moins" : "autant";
  // Les trimestres d'après où la salle, moins pleine, n'a pas fixé le même abonnement.
  const abonnementsChanges = avec
    .slice(trimestre)
    .filter((x) => Math.abs(x.abonnement - reference[x.trimestre - 1]!.abonnement) >= 0.01)
    .map((x) => ({ trimestre: x.trimestre, avant: reference[x.trimestre - 1]!.abonnement, apres: x.abonnement }));
  return {
    trimestre,
    part,
    places,
    placesAvant: reference[k]!.places,
    reference,
    avec,
    refuses,
    /** Les adhérents sans place au trimestre des travaux, tels que le moteur les compte (anciens et nouveaux). */
    refusesDuMoteur: (annee[k]!.subscription?.unserved ?? 0) + Object.values(annee[k]!.market.bySegment).reduce((t, v) => t + v.lost, 0),
    /** Les adhérents qui revenaient et n'ont pas trouvé de place, au trimestre des travaux. */
    refusesAnciens: Math.round(annee[k]!.subscription?.unserved ?? 0),
    enMoinsALaFin: reference.at(-1)!.fin - avec.at(-1)!.fin,
    margeDeReference: margeDeLAnnee(reference),
    margeAvec: margeDeLAnnee(avec),
    margePerdue,
    margePerdueAuTrimestre,
    margePerdueEnsuite: margePerdue - margePerdueAuTrimestre,
    margeDUnTrimestre,
    parRefuse,
    verdict,
    abonnementsChanges,
  };
}

/** Le coût variable d'un adhérent pour un trimestre : celui du scénario, par place. */
export const coutVariableParAdherent = (c: Cas) => c.gestion.coutVariableUnitaire;

/** Le portefeuille de l'année du cours, et ce que vaut un adhérent gardé ou perdu. */
export function clientsDeLAnnee(c: Cas) {
  const s = scenarioByCode(c.code).scenario.subscription!;
  const trimestres = trimestresDesAdherents(anneeDeReference(c.code));
  const lu = trimestres[TRIMESTRE_DES_DEPARTS - 1]!;
  const coutVariable = coutVariableParAdherent(c);
  const abonnementsDeLAnnee = auCentime(trimestres.reduce((t, x) => t + x.abonnement, 0));
  const coutsDeLAnnee = auCentime(coutVariable * trimestres.length);
  const apresLePremier = trimestres.slice(1);
  const abonnementsPerdus = auCentime(apresLePremier.reduce((t, x) => t + x.abonnement, 0));
  const coutsEvites = auCentime(coutVariable * apresLePremier.length);
  return {
    trimestres,
    lu,
    reviennent: auDixieme((lu.gardes / lu.debut) * 100),
    partDesGardes: auDixieme((lu.gardes / lu.fin) * 100),
    coutVariable,
    abonnementsDeLAnnee,
    coutsDeLAnnee,
    margeDeLAnnee: auCentime(abonnementsDeLAnnee - coutsDeLAnnee),
    abonnementsPerdus,
    coutsEvites,
    margePerdue: auCentime(abonnementsPerdus - coutsEvites),
    seuilDeSaturation: auDixieme(s.crowdingThreshold * 100),
    trimestreDEte: (s.churnSeasonality ?? []).slice(0, 4).reduce((m, x, i, a) => (x > a[m]! ? i : m), 0) + 1,
  };
}

/** Les travaux du chapitre : un plateau fermé au printemps. */
export const travauxDuChapitre = (c: Cas) => lesTravaux(c, TRIMESTRE_DES_TRAVAUX, PART_DES_PLACES_OUVERTES, "travaux-au-printemps");

export function tableauDuPortefeuille(c: Cas): TableauDeDonnees {
  const k = clientsDeLAnnee(c);
  return {
    titre: `Les adhérents ${dE(c.entreprise)}, trimestre par trimestre`,
    colonnes: k.trimestres.map((t) => T(t.trimestre)),
    lignes: [
      { libelle: "En début de trimestre", valeurs: k.trimestres.map((t) => qte(t.debut)) },
      { libelle: "Partis", valeurs: k.trimestres.map((t) => `− ${qte(t.partis)}`) },
      { libelle: "Revenus (ils renouvellent)", valeurs: k.trimestres.map((t) => qte(t.gardes)) },
      { libelle: "Nouveaux inscrits", valeurs: k.trimestres.map((t) => `+ ${qte(t.nouveaux)}`) },
      { libelle: "En fin de trimestre", valeurs: k.trimestres.map((t) => qte(t.fin)) },
      { libelle: "Abonnement du trimestre", valeurs: k.trimestres.map((t) => eur(t.abonnement)) },
    ],
  };
}

/** Les deux années, trimestre par trimestre : sans et avec les travaux. */
export function tableauDesTravaux(c: Cas, p: ReturnType<typeof lesTravaux>, quand: string): TableauDeDonnees {
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec les travaux ${quand}`,
    colonnes: p.reference.map((t) => T(t.trimestre)),
    lignes: [
      { libelle: "Adhérents à accueillir, sans travaux", valeurs: p.reference.map((t) => qte(t.places)) },
      { libelle: "Adhérents à accueillir, avec les travaux", valeurs: p.avec.map((t) => qte(t.places)) },
      { libelle: "Adhérents servis, sans travaux", valeurs: p.reference.map((t) => qte(t.fin)) },
      { libelle: "Adhérents servis, avec les travaux", valeurs: p.avec.map((t) => qte(t.fin)) },
      { libelle: "Abonnement, sans travaux", valeurs: p.reference.map((t) => eur(t.abonnement)) },
      { libelle: "Abonnement, avec les travaux", valeurs: p.avec.map((t) => eur(t.abonnement)) },
      { libelle: "Marge, sans travaux", valeurs: p.reference.map((t) => eur(t.marge)) },
      { libelle: "Marge, avec les travaux", valeurs: p.avec.map((t) => eur(t.marge)) },
    ],
  };
}

/** Ce que l'abonnement a changé après les travaux, en une phrase ; vide s'il n'a pas changé. */
export function abonnementsApresLesTravaux(p: ReturnType<typeof lesTravaux>): string {
  if (p.abonnementsChanges.length === 0) return "";
  const liste = p.abonnementsChanges.map((x) => `${eur(x.apres)} au lieu de ${eur(x.avant)} au ${T(x.trimestre)}`).join(", ");
  return ` Une partie de cette marge perdue vient aussi de l'abonnement : la salle, moins pleine, ne l'a pas monté de la même façon (${liste}). C'est la même façon de gérer, face à moins d'adhérents.`;
}

export const LE_CLIENT_QUI_REVIENT: Chapitre = {
  code: "le-client-qui-revient",
  parcours: "vente",
  palier: 2,
  blocs: ["Bac pro MCV Bloc 3 · Fidéliser la clientèle et développer la relation client"],
  titre: "Le client qui revient et le client qui part",
  accroche:
    "Chaque trimestre, des adhérents renouvellent leur abonnement, d'autres partent. Combien reviennent, que rapporte un adhérent gardé toute l'année, et que coûte un adhérent qu'on perd ?",
  objectifs: [
    "Compter les clients qui reviennent et ceux qui partent",
    "Dire quelle part des clients revient",
    "Calculer la marge d'un client gardé toute l'année",
    "Calculer ce que coûte un client qui part",
    "Mesurer ce que coûtent des clients refusés faute de place",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ABONNEMENT,
    pourquoi: "ce chapitre compte les clients qui reviennent et ceux qui partent, et VOLT FITNESS est l'entreprise de l'arène qui suit ses abonnés un par un.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Des adhérents qui reviennent, d'autres qui partent",
      notions: ["churn_rate", "customer_portfolio"],
      tableau: tableauDuPortefeuille,
      texte: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          `Chez ${c.entreprise}, les clients paient un abonnement chaque trimestre. À la fin du trimestre, certains renouvellent : ce sont les clients qui reviennent. D'autres partent. Et de nouveaux clients s'inscrivent.`,
          `Dans l'arène, quatre choses font partir un adhérent : un service de moins bonne qualité, un abonnement plus cher, une salle trop pleine (plus de ${pct(k.seuilDeSaturation)} des places prises en début de trimestre) et l'été, au ${ordinal(k.trimestreDEte)} trimestre. L'arène ne mesure pas la satisfaction des clients : ce sont ces quatre causes qui la remplacent.`,
          "La salle sert d'abord les adhérents qui reviennent, puis les nouveaux, tant qu'il reste des places. Un adhérent qui revient et ne trouve pas de place est perdu.",
          `${c.entreprise} est la seule entreprise de l'arène qui compte ses clients un par un. Ailleurs, la fidélité joue autrement : la part de clientèle gagnée au trimestre d'avant rend l'entreprise plus attirante au trimestre suivant.`,
        ];
      },
      repere: () => "Clients partis = clients du début de trimestre − clients qui reviennent. Un client gardé rapporte sa marge à chaque trimestre ; un client perdu emporte toutes ses marges à venir.",
    },
    {
      id: "partis",
      type: "montants",
      titre: "Combien reviennent, combien partent",
      notions: ["churn_rate"],
      question: (c) => {
        const k = clientsDeLAnnee(c);
        return `Au ${ordinal(k.lu.trimestre)} trimestre, la salle commence avec ${qte(k.lu.debut)} adhérents. ${qte(k.lu.gardes)} renouvellent leur abonnement. Calculez le nombre d'adhérents partis, puis la part des adhérents qui reviennent (en %, au dixième).`;
      },
      champs: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          { libelle: "Adhérents partis", attendu: k.lu.partis, calcul: `${qte(k.lu.debut)} − ${qte(k.lu.gardes)} = ${qte(k.lu.partis)}`, tolerance: 0 },
          {
            libelle: "Part des adhérents qui reviennent (%)",
            attendu: k.reviennent,
            calcul: `${qte(k.lu.gardes)} ÷ ${qte(k.lu.debut)} × 100 = ${pct(k.reviennent)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = clientsDeLAnnee(c);
        const t1 = k.trimestres[0]!;
        return [
          `Sur 100 adhérents présents au début du trimestre, environ ${qte(Math.round(k.reviennent))} reviennent. Au premier trimestre, c'était ${qte(t1.gardes)} sur ${qte(t1.debut)} : le trimestre ${T(k.lu.trimestre)} a perdu ${qte(k.lu.partis)} adhérents, contre ${qte(t1.partis)} au ${T(1)}.`,
        ];
      },
    },
    {
      id: "poids-des-gardes",
      type: "montants",
      titre: "Le poids des clients qui reviennent",
      notions: ["customer_portfolio"],
      question: (c) => {
        const k = clientsDeLAnnee(c);
        return `À la fin du ${ordinal(k.lu.trimestre)} trimestre, la salle compte ${qte(k.lu.fin)} adhérents : ${qte(k.lu.gardes)} qui sont revenus et ${qte(k.lu.nouveaux)} nouveaux. Quelle part des adhérents sont des clients qui reviennent (en %, au dixième) ?`;
      },
      champs: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          {
            libelle: "Part des clients qui reviennent dans la salle (%)",
            attendu: k.partDesGardes,
            calcul: `${qte(k.lu.gardes)} ÷ ${qte(k.lu.fin)} × 100 = ${pct(k.partDesGardes)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = clientsDeLAnnee(c);
        const remplaces =
          k.lu.nouveaux < k.lu.partis
            ? `Les nouveaux ne remplacent pas les partis : ${qte(k.lu.nouveaux)} inscrits pour ${qte(k.lu.partis)} départs, et la salle finit le trimestre plus petite qu'elle ne l'a commencé.`
            : `Les nouveaux remplacent les partis : ${qte(k.lu.nouveaux)} inscrits pour ${qte(k.lu.partis)} départs.`;
        return [
          `${pct(k.partDesGardes)} des adhérents qui paient ce trimestre sont des clients qui reviennent. ${remplaces}`,
          k.partDesGardes > 50
            ? "Pour le vendeur, ce sont les clients qui reviennent qui font la plus grande part du chiffre d'affaires du trimestre."
            : "Ce trimestre, les nouveaux font la plus grande part du chiffre d'affaires : la salle dépend de ses inscriptions.",
        ];
      },
    },
    {
      id: "garde-toute-l-annee",
      type: "montants",
      titre: "Un adhérent gardé toute l'année",
      notions: ["contribution_margin", "customer_lifetime_value"],
      tableau: tableauDuPortefeuille,
      question: (c) => {
        const k = clientsDeLAnnee(c);
        return `Un adhérent reste toute l'année. Il paie l'abonnement de chaque trimestre (voir le tableau). Chaque trimestre, il coûte ${eur(k.coutVariable)} à la salle en coûts variables (entretien, énergie, eau, serviettes). Calculez ce qu'il paie sur l'année, ce qu'il coûte sur l'année, puis la marge qu'il laisse.`;
      },
      champs: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          {
            libelle: "Abonnements payés sur l'année",
            attendu: k.abonnementsDeLAnnee,
            calcul: `${k.trimestres.map((t) => eur(t.abonnement)).join(" + ")} = ${eur(k.abonnementsDeLAnnee)}`,
          },
          { libelle: "Coûts de l'adhérent sur l'année", attendu: k.coutsDeLAnnee, calcul: `${eur(k.coutVariable)} × ${qte(k.trimestres.length)} = ${eur(k.coutsDeLAnnee)}` },
          {
            libelle: "Marge d'un adhérent gardé toute l'année",
            attendu: k.margeDeLAnnee,
            calcul: `${eur(k.abonnementsDeLAnnee)} − ${eur(k.coutsDeLAnnee)} = ${eur(k.margeDeLAnnee)}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          `Un adhérent gardé toute l'année laisse ${eur(k.margeDeLAnnee)} à la salle pour payer le loyer, les coachs et le reste. Il ne coûte rien de plus à garder : il suffit qu'il revienne.`,
        ];
      },
    },
    {
      id: "parti-apres-le-premier",
      type: "montants",
      titre: "Un adhérent qui part après le premier trimestre",
      notions: ["contribution_margin", "churn_rate"],
      question: (c) => {
        const k = clientsDeLAnnee(c);
        return `Un adhérent ne renouvelle pas à la fin du premier trimestre. Il ne paiera pas les ${qte(k.trimestres.length - 1)} trimestres suivants, mais la salle n'aura pas non plus à payer ses ${eur(k.coutVariable)} de coûts à chacun. Calculez les abonnements qu'il ne paiera pas, puis la marge que la salle perd.`;
      },
      champs: (c) => {
        const k = clientsDeLAnnee(c);
        const apres = k.trimestres.slice(1);
        return [
          { libelle: "Abonnements qu'il ne paiera pas", attendu: k.abonnementsPerdus, calcul: `${apres.map((t) => eur(t.abonnement)).join(" + ")} = ${eur(k.abonnementsPerdus)}` },
          {
            libelle: "Marge que la salle perd",
            attendu: k.margePerdue,
            calcul: `${eur(k.abonnementsPerdus)} − ${eur(k.coutVariable)} × ${qte(apres.length)} = ${eur(k.margePerdue)}`,
          },
        ];
      },
      explication: (c) => {
        const k = clientsDeLAnnee(c);
        return [
          `Un client qui part ne coûte pas seulement le trimestre qu'il ne paie pas : il emporte ${eur(k.margePerdue)} de marge sur la fin de l'année. Pour la retrouver, il faudra trouver un nouveau client, et le payer en publicité.`,
        ];
      },
    },
    {
      id: "les-travaux",
      type: "montants",
      titre: "Des adhérents refusés faute de place",
      notions: ["capacity", "churn_rate"],
      tableau: (c) => tableauDesTravaux(c, travauxDuChapitre(c), "au printemps"),
      question: (c) => {
        const p = travauxDuChapitre(c);
        return `Au ${ordinal(p.trimestre)} trimestre, un plateau de la salle ferme pour travaux : la salle ne peut accueillir que ${qte(p.places)} adhérents au lieu de ${qte(p.placesAvant)}. L'arène a rejoué l'année ainsi, avec les mêmes concurrents et la même façon de gérer. D'après le tableau, calculez les adhérents refusés au ${T(p.trimestre)}, les adhérents en moins à la fin de l'année, puis la marge perdue sur l'année.`;
      },
      champs: (c) => {
        const p = travauxDuChapitre(c);
        const fin = p.reference.length;
        return [
          {
            libelle: `Adhérents refusés au ${T(p.trimestre)}`,
            attendu: p.refuses,
            calcul: `${qte(p.reference[p.trimestre - 1]!.fin)} − ${qte(p.avec[p.trimestre - 1]!.fin)} = ${qte(p.refuses)}`,
            tolerance: 0,
          },
          {
            libelle: "Adhérents en moins à la fin de l'année",
            attendu: p.enMoinsALaFin,
            calcul: `${qte(p.reference[fin - 1]!.fin)} − ${qte(p.avec[fin - 1]!.fin)} = ${qte(p.enMoinsALaFin)}`,
            tolerance: 0,
          },
          {
            libelle: "Marge perdue sur l'année",
            attendu: p.margePerdue,
            calcul: `${eur(p.margeDeReference)} − ${eur(p.margeAvec)} = ${eur(p.margePerdue)}, la marge de chaque trimestre additionnée`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const p = travauxDuChapitre(c);
        return [
          `Au ${T(p.trimestre)}, ${qte(p.refuses)} adhérents n'ont pas trouvé de place : ${p.refusesAnciens > 0 ? "des adhérents qui revenaient, et des nouveaux qui voulaient s'inscrire" : "des nouveaux qui voulaient s'inscrire"}. La salle a perdu ${eur(p.margePerdueAuTrimestre)} de marge ce trimestre-là.`,
          p.margePerdueEnsuite > 0 && p.enMoinsALaFin > 0
            ? `Mais ces adhérents ne reviennent pas une fois les travaux finis : à la fin de l'année, la salle en compte encore ${qte(p.enMoinsALaFin)} de moins, et elle perd ${eur(p.margePerdueEnsuite)} de marge sur les trimestres suivants.${abonnementsApresLesTravaux(p)}`
            : `Une fois les travaux finis, la salle retrouve ses adhérents : la perte s'arrête presque au trimestre des travaux.${abonnementsApresLesTravaux(p)}`,
        ];
      },
    },
    {
      id: "ce-que-coute-un-refus",
      type: "choix",
      titre: "Ce que coûte un adhérent refusé",
      notions: ["customer_lifetime_value", "capacity"],
      question: (c) => {
        const p = travauxDuChapitre(c);
        return `Les travaux ont fait perdre ${eur(p.margePerdue)} de marge sur l'année, pour ${qte(p.refuses)} adhérents refusés : ${eur(p.parRefuse)} par adhérent refusé. Un adhérent laisse ${eur(p.margeDUnTrimestre)} de marge sur un trimestre au ${T(p.trimestre)}. Que coûte un adhérent refusé ?`;
      },
      options: (c) => {
        const p = travauxDuChapitre(c);
        const calcul = `${eur(p.margePerdue)} ÷ ${qte(p.refuses)} = ${eur(p.parRefuse)} par adhérent refusé, pour ${eur(p.margeDUnTrimestre)} de marge sur un trimestre.`;
        return [
          {
            texte: "Plus qu'un trimestre de marge : il ne revient pas",
            juste: p.verdict === "plus",
            retour:
              p.verdict === "plus"
                ? `Oui. ${calcul} L'adhérent refusé ne revient pas au trimestre suivant : la salle perd aussi la suite de ses abonnements.`
                : `Non. ${calcul}`,
          },
          {
            texte: "Un trimestre de marge, à peu près",
            juste: p.verdict === "autant",
            retour: p.verdict === "autant" ? `Oui. ${calcul} La perte s'arrête presque au trimestre des travaux.` : `Non. ${calcul}`,
          },
          {
            texte: "Moins qu'un trimestre de marge",
            juste: p.verdict === "moins",
            retour: p.verdict === "moins" ? `Oui. ${calcul} La salle économise une partie des coûts des places fermées.` : `Non. ${calcul}`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["churn_rate", "customer_lifetime_value"],
      texte: (c) => {
        const k = clientsDeLAnnee(c);
        const p = travauxDuChapitre(c);
        return [
          `Chez ${c.entreprise}, un adhérent gardé toute l'année laisse ${eur(k.margeDeLAnnee)} de marge. Un adhérent qui part après le premier trimestre en emporte ${eur(k.margePerdue)}.`,
          p.margePerdueEnsuite > 0
            ? `Un client refusé faute de place est un client perdu : les travaux du printemps ont coûté ${eur(p.margePerdue)} de marge sur l'année, dont ${eur(p.margePerdueEnsuite)} après la fin des travaux. Le vendeur garde ses clients en les servant bien, à un prix juste, dans une salle qui n'est pas trop pleine.`
            : `Les travaux du printemps ont coûté ${eur(p.margePerdue)} de marge sur l'année. Le vendeur garde ses clients en les servant bien, à un prix juste, dans une salle qui n'est pas trop pleine.`,
        ];
      },
      repere: () => "Marge d'un client gardé = abonnements de l'année − coûts du client sur l'année. Un client perdu coûte toutes les marges qu'il aurait laissées ensuite.",
    },
  ],
};
