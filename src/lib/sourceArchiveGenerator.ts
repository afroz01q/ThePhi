import JSZip from 'jszip';

// Capture all project files across the codebase using Vite's eager glob import
const rawFiles = import.meta.glob<string>(
  [
    '/src/**/*',
    '/supabase/migrations/**/*',
    '/docs/**/*',
    '/public/**/*',
    '/*.json',
    '/*.ts',
    '/*.js',
    '/*.html',
    '/*.md',
    '/*.css',
    '/*.yml',
  ],
  { query: '?raw', import: 'default', eager: true }
);

function getFormattedTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

export interface ArchiveResult {
  filename: string;
  fileCount: number;
  sizeBytes: number;
}

/**
 * Generates and downloads a complete, valid ZIP archive of the entire SkillXChange project.
 * Runs 100% in the browser using JSZip, ensuring reliable downloads without empty archive errors.
 */
export async function downloadProjectSourceZip(): Promise<ArchiveResult> {
  const zip = new JSZip();
  const timestamp = getFormattedTimestamp();
  const folderName = `skillxchange-source-${timestamp}`;
  const rootFolder = zip.folder(folderName) ?? zip;

  let fileCount = 0;

  // Add all eager-loaded project source files
  for (const [rawPath, content] of Object.entries(rawFiles)) {
    // Strip leading slash for relative zip structure
    const relativePath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;

    // Skip git, node_modules, temp or build artifacts if any slipped through
    if (
      relativePath.startsWith('node_modules') ||
      relativePath.startsWith('.git') ||
      relativePath.startsWith('.cache') ||
      relativePath.startsWith('dist') ||
      relativePath.includes('.env.')
    ) {
      continue;
    }

    if (typeof content === 'string') {
      rootFolder.file(relativePath, content);
      fileCount++;
    }
  }

  // Add clean environment template
  const safeEnvExample = [
    '# =======================================================',
    '# SkillXChange - Environment Configuration Template',
    '# Rename this file to .env before starting local dev',
    '# =======================================================',
    'VITE_APP_ID=app-9ps1bb27xji9',
    'VITE_SUPABASE_URL=https://your-project-id.supabase.co',
    'VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key',
    '',
    '# Note: Database migrations are located in /supabase/migrations',
    '',
  ].join('\n');

  rootFolder.file('.env.example', safeEnvExample);
  fileCount++;

  // Add developer quickstart guide
  const quickstartGuide = [
    '# SkillXChange Source Code Package',
    `Generated on: ${new Date().toISOString()}`,
    '',
    '## Quickstart Instructions',
    '',
    '1. **Install dependencies**:',
    '   ```bash',
    '   pnpm install # or npm install',
    '   ```',
    '',
    '2. **Configure Environment**:',
    '   Copy `.env.example` to `.env` and fill in your Supabase project credentials.',
    '',
    '3. **Apply Database Migrations**:',
    '   All SQL migrations can be found in `supabase/migrations/`. Execute them in numerical order',
    '   in your Supabase SQL Editor.',
    '',
    '4. **Start Development Server**:',
    '   ```bash',
    '   pnpm dev # or npm run dev',
    '   ```',
    '',
    '## Architecture Overview',
    '- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, Vite',
    '- **Backend**: Supabase Database, Auth, Realtime, Storage, and Triggers',
    '- **Key Modules**:',
    '  - `/src/pages/matches`: Smart AI & Rule-based Matchmaker',
    '  - `/src/pages/sessions`: Online (virtual) & In-person session scheduler',
    '  - `/src/pages/progress`: Learning progress tracker & collaborative logs',
    '  - `/src/pages/notifications`: Real-time categorized alerts',
    '  - `/src/pages/community`: Forums, threads, and safety reporting',
    '  - `/src/pages/admin`: Moderation queue and telemetry analytics',
    '',
  ].join('\n');

  rootFolder.file('QUICKSTART.md', quickstartGuide);
  fileCount++;

  // Generate real binary ZIP blob with high compression
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
  });

  const filename = `skillxchange-source-${timestamp}.zip`;

  // Trigger browser download of the verified ZIP blob
  const downloadUrl = window.URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke blob URL after short delay
  setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return {
    filename,
    fileCount,
    sizeBytes: zipBlob.size,
  };
}
