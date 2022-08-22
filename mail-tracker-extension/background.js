chrome.runtime.onMessageExternal.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.method === "create_new_oauth_window") {
    chrome.tabs.create({
      url: "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fmail.google.com%2F%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuser.emails.read%20profile&response_type=code&client_id=201199811021-4sfkre1daugtpngadfmnlkjbfnvlu5l7.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth2callback",
    });
    sendResponse({ status: "success" });
  }
  if (request.method === "get_user_email") {
    await chrome.storage.local.get("mailTracker", function (result) {
      console.log(result);
      let mailTracker = result.mailTracker || JSON.stringify({ data: [] });
      sendResponse({ mailTracker: mailTracker });
    });
  }

  const getTrackingUrl = async function (token) {
    const trackingUrl = await fetch(
      "https://fe72-103-37-201-179.in.ngrok.io/generateEmailToken",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    return trackingUrl.json();
  };

  if (request.method === "get_tracking_data") {
    const trackingData = await getTrackingUrl(request.token);
    sendResponse({ trackingData: trackingData });
  }

  return true;
});
