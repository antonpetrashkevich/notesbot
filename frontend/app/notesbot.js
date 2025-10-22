import Argon2Worker from './workers/argon2.js?worker';

import { baseColors, colors as baseColors_, styles as baseStyles, handlers as baseHandlers, layouts as baseLayouts, components as baseComponents, pages as basePages } from '/home/n1/projects/xpl_kit/commons';
import { appName, stack, smallViewport, darkMode, utils, updateMetaTags, updateBodyStyle, startApp, startViewportSizeController, startThemeController } from '/home/n1/projects/xpl_kit/core.js';
import { radixColor, panels } from '/home/n1/projects/xpl_kit/colors.js';

import { initializeApp as initializeFirebase } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { addDoc, arrayRemove, arrayUnion, Bytes, CACHE_SIZE_UNLIMITED, collection, deleteDoc, deleteField, doc, increment, initializeFirestore, onSnapshot, orderBy, persistentLocalCache, persistentMultipleTabManager, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { getBytes, getStorage, ref, uploadBytesResumable } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

// https://developers.google.com/fonts/docs/material_symbols
// https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
import materialFontUrl from './material_symbols_outlined_default.woff2';

const firebaseConfig = {
    apiKey: "AIzaSyCpE4ytbA0WGmVV2gcun98F1FRHjtW-qtI",
    authDomain: "notesbot-be271.firebaseapp.com",
    projectId: "notesbot-be271",
    storageBucket: "notesbot-be271.firebasestorage.app",
    messagingSenderId: "408712122661",
    appId: "1:408712122661:web:30fa210ad4a3dc73ec4acc",
    measurementId: "G-85D3XP1ZM8"
};

const firebase = {};
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let authInitialized = false;
let notebookInitialized = false;
let notebook;
let key;
let tree;
const uploads = {};
const downloads = {};


function randomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

/**
 * Imports raw key material (hash bytes) into a non-extractable AES-GCM CryptoKey (256-bit) usable for encryption and decryption.
 *
 * @param {ArrayBuffer|ArrayBufferView} hash - Raw key bytes to import (e.g., ArrayBuffer, Uint8Array, DataView).
 * @returns {Promise<CryptoKey>} A promise that resolves to a non-extractable CryptoKey configured for AES-GCM with usages ['encrypt', 'decrypt'].
 */
async function hashToKey(hash) {
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts the provided data using AES-GCM with the given CryptoKey.
 *
 * @async
 * @param {CryptoKey} key - The AES-GCM CryptoKey used for encryption.
 * @param {ArrayBuffer|Uint8Array} data - The data to encrypt, as an ArrayBuffer or Uint8Array.
 * @returns {Promise<{iv: Uint8Array, data: Uint8Array}>} An object containing the randomly generated IV and the encrypted data as a Uint8Array.
 */
async function encrypt(key, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );
    return { iv, data: new Uint8Array(encryptedData) };
}

/**
 * Decrypts data using AES-GCM algorithm.
 *
 * @async
 * @param {CryptoKey} key - The AES-GCM decryption key.
 * @param {Uint8Array} iv - The initialization vector for AES-GCM.
 * @param {ArrayBuffer|Uint8Array} data - The encrypted data to decrypt.
 * @returns {Promise<ArrayBuffer>} The decrypted data as an ArrayBuffer.
 */
async function decrypt(key, iv, data) {
    return await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        key,
        data
    );
}

function openIDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('db', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadKeyFromIDB(name) {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction('keys', 'readonly');
        const store = tx.objectStore('keys');
        const req = store.get(name);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveKeyToIDB(name, data) {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const req = store.put(data, name);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function removeAllKeysFromIDB() {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
        const tx = db.transaction('keys', 'readwrite');
        const store = tx.objectStore('keys');
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}

async function wipeCache() {
    await removeAllKeysFromIDB();
}

function treeNodeExists(nodeId) {
    let deleted = false;
    while (nodeId !== 'root') {
        if (!tree[nodeId] || tree[nodeId].parent === 'deleted') {
            deleted = true;
            break;
        }
        nodeId = tree[nodeId].parent;
    }
    return !deleted;
}

function resolveCurrentPath() {
    const { segments, params, hash } = utils.pathCurrent();
    if (segments.length === 2 && segments[0] === 'folder' && treeNodeExists(segments[1])) {
        stack.replace(pages.folder('', segments[1]));
    }
    else if (segments.length === 2 && segments[0] === 'note' && treeNodeExists(segments[1])) {
        stack.replace(pages.note('', segments[1]));
    } else {
        stack.replace({ path: '/', ...pages.folder('', 'root') });
    }
}

export async function init() {
    firebase.app = initializeFirebase(firebaseConfig);
    firebase.auth = getAuth(firebase.app);
    firebase.firestore = initializeFirestore(firebase.app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        cacheSize: CACHE_SIZE_UNLIMITED
    });
    firebase.storage = getStorage(firebase.app);
    // firebase.analytics = getAnalytics(firebase.app);

    startApp('XPL');
    startViewportSizeController();
    startThemeController(function () {
        updateMetaTags({
            'theme-color': colors.background.panel()
        });
        updateBodyStyle({
            backgroundColor: colors.background.body(),
            color: colors.foreground.primary(),
        });
    });
    updateMetaTags({
        // 'theme-color': colors.background.panel()
    });
    updateBodyStyle({
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        // backgroundColor: colors.background.body(),
        // color: colors.foreground.primary(),
    });
    await utils.loadFont({
        fontFamily: 'material',
        url: materialFontUrl,
        format: 'woff2',
        params: {
            fontWeight: 400
        }
    })

    stack.push(pages.panels());
    // stack.push(pages.init());
    // key = await loadKeyFromIDB('main');
    // onAuthStateChanged(firebase.auth, async (user) => {
    //     if (user) {
    //         startListenNotebook();
    //     } else {
    //         if (authInitialized) {
    //             await wipeCache();
    //             window.location.reload();
    //         }
    //         else {
    //             stack.replace(pages.login('/'));
    //         }
    //     }
    //     authInitialized = true;
    // });
}

function startListenNotebook() {
    onSnapshot(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid),
        async (documentSnapshot) => {
            if (documentSnapshot.exists()) {
                notebook = documentSnapshot.data();
                if (notebook.status === 'deleted') {
                    if (notebookInitialized) {
                        await wipeCache();
                        window.location.reload();
                    }
                    else {
                        stack.replace(pages.notebookDeleted('/'));
                    }
                } else if (!key) {
                    stack.replace(pages.keyphrase('/'));
                } else if (notebook.status === 'active' && key) {
                    try {
                        tree = {};
                        for (const id in notebook.tree) {
                            tree[id] = {
                                type: notebook.tree[id].type,
                                parent: notebook.tree[id].parent,
                                order: notebook.tree[id].order,
                                name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array()))
                            };
                        }
                        stack.updateAll({
                            type: 'tree'
                        });
                        if (!notebookInitialized) {
                            resolveCurrentPath();
                            notebookInitialized = true;
                        }
                    } catch (e) {
                        await wipeCache();
                        window.location.reload();
                    }
                }
            } else {
                if (notebookInitialized) {
                    await wipeCache();
                    window.location.reload();
                }
                else {
                    stack.replace(pages.setup('/'));
                }
            }
        });
}

const colors = {
    ...baseColors_
}

const styles = {
    ...baseStyles
}

const handlers = {
    ...baseHandlers
}

const layouts = {
    ...baseLayouts
}

const components = {
    ...baseComponents
}

