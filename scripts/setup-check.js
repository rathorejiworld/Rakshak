import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n🔍 Checking Rakshak project setup...\n');

let allGood = true;

// Check .env file
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  if (envContent.includes('VITE_SUPABASE_URL') && envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    console.log('✅ Environment variables configured');
  } else {
    console.log('⚠️  .env file missing required variables');
    allGood = false;
  }
} else {
  console.log('⚠️  .env file not found');
  allGood = false;
}

// Check if src directory exists
const srcPath = path.join(rootDir, 'src');
if (fs.existsSync(srcPath)) {
  console.log('✅ src directory found');
} else {
  console.log('❌ src directory not found');
  allGood = false;
}

// Check key files
const keyFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'index.html',
  'vite.config.ts',
  'tailwind.config.js',
  'tsconfig.json'
];

keyFiles.forEach(file => {
  if (fs.existsSync(path.join(rootDir, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} missing`);
    allGood = false;
  }
});

console.log('\n' + '━'.repeat(60));

if (allGood) {
  console.log('\n✅ All checks passed! Your project is ready.\n');
  console.log('📋 Next steps:');
  console.log('   1. Run database migrations in Supabase');
  console.log('   2. Create "evidence" storage bucket');
  console.log('   3. Run: npm run dev\n');
  console.log('📖 See QUICKSTART.md for detailed instructions\n');
} else {
  console.log('\n⚠️  Some checks failed. Please review the issues above.\n');
  console.log('📖 See SETUP_INSTRUCTIONS.md for help\n');
}
