import Foundation
import SwiftUI

struct Note: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    var title: String
    var content: String
    var createdAt: Date
    var updatedAt: Date
    
    init(id: UUID = UUID(), title: String, content: String, createdAt: Date = Date(), updatedAt: Date = Date()) {
        self.id = id
        self.title = title
        self.content = content
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

@Observable
class NoteStore {
    var notes: [Note] = []
    
    // MARK: - Persistence (simple UserDefaults for now)
    private let notesKey = "notes_key"
    
    init() {
        load()
    }
    
    func add(note: Note) {
        notes.append(note)
        save()
    }
    
    func update(note: Note) {
        if let idx = notes.firstIndex(where: { $0.id == note.id }) {
            notes[idx] = note
            save()
        }
    }
    
    func delete(note: Note) {
        notes.removeAll { $0.id == note.id }
        save()
    }
    
    func load() {
        guard let data = UserDefaults.standard.data(forKey: notesKey),
              let decoded = try? JSONDecoder().decode([Note].self, from: data) else { return }
        notes = decoded
    }
    
    func save() {
        if let data = try? JSONEncoder().encode(notes) {
            UserDefaults.standard.set(data, forKey: notesKey)
        }
    }
}
