import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_PROJETS, LA_VALEUR_ACTUELLE_NETTE, gammeDuChapitre, premierPositif, toleranceDActualisation } from "../../chapitres/la-valeur-actuelle-nette";
import { auCentime } from "../../monde/amortissement";
import { coefficientDActualisation, fluxDuProjet, van } from "../../monde/finance";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VALEUR ACTUELLE NETTE D'UN INVESTISSEMENT » : REVENDRE LA MACHINE
 * PLUS TÔT (DSCG, UE2 Finance, palier 4).
 *
 * Le chapitre a mené le projet A de NOVA (la gamme sur une seconde ligne manuelle) sur 5 ans. Le
 * directeur financier aura besoin de l'atelier à la fin de N+3 : la ligne serait revendue après
 * 3 ans. L'élève refait seul la revente (la ligne et les moules, moins amortis, font économiser plus
 * d'impôt), le dernier flux (le BFR revient au plus haut) et la VAN raccourcie : −850,54 €, quand
 * 4 ans en créent 41 966,11 €. Puis, à rebours, le prix de cession de la ligne qui sauverait le
 * projet de 3 ans : 19 468,63 €, 64,90 % de sa valeur nette comptable au lieu de 60 %. Un curseur
 * sur ce prix le montre avant le calcul. La réponse demande un jugement : 3 ans ne suffisent pas
 * aux conditions prévues ; la décision dépend de l'acheteur de la ligne, ou d'un an de plus.
 *
 * Choix de durée (l4-monde.md proposait 3 ans ou 4) : 3 ans, où la VAN devient négative. C'est
 * honnête, et c'est ce qui donne une question au cas : la revente seule peut-elle sauver le projet ?
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * flux sont ceux de `fluxDuProjet`, arrêté plus tôt.
 */

/** L'ARRÊT DU PROJET (hypothèse du cas) : l'atelier sera repris à la fin de N+3, pour une autre fabrication. */
export const DUREE_AVANT_LA_REVENTE = 3;

/** Les bornes du curseur du prix de cession de la ligne, en euros : jusqu'à sa valeur nette comptable. */
export const PRIX_DE_LA_LIGNE_AU_CURSEUR = { min: 10_000 } as const;

export type Verdict = "trois-ans-detruisent" | "trois-ans-creent";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const coef4 = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const auCentieme = (x: number) => Math.round(x * 100) / 100;

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Le projet raccourci, face à celui du chapitre, et le prix de la ligne qui le sauverait. */
export function revendrePlusTot(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Pick<Cas, "code">) {
  const x = gammeDuChapitre(c);
  const n = DUREE_AVANT_LA_REVENTE;
  const court = fluxDuProjet(x.p, { duree: n, tauxDeLImpot: x.k.impot });
  const unAnDePlus = fluxDuProjet(x.p, { duree: n + 1, tauxDeLImpot: x.k.impot });
  const vanCourte = van(court.flux, x.t);
  const vanUnAnDePlus = van(unAnDePlus.flux, x.t);
  const [ligne, moules] = court.residuels;
  const actifLigne = x.p.actifs[0]!;
  // Le prix de cession de la ligne, levier du curseur : la VAN du projet raccourci est affine dans ce prix.
  const vanAuPrix = (prix: number) =>
    van(fluxDuProjet({ ...x.p, actifs: x.p.actifs.map((a, i) => (i === 0 ? { ...a, tauxDeReprise: prix / ligne!.vnc } : a)) }, { duree: n, tauxDeLImpot: x.k.impot }).flux, x.t);
  // À rebours : la valeur résiduelle nette qui manque à la date n, puis le prix de cession qui la donne.
  const manque = auCentime(-vanCourte / coefficientDActualisation(x.t, n));
  const nettePourZero = auCentime(ligne!.nette + manque);
  const prixMinimal = auCentime((nettePourZero - x.k.impot * ligne!.vnc) / (1 - x.k.impot));
  const verdict: Verdict = vanCourte <= 0 ? "trois-ans-detruisent" : "trois-ans-creent";
  return {
    x,
    n,
    court,
    unAnDePlus,
    vanCourte,
    vanUnAnDePlus,
    ligne: ligne!,
    moules: moules!,
    actifLigne,
    vanAuPrix,
    manque,
    nettePourZero,
    prixMinimal,
    partMinimale: auCentieme((prixMinimal / ligne!.vnc) * 100),
    prixEntier: premierPositif(vanAuPrix, PRIX_DE_LA_LIGNE_AU_CURSEUR.min, ligne!.vnc, prixMinimal),
    verdict,
  };
}

