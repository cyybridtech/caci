const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function probeVynfyAccount() {
  const routes = [
    "https://sms.vynfy.com/api/v1/senders",
    "https://sms.vynfy.com/api/v1/sender-ids",
    "https://sms.vynfy.com/api/v1/senderid",
    "https://sms.vynfy.com/api/v1/balance",
    "https://sms.vynfy.com/api/v1/user",
    "https://sms.vynfy.com/api/v1/account",
    "https://sms.vynfy.com/api/v1/me"
  ];

  for (const route of routes) {
    console.log(`\nProbing route: ${route}`);
    try {
      const res = await fetch(route, {
        method: "GET",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json"
        }
      });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Body:`, text);
    } catch (e) {
      console.log(`Error:`, e.message);
    }
  }
}

probeVynfyAccount();
