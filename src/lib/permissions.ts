export type UserRole = "ADMINISTRATOR" | "ANALYST" | "FIELD_OFFICER" | "VIEWER";

export const ROLE_PERMISSIONS: Record<UserRole, {
  canManageUsers: boolean;
  canConfigureScoring: boolean;
  canImportData: boolean;
  canCreateInterventions: boolean;
  canUpdateInterventions: boolean;
  canSubmitFieldVerification: boolean;
  canRunSimulations: boolean;
  canExportReports: boolean;
}> = {
  ADMINISTRATOR: {
    canManageUsers: true,
    canConfigureScoring: true,
    canImportData: true,
    canCreateInterventions: true,
    canUpdateInterventions: true,
    canSubmitFieldVerification: true,
    canRunSimulations: true,
    canExportReports: true,
  },
  ANALYST: {
    canManageUsers: false,
    canConfigureScoring: false,
    canImportData: true,
    canCreateInterventions: true,
    canUpdateInterventions: true,
    canSubmitFieldVerification: true,
    canRunSimulations: true,
    canExportReports: true,
  },
  FIELD_OFFICER: {
    canManageUsers: false,
    canConfigureScoring: false,
    canImportData: false,
    canCreateInterventions: false,
    canUpdateInterventions: true,
    canSubmitFieldVerification: true,
    canRunSimulations: false,
    canExportReports: true,
  },
  VIEWER: {
    canManageUsers: false,
    canConfigureScoring: false,
    canImportData: false,
    canCreateInterventions: false,
    canUpdateInterventions: false,
    canSubmitFieldVerification: false,
    canRunSimulations: false,
    canExportReports: true,
  },
};

export function hasPermission(
  role: UserRole,
  permission: keyof typeof ROLE_PERMISSIONS["ADMINISTRATOR"]
): boolean {
  return !!ROLE_PERMISSIONS[role]?.[permission];
}
