const { spawn } = require('child_process')

function runCommand ({ command, args = [], cwd, env = []}) {
    return new  Promise((resolve, reject) => {
        const childEnv = { ...process.env, ...env}

        const child = spawn (command, args, {
            cwd,
            env: childEnv,
            shell: false,
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (data) => {
            stdout += data.toString()
        })

        child.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        child.on('error', (error) => {
            reject({
                type: 'spawn_error',
                error
            })
        })

        child.on('close', (code) => {
            if(code === 0 ) {
                resolve({
                    exitCode: code,
                    stdout,
                    stderr
                })
            } else {
                reject({
                    type: 'non_zero_exit',
                    exitCode: code,
                    stdout,
                    stderr
                })
            }
        })

    })
}

module.exports = {
    runCommand
}