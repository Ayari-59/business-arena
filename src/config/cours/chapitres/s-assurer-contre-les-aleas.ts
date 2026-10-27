import type { EngineScenarioConfig, EventDefinitionConfig, InsuranceFormulaDef } from "../../../engine/types";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { objetDuCourrier } from "../../courriers/de-la-partie";
import { scenarioByCode } from "../../scenarios/registry";
import { type Cas } from "../cas";
import { anneeJouee } from "../annee-de-l-arene";
import { anneeDeReference, rejouerAvec, surLAnnee } from "../gestion-de-la-pme";
import type { Chapitre } from "../types";

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
/**
 * CHAPITRE : S'ASSURER CONTRE LES ALÉAS, LA PRIME ET LES SINISTRES (BTS GPME, gestion des
 * risques, palier 3).
 *
 * Chaque entreprise de l'arène peut s'assurer : son scénario propose des formules (une prime par
 * trimestre, une liste d'aléas couverts), et le moteur neutralise, chez l'assuré, l'effet d'un
 * aléa couvert qui tombe. Le chapitre suit une formule : la moins chère de celles qui couvrent
 * l'aléa le plus probable de l'entreprise (`formuleRetenue`). L'arène rejoue l'année assurée, puis
 * chiffre la fréquence et le coût des aléas couverts, et le sinistre le plus lourd : l'espérance
 * se compare à la prime, la gravité à ce qu'on peut encaisser.
 *
 * Avec la graine du cours, aucun aléa couvert ne tombe dans l'année : le chapitre le dit, et
 * raisonne sur l'espérance, avec les probabilités du scénario. Le coût d'un sinistre, lui, vient
 * de l'arène : elle rejoue l'année avec l'aléa POSÉ à un trimestre (`poser`), sans assurance, et
 * le résultat de l'activité dit ce qu'il coûte. Rien n'est ajouté au scénario que cet aléa, tel
 * qu'il y est écrit (mêmes effets, même durée, même portée).
 */

