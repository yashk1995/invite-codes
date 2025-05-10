import { google } from 'googleapis';

export default async function handler(req, res) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const spreadsheetId = '1BF5wTLhMsjrSOkENImT-n1u_aXVaSy8LGrBpzH2CWxw';
  const sheetName = 'Sheet1';

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A2:B`,
    });

    const rows = readRes.data.values || [];
    const rowIndex = rows.findIndex(row => !row[1] || row[1].toLowerCase() !== 'yes');
    if (rowIndex === -1) {
      return res.status(404).json({ error: 'No unused invite codes.' });
    }

    const code = rows[rowIndex][0];
    const actualRow = rowIndex + 2;

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!B${actualRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [['Yes']] },
    });

    res.status(200).json({ inviteCode: code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
