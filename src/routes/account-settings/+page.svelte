<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  let user: any = $state(null);
  let isLoading = $state(true);
  let errorMessage = $state('');
  let successMessage = $state('');

  // Password change
  let currentPassword = $state('');
  let newPassword = $state('');
  let confirmPassword = $state('');
  let showCurrentPassword = $state(false);
  let showNewPassword = $state(false);
  let showConfirmPassword = $state(false);
  let isChangingPassword = $state(false);

  // 2FA
  let twoFactorSecret = $state('');
  let twoFactorQrCode = $state('');
  let twoFactorCode = $state('');
  let is2FAEnabled = $state(false);
  let isSettingUp2FA = $state(false);
  let isVerifying2FA = $state(false);

  onMount(async () => {
    await checkAuth();
    await loadUserData();
  });

  async function checkAuth() {
    const { data: { user: authUser }, error } = await supabase.auth.getUser();
    if (error || !authUser) {
      goto('/login');
      return;
    }
    user = authUser;
  }

  async function loadUserData() {
    try {
      // Check if 2FA is enabled (you would store this in your user metadata or a separate table)
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.user_metadata?.two_factor_enabled) {
        is2FAEnabled = true;
      }
    } catch (err) {
      errorMessage = 'Failed to load user data';
    } finally {
      isLoading = false;
    }
  }

  function togglePasswordVisibility(field: string) {
    switch (field) {
      case 'current':
        showCurrentPassword = !showCurrentPassword;
        break;
      case 'new':
        showNewPassword = !showNewPassword;
        break;
      case 'confirm':
        showConfirmPassword = !showConfirmPassword;
        break;
    }
  }

  function validatePassword(password: string): string[] {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    return errors;
  }

  async function handlePasswordChange(event: Event) {
    event.preventDefault();
    isChangingPassword = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        errorMessage = 'New passwords do not match';
        isChangingPassword = false;
        return;
      }

      // Validate password strength
      const passwordErrors = validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        errorMessage = passwordErrors.join('. ');
        isChangingPassword = false;
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        errorMessage = error.message;
      } else {
        successMessage = 'Password updated successfully!';
        currentPassword = '';
        newPassword = '';
        confirmPassword = '';
      }
    } catch (err) {
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isChangingPassword = false;
    }
  }

  async function setup2FA() {
    isSettingUp2FA = true;
    errorMessage = '';
    successMessage = '';

    try {
      // First, refresh the session to ensure we have valid auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        errorMessage = 'Please log in again to set up 2FA';
        return;
      }

      const response = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        twoFactorSecret = data.secret;
        twoFactorQrCode = data.qrCode;
      } else {
        errorMessage = data.error || 'Failed to generate 2FA setup. Please try again.';
      }
    } catch (err) {
      errorMessage = 'Failed to generate 2FA setup. Please try again.';
    } finally {
      isSettingUp2FA = false;
    }
  }

  async function verify2FASetup() {
    isVerifying2FA = true;
    errorMessage = '';
    successMessage = '';

    try {
      // First, refresh the session to ensure we have valid auth
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        errorMessage = 'Please log in again to verify 2FA';
        return;
      }

      console.log('Sending verification request with:', {
        secret: twoFactorSecret,
        code: twoFactorCode
      });

      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          secret: twoFactorSecret,
          code: twoFactorCode
        })
      });

      const data = await response.json();
      console.log('Verification response:', data);

      if (response.ok) {
        // Update user metadata on the client side
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            two_factor_enabled: true,
            two_factor_secret: data.secret
          }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          errorMessage = '2FA verification successful, but failed to save settings. Please try again.';
        } else {
          successMessage = '2FA enabled successfully!';
          is2FAEnabled = true;
          twoFactorSecret = '';
          twoFactorQrCode = '';
          twoFactorCode = '';
        }
      } else {
        errorMessage = data.error || 'Invalid verification code. Please try again.';
      }
    } catch (err) {
      console.error('Verification error:', err);
      errorMessage = 'Failed to verify 2FA setup. Please try again.';
    } finally {
      isVerifying2FA = false;
    }
  }

  async function disable2FA() {
    errorMessage = '';
    successMessage = '';

    try {
      // Update user metadata on the client side to disable 2FA
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          two_factor_enabled: false,
          two_factor_secret: null
        }
      });

      if (updateError) {
        console.error('Error updating user metadata:', updateError);
        errorMessage = 'Failed to disable 2FA. Please try again.';
      } else {
        successMessage = '2FA disabled successfully!';
        is2FAEnabled = false;
      }
    } catch (err) {
      console.error('Disable 2FA error:', err);
      errorMessage = 'Failed to disable 2FA. Please try again.';
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/');
  }
