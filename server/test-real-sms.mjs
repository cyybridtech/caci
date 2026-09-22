const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function testVynfyReal() {
  console.log("Testing official Vynfy endpoint: https://sms.vynfy.com/api/v1/send");

  // Test 1: Standard payload matching official documentation
  try {
    const payload = {
      sender: "CACI",
      recipients: ["233247204741"], // using a valid ghana number format
      message: "Test SMS from CACI Church Management System via Vynfy"
    };

    console.log("Sending payload:", payload);

    const response = await fetch("https://sms.vynfy.com/api/v1/send", {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status, response.statusText);
    const text = await response.text();
    console.log("Response body:", text);

    try {
      const json = JSON.parse(text);
      console.log("Parsed JSON:", json);
    } catch (e) {}

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testVynfyReal();
