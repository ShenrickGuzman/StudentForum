import express from 'express';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Always resolve settings.json relative to backend directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, '../../settings.json');


const router = express.Router();

// Helper to read/write settings
function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return { autoApprove: false };
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { autoApprove: false };
  }
}
function writeSettings(settings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

// GET auto-approve state
router.get('/auto-approve', (req, res) => {
  const settings = readSettings();
  res.json({ enabled: !!settings.autoApprove });
});

// POST to update auto-approve state
router.post('/auto-approve', (req, res) => {
  const { enabled } = req.body;
  const settings = readSettings();
  settings.autoApprove = !!enabled;
  writeSettings(settings);
  res.json({ enabled: settings.autoApprove });
});

export default router;
