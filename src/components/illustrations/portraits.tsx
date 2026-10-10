import { ACCENT, ACCENT_TRAIT, BLANC, MARINE as M, OMBRE } from "./trait";

/**
 * LES VISAGES DES INTERLOCUTEURS (lot 6B) : en buste, `viewBox` 240 × 240,
 * chacun avec UN attribut qui dit le métier. Les visages n'ont pas de traits :
 * l'âge, la coupe et la silhouette font la personne, l'attribut fait le rôle.
 * Ils se lisent entre 56 et 72 px, dans l'en-tête d'une lettre : rien de ce
 * qui compte n'y est plus fin que quelques pixels.
 *
 * LOT P4 : LA BANQUE ET LA PRESSE NE SE CONFONDENT PLUS. À 64 px, elles avaient
 * la même coupe sombre qui encadre le visage et le même buste : on les
 * distinguait au seul objet tenu. Elles se distinguent maintenant d'abord par
 * la SILHOUETTE et par le SOL DU MÉDAILLON, dans la palette fermée :
 *   · la banque, sur le sol le plus CLAIR des marines (`releve`) : une femme
 *     d'âge mûr, carré court et net au ras de la mâchoire, grandes lunettes,
 *     veste sombre aux épaules larges et carrées ;
 *   · la presse, sur le sol le plus SOMBRE (`nuit`) : un jeune homme mince, la
 *     casquette gavroche claire à visière, le cou dégagé, les épaules étroites,
 *     l'écharpe et le journal plié.
 * Les six autres gardent le sol du milieu (`mur`).
 */

/**
 * Le fond : le sol du médaillon et le halo derrière la tête, légèrement teinté
 * du métier. Par défaut, le sol du milieu ; la banque et la presse ont le leur.
 */
function Fond({ sol = M.mur, halo = M.champ }: { sol?: string; halo?: string } = {}) {
  return (
    <>
      <rect width={240} height={240} fill={sol} />
      <circle cx={120} cy={104} r={80} fill={halo} />
      <circle cx={120} cy={104} r={80} style={ACCENT} opacity={0.08} />
    </>
  );
}

/** Le cou et le visage, ovale sans traits. */
function Visage({
  peau = BLANC,
  cou = OMBRE,
  cy = 112,
}: {
  peau?: string;
  cou?: string;
  cy?: number;
}) {
  return (
    <>
      <rect x={109} y={cy + 24} width={22} height={32} fill={cou} />
      <ellipse cx={120} cy={cy} rx={29} ry={35} fill={peau} />
    </>
  );
}

/** Le buste, des épaules au bas du cadre. */
function Epaules({ fill, largeur = 82 }: { fill: string; largeur?: number }) {
  const g = 120 - largeur;
  const d = 120 + largeur;
  return <path d={`M${g} 240C${g} 186 74 164 120 164C166 164 ${d} 186 ${d} 240Z`} fill={fill} />;
}

/**
 * LA BANQUE : la chargée d'affaires, d'âge mûr, son carré net, ses grandes
 * lunettes et le dossier de crédit. Sol clair, veste sombre aux épaules carrées.
 */
