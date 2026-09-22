const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function testSenderIds() {
  const candidateSenders = ["Vynfy", "VynfyOTP", "Alert", "Notify", "SMS", "Vynfy SMS", "VynfyAlert", "CACI Church", "CACInt"];
  
  for (const sender of candidateSenders) {
    console.log(`\nTesting sender ID: "${sender}"...`);
    try {
      const response = await fetch("https://sms.vynfy.com/api/v1/send", {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: sender,
          recipients: ["233247204741"],
          message: "Test message from CACI Church system"
        })
      });
      console.log(`Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Response:`, text);
    } catch (err) {
      console.error(`Error:`, err.message);
    }
  }
}

testSenderIds();
