document.addEventListener("DOMContentLoaded", function () {
  const emailListDiv = document.getElementById("email-list");
  const noEmailsMsg = document.getElementById("no-emails");
  const exportAllBtn = document.getElementById("export-all");
  const clearAllBtn = document.getElementById("clear-all");

  // Query the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // Inject content script into the active tab to crawl emails
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["content.js"],
      },
      () => {
        // After script execution, get the emails from local storage
        loadEmails();
      }
    );
  });

  // Function to load emails from local storage
  function loadEmails() {
    chrome.storage.local.get("emails", (result) => {
      let emails = result.emails || [];

      // Filter out example and invalid emails
      emails = emails.filter((emailObj) => !isInvalidEmail(emailObj.email));

      // Sort emails by the last added
      emails.sort((a, b) => b.timestamp - a.timestamp);

      // If no emails exist, show a message
      if (emails.length === 0) {
        noEmailsMsg.classList.add("show");
      } else {
        noEmailsMsg.classList.remove("show");
        displayEmails(emails);
      }
    });
  }

  // Function to check if an email is invalid
  function isInvalidEmail(email) {
    const invalidDomains = [
      "example.com",
      "yourmail.com",
      "test.com",
      "demo.com",
      "info.com",
      "contact.com",
      "admin.com",
      "support.com",
      "noreply.com",
      "no-reply.com",
      "webmaster.com",
      "postmaster.com",
      "newsletter.com",
      "marketing.com",
      "sales.com",
      "service.com",
      "mail.com",
    ];
    const domain = email.split("@")[1]?.toLowerCase();

    // Check if email domain is in the invalid domains list
    if (invalidDomains.includes(domain)) {
      return true;
    }

    // Check if email matches common example patterns
    const examplePatterns = [
      "example",
      "yourmail",
      "test",
      "demo",
      "noreply",
      "no-reply",
      "webmaster",
      "postmaster",
      "newsletter",
      "marketing",
      "sales",
      "service",
    ];
    return examplePatterns.some((pattern) =>
      email.toLowerCase().includes(pattern)
    );
  }

  // Display emails in the popup
  function displayEmails(emails) {
    emailListDiv.innerHTML = ""; // Clear the email list first
    emails.forEach((emailObj) => {
      const emailDiv = document.createElement("div");
      emailDiv.className = "email-item";

      const emailText = document.createElement("span");
      emailText.textContent = emailObj.email;
      emailText.className = "email-text";

      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-button";
      copyBtn.innerHTML = `<img src="icons/copy-icon.png" alt="Copy"/>`;
      copyBtn.setAttribute("aria-label", "Copy email");

      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(emailObj.email)
          .catch((err) => console.error("Failed to copy email: ", err));
      });

      emailDiv.appendChild(emailText);
      emailDiv.appendChild(copyBtn);
      emailListDiv.appendChild(emailDiv);
    });
  }

  // Export all emails as a CSV
  exportAllBtn.addEventListener("click", () => {
    if (confirm("Do you want to export all emails as a CSV file?")) {
      chrome.storage.local.get("emails", (result) => {
        let emails = result.emails || [];

        // Filter out invalid emails
        emails = emails.filter((emailObj) => !isInvalidEmail(emailObj.email));

        const emailData = emails.map((emailObj) => emailObj.email).join("\n");
        const blob = new Blob([emailData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "emails.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }
  });

  // Clear all emails
  clearAllBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to clear all emails? This action cannot be undone."
      )
    ) {
      chrome.storage.local.remove("emails", () => {
        emailListDiv.innerHTML = ""; // Clear the email list in the popup
        noEmailsMsg.classList.add("show"); // Show the "No emails" message
      });
    }
  });
});
