"use strict";

const { default: axios } = require("axios");

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
  if (!window._gmailjs) {
    return;
  }
  clearInterval(loaderId);

  startExtension(window._gmailjs);
}, 100);

// actual extension-code
function startExtension(gmail) {
  let user;
  let trackingUrl = "";
  console.log("Extension loading...");
  window.gmail = gmail;
  const user_email = gmail.get.user_email();

  //   Open a popup window with the given URL
  const create_oauth_page = async function () {
    chrome.runtime.sendMessage(
      "bhfkcfipndlhnidnhklmcoacjlgdchlp",
      {
        method: "create_new_oauth_window",
      },
      function (response) {
        console.log(response);
      }
    );
  };

  const askForAuth = async function () {
    create_oauth_page();
  };

  chrome.runtime.sendMessage(
    "bhfkcfipndlhnidnhklmcoacjlgdchlp",
    { method: "get_user_email" },
    function (response) {
      console.log(response);
      let mailTracker = response.mailTracker || JSON.stringify({ data: [] });
      mailTracker = JSON.parse(mailTracker);
      user = null;
      for (let i = 0; i < mailTracker.data.length; i++) {
        if (mailTracker.data[i].email === user_email) {
          console.log("User found");
          user = mailTracker.data[i];
          break;
        }
      }

      if (user) {
        console.log("User found");
      } else {
        console.log("User not found");
        askForAuth();
      }
    }
  );

  gmail.observe.on("load", () => {
    const userEmail = gmail.get.user_email();
    console.log("Hello, " + userEmail + ". This is your extension talking!");

    gmail.observe.on("view_email", (domEmail) => {
      console.log("Looking at email:", domEmail);
      const emailData = gmail.new.get.email_data(domEmail);
      console.log("Email data:", emailData);
    });

    gmail.observe.on("compose", async (compose, composeType) => {
      // get tracking url
      // const trackingUrl = await getTrackingUrl();

      chrome.runtime.sendMessage(
        "bhfkcfipndlhnidnhklmcoacjlgdchlp",
        { method: "get_tracking_data", token: user.token },
        function (response) {
          trackingUrl = response.trackingData.url;
          console.log(trackingUrl);
        }
      );
      // get compose el
      function temp() {
        let imgUrl = `https://fe72-103-37-201-179.in.ngrok.io/trace/mail/${trackingUrl}.png`;
        imgUrl = encodeURI(imgUrl);
        compose.body(
          compose.body() +
            `<div id="m_346727574757446535mt-signature"><img
              id="m_-73256447271246468372snvTrackImg"
              src=${imgUrl}
              width="1"
              height="1"
              alt="my task"
              style="display: block; margin-left: auto; margin-right: auto;"
              class="CToWUd"
            ></img></div>`
        );
      }
      setTimeout(temp, 1000);
    });
  });
}
