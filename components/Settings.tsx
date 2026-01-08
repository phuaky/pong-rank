import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { getApiUrl, setApiUrl } from '../services/dataService';
import { Save, Copy, Check } from 'lucide-react';

interface SettingsProps {
  onSave: () => void;
  onCancel: () => void;
  isFirstRun?: boolean;
}

const GAS_SCRIPT_CODE = `// 1. Open your Google Sheet
// 2. Extensions > Apps Script
// 3. Paste this code
// 4. Deploy > New Deployment > Web App
// 5. Execute as: "Me"
// 6. Who has access: "Anyone"

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pSheet = getOrCreateSheet(ss, 'Players');
  const mSheet = getOrCreateSheet(ss, 'Matches');

  // Read Players
  const pData = pSheet.getDataRange().getValues();
  const players = pData.length > 1 ? parseData(pData) : [];

  // Read Matches
  const mData = mSheet.getDataRange().getValues();
  const matches = mData.length > 1 ? parseData(mData) : [];

  return ContentService.createTextOutput(JSON.stringify({ players, matches }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // FULL SYNC MODE (Simplest for this use case)
    if (body.players) {
      const pSheet = getOrCreateSheet(ss, 'Players');
      pSheet.clear();
      if (body.players.length > 0) {
        const headers = Object.keys(body.players[0]);
        const rows = [headers, ...body.players.map(p => headers.map(h => {
          const val = p[h];
          return (typeof val === 'object') ? JSON.stringify(val) : val;
        }))];
        pSheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      }
    }

    if (body.matches) {
      const mSheet = getOrCreateSheet(ss, 'Matches');
      mSheet.clear();
      if (body.matches.length > 0) {
        const headers = Object.keys(body.matches[0]);
        const rows = [headers, ...body.matches.map(m => headers.map(h => {
           const val = m[h];
           return (typeof val === 'object') ? JSON.stringify(val) : val;
        }))];
        mSheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function parseData(values) {
  const headers = values[0];
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      try {
        // Try parsing JSON for array/object fields
        obj[h] = JSON.parse(row[i]);
      } catch (e) {
        obj[h] = row[i];
      }
    });
    return obj;
  });
}`;

export const Settings: React.FC<SettingsProps> = ({ onSave, onCancel, isFirstRun = false }) => {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const existing = getApiUrl();
    if (existing) setUrl(existing);
  }, []);

  const handleSave = () => {
    if (!url.trim()) return;
    setApiUrl(url.trim());
    onSave();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(GAS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">
          {isFirstRun ? 'Welcome to PongRank' : 'Settings'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect your Google Sheet to start tracking.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Step 1: Code */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">1. Google Apps Script</h3>
            <button 
              onClick={handleCopy}
              className="text-xs flex items-center gap-1 text-emerald-600 font-medium hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Create a new Google Sheet. Go to <strong>Extensions &gt; Apps Script</strong>. 
            Delete everything there and paste this code.
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-[10px] leading-relaxed overflow-x-auto h-48 border border-gray-800">
              <code>{GAS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </section>

        {/* Step 2: Deploy */}
        <section>
          <h3 className="font-semibold text-gray-900 mb-2">2. Deploy Web App</h3>
          <ul className="text-sm text-gray-600 space-y-2 list-disc pl-4">
            <li>Click <strong>Deploy</strong> (blue button) &gt; <strong>New deployment</strong>.</li>
            <li>Select type: <strong>Web app</strong>.</li>
            <li>Description: "PongRank API".</li>
            <li>Execute as: <strong>Me</strong>.</li>
            <li>Who has access: <strong className="text-emerald-600">Anyone</strong> (Important!).</li>
            <li>Copy the <strong>Web app URL</strong> generated.</li>
          </ul>
        </section>

        {/* Step 3: Paste URL */}
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">3. Connect App</h3>
          <Input 
            label="Web App URL"
            placeholder="https://script.google.com/macros/s/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </section>
      </div>

      <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
        {!isFirstRun && (
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button className="flex-1 flex items-center justify-center gap-2" onClick={handleSave}>
          <Save className="w-4 h-4" />
          {isFirstRun ? 'Get Started' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};