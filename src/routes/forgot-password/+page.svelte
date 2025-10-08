<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let email = '';
  let isLoading = false;
  let errorMessage = '';
  let successMessage = '';
  let captchaToken = '';

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

  async function handleResetPassword(event: Event) {
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        errorMessage = error.message;
      } else {
        successMessage = 'Password reset email sent! Please check your inbox and follow the instructions to reset your password.';
        email = '';
        captchaToken = '';
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
  <title>Forgot Password - JIANKA Travel Agency</title>
</svelte:head>

<div class="auth-container">
  <div class="auth-card">
    <div class="auth-header">
      <h1>Forgot Password?</h1>
      <p>Enter your email address and we'll send you a link to reset your password</p>
    </div>

    <form on:submit={handleResetPassword} class="auth-form">
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
          placeholder="Enter your email address"
        />
      </div>

      <div class="form-group">
        <div class="g-recaptcha" data-sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" data-callback="onCaptchaSuccess" data-expired-callback="onCaptchaExpired" data-error-callback="onCaptchaError"></div>
      </div>

      <div class="form-actions">
        <button type="submit" class="auth-button" disabled={isLoading || !captchaToken}>
          {#if isLoading}
            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" stroke-linecap="round"/>
            </svg>
            Sending Reset Link...
          {:else}
            Send Reset Link
          {/if}
        </button>
      </div>

      <div class="auth-links">
        <p>Remember your password? <a href="/login" class="login-link">Sign in</a></p>
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
    line-height: 1.5;
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
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .auth-links p {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  .login-link, .signup-link {
    color: #cb9f4d;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
  }

  .login-link:hover, .signup-link:hover {
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
