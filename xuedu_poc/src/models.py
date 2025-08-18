"""
Data models and structures for the XueDu Chinese Learning App
"""

from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class YuKuai:
    """Represents a language chunk (语块)"""
    id: Optional[int]
    type: str  # "vocab" or "grammar"
    canonical_name: str  # Chinese name with disambiguation if needed
    slug: str  # ASCII-only unique identifier
    description: str  # English explanation
    extra_metadata: Dict  # JSON metadata (pinyin, HSK level, etc.)

@dataclass
class Sentence:
    """Represents a sentence with its YuKuai"""
    id: int
    text: str
    yu_kuai_ids: List[int]
