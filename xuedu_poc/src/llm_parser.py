"""
LLM integration and parsing for the XueDu Chinese Learning App
"""

import json
import os
from typing import List
from models import YuKuai

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

class LLMParser:
    """Handles LLM integration for parsing Chinese text into YuKuai"""
    
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            print("Warning: OPENAI_API_KEY not found in environment variables.")
            print("LLM parsing will not work. Please set your OpenAI API key.")
            self.client = None
        else:
            try:
                import openai
                self.client = openai.OpenAI(api_key=api_key)
            except ImportError:
                print("Warning: openai package not installed. LLM parsing will not work.")
                self.client = None
    
    def parse_sentence(self, sentence: str) -> List[YuKuai]:
        """Parse a Chinese sentence into YuKuai using LLM"""
        if not self.client:
            raise RuntimeError("LLM client not available. Please set OPENAI_API_KEY in your .env file or as an environment variable.")
        
        try:
            prompt = f"""You are a Chinese learning assistant.
Given a Chinese sentence, extract vocabulary and grammar YuKuai.
For each YuKuai, return a JSON array with objects containing:
- type: "vocab" or "grammar"
- canonical_name: Chinese name with disambiguation if needed (e.g., "闻 (古义)")
- slug: ASCII-only unique identifier (e.g., "wen_ancient")
- description: learner-friendly explanation in English
- extra_metadata: JSON object with pinyin, HSK level, examples, etc.

Sentence: "{sentence}"

Return only valid JSON array."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content.strip()
            
            # Try to parse JSON response
            try:
                yu_kuai_data = json.loads(content)
                yu_kuai_list = []
                
                for item in yu_kuai_data:
                    yu_kuai = YuKuai(
                        id=None,
                        type=item.get('type', 'vocab'),
                        canonical_name=item.get('canonical_name', ''),
                        slug=item.get('slug', ''),
                        description=item.get('description', ''),
                        extra_metadata=item.get('extra_metadata', {})
                    )
                    yu_kuai_list.append(yu_kuai)
                
                return yu_kuai_list
                
            except json.JSONDecodeError:
                raise RuntimeError(f"Failed to parse LLM response as JSON: {content}")
                
        except Exception as e:
            raise RuntimeError(f"LLM parsing failed: {e}")
    

    
    def generate_quiz_question(self, yu_kuai: YuKuai) -> str:
        """Generate a quiz question for a YuKuai using LLM"""
        if not self.client:
            raise RuntimeError("LLM client not available. Please set OPENAI_API_KEY in your .env file or as an environment variable.")
        
        try:
            prompt = f"""Generate a simple comprehension question in Chinese
that tests understanding of the YuKuai below:

YuKuai: {yu_kuai.canonical_name} ({yu_kuai.type})
Description: {yu_kuai.description}

Return just the question string in Chinese."""

            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=200
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise RuntimeError(f"Quiz generation failed: {e}")
