<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect to home page and scroll to about section
    goto('/#about');
  });
</script>

<svelte:head>
  <title>About - JIANKA Travel Agency</title>
  <meta name="description" content="JIANKA Travel Agency designs immersive travel experiences, blending culture, food and architecture." />
</svelte:head>

<div class="redirect-message">
  <p>Redirecting to About section...</p>
</div>

<style>
  .redirect-message {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: 'Inter', sans-serif;
    color: #2c2c2c;
  }
</style>
