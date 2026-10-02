import { computed, Injectable, signal } from '@angular/core';
import {
  AccountInfo,
  BrowserCacheLocation,
  InteractionRequiredAuthError,
  PublicClientApplication
} from '@azure/msal-browser';
import { authConfig } from '../config/auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private client?: PublicClientApplication;
  private initialization?: Promise<void>;
  private interactionPending = false;
  private readonly accountState = signal<AccountInfo | null>(null);
  readonly account = this.accountState.asReadonly();
  readonly isAuthenticated = computed(() => this.account() !== null);
  readonly displayName = computed(() => this.account()?.name ?? this.account()?.username ?? '');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  initialize(): Promise<void> {
    // Initialize Microsoft sign-in once, even if several parts of the app call this method.
    return this.initialization ??= this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    if (authConfig.clientId.startsWith('YOUR-') || authConfig.apiScope.startsWith('YOUR-')) {
      this.error.set('Microsoft sign-in needs the frontend client ID and API scope configured.');
      return;
    }

    try {
      this.client = new PublicClientApplication({
        auth: {
          clientId: authConfig.clientId,
          authority: `https://login.microsoftonline.com/${authConfig.tenantId}`,
          redirectUri: authConfig.redirectUri,
          postLogoutRedirectUri: authConfig.postLogoutRedirectUri,
          navigateToLoginRequestUrl: true
        },
        cache: { cacheLocation: BrowserCacheLocation.SessionStorage }
      });
      // Process the Microsoft redirect before choosing the signed-in account.
      await this.client.initialize();
      const response = await this.client.handleRedirectPromise();
      const account = response?.account ?? this.client.getActiveAccount()
        ?? this.client.getAllAccounts()[0] ?? null;
      this.client.setActiveAccount(account);
      this.accountState.set(account);
    } catch {
      this.client = undefined;
      this.error.set('Microsoft sign-in could not initialize. Reload the page to try again.');
    }
  }

  async signIn(): Promise<void> {
    await this.initialize();
    if (!this.client || this.interactionPending) return;
    this.interactionPending = true;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.client.loginRedirect({
        scopes: [authConfig.apiScope],
        prompt: 'select_account',
        redirectStartPage: `${window.location.origin}/`
      });
    } catch {
      this.error.set('Sign-in could not start. Please try again.');
    } finally {
      this.interactionPending = false;
      this.busy.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.initialize();
    if (!this.client || this.interactionPending) return;
    this.interactionPending = true;
    this.busy.set(true);
    this.error.set(null);
    try {
      await this.client.logoutRedirect({ account: this.account() });
    } catch {
      this.error.set('Sign-out could not start. Please try again.');
    } finally {
      this.interactionPending = false;
      this.busy.set(false);
    }
  }

  async getAccessToken(): Promise<string> {
    await this.initialize();
    const account = this.account();
    if (!this.client || !account) throw new Error('Sign in before requesting tickets.');
    try {
      // Get a token silently; redirect only when Microsoft requires user interaction.
      const response = await this.client.acquireTokenSilent({
        account,
        scopes: [authConfig.apiScope]
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError && !this.interactionPending) {
        this.interactionPending = true;
        this.busy.set(true);
        try {
          await this.client.acquireTokenRedirect({ account, scopes: [authConfig.apiScope] });
        } finally {
          this.interactionPending = false;
          this.busy.set(false);
        }
      }
      throw error;
    }
  }
}
