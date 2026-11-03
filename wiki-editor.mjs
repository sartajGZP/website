import fs from "node:fs";
import path from "node:path";

export default function wikiEditorPlugin(eleventyConfig) {
  eleventyConfig.setServerOptions({
    domdiff: false,
    middleware: [
      // 1. New Endpoint: List all files for the link browser
      function wikiListMiddleware(req, res, next) {
        if (req.url.startsWith("/__wiki_list_files")) {
          const IGNORE_DIRS = new Set(['node_modules', '_site', '.git', '.cache']);
          
          function getFiles(dir, baseDir = dir) {
            let results = [];
            try {
              for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  results = results.concat(getFiles(fullPath, baseDir));
                } else if (/\.(md|njk|html)$/i.test(entry.name)) {
                  results.push(path.relative(baseDir, fullPath).replace(/\\/g, '/'));
                }
              }
            } catch (e) {}
            return results;
          }
          
          const files = getFiles(process.cwd());
          res.writeHead(200, { "Content-Type": "application/json" });
          return res.end(JSON.stringify(files));
        }
        next();
      },

      // 2. Existing Endpoint: Create New Page
      function wikiCreateMiddleware(req, res, next) {
        if (req.url.startsWith("/__wiki_create") && req.method === "POST") {
          let body = "";
          req.on("data", chunk => body += chunk);
          req.on("end", () => {
            try {
              const { filepath } = JSON.parse(body);
              if (!filepath) return res.writeHead(400).end();
              
              const safePath = filepath.endsWith('.md') ? filepath : filepath + '.md';
              const absolutePath = path.resolve(process.cwd(), safePath);
              
              if (!absolutePath.startsWith(process.cwd())) return res.writeHead(403).end();
              
              fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
              if (fs.existsSync(absolutePath)) {
                res.writeHead(409, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ error: "File already exists!" }));
              }

              const title = path.basename(safePath, '.md');
              const defaultContent = `---\ntitle: ${title}\n---\n\n`;
              fs.writeFileSync(absolutePath, defaultContent, "utf8");
              
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.writeHead(500).end();
            }
          });
          return;
        }
        next();
      },

      // 3. Existing Endpoint: Suggest Frontmatter
      function wikiSuggestMiddleware(req, res, next) {
        if (req.url.startsWith("/__wiki_suggest_fm")) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const targetPath = path.resolve(process.cwd(), url.searchParams.get("file") || "");
          const dir = path.dirname(targetPath);
          let keys = new Set(["title", "layout", "tags"]); 
          try {
            const files = fs.readdirSync(dir).filter(f => f.endsWith(".md") || f.endsWith(".njk"));
            for (const f of files) {
              const content = fs.readFileSync(path.join(dir, f), "utf8");
              const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
              if (match) {
                match[1].split("\n").forEach(line => {
                  const keyMatch = line.match(/^([a-zA-Z0-9_-]+):/);
                  if (keyMatch) keys.add(keyMatch[1]);
                });
              }
            }
          } catch(e) {}
          let template = "---\n";
          keys.forEach(k => template += `${k}: \n`);
          template += "---\n";
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end(template);
        }
        next();
      },

      // 4. Existing Endpoint: Edit/Save
      function wikiEditMiddleware(req, res, next) {
        if (!req.url.startsWith("/__wiki_edit")) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const targetPath = path.resolve(process.cwd(), url.searchParams.get("file") || "");
        if (!targetPath.startsWith(process.cwd())) {
          res.writeHead(403); return res.end("Forbidden");
        }
        if (req.method === "GET") {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          return res.end(fs.readFileSync(targetPath, "utf8"));
        }
        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => (body += chunk));
          req.on("end", () => {
            fs.writeFileSync(targetPath, body, "utf8");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          });
          return;
        }
        next();
      },
    ],
  });

  eleventyConfig.addTransform("wiki-editor-ui", function (content) {
    if (
      process.env.ELEVENTY_RUN_MODE === "serve" &&
      this.page.outputPath &&
      this.page.outputPath.endsWith(".html") &&
      this.page.inputPath
    ) {
      const inputPath = this.page.inputPath;
      const wikiBar = `
      <style>
        #__wiki_bar { position: sticky; top: 0; z-index: 99999; background: #f8f9fa; border-bottom: 1px solid #a2a9b1; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-family: sans-serif; font-size: 14px; color: #202122; }
        #__wiki_bar .tabs { display: flex; gap: 12px; }
        #__wiki_bar button { background: none; border: none; padding: 4px 8px; cursor: pointer; font-size: 14px; color: #3366cc; font-weight: 600; border-bottom: 2px solid transparent; }
        #__wiki_bar button.active { color: #202122; border-bottom-color: #202122; }
        #__wiki_modal { display: none; position: fixed; inset: 37px 0 0 0; z-index: 99998; background: #fff; flex-direction: column; padding: 12px; box-sizing: border-box; font-family: sans-serif; }
        #__wiki_textarea { flex: 1; width: 100%; box-sizing: border-box; font-family: monospace; font-size: 14px; line-height: 1.5; padding: 10px; border: 1px solid #a2a9b1; resize: none; outline: none; scroll-behavior: smooth; }
        
        /* Actions Bar Styling */
        #__wiki_actions { margin-top: 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        #__wiki_save { background: #3366cc; color: #fff; border: none; padding: 8px 16px; border-radius: 2px; font-weight: bold; cursor: pointer; }
        #__wiki_suggest { background: #00af89; color: #fff; border: none; padding: 8px 16px; border-radius: 2px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
        #__wiki_suggest:disabled { background: #7cccae; cursor: not-allowed; }
        #__wiki_insert_link { background: #fff; color: #202122; border: 1px solid #a2a9b1; padding: 8px 16px; border-radius: 2px; cursor: pointer; font-weight: bold; }
        #__wiki_cancel { background: #eaecf0; color: #202122; border: 1px solid #a2a9b1; padding: 8px 16px; border-radius: 2px; cursor: pointer; }
        
        /* Link Browser Overlay */
        #__wiki_link_browser { display: none; position: absolute; inset: 20px 40px; background: #fff; border: 1px solid #a2a9b1; flex-direction: column; padding: 12px; z-index: 999999; box-shadow: 0 4px 16px rgba(0,0,0,0.2); border-radius: 4px; }
        .wiki-link-item { padding: 8px; border-bottom: 1px solid #eaecf0; cursor: pointer; font-family: monospace; font-size: 13px; color: #3366cc; }
        .wiki-link-item:hover { background: #f8f9fa; }
      </style>
      
      <div id="__wiki_bar">
        <span style="font-family:monospace; font-size:12px; color:#54595d;">${inputPath}</span>
        <div class="tabs">
          <button id="__tab_read" class="active" onclick="__wikiToggle(false)">Read</button>
          <button id="__tab_edit" onclick="__wikiToggle(true)">Edit source</button>
          <button id="__tab_new" onclick="__wikiCreatePage()">+ New Page</button>
        </div>
      </div>
      
      <div id="__wiki_modal">
        <div style="margin-bottom:6px; font-size:13px; color:#54595d;">
          Editing <strong>${inputPath}</strong>
        </div>
        <textarea id="__wiki_textarea" spellcheck="false"></textarea>
        <div id="__wiki_actions">
          <button id="__wiki_save" onclick="__wikiSave()">Save changes</button>
          <button id="__wiki_suggest" onclick="__wikiSuggestFM()">Add front matter</button>
          <button id="__wiki_insert_link" onclick="__wikiOpenLinkBrowser()">🔗 Browse Links</button>
          <button id="__wiki_cancel" onclick="__wikiToggle(false)">Cancel</button>
          <span id="__wiki_status" style="font-size:13px; color:#54595d;"></span>
        </div>
        
        <!-- Searchable Link Browser Overlay -->
        <div id="__wiki_link_browser">
          <div style="display:flex; gap:10px; margin-bottom:10px;">
            <input id="__wiki_link_search" placeholder="Search pages to link..." style="flex:1; padding:8px; border:1px solid #ccc; font-size:14px; outline:none;" onkeyup="__wikiFilterLinks()">
            <button onclick="document.getElementById('__wiki_link_browser').style.display='none'" style="padding:8px 16px; cursor:pointer; border:1px solid #ccc; background:#f8f9fa;">Close</button>
          </div>
          <div id="__wiki_link_list" style="flex:1; overflow-y:auto; border:1px solid #eaecf0;"></div>
        </div>
      </div>

      <script>
        const __WIKI_FILE = ${JSON.stringify(inputPath)};
        let __allWikiFiles = [];
        
        // ---- Link Browser Logic ----
        async function __wikiOpenLinkBrowser() {
          const res = await fetch('/__wiki_list_files');
          __allWikiFiles = await res.json();
          __wikiRenderLinks(__allWikiFiles);
          document.getElementById('__wiki_link_browser').style.display = 'flex';
          document.getElementById('__wiki_link_search').focus();
        }

        function __wikiRenderLinks(files) {
          const list = document.getElementById('__wiki_link_list');
          list.innerHTML = files.map(f => 
            '<div class="wiki-link-item" onclick="__wikiInsertLink(\\'' + f + '\\')">' + f + '</div>'
          ).join('');
        }

        function __wikiFilterLinks() {
          const q = document.getElementById('__wiki_link_search').value.toLowerCase();
          const filtered = __allWikiFiles.filter(f => f.toLowerCase().includes(q));
          __wikiRenderLinks(filtered);
        }

        function __wikiInsertLink(filePath) {
          const ta = document.getElementById('__wiki_textarea');
          
          // Convert the physical file path to an Eleventy-style URL path
          let urlPath = '/' + filePath
            .replace(/\\\\/g, '/')         // Fix Windows slashes if any
            .replace(/\\.md$/, '/')       // Replace .md with trailing slash
            .replace(/\\.njk$/, '/')      // Replace .njk with trailing slash
            .replace(/\\/index\\/$/, '/'); // index pages just route to their folder

          // Strip "src/" from the beginning of the URL if your project uses a src folder
          if (urlPath.startsWith('/src/')) {
            urlPath = urlPath.replace('/src/', '/');
          }

          const pageName = filePath.split('/').pop().replace('.md', '').replace('.njk', '').replace('index', 'Home');
          const linkText = '[' + pageName + '](' + urlPath + ')';
          
          // Insert at cursor position
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          ta.setRangeText(linkText, start, end, 'select');
          
          document.getElementById('__wiki_link_browser').style.display = 'none';
          ta.focus();
        }
        // ----------------------------

        async function __wikiCreatePage() {
          const filepath = prompt("Enter new file path (e.g., src/books/new-book.md or books/new-book.md):");
          if (!filepath) return;
          const res = await fetch('/__wiki_create', { method: 'POST', body: JSON.stringify({ filepath }) });
          if (res.ok) {
            alert("Page created! Use the 'Browse Links' button to link to it.");
          } else {
            const err = await res.json(); alert("Error: " + err.error);
          }
        }

        async function __wikiToggle(editMode) {
          const modal = document.getElementById('__wiki_modal');
          document.getElementById('__tab_read').classList.toggle('active', !editMode);
          document.getElementById('__tab_edit').classList.toggle('active', editMode);
          if (editMode) {
            const res = await fetch('/__wiki_edit?file=' + encodeURIComponent(__WIKI_FILE));
            document.getElementById('__wiki_textarea').value = await res.text();
            modal.style.display = 'flex';
          } else {
            modal.style.display = 'none';
          }
        }

        async function __wikiSave() {
          const status = document.getElementById('__wiki_status');
          status.textContent = 'Saving...';
          const content = document.getElementById('__wiki_textarea').value;
          await fetch('/__wiki_edit?file=' + encodeURIComponent(__WIKI_FILE), {
            method: 'POST', body: content
          });
          setTimeout(() => window.location.reload(), 300);
        }

        async function __wikiSuggestFM() {
          const ta = document.getElementById('__wiki_textarea');
          const btn = document.getElementById('__wiki_suggest');
          if (ta.value.trim().startsWith('---')) {
            alert('This file already has frontmatter!'); return;
          }
          ta.scrollTo({ top: 0, behavior: 'smooth' });
          const originalText = btn.textContent;
          btn.textContent = 'Searching...'; btn.disabled = true;
          await new Promise(r => setTimeout(r, 600));
          const res = await fetch('/__wiki_suggest_fm?file=' + encodeURIComponent(__WIKI_FILE));
          const template = await res.text();
          ta.value = template + '\\n' + ta.value;
          ta.scrollTo({ top: 0, behavior: 'smooth' });
          btn.textContent = originalText; btn.disabled = false;
        }
      </script>`;

      if (/<body[^>]*>/i.test(content)) {
        return content.replace(/<body[^>]*>/i, (match) => `${match}\n${wikiBar}`);
      } else {
        return `${wikiBar}\n${content}`;
      }
    }
    return content;
  });
}

