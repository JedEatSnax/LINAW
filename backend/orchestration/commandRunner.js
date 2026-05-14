const { spawn } = require('child_process')

function normalizeEnvOverrides(envOverrides) {
    if (envOverrides == null) return {}

    if (Array.isArray(envOverrides)) {
        throw new TypeError(
            'env overrides must be an object (e.g. { KEY: "value" }); arrays are not supported'
        )
    }

    if (typeof envOverrides !== 'object') {
        throw new TypeError(
            `env overrides must be an object; received ${typeof envOverrides}`
        )
    }

    const normalized = {}
    for (const [key, value] of Object.entries(envOverrides)) {
        if (value === undefined || value === null) continue
        normalized[key] = String(value)
    }
    return normalized
}

function runCommand ({ command, args = [], cwd, env, envOverrides } = {}) {
    return new Promise((resolve, reject) => {
        let finalEnvOverrides
        try {
            finalEnvOverrides = normalizeEnvOverrides(
                envOverrides !== undefined ? envOverrides : env
            )
        } catch (error) {
            reject({
                type: 'invalid_env',
                error,
            })
            return
        }

        const childEnv = { ...process.env, ...finalEnvOverrides }

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