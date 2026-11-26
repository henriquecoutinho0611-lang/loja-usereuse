import { useCallback, useState } from "react";
import type { AccountProfile, AuthResponse } from "../app/models";
import type { UserRole } from "../routes/types";

function normalizeRole(role: string | null): UserRole {
  if (!role) return null;
  const lower = role.toLowerCase();
  return lower === "customer" || lower === "merchant" ? lower : null;
}

function readSavedRole(): UserRole {
  if (!sessionStorage.getItem("loja_access_token")) return null;
  return normalizeRole(sessionStorage.getItem("loja_user_role"));
}

function readSavedAccount(role: UserRole): AccountProfile | null {
  if (!role || !sessionStorage.getItem("loja_access_token")) return null;
  return {
    id: sessionStorage.getItem("loja_user_id") || "",
    role: role.toUpperCase(),
    email: sessionStorage.getItem("loja_user_email") || "",
    name: sessionStorage.getItem("loja_user_name") || "",
    phone: sessionStorage.getItem("loja_user_phone") || "",
  };
}

export function useAuth() {
  const [role, setRole] = useState<UserRole>(readSavedRole);
  const [account, setAccount] = useState<AccountProfile | null>(() => readSavedAccount(readSavedRole()));

  function saveSession(response: AuthResponse): AccountProfile {
    const normalizedRole = normalizeRole(response.role);
    sessionStorage.setItem("loja_access_token", response.accessToken);
    sessionStorage.setItem("loja_user_role", normalizedRole || response.role.toLowerCase());
    sessionStorage.setItem("loja_user_email", response.email);
    sessionStorage.setItem("loja_user_name", response.name || "");
    sessionStorage.setItem("loja_user_phone", response.phone || "");
    const profile: AccountProfile = {
      id: "",
      name: response.name,
      email: response.email,
      phone: response.phone || "",
      role: (normalizedRole || response.role).toUpperCase(),
    };
    setRole(normalizedRole);
    setAccount(profile);
    return profile;
  }

  function updateAccount(profile: AccountProfile): void {
    setAccount(profile);
    sessionStorage.setItem("loja_user_id", profile.id);
    sessionStorage.setItem("loja_user_email", profile.email);
    sessionStorage.setItem("loja_user_name", profile.name);
    sessionStorage.setItem("loja_user_phone", profile.phone || "");
  }

  const clearSession = useCallback((): void => {
    ["loja_access_token", "loja_user_role", "loja_user_id", "loja_user_email", "loja_user_name", "loja_user_phone"]
      .forEach((key) => sessionStorage.removeItem(key));
    setRole(null);
    setAccount(null);
  }, []);

  return { role, account, saveSession, updateAccount, clearSession };
}
