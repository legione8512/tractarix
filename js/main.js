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
