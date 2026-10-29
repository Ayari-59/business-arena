import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import {
  ENTREPRISES_DE_LA_GESTION_DE_BASE,
  FICHE_DE_CAPACITE,
  PAS_DE_LA_PRECAUTION,
  RETARD,
  RETARD_LONG,
  TRIMESTRE_DE_LA_QUESTION,
  anneeAvecUnRetard,
  informationATemps as informationDuMonde,
  precautionDuTrimestreLePlusTouche,
  precautionPourToutServir,
  type AnneeDeLEquipe,
} from "../monde/gestion-et-information";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : UNE INFORMATION QUI CIRCULE À TEMPS (Bac STMG, management, palier 1).
 *
 * Ce que vaut, dans une équipe, une information à jour. Ceux qui vendent voient les premiers ce qui
 * se commande ; ceux qui fixent la production décident sur ces chiffres. Le chapitre rejoue l'année N
 * de NOVA avec une équipe où ces chiffres arrivent en retard, et l'élève mesure ce que le retard
 * coûte. Un curseur (la précaution qui couvre le trimestre le plus touché) et un laboratoire (la
 * précaution qui sert tous les clients avec deux trimestres de retard).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : la demande des quatre trimestres de N
 * et la capacité de la ligne (nova-capacite.ts), la marge d'une enceinte et les charges fixes de
 * janvier. L'équipe, son retard, la précaution et le stock sont des hypothèses du cours, nommées et
 * dites dans monde/gestion-et-information.ts (anneeAvecUnRetard) : à jour, le plan suit les
 * commandes du trimestre ; avec un retard, il reprend la demande d'un trimestre plus tôt ; ce qui ne
 * se vend pas reste en stock pour le trimestre suivant.
 *
 * L'angle n'est ni celui de « Ce que coûte et rapporte un outil numérique », ni celui de « Une donnée
 * fausse, une décision fausse » : ici, une donnée juste, mais qui arrive trop tard à ceux qui
 * décident.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène, dans huit entreprises. Chez NOVA, un
 * trimestre de retard laisse maintenant 2 162 enceintes demandées sans être servies, et coûte
 * 45 402 € de résultat ; deux trimestres en coûtent 67 074 €.
 */

export { RETARD, RETARD_LONG };

/** Les entreprises du chapitre : NOVA seule. */
export const ENTREPRISES_DE_L_INFORMATION = ENTREPRISES_DE_LA_GESTION_DE_BASE;

export const POURQUOI_L_INFORMATION =
  "ce chapitre rejoue l'année de NOVA, dont le cours tient la demande trimestre par trimestre et la capacité de la ligne.";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Un retard écrit en chiffres : « 1 trimestre de retard », « 2 trimestres de retard ». */
export const retardEcrit = (n: number) => `${n} trimestre${n > 1 ? "s" : ""} de retard`;

const R1 = retardEcrit(RETARD);
const R2 = retardEcrit(RETARD_LONG);
const SOURCE_DE_LA_QUESTION = TRIMESTRE_DE_LA_QUESTION - RETARD;
const TRIMESTRES = [1, 2, 3, 4] as const;

/** L'année à jour, les deux années en retard, et ce que chaque retard coûte. */
export const informationATemps = (_c?: Cas) => informationDuMonde(FICHE_DE_CAPACITE);

export type { AnneeDeLEquipe };

function tableauDeLAnneeAJour(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const ligne = (libelle: string, f: (t: AnneeDeLEquipe["trimestres"][number]) => string) => ({ libelle, valeurs: k.aJour.trimestres.map(f) });
  return {
    titre: `L'année N ${dE(c.entreprise)}, l'équipe à jour`,
    colonnes: TRIMESTRES.map((t) => `Trimestre ${t}`),
    lignes: [
      ligne(`Demande des clients (${c.unites})`, (t) => qte(t.demande)),
      ligne(`Plan de production (${c.unites})`, (t) => qte(t.plan)),
      ligne(`Ventes (${c.unites})`, (t) => qte(t.ventes)),
      ligne("Résultat de l'activité du trimestre", (t) => eur(t.resultat)),
    ],
  };
}

