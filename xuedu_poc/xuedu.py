#!/usr/bin/env python3
"""
Main entry point for the XueDu Chinese Learning App
"""

import sys
import os
import argparse

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app import XueDuApp

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="XueDu Chinese Learning App - Process Chinese text files into YuKuai",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 xuedu.py sample_text.txt                    # Process a single file
  python3 xuedu.py --quiz sample_text.txt             # Process file and run quiz
        """
    )
    
    parser.add_argument(
        'file',
        help='Chinese text file to process'
    )
    
    parser.add_argument(
        '--quiz', '-q',
        action='store_true',
        help='Run quiz mode after processing'
    )
    
    args = parser.parse_args()
    
    try:
        app = XueDuApp()
        
        # Process the input file
        file_path = args.file
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            sys.exit(1)
            
        print(f"\n=== Processing: {file_path} ===")
        app.process_file(file_path)
        
        # Display summary
        app.display_summary()
        
        # Run quiz mode if requested
        if args.quiz:
            app.quiz_mode()
        
    except KeyboardInterrupt:
        print("\n\nGoodbye! 再见!")
    except Exception as e:
        print(f"An error occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
