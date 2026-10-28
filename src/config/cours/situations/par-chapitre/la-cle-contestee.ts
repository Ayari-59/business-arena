import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_GAMME, PART_DU_CURSEUR, coutsParProduit, tableauDeLaGamme } from "../../chapitres/cout-par-produit";
import { coutsDeLaGamme } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « COÛT PAR PRODUIT » : LA CLÉ CONTESTÉE (contrôle de gestion, palier 3).
 *
 * Le responsable de NOVA One trouve qu'elle porte trop de charges communes avec la répartition aux
 * heures-machine. Il demande qu'on les répartisse au chiffre d'affaires, ou au moins en partie : sa
 * référence, dit-il, deviendrait rentable, et NOVA avec elle. Le dirigeant veut les chiffres avant
 * de trancher. L'élève refait seul le chemin du chapitre pour cette référence avec les deux clés,
 * puis croise les deux répartitions : qui porterait les charges que NOVA One ne porte plus ? Un
 * curseur cherche à rebours la plus grande part aux heures qui la laisse bénéficiaire. La réponse
 * demande un jugement : la clé déplace des charges sans rien créer, et le sort de NOVA One se joue
 * sur sa marge sur coûts spécifiques, pas sur la clé.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `coutsParProduit`. Le résultat de la gamme vaut 4 511 € avec les deux clés
 * (l'ancien cas écrivait 4 527 € ici et 4 527,47 € au chapitre). L'argument du responsable est une
 * hypothèse de l'histoire.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
/** Un résultat dit en mots, après « de » ou après « à » : « d'une perte de 642,62 € », « à un bénéfice de 829,20 € ». */
const deResultat = (x: number) => (x >= 0 ? `d'un bénéfice de ${eur(x)}` : `d'une perte de ${eur(-x)}`);
const aResultat = (x: number) => (x >= 0 ? `à un bénéfice de ${eur(x)}` : `à une perte de ${eur(-x)}`);

export type Verdict = "la-cle-ne-cree-rien";

/** Les chiffres de la réponse, calculés une fois du cas. */
export function cleContestee(c: Pick<Cas, "code">) {
  const k = coutsParProduit(c);
  const x = k.x;
  // Le croisement des deux clés : ce que chaque référence porte de plus au chiffre d'affaires qu'aux heures.
  const deplacement = k.refs.map((l, i) => ({ ...l, auChiffre: k.v.parReference[i]!.imputees, resultatAuChiffre: k.v.parReference[i]!.resultat, enPlus: auCentime(k.v.parReference[i]!.imputees - l.imputees) }));
  const autres = deplacement.filter((l) => l.code !== x.code);
  const quiPaie = [...autres].sort((a, b) => b.enPlus - a.enPlus)[0]!;
  const autre = autres.find((l) => l.code !== quiPaie.code)!;
  const gain = auCentime(k.xv.resultat - x.resultat);
  // Le verdict : la clé ne fait que déplacer des charges, le résultat de la gamme ne bouge pas, et la référence se garde par sa marge.
  const verdict: Verdict | null = k.v.resultat === k.h.resultat && x.margeSpecifique > 0 ? "la-cle-ne-cree-rien" : null;
  return {
    k,
    x,
    deplacement,
    quiPaie,
    autre,
    gain,
    verdict,
    toleranceQuiPaie: auCentime(k.toleranceAuxHeures(quiPaie.heures) + k.toleranceAuChiffre(quiPaie.chiffreDAffaires)),
    toleranceAutre: auCentime(k.toleranceAuxHeures(autre.heures) + k.toleranceAuChiffre(autre.chiffreDAffaires)),
  };
}

export const LA_CLE_CONTESTEE: Situation = {
  code: "la-cle-contestee",
  parcours: "controle-de-gestion",
  palier: 3,
  blocs: [],
  reprend: ["cout-par-produit"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_GAMME,
    pourquoi: "ce cas reprend le chapitre « Coût par produit », qui se calcule sur la gamme Go, One et Studio de NOVA dans la simulation du cours.",
  },
  commanditaire: "Le dirigeant",
  titre: "La clé de répartition contestée",
  accroche:
    "Un responsable de produit veut qu'on répartisse les charges communes au chiffre d'affaires plutôt qu'aux heures-machine. Sa référence y gagnerait-elle, qui paierait, et la gamme y gagnerait-elle ?",
  objectifs: [
    "Calculer les charges communes imputées et le résultat d'une référence avec deux clés",
    "Croiser les deux répartitions : qui porte les charges qu'une référence ne porte plus",
    "Retrouver à rebours la part de la clé qui laisse une référence bénéficiaire",
    "Rendre au dirigeant une réponse qui tranche, chiffres à l'appui",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du dirigeant",
      tableau: tableauDeLaGamme,
      texte: (c) => {
        const r = cleContestee(c);
        return [
          `« Le responsable de ${r.x.nom} trouve qu'elle porte trop de charges communes : on les répartit aux heures-machine, et elle en demande beaucoup. Il veut qu'on les répartisse au chiffre d'affaires, ou au moins en partie. ${r.x.nom} deviendrait rentable, dit-il, et ${r.k.f.entreprise} avec elle. Avant de trancher, je veux les chiffres des deux façons de faire, et savoir qui paierait la différence. »`,
          "Pas de cours cette fois : vous avez les chiffres du mois, et la méthode est celle du chapitre. À vous de l'enchaîner. Comme au chapitre, les charges communes se répartissent au prorata exact de la clé ; un coût d'unité d'œuvre arrondi au centime est admis.",
        ];
      },
      repere: (c) =>
        `À rendre : le résultat de ${cleContestee(c).x.nom} avec les deux clés, celui de la gamme, ce que la clé déplace d'une référence à l'autre, la part aux heures qui la laisse bénéficiaire, et votre réponse.`,
    },
    {
      id: "aux-heures",
      type: "montants",
      titre: "Aux heures-machine, comme aujourd'hui",
      notions: ["full_unit_cost"],
      question: (c) => {
        const x = cleContestee(c).x;
        return `Commencez par la répartition d'aujourd'hui : le coût direct de ${x.nom}, le coût d'une heure-machine pour toute la gamme, les charges communes portées par ${x.nom}, puis son résultat (négatif pour une perte).`;
      },
      champs: (c) => {
        const { k, x } = cleContestee(c);
        return [
          { libelle: `Coût direct : ${x.nom}`, attendu: x.direct, calcul: `${qte(x.quantite)} × ${eur(x.coutVariableUnitaire)} + ${eur(x.publicite)} = ${eur(x.direct)}` },
          {
            libelle: "Coût d'une heure-machine",
            attendu: k.coutDeLHeure,
            calcul: `${eur(k.communes)} ÷ (${k.refs.map((l) => `${qte(l.quantite)} × ${qte(l.heuresMachineParUnite)} h`).join(" + ")}) = ${eur(k.communes)} ÷ ${qte(auCentime(k.heures))} h ≈ ${eur(k.coutDeLHeure)}`,
          },
          { libelle: `Charges communes : ${x.nom}, aux heures`, attendu: x.imputees, tolerance: k.toleranceAuxHeures(x.heures), calcul: `${qte(auCentime(x.heures))} h × ${eur(k.coutDeLHeure)} ≈ ${eur(x.imputees)}` },
          { libelle: `Résultat : ${x.nom}, aux heures`, attendu: x.resultat, tolerance: k.toleranceAuxHeures(x.heures), calcul: `${eur(x.chiffreDAffaires)} − ${eur(x.direct)} − ${eur(x.imputees)} = ${eur(x.resultat)}` },
        ];
      },
      explication: (c) => {
        const { k, x } = cleContestee(c);
        const partDesHeures = Math.round((x.heures / k.heures) * 100);
        const partDuChiffre = Math.round((x.chiffreDAffaires / k.h.chiffreDAffaires) * 100);
        return [
          `${x.nom} demande ${partDesHeures} % des heures-machine de la gamme pour ${partDuChiffre} % du chiffre d'affaires : aux heures, elle porte une grosse part des charges communes, ${eur(x.imputees)}, et fait ${x.resultat >= 0 ? "un bénéfice" : "une perte"} de ${eur(Math.abs(x.resultat))}.`,
        ];
      },
    },
    {
      id: "au-chiffre-d-affaires",
      type: "montants",
      titre: "Au chiffre d'affaires",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const x = cleContestee(c).x;
        return `Refaites le calcul avec la clé proposée, 100 € de chiffre d'affaires pour unité d'œuvre : le coût de cette unité d'œuvre, les charges communes portées par ${x.nom}, son résultat, puis le résultat de toute la gamme.`;
      },
      champs: (c) => {
        const { k, x } = cleContestee(c);
        return [
          { libelle: "Coût de 100 € de chiffre d'affaires", attendu: k.coutDesCent, calcul: `${eur(k.communes)} ÷ (${eur(k.h.chiffreDAffaires)} ÷ 100) ≈ ${eur(k.coutDesCent)}` },
          {
            libelle: `Charges communes : ${x.nom}, au chiffre d'affaires`,
            attendu: k.xv.imputees,
            tolerance: k.toleranceAuChiffre(x.chiffreDAffaires),
            calcul: `${eur(x.chiffreDAffaires)} ÷ 100 × ${eur(k.coutDesCent)} ≈ ${eur(k.xv.imputees)}`,
          },
          {
            libelle: `Résultat : ${x.nom}, au chiffre d'affaires`,
            attendu: k.xv.resultat,
            tolerance: k.toleranceAuChiffre(x.chiffreDAffaires),
            calcul: `${eur(x.chiffreDAffaires)} − ${eur(x.direct)} − ${eur(k.xv.imputees)} = ${eur(k.xv.resultat)}`,
          },
          {
            libelle: "Résultat de la gamme",
            attendu: k.v.resultat,
            tolerance: k.toleranceAuChiffre(k.h.chiffreDAffaires),
            calcul: `${eur(k.h.chiffreDAffaires)} − ${eur(k.h.directs)} de coûts directs − ${eur(k.communes)} de charges communes = ${eur(k.v.resultat)}`,
          },
        ];
      },
      explication: (c) => {
        const { k, x } = cleContestee(c);
        return [
          `Au chiffre d'affaires, ${x.nom} ne porte plus que ${eur(k.xv.imputees)} de charges communes : son résultat passe ${deResultat(x.resultat)} ${aResultat(k.xv.resultat)}. Mais les ${eur(k.communes)} restent à payer, en entier, et la gamme fait ${eur(k.v.resultat)} comme aux heures.`,
        ];
      },
    },
    {
      id: "qui-paie",
      type: "montants",
      titre: "Qui paierait la différence",
      notions: ["full_unit_cost", "fixed_costs"],
      question: (c) => {
        const r = cleContestee(c);
        return `Croisez les deux répartitions. Combien de charges communes ${r.quiPaie.nom} porterait-elle en plus au chiffre d'affaires qu'aux heures, et ${r.autre.nom} (négatif si elle en porte moins) ? Quel serait alors le résultat de ${r.quiPaie.nom} ?`;
      },
      champs: (c) => {
        const r = cleContestee(c);
        const q = r.quiPaie;
        const a = r.autre;
        return [
          { libelle: `Charges en plus : ${q.nom}`, attendu: q.enPlus, tolerance: r.toleranceQuiPaie, calcul: `${eur(q.auChiffre)} − ${eur(q.imputees)} = ${eur(q.enPlus)}` },
          { libelle: `Charges en plus : ${a.nom}`, attendu: a.enPlus, tolerance: r.toleranceAutre, calcul: `${eur(a.auChiffre)} − ${eur(a.imputees)} = ${eur(a.enPlus)}` },
          { libelle: `Résultat : ${q.nom}, au chiffre d'affaires`, attendu: q.resultatAuChiffre, tolerance: r.k.toleranceAuChiffre(q.chiffreDAffaires), calcul: `${eur(q.chiffreDAffaires)} − ${eur(q.direct)} − ${eur(q.auChiffre)} = ${eur(q.resultatAuChiffre)}` },
        ];
      },
      explication: (c) => {
        const r = cleContestee(c);
        const q = r.quiPaie;
        const a = r.autre;
        return [
          `${eur(q.enPlus)} pour ${q.nom}, ${eur(a.enPlus)} pour ${a.nom} : ensemble, ${eur(auCentime(q.enPlus + a.enPlus))}, exactement ce que ${r.x.nom} ne porterait plus. ${q.nom} paierait même plus que le tout, ${a.nom} en portant moins : elle fait ${Math.round((q.chiffreDAffaires / r.k.h.chiffreDAffaires) * 100)} % du chiffre d'affaires pour ${Math.round((q.heures / r.k.heures) * 100)} % des heures-machine. Son résultat passerait de ${eur(q.resultat)} à ${eur(q.resultatAuChiffre)}, sans qu'elle ait rien fait.`,
        ];
      },
    },
    {
      id: "la-part-tenable",
      type: "curseur",
      titre: "Le compromis, au curseur",
      notions: ["full_unit_cost", "contribution_margin"],
      question: (c) => {
        const x = cleContestee(c).x;
        return `Le responsable propose un compromis : une part des charges communes aux heures-machine, le reste au chiffre d'affaires. Faites glisser cette part. Quelle est la plus grande part aux heures qui laisse ${x.nom} bénéficiaire ? Placez le curseur dessus, puis validez.`;
      },
      grandeur: () => ({ libelle: "Part des charges communes réparties aux heures-machine", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: cleContestee(c).k.partLimite, min: PART_DU_CURSEUR.min, max: PART_DU_CURSEUR.max }),
      zones: ["Référence bénéficiaire", "Référence en perte"],
      rates: () => ({
        dessous: "La référence reste bénéficiaire avec plus de charges aux heures : cherchez la plus grande part.",
        dessus: "À cette part, la référence porte plus de charges communes qu'elle ne laisse de marge : elle perd.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, s) => {
        const { k, x } = cleContestee(c);
        const a = coutsDeLaGamme(k.f, { partAuxHeures: s / 100 });
        const ref = a.parReference.find((l) => l.code === x.code)!;
        return [
          { libelle: `Charges communes portées par ${x.nom}`, montant: ref.imputees },
          { libelle: `Résultat de ${x.nom}`, montant: ref.resultat, fort: true },
          { libelle: "Résultat de la gamme", montant: a.resultat },
        ];
      },
      droites: (c) => {
        const { k, x } = cleContestee(c);
        return {
          produit: () => x.margeSpecifique,
          cout: (s) => k.xv.imputees + (s / 100) * k.pente,
          libelles: [`Marge sur coûts spécifiques de ${x.nom}`, `Charges communes portées par ${x.nom}`],
        };
      },
      explication: (c) => {
        const { k, x } = cleContestee(c);
        return [
          `Jusqu'à ${k.partLimite} % aux heures, ${x.nom} reste bénéficiaire : sa marge sur coûts spécifiques, ${eur(x.margeSpecifique)}, couvre les charges qu'elle porte. À toutes les positions, la gamme fait ${eur(k.h.resultat)}. Le compromis choisit qui affiche la perte ; il ne la supprime pas.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["full_unit_cost", "contribution_margin"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: (c) => {
        const r = cleContestee(c);
        const { k, x } = r;
        const chiffres = `${x.nom} passerait ${deResultat(x.resultat)} ${aResultat(k.xv.resultat)}, ${r.quiPaie.nom} porterait ${eur(r.quiPaie.enPlus)} de plus, et la gamme resterait à ${eur(k.h.resultat)}.`;
        return [
          {
            texte: `Garder les heures, qui suivent l'usage des lignes : la clé déplacerait ${eur(r.gain)}, surtout vers ${r.quiPaie.nom}, sans rien rapporter à la gamme`,
            juste: r.verdict === "la-cle-ne-cree-rien",
            retour: `Oui. ${chiffres} Les charges communes (le loyer, le personnel, l'entretien et l'usure des lignes) suivent l'occupation des lignes : les heures-machine en rendent mieux compte que le chiffre d'affaires. Et le sort de ${x.nom} ne dépend pas de la clé : elle laisse ${eur(x.margeSpecifique)} par mois, elle se garde.`,
          },
          {
            texte: `Passer au chiffre d'affaires : la gamme y gagnerait ${eur(r.gain)}, ce que ${x.nom} ne porterait plus`,
            juste: false,
            retour: `Non : les ${eur(r.gain)} que ${x.nom} ne porterait plus retombent sur les autres références, surtout ${r.quiPaie.nom}. Les charges communes restent de ${eur(k.communes)}, et le résultat de la gamme de ${eur(k.h.resultat)}.`,
          },
          {
            texte: `Passer à ${k.partLimite} % aux heures : ${x.nom} redevient bénéficiaire, et le responsable obtient ce qu'il demande sans que ${r.quiPaie.nom} porte toute la charge`,
            juste: false,
            retour: `Non : le compromis ne fait que choisir où la perte s'affiche. À ${k.partLimite} %, la gamme fait toujours ${eur(k.h.resultat)} ; une clé se choisit sur ce qui cause les charges, pas sur le résultat qu'elle donne à une référence.`,
          },
          {
            texte: `Garder les heures et arrêter ${x.nom}, qui perd ${eur(Math.abs(x.resultat))} en coût complet et le restera tant qu'elle demandera autant d'heures-machine`,
            juste: false,
            retour: `Non : sans ${x.nom}, la gamme perdrait ${eur(-k.sansX)}. Elle laisse ${eur(x.margeSpecifique)} de marge sur coûts spécifiques, que les autres références ne remplaceraient pas.`,
          },
        ];
      },
    },
  ],
};
