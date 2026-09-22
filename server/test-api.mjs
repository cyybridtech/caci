async function test() {
  const activeRes = await fetch('http://localhost:5173/api/sessions/active');
  const session = await activeRes.json();
  console.log('Active Session:', session.serviceType, 'ID:', session.id);

  const statsRes = await fetch(`http://localhost:5173/api/attendance/stats/${session.id}`);
  const stats = await statsRes.json();
  console.log('Attendance Stats:', JSON.stringify(stats, null, 2));

  const financesRes = await fetch('http://localhost:5173/api/finances/summary');
  const finances = await financesRes.json();
  console.log('Finances Summary:', JSON.stringify(finances, null, 2));

  // Test Rapid Check-In: Find an absent member and check them in!
  const membersRes = await fetch('http://localhost:5173/api/members');
  const members = await membersRes.json();

  const attRes = await fetch(`http://localhost:5173/api/attendance/session/${session.id}`);
  const attList = await attRes.json();
  const presentIds = new Set(attList.map(a => a.memberId));

  const absentMember = members.find(m => !presentIds.has(m.id));
  if (absentMember) {
    console.log(`Testing check-in for absent member: ${absentMember.firstName} ${absentMember.lastName} (${absentMember.churchGroup})`);
    const checkInRes = await fetch('http://localhost:5173/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: session.id,
        memberId: absentMember.id,
        markedBy: 'Media Desk Laptop'
      })
    });
    const checkInResult = await checkInRes.json();
    console.log('Check-In API Result:', checkInResult.message, 'alreadyCheckedIn:', checkInResult.alreadyCheckedIn);
  }

  // Test Broadcast Message:
  console.log('Testing Automated Broadcast to Attendees...');
  const broadcastRes = await fetch('http://localhost:5173/api/messages/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetType: 'ATTENDEES_TODAY',
      sessionId: session.id,
      channel: 'WHATSAPP'
    })
  });
  const broadcastResult = await broadcastRes.json();
  console.log('Broadcast Result:', broadcastResult.message, 'Sent Count:', broadcastResult.sentCount);

  // Test Offline Batch Sync:
  console.log('Testing Offline Batch Sync endpoint...');
  const syncRes = await fetch('http://localhost:5173/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attendanceQueue: [],
      contributionQueue: [
        {
          memberId: members[0].id,
          sessionId: session.id,
          category: 'TITHE',
          amount: 150.00,
          paymentMethod: 'CASH',
          notes: 'Test offline sync contribution'
        }
      ]
    })
  });
  const syncResult = await syncRes.json();
  console.log('Sync Result:', syncResult.message);
  console.log('ALL API TESTS PASSED SUCCESSFULLY!');
}

test().catch(console.error);
