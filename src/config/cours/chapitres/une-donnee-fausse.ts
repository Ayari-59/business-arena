import type { CompanyRoundResult } from "../../../engine/types";
import { soldUnits } from "../../../engine/simulation/runGame";
import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { scenarioByCode } from "../../scenarios/registry";
import { accordPluriel } from "../accords";
import { anneeJouee, type Cas } from "../cas";
import { rejouerAvec } from "../gestion-de-la-pme";
import { ENTREPRISES_DU_COURS } from "../metiers";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : UNE DONNÉE FAUSSE, UNE DÉCISION FAUSSE (Bac STMG, systèmes d'information de
 * gestion, palier 1).
 *
 * La qualité des données. À la fin du trimestre 3, le gérant prépare le trimestre 4 : il cale sa
 * production sur la moyenne des ventes des trimestres 1 à 3, lue dans un extrait du tableur de
 * gestion (les ventes, le prix, le chiffre d'affaires de chaque trimestre). Une erreur de saisie
 * s'y est glissée : la virgule des ventes du trimestre 3 a glissé d'un rang. L'élève la repère
 * par un contrôle de cohérence (le chiffre d'affaires ne vaut plus les ventes multipliées par le
 * prix, et les ventes sortent de l'ordre de grandeur des autres trimestres), la corrige à partir
 * du chiffre d'affaires, puis chiffre la décision que l'erreur aurait fait prendre : l'arène
 * rejoue le trimestre 4 avec le plan calé sur la prévision juste, puis sur la prévision fausse.
 * Le chapitre finit sur le contrôle à la saisie qui l'aurait arrêtée.
 *
 * CE QUI VIENT DE L'ARÈNE : les ventes et le chiffre d'affaires des trimestres 1 à 3 de l'année du
 * cours (`anneeJouee`), le prix (chiffre d'affaires ÷ ventes, le même aux trois trimestres de
 * l'extrait : la garde le vérifie ; le bon gestionnaire de l'année peut le changer au trimestre
 * 4), et les deux trimestres 4 rejoués (`rejouerAvec`), où seule la décision de production
 * change. Les ventes de l'extrait sont arrondies à l'unité, et son chiffre d'affaires est celui de
 * ces ventes au prix de l'arène, comme sur une facture : il s'écarte de celui de l'arène de moins
 * d'un demi-prix par trimestre (la garde le vérifie).
 *
 * CE QUE LE COURS AJOUTE, nommé ci-dessous : l'erreur de saisie (le trimestre où elle tombe, et le
 * rang dont la virgule glisse), et la règle de prévision du gérant (la moyenne simple des
 * trimestres de l'extrait), sur laquelle il cale la décision de production du trimestre 4.
 *
 * LA BONNE RÉPONSE EST LA MÊME PARTOUT pour la donnée fausse (les ventes, par construction de
 * l'erreur) et pour le contrôle à la saisie (la cohérence ventes × prix = chiffre d'affaires) ; le
 * verdict sur ce que l'erreur coûte se calcule sur l'année rejouée, et dans les sept entreprises du
 * chapitre il dit, avec les chiffres de l'arène, que la prévision trop basse a fait manquer des
 * ventes au trimestre 4.
 */

/**
 * Les entreprises du chapitre : celles qui vendent un seul produit à un seul prix, où le
 * chiffre d'affaires vaut les ventes multipliées par le prix.
 */
export const ENTREPRISES_A_PRIX_UNIQUE: readonly string[] = ENTREPRISES_DU_COURS.filter((code) => {
  const s = scenarioByCode(code).scenario;
  return !(s.products && s.products.length > 1) && !s.subscription;
});

/** Le trimestre de l'extrait où l'erreur de saisie est glissée. */
export const TRIMESTRE_DE_L_ERREUR = 3;

/**
 * L'ERREUR DE SAISIE : la virgule des ventes glisse d'un rang vers la gauche, et la valeur saisie
 * est celle des vraies ventes divisée par 10 (6 450 devient 645,0). C'est l'erreur de la saisie à
 * la main, au clavier numérique.
 */
export const FACTEUR_DE_LA_VIRGULE = 10;

/** Les trimestres de l'extrait, ceux dont le gérant fait la moyenne. */
export const TRIMESTRES_DE_L_EXTRAIT = [1, 2, 3] as const;

/** Le trimestre décidé sur la prévision : celui qui suit l'extrait. */
export const TRIMESTRE_DECIDE = 4;

/** Un montant à la française, avec le signe moins typographique ; retranché, un négatif va entre parenthèses. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const retranche = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** « de » devant un nom : élidé devant une voyelle, contracté devant l'article. */
const dE = (nom: string) =>
  /^Le /.test(nom) ? `du ${nom.slice(3)}` : /^Les /.test(nom) ? `des ${nom.slice(4)}` : /^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`;

const manquees = (r: CompanyRoundResult) => Object.values(r.market.bySegment).reduce((t, v) => t + v.lost, 0);

/** L'année du cours rejouée, la décision de production du trimestre 4 calée sur une prévision. */
export function anneeAvecLePlan(code: string, cle: string, plan: number) {
  return rejouerAvec(code, `une-donnee-fausse:${cle}`, (t, d) => (t === TRIMESTRE_DECIDE ? { ...d, productionPlan: plan } : undefined));
}

export type Verdict = "l-erreur-coute" | "rien-ne-change" | "l-erreur-rapporte";

/** L'extrait, sa donnée fausse, les deux prévisions, et le trimestre 4 rejoué sur chacune. */
export function donneeFausse(c: Cas) {
  const { partie } = anneeJouee(c.code);
  const lignes = TRIMESTRES_DE_L_EXTRAIT.map((t) => {
    const r = partie.rounds[t - 1]!.results["joueur"]!;
    const ventes = Math.round(soldUnits(r));
    const prix = auCentime(r.incomeStatement.revenue / soldUnits(r));
    const saisie = t === TRIMESTRE_DE_L_ERREUR ? ventes / FACTEUR_DE_LA_VIRGULE : ventes;
    const chiffreDAffaires = auCentime(ventes * prix);
    const recalcule = auCentime(saisie * prix);
    return { trimestre: t, ventes, saisie, prix, chiffreDAffaires, recalcule, ecart: auCentime(chiffreDAffaires - recalcule) };
  });
  const fausse = lignes.find((l) => l.trimestre === TRIMESTRE_DE_L_ERREUR)!;
  const autres = lignes.filter((l) => l !== fausse);
  const n = lignes.length;
  const sommeJuste = lignes.reduce((t, l) => t + l.ventes, 0);
  const sommeFausse = lignes.reduce((t, l) => t + l.saisie, 0);
  const previsionJuste = Math.round(sommeJuste / n);
  const previsionFausse = Math.round(sommeFausse / n);
  const juste = anneeAvecLePlan(c.code, "plan-sur-la-prevision-juste", previsionJuste);
  const faux = anneeAvecLePlan(c.code, "plan-sur-la-prevision-fausse", previsionFausse);
  const k = TRIMESTRE_DECIDE - 1;
  const tj = juste[k]!;
  const tf = faux[k]!;
  const venduesJuste = Math.round(soldUnits(tj));
  const venduesFausse = Math.round(soldUnits(tf));
  const margeJuste = Math.round(tj.incomeStatement.grossMargin);
  const margeFausse = Math.round(tf.incomeStatement.grossMargin);
  const resultatJuste = Math.round(tj.incomeStatement.operatingIncome);
  const resultatFausse = Math.round(tf.incomeStatement.operatingIncome);
  const ventesPerdues = venduesJuste - venduesFausse;
  const coutDeLErreur = resultatJuste - resultatFausse;
  const verdict: Verdict = coutDeLErreur > 0 ? "l-erreur-coute" : ventesPerdues === 0 ? "rien-ne-change" : "l-erreur-rapporte";
  return {
    libellePlan: scenarioByCode(c.code).vocabulary.productionPlanLabel,
    lignes,
    fausse,
    autres,
    prix: fausse.prix,
    sommeJuste,
    sommeFausse: auDixieme(sommeFausse),
    previsionJuste,
    previsionFausse,
    ecartDePrevision: previsionJuste - previsionFausse,
    ecartDePrevisionEnPourcentage: auDixieme(((previsionJuste - previsionFausse) / previsionJuste) * 100),
    venduesJuste,
    venduesFausse,
    manqueesJuste: Math.round(manquees(tj)),
    manqueesFausse: Math.round(manquees(tf)),
    margeJuste,
    margeFausse,
    margePerdue: margeJuste - margeFausse,
    resultatJuste,
    resultatFausse,
    ventesPerdues,
    coutDeLErreur,
    verdict,
  };
}

const E = TRIMESTRE_DE_L_ERREUR;
const D = TRIMESTRE_DECIDE;
const PREMIER = TRIMESTRES_DE_L_EXTRAIT[0];
const DERNIER = TRIMESTRES_DE_L_EXTRAIT[TRIMESTRES_DE_L_EXTRAIT.length - 1]!;

export const UNE_DONNEE_FAUSSE: Chapitre = {
  code: "une-donnee-fausse",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 2 · Management du système d'information et performance", "STMG Thème 3 · Information, action et décision"],
  titre: "Une donnée fausse, une décision fausse",
  accroche:
    "Une virgule glisse dans une case du tableur, et la prévision des ventes tombe. Repérer la donnée fausse par un contrôle de cohérence, la corriger, puis chiffrer dans l'arène ce que la décision prise dessus aurait coûté.",
  objectifs: [
    "Dire ce qu'est une donnée exacte, complète et cohérente",
    "Repérer une erreur de saisie par un contrôle de cohérence et par l'ordre de grandeur",
    "Corriger la donnée à partir des autres données",
    "Chiffrer la décision qu'une donnée fausse fait prendre",
    "Choisir le contrôle à la saisie qui arrête l'erreur",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_A_PRIX_UNIQUE,
    pourquoi:
      "ce chapitre contrôle que le chiffre d'affaires vaut les ventes multipliées par le prix, et MAILLE & CO vend une gamme d'articles à des prix différents, comme VOLT FITNESS tire son chiffre d'affaires des abonnés gardés.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un extrait du tableur à vérifier",
      notions: ["revenue", "dashboard"],
      texte: (c) => {
        const r = donneeFausse(c);
        return [
          `À la fin du trimestre ${DERNIER}, le gérant ${dE(c.entreprise)} prépare le trimestre ${D}. Il cale sa décision « ${r.libellePlan} » sur une prévision simple : la moyenne des ventes des trimestres ${PREMIER} à ${DERNIER}. Il la calcule sur un extrait du tableur de gestion, où les ventes sont saisies à la main, et où le prix et le chiffre d'affaires sont repris des factures.`,
          "Une donnée de cet extrait est fausse : une erreur de saisie s'y est glissée. Avant de décider, il faut contrôler la qualité des données. Une donnée de qualité est exacte (elle dit la vraie valeur), complète (rien ne manque) et cohérente (elle s'accorde avec les autres : le chiffre d'affaires vaut les ventes multipliées par le prix).",
          "Les chiffres sont ceux de l'année du cours dans l'arène, les ventes arrondies à l'unité. Seule l'erreur est ajoutée par le cours.",
        ];
      },
      tableau: (c) => {
        const r = donneeFausse(c);
        return {
          titre: `L'extrait du tableur ${dE(c.entreprise)}`,
          colonnes: [`Ventes (${c.unites})`, "Prix de vente", "Chiffre d'affaires"],
          lignes: r.lignes.map((l) => ({ libelle: `Trimestre ${l.trimestre}`, valeurs: [qte(l.saisie), eur(l.prix), eur(l.chiffreDAffaires)] })),
        };
      },
      repere: () => "Contrôle de cohérence : ventes × prix = chiffre d'affaires. Une ligne où l'égalité ne tombe pas cache une donnée fausse.",
    },
    {
      id: "coherence",
      type: "montants",
      titre: "Le contrôle de cohérence",
      notions: ["revenue"],
      question: () =>
        "Pour chaque trimestre de l'extrait, multipliez les ventes par le prix de vente, au centime. Comparez chaque résultat au chiffre d'affaires saisi.",
      champs: (c) =>
        donneeFausse(c).lignes.map((l) => ({
          libelle: `Ventes × prix, trimestre ${l.trimestre}`,
          attendu: l.recalcule,
          calcul: `${qte(l.saisie)} × ${eur(l.prix)} = ${eur(l.recalcule)}`,
        })),
      explication: (c) => {
        const r = donneeFausse(c);
        const f = r.fausse;
        return [
          `Aux trimestres ${r.autres.map((l) => l.trimestre).join(" et ")}, le produit retombe sur le chiffre d'affaires saisi : les données sont cohérentes. Au trimestre ${E}, il donne ${eur(f.recalcule)}, pour ${eur(f.chiffreDAffaires)} saisis : ${eur(f.ecart)} d'écart. Une donnée de cette ligne est fausse.`,
          `L'ordre de grandeur le confirmait déjà : ${qte(f.saisie)} ${c.unites}, quand les autres trimestres en comptent ${r.autres.map((l) => qte(l.ventes)).join(" et ")}.`,
        ];
      },
    },
    {
      id: "donnee",
      type: "choix",
      titre: "La donnée fausse",
      notions: ["revenue"],
      question: (c) => {
        const f = donneeFausse(c).fausse;
        return `Au trimestre ${E}, le chiffre d'affaires ne retombe pas : ${eur(f.chiffreDAffaires)} saisis, ${eur(f.recalcule)} recalculés. Quelle donnée de la ligne est fausse ?`;
      },
      options: (c) => {
        const r = donneeFausse(c);
        const f = r.fausse;
        return [
          {
            texte: `Les ventes du trimestre ${E}`,
            juste: true,
            retour: `Oui : ${qte(f.saisie)} ${c.unites}, ${FACTEUR_DE_LA_VIRGULE} fois moins que les vraies ventes. La virgule a glissé d'un rang à la saisie : ${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)} ${c.unites}. Le prix est celui des autres trimestres, et le chiffre d'affaires reste dans leur ordre de grandeur.`,
          },
          {
            texte: `Le prix du trimestre ${E}`,
            juste: false,
            retour: `Non : c'est le prix des autres trimestres, ${eur(f.prix)}. Ce sont les ventes, ${qte(f.saisie)} ${c.unites}, qui sortent de l'ordre de grandeur : ${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)}.`,
          },
          {
            texte: `Le chiffre d'affaires du trimestre ${E}`,
            juste: false,
            retour: `Non : ${eur(f.chiffreDAffaires)} reste dans l'ordre de grandeur des autres trimestres, et il est repris des factures. Ce sont les ventes saisies à la main, ${qte(f.saisie)} ${c.unites}, qui détonnent.`,
          },
        ];
      },
    },
    {
      id: "prevision",
      type: "montants",
      titre: "Corriger, puis prévoir",
      notions: ["revenue", "capacity"],
      question: () =>
        `Corrigez les ventes du trimestre ${E} à partir du chiffre d'affaires et du prix. Puis calculez la prévision du trimestre ${D}, la moyenne des ventes des trimestres ${PREMIER} à ${DERNIER}, à l'unité : d'abord avec la donnée fausse, ensuite avec la donnée corrigée.`,
      champs: (c) => {
        const r = donneeFausse(c);
        const f = r.fausse;
        const n = r.lignes.length;
        return [
          { libelle: `Ventes corrigées du trimestre ${E} (${c.unites})`, attendu: f.ventes, calcul: `${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)}`, tolerance: 1 },
          {
            libelle: `Prévision avec la donnée fausse (${c.unites})`,
            attendu: r.previsionFausse,
            calcul: `(${r.lignes.map((l) => qte(l.saisie)).join(" + ")}) ÷ ${n} = ${qte(r.previsionFausse)}`,
            tolerance: 1,
          },
          {
            libelle: `Prévision avec la donnée corrigée (${c.unites})`,
            attendu: r.previsionJuste,
            calcul: `(${r.lignes.map((l) => qte(l.ventes)).join(" + ")}) ÷ ${n} = ${qte(r.previsionJuste)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = donneeFausse(c);
        return [
          `Une seule case fausse sur ${r.lignes.length * 3}, et la prévision tombe de ${qte(r.ecartDePrevision)} ${c.unites}, soit ${pct(r.ecartDePrevisionEnPourcentage)} de moins que la prévision juste. Calé sur elle, le plan du trimestre ${D} serait trop bas d'autant.`,
        ];
      },
    },
    {
      id: "arene",
      type: "montants",
      titre: `L'arène rejoue le trimestre ${D}`,
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = donneeFausse(c);
        return {
          titre: `Le trimestre ${D} rejoué par l'arène`,
          colonnes: ["Plan sur la prévision juste", "Plan sur la prévision fausse"],
          lignes: [
            { libelle: `« ${r.libellePlan} » (${c.unites})`, valeurs: [qte(r.previsionJuste), qte(r.previsionFausse)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(r.venduesJuste), qte(r.venduesFausse)] },
            { libelle: `Demande non servie (${c.unites})`, valeurs: [qte(r.manqueesJuste), qte(r.manqueesFausse)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.margeJuste), eur(r.margeFausse)] },
            { libelle: "Résultat de l'activité", valeurs: [eur(r.resultatJuste), eur(r.resultatFausse)] },
          ],
        };
      },
      question: () =>
        `L'arène a rejoué le trimestre ${D} avec chacun des plans : celui calé sur la prévision juste, puis celui calé sur la prévision fausse. Tout le reste est la gestion de l'année du cours. Calculez les ventes perdues à cause de l'erreur, la marge sur coût variable perdue, et ce que l'erreur coûte au résultat de l'activité du trimestre.`,
      champs: (c) => {
        const r = donneeFausse(c);
        return [
          { libelle: `Ventes perdues (${c.unites})`, attendu: r.ventesPerdues, calcul: `${qte(r.venduesJuste)} − ${qte(r.venduesFausse)} = ${qte(r.ventesPerdues)}`, tolerance: 1 },
          { libelle: "Marge perdue", attendu: r.margePerdue, calcul: `${eur(r.margeJuste)} − ${retranche(r.margeFausse)} = ${eur(r.margePerdue)}`, tolerance: 1 },
          {
            libelle: "Coût de l'erreur sur le résultat",
            attendu: r.coutDeLErreur,
            calcul: `${eur(r.resultatJuste)} − ${retranche(r.resultatFausse)} = ${eur(r.coutDeLErreur)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const r = donneeFausse(c);
        return [
          r.verdict === "l-erreur-coute"
            ? `Le plan trop bas laisse repartir des clients qui auraient acheté : ${qte(r.ventesPerdues)} ${c.unites} de moins, et ${eur(r.margePerdue)} de marge perdue. Les charges fixes, elles, ne baissent pas : le résultat du trimestre perd ${eur(r.coutDeLErreur)}.`
            : r.verdict === "rien-ne-change"
              ? `La demande du trimestre restait sous les deux plans : ${c.entreprise} vend autant avec l'un qu'avec l'autre, et l'erreur ne change presque rien au résultat (${eur(r.coutDeLErreur)}).`
              : `Le plan plus bas fait vendre ${qte(r.ventesPerdues)} ${c.unites} de moins, mais il évite plus d'invendus qu'il ne perd de ventes : le résultat monte de ${eur(-r.coutDeLErreur)}.`,
          "Une donnée fausse ne coûte rien tant qu'elle reste dans le tableur : elle coûte le jour où une décision est prise dessus.",
        ];
      },
    },
    {
      id: "verdict",
      type: "choix",
      titre: "Ce que la virgule a coûté",
      notions: ["contribution_margin"],
      question: (c) => `Une virgule déplacée dans une case du tableur. Que retenir du trimestre ${D} ${dE(c.entreprise)} ?`,
      options: (c) => {
        const r = donneeFausse(c);
        return [
          {
            texte: "L'erreur a coûté : la prévision trop basse a fait manquer des ventes",
            juste: r.verdict === "l-erreur-coute",
            retour:
              r.verdict === "l-erreur-coute"
                ? `Oui : ${qte(r.ventesPerdues)} ${c.unites} ${accordPluriel(c, "vendu")} en moins, et ${eur(r.coutDeLErreur)} de résultat en moins sur le seul trimestre ${D}. La décision était fausse parce que la donnée l'était.`
                : `Non : dans l'arène, le résultat ne baisse pas (${eur(-r.coutDeLErreur)} d'écart en faveur du plan faux).`,
          },
          {
            texte: "L'erreur n'a rien coûté : la demande restait sous les deux plans",
            juste: r.verdict === "rien-ne-change",
            retour:
              r.verdict === "rien-ne-change"
                ? `Oui : les ventes sont les mêmes avec les deux plans. L'erreur n'a pas coûté cette fois ; avec plus de clients, elle aurait coûté.`
                : `Non : la demande dépassait le plan faux. La demande non servie monte à ${qte(r.manqueesFausse)} ${c.unites}, contre ${qte(r.manqueesJuste)} avec le plan juste.`,
          },
          {
            texte: "L'erreur a rapporté : le plan plus bas a évité des invendus",
            juste: r.verdict === "l-erreur-rapporte",
            retour:
              r.verdict === "l-erreur-rapporte"
                ? `Oui, par hasard : le plan plus bas évite plus d'invendus qu'il ne perd de ventes, et le résultat monte de ${eur(-r.coutDeLErreur)}. Une décision juste par accident reste une décision prise sur une donnée fausse.`
                : `Non : le plan plus bas a fait perdre ${eur(r.margePerdue)} de marge, et le résultat baisse de ${eur(r.coutDeLErreur)}.`,
          },
        ];
      },
    },
    {
      id: "controle",
      type: "choix",
      titre: "Le contrôle qui l'aurait arrêtée",
      notions: ["dashboard"],
      question: (c) => {
        const f = donneeFausse(c).fausse;
        return `Le tableur aurait pu refuser la saisie de ${qte(f.saisie)} dans la case des ventes du trimestre ${E}. Quel contrôle à la saisie l'aurait arrêtée ?`;
      },
      options: (c) => {
        const f = donneeFausse(c).fausse;
        return [
          {
            texte: "Rendre obligatoire la case des ventes",
            juste: false,
            retour: "Non : ce contrôle protège la complétude, et la case était remplie. Il arrête une case vide, pas une valeur fausse.",
          },
          {
            texte: "N'accepter qu'un nombre dans la case des ventes",
            juste: false,
            retour: `Non : ${qte(f.saisie)} est bien un nombre. Un contrôle de format arrête une lettre ou un symbole, pas une virgule mal placée.`,
          },
          {
            texte: "Comparer ventes × prix au chiffre d'affaires saisi",
            juste: true,
            retour: `Oui : c'est le contrôle de cohérence fait plus haut, confié au tableur au moment de la saisie. ${qte(f.saisie)} × ${eur(f.prix)} = ${eur(f.recalcule)}, loin des ${eur(f.chiffreDAffaires)} des factures : la saisie aurait été refusée avant de servir à la prévision.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const r = donneeFausse(c);
        return [
          `Chez ${c.entreprise}, une virgule déplacée dans les ventes du trimestre ${E} fait passer la prévision du trimestre ${D} de ${qte(r.previsionJuste)} à ${qte(r.previsionFausse)} ${c.unites}. L'arène montre ce que le plan calé dessus aurait changé : ${r.coutDeLErreur >= 0 ? `${eur(r.coutDeLErreur)} de résultat en moins` : `${eur(-r.coutDeLErreur)} de résultat en plus, par hasard`} sur ce seul trimestre.`,
          "Une donnée fausse ne se voit pas toute seule. Elle se trahit par un contrôle de cohérence (un produit ou un total qui ne retombe pas) ou par un ordre de grandeur. Le meilleur contrôle est celui qui l'arrête à la saisie, avant qu'une décision soit prise dessus.",
        ];
      },
      repere: () =>
        "Exactitude, complétude, cohérence : les trois qualités d'une donnée. Le contrôle à la saisie les vérifie avant que la donnée serve à décider.",
    },
  ],
};
