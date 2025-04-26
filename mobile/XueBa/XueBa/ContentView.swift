//
//  ContentView.swift
//  XueBa
//
//  Created by Huyanh Hoang on 4/26/25.
//

import SwiftUI
import Foundation

struct ContentView: View {
    @State var store = NoteStore()
    var body: some View {
        NotesListView(store: store)
    }
}

#Preview {
    ContentView()
}
