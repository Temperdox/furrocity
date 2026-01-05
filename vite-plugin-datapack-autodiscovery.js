/**
 * Vite Plugin: Datapack Auto-Discovery
 *
 * Automatically discovers JSON files in datapack directories at build time.
 * Allows using `autoLoad: true` in pack.json instead of listing every file.
 *
 * Usage in pack.json:
 * {
 *   "contentTypes": {
 *     "items": {
 *       "path": "items/",
 *       "autoLoad": true
 *     }
 *   }
 * }
 */

import fs from 'fs';
import path from 'path';

/**
 * Recursively find all JSON files in a directory
 */
function findJsonFiles(dir, baseDir = dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recursively search subdirectories
      files.push(...findJsonFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Get relative path from base directory
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Process a pack.json and inject file lists for autoLoad content types
 */
function processPackManifest(packJsonPath) {
  const packDir = path.dirname(packJsonPath);
  const content = fs.readFileSync(packJsonPath, 'utf-8');
  const manifest = JSON.parse(content);

  if (!manifest.contentTypes) {
    return content;
  }

  let modified = false;

  for (const [typeName, config] of Object.entries(manifest.contentTypes)) {
    if (config.autoLoad === true) {
      const contentDir = path.join(packDir, config.path || typeName);
      const jsonFiles = findJsonFiles(contentDir);

      // Replace autoLoad with discovered files
      config.files = jsonFiles;
      delete config.autoLoad;
      modified = true;

      console.log(`[datapack-autodiscovery] ${manifest.id || 'pack'}/${typeName}: found ${jsonFiles.length} files`);
    }
  }

  if (modified) {
    return JSON.stringify(manifest, null, 2);
  }

  return content;
}

/**
 * Vite plugin for datapack auto-discovery
 */
export default function datapackAutodiscovery(options = {}) {
  const datapacksDir = options.datapacksDir || 'public/datapacks';

  return {
    name: 'datapack-autodiscovery',

    // Transform pack.json files when they're requested
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if this is a pack.json request
        if (req.url && req.url.includes('/datapacks/') && req.url.endsWith('/pack.json')) {
          const relativePath = req.url.replace(/^\//, '');
          const fullPath = path.resolve(relativePath);

          if (fs.existsSync(fullPath)) {
            try {
              const processed = processPackManifest(fullPath);
              res.setHeader('Content-Type', 'application/json');
              res.end(processed);
              return;
            } catch (e) {
              console.error(`[datapack-autodiscovery] Error processing ${fullPath}:`, e);
            }
          }
        }
        next();
      });
    },

    // Generate processed pack.json files for production build
    generateBundle(options, bundle) {
      const publicDir = path.resolve(datapacksDir);

      if (!fs.existsSync(publicDir)) {
        return;
      }

      // Find all pack.json files
      const packDirs = fs.readdirSync(publicDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const packId of packDirs) {
        const packJsonPath = path.join(publicDir, packId, 'pack.json');

        if (fs.existsSync(packJsonPath)) {
          try {
            const processed = processPackManifest(packJsonPath);
            const bundlePath = `datapacks/${packId}/pack.json`;

            // Update or add the processed pack.json to the bundle
            if (bundle[bundlePath]) {
              bundle[bundlePath].source = processed;
            } else {
              this.emitFile({
                type: 'asset',
                fileName: bundlePath,
                source: processed
              });
            }
          } catch (e) {
            console.error(`[datapack-autodiscovery] Error processing ${packJsonPath}:`, e);
          }
        }
      }
    },

    // Watch pack directories for changes in dev mode
    handleHotUpdate({ file, server }) {
      // If a JSON file in datapacks changed, invalidate pack.json requests
      if (file.includes('datapacks') && file.endsWith('.json')) {
        console.log(`[datapack-autodiscovery] Detected change in ${file}`);
        // Trigger a page reload to pick up new files
        server.ws.send({ type: 'full-reload' });
      }
    }
  };
}
