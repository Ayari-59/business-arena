import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import { soldUnits } from "../../../../engine/simulation/runGame";
import type { CompanyRoundResult } from "../../../../engine/types";
import { scenarioByCode } from "../../../scenarios/registry";
import { anneeJouee, type Cas } from "../../cas";
import { HOTELS, duNom, indicateursDuTrimestre, occupation, trimestre } from "../../chapitres/occupation-et-revenu-par-chambre";
import { rejouerAvec } from "../../gestion-de-la-pme";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX D'OCCUPATION, LE PRIX MOYEN ET LE REVENU PAR CHAMBRE » :
 * S'ALIGNER SUR LE PRIX DU CONCURRENT ? (BTS MHR, palier 2).
 *
 * Au trimestre le plus faible de l'hôtel (celui où le chapitre compte les nuitées demandées et non
 * servies), un concurrent a rempli mieux que lui à un prix plus bas, et la directrice veut mettre en
 * vente toutes les chambres. Reste le prix : son tarif, ou celui du concurrent. L'arène rejoue le
 * trimestre des deux façons (gestion-de-la-pme.ts : `rejouerAvec`, sous des clés préfixées du code
 * du chapitre) ; l'élève calcule l'occupation et le RevPAR de chacune, l'écart de chiffre
 * d'affaires, et rend sa réponse. Le meilleur prix est celui du RevPAR le plus haut, tel que le
 * moteur le rejoue : le cas ne le décide pas d'avance.
 *
 * Le cas est neuf par sa question : le chapitre juge deux hôtels déjà joués, face à un concurrent
 * plus cher ; le cas demande à l'hôtel de choisir son prix face au concurrent moins cher, et le
 * moteur dit ce que chaque prix aurait rempli. Aucune hypothèse : toutes les chambres disponibles
 * mises en vente, au prix que l'hôtel a joué (sa décision du trimestre, inchangée), ou au prix moyen
 * que le concurrent a fait ce trimestre-là.
 */