const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const fois = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const pluriel = (n: number, mot: string) => `${qte(n)} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Le code de l'aléa posé par le cours : une copie de l'aléa du scénario, à probabilité nulle et
 * déclenchée au trimestre choisi. Une copie, et pas l'aléa lui-même : le moteur ne tire pas un
 * aléa déjà en cours, et poser l'original lui ferait sauter un tirage, donc déplacer tout le
 * hasard de l'année. La copie ne consomme aucun tirage ; les formules qui couvrent l'original la
 * couvrent aussi.
 */
const MARQUE_DE_L_ALEA_POSE = "__pose-par-le-cours";

/** Les formules du scénario, l'ancien format (une formule unique) compris, comme le moteur les lit. */
export function formulesDe(code: string): InsuranceFormulaDef[] {
  const ins = scenarioByCode(code).scenario.insurance;
  if (!ins) return [];
  return ins.formulas ?? [{ code: "default", name: "Assurance catastrophe", premiumPerRound: ins.premiumPerRound, coveredEventCodes: ins.coveredEventCodes }];
}

/**
 * La formule du chapitre : parmi les aléas couverts par l'une des formules, et que l'arène peut
 * tirer (probabilité non nulle), le plus probable ; puis la formule la moins chère qui le couvre.
 */
export function formuleRetenue(code: string): { formule: InsuranceFormulaDef; alea: EventDefinitionConfig } {
  const s = scenarioByCode(code).scenario;
  const formules = formulesDe(code);
  const tirables = s.events.filter((e) => e.probability > 0 && formules.some((f) => f.coveredEventCodes.includes(e.code)));
  const plusHaute = Math.max(...tirables.map((e) => e.probability));
  const plusProbables = tirables.filter((e) => e.probability === plusHaute);
  const formule = [...formules]
    .filter((f) => plusProbables.some((e) => f.coveredEventCodes.includes(e.code)))
    .sort((a, b) => a.premiumPerRound - b.premiumPerRound)[0]!;
  return { formule, alea: plusProbables.find((e) => formule.coveredEventCodes.includes(e.code))! };
}

/** Le nom d'un aléa, celui que l'arène montre (l'objet de son courrier), sans tiret au milieu. */
export const nomDeLAlea = (code: string) => (objetDuCourrier(code) ?? code.replace(/_/g, " ")).replace(/ [—–-] /g, " : ");

/** Le scénario de l'année avec l'aléa posé au trimestre donné, chez l'entreprise du cours (la première). */
export function poser(e: EventDefinitionConfig, trimestre: number) {
  const copie = `${e.code}${MARQUE_DE_L_ALEA_POSE}`;
  const couvre = (codes: string[]) => (codes.includes(e.code) ? [...codes, copie] : codes);
  return (s: EngineScenarioConfig): EngineScenarioConfig => ({
    ...s,
    events: [...s.events, { ...e, code: copie, probability: 0 }],
    scriptedEvents: [...s.scriptedEvents, { round: trimestre, eventCode: copie, companyIndex: 0 }],
    ...(s.insurance
      ? {
          insurance: {
            ...s.insurance,
            coveredEventCodes: couvre(s.insurance.coveredEventCodes),
            ...(s.insurance.formulas ? { formulas: s.insurance.formulas.map((f) => ({ ...f, coveredEventCodes: couvre(f.coveredEventCodes) })) } : {}),
          },
        }
      : {}),
  });
}

/** Le résultat de l'activité sur l'année rejouée, à l'euro : c'est là que portent les aléas couverts. */
export const resultatDeLActivite = (annee: Parameters<typeof surLAnnee>[0]) =>
  Math.round(surLAnnee(annee, (r) => r.incomeStatement.operatingIncome));

/** Les trimestres de l'année où l'aléa peut tomber : à partir de son premier trimestre possible. */
const trimestresPossibles = (e: EventDefinitionConfig, trimestres: number) =>
  Array.from({ length: trimestres }, (_, i) => i + 1).filter((t) => t >= (e.minRound ?? 1));

export type Verdict = "rapporte" | "gravite" | "garder";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** L'assurance du chapitre : la prime, l'année assurée, la fréquence et le coût des aléas, le pire. */
export function assurance(c: Cas) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c.code);
  calculs.set(c.code, r);
  return r;
}

function calculer(code: string) {
  const s = scenarioByCode(code).scenario;
  const { formule, alea: leManquant } = formuleRetenue(code);
  const reference = anneeDeReference(code);
  const trimestres = reference.length;
  // Les entreprises de l'arène du cours : un aléa d'entreprise frappe l'une d'elles, tirée au sort.
  const entreprisesDeLArene = Object.keys(anneeJouee(code).partie.rounds[0]!.results).length;
  const assuree = rejouerAvec(code, `assurance-${formule.code}`, (_t, d) => ({ ...d, insurance: formule.code }));
  const resultatSans = resultatDeLActivite(reference);
  const resultatAssure = resultatDeLActivite(assuree);
  const primeDeLAnnee = surLAnnee(assuree, (x) => x.insurance?.premium ?? 0);
  const trimestresNeutralises = surLAnnee(assuree, (x) => x.insurance?.neutralizedEvents.length ?? 0);

  // Le coût d'un sinistre, trimestre par trimestre : l'année rejouée avec l'aléa posé, sans assurance.
  const couverts = s.events.filter((e) => formule.coveredEventCodes.includes(e.code));
  const coutsDe = (e: EventDefinitionConfig) =>
    trimestresPossibles(e, trimestres).map((t) => ({
      trimestre: t,
      cout: resultatSans - resultatDeLActivite(rejouerAvec(code, `alea-${e.code}-t${t}`, () => undefined, poser(e, t))),
    }));
  const aleas = couverts.map((e) => {
    const couts = coutsDe(e);
    const part = e.scope === "company" ? 1 / entreprisesDeLArene : 1;
    const coutMoyen = Math.round(couts.reduce((t, x) => t + x.cout, 0) / couts.length);
    return {
      code: e.code,
      nom: nomDeLAlea(e.code),
      probabilite: e.probability,
      duree: e.duration,
      scope: e.scope,
      /** L'aléa ne touche que la capacité : il ne coûte rien tant qu'elle n'est pas utilisée en entier. */
      surLaCapaciteSeule: e.modifiers.every((m) => m.target === "availability"),
      trimestres: couts.length,
      part,
      partEcrite: e.scope === "company" ? `1/${entreprisesDeLArene}` : "1",
      couts,
      coutMoyen,
      // Le nombre moyen de sinistres dans l'année, à peu près : un aléa déjà en cours ne se tire
      // pas une deuxième fois, ce que ce produit ne retranche pas (l'écart est infime à ces
      // probabilités).
      nombreMoyen: e.probability * couts.length * part,
    };
  });
  const tirables = aleas.filter((a) => a.probabilite > 0);
  const esperance = Math.round(tirables.reduce((t, a) => t + a.nombreMoyen * a.coutMoyen, 0));

  // Le sinistre le plus lourd que la formule couvre, au trimestre où il coûterait le plus.
  const candidats = aleas.flatMap((a) => a.couts.map((x) => ({ a, ...x })));
  const lePire = candidats.reduce((m, x) => (x.cout > m.cout ? x : m), candidats[0]!);
  const defDuPire = couverts.find((e) => e.code === lePire.a.code)!;
  const avecLePire = rejouerAvec(code, `alea-${defDuPire.code}-t${lePire.trimestre}`, () => undefined, poser(defDuPire, lePire.trimestre));
  const avecLePireAssure = rejouerAvec(
    code,
    `alea-${defDuPire.code}-t${lePire.trimestre}-assure-${formule.code}`,
    (_t, d) => ({ ...d, insurance: formule.code }),
    poser(defDuPire, lePire.trimestre),
  );
  const pire = {
    code: lePire.a.code,
    nom: lePire.a.nom,
    probabilite: lePire.a.probabilite,
    duree: lePire.a.duree,
    trimestre: lePire.trimestre,
    resultatAvec: resultatDeLActivite(avecLePire),
    resultatAssure: resultatDeLActivite(avecLePireAssure),
    trimestresNeutralises: surLAnnee(avecLePireAssure, (x) => x.insurance?.neutralizedEvents.length ?? 0),
    cout: 0,
    resteACharge: 0,
  };
  pire.cout = resultatSans - pire.resultatAvec;
  pire.resteACharge = resultatSans - pire.resultatAssure;

  const verdict: Verdict = esperance > primeDeLAnnee ? "rapporte" : pire.cout > primeDeLAnnee ? "gravite" : "garder";
  return {
    formules: formulesDe(code).map((f) => ({ code: f.code, nom: f.name, prime: f.premiumPerRound, aleas: f.coveredEventCodes.length })),
    formule: { code: formule.code, nom: formule.name, prime: formule.premiumPerRound },
    aleaLePlusProbable: { nom: nomDeLAlea(leManquant.code), probabilite: leManquant.probability },
    trimestres,
    entreprisesDeLArene,
    primeDeLAnnee,
    trimestresNeutralises,
    resultatSans,
    resultatAssure,
    ecartDeResultat: resultatAssure - resultatSans,
    aleas,
    tirables,
    cartes: aleas.length - tirables.length,
    esperance,
    pire,
    verdict,
  };
}

export const S_ASSURER_CONTRE_LES_ALEAS: Chapitre = {
  code: "s-assurer-contre-les-aleas",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"],
  titre: "S'assurer contre les aléas : la prime et les sinistres",
  accroche:
    "La prime se paie à coup sûr, le sinistre peut-être. L'arène rejoue l'année assurée, chiffre la fréquence et le coût des aléas couverts, puis le sinistre le plus lourd : de quoi décider s'il faut s'assurer.",
  objectifs: [
    "Lire une offre d'assurance : la prime, les aléas couverts",
    "Mesurer ce que l'assurance coûte sur une année sans sinistre",
    "Calculer l'espérance des sinistres et la comparer à la prime",
    "Juger une assurance sur la gravité du sinistre, et pas seulement sur la moyenne",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "L'offre de l'assureur",
      notions: ["fixed_costs"],
      texte: (c) => {
        const a = assurance(c);
        return [
          `${c.entreprise} peut s'assurer contre une partie des aléas de son métier. L'assureur propose ${pluriel(a.formules.length, "formule")} : plus la prime est haute, plus la liste des aléas couverts est longue. La prime se paie à chaque trimestre, qu'un sinistre tombe ou non ; quand un aléa couvert tombe, l'arène en efface l'effet chez l'assuré.`,
          `Le chapitre suit la formule « ${a.formule.nom} », la moins chère de celles qui couvrent l'aléa le plus probable ${dE(c.entreprise)} : « ${a.aleaLePlusProbable.nom} », ${pct(a.aleaLePlusProbable.probabilite * 100)} de probabilité à chaque trimestre où il peut tomber.`,
          a.trimestresNeutralises === 0
            ? `Dans l'année du cours, l'arène n'a fait tomber chez ${c.entreprise} aucun des aléas que cette formule couvre. Ce n'est pas une preuve que l'assurance est inutile : une année ne dit pas la moyenne, et c'est la moyenne qu'il faut calculer.`
            : `Dans l'année du cours, un aléa que cette formule couvre a frappé ${c.entreprise} pendant ${pluriel(a.trimestresNeutralises, "trimestre")}. Une année ne dit pas la moyenne pour autant : c'est la moyenne qu'il faut calculer.`,
        ];
      },
      tableau: (c) => {
        const a = assurance(c);
        return {
          titre: `L'offre d'assurance ${dE(c.entreprise)}`,
          colonnes: ["Prime par trimestre", "Prime de l'année", "Aléas couverts"],
          lignes: a.formules.map((f) => ({
            libelle: f.code === a.formule.code ? `${f.nom} (la formule du chapitre)` : f.nom,
            valeurs: [eur(f.prime), eur(f.prime * a.trimestres), qte(f.aleas)],
          })),
        };
      },
      repere: () => "La prime est une charge certaine, le sinistre une perte incertaine : s'assurer, c'est échanger l'une contre l'autre.",
    },
    {
      id: "annee-assuree",
      type: "montants",
      titre: "L'année rejouée, assurée",
      notions: ["fixed_costs", "income_statement"],
      tableau: (c) => {
        const a = assurance(c);
        return {
          titre: "L'année du cours, sans et avec l'assurance",
          colonnes: ["Sans assurance", `Formule « ${a.formule.nom} »`],
          lignes: [
            { libelle: "Prime payée sur l'année", valeurs: [eur(0), eur(a.primeDeLAnnee)] },
            { libelle: "Trimestres où un aléa couvert a été effacé", valeurs: ["", qte(a.trimestresNeutralises)] },
            { libelle: "Résultat de l'activité sur l'année", valeurs: [eur(a.resultatSans), eur(a.resultatAssure)] },
          ],
        };
      },
      question: (c) => {
        const a = assurance(c);
        return `L'arène a rejoué l'année avec la formule « ${a.formule.nom} » souscrite aux ${a.trimestres} trimestres, tout le reste identique. Calculez la prime de l'année, puis l'écart de résultat de l'activité (avec l'assurance moins sans).`;
      },
      champs: (c) => {
        const a = assurance(c);
        return [
          { libelle: "Prime de l'année", attendu: a.primeDeLAnnee, calcul: `${eur(a.formule.prime)} × ${a.trimestres} = ${eur(a.primeDeLAnnee)}`, tolerance: 1 },
          { libelle: "Écart de résultat de l'activité", attendu: a.ecartDeResultat, calcul: `${eur(a.resultatAssure)} − ${retranche(a.resultatSans)} = ${eur(a.ecartDeResultat)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = assurance(c);
        return [
          a.trimestresNeutralises === 0 && a.ecartDeResultat === -a.primeDeLAnnee
            ? `Aucun aléa couvert n'est tombé : l'assurance a coûté sa prime, ${eur(a.primeDeLAnnee)}, et rien d'autre. Comme le loyer, la prime est une charge fixe : elle se paie à chaque trimestre, que l'activité soit bonne ou mauvaise.`
            : `L'écart (${eur(a.ecartDeResultat)}) mêle la prime de l'année (${eur(-a.primeDeLAnnee)}) et ce que les aléas effacés auraient coûté à ${c.entreprise} : ${eur(a.ecartDeResultat + a.primeDeLAnnee)}.`,
        ];
      },
    },
    {
      id: "esperance",
      type: "montants",
      titre: "Fréquence et coût des aléas couverts",
      notions: ["capacity", "income_statement"],
      tableau: (c) => {
        const a = assurance(c);
        return {
          titre: `Les aléas que l'arène peut tirer, couverts par « ${a.formule.nom} »`,
          colonnes: ["Probabilité par trimestre", "Trimestres où il peut tomber", "Part de l'entreprise", "Coût moyen d'un sinistre"],
          lignes: a.tirables.map((x) => ({
            libelle: x.duree > 1 ? `${x.nom} (dure ${x.duree} trimestres)` : x.nom,
            valeurs: [pct(x.probabilite * 100), qte(x.trimestres), x.scope === "company" ? `1 entreprise sur ${a.entreprisesDeLArene}` : "tout le marché", eur(x.coutMoyen)],
          })),
        };
      },
      question: (c) => {
        const a = assurance(c);
        return `Le nombre moyen de sinistres d'un aléa dans l'année est : probabilité par trimestre × trimestres où il peut tomber × part de l'entreprise (un aléa d'entreprise frappe l'une des ${a.entreprisesDeLArene} entreprises de l'arène, tirée au sort ; un aléa de marché les frappe toutes). Calculez l'espérance des sinistres de l'année, la somme des nombres moyens × coût moyen, à l'euro.`;
      },
      champs: (c) => {
        const a = assurance(c);
        return [
          {
            libelle: "Espérance des sinistres sur l'année",
            attendu: a.esperance,
            calcul: `${a.tirables.map((x) => `${pct(x.probabilite * 100)} × ${x.trimestres} × ${x.partEcrite} × ${eur(x.coutMoyen)}`).join(" + ")} = ${eur(a.esperance)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const a = assurance(c);
        const nuls = a.tirables.filter((x) => x.coutMoyen <= 0).length;
        const pourquoi = a.tirables.filter((x) => x.coutMoyen <= 0).every((x) => x.surLaCapaciteSeule)
          ? " : une capacité qui baisse ne pèse pas tant que l'entreprise ne l'utilise pas en entier."
          : ", dans l'année rejouée.";
        return [
          `Le coût moyen d'un sinistre vient de l'arène : elle a rejoué l'année avec l'aléa posé à chacun des trimestres où il peut tomber, sans assurance, et compté ce que le résultat de l'activité y perd.${nuls > 0 ? ` ${nuls === a.tirables.length ? (nuls > 1 ? "Ici, ils ne coûtent rien en moyenne" : "Ici, il ne coûte rien en moyenne") : `Ici, ${pluriel(nuls, "aléa")} sur ${a.tirables.length} ne coûte${nuls > 1 ? "nt" : ""} rien en moyenne`}${pourquoi}` : ""}`,
          a.esperance > 0
            ? `En moyenne, ${a.tirables.length > 1 ? "ces aléas coûtent" : "cet aléa coûte"} ${eur(a.esperance)} par an à ${c.entreprise}, pour une prime de ${eur(a.primeDeLAnnee)} : ${a.primeDeLAnnee > a.esperance ? `la prime vaut ${fois(a.primeDeLAnnee / a.esperance)} fois l'espérance.` : "l'espérance dépasse la prime."} ${a.trimestresNeutralises === 0 ? "L'année jouée, sans sinistre, n'était pas la moyenne : une autre année, l'un d'eux peut tomber." : "L'année jouée n'était pas la moyenne non plus."}`
            : `En moyenne, ${a.tirables.length > 1 ? "ces aléas ne coûtent" : "cet aléa ne coûte"} rien à ${c.entreprise}, pour une prime de ${eur(a.primeDeLAnnee)} par an.`,
          a.cartes > 1
            ? `La formule couvre aussi ${pluriel(a.cartes, "aléa")} que l'arène ne tire jamais au hasard : des cartes que l'enseignant joue s'il le décide. Leur probabilité n'est pas dans le scénario ; leur coût, l'arène le calcule à l'étape suivante.`
            : a.cartes === 1
              ? "La formule couvre aussi un aléa que l'arène ne tire jamais au hasard : une carte que l'enseignant joue s'il le décide. Sa probabilité n'est pas dans le scénario ; son coût, l'arène le calcule à l'étape suivante."
              : `La formule ne couvre pas d'autre aléa que ${a.tirables.length > 1 ? "ceux-là" : "celui-là"}.`,
        ];
      },
    },
    {
      id: "pire",
      type: "montants",
      titre: "Le sinistre le plus lourd",
      notions: ["capacity", "income_statement"],
      tableau: (c) => {
        const a = assurance(c);
        return {
          titre: `« ${a.pire.nom} », posé au trimestre ${a.pire.trimestre}`,
          colonnes: ["Résultat de l'activité sur l'année"],
          lignes: [
            { libelle: "Sans le sinistre", valeurs: [eur(a.resultatSans)] },
            { libelle: "Avec le sinistre, sans assurance", valeurs: [eur(a.pire.resultatAvec)] },
            { libelle: `Avec le sinistre, assuré par « ${a.formule.nom} »`, valeurs: [eur(a.pire.resultatAssure)] },
          ],
        };
      },
      question: (c) => {
        const a = assurance(c);
        return `De tous les aléas que couvre la formule, celui-ci coûterait le plus à ${c.entreprise}, au trimestre ${a.pire.trimestre}. Calculez ce qu'il coûte sans assurance (résultat sans le sinistre moins résultat avec), puis ce qui reste à charge quand l'entreprise est assurée (résultat sans le sinistre moins résultat avec le sinistre et l'assurance).`;
      },
      champs: (c) => {
        const a = assurance(c);
        return [
          { libelle: "Coût du sinistre sans assurance", attendu: a.pire.cout, calcul: `${eur(a.resultatSans)} − ${retranche(a.pire.resultatAvec)} = ${eur(a.pire.cout)}`, tolerance: 1 },
          { libelle: "Reste à charge, assuré", attendu: a.pire.resteACharge, calcul: `${eur(a.resultatSans)} − ${retranche(a.pire.resultatAssure)} = ${eur(a.pire.resteACharge)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const a = assurance(c);
        return [
          a.pire.resteACharge === a.primeDeLAnnee
            ? `Assurée, ${c.entreprise} ne paie plus que la prime de l'année, ${eur(a.primeDeLAnnee)} : l'arène a effacé le sinistre ${a.pire.trimestresNeutralises > 1 ? `pendant ses ${a.pire.trimestresNeutralises} trimestres` : "au trimestre où il tombe"}. Sans assurance, il coûte ${eur(a.pire.cout)}, ${a.pire.cout > a.primeDeLAnnee ? `${fois(a.pire.cout / a.primeDeLAnnee)} fois la prime de l'année.` : "moins qu'une année de prime."}`
            : `Assurée, il reste à ${c.entreprise} ${eur(a.pire.resteACharge)} à payer, prime comprise ; sans assurance, le sinistre coûte ${eur(a.pire.cout)}.`,
          a.pire.probabilite > 0
            ? `Sa probabilité est de ${pct(a.pire.probabilite * 100)} par trimestre : c'est un coup rare, mais c'est sa gravité qui compte ici, ce que l'entreprise devrait encaisser d'un seul coup.`
            : "L'arène ne le tire jamais au hasard : c'est une carte que l'enseignant peut jouer. Le risque existe, sans fréquence connue : seule sa gravité se mesure.",
        ];
      },
    },
    {
      id: "decision",
      type: "choix",
      titre: "Faut-il s'assurer ?",
      notions: ["fixed_costs"],
      question: (c) => {
        const a = assurance(c);
        return `L'espérance des sinistres est de ${eur(a.esperance)} par an, la prime de ${eur(a.primeDeLAnnee)}, et le sinistre couvert le plus lourd coûterait ${eur(a.pire.cout)}. Que conseillez-vous à ${c.entreprise} ?`;
      },
      options: (c) => {
        const a = assurance(c);
        return [
          {
            texte: "S'assurer : en moyenne, les sinistres coûtent plus que la prime",
            juste: a.verdict === "rapporte",
            retour:
              a.verdict === "rapporte"
                ? `Oui : l'espérance (${eur(a.esperance)}) dépasse la prime (${eur(a.primeDeLAnnee)}). C'est rare : l'assureur vit de ce que la prime dépasse les sinistres.`
                : `Non : l'espérance (${eur(a.esperance)}) ne dépasse pas la prime (${eur(a.primeDeLAnnee)}). En moyenne, l'assurance coûte : c'est le cas presque toujours, la prime paie aussi les frais de l'assureur.`,
          },
          {
            texte: "S'assurer : la prime dépasse la moyenne, mais protège d'un coup plus lourd",
            juste: a.verdict === "gravite",
            retour:
              a.verdict === "gravite"
                ? `Oui : en moyenne, l'assurance coûte ${eur(a.primeDeLAnnee - a.esperance)} par an, mais un seul sinistre grave coûterait ${eur(a.pire.cout)}, plus qu'une année de prime. On paie la prime pour ne pas avoir à encaisser ce coup-là.`
                : a.verdict === "garder"
                  ? `Non : le sinistre le plus lourd (${eur(a.pire.cout)}) coûte moins qu'une année de prime (${eur(a.primeDeLAnnee)}). L'entreprise peut l'encaisser elle-même, pour moins cher.`
                  : "Non : ici, l'assurance rapporte même en moyenne.",
          },
          {
            texte: "Garder le risque : le pire sinistre coûte moins qu'une année de prime",
            juste: a.verdict === "garder",
            retour:
              a.verdict === "garder"
                ? `Oui : même le sinistre le plus lourd (${eur(a.pire.cout)}) coûte moins que la prime de l'année (${eur(a.primeDeLAnnee)}), et ${a.esperance > 0 ? `l'espérance n'est que de ${eur(a.esperance)}` : "l'espérance est nulle"}. Mieux vaut garder ce risque, et prévenir les aléas qu'on peut prévenir.`
                : `Non : le sinistre le plus lourd coûterait ${eur(a.pire.cout)}, plus qu'une année de prime (${eur(a.primeDeLAnnee)}).`,
          },
          {
            texte:
              a.trimestresNeutralises === 0
                ? "Ne pas s'assurer : aucun sinistre n'est tombé dans l'année jouée"
                : "S'assurer : un sinistre est tombé dans l'année jouée, la prime s'est payée",
            juste: false,
            retour: "Non : une année ne dit pas la moyenne. On décide sur l'espérance, calculée avec les probabilités du scénario, et sur la gravité du pire sinistre, pas sur ce que le hasard a donné une fois.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["fixed_costs"],
      texte: (c) => {
        const a = assurance(c);
        return [
          `Chez ${c.entreprise}, la formule « ${a.formule.nom} » coûte ${eur(a.primeDeLAnnee)} par an ; ${a.tirables.length > 1 ? "les aléas qu'elle couvre et que l'arène peut tirer" : "l'aléa qu'elle couvre et que l'arène peut tirer"} ${a.esperance > 0 ? `${a.tirables.length > 1 ? "coûtent" : "coûte"} en moyenne ${eur(a.esperance)} par an` : `ne ${a.tirables.length > 1 ? "coûtent" : "coûte"} rien en moyenne`} ; le plus lourd des aléas couverts, ${eur(a.pire.cout)} d'un seul coup.`,
          "Une assurance coûte en moyenne plus qu'elle ne rend : la prime paie les sinistres de tous les assurés, et l'assureur. On s'assure contre ce qu'on ne pourrait pas encaisser, la gravité, pas contre la moyenne ; un risque petit et fréquent se garde, ou se prévient.",
        ];
      },
      repere: () => "Espérance des sinistres = probabilité × trimestres où l'aléa peut tomber × part de l'entreprise × coût d'un sinistre. On la compare à la prime, puis on regarde le pire.",
    },
  ],
};
