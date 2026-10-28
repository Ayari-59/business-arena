import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_SOLDES, anneeDeNova, soldesDeNova } from "../../chapitres/soldes-intermediaires";
import { auCentime } from "../../monde/amortissement";
import { empruntALaCloture } from "../../monde/emprunt";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « SOLDES INTERMÉDIAIRES DE GESTION ET CAF » : QUAND LE TAUX MONTE
 * (comptabilité générale, palier 4).
 *
 * La banque annonce que le taux de l'emprunt de NOVA sera relevé de 2 points à la renégociation. La
 * directrice financière demande quels soldes l'auraient senti si la hausse avait joué tout l'exercice,
 * et de combien, et si elle peut l'accepter : elle ne veut pas perdre plus de 2 000 € de résultat net.
 * L'élève refait seul la cascade du chapitre sur l'exercice de NOVA, puis la redescend avec des
 * intérêts plus lourds, l'impôt recalculé au barème (le taux réduit, puis le taux normal). Un curseur
 * sur le taux montre jusqu'où la perte reste tolérable ; un calcul à rebours donne le taux limite,
 * par l'impôt économisé ; la réponse est un jugement face à ce seuil.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres viennent de
 * `soldesDeNova` et `anneeDeNova` (la charge d'intérêts au nouveau taux est celle du contrat de prêt,
 * monde/emprunt.ts). Le seuil de la directrice est une hypothèse de l'histoire.
 */

/**
 * La hausse du taux de l'emprunt : 2 points, l'ordre de grandeur de la remontée des taux des crédits
 * aux entreprises en 2022 et 2023, ce qu'une renégociation fait payer à un emprunt souscrit bas.
 */
export const HAUSSE_DU_TAUX = 0.02;

/** LE SEUIL DE LA DIRECTRICE, hypothèse du cours : au plus 2 000 € de résultat net perdus sur un exercice. */
export const PERTE_DE_RESULTAT_TOLEREE = 2_000;

