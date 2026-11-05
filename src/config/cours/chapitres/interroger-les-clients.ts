import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  ANS_DE_CONSERVATION,
  COEFFICIENT_DE_CONFIANCE,
  COUT_D_UN_SMS,
  ECHANTILLON_OBTENU,
  FICHIER_DE_LA_CARTE,
  INFLUENCES,
  MOIS_POUR_REPONDRE_A_UNE_DEMANDE,
  REPONSES_INFLUENCE,
  REPONSES_SERVICE,
  SERVICES,
  TAUX_DE_SONDAGE,
  echantillonBrut,
  etudeDuService,
  fichierDeLaCarte,
  partDInfluence,
} from "../monde/clientele-de-la-boutique";
import type { CodeDeClientele } from "../monde/maille-et-co";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "./taux-de-marque";

/**
 * CHAPITRE : INTERROGER LES CLIENTS (BTS MCO, bloc 1, palier 2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les clientèles de janvier de MAILLE & CO (monde/maille-et-co.ts)
 * et l'enquête que la boutique mène auprès d'elles (monde/clientele-de-la-boutique.ts, `etudeDuService`,
 * `echantillonBrut`, `fichierDeLaCarte`). Une évolution du moteur ne change rien ici.
 *
 * L'objet : la direction veut savoir quel service ferait venir les clients plus souvent. L'élève choisit
 * le type d'étude, construit un échantillon par quotas sur les trois clientèles, lit un tri à plat puis un
 * tri croisé, redresse un échantillon biaisé (trop de fidèles, interrogées le mardi matin), chiffre la
 * marge d'incertitude d'une proportion, lit les facteurs d'influence (vitrine, avis en ligne, proches),
 * puis décide de ce que le fichier de la carte peut garder (RGPD : finalité, consentement, durée).
 *
 * Le piège central : le tri à plat brut place les retouches en tête, parce que l'échantillon compte trop
 * de fidèles ; redressé, c'est la nocturne. Et l'écart entre les deux reste sous la marge d'incertitude :
 * l'étude ne tranche pas seule, le tri croisé et un essai le font.
 *
 * LES TROIS TEMPS :
 *   · guidé : intro, quelle-etude, les-quotas, le-tri-a-plat (la formule dans la question) ;
 *   · l'expérience avant la formule : predire-le-biais puis le-laboratoire-de-l-echantillon (la part des
 *     fidèles dans l'échantillon, ce que répond l'étude brute) avant le-redressement ;
 *   · autonome : le-tri-croise, le-redressement, les-facteurs-d-influence, le-fichier, la-conservation ;
 *   · expert : la-marge-d-incertitude, l-echantillon-qui-departage, le-defaut-de-l-etude ; puis
 *     quel-service et la synthèse.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;
const auMillieme = (x: number) => Math.round(x * 1000) / 1000 + 0;
const auDixMillieme = (x: number) => Math.round(x * 10000) / 10000 + 0;

export const POURQUOI_L_ETUDE =
  "la simulation du cours suit un seul point de vente, la boutique MAILLE & CO, dont elle connaît les trois clientèles de janvier : l'enquête se mène auprès d'elles, quelle que soit votre entreprise.";

/** Le nom d'une clientèle, au pluriel et en minuscules. */
export const NOMS_DES_CLIENTELES: Readonly<Record<CodeDeClientele, string>> = { fideles: "clientes fidèles", passants: "passants", comites: "comités d'entreprise" };

/** Le laboratoire de l'échantillon : les fidèles interrogées, de 40 à 160 par 5 ; au départ, celles de l'enquête. */
export const FIDELES_DU_LABORATOIRE = { min: 40, max: 160, pas: 5 } as const;

/** L'étude du chapitre : tout ce que le chapitre et son cas demandent. */
export function etudeDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const e = etudeDuService(f);
  const fichier = fichierDeLaCarte();
  const pct100 = (x: number) => auDixieme(x * 100);
  return {
    f,
    e,
    fichier,
    brutRetouches: pct100(e.brut.retouches / e.taille),
    brutNocturne: pct100(e.brut.nocturne / e.taille),
    redresseRetouches: pct100(e.pRetouches),
    redresseNocturne: pct100(e.pNocturne),
    margeEnPoints: pct100(e.marge),
    pct100,
  };
}

/** Les clientèles de janvier, la population mère de l'enquête. */
export function tableauDeLaPopulation(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = etudeDuChapitre(c);
  return {
    titre: `Les passages de ${x.f.moisDeReference} chez ${x.f.entreprise}, la population à interroger`,
    colonnes: ["Passages du mois", "Interrogés"],
    lignes: (Object.keys(NOMS_DES_CLIENTELES) as CodeDeClientele[]).map((k) => ({ libelle: NOMS_DES_CLIENTELES[k].replace(/^./, (l) => l.toUpperCase()), valeurs: [qte(x.e.population[k]), qte(ECHANTILLON_OBTENU[k])] })),
  };
}

