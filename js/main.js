// Make sure sw are supported
// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("../sw_cached_site.js")
//       .then((reg) => console.log("Service Worker: Registered (Pages)"))
//       .catch((err) => console.log(`Service Worker: Error: ${err}`));
//   });
// }

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
    label: "Light",
  },
  {
    id: "christmas",
    label: "Christmas",
  },
];

function applyTheme(themeId) {
  const themeExists = themes.some(function (theme) {
    return theme.id === themeId;
  });

  const safeTheme = themeExists ? themeId : "dark-yellow";

  document.body.setAttribute("data-theme", safeTheme);
  localStorage.setItem("tractarix-theme", safeTheme);
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("tractarix-theme") || "dark-yellow";
  applyTheme(savedTheme);
}

document.addEventListener("DOMContentLoaded", function () {
  loadSavedTheme();

  const themeSelect = document.getElementById("themeSelect");
  const themeStatus = document.getElementById("themeStatus");

  if (themeSelect) {
    const savedTheme = localStorage.getItem("tractarix-theme") || "dark-yellow";
    themeSelect.value = savedTheme;

    themeSelect.addEventListener("change", function () {
      applyTheme(themeSelect.value);

      const selectedTheme = themes.find(function (theme) {
        return theme.id === themeSelect.value;
      });

      if (themeStatus && selectedTheme) {
        themeStatus.textContent = "Current theme: " + selectedTheme.label;
      }
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      const isOpen = mobileMenu.classList.toggle("open");

      menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
      menuButton.textContent = isOpen ? "×" : "☰";
    });
  }
});
document.addEventListener("DOMContentLoaded", function () {
  const contactForms = document.querySelectorAll('form[action="mail.php"]');

  contactForms.forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]',
      );
      const originalButtonText = submitButton
        ? submitButton.textContent || submitButton.value
        : "";

      if (submitButton) {
        submitButton.disabled = true;

        if (submitButton.tagName.toLowerCase() === "input") {
          submitButton.value = "Se trimite...";
        } else {
          submitButton.textContent = "Se trimite...";
        }
      }

      const formData = new FormData(form);

      fetch(form.action, {
        method: "POST",
        body: formData,
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          showFormPopup(data.message, data.success ? "success" : "error");

          if (data.success) {
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
          if (submitButton) {
            submitButton.disabled = false;

            if (submitButton.tagName.toLowerCase() === "input") {
              submitButton.value = originalButtonText;
            } else {
              submitButton.textContent = originalButtonText;
            }
          }
        });
    });
  });
});

function showFormPopup(message, type) {
  let popup = document.querySelector(".form-popup-message");

  if (!popup) {
    popup = document.createElement("div");
    popup.className = "form-popup-message";
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

  setTimeout(function () {
    popup.classList.add("form-popup-visible");
  }, 10);

  setTimeout(function () {
    popup.classList.remove("form-popup-visible");
  }, 4500);
}
