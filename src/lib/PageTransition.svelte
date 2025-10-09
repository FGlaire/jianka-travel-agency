<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  
  let isTransitioning = false;
  let currentPage = '';
  let transitionKey = 0;
  let initialLoadComplete = false;
  let transitionTimeout: number | undefined;
  
  // Wait for initial loading screen to complete before enabling transitions
  onMount(() => {
    // Wait for loading screen to complete (2.8 seconds total) + small buffer
    setTimeout(() => {
      initialLoadComplete = true;
      currentPage = $page.route.id || '';
    }, 3000); // 3 seconds total
  });
  
  $: if (initialLoadComplete && $page.route.id !== currentPage) {
    if (currentPage !== '') {
      startTransition();
    }
    currentPage = $page.route.id || '';
    transitionKey++;
  }
  
  function startTransition() {
    // Clear any existing timeout
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
    }
    
    isTransitioning = true;
    
    // Hide all content immediately
    const main = document.querySelector('main');
    if (main) {
      main.style.opacity = '0';
      main.style.transform = 'translateY(20px)';
      main.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    }
    
    // Show transition overlay
    setTimeout(() => {
      isTransitioning = false;
      
      // Show content after transition
      if (main) {
        main.style.opacity = '1';
        main.style.transform = 'translateY(0)';
        main.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
      }
    }, 600); // Shorter transition for better UX
  }
</script>

<div class="page-transition" class:active={isTransitioning}>
  <div class="transition-overlay">
    <div class="loading-spinner">
      <div class="spinner-ring"></div>
      <div class="spinner-text">Loading...</div>
    </div>
  </div>
</div>

<style>
  .page-transition {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9998;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s ease-out;
  }
  
  .page-transition.active {
    opacity: 1;
    pointer-events: all;
  }
  
  .transition-overlay {
    width: 100%;
    height: 100%;
    background: #000000;
    transform: translateY(100%);
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .transition-overlay::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      radial-gradient(circle at 50% 10%, rgba(255, 255, 255, 0.005) 2px, transparent 2px),
      radial-gradient(circle at 10% 60%, rgba(255, 255, 255, 0.008) 1px, transparent 1px),
      radial-gradient(circle at 90% 40%, rgba(255, 255, 255, 0.006) 1px, transparent 1px);
    background-size: 100px 100px, 80px 80px, 120px 120px, 60px 60px, 90px 90px;
    animation: patternMove 30s linear infinite;
    opacity: 0.3;
  }
  
  .page-transition.active .transition-overlay {
    transform: translateY(0);
  }
  
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    z-index: 10;
  }
  
  .spinner-ring {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(203, 159, 77, 0.3);
    border-top: 3px solid #cb9f4d;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner-text {
    color: #cb9f4d;
    font-size: 1rem;
    font-weight: 300;
    letter-spacing: 0.1em;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Enhanced page content transitions */
  :global(main) {
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  
  :global(.page-transition.active) {
    z-index: 9999;
  }
  
  /* Smooth navigation transitions */
  :global(.menu-link) {
    transition: all 0.3s ease-out;
  }
  
  :global(.menu-link:hover) {
    transform: translateX(8px);
  }
  
  @keyframes patternMove {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(50px, 50px);
    }
  }
</style>
