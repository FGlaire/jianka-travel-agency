<script lang="ts">
	import { onMount } from 'svelte';

	let words = ['All', 'roads', 'lead', 'to', 'rome'];

	onMount(async () => {
		// Wait for loading screen to complete (3 seconds + 300ms buffer)
		await new Promise(resolve => setTimeout(resolve, 3300));
		
		// Dynamically import GSAP only on client to avoid SSR errors
		const gsapMod = await import('gsap');
		const stMod = await import('gsap/ScrollTrigger');
		const gsap = gsapMod.default;
		gsap.registerPlugin(stMod.ScrollTrigger);

		// Check if device is mobile
		const isMobile = window.innerWidth <= 768;
		
		// Fade in the main content first
		gsap.fromTo('.hero-content', 
			{ opacity: 0 },
			{ opacity: 1, duration: 0.8, ease: 'power2.out' }
		);
		
        // Fog reveal: words and arrow appear one-by-one, de-blur and fade in
        gsap.fromTo(
            '.fog-word, .scroll-arrow',
			{ filter: 'blur(12px)', opacity: 0, y: 12 },
			{
				filter: 'blur(0px)',
				opacity: 1,
				y: 0,
                stagger: 0.25,
				duration: 0.9,
				ease: 'power2.out'
			}
		);

		// Credit animation - appears after the main text
		gsap.fromTo('.quote-credit',
			{ opacity: 0, y: 20, filter: 'blur(8px)' },
			{
				opacity: 1,
				y: 0,
				filter: 'blur(0px)',
				duration: 1.2,
				ease: 'power2.out',
				delay: 1.5 // Appears after the main text animation
			}
		);

		// Set initial state immediately to prevent popping
		gsap.set('#parallax-bg', {
			y: isMobile ? '2%' : '15%',
			scale: isMobile ? 1.01 : 1.1
		});

		// Background layer (slowest movement) - reduce movement on mobile
		gsap.to('#parallax-bg', {
			y: isMobile ? '-0.5%' : '-5%',
			scale: 1,
			ease: 'none',
			scrollTrigger: {
				trigger: '#squishy',
				start: 'top bottom',
				end: 'top 20%',
				scrub: isMobile ? 0.3 : 1 // Much less aggressive scrubbing on mobile
			}
		});

		// JIANKA text layer (medium movement) - reduce movement on mobile
		gsap.fromTo('#jianka-image', {
			opacity: 0,
			y: isMobile ? '5%' : '20%',
			scale: isMobile ? 0.98 : 0.9,
			filter: 'blur(8px)'
		}, {
			opacity: 1,
			y: isMobile ? '-2%' : '-10%',
			scale: 1,
			filter: 'blur(0px)',
			ease: 'none',
			scrollTrigger: {
				trigger: '#squishy',
				start: 'top 80%',
				end: 'top 30%',
				scrub: isMobile ? 0.3 : 1
			}
		});

		// Set initial state immediately to prevent popping
		gsap.set('#parallax-fg', {
			y: isMobile ? '8%' : '25%',
			scale: isMobile ? 1.03 : 1.05
		});

		// Foreground layer (fastest movement) - reduce movement on mobile and sync with background
		gsap.to('#parallax-fg', {
			y: isMobile ? '-3%' : '-15%', // More noticeable movement on mobile
			scale: 1,
			ease: 'none',
			scrollTrigger: {
				trigger: '#squishy',
				start: 'top bottom',
				end: 'top 20%',
				scrub: isMobile ? 0.4 : 1 // Slightly more responsive on mobile
			}
		});

		// Travel agency text (appears when JIANKA is visible) - reduce movement on mobile
		gsap.fromTo('.travel-agency', {
			opacity: 0,
			y: isMobile ? 15 : 30,
			x: isMobile ? 15 : 30
		}, {
			opacity: 1,
			y: 0,
			x: 0,
			ease: 'none',
			scrollTrigger: {
				trigger: '#squishy',
				start: 'top 60%',
				end: 'top 40%',
				scrub: isMobile ? 0.3 : 1
			}
		});

		// City hover effects with image changes
		const cities = document.querySelectorAll('.city');
		const cityImage = document.getElementById('city-image') as HTMLImageElement;
		let currentImageTimeout: NodeJS.Timeout | null = null;

		cities.forEach(city => {
			const cityName = city.getAttribute('data-city');
			if (!cityName) return;
			const imagePath = `/images/${cityName.toLowerCase().replace(' ', '_')}.jpg`;

			city.addEventListener('mouseenter', () => {
				// Clear any pending image change
				if (currentImageTimeout) {
					clearTimeout(currentImageTimeout);
					currentImageTimeout = null;
				}

				// Change image with improved timing
				if (cityImage && cityImage.src !== imagePath) {
					gsap.to(cityImage, { opacity: 0, duration: 0.2, ease: 'power2.out' });
					currentImageTimeout = setTimeout(() => {
						cityImage.src = imagePath;
						gsap.to(cityImage, { opacity: 1, duration: 0.3, ease: 'power2.out' });
						currentImageTimeout = null;
					}, 100);
				}
			});

			city.addEventListener('mouseleave', () => {
				// Clear any pending image change when leaving
				if (currentImageTimeout) {
					clearTimeout(currentImageTimeout);
					currentImageTimeout = null;
				}
			});
		});

		// Simple Flight Time Functionality
		const updateFlightTimes = async function() {
			const cities = ['Berlin', 'London', 'New York', 'Tokyo', 'Seoul'];
			
			for (const city of cities) {
				try {
					const response = await fetch(`/api/flights?city=${city}`);
					const data = await response.json();
					
					if (data.flightTime) {
						const elementId = `${city.toLowerCase().replace(' ', '')}-time`;
						const element = document.getElementById(elementId);
						if (element) {
							element.textContent = data.flightTime;
						}
					}
				} catch (error) {
					console.error(`Failed to fetch flight time for ${city}:`, error);
				}
			}
		};

		const startFlightTimes = function() {
			// Update flight times immediately
			updateFlightTimes();
			
			// Update every 30 seconds
			setInterval(() => {
				updateFlightTimes();
			}, 30000);
		};

		// Simple Text Effect Setup
		const createElm = function (menuItem: HTMLElement) {
			const cityText = menuItem.querySelector('.city-text');
			if (!cityText) return;
			
			// Split city text into individual letters
			const cityTextArray = [...cityText.textContent];
			cityText.textContent = "";
			cityTextArray.forEach((char) => {
				cityText.innerHTML += `<span>${char}</span>`;
			});
		};

		const animation = function (menuItem: HTMLElement) {
			gsap.defaults({
				ease: "power2.out",
				stagger: {
					amount: 0.1,
					from: "start",
				},
			});
			
			// Each city gets its own animation state
			let isAnimating = false;
			let isHovered = false;
			let hoverTimeout: NodeJS.Timeout | null = null;
			let leaveTimeout: NodeJS.Timeout | null = null;
			
			menuItem.addEventListener("mouseenter", function (this: HTMLElement) {
				// Clear any pending leave timeout
				if (leaveTimeout) {
					clearTimeout(leaveTimeout);
					leaveTimeout = null;
				}
				
				// Debounce rapid hover events
				if (hoverTimeout) return;
				
				hoverTimeout = setTimeout(() => {
					if (isAnimating || isHovered) {
						hoverTimeout = null;
						return;
					}
					
					isHovered = true;
					isAnimating = true;
					
					// Kill any existing animations on this element
					gsap.killTweensOf(this.querySelectorAll('.city-text span'));
					gsap.killTweensOf(this.querySelector('.flight-time-text'));
					
					// Hide city name (slide up) - scope to this specific city
					const cityTextSpans = this.querySelectorAll('.city-text span');
					gsap.to(cityTextSpans, {
						y: "-100%",
						opacity: 0,
						duration: 0.25,
						ease: "power2.inOut"
					});
					
					// Show flight time (slide up to same position as city name)
					const flightTimeElement = this.querySelector('.flight-time-text');
					gsap.set(flightTimeElement, { visibility: 'visible', display: 'block' });
					gsap.fromTo(flightTimeElement, 
						{ y: "100%", opacity: 0 },
						{ y: "0%", opacity: 1, color: "#cb9f4d", duration: 0.3, ease: "power2.out", delay: 0.1, onComplete: () => { 
							isAnimating = false;
							hoverTimeout = null;
						} }
					);
				}, 50); // 50ms debounce
			});

			menuItem.addEventListener("mouseleave", function (this: HTMLElement) {
				// Clear any pending hover timeout
				if (hoverTimeout) {
					clearTimeout(hoverTimeout);
					hoverTimeout = null;
				}
				
				// Debounce rapid leave events
				if (leaveTimeout) return;
				
				leaveTimeout = setTimeout(() => {
					if (isAnimating || !isHovered) {
						leaveTimeout = null;
						return;
					}
					
					isHovered = false;
					isAnimating = true;
					
					// Kill any existing animations on this element
					gsap.killTweensOf(this.querySelectorAll('.city-text span'));
					gsap.killTweensOf(this.querySelector('.flight-time-text'));
					
					// Hide flight time (slide down and fade out)
					const flightTimeElement = this.querySelector('.flight-time-text');
					gsap.to(flightTimeElement, {
						y: "100%",
						opacity: 0,
						duration: 0.2,
						ease: "power2.in",
						onComplete: () => {
							gsap.set(flightTimeElement, { visibility: 'hidden', display: 'none' });
							isAnimating = false;
							leaveTimeout = null;
						}
					});
					
					// Show city name (slide down) - scope to this specific city
					const cityTextSpans = this.querySelectorAll('.city-text span');
					gsap.to(cityTextSpans, {
						y: "0%",
						opacity: 1,
						duration: 0.25,
						ease: "power2.out",
						delay: 0.1,
						onComplete: () => { 
							isAnimating = false;
							leaveTimeout = null;
						}
					});
				}, 50); // 50ms debounce
			});
		};

		const targetItems = document.querySelectorAll(".js-menu-item");
		targetItems.forEach((targetItem) => {
			createElm(targetItem as HTMLElement);
			animation(targetItem as HTMLElement);
		});

		// ImageExpansionTypography functionality - Scroll-triggered
		const initImageExpansion = () => {
			const types = document.querySelectorAll('.type');
			
			types.forEach((type) => {
				const expandElements = type.querySelectorAll('.type__expand');
				
				expandElements.forEach((expand) => {
					const img = expand.querySelector('.type__expand-img');
					
					if (img) {
						// Scroll-triggered animation
						gsap.fromTo(type, 
							{},
							{
								scrollTrigger: {
									trigger: type,
									start: 'top 80%',
									end: 'bottom 20%',
									scrub: 1,
									onEnter: () => {
										type.classList.add('type--open');
									},
									onLeave: () => {
										type.classList.remove('type--open');
									},
									onEnterBack: () => {
										type.classList.add('type--open');
									},
									onLeaveBack: () => {
										type.classList.remove('type--open');
									}
								}
							}
						);
					}
				});
			});
		};
		
		// Initialize image expansion after DOM is ready
		setTimeout(() => {
			initImageExpansion();
		}, 200);

		// Initialize flight times
		setTimeout(() => {
			startFlightTimes();
		}, 100);

		// Fade hero out as you scroll to reveal JIANKA
		gsap.to('.hero', {
			autoAlpha: 0,
			scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
		});

		// Fade/translate sections as they enter
		gsap.utils.toArray<HTMLElement>('.section').forEach((el) => {
			gsap.fromTo(
				el,
				{ autoAlpha: 0, y: 24 },
				{
					autoAlpha: 1,
					y: 0,
					duration: 0.8,
					ease: 'power2.out',
					scrollTrigger: { trigger: el, start: 'top 80%' }
				}
			);
		});

		// Nav visibility with smooth animation
        const nav = document.querySelector('.nav');
        if (nav) gsap.set(nav, { autoAlpha: 0, y: -20, pointerEvents: 'auto' });
        
        stMod.ScrollTrigger.create({
            trigger: '#squishy',
            start: 'bottom top',
            onEnter: () => {
                if (nav) {
                    gsap.to(nav, { 
                        autoAlpha: 1, 
                        y: 0, 
                        duration: 0.6, 
                        ease: 'power2.out'
                    });
                }
            },
            onLeaveBack: () => { 
                if (nav) {
                    gsap.to(nav, { 
                        autoAlpha: 0, 
                        y: -20, 
                        duration: 0.3, 
                        ease: 'power2.in'
                        // Don't disable pointer events - keep menu functional
                    }); 
                }
            }
        });
	});
