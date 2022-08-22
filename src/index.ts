import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

import { google } from "googleapis";
const { v4: uuidv4 } = require("uuid");
const people = google.people("v1");
const email = google.gmail("v1");
const path = require("path");
const fs = require("fs");
const prisma = new PrismaClient();
const cors = require("cors");
const app = express();
app.use(express.json());
// cors
app.use(cors());

const cron = require("node-cron");

const keyPath = path.join(__dirname, "oauth2.keys.json");
let keys: any = { redirect_uris: [""] };
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

console.log(keys);

const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

google.options({ auth: oauth2Client });

const scopes = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/user.emails.read",
  "profile",
];

const authorizeUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes.join(" "),
});

console.log(authorizeUrl);

app.get("/generateEmailToken", async (req, res) => {
  // get user from header token

  console.log(req.headers.authorization);

  const user = await prisma.user.findFirst({
    where: {
      token: req.headers.authorization || "",
    },
  });
  console.log(user);
  if (!user) {
    return res.status(401).send("Unauthorized");
  }

  const emailToken: string = uuidv4();
  await prisma.sentEmailStat.create({
    data: {
      userId: user.id,
      emailToken,
    },
  });

  return res.send({ url: emailToken });
});

cron.schedule("* * * * *", async () => {
  console.log("running a task every minute");

  const users = await prisma.user.findMany();
  for (const user of users) {
    break;
    let refreshToken = user.refreshToken;
    if (!refreshToken) {
      continue;
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    // Get the latest email sent by the user
    const lastSentEmail: any = await email.users.messages.list({
      userId: "me",
      q: "from: " + user.email,
      maxResults: 1,
    });

    console.log(lastSentEmail.data.messages);

    if (!lastSentEmail.data.messages) {
      continue;
    }

    const getFirstEmail = await email.users.messages.get({
      userId: "me",
      id: lastSentEmail.data.messages[0].id,
      format: "raw",
    });

    console.log(getFirstEmail.data);

    let rawMessage: any = getFirstEmail.data.raw;

    const resp = await email.users.messages.insert({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(resp.data);
  }
});

app.get("/trace/mail/:emailToken", async (req, res) => {
  let emailToken = req.params.emailToken;
  // remove png
  emailToken = emailToken.replace(".png", "");
  // const { emailToken } = req.query as { emailToken: string };

  if (!emailToken) {
    return res.status(400).send("Missing emailToken");
  }

  const sentEmailStat = await prisma.sentEmailStat.findFirst({
    where: {
      emailToken: emailToken,
    },
  });
  if (!sentEmailStat) {
    return res.status(400).send("Invalid emailToken");
  }

  await prisma.sentEmailStatWithTimeStamp.create({
    data: {
      emailToken: emailToken,
    },
  });

  return res.send("ok");
});

app.get("/viewEmailCount", async (req, res) => {
  const { emailToken } = req.query as { emailToken: string };

  if (!emailToken) {
    return res.status(400).send("Missing emailToken");
  }

  const sentEmailStat = await prisma.sentEmailStat.findFirst({
    where: {
      emailToken: emailToken,
    },
  });
  if (!sentEmailStat) {
    return res.status(400).send("Invalid emailToken");
  }

  const sentEmailStatWithTimeStamp =
    await prisma.sentEmailStatWithTimeStamp.findMany({
      where: {
        emailToken: emailToken,
      },
    });

  return res.send({
    sentEmailStat,
    sentEmailStatWithTimeStamp,
  });
});

app.get("/sendLastMail", async (req, res) => {
  // Find all users
  const users = await prisma.user.findMany();
  for (const user of users) {
    let refreshToken = user.refreshToken;
    if (!refreshToken) {
      continue;
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    // Get the latest email sent by the user
    const lastSentEmail: any = await email.users.messages.list({
      userId: "me",
      q: "from: " + user.email,
      maxResults: 1,
    });

    console.log(lastSentEmail.data.messages);

    if (!lastSentEmail.data.messages) {
      continue;
    }

    const getFirstEmail = await email.users.messages.get({
      userId: "me",
      id: lastSentEmail.data.messages[0].id,
      format: "raw",
    });

    console.log(getFirstEmail.data);

    let rawMessage: any = getFirstEmail.data.raw;

    // IMAP Append the message to the user's inbox
    const resp = await email.users.messages.insert({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(resp.data);
  }

  return res.send("OK");
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query as { code: string };
  const { tokens } = (await oauth2Client.getToken(code)) as any;
  let refresh_token = tokens.refresh_token;
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      // store the refresh_token in my database!
      refresh_token = tokens.refresh_token;
    }
  });
  oauth2Client.credentials = tokens;
  const { data } = (await people.people.get({
    resourceName: "people/me",
    personFields: "emailAddresses",
  })) as any;

  // View last sent email

  const emailId = data.emailAddresses[0].value;

  const authToken = uuidv4();

  const user = await prisma.user.findFirst({
    where: {
      email: emailId,
    },
  });
  if (!user) {
    await prisma.user.create({
      data: {
        email: emailId,
        refreshToken: refresh_token,
        token: authToken,
      },
    });
  } else {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        refreshToken: refresh_token,
        token: authToken,
      },
    });
  }

  return res.redirect(
    `chrome-extension://bhfkcfipndlhnidnhklmcoacjlgdchlp/auth.html?token=${authToken}&email=${emailId}`
  );
});

const server = app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`)
);
