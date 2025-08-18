# Chinese Learning App - YuKuai (语块) Prototype

A Python CLI application that helps users study Chinese texts by breaking them down into reusable **YuKuai (语块)** — "language chunks" like vocabulary or grammar patterns. This prototype supports canonical names in Chinese plus ASCII slugs for deduplication and LLM integration.

## Features

### 🗄️ Database Schema (SQLite)
- **`yu_kuai`** table: Stores language chunks with type, canonical name, slug, description, and metadata
- **`user_scores`** table: Tracks learning progress for each YuKuai
- **In-memory sentences**: Links sentences to their constituent YuKuai

### 📚 Text Processing
- Upload Chinese text files or paste text directly
- Automatic sentence splitting using Chinese punctuation (。！？!?)
- LLM-powered parsing to extract vocabulary and grammar patterns
- Fallback parsing when LLM is unavailable

### 🧠 LLM Integration
- Uses OpenAI GPT-4o-mini for intelligent text parsing
- Generates quiz questions based on YuKuai
- Structured prompts for consistent output
- JSON parsing with error handling
- **Requires valid OpenAI API key to function**

### 📊 Learning Analytics
- Individual YuKuai scoring system
- Sentence-level and text-level score aggregation
- Progress tracking for vocabulary and grammar

### 🎯 Quiz Mode
- Adaptive questioning based on least-learned YuKuai
- Score updates based on user responses
- LLM-generated comprehension questions

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd xuedu_poc
   ```

2. **Install dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```
   
   This installs:
   - `openai`: For LLM integration
   - `python-dotenv`: For loading environment variables from .env files

3. **Set up OpenAI API key (required):**
   
   **Option A: Using .env file (recommended):**
   ```bash
   cp .env.example .env
   # Edit .env and add your actual API key
   nano .env  # or use your preferred editor
   ```
   
   **Option B: Environment variable:**
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
   
   **Option C: Add to shell profile:**
   ```bash
   echo 'export OPENAI_API_KEY="your-api-key-here"' >> ~/.zshrc
   source ~/.zshrc
   ```

## Usage

### Running the App
```bash
python xuedu.py
```

### Main Menu Options

1. **Upload Text** - Process Chinese text files or paste text
2. **View Sentences** - See all processed sentences with their YuKuai
3. **View Scores** - Check learning progress and scores
4. **Quiz Mode** - Practice with adaptive questions
5. **Exit** - Close the application

### Example Workflow

1. **Start the app** and choose option 1 (Upload Text)
2. **Choose input method**: File path or direct text input
3. **Process text**: The app will parse each sentence and extract YuKuai
4. **Review results**: Use option 2 to see how sentences were broken down
5. **Check progress**: Use option 3 to view your learning scores
6. **Practice**: Use option 4 for interactive quiz mode

### Testing and Demo

**Run basic tests:**
```bash
python tests/test_basic.py
```

**See interactive demo:**
```bash
python tests/demo.py
```

## Sample Text

The `sample_text.txt` file contains example Chinese sentences to test the system:

```
你好！我是小明。
今天天气很好，我想去公园散步。
虽然我很忙，但是我还是会抽时间学习中文。
这个汉字"闻"在古代有"听到消息"的意思。
我每天都要练习写汉字，因为熟能生巧。
```

## YuKuai Examples

### Vocabulary (词汇)
```json
{
  "canonical_name": "你好",
  "slug": "nihao",
  "type": "vocab",
  "description": "A greeting meaning 'hello'",
  "extra_metadata": {"pinyin": "nǐ hǎo", "HSK": 1}
}
```

### Grammar Patterns (语法)
```json
{
  "canonical_name": "虽然…但是…",
  "slug": "suiran_danshi",
  "type": "grammar",
  "description": "Concessive structure: 'Although..., ...'",
  "extra_metadata": {"pinyin": "suīrán...dànshì", "HSK": 3}
}
```

