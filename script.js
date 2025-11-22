// No API key needed in frontend - it's handled by the serverless function!

// State management
let currentPassage = '';
let currentQuestions = [];
let currentAnswers = [];
let questionStates = [false, false]; // Track which questions have been answered correctly
let userConfig = {
    gradeLevel: '2nd grade',
    storyLength: 'short',
    topicArea: 'ocean animals'
};
let activeRecognitions = [null, null]; // Track active recognition instances
const MAX_RECENT_TOPICS = 5; // Remember last 5 topics

// Load recent topics from localStorage (persists across browser sessions)
let recentTopics = [];
try {
    const stored = localStorage.getItem('recentTopics');
    if (stored) {
        recentTopics = JSON.parse(stored);
    }
} catch (error) {
    console.log('Could not load recent topics:', error);
    recentTopics = [];
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Sorry! Your browser doesn\'t support speech recognition. Please use Chrome or Edge.');
        return;
    }

    // Check if we're running on a proper server
    if (window.location.protocol === 'file:') {
        console.warn('Running from file:// - microphone permissions may not persist. Please use a local server (e.g., python3 -m http.server)');
    }

    // Try to request microphone permission early
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just wanted to get permission
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted!');
    } catch (error) {
        console.log('Microphone permission not yet granted:', error);
    }

    // Set up event listeners
    document.getElementById('generateStoryBtn').addEventListener('click', generateNewStory);
    document.getElementById('newStoryBtn').addEventListener('click', () => {
        // Show config section, hide main content
        document.getElementById('configSection').style.display = 'block';
        document.getElementById('mainContent').style.display = 'none';
    });
    document.getElementById('micBtn1').addEventListener('click', () => toggleListening(0));
    document.getElementById('micBtn2').addEventListener('click', () => toggleListening(1));
});

// Generate a new reading passage and questions
async function generateNewStory() {
    // Get user configuration
    userConfig.gradeLevel = document.getElementById('gradeLevel').value;
    userConfig.storyLength = document.getElementById('storyLength').value;
    userConfig.topicArea = document.getElementById('topicArea').value;

    // Reset state
    questionStates = [false, false];
    document.getElementById('completionMessage').style.display = 'none';
    
    // Hide config section and show loading screen
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';

    // Clear previous content
    document.getElementById('transcript1').textContent = '';
    document.getElementById('transcript2').textContent = '';
    document.getElementById('feedback1').className = 'feedback';
    document.getElementById('feedback2').className = 'feedback';
    document.getElementById('feedback1').style.display = 'none';
    document.getElementById('feedback2').style.display = 'none';

    try {
        // Call our serverless function instead of OpenAI directly
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: `You are a helpful assistant creating reading comprehension content for children at the ${userConfig.gradeLevel} reading level.`
                }, {
                    role: 'user',
                    content: generatePrompt()
                }],
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        currentPassage = content.passage;
        currentQuestions = content.questions;
        currentAnswers = content.questions.map(q => q.expectedAnswer);

        // Track the topic to avoid duplicates and save to localStorage
        if (content.topic) {
            recentTopics.push(content.topic);
            if (recentTopics.length > MAX_RECENT_TOPICS) {
                recentTopics.shift(); // Remove oldest topic
            }
            // Save to localStorage so it persists across browser sessions
            try {
                localStorage.setItem('recentTopics', JSON.stringify(recentTopics));
            } catch (error) {
                console.log('Could not save recent topics:', error);
            }
        }

        // Display the content
        document.getElementById('passageText').textContent = currentPassage;
        document.getElementById('question1Text').textContent = content.questions[0].question;
        document.getElementById('question2Text').textContent = content.questions[1].question;

        // Show main content
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';

    } catch (error) {
        console.error('Error generating story:', error);
        document.getElementById('loadingScreen').innerHTML = `
            <p style="color: red;">Oops! Something went wrong. Please check your API key and try again.</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; font-size: 1.2em; cursor: pointer;">Try Again</button>
        `;
    }
}

// Generate the prompt based on user configuration
function generatePrompt() {
    const sentenceCount = {
        'short': 4,
        'medium': 6,
        'long': 8
    }[userConfig.storyLength];

    const topicText = userConfig.topicArea ? ` about ${userConfig.topicArea}` : '';
    
    // Build list of recent topics to avoid
    let avoidTopicsText = '';
    if (recentTopics.length > 0) {
        avoidTopicsText = `\n\nIMPORTANT: Do NOT create a story about any of these recently used topics: ${recentTopics.join(', ')}. Choose a completely different subject to keep things fresh and interesting!`;
    }

    return `Create a ${userConfig.storyLength} reading passage (exactly ${sentenceCount} sentences)${topicText} appropriate for a child at the ${userConfig.gradeLevel} reading level.${avoidTopicsText} 

IMPORTANT RULES:
1. The passage must be about ONE single topic or subject. All ${sentenceCount} sentences should be related and tell a coherent story or provide related facts about the same thing. Do NOT mix multiple unrelated topics or animals.

2. Create 2 comprehension questions that can ONLY be answered by reading the passage. The answer to each question MUST be explicitly stated in the passage text. Do NOT ask questions about information that isn't in the passage.

For example:
- Good passage topic: All sentences about elephants
- Good passage topic: All sentences about a boy going to the park
- Bad passage topic: Mixing octopuses, flamingos, and kangaroos

- Good question: "How much can elephants weigh?" (if passage says "Elephants can weigh up to 14,000 pounds")
- Bad question: "What is the average weight of an elephant?" (if passage only mentions maximum weight)

Return your response in this EXACT JSON format:
{
  "topic": "Brief topic name (e.g., 'elephants', 'going to the beach', 'butterflies')",
  "passage": "Your ${sentenceCount} sentence coherent story here.",
  "questions": [
    {
      "question": "First question?",
      "expectedAnswer": "Brief description of what a correct answer should include"
    },
    {
      "question": "Second question?",
      "expectedAnswer": "Brief description of what a correct answer should include"
    }
  ]
}

Make sure:
- The passage is exactly ${sentenceCount} sentences
- Uses vocabulary appropriate for ${userConfig.gradeLevel}
- Stays on ONE topic throughout
- Questions can be answered DIRECTLY from the passage text
- Questions test basic comprehension (who, what, where, when, why, how)`;
}

