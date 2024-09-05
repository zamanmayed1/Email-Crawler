const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const emails = document.body.innerHTML.match(regex) || [];

// Save emails with timestamps to local storage
chrome.storage.local.get("emails", (result) => {
  let storedEmails = result.emails || [];

  // Add new emails if they don't already exist in storage
  emails.forEach((email) => {
    if (!storedEmails.some((stored) => stored.email === email)) {
      storedEmails.push({ email, timestamp: Date.now() });
    }
  });

  // Save updated list to local storage
  chrome.storage.local.set({ emails: storedEmails });
});
