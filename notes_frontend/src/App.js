import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// ====================
// Theme Colors
const COLORS = {
  primary: "#1976d2",
  secondary: "#90caf9",
  accent: "#fbc02d",
  bgLight: "#fff",
  bgSidebar: "#f8f9fa",
  border: "#e9ecef",
  textPrimary: "#232323",
  textSecondary: "#90caf9"
};

// ====================
// Helper for API root (assumes notes_database running at /api, set REACT_APP_API_URL to override)
const API_ROOT = process.env.REACT_APP_API_URL || "/api";

// ====================
// Note Category Extraction Helper
function getCategories(notes) {
  const set = new Set();
  for (const n of notes) {
    if (n.category) set.add(n.category);
  }
  return ["All", ...Array.from(set).sort()];
}

// ====================
// PUBLIC_INTERFACE
function App() {
  // Notes state
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "", category: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarCategory, setSidebarCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // ====================
  // Fetch notes from the backend
  const fetchNotes = useCallback(() => {
    setLoading(true);
    setApiError("");
    fetch(`${API_ROOT}/notes`)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch notes");
        return r.json();
      })
      .then(data => {
        setNotes(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(e => {
        setApiError("Error loading notes.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ====================
  // PUBLIC_INTERFACE
  // Filtering notes per search/category
  useEffect(() => {
    let filtered = notes;
    if (sidebarCategory !== "All") {
      filtered = filtered.filter(n => n.category === sidebarCategory);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(s) || n.content.toLowerCase().includes(s)
      );
    }
    setFilteredNotes(filtered);
  }, [notes, search, sidebarCategory]);

  // ====================
  // PUBLIC_INTERFACE
  // Handle creating new note
  function handleCreateNoteBtn() {
    setIsEditing(true);
    setActiveNoteId(null);
    setNoteDraft({ title: "", content: "", category: "" });
  }
  // ====================
  // PUBLIC_INTERFACE
  function handleEditNoteBtn(note) {
    setIsEditing(true);
    setActiveNoteId(note.id);
    setNoteDraft({ title: note.title, content: note.content, category: note.category || "" });
  }
  // ====================
  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setIsEditing(false);
    setActiveNoteId(null);
    setNoteDraft({ title: "", content: "", category: "" });
    setApiError("");
  }

  // ====================
  // PUBLIC_INTERFACE
  // Handle saving a note (create or update)
  function handleSaveNote(e) {
    e.preventDefault();
    setApiError("");
    if (!noteDraft.title.trim()) {
      setApiError("Title is required.");
      return;
    }
    setLoading(true);
    if (activeNoteId === null) {
      // Create
      fetch(`${API_ROOT}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteDraft)
      })
        .then(r => (r.ok ? r.json() : Promise.reject("Failed to create note")))
        .then(newNote => {
          fetchNotes();
          setIsEditing(false);
        })
        .catch(() => setApiError("Create failed."))
        .finally(() => setLoading(false));
    } else {
      // Update
      fetch(`${API_ROOT}/notes/${activeNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noteDraft)
      })
        .then(r => (r.ok ? r.json() : Promise.reject("Failed to update")))
        .then(upd => {
          fetchNotes();
          setIsEditing(false);
        })
        .catch(() => setApiError("Update failed."))
        .finally(() => setLoading(false));
    }
  }

  // ====================
  // PUBLIC_INTERFACE
  // Handle deleting a note
  function handleDeleteNote(noteId) {
    if (!window.confirm("Delete this note?")) return;
    setLoading(true);
    setApiError("");
    fetch(`${API_ROOT}/notes/${noteId}`, { method: "DELETE" })
      .then(r => {
        if (!r.ok) throw new Error("Delete failed");
        fetchNotes();
      })
      .catch(() => setApiError("Could not delete note."))
      .finally(() => setLoading(false));
  }

  // ====================
  // PUBLIC_INTERFACE
  // Select (view) a note, not in edit mode
  function handleSelectNote(n) {
    setIsEditing(false);
    setActiveNoteId(n.id);
    setNoteDraft({ title: n.title, content: n.content, category: n.category || "" });
    setApiError("");
  }

  // ====================
  // UI
  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bgLight,
      color: COLORS.textPrimary,
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* HEADER */}
      <header style={{
        width: "100%",
        height: 56,
        background: COLORS.primary,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 2rem",
        fontWeight: 600,
        letterSpacing: 1,
        boxShadow: "0 2px 7px rgba(25, 118, 210, 0.07)"
      }}>
        <span style={{ fontSize: 22, marginRight: 8 }}>🗒️</span>
        <span style={{ fontSize: 20, letterSpacing: 2 }}>Notes</span>
        <span style={{
          background: COLORS.accent,
          color: "#212121",
          fontWeight: 500,
          borderRadius: 5,
          fontSize: 12,
          padding: "3px 10px",
          marginLeft: 16
        }}>
          {notes.length} notes
        </span>
        <span style={{ flex: 1 }}></span>
        <span style={{
          background: COLORS.secondary,
          color: COLORS.primary,
          fontWeight: 400,
          borderRadius: 3,
          fontSize: 13,
          padding: "2px 8px"
        }}>Light Mode</span>
      </header>

      {/* LAYOUT */}
      <div style={{
        flex: 1,
        display: "flex",
        minHeight: 0
      }}>
        {/* SIDEBAR */}
        <nav style={{
          background: COLORS.bgSidebar,
          borderRight: `1px solid ${COLORS.border}`,
          width: 180,
          minWidth: 125,
          padding: "1.5rem 0.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start"
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.primary, marginBottom: 14, marginLeft: 4 }}>
            Categories
          </div>
          {getCategories(notes).map(c => (
            <button
              key={c}
              className={`sidebar-category${sidebarCategory === c ? " active" : ""}`}
              style={{
                background: sidebarCategory === c ? COLORS.primary : "transparent",
                color: sidebarCategory === c ? "#fff" : COLORS.textPrimary,
                border: "none",
                borderRadius: 5,
                padding: "6px 16px",
                marginBottom: 6,
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: sidebarCategory === c ? 500 : 400,
                transition: "all 0.2s"
              }}
              onClick={() => setSidebarCategory(c)}
              aria-current={sidebarCategory === c ? "category" : undefined}
            >
              {c}
            </button>
          ))}
          <div style={{ flex: 1 }}></div>
          <button
            style={{
              background: COLORS.accent,
              border: "none",
              color: "#212121",
              borderRadius: 5,
              width: "100%",
              padding: "10px 0",
              fontWeight: 600,
              fontSize: 16,
              marginTop: 20,
              cursor: "pointer",
              boxShadow: "0 1px 4px rgba(251,192,45,0.08)"
            }}
            onClick={handleCreateNoteBtn}
            aria-label="Create New Note"
          >
            + New Note
          </button>
        </nav>

        {/* MAIN SECTION */}
        <main style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          padding: "1.2rem 2vw",
          background: "#fff"
        }}>
          {/* Search */}
          <form
            style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
            onSubmit={e => e.preventDefault()}
          >
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes..."
              style={{
                flex: "1 1 120px",
                fontSize: 15,
                padding: "10px",
                border: `1.5px solid ${COLORS.secondary}`,
                borderRadius: "6px",
                background: "#f8f9fb",
                marginRight: 12,
                outline: "none"
              }}
              aria-label="Search Notes"
            />
            {loading ? (
              <span style={{ color: COLORS.primary, fontWeight: 500, fontSize: 15 }}>Loading...</span>
            ) : null}
          </form>

          {/* Error */}
          {apiError && (
            <div style={{
              color: "#b71c1c",
              background: "#fff3e0",
              border: "1.5px solid #fbc02d",
              borderRadius: 5,
              padding: "7px 15px",
              margin: "4px 0 10px",
              maxWidth: 420
            }}>
              {apiError}
            </div>
          )}

          {/* Note Edit / View */}
          {isEditing ? (
            <form
              className="note-form"
              style={{
                maxWidth: 560, margin: "0 auto", background: "#fafbff", borderRadius: 7, boxShadow: "0 1px 8px rgba(33,33,33,0.07)",
                padding: 24, border: `1.5px solid ${COLORS.border}`
              }}
              onSubmit={handleSaveNote}
              aria-label={activeNoteId === null ? "Create Note Form" : "Edit Note Form"}
            >
              <h2 style={{ color: COLORS.primary, marginBottom: 10, marginTop: 0 }}>
                {activeNoteId === null ? "Create Note" : "Edit Note"}
              </h2>
              <label htmlFor="note-title" style={{ fontSize: 16, fontWeight: 500, color: COLORS.primary }}>Title</label>
              <input
                id="note-title"
                required
                style={{
                  display: "block", width: "100%", marginBottom: 12, padding: "9px 10px 8px", fontSize: 15,
                  borderRadius: 4, border: `1.5px solid ${COLORS.secondary}`, background: "#fff"
                }}
                value={noteDraft.title}
                disabled={loading}
                onChange={e => setNoteDraft(k => ({ ...k, title: e.target.value }))}
              />
              <label htmlFor="note-category" style={{ fontSize: 15, fontWeight: 400, color: COLORS.primary }}>Category</label>
              <input
                id="note-category"
                style={{
                  display: "block", width: "100%", marginBottom: 18, padding: "8px 9px", fontSize: 14,
                  borderRadius: 4, border: `1px solid ${COLORS.border}`
                }}
                value={noteDraft.category}
                placeholder="Optional category (e.g. Work, Ideas)"
                disabled={loading}
                onChange={e => setNoteDraft(k => ({ ...k, category: e.target.value }))}
              />
              <label htmlFor="note-content" style={{ fontSize: 15, fontWeight: 400, color: COLORS.primary }}>Content</label>
              <textarea
                id="note-content"
                rows={7}
                required
                style={{
                  width: "100%", marginBottom: 15, padding: "10px", fontSize: 14, borderRadius: 4, resize: "vertical",
                  border: `1.5px solid ${COLORS.secondary}`, background: "#fff"
                }}
                value={noteDraft.content}
                disabled={loading}
                onChange={e => setNoteDraft(k => ({ ...k, content: e.target.value }))}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: COLORS.primary, color: "#fff", border: "none", borderRadius: 4, fontWeight: 600,
                    padding: "9px 16px", fontSize: 15, cursor: "pointer", minWidth: 92
                  }}
                >
                  {activeNoteId === null ? "Create" : "Save"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCancelEdit}
                  style={{
                    background: "#ececec", color: COLORS.primary, border: "none", borderRadius: 4,
                    fontWeight: 400, padding: "9px 16px", fontSize: 15, cursor: "pointer"
                  }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            // View/Select Mode
            <div style={{ display: "flex", gap: 30, alignItems: "flex-start" }}>
              <div style={{ flex: 2, minWidth: 220 }}>
                <NotesList
                  notes={filteredNotes}
                  onSelect={handleSelectNote}
                  onEdit={handleEditNoteBtn}
                  onDelete={handleDeleteNote}
                  activeNoteId={activeNoteId}
                />
              </div>
              <div style={{
                flex: 5, minWidth: 240, maxWidth: 700, background: "#fafbff", minHeight: 120,
                border: `1.5px solid ${COLORS.border}`, borderRadius: 7, padding: "15px 22px"
              }}>
                <NoteDisplay
                  note={filteredNotes.find(n => n.id === activeNoteId) || filteredNotes[0]}
                  onEdit={handleEditNoteBtn}
                  onDelete={handleDeleteNote}
                  accent={COLORS.accent}
                  showActions={true}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ====================
// PUBLIC_INTERFACE
function NotesList({ notes, onSelect, onEdit, onDelete, activeNoteId }) {
  return (
    <section>
      <div style={{
        fontSize: 15, color: "#888", fontWeight: 500, marginBottom: 9, letterSpacing: 1
      }}>
        {notes.length === 0 ? "No notes found." : "Notes"}
      </div>
      <div>
        {notes.map(n => (
          <div
            key={n.id}
            style={{
              boxShadow:
                activeNoteId === n.id
                  ? "0 2px 9px rgba(25,118,210,0.11)"
                  : "0 1.5px 7px rgba(232,122,65,0.09)",
              background: activeNoteId === n.id ? "#e3f2fd" : "#fff",
              border: `1.5px solid ${activeNoteId === n.id ? "#1976d2" : "#e9ecef"}`,
              borderRadius: 7,
              padding: "12px 15px 12px 15px",
              marginBottom: 13,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start"
            }}
            tabIndex={0}
            aria-selected={activeNoteId === n.id}
            onClick={() => onSelect(n)}
          >
            <div style={{
              fontWeight: 600,
              color: "#232323",
              fontSize: 16,
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: 200,
              maxWidth: "90%"
            }}>
              {n.title}
            </div>
            <div style={{
              fontSize: 13,
              color: "#5e6472",
              minHeight: 16,
              marginBottom: 2,
              width: 190,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {n.category}
            </div>
            <div style={{
              display: "flex",
              gap: 7,
              marginTop: 6
            }}>
              <button
                onClick={e => { e.stopPropagation(); onEdit(n); }}
                style={{
                  background: "#fff", color: "#fbc02d", border: `1px solid #fbc02d`, fontSize: 13, padding: "4px 12px",
                  borderRadius: 5, cursor: "pointer", fontWeight: 500, marginRight: 2
                }}
                aria-label="Edit note"
              >
                Edit
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(n.id); }}
                style={{
                  background: "#fff", color: "#b71c1c", border: `1px solid #b71c1c`, fontSize: 13, padding: "4px 12px",
                  borderRadius: 5, cursor: "pointer", fontWeight: 400
                }}
                aria-label="Delete note"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ====================
// PUBLIC_INTERFACE
function NoteDisplay({ note, onEdit, onDelete, accent, showActions }) {
  if (!note) {
    return <div style={{ color: "#888", minHeight: 80 }}>Select a note on the left.</div>;
  }
  return (
    <div>
      <div style={{
        fontSize: 22,
        fontWeight: 600,
        color: "#232323",
        marginBottom: 6,
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        overflow: "hidden"
      }}>
        {note.title}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 500,
        color: "#616161",
        marginBottom: 8
      }}>
        {note.category}
      </div>
      <div style={{
        fontSize: 15,
        color: "#282c34",
        marginBottom: 16,
        whiteSpace: "pre-wrap"
      }}>
        {note.content}
      </div>
      {showActions && (
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <button
            onClick={() => onEdit(note)}
            style={{
              background: accent, color: "#212121", border: "none", borderRadius: 4,
              padding: "7px 16px", fontWeight: 700, fontSize: 15, cursor: "pointer"
            }}>
            Edit
          </button>
          <button
            onClick={() => onDelete(note.id)}
            style={{
              background: "#fff", color: "#b71c1c", border: "1.5px solid #b71c1c",
              padding: "7px 16px", fontWeight: 600, fontSize: 15, borderRadius: 4, cursor: "pointer"
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
