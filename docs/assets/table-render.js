function splitMarkdownRow(row) {
  const trimmed = row.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = [];
  let current = "";
  let escaped = false;

  for (const char of trimmed) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

function isSeparator(row) {
  return /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(row.trim());
}

function linkify(text) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g);
  const fragment = document.createDocumentFragment();

  for (const part of parts) {
    if (/^https?:\/\//.test(part)) {
      const a = document.createElement("a");
      a.href = part;
      a.textContent = part;
      a.rel = "noopener noreferrer";
      fragment.appendChild(a);
    } else {
      const chunks = part.split("<br>");
      chunks.forEach((chunk, index) => {
        if (index > 0) fragment.appendChild(document.createElement("br"));
        fragment.appendChild(document.createTextNode(chunk));
      });
    }
  }

  return fragment;
}

function renderMarkdownTable(markdown, target) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line, index) => line.startsWith("|") && lines[index + 1] && isSeparator(lines[index + 1]));

  if (start < 0) {
    throw new Error("No Markdown table found.");
  }

  const tableLines = [];
  for (let i = start; i < lines.length; i += 1) {
    if (!lines[i].startsWith("|")) break;
    if (!isSeparator(lines[i])) tableLines.push(lines[i]);
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  tableLines.forEach((line, rowIndex) => {
    const row = document.createElement("tr");
    const cells = splitMarkdownRow(line);
    const cellName = rowIndex === 0 ? "th" : "td";

    cells.forEach((cell) => {
      const el = document.createElement(cellName);
      el.appendChild(linkify(cell));
      row.appendChild(el);
    });

    if (rowIndex === 0) thead.appendChild(row);
    else tbody.appendChild(row);
  });

  table.appendChild(thead);
  table.appendChild(tbody);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);

  target.replaceWith(wrap);
}

async function loadTable() {
  const target = document.querySelector("[data-table-target]");
  const source = document.querySelector("[data-md-url]");
  if (!target || !source) return;

  try {
    const response = await fetch(source.dataset.mdUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown = await response.text();
    renderMarkdownTable(markdown, target);
  } catch (error) {
    target.className = "error";
    target.textContent = `Could not load table: ${error.message}`;
  }
}

loadTable();
