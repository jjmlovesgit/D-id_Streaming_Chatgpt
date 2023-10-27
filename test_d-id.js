const fetch = require('node-fetch');
const base64 = require('base-64');
const fs = require('fs');

async function getDidCredits(apiKey) {
  const url = "https://api.d-id.com/credits";
  const authString = apiKey + ":";
  const base64AuthString = base64.encode(authString);

  const headers = {
    "accept": "application/json",
    "Authorization": `Basic ${base64AuthString}`
  };

  const response = await fetch(url, { headers });
  const data = await response.json();
  return data;
}

async function main() {
  try {
    // Read the API key from api.json file
    const apiKeyJson = JSON.parse(fs.readFileSync('api.json', 'utf8'));
    const apiKey = apiKeyJson.key;

    const didCredits = await getDidCredits(apiKey);
    console.log("Response:", didCredits);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
