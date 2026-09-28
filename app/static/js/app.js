mermaid.initialize({ startOnLoad: false, securityLevel: 'loose', theme: 'default' });

const endpoints = {
    'mindmap': '/mindmap',
    'uml': '/uml',
    'flowchart': '/flowchart',
    'er': '/er',
    'system-design': '/system-design',
    'architecture': '/architecture',
    'api-design': '/api-design',
    'database-schema': '/database-schema',
};

const labels = {
    'mindmap': 'AI Mind Map',
    'uml': 'AI UML Diagrams',
    'flowchart': 'AI Flowchart',
    'er': 'AI ER Diagram',
    'system-design': 'AI System Design',
    'architecture': 'AI Architecture',
    'api-design': 'AI API Design',
    'database-schema': 'AI Database Schema',
    'mermaid': 'Mermaid',
    'plantuml': 'PlantUML',
    'sql': 'SQL Schema',
    'json': 'JSON / API',
    'python': 'Python',
    'raw': 'Full Response',
};

const downloadExtensions = {
    'mermaid': '.mmd',
    'plantuml': '.puml',
    'sql': '.sql',
    'json': '.json',
    'python': '.py',
    'raw': '.md',
};

let currentModule = 'mindmap';
let currentResult = {};

const ideaInput = document.getElementById('idea-input');
const moduleSelect = document.getElementById('module-select');
const generateBtn = document.getElementById('generate-btn');
const clearBtn = document.getElementById('clear-btn');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error-box');
const outputSection = document.getElementById('output-section');
const overviewContent = document.getElementById('overview-content');
const diagramCard = document.getElementById('diagram-card');
const mermaidPreview = document.getElementById('mermaid-preview');
const codeTabs = document.getElementById('code-tabs');
const codePanels = document.getElementById('code-panels');
const moduleNav = document.getElementById('module-nav');
const toast = document.getElementById('toast');
const schemaCard = document.getElementById('schema-card');
const schemaGrid = document.getElementById('schema-grid');
const schemaCount = document.getElementById('schema-count');
const schemaRelations = document.getElementById('schema-relations');
const schemaRelationsList = document.getElementById('schema-relations-list');

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl transform transition-transform duration-300 z-50 ${type === 'error' ? 'bg-red-600' : 'bg-slate-800'} text-white`;
    toast.classList.remove('translate-y-24');
    setTimeout(() => toast.classList.add('translate-y-24'), 3000);
}

function selectModule(module) {
    currentModule = module;
    moduleSelect.value = module;
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.module === module);
    });
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function inlineFormat(s) {
    return escapeHtml(s)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded text-[0.85em] font-mono">$1</code>');
}

function splitTableRow(row) {
    let cells = row.split('|');
    if (cells.length && cells[0].trim() === '') cells.shift();
    if (cells.length && cells[cells.length - 1].trim() === '') cells.pop();
    return cells.map(c => c.trim());
}

function simpleMarkdownToHtml(markdown) {
    if (!markdown) return '<p class="text-slate-400 italic">No description generated.</p>';
    const lines = markdown.split('\n');
    const out = [];
    let i = 0;
    let listOpen = null;

    const closeList = () => {
        if (listOpen) { out.push(`</${listOpen}>`); listOpen = null; }
    };

    const headerClasses = {
        1: 'text-2xl font-bold mt-6 mb-3 text-slate-800',
        2: 'text-xl font-semibold mt-6 mb-3 text-slate-800 border-b border-slate-200 pb-1',
        3: 'text-lg font-semibold mt-5 mb-2 text-slate-700',
        4: 'text-base font-semibold mt-4 mb-2 text-slate-700',
    };

    while (i < lines.length) {
        const trimmed = lines[i].trim();

        // Markdown table: header row followed by |---|---| separator row
        if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|?[\s:|-]+\|?$/.test(lines[i + 1].trim()) && lines[i + 1].includes('-')) {
            closeList();
            const headerCells = splitTableRow(trimmed);
            i += 2;
            let html = '<div class="overflow-x-auto my-4 rounded-xl border border-slate-200 shadow-sm"><table class="min-w-full text-sm"><thead><tr class="bg-gradient-to-r from-blue-600 to-blue-500 text-white">';
            headerCells.forEach(c => { html += `<th class="px-4 py-2.5 text-left font-semibold whitespace-nowrap">${inlineFormat(c)}</th>`; });
            html += '</tr></thead><tbody>';
            let rowIndex = 0;
            while (i < lines.length && lines[i].trim().startsWith('|')) {
                const rowCells = splitTableRow(lines[i].trim());
                html += `<tr class="${rowIndex % 2 ? 'bg-blue-50/50' : 'bg-white'}">`;
                rowCells.forEach(c => { html += `<td class="px-4 py-2.5 border-t border-slate-100 text-slate-700">${inlineFormat(c)}</td>`; });
                html += '</tr>';
                rowIndex++;
                i++;
            }
            html += '</tbody></table></div>';
            out.push(html);
            continue;
        }

        const hMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
        if (hMatch) {
            closeList();
            const level = hMatch[1].length;
            out.push(`<h${level} class="${headerClasses[level] || headerClasses[4]}">${inlineFormat(hMatch[2])}</h${level}>`);
            i++;
            continue;
        }

        if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) { closeList(); out.push('<hr class="my-4 border-slate-200">'); i++; continue; }

        const ulMatch = trimmed.match(/^[-*+]\s+(.*)/);
        if (ulMatch) {
            if (listOpen !== 'ul') { closeList(); out.push('<ul class="list-disc ml-6 my-3 space-y-1.5 text-slate-700">'); listOpen = 'ul'; }
            out.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
            i++;
            continue;
        }

        const olMatch = trimmed.match(/^\d+[.)]\s+(.*)/);
        if (olMatch) {
            if (listOpen !== 'ol') { closeList(); out.push('<ol class="list-decimal ml-6 my-3 space-y-1.5 text-slate-700">'); listOpen = 'ol'; }
            out.push(`<li>${inlineFormat(olMatch[1])}</li>`);
            i++;
            continue;
        }

        if (!trimmed) { closeList(); i++; continue; }

        closeList();
        out.push(`<p class="mb-3 leading-relaxed text-slate-700">${inlineFormat(trimmed)}</p>`);
        i++;
    }
    closeList();
    return out.join('');
}

// ---------- SQL schema parsing ----------

function splitTopLevel(str) {
    const parts = [];
    let depth = 0, cur = '';
    for (const ch of str) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
        if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; }
        else cur += ch;
    }
    if (cur.trim()) parts.push(cur);
    return parts;
}

function parseSqlSchema(sql) {
    const tables = [];
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`\[\]]?([\w.]+)["'`\[\]]?\s*\(([\s\S]*?)\)\s*;/gi;
    let m;
    while ((m = regex.exec(sql)) !== null) {
        const tableName = m[1];
        const body = m[2];
        const columns = [];
        const tableFks = {};

        splitTopLevel(body).forEach(part => {
            const p = part.trim();
            if (!p) return;

            if (/^FOREIGN\s+KEY/i.test(p)) {
                const fkCols = p.match(/FOREIGN\s+KEY\s*\(([^)]+)\)/i);
                const ref = p.match(/REFERENCES\s+["'`]?([\w.]+)["'`]?\s*\(([^)]+)\)/i);
                if (fkCols && ref) {
                    fkCols[1].split(',').forEach(col => {
                        tableFks[col.trim().replace(/["'`\[\]]/g, '')] = `${ref[1]}(${ref[2].trim()})`;
                    });
                }
                return;
            }
            if (/^(PRIMARY\s+KEY|CONSTRAINT|UNIQUE\s*\(|INDEX|CHECK|KEY\s*\()/i.test(p)) return;

            const tokens = p.split(/\s+/);
            const colName = tokens[0].replace(/["'`\[\]]/g, '');
            const colType = (tokens[1] || '').replace(/,$/, '');
            const ref = p.match(/REFERENCES\s+["'`]?([\w.]+)["'`]?\s*\((\w+)\)/i);
            columns.push({
                name: colName,
                type: colType,
                pk: /PRIMARY\s+KEY/i.test(p),
                unique: /\bUNIQUE\b/i.test(p),
                notNull: /NOT\s+NULL/i.test(p),
                auto: /(AUTO_INCREMENT|AUTOINCREMENT|SERIAL|IDENTITY|GENERATED)/i.test(p),
                fk: !!ref,
                ref: ref ? `${ref[1]}(${ref[2]})` : null,
            });
        });

        columns.forEach(c => {
            if (tableFks[c.name]) { c.fk = true; c.ref = c.ref || tableFks[c.name]; }
            if (c.pk) c.notNull = true;
        });

        tables.push({ name: tableName, columns });
    }
    return tables;
}

function renderSchemaCards(sql) {
    const tables = parseSqlSchema(sql);
    if (!tables.length) return { html: '', relations: [] };

    const relations = [];
    const html = tables.map(t => `
        <div class="border border-slate-200 rounded-xl overflow-hidden bg-white/90 shadow-sm hover:shadow-md transition">
            <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 flex items-center justify-between">
                <span class="font-semibold text-sm tracking-wide font-mono">${escapeHtml(t.name)}</span>
                <span class="text-[10px] bg-white/25 px-2 py-0.5 rounded-full">${t.columns.length} cols</span>
            </div>
            <table class="w-full text-xs">
                <thead>
                    <tr class="bg-slate-50 text-slate-500 text-left">
                        <th class="px-3 py-2 font-medium">Column</th>
                        <th class="px-3 py-2 font-medium">Type</th>
                        <th class="px-3 py-2 font-medium">Keys</th>
                    </tr>
                </thead>
                <tbody>
                ${t.columns.map(c => {
                    if (c.fk && c.ref) relations.push(`${t.name}.${c.name} → ${c.ref}`);
                    return `
                    <tr class="border-t border-slate-100 hover:bg-blue-50/40">
                        <td class="px-3 py-2 font-mono text-slate-800">${escapeHtml(c.name)}${c.auto ? ' <span class="text-slate-400">⚙</span>' : ''}</td>
                        <td class="px-3 py-2 font-mono text-blue-600">${escapeHtml(c.type)}</td>
                        <td class="px-3 py-2 whitespace-nowrap space-x-1">
                            ${c.pk ? '<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">PK</span>' : ''}
                            ${c.fk ? `<span class="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-semibold" title="References ${escapeHtml(c.ref || '')}">FK</span>` : ''}
                            ${c.unique && !c.pk ? '<span class="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">UQ</span>' : ''}
                            ${c.notNull && !c.pk ? '<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">NN</span>' : ''}
                        </td>
                    </tr>`;
                }).join('')}
                </tbody>
            </table>
        </div>`).join('');

    return { html, relations };
}

function sanitizeName(name) {
    return String(name).replace(/[^\w]/g, '_');
}

function buildErMermaid(tables) {
    let code = 'erDiagram\n';
    const relations = [];
    tables.forEach(t => {
        code += `    ${sanitizeName(t.name)} {\n`;
        t.columns.forEach(c => {
            const type = (c.type || 'string').replace(/[^\w]/g, '_');
            let line = `        ${type} ${sanitizeName(c.name)}`;
            if (c.pk) line += ' PK';
            else if (c.fk) line += ' FK';
            code += line + '\n';
            if (c.fk && c.ref) {
                const refTable = sanitizeName(c.ref.split('(')[0]);
                relations.push(`    ${refTable} ||--o{ ${sanitizeName(t.name)} : "${c.name}"`);
            }
        });
        code += '    }\n';
    });
    code += relations.join('\n') + '\n';
    return code;
}

// ---------- Rendering ----------

function sanitizeMermaid(code) {
    if (/^\s*mindmap/m.test(code)) {
        // Mindmap: plain-text nodes break on () / : # etc. Wrap risky lines as id["label"].
        let counter = 0;
        return code.split('\n').map(line => {
            const m = line.match(/^(\s+)(\S.*)$/);
            if (!m || /^\s*mindmap/.test(line)) return line;
            const text = m[2].trim();
            // keep nodes that already declare a shape: id[..], id(..), id((..)), id{{..}}, quoted
            if (/^["'].*["']$/.test(text) || /\w+(\[\[|\[|\(|\(\(|\)\(|\)\)|\{\{)/.test(text)) return line;
            if (/[^A-Za-z0-9 _&+\-.,]/.test(text)) {
                counter++;
                return `${m[1]}n${counter}["${text.replace(/["\\]/g, "'")}"]`;
            }
            return line;
        }).join('\n');
    }
    // flowchart/graph/sequence: quote labels containing risky characters
    return code
        .replace(/(\w+)\[([^\]"\n]*[/():;][^\]"\n]*)\]/g, (_, id, label) => `${id}["${label.trim().replace(/"/g, "'")}"]`)
        .replace(/\|([^|"\n]*[/():;][^|"\n]*)\|/g, (_, label) => `|"${label.trim().replace(/"/g, "'")}"|`);
}

async function renderSingleMermaid(holder, code) {
    let lastErr = null;
    for (const candidate of [...new Set([code, sanitizeMermaid(code)])]) {
        try {
            await mermaid.parse(candidate);
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = candidate;
            holder.appendChild(div);
            await mermaid.run({ nodes: [div] });
            return;
        } catch (err) {
            lastErr = err;
            holder.innerHTML = '';
        }
    }
    holder.innerHTML = `
        <div class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p class="font-semibold">Diagram could not be rendered</p>
            ${lastErr ? `<p class="mt-1 font-mono text-xs text-amber-700">${escapeHtml(String(lastErr.message || lastErr).slice(0, 200))}</p>` : ''}
            <details class="mt-2"><summary class="cursor-pointer text-xs underline">Show source</summary>
            <pre class="mt-1 text-xs whitespace-pre-wrap font-mono">${escapeHtml(code)}</pre></details>
        </div>`;
}

async function renderDiagrams(blocks) {
    mermaidPreview.innerHTML = '';
    for (const block of blocks) {
        const wrap = document.createElement('div');
        wrap.className = 'mb-5 last:mb-0';
        if (block.title) {
            const h = document.createElement('h4');
            h.className = 'text-sm font-semibold text-slate-600 mb-2';
            h.textContent = block.title;
            wrap.appendChild(h);
        }
        const holder = document.createElement('div');
        holder.className = 'overflow-x-auto bg-white rounded-lg border border-slate-100 p-3';
        wrap.appendChild(holder);
        mermaidPreview.appendChild(wrap);
        await renderSingleMermaid(holder, block.code);
    }
}

function renderOutput(result) {
    currentResult = result;
    outputSection.classList.remove('hidden');

    overviewContent.innerHTML = simpleMarkdownToHtml(result.overview || result.raw || '');

    const schema = result.sql ? renderSchemaCards(result.sql) : { html: '', relations: [] };
    const parsedTables = result.sql ? parseSqlSchema(result.sql) : [];

    let mermaidBlocks = Array.isArray(result.mermaid_blocks) && result.mermaid_blocks.length
        ? result.mermaid_blocks
        : ((result.mermaid || '').trim() ? [{ title: null, code: result.mermaid.trim() }] : []);
    if (!mermaidBlocks.length && parsedTables.length) {
        mermaidBlocks = [{ title: 'ER Diagram (generated from SQL)', code: buildErMermaid(parsedTables) }];
    }
    if (mermaidBlocks.length) {
        diagramCard.classList.remove('hidden');
        renderDiagrams(mermaidBlocks);
    } else {
        diagramCard.classList.add('hidden');
    }

    if (schema.html) {
        schemaGrid.innerHTML = schema.html;
        schemaCount.textContent = `${schemaGrid.children.length} tables`;
        schemaCard.classList.remove('hidden');
        if (schema.relations.length) {
            schemaRelationsList.innerHTML = schema.relations.map(r =>
                `<span class="px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-mono">${escapeHtml(r)}</span>`
            ).join('');
            schemaRelations.classList.remove('hidden');
        } else {
            schemaRelations.classList.add('hidden');
        }
    } else {
        schemaCard.classList.add('hidden');
    }

    renderCodePanels(result);
}

function detectLanguage(key) {
    if (key === 'sql') return 'sql';
    if (key === 'json') return 'json';
    if (key === 'python') return 'python';
    return 'text';
}

function renderCodePanels(result) {
    codeTabs.innerHTML = '';
    codePanels.innerHTML = '';

    const sections = [
        { key: 'mermaid', label: 'Mermaid' },
        { key: 'plantuml', label: 'PlantUML' },
        { key: 'sql', label: 'SQL Schema' },
        { key: 'json', label: 'JSON / API' },
        { key: 'python', label: 'Python' },
        { key: 'raw', label: 'Full Response' },
    ];

    let first = true;
    sections.forEach(({ key, label }) => {
        const content = result[key];
        if (!content || !content.trim()) return;

        const tab = document.createElement('button');
        tab.id = `tab-${key}`;
        tab.className = `code-tab px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium transition ${first ? 'active' : 'bg-white/60 text-slate-600 hover:bg-blue-50'}`;
        tab.textContent = label;
        tab.onclick = () => activateTab(key);
        codeTabs.appendChild(tab);

        const lang = detectLanguage(key);
        const panel = document.createElement('div');
        panel.id = `panel-${key}`;
        panel.className = first ? 'block' : 'hidden';
        panel.innerHTML = `
            <div class="flex justify-end gap-2 mb-2">
                <button onclick="copyCode('${key}')" class="px-3 py-1.5 text-xs rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition">Copy</button>
                <button onclick="downloadCode('${key}')" class="px-3 py-1.5 text-xs rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Download</button>
            </div>
            <pre class="language-${lang}"><code class="language-${lang}">${escapeHtml(content)}</code></pre>
        `;
        codePanels.appendChild(panel);

        first = false;
    });

    if (window.Prism) Prism.highlightAll();
}

function activateTab(key) {
    document.querySelectorAll('.code-tab').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('bg-white/60', 'text-slate-600', 'hover:bg-blue-50');
    });
    const activeTab = document.getElementById(`tab-${key}`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.remove('bg-white/60', 'text-slate-600', 'hover:bg-blue-50');
    }

    codePanels.querySelectorAll(':scope > div').forEach(div => div.classList.add('hidden'));
    const activePanel = document.getElementById(`panel-${key}`);
    if (activePanel) activePanel.classList.remove('hidden');
}

window.copyCode = function (key) {
    const content = currentResult[key] || '';
    navigator.clipboard.writeText(content)
        .then(() => showToast(`${labels[key] || key} copied to clipboard`))
        .catch(() => showToast('Copy failed', 'error'));
};

window.downloadCode = function (key) {
    const content = currentResult[key] || '';
    if (!content.trim()) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentModule}${downloadExtensions[key] || '.txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download started');
};

async function generate() {
    const idea = ideaInput.value.trim();
    if (!idea) {
        showToast('Please enter a project description', 'error');
        return;
    }

    loading.classList.remove('hidden');
    outputSection.classList.add('hidden');
    errorBox.classList.add('hidden');

    try {
        const response = await fetch(endpoints[currentModule], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }

        renderOutput(result);
        showToast(`${labels[currentModule]} generated`);
    } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove('hidden');
        showToast(err.message, 'error');
    } finally {
        loading.classList.add('hidden');
    }
}

function clearAll() {
    ideaInput.value = '';
    outputSection.classList.add('hidden');
    errorBox.classList.add('hidden');
    loading.classList.add('hidden');
    schemaCard.classList.add('hidden');
    mermaidPreview.innerHTML = '';
    codeTabs.innerHTML = '';
    codePanels.innerHTML = '';
    schemaGrid.innerHTML = '';
    schemaRelationsList.innerHTML = '';
}

moduleNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.module-btn');
    if (!btn) return;
    selectModule(btn.dataset.module);
});

moduleSelect.addEventListener('change', (e) => selectModule(e.target.value));
generateBtn.addEventListener('click', generate);
clearBtn.addEventListener('click', clearAll);

ideaInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') generate();
});

selectModule('mindmap');
