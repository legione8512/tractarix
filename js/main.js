"use strict";

/*
  TractariX main JavaScript
  - Applies the selected theme
  - Handles the mobile menu
  - Sends contact forms without page reload
  - Shows popup messages after form submission
  - Asks for cookie consent and loads Google Analytics only after "Accept"
  - Tracks clicks on phone and WhatsApp links and sent contact forms
*/

const TRACTARIX_DEFAULT_THEME = "dark-yellow";
const TRACTARIX_THEME_STORAGE_KEY = "tractarix-theme";

const TRACTARIX_GA_ID = "G-V25RDETC08";
const TRACTARIX_CONSENT_STORAGE_KEY = "tractarix-consent";
// Analytics data is sent only from the real site, not from previews
// (GitHub Pages, local files), so test visits don't end up in reports.
const TRACTARIX_ANALYTICS_HOSTS = ["tractarix.ro", "www.tractarix.ro"];

const themes = [
  {
    id: "dark-yellow",
    label: "Dark + Yellow",
  },
  {
    id: "navy-orange",
    label: "Navy + Orange",
  },
  {
    id: "green-yellow",
    label: "Green + Yellow",
  },
  {
    id: "light",
    label: "Light Professional",
  },
  {
    id: "christmas",
    label: "Christmas",
  },
];

document.addEventListener("DOMContentLoaded", function () {
  initTheme();
  initMobileMenu();
  initContactForms();
  initAnalytics();
});

function initTheme() {
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme);
  initThemeSelector(savedTheme);
}

// localStorage can throw when the browser blocks site data (e.g. cookies
// disabled). Saved settings are optional, so errors are ignored and the rest
// of the script (mobile menu, contact forms) keeps working.
function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Ignore: the setting still applies to the current page.
  }
}

function getSavedTheme() {
  const savedTheme = readStorage(TRACTARIX_THEME_STORAGE_KEY);

  if (themeExists(savedTheme)) {
    return savedTheme;
  }

  return TRACTARIX_DEFAULT_THEME;
}

function themeExists(themeId) {
  return themes.some(function (theme) {
    return theme.id === themeId;
  });
}

function getThemeById(themeId) {
  return themes.find(function (theme) {
    return theme.id === themeId;
  });
}

function applyTheme(themeId) {
  const safeTheme = themeExists(themeId) ? themeId : TRACTARIX_DEFAULT_THEME;

  document.body.setAttribute("data-theme", safeTheme);
  writeStorage(TRACTARIX_THEME_STORAGE_KEY, safeTheme);

  updateThemeStatus(safeTheme);
}

function initThemeSelector(currentTheme) {
  const themeSelect = document.getElementById("themeSelect");

  if (!themeSelect) {
    return;
  }

  themeSelect.value = currentTheme;

  themeSelect.addEventListener("change", function () {
    applyTheme(themeSelect.value);
  });
}

function updateThemeStatus(themeId) {
  const themeStatus = document.getElementById("themeStatus");

  if (!themeStatus) {
    return;
  }

  const selectedTheme = getThemeById(themeId);

  if (selectedTheme) {
    themeStatus.textContent = "Current theme: " + selectedTheme.label;
  }
}

function initMobileMenu() {
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (!menuButton || !mobileMenu) {
    return;
  }

  menuButton.addEventListener("click", function () {
    const isOpen = mobileMenu.classList.toggle("open");
    updateMobileMenuButton(menuButton, isOpen);
  });

  const mobileLinks = mobileMenu.querySelectorAll("a");

  mobileLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("open");
      updateMobileMenuButton(menuButton, false);
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileMenu.classList.contains("open")) {
      mobileMenu.classList.remove("open");
      updateMobileMenuButton(menuButton, false);
    }
  });
}

function updateMobileMenuButton(menuButton, isOpen) {
  menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  menuButton.setAttribute(
    "aria-label",
    isOpen ? "Închide meniul" : "Deschide meniul",
  );
  menuButton.textContent = isOpen ? "×" : "☰";
}

function initContactForms() {
  const contactForms = document.querySelectorAll('form[action="mail.php"]');

  contactForms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      submitContactForm(form);
    });
  });
}

function submitContactForm(form) {
  const submitButton = form.querySelector(
    'button[type="submit"], input[type="submit"]',
  );

  const originalButtonText = getButtonText(submitButton);

  setButtonLoading(submitButton, true);

  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData,
  })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Server response was not successful.");
      }

      return response.json();
    })
    .then(function (data) {
      const message =
        data && data.message ? data.message : "Mesajul a fost procesat.";

      const type = data && data.success ? "success" : "error";

      showFormPopup(message, type);

      if (data && data.success) {
        form.reset();
        trackEvent("generate_lead", { metoda: "formular" });
      }
    })
    .catch(function () {
      showFormPopup(
        "A apărut o eroare. Te rugăm să ne contactezi telefonic.",
        "error",
      );
    })
    .finally(function () {
      setButtonLoading(submitButton, false, originalButtonText);
    });
}

function getButtonText(button) {
  if (!button) {
    return "";
  }

  if (button.tagName.toLowerCase() === "input") {
    return button.value;
  }

  return button.textContent;
}

