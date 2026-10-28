import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  aleaDe,
  aleasDeLAnnee,
  anneeDeProduction,
  capaciteDAbsorption,
  choisirUneAssurance,
  coutDUnAlea,
  encaisser,
  formuleDAssurance,
  machineDe,
  margeUnitaire,
  type ChoixDAssurance,
} from "../monde/capacite";
import { CAPACITES_DU_COURS, type CodeDeFormule, type FicheDeLaCapacite } from "../monde/nova-capacite";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : S'ASSURER CONTRE LES ALÉAS, LA PRIME ET LES SINISTRES (BTS GPME, gestion des risques,
 * palier 3).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : NOVA a une fiche
 * figée (monde/nova-capacite.ts), et les sinistres, les formules et la capacité d'absorption se
 * calculent par le modèle du cours (monde/capacite.ts, partie 4). Une évolution du moteur ne change
 * rien ici. Le chapitre se joue chez NOVA seule, la PME industrielle de la comptabilité et du contrôle
 * de gestion : ses trimestres de N + 1 (où l'outil est le goulot aux trimestres 2 et 4) disent ce
 * qu'un aléa fait perdre, et sa clôture de N ce qu'elle peut encaisser.
 *
 * L'objet : le coût d'un sinistre (ses dommages, et la marge des enceintes qu'il fait perdre, en
 * moyenne sur les trimestres), l'espérance des sinistres, ce qu'une formule rembourse en moyenne (la
 * prime pure) et ce qu'elle coûte de plus (le chargement), le reste à charge (les franchises et les
 * aléas non couverts), puis la capacité d'absorption (la trésorerie au-delà du matelas, les capitaux
 * propres au-dessus de la moitié du capital). LA RÈGLE DU CHAPITRE remplace « prime < pire sinistre »,
 * qui disait oui à toutes les formules : écarter les options dont le pire reste à charge dépasse la
 * capacité d'absorption, puis retenir la moins chère en coût moyen. Chez NOVA, la Basique.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, cout-de-l-incendie, esperance, ce-que-nova-peut-encaisser (la formule est au
 *     repère ou dans la question, qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) : predire-la-probabilite
 *     puis la-probabilite-qui-rentabilise (un curseur sur la probabilité d'incendie : ce que la Basique
 *     rembourse en moyenne face à sa prime, qui se croisent à 28 ‰) avant prime-pure-et-chargement ;
 *     predire-l-incendie puis le-laboratoire-de-l-assurance (la formule, la probabilité d'incendie et le
 *     compte courant : la gravité face à la capacité écarte, la moyenne départage) avant
 *     ce-que-nova-peut-encaisser ; la-tresorerie-qui-garde-la-basique (un curseur sur le compte courant)
 *     avant croitre-et-s-assurer ;
 *   · autonome : prime-pure-et-chargement, l-annee-sans-sinistre (ni formule ni chiffres à prendre ; le
 *     calcul de la correction montre le chemin) ;
 *   · expert : la-panne-selon-le-trimestre (une variante qui oblige à refaire le raisonnement : une
 *     panne ne coûte des ventes que là où l'outil est le goulot), l-etendue-et-ses-franchises (la prime
 *     pure d'une formule à 6 aléas et 2 000 € de franchise), l-incendie-et-la-reserve (le double test,
 *     réserve comprise), la-regle (le choix, face aux erreurs des étudiants : le coût moyen seul, le
 *     pire seul, l'ancienne règle), croitre-et-s-assurer (une variante : la ligne automatisée payée
 *     comptant fait changer de formule) ; puis la synthèse.
 */

/** Les entreprises où le chapitre se joue : NOVA, la seule fiche de capacité du monde du cours. */
export const ENTREPRISES_DE_L_ASSURANCE: readonly string[] = ["nova"];

/** Les bornes du curseur de la probabilité d'incendie, en ‰ par an. */
export const INCENDIE_DU_CURSEUR = { min: 0, max: 60 } as const;

/** Les bornes du curseur du compte courant, en euros : sous la limite où les capitaux propres prennent le relais. */
export const COMPTE_COURANT_DU_CURSEUR = { min: 0, max: 160_000 } as const;

/**
 * Le laboratoire : la probabilité d'incendie, de 1 à 60 ‰ ; le compte courant, de 100 000 € de moins à
 * 200 000 € de plus que celui de la fiche, par pas de 5 000 €.
 */
