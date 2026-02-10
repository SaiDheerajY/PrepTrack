import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./CodeVault.css";

const LANGUAGES = [
    "JavaScript", "Python", "C++", "Java", "TypeScript",
    "Go", "Rust", "SQL", "HTML/CSS", "Shell", "Other"
];

const LANG_ICONS = {
    "JavaScript": "JS", "Python": "PY", "C++": "C+", "Java": "JV", "TypeScript": "TS",
    "Go": "GO", "Rust": "RS", "SQL": "SQ", "HTML/CSS": "WB", "Shell": "SH", "Other": "??"
};

function CodeVault({ snippets = [], setSnippets }) {
    // --- FOLDER STATE ---
    // folders: [{ id, name, parentId }]  (parentId = null means root)
    // snippets now have folderId property
    const [folders, setFolders] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("vault_folders")) || [];
        } catch { return []; }
    });
    const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [renamingFolderId, setRenamingFolderId] = useState(null);

    // --- SNIPPET STATE ---
    const [showModal, setShowModal] = useState(false);
    const [activeSnippetId, setActiveSnippetId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState(null);
    const [newTitle, setNewTitle] = useState("");
    const [newLang, setNewLang] = useState("JavaScript");
    const [newCode, setNewCode] = useState("");
    const [newTags, setNewTags] = useState("");
    const [newNotes, setNewNotes] = useState("");
    const [editingId, setEditingId] = useState(null);

    // Persist folders
    const saveFolders = (updated) => {
        setFolders(updated);
        localStorage.setItem("vault_folders", JSON.stringify(updated));
    };

    // --- DERIVED DATA ---
    const activeSnippet = snippets.find(s => s.id === activeSnippetId);

    // Get child folders of current folder
    const childFolders = folders.filter(f => f.parentId === currentFolderId);

    // Get snippets in current folder
    const currentSnippets = snippets.filter(s => (s.folderId || null) === currentFolderId);

    // Search: search all snippets globally
    const searchResults = searchQuery ? snippets.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.language.toLowerCase().includes(searchQuery.toLowerCase())
    ) : null;

    // Breadcrumb path
    const breadcrumb = useMemo(() => {
        const path = [];
        let id = currentFolderId;
        while (id) {
            const folder = folders.find(f => f.id === id);
            if (!folder) break;
            path.unshift(folder);
            id = folder.parentId;
        }
        return path;
    }, [currentFolderId, folders]);

    // Count snippets in a folder (recursive)
    const countInFolder = (folderId) => {
        let count = snippets.filter(s => (s.folderId || null) === folderId).length;
        folders.filter(f => f.parentId === folderId).forEach(child => {
            count += countInFolder(child.id);
        });
        return count;
    };

    // Code lines for viewer
    const codeLines = useMemo(() => {
        if (!activeSnippet) return [];
        return activeSnippet.code.split("\n");
    }, [activeSnippet]);

    // Stats
    const totalLines = snippets.reduce((acc, s) => acc + s.code.split("\n").length, 0);
    const uniqueLangs = [...new Set(snippets.map(s => s.language))].length;

    // --- FOLDER OPERATIONS ---
    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;
        const folder = {
            id: Date.now().toString(),
            name: newFolderName.trim(),
            parentId: currentFolderId,
        };
        saveFolders([...folders, folder]);
        setNewFolderName("");
        setShowFolderModal(false);
    };

    const handleRenameFolder = (id, newName) => {
        if (!newName.trim()) return;
        saveFolders(folders.map(f => f.id === id ? { ...f, name: newName.trim() } : f));
        setRenamingFolderId(null);
        setNewFolderName("");
    };

    const handleDeleteFolder = (id) => {
        // Recursively collect all descendant folder IDs
        const collectIds = (parentId) => {
            const children = folders.filter(f => f.parentId === parentId);
            let ids = [parentId];
            children.forEach(c => { ids = [...ids, ...collectIds(c.id)]; });
            return ids;
        };
        const idsToRemove = collectIds(id);
        // Remove folders
        saveFolders(folders.filter(f => !idsToRemove.includes(f.id)));
        // Move orphaned snippets to root
        setSnippets(prev => prev.map(s =>
            idsToRemove.includes(s.folderId) ? { ...s, folderId: null } : s
        ));
        if (currentFolderId === id) setCurrentFolderId(null);
    };

    // Navigate into folder
    const openFolder = (folderId) => {
        setCurrentFolderId(folderId);
        setActiveSnippetId(null);
    };

    // Navigate up
    const goUp = () => {
        if (currentFolderId) {
            const current = folders.find(f => f.id === currentFolderId);
            setCurrentFolderId(current ? current.parentId : null);
            setActiveSnippetId(null);
        }
    };

    // Get folder path string
    const getFolderPath = (folderId) => {
        const path = [];
        let id = folderId;
        while (id) {
            const folder = folders.find(f => f.id === id);
            if (!folder) break;
            path.unshift(folder.name);
            id = folder.parentId;
        }
        return path.join(" / ");
    };

    // --- SNIPPET OPERATIONS ---
    const handleAddSnippet = () => {
        if (!newTitle.trim() || !newCode.trim()) return;
        const tags = newTags.split(",").map(t => t.trim()).filter(Boolean);
        const snippet = {
            id: editingId || Date.now().toString(),
            title: newTitle.trim(),
            language: newLang,
            code: newCode,
            tags,
            notes: newNotes.trim(),
            folderId: currentFolderId,
            createdAt: editingId ? snippets.find(s => s.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (editingId) {
            setSnippets(prev => prev.map(s => s.id === editingId ? snippet : s));
            setEditingId(null);
        } else {
            setSnippets(prev => [snippet, ...prev]);
        }
        setActiveSnippetId(snippet.id);
        resetForm();
        setShowModal(false);
    };

    const handleEdit = (snippet) => {
        setEditingId(snippet.id);
        setNewTitle(snippet.title);
        setNewLang(snippet.language);
        setNewCode(snippet.code);
        setNewTags((snippet.tags || []).join(", "));
        setNewNotes(snippet.notes || "");
        setShowModal(true);
    };

    const handleDelete = (id) => {
        setSnippets(prev => prev.filter(s => s.id !== id));
        if (activeSnippetId === id) setActiveSnippetId(null);
    };

    const handleCopy = async (code, id) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (e) { console.error("Copy failed", e); }
    };

    const resetForm = () => {
        setNewTitle(""); setNewLang("JavaScript"); setNewCode("");
        setNewTags(""); setNewNotes(""); setEditingId(null);
    };

    const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    // Items to display (either search results or current folder contents)
    const displaySnippets = searchResults || currentSnippets;
    const isSearching = !!searchQuery;

    return (
        <div className="vault-page">
            <div className="vault-bg-viz"></div>
            <div className="vault-grid-overlay"></div>
            <div className="vault-vignette"></div>
            <div className="vault-scanlines"></div>
            <div className="vault-glow-orb orb-1"></div>
            <div className="vault-glow-orb orb-2"></div>

            <Link to="/" className="vault-exit-btn">» CLOSE</Link>

            {/* HERO */}
            <div className="vault-hero">
                <div className="vault-hero-label">PREPTRACK // NEURAL_ARCHIVE</div>
                <h1 className="vault-hero-title">
                    CODE <span className="vault-hero-accent">VAULT</span>
                </h1>
                <div className="vault-hero-stats">
                    <div className="vault-hero-stat">
                        <span className="stat-value">{snippets.length}</span>
                        <span className="stat-label">RECORDS</span>
                    </div>
                    <div className="vault-hero-divider"></div>
                    <div className="vault-hero-stat">
                        <span className="stat-value">{folders.length}</span>
                        <span className="stat-label">FOLDERS</span>
                    </div>
                    <div className="vault-hero-divider"></div>
                    <div className="vault-hero-stat">
                        <span className="stat-value">{totalLines}</span>
                        <span className="stat-label">LINES</span>
                    </div>
                    <div className="vault-hero-divider"></div>
                    <div className="vault-hero-stat">
                        <span className="stat-value">{uniqueLangs}</span>
                        <span className="stat-label">LANGUAGES</span>
                    </div>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="vault-toolbar">
                <div className="vault-toolbar-left">
                    <div className="vault-search-box">
                        <span className="vault-search-icon">⌕</span>
                        <input
                            type="text"
                            placeholder="Search all snippets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="vault-search-field"
                        />
                        {searchQuery && (
                            <button className="vault-search-clear" onClick={() => setSearchQuery("")}>✕</button>
                        )}
                    </div>
                </div>
                <div className="vault-toolbar-right">
                    <button className="vault-toolbar-btn folder-btn" onClick={() => { setNewFolderName(""); setRenamingFolderId(null); setShowFolderModal(true); }}>
                        <span className="btn-icon">📁</span> NEW FOLDER
                    </button>
                    <button className="vault-toolbar-btn upload-btn" onClick={() => { resetForm(); setShowModal(true); }}>
                        <span className="btn-icon">+</span> UPLOAD CODE
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="vault-content-grid">

                {/* LEFT: File Explorer */}
                <div className="vault-list-panel">

                    {/* Breadcrumb */}
                    <div className="vault-breadcrumb">
                        <button
                            className={`breadcrumb-item ${currentFolderId === null && !isSearching ? 'active' : ''}`}
                            onClick={() => { setCurrentFolderId(null); setActiveSnippetId(null); }}
                        >
                            ROOT
                        </button>
                        {breadcrumb.map(folder => (
                            <span key={folder.id} className="breadcrumb-segment">
                                <span className="breadcrumb-sep">/</span>
                                <button
                                    className={`breadcrumb-item ${folder.id === currentFolderId ? 'active' : ''}`}
                                    onClick={() => openFolder(folder.id)}
                                >
                                    {folder.name.toUpperCase()}
                                </button>
                            </span>
                        ))}
                    </div>

                    {isSearching && (
                        <div className="vault-search-label">
                            SEARCH RESULTS: {displaySnippets.length} found
                        </div>
                    )}

                    <div className="vault-list-scroll">
                        {/* GO UP button */}
                        {currentFolderId && !isSearching && (
                            <div className="vault-folder-item go-up" onClick={goUp}>
                                <span className="folder-icon">↩</span>
                                <span className="folder-name">.. (UP)</span>
                            </div>
                        )}

                        {/* FOLDERS */}
                        {!isSearching && childFolders.map(folder => (
                            <div key={folder.id} className="vault-folder-item" onDoubleClick={() => openFolder(folder.id)}>
                                <div className="folder-main" onClick={() => openFolder(folder.id)}>
                                    <span className="folder-icon">📂</span>
                                    <div className="folder-info">
                                        {renamingFolderId === folder.id ? (
                                            <input
                                                className="folder-rename-input"
                                                autoFocus
                                                defaultValue={folder.name}
                                                onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleRenameFolder(folder.id, e.target.value);
                                                    if (e.key === "Escape") setRenamingFolderId(null);
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="folder-name">{folder.name}</span>
                                        )}
                                        <span className="folder-count">{countInFolder(folder.id)} items</span>
                                    </div>
                                </div>
                                <div className="folder-actions" onClick={e => e.stopPropagation()}>
                                    <button className="folder-act-btn" title="Rename" onClick={() => { setRenamingFolderId(folder.id); }}>✎</button>
                                    <button className="folder-act-btn del" title="Delete" onClick={() => handleDeleteFolder(folder.id)}>✕</button>
                                </div>
                            </div>
                        ))}

                        {/* SNIPPETS */}
                        {displaySnippets.length === 0 && childFolders.length === 0 && !currentFolderId && !isSearching ? (
                            <div className="vault-empty">
                                <div className="vault-empty-icon">
                                    <span className="empty-bracket">{"{"}</span>
                                    <span className="empty-dots">···</span>
                                    <span className="empty-bracket">{"}"}</span>
                                </div>
                                <p className="vault-empty-title">EMPTY VAULT</p>
                                <p className="vault-empty-sub">Create a folder or upload your first snippet</p>
                            </div>
                        ) : displaySnippets.length === 0 && childFolders.length === 0 && !isSearching ? (
                            <div className="vault-empty-small">
                                <p>Empty folder — add snippets or subfolders</p>
                            </div>
                        ) : (
                            displaySnippets.map((snippet, index) => (
                                <div
                                    key={snippet.id}
                                    className={`vault-card ${activeSnippetId === snippet.id ? 'active' : ''}`}
                                    onClick={() => setActiveSnippetId(snippet.id)}
                                    style={{ animationDelay: `${index * 0.04}s` }}
                                >
                                    <div className="vault-card-icon">
                                        {LANG_ICONS[snippet.language] || "??"}
                                    </div>
                                    <div className="vault-card-body">
                                        <div className="vault-card-title">{snippet.title}</div>
                                        <div className="vault-card-meta">
                                            <span className="vault-card-lang">{snippet.language}</span>
                                            <span className="vault-card-sep">•</span>
                                            <span className="vault-card-lines">{snippet.code.split("\n").length} lines</span>
                                            {isSearching && snippet.folderId && (
                                                <>
                                                    <span className="vault-card-sep">•</span>
                                                    <span className="vault-card-path">📁 {getFolderPath(snippet.folderId)}</span>
                                                </>
                                            )}
                                        </div>
                                        {snippet.tags?.length > 0 && (
                                            <div className="vault-card-tags">
                                                {snippet.tags.map(t => <span key={t} className="vault-micro-tag">#{t}</span>)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Code Viewer */}
                <div className="vault-viewer-panel">
                    {activeSnippet ? (
                        <div className="vault-viewer-inner">
                            <div className="vault-viewer-toolbar">
                                <div className="vault-viewer-info">
                                    <span className="vault-viewer-lang-badge">{activeSnippet.language}</span>
                                    <h2 className="vault-viewer-title">{activeSnippet.title}</h2>
                                </div>
                                <div className="vault-viewer-actions">
                                    <button className={`vault-act-btn copy ${copiedId === activeSnippet.id ? 'success' : ''}`}
                                        onClick={() => handleCopy(activeSnippet.code, activeSnippet.id)}>
                                        {copiedId === activeSnippet.id ? "✓ COPIED" : "⧉ COPY"}
                                    </button>
                                    <button className="vault-act-btn edit" onClick={() => handleEdit(activeSnippet)}>✎ EDIT</button>
                                    <button className="vault-act-btn del" onClick={() => handleDelete(activeSnippet.id)}>✕ DEL</button>
                                </div>
                            </div>

                            <div className="vault-viewer-meta-row">
                                <span>CREATED: {formatDate(activeSnippet.createdAt)}</span>
                                {activeSnippet.updatedAt !== activeSnippet.createdAt && (
                                    <span>MODIFIED: {formatDate(activeSnippet.updatedAt)}</span>
                                )}
                                <span>{codeLines.length} LINES</span>
                                {activeSnippet.folderId && (
                                    <span className="meta-path">📁 {getFolderPath(activeSnippet.folderId)}</span>
                                )}
                                {activeSnippet.tags?.length > 0 && activeSnippet.tags.map(t => (
                                    <span key={t} className="meta-tag">#{t}</span>
                                ))}
                            </div>

                            <div className="vault-code-container">
                                <div className="vault-code-gutter">
                                    {codeLines.map((_, i) => (
                                        <div key={i} className="gutter-line">{i + 1}</div>
                                    ))}
                                </div>
                                <pre className="vault-code-block"><code>{activeSnippet.code}</code></pre>
                            </div>

                            {activeSnippet.notes && (
                                <div className="vault-notes-block">
                                    <div className="vault-notes-label">// NOTES</div>
                                    <p className="vault-notes-text">{activeSnippet.notes}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="vault-viewer-empty">
                            <div className="vault-empty-terminal">
                                <div className="terminal-line"><span className="t-prompt">$</span> select --record</div>
                                <div className="terminal-line dim"><span className="t-prompt">_</span> waiting for input...</div>
                                <div className="terminal-cursor"></div>
                            </div>
                            <p className="vault-empty-hint">Select a snippet from the archive<br />or upload a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            <div className="vault-footer">
                <div className="footer-left-group">
                    <span className="footer-stat">ARCHIVE: <span className="highlight-green">{snippets.length} RECORDS</span></span>
                    <span className="footer-stat">FOLDERS: <span className="highlight-green">{folders.length}</span></span>
                </div>
                <div className="footer-right-group">
                    <span className="footer-stat">NEURAL_ARCHIVE <span className="highlight-green">v2.0</span></span>
                    <span className="footer-stat">STATUS: <span className="highlight-green pulsing">ONLINE</span></span>
                </div>
            </div>

            {/* CREATE FOLDER MODAL */}
            {showFolderModal && (
                <div className="vault-modal-overlay" onClick={() => setShowFolderModal(false)}>
                    <div className="vault-modal folder-modal" onClick={e => e.stopPropagation()}>
                        <div className="vault-modal-header">
                            <span className="vault-modal-title">NEW_FOLDER</span>
                            <button className="vault-modal-close" onClick={() => setShowFolderModal(false)}>✕</button>
                        </div>
                        <div className="vault-modal-body">
                            <div className="vault-field">
                                <label>FOLDER NAME</label>
                                <input
                                    type="text"
                                    placeholder={currentFolderId ? "e.g. Dynamic Programming" : "e.g. DSA"}
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
                                />
                            </div>
                            {currentFolderId && (
                                <div className="folder-location-hint">
                                    📁 Will be created inside: <strong>{breadcrumb.map(b => b.name).join(" / ")}</strong>
                                </div>
                            )}
                        </div>
                        <div className="vault-modal-footer">
                            <button className="vault-btn-cancel" onClick={() => setShowFolderModal(false)}>CANCEL</button>
                            <button className="vault-btn-submit" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                                CREATE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CODE SNIPPET MODAL */}
            {showModal && (
                <div className="vault-modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="vault-modal" onClick={e => e.stopPropagation()}>
                        <div className="vault-modal-header">
                            <span className="vault-modal-title">{editingId ? "EDIT_RECORD" : "UPLOAD_CODE"}</span>
                            <button className="vault-modal-close" onClick={() => { setShowModal(false); resetForm(); }}>✕</button>
                        </div>
                        <div className="vault-modal-body">
                            {currentFolderId && (
                                <div className="folder-location-hint">
                                    📁 Saving to: <strong>{breadcrumb.map(b => b.name).join(" / ")}</strong>
                                </div>
                            )}
                            <div className="vault-field">
                                <label>TITLE</label>
                                <input type="text" placeholder="e.g. Dijkstra's Algorithm" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
                            </div>
                            <div className="vault-field">
                                <label>LANGUAGE</label>
                                <select value={newLang} onChange={(e) => setNewLang(e.target.value)}>
                                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                                </select>
                            </div>
                            <div className="vault-field">
                                <label>CODE</label>
                                <textarea placeholder="Paste your code here..." value={newCode} onChange={(e) => setNewCode(e.target.value)} className="code-area" rows={10} spellCheck={false} />
                            </div>
                            <div className="vault-field">
                                <label>TAGS <span className="field-hint">(comma-separated)</span></label>
                                <input type="text" placeholder="e.g. graph, shortest-path, dp" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
                            </div>
                            <div className="vault-field">
                                <label>NOTES <span className="field-hint">(optional)</span></label>
                                <textarea placeholder="Any notes about this snippet..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={3} />
                            </div>
                        </div>
                        <div className="vault-modal-footer">
                            <button className="vault-btn-cancel" onClick={() => { setShowModal(false); resetForm(); }}>CANCEL</button>
                            <button className="vault-btn-submit" onClick={handleAddSnippet} disabled={!newTitle.trim() || !newCode.trim()}>
                                {editingId ? "UPDATE" : "ARCHIVE"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CodeVault;
