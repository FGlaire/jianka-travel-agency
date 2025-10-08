
<script lang="ts">
	import '../app.css';
	import Lenis from 'lenis';
	import { onMount } from 'svelte';
    import Nav from '../lib/Nav.svelte';
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
  <Nav user={data.user} />

	<main>
		{@render children()}
	</main>

</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding-left: 0; /* no gutter by default */
  }
  
  
  @media (max-width: 800px) {
    main { padding-left: 0; }
  }

  /* footer removed for landing focus */
</style>
