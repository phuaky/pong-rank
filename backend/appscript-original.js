// ORIGINAL VERSION - Full state replacement (problematic)
// 1. Open your Google Sheet
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
}
