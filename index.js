const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // or use env var for prod
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = '1BF5wTLhMsjrSOkENImT-n1u_aXVaSy8LGrBpzH2CWxw';
const sheetName = 'Sheet1';

app.get('/get-invite', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:B`,
    });

    const rows = readRes.data.values || [];
    console.log("Fetched rows:", rows);

    const rowIndex = rows.findIndex(row => !row[1] || row[1].toLowerCase() !== 'yes');
    if (rowIndex === -1) {
      return res.status(404).send('No unused invite codes.');
    }

    const inviteCode = rows[rowIndex]?.[0];
    if (!inviteCode) {
      return res.status(404).send('Invite code missing.');
    }

    const actualRow = rowIndex + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B${actualRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Yes']],
      },
    });

    res.json({ inviteCode });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
