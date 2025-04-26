import SwiftUI
import UIKit
import Foundation
import SwiftUIIntrospect

struct NoteDetailView: View {
    @State var note: Note
    var store: NoteStore
    @State private var isWriterMode = false
    @State private var showAIExplainSheet = false
    @State private var selectedText: String = ""
    @State private var popUpWord: String? = nil
    @State private var popUpRect: CGRect = .zero
    @State private var showPopUp = false
    
    var body: some View {
        ZStack {
            VStack {
                HStack {
                    Text(note.title.isEmpty ? "Untitled" : note.title)
                        .font(.title)
                        .padding(.leading)
                    Spacer()
                    Button(action: {
                        isWriterMode.toggle()
                        if !isWriterMode {
                            // When switching to reader mode, show AI explain sheet
                            selectedText = note.content
                            showAIExplainSheet = true
                        }
                    }) {
                        Image(systemName: isWriterMode ? "eye" : "pencil")
                            .imageScale(.large)
                            .padding()
                    }
                }
                Divider()
                if isWriterMode {
                    TextEditor(text: $note.content)
                        .padding()
                        .onDisappear {
                            store.update(note: note)
                        }
                } else {
                    ReaderTextView(
                        text: note.content,
                        onHighlight: { highlighted in
                            selectedText = highlighted
                            showAIExplainSheet = true // Only top-level sheet is source of truth
                        },
                        onTapChineseWord: { _, _ in }
                    )
                    .padding()
                }
            }
            .sheet(isPresented: $showAIExplainSheet) {
                AIExplainSheetView(originalText: selectedText)
            }
            // Pop-up dictionary overlay
            if showPopUp, let word = popUpWord {
                PopUpDictionaryView(word: word, rect: popUpRect) {
                    showPopUp = false
                }
            }
        }
    }
}

struct ReaderTextView: View {
    @State var text: String
    var onHighlight: (String) -> Void
    var onTapChineseWord: (String, CGRect) -> Void
    @State private var selection: TextSelection? = nil
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Spacer()
                Button(action: {
                    // Use current selection or all text if nothing selected
                    let selected: String
                    if let indices = selection?.indices {
                        let range: Range<String.Index>?
                        switch indices {
                        case .selection(let r):
                            range = r
                        case .multiSelection(let rangeSet):
                            range = rangeSet.ranges.first
                        @unknown default:
                            range = nil
                        }
                        if let range = range, text.distance(from: range.lowerBound, to: range.upperBound) > 0 {
                            selected = String(text[range])
                        } else {
                            selected = text
                        }
                    } else {
                        selected = text
                    }
                    onHighlight(selected)
                }) {
                    Label("AI Explain", systemImage: "sparkles")
                }
                .padding(.trailing)
            }
            TextEditor(text: $text, selection: $selection)
                .font(.system(size: 20))
                .padding(8)
                .background(Color.clear)
                .introspect(.textEditor, on: .iOS(.v18)) { textView in
                    textView.isEditable = false
                }
        }
    }
}

struct PopUpDictionaryView: View {
    let word: String
    let rect: CGRect
    let onDismiss: () -> Void
    @State private var showAIExplain = false
    @State private var isLoading = false
    @State private var explanation: String? = nil
    // Placeholder dictionary lookup
    var definition: String {
        // In a real app, replace with a real dictionary lookup
        "Definition for \(word)"
    }
    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                // Transparent background for tap-to-dismiss
                Color.black.opacity(0.01)
                    .edgesIgnoringSafeArea(.all)
                    .onTapGesture { onDismiss() }
                // Pop-up card, bottom anchored to rect.origin.y (top of word) + 2px gap
                let popupWidth: CGFloat = 220
                let popupX = clamp(rect.origin.x + rect.width / 2, min: popupWidth/2 + 8, max: geo.size.width - popupWidth/2 - 8)
                let popupY = max(rect.origin.y - 2, 0)
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(word)
                            .font(.title2)
                            .bold()
                        Spacer()
                        Button(action: { showAIExplain = true }) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.accentColor)
                                .imageScale(.large)
                        }
                        .accessibilityLabel("AI Explain")
                    }
                    Text(definition)
                        .font(.body)
                }
                .padding()
                .background(RoundedRectangle(cornerRadius: 10).fill(Color(uiColor: .systemBackground)).shadow(radius: 4))
                .overlay(
                    HStack {
                        Spacer()
                        Button(action: onDismiss) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding([.top, .trailing], 8)
                )
                .fixedSize()
                // Clamp popup position to stay on screen
                .position(x: popupX, y: popupY)
                // AI Explanation Sheet
                .sheet(isPresented: $showAIExplain) {
                    AIExplainSheetView(originalText: word)
                }
            }
        }
        .transition(.opacity)
    }
}

struct AIExplainSheetView: View {
    let originalText: String
    @State private var explanation: String? = nil
    @State private var isLoading = false
    // Standard keyboard height for iOS (portrait, safe area considered)
    private let keyboardDetent: CGFloat = 291 // Typical iPhone keyboard height
    var body: some View {
        VStack(spacing: 16) {
            Text("Original: \(originalText)")
                .padding()
                .background(Color(uiColor: .secondarySystemBackground))
                .cornerRadius(8)
            if let explanation = explanation {
                Text(explanation)
                    .padding()
                    .background(Color(uiColor: .secondarySystemBackground))
                    .cornerRadius(8)
            } else if isLoading {
                ProgressView("Getting explanation...")
                    .padding()
            } else {
                Button("Get AI Explanation") {
                    isLoading = true
                    Task {
                        // Placeholder: Replace with real Claude API call
                        try? await Task.sleep(nanoseconds: 1_000_000_000)
                        explanation = "[AI] Explanation for: \(originalText)\n\nTranslation: ...\nGrammar: ...\nUsage: ..."
                        isLoading = false
                    }
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(uiColor: .systemBackground))
        .presentationDetents([
            .height(keyboardDetent),
            .medium,
            .large
        ])
        .presentationBackgroundInteraction(.enabled)
    }
}

// Helper function for clamping
private func clamp<T: Comparable>(_ value: T, min: T, max: T) -> T {
    if value < min { return min }
    if value > max { return max }
    return value
}
