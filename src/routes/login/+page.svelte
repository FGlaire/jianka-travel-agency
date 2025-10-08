<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let captchaToken = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let twoFactorCode = '';
  let showTwoFactorStep = false;
  let isVerifying2FA = false;

  onMount(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    // Set up global reCAPTCHA callbacks
    window.onCaptchaSuccess = onCaptchaSuccess;
    window.onCaptchaExpired = onCaptchaExpired;
    window.onCaptchaError = onCaptchaError;

    return () => {
      // Cleanup
      const existingScript = document.querySelector('script[src="https://www.google.com/recaptcha/api.js"]');
      if (existingScript) {
        existingScript.remove();
      }
      // Clean up global functions
      delete window.onCaptchaSuccess;
      delete window.onCaptchaExpired;
      delete window.onCaptchaError;
    };
  });

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  async function handleLogin(event: Event) {
    event.preventDefault();
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Verify CAPTCHA
      if (!captchaToken) {
        errorMessage = 'Please complete the CAPTCHA verification';
        isLoading = false;
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        errorMessage = error.message;
      } else {
        // Check if user has 2FA enabled
        const user = data.user;
        if (user?.user_metadata?.two_factor_enabled) {
          // Show 2FA verification step
          showTwoFactorStep = true;
          successMessage = 'Please enter your 2FA code to complete login';
        } else {
          // No 2FA, proceed with normal login
          successMessage = 'Login successful! Redirecting...';
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      }
    } catch (err) {
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  async function handle2FAVerification() {
    isVerifying2FA = true;
    errorMessage = '';
    successMessage = '';

    try {
      const response = await fetch('/api/2fa/login-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: twoFactorCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        successMessage = '2FA verification successful! Redirecting...';
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        errorMessage = data.error || 'Invalid 2FA code. Please try again.';
      }
    } catch (err) {
      errorMessage = 'Failed to verify 2FA code. Please try again.';
    } finally {
      isVerifying2FA = false;
    }
  }

  function onCaptchaSuccess(token: string) {
    captchaToken = token;
  }

  function onCaptchaExpired() {
    captchaToken = '';
  }

  function onCaptchaError() {
    captchaToken = '';
    errorMessage = 'CAPTCHA verification failed. Please try again.';
  }
</script>

<svelte:head>
  <title>Login - JIANKA Travel Agency</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>Welcome Back</h1>
      <p>Sign in to your JIANKA account</p>
    </div>

    <form on:submit={handleLogin} class="auth-form">
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

      {#if !showTwoFactorStep}
        <!-- Regular login form -->
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            bind:value={email}
            required
            disabled={isLoading}
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              bind:value={password}
              required
              disabled={isLoading}
              placeholder="Enter your password"
            />
            <button
              type="button"
              class="password-toggle"
              on:click={togglePasswordVisibility}
              disabled={isLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {#if showPassword}
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
          <div class="g-recaptcha" data-sitekey={import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'} data-callback="onCaptchaSuccess" data-expired-callback="onCaptchaExpired" data-error-callback="onCaptchaError"></div>
        </div>

        <div class="form-actions">
          <button type="submit" class="auth-button" disabled={isLoading || !captchaToken}>
            {#if isLoading}
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              Signing In...
            {:else}
              Sign In
            {/if}
          </button>
        </div>
      {:else}
        <!-- 2FA verification step -->
        <div class="form-group">
          <label for="twoFactorCode">Two-Factor Authentication Code</label>
          <input
            type="text"
            id="twoFactorCode"
            bind:value={twoFactorCode}
            required
            disabled={isVerifying2FA}
            placeholder="Enter 6-digit code from your authenticator"
            maxlength="6"
            pattern="[0-9]{6}"
          />
        </div>

        <div class="form-actions">
          <button type="button" class="auth-button" on:click={handle2FAVerification} disabled={isVerifying2FA || twoFactorCode.length !== 6}>
            {#if isVerifying2FA}
              <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
              </svg>
              Verifying...
            {:else}
              Verify Code
            {/if}
          </button>
        </div>

        <div class="form-actions">
          <button type="button" class="back-button" on:click={() => showTwoFactorStep = false} disabled={isVerifying2FA}>
            Back to Login
          </button>
        </div>
      {/if}

      <div class="auth-links">
        <a href="/forgot-password" class="forgot-password">Forgot your password?</a>
        <p>Don't have an account? <a href="/signup" class="signup-link">Sign up</a></p>
      </div>
    </form>
  </div>
</div>

<style>
  .auth-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc0 100%);
  }

  .auth-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 3rem;
    width: 100%;
    max-width: 450px;
    border: 1px solid #e0e0e0;
  }

  .auth-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .auth-header h1 {
    color: #2c2c2c;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    letter-spacing: 0.05em;
  }

  .auth-header p {
    color: #666;
    font-size: 1rem;
    margin: 0;
  }

  .auth-form {
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
    background: white;
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

  .password-input input[type="password"] {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    letter-spacing: 0.1em;
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

  .g-recaptcha {
    display: flex;
    justify-content: center;
    margin: 1rem 0;
  }

  /* Hide reCAPTCHA badge and terms */
  .g-recaptcha iframe[src*="recaptcha"] {
    filter: grayscale(100%);
  }

  /* Hide the reCAPTCHA logo/badge */
  .grecaptcha-badge {
    visibility: hidden !important;
  }

  .form-actions {
    margin-top: 1rem;
  }

  .auth-button {
    width: 100%;
    background: #cb9f4d;
    color: white;
    border: none;
    padding: 1rem;
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

  .auth-button:hover:not(:disabled) {
    background: #b88a3a;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(203, 159, 77, 0.3);
  }

  .auth-button:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .back-button {
    width: 100%;
    background: transparent;
    color: #666;
    border: 2px solid #e0e0e0;
    padding: 1rem;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 0.5rem;
  }

  .back-button:hover:not(:disabled) {
    border-color: #cb9f4d;
    color: #cb9f4d;
  }

  .back-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .spinner {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .auth-links {
    text-align: center;
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .forgot-password {
    color: #cb9f4d;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .forgot-password:hover {
    color: #b88a3a;
    text-decoration: underline;
  }

  .auth-links p {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  .signup-link {
    color: #cb9f4d;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }

  .signup-link:hover {
    color: #b88a3a;
    text-decoration: underline;
  }

  .error-message {
    background: #fee;
    color: #c33;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #fcc;
    font-size: 0.9rem;
    text-align: center;
  }

  .success-message {
    background: #efe;
    color: #363;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid #cfc;
    font-size: 0.9rem;
    text-align: center;
  }

  @media (max-width: 480px) {
    .auth-container {
      padding: 1rem;
    }

    .auth-card {
      padding: 2rem;
    }

    .auth-header h1 {
      font-size: 1.75rem;
    }
  }
</style>
