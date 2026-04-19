import "dotenv/config";

(globalThis as any).import = { meta: { env: { VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY } } };

import { getUserShelves, getUserDiary } from './src/services/supabaseData.ts';

async function test() {
  console.log("Starting test");
  try {
    const shelves = await getUserShelves("c6b39ce3-00ad-4ca4-a957-c4ed9dd4bbfa");
    console.log("Shelves works:", shelves.length);
  } catch(e) {
    console.error("Shelves failed:", e);
  }

  try {
    const diary = await getUserDiary("c6b39ce3-00ad-4ca4-a957-c4ed9dd4bbfa");
    console.log("Diary works:", diary.length);
  } catch(e) {
    console.error("Diary failed:", e);
  }
}

test();