export function PortraitBanque() {
  return (
    <>
      <Fond sol={M.releve} halo={M.filet} />
      {/* la veste structurée : épaules larges et carrées */}
      <path d="M26 240L30 196Q34 172 72 166L168 166Q206 172 210 196L214 240Z" fill={M.fond} />
      <path d="M101 166L120 204L139 166Z" fill={BLANC} />
      <path d="M101 166L120 204L98 240L76 240L86 172Z" fill={M.nuit} />
      <path d="M139 166L120 204L142 240L164 240L154 172Z" fill={M.nuit} />
      {/* le carré court, net, au ras de la mâchoire : derrière le visage */}
      <path d="M84 112C82 78 98 64 120 64C142 64 158 78 156 112L158 140Q140 146 130 140L110 140Q100 146 82 140Z" fill={M.nuit} />
      <Visage />
      {/* la frange droite, coupée net */}
      <path d="M90 104C90 82 102 72 120 72C138 72 150 82 150 104L150 96Q120 88 90 96Z" fill={M.nuit} />
      {/* les grandes lunettes */}
      <g fill="none" strokeWidth={3.4} style={ACCENT_TRAIT}>
        <rect x={97} y={106} width={19} height={14} rx={3} />
        <rect x={124} y={106} width={19} height={14} rx={3} />
        <path d="M116 112L124 112" />
      </g>
      {/* le dossier de crédit, posé sur le bureau */}
      <rect x={0} y={218} width={240} height={22} fill={M.creux} />
      <rect x={0} y={218} width={240} height={3} fill={BLANC} opacity={0.14} />
      <g transform="rotate(-6 170 214)">
        <rect x={140} y={202} width={62} height={16} rx={1.5} style={ACCENT} />
        <rect x={140} y={202} width={62} height={3} fill={BLANC} opacity={0.3} />
      </g>
    </>
  );
}

/** LE FOURNISSEUR : le livreur barbu, une caisse dans les bras. */
export function PortraitFournisseur() {
  return (
    <>
      <Fond />
      <Epaules fill={M.releve} largeur={88} />
      <path d="M104 166L120 180L136 166Z" fill={M.creux} />
      <Visage />
      {/* les cheveux courts et la barbe pleine */}
      <path
        d="M91 106C88 78 104 70 122 70C142 70 154 82 150 106C146 92 136 86 120 88C104 88 95 94 91 106Z"
        fill={M.nuit}
      />
      <path
        d="M91 112C91 136 102 150 120 150C138 150 149 136 149 112C146 126 140 132 132 132C126 128 114 128 108 132C100 132 94 126 91 112Z"
        fill={M.nuit}
      />
      {/* la caisse, aux couleurs de la maison */}
      <rect x={66} y={182} width={108} height={58} rx={2} style={ACCENT} />
      <rect x={66} y={182} width={108} height={4} fill={BLANC} opacity={0.3} />
      <rect x={114} y={182} width={12} height={58} fill={BLANC} opacity={0.55} />
      <ellipse cx={66} cy={206} rx={9} ry={11} fill={BLANC} />
      <ellipse cx={174} cy={206} rx={9} ry={11} fill={BLANC} />
    </>
  );
}

/** LE PRESTATAIRE TECHNIQUE : la technicienne, casque et gilet. */
export function PortraitTechnicien() {
  return (
    <>
      <Fond />
      <Epaules fill={M.creux} largeur={80} />
      <path d="M72 240L80 180Q92 168 104 166L110 240Z" fill={M.releve} />
      <path d="M168 240L160 180Q148 168 136 166L130 240Z" fill={M.releve} />
      <rect x={74} y={206} width={36} height={6} fill={BLANC} opacity={0.85} />
      <rect x={130} y={206} width={36} height={6} fill={BLANC} opacity={0.85} />
      {/* la queue de cheval qui dépasse du casque */}
      <path d="M140 100Q166 104 160 150Q152 126 140 118Z" fill={M.nuit} />
      <Visage />
      <path
        d="M92 104C92 98 100 96 112 96L128 96C140 96 148 98 148 104L148 110C140 104 100 104 92 110Z"
        fill={M.nuit}
      />
      {/* le casque, à la teinte de la maison */}
      <path d="M86 98C86 64 154 64 154 98Z" style={ACCENT} />
      <rect x={78} y={94} width={84} height={9} rx={4.5} style={ACCENT} />
      <rect x={116} y={68} width={8} height={28} fill={BLANC} opacity={0.3} />
    </>
  );
}