</script>

<svelte:head>
  <title>Account Settings - JIANKA Travel Agency</title>
</svelte:head>

{#if isLoading}
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Loading account settings...</p>
  </div>
{:else}
  <div class="settings-container">
    <div class="settings-header">
      <h1>Account Settings</h1>
      <p>Manage your account preferences and security settings</p>
    </div>

    {#if errorMessage}
      <div class="error-message">
        {errorMessage}
      </div>
    {/if}

    {#if successMessage}
      <div class="success-message">
        {successMessage}
      </div>
    {/if}

    <div class="settings-grid">
      <!-- User Info -->
      <div class="settings-card">
        <h2>Account Information</h2>
        <div class="user-info">
          <div class="info-item">
            <strong>Email:</strong>
            <span>{user?.email}</span>
          </div>
          <div class="info-item">
            <strong>User ID:</strong>
            <span class="user-id">{user?.id}</span>
          </div>
          <div class="info-item">
            <strong>Account Created:</strong>
            <span>{new Date(user?.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <!-- Password Change -->
      <div class="settings-card">
        <h2>Change Password</h2>
        <form onsubmit={handlePasswordChange} class="settings-form">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <div class="password-input">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                bind:value={currentPassword}
                required
                disabled={isChangingPassword}
                placeholder="Enter current password"
              />
              <button
                type="button"
                class="password-toggle"
                onclick={() => togglePasswordVisibility('current')}
                disabled={isChangingPassword}
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {#if showCurrentPassword}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                {:else}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="newPassword">New Password</label>
            <div class="password-input">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                bind:value={newPassword}
                required
                disabled={isChangingPassword}
                placeholder="Enter new password"
              />
              <button
                type="button"
                class="password-toggle"
                onclick={() => togglePasswordVisibility('new')}
                disabled={isChangingPassword}
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {#if showNewPassword}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                {:else}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                {/if}
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <div class="password-input">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                bind:value={confirmPassword}
                required
                disabled={isChangingPassword}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                class="password-toggle"
                onclick={() => togglePasswordVisibility('confirm')}
                disabled={isChangingPassword}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {#if showConfirmPassword}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                {:else}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                {/if}
              </button>
            </div>
            {#if confirmPassword && newPassword !== confirmPassword}
              <div class="password-mismatch">Passwords do not match</div>
            {/if}
          </div>

          <button type="submit" class="settings-button" disabled={isChangingPassword || newPassword !== confirmPassword}>
            {#if isChangingPassword}
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              Updating Password...
            {:else}
              Update Password
            {/if}
          </button>
        </form>
      </div>

      <!-- Two-Factor Authentication -->
      <div class="settings-card">
        <h2>Two-Factor Authentication</h2>
        <div class="two-factor-section">
          {#if is2FAEnabled}
            <div class="two-factor-status enabled">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M13 12h3a2 2 0 0 1 2 2v1"/>
                <path d="M9 12H6a2 2 0 0 0-2 2v1"/>
              </svg>
              <span>2FA is enabled</span>
            </div>
            <button type="button" class="settings-button danger" onclick={disable2FA}>
              Disable 2FA
            </button>
          {:else}
            <div class="two-factor-status disabled">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M13 12h3a2 2 0 0 1 2 2v1"/>
                <path d="M9 12H6a2 2 0 0 0-2 2v1"/>
              </svg>
              <span>2FA is disabled</span>
            </div>
            
            {#if !twoFactorQrCode}
              <button type="button" class="settings-button" onclick={setup2FA} disabled={isSettingUp2FA}>
                {#if isSettingUp2FA}
                  <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
                  </svg>
                  Setting up...
                {:else}
                  Enable 2FA
                {/if}
              </button>
            {:else}
              <div class="two-factor-setup">
                <p>Scan this QR code with your authenticator app:</p>
                <img src={twoFactorQrCode} alt="2FA QR Code" class="qr-code" />
                
                <div class="setup-key-section">
                  <p><strong>Or enter this setup key manually:</strong></p>
                  <div class="setup-key-container">
                    <code class="setup-key">{twoFactorSecret}</code>
                    <button 
                      type="button" 
                      class="copy-button" 
                      onclick={() => navigator.clipboard.writeText(twoFactorSecret)}
                      title="Copy setup key"
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="twoFactorCode">Enter verification code:</label>
                  <input
                    type="text"
                    id="twoFactorCode"
                    bind:value={twoFactorCode}
                    placeholder="Enter 6-digit code"
                    maxlength="6"
                    class="verification-input"
                  />
                </div>
                <div class="two-factor-actions">
                  <button type="button" class="settings-button" onclick={verify2FASetup} disabled={isVerifying2FA || twoFactorCode.length !== 6}>
                    {#if isVerifying2FA}
                      <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
                      </svg>
                      Verifying...
                    {:else}
                      Verify & Enable
                    {/if}
                  </button>
                  <button type="button" class="settings-button secondary" onclick={() => { twoFactorQrCode = ''; twoFactorCode = ''; }}>
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </div>

      <!-- Account Actions -->
      <div class="settings-card">
        <h2>Account Actions</h2>
        <div class="account-actions">
          <button type="button" class="settings-button danger" onclick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .loading-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .settings-container {
    min-height: 100vh;
    padding: 2rem;
    background: #000000;
    color: #ffffff;
  }

  .settings-header {
    text-align: center;
    margin-bottom: 3rem;
    color: #ffffff;
  }
  
  .settings-header h1 {
    color: #ffffff;
    margin-bottom: 0.5rem;
  }
  
  .settings-header p {
    color: #9a9a9a;
  }

  .settings-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.05em;
  }

  .settings-header p {
    font-size: 1.1rem;
    margin: 0;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .settings-card {
    background: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    padding: 2rem;
    border: 1px solid #333333;
    color: #ffffff;
  }

  .settings-card h2 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1.5rem 0;
    letter-spacing: 0.05em;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-item strong {
    font-weight: 600;
    color: #666;
  }

  .info-item span {
    color: #2c2c2c;
  }

  .user-id {
    font-family: monospace;
    font-size: 0.85rem;
    background: #f5f5f5;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-group label {
    color: #2c2c2c;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.05em;
  }

  .form-group input {
    padding: 0.875rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white !important;
    background-color: white !important;
  }

  /* Override browser autofill styling */
  .form-group input:-webkit-autofill,
  .form-group input:-webkit-autofill:hover,
  .form-group input:-webkit-autofill:focus,
  .form-group input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: #2c2c2c !important;
    background-color: white !important;
  }

  .form-group input:focus {
    outline: none;
    border-color: #cb9f4d;
    box-shadow: 0 0 0 3px rgba(203, 159, 77, 0.1);
  }

  .form-group input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .password-input {
    position: relative;
  }

  .password-toggle {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    color: #666;
    transition: color 0.3s ease;
  }

  .password-toggle:hover {
    color: #cb9f4d;
  }

  .password-toggle:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .password-mismatch {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .settings-button {
    background: #cb9f4d;
    color: white;
    border: none;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .settings-button:hover:not(:disabled) {
    background: #b88a3a;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(203, 159, 77, 0.3);
  }

  .settings-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .settings-button.danger {
    background: #dc3545;
  }

  .settings-button.danger:hover:not(:disabled) {
    background: #c82333;
  }

  .settings-button.secondary {
    background: #6c757d;
  }

  .settings-button.secondary:hover:not(:disabled) {
    background: #5a6268;
  }

  .two-factor-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .two-factor-status {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    font-weight: 600;
  }

  .two-factor-status.enabled {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .two-factor-status.disabled {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .two-factor-setup {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .two-factor-setup p {
    margin: 0;
    color: #666;
    text-align: center;
  }

  .qr-code {
    width: 200px;
    height: 200px;
    margin: 0 auto;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }

  .verification-input {
    text-align: center;
    font-size: 1.2rem;
    letter-spacing: 0.2em;
    font-family: monospace;
  }

  .setup-key-section {
    margin: 1.5rem 0;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #e9ecef;
  }

  .setup-key-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .setup-key {
    flex: 1;
    background: #fff;
    padding: 0.75rem;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
    word-break: break-all;
    user-select: all;
    color: black;
  }

  .copy-button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    white-space: nowrap;
    transition: background-color 0.2s;
  }

  .copy-button:hover {
    background: #0056b3;
  }

  .two-factor-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .account-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #fcc;
    font-size: 0.9rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .success-message {
    background: #efe;
    color: #363;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #cfc;
    font-size: 0.9rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    .settings-container {
      padding: 1rem;
    }

    .settings-grid {
      grid-template-columns: 1fr;
    }

    .settings-card {
      padding: 1.5rem;
    }

    .settings-header h1 {
      font-size: 2rem;
    }

    .two-factor-actions {
      flex-direction: column;
    }
  }
</style>
