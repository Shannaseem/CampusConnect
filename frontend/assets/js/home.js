// ============ MOBILE MENU TOGGLE ============
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");
const navButtons = document.querySelector(".nav-buttons");

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
    navButtons.style.display =
      navButtons.style.display === "flex" ? "none" : "flex";

    // Animate hamburger
    hamburger.classList.toggle("active");
  });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll(".nav-menu a");
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.style.display = "none";
    navButtons.style.display = "none";
    if (hamburger) {
      hamburger.classList.remove("active");
    }
  });
});

// ============ FAQ ACCORDION ============
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");

  question.addEventListener("click", () => {
    // Close other items
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove("active");
      }
    });

    // Toggle current item
    item.classList.toggle("active");
  });
});

// ============ NEWSLETTER FORM ============
const newsletterForm = document.querySelector(".newsletter-form");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = newsletterForm.querySelector('input[type="email"]').value;

    if (email) {
      // Show success message
      const button = newsletterForm.querySelector("button");
      const originalText = button.textContent;
      button.textContent = "✓ Subscribed!";
      button.style.background = "#10b981";

      // Reset form
      newsletterForm.reset();

      // Restore button after 3 seconds
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
      }, 3000);
    }
  });
}

// ============ SMOOTH SCROLL ENHANCEMENT ============
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const href = this.getAttribute("href");
    if (href !== "#" && document.querySelector(href)) {
      e.preventDefault();
      const target = document.querySelector(href);
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// ============ INTERSECTION OBSERVER FOR ANIMATIONS ============
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = "fadeInUp 0.6s ease-out forwards";
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all cards
document
  .querySelectorAll(".benefit-card, .feature-card, .testimonial-card, .step")
  .forEach((card) => {
    observer.observe(card);
  });

// ============ NAVBAR SHADOW ON SCROLL ============
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.boxShadow = "0 10px 15px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  }
});

// ============ ACTIVE NAV LINK HIGHLIGHTING ============
window.addEventListener("scroll", () => {
  let current = "";

  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (scrollY >= sectionTop - 200) {
      current = section.getAttribute("id");
    }
  });

  const navLinks = document.querySelectorAll(".nav-menu a");
  navLinks.forEach((link) => {
    link.style.color = "";
    if (link.getAttribute("href").slice(1) === current) {
      link.style.color = "#3b82f6";
      link.style.fontWeight = "600";
    }
  });
});

// ============ COUNTER ANIMATION ============
const stats = document.querySelectorAll(".stat h3");

const countUp = (element) => {
  const target =
    parseInt(element.getAttribute("data-target")) ||
    parseInt(element.textContent);
  const increment = target / 50;
  let current = 0;

  const updateCount = () => {
    current += increment;
    if (current < target) {
      element.textContent =
        Math.ceil(current) +
        (element.textContent.includes("+")
          ? "+"
          : element.textContent.includes("K")
            ? "K"
            : "");
      requestAnimationFrame(updateCount);
    } else {
      element.textContent =
        target +
        (element.textContent.includes("+")
          ? "+"
          : element.textContent.includes("K")
            ? "K"
            : "");
    }
  };

  updateCount();
};

// Observe stats for animation
const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statsH3 = entry.target.querySelectorAll("h3");
        statsH3.forEach((stat) => {
          if (!stat.getAttribute("data-animated")) {
            countUp(stat);
            stat.setAttribute("data-animated", "true");
          }
        });
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 },
);

const statsSection = document.querySelector(".hero-stats");
if (statsSection) {
  statsObserver.observe(statsSection);
}

// ============ BUTTON RIPPLE EFFECT ============
const buttons = document.querySelectorAll(".btn");

buttons.forEach((button) => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// ============ AUTH MODAL CONTROLS ============
document.addEventListener("DOMContentLoaded", () => {
  const authModal = document.getElementById("auth-modal");
  const navLoginBtn = document.getElementById("nav-login-btn");
  const navRegisterBtn = document.getElementById("nav-register-btn");
  const heroSignupBtn = document.getElementById("hero-signup-btn");
  const modalCloseBtn = document.querySelector(".modal-close");
  const authTabs = document.querySelectorAll(".auth-tab");
  const formSections = document.querySelectorAll(".form-section");

  function openAuthModal(mode = "login") {
    if (!authModal) return;
    authModal.classList.add("active");
    authModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    switchAuthTab(mode);
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove("active");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function switchAuthTab(mode) {
    authTabs.forEach((tab) => {
      tab.classList.toggle("active", tab.id === `tab-${mode}`);
    });
    formSections.forEach((section) => {
      section.classList.toggle("active", section.id === `${mode}-form`);
    });
    const errorContainer = document.getElementById("error-container");
    if (errorContainer) {
      errorContainer.style.display = "none";
    }
  }

  if (navLoginBtn) {
    navLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("login");
    });
  }

  if (navRegisterBtn) {
    navRegisterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register");
    });
  }

  if (heroSignupBtn) {
    heroSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openAuthModal("register");
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeAuthModal);
  }

  if (authModal) {
    authModal.addEventListener("click", (event) => {
      if (
        event.target === authModal ||
        event.target.classList.contains("modal-overlay")
      ) {
        closeAuthModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAuthModal();
    }
  });

  authTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      switchAuthTab(tab.id === "tab-login" ? "login" : "register");
    });
  });
});

// ============ FORM VALIDATION ============
const emailInputs = document.querySelectorAll('input[type="email"]');

emailInputs.forEach((input) => {
  input.addEventListener("blur", function () {
    const email = this.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      this.style.borderColor = "#ef4444";
      this.style.background = "#fee2e2";
    } else {
      this.style.borderColor = "";
      this.style.background = "";
    }
  });
});

// ============ KEYBOARD NAVIGATION ============
document.addEventListener("keydown", (e) => {
  // Close mobile menu on Escape
  if (e.key === "Escape") {
    navMenu.style.display = "none";
    navButtons.style.display = "none";
    if (hamburger) {
      hamburger.classList.remove("active");
    }
  }
});

console.log("Homepage loaded successfully! 🎉");