function tableauDesPlans(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const ligne = (libelle: string, a: AnneeDeLEquipe, f: (t: AnneeDeLEquipe["trimestres"][number]) => number) => ({ libelle, valeurs: a.trimestres.map((t) => qte(f(t))) });
  return {
    titre: `Les trimestres ${dE(c.entreprise)}, à jour et avec ${R1}`,
    colonnes: TRIMESTRES.map((t) => `Trimestre ${t}`),
    lignes: [
      ligne("Demande des clients", k.aJour, (t) => t.demande),
      ligne("Plan, à jour", k.aJour, (t) => t.plan),
      ligne(`Plan, avec ${R1}`, k.enRetard, (t) => t.plan),
      ligne(`Ventes, avec ${R1}`, k.enRetard, (t) => t.ventes),
      ligne(`Demande non servie, avec ${R1}`, k.enRetard, (t) => t.nonServie),
      ligne(`Stock en fin de trimestre, avec ${R1}`, k.enRetard, (t) => t.stock),
    ],
  };
}

function tableauDesTroisAnnees(c: Cas): TableauDeDonnees {
  const k = informationATemps(c);
  const annees = [k.aJour, k.enRetard, k.long];
  return {
    titre: `L'année ${dE(c.entreprise)}, rejouée avec chaque retard`,
    colonnes: ["À jour", `Avec ${R1}`, `Avec ${R2}`],
    lignes: [
      ...TRIMESTRES.map((t) => ({ libelle: `Plan du trimestre ${t}`, valeurs: annees.map((a) => qte(a.trimestres[t - 1]!.plan)) })),
      { libelle: `Demande non servie sur l'année (${c.unites})`, valeurs: annees.map((a) => qte(a.nonServie)) },
      { libelle: "Résultat de l'activité de l'année", valeurs: annees.map((a) => eur(a.resultat)) },
    ],
  };
}

