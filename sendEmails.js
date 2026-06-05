const admin = require("firebase-admin");
const emailjs = require("@emailjs/nodejs");

require("dotenv").config(); // Load environment variables from .env file

const fs = require("fs");
const path = require("path");

const content = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "shared", "eventContent.json"),
    "utf8"
  )
);

const birthdayMessages = content.Birthday.messages;
const birthdayImages = content.Birthday.images;

const anniversaryMessages = content.Anniversary.messages;
const anniversaryImages = content.Anniversary.images;

const reminderImage = content.Reminder.image;

const serviceAccountKey = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  "base64"
).toString("utf8");

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDAHhKZEFIm4Z1HyTRGCaqJ1NGC7KelQ38",
  authDomain: "tavinderevents.firebaseapp.com",
  projectId: "tavinderevents",
  storageBucket: "tavinderevents.firebasestorage.app",
  messagingSenderId: "62017081718",
  appId: "1:62017081718:web:503ed1151d3235f719aa57",
  measurementId: "G-7RYTW534N1"
};

console.log(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// const serviceAccountKey = Buffer.from(
//   FIREBASE_CONFIG
// ).toString("utf8");

const serviceAccount = JSON.parse(serviceAccountKey);

// const FIREBASE_CONFIG = {
//   apiKey: "AIzaSyCfbqC-893YBqhgR5OR0eHyX-EXzCIoTC8",
//   authDomain: "jwdatabase-f0e20.firebaseapp.com",
//   databaseURL: "https://jwdatabase-f0e20-default-rtdb.firebaseio.com",
//   projectId: "jwdatabase-f0e20",
//   storageBucket: "jwdatabase-f0e20.appspot.com",
//   messagingSenderId: "1335908909",
//   appId: "1:1335908909:web:0c132d7c79008c490c36a4",
//   measurementId: "G-BQG1N754TN",
// };


const EMAILJS_SERVICE_ID = "service_jitwsrj";
const EMAILJS_TEMPLATE_ID = "template_8wpg95p";
const EMAILJS_USER_ID = "UUiVKSDERxZLzZndq";

// Load Firebase config from environment variables
const firebaseConfig = FIREBASE_CONFIG;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function sendEmails() {
  console.log("Sending emails...");

  const now = new Date();
  const indiaTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const todayDay = indiaTime.getDate().toString().padStart(2, '0');
  const todayMonth = (indiaTime.getMonth() + 1).toString().padStart(2, '0');

  console.log("India Date (dd-mm):", `${todayDay}-${todayMonth}`);

  const rannum_am = Math.floor(Math.random() * 20) + 1;
  const rannum_bm = Math.floor(Math.random() * 20) + 1;
  const rannum_bcard = Math.floor(Math.random() * 44) + 1;
  const rannum_acard = Math.floor(Math.random() * 13) + 1;

  try {
    const snapshot = await db.collection("Event").get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log("Data: ", JSON.stringify(data, null, 2));

      if (!data.Date || !data.Date.includes("-")) {
        console.log("Invalid Date format, skipping:", data);
        continue; // NOT return
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.Date)) {
        console.log("Invalid Date format:", data.Date);
        continue;
      }
      const [dataYear, dataMonth, dataDay] = data.Date.split("-");
      const eventDay = dataDay.padStart(2, '0');
      const eventMonth = dataMonth.padStart(2, '0');

      const occasion = data.Occasion;
      const fromName = data.From_Name;
      const toName = data.To_Gname;
      const toEmail = data.To_Email;
      const reminderMessage = data.Reminder_Message;

      let fileName, occasionVar, subject, message;
      let imageLink = "";

      // Check for exact match
      if (eventDay === todayDay && eventMonth === todayMonth) {
        switch (occasion) {
          case "Birthday":
            imageLink =
              birthdayImages[
              Math.floor(Math.random() * birthdayImages.length)
              ];
            occasionVar = "Birthdays";
            message = birthdayMessages[rannum_bm - 1];
            subject = `Happy Birthday - ${toName}`;
            break;
          case "Anniversary":
            imageLink =
              anniversaryImages[
              Math.floor(Math.random() * anniversaryImages.length)
              ];
            occasionVar = "Anniversaries";
            message = anniversaryMessages[rannum_am - 1];
            subject = `Happy Anniversary - ${toName}`;
            break;
          case "Reminder":
            imageLink = reminderImage;
            occasionVar = "Reminders";
            message = reminderMessage;
            subject = `Reminder - ${reminderMessage}`;
            break;
          default:
            continue;
        }

        console.log("Sending occasion email for:", occasionVar);
        await sendEmail(
          toEmail,
          message,
          subject,
          fromName,
          toName,
          imageLink
        );
      }

      // Send REMINDER 2 days before (only if today matches D-2)
      if (occasion === "Reminder") {
        const eventDate = new Date(`${dataYear}-${dataMonth}-${dataDay}`);
        const reminderDate = new Date(eventDate);
        // reminderDate.setDate(reminderDate.getDate() - 2);
        reminderDate.setDate(reminderDate.getDate());
        const reminderDay = reminderDate.getDate().toString().padStart(2, '0');
        const reminderMonth = (reminderDate.getMonth() + 1).toString().padStart(2, '0');

        if (reminderDay === todayDay && reminderMonth === todayMonth) {
          imageLink = reminderImage;
          occasionVar = "Reminders";
          message = reminderMessage;
          subject = `Upcoming Reminder - ${reminderMessage}`;

          console.log("Sending 2-day advance reminder email.");
          await sendEmail(
            toEmail,
            message,
            subject,
            fromName,
            toName,
            imageLink
          );
        }
      }
    };
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}





async function sendEmail(
  toEmail,
  message,
  subject,
  fromname,
  toname,
  imageLink
) {
  try {
    console.log("Sending email to:", toEmail);
    console.log(process.env);

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        message,
        subject,
        from_name: fromname,
        to_name: toname,
        from_email: "tpsarora@gmail.com",
        email: toEmail,
        link: imageLink,
      },
      {
        publicKey: "UUiVKSDERxZLzZndq",
        privateKey: "4mpNv3RLNgDV8HQ_HmOMx"

      }
    );

    console.log("✅ Email sent successfully:", response);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

sendEmails();
