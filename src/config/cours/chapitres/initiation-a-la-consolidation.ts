import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { AUDIO_COMPTOIR, NOVA_DIFFUSION, PARTS_DU_LABORATOIRE, PART_DE_NOVA, PRET_A_LA_FILIALE, SEUIL_DE_L_INFLUENCE_NOTABLE, VENTES_A_LA_FILIALE, groupeNova, pourcentages } from "../monde/groupe-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : INITIATION À LA CONSOLIDATION (comptabilité générale, palier 4 ; BTS CG P2 2.7.1 et 2.7.2).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/groupe-nova.ts) : NOVA crée le 2 janvier N + 1 une
 * filiale de distribution, NOVA DIFFUSION, dont elle détient 80 % ; la filiale achète des One à NOVA,
 * lui emprunte 12 000 €, et envisage de prendre 60 % d'une boutique en N + 2. L'élève dit ce qu'est un
 * groupe, classe des liens par type de contrôle, calcule les pourcentages de contrôle et d'intérêts en
 * direct puis en indirect, puis fait l'intégration globale du groupe de deux sociétés : les opérations
 * réciproques éliminées, le chiffre d'affaires du groupe, les capitaux propres de la filiale partagés
 * entre le groupe et les minoritaires, les titres éliminés.
 *
 * LES LIMITES DU BTS (P2 2.7.1 et 2.7.2) : un groupe de deux sociétés, la société consolidante
 * indiquée ; l'intégration globale seule, avec des retraitements basiques (achats et ventes, dettes et
 * créances, emprunts et prêts, intérêts) ; le lien entre type de contrôle et méthode. Les comptes
 * consolidés eux-mêmes, et la marge interne sur les stocks, vont au-delà.
 *
 * LES TEMPS DU CHAPITRE (l'esprit du cours : le cas simulé pas à pas, l'expérience avant la formule) :
 *   · guidé : intro, pourquoi-consolider, les-types-de-controle, la-methode ;
 *   · l'expérience avant la formule : predire-les-interets puis le-laboratoire-des-pourcentages (les
 *     deux parts, et le contrôle qui ne suit pas les intérêts) avant les-pourcentages ;
 *   · autonome : les-operations-reciproques, le-chiffre-d-affaires-du-groupe, le-resultat-du-groupe ;
 *   · expert : le-partage-des-capitaux-propres (un tableau à compléter), l-elimination-des-titres,
 *     ce-qui-change ; puis la synthèse.
 */

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const F = NOVA_DIFFUSION.nom;
const A = AUDIO_COMPTOIR.nom;

/** Les positions du laboratoire, en pour cent. */
const positions = () => {
  const crans: number[] = [];
  for (let x = PARTS_DU_LABORATOIRE.min; x <= PARTS_DU_LABORATOIRE.max; x += PARTS_DU_LABORATOIRE.pas) crans.push(x);
  return crans;
};

/** Le plus petit pourcentage d'intérêts avec lequel NOVA contrôle AUDIO COMPTOIR, sur les crans du laboratoire. */
export function plusPetitInteretControlant() {
  let meilleur = { nova: 0, filiale: 0, interets: Infinity };
  for (const n of positions())
    for (const f of positions()) {
      const p = pourcentages(n / 100, f / 100);
      if (p.controleExclusif && p.interetsIndirects < meilleur.interets) meilleur = { nova: n, filiale: f, interets: p.interetsIndirects };
    }
  return meilleur;
}

