// Vercel Serverless Function - Proxy for OpenAI Whisper API
// This transcribes audio to text

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        // Get the audio blob from the request
        const { audio } = req.body;
        
        if (!audio) {
            return res.status(400).json({ error: 'No audio data provided' });
        }

        // Convert base64 audio to buffer
        const audioBuffer = Buffer.from(audio, 'base64');

        // Create form data for Whisper API
        const formData = new FormData();
        formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
        formData.append('model', 'whisper-1');

        // Call OpenAI Whisper API
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb'
        }
    }
};

