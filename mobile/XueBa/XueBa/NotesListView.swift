import SwiftUI

// Note and NoteStore are defined in Note.swift, which is in the same target, so no import needed

struct NotesListView: View {
    var store: NoteStore
    @State private var showingNewNote = false
    @State private var selectedNote: Note?
    
    var body: some View {
        NavigationView {
            List(selection: $selectedNote) {
                ForEach(store.notes) { note in
                    NavigationLink(destination: NoteDetailView(note: note, store: store)) {
                        VStack(alignment: .leading) {
                            Text(note.title.isEmpty ? "Untitled" : note.title)
                                .font(.headline)
                            Text(note.content)
                                .font(.subheadline)
                                .lineLimit(1)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .onDelete { indices in
                    indices.map { store.notes[$0] }.forEach(store.delete)
                }
            }
            .navigationTitle("Notes")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingNewNote = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingNewNote) {
                NoteEditorView(store: store, isPresented: $showingNewNote)
            }
        }
    }
}

// Quick note editor for new note
struct NoteEditorView: View {
    var store: NoteStore
    @Binding var isPresented: Bool
    @State private var title = ""
    @State private var content = ""
    
    var body: some View {
        NavigationView {
            Form {
                TextField("Title", text: $title)
                TextEditor(text: $content)
                    .frame(height: 200)
            }
            .navigationTitle("New Note")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let note = Note(title: title, content: content)
                        store.add(note: note)
                        isPresented = false
                    }
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { isPresented = false }
                }
            }
        }
    }
}
