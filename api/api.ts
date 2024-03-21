import axios from 'axios'
import { config } from 'dotenv'
config()


const apiKey = process.env.X_RapidAPI_Key
console.log(apiKey)
export async function joke() {
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
        return response.data
    } catch (error) {
        return `API error: ${error}`
    }
}


