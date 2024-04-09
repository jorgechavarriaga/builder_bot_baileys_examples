import { exec } from 'child_process'
import cron from 'node-cron'

export function startCronJob() {
    cron.schedule('*/5 * * * *', function () {
        exec('npm run dev1', (err, stdout, stderr) => {
            if (err) {
                console.error('Error:', err)
                return;
            }
            console.log('stdout:', stdout)
            console.log('stderr:', stderr)
        })
    })
}