/** LE CLIENT, LE GRAND COMPTE : un acheteur en veste, le badge au cou. */
export function PortraitClient() {
  return (
    <>
      <Fond />
      <Epaules fill={M.fond} />
      <path d="M100 166L120 196L140 166Z" fill={BLANC} />
      <path d="M100 166L120 196L104 240L76 240L84 178Z" fill={M.champ} />
      <path d="M140 166L120 196L136 240L164 240L156 178Z" fill={M.champ} />
      <Visage peau={OMBRE} cou={OMBRE} />
      <rect x={109} y={142} width={22} height={6} fill={M.nuit} opacity={0.15} />
      {/* les cheveux bouclés, hauts */}
      <g fill={M.nuit}>
        <circle cx={98} cy={88} r={16} />
        <circle cx={120} cy={78} r={19} />
        <circle cx={142} cy={88} r={16} />
        <circle cx={92} cy={104} r={9} />
        <circle cx={148} cy={104} r={9} />
      </g>
      {/* le cordon et le badge de visiteur */}
      <path d="M108 168L112 198M132 168L128 198" fill="none" strokeWidth={4} style={ACCENT_TRAIT} />
      <rect x={100} y={194} width={40} height={46} rx={3} style={ACCENT} />
      <rect x={108} y={202} width={24} height={15} rx={1} fill={BLANC} />
      <rect x={108} y={222} width={24} height={4} fill={M.fond} opacity={0.5} />
    </>
  );
}

/** L'ADMINISTRATION : l'inspecteur grisonnant et son tampon. */
export function PortraitAdministration() {
  return (
    <>
      <Fond />
      <Epaules fill={M.creux} largeur={84} />
      <path d="M102 165L120 200L138 165Z" fill={BLANC} />
      <path d="M116 172L124 172L127 216L120 226L113 216Z" fill={M.fond} />
      <path d="M102 165L120 200L100 240L78 240L86 176Z" fill={M.fond} />
      <path d="M138 165L120 200L140 240L162 240L154 176Z" fill={M.fond} />
      <Visage cy={114} />
      {/* crâne dégarni, tempes grises, moustache */}
      <path d="M92 102C91 94 94 89 99 87L101 114L93 116Z" fill={OMBRE} />
      <path d="M148 102C149 94 146 89 141 87L139 114L147 116Z" fill={OMBRE} />
      <path d="M108 128Q120 122 132 128Q126 134 120 132Q114 134 108 128Z" fill={OMBRE} />
      {/* le tampon, levé dans la main */}
      <path d="M150 240L162 194L196 194L208 240Z" fill={M.fond} />
      <rect x={172} y={162} width={12} height={36} fill={M.filet} />
      <circle cx={178} cy={156} r={15} style={ACCENT} />
      <rect x={152} y={196} width={52} height={20} rx={2} style={ACCENT} />
      <rect x={154} y={216} width={48} height={6} fill={M.nuit} />
      <ellipse cx={178} cy={184} rx={12} ry={9} fill={BLANC} />
    </>
  );
}

/** LES ASSOCIÉS : la doyenne aux cheveux blancs, la tablette des résultats. */
export function PortraitAssocies() {
  return (
    <>
      <Fond />
      <Epaules fill={M.releve} largeur={78} />
      <path d="M96 168Q120 196 144 168L148 176Q120 210 92 176Z" fill={M.creux} />
      <Visage peau={BLANC} />
      {/* les cheveux blancs relevés en chignon */}
      <circle cx={120} cy={66} r={15} fill={OMBRE} />
      <path
        d="M90 116C84 84 100 74 120 74C140 74 156 84 150 116C146 98 138 92 126 90C114 96 100 100 90 116Z"
        fill={OMBRE}
      />
      {/* la tablette, et ce qu'elle montre : les résultats du trimestre */}
      <g transform="rotate(-8 120 214)">
        <rect x={74} y={190} width={92} height={60} rx={6} fill={M.nuit} />
        <rect x={80} y={196} width={80} height={48} rx={2} fill={M.creux} />
        <g style={ACCENT}>
          <rect x={88} y={226} width={10} height={14} />
          <rect x={104} y={218} width={10} height={22} />
          <rect x={120} y={222} width={10} height={18} />
          <rect x={136} y={206} width={10} height={34} />
        </g>
      </g>
      <ellipse cx={70} cy={222} rx={10} ry={12} fill={BLANC} />
      <ellipse cx={170} cy={210} rx={10} ry={12} fill={BLANC} />
    </>
  );
}

