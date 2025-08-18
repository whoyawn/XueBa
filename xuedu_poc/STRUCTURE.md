# XueDu App - Modular Structure

## Overview

The XueDu Chinese Learning App has been refactored from a monolithic `chinese_learner.py` file into a clean, modular architecture organized in the `src/` directory.

## Directory Structure

```
xuedu_poc/
├── src/                     # Source code package
│   ├── __init__.py          # Package initialization
│   ├── models.py            # Data models and structures
│   ├── database.py          # Database operations
│   ├── llm_parser.py        # LLM integration
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

## Module Responsibilities

### `src/models.py`
- **Purpose**: Data classes and structures
- **Contains**: `YuKuai`, `Sentence` dataclasses
- **Dependencies**: None (pure data structures)

### `src/database.py`
- **Purpose**: Database operations and management
- **Contains**: `XueDuDB` class with all SQLite operations
- **Dependencies**: `models.py` (for YuKuai type hints)

### `src/llm_parser.py`
- **Purpose**: LLM integration and text parsing
- **Contains**: `LLMParser` class for OpenAI integration
- **Dependencies**: `models.py` (for YuKuai creation)

### `src/app.py`
- **Purpose**: Main application logic and CLI interface
- **Contains**: `XueDuApp` class with all user interactions
- **Dependencies**: `models.py`, `database.py`, `llm_parser.py`

### `main.py`
- **Purpose**: Application entry point
- **Contains**: Main function and error handling
- **Dependencies**: `src.app` (XueDuApp class)

## Benefits of Modular Structure

1. **Separation of Concerns**: Each module has a single, clear responsibility
2. **Maintainability**: Easier to locate and fix issues in specific functionality
3. **Testability**: Individual modules can be tested in isolation
4. **Reusability**: Modules can be imported and used independently
5. **Scalability**: New features can be added as new modules
6. **Code Organization**: Clear structure makes the codebase easier to navigate

## Import Strategy

The modular structure uses relative imports within the `src/` package:

```python
# Within src/ package
from .models import YuKuai
from .database import XueDuDB
from .llm_parser import LLMParser
```

External scripts (like `main.py`, `test_basic.py`, `demo.py`) add the `src/` directory to the Python path:

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))
from models import YuKuai
```

## Running the App

### Main Application
```bash
python3 xuedu.py
```

### Testing
```bash
python3 tests/test_basic.py
```

### Demo
```bash
python3 tests/demo.py
```

## Future Enhancements

The modular structure makes it easy to add new features:

- **New Models**: Add to `models.py` or create new model files
- **Additional Parsers**: Create new parser modules in `src/`
- **Web Interface**: Add `web/` directory with Flask/FastAPI modules
- **Mobile API**: Add `api/` directory with REST endpoints
- **Analytics**: Add `analytics/` directory for advanced reporting

## Migration Notes

- **Old file**: `chinese_learner.py` has been removed
- **Database**: Database name changed from `chinese_learner.db` to `xuedu.db`
- **Class names**: All classes now use "XueDu" prefix instead of "ChineseLearner"
- **Imports**: All import statements updated to use relative imports within `src/`