/** Les réponses à la question du service, par clientèle (le tri croisé, en nombres). */
export function tableauDesReponses(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = etudeDuChapitre(c);
  return {
    titre: `« Quel service vous ferait venir plus souvent ? » ${qte(x.e.obtenu)} réponses`,
    colonnes: ["Fidèles", "Passants", "Comités", "Ensemble"],
    lignes: SERVICES.map((s) => ({
      libelle: s.libelle,
      valeurs: [qte(REPONSES_SERVICE.fideles[s.code]), qte(REPONSES_SERVICE.passants[s.code]), qte(REPONSES_SERVICE.comites[s.code]), qte(x.e.brut[s.code])],
    })),
  };
}

/** Les réponses à la question des raisons d'entrer. */
function tableauDesInfluences(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = etudeDuChapitre(c);
  return {
    titre: `« Qu'est-ce qui vous a fait entrer aujourd'hui ? » ${qte(x.e.obtenu)} réponses`,
    colonnes: ["Fidèles", "Passants", "Comités"],
    lignes: INFLUENCES.map((i) => ({ libelle: i.libelle, valeurs: [qte(REPONSES_INFLUENCE.fideles[i.code]), qte(REPONSES_INFLUENCE.passants[i.code]), qte(REPONSES_INFLUENCE.comites[i.code])] })),
  };
}

/** Le fichier de la carte, par date du dernier achat. */
export function tableauDuFichier(): TableauDeDonnees {
  return {
    titre: "Le fichier de la carte de fidélité",
    colonnes: ["Cartes", "Ont accepté les offres"],
    lignes: FICHIER_DE_LA_CARTE.map((r) => ({ libelle: `Dernier achat : ${r.dernierAchat}`, valeurs: [qte(r.cartes), qte(r.consentement)] })),
  };
}

function tableauDeLaSynthese(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = etudeDuChapitre(c);
  return {
    titre: "Le service à lancer, selon la façon de lire l'étude",
    colonnes: ["Tri à plat brut", "Redressé", "Chez les passants"],
    lignes: SERVICES.map((s) => ({
      libelle: s.libelle,
      valeurs: [pct(x.pct100(x.e.brut[s.code] / x.e.taille)), pct(x.pct100(x.e.redresse[s.code] / x.e.taille)), pct(x.pct100(x.e.croise("passants", s.code)))],
    })),
  };
}

