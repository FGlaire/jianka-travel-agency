
<script lang="ts">
	import '../app.css';
	import Lenis from 'lenis';
	import { onMount } from 'svelte';
    import Nav from '../lib/Nav.svelte';
    import LoadingScreen from '../lib/LoadingScreen.svelte';
    import PageTransition from '../lib/PageTransition.svelte';
    import type { LayoutData } from './$types';

	let { children, data } = $props<{ children: any; data: LayoutData }>();

	onMount(() => {
		const lenis = new Lenis({
			smoothWheel: true,
			syncTouch: true
		});

		// expose for animation libraries
		// @ts-ignore
		window.lenis = lenis;

		function raf(time: number) {
			lenis.raf(time);
			requestAnimationFrame(raf);
		}

		requestAnimationFrame(raf);
	});
</script>


<div class="app">
  <LoadingScreen />
  <Nav user={data.user} />

	<main>
		{@render children()}
	</main>
  
  <PageTransition />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		position: relative;
	}

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding-left: 0; /* no gutter by default */
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Smooth page transitions */
  :global(.page-enter) {
    opacity: 0;
    transform: translateY(20px);
  }
  
  :global(.page-enter-active) {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
  }
  
  :global(.page-exit) {
    opacity: 1;
    transform: translateY(0);
  }
  
  :global(.page-exit-active) {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.3s ease-in, transform 0.3s ease-in;
  }
  
  @media (max-width: 800px) {
    main { padding-left: 0; }
  }

  /* footer removed for landing focus */
</style>
