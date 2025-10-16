import argon2 from 'argon2-browser/dist/argon2-bundled.min.js';

const argon2Options = {
    type: 'argon2id',
    version: '19(1.3)',
    time: 8,
    mem: 512 * 1024,
    hashLen: 32,
    parallelism: 4,
}

/**
 * Computes Argon2id hash based on password and salt.
 *
 * @async
 * @param {string} password - Plaintext password.
 * @param {ArrayBuffer|Uint8Array} salt - Salt.
 * @returns {Promise<Uint8Array>} Hash.
 */
async function passwordToHash(password, salt) {
    const options = {
        pass: password,
        salt: salt,
        time: argon2Options.time,
        mem: argon2Options.mem,
        hashLen: argon2Options.hashLen,
        parallelism: argon2Options.parallelism,
        type: argon2.ArgonType.Argon2id
    };
    return (await argon2.hash(options)).hash;
}

self.onmessage = async (event) => {
    const { password, salt, options } = event.data;
    try {
        self.postMessage({ success: true, hash: await passwordToHash(password, salt) });
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};