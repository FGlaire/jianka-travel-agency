<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  
  let isTransitioning = false;
  let currentPage = '';
  let transitionKey = 0;
  
  $: if ($page.route.id !== currentPage) {
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
    }, 800);
  }
  
  onMount(() => {
    currentPage = $page.route.id;
  });
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
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.9) 0%,
      rgba(26, 26, 26, 0.85) 50%,
      rgba(0, 0, 0, 0.9) 100%
    );
    backdrop-filter: blur(8px);
    transform: translateY(100%);
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .page-transition.active .transition-overlay {
    transform: translateY(0);
  }
  
  /* Enhanced page content transitions */
  :global(main) {
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
  }
  
  :global(.page-transition.active ~ main) {
    opacity: 0.2;
    transform: scale(0.95);
  }
  
  /* Smooth navigation transitions */
  :global(.menu-link) {
    transition: all 0.3s ease-out;
  }
  
  :global(.menu-link:hover) {
    transform: translateX(8px);
  }
</style>
