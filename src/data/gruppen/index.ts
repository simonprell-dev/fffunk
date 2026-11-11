import type { GruppenSzenario, OrgId } from '../../types/gruppe';
import { FEUERWEHR } from './feuerwehr';
import { FEUERWEHR_WEITERE } from './feuerwehr2';
import { RETTUNGSDIENST } from './rettungsdienst';
import { THW } from './thw';
import { POLIZEI } from './polizei';

export const GRUPPEN_SZENARIEN: GruppenSzenario[] = [...FEUERWEHR, ...FEUERWEHR_WEITERE, ...RETTUNGSDIENST, ...THW, ...POLIZEI];

export function szenarienFuer(org: OrgId): GruppenSzenario[] {
  return GRUPPEN_SZENARIEN.filter(s => s.org === org);
}
