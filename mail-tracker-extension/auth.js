// get params from url
var urlParams = new URLSearchParams(window.location.search);
// get the token from the url
var token = urlParams.get("token");
// get the email from the url
var email = urlParams.get("email");

// check if token and email are set
chrome.storage.local.get("mailTracker", function (result) {
  let mailTracker = result.mailTracker || JSON.stringify({ data: [] });
  mailTracker = JSON.parse(mailTracker);
  document.getElementById("store-status").innerHTML = "Storing";
  let found = false;
  for (let i = 0; i < mailTracker.data.length; i++) {
    if (mailTracker.data[i].email === email) {
      mailTracker.data[i].token = token;
      found = true;
    }
  }
  if (!found) {
    mailTracker.data.push({
      email: email,
      token: token,
    });
  }
  chrome.storage.local.set({ mailTracker: JSON.stringify(mailTracker) });
  document.getElementById("store-status").innerHTML = "Stored";
});
