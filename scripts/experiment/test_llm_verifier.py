#!/usr/bin/env python3
"""
Test script for LLM verifier.

Usage:
    python test_llm_verifier.py [image_path] [species_name]
    
Requires GEMINI_API_KEY environment variable.
"""

import sys
import os
import cv2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'processor', 'src'))
from llm_verifier import LLMVerifier

def main():
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print("Error: Set GEMINI_API_KEY environment variable")
        sys.exit(1)
    
    image_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(__file__), '..', '..', 'app', 'data', 'samples', 'photos', '1.jpg')
    species = sys.argv[2] if len(sys.argv) > 2 else "Blue Jay"
    
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Cannot read {image_path}")
        sys.exit(1)
    
    print(f"Image: {image_path}")
    print(f"ML detected: {species}")
    print()
    
    verifier = LLMVerifier(api_key)
    result = verifier.verify(image, species)
    
    print(f"is_plausible: {result['is_plausible']}")
    print(f"reasoning:    {result['reasoning']}")
    print()
    print("✅ KEEP" if result['is_plausible'] else "❌ REJECT")

if __name__ == "__main__":
    main()
