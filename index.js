const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const spreadsheetId = '1BF5wTLhMsjrSOkENImT-n1u_aXVaSy8LGrBpzH2CWxw';
const sheetName = 'Sheet1';

app.get('/get-invite', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Read data
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:B`,
    });

    const rows = readRes.data.values;
    if (!rows || rows.length === 0) {
      return res.status(404).send('No invite codes available.');
    }

    // Find first unused code
    const rowIndex = rows.findIndex(row => row[1] !== 'Yes');
    if (rowIndex === -1) {
      return res.status(404).send('No unused invite codes.');
    }

    const inviteCode = rows[rowIndex][0];
    const actualRow = rowIndex + 2; // Adjust for header and 0-based index

    // Mark as used
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
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
console.log("Rows from sheet:", rows);
