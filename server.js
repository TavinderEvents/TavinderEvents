require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PORT = process.env.PORT || 3000;

console.log("=================================");
console.log("WhatsApp Cloud API Server");
console.log("Phone Number ID:", PHONE_NUMBER_ID);
console.log(
    "Access Token Loaded:",
    ACCESS_TOKEN ? "YES" : "NO"
);
console.log("=================================");

app.get("/", (req, res) => {
    res.send("WhatsApp Cloud API Server Running");
});

app.post("/send", async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: "Both 'to' and 'message' are required"
            });
        }

        console.log("\n=== SENDING MESSAGE ===");
        console.log("To:", to);
        console.log("Message:", message);

        // const response = await axios.post(
        //     `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
        //     {
        //         messaging_product: "whatsapp",
        //         to: to.replace(/[^\d]/g, ""),
        //         type: "text",
        //         text: {
        //             body: "TEST MESSAGE"
        //         }
        //     },
        //     {
        //         headers: {
        //             Authorization: `Bearer ${ACCESS_TOKEN}`,
        //             "Content-Type": "application/json"
        //         }
        //     }
        // );

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to.replace(/[^\d]/g, ""),
                type: "template",
                template: {
                    name: "birthday_greeting",
                    language: {
                        code: "en"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    parameter_name: "name",
                                    text: "Tavinder"
                                }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ SUCCESS");
        console.log(
            "Message ID:",
            response.data.messages?.[0]?.id
        );

        console.log(
            JSON.stringify(response.data, null, 2)
        );

        res.json({
            success: true,
            messageId: response.data.messages?.[0]?.id,
            response: response.data
        });

    } catch (error) {

        console.log("❌ ERROR");

        const errorData =
            error.response?.data || error.message;

        console.log(
            JSON.stringify(errorData, null, 2)
        );

        res.status(500).json({
            success: false,
            error: errorData
        });
    }
});
app.get("/status/:messageId", async (req, res) => {
    try {
        const messageId = req.params.messageId;

        const response = await axios.get(
            `https://graph.facebook.com/v25.0/${messageId}`,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            }
        );

        res.json(response.data);

    } catch (error) {
        res.status(500).json(
            error.response?.data || error.message
        );
    }
});
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
});
app.get("/debug", async (req, res) => {
    const response = await axios.get(
        `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}`,
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        }
    );

    res.json(response.data);
});
app.get("/list-templates", async (req, res) => {
    try {
        const WABA_ID = "1543861584010132";

        const response = await axios.get(
            `https://graph.facebook.com/v25.0/${WABA_ID}/message_templates`,
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        res.json(err.response?.data || err.message);
    }
});
app.get("/waba", async (req, res) => {
    const response = await axios.get(
        `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}?fields=whatsapp_business_account`,
        {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        }
    );

    res.json(response.data);
});
app.post("/webhook", (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (
        mode === "subscribe" &&
        token === VERIFY_TOKEN
    ) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});
app.get("/waba-details", async (req, res) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}?fields=verified_name,quality_rating,name_status,code_verification_status`,
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.json(err.response?.data || err.message);
  }
});
app.get("/check-number/:phone", async (req, res) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: req.params.phone,
        type: "template",
        template: {
          name: "hello_world",
          language: {
            code: "en_US"
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    res.json(err.response?.data || err.message);
  }
});