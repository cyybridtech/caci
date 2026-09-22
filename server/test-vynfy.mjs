const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function probeVynfy() {
  const candidateUrls = [
    {
      name: "vynfy-api-v1-sms",
      url: "https://api.vynfy.com/api/v1/sms/send",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "api-key": API_KEY },
      body: { sender_id: "CACI", recipients: ["233241234567"], message: "Test CACI message" }
    },
    {
      name: "vynfy-v1-send",
      url: "https://api.vynfy.com/v1/sms/send",
      headers: { "Content-Type": "application/json", "api-key": API_KEY },
      body: { sender_id: "CACI", recipient: ["233241234567"], message: "Test CACI message" }
    },
    {
      name: "vynfy-main-api",
      url: "https://vynfy.com/api/sms/send",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}` },
      body: { sender_id: "CACI", recipients: ["233241234567"], message: "Test CACI message" }
    },
    {
      name: "vynfy-balance-check",
      url: "https://api.vynfy.com/api/v1/balance",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "api-key": API_KEY },
      method: "GET"
    },
    {
      name: "vynfy-balance-check-v2",
      url: "https://vynfy.com/api/v1/balance",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${API_KEY}`, "api-key": API_KEY },
      method: "GET"
    }
  ];

  for (const candidate of candidateUrls) {
    console.log(`\n--- Testing candidate: ${candidate.name} (${candidate.url}) ---`);
    try {
      const res = await fetch(candidate.url, {
        method: candidate.method || "POST",
        headers: candidate.headers,
        body: candidate.body ? JSON.stringify(candidate.body) : undefined
      });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log(`Response text:`, text.substring(0, 500));
    } catch (err) {
      console.log(`Network error:`, err.message);
    }
  }
}

probeVynfy();
