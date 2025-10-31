import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const SETTINGS_PATH = path.resolve('./settings.json');

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