export const LABORATOIRE_DE_L_ASSURANCE = { incendie: { min: 1, max: 60 }, compte: { enMoins: 100_000, enPlus: 200_000, pas: 5_000 } } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${qte(Math.round(t * 10_000) / 100)} %`;
const pm = (t: number) => `${qte(Math.round(t * 100_000) / 100)} ‰`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de capacité de l'entreprise du cas. */
export function ficheDe(c: Pick<Cas, "code">): FicheDeLaCapacite {
  const f = CAPACITES_DU_COURS[c.code];
  if (!f) throw new Error(`Pas de fiche de capacité pour ${c.code}`);
  return f;
}

/** La fiche, la probabilité de l'incendie changée : le laboratoire et le curseur la font varier. */
export function ficheAvecIncendie(f: FicheDeLaCapacite, probabilite: number): FicheDeLaCapacite {
  return { ...f, aleas: f.aleas.map((a) => (a.code === "incendie" ? { ...a, probabilite } : a)) };
}

/** Le nom d'une option : une formule de l'assureur, ou garder tous les risques. */
const nomDe = (f: FicheDeLaCapacite, choix: ChoixDAssurance | null) =>
  choix === null ? "aucune" : choix === "sans-assurance" ? "Sans assurance" : f.formules.find((x) => x.code === choix)!.nom;

/** L'assurance de NOVA : tout ce que le chapitre et son cas demandent, lu sur la fiche par le modèle du cours. */
export function assuranceDeNova(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const m = margeUnitaire(f);
  const plan = anneeDeProduction(f);
  const { aleas, esperance, lePire } = aleasDeLAnnee(f);
  const incendie = coutDUnAlea(f, "incendie");
  const panne = coutDUnAlea(f, "panne");
  const sans = formuleDAssurance(f, null);
  const basique = formuleDAssurance(f, "basique");
  const etendue = formuleDAssurance(f, "etendue");
  const tousRisques = formuleDAssurance(f, "tous-risques");
  const choix = choisirUneAssurance(f);
  const absorption = capaciteDAbsorption(f);
  const avecLaReserve = capaciteDAbsorption(f, { compterLaReserve: true });
  const lIncendie = encaisser(f, incendie.cout);
  const lIncendieAvecLaReserve = encaisser(f, incendie.cout, { compterLaReserve: true });
  const laPanneMajeure = encaisser(f, aleasDeLAnnee(f).aleas.find((a) => a.code === "panne-majeure")!.cout);
  // Le curseur de la probabilité : la plus petite probabilité (en ‰ entier) où la Basique rembourse sa prime en moyenne.
  const rembourseHorsIncendie = auCentime(basique.primePure - incendie.probabilite * basique.lignes.find((l) => l.code === "incendie")!.rembourse);
  const rembourseDeLIncendie = basique.lignes.find((l) => l.code === "incendie")!.rembourse;
  const probabiliteQuiRentabilise = Math.ceil(((basique.prime - rembourseHorsIncendie) / rembourseDeLIncendie) * 1000 - 1e-9);
  // Le curseur du compte courant : le plus petit compte où le pire reste à charge de la Basique s'encaisse.
  const compteQuiGardeLaBasique = Math.ceil(absorption.matelas + basique.pireResteACharge - 1e-9);
  const plusGrosAchatComptant = auCentime(absorption.compteCourant - compteQuiGardeLaBasique);
  // La variante : la ligne automatisée payée comptant, sur le compte courant.
  const ligne = machineDe(f, "ligne-automatisee");
  const compteApresLAchat = auCentime(absorption.compteCourant - ligne.prix);
  const apresLAchat = choisirUneAssurance(f, { compteCourant: compteApresLAchat });
  const retenueApresLAchat = apresLAchat.options.find((o) => o.choix === apresLAchat.retenue)!;
  const retenue = choix.options.find((o) => o.choix === choix.retenue)!;
  /** Le sinistre le plus lourd que la Basique laisse à NOVA, en minuscules dans une phrase. */
  const pireDeLaBasique = aleaDe(f, basique.aleaDuPire).nom.toLowerCase();
  return {
    pireDeLaBasique,
    f,
    m,
    plan,
    aleas,
    esperance,
    lePire,
    incendie,
    panne,
    sans,
    basique,
    etendue,
    tousRisques,
    options: choix.options,
    retenue,
    laMoinsChere: choix.options.find((o) => o.choix === choix.laMoinsChere)!,
    absorption,
    avecLaReserve,
    lIncendie,
    lIncendieAvecLaReserve,
    laPanneMajeure,
    rembourseHorsIncendie,
    rembourseDeLIncendie,
    probabiliteQuiRentabilise,
    compteQuiGardeLaBasique,
    plusGrosAchatComptant,
    ligne,
    compteApresLAchat,
    capaciteApresLAchat: apresLAchat.capacite,
    retenueApresLAchat,
    surcoutApresLAchat: auCentime(retenueApresLAchat.coutMoyen - retenue.coutMoyen),
    /** Le compte courant au-delà duquel les capitaux propres, et non plus la trésorerie, bornent la capacité. */
    compteOuLesCapitauxPrennentLeRelais: auCentime(absorption.matelas + absorption.parLesCapitaux),
  };
}

export type AssuranceDeNova = ReturnType<typeof assuranceDeNova>;

/** Une position du laboratoire : la formule (0 : sans assurance, puis les formules dans l'ordre de la fiche), la probabilité d'incendie en ‰, le compte courant. */
export interface PositionDeLAssurance {
  formule: number;
  incendie: number;
  compte: number;
}

/** Les options du laboratoire, dans l'ordre de leur valeur : garder les risques, puis chaque formule. */
export const optionsDuLaboratoire = (f: FicheDeLaCapacite): readonly (CodeDeFormule | null)[] => [null, ...f.formules.map((x) => x.code)];

/**
 * Le laboratoire : la formule choisie, sur une fiche où l'incendie a la probabilité donnée et où le
 * compte courant vaut le montant donné. Ce qu'elle coûte en moyenne, le pire qu'elle laisse à NOVA,
 * la capacité d'absorption, et la formule que la règle du chapitre retient à cette position.
 */
export function laboratoireDeLAssurance(f: FicheDeLaCapacite, p: PositionDeLAssurance) {
  const fiche = ficheAvecIncendie(f, p.incendie / 1000);
  const compteCourant = auCentime(p.compte);
  const code = optionsDuLaboratoire(f)[p.formule] ?? null;
  const o = formuleDAssurance(fiche, code);
  const capacite = capaciteDAbsorption(fiche, { compteCourant }).capacite;
  const choix = choisirUneAssurance(fiche, { compteCourant });
  return {
    choisie: (code ?? "sans-assurance") as ChoixDAssurance,
    nom: o.nom,
    prime: o.prime,
    primePure: o.primePure,
    resteEspere: o.resteEspere,
    coutMoyen: o.coutMoyen,
    pire: o.pireResteACharge,
    capacite,
    resteApresLePire: auCentime(capacite - o.pireResteACharge),
    retenue: choix.retenue,
    nomDeLaRetenue: nomDe(f, choix.retenue),
    pireDeLaBasique: formuleDAssurance(fiche, "basique").pireResteACharge,
  };
}

/** Les aléas de NOVA, leur probabilité, leurs dommages, ce qu'ils font perdre et leur coût : le document de l'espérance. */
function tableauDesAleas(a: AssuranceDeNova): TableauDeDonnees {
  return {
    titre: `Les aléas ${dE(a.f.entreprise)}, sur une année`,
    colonnes: ["Probabilité dans l'année", "Dommages", "Enceintes perdues, en moyenne", "Coût d'un sinistre"],
    lignes: a.aleas.map((x) => ({ libelle: x.nom, valeurs: [pct(x.probabilite), eur(x.dommages), qte(x.enceintesPerdues), eur(x.cout)] })),
  };
}

/** Les formules de l'assureur : la prime, la franchise, ce qu'elles couvrent. */
function tableauDesFormules(a: AssuranceDeNova): TableauDeDonnees {
  const noms = (codes: readonly string[]) => a.aleas.filter((x) => codes.includes(x.code)).map((x) => x.nom.toLowerCase());
  return {
    titre: "Les formules de l'assureur",
    colonnes: ["Prime par trimestre", "Franchise par sinistre", "Aléas couverts"],
    lignes: a.f.formules.map((x) => ({ libelle: x.nom, valeurs: [eur(x.primeParTrimestre), eur(x.franchise), noms(x.couverts).join(", ")] })),
  };
}

const AU_PLUS_UN =
  "La simulation du cours suppose qu'un aléa tombe au plus une fois dans l'année, à un trimestre que rien ne permet de prévoir : quand il touche la ligne, son coût est la moyenne des 4 trimestres de N + 1. Un sinistre se compte avant impôt.";

export const S_ASSURER_CONTRE_LES_ALEAS: Chapitre = {
  code: "s-assurer-contre-les-aleas",
  parcours: "gpme",
  palier: 3,
  blocs: ["BTS GPME Bloc 2 · Participer à la gestion des risques de la PME"],
  titre: "S'assurer contre les aléas : la prime et les sinistres",
  accroche:
    "La prime se paie à coup sûr, le sinistre peut-être. Chiffrer ce que coûtent les aléas de NOVA en moyenne, ce qu'une formule rembourse et ce qu'elle coûte de plus, puis ce que l'entreprise peut encaisser d'un seul coup : la règle qui choisit une assurance.",
  objectifs: [
    "Chiffrer le coût d'un sinistre, dommages et ventes perdues, et l'espérance des sinistres d'une année",
    "Calculer la prime pure, le chargement, le reste à charge et le coût moyen d'une formule",
    "Mesurer la capacité d'absorption d'une PME par sa trésorerie et ses capitaux propres",
    "Choisir une assurance : écarter ce qui ne s'encaisse pas, puis retenir la moins chère en moyenne",
    "Relier une décision de croissance payée comptant à la protection qu'il faut acheter",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ASSURANCE,
    pourquoi:
      "ce chapitre se joue dans la simulation du cours chez NOVA, la PME industrielle de la comptabilité et du contrôle de gestion : ses trimestres disent ce qu'un aléa fait perdre, et sa clôture ce qu'elle peut encaisser.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Les aléas de NOVA",
      notions: ["capacity", "fixed_costs"],
      tableau: (c) => tableauDesAleas(assuranceDeNova(c)),
      texte: (c) => {
        const a = assuranceDeNova(c);
        const f = a.f;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${f.entreprise}, sur l'année N + 1 qu'elle prévoit. Sa ligne monte ${qte(f.ligne.capaciteParTrimestre)} ${f.unites} par trimestre ; la demande prévue, ${qte(a.plan.demande)} ${f.unites}, la dépasse aux trimestres 2 et 4 : là, l'outil est le goulot. Chaque enceinte vendue laisse ${eur(a.m)} de marge sur coût variable, et une demande qui n'est pas servie dans son trimestre est perdue.`,
          `${f.entreprise} est exposée à ${a.aleas.length} aléas. Certains abîment ou arrêtent la ligne, d'autres coûtent sans toucher l'outil. ${AU_PLUS_UN}`,
          `L'assureur propose ${f.formules.length} formules. La prime se paie chaque trimestre, qu'un sinistre tombe ou non ; sur un sinistre couvert, l'assureur paie ce qui dépasse la franchise, que ${f.entreprise} garde. ${f.entreprise} a souscrit la ${f.formules[0]!.nom} le 1er octobre N. Avant de la renouveler, il faut savoir ce qu'elle protège, et ce qu'elle coûte.`,
        ];
      },
      repere: () => "Coût d'un sinistre = dommages + marge des ventes qu'il fait perdre. Espérance d'un aléa = probabilité × coût d'un sinistre.",
    },
    {
      id: "cout-de-l-incendie",
      type: "montants",
      titre: "Ce que coûte un incendie",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const a = assuranceDeNova(c);
        return {
          titre: "L'incendie de l'atelier, posé à chaque trimestre de N + 1",
          colonnes: a.plan.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Ventes du plan", valeurs: a.plan.trimestres.map((t) => qte(t.production)) },
            { libelle: "Ventes, la ligne à l'arrêt tout le trimestre", valeurs: a.plan.trimestres.map(() => qte(0)) },
          ],
        };
      },
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Un incendie détruit la ligne et arrête l'atelier tout un trimestre : ${eur(a.incendie.dommages)} de dommages, et aucune enceinte vendue ce trimestre-là. Calculez les enceintes perdues en moyenne (la moyenne des ventes perdues sur les 4 trimestres), leur marge à ${eur(a.m)} l'enceinte, puis le coût d'un incendie (dommages plus marge perdue).`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        return [
          {
            libelle: "Enceintes perdues, en moyenne",
            attendu: a.incendie.enceintesPerdues,
            calcul: `(${a.incendie.parTrimestre.map((t) => qte(t.enceintesPerdues)).join(" + ")}) ÷ 4 = ${qte(a.incendie.enceintesPerdues)}`,
          },
          { libelle: "Marge perdue", attendu: a.incendie.margePerdue, calcul: `${qte(a.incendie.enceintesPerdues)} × ${eur(a.m)} = ${eur(a.incendie.margePerdue)}` },
          { libelle: "Coût d'un incendie", attendu: a.incendie.cout, calcul: `${eur(a.incendie.dommages)} + ${eur(a.incendie.margePerdue)} = ${eur(a.incendie.cout)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        return [
          `Un incendie coûterait ${eur(a.incendie.cout)} à ${a.f.entreprise}, dont ${eur(a.incendie.margePerdue)} de ventes perdues : plus que les dommages eux-mêmes. Une assurance qui ne rembourserait que les murs et la ligne laisserait le plus gros à l'entreprise ; c'est pourquoi la ${a.f.formules[0]!.nom} couvre aussi les pertes d'exploitation.`,
        ];
      },
    },
    {
      id: "la-panne-selon-le-trimestre",
      type: "montants",
      titre: "Variante : la panne, trimestre par trimestre",
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const a = assuranceDeNova(c);
        return {
          titre: `La ligne ${dE(a.f.entreprise)} au plan de N + 1`,
          colonnes: a.plan.trimestres.map((t) => `T${t.trimestre}`),
          lignes: [
            { libelle: "Demande", valeurs: a.plan.trimestres.map((t) => qte(t.demande)) },
            { libelle: "Capacité de la ligne", valeurs: a.plan.trimestres.map((t) => qte(t.capaciteOutil)) },
            { libelle: "Ventes du plan", valeurs: a.plan.trimestres.map((t) => qte(t.production)) },
          ],
        };
      },
      question: (c) => {
        const a = assuranceDeNova(c);
        const p = aleaDe(a.f, "panne");
        return `La panne de la ligne retire ${pct(p.perteDeCapacite)} de sa capacité pendant un trimestre, et coûte ${eur(p.dommages)} de réparation. Combien d'enceintes fait-elle perdre si elle tombe au trimestre 1 ? Au trimestre 2 ? Puis calculez son coût moyen, sur les 4 trimestres.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const t = a.panne.parTrimestre;
        const cap = a.plan.trimestres[0]!.capaciteOutil * (1 - a.panne.perteDeCapacite);
        return [
          { libelle: "Enceintes perdues, panne au trimestre 1", attendu: t[0]!.enceintesPerdues, calcul: `${qte(a.plan.trimestres[0]!.production)} − min(${qte(a.plan.trimestres[0]!.demande)} ; ${qte(cap)}) = ${qte(t[0]!.enceintesPerdues)}` },
          { libelle: "Enceintes perdues, panne au trimestre 2", attendu: t[1]!.enceintesPerdues, calcul: `${qte(a.plan.trimestres[1]!.production)} − min(${qte(a.plan.trimestres[1]!.demande)} ; ${qte(cap)}) = ${qte(t[1]!.enceintesPerdues)}` },
          {
            libelle: "Coût moyen de la panne",
            attendu: a.panne.cout,
            calcul: `${eur(a.panne.dommages)} + (${t.map((x) => qte(x.enceintesPerdues)).join(" + ")}) ÷ 4 × ${eur(a.m)} = ${eur(a.panne.dommages)} + ${eur(a.panne.margePerdue)} = ${eur(a.panne.cout)}`,
          },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        const t = a.panne.parTrimestre;
        return [
          `La même panne fait perdre ${qte(t[0]!.enceintesPerdues)} enceintes au trimestre 1 et ${qte(t[1]!.enceintesPerdues)} au trimestre 2 : au trimestre 1, la ligne amputée sert encore presque toute la demande ; au trimestre 2, la ligne était déjà le goulot, et chaque enceinte de capacité perdue est une vente perdue. Un aléa sur l'outil coûte surtout là où l'outil est le goulot.`,
          `D'où son coût moyen, ${eur(a.panne.cout)} : ce n'est pas ce qu'elle coûte à coup sûr, c'est ce qu'elle coûte quand elle tombe, en moyenne sur les trimestres où elle peut tomber.`,
        ];
      },
    },
    {
      id: "esperance",
      type: "montants",
      titre: "L'espérance des sinistres",
      notions: ["capacity", "income_statement"],
      tableau: (c) => tableauDesAleas(assuranceDeNova(c)),
      question: (c) => {
        const a = assuranceDeNova(c);
        return `L'espérance d'un aléa est sa probabilité dans l'année multipliée par le coût d'un sinistre. Calculez l'espérance de l'incendie (${pct(a.incendie.probabilite)} × ${eur(a.incendie.cout)}), celle de la panne de la ligne, puis l'espérance des sinistres de l'année, la somme de celles des ${a.aleas.length} aléas.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        return [
          { libelle: "Espérance de l'incendie", attendu: a.incendie.esperance, calcul: `${pct(a.incendie.probabilite)} × ${eur(a.incendie.cout)} = ${eur(a.incendie.esperance)}` },
          { libelle: "Espérance de la panne de la ligne", attendu: a.panne.esperance, calcul: `${pct(a.panne.probabilite)} × ${eur(a.panne.cout)} = ${eur(a.panne.esperance)}` },
          { libelle: "Espérance des sinistres de l'année", attendu: a.esperance, calcul: `${a.aleas.map((x) => eur(x.esperance)).join(" + ")} = ${eur(a.esperance)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        return [
          `En moyenne, les aléas coûtent ${eur(a.esperance)} par an à ${a.f.entreprise}. C'est une moyenne : la plupart des années, il ne tombe rien de grave ; l'année d'un incendie, ${eur(a.incendie.cout)} partent d'un coup. L'incendie pèse peu dans la moyenne (${eur(a.incendie.esperance)}), la panne de la ligne beaucoup (${eur(a.panne.esperance)}) : rare et grave d'un côté, fréquent et léger de l'autre.`,
        ];
      },
    },
    {
      id: "predire-la-probabilite",
      type: "choix",
      titre: "Pariez sur la probabilité qui paie la prime",
      notions: ["fixed_costs"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Avant de calculer, pariez. La ${a.basique.nom} coûte ${eur(a.basique.prime)} de prime par an. Sur un incendie, elle rembourse ${eur(a.rembourseDeLIncendie)} (le coût moins la franchise). La fiche lui donne ${pct(a.incendie.probabilite)} de probabilité par an. À quelle probabilité d'incendie la ${a.basique.nom} rembourserait-elle sa prime en moyenne ?`;
      },
      options: (c) => {
        const a = assuranceDeNova(c);
        const p = a.probabiliteQuiRentabilise;
        const voir = "Faites varier la probabilité à l'étape suivante : le curseur montre où ce que la formule rembourse rattrape sa prime.";
        return [
          { texte: "Sous 2 % par an", juste: p < 20, retour: `${p < 20 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Entre 2 % et 4 % par an", juste: p >= 20 && p <= 40, retour: `${p >= 20 && p <= 40 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
          { texte: "Au-delà de 4 % par an", juste: p > 40, retour: `${p > 40 ? "Bon pari." : "Pari à vérifier."} ${voir}` },
        ];
      },
    },
    {
      id: "la-probabilite-qui-rentabilise",
      type: "curseur",
      titre: "La probabilité qui rentabilise la prime",
      notions: ["fixed_costs"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Faites varier la probabilité d'incendie de ${qte(INCENDIE_DU_CURSEUR.min)} à ${qte(INCENDIE_DU_CURSEUR.max)} ‰ par an, tout le reste comme sur la fiche. Une droite donne ce que la ${a.basique.nom} rembourse en moyenne, l'autre sa prime de l'année. Placez le curseur sur la plus petite probabilité où le remboursement moyen couvre la prime, puis validez.`;
      },
      grandeur: () => ({ libelle: "Probabilité d'incendie dans l'année", unite: "‰" }),
      cible: (c) => ({ attendu: assuranceDeNova(c).probabiliteQuiRentabilise, min: INCENDIE_DU_CURSEUR.min, max: INCENDIE_DU_CURSEUR.max }),
      zones: ["La formule rembourse plus que sa prime", "La formule coûte plus qu'elle ne rembourse"],
      rates: () => ({
        dessous: "À cette probabilité, la formule rembourse en moyenne moins que sa prime : l'assureur garde la différence.",
        dessus: "Plus bas, le remboursement moyen couvre encore la prime : cherchez la plus petite probabilité.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, q) => {
        const a = assuranceDeNova(c);
        const rembourse = auCentime(a.rembourseHorsIncendie + (q / 1000) * a.rembourseDeLIncendie);
        return [
          { libelle: "Espérance de l'incendie", montant: auCentime((q / 1000) * a.incendie.cout) },
          { libelle: "Remboursé en moyenne par la formule", montant: rembourse },
          { libelle: "Prime de l'année", montant: a.basique.prime },
          { libelle: "Chargement : prime moins remboursé en moyenne", montant: auCentime(a.basique.prime - rembourse), fort: true },
        ];
      },
      droites: (c) => {
        const a = assuranceDeNova(c);
        return {
          produit: (q) => a.rembourseHorsIncendie + (q / 1000) * a.rembourseDeLIncendie,
          cout: () => a.basique.prime,
          libelles: ["Remboursé en moyenne par la formule", "Prime de l'année"],
        };
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        return [
          `Il faudrait ${qte(a.probabiliteQuiRentabilise)} ‰ d'incendie par an, près de ${qte(Math.round(a.probabiliteQuiRentabilise / (a.incendie.probabilite * 1000)))} fois la probabilité de la fiche (${pm(a.incendie.probabilite)}), pour que la ${a.basique.nom} rembourse sa prime en moyenne. À la probabilité de la fiche, elle rembourse ${eur(a.basique.primePure)} pour ${eur(a.basique.prime)} de prime : l'écart est le chargement, ce que l'assureur garde pour ses frais et pour le risque qu'il porte.`,
          "En moyenne, l'assurance coûte : c'est le cas de presque toutes les assurances, et c'est ce qui fait vivre l'assureur. Si on s'assure, ce n'est donc pas pour gagner en moyenne. L'étape suivante chiffre ce que la formule coûte de plus.",
        ];
      },
    },
    {
      id: "prime-pure-et-chargement",
      type: "montants",
      titre: "La prime pure, le chargement, le coût moyen",
      notions: ["fixed_costs", "income_statement"],
      tableau: (c) => tableauDesFormules(assuranceDeNova(c)),
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Sans formule cette fois, avec les coûts des sinistres de l'étape de l'espérance. Calculez ce que la ${a.basique.nom} rembourse en moyenne (sa prime pure), ce que sa prime de l'année coûte de plus (son chargement), puis ce que l'année coûte en moyenne à ${a.f.entreprise} si elle la prend, prime et sinistres compris.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const b = a.basique;
        const couverts = b.lignes.filter((l) => l.couvert);
        return [
          {
            libelle: "Prime pure de la formule",
            attendu: b.primePure,
            calcul: `${couverts.map((l) => `${pct(l.probabilite)} × (${eur(l.cout)} − ${eur(b.franchise)})`).join(" + ")} = ${couverts.map((l) => eur(l.rembourseEspere)).join(" + ")} = ${eur(b.primePure)}`,
          },
          { libelle: "Chargement de la formule", attendu: b.chargement, calcul: `${eur(b.primeParTrimestre)} × 4 − ${eur(b.primePure)} = ${eur(b.prime)} − ${eur(b.primePure)} = ${eur(b.chargement)}` },
          {
            libelle: "Coût moyen de l'année, assurée",
            attendu: b.coutMoyen,
            calcul: `prime + reste à charge espéré = ${eur(b.prime)} + (${eur(a.esperance)} − ${eur(b.primePure)}) = ${eur(b.coutMoyen)}, soit l'espérance des sinistres plus le chargement`,
          },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        const b = a.basique;
        return [
          `Assurée par la ${b.nom}, ${a.f.entreprise} paie en moyenne ${eur(b.coutMoyen)} par an : la prime, ${eur(b.prime)}, et ce qui lui reste des sinistres, ${eur(b.resteEspere)} (les franchises, et les aléas que la formule ne couvre pas). Sans assurance, ${eur(a.esperance)}. La différence est le chargement, ${eur(b.chargement)} : toute formule coûte en moyenne plus que garder les risques.`,
          "Coût moyen = prime + reste à charge espéré = espérance des sinistres + chargement. Si l'on ne regardait que la moyenne, on ne s'assurerait jamais. Ce qui reste à regarder, c'est le pire.",
        ];
      },
    },
    {
      id: "l-etendue-et-ses-franchises",
      type: "montants",
      titre: "L'Étendue et ses franchises",
      notions: ["fixed_costs", "income_statement"],
      tableau: (c) => tableauDesFormules(assuranceDeNova(c)),
      question: (c) => {
        const a = assuranceDeNova(c);
        return `L'${a.etendue.nom} couvre ${a.etendue.couverts.length} des ${a.aleas.length} aléas, avec une franchise plus basse. Calculez sa prime pure, le reste à charge espéré de ${a.f.entreprise} si elle la prend, puis son coût moyen de l'année.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const e = a.etendue;
        const couverts = e.lignes.filter((l) => l.couvert);
        return [
          {
            libelle: "Prime pure de l'Étendue",
            attendu: e.primePure,
            calcul: `${couverts.map((l) => `${pct(l.probabilite)} × ${eur(l.rembourse)}`).join(" + ")} = ${eur(e.primePure)}`,
          },
          { libelle: "Reste à charge espéré avec l'Étendue", attendu: e.resteEspere, calcul: `${eur(a.esperance)} − ${eur(e.primePure)} = ${eur(e.resteEspere)}` },
          { libelle: "Coût moyen de l'année avec l'Étendue", attendu: e.coutMoyen, calcul: `${eur(e.prime)} + ${eur(e.resteEspere)} = ${eur(e.coutMoyen)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        const e = a.etendue;
        const t = a.tousRisques;
        return [
          `L'${e.nom} rembourse en moyenne ${eur(e.primePure)} pour ${eur(e.prime)} de prime : un chargement de ${eur(e.chargement)}, et un coût moyen de ${eur(e.coutMoyen)}, ${eur(auCentime(e.coutMoyen - a.basique.coutMoyen))} de plus que la ${a.basique.nom}. Les ${t.nom} coûtent en moyenne ${eur(t.coutMoyen)}. Plus la formule couvre, plus elle coûte en moyenne : le chargement monte avec la couverture.`,
          `En échange, elle réduit le pire. Avec l'${e.nom}, le plus lourd sinistre que ${a.f.entreprise} garderait est ${eur(e.pireResteACharge)} ; avec la ${a.basique.nom}, ${eur(a.basique.pireResteACharge)} ; sans assurance, ${eur(a.sans.pireResteACharge)}.`,
        ];
      },
    },
    {
      id: "predire-l-incendie",
      type: "choix",
      titre: "Pariez sur l'incendie",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return `Avant de calculer, pariez. Au 1er janvier N + 1, ${a.f.entreprise} a ${eur(k.compteCourant)} sur son compte courant, ${eur(k.reserve)} placés en réserve, et ${eur(k.capitauxPropres)} de capitaux propres pour ${eur(k.capitalSocial)} de capital. Sans assurance, pourrait-elle encaisser un incendie, ${eur(a.incendie.cout)} d'un seul coup ?`;
      },
      options: (c) => {
        const a = assuranceDeNova(c);
        const voir = "Le laboratoire de l'étape suivante le chiffre : formule, probabilité d'incendie et compte courant.";
        const seul = a.lIncendie.seEncaisse;
        const parLaReserve = !seul && a.lIncendieAvecLaReserve.parLaTresorerie && a.lIncendieAvecLaReserve.parLesCapitaux;
        const aucun = !seul && !parLaReserve;
        const dit = (juste: boolean) => `${juste ? "Bon pari." : "Pari à vérifier."} ${voir}`;
        return [
          { texte: "Oui : ses capitaux propres dépassent le coût du sinistre", juste: seul, retour: dit(seul) },
          { texte: "Oui, en puisant dans la réserve placée", juste: parLaReserve, retour: dit(parLaReserve) },
          { texte: "Non : ni sa trésorerie ni ses capitaux propres ne l'encaissent", juste: aucun, retour: dit(aucun) },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-assurance",
      type: "simulation",
      titre: "Le laboratoire de l'assurance",
      notions: ["net_treasury", "fixed_costs"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Choisissez une formule, faites varier la probabilité d'incendie et le compte courant ${dE(a.f.entreprise)}. Le tableau suit ce que la formule coûte en moyenne, le pire sinistre qu'elle laisse à ${a.f.entreprise}, et ce que ${a.f.entreprise} peut encaisser d'un coup : sa capacité d'absorption, la plus petite de deux limites, la trésorerie au-delà d'un matelas de ${eur(a.absorption.matelas)} et les capitaux propres au-dessus de la moitié du capital. Le graphique suit le compte courant.`;
      },
      leviers: (c) => {
        const a = assuranceDeNova(c);
        const l = LABORATOIRE_DE_L_ASSURANCE;
        const cc = a.absorption.compteCourant;
        return [
          {
            code: "formule",
            libelle: "Formule",
            unite: "",
            min: 0,
            max: a.f.formules.length,
            pas: 1,
            depart: 0,
            choix: optionsDuLaboratoire(a.f).map((code, i) => ({ valeur: i, libelle: nomDe(a.f, code ?? "sans-assurance") })),
          },
          { code: "incendie", libelle: "Probabilité d'incendie dans l'année", unite: "‰", min: l.incendie.min, max: l.incendie.max, pas: 1, depart: Math.round(a.incendie.probabilite * 1000) },
          { code: "compte", libelle: "Compte courant au 1er janvier", unite: "€", min: auCentime(cc - l.compte.enMoins), max: auCentime(cc + l.compte.enPlus), pas: l.compte.pas, depart: cc },
        ];
      },
      lecture: (c, p) => {
        const a = assuranceDeNova(c);
        const pos = p as unknown as PositionDeLAssurance;
        const r = laboratoireDeLAssurance(a.f, pos);
        const d = laboratoireDeLAssurance(a.f, { formule: 0, incendie: Math.round(a.incendie.probabilite * 1000), compte: a.absorption.compteCourant });
        return [
          { libelle: "Prime de l'année", montant: r.prime, reference: d.prime },
          { libelle: "Remboursé en moyenne : la prime pure", montant: r.primePure, reference: d.primePure },
          { libelle: "Coût moyen de l'année, en effet sur le résultat", montant: -r.coutMoyen + 0, reference: -d.coutMoyen + 0, effet: true },
          { libelle: "Pire reste à charge", montant: r.pire, reference: d.pire },
          { libelle: "Capacité d'absorption", montant: r.capacite, reference: d.capacite },
          { libelle: "Capacité qui reste après le pire sinistre", montant: r.resteApresLePire, reference: d.resteApresLePire, fort: true },
        ];
      },
      graphique: (c) => {
        const a = assuranceDeNova(c);
        return {
          levier: "compte",
          courbes: [
            { libelle: "Capacité d'absorption", valeur: (p) => laboratoireDeLAssurance(a.f, p as unknown as PositionDeLAssurance).capacite },
            { libelle: "Pire reste à charge de la formule choisie", valeur: (p) => laboratoireDeLAssurance(a.f, p as unknown as PositionDeLAssurance).pire },
          ],
        };
      },
      defi: (c) => {
        const a = assuranceDeNova(c);
        const options = optionsDuLaboratoire(a.f);
        const solution = { formule: options.indexOf(a.retenueApresLAchat.code), incendie: Math.round(a.incendie.probabilite * 1000), compte: a.compteApresLAchat };
        return {
          consigne: `Baissez le compte courant jusqu'à ce que la ${a.basique.nom} ne s'encaisse plus, puis choisissez la formule la moins chère en moyenne dont le pire reste à charge s'encaisse.`,
          atteint: (p) => {
            const r = laboratoireDeLAssurance(a.f, p as unknown as PositionDeLAssurance);
            return r.capacite < r.pireDeLaBasique && r.choisie === r.retenue;
          },
          indice: (p) => {
            const r = laboratoireDeLAssurance(a.f, p as unknown as PositionDeLAssurance);
            return r.capacite >= r.pireDeLaBasique
              ? `La capacité d'absorption vaut ${eur(r.capacite)} : le pire que la ${a.basique.nom} laisse à ${a.f.entreprise}, ${eur(r.pireDeLaBasique)}, s'encaisse encore. Baissez le compte courant.`
              : `À ce compte courant, la formule « ${r.nom} » ${r.pire > r.capacite ? `laisse au pire ${eur(r.pire)}, plus que la capacité (${eur(r.capacite)})` : "s'encaisse, mais une autre qui s'encaisse coûte moins en moyenne"}. Comparez les formules une à une.`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const a = assuranceDeNova(c);
        const r = laboratoireDeLAssurance(a.f, p as unknown as PositionDeLAssurance);
        return [
          `À ${eur(auCentime(p.compte!))} de compte courant, ${a.f.entreprise} ne peut plus encaisser que ${eur(r.capacite)} d'un coup : la ${a.pireDeLaBasique}, que la ${a.basique.nom} lui laisse (${eur(r.pireDeLaBasique)}), ne passerait plus. La règle retient alors la formule « ${r.nomDeLaRetenue} », ${eur(r.coutMoyen)} en moyenne. Payer comptant une machine de ${eur(a.ligne.prix)}, c'est vider le compte courant d'autant, et il faut alors acheter plus de protection.`,
          `Montez le compte courant au-delà de ${eur(a.compteOuLesCapitauxPrennentLeRelais)} : la capacité cesse de monter, les capitaux propres prennent le relais. Et faites varier la probabilité d'incendie : les coûts moyens bougent, le choix non. La gravité face à la capacité écarte une formule ; la moyenne départage celles qui restent.`,
        ];
      },
    },
    {
      id: "ce-que-nova-peut-encaisser",
      type: "montants",
      titre: "La capacité d'absorption",
      notions: ["net_treasury", "balance_sheet"],
      tableau: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return {
          titre: `La clôture ${dE(a.f.entreprise)} au 31 décembre N`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Compte courant", valeurs: [eur(k.compteCourant)] },
            { libelle: "Réserve placée, gardée pour la gamme à venir", valeurs: [eur(k.reserve)] },
            { libelle: "Matelas de trésorerie que le dirigeant garde", valeurs: [eur(k.matelas)] },
            { libelle: "Capitaux propres", valeurs: [eur(k.capitauxPropres)] },
            { libelle: "Capital social", valeurs: [eur(k.capitalSocial)] },
          ],
        };
      },
      question: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return `La capacité d'absorption est ce que l'entreprise peut perdre d'un coup sans se mettre en danger. Par la trésorerie : le compte courant moins le matelas (la réserve n'est pas comptée). Par les capitaux propres : ce qui les sépare de la moitié du capital social (${eur(k.plancherDesCapitaux)}). Calculez les deux, puis la capacité d'absorption, la plus petite des deux.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return [
          { libelle: "Capacité par la trésorerie", attendu: k.parLaTresorerie, calcul: `${eur(k.compteCourant)} − ${eur(k.matelas)} = ${eur(k.parLaTresorerie)}` },
          { libelle: "Capacité par les capitaux propres", attendu: k.parLesCapitaux, calcul: `${eur(k.capitauxPropres)} − ${eur(k.capitalSocial)} × ${qte(k.partDuCapitalAGarder)} = ${eur(k.parLesCapitaux)}` },
          { libelle: "Capacité d'absorption", attendu: k.capacite, calcul: `min(${eur(k.parLaTresorerie)} ; ${eur(k.parLesCapitaux)}) = ${eur(k.capacite)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return [
          `${a.f.entreprise} peut encaisser ${eur(k.capacite)} d'un seul coup, et c'est sa trésorerie qui la limite. Un sinistre plus lourd la laisserait sans matelas, ou ferait passer ses capitaux propres sous la moitié de son capital.`,
          "La moitié du capital n'est pas une faillite : c'est le seuil où la loi oblige les associés à décider s'ils continuent. Le cours en fait une limite de prudence, une hypothèse dite à sa place : une PME qui l'approche a perdu la moitié de ce que ses associés y ont mis.",
        ];
      },
    },
    {
      id: "l-incendie-et-la-reserve",
      type: "montants",
      titre: "L'incendie, même avec la réserve",
      notions: ["net_treasury", "balance_sheet"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Sans assurance, un incendie coûterait ${eur(a.incendie.cout)}. Calculez ce qu'il resterait sur le compte courant, ce qu'il resterait de capitaux propres, puis la capacité par la trésorerie si le dirigeant acceptait de compter la réserve.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        const r = a.avecLaReserve;
        return [
          { libelle: "Compte courant après l'incendie", attendu: a.lIncendie.tresorerieApres, calcul: `${eur(k.compteCourant)} − ${eur(a.incendie.cout)} = ${eur(a.lIncendie.tresorerieApres)}` },
          { libelle: "Capitaux propres après l'incendie", attendu: a.lIncendie.capitauxApres, calcul: `${eur(k.capitauxPropres)} − ${eur(a.incendie.cout)} = ${eur(a.lIncendie.capitauxApres)}` },
          { libelle: "Capacité par la trésorerie, réserve comptée", attendu: r.parLaTresorerie, calcul: `${eur(k.compteCourant)} + ${eur(k.reserve)} − ${eur(k.matelas)} = ${eur(r.parLaTresorerie)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return [
          `L'incendie échoue aux deux tests : le compte courant tomberait à ${eur(a.lIncendie.tresorerieApres)}, et les capitaux propres à ${eur(a.lIncendie.capitauxApres)}, loin sous les ${eur(k.plancherDesCapitaux)} de la moitié du capital.`,
          `Même en comptant la réserve (${eur(a.avecLaReserve.parLaTresorerie)} par la trésorerie), les capitaux propres ne suffiraient pas : l'argent placé paierait la ligne neuve, mais la perte resterait au bilan. Un risque qu'on ne peut pas encaisser se transfère : c'est à cela que sert l'assurance.`,
        ];
      },
    },
    {
      id: "la-regle",
      type: "choix",
      titre: "Quelle formule retenir",
      notions: ["fixed_costs", "net_treasury"],
      tableau: (c) => {
        const a = assuranceDeNova(c);
        return {
          titre: `Les options ${dE(a.f.entreprise)}`,
          colonnes: ["Prime de l'année", "Coût moyen de l'année", "Pire reste à charge"],
          lignes: a.options.map((o) => ({ libelle: o.nom, valeurs: [eur(o.prime), eur(o.coutMoyen), eur(o.pireResteACharge)] })),
        };
      },
      question: (c) => {
        const a = assuranceDeNova(c);
        return `${a.f.entreprise} peut encaisser ${eur(a.absorption.capacite)} d'un coup. Quelle option retenez-vous, et pourquoi ?`;
      },
      options: (c) => {
        const a = assuranceDeNova(c);
        const r = a.retenue;
        const ecartees = a.options.filter((o) => !o.seEncaisse);
        const laPlusSure = a.options.reduce((m, o) => (o.pireResteACharge < m.pireResteACharge ? o : m));
        const touteSousLePire = a.options.filter((o) => o.choix !== "sans-assurance").every((o) => o.prime < a.sans.pireResteACharge);
        return [
          {
            texte: `La ${r.nom} : la moins chère en moyenne des options dont le pire s'encaisse`,
            juste: true,
            retour: `Oui. ${ecartees.map((o) => `${o.choix === "sans-assurance" ? "Garder tous les risques" : `La ${o.nom}`} laisse au pire ${eur(o.pireResteACharge)}`).join(" ; ")}, plus que les ${eur(a.absorption.capacite)} que ${a.f.entreprise} peut encaisser : écarté. Parmi les options qui restent, la ${r.nom} coûte le moins en moyenne, ${eur(r.coutMoyen)}. Son pire, ${eur(r.pireResteACharge)}, passe, avec ${eur(auCentime(a.absorption.capacite - r.pireResteACharge))} de marge : c'est juste, et un dirigeant prudent peut préférer l'${a.etendue.nom}, pour ${eur(auCentime(a.etendue.coutMoyen - r.coutMoyen))} de plus par an.`,
          },
          {
            texte: "Garder les risques : c'est l'option la moins chère en moyenne",
            juste: false,
            retour: `Non : c'est juger sur la moyenne seule. Garder les risques coûte en moyenne ${eur(a.sans.coutMoyen)}, mais un incendie coûterait ${eur(a.sans.pireResteACharge)} d'un coup, que ${a.f.entreprise} ne peut pas encaisser.`,
          },
          {
            texte: `Les ${a.tousRisques.nom} : c'est l'option qui laisse le moins au pire`,
            juste: false,
            retour: `Non : c'est juger sur le pire seul. Les ${a.tousRisques.nom} ne laissent au pire que ${eur(laPlusSure.pireResteACharge)}, mais coûtent ${eur(a.tousRisques.coutMoyen)} en moyenne, quand la ${r.nom} protège déjà de tout ce que ${a.f.entreprise} ne pourrait pas encaisser.`,
          },
          {
            texte: "N'importe laquelle : chaque prime de l'année reste sous le pire sinistre",
            juste: false,
            retour: `Non : ${touteSousLePire ? `c'est vrai de toutes (même ${eur(a.tousRisques.prime)} de prime face à ${eur(a.sans.pireResteACharge)})` : "ce n'est même pas vrai de toutes"}, et c'est pourquoi cette règle ne choisit rien. Elle compare une prime certaine à un sinistre sans sa probabilité, et oublie ce que l'entreprise peut encaisser.`,
          },
        ];
      },
    },
    {
      id: "l-annee-sans-sinistre",
      type: "choix",
      titre: "Une année sans sinistre",
      notions: ["fixed_costs"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `L'année N + 1 se passe sans aucun sinistre. La gérante ${dE(a.f.entreprise)} regrette la ${a.basique.nom} : « Nous l'avons payée pour rien. » Que lui répondez-vous ?`;
      },
      options: (c) => {
        const a = assuranceDeNova(c);
        const b = a.basique;
        return [
          {
            texte: `Elle a coûté sa prime, ${eur(b.prime)}, et a protégé d'un incendie qui ne s'encaissait pas`,
            juste: true,
            retour: `Oui. Une année sans sinistre coûte la prime, ${eur(b.prime)}, rien de plus. Ce que la ${b.nom} a acheté, c'est la certitude qu'un incendie, ${eur(a.incendie.cout)}, ne mettrait pas ${a.f.entreprise} en danger. Une année ne dit ni la moyenne ni le pire.`,
          },
          {
            texte: "La gérante a raison : sans sinistre, mieux vaut ne pas la renouveler",
            juste: false,
            retour: `Non : on décide sur ce qui peut arriver, pas sur ce que le hasard a donné une fois. L'incendie reste possible l'an prochain, et ${a.f.entreprise} ne l'encaisserait pas.`,
          },
          {
            texte: `Elle a coûté ${eur(b.coutMoyen)}, son coût moyen de l'année`,
            juste: false,
            retour: `Non : le coût moyen (${eur(b.coutMoyen)}) compte les sinistres d'une année moyenne. Une année sans sinistre ne coûte que la prime, ${eur(b.prime)}.`,
          },
        ];
      },
    },
    {
      id: "la-tresorerie-qui-garde-la-basique",
      type: "curseur",
      titre: "La trésorerie qui garde la Basique",
      notions: ["net_treasury"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `Le pire que la ${a.basique.nom} laisse à ${a.f.entreprise} est la ${a.pireDeLaBasique}, ${eur(a.basique.pireResteACharge)}. Faites varier le compte courant de ${eur(COMPTE_COURANT_DU_CURSEUR.min)} à ${eur(COMPTE_COURANT_DU_CURSEUR.max)}. Placez le curseur sur le plus petit compte courant où ce sinistre s'encaisse encore, puis validez.`;
      },
      grandeur: () => ({ libelle: "Compte courant", unite: "€" }),
      cible: (c) => ({ attendu: assuranceDeNova(c).compteQuiGardeLaBasique, min: COMPTE_COURANT_DU_CURSEUR.min, max: COMPTE_COURANT_DU_CURSEUR.max }),
      zones: ["Le pire de la Basique s'encaisse", "Le pire de la Basique ne s'encaisse plus"],
      rates: () => ({
        dessous: "À ce compte courant, ce sinistre entamerait le matelas : il ne s'encaisse pas.",
        dessus: "Plus bas, ce sinistre s'encaisse encore : cherchez le plus petit compte courant.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, q) => {
        const a = assuranceDeNova(c);
        const k = capaciteDAbsorption(a.f, { compteCourant: q });
        return [
          { libelle: "Capacité par la trésorerie", montant: k.parLaTresorerie },
          { libelle: "Capacité par les capitaux propres", montant: k.parLesCapitaux },
          { libelle: "Pire reste à charge avec la Basique", montant: a.basique.pireResteACharge },
          { libelle: "Capacité qui reste après ce sinistre", montant: auCentime(k.capacite - a.basique.pireResteACharge), fort: true },
        ];
      },
      droites: (c) => {
        const a = assuranceDeNova(c);
        return {
          produit: (q) => q - a.absorption.matelas,
          cout: () => a.basique.pireResteACharge,
          libelles: ["Capacité par la trésorerie", "Pire reste à charge avec la Basique"],
        };
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        return [
          `Il faut au moins ${eur(a.compteQuiGardeLaBasique)} sur le compte courant : le matelas (${eur(a.absorption.matelas)}) plus la ${a.pireDeLaBasique} (${eur(a.basique.pireResteACharge)}). ${a.f.entreprise} en a ${eur(a.absorption.compteCourant)} : elle peut payer comptant jusqu'à ${eur(a.plusGrosAchatComptant)} sans que la ${a.basique.nom} cesse de lui suffire.`,
          "La protection à acheter ne dépend pas que des risques : elle dépend aussi de ce que l'entreprise a en caisse. L'étape suivante chiffre ce que coûte une machine payée comptant.",
        ];
      },
    },
    {
      id: "croitre-et-s-assurer",
      type: "montants",
      titre: "Variante : la ligne automatisée payée comptant",
      notions: ["net_treasury", "fixed_costs"],
      question: (c) => {
        const a = assuranceDeNova(c);
        return `${a.f.entreprise} envisage d'acheter la ligne automatisée, ${eur(a.ligne.prix)}, et de la payer comptant sur son compte courant le 1er janvier N + 1. Calculez sa capacité d'absorption après l'achat, le coût moyen de la formule que la règle retient alors, puis ce qu'elle coûte de plus par an que la ${a.basique.nom}.`;
      },
      champs: (c) => {
        const a = assuranceDeNova(c);
        const k = a.absorption;
        return [
          {
            libelle: "Capacité d'absorption après l'achat",
            attendu: a.capaciteApresLAchat,
            calcul: `min(${eur(k.compteCourant)} − ${eur(a.ligne.prix)} − ${eur(k.matelas)} ; ${eur(k.parLesCapitaux)}) = ${eur(a.capaciteApresLAchat)}`,
          },
          {
            libelle: "Coût moyen de la formule retenue",
            attendu: a.retenueApresLAchat.coutMoyen,
            calcul: `la ${a.basique.nom} laisse au pire ${eur(a.basique.pireResteACharge)}, plus que ${eur(a.capaciteApresLAchat)} : écartée ; l'${a.retenueApresLAchat.nom} laisse au pire ${eur(a.retenueApresLAchat.pireResteACharge)} et coûte en moyenne ${eur(a.retenueApresLAchat.coutMoyen)}`,
          },
          { libelle: "Surcoût moyen de l'année", attendu: a.surcoutApresLAchat, calcul: `${eur(a.retenueApresLAchat.coutMoyen)} − ${eur(a.retenue.coutMoyen)} = ${eur(a.surcoutApresLAchat)}` },
        ];
      },
      explication: (c) => {
        const a = assuranceDeNova(c);
        return [
          `Payée comptant, la ligne automatisée fait tomber la capacité d'absorption à ${eur(a.capaciteApresLAchat)} : la ${a.pireDeLaBasique} ne s'encaisserait plus, et il faut passer à l'${a.retenueApresLAchat.nom}, ${eur(a.surcoutApresLAchat)} de plus par an en moyenne. Croître réduit ce que l'entreprise peut encaisser ; le coût d'un investissement payé comptant comprend aussi la protection qu'il oblige à acheter.`,
          "Financée par un emprunt, la même machine laisserait le compte courant intact : le choix du financement change aussi l'assurance.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["fixed_costs", "net_treasury"],
      tableau: (c) => {
        const a = assuranceDeNova(c);
        return {
          titre: `Le choix ${dE(a.f.entreprise)}, au 1er janvier N + 1`,
          colonnes: ["Coût moyen de l'année", "Pire reste à charge", "S'encaisse"],
          lignes: a.options.map((o) => ({ libelle: o.nom, valeurs: [eur(o.coutMoyen), eur(o.pireResteACharge), o.seEncaisse ? "oui" : "non"] })),
        };
      },
      texte: (c) => {
        const a = assuranceDeNova(c);
        return [
          `Chez ${a.f.entreprise}, les aléas coûtent en moyenne ${eur(a.esperance)} par an ; le plus lourd, l'incendie, ${eur(a.incendie.cout)} d'un coup, dont ${eur(a.incendie.margePerdue)} de ventes perdues. ${a.f.entreprise} peut encaisser ${eur(a.absorption.capacite)}. Toute formule coûte en moyenne plus que garder les risques : son chargement est toujours positif. La ${a.retenue.nom} est la moins chère de celles dont le pire s'encaisse, ${eur(a.retenue.coutMoyen)} par an en moyenne.`,
          "La règle : on écarte les options dont le pire reste à charge dépasse la capacité d'absorption, puis on retient la moins chère en coût moyen. On s'assure contre ce qu'on ne pourrait pas encaisser ; on garde ce qu'on peut encaisser, ou on le prévient. « Une année de prime sous le pire sinistre » ne choisit rien : toutes les formules y passent.",
          "Au niveau de l'examen, vous savez chiffrer le coût d'un sinistre et l'espérance des sinistres, calculer la prime pure, le chargement et le coût moyen d'une formule, mesurer une capacité d'absorption par la trésorerie et par les capitaux propres, et choisir une assurance en le justifiant, y compris quand une décision de croissance change la capacité.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Espérance des sinistres = Σ probabilité × coût. Prime pure = Σ probabilité × remboursement. Chargement = prime − prime pure. Coût moyen = espérance + chargement. Capacité d'absorption = min(trésorerie − matelas ; capitaux propres − moitié du capital).",
    },
  ],
};

/**
 * @deprecated La formule que la mission « jouez » (src/config/cours/jouez.ts) fait souscrire dans
 * l'arène. Le chapitre ne lit plus l'arène : la formule est celle que la règle du chapitre retient
 * sur la fiche du monde du cours (la Basique chez NOVA, dont le nom est aussi celui d'une formule du
 * scénario de l'arène). Gardé, sans plus rien importer de l'arène, pour jouez.ts qui en lit
 * `formule.name`.
 */
export function formuleRetenue(code: string): { formule: { code: string; name: string; premiumPerRound: number } } {
  const a = assuranceDeNova({ code });
  const r = a.retenue;
  return { formule: { code: r.choix, name: r.nom, premiumPerRound: r.primeParTrimestre } };
}
