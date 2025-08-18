"""
Main application logic for the XueDu Chinese Learning App
"""

import re
from typing import List
from models import YuKuai, Sentence
from database import XueDuDB
from llm_parser import LLMParser

# Configuration
DATABASE_PATH = "xuedu.db"

class XueDuApp:
    """Main application class"""
    
    def __init__(self):
        self.db = XueDuDB(DATABASE_PATH)
        self.llm_parser = LLMParser()
        self.sentences: List[Sentence] = []
        self.sentence_counter = 0
        self.results = []
    
    def process_file(self, file_path: str):
        """Process a Chinese text file and extract YuKuai"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return
        
        if not text.strip():
            print("❌ File is empty or contains no text.")
            return
        
        # Split into sentences
        sentences = re.split(r'[。！？!?]', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        print(f"📖 Found {len(sentences)} sentences in {file_path}")
        
        file_results = {
            'file': file_path,
            'sentences': [],
            'yu_kuai_count': 0
        }
        
        # Parse each sentence
        for i, sentence_text in enumerate(sentences, 1):
            print(f"  Processing sentence {i}/{len(sentences)}...", end='\r')
            
            try:
                yu_kuai_list = self.llm_parser.parse_sentence(sentence_text)
                
                # Store YuKuai and get IDs
                yu_kuai_ids = []
                for yu_kuai in yu_kuai_list:
                    yu_kuai_id = self.db.get_or_create_yu_kuai(yu_kuai)
                    yu_kuai_ids.append(yu_kuai_id)
                
                # Store sentence
                self.sentence_counter += 1
                sentence = Sentence(
                    id=self.sentence_counter,
                    text=sentence_text,
                    yu_kuai_ids=yu_kuai_ids
                )
                self.sentences.append(sentence)
                
                # Add to file results
                sentence_result = {
                    'text': sentence_text,
                    'yu_kuai': [
                        {
                            'id': yu_kuai_id,
                            'canonical_name': yu_kuai.canonical_name,
                            'type': yu_kuai.type,
                            'description': yu_kuai.description,
                            'slug': yu_kuai.slug
                        }
                        for yu_kuai in yu_kuai_list
                    ]
                }
                file_results['sentences'].append(sentence_result)
                file_results['yu_kuai_count'] += len(yu_kuai_ids)
                
            except RuntimeError as e:
                error_msg = f"Failed to parse sentence: {e}"
                print(f"  ❌ {error_msg}")
                continue
        
        print()  # Clear the progress line
        
        self.results.append(file_results)
        print(f"✅ Completed processing {file_path}")
        print(f"   📊 Sentences: {len(file_results['sentences'])}")
        print(f"   🧩 YuKuai: {file_results['yu_kuai_count']}")
    

    
    def display_summary(self):
        """Display a summary of all processing results"""
        if not self.results:
            print("\n📋 No files processed.")
            return
        
        print(f"\n{'='*50}")
        print("📊 PROCESSING SUMMARY")
        print(f"{'='*50}")
        
        total_sentences = 0
        total_yu_kuai = 0
        
        for result in self.results:
            print(f"\n📁 File: {result['file']}")
            print(f"   📖 Sentences: {len(result['sentences'])}")
            print(f"   🧩 YuKuai: {result['yu_kuai_count']}")
            total_sentences += len(result['sentences'])
            total_yu_kuai += result['yu_kuai_count']
        
        print(f"\n{'='*50}")
        print(f"📈 TOTAL: {len(self.results)} files, {total_sentences} sentences, {total_yu_kuai} YuKuai")
        print(f"{'='*50}")
        
        # Show some YuKuai examples
        if self.sentences:
            print(f"\n🔍 Sample YuKuai found:")
            yu_kuai_with_scores = self.db.get_all_yu_kuai_with_scores()
            for yu_kuai, score in yu_kuai_with_scores[:5]:
                print(f"   • {yu_kuai.canonical_name} ({yu_kuai.type}) - {score} points")
    
    def display_sentences_with_scores(self):
        """Display all sentences with their YuKuai and scores"""
        print("\n" + "="*60)
        print("📚 SENTENCES & YUKUAI PROGRESS")
        print("="*60)
        
        if not self.sentences:
            print("📋 No sentences processed yet.")
            print("💡 Process a text file first to see your learning progress!")
            return
        
        total_text_score = 0
        
        for sentence in self.sentences:
            print(f"\n📖 Sentence {sentence.id}: {sentence.text}")
            print("   🧩 YuKuai:")
            
            sentence_score = 0
            for yu_kuai_id in sentence.yu_kuai_ids:
                yu_kuai = self.db.get_yu_kuai_by_id(yu_kuai_id)
                if yu_kuai:
                    score = self.db.get_yu_kuai_score(yu_kuai_id)
                    sentence_score += score
                    
                    # Color-coded score display
                    if score >= 3:
                        score_display = f"🟢 {score} points"
                    elif score >= 1:
                        score_display = f"🟡 {score} points"
                    else:
                        score_display = f"🔴 {score} points"
                    
                    print(f"      • {yu_kuai.canonical_name} ({yu_kuai.type}) - {score_display}")
                    print(f"        Description: {yu_kuai.description}")
            
            total_text_score += sentence_score
            print(f"   📊 Sentence Score: {sentence_score} points")
        
        print(f"\n{'='*60}")
        print(f"🎯 TOTAL TEXT SCORE: {total_text_score} points")
        print(f"📈 Sentences: {len(self.sentences)}")
        print(f"🧩 Total YuKuai: {sum(len(s.yu_kuai_ids) for s in self.sentences)}")
        print("="*60)
    
    def quiz_mode(self):
        """Interactive quiz mode"""
        print("\n=== Quiz Mode ===")
        
        # Get least learned YuKuai
        least_learned = self.db.get_least_learned_yu_kuai(limit=5)
        
        if not least_learned:
            print("No YuKuai found for quiz.")
            return
        
        print("Let's practice the least learned YuKuai!")
        
        for yu_kuai, current_score in least_learned:
            print(f"\n--- {yu_kuai.canonical_name} ({yu_kuai.type}) ---")
            print(f"Description: {yu_kuai.description}")
            
            # Generate quiz question
            try:
                question = self.llm_parser.generate_quiz_question(yu_kuai)
                print(f"Question: {question}")
            except RuntimeError as e:
                print(f"❌ Failed to generate quiz question: {e}")
                question = f"Translate or explain: {yu_kuai.canonical_name}"
                print(f"Using fallback question: {question}")
            
            # Show options
            print("\nOptions:")
            print("1. I know this well (+1 point)")
            print("2. I'm not sure (-1 point)")
            print("3. Skip this one")
            
            choice = input("Your choice (1, 2, or 3): ").strip()
            
            if choice == "1":
                self.db.update_score(yu_kuai.id, 1)
                print("Great! +1 point")
            elif choice == "2":
                self.db.update_score(yu_kuai.id, -1)
                print("Keep practicing! -1 point")
            elif choice == "3":
                print("Skipped.")
            else:
                print("Invalid choice, skipped.")
        
        print("\nQuiz completed!")
    
    def run(self):
        """Main application loop"""
        print("=== XueDu - Chinese Learning App ===")
        print("Welcome to your Chinese learning journey!")
        
        while True:
            # Clear screen and show sentences view by default
            print("\n" + "="*60)
            print("📚 LEARNING PROGRESS DASHBOARD")
            print("="*60)
            
            # Display sentences with scores
            self.display_sentences_with_scores()
            
            # Show navigation options
            print("\n" + "="*60)
            print("🎮 NAVIGATION")
            print("="*60)
            print("q - Enter Quiz Mode")
            print("r - Refresh View")
            print("x - Exit")
            print("="*60)
            
            choice = input("\nEnter your choice: ").strip().lower()
            
            if choice == 'q':
                self.quiz_mode()
                input("\nPress Enter to return to dashboard...")
            elif choice == 'r':
                continue  # Refresh the view
            elif choice == 'x':
                print("Goodbye! 再见!")
                break
            else:
                print("Invalid choice. Please try again.")
                input("Press Enter to continue...")