export const INITIATION_A_LA_CONSOLIDATION: Chapitre = {
  code: "initiation-a-la-consolidation",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: ["BTS CG P2 · Contrôle et production de l'information financière"],
  titre: "Initiation à la consolidation",
  accroche:
    "NOVA crée une filiale pour vendre ses enceintes : ce qu'est un groupe, qui contrôle qui, et ce que deviennent, une fois réunis, les comptes de la mère et de sa filiale.",
  objectifs: [
    "Dire ce qu'est un groupe, et pourquoi il publie des comptes consolidés",
    "Reconnaître le type de contrôle et la méthode de consolidation qui va avec",
    "Calculer les pourcentages de contrôle et d'intérêts, en direct et en indirect",
    "Éliminer les opérations réciproques d'un groupe de deux sociétés",
    "Partager les capitaux propres de la filiale entre le groupe et les minoritaires",
  ],
  libre: false,
  prerequis: ["la-cloture"],
  ensuite: ["le-diagnostic-financier-et-extra-financier"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre suit NOVA et la filiale de distribution qu'elle crée en N + 1.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "NOVA crée une filiale",
      notions: ["consolidation"],
      tableau: () => {
        const g = groupeNova();
        return {
          titre: "Le groupe NOVA au 31 décembre N + 1",
          colonnes: ["Lien", "Part"],
          lignes: [
            { libelle: `NOVA, dans ${F}`, valeurs: [`${qte(NOVA_DIFFUSION.actions * PART_DE_NOVA)} actions sur ${qte(NOVA_DIFFUSION.actions)}`, pct(PART_DE_NOVA)] },
            { libelle: `Le directeur de ${F}`, valeurs: ["les autres actions", pct(1 - PART_DE_NOVA)] },
            { libelle: `${F}, dans ${A}`, valeurs: ["projet pour N + 2", pct(AUDIO_COMPTOIR.partDeLaFiliale)] },
            { libelle: `Titres de ${F}, à l'actif de NOVA`, valeurs: ["à leur coût", eur(g.titres)] },
          ],
        };
      },
      texte: () => {
        const g = groupeNova();
        return [
          `Le ${NOVA_DIFFUSION.creation}, NOVA crée ${F}, une SAS au capital de ${eur(g.capital)}, pour vendre ses enceintes aux magasins de hi-fi. Elle souscrit ${pct(PART_DE_NOVA)} des actions ; le directeur de la filiale, qui y apporte son réseau de revendeurs, détient le reste.`,
          `En N + 1, ${F} achète ${qte(VENTES_A_LA_FILIALE.enceintes)} One à NOVA et les revend ; NOVA lui prête ${eur(PRET_A_LA_FILIALE.montant)}. Chacune des deux sociétés tient sa comptabilité et publie ses comptes annuels. Mais ensemble, elles forment un groupe : une société mère et la société qu'elle contrôle.`,
        ];
      },
      repere: () =>
        "Un groupe : une société mère, et les sociétés qu'elle contrôle ou sur lesquelles elle a une influence. Les comptes consolidés présentent le groupe comme une seule entreprise : ce qu'il possède, ce qu'il doit, ce qu'il gagne avec les autres, sans ce que ses sociétés se vendent entre elles.",
    },
    {
      id: "pourquoi-consolider",
      objectifs: [0],
      type: "choix",
      titre: "Ce que les comptes de NOVA ne disent pas",
      notions: ["consolidation"],
      question: () => `Dans les comptes annuels de NOVA, comment ${F} paraît-elle ?`,
      options: () => {
        const g = groupeNova();
        return [
          {
            texte: `Par ses titres, à leur coût : ${eur(g.titres)}`,
            juste: true,
            retour: `Oui : à l'actif de NOVA, des titres de participation de ${eur(g.titres)}, et rien de ce que la filiale vend, possède ou doit. Les comptes consolidés réunissent les deux sociétés pour montrer le groupe tel qu'il est.`,
          },
          {
            texte: `Par son chiffre d'affaires et son résultat, ajoutés à ceux de NOVA à hauteur de ${pct(PART_DE_NOVA)}`,
            juste: false,
            retour: "Non : les comptes annuels de NOVA ne connaissent de sa filiale que les titres qu'elle détient, et les opérations faites avec elle. C'est la consolidation qui réunit les comptes.",
          },
          {
            texte: "Elle n'y paraît pas du tout, ses comptes à elle étant tenus et publiés à part",
            juste: false,
            retour: `Non : NOVA a payé ses actions ; elles sont à son actif, en titres de participation, pour ${eur(g.titres)}.`,
          },
        ];
      },
    },
    {
      id: "les-types-de-controle",
      objectifs: [1],
      type: "tri",
      titre: "Qui contrôle quoi ?",
      notions: ["consolidation"],
      question: () => "Rangez chaque lien selon le pouvoir que NOVA, directement ou par sa filiale, exerce sur la société.",
      categories: [
        { code: "exclusif", libelle: "Contrôle exclusif" },
        { code: "conjoint", libelle: "Contrôle conjoint" },
        { code: "notable", libelle: "Influence notable" },
        { code: "hors", libelle: "Hors du périmètre" },
      ],
      elements: () => [
        { libelle: `${F}, ${pct(PART_DE_NOVA)} des droits de vote`, montant: 0, categorie: "exclusif", pourquoi: "Plus de la moitié des droits de vote : NOVA décide seule de sa politique." },
        { libelle: `${A}, ${pct(AUDIO_COMPTOIR.partDeLaFiliale)} par ${F}`, montant: 0, categorie: "exclusif", pourquoi: "NOVA contrôle sa filiale, qui contrôle la boutique : le contrôle passe par la chaîne." },
        { libelle: "Une coentreprise à 50 %, dirigée avec un fabricant de casques", montant: 0, categorie: "conjoint", pourquoi: "Aucune décision ne se prend sans l'accord des deux associés : le contrôle est partagé." },
        { libelle: "Un bureau d'études acoustiques, 30 % des droits de vote", montant: 0, categorie: "notable", pourquoi: `Au moins ${pct(SEUIL_DE_L_INFLUENCE_NOTABLE)} des droits de vote : NOVA pèse sur les décisions, sans les prendre seule.` },
        { libelle: "Une coopérative d'achat de composants, 5 % des droits de vote", montant: 0, categorie: "hors", pourquoi: `Moins de ${pct(SEUIL_DE_L_INFLUENCE_NOTABLE)}, sans autre pouvoir : un simple placement, hors du périmètre.` },
      ],
      explication: () => [
        `Le périmètre de consolidation réunit la mère et les sociétés qu'elle contrôle ou sur lesquelles elle a une influence notable. Le seuil de ${pct(SEUIL_DE_L_INFLUENCE_NOTABLE)} est une présomption : c'est le pouvoir réel qui compte, des droits de vote, d'un pacte ou d'une présence au conseil.`,
      ],
      relance: "Regardez qui prend les décisions : NOVA seule, NOVA avec un autre, ou NOVA qui pèse sans décider ?",
    },
    {
      id: "la-methode",
      objectifs: [1],
      type: "choix",
      titre: "Une méthode par type de contrôle",
      notions: ["consolidation"],
      question: () => `NOVA a le contrôle exclusif de ${F}. Par quelle méthode la consolide-t-elle ?`,
      options: () => [
        {
          texte: "L'intégration globale de ses comptes",
          juste: true,
          retour: "Oui : le contrôle exclusif appelle l'intégration globale, tous les postes de la filiale repris à 100 %, puis la part des minoritaires isolée. Au contrôle conjoint, l'intégration proportionnelle (règlement CRC 99-02), devenue mise en équivalence au règlement ANC 2020-01 ; à l'influence notable, la mise en équivalence.",
        },
        {
          texte: "La mise en équivalence, qui remplace les titres par la part de NOVA dans ses capitaux propres",
          juste: false,
          retour: "Non : la mise en équivalence est la méthode de l'influence notable. NOVA ne fait pas que peser sur sa filiale : elle la dirige.",
        },
        {
          texte: `L'intégration proportionnelle, qui ne reprend que ${pct(PART_DE_NOVA)} de chaque poste de la filiale`,
          juste: false,
          retour: "Non : l'intégration proportionnelle était la méthode du contrôle conjoint. Au contrôle exclusif, le groupe reprend tout, puis isole ce qui revient aux minoritaires.",
        },
      ],
    },
    {
      id: "predire-les-interets",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur la boutique",
      notions: ["consolidation", "minority_translation"],
      question: () => `Avant de calculer, pariez. Si ${F} prend ${pct(AUDIO_COMPTOIR.partDeLaFiliale)} d'${A} en N + 2, la part des bénéfices de la boutique qui reviendrait à NOVA serait…`,
      options: () => {
        const voir = "Le calcul suit, puis le laboratoire fait varier les deux parts.";
        return [
          { texte: `Moins de ${pct(AUDIO_COMPTOIR.partDeLaFiliale)}`, juste: true, retour: `Bon pari. ${voir}` },
          { texte: `${pct(AUDIO_COMPTOIR.partDeLaFiliale)}, comme les droits de vote`, juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: `${pct(PART_DE_NOVA)}, la part de NOVA dans sa filiale`, juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "les-pourcentages",
      objectifs: [2],
      type: "montants",
      titre: "Le contrôle et les intérêts",
      notions: ["consolidation", "minority_translation"],
      question: () =>
        `Calculez, en pour cent, le pourcentage de contrôle et le pourcentage d'intérêts de NOVA dans ${F}, puis dans ${A} si le projet se fait. Le contrôle passe par les sociétés que l'on contrôle ; les intérêts se multiplient le long de la chaîne.`,
      champs: () => {
        const p = pourcentages();
        return [
          { libelle: `Contrôle de NOVA dans ${F}`, attendu: p.controleDeLaFiliale * 100, calcul: `${pct(PART_DE_NOVA)} des droits de vote, détenus directement : ${pct(p.controleDeLaFiliale)}` },
          { libelle: `Intérêts de NOVA dans ${F}`, attendu: PART_DE_NOVA * 100, calcul: `${pct(PART_DE_NOVA)} du capital : ${pct(PART_DE_NOVA)}` },
          { libelle: `Contrôle de NOVA dans ${A}`, attendu: p.controleIndirect * 100, calcul: `NOVA contrôle ${F} : elle dispose de tous ses droits de vote, ${pct(p.controleIndirect)}` },
          { libelle: `Intérêts de NOVA dans ${A}`, attendu: p.interetsIndirects * 100, calcul: `${pct(PART_DE_NOVA)} × ${pct(AUDIO_COMPTOIR.partDeLaFiliale)} = ${pct(p.interetsIndirects)}` },
        ];
      },
      explication: () => {
        const p = pourcentages();
        return [
          `Le pourcentage de contrôle dit qui décide, et donc la méthode : ${pct(p.controleIndirect)}, un contrôle exclusif, une intégration globale. Le pourcentage d'intérêts dit qui reçoit : sur 100 € de bénéfice de la boutique, ${pct(p.interetsIndirects)} reviendraient au groupe ; le reste, aux minoritaires.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-pourcentages",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire des pourcentages",
      notions: ["consolidation", "minority_translation"],
      question: () =>
        `Faites varier la part de NOVA dans ${F}, et celle de ${F} dans ${A} : le tableau suit le contrôle et les intérêts de NOVA dans la boutique ; le graphique les trace selon la part de la filiale.`,
      leviers: () => [
        { code: "nova", libelle: `Part de NOVA dans ${F}`, unite: "%", ...PARTS_DU_LABORATOIRE, depart: PART_DE_NOVA * 100 },
        { code: "filiale", libelle: `Part de ${F} dans ${A}`, unite: "%", ...PARTS_DU_LABORATOIRE, depart: AUDIO_COMPTOIR.partDeLaFiliale * 100 },
      ],
      lecture: (_c, p) => {
        const x = pourcentages(p.nova! / 100, p.filiale! / 100);
        const ref = pourcentages();
        return [
          { libelle: `Contrôle de NOVA dans ${A}`, montant: x.controleIndirect * 100, unite: "%", reference: ref.controleIndirect * 100 },
          { libelle: `Intérêts de NOVA dans ${A}`, montant: x.interetsIndirects * 100, unite: "%", reference: ref.interetsIndirects * 100, fort: true },
          { libelle: "Contrôle exclusif, intégration globale (1 oui, 0 non)", montant: x.controleExclusif ? 1 : 0, unite: "" },
        ];
      },
      graphique: () => ({
        levier: "filiale",
        unite: "%",
        courbes: [
          { libelle: "Contrôle", valeur: (p) => pourcentages(p.nova! / 100, p.filiale! / 100).controleIndirect * 100 },
          { libelle: "Intérêts", valeur: (p) => pourcentages(p.nova! / 100, p.filiale! / 100).interetsIndirects * 100 },
        ],
      }),
      defi: () => {
        const m = plusPetitInteretControlant();
        return {
          consigne: `Trouvez les deux parts, de 5 points en 5 points, avec lesquelles NOVA contrôle ${A} pour le plus petit pourcentage d'intérêts possible.`,
          atteint: (p) => {
            const x = pourcentages(p.nova! / 100, p.filiale! / 100);
            return x.controleExclusif && x.interetsIndirects <= m.interets;
          },
          indice: (p) => {
            const x = pourcentages(p.nova! / 100, p.filiale! / 100);
            if (p.nova! <= 50) return `À ${p.nova} %, NOVA ne contrôle pas ${F} : les droits de vote de la filiale ne comptent pas pour elle.`;
            if (!x.controleExclusif) return `À ${p.filiale} %, ${F} ne contrôle pas ${A}.`;
            return `NOVA contrôle la boutique avec ${pct(x.interetsIndirects)} d'intérêts : peut-elle la contrôler avec moins ?`;
          },
          solution: { nova: m.nova, filiale: m.filiale },
        };
      },
      explication: () => {
        const m = plusPetitInteretControlant();
        return [
          `Défi relevé : à ${m.nova} % puis ${m.filiale} %, NOVA décide chez ${A} avec ${pct(m.interets)} de ses bénéfices seulement. Le contrôle se garde de maillon en maillon, tant que chacun dépasse la moitié ; les intérêts, eux, fondent à chaque maillon.`,
          "C'est pourquoi la méthode se choisit sur le contrôle, et le partage du résultat sur les intérêts.",
        ];
      },
    },
    {
      id: "les-comptes-de-la-filiale",
      type: "lecture",
      titre: "Les comptes de la filiale",
      notions: ["consolidation"],
      tableau: () => {
        const g = groupeNova();
        return {
          titre: `${F}, exercice N + 1`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Chiffre d'affaires", valeurs: [eur(g.chiffreDAffairesDeLaFiliale)] },
            { libelle: "Achats d'enceintes à NOVA", valeurs: [eur(-g.ventesReciproques)] },
            { libelle: "Charges externes et personnel", valeurs: [eur(-(g.chiffreDAffairesDeLaFiliale - g.ventesReciproques - g.interets - g.avantImpot))] },
            { libelle: "Intérêts du prêt de NOVA", valeurs: [eur(-g.interets)] },
            { libelle: "Impôt sur les sociétés", valeurs: [eur(-g.impot)] },
            { libelle: "Résultat de N + 1", valeurs: [eur(g.resultat)] },
            { libelle: "Au bilan : clients", valeurs: [eur(g.clients)] },
            { libelle: "Au bilan : banque", valeurs: [eur(g.banque)] },
            { libelle: "Au bilan : capital", valeurs: [eur(g.capital)] },
            { libelle: "Au bilan : emprunt auprès de NOVA", valeurs: [eur(g.passif.emprunt)] },
            { libelle: "Au bilan : dette envers NOVA", valeurs: [eur(g.dettesReciproques)] },
            { libelle: "Au bilan : impôt dû", valeurs: [eur(g.impot)] },
          ],
        };
      },
      texte: () => {
        const g = groupeNova();
        return [
          `Au 31 décembre N + 1, NOVA consolide ${F}, la seule société de son périmètre : un groupe de deux sociétés, dont NOVA est la société consolidante. L'intégration globale reprend, poste par poste, les comptes des deux sociétés, et les additionne.`,
          `Mais certaines lignes se répondent : la vente de NOVA est l'achat de sa filiale, la créance de l'une est la dette de l'autre, le prêt de NOVA est l'emprunt de ${F}, les intérêts reçus sont les intérêts payés. Additionnées, elles gonfleraient le groupe d'opérations qu'il fait avec lui-même. Total du bilan de la filiale : ${eur(g.totalDuBilan)}.`,
        ];
      },
      repere: () => "Intégration globale : on additionne les comptes, on élimine les opérations réciproques, on partage les capitaux propres de la filiale, on élimine les titres.",
    },
    {
      id: "les-operations-reciproques",
      objectifs: [3],
      type: "montants",
      titre: "Les opérations réciproques",
      notions: ["consolidation"],
      question: () =>
        `NOVA a vendu ${qte(VENTES_A_LA_FILIALE.enceintes)} One à ${F}, à son prix ; la dernière livraison, ${qte(VENTES_A_LA_FILIALE.enceintesDeLaDerniereLivraison)} One, n'est pas payée au 31 décembre. Le prêt court depuis le 1er juillet, à ${pct(PRET_A_LA_FILIALE.taux)}. Calculez ce que la consolidation élimine.`,
      champs: () => {
        const g = groupeNova();
        return [
          { libelle: "Ventes et achats réciproques", attendu: g.ventesReciproques, calcul: `${qte(VENTES_A_LA_FILIALE.enceintes)} × le prix de la One = ${eur(g.ventesReciproques)}` },
          { libelle: "Créance et dette réciproques, toutes taxes comprises", attendu: g.dettesReciproques, calcul: `${qte(VENTES_A_LA_FILIALE.enceintesDeLaDerniereLivraison)} × le prix de la One × 1,2 = ${eur(g.dettesReciproques)}` },
          { libelle: "Prêt et emprunt réciproques", attendu: PRET_A_LA_FILIALE.montant, calcul: `le prêt de NOVA : ${eur(PRET_A_LA_FILIALE.montant)}` },
          { libelle: "Intérêts réciproques", attendu: g.interets, calcul: `${eur(PRET_A_LA_FILIALE.montant)} × ${pct(PRET_A_LA_FILIALE.taux)} × 6 ÷ 12 = ${eur(g.interets)}` },
        ];
      },
      explication: () => [
        "Chaque élimination retire la même somme des deux côtés : du chiffre d'affaires et des achats, de l'actif et du passif, des produits et des charges financières. Le groupe ne se doit rien à lui-même, et ne se vend rien.",
      ],
    },
    {
      id: "le-chiffre-d-affaires-du-groupe",
      objectifs: [3],
      type: "montants",
      titre: "Le chiffre d'affaires du groupe",
      notions: ["consolidation", "revenue"],
      question: () => {
        const g = groupeNova();
        return `NOVA a réalisé ${eur(g.chiffreDAffairesDeNova)} de chiffre d'affaires en N + 1, dont ses ventes à ${F} ; la filiale, ${eur(g.chiffreDAffairesDeLaFiliale)}. Calculez le chiffre d'affaires additionné, puis celui du groupe.`;
      },
      champs: () => {
        const g = groupeNova();
        const cumul = g.chiffreDAffairesDeNova + g.chiffreDAffairesDeLaFiliale;
        return [
          { libelle: "Chiffre d'affaires additionné", attendu: cumul, calcul: `${eur(g.chiffreDAffairesDeNova)} + ${eur(g.chiffreDAffairesDeLaFiliale)} = ${eur(cumul)}` },
          { libelle: "Chiffre d'affaires du groupe", attendu: g.chiffreDAffairesDuGroupe, calcul: `${eur(cumul)} − ${eur(g.ventesReciproques)} = ${eur(g.chiffreDAffairesDuGroupe)}` },
        ];
      },
      explication: () => {
        const g = groupeNova();
        return [
          `Le groupe vend aux magasins ce que la filiale leur revend, ${eur(g.chiffreDAffairesDeLaFiliale)}, et ce que NOVA vend à ses autres clients. Les ${eur(g.ventesReciproques)} vendus par NOVA à sa filiale ne sont qu'un passage d'une société à l'autre.`,
        ];
      },
    },
    {
      id: "le-resultat-du-groupe",
      objectifs: [3],
      type: "choix",
      titre: "Et le résultat ?",
      notions: ["consolidation"],
      question: () => `Les éliminations des ventes, des créances, du prêt et des intérêts changent-elles le résultat du groupe ?`,
      options: () => [
        {
          texte: "Non, chaque élimination ôte autant des deux côtés",
          juste: true,
          retour: "Oui : un produit de NOVA et une charge de la filiale du même montant s'annulent ; une créance et une dette aussi. Le résultat ne bougerait que si une marge interne restait dans un stock, un retraitement qui va au-delà du BTS.",
        },
        {
          texte: `Oui, il baisse des ${eur(groupeNova().ventesReciproques)} de ventes que NOVA a faites à sa filiale`,
          juste: false,
          retour: "Non : les achats de la filiale s'éliminent avec les ventes de NOVA. Le chiffre d'affaires baisse, les charges autant.",
        },
        {
          texte: `Oui, il baisse des ${eur(groupeNova().interets)} d'intérêts que NOVA a reçus de sa filiale, qui disparaissent`,
          juste: false,
          retour: "Non : les intérêts payés par la filiale disparaissent avec eux. Ce que l'une gagne, l'autre le perd.",
        },
      ],
    },
    {
      id: "le-partage-des-capitaux-propres",
      objectifs: [4],
      type: "a-completer",
      titre: "Le partage des capitaux propres de la filiale",
      notions: ["minority_translation"],
      question: () =>
        `Partagez les capitaux propres de ${F} au 31 décembre N + 1 entre le groupe (${pct(PART_DE_NOVA)}, les intérêts de NOVA) et les minoritaires (${pct(1 - PART_DE_NOVA)}, le directeur).`,
      grille: () => {
        const g = groupeNova();
        return {
          titre: `Les capitaux propres de ${F}`,
          colonnes: ["Part du groupe", "Minoritaires", "Total"],
          colonneDeTotal: 2,
          lignes: [
            {
              libelle: "Capital",
              cellules: [
                { valeur: g.partDuGroupe.capital, saisir: true, calcul: `${eur(g.capital)} × ${pct(PART_DE_NOVA)}`, indice: "le capital, à la part de NOVA" },
                { valeur: g.minoritaires.capital, saisir: true, calcul: `${eur(g.capital)} × ${pct(1 - PART_DE_NOVA)}`, indice: "le capital, à la part du directeur" },
                { valeur: g.capital },
              ],
            },
            {
              libelle: "Résultat de N + 1",
              cellules: [
                { valeur: g.partDuGroupe.resultat, saisir: true, calcul: `${eur(g.resultat)} × ${pct(PART_DE_NOVA)}`, indice: "le résultat, à la part de NOVA" },
                { valeur: g.minoritaires.resultat, saisir: true, calcul: `${eur(g.resultat)} − ${eur(g.partDuGroupe.resultat)}`, indice: "le résultat, moins la part du groupe" },
                { valeur: g.resultat },
              ],
            },
            {
              libelle: "Capitaux propres",
              fort: true,
              totalDe: { plus: [0, 1] },
              cellules: [
                { valeur: g.partDuGroupe.total, saisir: true, calcul: `${eur(g.partDuGroupe.capital)} + ${eur(g.partDuGroupe.resultat)}`, indice: "la somme de la colonne" },
                { valeur: g.minoritaires.total, saisir: true, calcul: `${eur(g.minoritaires.capital)} + ${eur(g.minoritaires.resultat)}`, indice: "la somme de la colonne" },
                { valeur: g.capitauxPropres },
              ],
            },
          ],
        };
      },
      explication: () => {
        const g = groupeNova();
        return [
          `Le groupe reprend toute la filiale, mais elle n'est pas toute à lui : ${eur(g.minoritaires.total)} reviennent au directeur. Au bilan consolidé, ils paraissent à part, en intérêts minoritaires ; au compte de résultat, ${eur(g.minoritaires.resultat)} du résultat leur sont attribués.`,
        ];
      },
    },
    {
      id: "l-elimination-des-titres",
      objectifs: [4],
      type: "montants",
      titre: "L'élimination des titres",
      notions: ["consolidation", "minority_translation"],
      question: () =>
        `À l'actif de NOVA, les titres de ${F} ; au passif de la filiale, son capital. Une fois les comptes additionnés, l'un et l'autre décrivent le même apport. Calculez les titres éliminés, la part du groupe dans le capital de la filiale, l'écart entre les deux, et les intérêts minoritaires du bilan consolidé.`,
      champs: () => {
        const g = groupeNova();
        return [
          { libelle: "Titres éliminés", attendu: g.titres, calcul: `les titres à l'actif de NOVA : ${eur(g.titres)}` },
          { libelle: "Part du groupe dans le capital", attendu: g.partDuGroupe.capital, calcul: `${eur(g.capital)} × ${pct(PART_DE_NOVA)} = ${eur(g.partDuGroupe.capital)}` },
          { libelle: "Écart d'acquisition", attendu: g.ecartDAcquisition, calcul: `${eur(g.titres)} − ${eur(g.partDuGroupe.capital)} = ${eur(g.ecartDAcquisition)}` },
          { libelle: "Intérêts minoritaires", attendu: g.minoritaires.total, calcul: `${eur(g.minoritaires.capital)} + ${eur(g.minoritaires.resultat)} = ${eur(g.minoritaires.total)}` },
        ];
      },
      explication: () => [
        "NOVA a créé sa filiale : elle a payé ses actions à leur valeur nominale, et les titres valent exactement sa part du capital. Si elle avait racheté une société existante plus cher que sa part des capitaux propres, l'écart serait un écart d'acquisition, une notion qui va au-delà du BTS.",
      ],
    },
    {
      id: "ce-qui-change",
      objectifs: [0, 3],
      type: "choix",
      titre: "Ce que montrent les comptes du groupe",
      notions: ["consolidation"],
      question: () => `Au bilan consolidé du groupe NOVA au 31 décembre N + 1, que devient le prêt de ${eur(PRET_A_LA_FILIALE.montant)} de NOVA à sa filiale ?`,
      options: () => [
        {
          texte: "Il disparaît, avec l'emprunt de la filiale",
          juste: true,
          retour: "Oui : le groupe ne se prête pas à lui-même. Seules restent ses dettes envers les autres : la banque de NOVA, les fournisseurs, l'État. C'est ce que les banques et les actionnaires lisent dans des comptes consolidés.",
        },
        {
          texte: "Il reste à l'actif, et l'emprunt de la filiale au passif : chacun garde ses comptes",
          juste: false,
          retour: "Non : chacune garde ses comptes annuels, mais les comptes consolidés éliminent ce que les sociétés du groupe se doivent entre elles.",
        },
        {
          texte: `Il reste à l'actif pour ${pct(1 - PART_DE_NOVA)} de son montant, la part prêtée aux minoritaires`,
          juste: false,
          retour: "Non : l'élimination des opérations réciproques est totale en intégration globale ; le partage avec les minoritaires ne porte que sur les capitaux propres et le résultat de la filiale.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["consolidation"],
      texte: () => {
        const g = groupeNova();
        const p = pourcentages();
        return [
          `NOVA contrôle ${F} à ${pct(PART_DE_NOVA)} : un contrôle exclusif, une intégration globale. Par sa filiale, elle contrôlerait ${A} à ${pct(p.controleIndirect)} avec ${pct(p.interetsIndirects)} d'intérêts. Au 31 décembre N + 1, le groupe élimine ${eur(g.ventesReciproques)} de ventes réciproques, ${eur(g.dettesReciproques)} de créance, ${eur(PRET_A_LA_FILIALE.montant)} de prêt et ${eur(g.interets)} d'intérêts. Son chiffre d'affaires est de ${eur(g.chiffreDAffairesDuGroupe)} ; les minoritaires détiennent ${eur(g.minoritaires.total)} des capitaux propres de la filiale.`,
          "Dans l'arène, chaque équipe est une société seule : imaginez la vôtre avec une filiale de distribution, et ce que ses ventes à la filiale ajouteraient, ou non, au chiffre d'affaires du groupe.",
        ];
      },
      repere: () =>
        "Contrôle exclusif : intégration globale. Contrôle conjoint : intégration proportionnelle, puis mise en équivalence au règlement ANC 2020-01. Influence notable : mise en équivalence. Contrôle : il passe par les sociétés contrôlées. Intérêts : ils se multiplient le long de la chaîne.",
    },
  ],
};
