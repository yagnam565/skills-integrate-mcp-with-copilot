document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const loginForm = document.getElementById("login-form");
  const loginEmail = document.getElementById("login-email");
  const loginPassword = document.getElementById("login-password");
  const messageDiv = document.getElementById("message");
  const authContainer = document.getElementById("auth-container");
  const userPanel = document.getElementById("user-panel");
  const userName = document.getElementById("user-name");
  const userRole = document.getElementById("user-role");
  const logoutButton = document.getElementById("logout-button");
  const signupContainer = document.getElementById("signup-container");

  let authToken = localStorage.getItem("authToken");
  let currentUser = null;

  function showMessage(text, type = "info") {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function updateAuthDisplay() {
    if (currentUser) {
      userName.textContent = currentUser.name;
      userRole.textContent = currentUser.role;
      userPanel.classList.remove("hidden");
      loginForm.classList.add("hidden");
      signupContainer.classList.remove("hidden");
    } else {
      userPanel.classList.add("hidden");
      loginForm.classList.remove("hidden");
      signupContainer.classList.add("hidden");
    }
  }

  function getAuthHeaders() {
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  }

  async function fetchCurrentUser() {
    if (!authToken) {
      currentUser = null;
      updateAuthDisplay();
      return;
    }

    try {
      const response = await fetch("/me", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        authToken = null;
        localStorage.removeItem("authToken");
        currentUser = null;
        updateAuthDisplay();
        return;
      }

      currentUser = await response.json();
      updateAuthDisplay();
    } catch (error) {
      console.error("Unable to load current user:", error);
      currentUser = null;
      updateAuthDisplay();
    }
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const showDeleteButtons =
          currentUser && (currentUser.role === "admin" || currentUser.role === "faculty");

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map((email) => {
                      const canDelete =
                        showDeleteButtons ||
                        (currentUser && currentUser.role === "student" && currentUser.email === email);
                      return `<li>
                          <span class="participant-email">${email}</span>
                          ${canDelete ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` : ""}
                        </li>`;
                    })
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    if (!authToken) {
      showMessage("Please sign in before unregistering.", "error");
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        showMessage(result.detail || "Login failed", "error");
        return;
      }

      authToken = result.token;
      localStorage.setItem("authToken", authToken);
      currentUser = result.user;
      updateAuthDisplay();
      fetchActivities();
      loginForm.reset();
      showMessage(`Signed in as ${currentUser.name} (${currentUser.role})`, "success");
    } catch (error) {
      showMessage("Unable to sign in. Please try again.", "error");
      console.error("Login error:", error);
    }
  });

  logoutButton.addEventListener("click", async () => {
    if (!authToken) {
      currentUser = null;
      updateAuthDisplay();
      return;
    }

    try {
      const response = await fetch("/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        authToken = null;
        localStorage.removeItem("authToken");
        currentUser = null;
        updateAuthDisplay();
        fetchActivities();
        showMessage("You have been logged out.", "info");
      } else {
        showMessage("Logout failed. Please refresh the page.", "error");
      }
    } catch (error) {
      showMessage("Logout failed. Please try again.", "error");
      console.error("Logout error:", error);
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!authToken) {
      showMessage("Please sign in before signing up.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchCurrentUser().then(fetchActivities);
});
