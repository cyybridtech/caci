const API_KEY = "a5a9ec5fb9c6612a0df7f953b53f4507";

async function exhaustiveTest() {
  const variations = [
    { desc: 'sender: "CACI"', body: { sender: "CACI", recipients: ["233247204741"], message: "Test" } },
    { desc: 'sender_id: "CACI"', body: { sender_id: "CACI", recipients: ["233247204741"], message: "Test" } },
    { desc: 'senderId: "CACI"', body: { senderId: "CACI", recipients: ["233247204741"], message: "Test" } },
    { desc: 'from: "CACI"', body: { from: "CACI", recipients: ["233247204741"], message: "Test" } },
    { desc: 'sender: "caci"', body: { sender: "caci", recipients: ["233247204741"], message: "Test" } },
    { desc: 'sender_id: "caci"', body: { sender_id: "caci", recipients: ["233247204741"], message: "Test" } },
    { desc: 'both sender & sender_id: "CACI"', body: { sender: "CACI", sender_id: "CACI", recipients: ["233247204741"], message: "Test" } },
    { desc: 'recipient as string instead of array', body: { sender: "CACI", recipient: "233247204741", message: "Test" } },
    { desc: 'to as recipient array', body: { sender: "CACI", to: ["233247204741"], message: "Test" } },
  ];

  const headerVariations = [
    { name: "X-API-Key", headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" } },
    { name: "Authorization Bearer", headers: { "Authorization": `Bearer ${API_KEY}`, "Content-Type": "application/json" } },
    { name: "api-key header", headers: { "api-key": API_KEY, "Content-Type": "application/json" } },
  ];

  for (const hv of headerVariations) {
    for (const v of variations) {
      console.log(`\nTesting [${hv.name}] with [${v.desc}]...`);
      try {
        const res = await fetch("https://sms.vynfy.com/api/v1/send", {
          method: "POST",
          headers: hv.headers,
          body: JSON.stringify(v.body)
        });
        const text = await res.text();
        console.log(`Status: ${res.status} | Body: ${text}`);
      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }
  }
}

exhaustiveTest();
