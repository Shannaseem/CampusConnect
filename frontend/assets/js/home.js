/**
 * CampusConnect - Homepage & Landing Page Core Script
 * Handles Navigation, Mobile Hamburger Menu, and Authentication Modals
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. DOM ELEMENTS SELECTION
  // ==========================================
  const navbar = document.querySelector(".navbar");
  const hamburger = document.querySelector(".hamburger");
  const authModal = document.getElementById("auth-modal");
  const modalCloseBtn = document.querySelector(".modal-close");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const errorContainer = document.getElementById("error-container");

  // Trigger Buttons for Modal
  const navLoginBtn = document.getElementById("nav-login-btn");
  const navRegisterBtn = document.getElementById("nav-register-btn");
  const heroSignupBtn = document.getElementById("hero-signup-btn");

  // ==========================================
  // 2. MOBILE NAVBAR LOGIC (Gemini/SaaS Style)
  // ==========================================
  if (hamburger && navbar) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents instant closing
      navbar.classList.toggle("mobile-active");

      // Hamburger icon animation effect (Optional but premium look)
      const spans = hamburger.querySelectorAll("span");
      if (navbar.classList.contains("mobile-active")) {
        spans[0].style.transform = "rotate(45deg) translate(6px, 6px)";
        spans[1].style.opacity = "0";
        spans[2].style.transform = "rotate(-45deg) translate(6px, -6px)";
      } else {
        spans[0].style.transform = "none";
        spans[1].style.opacity = "1";
        spans[2].style.transform = "none";
      }
    });

    // Close mobile nav menu when clicking any link inside it
    const navLinks = navbar.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navbar.classList.remove("mobile-active");
        resetHamburgerIcon();
      });
    });

    // Close mobile nav when clicking anywhere outside the navbar
    document.addEventListener("click", (e) => {
      if (
        !navbar.contains(e.target) &&
        navbar.classList.contains("mobile-active")
      ) {
        navbar.classList.remove("mobile-active");
        resetHamburgerIcon();
      }
    });
  }

  function resetHamburgerIcon() {
    if (!hamburger) return;
    const spans = hamburger.querySelectorAll("span");
    spans.forEach((span) => (span.style.transform = "none"));
    if (spans[1]) spans[1].style.opacity = "1";
  }

  // ==========================================
  // 3. AUTHENTICATION MODAL SWITCHER & HANDLERS
  // ==========================================

  // Function to open modal on a specific tab
  window.openAuthModal = function (mode) {
    if (!authModal) return;

    // Hide mobile nav if open
    if (navbar) {
      navbar.classList.remove("mobile-active");
      resetHamburgerIcon();
    }

    authModal.classList.add("show");
    document.body.style.overflow = "hidden"; // Stop background scrolling
    if (errorContainer) errorContainer.style.display = "none";

    switchTab(mode);
  };

  // Function to close modal gracefully
  window.closeAuthModal = function () {
    if (!authModal) return;
    authModal.classList.remove("show");
    document.body.style.overflow = "auto"; // Restore background scrolling
  };

  // Tab Switching Core Logic (Login vs Sign Up)
  function switchTab(mode) {
    if (!tabLogin || !tabRegister || !loginForm || !registerForm) return;

    if (errorContainer) errorContainer.style.display = "none";

    if (mode === "login") {
      tabLogin.classList.add("active");
      tabRegister.classList.remove("active");
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    } else if (mode === "register") {
      tabRegister.classList.add("active");
      tabLogin.classList.remove("active");
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    }
  }

  // Event Listeners for Opening Modal
  if (navLoginBtn)
    navLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("login");
    });
  if (navRegisterBtn)
    navRegisterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register");
    });
  if (heroSignupBtn)
    heroSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register");
    });

  // Tabs Click Listeners inside Modal
  if (tabLogin) tabLogin.addEventListener("click", () => switchTab("login"));
  if (tabRegister)
    tabRegister.addEventListener("click", () => switchTab("register"));

  // Close Button Listener
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAuthModal);

  // Close Modal when clicking outside the card overlay
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        closeAuthModal();
      }
    });
  }

  // Escape Key Listener to close modal
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      authModal &&
      authModal.classList.contains("show")
    ) {
      closeAuthModal();
    }
  });

  // ==========================================
  // 4. FAQ ACCORDION LOGIC
  // ==========================================
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach((question) => {
    link.addEventListener("click", () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector("i");

      // Toggle current answer
      if (answer.style.display === "block") {
        answer.style.display = "none";
        if (icon) icon.style.transform = "rotate(0deg)";
      } else {
        answer.style.display = "block";
        if (icon) icon.style.transform = "rotate(180deg)";
      }
    });
  });

  console.log("Homepage loaded successfully! 🚀");
});
