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
  // 2. MOBILE NAVBAR LOGIC
  // ==========================================
  if (hamburger && navbar) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      navbar.classList.toggle("mobile-active");

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

    const navLinks = navbar.querySelectorAll(".nav-menu a");
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        navbar.classList.remove("mobile-active");
        resetHamburgerIcon();
      });
    });

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
  // 3. AUTHENTICATION MODAL SWITCHER
  // ==========================================
  window.openAuthModal = function (mode) {
    if (!authModal) return;
    if (navbar) {
      navbar.classList.remove("mobile-active");
      resetHamburgerIcon();
    }

    authModal.classList.add("show");
    document.body.style.overflow = "hidden";
    if (errorContainer) errorContainer.style.display = "none";

    switchTab(mode);
  };

  window.closeAuthModal = function () {
    if (!authModal) return;
    authModal.classList.remove("show");
    document.body.style.overflow = "auto";
  };

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

  // Attach button listeners to open modal
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

  // Attach tab switchers
  if (tabLogin) tabLogin.addEventListener("click", () => switchTab("login"));
  if (tabRegister)
    tabRegister.addEventListener("click", () => switchTab("register"));
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeAuthModal);

  // Close modal when clicking on background overlay
  if (authModal) {
    authModal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) closeAuthModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && authModal && authModal.classList.contains("show"))
      closeAuthModal();
  });

  // ==========================================
  // 4. FAQ ACCORDION LOGIC (BUG FIXED)
  // ==========================================
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach((question) => {
    // "link" variable was undefined here, fixed it by using "question" directly
    question.addEventListener("click", () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector("i");

      if (answer.style.display === "block") {
        answer.style.display = "none";
        if (icon) icon.style.transform = "rotate(0deg)";
      } else {
        answer.style.display = "block";
        if (icon) icon.style.transform = "rotate(180deg)";
      }
    });
  });

  console.log("Homepage & Modals loaded successfully! 🚀");
});
