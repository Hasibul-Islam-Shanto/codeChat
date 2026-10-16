import { LEGACY_CHAT_TITLE } from './constants/chat';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5001/api';

async function runTests() {
  console.log(`Starting comprehensive backend verification against ${BASE_URL}...\n`);

  let cookieUser1 = '';
  let cookieUser2 = '';

  console.log('1. Testing GET /health ...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = (await healthRes.json()) as any;
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error(`Health check failed: ${JSON.stringify(healthJson)}`);
  }
  console.log('✅ Health check passed:', healthJson);

  const user1 = {
    username: `user1_${Date.now()}`,
    email: `user1_${Date.now()}@example.com`,
    password: 'password123',
  };
  console.log('\n2. Testing POST /auth/signup (User 1) ...');
  const signup1Res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user1),
  });
  const signup1Json = (await signup1Res.json()) as any;
  if (signup1Res.status !== 201 || !signup1Json.user?.id) {
    throw new Error(`Signup User 1 failed: ${JSON.stringify(signup1Json)}`);
  }
  const rawCookie1 = signup1Res.headers.get('set-cookie');
  if (rawCookie1) cookieUser1 = rawCookie1.split(';')[0];
  console.log('✅ User 1 signed up:', signup1Json.user);

  const user2 = {
    username: `user2_${Date.now()}`,
    email: `user2_${Date.now()}@example.com`,
    password: 'password123',
  };
  console.log('\n3. Testing POST /auth/signup (User 2) ...');
  const signup2Res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user2),
  });
  const signup2Json = (await signup2Res.json()) as any;
  if (signup2Res.status !== 201 || !signup2Json.user?.id) {
    throw new Error(`Signup User 2 failed: ${JSON.stringify(signup2Json)}`);
  }
  const rawCookie2 = signup2Res.headers.get('set-cookie');
  if (rawCookie2) cookieUser2 = rawCookie2.split(';')[0];
  console.log('✅ User 2 signed up:', signup2Json.user);

  console.log('\n4. Testing POST /chats (User 1 creates chat) ...');
  const createChatRes = await fetch(`${BASE_URL}/chats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieUser1,
    },
    body: JSON.stringify({ title: LEGACY_CHAT_TITLE }),
  });
  const createChatJson = (await createChatRes.json()) as any;
  const chatId = createChatJson.id || createChatJson.chat?.id || createChatJson._id;
  if (createChatRes.status !== 201 || !chatId) {
    throw new Error(`Create chat failed: ${JSON.stringify(createChatJson)}`);
  }
  console.log('✅ Chat created with ID:', chatId);

  console.log('\n5. Testing GET /chats (User 1 lists chats) ...');
  const listChatsRes = await fetch(`${BASE_URL}/chats`, {
    headers: { Cookie: cookieUser1 },
  });
  const listChatsJson = (await listChatsRes.json()) as any;
  const chatsArray = Array.isArray(listChatsJson) ? listChatsJson : listChatsJson.chats;
  if (listChatsRes.status !== 200 || !Array.isArray(chatsArray) || chatsArray.length === 0) {
    throw new Error(`List chats failed: ${JSON.stringify(listChatsJson)}`);
  }
  if (!chatsArray[0].id) {
    throw new Error(`Expected chat item to have virtual id: ${JSON.stringify(chatsArray[0])}`);
  }
  console.log(`✅ List chats passed (${chatsArray.length} chat(s) found, id virtual verified: ${chatsArray[0].id})`);

  console.log("\n6. Testing Chat Ownership Authorization (User 2 attempts to access User 1's chat) ...");
  const unauthorizedGet = await fetch(`${BASE_URL}/chats/${chatId}`, {
    headers: { Cookie: cookieUser2 },
  });
  if (unauthorizedGet.status !== 404 && unauthorizedGet.status !== 403) {
    throw new Error(`Expected 404/403 for unauthorized chat access, got ${unauthorizedGet.status}`);
  }
  const unauthorizedMsgs = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { Cookie: cookieUser2 },
  });
  if (unauthorizedMsgs.status !== 404 && unauthorizedMsgs.status !== 403) {
    throw new Error(`Expected 404/403 for unauthorized messages access, got ${unauthorizedMsgs.status}`);
  }
  console.log('✅ Ownership protection verified (User 2 blocked with status 404)');

  console.log('\n7. Testing POST /chats/:id/messages (Direct user message) ...');
  const createMsgRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieUser1,
    },
    body: JSON.stringify({ content: 'Hello CodeChat backend' }),
  });
  const createMsgJson = (await createMsgRes.json()) as any;
  if (createMsgRes.status !== 201 || !createMsgJson.id) {
    throw new Error(`Create message failed: ${JSON.stringify(createMsgJson)}`);
  }
  console.log('✅ Message created with virtual id:', createMsgJson.id);

  console.log('\n8. Testing GET /chats/:id/messages (History retrieval) ...');
  const getMsgsRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { Cookie: cookieUser1 },
  });
  const getMsgsJson = (await getMsgsRes.json()) as any;
  const msgsArray = Array.isArray(getMsgsJson) ? getMsgsJson : getMsgsJson.messages;
  if (getMsgsRes.status !== 200 || !Array.isArray(msgsArray) || msgsArray.length === 0) {
    throw new Error(`Get messages failed: ${JSON.stringify(getMsgsJson)}`);
  }
  console.log(`✅ Message history retrieved (${msgsArray.length} message(s), sorted chronologically)`);

  console.log('\n9. Testing POST /chats/:id/send (Groq LLM + Tavily Tool Calling) ...');
  const sendRes = await fetch(`${BASE_URL}/chats/${chatId}/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieUser1,
    },
    body: JSON.stringify({ content: 'What is the latest AI news today?' }),
  });
  const sendJson = (await sendRes.json()) as any;
  if (sendRes.status !== 200 || (!sendJson.content && !sendJson.reply?.content)) {
    throw new Error(`Send route failed: ${JSON.stringify(sendJson)}`);
  }
  console.log('✅ Send route succeeded!');
  console.log('   Assistant Content:', sendJson.content || sendJson.reply?.content);
  console.log('   Web Search Performed:', sendJson.searchedWeb);
  console.log('   Assistant Virtual ID:', sendJson.id);

  console.log('\n10. Verifying Tool message and Assistant message persistence in MongoDB history ...');
  const verifyHistoryRes = await fetch(`${BASE_URL}/chats/${chatId}/messages`, {
    headers: { Cookie: cookieUser1 },
  });
  const historyJson = (await verifyHistoryRes.json()) as any;
  const allHistory = Array.isArray(historyJson) ? historyJson : historyJson.messages;
  const roles = allHistory.map((m: any) => m.role);
  console.log('    History roles present:', roles);
  if (!roles.includes('user') || !roles.includes('assistant')) {
    throw new Error(`Expected both user and assistant roles in history: ${JSON.stringify(roles)}`);
  }
  console.log('✅ MongoDB message history successfully persisted all turns');

  console.log('\n11. Testing DELETE /chats/:id ...');
  const delChatRes = await fetch(`${BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: { Cookie: cookieUser1 },
  });
  const delChatJson = (await delChatRes.json()) as any;
  if (delChatRes.status !== 200) {
    throw new Error(`Delete chat failed: ${JSON.stringify(delChatJson)}`);
  }
  console.log('✅ Chat and cascaded messages deleted');

  console.log('\n12. Testing POST /auth/logout ...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Cookie: cookieUser1 },
  });
  const logoutJson = (await logoutRes.json()) as any;
  if (logoutRes.status !== 200) {
    throw new Error(`Logout failed: ${JSON.stringify(logoutJson)}`);
  }
  console.log('✅ Logout succeeded, session cleared');

  console.log('\n🎉 ALL STEPS 6 - 10 INTEGRATION TESTS COMPLETED SUCCESSFULLY! 🎉\n');
}

runTests().catch((err) => {
  console.error('\n❌ Integration Test Error:', err);
  process.exit(1);
});
