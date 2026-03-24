# 🤖 ChatGPT Integration Setup Guide

## 📋 Overview

Your Recipe Book app now includes a ChatGPT-powered cooking assistant that can help with:

- Recipe quantity adjustments
- Ingredient substitutions
- Cooking tips and techniques
- General cooking questions

---

## 🔑 Step 1: Get Your OpenAI API Key

1. **Go to OpenAI Platform:**
   - Visit: https://platform.openai.com/
   - Sign up or log in to your account

2. **Create an API Key:**
   - Click on your profile icon (top right)
   - Select "API Keys"
   - Click "Create new secret key"
   - Give it a name (e.g., "Recipe Book App")
   - **IMPORTANT:** Copy the key immediately - you won't see it again!

3. **Add Payment Method:**
   - Go to "Billing" → "Payment methods"
   - Add a credit/debit card
   - Set a usage limit (recommended: $5-10/month for personal use)

---

## ⚙️ Step 2: Configure Your App

1. **Create .env file:**

   ```bash
   # In your project root directory
   cp .env.example .env
   ```

2. **Add your API key:**
   Open the `.env` file and replace `your_openai_api_key_here` with your actual API key:

   ```
   VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
   ```

3. **Restart your development server:**
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev`

---

## 💰 Cost Information

**Pricing (as of 2024):**

- Model: GPT-3.5-turbo
- Cost: ~$0.002 per 1,000 tokens
- Average chat message: ~100-200 tokens
- **Estimated cost:** $0.10-0.50 per month for personal use

**Example:**

- 100 messages/month ≈ $0.20
- 500 messages/month ≈ $1.00

---

## 🎯 How to Use

1. **Open the app** and go to Categories page
2. **Click the "💬 Chat" button** in the header
3. **Ask questions** like:
   - "How do I adjust this recipe for 8 people?"
   - "What can I substitute for eggs?"
   - "How long should I bake chicken at 350°F?"
   - "What's the difference between baking and roasting?"

---

## 🔒 Security Best Practices

✅ **DO:**

- Keep your `.env` file private
- Never commit `.env` to git (it's already in .gitignore)
- Set usage limits in OpenAI dashboard
- Regenerate your API key if exposed

❌ **DON'T:**

- Share your API key with anyone
- Commit API keys to public repositories
- Use the same key across multiple projects

---

## 🐛 Troubleshooting

### Error: "OpenAI API key is not configured"

**Solution:** Make sure you created the `.env` file and added your API key

### Error: "Failed to get response from ChatGPT"

**Possible causes:**

1. Invalid API key - check if it's correct
2. No payment method - add a card in OpenAI billing
3. Usage limit reached - increase your limit
4. Network issue - check your internet connection

### Chat is slow

**Normal behavior:** GPT responses take 2-5 seconds. The typing animation shows it's working.

---

## 📚 Features

### Current Features:

- ✅ Real-time chat with GPT-3.5-turbo
- ✅ Recipe context awareness
- ✅ Beautiful chat UI
- ✅ Message history during session
- ✅ Loading indicators
- ✅ Error handling

### Future Enhancements (Optional):

<!-- - 💾 Save chat history to localStorage -->
- 🔄 Export chat conversations
- 📸 Image recognition for recipes
- 🌐 Multi-language support

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the browser console (F12) for errors
2. Verify your API key is correct
3. Check OpenAI dashboard for usage/billing issues
4. Make sure you restarted the dev server after adding the API key

---

## 🎉 You're All Set!

Your cooking assistant is ready to help. Enjoy chatting with your AI-powered recipe helper!
