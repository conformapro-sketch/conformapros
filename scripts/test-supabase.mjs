import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  const path = resolve(process.cwd(), file);
  try {
    const content = readFileSync(path, "utf8");
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const match = line.match(/^([\w.-]+)\s*=\s*"?([^"]*)"?$/);
        if (match) {
          const [, key, value] = match;
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
  } catch (error) {
    console.warn(`Could not read ${file}: ${error.message}`);
  }
}

loadEnv(".env.local");
loadEnv(".env");

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration values.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

try {
const table = process.argv[2] ?? "profiles";

const { data, error } = await supabase.from(table).select("*").limit(1);
if (error) {
  console.error(`Supabase query failed for table "${table}":`, error.message);
  process.exit(1);
}

console.log(
  `Supabase connection OK. Table "${table}" responded with`,
  Array.isArray(data) ? `${data.length} row(s).` : data
);
} catch (error) {
  console.error("Unexpected error when testing Supabase:", error);
  process.exit(1);
}
