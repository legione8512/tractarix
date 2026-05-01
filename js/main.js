"use strict";

/*
  TractariX main JavaScript
  - Applies the selected theme
  - Handles the mobile menu
  - Sends contact forms without page reload
  - Shows popup messages after form submission
*/

const TRACTARIX_DEFAULT_THEME = "dark-yellow";
const TRACTARIX_THEME_STORAGE_KEY = "tractarix-theme";

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
});

function initTheme() {
  const savedTheme = getSavedTheme();
  applyTheme(savedTheme);
  initThemeSelector(savedTheme);
}

function getSavedTheme() {
  const savedTheme = localStorage.getItem(TRACTARIX_THEME_STORAGE_KEY);

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
  localStorage.setItem(TRACTARIX_THEME_STORAGE_KEY, safeTheme);

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
