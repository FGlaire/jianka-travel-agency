<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  let count = 0;
  let isLoading = true;
  let showBrand = false;
  
  onMount(() => {
    // Show brand after a short delay
    setTimeout(() => {
      showBrand = true;
    }, 500);
    
    const interval = setInterval(() => {
      count += 1;
      if (count >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          isLoading = false;
        }, 300);
      }
    }, 25); // 25ms intervals for smooth countdown
    
    return () => clearInterval(interval);
  });
</script>

{#if isLoading}
  <div class="loading-screen" transition:fade={{ duration: 800 }}>
    <div class="loading-content">
      <div class="countdown" transition:fly={{ y: 50, duration: 600, delay: 200 }}>
        {String(count).padStart(3, '0')}
      </div>
      {#if showBrand}
        <div class="loading-text" transition:fly={{ y: 30, duration: 500, delay: 400 }}>
          JIANKA
        </div>
        <div class="loading-subtitle" transition:fly={{ y: 20, duration: 400, delay: 600 }}>
          Travel Agency
        </div>
      {/if}
    </div>
    
    <!-- Subtle background pattern -->
    <div class="loading-pattern"></div>
  </div>
{/if}

<style>
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    overflow: hidden;
  }
  
  .loading-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    position: relative;
    z-index: 2;
  }
  
  .countdown {
    font-family: var(--font-satoshi);
    font-size: clamp(4rem, 12vw, 8rem);
    font-weight: 300;
    color: #ffffff;
    letter-spacing: 0.1em;
    line-height: 1;
    text-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
    animation: pulse 2s ease-in-out infinite;
    position: relative;
  }
  
  .countdown::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 120%;
    height: 120%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    animation: ripple 3s ease-in-out infinite;
  }
  
  .loading-text {
    font-family: var(--font-satoshi);
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 300;
    color: #ffffff;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.9;
  }
  
  .loading-subtitle {
    font-family: var(--font-satoshi);
    font-size: clamp(0.9rem, 2.5vw, 1.2rem);
    font-weight: 300;
    color: #9a9a9a;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    opacity: 0.7;
  }
  
  .loading-pattern {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: patternMove 20s linear infinite;
    z-index: 1;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
  
  @keyframes ripple {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.3;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0.1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.3;
    }
  }
  
  @keyframes patternMove {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(50px, 50px);
    }
  }
  
  /* Hide loading screen when not loading */
  :global(.loading-screen.hidden) {
    opacity: 0;
    pointer-events: none;
  }
</style>
