const { runCommand } = require('../../../orchestration/commandRunner')

describe('backend/orchestration/commandRunner', () => {
    it('rejects when env is an array (fail fast)', async () => {
        await expect(
            runCommand({
                command: process.execPath,
                args: ['-e', 'process.exit(0)'],
                env: [],
            })
        ).rejects.toMatchObject({
            type: 'invalid_env',
        })
    })

    it('supports envOverrides as an object and merges into child env', async () => {
        const result = await runCommand({
            command: process.execPath,
            args: ['-e', 'console.log(process.env.TEST_ENV_OVERRIDE || "")'],
            envOverrides: { TEST_ENV_OVERRIDE: 'hello' },
        })

        expect(result.exitCode).toBe(0)
        expect(result.stdout.trim()).toBe('hello')
    })

    it('stringifies non-string env override values and omits null/undefined', async () => {
        const result = await runCommand({
            command: process.execPath,
            args: ['-e', 'console.log(`${process.env.NUMBER_VAL}|${process.env.NULL_VAL ?? ""}`)'],
            envOverrides: { NUMBER_VAL: 1234, NULL_VAL: null },
        })

        expect(result.exitCode).toBe(0)
        expect(result.stdout.trim()).toBe('1234|')
    })
})
