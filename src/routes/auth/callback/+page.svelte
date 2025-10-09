<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  onMount(async () => {
    // Check if we have a valid session after the server-side exchange
    const { data: { session }, error } = await supabase.auth.getSession();
    
    console.log('Client-side auth check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: error?.message
    });

    if (session?.user) {
      console.log('User authenticated successfully:', session.user.email);
      // Force a page reload to update the authentication state
      window.location.href = '/';
    } else {
      console.log('No valid session found, redirecting to login');
      goto('/login');
    }
  });
</script>

<div class="auth-callback">
  <div class="loading-container">
    <div class="spinner"></div>
    <h2>Completing login...</h2>
    <p>Please wait while we log you in.</p>
  </div>
</div>

<style>
  .auth-callback {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc0 100%);
  }

  .loading-container {
    text-align: center;
    background: white;
    padding: 3rem;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #cb9f4d;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  h2 {
    color: #2c2c2c;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  p {
    color: #666;
    font-size: 0.9rem;
  }
</style>
