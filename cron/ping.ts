import { exec } from 'child_process'
import request from 'request'
import { config } from 'dotenv'
config()

const serversStr = process.env.SERVERS
const servers = JSON.parse(serversStr)
const MY_PHONE = process.env.MY_PHONE

export async function pingIP(ip: string): Promise<boolean> {
    return new Promise<boolean>((resolve, _) => {
        exec(`ping -c 1 ${ip}`, (error, stdout, _) => {
            if (error) {
                resolve(false)
            } else {
                const hasResponse = stdout.toLowerCase().includes("ttl")
                resolve(hasResponse)
            }
        })
    })
}

async function checkServers() {
    const results = [];
    results.push(`*${new Date()}*\n`)
    for (const server of servers) {
        const [name, ip] = Object.entries(server)[0]
        if (typeof ip === 'string') {
            const resp = await pingIP(ip)
            const respString = `*Server:* ${name} ${resp ? '✅' : '❌'}\n*IP:* ${ip}\n*Status:* ${resp ? '*Up* ⬆️' : '*Down* ⬇️'}\n`
            results.push(respString)
        }
    }
    return results.join('\n')
}

function callEndpoint(result: string) {
    const options = {
        method: 'POST',
        url: 'http://localhost:3008/v1/messages',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            number: MY_PHONE,
            message: result
        })
    }

    request(options, function (error: any, response: any, body: any) {
        if (error) throw new Error(error)
        console.log(body)
    })
}

checkServers()
    .then((results) => {
        callEndpoint(results)
    })
    .catch(error => console.error('Error:', error))
