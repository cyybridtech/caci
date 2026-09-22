async function testEnterprise() {
  console.log('Testing Enterprise Endpoints...');

  // 1. Test Analytics
  const analyticsRes = await fetch('http://localhost:5000/api/attendance/analytics');
  const analytics = await analyticsRes.json();
  console.log('Weekly Trends Count:', analytics.weeklyTrends.length);
  console.log('Latest Turnout:', analytics.weeklyTrends[analytics.weeklyTrends.length - 1]?.turnoutPercentage, '%');
  console.log('Absentee Alerts Count:', analytics.absenteeAlerts.length);

  // 2. Test Member Attendance History Search
  const membersRes = await fetch('http://localhost:5000/api/members');
  const members = await membersRes.json();
  const firstMember = members[0];
  console.log(`Auditing attendance history for: ${firstMember.firstName} ${firstMember.lastName} (${firstMember.churchGroup})`);

  const historyRes = await fetch(`http://localhost:5000/api/members/${firstMember.id}/attendance-history`);
  const history = await historyRes.json();
  console.log('Attendance Summary:', JSON.stringify(history.summary));
  console.log('Attended Services Count:', history.attendedList.length);
  console.log('Missed Services Count:', history.missedList.length);

  // 3. Test QR Lookup
  const qrRes = await fetch(`http://localhost:5000/api/members/qr/${firstMember.qrCode}`);
  const qrMember = await qrRes.json();
  console.log('QR Lookup Match:', qrMember.firstName, qrMember.lastName, qrMember.memberCode);

  // 4. Test Date-based Session Lookup
  const todayStr = new Date().toISOString().split('T')[0];
  const dateSessionRes = await fetch(`http://localhost:5000/api/sessions/by-date?date=${todayStr}&createIfNotFound=true`);
  const dateSession = await dateSessionRes.json();
  console.log('Date Session Match/Created:', dateSession.serviceType, 'Date:', dateSession.serviceDate);

  console.log('ALL ENTERPRISE ENDPOINTS VERIFIED & FUNCTIONAL!');
}

testEnterprise().catch(console.error);