const pages = {
    ...basePages,
    login(path = '') {
        let loggingIn = false;
        return {
            path,
            meta: {
                title: `Login | ${appName}`,
                description: 'Login page.'
            },
            config: () => ({
                id: 'page',
                width: '100%',
                height: '100%',
                padding: '1rem',
                ...layouts.column('center', 'center'),
                children: [
                    () => components.blockers.loading({
                        toggled: loggingIn
                    }),
                    components.button({
                        padding: '0.75rem',
                        backgroundHoverColor: colors.background.overlay.s(),
                        onclick: function (event) {
                            try {
                                loggingIn = true;
                                this.layer.widgets['blocker-loading'].update();
                                signInWithPopup(firebase.auth, new GoogleAuthProvider());
                            } catch (e) {
                                loggingIn = false;
                                this.layer.widgets['blocker-loading'].update();
                            }
                        },
                        child: {
                            ...layouts.row('center', 'center', '0.5rem'),
                            children: [
                                {
                                    html: '<svg viewBox="0 0 48 48"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path> <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path> <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path> <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path> <path fill="none" d="M0 0h48v48H0z"></path></svg>',
                                    width: '1.25rem',
                                    height: '1.25rem',
                                },
                                {
                                    text: 'Login with Google',
                                }
                            ]
                        }
                    }),
                ]
            }),
        };
    },
    notebookDeleted(path = '') {
        return {
            path,
            meta: {
                title: `Notebook Deleted | ${appName}`,
                description: 'Notebook deleted.'
            },
            config: () => ({
                width: '100%',
                height: '100%',
                padding: '1rem',
                ...layouts.column('center', 'center', '1rem'),
                children: [
                    {
                        text: 'Your notebook will be permanently deleted within 30 days. You\'ll be able to create a new one afterward.'
                    },
                    {
                        width: '100%',
                        ...layouts.row('center'),
                        children: [
                            components.buttons.formSecondary({
                                text: 'Log out',
                                onclick: function (event) {
                                    signOut(firebase.auth);
                                }
                            })
                        ]
                    }

                ]
            }),
        };
    },
    setup(path = '') {
        let pageLayer;
        let error;
        let keyBuilding = false;
        let keyphraseValid = true;
        let keyphraseRepeatValid = true;
        return {
            path,
            meta: {
                title: `Setup | ${appName}`,
                description: 'Setup page.'
            },
            onPush: function () {
                pageLayer = this;
            },
            config: () => ({
                id: 'page',
                padding: '0.5rem 0',
                ...layouts.base('center', 'center'),
                children: [
                    () => components.blockers.error({
                        error
                    }),
                    () => components.blockers.loading({
                        toggled: keyBuilding,
                        text: 'Building the encryption key... This may take over a minute on older devices.'
                    }),
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '0.75rem',
                        border: `1px solid ${colors.border.m()}`,
                        borderRadius: '0.5rem',
                        ...layouts.column('center', 'start', '2rem'),
                        children: [
                            {
                                fontSize: '2rem',
                                fontWeight: 600,
                                text: 'Keyphrase'
                            },
                            {
                                ...layouts.column('start', 'start', '1rem'),
                                children: [
                                    {
                                        text: 'Your data is encrypted with a keyphrase using end-to-end encryption. Only you can decrypt it.'
                                    },
                                    {
                                        text: 'Store your keyphrase securely — if it\'s lost, you won\'t be able to recover your data.'
                                    },
                                    {
                                        text: 'Don\'t use easy-to-guess combinations like \'password\', \'12345\' and so on.'
                                    },
                                    {
                                        text: 'Passwords shorter than 20 characters may become crackable in 50 years.'
                                    },
                                ]
                            },
                            {
                                width: '100%',
                                ...layouts.column('start', 'start', '1rem'),
                                children: [
                                    {
                                        width: '100%',
                                        ...layouts.column('start', 'start', '0.5rem'),
                                        children: [
                                            {
                                                fontWeight: 600,
                                                text: 'Your keyphrase'
                                            },
                                            () => ({
                                                id: 'keyphrase-hint',
                                                display: keyphraseValid ? 'none' : 'block',
                                                fontWeight: 500,
                                                color: radixColor(baseColors.danger, 11),
                                                text: 'Required',
                                            }),
                                            components.inputs.password({
                                                id: 'keyphrase-input',
                                                maxlength: 64
                                            })
                                        ]
                                    },
                                    {
                                        width: '100%',
                                        ...layouts.column('start', 'start', '0.5rem'),
                                        children: [
                                            {
                                                fontWeight: 600,
                                                text: 'Repeat keyphrase'
                                            },
                                            () => ({
                                                id: 'keyphrase-repeat-hint',
                                                display: keyphraseRepeatValid ? 'none' : 'block',
                                                fontWeight: 500,
                                                color: radixColor(baseColors.danger, 11),
                                                text: 'Invalid',
                                            }),
                                            components.inputs.password({
                                                id: 'keyphrase-repeat-input',
                                                maxlength: 64
                                            })
                                        ]
                                    },
                                ]
                            },
                            {
                                width: '100%',
                                ...layouts.row('end', 'center', '1rem'),
                                children: [
                                    components.buttons.formSecondary({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.buttons.formPrimary({
                                        text: 'Save',
                                        onclick: async function (event) {
                                            keyphraseValid = true;
                                            keyphraseRepeatValid = true;
                                            if (!this.layer.widgets['keyphrase-input'].domElement.value) {
                                                keyphraseValid = false;
                                            }
                                            else if (!this.layer.widgets['keyphrase-repeat-input'].domElement.value || this.layer.widgets['keyphrase-input'].domElement.value != this.layer.widgets['keyphrase-repeat-input'].domElement.value) {
                                                keyphraseRepeatValid = false;
                                            }
                                            this.layer.widgets['keyphrase-hint'].update();
                                            this.layer.widgets['keyphrase-repeat-hint'].update();
                                            if (!keyphraseValid || !keyphraseRepeatValid) {
                                                return;
                                            }
                                            const salt = window.crypto.getRandomValues(new Uint8Array(32));
                                            keyBuilding = true;
                                            pageLayer.widgets['blocker-loading'].update();
                                            const worker = new Argon2Worker();
                                            worker.onmessage = async (event) => {
                                                if (event.data.success) {
                                                    try {
                                                        key = await hashToKey(event.data.hash);
                                                        await saveKeyToIDB('main', key);
                                                        const keytestEncrypted = await encrypt(key, window.crypto.getRandomValues(new Uint8Array(32)));
                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                        await runTransaction(firebase.firestore, async (transaction) => {
                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                            if (notebookDoc.exists()) {
                                                                throw "Notebook already exists";
                                                            }
                                                            else {
                                                                transaction.set(notebookDocRef, {
                                                                    timestamp: serverTimestamp(),
                                                                    status: 'active',
                                                                    salt,
                                                                    keytest: { iv: Bytes.fromUint8Array(keytestEncrypted.iv), data: Bytes.fromUint8Array(keytestEncrypted.data) },
                                                                    tree: {}
                                                                });
                                                            }
                                                        });
                                                    } catch (e) {
                                                        if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                            error = 'network';
                                                            pageLayer.widgets['blocker-error'].update();
                                                        } else {
                                                            console.error(e);
                                                            error = true;
                                                            pageLayer.widgets['blocker-error'].update();
                                                        }
                                                    }
                                                } else {
                                                    console.error(event.data.error);
                                                    error = true;
                                                    pageLayer.widgets['blocker-error'].update();
                                                }
                                            };
                                            worker.postMessage({
                                                password: this.layer.widgets['keyphrase-input'].domElement.value,
                                                salt: salt,
                                            });
                                        }
                                    }),
                                ]
                            }
                        ]
                    }
                ]
            }),
        };
    },
    keyphrase(path = '') {
        let pageLayer;
        let error;
        let keyBuilding = false;
        let keyphraseValid = true;
        return {
            path,
            meta: {
                title: `Keyphrase | ${appName}`,
                description: 'Keyphrase page.'
            },
            onPush: function () {
                pageLayer = this;
            },
            config: () => ({
                id: 'page',
                padding: '0.5rem 0',
                ...layouts.base('center', 'center'),
                children: [
                    () => components.blockers.error({
                        error
                    }),
                    () => components.blockers.loading({
                        toggled: keyBuilding,
                        text: 'Building the encryption key... This may take over a minute on older devices.'
                    }),
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '0.75rem',
                        border: `1px solid ${colors.border.m()}`,
                        borderRadius: '0.5rem',
                        ...layouts.column('center', 'start', '2rem'),
                        children: [
                            {
                                fontSize: '2rem',
                                fontWeight: 600,
                                text: 'Keyphrase'
                            },
                            {
                                ...layouts.column('start', 'start', '0.5rem'),
                                width: '100%',
                                children: [
                                    {
                                        fontWeight: 600,
                                        text: 'Your keyphrase'
                                    },
                                    () => ({
                                        id: 'keyphrase-hint',
                                        display: keyphraseValid ? 'none' : 'block',
                                        fontWeight: 500,
                                        color: radixColor(baseColors.danger, 11),
                                        text: 'Invalid'
                                    }),
                                    components.inputs.password({
                                        id: 'keyphrase-input',
                                        maxlength: 64
                                    }),
                                ]
                            },
                            {
                                width: '100%',
                                ...layouts.row('end', 'center', '1rem'),
                                children: [
                                    components.buttons.formSecondary({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.buttons.formPrimary({
                                        text: 'Save',
                                        onclick: async function (event) {
                                            keyBuilding = true;
                                            pageLayer.widgets['blocker-loading'].update();
                                            const worker = new Argon2Worker();
                                            worker.onmessage = async (event) => {
                                                if (event.data.success) {
                                                    try {
                                                        key = await hashToKey(event.data.hash);
                                                        await decrypt(key, notebook.keytest.iv.toUint8Array(), notebook.keytest.data.toUint8Array());
                                                        await saveKeyToIDB('main', key);
                                                        tree = {};
                                                        for (const id in notebook.tree) {
                                                            tree[id] = {
                                                                type: notebook.tree[id].type,
                                                                parent: notebook.tree[id].parent,
                                                                order: notebook.tree[id].order,
                                                                name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array()))
                                                            };
                                                        }
                                                        if (stack.at(-1) === pageLayer) {
                                                            resolveCurrentPath();
                                                            notebookInitialized = true;
                                                        }
                                                    } catch (e) {
                                                        keyphraseValid = false;
                                                        keyBuilding = false;
                                                        pageLayer.widgets['page'].update();
                                                    }
                                                } else {
                                                    console.error(event.data.error);
                                                    error = true;
                                                    pageLayer.widgets['blocker-error'].update();
                                                }
                                            };
                                            worker.postMessage({
                                                password: this.layer.widgets['keyphrase-input'].domElement.value,
                                                salt: notebook.salt.toUint8Array(),
                                            });
                                        }
                                    })
                                ]
                            }
                        ]
                    }
                ]
            }),
        };
    },
    folder(path = '', folderId) {
        function generateTreeId() {
            while (true) {
                const id = randomString(8);
                if (!tree.hasOwnProperty(id)) {
                    return id;
                }
            }
        }

        let pageLayer;
        let error;
        let children = Object.keys(tree).filter(id => tree[id].parent === folderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
        let treeUpdating = false;
        return {
            path,
            meta: {
                title: `${folderId === 'root' ? 'Home' : tree[folderId].name} | ${appName}`,
                description: 'Folder page.'
            },
            onPush: function () {
                pageLayer = this;
            },
            update: function (message) {
                if (message.type === 'tree') {
                    if (!treeNodeExists(folderId)) {
                        error = 'outofsync';
                        this.widgets['blocker-error'].update();
                    } else {
                        children = Object.keys(tree).filter(id => tree[id].parent === folderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
                        this.widgets['blocker-loading'].update();
                        this.widgets['header'].update();
                        this.widgets['tree'].update();
                    }
                }
            },
            config: () => {
                return {
                    id: 'page',
                    ...layouts.base('start', 'center'),
                    children: [
                        () => components.blockers.error({
                            error
                        }),
                        () => components.blockers.loading({
                            toggled: treeUpdating
                        }),
                        () => components.header({
                            id: 'header',
                            leading: folderId === 'root' ? null : components.button({
                                backgroundHoverColor: colors.background.overlay.m(),
                                href: '/',
                                child: components.icon({
                                    ligature: 'home'
                                }),
                                onclick: function (event) {
                                    stack.push(pages.folder('/', 'root'));
                                }
                            }),
                            title: folderId === 'root' ? 'Home' : tree[folderId].name,
                        }),
                        () => {
                            return ({
                                id: 'tree',
                                flexGrow: 1,
                                width: 'min(640px, 100% - 1rem)',
                                padding: '1rem 0',
                                ...layouts.column('center', 'center', '1rem'),
                                children: children.map(cid => components.buttons.menu({
                                    size: 'l',
                                    text: tree[cid]['name'],
                                    onclick: function (event) {
                                        if (tree[cid].type === 'folder') {
                                            stack.push(pages.folder(`/folder/${cid}`, cid));
                                        } else if (tree[cid].type === 'note') {
                                            stack.push(pages.note(`/note/${cid}`, cid));
                                        }
                                    },
                                    oncontextmenu: function (event) {
                                        const notebookTimestamp = notebook.timestamp.toMillis();
                                        stack.push({
                                            path: '#menu',
                                            hidePrior: false,
                                            config: () => components.modals.menu({
                                                buttons: [
                                                    tree[cid].order > 0 ? components.buttons.menu({
                                                        text: 'Move Up',
                                                        onclick: async function (event) {
                                                            await stack.pop();
                                                            treeUpdating = true;
                                                            pageLayer.widgets['blocker-loading'].update();
                                                            const neighborId = children[children.indexOf(cid) - 1];
                                                            try {
                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                        transaction.update(notebookDocRef, {
                                                                            timestamp: serverTimestamp(),
                                                                            [`tree.${cid}.order`]: increment(-1),
                                                                            [`tree.${neighborId}.order`]: increment(1),
                                                                        });
                                                                    }
                                                                    else {
                                                                        error = 'outofsync';
                                                                        pageLayer.widgets['blocker-error'].update();
                                                                    }
                                                                });
                                                                treeUpdating = false;
                                                            } catch (e) {
                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                    error = 'network';
                                                                    pageLayer.widgets['blocker-error'].update();
                                                                } else {
                                                                    console.error(e);
                                                                    error = true;
                                                                    pageLayer.widgets['blocker-error'].update();
                                                                }
                                                            }
                                                        }
                                                    }) : null,
                                                    tree[cid].order < children.length - 1 ? components.buttons.menu({
                                                        text: 'Move Down',
                                                        onclick: async function (event) {
                                                            await stack.pop();
                                                            treeUpdating = true;
                                                            pageLayer.widgets['blocker-loading'].update();
                                                            const neighborId = children[children.indexOf(cid) + 1];
                                                            try {
                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                        transaction.update(notebookDocRef, {
                                                                            timestamp: serverTimestamp(),
                                                                            [`tree.${cid}.order`]: increment(1),
                                                                            [`tree.${neighborId}.order`]: increment(-1),
                                                                        });
                                                                    }
                                                                    else {
                                                                        error = 'outofsync';
                                                                        pageLayer.widgets['blocker-error'].update();
                                                                    }
                                                                });
                                                                treeUpdating = false;
                                                            } catch (e) {
                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                    error = 'network';
                                                                    pageLayer.widgets['blocker-error'].update();
                                                                } else {
                                                                    console.error(e);
                                                                    error = true;
                                                                    pageLayer.widgets['blocker-error'].update();
                                                                }
                                                            }
                                                        }
                                                    }) : null,
                                                    components.buttons.menu({
                                                        text: 'Move to Folder',
                                                        onclick: function (event) {
                                                            function moveToFolderPage(targetFolderId) {
                                                                return {
                                                                    path: `#moveto-${targetFolderId}`,
                                                                    config: () => {
                                                                        const children = Object.keys(tree).filter(id => tree[id].type === 'folder' && tree[id].parent === targetFolderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
                                                                        return {
                                                                            ...layouts.base('start', 'center'),
                                                                            children: [
                                                                                components.header({
                                                                                    title: `Move to ${targetFolderId === 'root' ? 'Home' : tree[targetFolderId].name}`,
                                                                                    trailing: components.buttons.formPrimary({
                                                                                        smallViewportGrow: false,
                                                                                        text: 'Move',
                                                                                        onclick: async function (event) {
                                                                                            let steps = 0;
                                                                                            for (let i = stack.length - 1; i > 0; i--) {
                                                                                                if (stack.at(i) === pageLayer) {
                                                                                                    break;
                                                                                                }
                                                                                                steps += 1;
                                                                                            }
                                                                                            await stack.pop(steps);
                                                                                            treeUpdating = true;
                                                                                            pageLayer.widgets['blocker-loading'].update();
                                                                                            try {
                                                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                        transaction.update(notebookDocRef, {
                                                                                                            timestamp: serverTimestamp(),
                                                                                                            [`tree.${cid}.parent`]: targetFolderId,
                                                                                                            [`tree.${cid}.order`]: Object.keys(tree).filter(id => tree[id].parent === targetFolderId).length,
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        error = 'outofsync';
                                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                                    }
                                                                                                });
                                                                                                treeUpdating = false;
                                                                                            } catch (e) {
                                                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                                    error = 'network';
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                } else {
                                                                                                    console.error(e);
                                                                                                    error = true;
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                }),
                                                                                {
                                                                                    flexGrow: 1,
                                                                                    width: 'min(640px, 100% - 1rem)',
                                                                                    padding: '1rem 0',
                                                                                    ...layouts.column('center', 'center', '1rem'),
                                                                                    children: children.map(cid => components.buttons.menu({
                                                                                        size: 'l',
                                                                                        text: tree[cid]['name'],
                                                                                        onclick: function (event) {
                                                                                            stack.push(moveToFolderPage(cid));
                                                                                        },
                                                                                    }))
                                                                                }
                                                                            ]
                                                                        };
                                                                    }
                                                                };
                                                            }
                                                            stack.replace(moveToFolderPage('root'));
                                                        }
                                                    }),
                                                    components.buttons.menu({
                                                        text: 'Rename',
                                                        onclick: async function (event) {
                                                            let nameValid = true;
                                                            stack.replace({
                                                                path: '#rename',
                                                                hidePrior: false,
                                                                config: () => components.modalCloseBackground({
                                                                    backgroundColor: colors.background.overlay.s(),
                                                                    child: {
                                                                        ...styles.modal(),
                                                                        ...layouts.column('start', 'start', '1rem'),
                                                                        children: [
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.column('start', 'start', '0.5rem'),
                                                                                children: [{
                                                                                    fontWeight: 600,
                                                                                    text: 'New Name'
                                                                                },
                                                                                () => ({
                                                                                    id: 'new-folder-name-hint',
                                                                                    display: nameValid ? 'none' : 'block',
                                                                                    fontWeight: 500,
                                                                                    color: radixColor(baseColors.danger, 11),
                                                                                    text: 'Required'
                                                                                }),
                                                                                components.inputs.text({
                                                                                    id: 'new-folder-name-input',
                                                                                    maxlength: '64',
                                                                                    value: tree[cid].name,
                                                                                })]
                                                                            },
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.row('end'),
                                                                                children: [
                                                                                    components.buttons.formPrimary({
                                                                                        text: 'Rename',
                                                                                        onclick: async function (event) {
                                                                                            nameValid = true;
                                                                                            if (!this.layer.widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                                                nameValid = false;
                                                                                            }
                                                                                            this.layer.widgets['new-folder-name-hint'].update();
                                                                                            if (!nameValid) {
                                                                                                return;
                                                                                            }
                                                                                            const name = this.layer.widgets['new-folder-name-input'].domElement.value.trim();
                                                                                            await stack.pop();
                                                                                            treeUpdating = true;
                                                                                            pageLayer.widgets['blocker-loading'].update();
                                                                                            try {
                                                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                        const nameEncrypted = await encrypt(key, textEncoder.encode(name));
                                                                                                        transaction.update(notebookDocRef, {
                                                                                                            timestamp: serverTimestamp(),
                                                                                                            [`tree.${cid}.name`]: { iv: Bytes.fromUint8Array(nameEncrypted.iv), data: Bytes.fromUint8Array(nameEncrypted.data) },
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        error = 'outofsync';
                                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                                    }
                                                                                                });
                                                                                                treeUpdating = false;
                                                                                            } catch (e) {
                                                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                                    error = 'network';
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                } else {
                                                                                                    console.error(e);
                                                                                                    error = true;
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                ]
                                                                            },
                                                                        ]
                                                                    }
                                                                })
                                                            });
                                                        }
                                                    }),
                                                    components.buttons.menu({
                                                        palette: baseColors.danger,
                                                        text: 'Delete',
                                                        onclick: async function (event) {
                                                            stack.replace({
                                                                path: '#delete',
                                                                hidePrior: false,
                                                                config: () => components.modals.prompt({
                                                                    title: tree[cid].type === 'note' ? 'Delete note' : 'Delete folder',
                                                                    description: 'You won\'t be able to restore it.',
                                                                    note: 'Consider moving it to an \'Archive\' folder instead — create one if you don’t have it yet.',
                                                                    buttons: [
                                                                        components.buttons.formPrimary({
                                                                            palette: baseColors.danger,
                                                                            text: 'Delete',
                                                                            onclick: async function (event) {
                                                                                await stack.pop();
                                                                                treeUpdating = true;
                                                                                pageLayer.widgets['blocker-loading'].update();
                                                                                try {
                                                                                    const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                    await runTransaction(firebase.firestore, async (transaction) => {
                                                                                        const notebookDoc = await transaction.get(notebookDocRef);
                                                                                        if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                            transaction.update(notebookDocRef, {
                                                                                                timestamp: serverTimestamp(),
                                                                                                [`tree.${cid}.parent`]: 'deleted',
                                                                                            });
                                                                                        }
                                                                                        else {
                                                                                            error = 'outofsync';
                                                                                            pageLayer.widgets['blocker-error'].update();
                                                                                        }
                                                                                    });
                                                                                    treeUpdating = false;
                                                                                } catch (e) {
                                                                                    if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                        error = 'network';
                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                    } else {
                                                                                        console.error(e);
                                                                                        error = true;
                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                    }
                                                                                }
                                                                            }
                                                                        })
                                                                    ]
                                                                })
                                                            });
                                                        }
                                                    }),
                                                ]
                                            })
                                        });
                                    }
                                })
                                )
                            });
                        },
                        {
                            position: 'fixed',
                            bottom: '1rem',
                            left: '1rem',
                            zIndex: 10,
                            ...layouts.column('start', 'start', '1rem'),
                            children: [
                                components.button(
                                    {
                                        padding: '0.5rem',
                                        borderRadius: '2rem',
                                        backgroundColor: colors.background.overlay.m(),
                                        backgroundHoverColor: colors.background.overlay.l(),
                                        child: components.icon({
                                            fontSize: '2rem',
                                            ligature: 'menu'
                                        }),
                                        onclick: function (event) {
                                            const notebookTimestamp = notebook.timestamp.toMillis();
                                            stack.push({
                                                path: '#menu',
                                                hidePrior: false,
                                                config: () => components.modals.menu({
                                                    buttons: [
                                                        components.buttons.menu({
                                                            text: 'Theme',
                                                            onclick: function (event) {
                                                                stack.replace({
                                                                    path: '#theme',
                                                                    hidePrior: false,
                                                                    config: () => components.modalCloseBackground({
                                                                        backgroundColor: colors.background.overlay.s(),
                                                                        child: {
                                                                            ...styles.modal(),
                                                                            ...layouts.column('start', 'start', '1rem'),
                                                                            children: [
                                                                                {
                                                                                    fontWeight: 600,
                                                                                    text: 'Theme'
                                                                                },
                                                                                components.inputs.toggle({
                                                                                    id: 'theme-system',
                                                                                    value: window.localStorage.getItem('theme') === 'auto',
                                                                                    iconFalse: components.icon({
                                                                                        ligature: 'radio_button_unchecked'
                                                                                    }),
                                                                                    iconTrue: components.icon({
                                                                                        color: radixColor('blue', 9),
                                                                                        ligature: 'radio_button_checked'
                                                                                    }),
                                                                                    text: 'System',
                                                                                    onclick: function (event) {
                                                                                        window.document.dispatchEvent(new CustomEvent('switch-theme', {
                                                                                            detail: {
                                                                                                theme: 'auto'
                                                                                            }
                                                                                        }));
                                                                                    }
                                                                                }),
                                                                                components.inputs.toggle({
                                                                                    id: 'theme-light',
                                                                                    value: window.localStorage.getItem('theme') === 'light',
                                                                                    iconFalse: components.icon({
                                                                                        ligature: 'radio_button_unchecked'
                                                                                    }),
                                                                                    iconTrue: components.icon({
                                                                                        color: radixColor('blue', 9),
                                                                                        ligature: 'radio_button_checked'
                                                                                    }),
                                                                                    text: 'Light',
                                                                                    onclick: function (event) {
                                                                                        window.document.dispatchEvent(new CustomEvent('switch-theme', {
                                                                                            detail: {
                                                                                                theme: 'light'
                                                                                            }
                                                                                        }));
                                                                                    }
                                                                                }),
                                                                                components.inputs.toggle({
                                                                                    id: 'theme-dark',
                                                                                    value: window.localStorage.getItem('theme') === 'dark',
                                                                                    iconFalse: components.icon({
                                                                                        ligature: 'radio_button_unchecked'
                                                                                    }),
                                                                                    iconTrue: components.icon({
                                                                                        color: radixColor('blue', 9),
                                                                                        ligature: 'radio_button_checked'
                                                                                    }),
                                                                                    text: 'Dark',
                                                                                    onclick: function (event) {
                                                                                        window.document.dispatchEvent(new CustomEvent('switch-theme', {
                                                                                            detail: {
                                                                                                theme: 'dark'
                                                                                            }
                                                                                        }));
                                                                                    }
                                                                                }),
                                                                            ]
                                                                        }
                                                                    })
                                                                });
                                                            }
                                                        }),
                                                        components.buttons.menu({
                                                            palette: baseColors.danger,
                                                            text: 'Delete account',
                                                            onclick: function (event) {
                                                                stack.replace({
                                                                    path: '#delete',
                                                                    hidePrior: false,
                                                                    config: () => components.modals.prompt({
                                                                        title: 'Delete account',
                                                                        description: 'Are you sure?',
                                                                        note: 'Your account and all it\'s data will be permanently deleted in 30 days. Contact support before then to stop the process.',
                                                                        buttons: [
                                                                            components.buttons.formPrimary({
                                                                                palette: baseColors.danger,
                                                                                text: 'Delete',
                                                                                onclick: async function (event) {
                                                                                    await stack.pop();
                                                                                    treeUpdating = true;
                                                                                    pageLayer.widgets['blocker-loading'].update();
                                                                                    try {
                                                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                        await runTransaction(firebase.firestore, async (transaction) => {
                                                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                transaction.update(notebookDocRef, {
                                                                                                    timestamp: serverTimestamp(),
                                                                                                    status: 'deleted',
                                                                                                });
                                                                                            }
                                                                                            else {
                                                                                                error = 'outofsync';
                                                                                                pageLayer.widgets['blocker-error'].update();
                                                                                            }
                                                                                        });
                                                                                        treeUpdating = false;
                                                                                    } catch (e) {
                                                                                        if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                            error = 'network';
                                                                                            pageLayer.widgets['blocker-error'].update();
                                                                                        } else {
                                                                                            console.error(e);
                                                                                            error = true;
                                                                                            pageLayer.widgets['blocker-error'].update();
                                                                                        }
                                                                                    }
                                                                                }
                                                                            })
                                                                        ]
                                                                    })
                                                                });
                                                            }
                                                        }),
                                                        components.buttons.menu({
                                                            palette: baseColors.danger,
                                                            text: 'Log out',
                                                            onclick: function (event) {
                                                                signOut(firebase.auth);
                                                            }
                                                        }),
                                                    ]
                                                })
                                            });
                                        }
                                    }
                                ),
                            ]
                        },
                        {
                            position: 'fixed',
                            bottom: '1rem',
                            right: '1rem',
                            zIndex: 10,
                            ...layouts.column('start', 'start', '1rem'),
                            children: [
                                components.button({
                                    padding: '0.5rem',
                                    borderRadius: '2rem',
                                    backgroundColor: radixColor('blue', 3),
                                    backgroundHoverColor: radixColor('blue', 4),
                                    child: components.icon({
                                        fontSize: '2rem',
                                        color: radixColor('blue', 9),
                                        ligature: 'add_2'
                                    }),
                                    onclick: function (event) {
                                        const notebookTimestamp = notebook.timestamp.toMillis();
                                        stack.push({
                                            path: '#name',
                                            hidePrior: false,
                                            config: () => components.modals.menu({
                                                buttons: [
                                                    components.buttons.menu({
                                                        text: 'New Folder',
                                                        onclick: function (event) {
                                                            let nameValid = true;
                                                            stack.replace({
                                                                path: '#newfolder',
                                                                hidePrior: false,
                                                                config: () => components.modalCloseBackground({
                                                                    backgroundColor: colors.background.overlay.s(),
                                                                    child: {
                                                                        ...styles.modal(),
                                                                        ...layouts.column('start', 'start', '1rem'),
                                                                        children: [
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.column('start', 'start', '0.5rem'),
                                                                                children: [
                                                                                    {
                                                                                        fontWeight: 600,
                                                                                        text: 'Name'
                                                                                    },
                                                                                    () => ({
                                                                                        id: 'new-folder-name-hint',
                                                                                        display: nameValid ? 'none' : 'block',
                                                                                        fontWeight: 500,
                                                                                        color: radixColor(baseColors.danger, 11),
                                                                                        text: 'Required'
                                                                                    }),
                                                                                    components.inputs.text({
                                                                                        id: 'new-folder-name-input',
                                                                                        maxlength: '64'
                                                                                    }),
                                                                                ]
                                                                            },
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.row('end'),
                                                                                children: [
                                                                                    components.buttons.formPrimary({
                                                                                        text: 'Create',
                                                                                        onclick: async function (event) {
                                                                                            nameValid = true;
                                                                                            if (!this.layer.widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                                                nameValid = false;
                                                                                            }
                                                                                            this.layer.widgets['new-folder-name-hint'].update();
                                                                                            if (!nameValid) {
                                                                                                return;
                                                                                            }
                                                                                            const name = this.layer.widgets['new-folder-name-input'].domElement.value.trim();
                                                                                            await stack.pop();
                                                                                            treeUpdating = true;
                                                                                            pageLayer.widgets['blocker-loading'].update();
                                                                                            try {
                                                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                        const nameEncrypted = await encrypt(key, textEncoder.encode(name));
                                                                                                        transaction.update(notebookDocRef, {
                                                                                                            timestamp: serverTimestamp(),
                                                                                                            [`tree.${generateTreeId()}`]: { type: 'folder', parent: folderId, order: children.length, name: { iv: Bytes.fromUint8Array(nameEncrypted.iv), data: Bytes.fromUint8Array(nameEncrypted.data) } },
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        error = 'outofsync';
                                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                                    }
                                                                                                });
                                                                                                treeUpdating = false;
                                                                                            } catch (e) {
                                                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                                    error = 'network';
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                } else {
                                                                                                    console.error(e);
                                                                                                    error = true;
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                ]
                                                                            },
                                                                        ]
                                                                    }
                                                                })
                                                            });
                                                        }
                                                    }),
                                                    components.buttons.menu({
                                                        text: 'New Note',
                                                        onclick: function (event) {
                                                            let nameValid = true;
                                                            stack.replace({
                                                                path: '#newnote',
                                                                hidePrior: false,
                                                                config: () => components.modalCloseBackground({
                                                                    backgroundColor: colors.background.overlay.s(),
                                                                    child: {
                                                                        ...styles.modal(),
                                                                        ...layouts.column('start', 'start', '1rem'),
                                                                        children: [
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.column('start', 'start', '0.5rem'),
                                                                                children: [
                                                                                    {
                                                                                        fontWeight: 600,
                                                                                        text: 'Name'
                                                                                    },
                                                                                    () => ({
                                                                                        id: 'new-note-name-hint',
                                                                                        display: nameValid ? 'none' : 'block',
                                                                                        fontWeight: 500,
                                                                                        color: radixColor(baseColors.danger, 11),
                                                                                        text: 'Required'
                                                                                    }),
                                                                                    components.inputs.text({
                                                                                        id: 'new-note-name-input',
                                                                                        maxlength: '64'
                                                                                    }),
                                                                                ]
                                                                            },
                                                                            {
                                                                                width: '100%',
                                                                                ...layouts.row('end'),
                                                                                children: [
                                                                                    components.buttons.formPrimary({
                                                                                        text: 'Create',
                                                                                        onclick: async function (event) {
                                                                                            nameValid = true;
                                                                                            if (!this.layer.widgets['new-note-name-input'].domElement.value?.trim()) {
                                                                                                nameValid = false;
                                                                                            }
                                                                                            this.layer.widgets['new-note-name-hint'].update();
                                                                                            if (!nameValid) {
                                                                                                return;
                                                                                            }
                                                                                            const name = this.layer.widgets['new-note-name-input'].domElement.value.trim();
                                                                                            await stack.pop();
                                                                                            treeUpdating = true;
                                                                                            pageLayer.widgets['blocker-loading'].update();
                                                                                            try {
                                                                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                                await runTransaction(firebase.firestore, async (transaction) => {
                                                                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                                                                    if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                        const nameEncrypted = await encrypt(key, textEncoder.encode(name));
                                                                                                        transaction.update(notebookDocRef, {
                                                                                                            timestamp: serverTimestamp(),
                                                                                                            [`tree.${generateTreeId()}`]: { type: 'note', parent: folderId, order: children.length, name: { iv: Bytes.fromUint8Array(nameEncrypted.iv), data: Bytes.fromUint8Array(nameEncrypted.data) } },
                                                                                                        });
                                                                                                    }
                                                                                                    else {
                                                                                                        error = 'outofsync';
                                                                                                        pageLayer.widgets['blocker-error'].update();
                                                                                                    }
                                                                                                });
                                                                                                treeUpdating = false;
                                                                                            } catch (e) {
                                                                                                if (e.code === 'unavailable' || e.code === 'deadline-exceeded') {
                                                                                                    error = 'network';
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                } else {
                                                                                                    console.error(e);
                                                                                                    error = true;
                                                                                                    pageLayer.widgets['blocker-error'].update();
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                ]
                                                                            },
                                                                        ]
                                                                    }
                                                                })
                                                            });
                                                        }
                                                    })
                                                ]
                                            })
                                        });
                                    }
                                }),
                            ]
                        }
                    ]
                };
            },
        };
    },
    note(path = '', noteId) {
        let pageLayer;
        let error;
        const paragraphs = [];
        let stopListenParagraphs;
        let limitParagraphs = true;
        let filterParagraphQuery;
        let addParagraphValid = true;
        let filesAttached;
        let editParagraphId;
        let editParagraphHeight;
        let editParagraphValid;
        let editParagraphText;
        return {
            path,
            meta: {
                title: `${tree[noteId]['name']} | ${appName}`,
                description: 'Note page.'
            },
            onPush: function () {
                pageLayer = this;
                stopListenParagraphs = onSnapshot(query(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), where('notes', 'array-contains', noteId), orderBy('timestamp', 'desc')),
                    async (querySnapshot) => {
                        paragraphs.length = 0;
                        for (const docSnap of querySnapshot.docs) {
                            const docData = docSnap.data();
                            paragraphs.push({
                                id: docSnap.id,
                                timestamp: docData.timestamp,
                                notes: docData.notes,
                                color: docData.color,
                                text: textDecoder.decode(await decrypt(key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())),
                                files: docData.files ? await Promise.all(docData.files.map(async f => ({
                                    id: f.id,
                                    size: f.size,
                                    type: f.type,
                                    lastModified: f.lastModified,
                                    name: textDecoder.decode(await decrypt(key, f.name.iv.toUint8Array(), f.name.data.toUint8Array())),
                                    iv: f.iv.toUint8Array()
                                }))) : undefined
                            });
                        }
                        this.widgets['paragraphs'].update();
                    }
                );
            },
            onPop: function () {
                stopListenParagraphs();
            },
            update: function (message) {
                if (message.type === 'tree') {
                    if (!treeNodeExists(noteId)) {
                        error = 'outofsync';
                        this.widgets['blocker-error'].update();
                    }
                    else {
                        this.widgets['header'].update();
                    }
                }
                else if (message.type === 'upload' && message.noteId === noteId) {
                    this.widgets['uploads'].update();
                }
                else if (message.type === 'download') {
                    this.widgets[`file-actions-${message.fileId}`]?.update();
                }
            },
            config: () => ({
                id: 'page',
                ...layouts.base('start', 'center'),
                children: [
                    () => components.blockers.error({
                        error
                    }),
                    () => components.header({
                        id: 'header',
                        leading: components.button({
                            backgroundHoverColor: colors.background.overlay.m(),
                            href: '/',
                            child: components.icon({
                                ligature: 'home'
                            }),
                            onclick: function (event) {
                                stack.push(pages.folder('/', 'root'));
                            }
                        }),
                        title: tree[noteId].name
                    }),
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '1rem 0',
                        ...layouts.column('start', 'start', '1rem'),
                        children: [
                            () => ({
                                id: 'add-paragraph-hint',
                                display: addParagraphValid ? 'none' : 'block',
                                fontWeight: 500,
                                color: radixColor(baseColors.danger, 11),
                                text: 'Required'
                            }),
                            components.inputs.textArea({
                                id: 'add-paragraph-input',
                                height: '16rem',
                            }),
                            () => ({
                                id: 'files-attached',
                                width: '100%',
                                ...layouts.column('start', 'start', '0.5rem'),
                                display: filesAttached ? 'flex' : 'none',
                                children: filesAttached?.map(f => ({
                                    width: '100%',
                                    text: f.name
                                }))
                            }),
                            {
                                width: '100%',
                                ...layouts.row('end', 'center', '1rem'),
                                children: [
                                    {
                                        id: 'files-input',
                                        tag: 'input',
                                        display: 'none',
                                        type: 'file',
                                        multiple: true,
                                        onchange: function (event) {
                                            const filesSelected = [];
                                            let sizeTotal = 0;
                                            for (const file of event.target.files) {
                                                filesSelected.push(file);
                                                sizeTotal += file.size;
                                            }
                                            if (filesSelected.length > 8 || sizeTotal > 1073741824) {
                                                stack.push({
                                                    path: '#invalid',
                                                    hidePrior: false,
                                                    config: () => components.modals.prompt({
                                                        palette: baseColors.danger,
                                                        title: 'Invalid',
                                                        description: 'Maximum 8 files, 1GB total'
                                                    })
                                                });
                                            } else if (notebook.quotas?.storage?.used + sizeTotal > 10737418240) {
                                                stack.push({
                                                    path: '#invalid',
                                                    hidePrior: false,
                                                    config: () => components.modals.prompt({
                                                        palette: baseColors.danger,
                                                        title: 'Invalid',
                                                        description: '10 GB limit reached. Delete existing files to free up space.',
                                                        note: 'Limit update could take up to 24 hours.'
                                                    })
                                                });
                                            } else {
                                                filesAttached = filesSelected;
                                                this.layer.widgets['files-attached'].update();
                                                this.layer.widgets['attach_button'].update();
                                            }
                                        }
                                    },
                                    () => components.buttons.formSecondary({
                                        id: 'attach_button',
                                        ligature: filesAttached ? 'attach_file_off' : 'attach_file',
                                        text: filesAttached ? 'Detach' : 'Attach',
                                        onclick: function (event) {
                                            if (filesAttached) {
                                                filesAttached = undefined;
                                                this.layer.widgets['files-attached'].update();
                                                this.layer.widgets['attach_button'].update();
                                            } else {
                                                stack.push({
                                                    path: '#attach',
                                                    hidePrior: false,
                                                    config: () => components.modals.menu({
                                                        buttons: [
                                                            components.buttons.menu({
                                                                disabled: uploads[noteId],
                                                                text: 'Files',
                                                                onclick: async function (event) {
                                                                    await stack.pop();
                                                                    stack.at(-1).widgets['files-input'].domElement.click();
                                                                }
                                                            }),
                                                            components.buttons.menu({
                                                                text: 'Paragraph',
                                                                onclick: function (event) {
                                                                    function attachParagraphFolder(targetFolderId) {
                                                                        return {
                                                                            path: `#attach-${targetFolderId}`,
                                                                            config: () => {
                                                                                const children = Object.keys(tree).filter(id => id !== noteId && tree[id].parent === targetFolderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
                                                                                return {
                                                                                    ...layouts.base('start', 'center'),
                                                                                    children: [
                                                                                        components.header({
                                                                                            title: 'Attach Paragraph',
                                                                                        }),
                                                                                        {
                                                                                            flexGrow: 1,
                                                                                            width: 'min(640px, 100% - 1rem)',
                                                                                            padding: '1rem 0',
                                                                                            ...layouts.column('center', 'center', '1rem'),
                                                                                            children: children.map(cid => components.buttons.menu({
                                                                                                size: 'l',
                                                                                                text: tree[cid]['name'],
                                                                                                onclick: function (event) {
                                                                                                    if (tree[cid].type === 'folder') {
                                                                                                        stack.push(attachParagraphFolder(cid));
                                                                                                    } else {
                                                                                                        stack.push(attachParagraphNote(cid));
                                                                                                    }
                                                                                                },
                                                                                            }))
                                                                                        }
                                                                                    ]
                                                                                };
                                                                            }
                                                                        };
                                                                    }
                                                                    function attachParagraphNote(targetNoteId) {
                                                                        const paragraphs = [];
                                                                        let filterParagraphQuery;
                                                                        let stopListenParagraphs;
                                                                        return {
                                                                            path: `#attach-${targetNoteId}`,
                                                                            onPush: function () {
                                                                                stopListenParagraphs = onSnapshot(query(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), where('notes', 'array-contains', targetNoteId), orderBy('timestamp', 'desc')),
                                                                                    async (querySnapshot) => {
                                                                                        paragraphs.length = 0;
                                                                                        for (const docSnap of querySnapshot.docs) {
                                                                                            const docData = docSnap.data();
                                                                                            if (!docData.notes.includes(noteId)) {
                                                                                                paragraphs.push({
                                                                                                    id: docSnap.id,
                                                                                                    timestamp: docData.timestamp,
                                                                                                    notes: docData.notes,
                                                                                                    color: docData.color,
                                                                                                    text: textDecoder.decode(await decrypt(key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())),
                                                                                                    files: docData.files ? await Promise.all(docData.files.map(async (f) => ({
                                                                                                        id: f.id,
                                                                                                        size: f.size,
                                                                                                        type: f.type,
                                                                                                        lastModified: f.lastModified,
                                                                                                        name: textDecoder.decode(await decrypt(key, f.name.iv.toUint8Array(), f.name.data.toUint8Array())),
                                                                                                        iv: f.iv.toUint8Array()
                                                                                                    }))) : undefined
                                                                                                });
                                                                                            }
                                                                                        }
                                                                                        this.widgets['paragraphs'].update();
                                                                                    }
                                                                                );
                                                                            },
                                                                            onPop: function () {
                                                                                stopListenParagraphs();
                                                                            },
                                                                            config: () => {
                                                                                return {
                                                                                    ...layouts.base('start', 'center'),
                                                                                    children: [
                                                                                        components.header({
                                                                                            title: tree[targetNoteId].name,
                                                                                        }),
                                                                                        {
                                                                                            width: 'min(640px, 100% - 1rem)',
                                                                                            padding: '1rem 0',
                                                                                            ...layouts.column('start', 'start', '1rem'),
                                                                                            children: [
                                                                                                () => ({
                                                                                                    id: 'filter-paragraphs',
                                                                                                    width: '100%',
                                                                                                    padding: '0 0.25rem 0 0.5rem',
                                                                                                    border: `1px solid ${colors.border.s()}`,
                                                                                                    borderRadius: '0.5rem',
                                                                                                    ...layouts.row('start', 'center'),
                                                                                                    children: [
                                                                                                        components.icon({
                                                                                                            ligature: 'search'
                                                                                                        }),
                                                                                                        {
                                                                                                            tag: 'input',
                                                                                                            flexGrow: 1,
                                                                                                            ...styles.input(),
                                                                                                            border: 'none',
                                                                                                            type: 'text',
                                                                                                            value: filterParagraphQuery,
                                                                                                            oninput: function (event) {
                                                                                                                filterParagraphQuery = event.target.value;
                                                                                                                this.layer.widgets['paragraphs'].update();
                                                                                                            },
                                                                                                        },
                                                                                                        components.button({
                                                                                                            backgroundHoverColor: colors.background.overlay.m(),
                                                                                                            padding: '0.25rem',
                                                                                                            child: components.icon({
                                                                                                                ligature: 'close'
                                                                                                            }),
                                                                                                            onclick: function (event) {
                                                                                                                filterParagraphQuery = undefined;
                                                                                                                this.layer.widgets['filter-paragraphs'].update();
                                                                                                                this.layer.widgets['paragraphs'].update();
                                                                                                            }
                                                                                                        }),
                                                                                                    ]
                                                                                                }),
                                                                                                () => {
                                                                                                    return ({
                                                                                                        id: 'paragraphs',
                                                                                                        width: '100%',
                                                                                                        ...layouts.column('start', 'start', '1rem'),
                                                                                                        children: paragraphs.filter(p => {
                                                                                                            if (!filterParagraphQuery) {
                                                                                                                return true;
                                                                                                            }
                                                                                                            if (p.text?.toLowerCase().includes(filterParagraphQuery.toLowerCase())) {
                                                                                                                return true;
                                                                                                            }
                                                                                                            for (const file of p.files || []) {
                                                                                                                if (file.name.toLowerCase().includes(filterParagraphQuery.toLowerCase())) {
                                                                                                                    return true;
                                                                                                                }
                                                                                                            }
                                                                                                            return false;
                                                                                                        }).map((paragraph, index) => ({
                                                                                                            id: `paragraph-${paragraph.id}`,
                                                                                                            width: '100%',
                                                                                                            padding: '0.5rem',
                                                                                                            border: `1px solid ${paragraph.color ? radixColor(paragraph.color, 6, true) : colors.border.s()}`,
                                                                                                            borderRadius: '0.5rem',
                                                                                                            backgroundColor: paragraph.color ? radixColor(paragraph.color, 3) : colors.background.body(),
                                                                                                            color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.primary(),
                                                                                                            ...styles.unselectable(),
                                                                                                            cursor: 'pointer',
                                                                                                            ...handlers.hover({
                                                                                                                outline: `2px solid ${paragraph.color ? radixColor(paragraph.color, 8, true) : colors.border.l()}`,
                                                                                                            }),
                                                                                                            ...handlers.button(function (event) {
                                                                                                                stack.push({
                                                                                                                    path: '#confirm',
                                                                                                                    hidePrior: false,
                                                                                                                    config: () => components.modals.prompt({
                                                                                                                        title: 'Attach Paragraph',
                                                                                                                        description: 'Are you sure?',
                                                                                                                        buttons: [
                                                                                                                            components.buttons.formPrimary({
                                                                                                                                text: 'Attach',
                                                                                                                                onclick: async function (event) {
                                                                                                                                    let steps = 0;
                                                                                                                                    for (let i = stack.length - 1; i > 0; i--) {
                                                                                                                                        if (stack.at(i) === pageLayer) {
                                                                                                                                            break;
                                                                                                                                        }
                                                                                                                                        steps += 1;
                                                                                                                                    }
                                                                                                                                    await stack.pop(steps);
                                                                                                                                    updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                                                                        notes: arrayUnion(noteId),
                                                                                                                                    });
                                                                                                                                }
                                                                                                                            })
                                                                                                                        ]
                                                                                                                    })
                                                                                                                });
                                                                                                            }),
                                                                                                            ...layouts.column('start', 'start', '1rem'),
                                                                                                            children: [
                                                                                                                paragraph.text ? {
                                                                                                                    width: '100%',
                                                                                                                    whiteSpace: 'pre-wrap',
                                                                                                                    wordBreak: 'break-word',
                                                                                                                    text: paragraph.text
                                                                                                                } : null,
                                                                                                                paragraph.files ? {
                                                                                                                    width: '100%',
                                                                                                                    ...layouts.column('start', 'start', '0.5rem'),
                                                                                                                    children: paragraph.files.map(f => ({
                                                                                                                        width: '100%',
                                                                                                                        padding: '0.5rem',
                                                                                                                        borderRadius: '0.5rem',
                                                                                                                        backgroundColor: paragraph.color ? radixColor(paragraph.color, 2, true) : colors.background.overlay.s(),
                                                                                                                        fontWeight: 600,
                                                                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                                                                        ...styles.unselectable(),
                                                                                                                        whiteSpace: 'nowrap',
                                                                                                                        overflow: 'hidden',
                                                                                                                        textOverflow: 'ellipsis',
                                                                                                                        text: f.name
                                                                                                                    }))
                                                                                                                } : null,
                                                                                                                {
                                                                                                                    width: '100%',
                                                                                                                    ...layouts.row('space-between', 'center', '1rem'),
                                                                                                                    children: [
                                                                                                                        {
                                                                                                                            fontSize: '0.875rem',
                                                                                                                            color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                                                                            ...styles.unselectable(),
                                                                                                                            text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                                                                                        },
                                                                                                                        {
                                                                                                                            ...layouts.row(),
                                                                                                                            children: null
                                                                                                                        }
                                                                                                                    ]
                                                                                                                }
                                                                                                            ]
                                                                                                        }))
                                                                                                    });
                                                                                                }
                                                                                            ]
                                                                                        }
                                                                                    ]
                                                                                };
                                                                            }
                                                                        };
                                                                    }
                                                                    stack.replace(attachParagraphFolder('root'));
                                                                }
                                                            }),
                                                        ]
                                                    })
                                                });
                                            }
                                        }
                                    }),
                                    components.buttons.formPrimary({
                                        text: 'Add',
                                        onclick: async function (event) {
                                            addParagraphValid = true;
                                            if (!this.layer.widgets['add-paragraph-input'].domElement.value.trim()) {
                                                addParagraphValid = false;
                                            }
                                            this.layer.widgets['add-paragraph-hint'].update();
                                            if (!addParagraphValid) {
                                                return;
                                            }
                                            const text = this.layer.widgets['add-paragraph-input'].domElement.value;
                                            this.layer.widgets['add-paragraph-input'].domElement.value = '';
                                            if (filesAttached) {
                                                uploads[noteId] = [];
                                                for (const file of filesAttached) {
                                                    uploads[noteId].push({
                                                        id: crypto.randomUUID(),
                                                        file,
                                                        completed: 0
                                                    });
                                                }
                                                filesAttached = undefined;
                                                this.layer.widgets['files-attached'].update();
                                                this.layer.widgets['attach_button'].update();
                                                stack.updateAll({
                                                    type: 'upload',
                                                    noteId
                                                });
                                                try {
                                                    await Promise.all(uploads[noteId].map(fu => new Promise(async (resolve, reject) => {
                                                        const fileEncrypted = await encrypt(key, await fu.file.arrayBuffer());
                                                        fu.iv = fileEncrypted.iv;
                                                        const uploadTask = uploadBytesResumable(
                                                            ref(firebase.storage, `users/${firebase.auth.currentUser.uid}/files/${fu.id}.encrypted`),
                                                            fileEncrypted.data,
                                                            {
                                                                cacheControl: 'private, max-age=31536000, immutable'
                                                            }
                                                        );
                                                        uploadTask.on(
                                                            "state_changed",
                                                            (snapshot) => {
                                                                fu.completed = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                                                                stack.updateAll({
                                                                    type: 'upload',
                                                                    noteId
                                                                });
                                                            },
                                                            (error) => {
                                                                reject(error);
                                                            },
                                                            async () => {
                                                                resolve();
                                                            }
                                                        );
                                                    })));
                                                    const files = [];
                                                    for (const fu of uploads[noteId]) {
                                                        const fileNameEncrypted = await encrypt(key, textEncoder.encode(fu.file.name));
                                                        files.push({
                                                            id: fu.id,
                                                            size: fu.file.size,
                                                            type: fu.file.type,
                                                            lastModified: fu.file.lastModified,
                                                            name: { iv: Bytes.fromUint8Array(fileNameEncrypted.iv), data: Bytes.fromUint8Array(fileNameEncrypted.data) },
                                                            iv: Bytes.fromUint8Array(fu.iv),
                                                        });
                                                    }
                                                    const textEncrypted = await encrypt(key, textEncoder.encode(text));
                                                    addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                        timestamp: Math.floor(Date.now() / 1000),
                                                        notes: [noteId],
                                                        text: { iv: Bytes.fromUint8Array(textEncrypted.iv), data: Bytes.fromUint8Array(textEncrypted.data) },
                                                        files
                                                    });
                                                    uploads[noteId] = undefined;
                                                    stack.updateAll({
                                                        type: 'upload',
                                                        noteId
                                                    });
                                                } catch (e) {
                                                    console.error(e);
                                                    uploads[noteId] = undefined;
                                                    stack.updateAll({
                                                        type: 'upload',
                                                        noteId
                                                    });
                                                }
                                            } else {
                                                const textEncrypted = await encrypt(key, textEncoder.encode(text));
                                                addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                    timestamp: Math.floor(Date.now() / 1000),
                                                    notes: [noteId],
                                                    text: { iv: Bytes.fromUint8Array(textEncrypted.iv), data: Bytes.fromUint8Array(textEncrypted.data) },
                                                });
                                            }
                                        }
                                    })
                                ]
                            },
                            () => ({
                                id: 'uploads',
                                width: '100%',
                                ...layouts.column('start', 'start', '0.5rem'),
                                display: uploads[noteId] ? 'flex' : 'none',
                                children: uploads[noteId]?.map(fu => () => ({
                                    id: `file-upload-${fu.id}`,
                                    width: '100%',
                                    height: '1rem',
                                    backgroundColor: colors.background.overlay.m(),
                                    ...layouts.row(),
                                    children: [
                                        {
                                            width: `max(5%, ${fu.completed}%)`,
                                            height: '100%',
                                            backgroundColor: colors.background.overlay.l()
                                        }
                                    ]
                                }))
                            }),
                            () => ({
                                id: 'filter-paragraphs',
                                width: '100%',
                                padding: '0 0.25rem 0 0.5rem',
                                border: `1px solid ${colors.border.s()}`,
                                borderRadius: '0.5rem',
                                ...layouts.row('start', 'center'),
                                children: [
                                    components.icon({
                                        ligature: 'search'
                                    }),
                                    {
                                        tag: 'input',
                                        flexGrow: 1,
                                        ...styles.input(),
                                        border: 'none',
                                        type: 'text',
                                        value: filterParagraphQuery,
                                        oninput: function (event) {
                                            filterParagraphQuery = event.target.value;
                                            this.layer.widgets['paragraphs'].update();
                                        },
                                    },
                                    components.button({
                                        backgroundHoverColor: colors.background.overlay.m(),
                                        padding: '0.25rem',
                                        child: components.icon({
                                            ligature: 'close'
                                        }),
                                        onclick: function (event) {
                                            filterParagraphQuery = undefined;
                                            this.layer.widgets['filter-paragraphs'].update();
                                            this.layer.widgets['paragraphs'].update();
                                        }
                                    }),
                                ]
                            }),
                            () => {
                                return ({
                                    id: 'paragraphs',
                                    width: '100%',
                                    ...layouts.column('start', 'start', '1rem'),
                                    children: [...paragraphs.slice(0, limitParagraphs && !filterParagraphQuery ? 32 : paragraphs.length).filter(p => {
                                        if (!filterParagraphQuery) {
                                            return true;
                                        }
                                        if (p.id === editParagraphId) {
                                            return true;
                                        }
                                        if (p.text?.toLowerCase().includes(filterParagraphQuery.toLowerCase())) {
                                            return true;
                                        }
                                        for (const file of p.files || []) {
                                            if (file.name.toLowerCase().includes(filterParagraphQuery.toLowerCase())) {
                                                return true;
                                            }
                                        }
                                        return false;
                                    }).map((paragraph, index) => paragraph.id === editParagraphId ? {
                                        id: 'edit-paragraph',
                                        ...layouts.column('start', 'start', '1rem'),
                                        width: '100%',
                                        children: [
                                            () => ({
                                                id: 'edit-paragraph-hint',
                                                display: editParagraphValid ? 'none' : 'block',
                                                fontWeight: 500,
                                                color: radixColor(baseColors.danger, 11),
                                                text: 'Required'
                                            }),
                                            components.inputs.textArea({
                                                id: 'edit-paragraph-input',
                                                palette: paragraph.color,
                                                width: '100%',
                                                height: `max(${editParagraphHeight}px, 16rem)`,
                                                text: editParagraphText,
                                                oninput: function (event) {
                                                    editParagraphText = event.target.value;
                                                }
                                            }),
                                            {
                                                width: '100%',
                                                ...layouts.row('end', 'start', '1rem'),
                                                children: [
                                                    components.buttons.formSecondary({
                                                        text: 'Cancel',
                                                        onclick: function (event) {
                                                            editParagraphId = undefined;
                                                            editParagraphValid = undefined;
                                                            editParagraphText = undefined;
                                                            this.layer.widgets['paragraphs'].update();
                                                        }
                                                    }),
                                                    components.buttons.formPrimary({
                                                        text: 'Save',
                                                        onclick: async function (event) {
                                                            editParagraphValid = true;
                                                            if (!this.layer.widgets['edit-paragraph-input'].domElement.value.trim()) {
                                                                editParagraphValid = false;
                                                            }
                                                            this.layer.widgets['edit-paragraph-hint'].update();
                                                            if (!editParagraphValid) {
                                                                return;
                                                            }
                                                            editParagraphId = undefined;
                                                            editParagraphValid = undefined;
                                                            editParagraphText = undefined;
                                                            const textEncrypted = await encrypt(key, textEncoder.encode(this.layer.widgets['edit-paragraph-input'].domElement.value));
                                                            updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                text: { iv: Bytes.fromUint8Array(textEncrypted.iv), data: Bytes.fromUint8Array(textEncrypted.data) },
                                                            });
                                                        }
                                                    })
                                                ]
                                            }
                                        ]
                                    } : {
                                        id: `paragraph-${paragraph.id}`,
                                        width: '100%',
                                        padding: '0.5rem',
                                        border: `1px solid ${paragraph.color ? radixColor(paragraph.color, 6, true) : colors.border.s()}`,
                                        borderRadius: '0.5rem',
                                        backgroundColor: paragraph.color ? radixColor(paragraph.color, 3) : colors.background.body(),
                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.primary(),
                                        ...layouts.column('start', 'start', '1rem'),
                                        children: [
                                            paragraph.text ? {
                                                width: '100%',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                text: paragraph.text
                                            } : null,
                                            paragraph.files ? {
                                                width: '100%',
                                                ...layouts.column('start', 'start', '0.5rem'),
                                                children: paragraph.files.map(f => ({
                                                    width: '100%',
                                                    padding: '0.25rem 0.25rem 0.25rem 0.5rem',
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: paragraph.color ? radixColor(paragraph.color, 2, true) : colors.background.overlay.s(),
                                                    ...layouts.row('space-between', 'center'),
                                                    children: [
                                                        {
                                                            minWidth: 0,
                                                            fontWeight: 600,
                                                            color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                            ...styles.unselectable(),
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            text: f.name
                                                        },
                                                        () => ({
                                                            id: `file-actions-${f.id}`,
                                                            ...layouts.row('start', 'center'),
                                                            children: [
                                                                !downloads[f.id] ? components.button({
                                                                    backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                    child: components.icon({
                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                        ligature: 'cloud_download'
                                                                    }),
                                                                    onclick: async function (event) {
                                                                        downloads[f.id] = {
                                                                            status: 'downloading'
                                                                        };
                                                                        stack.updateAll({
                                                                            type: 'download',
                                                                            fileId: f.id
                                                                        });
                                                                        try {
                                                                            const fileEncrypted = await getBytes(ref(firebase.storage, `users/${firebase.auth.currentUser.uid}/files/${f.id}.encrypted`));
                                                                            const fileDecrypted = await decrypt(key, f.iv, fileEncrypted);
                                                                            downloads[f.id] = {
                                                                                status: 'ready',
                                                                                file: new File([fileDecrypted], f.name, {
                                                                                    type: f.type,
                                                                                    lastModified: f.lastModified,
                                                                                })
                                                                            };
                                                                            stack.updateAll({
                                                                                type: 'download',
                                                                                fileId: f.id
                                                                            });
                                                                        } catch (e) {
                                                                            console.error(e);
                                                                            downloads[f.id] = undefined;
                                                                            stack.updateAll({
                                                                                type: 'download',
                                                                                fileId: f.id
                                                                            });
                                                                        }
                                                                    }
                                                                }) : null,
                                                                downloads[f.id]?.status === 'downloading' ? components.animations.spinner({
                                                                    width: '2.25rem',
                                                                    height: '2.25rem',
                                                                    padding: '0.5rem',
                                                                    color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                }) : null,
                                                                (downloads[f.id]?.status === 'ready' && downloads[f.id].file.type.startsWith('image')) ? components.button({
                                                                    backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                    child: components.icon({
                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                        ligature: 'image'
                                                                    }),
                                                                    onclick: function (event) {
                                                                        const url = URL.createObjectURL(downloads[f.id].file);
                                                                        stack.push({
                                                                            path: '#image',
                                                                            onPop: function () {
                                                                                URL.revokeObjectURL(url);
                                                                            },
                                                                            config: {
                                                                                tag: 'img',
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'contain',
                                                                                objectPosition: 'center',
                                                                                src: url
                                                                            }
                                                                        });
                                                                    }
                                                                }) : null,
                                                                (downloads[f.id]?.status === 'ready' && downloads[f.id].file.type.startsWith('audio')) ? components.button({
                                                                    backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                    child: components.icon({
                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                        ligature: 'play_circle'
                                                                    }),
                                                                    onclick: function (event) {
                                                                        const url = URL.createObjectURL(downloads[f.id].file);
                                                                        stack.push({
                                                                            path: '#audio',
                                                                            onPop: function () {
                                                                                URL.revokeObjectURL(url);
                                                                            },
                                                                            config: {
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                ...layouts.row('center', 'center'),
                                                                                children: [
                                                                                    {
                                                                                        tag: 'audio',
                                                                                        width: '100%',
                                                                                        controls: true,
                                                                                        src: url
                                                                                    }
                                                                                ]
                                                                            }
                                                                        });
                                                                    }
                                                                }) : null,
                                                                (downloads[f.id]?.status === 'ready' && downloads[f.id].file.type.startsWith('video')) ? components.button({
                                                                    backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                    child: components.icon({
                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                        ligature: 'play_circle'
                                                                    }),
                                                                    onclick: function (event) {
                                                                        const url = URL.createObjectURL(downloads[f.id].file);
                                                                        stack.push({
                                                                            path: '#video',
                                                                            onPop: function () {
                                                                                URL.revokeObjectURL(url);
                                                                            },
                                                                            config: {
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                ...layouts.row('center', 'center'),
                                                                                children: [
                                                                                    {
                                                                                        tag: 'video',
                                                                                        width: '100%',
                                                                                        height: '100%',
                                                                                        objectFit: 'contain',
                                                                                        objectPosition: 'center',
                                                                                        controls: true,
                                                                                        src: url
                                                                                    }
                                                                                ]
                                                                            }
                                                                        });
                                                                    }
                                                                }) : null,
                                                                downloads[f.id]?.status === 'ready' ? components.button({
                                                                    backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                    child: components.icon({
                                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                        ligature: 'download'
                                                                    }),
                                                                    onclick: function (event) {
                                                                        const url = URL.createObjectURL(downloads[f.id].file);
                                                                        const a = document.createElement('a');
                                                                        a.href = url;
                                                                        a.download = downloads[f.id].file.name;
                                                                        a.click();
                                                                        requestAnimationFrame(() => URL.revokeObjectURL(url));
                                                                    }
                                                                }) : null,
                                                            ]
                                                        }),
                                                    ]
                                                }))
                                            } : null,
                                            paragraph.notes.length > 1 ? {
                                                width: '100%',
                                                ...layouts.column('start', 'start', '0.5rem'),
                                                children: paragraph.notes.filter(nid => nid !== noteId).map(nid => components.textLink({
                                                    color: radixColor('blue', 11),
                                                    href: `/note/${nid}`,
                                                    text: tree[nid].name,
                                                    onclick: function (event) {
                                                        stack.push(pages.note(`/note/${nid}`, nid));
                                                    }
                                                }))
                                            } : null,
                                            {
                                                width: '100%',
                                                ...layouts.row('space-between', 'center', '1rem'),
                                                children: [
                                                    {
                                                        fontSize: '0.875rem',
                                                        color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                        ...styles.unselectable(),
                                                        text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    },
                                                    {
                                                        ...layouts.row(),
                                                        children: [
                                                            components.button({
                                                                backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                child: components.icon({
                                                                    color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                    ligature: 'content_copy',
                                                                }),
                                                                onclick: function (event) {
                                                                    navigator.clipboard.writeText(paragraph.text);
                                                                }
                                                            }),
                                                            components.button({
                                                                backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                child: components.icon({
                                                                    color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                    ligature: 'palette',
                                                                }),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#color',
                                                                        hidePrior: false,
                                                                        config: () => components.modalCloseBackground({
                                                                            backgroundColor: colors.background.overlay.s(),
                                                                            child: {
                                                                                ...styles.modal(),
                                                                                ...layouts.column('start', 'start', '1rem'),
                                                                                children: [
                                                                                    {
                                                                                        fontWeight: 600,
                                                                                        text: 'Color'
                                                                                    },
                                                                                    {
                                                                                        ...layouts.grid(),
                                                                                        width: '100%',
                                                                                        alignSelf: 'center',
                                                                                        gridTemplateColumns: 'repeat(auto-fill, 3rem)',
                                                                                        justifyContent: 'center',
                                                                                        gap: '1rem',
                                                                                        children: [undefined, 'tomato', 'red', 'ruby', 'crimson', 'pink', 'plum', 'purple', 'violet', 'iris', 'indigo', 'blue', 'cyan', 'teal', 'jade', 'green', 'grass', 'bronze', 'gold', 'brown', 'orange', 'amber', 'yellow', 'lime', 'mint', 'sky'].map(color => components.button({
                                                                                            padding: '0.25rem',
                                                                                            borderRadius: '2rem',
                                                                                            backgroundColor: radixColor(color || baseColors.neutral, 4, true),
                                                                                            backgroundHoverColor: radixColor(color || baseColors.neutral, 5, true),
                                                                                            child: components.icon({
                                                                                                fontSize: '2.5rem',
                                                                                                color: color ? radixColor(color, 11) : colors.foreground.primary(),
                                                                                                ligature: 'circle',
                                                                                            }),
                                                                                            onclick: async function (event) {
                                                                                                stack.pop();
                                                                                                updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                                    color: color || deleteField(),
                                                                                                });
                                                                                            }
                                                                                        })
                                                                                        )
                                                                                    }
                                                                                ]
                                                                            }
                                                                        })
                                                                    });
                                                                }
                                                            }),
                                                            components.button({
                                                                backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                child: components.icon({
                                                                    color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                    ligature: 'edit',
                                                                }),
                                                                disabled: editParagraphId,
                                                                onclick: function (event) {
                                                                    if (!editParagraphId) {
                                                                        editParagraphId = paragraph.id;
                                                                        editParagraphHeight = this.layer.widgets[`paragraph-${paragraph.id}`].domElement.getBoundingClientRect().height;
                                                                        editParagraphValid = true;
                                                                        editParagraphText = paragraph.text;
                                                                        this.layer.widgets['paragraphs'].update();
                                                                    }
                                                                }
                                                            }),
                                                            components.button({
                                                                backgroundHoverColor: paragraph.color ? radixColor(paragraph.color, 3, true) : colors.background.overlay.m(),
                                                                child: components.icon({
                                                                    color: paragraph.color ? radixColor(paragraph.color, 11) : colors.foreground.secondary(),
                                                                    ligature: 'delete',
                                                                }),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#delete',
                                                                        hidePrior: false,
                                                                        config: () => components.modals.prompt({
                                                                            title: 'Delete',
                                                                            description: paragraph.notes.length > 1 ? 'Linked copies will not be affected.' : 'You won\'t be able to restore it.',
                                                                            buttons: [
                                                                                components.buttons.formPrimary({
                                                                                    palette: baseColors.danger,
                                                                                    text: 'Delete',
                                                                                    onclick: function (event) {
                                                                                        stack.pop();
                                                                                        if (paragraph.notes.length > 1) {
                                                                                            updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                                notes: arrayRemove(noteId),
                                                                                            });
                                                                                        } else {
                                                                                            deleteDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id));
                                                                                        }
                                                                                    }
                                                                                })
                                                                            ]
                                                                        })
                                                                    });
                                                                }
                                                            }),
                                                        ]
                                                    }
                                                ]
                                            }
                                        ]
                                    }),
                                    !filterParagraphQuery && limitParagraphs && paragraphs.length > 32 ? components.button({
                                        width: '100%',
                                        height: '2.5rem',
                                        padding: '0 0.75rem',
                                        backgroundColor: colors.background.overlay.m(),
                                        backgroundHoverColor: colors.background.overlay.l(),
                                        onclick: function (event) {
                                            limitParagraphs = false;
                                            this.layer.widgets['paragraphs'].update();
                                        },
                                        child: {
                                            fontWeight: 600,
                                            color: colors.foreground.secondary(),
                                            text: 'More'
                                        }
                                    }) : null]
                                });
                            }
                        ]
                    },
                ]
            }),
        };
    }
}