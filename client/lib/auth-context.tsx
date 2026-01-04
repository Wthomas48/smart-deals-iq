import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000";

// Demo mode - set to true for testing, false for production with real API
const DEMO_MODE_ENABLED = false;

export type UserRole = "customer" | "vendor" | "admin";

// Demo users for testing without backend
const DEMO_USERS: Record<string, { password: string; user: Omit<User, 'name'> }> = {
  "customer@demo.com": {
    password: "demo1234",
    user: {
      id: "demo_customer_1",
      email: "customer@demo.com",
      username: "democustomer",
      role: "customer",
      firstName: "Demo",
      lastName: "Customer",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  "vendor@demo.com": {
    password: "demo1234",
    user: {
      id: "demo_vendor_1",
      email: "vendor@demo.com",
      username: "demovendor",
      role: "vendor",
      firstName: "Demo",
      lastName: "Vendor",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
};

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed display name for backward compatibility
  name: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsVendor: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

interface SignupData {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@smartdealsiq_auth";
const TOKENS_STORAGE_KEY = "@smartdealsiq_tokens";

// Helper to make authenticated API requests with timeout
async function authFetch(
  endpoint: string,
  options: RequestInit = {},
  accessToken?: string | null,
  timeoutMs: number = 5000
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (accessToken) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
  }

  // Add timeout for mobile - prevents hanging on unreachable server
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server not responding');
    }
    throw error;
  }
}

// Add computed name field from firstName/lastName for backward compatibility
function addDisplayName(userData: any): User {
  const firstName = userData.firstName || "";
  const lastName = userData.lastName || "";
  const name = [firstName, lastName].filter(Boolean).join(" ") || userData.username || userData.email?.split("@")[0] || "User";
  return { ...userData, name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedUser, storedTokens] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(TOKENS_STORAGE_KEY),
      ]);

      if (storedUser && storedTokens) {
        const parsedUser = JSON.parse(storedUser) as User;
        const parsedTokens = JSON.parse(storedTokens) as AuthTokens;

        // Verify token is still valid by fetching current user
        try {
          const response = await authFetch("/api/auth/me", {}, parsedTokens.accessToken);

          if (response.ok) {
            const data = await response.json();
            setUser(addDisplayName(data.user));
            setTokens(parsedTokens);
            if (__DEV__) console.log("[Auth] Token verified, user loaded from server");
          } else if (response.status === 401) {
            // Token expired - try to refresh
            if (__DEV__) console.log("[Auth] Token expired, attempting refresh");
            const refreshed = await refreshTokens(parsedTokens.refreshToken);
            if (!refreshed) {
              if (__DEV__) console.log("[Auth] Refresh failed, clearing auth");
              await clearAuth();
            }
          } else {
            // Server returned other error (404, 500, etc.)
            // Use stored user data - don't log out just because server had an issue
            if (__DEV__) console.log("[Auth] Server returned", response.status, "- using stored user");
            setUser(parsedUser);
            setTokens(parsedTokens);
          }
        } catch {
          // Network error - use stored user but try to refresh later
          if (__DEV__) console.log("[Auth] Network error - using stored user");
          setUser(parsedUser);
          setTokens(parsedTokens);
        }
      }
    } catch (error) {
      console.error("[Auth] Failed to load stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTokens = async (refreshToken: string): Promise<boolean> => {
    try {
      const response = await authFetch("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const newTokens = await response.json();
        setTokens(newTokens);
        await AsyncStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(newTokens));

        // Fetch updated user
        const userResponse = await authFetch("/api/auth/me", {}, newTokens.accessToken);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userWithName = addDisplayName(userData.user);
          setUser(userWithName);
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithName));
        }

        return true;
      }
    } catch (error) {
      console.error("[Auth] Token refresh failed:", error);
    }
    return false;
  };

  const clearAuth = async () => {
    setUser(null);
    setTokens(null);
    // Clear all auth-related data including vendor listing cache
    await Promise.all([
      AsyncStorage.removeItem(AUTH_STORAGE_KEY),
      AsyncStorage.removeItem(TOKENS_STORAGE_KEY),
      AsyncStorage.removeItem("@smartdealsiq_vendor_listing"),
      AsyncStorage.removeItem("@smartdealsiq_subscription"),
    ]);
  };

  const saveAuth = async (userData: any, authTokens: AuthTokens) => {
    const userWithName = addDisplayName(userData);
    if (__DEV__) console.log("[Auth] saveAuth called - setting user:", userWithName.email, "role:", userWithName.role);
    setUser(userWithName);
    setTokens(authTokens);
    await Promise.all([
      AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithName)),
      AsyncStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(authTokens)),
    ]);
    if (__DEV__) console.log("[Auth] saveAuth complete - user and tokens set");
  };

  const loginWithRole = async (email: string, password: string, intendedRole: UserRole = "customer") => {
    let response: Response;
    try {
      response = await authFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role: intendedRole }),
      });
    } catch (networkError) {
      console.error("[Auth] Network error during login:", networkError);

      // Fallback to demo mode if enabled
      if (DEMO_MODE_ENABLED) {
        if (__DEV__) console.log("[Auth] Server unavailable, using demo mode...");
        const demoUser = DEMO_USERS[email.toLowerCase()];

        if (demoUser && demoUser.password === password) {
          const userWithName = addDisplayName(demoUser.user);
          await saveAuth(userWithName, {
            accessToken: `demo_token_${Date.now()}`,
            refreshToken: `demo_refresh_${Date.now()}`,
          });
          if (__DEV__) console.log("[Auth] Demo login successful:", email);
          return;
        } else {
          // Allow any email/password in demo mode - create a new demo user with intended role
          const newDemoUser = {
            id: `demo_${Date.now()}`,
            email: email.toLowerCase(),
            username: email.split("@")[0],
            role: intendedRole,
            firstName: email.split("@")[0],
            lastName: "",
            emailVerified: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          const userWithName = addDisplayName(newDemoUser);
          await saveAuth(userWithName, {
            accessToken: `demo_token_${Date.now()}`,
            refreshToken: `demo_refresh_${Date.now()}`,
          });
          if (__DEV__) console.log(`[Auth] Demo login (${intendedRole}) successful:`, email);
          return;
        }
      }

      throw new Error("Unable to connect to server. Please check your internet connection and try again.");
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[Auth] Failed to parse login response:", parseError);
      throw new Error("Server returned an invalid response. Please try again.");
    }

    if (!response.ok) {
      throw new Error(data?.error || "Login failed. Please check your credentials.");
    }

    await saveAuth(data.user, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });

    if (__DEV__) console.log("[Auth] Login successful:", data.user.email);
  };

  const login = async (email: string, password: string) => {
    await loginWithRole(email, password, "customer");
  };

  const loginAsVendor = async (email: string, password: string) => {
    await loginWithRole(email, password, "vendor");
  };

  const signup = async (signupData: SignupData) => {
    let response: Response;
    try {
      response = await authFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(signupData),
      });
    } catch (networkError) {
      console.error("[Auth] Network error during signup:", networkError);

      // Fallback to demo mode if enabled
      if (DEMO_MODE_ENABLED) {
        if (__DEV__) console.log("[Auth] Server unavailable, creating demo account...");
        const newDemoUser = {
          id: `demo_${Date.now()}`,
          email: signupData.email.toLowerCase(),
          username: signupData.username,
          role: signupData.role,
          firstName: signupData.firstName || signupData.username,
          lastName: signupData.lastName || "",
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const userWithName = addDisplayName(newDemoUser);
        await saveAuth(userWithName, {
          accessToken: `demo_token_${Date.now()}`,
          refreshToken: `demo_refresh_${Date.now()}`,
        });
        if (__DEV__) console.log("[Auth] Demo signup successful:", signupData.email);
        return;
      }

      throw new Error("Unable to connect to server. Please check your internet connection and try again.");
    }

    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseError) {
      console.error("[Auth] Failed to parse signup response:", parseError);
      throw new Error("Server returned an invalid response. Please try again.");
    }

    if (!response.ok) {
      throw new Error(responseData?.error || "Registration failed. Please try again.");
    }

    await saveAuth(responseData.user, {
      accessToken: responseData.accessToken,
      refreshToken: responseData.refreshToken,
    });

    if (__DEV__) console.log("[Auth] Signup successful:", responseData.user.email);
  };

  const logout = async () => {
    try {
      if (tokens?.refreshToken) {
        await authFetch(
          "/api/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
          },
          tokens.accessToken
        );
      }
    } catch (error) {
      console.error("[Auth] Logout API call failed:", error);
    }

    await clearAuth();
    if (__DEV__) console.log("[Auth] Logged out");
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!tokens?.accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await authFetch(
      "/api/auth/profile",
      {
        method: "PUT",
        body: JSON.stringify(updates),
      },
      tokens.accessToken
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    const userWithName = addDisplayName(data.user);
    setUser(userWithName);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userWithName));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!tokens?.accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await authFetch(
      "/api/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      tokens.accessToken
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to change password");
    }
  };

  const deleteAccount = async (password: string) => {
    if (!tokens?.accessToken) {
      throw new Error("Not authenticated");
    }

    const response = await authFetch(
      "/api/auth/account",
      {
        method: "DELETE",
        body: JSON.stringify({ password }),
      },
      tokens.accessToken
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete account");
    }

    await clearAuth();
  };

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (!tokens?.refreshToken) return false;
    return refreshTokens(tokens.refreshToken);
  }, [tokens]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !!tokens,
        accessToken: tokens?.accessToken || null,
        login,
        loginAsVendor,
        signup,
        logout,
        updateUser,
        changePassword,
        deleteAccount,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for making authenticated API requests
export function useAuthFetch() {
  const { accessToken, refreshAuth } = useAuth();

  return useCallback(
    async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
      let response = await authFetch(endpoint, options, accessToken);

      // If unauthorized, try to refresh token and retry
      if (response.status === 401) {
        const refreshed = await refreshAuth();
        if (refreshed) {
          // Get fresh token from context won't work immediately,
          // so we need to get it from storage
          const storedTokens = await AsyncStorage.getItem(TOKENS_STORAGE_KEY);
          if (storedTokens) {
            const { accessToken: newToken } = JSON.parse(storedTokens);
            response = await authFetch(endpoint, options, newToken);
          }
        }
      }

      return response;
    },
    [accessToken, refreshAuth]
  );
}
