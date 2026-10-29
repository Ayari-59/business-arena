import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { accordPluriel } from "../accords";
import { type Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FACTEUR_DE_LA_VIRGULE,
  FICHE_DE_CAPACITE,
  TRIMESTRES_DE_L_EXTRAIT,
  TRIMESTRE_DECIDE,
  TRIMESTRE_DE_L_ERREUR,
  donneeFausse as donneeFausseDuMonde,
  extraitDuTableur,
  meilleureCombinaison,
  prevision,
  trimestreDecide,
  type RegleDePrevision,
} from "../monde/gestion-et-information";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : UNE DONNÉE FAUSSE, UNE DÉCISION FAUSSE (Bac STMG, systèmes d'information de
 * gestion, palier 1).
 *
 * La qualité des données. À la fin du trimestre 3, le gérant de NOVA prépare le trimestre 4 : il
 * cale son plan de production sur la moyenne des ventes des trimestres 1 à 3, lue dans un extrait
 * du tableur de gestion (les ventes, le prix, le chiffre d'affaires de chaque trimestre). Une
 * erreur de saisie s'y est glissée : la virgule des ventes du trimestre 3 a glissé d'un rang.
 * L'élève la repère par un contrôle de cohérence (le chiffre d'affaires ne vaut plus les ventes
 * multipliées par le prix, et les ventes sortent de l'ordre de grandeur des autres trimestres), la
 * corrige à partir du chiffre d'affaires, puis chiffre la décision que l'erreur aurait fait prendre :
 * le trimestre 4 rejoué avec le plan calé sur la prévision juste, puis sur la prévision fausse. Un
 * curseur (les ventes à saisir pour que le contrôle retombe) et un laboratoire (la donnée et la
 * règle de prévision qui font manquer le moins de ventes). Le chapitre finit sur le contrôle à la
 * saisie qui aurait arrêté l'erreur.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : les ventes des quatre trimestres de
 * l'année N (nova-capacite.ts), au prix de 59 € hors taxes, la capacité de la ligne. L'erreur de
 * saisie, la règle de prévision et le trimestre 4 rejoué sont des hypothèses du cours, nommées dans
 * monde/gestion-et-information.ts.
 *
 * CE QUI A CHANGÉ. Le chapitre lisait et rejouait l'année de l'arène, dans sept entreprises. Chez
 * NOVA, la virgule fait maintenant passer les ventes du trimestre 3 de 5 810 à 581, la prévision de
 * 5 556 à 3 813 enceintes, et coûte 36 603 € de marge au trimestre 4.
 */

export { FACTEUR_DE_LA_VIRGULE, TRIMESTRES_DE_L_EXTRAIT, TRIMESTRE_DECIDE, TRIMESTRE_DE_L_ERREUR };

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_A_PRIX_UNIQUE = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_LA_DONNEE_FAUSSE =
  "ce chapitre contrôle que le chiffre d'affaires vaut les ventes multipliées par le prix, chez NOVA, qui vend une seule enceinte à un seul prix.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'extrait, sa donnée fausse, les deux prévisions de la moyenne, et le trimestre 4 sur chacune. */
export function donneeFausse(_c?: Cas) {
  const r = donneeFausseDuMonde(FICHE_DE_CAPACITE);
  return { ...r, autres: r.lignes.filter((l) => l !== r.fausse), margePerdue: r.coutDeLErreur };
}

export type Verdict = ReturnType<typeof donneeFausse>["verdict"];

const E = TRIMESTRE_DE_L_ERREUR;
const D = TRIMESTRE_DECIDE;
const PREMIER = TRIMESTRES_DE_L_EXTRAIT[0];
const DERNIER = TRIMESTRES_DE_L_EXTRAIT[TRIMESTRES_DE_L_EXTRAIT.length - 1]!;

/** Les positions du laboratoire : la donnée (0 : la donnée fausse, 1 : corrigée) et la règle (0 : la moyenne, 1 : le dernier trimestre). */
const DONNEES = [false, true] as const;
const REGLES: readonly RegleDePrevision[] = ["moyenne", "dernier"];
const planDe = (p: Readonly<Record<string, number>>) => prevision(FICHE_DE_CAPACITE, REGLES[p.regle!]!, DONNEES[p.donnee!]!);

export const UNE_DONNEE_FAUSSE: Chapitre = {
  code: "une-donnee-fausse",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 2 · Management du système d'information et performance", "STMG Thème 3 · Information, action et décision"],
  titre: "Une donnée fausse, une décision fausse",
  accroche:
    "Une virgule glisse dans une case du tableur, et la prévision des ventes tombe. Repérer la donnée fausse par un contrôle de cohérence, la corriger, puis chiffrer ce que la décision prise dessus aurait coûté.",
  objectifs: [
    "Dire ce qu'est une donnée exacte, complète et cohérente",
    "Repérer une erreur de saisie par un contrôle de cohérence et par l'ordre de grandeur",
    "Corriger la donnée à partir des autres données",
    "Chiffrer la décision qu'une donnée fausse fait prendre",
    "Choisir le contrôle à la saisie qui arrête l'erreur",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_A_PRIX_UNIQUE, pourquoi: POURQUOI_LA_DONNEE_FAUSSE },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Un extrait du tableur à vérifier",
      notions: ["revenue", "dashboard"],
      texte: (c) => [
        `À la fin du trimestre ${DERNIER}, le gérant ${dE(c.entreprise)} prépare le trimestre ${D}. Il cale son plan de production sur une prévision simple : la moyenne des ventes des trimestres ${PREMIER} à ${DERNIER}. Il la calcule sur un extrait du tableur de gestion.`,
        "Une donnée de cet extrait est fausse : une erreur de saisie s'y est glissée. Avant de décider, il faut contrôler la qualité des données. Une donnée de qualité est exacte (elle dit la vraie valeur), complète (rien ne manque) et cohérente (elle s'accorde avec les autres).",
        `Les ventes sont celles de l'année N ${dE(c.entreprise)} ; le chiffre d'affaires vient des factures. Seule l'erreur est ajoutée par le cours.`,
      ],
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
      objectifs: [1],
      type: "montants",
      titre: "Le contrôle de cohérence",
      notions: ["revenue"],
      question: () => "Pour chaque trimestre de l'extrait, multipliez les ventes par le prix de vente, au centime. Comparez chaque résultat au chiffre d'affaires saisi.",
      champs: (c) => donneeFausse(c).lignes.map((l) => ({ libelle: `Ventes × prix, trimestre ${l.trimestre}`, attendu: l.recalcule, calcul: `${qte(l.saisie)} × ${eur(l.prix)} = ${eur(l.recalcule)}` })),
      explication: (c) => {
        const r = donneeFausse(c);
        const f = r.fausse;
        return [
          `Aux trimestres ${r.autres.map((l) => l.trimestre).join(" et ")}, le produit retombe sur le chiffre d'affaires saisi : les données sont cohérentes. Au trimestre ${E}, il donne ${eur(f.recalcule)}, pour ${eur(f.chiffreDAffaires)} saisis : ${eur(f.ecart)} d'écart. Une des données de cette ligne est fausse.`,
          `L'ordre de grandeur le confirmait déjà : ${qte(f.saisie)} ${c.unites}, quand les autres trimestres en comptent ${r.autres.map((l) => qte(l.ventes)).join(" et ")}.`,
        ];
      },
    },
    {
      id: "donnee",
      objectifs: [0, 1],
      type: "choix",
      titre: "La donnée fausse",
      notions: ["revenue"],
      question: (c) => {
        const f = donneeFausse(c).fausse;
        return `Au trimestre ${E}, le chiffre d'affaires ne retombe pas : ${eur(f.chiffreDAffaires)} saisis, ${eur(f.recalcule)} recalculés. Quelle donnée de la ligne est fausse ?`;
      },
      options: (c) => {
        const f = donneeFausse(c).fausse;
        return [
          { texte: `Les ventes du trimestre ${E}`, juste: true, retour: `Oui : ${qte(f.saisie)} ${c.unites}, ${FACTEUR_DE_LA_VIRGULE} fois moins que les vraies ventes. La virgule a glissé d'un rang à la saisie : ${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)} ${c.unites}. Le prix est celui des autres trimestres.` },
          { texte: `Le prix du trimestre ${E}`, juste: false, retour: `Non : c'est le prix des autres trimestres, ${eur(f.prix)}. Ce sont les ventes, ${qte(f.saisie)} ${c.unites}, qui sortent de l'ordre de grandeur : ${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)}.` },
          { texte: `Le chiffre d'affaires du trimestre ${E}`, juste: false, retour: `Non : ${eur(f.chiffreDAffaires)} reste dans l'ordre de grandeur des autres trimestres, et il est repris des factures. Ce sont les ventes saisies à la main, ${qte(f.saisie)} ${c.unites}, qui détonnent.` },
        ];
      },
    },
    {
      id: "la-saisie-qui-retombe",
      objectifs: [2],
      type: "curseur",
      titre: "La saisie qui fait retomber le contrôle",
      notions: ["revenue", "dashboard"],
      question: (c) => {
        const f = donneeFausse(c).fausse;
        return `Faites varier les ventes saisies au trimestre ${E} : une droite donne les ventes multipliées par le prix, ${eur(f.prix)}, l'autre le chiffre d'affaires des factures, ${eur(f.chiffreDAffaires)}. Placez le curseur sur la plus petite saisie qui fait retomber le contrôle de cohérence.`;
      },
      grandeur: (c) => ({ libelle: `Ventes saisies au trimestre ${E}`, unite: c.unites }),
      cible: () => ({ attendu: donneeFausse().fausse.ventes, min: 0, max: 7_000 }),
      zones: ["Le produit atteint le chiffre d'affaires", "Le produit reste sous le chiffre d'affaires"],
      rates: () => ({ dessous: "Avec cette saisie, ventes × prix reste sous le chiffre d'affaires des factures.", dessus: "Le produit dépasse le chiffre d'affaires : la saisie est trop haute." }),
      montrer: "Montrer la saisie",
      lecture: (_c, q) => {
        const f = donneeFausse().fausse;
        return [
          { libelle: "Ventes × prix", montant: auCentime(q * f.prix), fort: true },
          { libelle: "Chiffre d'affaires des factures", montant: f.chiffreDAffaires },
          { libelle: "Écart", montant: auCentime(f.chiffreDAffaires - q * f.prix) },
        ];
      },
      droites: () => {
        const f = donneeFausse().fausse;
        return { produit: (q) => q * f.prix, cout: () => f.chiffreDAffaires, libelles: ["Ventes × prix", "Chiffre d'affaires des factures"] };
      },
      explication: (c) => {
        const f = donneeFausse(c).fausse;
        return [
          `À ${qte(f.ventes)} ${c.unites}, ventes × prix retombe exactement sur ${eur(f.chiffreDAffaires)} : c'est la vraie valeur, celle que la virgule avait divisée par ${FACTEUR_DE_LA_VIRGULE}.`,
          "Corriger une donnée, c'est la retrouver à partir des autres, qui sont sûres : ici le prix et les factures.",
        ];
      },
    },
    {
      id: "prevision",
      objectifs: [2],
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
          { libelle: `Ventes corrigées du trimestre ${E} (${c.unites})`, attendu: f.ventes, calcul: `${eur(f.chiffreDAffaires)} ÷ ${eur(f.prix)} = ${qte(f.ventes)}` },
          { libelle: `Prévision avec la donnée fausse (${c.unites})`, attendu: r.previsionFausse, calcul: `(${r.lignes.map((l) => qte(l.saisie)).join(" + ")}) ÷ ${n} = ${qte(r.previsionFausse)}`, tolerance: 1 },
          { libelle: `Prévision avec la donnée corrigée (${c.unites})`, attendu: r.previsionJuste, calcul: `(${r.lignes.map((l) => qte(l.ventes)).join(" + ")}) ÷ ${n} = ${qte(r.previsionJuste)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = donneeFausse(c);
        return [
          `Une seule case fausse sur ${r.lignes.length * 3}, et la prévision tombe de ${qte(r.ecartDePrevision)} ${c.unites}, soit ${pct(r.ecartDePrevisionEnPourcentage)} de moins que la prévision juste. Calé sur elle, le plan du trimestre ${D} serait trop bas.`,
        ];
      },
    },
    {
      id: "le-trimestre-rejoue",
      objectifs: [3],
      type: "montants",
      titre: `Le trimestre ${D} rejoué`,
      notions: ["capacity", "contribution_margin"],
      tableau: (c) => {
        const r = donneeFausse(c);
        return {
          titre: `Le trimestre ${D}, rejoué avec chaque plan`,
          colonnes: ["Plan sur la prévision juste", "Plan sur la prévision fausse"],
          lignes: [
            { libelle: `Plan de production (${c.unites})`, valeurs: [qte(r.previsionJuste), qte(r.previsionFausse)] },
            { libelle: `Ventes (${c.unites})`, valeurs: [qte(r.juste.vendues), qte(r.faux.vendues)] },
            { libelle: `Demande non servie (${c.unites})`, valeurs: [qte(r.juste.manquees), qte(r.faux.manquees)] },
            { libelle: "Marge sur coût variable", valeurs: [eur(r.juste.marge), eur(r.faux.marge)] },
          ],
        };
      },
      question: (c) => {
        const r = donneeFausse(c);
        return `Au trimestre ${D}, les clients demandent ${qte(r.juste.demande)} ${c.unites}. ${c.entreprise} ne fabrique que ce que son plan prévoit, et n'a pas de stock d'avance : la demande qui dépasse le plan repart sans être servie. Le tableau rejoue le trimestre avec chacun des plans. Calculez les ventes perdues à cause de l'erreur, puis la marge perdue.`;
      },
      champs: (c) => {
        const r = donneeFausse(c);
        return [
          { libelle: `Ventes perdues (${c.unites})`, attendu: r.ventesPerdues, calcul: `${qte(r.juste.vendues)} − ${qte(r.faux.vendues)} = ${qte(r.ventesPerdues)}` },
          { libelle: "Marge perdue", attendu: r.margePerdue, calcul: `${eur(r.juste.marge)} − ${eur(r.faux.marge)} = ${eur(r.margePerdue)}` },
        ];
      },
      explication: (c) => {
        const r = donneeFausse(c);
        return [
          `Le plan trop bas laisse repartir des clients qui auraient acheté : ${qte(r.ventesPerdues)} ${c.unites} de moins, et ${eur(r.margePerdue)} de marge perdue. Les charges fixes, elles, ne baissent pas : le résultat du trimestre perd autant.`,
          "Une donnée fausse ne coûte rien tant qu'elle reste dans le tableur : elle coûte le jour où une décision est prise dessus.",
        ];
      },
    },
    {
      id: "verdict",
      objectifs: [3],
      type: "choix",
      titre: "Ce que la virgule a coûté",
      notions: ["contribution_margin"],
      question: (c) => `Une virgule déplacée dans une case du tableur. Que retenir du trimestre ${D} ${dE(c.entreprise)} ?`,
      options: (c) => {
        const r = donneeFausse(c);
        const coute = r.verdict === "l-erreur-coute";
        return [
          { texte: "L'erreur a coûté : la prévision trop basse a fait manquer des ventes", juste: coute, retour: coute ? `Oui : ${qte(r.ventesPerdues)} ${c.unites} ${accordPluriel(c, "vendu")} en moins, et ${eur(r.coutDeLErreur)} de résultat en moins sur le seul trimestre ${D}. La décision était fausse parce que la donnée l'était.` : `Non : le résultat ne baisse pas.` },
          { texte: "L'erreur n'a rien coûté : la demande restait sous les deux plans", juste: !coute, retour: !coute ? "Oui : les ventes sont les mêmes avec les deux plans." : `Non : la demande dépassait le plan faux. La demande non servie monte à ${qte(r.faux.manquees)} ${c.unites}, contre ${qte(r.juste.manquees)} avec le plan juste.` },
          { texte: "L'erreur a rapporté : le plan plus bas a évité des invendus", juste: false, retour: `Non : ${c.entreprise} ne fabrique que son plan, et la demande dépassait les deux plans : il n'y avait aucun invendu à éviter. Le plan plus bas a fait perdre ${eur(r.margePerdue)} de marge.` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-prevision",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la prévision",
      notions: ["capacity", "dashboard"],
      question: (c) =>
        `La donnée corrigée, la prévision est-elle bonne pour autant ? Choisissez la donnée du trimestre ${E} (fausse ou corrigée) et la règle de prévision (la moyenne des trimestres ${PREMIER} à ${DERNIER}, ou le dernier seul), et regardez ce que le plan donne au trimestre ${D} ${dE(c.entreprise)}.`,
      leviers: () => [
        { code: "donnee", libelle: `Ventes du trimestre ${E}`, unite: "", min: 0, max: 1, pas: 1, depart: 0, choix: [{ valeur: 0, libelle: "La donnée fausse" }, { valeur: 1, libelle: "La donnée corrigée" }] },
        { code: "regle", libelle: "Règle de prévision", unite: "", min: 0, max: 1, pas: 1, depart: 0, choix: [{ valeur: 0, libelle: `La moyenne des trimestres ${PREMIER} à ${DERNIER}` }, { valeur: 1, libelle: "Le dernier trimestre" }] },
      ],
      lecture: (_c, p) => {
        const t = trimestreDecide(FICHE_DE_CAPACITE, planDe(p));
        const d = trimestreDecide(FICHE_DE_CAPACITE, planDe({ donnee: 0, regle: 0 }));
        return [
          { libelle: "Plan de production", montant: t.plan, unite: "enceintes", reference: d.plan },
          { libelle: "Demande non servie", montant: t.manquees, unite: "enceintes", reference: d.manquees },
          { libelle: "Marge du trimestre", montant: t.marge, reference: d.marge, fort: true },
        ];
      },
      defi: () => {
        const m = meilleureCombinaison(FICHE_DE_CAPACITE);
        const solution = { donnee: DONNEES.indexOf(m.juste), regle: REGLES.indexOf(m.regle) };
        return {
          consigne: `Trouvez la donnée et la règle qui laissent repartir le moins de clients au trimestre ${D}.`,
          atteint: (p) => p.donnee === solution.donnee && p.regle === solution.regle,
          indice: (p) => {
            const t = trimestreDecide(FICHE_DE_CAPACITE, planDe(p));
            return `Avec ce plan, ${qte(t.plan)} enceintes, ${qte(t.manquees)} enceintes demandées repartent sans être servies. Une autre combinaison fait-elle mieux ?`;
          },
          solution,
        };
      },
      explication: (c, p) => {
        const t = trimestreDecide(FICHE_DE_CAPACITE, planDe(p));
        const moyenne = trimestreDecide(FICHE_DE_CAPACITE, prevision(FICHE_DE_CAPACITE, "moyenne", true));
        return [
          `Défi relevé : la donnée corrigée et le dernier trimestre donnent un plan de ${qte(t.plan)} ${c.unites} ; ${qte(t.manquees)} repartent encore, contre ${qte(moyenne.manquees)} avec la moyenne corrigée. Les ventes montent au fil de l'année : la moyenne regarde trop loin en arrière.`,
          "Une donnée juste est nécessaire, pas suffisante : il faut aussi la bonne règle pour s'en servir.",
        ];
      },
    },
    {
      id: "controle",
      objectifs: [4],
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
          { texte: "Rendre obligatoire la case des ventes", juste: false, retour: "Non : ce contrôle protège la complétude, et la case était remplie. Il arrête une case vide, pas une valeur fausse." },
          { texte: "N'accepter qu'un nombre dans la case des ventes", juste: false, retour: `Non : ${qte(f.saisie)} est bien un nombre. Un contrôle de format arrête une lettre ou un symbole, pas une virgule mal placée.` },
          { texte: "Comparer ventes × prix au chiffre d'affaires saisi", juste: true, retour: `Oui : c'est le contrôle de cohérence fait plus haut, confié au tableur au moment de la saisie. ${qte(f.saisie)} × ${eur(f.prix)} = ${eur(f.recalcule)}, loin des ${eur(f.chiffreDAffaires)} des factures : la saisie aurait été refusée sur-le-champ.` },
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
          `Chez ${c.entreprise}, une virgule déplacée dans les ventes du trimestre ${E} fait passer la prévision du trimestre ${D} de ${qte(r.previsionJuste)} à ${qte(r.previsionFausse)} ${c.unites}, et coûte ${eur(r.coutDeLErreur)} de marge au trimestre ${D}.`,
          "Une donnée fausse ne se voit pas toute seule. Elle se trahit par un contrôle de cohérence (un produit ou un total qui ne retombe pas) ou par un ordre de grandeur. Le meilleur contrôle est celui qui l'arrête à la saisie. Dans l'arène, vérifiez vos propres chiffres avant de décider : une prévision ne vaut que ses données.",
        ];
      },
      repere: () => "Exactitude, complétude, cohérence : les trois qualités d'une donnée. Le contrôle à la saisie les vérifie avant que la donnée serve à décider.",
    },
  ],
};

/** L'extrait du tableur, tel que le chapitre le montre. */
export { extraitDuTableur };