/** Les bornes du curseur du taux, en % entiers : du taux d'aujourd'hui à 12 %. */
export const TAUX_DU_CURSEUR = { min: 5, max: 12 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${qte(x)} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

export type Verdict = "acceptable" | "trop-cher";

/** Les chiffres de la réponse, calculés une fois de l'exercice de NOVA. */
export function tauxQuiMonte(c: Pick<Cas, "code">) {
  const x = soldesDeNova(c);
  const f = x.f;
  const taux = f.pret.tauxAnnuel;
  const nouveauTaux = auCentime((taux + HAUSSE_DU_TAUX) * 100) / 100;
  const apres = anneeDeNova(f, { tauxDeLEmprunt: nouveauTaux });
  const emprunt = empruntALaCloture({ ...f.pret, tauxAnnuel: nouveauTaux });
  const surcout = auCentime(apres.interets - x.interetsDeLEmprunt);
  const perteDeResultat = auCentime(x.resultatNet - apres.sig.resultatNet);
  // NOVA reste au-delà du plafond du taux réduit : chaque euro d'intérêts en plus économise le taux normal.
  const tauxMarginal = f.impot.tauxNormal;
  const parPoint = auCentime(x.interetsDeLEmprunt / (taux * 100));
  const parPointExact = x.interetsDeLEmprunt / (taux * 100);
  const hausseDInteretsTolere = auCentime(PERTE_DE_RESULTAT_TOLEREE / (1 - tauxMarginal));
  const pointsToleresExact = PERTE_DE_RESULTAT_TOLEREE / (1 - tauxMarginal) / parPointExact;
  const pointsToleres = auCentime(pointsToleresExact);
  const tauxLimite = auCentime(taux * 100 + pointsToleresExact);
  const verdict: Verdict = nouveauTaux * 100 <= tauxLimite && perteDeResultat <= PERTE_DE_RESULTAT_TOLEREE ? "acceptable" : "trop-cher";
  return {
    x,
    entreprise: x.entreprise,
    taux,
    nouveauTaux,
    apres,
    emprunt,
    surcout,
    perteDeResultat,
    impotEconomise: auCentime(x.impot - apres.impot),
    perteDeCaf: auCentime(x.caf.additive - apres.caf.additive),
    tauxMarginal,
    parPoint,
    parPointExact,
    hausseDInteretsTolere,
    pointsToleres,
    tauxLimite,
    /** Le curseur : le taux entier le plus haut qui tient le seuil. */
    tauxDuCurseur: Math.floor(taux * 100 + pointsToleresExact + 1e-9),
    verdict,
  };
}

/** Le compte de résultat de l'exercice en grandes masses, et les conditions de l'emprunt : les documents. */
function documents(c: Pick<Cas, "code">): TableauDeDonnees {
  const t = tauxQuiMonte(c);
  const x = t.x;
  const f = x.f;
  const ligne = (libelle: string, valeur: string) => ({ libelle, valeurs: [valeur] });
  return {
    titre: `L'exercice ${dE(t.entreprise)} et son emprunt`,
    colonnes: ["Montant"],
    lignes: [
      ligne("Production de l'exercice", eur(x.sig.production)),
      ligne("Consommations en provenance des tiers", eur(x.sig.consommations)),
      ligne("Charges de personnel", eur(x.sig.personnel)),
      ligne("Dotations aux amortissements, dépréciations et provisions", eur(x.sig.dotations)),
      ligne("Intérêts du compte à terme", eur(x.interetsDuPlacement)),
      ligne("Intérêts de l'emprunt, payés et courus", eur(x.interetsDeLEmprunt)),
      ligne("Escomptes accordés", eur(x.escompte)),
      ligne("Impôt sur les sociétés", eur(x.impot)),
      ligne("Emprunt du 3 janvier, remboursé par trimestre", `${eur(f.pret.capital)}, ${eur(f.pret.capital / (f.pret.dureeAns * f.pret.echeancesParAn))} par échéance`),
      ligne("Taux de l'emprunt aujourd'hui", pct(t.taux * 100)),
      ligne("Hausse annoncée du taux", `${qte(HAUSSE_DU_TAUX * 100)} points`),
      ligne("Impôt sur les sociétés, le barème", `${pct(f.impot.tauxReduit * 100)} jusqu'à ${eur(f.impot.plafondDuTauxReduit)}, ${pct(f.impot.tauxNormal * 100)} au-delà, arrondi à l'euro`),
      ligne("Perte de résultat net que la directrice tolère", eur(PERTE_DE_RESULTAT_TOLEREE)),
    ],
  };
}

export const QUAND_LE_TAUX_MONTE: Situation = {
  code: "quand-le-taux-monte",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["soldes-intermediaires-de-gestion"],
  commanditaire: "La directrice financière",
  titre: "Quand le taux de l'emprunt monte",
  accroche:
    "La banque relèvera le taux de l'emprunt à la renégociation. La directrice financière veut savoir quels soldes de gestion le sentiraient, de combien, et si elle peut l'accepter.",
  objectifs: [
    "Calculer la valeur ajoutée, l'excédent brut d'exploitation, le résultat d'exploitation et le résultat courant avant impôt",
    "Recalculer les intérêts, l'impôt au barème, le résultat net et la capacité d'autofinancement avec un taux plus élevé",
    "Retrouver à rebours le taux le plus haut qu'un seuil de résultat permet, impôt compris",
    "Juger la hausse, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_SOLDES,
    pourquoi: "ce cas reprend le chapitre « Soldes intermédiaires de gestion et CAF », qui se joue sur l'exercice de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la directrice financière",
      tableau: documents,
      texte: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `« À la renégociation, la banque relèvera de ${qte(HAUSSE_DU_TAUX * 100)} points le taux de notre emprunt, de ${pct(t.taux * 100)} à ${pct(t.nouveauTaux * 100)}. Si ce taux avait joué tout l'exercice, quels soldes de gestion l'auraient senti, et de combien ? Je veux le résultat net et la capacité d'autofinancement qu'il nous serait resté. Je peux accepter de perdre jusqu'à ${eur(PERTE_DE_RESULTAT_TOLEREE)} de résultat net, pas plus : dites-moi si la hausse passe, et jusqu'à quel taux j'aurais pu aller. »`,
          "Pas de cours cette fois : vous avez le compte de résultat de l'exercice, et la cascade des soldes est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      repere: () =>
        "À rendre : les soldes de l'exercice, puis les intérêts, l'impôt, le résultat net et la capacité d'autofinancement au nouveau taux, les soldes qui bougent, le taux le plus haut que la directrice peut accepter, et votre réponse.",
    },
    {
      id: "les-soldes-de-l-annee",
      type: "montants",
      titre: "Les soldes de l'exercice",
      notions: ["income_statement", "ebitda_margin"],
      question: () =>
        "Descendez la cascade de l'exercice réel, à partir de la production : la valeur ajoutée, l'excédent brut d'exploitation, le résultat d'exploitation, puis le résultat courant avant impôt.",
      champs: (c) => {
        const x = tauxQuiMonte(c).x;
        const g = x.sig;
        return [
          { libelle: "Valeur ajoutée", attendu: g.valeurAjoutee, calcul: `${eur(g.production)} de production − ${eur(g.consommations)} de consommations = ${eur(g.valeurAjoutee)}` },
          { libelle: "Excédent brut d'exploitation", attendu: g.excedentBrutDExploitation, calcul: `${eur(g.valeurAjoutee)} − ${eur(g.personnel)} de personnel = ${eur(g.excedentBrutDExploitation)}` },
          { libelle: "Résultat d'exploitation", attendu: g.resultatDExploitation, calcul: `${eur(g.excedentBrutDExploitation)} − ${eur(g.dotations)} de dotations = ${eur(g.resultatDExploitation)}` },
          {
            libelle: "Résultat courant avant impôt",
            attendu: g.resultatCourantAvantImpot,
            calcul: `${eur(g.resultatDExploitation)} + ${eur(x.interetsDuPlacement)} − ${eur(x.interetsDeLEmprunt)} − ${eur(x.escompte)} = ${eur(g.resultatCourantAvantImpot)}`,
          },
        ];
      },
      explication: (c) => {
        const x = tauxQuiMonte(c).x;
        return [`Les intérêts de l'emprunt, ${eur(x.interetsDeLEmprunt)}, n'apparaissent qu'au résultat financier, entre le résultat d'exploitation et le résultat courant avant impôt : c'est le premier étage où joue le financement.`];
      },
    },
    {
      id: "au-nouveau-taux",
      type: "montants",
      titre: "L'exercice au nouveau taux",
      notions: ["loan_schedule", "income_statement"],
      question: (c) => {
        const t = tauxQuiMonte(c);
        return `Le capital dû ne change pas : chaque échéance paie les intérêts du trimestre sur le capital restant dû, au taux de ${pct(t.nouveauTaux * 100)} ÷ 4. Calculez les intérêts de l'emprunt de l'exercice au nouveau taux (les ${qte(t.emprunt.echeances.length)} échéances payées et les intérêts courus au 31 décembre), puis le résultat courant avant impôt, l'impôt sur les sociétés, le résultat net et la capacité d'autofinancement qui en découlent.`;
      },
      champs: (c) => {
        const t = tauxQuiMonte(c);
        const e = t.emprunt;
        const x = t.x;
        const a = t.apres;
        const capitaux = e.echeances.map((l) => qte(l.capitalDebut)).join(" + ");
        const i = e.interetsCourus;
        return [
          {
            libelle: "Intérêts de l'emprunt au nouveau taux",
            attendu: a.interets,
            calcul: `(${capitaux}) × ${pct(t.nouveauTaux * 100)} ÷ 4 = ${eur(e.interetsPayes)} payés, + ${qte(i.echeanceSuivante!.capitalDebut)} × ${pct(t.nouveauTaux * 100)} ÷ 4 × ${qte(i.jours)} ÷ ${qte(i.joursDeLaPeriode)} = ${eur(i.montant)} courus : ${eur(a.interets)}`,
            tolerance: 1,
          },
          {
            libelle: "Résultat courant avant impôt",
            attendu: a.sig.resultatCourantAvantImpot,
            calcul: `${eur(x.sig.resultatCourantAvantImpot)} − ${eur(t.surcout)} d'intérêts en plus = ${eur(a.sig.resultatCourantAvantImpot)}`,
            tolerance: 1,
          },
          {
            libelle: "Impôt sur les sociétés",
            attendu: a.impot,
            calcul: `${eur(x.f.impot.plafondDuTauxReduit)} × ${pct(x.f.impot.tauxReduit * 100)} + (${eur(a.sig.resultatCourantAvantImpot)} − ${eur(x.f.impot.plafondDuTauxReduit)}) × ${pct(t.tauxMarginal * 100)}, arrondi à l'euro = ${eur(a.impot)}`,
            tolerance: 1,
          },
          { libelle: "Résultat net", attendu: a.sig.resultatNet, calcul: `${eur(a.sig.resultatCourantAvantImpot)} − ${eur(a.impot)} = ${eur(a.sig.resultatNet)}`, tolerance: 1 },
          { libelle: "Capacité d'autofinancement", attendu: a.caf.additive, calcul: `${eur(a.sig.resultatNet)} + ${eur(a.caf.dotations)} de dotations = ${eur(a.caf.additive)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `La hausse coûte ${eur(t.surcout)} d'intérêts en plus. Le résultat net ne baisse que de ${eur(t.perteDeResultat)} : moins de bénéfice, c'est aussi ${eur(t.impotEconomise)} d'impôt en moins, au taux normal sur les derniers euros. L'État prend sa part de la hausse.`,
          `La capacité d'autofinancement baisse de ${eur(t.perteDeCaf)} : les intérêts se paient, ils sortent de la banque. L'impôt économisé, lui, y reste.`,
        ];
      },
    },
    {
      id: "ce-qui-bouge",
      type: "tri",
      titre: "Les soldes qui bougent",
      notions: ["ebitda_margin", "income_statement"],
      question: () => "Rangez chaque solde : la hausse du taux le fait bouger, ou il reste le même.",
      categories: [
        { code: "bouge", libelle: "Il bouge" },
        { code: "reste", libelle: "Il reste le même" },
      ],
      elements: (c) => {
        const t = tauxQuiMonte(c);
        const a = t.apres.sig;
        const reste = "Il se calcule avant les charges financières : la dette n'y entre pas.";
        return [
          { libelle: "Production de l'exercice", montant: a.production, categorie: "reste", pourquoi: reste },
          { libelle: "Valeur ajoutée", montant: a.valeurAjoutee, categorie: "reste", pourquoi: reste },
          { libelle: "Excédent brut d'exploitation", montant: a.excedentBrutDExploitation, categorie: "reste", pourquoi: reste },
          { libelle: "Résultat d'exploitation", montant: a.resultatDExploitation, categorie: "reste", pourquoi: reste },
          { libelle: "Résultat courant avant impôt", montant: a.resultatCourantAvantImpot, categorie: "bouge", pourquoi: `Il porte les intérêts : ${eur(t.surcout)} de plus.` },
          { libelle: "Résultat net", montant: a.resultatNet, categorie: "bouge", pourquoi: `Il suit le résultat courant, l'impôt recalculé : ${eur(t.perteDeResultat)} de moins.` },
          { libelle: "Capacité d'autofinancement", montant: t.apres.caf.additive, categorie: "bouge", pourquoi: "Les intérêts se paient : ce que l'activité laisse baisse avec eux." },
        ];
      },
      explication: () => [
        "Une charge financière ne touche que le bas de la cascade. C'est pourquoi l'analyste compare deux entreprises du même métier par leur EBE : il ne dépend pas de la dette que chacune a choisie.",
      ],
    },
    {
      id: "jusqu-ou-le-taux",
      type: "curseur",
      titre: "Jusqu'où le taux peut monter",
      notions: ["loan_schedule", "income_statement"],
      question: (c) => {
        const t = tauxQuiMonte(c);
        return `Faites monter le taux de l'emprunt de ${pct(TAUX_DU_CURSEUR.min)} à ${pct(TAUX_DU_CURSEUR.max)}. Une droite donne la perte de résultat net que la directrice tolère, ${eur(PERTE_DE_RESULTAT_TOLEREE)} ; l'autre ce que la hausse coûte au résultat net, l'impôt économisé déduit (chaque point coûte environ ${eur(t.parPoint)} d'intérêts sur l'exercice). Placez le curseur sur le taux entier le plus haut qui tient le seuil, puis validez.`;
      },
      grandeur: () => ({ libelle: "Taux de l'emprunt", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: tauxQuiMonte(c).tauxDuCurseur, min: TAUX_DU_CURSEUR.min, max: TAUX_DU_CURSEUR.max }),
      zones: ["Dans le seuil de la directrice", "Au-delà du seuil"],
      rates: () => ({
        dessous: "À ce taux, la perte reste sous le seuil : le taux peut monter encore.",
        dessus: "À ce taux, le résultat net perd déjà plus que la directrice ne tolère.",
      }),
      montrer: "Montrer le taux",
      lecture: (c, taux) => {
        const t = tauxQuiMonte(c);
        const a = anneeDeNova(t.x.f, { tauxDeLEmprunt: taux / 100 });
        return [
          { libelle: "Intérêts de l'emprunt sur l'exercice", montant: a.interets },
          { libelle: "Impôt sur les sociétés", montant: a.impot },
          { libelle: "Résultat net", montant: a.sig.resultatNet },
          { libelle: "Perte de résultat net", montant: auCentime(t.x.resultatNet - a.sig.resultatNet), fort: true },
          { libelle: "Excédent brut d'exploitation", montant: a.sig.excedentBrutDExploitation },
        ];
      },
      droites: (c) => {
        const t = tauxQuiMonte(c);
        return {
          produit: () => PERTE_DE_RESULTAT_TOLEREE,
          cout: (taux) => (taux - t.taux * 100) * t.parPointExact * (1 - t.tauxMarginal),
          libelles: ["Perte que la directrice tolère", "Perte de résultat net, impôt déduit"],
        };
      },
      explication: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `Jusqu'à ${pct(t.tauxDuCurseur)}, la perte reste sous ${eur(PERTE_DE_RESULTAT_TOLEREE)} ; au point suivant, elle le dépasse. La droite de la perte est moins raide que celle des intérêts : sur chaque euro d'intérêts en plus, l'État en prend ${qte(t.tauxMarginal * 100)} centimes d'impôt. Et l'EBE ne bouge à aucun taux.`,
        ];
      },
    },
    {
      id: "le-taux-limite",
      type: "montants",
      titre: "Le taux le plus haut, à rebours",
      notions: ["loan_schedule", "income_statement"],
      question: () =>
        "Le curseur donne un taux entier ; la directrice veut le taux exact. Retrouvez la hausse d'intérêts qui coûte exactement le seuil de résultat net, impôt déduit, la hausse du taux qu'elle représente, en points, puis le taux le plus haut acceptable.",
      champs: (c) => {
        const t = tauxQuiMonte(c);
        return [
          {
            libelle: "Hausse d'intérêts qui coûte le seuil de résultat net",
            attendu: t.hausseDInteretsTolere,
            calcul: `${eur(PERTE_DE_RESULTAT_TOLEREE)} ÷ (1 − ${pct(t.tauxMarginal * 100)}) = ${eur(t.hausseDInteretsTolere)}`,
            tolerance: 0.5,
          },
          {
            libelle: "Hausse du taux supportable, en points",
            attendu: t.pointsToleres,
            calcul: `${eur(t.hausseDInteretsTolere)} ÷ ${eur(t.parPoint)} par point (${eur(t.x.interetsDeLEmprunt)} ÷ ${qte(t.taux * 100)}) = ${qte(t.pointsToleres)} points`,
            tolerance: 0.01,
          },
          { libelle: "Taux le plus haut acceptable (%)", attendu: t.tauxLimite, calcul: `${pct(t.taux * 100)} + ${qte(t.pointsToleres)} points = ${pct(t.tauxLimite)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const t = tauxQuiMonte(c);
        return [
          `Oublier l'impôt, c'est arrêter le taux à ${pct(auCentime(t.taux * 100 + PERTE_DE_RESULTAT_TOLEREE / t.parPointExact))} : on croirait la hausse plus dangereuse qu'elle n'est. Le calcul tient tant que le résultat reste au-delà du plafond du taux réduit, où chaque euro de charge économise ${pct(t.tauxMarginal * 100)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice financière",
      question: () => "Quelle phrase envoyez-vous à la directrice financière ?",
      options: (c) => {
        const t = tauxQuiMonte(c);
        const x = t.x;
        return [
          {
            texte:
              t.verdict === "acceptable"
                ? `Accepter : le résultat net perd ${eur(t.perteDeResultat)}, sous vos ${eur(PERTE_DE_RESULTAT_TOLEREE)}`
                : `Refuser : le résultat net perdrait ${eur(t.perteDeResultat)}, plus que vos ${eur(PERTE_DE_RESULTAT_TOLEREE)}`,
            juste: true,
            retour: `Oui : ${eur(t.surcout)} d'intérêts en plus, dont l'impôt reprend ${eur(t.impotEconomise)}. Le résultat net passe de ${eur(x.resultatNet)} à ${eur(t.apres.sig.resultatNet)}, la capacité d'autofinancement de ${eur(x.caf.additive)} à ${eur(t.apres.caf.additive)} ; l'EBE reste à ${eur(x.sig.excedentBrutDExploitation)}. Le seuil tiendrait jusqu'à ${pct(t.tauxLimite)}.`,
          },
          {
            texte: `${t.verdict === "acceptable" ? "Refuser" : "Accepter"} : la hausse coûte ${eur(t.surcout)} de résultat net, ${t.verdict === "acceptable" ? "trop près de vos" : "sous vos"} ${eur(PERTE_DE_RESULTAT_TOLEREE)}`,
            juste: false,
            retour: `Non : c'est oublier l'impôt. Moins de bénéfice, c'est ${eur(t.impotEconomise)} d'impôt en moins : le résultat net ne perd que ${eur(t.perteDeResultat)}.`,
          },
          {
            texte: "Accepter : la hausse ne touche ni l'EBE ni la capacité d'autofinancement",
            juste: false,
            retour: `L'EBE ne bouge pas, mais la capacité d'autofinancement baisse de ${eur(t.perteDeCaf)} : les intérêts se paient à la banque. C'est la dotation qui ne fait sortir aucun argent.`,
          },
          {
            texte: `Accepter : la hausse ne coûte que ${eur(t.impotEconomise)} de résultat net, l'impôt prend le reste`,
            juste: false,
            retour: `Non : c'est l'inverse. L'impôt ne reprend que ${eur(t.impotEconomise)} des ${eur(t.surcout)} d'intérêts en plus ; le résultat net en perd ${eur(t.perteDeResultat)}.`,
          },
        ];
      },
    },
  ],
};
