# Model Selector Feature - Testing Guide

## ✅ Implementation Complete

The model selector feature has been successfully implemented with the following components:

### New Features

1. **Dynamic Model Detection** (`/app/api/models/route.ts`)
   - Tests all known Claude models against your API key
   - Returns only the models you have access to
   - Automatically sets Claude Sonnet 4.5 as default (if available)

2. **Model Selector UI** (`/components/ModelSelector.tsx`)
   - Dropdown in the chat header
   - Shows model name and description
   - Icon indicator (sparkles)
   - Loading and error states

3. **Model Parameter Support**
   - Updated `ChatRequest` type to include `model` field
   - LLM service accepts model parameter
   - Chat API passes selected model to LLM service

### Available Models (Based on Your API Key)

According to the API test, your API key has access to:
- ✅ **Claude Sonnet 4.5** (`claude-sonnet-4-5`) - Default
- ✅ **Claude 3.5 Sonnet** (`claude-3-5-sonnet-20241022`)

Not available:
- ❌ Claude Opus 4.6
- ❌ Claude 3 Opus
- ❌ Claude 3 Haiku

## Testing Instructions

### 1. Visual Test (Recommended)

1. **Start the dev server** (already running at http://localhost:3000)

2. **Upload a file:**
   - Navigate to http://localhost:3000
   - Upload `/public/sample-sales-data.xlsx`

3. **Check the model selector:**
   - Look at the chat interface header (top right)
   - You should see a dropdown labeled "AI Model"
   - Click it to see available models:
     - Claude Sonnet 4.5 (selected by default)
     - Claude 3.5 Sonnet

4. **Test model switching:**
   - Ask a question: "Which product sold the most?"
   - Change the model to "Claude 3.5 Sonnet"
   - Ask another question: "Show sales by region"
   - Both should work correctly

5. **Verify functionality:**
   - The model selector should appear in the purple header
   - It should have a sparkles icon
   - Hovering over models shows descriptions
   - Changing models should work seamlessly

### 2. API Test

Test the models endpoint:
```bash
curl http://localhost:3000/api/models | jq .
```

Expected output:
```json
{
  "models": [
    {
      "id": "claude-sonnet-4-5",
      "name": "Claude Sonnet 4.5",
      "description": "Latest Sonnet model - balanced performance and speed"
    },
    {
      "id": "claude-3-5-sonnet-20241022",
      "name": "Claude 3.5 Sonnet",
      "description": "Previous Sonnet version - reliable and fast"
    }
  ],
  "defaultModel": "claude-sonnet-4-5"
}
```

### 3. End-to-End Test

Test with different models:

```bash
# Upload file
FILE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/data/upload \
  -F "file=@public/sample-sales-data.xlsx")

DATA_SOURCE_ID=$(echo $FILE_RESPONSE | jq -r '.dataSourceId')

# Test with Claude Sonnet 4.5
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Which product sold the most?\",
    \"dataSourceId\": \"$DATA_SOURCE_ID\",
    \"model\": \"claude-sonnet-4-5\"
  }" | jq .

# Test with Claude 3.5 Sonnet
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"Show sales by region\",
    \"dataSourceId\": \"$DATA_SOURCE_ID\",
    \"model\": \"claude-3-5-sonnet-20241022\"
  }" | jq .
```

## Files Changed

### New Files
- `/app/api/models/route.ts` - Model detection endpoint
- `/components/ModelSelector.tsx` - UI component
- `/TEST-MODEL-SELECTOR.md` - This file

### Modified Files
- `/lib/types.ts` - Added `model` to `ChatRequest`, added `ModelInfo` type
- `/lib/llm-service.ts` - Added model parameter support, `setModel()` and `getModel()` methods
- `/app/api/chat/route.ts` - Extract and pass model to LLM service
- `/components/ChatInterface.tsx` - Integrated ModelSelector, pass model in API requests
- `/README.md` - Updated all references from "Claude Opus 4.6" to "Claude AI"

## Default Model

The application now defaults to **Claude Sonnet 4.5** (`claude-sonnet-4-5`), which is:
- ✅ Available with your API key
- ✅ The latest Sonnet model
- ✅ Balanced performance and speed
- ✅ Cost-effective

## Future Enhancements

If you get access to more models in the future:
1. They will automatically appear in the dropdown (no code changes needed)
2. The `/api/models` endpoint tests all known models on each request
3. Add new models to the `KNOWN_MODELS` array in `/app/api/models/route.ts`

## Troubleshooting

### Model selector not appearing
- Clear browser cache and reload
- Check browser console for errors
- Verify `/api/models` returns data

### "Model not available" error
- Check your Anthropic API key tier
- Verify API key is set in `.env.local`
- Check `/api/models` endpoint response

### No models showing in dropdown
- Verify your API key is valid
- Check server logs for errors
- Ensure internet connection is working
