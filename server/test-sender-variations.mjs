const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function testVariations() {
  const senderVariations = [
    "CACI",
    "caci",
    "Caci",
    "CACI ",
    " CACI",
    "C A C I",
    "C.A.C.I",
    "CACI-CHURCH",
    "CACICHURCH"
  ];

  for (const s of senderVariations) {
    console.log(`\nTesting sender value: JSON.stringify("${s}")`);
    try {
      const res = await fetch("https://sms.vynfy.com/api/v1/send", {
        method: "POST",
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: s,
          recipients: ["233247204741"],
          message: "Test message from church"
        })
      });
      const data = await res.text();
      console.log(`Status ${res.status}:`, data);
    } catch (e) {
      console.log(`Error:`, e.message);
    }
  }
}

testVariations();
