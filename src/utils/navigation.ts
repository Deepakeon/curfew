import { PermissionsState } from '../services/permissions';

export type ActiveTab = 'schedule' | 'apps' | 'setup';

export interface TabResolutionInput {
  permissions: PermissionsState;
  userSelectedTab: ActiveTab | null;
}

export function resolveActiveTab({
  permissions,
  userSelectedTab,
}: TabResolutionInput): ActiveTab {
  if (userSelectedTab !== null) {
    return userSelectedTab;
  }
  return permissions.allGranted ? 'schedule' : 'setup';
}
