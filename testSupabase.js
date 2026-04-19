import { getUserShelves, getUserDiary } from './src/services/supabaseData.js';
import { supabase } from './src/services/supabaseClient.js';

async function test() {
  const { data: users, error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    console.error("User fetch error:", error);
    return;
  }
  
  if (!users || users.length === 0) {
    console.log("No users found");
    return;
  }

  const userId = users[0].id;
  console.log("Testing with user:", userId);

  try {
    const shelves = await getUserShelves(userId);
    console.log("Shelves works:", shelves.length);
  } catch(e) {
    console.error("Shelves failed:", e);
  }

  try {
    const diary = await getUserDiary(userId);
    console.log("Diary works:", diary.length);
  } catch(e) {
    console.error("Diary failed:", e);
  }
}

test();