### Context-Specific Vocabulary
```json
{
  "canonical_name": "闻 (古义)",
  "slug": "wen_ancient",
  "type": "vocab",
  "description": "In Classical Chinese, '闻' means 'to hear (news)'",
  "extra_metadata": {"pinyin": "wén", "era": "Classical Chinese"}
}
```

## Project Structure

The app is organized into modular components:

```
xuedu_poc/
├── src/                     # Source code package
│   ├── __init__.py          # Package initialization
│   ├── models.py            # Data classes (YuKuai, Sentence)
│   ├── database.py          # Database operations (XueDuDB)
│   ├── llm_parser.py        # LLM integration and parsing
│   └── app.py               # Main application logic
├── tests/                   # Test package
│   ├── __init__.py          # Test package initialization
│   ├── test_basic.py        # Basic functionality tests
│   └── demo.py              # Interactive demonstration
├── xuedu.py                 # Entry point
├── sample_text.txt          # Sample Chinese text
├── requirements.txt          # Dependencies
├── README.md                # Main documentation
└── STRUCTURE.md             # This file
```

## Configuration

### Environment Variables

The app supports configuration through environment variables or a `.env` file:

- **`OPENAI_API_KEY`** (required): Your OpenAI API key for LLM functionality
- **`.env` file**: Copy `.env.example` to `.env` and configure your settings

**Example .env file:**
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## Technical Details

### Database Structure
- **SQLite database**: `xuedu.db` (created automatically)
- **Foreign key relationships** between YuKuai and user scores
- **Unique constraints** on slugs for deduplication

### LLM Integration
- **Model**: GPT-4o-mini (configurable)
- **Temperature**: 0.3 for parsing, 0.7 for quiz generation
- **Fallback parsing**: Character-by-character when LLM unavailable
- **Structured prompts**: JSON output for consistent parsing

### Error Handling
- **Graceful degradation** when LLM unavailable
- **JSON parsing validation** with fallback options
- **Database transaction safety** with proper rollbacks

## Customization

### Adding New YuKuai Types
Modify the database schema and validation in `XueDuDB.init_database()`:

```python
# Add new type to CHECK constraint
type TEXT NOT NULL CHECK (type IN ('vocab', 'grammar', 'idiom', 'phrase'))
```

### Modifying LLM Prompts
Edit the prompt templates in `LLMParser.parse_sentence()` and `LLMParser.generate_quiz_question()`.

### Changing Scoring System
Modify the score calculation logic in `ChineseLearnerApp.view_scores()` and related methods.

## Troubleshooting

### Common Issues

1. **"LLM client not available"**
   - **Required**: Set your `OPENAI_API_KEY` in `.env` file or as environment variable
   - Check API key validity and billing status
   - The app will not function without a valid OpenAI API key

2. **"No module named 'dotenv'"**
   - Install python-dotenv: `pip3 install python-dotenv`
   - This package is required for loading `.env` files

3. **Import errors with relative imports**
   - Always run the app using `python3 xuedu.py` from the project root
   - Don't run individual modules directly due to relative import structure

2. **Database errors**
   - Delete `chinese_learner.db` to reset the database
   - Check file permissions in the directory

3. **Import errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version (3.7+ required)

### Performance Notes

- **Large texts**: Processing many sentences may take time with LLM calls
- **Database size**: SQLite handles thousands of YuKuai efficiently
- **Memory usage**: Sentences are stored in memory for the session

## Future Enhancements

- **Multi-user support** with user authentication
- **Export/import** of learning data
- **Advanced analytics** and learning recommendations
- **Web interface** for better UX
- **Mobile app** integration
- **Spaced repetition** algorithms
- **Audio pronunciation** support

## Contributing

This is a prototype for educational purposes. Feel free to:
- Report bugs or issues
- Suggest new features
- Improve the code structure
- Add more language support

## License

Educational prototype - feel free to use and modify for learning purposes.
