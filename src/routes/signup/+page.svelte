<script lang="ts">
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let confirmPassword = '';
  let showPassword = false;
  let showConfirmPassword = false;
  let captchaToken = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';

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

  function toggleConfirmPasswordVisibility() {
    showConfirmPassword = !showConfirmPassword;
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

  async function handleSignup(event: Event) {
    event.preventDefault();
    isLoading = true;
    errorMessage = '';
    successMessage = '';

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        errorMessage = 'Passwords do not match';
        isLoading = false;
        return;
      }

      // Validate password strength
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errorMessage = passwordErrors.join('. ');
        isLoading = false;
        return;
      }

      // Verify CAPTCHA
      if (!captchaToken) {
        errorMessage = 'Please complete the CAPTCHA verification';
        isLoading = false;
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `https://jianka-travel-agency-p19dy0y1y-fglaires-projects.vercel.app/auth/callback`
        }
      });

      if (error) {
        errorMessage = error.message;
      } else {
        successMessage = 'Account created successfully! Please check your email to verify your account.';
        // Clear form
        email = '';
        password = '';
        confirmPassword = '';
        captchaToken = '';
        // Redirect to login after a delay
        setTimeout(() => {
          goto('/login');
        }, 3000);
      }
    } catch (err) {
      errorMessage = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
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
  <title>Sign Up - JIANKA Travel Agency</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>Create Account</h1>
      <p>Join JIANKA and start your travel journey</p>
    </div>

    <form on:submit={handleSignup} class="auth-form">
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
            placeholder="Create a strong password"
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
        <div class="password-requirements">
          <p>Password must contain:</p>
          <ul>
            <li class={password.length >= 8 ? 'valid' : 'invalid'}>At least 8 characters</li>
            <li class={/[A-Z]/.test(password) ? 'valid' : 'invalid'}>One uppercase letter</li>
            <li class={/[a-z]/.test(password) ? 'valid' : 'invalid'}>One lowercase letter</li>
            <li class={/\d/.test(password) ? 'valid' : 'invalid'}>One number</li>
            <li class={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : 'invalid'}>One special character</li>
          </ul>
        </div>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <div class="password-input">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            bind:value={confirmPassword}
            required
            disabled={isLoading}
            placeholder="Confirm your password"
          />
          <button
            type="button"
            class="password-toggle"
            on:click={toggleConfirmPasswordVisibility}
            disabled={isLoading}
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
        {#if confirmPassword && password !== confirmPassword}
          <div class="password-mismatch">Passwords do not match</div>
        {/if}
      </div>

      <div class="form-group">
        <div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" data-callback="onCaptchaSuccess" data-expired-callback="onCaptchaExpired" data-error-callback="onCaptchaError"></div>
      </div>

      <div class="form-actions">
        <button type="submit" class="auth-button" disabled={isLoading || !captchaToken || password !== confirmPassword}>
          {#if isLoading}
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
            </svg>
            Creating Account...
          {:else}
            Create Account
          {/if}
        </button>
      </div>

      <div class="auth-links">
        <p>Already have an account? <a href="/login" class="login-link">Sign in</a></p>
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
    max-width: 500px;
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

  .password-requirements {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: #f8f9fa;
    border-radius: 6px;
    border: 1px solid #e9ecef;
  }

  .password-requirements p {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    color: #666;
    font-weight: 600;
  }

  .password-requirements ul {
    margin: 0;
    padding-left: 1.2rem;
    list-style: none;
  }

  .password-requirements li {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
    position: relative;
  }

  .password-requirements li::before {
    content: '';
    position: absolute;
    left: -1.2rem;
    top: 0.3rem;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #dc3545;
  }

  .password-requirements li.valid::before {
    background: #28a745;
  }

  .password-requirements li.valid {
    color: #28a745;
  }

  .password-requirements li.invalid {
    color: #dc3545;
  }

  .password-mismatch {
    color: #dc3545;
    font-size: 0.85rem;
    margin-top: 0.25rem;
  }

  .g-recaptcha {
    display: none;
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
  }

  .auth-links p {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  .login-link {
    color: #cb9f4d;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }

  .login-link:hover {
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