// Toggle speech recognition on/off
function toggleListening(questionIndex) {
    if (activeRecognitions[questionIndex]) {
        // Stop listening
        stopListening(questionIndex);
    } else {
        // Start listening
        startListening(questionIndex);
    }
}

// Speech recognition with manual stop
function startListening(questionIndex) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = true; // Show interim results
    recognition.maxAlternatives = 1;
    recognition.continuous = true; // Keep listening until manually stopped

    const micBtn = document.getElementById(`micBtn${questionIndex + 1}`);
    const transcript = document.getElementById(`transcript${questionIndex + 1}`);
    
    // Store the recognition instance
    activeRecognitions[questionIndex] = recognition;
    
    // Update button state
    micBtn.classList.add('listening');
    micBtn.querySelector('.button-text').textContent = 'Click to Finish Answering';

    let finalTranscript = '';

    recognition.onstart = () => {
        console.log('Speech recognition started');
        transcript.textContent = 'Listening...';
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcriptPiece + ' ';
            } else {
                interimTranscript += transcriptPiece;
            }
        }
        
        // Show what's being said in real-time
        transcript.textContent = `You said: "${finalTranscript}${interimTranscript}"`;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle specific error types
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            transcript.textContent = 'Please allow microphone access in your browser settings and refresh the page.';
        } else if (event.error === 'no-speech') {
            // Don't show error for no-speech, just keep listening
            return;
        } else if (event.error === 'aborted') {
            // Normal stop, don't show error
            return;
        } else {
            transcript.textContent = 'Sorry, something went wrong. Please try again!';
        }
        
        activeRecognitions[questionIndex] = null;
        resetMicButton(questionIndex);
    };

    recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // If there's a final transcript, assess it
        if (finalTranscript.trim()) {
            assessAnswer(questionIndex, finalTranscript.trim());
        } else if (transcript.textContent === 'Listening...') {
            transcript.textContent = 'Click the button and speak your answer!';
        }
        
        activeRecognitions[questionIndex] = null;
        resetMicButton(questionIndex);
    };

    try {
        recognition.start();
    } catch (error) {
        console.error('Error starting recognition:', error);
        transcript.textContent = 'Error starting microphone. Please try again!';
        activeRecognitions[questionIndex] = null;
        resetMicButton(questionIndex);
    }
}

function stopListening(questionIndex) {
    if (activeRecognitions[questionIndex]) {
        activeRecognitions[questionIndex].stop();
        activeRecognitions[questionIndex] = null;
    }
}

function resetMicButton(questionIndex) {
    const micBtn = document.getElementById(`micBtn${questionIndex + 1}`);
    micBtn.classList.remove('listening');
    micBtn.querySelector('.button-text').textContent = 'Click to Answer';
}

// Assess the spoken answer using AI
async function assessAnswer(questionIndex, spokenAnswer) {
    const feedbackDiv = document.getElementById(`feedback${questionIndex + 1}`);
    feedbackDiv.textContent = 'Checking your answer...';
    feedbackDiv.className = 'feedback';
    feedbackDiv.style.display = 'block';
    feedbackDiv.style.background = '#e3f2fd';
    feedbackDiv.style.color = '#1565c0';

    try {
        // Call our serverless function instead of OpenAI directly
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{
                    role: 'system',
                    content: 'You are a patient and encouraging teacher assessing a 6-year-old child\'s reading comprehension answer. Be kind and supportive.'
                }, {
                    role: 'user',
                    content: `Reading passage: "${currentPassage}"

Question: "${currentQuestions[questionIndex].question}"

Expected answer should include: "${currentAnswers[questionIndex]}"

Child's spoken answer: "${spokenAnswer}"

Assess if the child's answer demonstrates understanding of the passage. If correct, respond with encouraging praise. If incorrect, provide a gentle hint about what to look for in the passage without giving away the answer.

Return your response in this EXACT JSON format:
{
  "isCorrect": true or false,
  "feedback": "Your encouraging message here (keep it to 1-2 sentences for a 6-year-old)"
}

Be generous in your assessment - if the child shows basic understanding even if not perfectly articulated, mark it correct.`
                }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        const assessment = JSON.parse(data.choices[0].message.content);

        // Display feedback
        if (assessment.isCorrect) {
            feedbackDiv.className = 'feedback correct';
            feedbackDiv.innerHTML = '<div class="checkmark">✓</div>';
            questionStates[questionIndex] = true;
            
            // Check if both questions are answered
            if (questionStates[0] && questionStates[1]) {
                setTimeout(() => {
                    document.getElementById('completionMessage').style.display = 'block';
                }, 1000);
            }
        } else {
            feedbackDiv.className = 'feedback incorrect';
            feedbackDiv.innerHTML = `
                <div class="x-mark">✗</div>
                <div class="hint-text">${assessment.feedback}</div>
            `;
        }

    } catch (error) {
        console.error('Error assessing answer:', error);
        feedbackDiv.className = 'feedback incorrect';
        feedbackDiv.innerHTML = `
            <div class="x-mark">✗</div>
            <div class="hint-text">Oops! Something went wrong. Please try answering again.</div>
        `;
    }
}