export const INTERROGER_LES_CLIENTS: Chapitre = {
  code: "interroger-les-clients",
  parcours: "mco",
  palier: 2,
  blocs: ["BTS MCO Bloc 1 · Développer la relation client et assurer la vente conseil"],
  titre: "Interroger les clients",
  accroche:
    "Quel service ferait venir les clients plus souvent ? Une enquête par quotas, un tri à plat, un tri croisé, un échantillon à redresser et une marge d'incertitude : ce que l'étude dit vraiment, et ce que le fichier clients a le droit de garder.",
  objectifs: [
    "Choisir le type d'étude et la méthode de collecte adaptés à une question de la boutique",
    "Construire un échantillon par quotas et calculer le taux de sondage",
    "Lire un tri à plat et un tri croisé, et redresser un échantillon biaisé",
    "Calculer la marge d'incertitude d'une proportion et dire si un écart est significatif",
    "Dire ce que le fichier clients peut garder, combien de temps et avec quel consentement",
  ],
  libre: false,
  prerequis: ["zone-de-chalandise"],
  ensuite: ["la-vente-conseil"],
  entreprises: { codes: ENTREPRISES_DU_POINT_DE_VENTE, pourquoi: POURQUOI_L_ETUDE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une question, une étude",
      notions: ["segmentation"],
      tableau: tableauDeLaPopulation,
      texte: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, à la boutique ${x.f.entreprise}. La direction se demande quel service ferait venir les clients plus souvent : des retouches, une nocturne le jeudi, le dimanche matin, ou la livraison.`,
          "Une étude documentaire exploite ce qui existe déjà : les ventes, le fichier, les publications. Une étude de terrain va chercher l'information : quantitative pour compter (un questionnaire, des questions fermées ou à échelle), qualitative pour comprendre (des entretiens, des questions ouvertes).",
          "Le questionnaire se diffuse en boutique, en face à face, par un lien au bas du ticket, par courriel ou sur les réseaux sociaux ; un formulaire en ligne en compile les réponses. Les résultats se présentent en tableaux et en graphiques, puis se diffusent à l'équipe.",
          `Ce que la simulation suppose. La population à étudier est celle des passages du mois. On en interroge ${pct(TAUX_DE_SONDAGE * 100, 0)}, en respectant le poids de chaque clientèle : des quotas.`,
        ];
      },
      repere: () => "Taux de sondage = taille de l'échantillon ÷ population mère. Quota d'une clientèle = sa population × le taux de sondage.",
    },
    {
      id: "quelle-etude",
      objectifs: [0],
      type: "tri",
      titre: "Quelle étude pour quelle question ?",
      notions: ["segmentation"],
      question: () =>
        "Rangez chaque question de la direction : une étude documentaire (l'information existe déjà), une étude quantitative de terrain (il faut compter), une étude qualitative de terrain (il faut comprendre).",
      categories: [
        { code: "documentaire", libelle: "Étude documentaire" },
        { code: "quantitative", libelle: "Étude quantitative" },
        { code: "qualitative", libelle: "Étude qualitative" },
      ],
      elements: () => [
        { libelle: "Combien d'habitants compte la première couronne ?", montant: 0, categorie: "documentaire", pourquoi: "Le recensement le publie : inutile de compter soi-même." },
        { libelle: "Quelle part des passages vient d'un retrait de commande ?", montant: 0, categorie: "documentaire", pourquoi: "Le logiciel de caisse le sait déjà : une donnée interne à exploiter." },
        { libelle: "Combien de clients viendraient à une nocturne le jeudi ?", montant: 0, categorie: "quantitative", pourquoi: "Il faut compter des réponses, sur un échantillon représentatif : un questionnaire." },
        { libelle: "Quelle note les clients donnent-ils à l'accueil ?", montant: 0, categorie: "quantitative", pourquoi: "Une question à échelle, de 0 à 10, sur beaucoup de clients : on compte et on fait la moyenne." },
        { libelle: "Pourquoi tant de passants ressortent-ils sans rien acheter ?", montant: 0, categorie: "qualitative", pourquoi: "On cherche les raisons, que l'on ne connaît pas : des entretiens, des questions ouvertes." },
        { libelle: "Que ressentent les clientes devant la nouvelle vitrine ?", montant: 0, categorie: "qualitative", pourquoi: "Des perceptions, des mots : une réunion de quelques clientes, animée et enregistrée." },
      ],
      explication: () => [
        "On commence toujours par chercher ce qui existe : l'étude documentaire coûte peu. Le terrain vient ensuite, qualitatif pour découvrir les raisons, quantitatif pour les mesurer.",
      ],
      relance: "Demandez-vous si l'information existe déjà quelque part, puis s'il faut la compter ou la comprendre.",
    },
    {
      id: "les-quotas",
      objectifs: [1],
      type: "montants",
      titre: "L'échantillon par quotas",
      notions: ["segmentation"],
      tableau: tableauDeLaPopulation,
      question: (c) => {
        const x = etudeDuChapitre(c);
        return `Calculez la population mère (les passages des trois clientèles), puis le quota de chaque clientèle : sa population × ${pct(TAUX_DE_SONDAGE * 100, 0)}. La somme des quotas donne la taille de l'échantillon, ${qte(x.e.taille)} questionnaires.`;
      },
      champs: (c) => {
        const x = etudeDuChapitre(c);
        return [
          { libelle: "Population mère", attendu: x.e.populationMere, calcul: `${(Object.keys(NOMS_DES_CLIENTELES) as CodeDeClientele[]).map((k) => qte(x.e.population[k])).join(" + ")} = ${qte(x.e.populationMere)}` },
          ...(Object.keys(NOMS_DES_CLIENTELES) as CodeDeClientele[]).map((k) => ({
            libelle: `Quota · ${NOMS_DES_CLIENTELES[k]}`,
            attendu: x.e.quotas[k],
            calcul: `${qte(x.e.population[k])} × ${pct(TAUX_DE_SONDAGE * 100, 0)} = ${qte(x.e.quotas[k])}`,
          })),
        ];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `L'échantillon doit compter ${qte(x.e.quotas.fideles)} fidèles, ${qte(x.e.quotas.passants)} passants et ${qte(x.e.quotas.comites)} comités : la même composition que les passages du mois. C'est un échantillon par quotas : l'enquêtrice choisit qui elle interroge, mais elle doit remplir chaque quota.`,
        ];
      },
    },
    {
      id: "le-tri-a-plat",
      objectifs: [2],
      type: "montants",
      titre: "Le tri à plat",
      notions: ["segmentation"],
      tableau: tableauDesReponses,
      question: (c) => {
        const x = etudeDuChapitre(c);
        return `L'enquêtrice a rempli ses ${qte(x.e.obtenu)} questionnaires. Le tri à plat compte les réponses à une question, toutes clientèles ensemble. Calculez la part des réponses de chaque service sur l'ensemble, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = etudeDuChapitre(c);
        return SERVICES.map((s) => ({
          libelle: `Tri à plat · ${s.libelle} (%)`,
          attendu: x.pct100(x.e.brut[s.code] / x.e.taille),
          tolerance: 0.1,
          calcul: `${qte(x.e.brut[s.code])} ÷ ${qte(x.e.taille)} × 100 = ${pct(x.pct100(x.e.brut[s.code] / x.e.taille))}`,
        }));
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [`À première lecture, les retouches arrivent en tête (${pct(x.brutRetouches)}), devant la nocturne (${pct(x.brutNocturne)}). Mais qui a répondu ?`];
      },
    },
    {
      id: "predire-le-biais",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'échantillon",
      notions: ["segmentation"],
      tableau: tableauDeLaPopulation,
      question: (c) => {
        const x = etudeDuChapitre(c);
        return `Avant de calculer, pariez. L'enquêtrice a surtout interrogé le mardi matin : ${qte(ECHANTILLON_OBTENU.fideles)} fidèles au lieu de ${qte(x.e.quotas.fideles)}, ${qte(ECHANTILLON_OBTENU.passants)} passants au lieu de ${qte(x.e.quotas.passants)}. Si l'échantillon avait respecté les quotas, les retouches…`;
      },
      options: () => {
        const voir = "Le laboratoire suivant fait varier la part des fidèles dans l'échantillon : vous verrez le classement bouger.";
        return [
          { texte: "Perdraient la première place", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Garderaient la première place", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Feraient le même score", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-echantillon",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de l'échantillon",
      notions: ["segmentation"],
      question: () =>
        "Faites varier le nombre de fidèles dans l'échantillon (les passants complètent, les deux comités restent). Chaque clientèle répond comme dans l'enquête. Le tableau suit ce que dirait le tri à plat ; le graphique trace la part des retouches et celle de la nocturne. Puis relevez le défi.",
      leviers: () => [{ code: "fideles", libelle: "Clientes fidèles interrogées", unite: "fidèles", min: FIDELES_DU_LABORATOIRE.min, max: FIDELES_DU_LABORATOIRE.max, pas: FIDELES_DU_LABORATOIRE.pas, depart: ECHANTILLON_OBTENU.fideles }],
      lecture: (c, p) => {
        const x = etudeDuChapitre(c);
        const b = echantillonBrut(p.fideles!);
        const d = echantillonBrut(ECHANTILLON_OBTENU.fideles);
        return [
          { libelle: "Passants interrogés", montant: b.passants, reference: d.passants, unite: "passants" },
          { libelle: "Part des retouches", montant: auDixieme(b.part("retouches") * 100), reference: auDixieme(d.part("retouches") * 100), unite: "%" },
          { libelle: "Part de la nocturne", montant: auDixieme(b.part("nocturne") * 100), reference: auDixieme(d.part("nocturne") * 100), unite: "%" },
          { libelle: "Avance de la nocturne", montant: auDixieme((b.part("nocturne") - b.part("retouches")) * 100), reference: auDixieme((d.part("nocturne") - d.part("retouches")) * 100), unite: "points", effet: true, fort: true },
          { libelle: "Part de la nocturne dans la population", montant: x.redresseNocturne, unite: "%" },
        ];
      },
      graphique: () => ({
        levier: "fideles",
        unite: "%",
        courbes: [
          { libelle: "Part des retouches", valeur: (p) => auDixieme(echantillonBrut(p.fideles!).part("retouches") * 100) },
          { libelle: "Part de la nocturne", valeur: (p) => auDixieme(echantillonBrut(p.fideles!).part("nocturne") * 100) },
        ],
      }),
      defi: (c) => {
        const x = etudeDuChapitre(c);
        const juste = (n: number) => Math.abs(echantillonBrut(n).part("nocturne") - x.e.pNocturne) < 1e-9 && Math.abs(echantillonBrut(n).part("retouches") - x.e.pRetouches) < 1e-9;
        return {
          consigne: "Trouvez la composition de l'échantillon dont le tri à plat répond comme la population des passages.",
          atteint: (p) => juste(p.fideles!),
          indice: (p) =>
            p.fideles! > x.e.quotas.fideles
              ? `Avec ${qte(p.fideles!)} fidèles, l'échantillon en compte plus que leur poids dans les passages : leurs retouches pèsent trop. Retirez des fidèles.`
              : `Avec ${qte(p.fideles!)} fidèles, l'échantillon en compte moins que leur poids dans les passages : les passants pèsent trop. Ajoutez des fidèles.`,
          solution: { fideles: x.e.quotas.fideles },
        };
      },
      montrer: "Montrer la bonne composition",
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `À ${qte(x.e.quotas.fideles)} fidèles, le quota, l'échantillon répond comme la population : ${pct(x.redresseNocturne)} pour la nocturne, ${pct(x.redresseRetouches)} pour les retouches. Plus il y a de fidèles, plus les retouches montent : un échantillon qui ne respecte pas ses quotas change le classement.`,
          "Quand on ne peut pas réinterroger, on redresse : c'est l'étape suivante.",
        ];
      },
    },
    {
      id: "le-redressement",
      objectifs: [2],
      type: "montants",
      titre: "Redresser l'échantillon",
      notions: ["segmentation"],
      tableau: tableauDesReponses,
      question: () =>
        "Sans formule cette fois. Redressez l'échantillon : donnez à chaque réponse le poids qui ramène sa clientèle à son quota (au centième), puis calculez les réponses redressées des retouches et de la nocturne.",
      champs: (c) => {
        const x = etudeDuChapitre(c);
        const pf = auCentime(x.e.poids.fideles);
        const pp = auCentime(x.e.poids.passants);
        return [
          { libelle: "Poids d'une réponse de fidèle", attendu: pf, tolerance: 0.01, calcul: `${qte(x.e.quotas.fideles)} ÷ ${qte(ECHANTILLON_OBTENU.fideles)} = ${qte(pf)}` },
          { libelle: "Poids d'une réponse de passant", attendu: pp, tolerance: 0.01, calcul: `${qte(x.e.quotas.passants)} ÷ ${qte(ECHANTILLON_OBTENU.passants)} = ${qte(pp)}` },
          {
            libelle: "Réponses redressées · Retouches",
            attendu: auCentime(x.e.redresse.retouches),
            tolerance: 0.5,
            calcul: `${qte(REPONSES_SERVICE.fideles.retouches)} × ${qte(pf)} + ${qte(REPONSES_SERVICE.passants.retouches)} × ${qte(pp)} = ${qte(auCentime(x.e.redresse.retouches))}`,
          },
          {
            libelle: "Réponses redressées · Nocturne",
            attendu: auCentime(x.e.redresse.nocturne),
            tolerance: 0.5,
            calcul: `${qte(REPONSES_SERVICE.fideles.nocturne)} × ${qte(pf)} + ${qte(REPONSES_SERVICE.passants.nocturne)} × ${qte(pp)} = ${qte(auCentime(x.e.redresse.nocturne))}`,
          },
        ];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `Redressée, la nocturne passe devant : ${pct(x.redresseNocturne)} des réponses, contre ${pct(x.redresseRetouches)} pour les retouches. Une fidèle trop représentée compte pour ${qte(auCentime(x.e.poids.fideles))} réponse, un passant pour ${qte(auCentime(x.e.poids.passants))}.`,
        ];
      },
    },
    {
      id: "le-tri-croise",
      objectifs: [2],
      type: "montants",
      titre: "Le tri croisé",
      notions: ["segmentation"],
      tableau: tableauDesReponses,
      question: () =>
        "Le tri croisé lit une question clientèle par clientèle. Calculez, au dixième, la part des fidèles puis celle des passants qui demandent la nocturne, puis la part de chaque clientèle qui demande les retouches.",
      champs: (c) => {
        const x = etudeDuChapitre(c);
        const champ = (k: "fideles" | "passants", s: "nocturne" | "retouches") => ({
          libelle: `${s === "nocturne" ? "Nocturne" : "Retouches"} · ${NOMS_DES_CLIENTELES[k]} (%)`,
          attendu: x.pct100(x.e.croise(k, s)),
          tolerance: 0.1,
          calcul: `${qte(REPONSES_SERVICE[k][s])} ÷ ${qte(ECHANTILLON_OBTENU[k])} × 100 = ${pct(x.pct100(x.e.croise(k, s)))}`,
        });
        return [champ("fideles", "nocturne"), champ("passants", "nocturne"), champ("fideles", "retouches"), champ("passants", "retouches")];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `Les deux clientèles ne veulent pas la même chose : ${pct(x.pct100(x.e.croise("fideles", "retouches")))} des fidèles demandent les retouches, ${pct(x.pct100(x.e.croise("passants", "nocturne")))} des passants la nocturne. Le tri croisé dit à qui parle chaque service : les passants, ceux que la boutique transforme le moins, sortent du travail tard.`,
        ];
      },
    },
    {
      id: "la-marge-d-incertitude",
      objectifs: [3],
      type: "montants",
      titre: "La marge d'incertitude",
      notions: ["segmentation"],
      question: (c) => {
        const x = etudeDuChapitre(c);
        return `Un échantillon ne donne pas la vraie proportion, mais un intervalle. La marge d'incertitude à 95 % est ${qte(COEFFICIENT_DE_CONFIANCE)} × √(p × (1 − p) ÷ n). Pour la nocturne (p = ${pct(x.redresseNocturne)}, n = ${qte(x.e.taille)}), calculez la marge en points, au dixième, puis les deux bornes de l'intervalle.`;
      },
      champs: (c) => {
        const x = etudeDuChapitre(c);
        const p = x.redresseNocturne / 100;
        const m = x.margeEnPoints;
        return [
          { libelle: "Marge d'incertitude (points)", attendu: m, tolerance: 0.1, calcul: `${qte(COEFFICIENT_DE_CONFIANCE)} × √(${qte(p)} × ${qte(auMillieme(1 - p))} ÷ ${qte(x.e.taille)}) × 100 = ${qte(m)}` },
          { libelle: "Borne basse (%)", attendu: auDixieme(x.redresseNocturne - m), tolerance: 0.1, calcul: `${pct(x.redresseNocturne)} − ${qte(m)} = ${pct(auDixieme(x.redresseNocturne - m))}` },
          { libelle: "Borne haute (%)", attendu: auDixieme(x.redresseNocturne + m), tolerance: 0.1, calcul: `${pct(x.redresseNocturne)} + ${qte(m)} = ${pct(auDixieme(x.redresseNocturne + m))}` },
        ];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `La part de la nocturne est quelque part entre ${pct(auDixieme(x.redresseNocturne - x.margeEnPoints))} et ${pct(auDixieme(x.redresseNocturne + x.margeEnPoints))}. Les retouches, à ${pct(x.redresseRetouches)}, sont dans cet intervalle : sur l'ensemble, l'écart de ${qte(auDixieme(x.redresseNocturne - x.redresseRetouches))} points n'est pas significatif.`,
        ];
      },
    },
    {
      id: "l-echantillon-qui-departage",
      objectifs: [3],
      type: "montants",
      titre: "L'échantillon qui départagerait",
      notions: ["segmentation"],
      question: (c) => {
        const x = etudeDuChapitre(c);
        return `À rebours. Combien faudrait-il de réponses pour que la marge d'incertitude de la nocturne passe sous l'écart avec les retouches (${qte(auDixieme(x.e.ecart * 100))} points) ? Calculez n = ${qte(COEFFICIENT_DE_CONFIANCE)}² × p × (1 − p) ÷ écart², arrondi à l'unité supérieure, puis le taux de sondage qu'il représenterait (en %).`;
      },
      champs: (c) => {
        const x = etudeDuChapitre(c);
        return [
          {
            libelle: "Réponses nécessaires",
            attendu: x.e.tailleQuiDepartage,
            tolerance: 3,
            calcul: `${qte(COEFFICIENT_DE_CONFIANCE)}² × ${qte(auMillieme(x.e.pNocturne))} × ${qte(auMillieme(1 - x.e.pNocturne))} ÷ ${qte(auDixMillieme(x.e.ecart))}² = ${qte(x.e.tailleQuiDepartage)}`,
          },
          { libelle: "Taux de sondage nécessaire (%)", attendu: auDixieme((x.e.tailleQuiDepartage / x.e.populationMere) * 100), tolerance: 0.5, calcul: `${qte(x.e.tailleQuiDepartage)} ÷ ${qte(x.e.populationMere)} × 100 = ${pct(auDixieme((x.e.tailleQuiDepartage / x.e.populationMere) * 100))}` },
        ];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `Il faudrait ${qte(x.e.tailleQuiDepartage)} réponses, ${pct(auDixieme((x.e.tailleQuiDepartage / x.e.populationMere) * 100))} des passages du mois : l'enquête deviendrait un recensement. Quand l'étude ne tranche pas, on regarde la cible visée (le tri croisé) et on teste en vrai, sur une durée courte.`,
        ];
      },
    },
    {
      id: "les-facteurs-d-influence",
      objectifs: [2],
      type: "montants",
      titre: "Ce qui fait entrer",
      notions: ["segmentation"],
      tableau: tableauDesInfluences,
      question: () =>
        "La question 2 demandait ce qui a fait entrer le client. Calculez, au dixième, la part des passants entrés pour la vitrine, puis pour les avis en ligne et les réseaux sociaux, et la part des fidèles entrées pour ces avis.",
      champs: (c) => {
        const x = etudeDuChapitre(c);
        return [
          { libelle: "Passants entrés pour la vitrine (%)", attendu: x.pct100(partDInfluence("passants", "vitrine")), tolerance: 0.1, calcul: `${qte(REPONSES_INFLUENCE.passants.vitrine)} ÷ ${qte(ECHANTILLON_OBTENU.passants)} × 100 = ${pct(x.pct100(partDInfluence("passants", "vitrine")))}` },
          { libelle: "Passants entrés pour les avis en ligne (%)", attendu: x.pct100(partDInfluence("passants", "avis")), tolerance: 0.1, calcul: `${qte(REPONSES_INFLUENCE.passants.avis)} ÷ ${qte(ECHANTILLON_OBTENU.passants)} × 100 = ${pct(x.pct100(partDInfluence("passants", "avis")))}` },
          { libelle: "Fidèles entrées pour les avis en ligne (%)", attendu: x.pct100(partDInfluence("fideles", "avis")), tolerance: 0.1, calcul: `${qte(REPONSES_INFLUENCE.fideles.avis)} ÷ ${qte(ECHANTILLON_OBTENU.fideles)} × 100 = ${pct(x.pct100(partDInfluence("fideles", "avis")))}` },
        ];
      },
      explication: (c) => {
        const x = etudeDuChapitre(c);
        return [
          `Près d'un passant sur trois (${pct(x.pct100(partDInfluence("passants", "avis")))}) est entré sur la foi d'avis en ligne ou d'un réseau social : les influenceurs ne sont pas que des vedettes, ce sont aussi les clients qui notent et les proches qui conseillent. Les fidèles, elles, viennent par habitude.`,
          "S'y ajoutent les facteurs contextuels : la météo, les soldes, l'heure, l'affluence en boutique. Un même client n'achète pas pareil un samedi de soldes et un mardi de pluie.",
        ];
      },
    },
    {
      id: "le-fichier",
      objectifs: [4],
      type: "tri",
      titre: "Ce que le fichier peut garder",
      notions: ["segmentation"],
      question: () =>
        "La carte de fidélité nourrit le fichier clients, le cœur du système d'information commercial. Le RGPD n'autorise que les données nécessaires à la finalité annoncée : suivre les achats et envoyer des offres. Rangez chaque donnée.",
      categories: [
        { code: "oui", libelle: "Utile à la finalité" },
        { code: "non", libelle: "À ne pas collecter" },
      ],
      elements: () => [
        { libelle: "Le nom et le prénom", montant: 0, categorie: "oui", pourquoi: "Ils identifient la cliente de la carte." },
        { libelle: "L'adresse électronique, pour les offres, avec son accord", montant: 0, categorie: "oui", pourquoi: "Utile aux offres ; l'envoi d'une offre par courriel ou SMS à un particulier demande son accord préalable." },
        { libelle: "La taille habituelle", montant: 0, categorie: "oui", pourquoi: "Elle sert le conseil en boutique : la donnée a un lien direct avec la finalité." },
        { libelle: "Le numéro de la carte bancaire", montant: 0, categorie: "non", pourquoi: "Il ne sert pas à la carte de fidélité : le garder exposerait la cliente sans raison." },
        { libelle: "Les revenus du ménage", montant: 0, categorie: "non", pourquoi: "Rien dans la finalité ne les demande : c'est une donnée excessive." },
        { libelle: "La religion ou les opinions", montant: 0, categorie: "non", pourquoi: "Ce sont des données sensibles : interdites, sauf exceptions qui ne concernent pas une boutique." },
      ],
      explication: () => [
        `Le fichier ne garde que le nécessaire, pour une durée limitée ; la cliente peut demander l'accès à ses données, leur rectification ou leur effacement, et la boutique lui répond dans un délai de ${qte(MOIS_POUR_REPONDRE_A_UNE_DEMANDE)} mois au plus. Dans le système d'information, chacun n'a que les droits de son poste : un vendeur consulte la fiche, seul le responsable exporte le fichier.`,
      ],
      relance: "Demandez-vous à quoi la donnée servirait, pour suivre les achats ou envoyer une offre.",
    },
    {
      id: "la-conservation",
      objectifs: [4],
      type: "montants",
      titre: "Combien de temps garder une carte",
      notions: ["segmentation"],
      tableau: tableauDuFichier,
      question: () =>
        `Une carte se garde ${qte(ANS_DE_CONSERVATION)} ans après le dernier achat de sa titulaire, puis s'efface ou s'anonymise ; une offre ne s'envoie qu'à qui l'a acceptée. Calculez les cartes à effacer, les cartes gardées, les destinataires d'une offre par SMS, puis le coût de l'envoi à ${eur(COUT_D_UN_SMS)} le message.`,
      champs: () => {
        const k = fichierDeLaCarte();
        const garde = FICHIER_DE_LA_CARTE.filter((r) => r.code !== "dormantes");
        return [
          { libelle: "Cartes à effacer ou anonymiser", attendu: k.aEffacer, calcul: `Dernier achat il y a plus de ${qte(ANS_DE_CONSERVATION)} ans : ${qte(k.aEffacer)} cartes` },
          { libelle: "Cartes gardées", attendu: k.gardees, calcul: `${qte(k.cartes)} − ${qte(k.aEffacer)} = ${qte(k.gardees)}` },
          { libelle: "Destinataires de l'offre", attendu: k.destinataires, calcul: `${garde.map((r) => qte(r.consentement)).join(" + ")} = ${qte(k.destinataires)} (les cartes gardées qui ont accepté)` },
          { libelle: "Coût de l'envoi", attendu: k.coutDeLaCampagne, calcul: `${qte(k.destinataires)} × ${eur(COUT_D_UN_SMS)} = ${eur(k.coutDeLaCampagne)}` },
        ];
      },
      explication: () => {
        const k = fichierDeLaCarte();
        return [
          `L'offre part à ${qte(k.destinataires)} clientes sur ${qte(k.cartes)} cartes : les ${qte(k.aEffacer)} cartes dormantes s'effacent, même celles qui avaient accepté, et les autres n'ont pas donné leur accord. Un fichier tenu à jour coûte moins cher à exploiter et protège la boutique d'une sanction : la CNIL peut infliger jusqu'à 4 % du chiffre d'affaires mondial.`,
        ];
      },
    },
    {
      id: "le-defaut-de-l-etude",
      objectifs: [3],
      type: "choix",
      titre: "Le défaut qui reste",
      notions: ["segmentation"],
      question: (c) => {
        const x = etudeDuChapitre(c);
        const pass = x.f.clienteles.find((k) => k.code === "passants")!;
        return `Même redressée, l'étude a un défaut. Elle interroge des clients passés en caisse ; or ${qte(pass.entrees)} passants sont entrés en janvier, et ${qte(pass.tickets)} seulement ont acheté. Qu'en concluez-vous ?`;
      },
      options: (c) => {
        const x = etudeDuChapitre(c);
        const pass = x.f.clienteles.find((k) => k.code === "passants")!;
        return [
          {
            texte: "Elle n'entend pas ceux qui ressortent sans acheter",
            juste: true,
            retour: `Oui : ${qte(pass.entrees - pass.tickets)} passants sont ressortis sans acheter, et ce sont eux qu'un nouveau service doit convaincre. Une enquête à la porte, ou des entretiens, les feraient parler.`,
          },
          {
            texte: "Elle est fausse : il faut la jeter et tout recommencer avec un échantillon parfait",
            juste: false,
            retour: "Non : redressée, elle dit des choses utiles, notamment par son tri croisé. Elle a une limite, qu'il faut connaître et compléter.",
          },
          {
            texte: "Aucun : une fois redressée, elle représente toute la clientèle",
            juste: false,
            retour: "Non : le redressement corrige le poids des clientèles interrogées, pas l'absence de ceux qu'on n'a pas interrogés.",
          },
        ];
      },
    },
    {
      id: "quel-service",
      objectifs: [2, 3],
      type: "choix",
      titre: "Quel service lancer ?",
      notions: ["segmentation"],
      question: () => "La direction attend votre conclusion. Laquelle lui rendez-vous ?",
      options: (c) => {
        const x = etudeDuChapitre(c);
        return [
          {
            texte: "Essayer la nocturne un mois, puis mesurer",
            juste: true,
            retour: `Oui : redressée, la nocturne arrive en tête (${pct(x.redresseNocturne)}), et ${pct(x.pct100(x.e.croise("passants", "nocturne")))} des passants la demandent. L'écart avec les retouches reste sous la marge d'incertitude : un essai court, mesuré sur les entrées et la transformation, tranchera.`,
          },
          {
            texte: `Lancer les retouches : elles arrivent en tête du tri à plat, avec ${pct(x.brutRetouches)}`,
            juste: false,
            retour: `Non : ce tri à plat compte trop de fidèles. Redressé, il place la nocturne devant (${pct(x.redresseNocturne)} contre ${pct(x.redresseRetouches)}).`,
          },
          {
            texte: `Ouvrir la nocturne pour de bon : la nocturne l'emporte, ${pct(x.redresseNocturne)} contre ${pct(x.redresseRetouches)}`,
            juste: false,
            retour: `Pas si vite : l'écart (${qte(auDixieme(x.redresseNocturne - x.redresseRetouches))} points) est sous la marge d'incertitude (${qte(x.margeEnPoints)} points). La conclusion est probable, pas sûre : il vaut mieux l'essayer avant de s'engager.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["segmentation"],
      tableau: tableauDeLaSynthese,
      texte: (c) => {
        const x = etudeDuChapitre(c);
        return [
          "L'étude part d'une question de décision. On cherche d'abord l'information qui existe (étude documentaire), puis le terrain : qualitatif pour comprendre, quantitatif pour compter.",
          `Un échantillon par quotas reproduit la composition de la population. S'il la trahit, on redresse : poids = quota ÷ interrogés. Ici, le tri à plat brut plaçait les retouches devant ; redressé, la nocturne passe à ${pct(x.redresseNocturne)}. Le tri croisé dit qui demande quoi.`,
          `Toute proportion a sa marge d'incertitude, ${qte(COEFFICIENT_DE_CONFIANCE)} × √(p(1 − p) ÷ n) : ${qte(x.margeEnPoints)} points ici. Un écart plus petit ne prouve rien. Et le fichier clients ne garde que le nécessaire, avec l'accord pour les offres, ${qte(ANS_DE_CONSERVATION)} ans après le dernier achat au plus.`,
          "Au niveau de l'examen, vous savez choisir une étude, construire et redresser un échantillon, lire tris à plat et croisés, juger un écart avec sa marge d'incertitude, et dire ce que le RGPD permet au fichier.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () => "Quota = population × taux de sondage. Poids de redressement = quota ÷ interrogés. Marge d'incertitude = 1,96 × √(p(1 − p) ÷ n).",
    },
  ],
};
