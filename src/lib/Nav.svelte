<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from './supabaseClient';
  import { goto } from '$app/navigation';

  let { user: initialUser } = $props<{ user: any }>();

  let jiankaLink: HTMLElement;
  let isMenuOpen = $state(false);

  onMount(() => {
    // Smooth scroll for JIANKA link
    jiankaLink = document.querySelector('[data-smooth-scroll]') as HTMLElement;
    
    if (jiankaLink) {
      jiankaLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Close account dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.account-container')) {
        showAccountDropdown = false;
      }
    });

    // Check authentication status
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        isLoggedIn = true;
        user = session.user;
        lastLoginTime = new Date(session.user.last_sign_in_at || session.user.created_at).toLocaleString();
      } else if (event === 'SIGNED_OUT') {
        isLoggedIn = false;
        user = null;
        lastLoginTime = '';
        showAccountDropdown = false;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });

  let isClosing = $state(false);
  let isLoggedIn = $state(false);
  let showAccountDropdown = $state(false);
  let lastLoginTime = $state('');
  let menuOverlayClosing = $state(false);
  let menuContentClosing = $state(false);
  let user: any = $state(null);

  async function checkAuth() {
    if (initialUser) {
      isLoggedIn = true;
      user = initialUser;
      lastLoginTime = new Date(initialUser.last_sign_in_at || initialUser.created_at).toLocaleString();
    } else {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        isLoggedIn = true;
        user = authUser;
        lastLoginTime = new Date(authUser.last_sign_in_at || authUser.created_at).toLocaleString();
      }
    }
  }

  function toggleMenu() {
    if (isMenuOpen && !isClosing) {
      closeMenu();
    } else if (!isMenuOpen && !isClosing) {
      isMenuOpen = true;
    }
  }

  function closeMenu() {
    if (isClosing) return; // Prevent multiple close calls
    
    isClosing = true;
    console.log('Starting closing animation...');
    
    // Set closing classes using Svelte's reactive variables
    menuOverlayClosing = true;
    menuContentClosing = true;
    
    // Wait for animation to complete before removing the menu
    setTimeout(() => {
      console.log('Closing animation complete');
      isMenuOpen = false;
      isClosing = false;
      // Reset closing classes for next time
      menuOverlayClosing = false;
      menuContentClosing = false;
    }, 400); // Match the fadeOut animation duration
  }

  function handleMenuLinkClick(event: MouseEvent) {
    // Close the menu with animation
    closeMenu();
    // Let the default link behavior happen (navigation)
  }

  function handleOverlayClick(event: MouseEvent | KeyboardEvent) {
    // For keyboard events (Escape key), always close
    if (event.type === 'keydown') {
      closeMenu();
      return;
    }
    
    // For click events, only close if clicking directly on the overlay (not on menu content)
    if (event.type === 'click' && event.target === event.currentTarget) {
      closeMenu();
    }
  }

  function handleLogin() {
    goto('/login');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    isLoggedIn = false;
    user = null;
    lastLoginTime = '';
    showAccountDropdown = false;
    goto('/');
  }

  function toggleAccountDropdown() {
    showAccountDropdown = !showAccountDropdown;
  }

  function closeAccountDropdown() {
    showAccountDropdown = false;
  }
</script>

