import { ATTRIBUT, NAMEID_PERSISTANT } from "./constantes";

/**
 * CE QUE BUSINESS ARENA RETIENT DES ATTRIBUTS TRANSMIS PAR L'ÉTABLISSEMENT.
 *
 * L'IDENTIFIANT : pairwise-id (pseudonyme, propre à Business Arena), à défaut
 * eduPersonTargetedID, à défaut le NameID persistant. Jamais l'identifiant de connexion
 * de la personne, jamais son adresse : un identifiant que seul ce service reçoit, qui ne
 * permet de suivre personne ailleurs. Il sera HACHÉ avant d'être gardé (comptes.ts).
 *
 * LE STATUT : eduPersonScopedAffiliation (ou eduPersonAffiliation). Enseignant ou
 * personnel : faculty, teacher, researcher (SupAnn), staff, et employee quand la
 * personne n'est pas aussi étudiante (un étudiant salarié reste un étudiant). Tout le
 * reste, et l'absence d'attribut, est un ÉTUDIANT : le moindre privilège par défaut.
 *
 * L'ÉTABLISSEMENT : schacHomeOrganization.
 *
 * LES PORTÉES. Un IdP n'a le droit d'affirmer que les domaines que l'agrégat signé lui
 * reconnaît (`shibmd:Scope`). Une valeur à portée étrangère est ignorée : un IdP ne peut
 * pas se faire passer pour un autre établissement (ni pour en obtenir la licence).
 *
 * NOM ET COURRIEL (displayName, mail) : lus pour un personnel SEULEMENT. Pour un étudiant,
 * ils ne sont même pas extraits du profil.
 */

export type RoleFedere = "enseignant" | "etudiant";

export interface AttributsRetenus {
  identifiant: string | null;
  source: "pairwise-id" | "eduPersonTargetedID" | "nameid" | null;
  role: RoleFedere;
  affiliations: string[];
  /** L'établissement (schacHomeOrganization), seulement s'il est dans les portées de l'IdP. */
  etablissement: string | null;
  /** Pour un personnel seulement. */
  nom: string | null;
  courriel: string | null;
}

/** Le profil tel que @node-saml/node-saml le rend (champs utiles seulement). */
export interface ProfilRecu {
  nameID?: string;
  nameIDFormat?: string;
  attributes?: Record<string, unknown>;
}

const LONGUEUR_MAX = 1024;

/** Une valeur d'attribut en texte : une chaîne, ou l'élément NameID d'eduPersonTargetedID. */
function enTexte(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (v && typeof v === "object") {
    const o = v as { _?: unknown; NameID?: unknown };
    if (typeof o._ === "string") return o._.trim() || null;
    if (Array.isArray(o.NameID)) return enTexte(o.NameID[0]);
  }
  return null;
}

function valeurs(attributs: Record<string, unknown> | undefined, nom: string): string[] {
  const brut = attributs?.[nom];
  const liste = Array.isArray(brut) ? brut : brut === undefined ? [] : [brut];
  return liste.map(enTexte).filter((s): s is string => !!s && s.length <= LONGUEUR_MAX);
}

/** La portée d'une valeur « valeur@portée », si elle est reconnue à l'IdP. */
function dansLesPortees(valeur: string, portees: readonly string[]): { valeur: string; portee: string } | null {
  const i = valeur.lastIndexOf("@");
  if (i <= 0 || i === valeur.length - 1) return null;
  const portee = valeur.slice(i + 1).toLowerCase();
  return portees.includes(portee) ? { valeur: valeur.slice(0, i), portee } : null;
}

const PERSONNEL = new Set(["faculty", "teacher", "researcher", "staff"]);

export function roleSelonAffiliations(affiliations: readonly string[]): RoleFedere {
  const a = new Set(affiliations.map((v) => v.toLowerCase()));
  if ([...a].some((v) => PERSONNEL.has(v))) return "enseignant";
  if (a.has("employee") && !a.has("student")) return "enseignant";
  return "etudiant";
}

export function attributsRetenus(profil: ProfilRecu, portees: readonly string[]): AttributsRetenus {
  const attrs = profil.attributes;

  // 1. L'identifiant pseudonyme.
  let identifiant: string | null = null;
  let source: AttributsRetenus["source"] = null;
  const pairwise = valeurs(attrs, ATTRIBUT.pairwiseId)[0];
  if (pairwise && (portees.length === 0 || dansLesPortees(pairwise, portees))) {
    identifiant = pairwise;
    source = "pairwise-id";
  }
  if (!identifiant) {
    const cible = valeurs(attrs, ATTRIBUT.eduPersonTargetedID)[0];
    if (cible) {
      identifiant = cible;
      source = "eduPersonTargetedID";
    }
  }
  if (!identifiant && profil.nameIDFormat === NAMEID_PERSISTANT && profil.nameID?.trim()) {
    identifiant = profil.nameID.trim().slice(0, LONGUEUR_MAX);
    source = "nameid";
  }

  // 2. Le statut : les affiliations à portée reconnue, puis les affiliations simples.
  const scopees = valeurs(attrs, ATTRIBUT.eduPersonScopedAffiliation)
    .map((v) => dansLesPortees(v, portees)?.valeur)
    .filter((v): v is string => !!v);
  const simples = valeurs(attrs, ATTRIBUT.eduPersonAffiliation);
  const affiliations = [...new Set([...scopees, ...simples].map((v) => v.toLowerCase()))];
  const role = roleSelonAffiliations(affiliations);

  // 3. L'établissement, s'il est dans les portées de l'IdP.
  const schac = valeurs(attrs, ATTRIBUT.schacHomeOrganization)[0]?.toLowerCase() ?? null;
  const etablissement = schac && portees.includes(schac) ? schac : null;

  // 4. Nom et courriel : pour un personnel seulement.
  const nom = role === "enseignant" ? (valeurs(attrs, ATTRIBUT.displayName)[0]?.slice(0, 120) ?? null) : null;
  const mail = role === "enseignant" ? (valeurs(attrs, ATTRIBUT.mail)[0] ?? null) : null;
  const courriel = mail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? mail.slice(0, 254) : null;

  return { identifiant, source, role, affiliations, etablissement, nom, courriel };
}
