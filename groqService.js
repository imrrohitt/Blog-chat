const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const log = (message) => {
    console.log(new Date().toISOString(), message);
};

const startServer = async (userMessage) => {
    try {
        log(`Received chat message: ${userMessage}`);

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: userMessage }],
            model: 'mixtral-8x7b-32768',
        });

        const generatedChat = completion.choices[0]?.message?.content || '';
        log(`Generated chat: ${generatedChat}`);

        return generatedChat;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
};

module.exports = { startServer };
