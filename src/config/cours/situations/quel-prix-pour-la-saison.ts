import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { accord } from "../accords";
import type { Cas } from "../cas";
import { ENTREPRISES_DE_LA_DEMANDE, demandeEtPrix } from "../chapitres/demande-et-prix";
import { ENTREPRISES_DE_LA_PART_DE_MARCHE, marcheEtPart } from "../chapitres/marche-et-part-de-marche";
import { prixPsychologique } from "../chapitres/prix-psychologique";
import { SEGMENTATIONS } from "../chapitres/segmenter-et-cibler";
import { capacite, coutVariable, trimestreAuPrix } from "../monde/economie-et-marketing";
import { POURQUOI_LE_MARCHE_DE_NOVA, mercatiqueDe } from "../monde/mercatique-de-nova";
import type { Situation } from "./types";

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");

/**
 * CAS PRATIQUE : QUEL PRIX POUR LA SAISON ? (Bac STMG, mercatique, palier 1).
 *
 * La direction de NOVA hésite entre trois prix pour lancer la saison : 10 % moins cher, le prix
 * actuel, 10 % plus cher. L'élève a les chiffres du marché et la demande attendue à chaque prix. Il
 * rend la part de marché, l'élasticité de la demande au prix, l'écart des prix au prix que la
 * clientèle juge normal, puis le chiffre d'affaires et la marge attendus à chaque prix, et recommande
 * un prix.
 *
 * Aucun cours : les calculs sont ceux des chapitres « Le marché et la part de marché », « La demande
 * répond au prix » et « Le prix psychologique », appelés tels quels. Il joue dans le monde du cours
 * (monde/economie-et-marketing.ts) : la droite de demande du trimestre, la ligne de 7 000 enceintes,
 * le coût variable de 38 €, le premier trimestre du marché, les repères des familles.
 */

