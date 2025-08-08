#!/usr/bin/env python3
"""
Test script to verify throttling logic works correctly
"""

# Simulate the throttling logic
throttled_models = set()

def test_throttling():
    # Test adding models to throttled list
    throttled_models.add("Gemini 1.5 Flash")
    throttled_models.add("Llama 3.1 8B")
    print(f"Throttled models: {list(throttled_models)}")
    
    # Test checking if models are available
    WORKING_MODELS = [
        {"name": "Gemini 1.5 Flash"},
        {"name": "Llama 3.1 8B"},
        {"name": "DeepSeek V3"}
    ]
    
    available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
    print(f"Available models: {[m['name'] for m in available_models]}")
    
    # Test service health
    is_healthy = len(available_models) > 0
    print(f"Service healthy: {is_healthy}")
    
    # Test successful model (removes from throttled)
    throttled_models.discard("DeepSeek V3")  # This should be a no-op since it wasn't throttled
    print(f"After successful DeepSeek: {list(throttled_models)}")
    
    # Test clearing all throttled models
    throttled_models.clear()
    available_models = [model for model in WORKING_MODELS if model['name'] not in throttled_models]
    print(f"After reset - Available models: {[m['name'] for m in available_models]}")

if __name__ == "__main__":
    test_throttling()
