import { eur, nombreAuCentieme, pct as enPoints } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_INVESTISSEMENT_DURABLE } from "../../chapitres/evaluer-un-investissement-durable";
import { CHAUFFAGE_DE_L_ATELIER, HAUSSE_ATTENDUE_DU_KWH, PRIX_DU_KWH, deuxDevisDeChauffage } from "../../monde/investissement-durable";
import { TAUX_DE_L_IMPOT_DES_PROJETS, TAUX_D_ACTUALISATION_DE_NOVA } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉVALUER UN INVESTISSEMENT DURABLE » : DEUX DEVIS POUR CHAUFFER L'ATELIER
 * (comptabilité générale, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le chauffage de l'atelier de NOVA, à la fin
 * de N + 2, et ses hypothèses (monde/investissement-durable.ts, CHAUFFAGE_DE_L_ATELIER) : des radiateurs
 * neufs ou une pompe à chaleur aidée, le prix de l'électricité et sa hausse attendue du chapitre, le
 * coût du capital de NOVA, 9 %. L'élève refait seul le chemin du chapitre : les flux différentiels, la
 * VAN avec et sans l'aide, puis un choix qui dit ses conditions.
 */

/** Un nombre au centième (deux décimales s'il n'est pas entier), ou à `d` chiffres quand on les demande. */
const qte = (n: number, d = 2) => (d === 2 ? nombreAuCentieme(n) : (n + 0).toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−"));
/** Un taux donné en fraction (0,2), écrit en pourcentage à deux décimales. */
const pct = (t: number) => enPoints(t * 100);
const t = TAUX_DE_L_IMPOT_DES_PROJETS;

/** Les chiffres du cas : la pompe à chaleur face aux radiateurs, avec l'aide, sans l'aide. */
export function deuxDevis(_c?: Pick<Cas, "code">) {
  const avec = deuxDevisDeChauffage();
  const sans = deuxDevisDeChauffage({ tauxDAide: 0 });
  return { avec, sans, k: CHAUFFAGE_DE_L_ATELIER };
}

export const DEUX_DEVIS_POUR_CHAUFFER_L_ATELIER: Situation = {
  code: "deux-devis-pour-chauffer-l-atelier",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [],
  reprend: ["evaluer-un-investissement-durable"],
  commanditaire: "Le dirigeant",
  titre: "Deux devis pour chauffer l'atelier",
  accroche: "Les radiateurs de l'atelier ont lâché. Des radiateurs neufs, ou une pompe à chaleur bien plus chère, mais aidée ? Chiffrez, puis tranchez.",
  objectifs: [
    "Établir les flux différentiels d'un investissement durable, aide et impôt compris",
    "Calculer sa VAN avec et sans l'aide",
    "Rendre un choix qui dit ses conditions",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_INVESTISSEMENT_DURABLE,
    pourquoi: "ce cas reprend le chapitre « Évaluer un investissement durable », qui se joue sur les investissements de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: () => {
        const n = deuxDevis();
        return [
          `« Les radiateurs de l'atelier ont lâché. J'ai deux devis : des radiateurs neufs à ${eur(n.k.radiateurs)}, ou une pompe à chaleur à ${eur(n.k.pompeAChaleur)}, aidée à ${pct(n.k.tauxDAide)}. Elle consommerait le tiers de l'électricité des radiateurs. Laquelle prendre ? »`,
          "Pas de cours cette fois : vous avez les deux devis, et la méthode du chapitre. Comparez la pompe aux radiateurs, en flux différentiels.",
        ];
      },
      tableau: () => {
        const n = deuxDevis();
        return {
          titre: "Les deux devis, pour dix ans d'usage",
          colonnes: ["Donnée"],
          lignes: [
            { libelle: "Radiateurs neufs", valeurs: [`${eur(n.k.radiateurs)} HT, ${qte(n.k.kwhDesRadiateurs)} kWh par an`] },
            { libelle: "Pompe à chaleur", valeurs: [`${eur(n.k.pompeAChaleur)} HT, ${qte(n.k.coefficientDePerformance)} kWh de chaleur pour 1 kWh d'électricité`] },
            { libelle: "Aide à la rénovation énergétique", valeurs: [`${pct(n.k.tauxDAide)} de la pompe, versée à l'achat, virée au résultat sur ${qte(n.k.dureeAns)} ans`] },
            { libelle: "Amortissement", valeurs: [`linéaire sur ${qte(n.k.dureeAns)} ans, sans valeur de revente`] },
            { libelle: "Électricité", valeurs: [`${qte(PRIX_DU_KWH)} € le kWh, ${qte(HAUSSE_ATTENDUE_DU_KWH)} € de hausse attendue`] },
            { libelle: "Impôt, coût du capital", valeurs: [`${pct(t)}, ${pct(TAUX_D_ACTUALISATION_DE_NOVA)}`] },
          ],
        };
      },
      repere: () => "À rendre : les flux de la pompe face aux radiateurs, sa VAN avec et sans l'aide, et votre choix.",
    },
    {
      id: "les-flux",
      type: "montants",
      titre: "Les flux différentiels",
      notions: ["discounting", "depreciation"],
      question: () =>
        "Calculez les kWh que la pompe économise chaque année et le flux de la date 0 (le surcoût moins l'aide). Puis le flux annuel : l'électricité économisée au prix attendu après impôt, plus l'impôt économisé sur le supplément de dotation, moins l'impôt sur la quote-part d'aide.",
      champs: () => {
        const n = deuxDevis().avec;
        const k = CHAUFFAGE_DE_L_ATELIER;
        return [
          { libelle: "kWh économisés par an", nature: "grandeur", attendu: n.kwhEconomises, calcul: `${qte(k.kwhDesRadiateurs)} × (1 − 1 ÷ ${qte(k.coefficientDePerformance)}) = ${qte(n.kwhEconomises)} kWh` },
          { libelle: "Flux de la date 0", attendu: n.flux[0]!, calcul: `− (${eur(k.pompeAChaleur)} − ${eur(k.radiateurs)}) + ${eur(n.aide)} = ${eur(n.flux[0]!)}` },
          {
            libelle: "Flux annuel",
            attendu: n.annuel,
            calcul: `${qte(n.kwhEconomises)} × (${qte(PRIX_DU_KWH)} + ${qte(HAUSSE_ATTENDUE_DU_KWH)}) × ${qte(1 - t)} + ${eur(n.dotationEnPlus)} × ${qte(t)} − ${eur(n.quotePart)} × ${qte(t)} = ${eur(n.annuel)}`,
          },
        ];
      },
      explication: () => {
        const n = deuxDevis().avec;
        return [`Le supplément de dotation, ${eur(n.dotationEnPlus)} par an, fait économiser de l'impôt ; l'aide virée au résultat, ${eur(n.quotePart)} par an, en fait payer. Les deux jouent sur dix ans.`];
      },
    },
    {
      id: "la-van",
      type: "montants",
      titre: "La VAN, avec et sans l'aide",
      notions: ["discounting"],
      question: () => `Calculez la VAN de la pompe face aux radiateurs à ${pct(TAUX_D_ACTUALISATION_DE_NOVA)} sur dix ans, puis la même VAN sans l'aide (la date 0 est alors tout le surcoût, et il n'y a plus de quote-part à imposer).`,
      champs: () => {
        const n = deuxDevis();
        // Le facteur d'actualisation des flux annuels, écrit en formule : la VAN se calcule d'une seule ligne, sans coefficient arrondi.
        const facteur = `(1 − ${(1 + TAUX_D_ACTUALISATION_DE_NOVA).toLocaleString("fr-FR")}^−${CHAUFFAGE_DE_L_ATELIER.dureeAns}) ÷ ${TAUX_D_ACTUALISATION_DE_NOVA.toLocaleString("fr-FR")}`;
        return [
          { libelle: "VAN avec l'aide", attendu: n.avec.van, calcul: `${eur(n.avec.flux[0]!)} + ${eur(n.avec.annuel)} × ${facteur} = ${eur(n.avec.van)}` },
          { libelle: "VAN sans l'aide", attendu: n.sans.van, calcul: `${eur(n.sans.flux[0]!)} + ${eur(n.sans.annuel)} × ${facteur} = ${eur(n.sans.van)}` },
        ];
      },
      explication: () => {
        const n = deuxDevis();
        return [`Avec l'aide, la pompe rapporte ${eur(n.avec.van)} de plus que les radiateurs ; sans elle, elle coûte ${eur(-n.sans.van)} de plus. L'aide fait la décision, comme la subvention des équipements d'efficacité au chapitre.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["discounting", "csr_index"],
      question: () => "Quelle réponse rendez-vous au dirigeant ?",
      options: () => {
        const n = deuxDevis();
        return [
          {
            texte: `La pompe, si l'aide est acquise : ${eur(n.avec.van)} de VAN, et moins de risque`,
            juste: n.avec.van > 0 && n.sans.van < 0,
            retour: `Oui. Avec l'aide, la pompe crée ${eur(n.avec.van)} de valeur face aux radiateurs, économise ${qte(n.avec.kwhEconomises)} kWh par an et ${qte(n.avec.tonnesEvitees)} tonnes de CO2 en dix ans, et protège NOVA d'une électricité plus chère. Sans l'aide, elle ne se justifie plus financièrement : il faut s'assurer de l'aide avant de signer.`,
          },
          {
            texte: `Les radiateurs : ils coûtent ${qte(n.k.pompeAChaleur / n.k.radiateurs)} fois moins cher à l'achat, et c'est le prix d'achat qui compte`,
            juste: false,
            retour: "Le prix d'achat n'est qu'un flux : l'électricité payée pendant dix ans en est d'autres, plus lourds. La VAN les compare tous.",
          },
          {
            texte: "La pompe dans tous les cas : un équipement plus sobre est toujours le bon choix",
            juste: false,
            retour: `Sans l'aide, la pompe coûte ${eur(-n.sans.van)} de plus que les radiateurs, en valeur actuelle : le choix durable doit aussi tenir financièrement, ou dire ce qu'il coûte.`,
          },
        ];
      },
    },
  ],
};
