import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { COUTS_OU_DIFFERENCIATION, ficheDe } from "../../chapitres/couts-ou-differenciation";
import { demiMesure, enseigneDe, gammeDe, offreDeNova, qualitePercue } from "../../monde/attractivite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DOMINATION PAR LES COÛTS OU DIFFÉRENCIATION » : BAISSER LES PRIX
 * SANS RIEN COUPER (Stratégie et management, palier 2).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le marché à trois enseignes
 * (monde/marche-a-trois.ts) et son modèle (monde/attractivite.ts, `demiMesure`), chez NOVA.
 *
 * Le directeur commercial veut le volume de la stratégie de coûts sans en payer le prix : le prix
 * de la stratégie de coûts (54 €), mais la gamme d'aujourd'hui et le budget qualité d'aujourd'hui,
 * pour que les clients ne perdent rien. L'élève refait l'année de cette demi-mesure (sa part du
 * marché, ses ventes, sa marge, son résultat, son coût complet), la compare à la stratégie de coûts
 * entière et à aujourd'hui, puis croise les écarts : la marge perdue sur chaque enceinte, le volume
 * gagné et les budgets gardés. Un curseur montre ce qu'il faudrait vendre pour rattraper la
 * stratégie de coûts : plus que la ligne ne peut fabriquer. La réponse demande un jugement : la
 * demi-mesure vend le plus, et gagne le moins.
 *
 * Le cas est neuf par sa question : le chapitre compare des stratégies cohérentes ; le cas mesure ce
 * que vaut une stratégie à moitié tenue. Les parts et les marges y diffèrent de celles de la
 * stratégie de coûts (le défaut « 24,4 % contre 24,4 % » de l'ancienne version est réglé).
 */

/** Les bornes du curseur : les ventes de l'année de la demi-mesure. */
export const VENTES_DU_CURSEUR_DE_LA_DEMI_MESURE = { min: 24_000, max: 32_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${qte(Math.round(x * 10_000) / 100)} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dec = (x: number, n = 2) => x.toLocaleString("fr-FR", { minimumFractionDigits: n, maximumFractionDigits: n });

/** La demi-mesure, face à la stratégie de coûts entière et à aujourd'hui, et les écarts qui se croisent. */
export function prixBasSansRienCouper(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const d = demiMesure(f);
  const { demi, couts, milieu } = d;
  const strategie = (code: "milieu" | "couts" | "demi-mesure") => f.strategies.find((x) => x.code === code)!;
  const trois = (["milieu", "couts", "demi-mesure"] as const).map((code) => {
    const s = strategie(code);
    return { code, strategie: s, gamme: gammeDe(f, s.gamme), qualite: qualitePercue(f, offreDeNova(f, { gamme: s.gamme, budgetQualite: s.budgetQualite })) };
  });
  const premier = demi.trimestres[0]!;
  // Les attractivités des concurrents réunies : celles de l'année, qui ne bougent pas avec NOVA.
  const desConcurrents = premier.attractivite / premier.part - premier.attractivite;
  // Le croisement : la marge perdue sur chaque enceinte vendue, le volume gagné valorisé à la marge
  // de la stratégie de coûts, et les budgets gardés.
  const effetDeLaMarge = auCentime((demi.margeUnitaire - couts.margeUnitaire) * demi.ventes);
  const effetDuVolume = auCentime((demi.ventes - couts.ventes) * couts.margeUnitaire);
  const effetDesBudgets = auCentime(-(demi.budgets - couts.budgets));
  // Ce qu'il faudrait vendre, à la marge de la demi-mesure, pour rattraper la stratégie de coûts ; et la ligne.
  const ventesPourRattraper = Math.ceil((couts.resultat + demi.charges) / demi.margeUnitaire - 1e-9);
  const capaciteDuTrimestre = enseigneDe(f, "nova").capacite;
  const capaciteDeLAnnee = capaciteDuTrimestre * f.marche.trimestres;
  return {
    f,
    d,
    demi,
    couts,
    milieu,
    trois,
    soundbox: enseigneDe(f, "soundbox"),
    auris: enseigneDe(f, "auris"),
    verdict: d.verdict,
    attractiviteDeLaDemi: premier.attractivite,
    attractivitesDesConcurrents: desConcurrents,
    partDuTrimestre: Math.round(premier.part * 10_000) / 100,
    ventesDuTrimestre: premier.ventes,
    ecartAvecLesCouts: d.ecartAvecLesCouts,
    ecartAvecLeMilieu: d.ecartAvecLeMilieu,
    effetDeLaMarge,
    effetDuVolume,
    effetDesBudgets,
    ventesPourRattraper,
    capaciteDuTrimestre,
    capaciteDeLAnnee,
    partPourRattraper: ventesPourRattraper / (f.marche.parTrimestre * f.marche.trimestres),
  };
}

export type PrixBasSansRienCouper = ReturnType<typeof prixBasSansRienCouper>;

const COLONNES = ["Aujourd'hui, le milieu", "La stratégie de coûts", "Prix bas, rien de coupé"];

export const BAISSER_LES_PRIX_SANS_RIEN_COUPER: Situation = {
  code: "baisser-les-prix-sans-rien-couper",
  parcours: "strategie",
  palier: 2,
  blocs: [],
  reprend: [COUTS_OU_DIFFERENCIATION.code],
  commanditaire: "Le directeur commercial",
  titre: "Baisser les prix sans rien couper",
  accroche:
    "Le prix de la stratégie de coûts, sans couper la gamme ni la qualité : le directeur commercial veut le volume sans le renoncement. Ce que vaut cette demi-mesure, face à la stratégie entière et à aujourd'hui.",
  objectifs: [
    "Refaire l'année d'une stratégie : part de marché, ventes, marge, coût complet, résultat",
    "Comparer une stratégie à moitié tenue à la stratégie entière",
    "Décomposer un écart de résultat en effet de la marge, du volume et des budgets",
    "Répondre au directeur commercial, chiffre à l'appui",
  ],
  libre: false,
  entreprises: COUTS_OU_DIFFERENCIATION.entreprises!,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La proposition du directeur commercial",
      tableau: (c) => {
        const k = prixBasSansRienCouper(c);
        return {
          titre: "Ce que chaque solution met sur le marché, chaque trimestre",
          colonnes: COLONNES,
          lignes: [
            { libelle: "Gamme", valeurs: k.trois.map((x) => x.gamme.nom.replace(/^la /, "")) },
            { libelle: "Coût variable d'une enceinte", valeurs: k.trois.map((x) => eur(x.gamme.composants + x.gamme.autres)) },
            { libelle: "Prix de vente", valeurs: k.trois.map((x) => eur(x.strategie.prix)) },
            { libelle: "Budget qualité par trimestre", valeurs: k.trois.map((x) => eur(x.strategie.budgetQualite)) },
            { libelle: "Qualité perçue", valeurs: k.trois.map((x) => dec(x.qualite)) },
            { libelle: `Ventes de l'année (${k.f.unites})`, valeurs: [qte(k.milieu.ventes), qte(k.couts.ventes), "à calculer"] },
            { libelle: "Charges fixes et budgets de l'année", valeurs: [eur(k.milieu.charges), eur(k.couts.charges), eur(k.demi.charges)] },
            { libelle: "Résultat de l'année", valeurs: [eur(k.milieu.resultat), eur(k.couts.resultat), "à calculer"] },
          ],
        };
      },
      texte: (c) => {
        const k = prixBasSansRienCouper(c);
        const prix = k.trois[2]!.strategie.prix;
        return [
          `« Pour prendre des parts de marché, vendons à ${eur(prix)}, comme dans la stratégie de coûts. Mais sans toucher à notre gamme ni à notre budget qualité : nos clients ne doivent rien perdre. Dites-moi si c'est mieux que la stratégie de coûts entière, et que ce que fait ${k.f.entreprise} aujourd'hui. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, dans la même simulation. Le marché reste de ${qte(k.f.marche.parTrimestre)} ${k.f.unites} par trimestre, partagé selon l'attractivité, (${qte(k.f.attractivite.prixDeReference)} ÷ prix) puissance ${k.f.attractivite.elasticiteAuPrix} × qualité perçue puissance ${k.f.attractivite.elasticiteALaQualite} × (1 + image). ${k.soundbox.nom} et ${k.auris.nom} ne changent rien : leurs attractivités réunies valent ${dec(k.attractivitesDesConcurrents, 4)} chaque trimestre. La ligne fabrique au plus ${qte(k.capaciteDuTrimestre)} ${k.f.unites} par trimestre.`,
        ];
      },
      repere: () =>
        "À rendre : ce que la proposition vend et gagne, son écart avec la stratégie de coûts et avec aujourd'hui, d'où vient cet écart, et votre réponse.",
    },
    {
      id: "les-ventes",
      type: "montants",
      titre: "Ce que la proposition vend",
      notions: ["demand_market_share", "price_elasticity", "contribution_margin"],
      question: (c) => {
        const k = prixBasSansRienCouper(c);
        return `Combien la proposition fait-elle vendre à ${k.f.entreprise}, et que lui laisse chaque vente ? Donnez sa part du marché de chaque trimestre (au centième de pour cent), ses ventes de l'année (à l'enceinte, chaque trimestre) et sa marge par enceinte.`;
      },
      champs: (c) => {
        const k = prixBasSansRienCouper(c);
        const a = k.f.attractivite;
        const p = k.trois[2]!.strategie.prix;
        const at = dec(k.attractiviteDeLaDemi, 4);
        return [
          {
            libelle: "Part de marché de la proposition, chaque trimestre (%)",
            attendu: k.partDuTrimestre,
            calcul: `(${qte(a.prixDeReference)} ÷ ${qte(p)}) puissance ${a.elasticiteAuPrix} × ${dec(k.trois[2]!.qualite)} au carré = ${at} ; ${at} ÷ (${at} + ${dec(k.attractivitesDesConcurrents, 4)}) × 100 = ${qte(k.partDuTrimestre)} %`,
          },
          {
            libelle: "Ventes de l'année de la proposition",
            attendu: k.demi.ventes,
            calcul: `${qte(k.partDuTrimestre)} % × ${qte(k.f.marche.parTrimestre)} = ${qte(k.ventesDuTrimestre)} ${k.f.unites} par trimestre, × ${k.f.marche.trimestres} = ${qte(k.demi.ventes)}`,
            tolerance: 0,
          },
          { libelle: "Marge par enceinte de la proposition", attendu: k.demi.margeUnitaire, calcul: `${eur(k.demi.offre.prix)} − ${eur(k.demi.coutVariable)} = ${eur(k.demi.margeUnitaire)}` },
        ];
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          `La proposition prend ${pct(k.demi.part)} du marché, contre ${pct(k.couts.part)} avec la stratégie de coûts et ${pct(k.milieu.part)} aujourd'hui : au même prix, la gamme gardée fait vendre plus que la gamme standard. Elle reste sous la ligne : ${qte(k.ventesDuTrimestre)} ${k.f.unites} par trimestre, pour ${qte(k.capaciteDuTrimestre)} possibles.`,
          `Mais chaque enceinte ne laisse que ${eur(k.demi.margeUnitaire)}, contre ${eur(k.couts.margeUnitaire)} avec la stratégie de coûts : la gamme gardée coûte ${eur(k.d.coutVariableEnPlus)} de plus par enceinte, au même prix.`,
        ];
      },
    },
    {
      id: "le-resultat",
      type: "montants",
      titre: "Ce que la proposition fait au résultat",
      notions: ["income_statement", "full_unit_cost"],
      question: () =>
        "Calculez le résultat de l'année de la proposition et le coût complet d'une enceinte vendue, puis son écart de résultat avec la stratégie de coûts entière et avec aujourd'hui. Négatif pour un écart défavorable.",
      champs: (c) => {
        const k = prixBasSansRienCouper(c);
        const d = k.demi;
        return [
          { libelle: "Résultat de la proposition", attendu: d.resultat, calcul: `${qte(d.ventes)} × ${eur(d.margeUnitaire)} − ${eur(d.charges)} = ${eur(d.resultat)}`, tolerance: 1 },
          { libelle: "Coût complet d'une enceinte vendue", attendu: d.coutComplet, calcul: `${eur(d.coutVariable)} + ${eur(d.charges)} ÷ ${qte(d.ventes)} = ${eur(d.coutComplet)}` },
          { libelle: "Écart avec la stratégie de coûts", attendu: k.ecartAvecLesCouts, calcul: `${eur(d.resultat)} − ${entre(k.couts.resultat)} = ${eur(k.ecartAvecLesCouts)}`, tolerance: 1 },
          { libelle: "Écart avec aujourd'hui", attendu: k.ecartAvecLeMilieu, calcul: `${eur(d.resultat)} − ${entre(k.milieu.resultat)} = ${eur(k.ecartAvecLeMilieu)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          `La proposition vend le plus des trois solutions et gagne le moins : ${eur(k.demi.resultat)}, contre ${eur(k.couts.resultat)} avec la stratégie de coûts et ${eur(k.milieu.resultat)} aujourd'hui. Une enceinte y coûte ${eur(k.demi.coutComplet)} tout compris, pour ${eur(k.demi.offre.prix)} de prix ; avec la stratégie de coûts, ${eur(k.couts.coutComplet)}.`,
        ];
      },
    },
    {
      id: "le-croisement",
      type: "montants",
      titre: "D'où vient l'écart",
      notions: ["contribution_margin", "volume_price_variance"],
      question: (c) => {
        const k = prixBasSansRienCouper(c);
        return `L'écart de ${eur(k.ecartAvecLesCouts)} avec la stratégie de coûts a trois causes. Chiffrez la marge perdue sur chaque enceinte vendue par la proposition, les ventes en plus valorisées à la marge de la stratégie de coûts, et le budget qualité gardé. Négatif pour un écart défavorable.`;
      },
      champs: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          {
            libelle: "Effet de la marge par enceinte",
            attendu: k.effetDeLaMarge,
            calcul: `(${eur(k.demi.margeUnitaire)} − ${eur(k.couts.margeUnitaire)}) × ${qte(k.demi.ventes)} = ${eur(k.effetDeLaMarge)}`,
            tolerance: 1,
          },
          {
            libelle: "Effet du volume",
            attendu: k.effetDuVolume,
            calcul: `(${qte(k.demi.ventes)} − ${qte(k.couts.ventes)}) × ${eur(k.couts.margeUnitaire)} = ${eur(k.effetDuVolume)}`,
            tolerance: 1,
          },
          {
            libelle: "Effet des budgets gardés",
            attendu: k.effetDesBudgets,
            calcul: `${eur(k.couts.budgets)} − ${eur(k.demi.budgets)} = ${eur(k.effetDesBudgets)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        return [
          `Les trois effets refont l'écart : ${eur(k.effetDeLaMarge)} + ${eur(k.effetDuVolume)} + ${entre(k.effetDesBudgets)} = ${eur(k.ecartAvecLesCouts)}. Comme pour l'écart sur marge, la marge perdue se compte sur les ventes de la proposition, et le volume à la marge de la solution comparée.`,
          `Le volume gagné rapporte ${eur(k.effetDuVolume)}, mais la marge perdue en coûte ${eur(-k.effetDeLaMarge)} : garder la gamme d'aujourd'hui à un prix de stratégie de coûts, c'est payer chaque enceinte trop cher pour ce qu'elle se vend.`,
        ];
      },
    },
    {
      id: "rattraper-au-curseur",
      type: "curseur",
      titre: "Ce qu'il faudrait vendre",
      notions: ["breakeven", "capacity"],
      question: (c) => {
        const k = prixBasSansRienCouper(c);
        return `Le directeur commercial insiste : « Il suffit de vendre plus. » Faites varier les ventes de l'année de la proposition, à ${eur(k.demi.margeUnitaire)} par enceinte et à ses charges (${eur(k.demi.charges)}). Placez le curseur sur le plus petit nombre de ventes où son résultat égale celui de la stratégie de coûts (${eur(k.couts.resultat)}), puis validez.`;
      },
      grandeur: (c) => ({ libelle: "Ventes de l'année de la proposition", unite: ficheDe(c).unites }),
      cible: (c) => {
        const k = prixBasSansRienCouper(c);
        return { attendu: k.ventesPourRattraper, min: VENTES_DU_CURSEUR_DE_LA_DEMI_MESURE.min, max: VENTES_DU_CURSEUR_DE_LA_DEMI_MESURE.max };
      },
      zones: ["La proposition rattrape la stratégie de coûts", "La stratégie de coûts reste devant"],
      rates: () => ({
        dessous: "À cette position, la proposition gagne encore moins que la stratégie de coûts.",
        dessus: "Plus bas, la proposition rattrape encore la stratégie de coûts : cherchez le plus petit nombre de ventes.",
      }),
      montrer: "Montrer le rattrapage",
      lecture: (c, q) => {
        const k = prixBasSansRienCouper(c);
        const r = auCentime(k.demi.margeUnitaire * q - k.demi.charges);
        return [
          { libelle: "Marge sur coût variable", montant: auCentime(k.demi.margeUnitaire * q) },
          { libelle: "Charges fixes et budgets de l'année", montant: k.demi.charges },
          { libelle: "Résultat de la proposition", montant: r },
          { libelle: "Écart avec la stratégie de coûts", montant: auCentime(r - k.couts.resultat), fort: true },
        ];
      },
      droites: (c) => {
        const k = prixBasSansRienCouper(c);
        return { produit: (q) => k.demi.margeUnitaire * q - k.demi.charges, cout: () => k.couts.resultat, libelles: ["Résultat de la proposition", "Résultat de la stratégie de coûts"] };
      },
      explication: (c) => {
        const k = prixBasSansRienCouper(c);
        const bute = k.ventesPourRattraper > k.capaciteDeLAnnee;
        return [
          `Il faudrait ${qte(k.ventesPourRattraper)} ${k.f.unites}, soit ${pct(k.partPourRattraper)} du marché. ${
            bute
              ? `C'est plus que la ligne ne peut fabriquer dans l'année (${qte(k.capaciteDeLAnnee)}) : même si les clients suivaient, ${k.f.entreprise} ne pourrait pas les servir.`
              : `La ligne pourrait les fabriquer (${qte(k.capaciteDeLAnnee)}), mais le marché ne grandit pas.`
          }`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au directeur commercial",
      notions: ["demand_market_share", "contribution_margin"],
      question: () => "Quelle solution recommandez-vous au directeur commercial ?",
      options: (c) => {
        const k = prixBasSansRienCouper(c);
        const chiffres = `${eur(k.demi.resultat)} avec la proposition, ${eur(k.couts.resultat)} avec la stratégie de coûts, ${eur(k.milieu.resultat)} aujourd'hui`;
        return [
          {
            texte: "La stratégie de coûts entière",
            juste: k.verdict === "couts",
            retour:
              k.verdict === "couts"
                ? `Oui : ${chiffres}. Une stratégie de coûts se tient jusqu'au bout : baisser le prix sans baisser le coût de la gamme, c'est garder les charges d'une offre moyenne avec les marges d'une offre bon marché. La proposition perd ${eur(-k.effetDeLaMarge)} de marge sur ses enceintes, que le volume (${eur(k.effetDuVolume)}) ne rattrape pas ; pour égaler la stratégie de coûts, il lui faudrait ${qte(k.ventesPourRattraper)} ventes.`
                : `Non : ${chiffres}.`,
          },
          {
            texte: "Les prix bas sans rien couper, pour la part de marché",
            juste: k.verdict === "demi-mesure",
            retour:
              k.verdict === "demi-mesure"
                ? `Oui : ${chiffres}.`
                : `Non : ${chiffres}. La proposition prend le plus de parts de marché (${pct(k.demi.part)}) et fait le plus petit résultat des trois : la part de marché n'est pas le but.`,
          },
          {
            texte: "Les prix bas, en fabriquant davantage pour suivre la demande",
            juste: false,
            retour: `Non : la ligne ne borne rien ici, la proposition vend ${qte(k.ventesDuTrimestre)} ${k.f.unites} par trimestre pour ${qte(k.capaciteDuTrimestre)} possibles. Fabriquer plus ne ferait pas vendre plus : ${chiffres}.`,
          },
          {
            texte: "Rester au milieu, comme aujourd'hui",
            juste: k.verdict === "milieu",
            retour: k.verdict === "milieu" ? `Oui : ${chiffres}.` : `Non : ${chiffres}. Ne rien changer laisse ${eur(k.couts.resultat - k.milieu.resultat)} à la stratégie de coûts entière.`,
          },
        ];
      },
    },
  ],
};