<header class="header">
  <div class="header-content">
    <a href="/" class="logo" data-smooth-scroll>JIANKA</a>
    
    <div class="nav-right">
      <!-- Login/Account Button -->
      {#if !isLoggedIn}
        <button class="login-button" onclick={handleLogin}>
          LOGIN
        </button>
      {:else}
        <div class="account-container">
          <button class="account-button" onclick={toggleAccountDropdown}>
            ACCOUNT
          </button>
          
          {#if showAccountDropdown}
            <div class="account-dropdown show">
              <div class="account-info">
                <div class="user-email">
                  {user?.email}
                </div>
                <div class="last-login">
                  Last login: {lastLoginTime}
                </div>
              </div>
              <div class="account-actions">
                <button class="account-action-button" onclick={() => { goto('/account-settings'); showAccountDropdown = false; }}>
                  Account Settings
                </button>
                <button class="logout-button" onclick={handleLogout}>
                  LOGOUT
                </button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Menu Button -->
      <button class="menu-button" onclick={toggleMenu} aria-label="Toggle menu">
        <div class="hamburger">
          <span class="line"></span>
          <span class="line"></span>
          <span class="line"></span>
        </div>
      </button>
    </div>
  </div>

  <!-- Menu Overlay -->
  {#if isMenuOpen}
    <div class="menu-overlay {menuOverlayClosing ? 'closing' : ''}" onclick={handleOverlayClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && handleOverlayClick(e)} aria-label="Close menu">
      <button class="close-button" onclick={closeMenu} aria-label="Close menu">
        <span class="close-icon">×</span>
      </button>
      <div class="menu-content {menuContentClosing ? 'closing' : ''}" onclick={(e) => e.stopPropagation()} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && e.stopPropagation()}>
        <nav>
          <a href="/" class="menu-link" onclick={handleMenuLinkClick}>
            <span class="menu-number">01</span>
            <span class="menu-text">HOME</span>
          </a>
          <a href="/about" class="menu-link" onclick={handleMenuLinkClick}>
            <span class="menu-number">02</span>
            <span class="menu-text">ABOUT</span>
          </a>
          <a href="/login" class="menu-link" onclick={handleMenuLinkClick}>
            <span class="menu-number">03</span>
            <span class="menu-text">LOGIN</span>
          </a>
          <a href="/account-settings" class="menu-link" onclick={handleMenuLinkClick}>
            <span class="menu-number">04</span>
            <span class="menu-text">ACCOUNT</span>
          </a>
        </nav>
      </div>
    </div>
  {/if}
</header>

<style>
  .header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: transparent;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .login-button, .account-button {
    background: none;
    border: 1px solid #cb9f4d;
    color: #cb9f4d;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
  }

  .login-button:hover, .account-button:hover {
    background: #cb9f4d;
    color: #000;
    transform: translateY(-1px);
  }

  .account-container {
    position: relative;
  }

  .account-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    background: rgba(0, 0, 0, 0.95);
    border: 1px solid #cb9f4d;
    border-radius: 4px;
    padding: 1rem;
    min-width: 200px;
    z-index: 1001;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    pointer-events: none;
  }

  .account-dropdown.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .account-info {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #333;
  }

  .user-email {
    font-size: 0.9rem;
    color: #cb9f4d;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .last-login {
    font-size: 0.75rem;
    color: #999;
    text-transform: none;
    letter-spacing: normal;
  }

  .account-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .account-action-button {
    background: none;
    border: 1px solid #cb9f4d;
    color: #cb9f4d;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    width: 100%;
  }

  .account-action-button:hover {
    background: #cb9f4d;
    color: #000;
  }

  .logout-button {
    background: none;
    border: 1px solid #ff4444;
    color: #ff4444;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    width: 100%;
  }

  .logout-button:hover {
    background: #ff4444;
    color: #000;
  }

  .logo {
    color: #cb9f4d;
    text-decoration: none;
    font-weight: 700;
    font-size: 1.5rem;
    letter-spacing: 0.1em;
    transition: color 0.3s ease;
  }

  .logo:hover {
    color: #f4e4a6;
  }

  .menu-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 24px;
    height: 18px;
  }

  .line {
    width: 100%;
    height: 2px;
    background: #cb9f4d;
    transition: all 0.3s ease;
    transform-origin: center;
  }

  .menu-button:hover .line {
    background: #f4e4a6;
  }

  /* Close Button */
  .close-button {
    position: absolute;
    top: 2rem;
    right: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: all 0.3s ease;
  }

  .close-icon {
    font-size: 2rem;
    color: #2c2c2c;
    font-weight: 300;
    line-height: 1;
    transition: all 0.3s ease;
  }

  .close-button:hover .close-icon {
    color: #cb9f4d;
    transform: scale(1.1);
  }

  .close-button:hover {
    transform: rotate(90deg);
  }

  /* Menu Overlay */
  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(245, 240, 230, 0.95);
    z-index: 999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    backdrop-filter: blur(8px);
    opacity: 1;
    transition: opacity 0.4s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  }

  .menu-overlay.closing {
    opacity: 0;
  }

  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    animation: slideUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.1s both;
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19), transform 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
  }

  .menu-content.closing {
    opacity: 0;
    transform: translateY(20px);
  }

  .menu-link {
    color: #2c2c2c;
    text-decoration: none;
    font-size: 1.8rem;
    font-weight: 600;
    letter-spacing: 0.15em;
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0.5rem 0;
    transform: translateX(0);
  }

  .menu-number {
    font-size: 1.2rem;
    font-weight: 400;
    opacity: 0.7;
    min-width: 2rem;
    transition: opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .menu-text {
    font-weight: 600;
    transition: color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .menu-link:hover {
    color: #cb9f4d;
    transform: translateX(8px);
  }

  .menu-link:hover .menu-number {
    opacity: 1;
  }

  .menu-link:hover .menu-text {
    color: #cb9f4d;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes slideDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .header-content {
      padding: 1rem;
    }

    .menu-link {
      font-size: 1.4rem;
    }

    .menu-number {
      font-size: 1rem;
    }

    .close-button {
      top: 1.5rem;
      right: 1.5rem;
    }

    .close-icon {
      font-size: 1.8rem;
    }

    .nav-right {
      gap: 0.5rem;
    }

    .login-button, .account-button {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
    }

    .account-dropdown {
      min-width: 180px;
      right: -0.5rem;
    }
  }

  @media (max-width: 480px) {
    .menu-link {
      font-size: 1.2rem;
    }

    .menu-number {
      font-size: 0.9rem;
    }

    .close-button {
      top: 1rem;
      right: 1rem;
    }

    .close-icon {
      font-size: 1.6rem;
    }

    .login-button, .account-button {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
    }

    .account-dropdown {
      min-width: 160px;
      right: -1rem;
    }
  }
</style>