/** Un montant à la française, avec le signe moins typographique. */
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ecart = (x: number) => (x > 0 ? `+${eur(x)}` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;

export type Prix = "joue" | "tarif" | "concurrent";

/** Le trimestre le plus faible de l'hôtel, rejoué toutes chambres en vente, au tarif puis au prix du concurrent. */
export function alignement(c: Cas) {
  const o = occupation(c);
  const k = o.plusFaible;
  // Mettre toutes les chambres en vente ne change rien si l'hôtel a servi toute sa demande.
  if (o.perdues <= 0) throw new Error(`${c.entreprise} a servi toutes ses nuitées demandées au ${trimestre(k)}`);
  const tour = k + 1;
  const { partie } = anneeJouee(c.code);
  const hotel = o.trimestres[k]!;
  // Le concurrent qui, ce trimestre-là, a rempli mieux que l'hôtel à un prix moyen plus bas.
  const rivalBot = scenarioByCode(c.code)
    .bots.slice(0, 2)
    .find((b) => {
      const x = indicateursDuTrimestre(partie.rounds[k]!.results[b.id]!);
      return x.occupation > hotel.occupation && x.prixMoyen < hotel.prixMoyen;
    });
  if (!rivalBot) throw new Error(`Aucun concurrent ${duNom(c.entreprise)} ne remplit mieux à un prix plus bas au ${trimestre(k)}`);
  const rivalR = partie.rounds[k]!.results[rivalBot.id]!;
  // Le prix moyen exact du concurrent ce trimestre, sur ses nuitées et son chiffre d'affaires.
  const prixDuConcurrent = auCentime(rivalR.incomeStatement.revenue / soldUnits(rivalR));
  const joueR = partie.rounds[k]!.results["joueur"]!;
  const disponibles = Math.round(joueR.production.machineCapacity);
  const tarifR = rejouerAvec(c.code, `occupation-et-revenu-par-chambre:toutes-${disponibles}`, (t, d) =>
    t === tour ? { ...d, productionPlan: disponibles } : undefined,
  )[k]!;
  const concurrentR = rejouerAvec(c.code, `occupation-et-revenu-par-chambre:toutes-${disponibles}-a-${prixDuConcurrent}`, (t, d) =>
    t === tour ? { ...d, productionPlan: disponibles, price: prixDuConcurrent } : undefined,
  )[k]!;
  const facon = (r: CompanyRoundResult) => ({ ...indicateursDuTrimestre(r), resultat: Math.round(r.incomeStatement.operatingIncome) });
  const f = { joue: facon(joueR), tarif: facon(tarifR), concurrent: facon(concurrentR) };
  const ordre: Prix[] = ["joue", "tarif", "concurrent"];
  const meilleur = ordre.reduce((a, b) => (f[b].revpar > f[a].revpar ? b : a));
  return {
    o,
    trimestre: k,
    rival: rivalBot.name,
    /** Les trois indicateurs du concurrent, ce trimestre-là. */
    leRival: indicateursDuTrimestre(rivalR),
    prixDuConcurrent,
    prixAuTarif: auCentime(joueR.incomeStatement.revenue / soldUnits(joueR)),
    misesEnVente: Math.round(joueR.production.produced),
    ...f,
    vendueEnPlus: f.concurrent.vendues - f.tarif.vendues,
    ecartDeChiffre: f.tarif.chiffreDAffaires - f.concurrent.chiffreDAffaires,
    ecartDeResultat: f.tarif.resultat - f.concurrent.resultat,
    meilleur,
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
    "Un concurrent a rempli mieux que l'hôtel, à un prix plus bas. La directrice veut mettre en vente toutes les chambres : à son tarif, ou au prix du concurrent ? L'arène rejoue le trimestre des deux façons.",
  objectifs: [
    "Calculer le taux d'occupation et le RevPAR d'un trimestre rejoué",
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
          `« Au ${trimestre(a.trimestre)}, nous n'avons occupé que ${pct(a.joue.occupation)} de nos chambres, quand ${a.rival} en occupait ${pct(a.leRival.occupation)} à ${eur(a.prixDuConcurrent)} la nuit. Nous n'en avions mis en vente que ${qte(a.misesEnVente)} sur ${qte(a.joue.disponibles)}. Cette fois, je veux toutes les mettre en vente. Mais à quel prix : notre tarif de ${eur(a.prixAuTarif)}, ou celui ${duNom(a.rival)} ? »`,
          "L'arène a rejoué le trimestre des deux façons, toutes les chambres en vente, les mêmes clientèles en face.",
        ];
      },
      tableau: (c) => {
        const a = alignement(c);
        const ligne = (libelle: string, f: (x: typeof a.joue) => string) => ({ libelle, valeurs: [a.joue, a.tarif, a.concurrent].map(f) });
        return {
          titre: `Le ${trimestre(a.trimestre)} ${duNom(c.entreprise)}, rejoué`,
          colonnes: ["Trimestre joué", "Toutes au tarif", `Toutes au prix ${duNom(a.rival)}`],
          lignes: [
            ligne("Chambres disponibles", (x) => qte(x.disponibles)),
            ligne("Chambres vendues", (x) => qte(x.vendues)),
            ligne("Chiffre d'affaires hébergement HT", (x) => eur(x.chiffreDAffaires)),
            ligne("Résultat de l'activité", (x) => eur(x.resultat)),
          ],
        };
      },
      repere: () => "À rendre : le taux d'occupation et le RevPAR de chaque prix, l'écart de chiffre d'affaires, et votre réponse à la directrice.",
    },
    {
      id: "les-deux-prix",
      type: "montants",
      titre: "Occupation et RevPAR de chaque prix",
      notions: ["occupancy_revpar"],
      question: () =>
        "Calculez, pour chaque prix rejoué, le taux d'occupation (au dixième) et le RevPAR (au centime) : chambres vendues, puis chiffre d'affaires, divisés par les chambres disponibles.",
      champs: (c) => {
        const a = alignement(c);
        const auPrix = `au prix ${duNom(a.rival)}`;
        return [
          { libelle: "Taux d'occupation, au tarif (%)", attendu: a.tarif.occupation, calcul: `${qte(a.tarif.vendues)} ÷ ${qte(a.tarif.disponibles)} × 100 = ${pct(a.tarif.occupation)}`, tolerance: 0.1 },
          { libelle: "RevPAR, au tarif", attendu: a.tarif.revpar, calcul: `${eur(a.tarif.chiffreDAffaires)} ÷ ${qte(a.tarif.disponibles)} = ${eur(a.tarif.revpar)}` },
          {
            libelle: `Taux d'occupation, ${auPrix} (%)`,
            attendu: a.concurrent.occupation,
            calcul: `${qte(a.concurrent.vendues)} ÷ ${qte(a.concurrent.disponibles)} × 100 = ${pct(a.concurrent.occupation)}`,
            tolerance: 0.1,
          },
          { libelle: `RevPAR, ${auPrix}`, attendu: a.concurrent.revpar, calcul: `${eur(a.concurrent.chiffreDAffaires)} ÷ ${qte(a.concurrent.disponibles)} = ${eur(a.concurrent.revpar)}` },
        ];
      },
      explication: (c) => {
        const a = alignement(c);
        return [
          `Au prix ${duNom(a.rival)}, l'hôtel occupe ${pct(a.concurrent.occupation)} de ses chambres, contre ${pct(a.tarif.occupation)} à son tarif. Le RevPAR, lui, fait ${eur(a.concurrent.revpar)} contre ${eur(a.tarif.revpar)}.`,
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
        return `Calculez les chambres vendues en plus au prix ${duNom(a.rival)}, puis l'écart de chiffre d'affaires hébergement entre le tarif et le prix ${duNom(a.rival)} (positif si le tarif rapporte plus).`;
      },
      champs: (c) => {
        const a = alignement(c);
        return [
          { libelle: "Chambres vendues en plus", attendu: a.vendueEnPlus, calcul: `${qte(a.concurrent.vendues)} − ${qte(a.tarif.vendues)} = ${qte(a.vendueEnPlus)}` },
          {
            libelle: "Écart de chiffre d'affaires",
            attendu: a.ecartDeChiffre,
            calcul: `${eur(a.tarif.chiffreDAffaires)} − ${eur(a.concurrent.chiffreDAffaires)} = ${ecart(a.ecartDeChiffre)}`,
          },
        ];
      },
      explication: (c) => {
        const a = alignement(c);
        const baisse = auCentime(a.prixAuTarif - a.prixDuConcurrent);
        return [
          `${qte(a.vendueEnPlus)} chambres de plus, mais ${eur(baisse)} de moins sur chacune des ${qte(a.concurrent.vendues)} chambres vendues. L'écart de résultat de l'activité est de ${ecart(a.ecartDeResultat)} : les chambres mises en vente sont les mêmes, leurs charges aussi.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice",
      notions: ["occupancy_revpar"],
      question: () => "Quelle réponse rendez-vous à la directrice ?",
      options: (c) => {
        const a = alignement(c);
        const dit = (x: Prix) =>
          x === a.meilleur
            ? `Oui : c'est le RevPAR le plus haut, ${eur(a[x].revpar)} par chambre disponible.`
            : `Non : ${eur(a[x].revpar)} par chambre disponible, contre ${eur(a[a.meilleur].revpar)} pour le meilleur choix.`;
        return [
          {
            texte: `Tout mettre en vente, au tarif de ${eur(a.prixAuTarif)}`,
            juste: a.meilleur === "tarif",
            retour:
              a.meilleur === "tarif"
                ? `${dit("tarif")} L'hôtel est moins plein qu'au prix ${duNom(a.rival)}, mais chaque chambre louée paie davantage.`
                : `${dit("tarif")} Chaque chambre louée paie davantage, mais il en reste ${qte(a.tarif.disponibles - a.tarif.vendues)} vides.`,
          },
          {
            texte: `Tout mettre en vente, au prix ${duNom(a.rival)}`,
            juste: a.meilleur === "concurrent",
            retour:
              a.meilleur === "concurrent"
                ? `${dit("concurrent")} Les ${qte(a.vendueEnPlus)} chambres louées en plus rapportent davantage que la baisse du prix ne coûte sur les autres.`
                : `${dit("concurrent")} L'hôtel est le plus plein à ce prix (${pct(a.concurrent.occupation)}), mais le taux d'occupation ne dit pas à quel prix les chambres sont parties.`,
          },
          {
            texte: "Ne rien changer, et garder le trimestre tel qu'il a été joué",
            juste: a.meilleur === "joue",
            retour: `${dit("joue")} Le trimestre joué a laissé ${qte(a.joue.disponibles - a.joue.vendues)} chambres vides.`,
          },
        ];
      },
    },
  ],
};
