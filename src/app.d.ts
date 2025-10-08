// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: import('@supabase/supabase-js').SupabaseClient;
			supabaseAdmin?: import('@supabase/supabase-js').SupabaseClient;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Extend Window interface for reCAPTCHA callbacks
	interface Window {
		onCaptchaSuccess?: (token: string) => void;
		onCaptchaExpired?: () => void;
		onCaptchaError?: () => void;
	}
}

export {};