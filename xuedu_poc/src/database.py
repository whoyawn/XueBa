"""
Database operations for the XueDu Chinese Learning App
"""

import sqlite3
import json
from typing import List, Tuple, Optional
from models import YuKuai

# Configuration
DEFAULT_USER_ID = 1

class XueDuDB:
    """Database manager for the XueDu Chinese learning app"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create yu_kuai table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS yu_kuai (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT NOT NULL CHECK (type IN ('vocab', 'grammar')),
                    canonical_name TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    description TEXT NOT NULL,
                    extra_metadata TEXT NOT NULL
                )
            """)
            
            # Create user_scores table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_scores (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL DEFAULT 1,
                    yu_kuai_id INTEGER NOT NULL,
                    score INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (yu_kuai_id) REFERENCES yu_kuai (id),
                    UNIQUE(user_id, yu_kuai_id)
                )
            """)
            
            conn.commit()
    
    def get_or_create_yu_kuai(self, yu_kuai: YuKuai) -> int:
        """Get existing YuKuai ID or create new one, returns the ID"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Check if exists by slug
            cursor.execute("SELECT id FROM yu_kuai WHERE slug = ?", (yu_kuai.slug,))
            result = cursor.fetchone()
            
            if result:
                return result[0]
            else:
                # Insert new YuKuai
                cursor.execute("""
                    INSERT INTO yu_kuai (type, canonical_name, slug, description, extra_metadata)
                    VALUES (?, ?, ?, ?, ?)
                """, (yu_kuai.type, yu_kuai.canonical_name, yu_kuai.slug, 
                      yu_kuai.description, json.dumps(yu_kuai.extra_metadata)))
                
                # Initialize user score
                yu_kuai_id = cursor.lastrowid
                cursor.execute("""
                    INSERT INTO user_scores (user_id, yu_kuai_id, score)
                    VALUES (?, ?, 0)
                """, (DEFAULT_USER_ID, yu_kuai_id))
                
                conn.commit()
                return yu_kuai_id
    
    def get_yu_kuai_by_id(self, yu_kuai_id: int) -> Optional[YuKuai]:
        """Get YuKuai by ID"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, type, canonical_name, slug, description, extra_metadata
                FROM yu_kuai WHERE id = ?
            """, (yu_kuai_id,))
            
            result = cursor.fetchone()
            if result:
                return YuKuai(
                    id=result[0],
                    type=result[1],
                    canonical_name=result[2],
                    slug=result[3],
                    description=result[4],
                    extra_metadata=json.loads(result[5])
                )
            return None
    
    def get_least_learned_yu_kuai(self, limit: int = 5) -> List[Tuple[YuKuai, int]]:
        """Get YuKuai with lowest scores for quiz mode"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT y.id, y.type, y.canonical_name, y.slug, y.description, y.extra_metadata, us.score
                FROM yu_kuai y
                JOIN user_scores us ON y.id = us.yu_kuai_id
                WHERE us.user_id = ?
                ORDER BY us.score ASC
                LIMIT ?
            """, (DEFAULT_USER_ID, limit))
            
            results = []
            for row in cursor.fetchall():
                yu_kuai = YuKuai(
                    id=row[0],
                    type=row[1],
                    canonical_name=row[2],
                    slug=row[3],
                    description=row[4],
                    extra_metadata=json.loads(row[5])
                )
                results.append((yu_kuai, row[6]))
            
            return results
    
    def update_score(self, yu_kuai_id: int, score_change: int):
        """Update user score for a YuKuai"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user_scores 
                SET score = MAX(0, score + ?)
                WHERE user_id = ? AND yu_kuai_id = ?
            """, (score_change, DEFAULT_USER_ID, yu_kuai_id))
            conn.commit()
    
    def get_all_yu_kuai_with_scores(self) -> List[Tuple[YuKuai, int]]:
        """Get all YuKuai with their scores"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT y.id, y.type, y.canonical_name, y.slug, y.description, y.extra_metadata, us.score
                FROM yu_kuai y
                JOIN user_scores us ON y.id = us.yu_kuai_id
                WHERE us.user_id = ?
                ORDER BY us.score DESC
            """, (DEFAULT_USER_ID,))
            
            results = []
            for row in cursor.fetchall():
                yu_kuai = YuKuai(
                    id=row[0],
                    type=row[1],
                    canonical_name=row[2],
                    slug=row[3],
                    description=row[4],
                    extra_metadata=json.loads(row[5])
                )
                results.append((yu_kuai, row[6]))
            
            return results
    
    def get_yu_kuai_score(self, yu_kuai_id: int) -> int:
        """Get the score for a specific YuKuai"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT score FROM user_scores 
                WHERE user_id = ? AND yu_kuai_id = ?
            """, (DEFAULT_USER_ID, yu_kuai_id))
            result = cursor.fetchone()
            return result[0] if result else 0
