import type { RequestHandler } from '@sveltejs/kit';

// Mock flight times data (in a real app, this would come from a flight API)
const flightTimes: Record<string, string> = {
	'Berlin': '2h 45m',
	'London': '1h 30m', 
	'New York': '8h 15m',
	'Tokyo': '11h 20m',
	'Seoul': '12h 35m'
};

export const GET: RequestHandler = async ({ url }) => {
	const city = url.searchParams.get('city');
	
	if (!city || !flightTimes[city]) {
		return new Response(JSON.stringify({ error: 'City not found' }), { 
			status: 404,
			headers: { 'content-type': 'application/json' }
		});
	}

	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 200));

	return new Response(JSON.stringify({ 
		city, 
		flightTime: flightTimes[city],
		nextFlight: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString()
	}), {
		headers: { 'content-type': 'application/json' }
	});
};
