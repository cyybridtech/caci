const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function deepTestApprovedSender() {
  console.log("=== DEEP TEST FOR APPROVED SENDER ID: CACI ===");

  const senders = ["CACI", "caci", "CACI ", " CACI", "CACI Church"];
  const recipient = ["233247204741"];
  const message = "Test SMS from CACI via Vynfy";

  const payloads = [
    { name: "standard sender", body: { sender: "CACI", recipients: recipient, message } },
    { name: "sender_id", body: { sender_id: "CACI", recipients: recipient, message } },
    { name: "both sender and sender_id", body: { sender: "CACI", sender_id: "CACI", recipients: recipient, message } },
    { name: "sender_name", body: { sender: "CACI", sender_name: "CACI", recipients: recipient, message } },
    { name: "from", body: { from: "CACI", sender: "CACI", recipients: recipient, message } },
    { name: "recipient singular string", body: { sender: "CACI", recipient: "233247204741", message } },
    { name: "to array", body: { sender: "CACI", to: recipient, message } },
    { name: "contacts array", body: { sender: "CACI", contacts: recipient, message } },
  ];

  // Try different endpoints
  const endpoints = [
    "https://sms.vynfy.com/api/v1/send",
    "https://sms.vynfy.com/api/v1/sms/send",
    "https://sms.vynfy.com/api/v1/messages/send",
    "https://sms.vynfy.com/api/send",
    "https://vynfy.com/api/v1/send",
    "https://vynfy.com/api/v1/sms/send",
    "https://vynfy.com/api/sms/send"
  ];

  for (const ep of endpoints) {
    console.log(`\n--- Testing Endpoint: ${ep} ---`);
    for (const p of payloads) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: {
            "X-API-Key": API_KEY,
            "x-api-key": API_KEY,
            "api-key": API_KEY,
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(p.body)
        });
        const status = res.status;
        const text = await res.text();
        if (status !== 404) {
          console.log(`[${p.name}] -> Status: ${status} | Body: ${text.substring(0, 300)}`);
        }
      } catch (err) {
        // network error
      }
    }
  }

  // Also test Form URL Encoded
  console.log("\n--- Testing URL-Encoded Form Submission ---");
  try {
    const params = new URLSearchParams();
    params.append("sender", "CACI");
    params.append("sender_id", "CACI");
    params.append("recipients", "233247204741");
    params.append("recipient", "233247204741");
    params.append("message", message);
    params.append("key", API_KEY);
    params.append("api_key", API_KEY);

    const res = await fetch("https://sms.vynfy.com/api/v1/send", {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const text = await res.text();
    console.log(`Form URL Encoded -> Status: ${res.status} | Body: ${text}`);
  } catch (err) {
    console.log("Form error:", err.message);
  }
}

deepTestApprovedSender();
