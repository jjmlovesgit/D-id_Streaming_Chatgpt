const config = require('./api.json');

const openai_key = config.openai_key;
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

async function main() {
    const fetch = await import('node-fetch').then(module => module.default);

    async function fetchOpenAIResponse(prompt) {
        const response = await fetch(OPENAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openai_key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{"role": "user", "content": prompt}],
                temperature: 0.7
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content.trim();  
    }

    const userInput = "Who is the CEO of Tesla?";
    const openAIResponse = await fetchOpenAIResponse(userInput);

    console.log("User Input:", userInput);
    console.log("OpenAI Response:", openAIResponse);
}

main().catch(error => console.error(error));