const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`.replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const ratio = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/^-/, "−");
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « a », « a et b », « a, b et c ». */
const enListe = (t: string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const aUnMarche = (c: Cas) => ENTREPRISES_DE_LA_PART_DE_MARCHE.includes(c.code);
const aDesReperes = (c: Cas) => SEGMENTATIONS.includes(c.code);

const NOMS = ["le prix bas", "le prix actuel", "le prix haut"] as const;

/** Les trois prix, ce que chacun rapporterait, et les repères de la clientèle. */
export function prixDeLaSaison(c: Cas) {
  const d = demandeEtPrix(c);
  const f = mercatiqueDe(c);
  const cvu = coutVariable(f);
  const cap = capacite(f);
  const prix = [d.bas, d.base, d.haut].map((x, i) => {
    const t = trimestreAuPrix(f, x.prix);
    return { nom: NOMS[i]!, prix: x.prix, demande: t.demande, ventes: t.ventes, chiffreDAffaires: Math.round(t.chiffreDAffaires), marge: Math.round(t.marge) };
  });
  const meilleur = prix.reduce((a, b) => (b.marge > a.marge ? b : a));
  const plusGrosCa = prix.reduce((a, b) => (b.chiffreDAffaires > a.chiffreDAffaires ? b : a));
  const marche = aUnMarche(c) ? marcheEtPart(c) : null;
  const psy = aDesReperes(c) ? prixPsychologique(c) : null;
  // L'écart au prix jugé normal, comme le chapitre « Le prix psychologique » le calcule
  // pour le prix du mois, ici pour le prix bas et le prix haut.
  const reperes = psy
    ? {
        clientele: psy.etudie.nom,
        normal: psy.etudie.normal,
        tropBas: psy.etudie.tropBas,
        seuil: psy.seuil,
        ecartBas: auDixieme((d.bas.prix / psy.etudie.normal - 1) * 100),
        ecartHaut: auDixieme((d.haut.prix / psy.etudie.normal - 1) * 100),
      }
    : null;
  return { d, cvu, capacite: cap, prix, meilleur, plusGrosCa, marche, reperes };
}

export const QUEL_PRIX_POUR_LA_SAISON: Situation = {
  code: "quel-prix-pour-la-saison",
  parcours: "stmg",
  palier: 1,
  blocs: [],
  reprend: ["marche-et-part-de-marche", "prix-psychologique", "demande-et-prix"],
  commanditaire: "La direction",
  titre: "Quel prix pour la saison ?",
  accroche:
    "La direction hésite entre trois prix pour lancer la saison. Mesurer le marché, la réaction de la demande et l'acceptabilité de chaque prix, puis recommander.",
  objectifs: [
    "Calculer une part de marché et une part de marché relative",
    "Calculer l'élasticité de la demande au prix",
    "Situer un prix par rapport au prix que la clientèle juge normal",
    "Comparer le chiffre d'affaires et la marge attendus à plusieurs prix, et recommander",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_DEMANDE, pourquoi: POURQUOI_LE_MARCHE_DE_NOVA },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la direction",
      texte: (c) => {
        const r = prixDeLaSaison(c);
        return [
          `« Pour lancer la saison, nous hésitons entre trois prix : ${eur(r.prix[0]!.prix)}, ${eur(r.prix[1]!.prix)} comme aujourd'hui, ou ${eur(r.prix[2]!.prix)}. Avant de trancher, je veux savoir quelle place nous tenons sur le marché, comment nos clients réagissent au prix, et ce que chaque prix nous rapporterait. Votre recommandation pour lundi. » La direction`,
          "Pas de cours cette fois : vous avez les chiffres du marché et la demande attendue à chaque prix. Les calculs sont ceux que vous connaissez.",
        ];
      },
      tableau: (c) => {
        const r = prixDeLaSaison(c);
        const m = r.marche;
        const k = r.reperes;
        return {
          titre: `Le marché et les trois prix · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            ...(m
              ? [
                  { libelle: `Taille du marché sur un trimestre (${c.unites})`, valeurs: [qte(m.debut.marche)] },
                  { libelle: `Ventes ${dE(c.entreprise)} sur ce trimestre`, valeurs: [qte(m.debut.nova.ventes)] },
                  { libelle: `Ventes du principal concurrent, ${m.premierConcurrent.nom}`, valeurs: [qte(m.premierConcurrent.ventes)] },
                ]
              : []),
            ...r.prix.map((p) => ({ libelle: `Demande attendue à ${eur(p.prix)} (${c.unites})`, valeurs: [qte(p.demande)] })),
            { libelle: `Capacité du trimestre (${c.unites})`, valeurs: [qte(r.capacite)] },
            { libelle: `Coût variable d'${accord(c, "un")} ${c.unite}`, valeurs: [eur(r.cvu)] },
            ...(k
              ? [
                  { libelle: `Prix jugé normal par la clientèle « ${k.clientele} »`, valeurs: [eur(k.normal)] },
                  { libelle: "Prix sous lequel elle se méfie", valeurs: [eur(k.tropBas)] },
                  { libelle: "Seuil psychologique qu'elle ne veut pas franchir", valeurs: [eur(k.seuil)] },
                ]
              : []),
          ],
        };
      },
      repere: (c) => {
        const morceaux = [
          ...(aUnMarche(c) ? ["la part de marché"] : []),
          "l'élasticité de la demande au prix",
          ...(aDesReperes(c) ? ["l'écart des prix au prix jugé normal"] : []),
          "le chiffre d'affaires et la marge à chaque prix",
        ];
        return `À rendre : ${morceaux.join(", ")}, et votre recommandation.`;
      },
    },
    {
      id: "part-de-marche",
      type: "montants",
      titre: "La place sur le marché",
      notions: ["demand_market_share"],
      si: aUnMarche,
      question: () =>
        "Calculez la part de marché de l'entreprise, puis celle du principal concurrent (ventes ÷ marché × 100, au dixième), et la part de marché relative (la part de l'entreprise ÷ celle du concurrent, au centième).",
      champs: (c) => {
        const m = prixDeLaSaison(c).marche!;
        const e = m.debut.nova;
        return [
          { libelle: "Part de marché de l'entreprise (%)", attendu: e.part, calcul: `${qte(e.ventes)} ÷ ${qte(m.debut.marche)} × 100 = ${pct(e.part)}`, tolerance: 0.1 },
          { libelle: "Part de marché du concurrent (%)", attendu: m.premierConcurrent.part, calcul: `${qte(m.premierConcurrent.ventes)} ÷ ${qte(m.debut.marche)} × 100 = ${pct(m.premierConcurrent.part)}`, tolerance: 0.1 },
          { libelle: "Part de marché relative", attendu: m.partRelative, calcul: `${pct(e.part)} ÷ ${pct(m.premierConcurrent.part)} = ${ratio(m.partRelative)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const m = prixDeLaSaison(c).marche!;
        return [
          m.partRelative >= 1
            ? `Avec une part relative de ${ratio(m.partRelative)}, ${c.entreprise} vend plus que son principal concurrent : c'est elle que les autres regardent quand elle change de prix.`
            : `Avec une part relative de ${ratio(m.partRelative)}, ${c.entreprise} vend moins que ${m.premierConcurrent.nom} : un prix trop haut l'éloignerait encore du premier.`,
        ];
      },
    },
    {
      id: "elasticite",
      type: "montants",
      titre: "Comment la demande répond au prix",
      notions: ["price_elasticity"],
      question: () =>
        "Entre le prix actuel et le prix haut, calculez la variation de la demande et celle du prix (en %, au dixième), puis l'élasticité de la demande au prix (variation de la demande ÷ variation du prix, au centième).",
      champs: (c) => {
        const { d } = prixDeLaSaison(c);
        return [
          { libelle: "Variation de la demande (%)", attendu: d.variationDemande, calcul: `(${qte(d.haut.demande)} ÷ ${qte(d.base.demande)} − 1) × 100 = ${pct(d.variationDemande)}`, tolerance: 0.1 },
          { libelle: "Variation du prix (%)", attendu: d.variationPrix, calcul: `(${eur(d.haut.prix)} ÷ ${eur(d.base.prix)} − 1) × 100 = ${pct(d.variationPrix)}`, tolerance: 0.1 },
          { libelle: "Élasticité de la demande au prix", attendu: d.elasticite, calcul: `${pct(d.variationDemande)} ÷ ${pct(d.variationPrix)} = ${ratio(d.elasticite)}`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const { d } = prixDeLaSaison(c);
        return [
          d.elastique
            ? `L'élasticité vaut ${ratio(d.elasticite)} : la demande baisse plus vite que le prix ne monte. Une hausse de prix fait perdre plus de clients qu'elle ne rapporte par client.`
            : `L'élasticité vaut ${ratio(d.elasticite)} : la demande baisse moins vite que le prix ne monte. Les clients tiennent au produit plus qu'au prix.`,
        ];
      },
    },
    {
      id: "acceptabilite",
      type: "montants",
      titre: "Les prix face aux repères des clients",
      notions: ["psych_price"],
      si: aDesReperes,
      question: (c) => {
        const k = prixDeLaSaison(c).reperes!;
        return `Calculez l'écart du prix bas, puis du prix haut, au prix que la clientèle « ${k.clientele} » juge normal (prix ÷ prix normal − 1, en %, au dixième, négatif sous le prix normal).`;
      },
      champs: (c) => {
        const r = prixDeLaSaison(c);
        const k = r.reperes!;
        return [
          { libelle: "Écart du prix bas au prix normal (%)", attendu: k.ecartBas, calcul: `(${eur(r.d.bas.prix)} ÷ ${eur(k.normal)} − 1) × 100 = ${pct(k.ecartBas)}`, tolerance: 0.1 },
          { libelle: "Écart du prix haut au prix normal (%)", attendu: k.ecartHaut, calcul: `(${eur(r.d.haut.prix)} ÷ ${eur(k.normal)} − 1) × 100 = ${pct(k.ecartHaut)}`, tolerance: 0.1 },
        ];
      },
      explication: (c) => {
        const r = prixDeLaSaison(c);
        const k = r.reperes!;
        const { bas, base, haut } = r.d;
        return [
          base.prix > k.seuil
            ? `Le prix actuel dépasse déjà le seuil de ${eur(k.seuil)} : cette clientèle a déjà décroché, et le prix bas ${bas.prix > k.seuil ? "ne la ramène pas sous le seuil" : "la ramène sous le seuil"}.`
            : haut.prix > k.seuil
              ? `Le prix haut franchit le seuil de ${eur(k.seuil)} que cette clientèle ne veut pas dépasser : c'est là que la demande décroche.`
              : `Les trois prix restent sous le seuil de ${eur(k.seuil)} : aucun ne fait décrocher cette clientèle d'un coup.`,
          bas.prix < k.tropBas
            ? `Attention : le prix bas passe sous ${eur(k.tropBas)}, le prix sous lequel cette clientèle se méfie.`
            : `Même le prix bas reste au-dessus de ${eur(k.tropBas)}, le prix sous lequel cette clientèle se méfierait.`,
        ];
      },
    },
    {
      id: "ce-que-rapporte-chaque-prix",
      type: "montants",
      titre: "Ce que rapporterait chaque prix",
      notions: ["price_elasticity", "revenue"],
      question: () =>
        "À chaque prix, les ventes sont la demande attendue, dans la limite de la capacité. Calculez le chiffre d'affaires attendu à chaque prix, puis la marge attendue (les ventes × (prix − coût variable)), à l'euro.",
      champs: (c) => {
        const r = prixDeLaSaison(c);
        return [
          ...r.prix.map((p) => ({
            libelle: `Chiffre d'affaires à ${eur(p.prix)}`,
            attendu: p.chiffreDAffaires,
            calcul: `${qte(p.ventes)} × ${eur(p.prix)} = ${eur(p.chiffreDAffaires)}`,
            tolerance: 1,
          })),
          ...r.prix.map((p) => ({
            libelle: `Marge à ${eur(p.prix)}`,
            attendu: p.marge,
            calcul: `${qte(p.ventes)} × (${eur(p.prix)} − ${eur(r.cvu)}) = ${eur(p.marge)}`,
            tolerance: 1,
          })),
        ];
      },
      explication: (c) => {
        const r = prixDeLaSaison(c);
        const plafonnes = r.prix.filter((p) => p.demande > r.capacite);
        return [
          r.plusGrosCa.prix === r.meilleur.prix
            ? `À ${eur(r.meilleur.prix)}, ${r.meilleur.nom} fait à la fois le plus gros chiffre d'affaires et la plus grosse marge : ${eur(r.meilleur.marge)}.`
            : `Le plus gros chiffre d'affaires se fait à ${eur(r.plusGrosCa.prix)}, mais la plus grosse marge à ${eur(r.meilleur.prix)} : ${eur(r.meilleur.marge)}. Vendre plus ne paie que si chaque vente laisse assez de marge.`,
          plafonnes.length > 0
            ? `${majuscule(enListe(plafonnes.map((p) => `à ${eur(p.prix)}`)))}, la demande dépasse la capacité de ${qte(r.capacite)} ${c.unites} : les clients en plus ne seraient pas servis.`
            : `La capacité de ${qte(r.capacite)} ${c.unites} suffit à servir la demande aux trois prix.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre recommandation",
      question: () => "Quel prix recommandez-vous à la direction ?",
      options: (c) => {
        const r = prixDeLaSaison(c);
        return [
          ...r.prix.map((p) => ({
            texte: `${eur(p.prix)} : la marge attendue y est la plus haute`,
            juste: p.prix === r.meilleur.prix,
            retour:
              p.prix === r.meilleur.prix
                ? `Oui : ${qte(p.ventes)} ${c.unites} à ${eur(p.prix)}, soit ${eur(p.marge)} de marge, plus qu'aux deux autres prix.`
                : `Non : à ${eur(p.prix)}, la marge attendue est de ${eur(p.marge)}, contre ${eur(r.meilleur.marge)} à ${eur(r.meilleur.prix)}.${p.demande > r.capacite ? " La demande y dépasserait la capacité." : p.prix === r.plusGrosCa.prix ? " Le chiffre d'affaires y est plus gros, pas la marge." : ""}`,
          })),
          {
            texte: "N'importe lequel : la demande ne dépend pas du prix",
            juste: false,
            retour: `Non : l'élasticité vaut ${ratio(r.d.elasticite)}. Entre le prix bas et le prix haut, la demande passe de ${qte(r.d.bas.demande)} à ${qte(r.d.haut.demande)} ${c.unites}.`,
          },
        ];
      },
    },
  ],
};