export const REVENDRE_LA_MACHINE_PLUS_TOT: Situation = {
  code: "revendre-la-machine-plus-tot",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [LA_VALEUR_ACTUELLE_NETTE.code],
  commanditaire: "Le directeur financier",
  titre: "Revendre la machine plus tôt",
  accroche: `L'atelier sera repris à la fin de N+${DUREE_AVANT_LA_REVENTE} : la ligne de la gamme serait revendue après ${DUREE_AVANT_LA_REVENTE} ans au lieu de 5. Le lancement crée-t-il encore de la valeur, et sinon, à quel prix faudrait-il revendre la ligne ?`,
  objectifs: [
    "Calculer la valeur résiduelle nette d'équipements revendus avant la fin de leur amortissement",
    "Refaire le dernier flux et la VAN d'un projet raccourci, BFR compris",
    "Retrouver à rebours le prix de cession qui annule la VAN",
    "Répondre au directeur financier, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_PROJETS,
    pourquoi: "ce cas reprend le chapitre « La valeur actuelle nette d'un investissement », qui se calcule sur les projets de NOVA, dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du directeur financier",
      tableau: (c) => {
        const r = revendrePlusTot(c);
        const [ligne, moules] = r.x.p.actifs;
        return {
          titre: `Le projet A, arrêté à la fin de N+${r.n}`,
          colonnes: ["Valeur"],
          lignes: [
            ...r.court.annees.map((a) => ({ libelle: `Flux d'exploitation après impôt de N+${a.annee}`, valeurs: [eur(a.fluxDExploitation)] })),
            ...r.court.annees.map((a) => ({ libelle: `BFR de N+${a.annee}`, valeurs: [eur(a.bfr)] })),
            { libelle: `Prix de ${ligne!.libelle}, amortie sur ${qte(ligne!.dureeDAmortissement)} ans`, valeurs: [eur(ligne!.montant)] },
            { libelle: "Reprise de la ligne par un acheteur d'occasion", valeurs: [`${pct(ligne!.tauxDeReprise * 100)} de sa valeur nette comptable`] },
            { libelle: `Prix ${moules!.libelle.replace(/^les /, "des ")}, amortis sur ${qte(moules!.dureeDAmortissement)} ans, sans revente`, valeurs: [eur(moules!.montant)] },
            { libelle: "Taux de l'impôt sur le résultat", valeurs: [pct(r.x.impotPct)] },
            { libelle: "Taux d'actualisation", valeurs: [pct(r.x.tauxPct)] },
          ],
        };
      },
      texte: (c) => {
        const r = revendrePlusTot(c);
        return [
          `« Nous aurons besoin de l'atelier à la fin de N+${r.n}, pour une autre fabrication. Si nous lançons la gamme, la ligne manuelle serait revendue au bout de ${r.n} ans, au lieu de 5, et les moules mis au rebut. Le lancement crée-t-il encore de la valeur ? Et sinon, à quel prix faudrait-il revendre la ligne pour qu'il en crée ? »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. Au chapitre, sur 5 ans, le projet avait une VAN de ${eur(r.x.van)}. Le BFR de chaque année se constitue au début de l'année et revient en entier à l'arrêt du projet.`,
        ];
      },
      repere: () => "À rendre : la valeur résiduelle nette du projet raccourci, son dernier flux et sa VAN, le prix de cession de la ligne qui l'annule, et votre réponse.",
    },
    {
      id: "la-revente",
      type: "montants",
      titre: "Ce que rend la revente",
      notions: ["depreciation"],
      question: (c) => `Revendue à la fin de N+${revendrePlusTot(c).n}, la ligne a servi moins longtemps, et les moules ne sont pas amortis. Calculez la valeur nette comptable de la ligne, sa valeur résiduelle nette d'impôt, puis celle de tout le projet, moules compris.`,
      champs: (c) => {
        const r = revendrePlusTot(c);
        const a = r.actifLigne;
        const m = r.x.p.actifs[1]!;
        const t = pct(r.x.impotPct);
        return [
          { libelle: `Valeur nette comptable de la ligne à la fin de N+${r.n}`, attendu: r.ligne.vnc, calcul: `${eur(a.montant)} − ${qte(r.n)} × ${eur(a.montant / a.dureeDAmortissement)} = ${eur(r.ligne.vnc)}` },
          {
            libelle: "Valeur résiduelle nette de la ligne",
            attendu: r.ligne.nette,
            calcul: `${pct(a.tauxDeReprise * 100)} × ${eur(r.ligne.vnc)} = ${eur(r.ligne.prixDeCession)} de prix de cession, plus ${t} × (${eur(r.ligne.vnc)} − ${eur(r.ligne.prixDeCession)}) d'impôt économisé = ${eur(r.ligne.nette)}`,
          },
          {
            libelle: "Valeur résiduelle nette du projet",
            attendu: r.court.valeurResiduelle,
            calcul: `${eur(r.ligne.nette)} + les moules, ${eur(m.montant)} − ${qte(r.n)} × ${eur(m.montant / m.dureeDAmortissement)} = ${eur(r.moules.vnc)} de valeur nette comptable mis au rebut, soit ${t} × ${eur(r.moules.vnc)} = ${eur(r.moules.nette)} d'impôt économisé : ${eur(r.court.valeurResiduelle)}`,
          },
        ];
      },
      explication: (c) => {
        const r = revendrePlusTot(c);
        return [
          `Arrêté tôt, le projet récupère ${eur(r.court.valeurResiduelle)}, contre ${eur(r.x.f.valeurResiduelle)} au bout de 5 ans : les équipements moins amortis se reprennent plus cher, et leur moins-value fait économiser plus d'impôt. Mais une valeur résiduelle plus forte ne rend jamais ce que les équipements n'ont pas encore servi.`,
        ];
      },
    },
    {
      id: "la-van-raccourcie",
      type: "montants",
      titre: "La VAN du projet raccourci",
      notions: ["discounting", "bfr"],
      question: (c) => {
        const r = revendrePlusTot(c);
        return `Calculez le flux de trésorerie disponible de la date ${r.n}, la VAN du projet arrêté à la fin de N+${r.n}, puis, pour comparer, celle du projet arrêté un an plus tard.`;
      },
      champs: (c) => {
        const r = revendrePlusTot(c);
        const n = r.n;
        const a = r.court.annees[n - 1]!;
        const coefs = r.court.flux.map((_, d) => coefficientDActualisation(r.x.t, d));
        const p = r.unAnDePlus;
        const b = p.annees[n]!;
        return [
          {
            libelle: `Flux disponible de la date ${n}`,
            attendu: r.court.flux[n]!,
            calcul: `${eur(a.fluxDExploitation)} + ${eur(r.court.valeurResiduelle)} de valeur résiduelle + ${eur(r.court.recuperationDuBfr)} de BFR récupéré = ${eur(r.court.flux[n]!)}`,
          },
          {
            libelle: `VAN du projet arrêté à la fin de N+${n}`,
            attendu: r.vanCourte,
            calcul: `${r.court.flux.map((f, d) => `${entre(f)} × ${coef4(coefs[d]!)}`).join(" + ")} = ${eur(r.vanCourte)}`,
            tolerance: toleranceDActualisation(r.court.flux),
          },
          {
            libelle: `VAN du projet arrêté à la fin de N+${n + 1}`,
            attendu: r.vanUnAnDePlus,
            calcul: `la valeur résiduelle nette vaut ${eur(p.valeurResiduelle)} à la fin de N+${n + 1}, le BFR récupéré ${eur(p.recuperationDuBfr)} : flux de la date ${n + 1} = ${eur(b.fluxDExploitation)} + ${eur(p.valeurResiduelle)} + ${eur(p.recuperationDuBfr)}${p.variationsDuBfr[n] ? ` − ${entre(p.variationsDuBfr[n]!)}` : ""} = ${eur(p.flux[n + 1]!)}, la date ${n} gardant son flux de ${eur(p.flux[n]!)}, et la VAN ${eur(r.vanUnAnDePlus)}`,
            tolerance: toleranceDActualisation(p.flux),
          },
        ];
      },
      explication: (c) => {
        const r = revendrePlusTot(c);
        return [
          r.vanCourte <= 0
            ? `Arrêté à la fin de N+${r.n}, le projet détruit ${eur(-r.vanCourte)} : la gamme n'a pas le temps de payer son lancement. Un an de plus, et elle crée ${eur(r.vanUnAnDePlus)} : la quatrième année, la gamme plafonne, et c'est elle qui rapporte.`
            : `Arrêté à la fin de N+${r.n}, le projet crée encore ${eur(r.vanCourte)}, et ${eur(r.vanUnAnDePlus)} avec un an de plus.`,
          `Le BFR revient au plus haut, ${eur(r.court.recuperationDuBfr)}, puisque l'année ${r.n} est une année pleine : l'arrêt avancé le rend plus tôt, ce qui joue pour le projet, mais ne compense pas les flux perdus.`,
        ];
      },
    },
    {
      id: "le-prix-au-curseur",
      type: "curseur",
      titre: "Le prix de revente de la ligne",
      notions: ["depreciation", "discounting"],
      question: (c) => {
        const r = revendrePlusTot(c);
        return `Faites varier le prix auquel un acheteur reprendrait la ligne à la fin de N+${r.n}, de ${eur(PRIX_DE_LA_LIGNE_AU_CURSEUR.min)} à sa valeur nette comptable, ${eur(r.ligne.vnc)}. Placez le curseur sur le prix le plus bas où le projet de ${qte(r.n)} ans ne détruit plus de valeur, puis validez.`;
      },
      grandeur: () => ({ libelle: "Prix de cession de la ligne", unite: "€" }),
      cible: (c) => {
        const r = revendrePlusTot(c);
        return { attendu: r.prixEntier, min: PRIX_DE_LA_LIGNE_AU_CURSEUR.min, max: r.ligne.vnc };
      },
      zones: ["Le projet crée de la valeur", "Le projet détruit de la valeur"],
      rates: () => ({
        dessous: "À ce prix, la VAN du projet raccourci reste négative.",
        dessus: "Plus bas, la VAN reste positive : cherchez le prix le plus bas.",
      }),
      montrer: "Montrer le prix minimal",
      lecture: (c, prix) => {
        const r = revendrePlusTot(c);
        const nette = auCentime(prix - r.x.k.impot * (prix - r.ligne.vnc));
        return [
          { libelle: "Valeur résiduelle nette de la ligne", montant: nette },
          { libelle: `Flux disponible de la date ${r.n}`, montant: auCentime(r.court.flux[r.n]! + nette - r.ligne.nette) },
          { libelle: `VAN du projet de ${qte(r.n)} ans`, montant: r.vanAuPrix(prix), fort: true },
        ];
      },
      droites: (c) => {
        const r = revendrePlusTot(c);
        return {
          produit: (prix) => r.vanAuPrix(prix) + r.x.equipements,
          cout: () => r.x.equipements,
          libelles: ["Ce que rapporte le projet raccourci, en valeur actuelle", "Équipements de la date 0"],
        };
      },
      explication: (c) => {
        const r = revendrePlusTot(c);
        return [
          `La VAN s'annule entre ${eur(r.prixEntier - 1)} et ${eur(r.prixEntier)} : il faudrait revendre la ligne environ ${pct(Math.round(r.partMinimale))} de sa valeur nette comptable, au lieu des ${pct(r.actifLigne.tauxDeReprise * 100)} prévus. Chaque euro de prix en plus ne rend que ${eur(auCentime(1 - r.x.k.impot))} : le reste aurait été une économie d'impôt sur la moins-value.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le prix minimal, à rebours",
      notions: ["depreciation", "discounting"],
      question: (c) => {
        const r = revendrePlusTot(c);
        return `Retrouvez au centime le prix que le curseur a montré. Calculez ce qui manque à la valeur résiduelle nette, à la date ${r.n}, pour annuler la VAN, puis le prix de cession de la ligne qui le rendrait, et ce qu'il représente de sa valeur nette comptable.`;
      },
      champs: (c) => {
        const r = revendrePlusTot(c);
        const t = r.x.k.impot;
        return [
          {
            libelle: `Valeur résiduelle nette qui manque à la date ${r.n}`,
            attendu: r.manque,
            calcul: `${eur(-r.vanCourte)} × (1 + ${pct(r.x.tauxPct)})^${r.n} = ${eur(r.manque)}`,
            tolerance: 0.5,
          },
          {
            libelle: "Prix de cession minimal de la ligne",
            attendu: r.prixMinimal,
            calcul: `la valeur résiduelle nette vaut prix × (1 − ${pct(t * 100)}) + ${pct(t * 100)} × ${eur(r.ligne.vnc)} ; il la faut à ${eur(r.ligne.nette)} + ${eur(r.manque)} = ${eur(r.nettePourZero)} : (${eur(r.nettePourZero)} − ${eur(auCentime(t * r.ligne.vnc))}) ÷ ${qte(1 - t)} = ${eur(r.prixMinimal)}`,
            tolerance: 1,
          },
          {
            libelle: "Part de la valeur nette comptable (%)",
            attendu: r.partMinimale,
            calcul: `${eur(r.prixMinimal)} ÷ ${eur(r.ligne.vnc)} = ${pct(r.partMinimale)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const r = revendrePlusTot(c);
        return [
          `Pour sauver le projet de ${qte(r.n)} ans, l'acheteur devrait payer ${eur(r.prixMinimal)}, ${pct(r.partMinimale)} de la valeur nette comptable : ${eur(auCentime(r.prixMinimal - r.ligne.prixDeCession))} de plus que la reprise prévue. Un écart de VAN de ${eur(-r.vanCourte)} se paie ${eur(r.manque)} à la date ${r.n}, et ${eur(auCentime(r.prixMinimal - r.ligne.prixDeCession))} de prix, puisque l'impôt en reprend ${pct(r.x.impotPct)}.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur financier",
      notions: ["discounting"],
      question: () => "Quelle réponse envoyez-vous au directeur financier ?",
      options: (c) => {
        const r = revendrePlusTot(c);
        const detruit = r.verdict === "trois-ans-detruisent";
        return [
          {
            texte: `Pas sur ${qte(r.n)} ans tel quel : il faut revendre la ligne au moins ${eur(r.prixMinimal)}, ou garder l'atelier un an de plus`,
            juste: detruit,
            retour: detruit
              ? `Oui : sur ${qte(r.n)} ans, la VAN est de ${eur(r.vanCourte)}. Elle ne devient positive que si un acheteur paie la ligne ${pct(r.partMinimale)} de sa valeur nette comptable, au lieu de ${pct(r.actifLigne.tauxDeReprise * 100)} ; avec un an de plus, le projet crée ${eur(r.vanUnAnDePlus)}. C'est à la direction de choisir entre chercher l'acheteur et retarder l'autre fabrication.`
              : `Non : sur ${qte(r.n)} ans, la VAN reste positive, ${eur(r.vanCourte)}.`,
          },
          {
            texte: `Oui, lançons : à ${eur(r.vanCourte)}, la VAN est presque nulle, l'écart est négligeable face aux ${eur(r.x.equipements)} investis`,
            juste: false,
            retour: `Non : une VAN négative, même petite, dit que le projet rend moins que les ${pct(r.x.tauxPct)} qu'exigent les capitaux. Lancer à ces conditions, c'est accepter de détruire ${eur(-r.vanCourte)}.`,
          },
          {
            texte: `Oui, lançons : revendus plus tôt, les équipements rendent ${eur(r.court.valeurResiduelle)} au lieu de ${eur(r.x.f.valeurResiduelle)}, ce qui compense les années perdues`,
            juste: !detruit,
            retour: detruit
              ? `Non : la valeur résiduelle monte de ${eur(auCentime(r.court.valeurResiduelle - r.x.f.valeurResiduelle))}, mais les années perdues rapportaient bien plus. La VAN passe de ${eur(r.x.van)} à ${eur(r.vanCourte)}.`
              : `Oui : la VAN du projet raccourci reste positive, ${eur(r.vanCourte)}.`,
          },
          {
            texte: "Non : seul le projet entier, sur 5 ans, crée de la valeur ; il faut garder la ligne jusqu'au bout",
            juste: false,
            retour: `Non : un an de plus suffit, le projet arrêté à la fin de N+${r.n + 1} crée ${eur(r.vanUnAnDePlus)}. Et une revente à ${eur(r.prixMinimal)} sauverait même le projet de ${qte(r.n)} ans.`,
          },
        ];
      },
    },
  ],
};