</script>

<svelte:head>
	<title>Jianka Travel</title>
	<meta name="description" content="Travel agency — all roads lead to Rome." />
</svelte:head>

<section id="top" class="hero container" aria-label="Intro">
	<div class="hero-content">
		<h1 aria-live="polite">
			{#each words as w, i}
				<span class="fog-word">{w}{i < words.length - 1 ? ' ' : ''}</span>
			{/each}
		</h1>
		<div class="quote-credit">— some french guy</div>
		<div class="scroll-hint scroll-arrow" aria-hidden="true">↓ scroll down</div>
	</div>
</section>

<section id="squishy" class="section container" aria-label="Brand" style="min-height: 90svh; padding-bottom: 8rem;">
    <div class="parallax-container">
        <!-- Background parallax layer -->
        <div class="parallax-layer parallax-bg">
            <img id="parallax-bg" src="/images/parallax-bg.jpg" alt="Background" class="parallax-image" />
        </div>
        
        <!-- Foreground parallax layer -->
        <div class="parallax-layer parallax-fg">
            <img id="parallax-fg" src="/images/parallax-fg.png" alt="Foreground" class="parallax-image" />
        </div>
        
        <!-- JIANKA image overlay -->
        <div class="jianka-image-overlay">
            <img id="jianka-image" src="/images/jianka-text.png" alt="JIANKA" class="jianka-image" />
        </div>
        
        <!-- Travel agency text -->
        <div class="travel-agency-text">
            <span class="travel-agency">travel agency</span>
        </div>
    </div>
</section>

<section id="cities-section" class="section container" aria-label="Cities" style="min-height: 100svh; padding-top: 2rem;">
	<div class="cities-layout">
		<!-- Left container for cities -->
		<div class="cities-container">
			<div class="cities-grid">
				<span class="city js-menu-item" data-city="Berlin" data-timezone="Europe/Berlin">
					<div class="city-text-wrapper">
						<div class="city-text">Berlin</div>
						<div class="flight-time-text" id="berlin-time">--:--:--</div>
					</div>
				</span>
				<span class="city js-menu-item" data-city="London" data-timezone="Europe/London">
					<div class="city-text-wrapper">
						<div class="city-text">London</div>
						<div class="flight-time-text" id="london-time">--:--:--</div>
					</div>
				</span>
				<span class="city js-menu-item" data-city="New York" data-timezone="America/New_York">
					<div class="city-text-wrapper">
						<div class="city-text">New York</div>
						<div class="flight-time-text" id="newyork-time">--:--:--</div>
					</div>
				</span>
				<span class="city js-menu-item" data-city="Tokyo" data-timezone="Asia/Tokyo">
					<div class="city-text-wrapper">
						<div class="city-text">Tokyo</div>
						<div class="flight-time-text" id="tokyo-time">--:--:--</div>
					</div>
				</span>
				<span class="city js-menu-item" data-city="Seoul" data-timezone="Asia/Seoul">
					<div class="city-text-wrapper">
						<div class="city-text">Seoul</div>
						<div class="flight-time-text" id="seoul-time">--:--:--</div>
					</div>
				</span>
			</div>
		</div>
		
		<!-- Right container for city image -->
		<div class="city-image-container">
			<img id="city-image" src="/images/berlin.jpg" alt="City" class="city-image" />
		</div>
	</div>
</section>

<section id="destinations" class="section container" aria-label="Destinations">
	<div class="content content--left">
		<h3 class="meta">Destinations</h3>
		<h2 class="type">
			Curated journeys through<br />
			Italy, Japan, Iceland<br />
			and
			<span class="type__expand">
				<span class="type__expand-img">
					<span class="type__expand-img-inner" style="background-image: url(/images/destinations_1.jpg);"></span>
				</span>
				<span class="anim skewed">beyond.</span>
			</span>
		</h2>
		<p class="block">
			Discover the world's most captivating destinations through our carefully crafted itineraries. From the ancient streets of Rome to the serene temples of Kyoto, each journey is designed to immerse you in authentic local experiences. Our expert guides ensure every moment is filled with wonder, whether you're exploring the Northern Lights in Iceland or savoring authentic cuisine in the heart of Tuscany.
		</p>
	</div>
	
	<div class="content content--center">
		<h3 class="meta">Experiences</h3>
		<h2 class="type">
			Bespoke itineraries,<br />
			local experts,<br />
			<span class="type__expand">
				<span class="type__expand-img">
					<span class="type__expand-img-inner" style="background-image: url(/images/destinations_2.jpg);"></span>
				</span>
				<span class="anim skewed">detail.</span>
			</span>
		</h2>
		<p class="block">
			Every trip is meticulously planned to exceed your expectations, combining luxury accommodations with authentic cultural encounters. We work with local artisans, chefs, and historians to create exclusive access to experiences unavailable to ordinary travelers. From private vineyard tastings to behind-the-scenes museum tours, we ensure your journey is as unique as you are.
		</p>
	</div>
</section>

<section id="about" class="section container" aria-label="About">
	<div class="content content--left">
		<h3 class="meta">About Us</h3>
		<h2 class="type">
			Jianka Travel Agency<br />
			designs immersive<br />
			<span class="type__expand">
				<span class="type__expand-img">
					<span class="type__expand-img-inner" style="background-image: url(/images/about_1.jpg);"></span>
				</span>
				<span class="anim skewed">travel,</span>
			</span>
			blending culture, food and architecture.
		</h2>
		<p class="block">
			Founded by passionate travelers who believe that the best journeys transform not just your passport, but your perspective. We specialize in creating meaningful connections between our clients and the destinations they visit, ensuring every trip becomes a cherished memory. Our team of travel designers combines decades of experience with fresh insights into emerging destinations and hidden gems.
		</p>
	</div>
	
	<div class="content content--right">
		<h3 class="meta">Our Mission</h3>
		<h2 class="type">
			Effortless logistics<br />
			meet extraordinary<br />
			<span class="type__expand">
				<span class="type__expand-img">
					<span class="type__expand-img-inner" style="background-image: url(/images/about_2.jpg);"></span>
				</span>
				<span class="anim skewed">adventures.</span>
			</span>
		</h2>
		<p class="block">
			We handle every detail so you can focus on the experience. From seamless airport transfers to securing reservations at the world's most exclusive restaurants, our concierge service ensures your journey flows effortlessly. Our 24/7 support team is always available to assist with any needs, whether you're navigating a bustling Tokyo market or relaxing in a secluded Tuscan villa.
		</p>
	</div>
</section>

<section id="contact" class="section container" aria-label="Contact">
	<h2 class="visually-hidden">Contact</h2>
	<p style="text-align:center;">
		<a href="mailto:hello@jianka.travel" style="color:var(--color-text);">hello@jianka.travel</a>
	</p>
</section>

<style>
	/* page-specific overrides if needed */
	.hero-content {
		opacity: 0; /* Initially hidden, will be animated in */
	}
</style>
