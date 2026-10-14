import { origineDeLaRequete } from "@/lib/origine";
import { journaliserRefus } from "@/lti/journal";
import { echapper, origineDe, pageLti } from "@/lti/html";
import {
  InscriptionDynamiqueRefusee,
  inscrire,
  lireConfiguration,
  organisationDuJeton,
} from "@/lti/inscription";

/**
 * L'INSCRIPTION DYNAMIQUE (lti/inscription.ts). La plateforme ouvre cette adresse, avec
 * le jeton fourni par /admin/lti, dans une fenêtre intégrée : la page est intégrable par
 * l'origine de la configuration annoncée, et par elle seule.
 *
 *   GET  : vérifie le jeton et la configuration, puis demande confirmation ;
 *   POST : consomme le jeton et inscrit l'outil auprès de la plateforme.
 */
export const dynamic = "force-dynamic";

function refus(motif: string, statut: number, origine: string | null): Response {
  return pageLti({
    titre: "Inscription impossible",
    surtitre: "Business Arena · inscription LTI",
    statut,
    integrablePar: [origine],
    corps: `<p>${echapper(motif)}</p><p class="note">Demandez une nouvelle adresse d'inscription à Business Arena si celle-ci a expiré ou déjà servi.</p>`,
  });
}

export async function GET(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams;
  const jeton = q.get("jeton") ?? "";
  const urlConfiguration = q.get("openid_configuration");
  const origineConfig = origineDe(urlConfiguration);
  const organisation = await organisationDuJeton(jeton);
  if (!organisation) {
    await journaliserRefus({ etape: "inscription", motif: "jeton d'inscription inconnu, expiré ou déjà utilisé" });
    return refus("Cette adresse d'inscription n'est plus valable.", 403, origineConfig);
  }
  let config;
  try {
    config = await lireConfiguration(urlConfiguration);
  } catch (e) {
    if (!(e instanceof InscriptionDynamiqueRefusee)) throw e;
    await journaliserRefus({ etape: "inscription", motif: e.motif, issuer: e.issuer });
    return refus(`La configuration de la plateforme n'a pas pu être lue : ${e.motif}.`, 400, origineConfig);
  }
  const cache = (nom: string, valeur: string | null) =>
    valeur ? `<input type="hidden" name="${nom}" value="${echapper(valeur)}">` : "";
  return pageLti({
    titre: "Ajouter Business Arena à votre plateforme",
    surtitre: "Business Arena · inscription LTI",
    integrablePar: [origineConfig],
    corps: `<div class="carte"><p>Plateforme : <code>${echapper(config.issuer)}</code></p>
<p>Établissement rattaché : <strong>${echapper(organisation.nom)}</strong></p>
<p class="note">Les activités de cette plateforme ouvriront les parties et les cohortes sous la licence de cet établissement. Business Arena reçoit l'identifiant technique de chaque personne et son prénom ; aucun courriel d'élève.</p></div>
<form method="post" action="/api/lti/inscription">
${cache("jeton", jeton)}${cache("openid_configuration", urlConfiguration)}${cache("registration_token", q.get("registration_token"))}
<button class="bouton" type="submit">Inscrire Business Arena</button>
</form>
<p class="note">Après l'inscription, réglez l'outil sur « Nouvelle fenêtre » (conteneur de lancement) : le jeu a besoin de tout l'écran.</p>`,
  });
}

export async function POST(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    form = new FormData();
  }
  const champ = (c: string) => {
    const v = form.get(c);
    return typeof v === "string" ? v : null;
  };
  const urlConfiguration = champ("openid_configuration");
  const origineConfig = origineDe(urlConfiguration);
  try {
    const plateforme = await inscrire({
      jeton: champ("jeton") ?? "",
      urlConfiguration,
      jetonPlateforme: champ("registration_token"),
      origine: await origineDeLaRequete(),
    });
    return pageLti({
      titre: "Business Arena est inscrit",
      surtitre: "Business Arena · inscription LTI",
      integrablePar: [origineConfig],
      corps: `<p>La plateforme <code>${echapper(plateforme.issuer)}</code> peut maintenant lancer Business Arena.</p>
<p>Dernière étape dans la plateforme : activez l'outil, et réglez son conteneur de lancement sur « Nouvelle fenêtre ».</p>`,
      script:
        "(window.opener || window.parent).postMessage({ subject: 'org.imsglobal.lti.close' }, '*');",
    });
  } catch (e) {
    if (!(e instanceof InscriptionDynamiqueRefusee)) throw e;
    await journaliserRefus({ etape: "inscription", motif: e.motif, issuer: e.issuer });
    return refus(`L'inscription n'a pas abouti : ${e.motif}.`, e.motif.startsWith("jeton") ? 403 : 400, origineConfig);
  }
}
