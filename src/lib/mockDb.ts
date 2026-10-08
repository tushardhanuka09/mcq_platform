import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'mock_db.json');

export function getMockUsers() {
  if (!fs.existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function saveMockUser(user: any) {
  const users = getMockUsers();
  users[user.mobile] = user;
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}