/** LE SALARIÉ : le jeune équipier, au tablier de la maison. */
export function PortraitSalarie() {
  return (
    <>
      <Fond />
      <Epaules fill={M.champ} largeur={90} />
      <Visage peau={OMBRE} cou={OMBRE} cy={110} />
      <rect x={109} y={138} width={22} height={6} fill={M.nuit} opacity={0.15} />
      {/* la coupe rase, un peu plus longue dessus */}
      <path
        d="M91 104C88 76 104 68 120 68C138 68 152 78 149 104C146 92 140 84 120 84C102 84 94 92 91 104Z"
        fill={M.nuit}
      />
      <rect
        x={146}
        y={96}
        width={22}
        height={4}
        rx={2}
        fill={BLANC}
        transform="rotate(-30 157 98)"
      />
      {/* le tablier à bavette, à la teinte de la maison */}
      <path d="M92 240L92 192L104 182L136 182L148 192L148 240Z" style={ACCENT} />
      <path d="M104 182L98 160M136 182L142 160" fill="none" strokeWidth={4} style={ACCENT_TRAIT} />
      <rect x={108} y={204} width={24} height={16} rx={2} fill={M.nuit} opacity={0.2} />
    </>
  );
}

/**
 * LA PRESSE ET LES OBSERVATEURS : le jeune journaliste, mince, la casquette
 * gavroche claire à visière, l'écharpe, et le journal plié. Sol sombre.
 */
export function PortraitPresse() {
  return (
    <>
      <Fond sol={M.nuit} halo={M.sol} />
      {/* les épaules étroites */}
      <Epaules fill={M.champ} largeur={68} />
      <path d="M104 166L120 186L136 166Z" fill={M.nuit} />
      {/* le cou long et dégagé, le visage plus étroit */}
      <rect x={110} y={134} width={20} height={36} fill={OMBRE} />
      <ellipse cx={120} cy={114} rx={26} ry={33} fill={BLANC} />
      {/* l'écharpe, nouée */}
      <path d="M96 164Q120 178 144 164L146 174Q120 190 94 174Z" fill={M.filet} />
      <path d="M128 176L138 214L126 214L120 180Z" fill={M.filet} />
      {/* les cheveux courts qui dépassent aux tempes */}
      <path d="M94 96L102 96L100 116L94 112Z" fill={M.nuit} />
      <path d="M146 96L138 96L140 116L146 112Z" fill={M.nuit} />
      {/* la casquette gavroche : une calotte PLATE et large, tirée vers
          l'avant, et sa visière courte qui déborde à gauche — rien d'un casque */}
      <path d="M92 100Q86 84 104 78Q126 70 152 78Q170 84 162 98Q150 102 128 100L100 102Q92 104 92 100Z" fill={OMBRE} />
      <path d="M108 80Q128 74 150 80" fill="none" stroke={BLANC} strokeWidth={2.5} opacity={0.7} />
      <path d="M94 98Q80 98 70 106Q84 112 112 104Z" fill={BLANC} />
      {/* le journal plié, sous le bras */}
      <g transform="rotate(-14 160 206)">
        <rect x={120} y={182} width={84} height={50} fill={BLANC} />
        <rect x={126} y={188} width={72} height={8} style={ACCENT} />
        <g fill={M.fond} opacity={0.45}>
          <rect x={126} y={202} width={32} height={3} />
          <rect x={126} y={209} width={32} height={3} />
          <rect x={126} y={216} width={28} height={3} />
          <rect x={164} y={202} width={34} height={17} />
        </g>
        <rect x={120} y={226} width={84} height={6} fill={OMBRE} />
      </g>
      <ellipse cx={112} cy={224} rx={10} ry={12} fill={BLANC} />
    </>
  );
}