export const UNE_INFORMATION_A_TEMPS: Chapitre = {
  code: "une-information-a-temps",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 2 · Numérique et intelligence collective"],
  titre: "Une information qui circule à temps",
  accroche:
    "Ceux qui vendent voient les premiers ce que les clients commandent ; ceux qui fixent la production décident sur leurs chiffres. L'année rejouée avec une équipe où ces chiffres arrivent en retard : ce que coûte un trimestre de retard, puis deux.",
  objectifs: [
    "Dire qui détient une information dans l'équipe, et qui en a besoin pour décider",
    "Retrouver les chiffres sur lesquels décide une équipe en retard",
    "Lire l'écart entre une décision prise à jour et une décision prise en retard",
    "Chiffrer ce que coûte une information qui arrive trop tard",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_L_INFORMATION, pourquoi: POURQUOI_L_INFORMATION },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Qui voit les chiffres, et quand",
      notions: ["dashboard", "capacity"],
      tableau: tableauDeLAnneeAJour,
      texte: (c) => [
        `Chez ${c.entreprise}, ceux qui vendent savent les premiers ce que les clients commandent. Ceux qui fixent le plan de production ont besoin de ces chiffres pour décider. Une information n'a de valeur que si elle arrive à temps à celui qui décide.`,
        `Le tableau montre l'année N, avec une équipe à jour : les commandes arrivent au fil du trimestre, et le plan les suit, dans la limite de la ligne (${qte(FICHE_DE_CAPACITE.ligne.capaciteParTrimestre)} ${c.unites} par trimestre). Toute la demande est servie.`,
        `Le cours suppose maintenant une équipe où les chiffres des ventes arrivent avec ${R1} : l'équipe cale le plan d'un trimestre sur la demande du trimestre d'avant, sans la corriger. Ce qui ne se vend pas reste en stock pour le trimestre suivant ; la demande qui dépasse ce qui est disponible repart sans être servie.`,
      ],
      repere: () => "Une information à jour vaut par la décision qu'elle permet : arrivée trop tard, elle fait décider sur une situation qui a changé.",
    },
    {
      id: "quels-chiffres",
      objectifs: [0, 1],
      type: "choix",
      titre: "Sur quels chiffres l'équipe décide",
      notions: ["dashboard"],
      question: () => `Au trimestre ${TRIMESTRE_DE_LA_QUESTION}, l'équipe à jour suit les commandes du trimestre ${TRIMESTRE_DE_LA_QUESTION} lui-même. Avec ${R1}, sur quels chiffres l'équipe cale-t-elle son plan ?`,
      options: () => [
        { texte: `Les chiffres du trimestre ${SOURCE_DE_LA_QUESTION}`, juste: true, retour: `Oui : les commandes du trimestre ${TRIMESTRE_DE_LA_QUESTION} ne lui arrivent qu'après. L'équipe décide sur le dernier chiffre qu'elle a reçu, celui du trimestre ${SOURCE_DE_LA_QUESTION}. Au premier trimestre, elle part des commandes de janvier, le plan du départ.` },
        { texte: `Les chiffres du trimestre ${TRIMESTRE_DE_LA_QUESTION}`, juste: false, retour: `Non : ce sont ceux de l'équipe à jour. Avec ${R1}, ils n'arrivent qu'après la décision.` },
        { texte: "La moyenne des trimestres déjà passés", juste: false, retour: "Non : l'équipe ne fait pas de moyenne. Elle reprend le dernier chiffre arrivé, tel quel." },
      ],
    },
    {
      id: "le-plan-en-retard",
      objectifs: [1, 2],
      type: "montants",
      titre: "Le plan joué en retard",
      notions: ["capacity"],
      tableau: tableauDesPlans,
      question: () => `Avec ${R1}, calculez l'écart de plan de chaque trimestre, de 2 à 4 (plan en retard moins plan à jour : négatif quand l'équipe en retard prévoit trop peu).`,
      champs: () => {
        const k = informationATemps();
        return k.ecarts.filter((e) => e.trimestre > 1).map((e) => ({
          libelle: `Écart de plan, trimestre ${e.trimestre}`,
          attendu: e.ecart,
          calcul: `${qte(k.enRetard.trimestres[e.trimestre - 1]!.plan)} − ${qte(k.aJour.trimestres[e.trimestre - 1]!.plan)} = ${qte(e.ecart)}`,
        }));
      },
      explication: () => [
        "Quand la demande monte, l'équipe en retard prévoit trop peu ; quand elle baisse, trop. Le retard ne trompe pas toujours dans le même sens : il fait toujours décider sur la demande d'avant.",
      ],
    },
    {
      id: "le-trimestre-le-plus-touche",
      objectifs: [2],
      type: "choix",
      titre: "Le trimestre le plus touché",
      notions: ["capacity", "dashboard"],
      tableau: tableauDesPlans,
      question: () => "Quel trimestre le retard touche-t-il le plus, et pourquoi ?",
      options: (c) => {
        const k = informationATemps(c);
        const p = k.plusTouche;
        const fait = `Au trimestre ${p.trimestre}, l'équipe en retard prévoit ${qte(p.enRetard.plan)} ${c.unites}, ${qte(Math.abs(p.ecart))} de ${p.ecart < 0 ? "moins" : "plus"} que la demande : ${qte(p.enRetard.nonServie)} ${c.unites} demandées repartent sans être servies.`;
        return TRIMESTRES.filter((t) => t > 1).map((t) => ({
          texte: `Le trimestre ${t}`,
          juste: t === p.trimestre,
          retour: t === p.trimestre ? `Oui. ${fait} La demande avait monté, et l'équipe ne le savait pas encore.` : `Non. ${fait}`,
        }));
      },
    },
    {
      id: "ce-que-coute-le-retard",
      objectifs: [3],
      type: "montants",
      titre: `Ce que coûte ${R1}`,
      notions: ["contribution_margin", "dashboard"],
      question: (c) => `Comparez l'année à jour et l'année avec ${R1} : calculez les ventes perdues (en ${c.unites}), puis ce que coûte le retard (résultat de l'activité à jour moins résultat en retard, avant les intérêts de l'emprunt), et sa part du résultat à jour, en pourcentage au dixième.`,
      champs: () => {
        const k = informationATemps();
        return [
          { libelle: "Ventes perdues", attendu: k.ventesPerdues, calcul: `${qte(k.aJour.ventes)} − ${qte(k.enRetard.ventes)} = ${qte(k.ventesPerdues)}` },
          { libelle: "Coût du retard", attendu: k.coutDuRetard, calcul: `${eur(k.aJour.resultat)} − ${eur(k.enRetard.resultat)} = ${eur(k.coutDuRetard)}` },
          { libelle: "Part du résultat à jour (%)", attendu: k.partDuResultat, calcul: `${eur(k.coutDuRetard)} ÷ ${eur(k.aJour.resultat)} × 100 = ${pct(k.partDuResultat)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const k = informationATemps(c);
        return [
          `Chaque ${c.unite} non servie coûte sa marge, ${eur(k.aJour.marge)} ; les charges fixes, elles, ne changent pas. ${R1.charAt(0).toUpperCase()}${R1.slice(1)} coûte à ${c.entreprise} ${pct(k.partDuResultat)} de son résultat de l'année.`,
        ];
      },
    },
    {
      id: "deux-trimestres",
      objectifs: [3],
      type: "montants",
      titre: `Avec ${R2}`,
      notions: ["contribution_margin"],
      tableau: tableauDesTroisAnnees,
      question: () => `Le tableau rejoue aussi l'année avec ${R2}. Calculez ce que coûte ce retard plus long (résultat à jour moins résultat avec ${R2}).`,
      champs: () => {
        const k = informationATemps();
        return [{ libelle: `Coût de ${R2}`, attendu: k.coutDuRetardLong, calcul: `${eur(k.aJour.resultat)} − ${eur(k.long.resultat)} = ${eur(k.coutDuRetardLong)}` }];
      },
      explication: () => {
        const k = informationATemps();
        return [`Avec ${R2}, ${qte(k.long.nonServie)} enceintes demandées repartent sans être servies, contre ${qte(k.enRetard.nonServie)} avec ${R1}.`];
      },
    },
    {
      id: "un-chiffre-plus-vieux",
      objectifs: [3],
      type: "choix",
      titre: "Un chiffre plus vieux coûte-t-il plus cher ?",
      notions: ["dashboard"],
      question: () => `${R1.charAt(0).toUpperCase()}${R1.slice(1)} coûte ${eur(informationATemps().coutDuRetard)}. Et ${R2} ?`,
      options: () => {
        const k = informationATemps();
        const faits = `${eur(k.coutDuRetardLong)} avec ${R2}, contre ${eur(k.coutDuRetard)} avec ${R1}.`;
        return [
          { texte: "Au moins le double", juste: k.verdict === "au-moins-le-double", retour: k.verdict === "au-moins-le-double" ? `Oui : ${faits}` : `Non : ${faits}` },
          { texte: "Plus, mais moins du double", juste: k.verdict === "plus-mais-moins-du-double", retour: k.verdict === "plus-mais-moins-du-double" ? `Oui : ${faits} Le trimestre 2 est raté dans les deux cas ; le retard plus long rate aussi le trimestre 3.` : `Non : ${faits}` },
          { texte: "Moins", juste: k.verdict === "moins", retour: k.verdict === "moins" ? `Oui : ${faits}` : `Non : ${faits}` },
        ];
      },
    },
    {
      id: "la-precaution",
      objectifs: [3],
      type: "curseur",
      titre: "Une précaution pour couvrir le retard",
      notions: ["capacity", "contribution_margin"],
      question: (c) => {
        const p = informationATemps(c).plusTouche;
        return `Avec ${R1}, l'équipe pourrait ajouter une précaution à son plan : quelques ${c.unites} de plus que le dernier chiffre reçu. Faites varier la précaution, et placez le curseur sur la plus petite qui sert toute la demande du trimestre ${p.trimestre}, le plus touché. Les deux droites comptent en chiffre d'affaires.`;
      },
      grandeur: (c) => ({ libelle: "Précaution ajoutée au plan", unite: c.unites }),
      cible: () => ({ attendu: precautionDuTrimestreLePlusTouche(FICHE_DE_CAPACITE), min: 0, max: 2_000 }),
      zones: ["Le plan sert toute la demande du trimestre", "Des clients repartent sans être servis"],
      rates: () => ({ dessous: "Avec cette précaution, le plan reste sous la demande du trimestre : des clients repartent.", dessus: "Le plan sert toute la demande, mais une précaution plus petite suffirait." }),
      montrer: "Montrer la précaution",
      lecture: (_c, q) => {
        const p = informationATemps().plusTouche;
        const prix = FICHE_DE_CAPACITE.enceinte.prix;
        return [
          { libelle: "Chiffre d'affaires que le plan peut servir", montant: auCentime((p.enRetard.plan + q) * prix), fort: true },
          { libelle: "Chiffre d'affaires de la demande du trimestre", montant: auCentime(p.enRetard.demande * prix) },
        ];
      },
      droites: () => {
        const p = informationATemps().plusTouche;
        const prix = FICHE_DE_CAPACITE.enceinte.prix;
        return { produit: (q) => (p.enRetard.plan + q) * prix, cout: () => p.enRetard.demande * prix, libelles: ["Ce que le plan peut servir", "La demande du trimestre"] };
      },
      explication: (c) => {
        const k = informationATemps(c);
        const q = precautionDuTrimestreLePlusTouche(FICHE_DE_CAPACITE);
        return [
          `Il faut ${qte(q)} ${c.unites} de précaution : le plan passe de ${qte(k.plusTouche.enRetard.plan)} à ${qte(k.plusTouche.enRetard.plan + q)}, la demande du trimestre ${k.plusTouche.trimestre}.`,
          "Une précaution coûte du stock quand la demande baisse : c'est le prix d'une information en retard. Une information à jour n'a pas besoin de précaution.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-precaution",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la précaution",
      notions: ["capacity", "contribution_margin"],
      question: (c) => `Avec ${R2} cette fois, faites varier la précaution que l'équipe ajoute à chaque plan, et regardez les clients servis, le stock qui reste en fin d'année et le résultat ${dE(c.entreprise)}.`,
      leviers: () => [{ code: "precaution", libelle: "Précaution ajoutée à chaque plan", unite: "enceintes", min: 0, max: 2_000, pas: PAS_DE_LA_PRECAUTION, depart: 0 }],
      lecture: (_c, p) => {
        const a = anneeAvecUnRetard(FICHE_DE_CAPACITE, RETARD_LONG, p.precaution!);
        const d = anneeAvecUnRetard(FICHE_DE_CAPACITE, RETARD_LONG, 0);
        return [
          { libelle: "Demande non servie sur l'année", montant: a.nonServie, unite: "enceintes", reference: d.nonServie },
          { libelle: "Stock en fin d'année", montant: a.stockFinal, unite: "enceintes", reference: d.stockFinal },
          { libelle: "Valeur du stock de fin d'année", montant: a.valeurDuStockFinal, reference: d.valeurDuStockFinal },
          { libelle: "Résultat de l'activité de l'année", montant: a.resultat, reference: d.resultat, fort: true },
        ];
      },
      defi: () => {
        const juste = precautionPourToutServir(FICHE_DE_CAPACITE);
        return {
          consigne: `Trouvez la plus petite précaution, à la centaine, qui sert toute la demande de l'année avec ${R2}.`,
          atteint: (p) => p.precaution === juste,
          indice: (p) => {
            const a = anneeAvecUnRetard(FICHE_DE_CAPACITE, RETARD_LONG, p.precaution!);
            return a.nonServie > 0 ? `Avec ${qte(p.precaution!)} enceintes de précaution, ${qte(a.nonServie)} enceintes demandées repartent encore : il en faut plus.` : `Toute la demande est servie, et ${qte(a.stockFinal)} enceintes restent en stock : une précaution plus petite suffirait-elle ?`;
          },
          solution: { precaution: juste },
        };
      },
      explication: (c, p) => {
        const a = anneeAvecUnRetard(FICHE_DE_CAPACITE, RETARD_LONG, p.precaution!);
        return [
          `Défi relevé : avec ${qte(p.precaution!)} ${c.unites} de précaution, tous les clients sont servis, et le résultat retrouve celui de l'équipe à jour, ${eur(a.resultat)}. Mais ${qte(a.stockFinal)} ${c.unites} restent en stock à la fin de l'année : ${eur(a.valeurDuStockFinal)} d'argent immobilisé.`,
          "La précaution remplace l'information par du stock. Faire circuler les chiffres à temps coûte moins cher que d'en produire d'avance.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["dashboard"],
      texte: (c) => {
        const k = informationATemps(c);
        return [
          `Chez ${c.entreprise}, ${R1} coûte ${eur(k.coutDuRetard)} sur l'année, ${pct(k.partDuResultat)} du résultat ; ${R2} en coûtent ${eur(k.coutDuRetardLong)}. L'information était juste : elle arrivait trop tard.`,
          "Une équipe décide bien si l'information circule à temps de ceux qui la voient à ceux qui décident. Dans l'arène, lisez le marché du tour écoulé avant de régler votre plan : c'est votre information à jour.",
        ];
      },
      repere: () => "Une information vaut par la décision qu'elle permet : à jour, elle fait servir les clients ; en retard, elle les fait repartir, ou fait produire pour rien.",
    },
  ],
};
