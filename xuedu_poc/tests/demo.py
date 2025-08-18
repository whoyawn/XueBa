#!/usr/bin/env python3
"""
Demo script for the Chinese Learning App
Shows the app's functionality with sample data
"""

import sys
import os

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from app import XueDuApp
from models import YuKuai
from database import XueDuDB
import os

def run_demo():
    """Run a demonstration of the app's features"""
    print("=== Chinese Learning App - Demo Mode ===\n")
    
    # Create app instance
    app = XueDuApp()
    
    # Demo 1: Show sample YuKuai creation
    print("Demo 1: Creating sample YuKuai...")
    sample_yu_kuai = [
        YuKuai(
            id=None,
            type="vocab",
            canonical_name="你好",
            slug="nihao",
            description="A greeting meaning 'hello'",
            extra_metadata={"pinyin": "nǐ hǎo", "HSK": 1}
        ),
        YuKuai(
            id=None,
            type="grammar",
            canonical_name="虽然…但是…",
            slug="suiran_danshi",
            description="Concessive structure: 'Although..., ...'",
            extra_metadata={"pinyin": "suīrán...dànshì", "HSK": 3}
        ),
        YuKuai(
            id=None,
            type="vocab",
            canonical_name="闻 (古义)",
            slug="wen_ancient",
            description="In Classical Chinese, '闻' means 'to hear (news)'",
            extra_metadata={"pinyin": "wén", "era": "Classical Chinese"}
        )
    ]
    
    # Store in database
    for yu_kuai in sample_yu_kuai:
        yu_kuai_id = app.db.get_or_create_yu_kuai(yu_kuai)
        print(f"  Created: {yu_kuai.canonical_name} (ID: {yu_kuai_id})")
    
    # Demo 2: Show scoring system
    print("\nDemo 2: Scoring system...")
    app.db.update_score(1, 3)  # Give "你好" 3 points
    app.db.update_score(2, 1)  # Give "虽然…但是…" 1 point
    app.db.update_score(3, 0)  # Keep "闻 (古义)" at 0 points
    
    print("  Updated scores for sample YuKuai")
    
    # Demo 3: Show sentence processing
    print("\nDemo 3: Processing sample sentences...")
    
    # Create sample sentences
    sample_sentences = [
        "你好！我是小明。",
        "虽然我很忙，但是我还是会抽时间学习中文。",
        "这个汉字'闻'在古代有'听到消息'的意思。"
    ]
    
    for i, sentence_text in enumerate(sample_sentences, 1):
        print(f"\nProcessing sentence {i}: {sentence_text}")
        
        # Use fallback parsing (since no API key)
        yu_kuai_list = app.llm_parser.parse_sentence(sentence_text)
        
        # Store YuKuai and get IDs
        yu_kuai_ids = []
        for yu_kuai in yu_kuai_list:
            yu_kuai_id = app.db.get_or_create_yu_kuai(yu_kuai)
            yu_kuai_ids.append(yu_kuai_id)
            print(f"  - {yu_kuai.canonical_name} ({yu_kuai.type})")
        
        # Store sentence
        app.sentence_counter += 1
        from models import Sentence
        sentence = Sentence(
            id=app.sentence_counter,
            text=sentence_text,
            yu_kuai_ids=yu_kuai_ids
        )
        app.sentences.append(sentence)
    
    # Demo 4: Show analytics
    print("\nDemo 4: Learning analytics...")
    
    # Overall text score
    total_text_score = 0
    for sentence in app.sentences:
        for yu_kuai_id in sentence.yu_kuai_ids:
            with app.db.db_path as conn:
                import sqlite3
                conn = sqlite3.connect(app.db.db_path)
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT score FROM user_scores 
                    WHERE user_id = ? AND yu_kuai_id = ?
                """, (1, yu_kuai_id))
                score = cursor.fetchone()[0]
                total_text_score += score
                conn.close()
    
    print(f"  Total text score: {total_text_score}")
    
    # Individual YuKuai scores
    print("\n  YuKuai scores:")
    yu_kuai_with_scores = app.db.get_all_yu_kuai_with_scores()
    for yu_kuai, score in yu_kuai_with_scores[:5]:  # Show top 5
        print(f"    {yu_kuai.canonical_name} ({yu_kuai.type}): {score} points")
    
    # Demo 5: Quiz mode preview
    print("\nDemo 5: Quiz mode preview...")
    least_learned = app.db.get_least_learned_yu_kuai(limit=3)
    
    if least_learned:
        print("  Least learned YuKuai for quiz:")
        for yu_kuai, score in least_learned:
            print(f"    - {yu_kuai.canonical_name} ({yu_kuai.type}): {score} points")
            print(f"      Description: {yu_kuai.description}")
    
    print("\n=== Demo completed! ===")
    print("You can now run the full app with: python chinese_learner.py")

if __name__ == "__main__":
    run_demo()
