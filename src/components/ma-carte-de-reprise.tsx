import {
  AIDE_CODE_DE_REPRISE_CLASSE,
  AIDE_CODE_DE_REPRISE_SOLO,
  formaterCodeDeReprise,
} from "@/config/reprise";
import { BoutonCopierLeCode } from "@/components/bouton-copier-le-code";
import { CodeQr } from "@/components/code-qr";
import { urlDeReprise } from "@/lib/qr";
import { Tiroir } from "@/components/tiroir";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { renouvelerSonCodeAction } from "@/app/reprendre/actions";

/**
 * MON CODE DE REPRISE, DANS L'ARÈNE.
 *
 * L'élève est reconnu par son navigateur : changer de poste, vider ses
 * cookies ou passer au téléphone le rendait méconnaissable, et l'application
 * le rangeait alors dans une équipe quelconque. Ce code le rend à lui-même.
 * C'est AVANT de perdre son appareil qu'on peut encore le lire, donc il vit
 * ici, dans la partie, et pas seulement à l'entrée.
 *
 * REPLIÉ, ET C'EST TOUT LE POINT. Les QR de la partie et des tables sont des
 * affiches, faites pour être vues de toute la salle ; celui-ci est une CLÉ.
 * Qui le lit peut jouer à la place de son propriétaire. Il ne s'ouvre donc que
 * sur un geste, et ne traîne pas sur un écran qu'un voisin regarde — et si
 * quelqu'un l'a vu quand même, le bouton en tire un autre sur-le-champ.
 */
export function MaCarteDeReprise({
  gameId,
  code,
  solo = false,
}: {
  gameId: string;
  code: string;
  /** En solo, personne ne peut relire le code : le texte l'assume. */
  solo?: boolean;
}) {
  return (
    <Tiroir
      icone="cle"
      titre={solo ? "Garder ma partie" : "Mon code de reprise"}
      quoi={solo ? "pour la reprendre ailleurs" : "pour changer d'appareil"}
    >
      <div className="flex flex-col gap-4 px-3 pb-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="whitespace-nowrap font-mono text-2xl tracking-etiquette text-slate-100">
            {formaterCodeDeReprise(code)}
          </p>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-300">
            {solo ? AIDE_CODE_DE_REPRISE_SOLO : AIDE_CODE_DE_REPRISE_CLASSE}
          </p>
          <BoutonCopierLeCode code={formaterCodeDeReprise(code)} />
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-slate-400">
            Gardez-le pour vous : qui le lit peut jouer à votre place. Si quelqu&apos;un
            l&apos;a vu, prenez-en un autre — l&apos;ancien cesse aussitôt de fonctionner.
          </p>
          <GuardedForm
            action={renouvelerSonCodeAction.bind(null, { error: null })}
            label="renouvellement du code de reprise"
            className="mt-2"
          >
            <input type="hidden" name="gameId" value={gameId} />
            <SubmitButton
              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5"
              pendingLabel="Renouvellement…"
            >
              ↻ Prendre un autre code
            </SubmitButton>
          </GuardedForm>
        </div>
        {/* Le QR fait la même chose que le code, sans le recopier : l'élève le
            photographie avec son téléphone et le scanne le jour où il n'a plus
            son appareil habituel. */}
        <div className="flex shrink-0 flex-col items-center gap-1 self-center sm:self-auto">
          <CodeQr
            valeur={urlDeReprise(code)}
            description="QR code personnel : il vous rend votre place dans la partie"
            className="h-28 w-28"
          />
          <span className="libelle">
            à garder
          </span>
        </div>
      </div>
    </Tiroir>
  );
}
