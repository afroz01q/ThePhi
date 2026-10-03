import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import archiver from 'archiver';

export const sourceCodeRouter = Router({ caseSensitive: true });

// Fixed trusted project root
const PROJECT_ROOT = '/workspace/app-9ps1bb27xji9';

function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}`;
}

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  '.cache',
  '.tmp',
  'coverage',
  '.git',
  '.svn',
  'logs',
  '.vite',
  'history',
  '.skills', // Platform skill directory strictly excluded
]);

function shouldExcludeFile(fileName, relativePath) {
  const lowerName = fileName.toLowerCase();

  // Exclude environment files
  if (lowerName === '.env' || lowerName.startsWith('.env.')) {
    return true;
  }

  // Exclude credentials, certificates, and private keys
  if (
    lowerName.endsWith('.pem') ||
    lowerName.endsWith('.key') ||
    lowerName.endsWith('.p12') ||
    lowerName.endsWith('.pfx') ||
    lowerName.endsWith('.id_rsa') ||
    lowerName === 'credentials.json' ||
    lowerName.startsWith('service-account') ||
    lowerName.startsWith('secret') ||
    lowerName.endsWith('.log') ||
    lowerName.endsWith('.tmp') ||
    lowerName.endsWith('.bak') ||
    lowerName.endsWith('.swp')
  ) {
    return true;
  }

  // Check path segments against excluded directories
  const segments = relativePath.split(path.sep);
  for (const seg of segments) {
    if (EXCLUDED_DIRS.has(seg)) {
      return true;
    }
  }

  return false;
}

function collectFiles(dir, baseDir, collected = []) {
  if (!fs.existsSync(dir)) return collected;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Prevent symlink escape outside project root
    try {
      const real = fs.realpathSync(fullPath);
      if (!real.startsWith(baseDir)) {
        continue;
      }
    } catch {
      continue;
    }

    const relPath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue;
      }
      collectFiles(fullPath, baseDir, collected);
    } else if (entry.isFile()) {
      if (!shouldExcludeFile(entry.name, relPath)) {
        collected.push({ fullPath, relPath });
      }
    }
  }

  return collected;
}

sourceCodeRouter.get('/api/admin/source-code/download', async (req, res) => {
  // 1. Authenticate Request
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Token is empty.' });
    return;
  }

  // Retrieve Supabase environment variables
  let supabaseUrl = process.env.VITE_SUPABASE_URL;
  let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const envFile = path.join(PROJECT_ROOT, '.env');
    if (fs.existsSync(envFile)) {
      const envText = fs.readFileSync(envFile, 'utf-8');
      const urlMatch = envText.match(/VITE_SUPABASE_URL=([^\r\n]+)/);
      const keyMatch = envText.match(/VITE_SUPABASE_ANON_KEY=([^\r\n]+)/);
      if (urlMatch) supabaseUrl = urlMatch[1].trim();
      if (keyMatch) supabaseAnonKey = keyMatch[1].trim();
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({ error: 'Server authentication configuration missing.' });
    return;
  }

  try {
    // 2. Validate token with Supabase Auth
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
      return;
    }

    const user = await userRes.json();
    if (!user || !user.id) {
      res.status(401).json({ error: 'User not found in authentication provider.' });
      return;
    }

    // 3. Verify Administrator Authorization & Permissions
    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
      },
    });

    let isAuthorized = false;
    let userRole = 'unknown';

    if (profileRes.ok) {
      const profiles = await profileRes.json();
      const profile = profiles?.[0];
      if (profile) {
        userRole = profile.role || 'user';
        const hasAdminRole = profile.role === 'admin';
        const hasPermission =
          Array.isArray(profile.permissions) && profile.permissions.includes('source_code.download');
        if (hasAdminRole || hasPermission) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      console.warn(`[SECURITY ALERT] Unauthorized download attempt by user ${user.id} (${user.email || 'no-email'}), role: ${userRole}`);
      res.status(403).json({
        error: 'Forbidden: Administrator privileges with source_code.download permission required.',
      });
      return;
    }

    // 4. Audit Log
    console.log(`[ADMIN AUDIT] Source code archive initiated by admin: ${user.email || user.id} at ${new Date().toISOString()}`);

    // 5. Generate Real Source Code ZIP Archive
    const timestamp = getFormattedTimestamp();
    const rootDirName = `website-source-backup-${timestamp}`;
    const archiveFileName = `website-source-backup-${timestamp}.zip`;

    // Secure download headers
    res.status(200);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${archiveFileName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const archive = archiver('zip', {
      zlib: { level: 9 }, // High compression
    });

    req.on('close', () => {
      if (!res.writableEnded) {
        console.log('[ARCHIVE] Request closed prematurely by client, destroying archive.');
        archive.destroy();
      }
    });

    archive.on('error', (err) => {
      console.error('[ARCHIVE ERROR]:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Archive generation failed.' });
      }
    });

    archive.pipe(res);

    // Collect all valid files from project root
    const files = collectFiles(PROJECT_ROOT, PROJECT_ROOT);

    for (const file of files) {
      const archiveEntryPath = path.join(rootDirName, file.relPath);
      archive.file(file.fullPath, { name: archiveEntryPath });
    }

    // Append safe sanitized .env.example (No real secrets)
    const safeEnvExample = [
      '# =========================================',
      '# Safe Project Environment Template',
      '# (Production secrets have been omitted for security)',
      '# =========================================',
      'VITE_APP_ID=',
      'VITE_SUPABASE_URL=',
      'VITE_SUPABASE_ANON_KEY=',
      '',
    ].join('\n');

    archive.append(safeEnvExample, {
      name: path.join(rootDirName, '.env.example'),
    });

    await archive.finalize();
  } catch (error) {
    console.error('[SERVER ERROR in source code download]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error while creating backup.' });
    }
  }
});
