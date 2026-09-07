require('dotenv').config();

const { google } = require('googleapis');
const TurndownService = require('turndown');
const EleventyFetch = require('@11ty/eleventy-fetch');

const folderLinks = [
  "https://drive.google.com/drive/folders/1AuLR5H1TymL2S9TXrqhks03xEoTX6H5_"
];

const turndown = new TurndownService({ 
  headingStyle: 'atx',
  codeBlockStyle: 'fenced' 
});

const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

module.exports = async function() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) return { folders: [], docs: [] };

  const drive = google.drive({ version: 'v3', auth: apiKey });
  const allFolders = [];
  const allDocs = [];

  async function crawlDirectory(folderId, currentPath = "") {
    // 1. Get folder metadata
    const meta = await drive.files.get({ fileId: folderId, fields: 'name' });
    const folderName = meta.data.name;
    const folderSlug = slugify(folderName);
    const fullPath = currentPath ? `${currentPath}/${folderSlug}` : folderSlug;

    // 2. Fetch all child items (both folders and docs)
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType = 'application/vnd.google-apps.document')`,
      fields: 'files(id, name, mimeType, owners, modifiedTime)',
    });

    const items = res.data.files || [];
    const subfolders = [];
    const docs = [];

    for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        const subfolderSlug = slugify(item.name);
        const subPath = `${fullPath}/${subfolderSlug}`;
        subfolders.push({
          name: item.name,
          slug: subfolderSlug,
          path: subPath
        });
        // Recurse into subfolder
        await crawlDirectory(item.id, fullPath);
      } else {
        const docSlug = slugify(item.name);
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${item.id}/export?mimeType=text/html&key=${apiKey}`;
        const html = await EleventyFetch(exportUrl, { duration: "1d", type: "text" });

        const docData = {
          id: item.id,
          title: item.name,
          author: item.owners?.[0]?.displayName || 'Public Contributor',
          date: item.modifiedTime ? item.modifiedTime.split('T')[0] : 'Unknown',
          folderPath: fullPath,
          slug: docSlug,
          url: `/shared-docs/${fullPath}/${docSlug}/`,
          content: turndown.turndown(html)
        };

        docs.push(docData);
        allDocs.push(docData);
      }
    }

    allFolders.push({
      name: folderName,
      path: fullPath,
      subfolders,
      docs
    });
  }

  for (const url of folderLinks) {
    const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
    if (match) await crawlDirectory(match[1]);
  }

  return { folders: allFolders, docs: allDocs };
};

