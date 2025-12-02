# How to Get Your FREE Groq API Key

Groq is **completely FREE** with no credit card required! Follow these simple steps:

## Step 1: Create a Groq Account

1. Go to https://console.groq.com/
2. Click "Sign Up" or "Get Started"
3. Sign up with your email or Google account
4. Verify your email if needed

## Step 2: Get Your API Key

1. Once logged in, go to https://console.groq.com/keys
2. Click "Create API Key"
3. Give it a name (e.g., "DeltaEDU")
4. Click "Submit"
5. **COPY the API key** (starts with `gsk_...`)

## Step 3: Add to Your Project

1. Open your `.env` file
2. Find the line: `GROQ_API_KEY=your-groq-api-key-here`
3. Replace `your-groq-api-key-here` with your actual key
4. Save the file

Example:
```env
GROQ_API_KEY=gsk_abc123xyz456...
```

## Step 4: Restart Your Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Why Groq?

✅ **Completely FREE** - No credit card needed
✅ **Super FAST** - Faster than OpenAI
✅ **Powerful** - Uses Llama 3.3 70B model
✅ **Generous limits** - 30 requests/minute on free tier
✅ **Context-aware** - Reads your uploaded notes for better answers

## What Models We're Using

- **Chat & Summary**: `llama-3.3-70b-versatile` - Best for conversations
- **Quiz Generation**: `llama-3.3-70b-versatile` - Great for creating educational content

## Need Help?

If you have any issues:
1. Make sure you copied the entire API key
2. Check there are no extra spaces in your `.env` file
3. Restart your development server
4. Check the server logs for errors

---

**Note**: Your Groq API key is free but has rate limits. The free tier allows:
- 30 requests per minute
- 14,400 tokens per minute

This is more than enough for a student project!
