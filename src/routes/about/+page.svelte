<svelte:head>
	<title>About - JIANKA Travel Agency</title>
	<meta name="description" content="About JIANKA Travel Agency - Immersive travel experiences blending culture, food and architecture" />
</svelte:head>

<div class="about-container">
	<div class="about-content">
		<h1>About JIANKA Travel Agency</h1>
		
		<div class="about-description">
			<p class="lead">
				JIANKA Travel Agency designs immersive travel experiences, blending culture, food and architecture.
			</p>
			
			<p>
				We believe that travel is more than just visiting places – it's about experiencing the soul of a destination. 
				Our carefully crafted journeys combine the rich tapestry of local culture, the authentic flavors of regional cuisine, 
				and the architectural marvels that tell the story of each place.
			</p>
			
			<p>
				From bustling city streets to serene countryside retreats, JIANKA creates personalized travel experiences 
				that connect you with the heart and spirit of every destination.
			</p>
		</div>
		
		<div class="about-features">
			<div class="feature">
				<h3>Cultural Immersion</h3>
				<p>Experience authentic local traditions, festivals, and customs that bring destinations to life.</p>
			</div>
			
			<div class="feature">
				<h3>Culinary Adventures</h3>
				<p>Discover the flavors that define each region through guided food tours and cooking experiences.</p>
			</div>
			
			<div class="feature">
				<h3>Architectural Wonders</h3>
				<p>Explore iconic landmarks and hidden gems that showcase the unique character of each destination.</p>
			</div>
		</div>
	</div>
</div>

<style>
	.about-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f0e6 0%, #e8dcc0 100%);
	}
	
	.about-content {
		max-width: 800px;
		background: white;
		padding: 3rem;
		border-radius: 12px;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0e0e0;
	}
	
	.about-content h1 {
		color: #2c2c2c;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0 0 2rem 0;
		letter-spacing: 0.05em;
		text-align: center;
	}
	
	.about-description {
		margin-bottom: 3rem;
	}
	
	.lead {
		font-size: 1.25rem;
		font-weight: 600;
		color: #cb9f4d;
		margin-bottom: 1.5rem;
		text-align: center;
		font-style: italic;
	}
	
	.about-description p {
		color: #666;
		line-height: 1.6;
		margin-bottom: 1rem;
		font-size: 1rem;
	}
	
	.about-features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 2rem;
		margin-top: 2rem;
	}
	
	.feature {
		text-align: center;
		padding: 1.5rem;
		background: #f9f9f9;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}
	
	.feature h3 {
		color: #2c2c2c;
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		letter-spacing: 0.05em;
	}
	
	.feature p {
		color: #666;
		line-height: 1.5;
		margin: 0;
		font-size: 0.95rem;
	}
	
	@media (max-width: 768px) {
		.about-container {
			padding: 1rem;
		}
		
		.about-content {
			padding: 2rem;
		}
		
		.about-content h1 {
			font-size: 2rem;
		}
		
		.lead {
			font-size: 1.1rem;
		}
	}
</style>
