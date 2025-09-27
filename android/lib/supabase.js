// android/lib/supabase.js

import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Required for Supabase to work in React Native

const supabaseUrl = "https://wfcduuyytadtzuvakvsb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmY2R1dXl5dGFkdHp1dmFrdnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1OTY2MjksImV4cCI6MjA3MzE3MjYyOX0.ylNJCLcW5jUBhTLQk6DE5mX0TRiyKtiSkO44q87A2hM";

export const supabase = createClient(supabaseUrl, supabaseKey);