function setButtonLoading(button, isLoading, originalText) {
  if (!button) {
    return;
  }

  button.disabled = isLoading;

  const text = isLoading ? "Se trimite..." : originalText;

  if (button.tagName.toLowerCase() === "input") {
    button.value = text;
  } else {
    button.textContent = text;
  }
}

function showFormPopup(message, type) {
  let popup = document.querySelector(".form-popup-message");

  if (!popup) {
    popup = document.createElement("div");
    popup.className = "form-popup-message";
    popup.setAttribute("role", "status");
    popup.setAttribute("aria-live", "polite");
    document.body.appendChild(popup);
  }

  popup.textContent = message;
  popup.classList.remove(
    "form-popup-success",
    "form-popup-error",
    "form-popup-visible",
  );

  if (type === "success") {
    popup.classList.add("form-popup-success");
  } else {
    popup.classList.add("form-popup-error");
  }

  window.setTimeout(function () {
    popup.classList.add("form-popup-visible");
  }, 10);

  window.setTimeout(function () {
    popup.classList.remove("form-popup-visible");
  }, 4500);
}

/* Google Analytics with cookie consent */

let analyticsLoaded = false;

function initAnalytics() {
  const consent = readStorage(TRACTARIX_CONSENT_STORAGE_KEY);

  if (consent === "granted") {
    loadGoogleAnalytics();
  } else if (consent !== "denied") {
    showConsentBanner();
  }

  addCookieSettingsLink();
  initConversionTracking();
}

function isProductionSite() {
  return TRACTARIX_ANALYTICS_HOSTS.includes(window.location.hostname);
}

function loadGoogleAnalytics() {
  if (analyticsLoaded) {
    return;
  }

  analyticsLoaded = true;

  if (!isProductionSite()) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("consent", "default", {
    analytics_storage: "granted",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  window.gtag("js", new Date());
  window.gtag("config", TRACTARIX_GA_ID, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" + TRACTARIX_GA_ID;
  document.head.appendChild(script);
}

function trackEvent(name, params) {
  if (!analyticsLoaded) {
    return;
  }

  if (isProductionSite() && window.gtag) {
    window.gtag("event", name, params);
  } else {
    // Preview: show the event in the browser console instead of sending it.
    console.info("[Google Analytics – previzualizare]", name, params);
  }
}

function initConversionTracking() {
  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");

    if (!link) {
      return;
    }

    const href = link.getAttribute("href");

    if (href.startsWith("tel:")) {
      trackEvent("click_telefon", { locatie_buton: getButtonLocation(link) });
    } else if (href.includes("wa.me/")) {
      trackEvent("click_whatsapp", { locatie_buton: getButtonLocation(link) });
    }
  });
}

function getButtonLocation(element) {
  if (element.closest(".floating-call-button")) {
    return "buton_plutitor";
  }

  if (element.closest(".site-header, .mobile-nav")) {
    return "meniu";
  }

  if (element.closest(".site-footer")) {
    return "footer";
  }

  return "continut";
}

function showConsentBanner() {
  let banner = document.querySelector(".consent-banner");

  if (!banner) {
    banner = document.createElement("div");
    banner.className = "consent-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Consimțământ cookie-uri");
    banner.innerHTML =
      "<p>Folosim cookie-uri Google Analytics ca să vedem câți oameni " +
      "vizitează site-ul și ce pagini le sunt utile. Le activăm doar dacă " +
      'ești de acord. <a href="politica-confidentialitate.html">Detalii</a></p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="cta-button cta-primary" data-consent="granted">Accept</button>' +
      '<button type="button" class="cta-button cta-secondary" data-consent="denied">Refuz</button>' +
      "</div>";

    banner.addEventListener("click", function (event) {
      const button = event.target.closest("button[data-consent]");

      if (button) {
        saveConsent(button.getAttribute("data-consent"));
      }
    });

    document.body.appendChild(banner);
  }

  banner.hidden = false;
}

function saveConsent(choice) {
  writeStorage(TRACTARIX_CONSENT_STORAGE_KEY, choice);
  document.querySelector(".consent-banner").hidden = true;

  if (choice === "granted") {
    loadGoogleAnalytics();
    return;
  }

  if (analyticsLoaded) {
    // Consent withdrawn: remove the Analytics cookies and reload without GA.
    deleteAnalyticsCookies();
    window.location.reload();
  }
}

function deleteAnalyticsCookies() {
  const host = window.location.hostname;
  const domains = [
    "",
    "; domain=" + host,
    "; domain=." + host.replace(/^www\./, ""),
  ];

  document.cookie.split(";").forEach(function (cookie) {
    const name = cookie.split("=")[0].trim();

    if (name.startsWith("_ga")) {
      domains.forEach(function (domain) {
        document.cookie =
          name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + domain;
      });
    }
  });
}

function addCookieSettingsLink() {
  const policyLink = document.querySelector(
    '.footer-legal-info a[href="politica-confidentialitate.html"]',
  );

  if (!policyLink) {
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "link-button";
  button.textContent = "Setări cookie-uri";
  button.addEventListener("click", function () {
    showConsentBanner();
    document.querySelector('.consent-banner button[data-consent="granted"]').focus();
  });

  policyLink.after(" · ", button);
}
