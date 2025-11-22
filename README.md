# Reading Comprehension for Asher 📚

A fun, interactive reading comprehension website for young readers! This app generates age-appropriate reading passages and tests comprehension through voice-based questions.

## Features

- 🎯 AI-generated reading passages (4 sentences, 2nd grade level)
- 🎤 Voice input for answering questions
- ✅ Intelligent answer assessment with encouraging feedback
- 💡 Helpful hints when answers need improvement
- 🎨 Kid-friendly, colorful interface

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI's website](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (you won't be able to see it again!)

### 2. Add Your API Key

Open `script.js` and replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
const OPENAI_API_KEY = 'sk-your-actual-key-here';
```

### 3. Run the Website

Since this uses browser APIs and makes external API calls, you need to run it through a local server:

**Option 1: Using Python (if installed)**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option 2: Using Node.js (if installed)**
```bash
npx http-server -p 8000
```

**Option 3: Using VS Code**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

Then open your browser and go to: `http://localhost:8000`

### 4. Browser Compatibility

This app uses the Web Speech API for voice recognition. It works best on:
- ✅ Google Chrome (recommended)
- ✅ Microsoft Edge
- ❌ Safari (limited support)
- ❌ Firefox (not supported)

## How to Use

1. Click "Get New Story" to generate a reading passage
2. Read the 4-sentence story carefully
3. Click the microphone button 🎤 to answer each question
4. Speak your answer clearly
5. Get instant feedback:
   - ✅ Green checkmark = Correct!
   - 💡 Yellow hint = Try again with a hint
6. Answer both questions to complete the activity
7. Click "Try Another Story" for more practice!

## Cost Information

This app uses OpenAI's API which has costs:
- **Model used**: GPT-4o-mini (very affordable)
- **Estimated cost**: ~$0.01-0.02 per story generation
- Each story generates 2 API calls (one for content, one for each answer assessment)

You can monitor your usage at: https://platform.openai.com/usage

## Customization

You can easily customize the app by editing `script.js`:

- **Reading level**: Change the prompt in `generateNewStory()` function
- **Number of sentences**: Modify "exactly 4 sentences" in the prompt
- **Number of questions**: Add more question cards in HTML and update the logic
- **Topics**: Add specific topics to the content generation prompt

## Troubleshooting

**"Your browser doesn't support speech recognition"**
- Use Google Chrome or Microsoft Edge

**"API request failed"**
- Check that your API key is correct
- Verify you have credits in your OpenAI account
- Check your internet connection

**Microphone not working**
- Allow microphone permissions when prompted
- Check browser settings for microphone access
- Make sure no other app is using the microphone

## Privacy & Safety

- All voice input is processed through your browser's speech recognition
- Reading passages are generated fresh each time
- No data is stored or saved
- API calls are made directly from the browser to OpenAI

## Support

If you encounter any issues or want to customize the app further, feel free to modify the code! The structure is simple and well-commented.

---

Made with ❤️ for Asher's reading practice!

