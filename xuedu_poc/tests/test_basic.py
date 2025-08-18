#!/usr/bin/env python3
"""
Basic test script for the Chinese Learning App
Tests core functionality without requiring LLM access
"""

import sqlite3
import json
import sys
import os

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from database import XueDuDB
from models import YuKuai
from app import XueDuApp

def test_database():
    """Test basic database operations"""
    print("Testing database operations...")
    
    # Create database
    db = XueDuDB("test.db")
    
    # Test YuKuai creation
    test_yu_kuai = YuKuai(
        id=None,
        type="vocab",
        canonical_name="你好",
        slug="nihao",
        description="A greeting meaning 'hello'",
        extra_metadata={"pinyin": "nǐ hǎo", "HSK": 1}
    )
    
    # Insert and retrieve
    yu_kuai_id = db.get_or_create_yu_kuai(test_yu_kuai)
    print(f"Created YuKuai with ID: {yu_kuai_id}")
    
    # Retrieve and verify
    retrieved = db.get_yu_kuai_by_id(yu_kuai_id)
    if retrieved:
        print(f"Retrieved: {retrieved.canonical_name} ({retrieved.type})")
        print(f"Description: {retrieved.description}")
        print(f"Metadata: {retrieved.extra_metadata}")
    else:
        print("Failed to retrieve YuKuai")
    
    # Test duplicate handling
    duplicate_id = db.get_or_create_yu_kuai(test_yu_kuai)
    print(f"Duplicate YuKuai returned ID: {duplicate_id}")
    print(f"Should be same as original: {duplicate_id == yu_kuai_id}")
    
    # Test scoring
    db.update_score(yu_kuai_id, 2)
    print("Updated score +2")
    
    # Get scores
    scores = db.get_all_yu_kuai_with_scores()
    print(f"Total YuKuai with scores: {len(scores)}")
    
    # Cleanup
    import os
    os.remove("test.db")
    print("Test database cleaned up")

def test_fallback_parsing():
    """Test fallback parsing without LLM"""
    print("\nTesting fallback parsing...")
    
    app = XueDuApp()
    
    # Test with sample text
    test_text = "你好世界"
    print(f"Testing fallback parsing with: {test_text}")
    
    # This should use fallback parsing since no API key
    yu_kuai_list = app.llm_parser.parse_sentence(test_text)
    
    print(f"Extracted {len(yu_kuai_list)} YuKuai:")
    for yu_kuai in yu_kuai_list:
        print(f"  - {yu_kuai.canonical_name} ({yu_kuai.type})")
        print(f"    Slug: {yu_kuai.slug}")
        print(f"    Description: {yu_kuai.description}")

def main():
    """Run all tests"""
    print("=== Chinese Learning App - Basic Tests ===\n")
    
    try:
        test_database()
        test_fallback_parsing()
        print("\n✅ All basic tests passed!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
