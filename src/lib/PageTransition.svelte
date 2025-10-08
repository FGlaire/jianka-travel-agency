<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  
  let isTransitioning = false;
  let currentPage = '';
  let transitionKey = 0;
  let initialLoadComplete = false;
  
  // Wait for initial loading screen to complete before enabling transitions
  onMount(() => {
    // Wait for loading screen to complete (2.8 seconds total) + small buffer
    setTimeout(() => {
      initialLoadComplete = true;
      currentPage = $page.route.id;
    }, 3000); // 3 seconds total
  });
  
  $: if (initialLoadComplete && $page.route.id !== currentPage) {
    if (currentPage !== '') {
      startTransition();
    }
    currentPage = $page.route.id;
    transitionKey++;
  }
  
  function startTransition() {
    isTransitioning = true;
    setTimeout(() => {
      isTransitioning = false;
    }, 1000); // Slightly longer to allow content to fade in
  }
</script>

<div class="page-transition" class:active={isTransitioning}>
  <div class="transition-overlay"></div>
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
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
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
  
  /* Enhanced page content transitions */
  :global(main) {
    opacity: 0;
    transition: opacity 0.6s ease-out;
    transition-delay: 0.4s; /* Delay content appearance until transition is halfway */
  }
  
  :global(.page-transition.active ~ main) {
    opacity: 0;
    transition-delay: 0s; /* No delay when transitioning */
  }
  
  :global(.page-transition:not(.active) ~ main) {
    opacity: 1;
    transition-delay: 0.4s; /* Delay when not transitioning */
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
