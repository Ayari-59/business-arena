import { CLIENTELES, GAMME, type CodeDeClientele } from "./maille-et-co";

/**
 * LE MONDE DU COURS : LE FICHIER DES CLIENTES DE MAILLE & CO (le chapitre « Données personnelles et
 * données ouvertes », SGN de première T2.1).
 *
 * CE QUI VIENT DE LA FICHE DE LA BOUTIQUE (maille-et-co.ts) : les achats de janvier de chaque clientèle,
 * référence par référence, leurs passages en caisse, et les prix, coûts d'achat et autres coûts
 * variables de la gamme. Le chiffre d'affaires et la marge de chaque clientèle s'en calculent.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · la carte de fidélité compte 1 200 clientes inscrites ; 540 ont coché la case qui accepte les
 *     offres par courriel (leur consentement) ;
 *   · les données ouvertes du recensement donnent 9 400 femmes de 25 à 64 ans dans les communes d'où
 *     viennent les clientes (le cœur de la clientèle de la boutique) ;
 *   · une campagne par courriel coûte 600 € (la conception du message et l'outil d'envoi), quel que soit
 *     le nombre de destinataires ; 3 % des clientes qui la reçoivent viennent acheter, un panier de
 *     cliente fidèle.
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

export const FICHIER_DE_MAILLE = {
  inscrites: 1_200,
  consentantes: 540,
  femmesDeLaZone: 9_400,
  campagne: { cout: 600, tauxDeRetour: 0.03 },
} as const;

/** Ce que les achats de janvier d'une clientèle ont rapporté : chiffre d'affaires, marge, panier moyen. */
export function clienteleDeJanvier(code: CodeDeClientele) {
  const g = CLIENTELES.find((x) => x.code === code)!;
  let chiffreDAffaires = 0;
  let marge = 0;
  for (const r of GAMME) {
    const n = g.achats[r.code];
    chiffreDAffaires += n * r.prixHt;
    marge += n * (r.prixHt - r.coutDAchat - r.autresCoutsVariables);
  }
  return {
    nom: g.nom,
    tickets: g.tickets,
    chiffreDAffaires: auCentime(chiffreDAffaires),
    marge: auCentime(marge),
    panierMoyen: auCentime(chiffreDAffaires / g.tickets),
    margeParTicket: auCentime(marge / g.tickets),
  };
}

/** Ce que les données ouvertes apprennent : la part des femmes de la zone qui ont la carte. */
export const tauxDePenetrationPct = () => auDixieme((FICHIER_DE_MAILLE.inscrites / FICHIER_DE_MAILLE.femmesDeLaZone) * 100);

/** Ce qu'une campagne rapporte, envoyée à un nombre de clientes consentantes. */
export function campagne(destinataires: number) {
  const parDestinataire = FICHIER_DE_MAILLE.campagne.tauxDeRetour * clienteleDeJanvier("fideles").margeParTicket;
  const marge = auCentime(destinataires * parDestinataire);
  return { destinataires, parDestinataire, marge, cout: FICHIER_DE_MAILLE.campagne.cout, gain: auCentime(marge - FICHIER_DE_MAILLE.campagne.cout) };
}

/** Le plus petit nombre de clientes consentantes pour qu'une campagne paie son coût. */
export const DESTINATAIRES_QUI_PAIENT = Math.ceil(FICHIER_DE_MAILLE.campagne.cout / campagne(1).parDestinataire - 1e-9);
