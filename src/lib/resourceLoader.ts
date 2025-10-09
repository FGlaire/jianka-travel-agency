// Resource loading tracker for synchronizing loading animations with actual resource loading
export class ResourceLoader {
  private static instance: ResourceLoader;
  private loadedResources = 0;
  private totalResources = 0;
  private loadingCallbacks: Array<(progress: number) => void> = [];
  private isComplete = false;
  private minLoadingTime = 2000; // Minimum loading time in ms
  private startTime = Date.now();

  private constructor() {}

  static getInstance(): ResourceLoader {
    if (!ResourceLoader.instance) {
      ResourceLoader.instance = new ResourceLoader();
    }
    return ResourceLoader.instance;
  }

  // Track resource loading progress
  onProgress(callback: (progress: number) => void) {
    this.loadingCallbacks.push(callback);
  }

  // Start tracking resources
  startTracking() {
    this.startTime = Date.now();
    this.loadedResources = 0;
    this.totalResources = 0;
    this.isComplete = false;

    // Track critical images
    this.trackImages();
    
    // Track fonts
    this.trackFonts();
    
    // Track external resources
    this.trackExternalResources();
  }

  private trackImages() {
    const images = document.querySelectorAll('img');
    this.totalResources += images.length;

    images.forEach((img) => {
      if (img.complete) {
        this.onResourceLoaded();
      } else {
        img.addEventListener('load', () => this.onResourceLoaded());
        img.addEventListener('error', () => this.onResourceLoaded()); // Count errors as loaded
      }
    });
  }

  private trackFonts() {
    // Track Google Fonts
    if (document.fonts) {
      document.fonts.ready.then(() => {
        this.onResourceLoaded();
      });
    }

    // Track Fontshare fonts
    const fontshareLink = document.querySelector('link[href*="fontshare"]');
    if (fontshareLink) {
      fontshareLink.addEventListener('load', () => this.onResourceLoaded());
    }
  }

  private trackExternalResources() {
    // Track GSAP and other external scripts
    const scripts = document.querySelectorAll('script[src]');
    this.totalResources += scripts.length;

    scripts.forEach((script) => {
      if (script.getAttribute('src')?.includes('gsap') || 
          script.getAttribute('src')?.includes('lenis')) {
        // These are loaded dynamically, so we'll add them to total but not track individually
        this.totalResources--;
      }
    });

    // Track stylesheets
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    this.totalResources += stylesheets.length;

    stylesheets.forEach((link) => {
      if (link.sheet) {
        this.onResourceLoaded();
      } else {
        link.addEventListener('load', () => this.onResourceLoaded());
      }
    });
  }

  private onResourceLoaded() {
    this.loadedResources++;
    this.updateProgress();
  }

  private updateProgress() {
    const elapsed = Date.now() - this.startTime;
    const minTimeElapsed = elapsed >= this.minLoadingTime;
    
    // Calculate progress (0-100)
    const resourceProgress = this.totalResources > 0 
      ? (this.loadedResources / this.totalResources) * 100 
      : 100;
    
    // Ensure minimum loading time
    const timeProgress = Math.min((elapsed / this.minLoadingTime) * 100, 100);
    
    // Use the higher of resource progress or time progress, but cap at 100
    const finalProgress = Math.min(Math.max(resourceProgress, timeProgress), 100);
    
    // Notify callbacks
    this.loadingCallbacks.forEach(callback => callback(finalProgress));
    
    // Check if loading is complete
    if (finalProgress >= 100 && minTimeElapsed && !this.isComplete) {
      this.isComplete = true;
      setTimeout(() => {
        this.loadingCallbacks.forEach(callback => callback(100));
      }, 300); // Small delay for smooth transition
    }
  }

  // Force complete loading (fallback)
  forceComplete() {
    this.isComplete = true;
    this.loadingCallbacks.forEach(callback => callback(100));
  }

  // Get current progress
  getProgress(): number {
    const elapsed = Date.now() - this.startTime;
    const resourceProgress = this.totalResources > 0 
      ? (this.loadedResources / this.totalResources) * 100 
      : 100;
    const timeProgress = Math.min((elapsed / this.minLoadingTime) * 100, 100);
    return Math.max(resourceProgress, timeProgress);
  }

  // Check if loading is complete
  isComplete(): boolean {
    return this.isComplete;
  }
}
