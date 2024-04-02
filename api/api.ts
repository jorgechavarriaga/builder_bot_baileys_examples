import axios from 'axios'
import { config } from 'dotenv'
config()


const apiKey = process.env.X_RapidAPI_Key
console.log(apiKey)
export async function generate_joke() {
    try {
        const options = {
            method: 'GET',
            url: 'https://jokeapi-v2.p.rapidapi.com/joke/Any',
            params: {
                format: 'json',
                idRange: '0-150'
            },
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'jokeapi-v2.p.rapidapi.com'
            }
        }
        const response = await axios.request(options)

        if (response.data.type === 'single') {
            return { joke: response.data.joke, delivery: null };
        } else if (response.data.type === 'twopart') {
            return { joke: response.data.setup, delivery: response.data.delivery };
        } else {
            return { error: true, message: 'Tipo de chiste no reconocido' };
        }
    } catch (error) {
        return { error: true, message: `API error: ${error}` };
    }
}


