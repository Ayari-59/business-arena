import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { HOTELS, duNom, occupation, trimestre } from "../../chapitres/occupation-et-revenu-par-chambre";
import { anneeAuPrixUnique, anneeAuTarif, concurrentsDe, lHotelEnIndicateurs, type IndicateursDHotel } from "../../monde/concurrence-hoteliere";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX D'OCCUPATION, LE PRIX MOYEN ET LE REVENU PAR CHAMBRE » :
 * S'ALIGNER SUR LE PRIX DU CONCURRENT ? (BTS MHR, palier 2).
 *
 * Un concurrent de la ville remplit mieux que l'hôtel, à un prix plus bas : la directrice veut
 * s'aligner sur son prix toute l'année, et dit son critère, celui du chapitre : le revenu par
 * chambre disponible (RevPAR) de l'année. La simulation du cours rejoue l'année de l'hôtel au prix
 * du concurrent (monde/hotel.ts, monde/concurrence-hoteliere.ts) ; l'élève calcule l'occupation et
 * le RevPAR de l'année aux deux prix, ce que le prix plus bas change en chambres vendues et en
 * chiffre d'affaires, et rend sa réponse.
 *
 * LE CRITÈRE EST UN SEUL, DIT DANS LE TEXTE : le RevPAR de l'année. Le résultat de l'année est
 * donné en appui, et le cas vérifie qu'il dit la même chose (sinon il s'arrête) : la question et la
 * réponse ne se contredisent pas. Avec la fiche de L'ESCALE, le prix du Comptoir remplit l'hôtel
 * davantage mais fait baisser le RevPAR et le résultat : la bonne réponse est de garder le tarif.
 *
 * Ce que la simulation suppose (dit à l'élève) : les mêmes clientèles en face, qui demandent plus de
 * nuitées quand le prix baisse ; pas plus de nuitées vendues que de chambres ; le concurrent ne
 * bouge pas.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** « a », « a et b », « a, b et c ». */
const enListe = (t: readonly string[]) => (t.length < 2 ? t.join("") : `${t.slice(0, -1).join(", ")} et ${t.at(-1)}`);
/** « au 1er et au 4e trimestre » (k compté à partir de 0). */
const auxTrimestres = (ks: readonly number[]) => enListe(ks.map((k, i) => (i === ks.length - 1 ? `au ${trimestre(k)}` : `au ${trimestre(k).replace(" trimestre", "")}`)));
const TRIMESTRES = ["1er trim.", "2e trim.", "3e trim.", "4e trim."] as const;

export type Verdict = "garder" | "aligner";

/** L'année de l'hôtel à son tarif, puis au prix du concurrent qui remplit mieux que lui, moins cher. */
export function alignement(c: Pick<Cas, "code">) {
  const o = occupation(c);
  const f = o.f;
  // Le concurrent qui, sur l'année, a rempli mieux que l'hôtel à un prix moyen plus bas.
  const rival = concurrentsDe(f).find((x) => x.annee.occupation > o.annee.occupation && x.annee.prixMoyen < o.annee.prixMoyen);
  if (!rival) throw new Error(`Aucun concurrent ${dE(f.entreprise)} ne remplit mieux que lui, moins cher`);
  const prixDuConcurrent = rival.annee.prixMoyen;
  const auTarif = anneeAuTarif(f);
  const auPrixBas = anneeAuPrixUnique(f, prixDuConcurrent);
  const tarif = lHotelEnIndicateurs(f, auTarif);
  const aligne = lHotelEnIndicateurs(f, auPrixBas);
  const verdict: Verdict = aligne.annee.revpar > tarif.annee.revpar ? "aligner" : "garder";
  // Le critère du cas est le RevPAR ; le résultat de l'année, donné en appui, doit dire la même chose.
  const parLeResultat: Verdict = auPrixBas.resultat > auTarif.resultat ? "aligner" : "garder";
  if (parLeResultat !== verdict) throw new Error(`${f.entreprise} : le RevPAR et le résultat de l'année ne disent pas la même chose`);
  const ecartsDeChiffre = aligne.trimestres.map((x, k) => auCentime(x.chiffreDAffaires - tarif.trimestres[k]!.chiffreDAffaires));
  const quarts = [0, 1, 2, 3].slice(0, ecartsDeChiffre.length);
  return {
    o,
    f,
    rival: rival.nom,
    leRival: rival.annee,
    prixAuTarif: f.prixDeLAnnee,
    prixDuConcurrent,
    tarif,
    aligne,
    resultatAuTarif: auTarif.resultat,
    resultatAligne: auPrixBas.resultat,
    vendueEnPlus: aligne.annee.vendues - tarif.annee.vendues,
    /** Tarif moins prix du concurrent : positif si le tarif rapporte plus. */
    ecartDeChiffre: auCentime(tarif.annee.chiffreDAffaires - aligne.annee.chiffreDAffaires),
    ecartDeResultat: auCentime(auTarif.resultat - auPrixBas.resultat),
    ecartsDeChiffre,
    /** Les trimestres où le prix plus bas fait monter le chiffre d'affaires, et ceux où il le fait baisser. */
    hausse: quarts.filter((k) => ecartsDeChiffre[k]! > 0),
    baisse: quarts.filter((k) => ecartsDeChiffre[k]! < 0),
    /** Les nuitées que l'hôtel refuse encore, complet, au prix du concurrent, trimestre par trimestre. */
    refuseesAuPrixBas: auPrixBas.trimestres.map((t) => t.refusees),
    verdict,
  };
}

function tableauDeLAnnee(c: Cas): TableauDeDonnees {
  const a = alignement(c);
  const valeurs = (x: { trimestres: IndicateursDHotel[]; annee: IndicateursDHotel }, g: (y: IndicateursDHotel) => string) => [...x.trimestres.map(g), g(x.annee)];
  return {
    titre: `L'année ${dE(a.f.entreprise)}, rejouée au prix ${duNom(a.rival)}`,
    colonnes: [...TRIMESTRES.slice(0, a.tarif.trimestres.length), "Année"],
    lignes: [
      { libelle: "Chambres disponibles", valeurs: valeurs(a.tarif, (y) => qte(y.disponibles)) },
      { libelle: `Chambres vendues à ${eur(a.prixAuTarif)}`, valeurs: valeurs(a.tarif, (y) => qte(y.vendues)) },
      { libelle: `Chiffre d'affaires à ${eur(a.prixAuTarif)}`, valeurs: valeurs(a.tarif, (y) => eur(y.chiffreDAffaires)) },
      { libelle: `Chambres vendues à ${eur(a.prixDuConcurrent)}`, valeurs: valeurs(a.aligne, (y) => qte(y.vendues)) },
      { libelle: `Chiffre d'affaires à ${eur(a.prixDuConcurrent)}`, valeurs: valeurs(a.aligne, (y) => eur(y.chiffreDAffaires)) },
    ],
  };
}

export const S_ALIGNER_SUR_LE_PRIX_DU_CONCURRENT: Situation = {
  code: "s-aligner-sur-le-prix-du-concurrent",
  parcours: "mhr",
  palier: 2,
  blocs: [],
  reprend: ["occupation-et-revenu-par-chambre"],
  commanditaire: "La directrice de l'hôtel",
  titre: "S'aligner sur le prix du concurrent ?",
  accroche:
    "Un concurrent remplit mieux que l'hôtel, à un prix plus bas. La directrice veut s'aligner sur son prix toute l'année, et jugera au revenu par chambre disponible. La simulation du cours rejoue l'année à ce prix.",
  objectifs: [
    "Calculer le taux d'occupation et le RevPAR d'une année rejouée",
    "Chiffrer ce qu'un prix plus bas change en chambres vendues et en chiffre d'affaires",
    "Choisir un prix au RevPAR, et pas à l'occupation seule",
  ],
  libre: false,
  entreprises: {
    codes: HOTELS,
    pourquoi: "ce cas compte des chambres louées à la nuit, et elle n'en loue pas.",
  },
  etapes: [
    {
      id: "la-question",
      type: "lecture",
      titre: "La question de la directrice",
      texte: (c) => {
        const a = alignement(c);
        return [
          `« ${a.rival} loue ${eur(a.prixDuConcurrent)} la nuitée, et sur l'année il a rempli ${pct(a.leRival.occupation)} de ses chambres ; nous, ${pct(a.tarif.annee.occupation)} à ${eur(a.prixAuTarif)}. Je veux nous aligner sur son prix, toute l'année. Jugez-en au revenu par chambre disponible de l'année : c'est le chiffre que je suis. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre. La simulation du cours a rejoué l'année ${dE(a.f.entreprise)} à ${eur(a.prixDuConcurrent)} la nuitée, avec les mêmes clientèles en face : elles demandent plus de nuitées quand le prix baisse, et l'hôtel n'en vend pas plus qu'il n'a de chambres. ${a.rival}, lui, ne bouge pas.`,
        ];
      },
      tableau: tableauDeLAnnee,
      repere: () => "À rendre : le taux d'occupation et le RevPAR de l'année à chaque prix, ce que le prix plus bas change en chambres vendues et en chiffre d'affaires, et votre réponse à la directrice.",
    },
    {
      id: "les-deux-prix",
      type: "montants",
      titre: "Occupation et RevPAR de chaque prix",
      notions: ["occupancy_revpar"],
      question: () =>
        "Calculez, pour chaque prix, le taux d'occupation de l'année (au dixième) et son RevPAR (au centime) : les chambres vendues, puis le chiffre d'affaires, divisés par les chambres disponibles de l'année.",
      champs: (c) => {
        const a = alignement(c);
        const t = a.tarif.annee;
        const p = a.aligne.annee;
        const auPrix = `au prix ${duNom(a.rival)}`;
        return [
          { libelle: "Taux d'occupation, au tarif (%)", attendu: t.occupation, calcul: `${qte(t.vendues)} ÷ ${qte(t.disponibles)} × 100 = ${pct(t.occupation)}`, tolerance: 0.1 },
          { libelle: "RevPAR, au tarif", attendu: t.revpar, calcul: `${eur(t.chiffreDAffaires)} ÷ ${qte(t.disponibles)} = ${eur(t.revpar)}` },
          { libelle: `Taux d'occupation, ${auPrix} (%)`, attendu: p.occupation, calcul: `${qte(p.vendues)} ÷ ${qte(p.disponibles)} × 100 = ${pct(p.occupation)}`, tolerance: 0.1 },
          { libelle: `RevPAR, ${auPrix}`, attendu: p.revpar, calcul: `${eur(p.chiffreDAffaires)} ÷ ${qte(p.disponibles)} = ${eur(p.revpar)}` },
        ];
      },
      explication: (c) => {
        const a = alignement(c);
        const t = a.tarif.annee;
        const p = a.aligne.annee;
        return [
          `Au prix ${duNom(a.rival)}, l'hôtel occupe ${pct(p.occupation)} de ses chambres, contre ${pct(t.occupation)} à son tarif. Le RevPAR, lui, fait ${eur(p.revpar)} contre ${eur(t.revpar)} : ${
            p.revpar < t.revpar ? "plus rempli, l'hôtel rapporte moins par chambre disponible" : "l'hôtel est plus rempli, et chaque chambre disponible rapporte plus"
          }.`,
        ];
      },
    },
    {
      id: "l-ecart",
      type: "montants",
      titre: "Ce que le prix plus bas change",
      notions: ["occupancy_revpar", "price_elasticity"],
      question: (c) => {
        const a = alignement(c);
        return `Calculez les chambres vendues en plus sur l'année au prix ${duNom(a.rival)}, puis l'écart de chiffre d'affaires de l'année entre le tarif et le prix ${duNom(a.rival)} (positif si le tarif rapporte plus).`;
      },
      champs: (c) => {
        const a = alignement(c);
        return [
          { libelle: "Chambres vendues en plus", attendu: a.vendueEnPlus, calcul: `${qte(a.aligne.annee.vendues)} − ${qte(a.tarif.annee.vendues)} = ${qte(a.vendueEnPlus)}` },
          {
            libelle: "Écart de chiffre d'affaires",
            attendu: a.ecartDeChiffre,
            calcul: `${eur(a.tarif.annee.chiffreDAffaires)} − ${eur(a.aligne.annee.chiffreDAffaires)} = ${ecart(a.ecartDeChiffre)}`,
          },
        ];
      },
      explication: (c) => {
        const a = alignement(c);
        const de = (ks: readonly number[]) => ks.map((k) => ecart(a.ecartsDeChiffre[k]!)).join(", ");
        const refusees = a.baisse.reduce((s, k) => s + a.refuseesAuPrixBas[k]!, 0);
        const complets = a.baisse.length > 0 && a.baisse.every((k) => a.refuseesAuPrixBas[k]! > 0);
        const morceaux = [
          a.hausse.length
            ? `${majuscule(auxTrimestres(a.hausse))}, il restait des chambres vides : le prix plus bas en remplit, et le chiffre d'affaires monte (${de(a.hausse)}).`
            : "",
          a.baisse.length
            ? `${majuscule(auxTrimestres(a.baisse))}, ${
                complets
                  ? `l'hôtel est complet à ce prix, et refuse encore ${qte(refusees)} nuitées : chaque chambre y part ${eur(auCentime(a.prixAuTarif - a.prixDuConcurrent))} moins cher, sans assez de chambres remplies en plus pour compenser`
                  : "les chambres remplies en plus ne paient pas la baisse du prix"
              }. Le chiffre d'affaires baisse (${de(a.baisse)}).`
            : "",
          `Le résultat de l'année, lui, ${a.ecartDeResultat > 0 ? `baisse de ${eur(a.ecartDeResultat)}` : `monte de ${eur(-a.ecartDeResultat)}`} au prix ${duNom(a.rival)} : chaque chambre louée en plus coûte aussi ${eur(a.f.coutVariableParNuitee)} (ménage, linge, petit-déjeuner).`,
        ];
        return morceaux.filter(Boolean);
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["occupancy_revpar"],
      question: () => "La directrice juge au revenu par chambre disponible de l'année. Quelle réponse lui rendez-vous ?",
      options: (c) => {
        const a = alignement(c);
        const t = a.tarif.annee;
        const p = a.aligne.annee;
        const revpar = `le RevPAR de l'année passerait de ${eur(t.revpar)} à ${eur(p.revpar)}`;
        const resultat =
          a.ecartDeResultat > 0 ? `le résultat de l'année baisserait de ${eur(a.ecartDeResultat)}` : `le résultat de l'année monterait de ${eur(-a.ecartDeResultat)}`;
        return [
          {
            texte: `Garder ${eur(a.prixAuTarif)} : le RevPAR de l'année baisserait`,
            juste: a.verdict === "garder",
            retour:
              a.verdict === "garder"
                ? `Oui. Au prix ${duNom(a.rival)}, l'hôtel serait plus rempli (${pct(p.occupation)} contre ${pct(t.occupation)}), mais ${revpar}, et ${resultat}. Le prix plus bas ne paie qu'aux trimestres où il reste des chambres vides ; ailleurs, l'hôtel se remplissait déjà, ou presque, et il vendrait ses chambres moins cher.`
                : `Non : ${revpar}, et ${resultat}.`,
          },
          {
            texte: "S'aligner : l'hôtel serait plus rempli",
            juste: false,
            retour: `Le taux d'occupation monterait bien, de ${pct(t.occupation)} à ${pct(p.occupation)}, mais il ne dit pas à quel prix les chambres partent. Or la directrice juge au RevPAR : ${revpar}.`,
          },
          {
            texte: `S'aligner sur ${eur(a.prixDuConcurrent)} : le RevPAR de l'année monterait`,
            juste: a.verdict === "aligner",
            retour:
              a.verdict === "aligner"
                ? `Oui : ${revpar}, et ${resultat}. Les chambres louées en plus rapportent davantage que la baisse du prix ne coûte sur les autres.`
                : `Non : ${revpar}. Ce qui remplit ${a.rival} ne remplit pas forcément ${a.f.entreprise} : ses clientèles ne sont pas les mêmes.`,
          },
        ];
      },
    },
  ],
};
