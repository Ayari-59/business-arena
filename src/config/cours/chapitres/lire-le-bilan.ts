import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { ENDETTEMENT_MAXIMAL } from "../financement";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, bilanDuLycee, exerciceDe, type BilanDuLycee } from "../monde/comptes-du-lycee";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LE BILAN (Bac STMG, gestion et finance, palier 1).
 *
 * Le compte de résultat raconte une année ; le bilan est une photographie, au 31 décembre : ce
 * que l'entreprise possède (l'actif) et d'où vient l'argent qui l'a payé (le passif). Le chapitre
 * range les postes, vérifie que les deux côtés s'égalent, lit deux équilibres (ce que les associés
 * ont apporté face à ce qui est dû, l'argent disponible face aux dettes de l'année), puis fait
 * bouger le bilan : un curseur sur un emprunt nouveau (jusqu'où rester dans la règle de prudence
 * des banques ?) et un laboratoire de deux décisions du 31 décembre (acheter un équipement, verser
 * un dividende : le bilan reste équilibré, mais l'argent disponible fond).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le bilan du 31 décembre du premier exercice de NOVA,
 * clôturé par le modèle du cours et rangé en postes du lycée (monde/comptes-du-lycee.ts,
 * `bilanDuLycee`), en valeurs nettes. La règle de prudence est celle de financement.ts.
 */

/** Les bornes du curseur de l'emprunt nouveau, en euros. */
export const EMPRUNT_DU_CURSEUR = { min: 0, max: 250_000 } as const;

/** Les leviers du laboratoire : un équipement payé le 31 décembre, un dividende versé le même jour. */
export const LEVIERS_DU_BILAN = {
  equipement: { min: 0, max: 150_000, pas: 10_000 },
  dividende: { min: 0, max: 100_000, pas: 10_000 },
} as const;

/** La solution que montre la correction : un équipement de 100 000 € et un dividende de 30 000 €. */
export const SOLUTION_DU_BILAN = { equipement: 100_000, dividende: 30_000 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number, d = 1) => n.toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−");
const pct = (t: number) => `${qte(t)} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Pourquoi chaque poste est à l'actif ou au passif, dit à l'élève au tri. */
const POURQUOI: Readonly<Record<string, string>> = {
  equipement: "L'entreprise la possède et s'en sert pour produire : c'est un bien.",
  stocks: "Des composants que l'entreprise possède, en attente d'être montés.",
  clients: "De l'argent que les clients doivent : l'entreprise le possède, même s'il n'est pas encore encaissé.",
  autresCreances: "L'État lui doit de la TVA, et l'assurance de l'an prochain est déjà payée : des droits qu'elle possède.",
  placement: "De l'argent placé, à elle, qu'elle retrouvera à l'échéance.",
  banque: "L'argent disponible sur le compte : l'entreprise le possède.",
  capitauxPropres: "L'argent apporté par les associés et le bénéfice laissé dans l'entreprise : une ressource, pas un bien.",
  provision: "Une somme que l'entreprise devra probablement payer pour un litige : une dette probable.",
  emprunt: "L'argent prêté par la banque, qu'il faudra rendre : une dette.",
  fournisseurs: "Des achats pas encore payés : une dette.",
  etat: "La TVA, l'impôt et les cotisations à payer : des dettes.",
  autresDettes: "Des intérêts dus à la banque, des ventes payées d'avance par des clients : des dettes.",
  decouvert: "La banque avance de l'argent au-delà du solde : une dette à court terme.",
};

/** Le bilan du 31 décembre, ses totaux et ses équilibres. */
export function bilanDeFinDAnnee(c: Pick<Cas, "code">) {
  return lectureDuBilan(bilanDuLycee(exerciceDe(c.code)));
}

/** Les équilibres d'un bilan du lycée, au dixième et au centième, comme l'élève les écrit. */
export function lectureDuBilan(b: BilanDuLycee) {
  return { ...b, partDesAssocies: auDixieme(b.autonomie * 100), rapportDEndettement: auCentieme(b.endettement) };
}

export type BilanDeFinDAnnee = ReturnType<typeof bilanDeFinDAnnee>;

/** L'emprunt nouveau le plus haut que la règle de prudence laisse : l'emprunt total au plus égal aux capitaux propres. */
export const empruntPossible = (b: BilanDeFinDAnnee) => Math.floor(ENDETTEMENT_MAXIMAL * b.capitauxPropres - b.poste("emprunt") + 1e-9);

/** Une position du laboratoire : l'équipement et le dividende du 31 décembre. */
export const bilanDuLaboratoire = (b: BilanDeFinDAnnee, p: Readonly<Record<string, number>>) => lectureDuBilan(bilanDuLycee(b.f, { equipement: p.equipement!, dividende: p.dividende! }));

/** Le bilan en deux colonnes : les postes non nuls, à l'actif puis au passif. */
export function tableauDuBilan(b: BilanDuLycee, titre?: string): TableauDeDonnees {
  return {
    titre: titre ?? `Le bilan ${dE(b.entreprise)} au 31 décembre`,
    colonnes: ["Actif", "Passif"],
    lignes: b.postes.filter((x) => x.montant !== 0).map((x) => ({ libelle: x.libelle, valeurs: x.cote === "actif" ? [eur(x.montant), ""] : ["", eur(x.montant)] })),
  };
}

export const LIRE_LE_BILAN: Chapitre = {
  code: "lire-le-bilan",
  parcours: "stmg-gf",
  palier: 1,
  blocs: [
    "STMG Thème 2 · Analyser la situation de l'entreprise",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
    "2de MG · Évaluer et évoluer, du pilotage aux développements numériques",
  ],
  titre: "Le bilan : ce que l'entreprise possède et ce qu'elle doit",
  accroche:
    "Une photographie au 31 décembre : d'un côté ce que l'entreprise possède, de l'autre d'où vient l'argent qui l'a payé. Les deux côtés sont toujours égaux, et c'est ce qui les rend parlants.",
  objectifs: [
    "Distinguer l'actif et le passif",
    "Ranger les postes du bilan",
    "Vérifier l'équilibre du bilan",
    "Mesurer la part des capitaux propres dans le financement",
    "Comparer l'argent disponible et les dettes de l'année",
    "Voir ce qu'un emprunt, un achat ou un dividende change au bilan",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le bilan se lit ici au 31 décembre du premier exercice de NOVA dans la simulation du cours, tenu en comptabilité de la création à la clôture ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une photographie au 31 décembre",
      notions: ["balance_sheet"],
      texte: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Le compte de résultat racontait l'année ${dE(b.entreprise)} ; le bilan la fige au 31 décembre. À gauche, l'actif : ce que l'entreprise possède (sa ligne de montage, son stock de composants, ce que ses clients lui doivent, son argent placé et en banque). À droite, le passif : d'où vient l'argent qui a tout payé (ce que les associés ont apporté et laissé dans l'entreprise, ce qu'elle doit à la banque, à ses fournisseurs, à l'État).`,
          "Chaque euro possédé a été financé par quelqu'un : les deux côtés sont donc toujours égaux.",
        ];
      },
      repere: () => "Actif = ce que l'entreprise possède. Passif = capitaux propres + dettes. Actif = passif.",
    },
    {
      id: "ranger",
      type: "tri",
      titre: "Actif ou passif",
      notions: ["balance_sheet"],
      question: () => "Rangez chaque poste du bilan : ce que l'entreprise possède (actif), ou d'où vient l'argent qui l'a payé (passif).",
      categories: [
        { code: "actif", libelle: "Actif" },
        { code: "passif", libelle: "Passif" },
      ],
      elements: (c) =>
        bilanDeFinDAnnee(c)
          .postes.filter((x) => x.montant > 0)
          .map((x) => ({ libelle: x.libelle, montant: x.montant, categorie: x.cote, pourquoi: POURQUOI[x.code]! })),
      explication: () => [
        "Un piège classique : les capitaux propres ne sont pas de l'argent en caisse. Ils disent d'où vient une partie du financement ; ce que cet argent est devenu (une ligne de montage, des créances, de la trésorerie) se lit à l'actif.",
      ],
    },
    {
      id: "equilibre",
      type: "montants",
      titre: "L'équilibre du bilan",
      notions: ["balance_sheet"],
      tableau: (c) => tableauDuBilan(bilanDeFinDAnnee(c)),
      question: () => "Calculez le total de l'actif, le total des dettes (tout le passif sauf les capitaux propres), puis le total du passif (capitaux propres plus dettes).",
      champs: (c) => {
        const b = bilanDeFinDAnnee(c);
        const actif = b.postes.filter((x) => x.cote === "actif" && x.montant > 0).map((x) => eur(x.montant));
        const dettes = b.postes.filter((x) => x.cote === "passif" && x.code !== "capitauxPropres" && x.montant > 0).map((x) => eur(x.montant));
        return [
          { libelle: "Total de l'actif", attendu: b.actif, calcul: `${actif.join(" + ")} = ${eur(b.actif)}`, tolerance: 1 },
          { libelle: "Total des dettes", attendu: b.dettes, calcul: `${dettes.join(" + ")} = ${eur(b.dettes)}`, tolerance: 1 },
          { libelle: "Total du passif", attendu: b.passif, calcul: `${eur(b.capitauxPropres)} + ${eur(b.dettes)} = ${eur(b.passif)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Actif et passif valent ${eur(b.actif)} : tout ce que possède ${b.entreprise} a été financé, par ses associés ou par ses créanciers. Si les deux totaux ne s'égalent pas, c'est qu'un poste a été oublié ou mal rangé.`,
        ];
      },
    },
    {
      id: "autonomie",
      type: "montants",
      titre: "Qui finance l'entreprise",
      notions: ["balance_sheet"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Les capitaux propres ${dE(b.entreprise)} valent ${eur(b.capitauxPropres)}, son emprunt ${eur(b.poste("emprunt"))}. Calculez la part des capitaux propres dans le total du passif, en pourcentage au dixième, puis le rapport emprunt ÷ capitaux propres, au centième.`;
      },
      champs: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          { libelle: "Part des capitaux propres (%)", attendu: b.partDesAssocies, calcul: `${eur(b.capitauxPropres)} ÷ ${eur(b.passif)} × 100 = ${pct(b.partDesAssocies)}`, tolerance: 0.1 },
          { libelle: "Emprunt ÷ capitaux propres", attendu: b.rapportDEndettement, calcul: `${eur(b.poste("emprunt"))} ÷ ${eur(b.capitauxPropres)} = ${qte(b.rapportDEndettement, 2)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Les associés financent ${pct(b.partDesAssocies)} de ce que possède ${b.entreprise}. Pour un euro apporté par eux, la banque en a prêté ${qte(b.rapportDEndettement, 2)} : ${b.rapportDEndettement <= ENDETTEMENT_MAXIMAL ? "l'entreprise reste maîtresse de son financement, et un nouvel emprunt reste à sa portée." : "l'entreprise dépend de sa banque plus que de ses associés, et un nouvel emprunt sera plus difficile à obtenir."}`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "choix",
      titre: "L'argent disponible",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Au 31 décembre, ${b.entreprise} a ${eur(b.disponible)} en banque et sur son compte à terme, et ${eur(b.decouvert)} de découvert. Que dit son bilan de sa trésorerie ?`;
      },
      options: (c) => {
        const b = bilanDeFinDAnnee(c);
        const tendue = b.decouvert > b.disponible;
        return [
          {
            texte: "Elle a plus d'argent disponible que de découvert : sa trésorerie est positive",
            juste: !tendue,
            retour: !tendue
              ? `Oui : ${eur(b.disponible)} disponibles${b.decouvert > 0 ? ` pour ${eur(b.decouvert)} de découvert` : ", sans découvert"}. ${b.disponible >= b.aCourtTerme ? `Avec cet argent, elle pourrait régler toutes ses dettes de l'année (${eur(b.aCourtTerme)} : fournisseurs, État et personnel, intérêts courus, ventes payées d'avance) sans attendre ses clients.` : `Ses dettes de l'année (${eur(b.aCourtTerme)}) dépassent pourtant cet argent : pour les régler, elle compte sur ce que ses clients lui doivent.`}`
              : `Non : son découvert (${eur(b.decouvert)}) dépasse ce qu'elle a de disponible (${eur(b.disponible)}).`,
          },
          {
            texte: "Son découvert dépasse son argent disponible : sa trésorerie est négative",
            juste: tendue,
            retour: tendue
              ? `Oui : ${eur(b.decouvert)} de découvert pour ${eur(b.disponible)} disponibles. La banque finance son quotidien : c'est cher, et cela ne peut pas durer.`
              : `Non : elle a ${eur(b.disponible)} disponibles, plus que son découvert.`,
          },
          {
            texte: "Ses capitaux propres sont son argent disponible",
            juste: false,
            retour: `Non : les capitaux propres (${eur(b.capitauxPropres)}) disent qui a financé l'entreprise, pas ce qu'il reste en caisse. L'argent disponible se lit à l'actif, à la banque et au compte à terme.`,
          },
        ];
      },
    },
    {
      id: "jusqu-ou-emprunter",
      type: "curseur",
      titre: "Jusqu'où emprunter",
      notions: ["balance_sheet"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Les banques prêtent volontiers tant que les emprunts d'une petite entreprise ne dépassent pas ses capitaux propres. Faites varier un emprunt nouveau, versé en banque : une droite donne les capitaux propres ${dE(b.entreprise)}, l'autre son emprunt total. Placez le curseur sur l'emprunt nouveau le plus haut qui respecte cette règle, puis validez.`;
      },
      grandeur: () => ({ libelle: "Emprunt nouveau", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: empruntPossible(bilanDeFinDAnnee(c)), min: EMPRUNT_DU_CURSEUR.min, max: EMPRUNT_DU_CURSEUR.max }),
      zones: ["Dans la règle des banques", "Au-delà de la règle"],
      rates: () => ({
        dessous: "À cette position, l'emprunt total reste sous les capitaux propres : la règle laisse emprunter davantage.",
        dessus: "À cette position, l'emprunt total dépasse les capitaux propres : cherchez plus bas.",
      }),
      montrer: "Montrer l'emprunt possible",
      lecture: (c, l) => {
        const b = bilanDeFinDAnnee(c);
        const x = lectureDuBilan(bilanDuLycee(b.f, { emprunt: l }));
        return [
          { libelle: "Capitaux propres", montant: x.capitauxPropres },
          { libelle: "Emprunt total", montant: x.poste("emprunt") },
          { libelle: "Total du bilan", montant: x.passif },
          { libelle: "Emprunt ÷ capitaux propres", montant: x.rapportDEndettement, fort: true },
        ];
      },
      droites: (c) => {
        const b = bilanDeFinDAnnee(c);
        return { produit: () => ENDETTEMENT_MAXIMAL * b.capitauxPropres, cout: (l) => b.poste("emprunt") + l, libelles: ["Capitaux propres", "Emprunt total"] };
      },
      explication: (c) => {
        const b = bilanDeFinDAnnee(c);
        const l = empruntPossible(b);
        return [
          `${b.entreprise} pourrait emprunter jusqu'à ${eur(l)} de plus : son emprunt total égalerait alors ses capitaux propres, ${eur(b.capitauxPropres)}.`,
          "Emprunter grossit les deux côtés du bilan, l'argent reçu à l'actif et la dette au passif : le total monte, les capitaux propres ne bougent pas, et leur part dans le financement baisse.",
        ];
      },
    },
    {
      id: "le-laboratoire-du-bilan",
      type: "simulation",
      titre: "Le laboratoire du 31 décembre",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const b = bilanDeFinDAnnee(c);
        return `Le 31 décembre, ${b.entreprise} peut acheter un nouvel équipement, payé comptant, et verser un dividende à ses associés, par la banque. Faites varier les deux : le bilan se refait (le compte à terme reste bloqué jusqu'à son échéance, et une banque qui passe sous zéro devient un découvert). Regardez ce qui bouge, et ce qui ne bouge jamais. Relevez le défi.`;
      },
      leviers: () => [
        { code: "equipement", libelle: "Équipement acheté comptant", unite: "€", ...LEVIERS_DU_BILAN.equipement, depart: 0 },
        { code: "dividende", libelle: "Dividende versé aux associés", unite: "€", ...LEVIERS_DU_BILAN.dividende, depart: 0 },
      ],
      lecture: (c, p) => {
        const b = bilanDeFinDAnnee(c);
        const x = bilanDuLaboratoire(b, p);
        return [
          { libelle: "Total de l'actif", montant: x.actif, reference: b.actif },
          { libelle: "Total du passif", montant: x.passif, reference: b.passif },
          { libelle: "Capitaux propres", montant: x.capitauxPropres, reference: b.capitauxPropres },
          { libelle: "Part des capitaux propres", montant: x.partDesAssocies, unite: "%", reference: b.partDesAssocies },
          { libelle: "Argent disponible (banque et compte à terme)", montant: x.disponible, reference: b.disponible },
          { libelle: "Dettes à payer dans l'année (découvert compris)", montant: x.aCourtTerme, reference: b.aCourtTerme },
          { libelle: "Argent disponible moins dettes de l'année", montant: auCentime(x.disponible - x.aCourtTerme), reference: auCentime(b.disponible - b.aCourtTerme), effet: true, fort: true },
        ];
      },
      graphique: (c) => {
        const b = bilanDeFinDAnnee(c);
        return {
          levier: "equipement",
          courbes: [
            { libelle: "Argent disponible", valeur: (p) => bilanDuLaboratoire(b, p).disponible },
            { libelle: "Dettes à payer dans l'année", valeur: (p) => bilanDuLaboratoire(b, p).aCourtTerme },
          ],
        };
      },
      defi: (c) => {
        const b = bilanDeFinDAnnee(c);
        return {
          consigne: "Faites passer l'argent disponible sous les dettes à payer dans l'année.",
          atteint: (p) => {
            const x = bilanDuLaboratoire(b, p);
            return x.disponible < x.aCourtTerme;
          },
          indice: (p) => {
            const x = bilanDuLaboratoire(b, p);
            return `L'argent disponible (${eur(x.disponible)}) couvre encore les dettes de l'année (${eur(x.aCourtTerme)}). Cherchez ce qui fait sortir de l'argent de la banque.`;
          },
          solution: SOLUTION_DU_BILAN,
        };
      },
      explication: (c, p) => {
        const b = bilanDeFinDAnnee(c);
        const x = bilanDuLaboratoire(b, p);
        return [
          `Défi relevé : ${eur(x.disponible)} disponibles pour ${eur(x.aCourtTerme)} de dettes à payer dans l'année${x.decouvert > 0 ? `, dont ${eur(x.decouvert)} de découvert` : ""}. Et l'actif vaut toujours le passif : ${eur(x.actif)}.`,
          "L'équipement ne change que la forme de l'actif : de l'argent devient une machine, les capitaux propres ne bougent pas. Le dividende, lui, fait sortir de l'argent de l'entreprise : l'actif et les capitaux propres baissent ensemble. Dans les deux cas, le bilan reste équilibré, mais l'entreprise pourrait ne plus payer ses dettes de l'année sans attendre ses clients.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet"],
      texte: (c) => {
        const b = bilanDeFinDAnnee(c);
        return [
          `Au 31 décembre, ${b.entreprise} possède ${eur(b.actif)} de biens, de créances et d'argent, financés à ${pct(b.partDesAssocies)} par ses associés et pour le reste par ses dettes.`,
          "Le bilan ne dit pas si l'année a été bonne : c'est le rôle du compte de résultat. Il dit ce que l'entreprise possède, qui l'a financée, et si elle peut faire face à ses dettes. Le résultat de l'année, lui, vient grossir ou réduire les capitaux propres. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Bilan : actif (ce que l'entreprise possède) = passif (capitaux propres + dettes). Autonomie financière = capitaux propres ÷ total du passif.",
    },
  ],
};
