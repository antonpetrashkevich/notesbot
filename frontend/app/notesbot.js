import { initializeApp as initializeFirebase } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { addDoc, arrayUnion, Bytes, CACHE_SIZE_UNLIMITED, collection, deleteDoc, doc, increment, initializeFirestore, onSnapshot, orderBy, persistentLocalCache, persistentMultipleTabManager, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { colors as baseColors, components as baseComponents, pages as basePages, styles as baseStyles } from '/home/n1/projects/xpl_kit/commons';
import { appName, col, darkMode, goTo, grid, modalOff, modalOn, resolveCurrentPath, row, startApp, startPathController, startThemeController, startViewportSizeController, updateBodyStyle, updateMetaTags, updatePage, widgets } from '/home/n1/projects/xpl_kit/core.js';
// import { getAnalytics } from "firebase/analytics";


const firebase = {};
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
let notebook;
let key;
let tree;
let folderId;
let noteId;
let paragraphs;
let stopListenNotebook;
let stopListenParagraphs;

async function generateKey(keyphrase, salt) {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        textEncoder.encode(keyphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 2 ** 16,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

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
    return { iv: Bytes.fromUint8Array(iv), data: Bytes.fromUint8Array(new Uint8Array(encryptedData)) };
}

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

function generateTreeId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    while (true) {
        let result = '';
        const charactersLength = characters.length;
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        if (!tree.hasOwnProperty(result)) {
            return result;
        }
    }
}

export async function init() {
    const firebaseConfig = {
        apiKey: "AIzaSyCpE4ytbA0WGmVV2gcun98F1FRHjtW-qtI",
        authDomain: "notesbot-be271.firebaseapp.com",
        projectId: "notesbot-be271",
        storageBucket: "notesbot-be271.firebasestorage.app",
        messagingSenderId: "408712122661",
        appId: "1:408712122661:web:30fa210ad4a3dc73ec4acc",
        measurementId: "G-85D3XP1ZM8"
    };
    firebase.app = initializeFirebase(firebaseConfig);
    firebase.auth = getAuth(firebase.app);
    firebase.firestore = initializeFirestore(firebase.app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        cacheSize: CACHE_SIZE_UNLIMITED
    });
    // firebase.analytics = getAnalytics(firebase.app);    

    startApp('XPL');
    startViewportSizeController();
    startThemeController(function () {
        updateMetaTags({
            'theme-color': colors.metaThemeColor()
        });
        updateBodyStyle({
            backgroundColor: colors.background(),
            color: colors.foreground1(),
        });
    });
    updateMetaTags({
        'theme-color': colors.metaThemeColor()
    });
    updateBodyStyle({
        ...styles.font.default(),
        backgroundColor: colors.background(),
        color: colors.foreground1(),
    });

    startPathController(pathController);
    updatePage(pages.loadingPage());
    onAuthStateChanged(firebase.auth, async (user) => {
        if (user) {
            startListenNotebook();
        } else {
            stopListenParagraphs?.();
            stopListenNotebook?.();
            notebook = undefined;
            key = undefined;
            tree = undefined;
            folderId = undefined;
            noteId = undefined;
            paragraphs = undefined;
            window.localStorage.removeItem('keyphrase');
            resolveCurrentPath();
        }
    });
}

async function pathController(segments, params, historyScroll) {
    stopListenParagraphs?.();
    folderId = undefined;
    noteId = undefined;
    paragraphs = undefined;
    if (!firebase.auth.currentUser) {
        updatePage(pages.loginPage());
    }
    else if (!notebook) {
        updatePage(pages.setupTutorialPage());
    }
    else if (notebook && notebook.status === 'deleted') {
        updatePage(pages.notebookDeletedPage());
    }
    else if (notebook && !window.localStorage.getItem('keyphrase')) {
        updatePage(pages.keyphrasePage());
    }
    else if (segments.length === 2 && segments[0] === 'folder' && tree[segments[1]]) {
        folderId = segments[1];
        updatePage(pages.folderPage());
    }
    else if (segments.length === 2 && segments[0] === 'note' && tree[segments[1]]) {
        noteId = segments[1];
        paragraphs = [];
        updatePage(pages.notePage());
        startListenParagraphs();
    } else {
        folderId = 'root';
        updatePage(pages.folderPage());
    }
}

function startListenNotebook() {
    stopListenNotebook = onSnapshot(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid),
        async (docSnap) => {
            if (docSnap.exists()) {
                notebook = docSnap.data();
                if (notebook.status === 'active' && window.localStorage.getItem('keyphrase')) {
                    key = await generateKey(window.localStorage.getItem('keyphrase'), notebook.salt.toUint8Array());
                    tree = {};
                    for (const id in notebook.tree) {
                        tree[id] = { type: notebook.tree[id].type, parent: notebook.tree[id].parent, order: notebook.tree[id].order, name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array())) };
                    }
                }
                if (!noteId) {
                    resolveCurrentPath();
                }
            } else {
                if (notebook) {
                    signOut(firebase.auth);
                } else {
                    resolveCurrentPath();
                }
            }
        });
}

function startListenParagraphs() {
    stopListenParagraphs = onSnapshot(query(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), where('noteId', '==', noteId), orderBy('timestamp', 'desc')),
        async (querySnapshot) => {
            paragraphs = [];
            for (const docSnap of querySnapshot.docs) {
                const docData = docSnap.data();
                paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, color: docData.color, text: docData.text ? textDecoder.decode(await decrypt(key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())) : undefined, image: docData.image ? URL.createObjectURL(new Blob([await decrypt(key, docData.image.content.iv.toUint8Array(), docData.image.content.data.toUint8Array())], { type: docData.image.type })) : undefined });
            }
            widgets['paragraphs']?.update();
        }
    );
}

const icons = {
    menu: '<svg viewBox="0 -960 960 960"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>',
    circle: '<svg viewBox="0 -960 960 960"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    up: '<svg viewBox="0 -960 960 960"><path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"/></svg>',
    add: '<svg viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>',
    copy: '<svg viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>',
    upload: '<svg viewBox="0 -960 960 960"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>',
    edit: '<svg viewBox="0 -960 960 960"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    delete: '<svg viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
    color: '<svg viewBox="0 -960 960 960"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>',
    search: '<svg viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>',
    filter: '<svg viewBox="0 -960 960 960"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/></svg>',
    close: '<svg viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>'
}

export const colors = {
    ...baseColors,
}

export const styles = {
    ...baseStyles,
}

export const components = {
    ...baseComponents,
}

export const pages = {
    ...basePages,
    notebookDeletedPage() {
        return {
            meta: {
                title: `Notebook Deleted | ${appName}`,
                description: 'Notebook deleted.'
            },
            config: {
                width: '100%',
                height: '100%',
                padding: '1rem',
                ...col,
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                children: [
                    {
                        text: 'Your notebook will be permanently deleted within 30 days. You\'ll be able to create a new one afterward.'
                    },
                    {
                        ...components.button(function (event) {
                            signOut(firebase.auth);
                        }),
                        ...styles.button.l(),
                        ...styles.button.filledLight(),
                        fontWeight: 600,
                        text: 'Log out'
                    }
                ]
            },
        };
    },
    notebookOutOfSyncPage() {
        return {
            meta: {
                title: `Notebook Out of Sync | ${appName}`,
                description: 'Notebook out of sync.'
            },
            config: {
                width: '100%',
                height: '100%',
                ...col,
                alignItems: 'center',
                gap: '1rem',
                children: [
                    {
                        margin: '25vh 1rem',
                        text: 'Notebook is out of sync. Reload the page and try again.'
                    },
                ]
            },
        };
    },
    loginPage() {
        return {
            meta: {
                title: `Login | ${appName}`,
                description: 'Login page.'
            },
            config: () => ({
                ...row,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                children: [
                    {
                        ...components.button(function (event) {
                            updatePage(pages.loadingPage());
                            signInWithPopup(firebase.auth, new GoogleAuthProvider());
                        }),
                        ...styles.button.l(),
                        ...styles.button.flat(),
                        children: [
                            {
                                html: '<svg viewBox="0 0 48 48"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path> <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path> <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path> <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path> <path fill="none" d="M0 0h48v48H0z"></path></svg>',
                                height: '1.25rem',
                                alignSelf: 'center',
                            },
                            {
                                alignSelf: 'center',
                                text: 'Login with Google'
                            }
                        ]
                    }
                ]
            }),
        };
    },
    setupTutorialPage() {
        return {
            meta: {
                title: `Setup | ${appName}`,
                description: 'Setup page.'
            },
            config: () => ({
                ...styles.base(),
                justifyContent: 'center',
                alignItems: 'center',
                children: [
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '1rem 0',
                        ...styles.card.s(),
                        ...styles.border.default(),
                        ...col,
                        justifyContent: 'center',
                        gap: '2rem',
                        children: [
                            {
                                ...styles.text.h2(),
                                text: 'Keyphrase'
                            },
                            {
                                ...col,
                                gap: '0.5rem',
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
                                ]
                            },
                            {
                                ...row,
                                width: '100%',
                                justifyContent: 'end',
                                gap: '1rem',
                                children: [
                                    {
                                        ...components.button(function (event) {
                                            signOut(firebase.auth);
                                        }),
                                        ...styles.button.l(),
                                        ...styles.button.filledLight(),
                                        fontWeight: 600,
                                        text: 'Log out'
                                    },
                                    {
                                        ...components.button(function (event) {
                                            updatePage(pages.setupPage());
                                        }),
                                        ...styles.button.l(),
                                        ...styles.colored.blue.button.filledDark(),
                                        fontWeight: 600,
                                        text: 'Next'
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }),
        };
    },
    setupPage() {
        let keyphraseValid = true;
        let keyphraseRepeatValid = true;
        return {
            meta: {
                title: `Setup | ${appName}`,
                description: 'Setup page.'
            },
            config: () => ({
                ...styles.base(),
                justifyContent: 'center',
                alignItems: 'center',
                children: [
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '1rem 0',
                        ...styles.card.s(),
                        ...styles.border.default(),
                        ...col,
                        justifyContent: 'center',
                        gap: '2rem',
                        children: [
                            {
                                ...styles.text.h2(),
                                text: 'Keyphrase'
                            },
                            {
                                ...col,
                                width: '100%',
                                children: [
                                    {
                                        fontWeight: 600,
                                        text: 'Your keyphrase'
                                    },
                                    () => ({
                                        id: 'keyphrase-hint',
                                        ...styles.text.aux(),
                                        display: keyphraseValid ? 'none' : 'block',
                                        marginTop: '0.5rem',
                                        fontWeight: 500,
                                        color: colors.red[500],
                                        text: 'Required'
                                    }),
                                    {
                                        id: 'keyphrase-input',
                                        ...components.input(),
                                        ...styles.border.default(),
                                        marginTop: '0.5rem',
                                        width: '100%',
                                        type: 'password',
                                        maxlength: '64'
                                    },
                                    {
                                        marginTop: '1rem',
                                        fontWeight: 600,
                                        text: 'Repeat keyphrase'
                                    },
                                    () => ({
                                        id: 'keyphrase-repeat-hint',
                                        ...styles.text.aux(),
                                        display: keyphraseRepeatValid ? 'none' : 'block',
                                        marginTop: '0.5rem',
                                        fontWeight: 500,
                                        color: colors.red[500],
                                        text: 'Invalid'
                                    }),
                                    {
                                        id: 'keyphrase-repeat-input',
                                        ...components.input(),
                                        ...styles.border.default(),
                                        marginTop: '0.5rem',
                                        width: '100%',
                                        type: 'password',
                                        maxlength: '64'
                                    },
                                ]
                            },
                            {
                                ...row,
                                width: '100%',
                                justifyContent: 'end',
                                gap: '1rem',
                                children: [
                                    {
                                        ...components.button(async function (event) {
                                            keyphraseValid = true;
                                            keyphraseRepeatValid = true;
                                            if (!widgets['keyphrase-input'].domElement.value) {
                                                keyphraseValid = false;
                                            }
                                            else if (!widgets['keyphrase-repeat-input'].domElement.value || widgets['keyphrase-input'].domElement.value != widgets['keyphrase-repeat-input'].domElement.value) {
                                                keyphraseRepeatValid = false;
                                            }
                                            widgets['keyphrase-hint'].update();
                                            widgets['keyphrase-repeat-hint'].update();
                                            if (!keyphraseValid || !keyphraseRepeatValid) {
                                                window.scrollTo(0, 0);
                                                return;
                                            }
                                            const keyphrase = widgets['keyphrase-input'].domElement.value;
                                            updatePage(pages.loadingPage());
                                            try {
                                                window.localStorage.setItem('keyphrase', keyphrase);
                                                const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                    const notebookDoc = await transaction.get(notebookDocRef);
                                                    if (notebookDoc.exists()) {
                                                        throw "Notebook already exists";
                                                    }
                                                    else {
                                                        const salt = Bytes.fromUint8Array(window.crypto.getRandomValues(new Uint8Array(16)));
                                                        const key = await generateKey(keyphrase, salt.toUint8Array());
                                                        transaction.set(notebookDocRef, {
                                                            timestamp: serverTimestamp(),
                                                            status: 'active',
                                                            salt,
                                                            keytest: await encrypt(key, textEncoder.encode(Math.random().toString(36).slice(2))),
                                                            tree: {}
                                                        });
                                                    }
                                                    return true;
                                                });
                                            } catch (error) {
                                                if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                    updatePage(pages.networkErrorPage());
                                                } else {
                                                    console.error(error);
                                                    updatePage(pages.generalErrorPage());
                                                }
                                            }
                                        }),
                                        ...styles.button.l(),
                                        ...styles.colored.blue.button.filledDark(),
                                        fontWeight: 600,
                                        text: 'Save'
                                    }
                                ]
                            }
                        ]
                    }]
            }),
        };
    },
    keyphrasePage() {
        let keyphraseValid = true;
        return {
            meta: {
                title: `Keyphrase | ${appName}`,
                description: 'Keyphrase page.'
            },
            config: () => ({
                ...styles.base(),
                justifyContent: 'center',
                alignItems: 'center',
                children: [
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '1rem 0',
                        ...styles.card.s(),
                        ...styles.border.default(),
                        ...col,
                        justifyContent: 'center',
                        gap: '2rem',
                        children: [
                            {
                                ...styles.text.h2(),
                                text: 'Keyphrase'
                            },
                            {
                                ...col,
                                width: '100%',
                                justifyContent: 'center',
                                children: [
                                    {
                                        fontWeight: 600,
                                        text: 'Your keyphrase'
                                    },
                                    () => ({
                                        id: 'keyphrase-hint',
                                        ...styles.text.aux(),
                                        display: keyphraseValid ? 'none' : 'block',
                                        marginTop: '0.5rem',
                                        fontWeight: 500,
                                        color: colors.red[500],
                                        text: 'Invalid'
                                    }),
                                    () => ({
                                        id: 'keyphrase-input',
                                        ...components.input(),
                                        ...styles.border.default(),
                                        width: '100%',
                                        marginTop: '0.5rem',
                                        type: 'password',
                                        maxlength: '64'
                                    }),
                                ]
                            },
                            {
                                ...row,
                                width: '100%',
                                justifyContent: 'end',
                                gap: '1rem',
                                children: [
                                    {
                                        ...components.button(function (event) {
                                            signOut(firebase.auth);
                                        }),
                                        ...styles.button.l(),
                                        ...styles.button.filledLight(),
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        text: 'Log out'
                                    },
                                    {
                                        ...components.button(async function (event) {
                                            try {
                                                key = await generateKey(widgets['keyphrase-input'].domElement.value, notebook.salt.toUint8Array());
                                                await decrypt(key, notebook.keytest.iv.toUint8Array(), notebook.keytest.data.toUint8Array());
                                                window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                                tree = {};
                                                for (const id in notebook.tree) {
                                                    tree[id] = { type: notebook.tree[id].type, parent: notebook.tree[id].parent, order: notebook.tree[id].order, name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array())) };
                                                }
                                                resolveCurrentPath();
                                                return;
                                            } catch (error) {
                                                keyphraseValid = false;
                                                widgets['keyphrase-hint'].update();
                                                widgets['keyphrase-input'].update();
                                                window.scrollTo(0, 0);
                                            }
                                        }),
                                        ...styles.button.l(),
                                        ...styles.colored.blue.button.filledDark(),
                                        justifyContent: 'center',
                                        fontWeight: 600,
                                        text: 'Save',
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }),
        };
    },
    folderPage() {
        let notebookTimestamp = notebook.timestamp.toMillis();
        let nameValid = true;
        let moveToFolderId;
        return {
            meta: {
                title: `${folderId === 'root' ? 'Home' : tree[folderId].name} | ${appName}`,
                description: 'Folder page.'
            },
            config: () => {
                const children = Object.keys(tree).filter(id => tree[id].parent === folderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
                return {
                    id: 'folder',
                    ...styles.base(),
                    alignItems: 'center',
                    children: [
                        folderId === 'root' ? null : {
                            ...components.stickyHeader(),
                            children: [
                                {
                                    ...row,
                                    alignItems: 'center',
                                    gap: '1rem',
                                    children: [
                                        {
                                            ...components.buttonLink(`/folder/${tree[folderId].parent}`),
                                            ...styles.button.m(),
                                            ...styles.button.flat(),
                                            fill: colors.foreground2(),
                                            children: [
                                                {
                                                    html: icons.up,
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                }
                                            ]
                                        },
                                        {
                                            ...styles.text.h5(),
                                            text: tree[folderId].name
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            flexGrow: 1,
                            width: 'min(640px, 100% - 1rem)',
                            padding: '1rem 0',
                            ...col,
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                            children: children.map(cid => ({
                                ...components.button(function (event) {
                                    if (tree[cid].type === 'folder') {
                                        goTo(`/folder/${cid}`);
                                    } else if (tree[cid].type === 'note') {
                                        goTo(`/note/${cid}`);
                                    }
                                }, function (event) {
                                    modalOn({
                                        ...components.menu(),
                                        children: [
                                            tree[cid].order > 0 ? {
                                                ...components.button(async function (event) {
                                                    event.stopPropagation();
                                                    updatePage(pages.loadingPage());
                                                    const neighborId = children[children.indexOf(cid) - 1];
                                                    try {
                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                        const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                transaction.update(notebookDocRef, {
                                                                    timestamp: serverTimestamp(),
                                                                    [`tree.${cid}.order`]: increment(-1),
                                                                    [`tree.${neighborId}.order`]: increment(1),
                                                                });
                                                                return true;
                                                            }
                                                            else {
                                                                updatePage(pages.notebookOutOfSyncPage());
                                                                return false;
                                                            }
                                                        });
                                                    } catch (error) {
                                                        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                            updatePage(pages.networkErrorPage());
                                                        } else {
                                                            console.error(error);
                                                            updatePage(pages.generalErrorPage());
                                                        }
                                                    }
                                                }),
                                                ...styles.button.mFullWidth(),
                                                ...styles.button.flat(),
                                                text: 'Move Up'
                                            } : null,
                                            tree[cid].order < children.length - 1 ? {
                                                ...components.button(async function (event) {
                                                    event.stopPropagation();
                                                    updatePage(pages.loadingPage());
                                                    const neighborId = children[children.indexOf(cid) + 1];
                                                    try {
                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                        const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                transaction.update(notebookDocRef, {
                                                                    timestamp: serverTimestamp(),
                                                                    [`tree.${cid}.order`]: increment(1),
                                                                    [`tree.${neighborId}.order`]: increment(-1),
                                                                });
                                                                return true;
                                                            }
                                                            else {
                                                                updatePage(pages.notebookOutOfSyncPage());
                                                                return false;
                                                            }
                                                        });
                                                    } catch (error) {
                                                        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                            updatePage(pages.networkErrorPage());
                                                        } else {
                                                            console.error(error);
                                                            updatePage(pages.generalErrorPage());
                                                        }
                                                    }
                                                }),
                                                ...styles.button.mFullWidth(),
                                                ...styles.button.flat(),
                                                text: 'Move Down'
                                            } : null,
                                            {
                                                ...components.button(function (event) {
                                                    event.stopPropagation();
                                                    moveToFolderId = 'root';
                                                    modalOn(() => ({
                                                        ...components.menu(),
                                                        alignItems: 'start',
                                                        gap: '0.5rem',
                                                        children: [
                                                            {
                                                                marginBottom: '0.5rem',
                                                                fontWeight: 600,
                                                                text: 'Move to Folder'
                                                            },
                                                            moveToFolderId === 'root' ? null : {
                                                                ...components.button(function (event) {
                                                                    event.stopPropagation();
                                                                    moveToFolderId = tree[moveToFolderId].parent;
                                                                    this.parent.update();
                                                                }),
                                                                ...styles.button.mFullWidth(),
                                                                ...styles.button.flat(),
                                                                text: '...'
                                                            },
                                                            ...Object.keys(tree).filter(id => id !== cid && tree[id].type === 'folder' && tree[id].parent === moveToFolderId).sort((id1, id2) => tree[id1].order - tree[id2].order).map(id => ({
                                                                ...components.button(function (event) {
                                                                    event.stopPropagation();
                                                                    moveToFolderId = id;
                                                                    this.parent.update();
                                                                }),
                                                                ...styles.button.mFullWidth(),
                                                                ...styles.button.flat(),
                                                                text: tree[id].name
                                                            })),
                                                            {
                                                                ...components.button(async function (event) {
                                                                    event.stopPropagation();
                                                                    updatePage(pages.loadingPage());
                                                                    try {
                                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                        const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                transaction.update(notebookDocRef, {
                                                                                    timestamp: serverTimestamp(),
                                                                                    [`tree.${cid}.parent`]: moveToFolderId,
                                                                                    [`tree.${cid}.order`]: Object.keys(tree).filter(id => tree[id].parent === moveToFolderId).length,
                                                                                });
                                                                                return true;
                                                                            }
                                                                            else {
                                                                                updatePage(pages.notebookOutOfSyncPage());
                                                                                return false;
                                                                            }
                                                                        });
                                                                    } catch (error) {
                                                                        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                            updatePage(pages.networkErrorPage());
                                                                        } else {
                                                                            console.error(error);
                                                                            updatePage(pages.generalErrorPage());
                                                                        }
                                                                    }
                                                                }),
                                                                ...styles.button.l(),
                                                                ...styles.colored.blue.button.filledDark(),
                                                                marginTop: '0.5rem',
                                                                alignSelf: 'end',
                                                                fontWeight: 600,
                                                                text: `Move to ${moveToFolderId === 'root' ? 'Home' : tree[moveToFolderId].name}`
                                                            }
                                                        ],
                                                    }));
                                                }),
                                                ...styles.button.mFullWidth(),
                                                ...styles.button.flat(),
                                                text: 'Move to Folder'
                                            },
                                            {
                                                ...components.button(function (event) {
                                                    event.stopPropagation();
                                                    nameValid = true;
                                                    modalOn(() => ({
                                                        ...components.menu(),
                                                        alignItems: 'start',
                                                        gap: '0.5rem',
                                                        children: [
                                                            {
                                                                fontWeight: 600,
                                                                text: 'New Name'
                                                            },
                                                            () => ({
                                                                id: 'new-folder-name-hint',
                                                                ...styles.text.aux(),
                                                                display: nameValid ? 'none' : 'block',
                                                                fontWeight: 500,
                                                                color: colors.red[500],
                                                                text: 'Required'
                                                            }),
                                                            {
                                                                id: 'new-folder-name-input',
                                                                ...components.input(),
                                                                ...styles.border.default(),
                                                                width: '100%',
                                                                type: 'text',
                                                                maxlength: '64',
                                                                value: tree[cid].name
                                                            },
                                                            {
                                                                ...components.button(async function (event) {
                                                                    event.stopPropagation();
                                                                    nameValid = true;
                                                                    if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                        nameValid = false;
                                                                    }
                                                                    widgets['new-folder-name-hint'].update();
                                                                    if (!nameValid) {
                                                                        return;
                                                                    }
                                                                    const name = widgets['new-folder-name-input'].domElement.value.trim();
                                                                    updatePage(pages.loadingPage());
                                                                    try {
                                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                        const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                transaction.update(notebookDocRef, {
                                                                                    timestamp: serverTimestamp(),
                                                                                    [`tree.${cid}.name`]: await encrypt(key, textEncoder.encode(name)),
                                                                                });
                                                                                return true;
                                                                            }
                                                                            else {
                                                                                updatePage(pages.notebookOutOfSyncPage());
                                                                                return false;
                                                                            }
                                                                        });
                                                                    } catch (error) {
                                                                        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                            updatePage(pages.networkErrorPage());
                                                                        } else {
                                                                            console.error(error);
                                                                            updatePage(pages.generalErrorPage());
                                                                        }
                                                                    }
                                                                }),
                                                                ...styles.button.l(),
                                                                ...styles.colored.blue.button.filledDark(),
                                                                marginTop: '0.5rem',
                                                                alignSelf: 'end',
                                                                fontWeight: 600,
                                                                text: 'Rename'
                                                            }
                                                        ]
                                                    }))
                                                }),
                                                ...styles.button.mFullWidth(),
                                                ...styles.button.flat(),
                                                text: 'Rename'
                                            },
                                            {
                                                ...components.button(function (event) {
                                                    event.stopPropagation();
                                                    modalOn({
                                                        ...components.prompt(tree[cid].type === 'note' ? 'Delete note' : 'Delete folder', 'Are you sure?', [
                                                            {
                                                                ...components.button(async function (event) {
                                                                    event.stopPropagation();
                                                                    updatePage(pages.loadingPage());
                                                                    try {
                                                                        const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                        const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                            const notebookDoc = await transaction.get(notebookDocRef);
                                                                            if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                transaction.update(notebookDocRef, {
                                                                                    timestamp: serverTimestamp(),
                                                                                    [`tree.${cid}.parent`]: 'deleted',
                                                                                });
                                                                                return true;
                                                                            }
                                                                            else {
                                                                                updatePage(pages.notebookOutOfSyncPage());
                                                                                return false;
                                                                            }
                                                                        });
                                                                    } catch (error) {
                                                                        if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                            updatePage(pages.networkErrorPage());
                                                                        } else {
                                                                            console.error(error);
                                                                            updatePage(pages.generalErrorPage());
                                                                        }
                                                                    }
                                                                }),
                                                                ...styles.button.l(),
                                                                ...styles.colored.red.button.filledDark(),
                                                                fontWeight: 600,
                                                                text: 'Delete'
                                                            }
                                                        ]),
                                                    });
                                                }),
                                                ...styles.button.mFullWidth(),
                                                ...styles.colored.red.button.flat(),
                                                text: 'Delete'
                                            },
                                        ]
                                    })
                                }),
                                ...styles.button.flat(),
                                width: '100%',
                                padding: '1rem',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: '0.5rem',
                                fontSize: '1.125rem',
                                children: [
                                    { text: tree[cid]['name'] },
                                ]
                            }))
                        },
                        {
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            zIndex: 10,
                            ...components.button(function (event) {
                                event.stopPropagation();
                                modalOn({
                                    ...components.menu(),
                                    children: [
                                        {
                                            ...components.button(function (event) {
                                                event.stopPropagation();
                                                modalOn({
                                                    ...components.prompt('Delete account', 'Are you sure?', [
                                                        {
                                                            ...components.button(async function (event) {
                                                                event.stopPropagation();
                                                                updatePage(pages.loadingPage());
                                                                try {
                                                                    const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                    const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                        const notebookDoc = await transaction.get(notebookDocRef);
                                                                        if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                            transaction.update(notebookDocRef, {
                                                                                timestamp: serverTimestamp(),
                                                                                status: 'deleted',
                                                                            });
                                                                            return true;
                                                                        }
                                                                        else {
                                                                            updatePage(pages.notebookOutOfSyncPage());
                                                                            return false;
                                                                        }
                                                                    });
                                                                } catch (error) {
                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                        updatePage(pages.networkErrorPage());
                                                                    } else {
                                                                        console.error(error);
                                                                        updatePage(pages.generalErrorPage());
                                                                    }
                                                                }
                                                            }),
                                                            ...styles.button.l(),
                                                            ...styles.colored.red.button.filledDark(),
                                                            fontWeight: 600,
                                                            text: 'Delete'
                                                        }
                                                    ]),
                                                });
                                            }),
                                            ...styles.button.mFullWidth(),
                                            ...styles.colored.red.button.flat(),
                                            text: 'Delete account'
                                        },
                                        {
                                            ...components.button(function (event) {
                                                event.stopPropagation();
                                                signOut(firebase.auth);
                                            }),
                                            ...styles.button.mFullWidth(),
                                            ...styles.colored.red.button.flat(),
                                            text: 'Log out'
                                        }
                                    ]
                                })
                            }),
                            ...styles.button.m(),
                            ...styles.button.filledLight(),
                            margin: '1rem',
                            borderRadius: '2rem',
                            children: [
                                {
                                    html: icons.menu,
                                    width: '2rem',
                                    height: '2rem',
                                }
                            ]
                        },
                        {
                            ...col,
                            position: 'fixed',
                            bottom: 0,
                            right: 0,
                            zIndex: 10,
                            margin: '1rem',
                            gap: '1rem',
                            children: [
                                {
                                    ...components.switchThemeButton(),
                                    ...styles.button.filledLight(),
                                    width: '3rem',
                                    height: '3rem',
                                    padding: '0.5rem',
                                    borderRadius: '2rem',
                                },
                                {
                                    ...components.button(function (event) {
                                        event.stopPropagation();
                                        modalOn({
                                            ...components.menu(),
                                            children: [
                                                {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        nameValid = true;
                                                        modalOn({
                                                            ...components.menu(),
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                {
                                                                    fontWeight: 600,
                                                                    text: 'Name'
                                                                },
                                                                () => ({
                                                                    id: 'new-folder-name-hint',
                                                                    ...styles.text.aux(),
                                                                    display: nameValid ? 'none' : 'block',
                                                                    fontWeight: 500,
                                                                    color: colors.red[500],
                                                                    text: 'Required'
                                                                }),
                                                                {
                                                                    id: 'new-folder-name-input',
                                                                    ...components.input(),
                                                                    ...styles.border.default(),
                                                                    width: '100%',
                                                                    type: 'text',
                                                                    maxlength: '64'
                                                                },
                                                                {
                                                                    ...components.button(async function (event) {
                                                                        event.stopPropagation();
                                                                        nameValid = true;
                                                                        if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                            nameValid = false;
                                                                        }
                                                                        widgets['new-folder-name-hint'].update();
                                                                        if (!nameValid) {
                                                                            return;
                                                                        }
                                                                        const name = widgets['new-folder-name-input'].domElement.value.trim();
                                                                        updatePage(pages.loadingPage());
                                                                        try {
                                                                            const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                            const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                                const notebookDoc = await transaction.get(notebookDocRef);
                                                                                if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                    transaction.update(notebookDocRef, {
                                                                                        timestamp: serverTimestamp(),
                                                                                        [`tree.${generateTreeId()}`]: { type: 'folder', parent: folderId, order: children.length, name: await encrypt(key, textEncoder.encode(name)) },
                                                                                    });
                                                                                    return true;
                                                                                }
                                                                                else {
                                                                                    updatePage(pages.notebookOutOfSyncPage());
                                                                                    return false;
                                                                                }
                                                                            });
                                                                        } catch (error) {
                                                                            if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                updatePage(pages.networkErrorPage());
                                                                            } else {
                                                                                console.error(error);
                                                                                updatePage(pages.generalErrorPage());
                                                                            }
                                                                        }
                                                                    }),
                                                                    ...styles.button.l(),
                                                                    ...styles.colored.blue.button.filledDark(),
                                                                    marginTop: '0.5rem',
                                                                    alignSelf: 'end',
                                                                    fontWeight: 600,
                                                                    text: 'Create'
                                                                }
                                                            ]
                                                        })
                                                    }),
                                                    ...styles.button.mFullWidth(),
                                                    ...styles.button.flat(),
                                                    text: 'New Folder'
                                                },
                                                {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        nameValid = true;
                                                        modalOn({
                                                            ...components.menu(),
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                {
                                                                    fontWeight: 600,
                                                                    text: 'Name'
                                                                },
                                                                () => ({
                                                                    id: 'new-note-name-hint',
                                                                    ...styles.text.aux(),
                                                                    display: nameValid ? 'none' : 'block',
                                                                    fontWeight: 500,
                                                                    color: colors.red[500],
                                                                    text: 'Required'
                                                                }),
                                                                {
                                                                    id: 'new-note-name-input',
                                                                    ...components.input(),
                                                                    ...styles.border.default(),
                                                                    width: '100%',
                                                                    type: 'text',
                                                                    maxlength: '64'
                                                                },
                                                                {
                                                                    ...components.button(async function (event) {
                                                                        event.stopPropagation();
                                                                        nameValid = true;
                                                                        if (!widgets['new-note-name-input'].domElement.value?.trim()) {
                                                                            nameValid = false;
                                                                        }
                                                                        widgets['new-note-name-hint'].update();
                                                                        if (!nameValid) {
                                                                            return;
                                                                        }
                                                                        const name = widgets['new-note-name-input'].domElement.value.trim();
                                                                        updatePage(pages.loadingPage());
                                                                        try {
                                                                            const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                            const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                                const notebookDoc = await transaction.get(notebookDocRef);
                                                                                if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                    transaction.update(notebookDocRef, {
                                                                                        timestamp: serverTimestamp(),
                                                                                        [`tree.${generateTreeId()}`]: { type: 'note', parent: folderId, order: children.length, name: await encrypt(key, textEncoder.encode(name)) },
                                                                                    });
                                                                                    return true;
                                                                                }
                                                                                else {
                                                                                    updatePage(pages.notebookOutOfSyncPage());
                                                                                    return false;
                                                                                }
                                                                            });
                                                                        } catch (error) {
                                                                            if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                updatePage(pages.networkErrorPage());
                                                                            } else {
                                                                                console.error(error);
                                                                                updatePage(pages.generalErrorPage());
                                                                            }
                                                                        }
                                                                    }),
                                                                    ...styles.button.l(),
                                                                    ...styles.colored.blue.button.filledDark(),
                                                                    marginTop: '0.5rem',
                                                                    alignSelf: 'end',
                                                                    fontWeight: 600,
                                                                    text: 'Create'
                                                                }
                                                            ]
                                                        })
                                                    }),
                                                    ...styles.button.mFullWidth(),
                                                    ...styles.button.flat(),
                                                    text: 'New Note'
                                                },
                                            ]
                                        })
                                    }),
                                    ...styles.colored.blue.button.filledLight(),
                                    padding: 0,
                                    borderRadius: '2rem',
                                    children: [
                                        {
                                            html: icons.add,
                                            width: '3rem',
                                            height: '3rem',
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                };
            },
        };
    },
    notePage() {
        let limitParagraphs = true;
        let addParagraphValid = true;
        let editParagraphId;
        let editParagraphValid;
        let editParagraphText;
        let filterParagraphQuery;
        return {
            meta: {
                title: `${tree[noteId]['name']} | ${appName}`,
                description: 'Note page.'
            },
            config: () => ({
                id: 'note',
                ...styles.base(),
                alignItems: 'center',
                gap: '1rem',
                children: [
                    () => ({
                        id: 'note-header',
                        ...components.stickyHeader(),
                        children: [
                            {
                                ...row,
                                alignItems: 'center',
                                gap: '1rem',
                                children: [
                                    {
                                        ...components.buttonLink(`/folder/${tree[noteId].parent}`),
                                        ...styles.button.m(),
                                        ...styles.button.flat(),
                                        fill: colors.foreground2(),
                                        children: [
                                            {
                                                html: icons.up,
                                                width: '1.25rem',
                                                height: '1.25rem',
                                            }
                                        ]
                                    },
                                    {
                                        ...styles.text.h5(),
                                        text: tree[noteId].name
                                    }
                                ]
                            }
                        ]
                    }),
                    {
                        width: 'min(640px, 100% - 1rem)',
                        ...col,
                        gap: '1rem',
                        children: [
                            () => ({
                                id: 'add-paragraph-hint',
                                ...styles.text.aux(),
                                display: addParagraphValid ? 'none' : 'block',
                                fontWeight: 500,
                                color: colors.red[500],
                                text: 'Required'
                            }),
                            {
                                id: 'add-paragraph-input',
                                ...components.textArea(),
                                ...styles.border.default(),
                                width: '100%',
                                height: '16rem',
                            },
                            {
                                ...row,
                                width: '100%',
                                justifyContent: 'end',
                                gap: '1rem',
                                children: [
                                    {
                                        id: 'image-input',
                                        tag: 'input',
                                        display: 'none',
                                        type: 'file',
                                        accept: 'image/*',
                                        onchange: function (event) {
                                            const file = event.target.files[0];
                                            if (file) {
                                                if (file.size > (1024 * 1024 - 8 * 1024)) {
                                                    modalOn(
                                                        {
                                                            ...components.prompt('Image Upload', 'Image would be compressed to 1MB jpeg', [
                                                                {
                                                                    ...components.button(function (event) {
                                                                        modalOff();
                                                                        const reader = new FileReader();
                                                                        reader.readAsDataURL(file);
                                                                        reader.onload = (event) => {
                                                                            const img = new Image();
                                                                            img.src = event.target.result;
                                                                            img.onload = () => {
                                                                                const canvas = document.createElement("canvas");
                                                                                const ctx = canvas.getContext("2d");
                                                                                let width = img.width;
                                                                                let height = img.height;
                                                                                let quality = 1.0;
                                                                                canvas.width = width;
                                                                                canvas.height = height;
                                                                                ctx.drawImage(img, 0, 0, width, height);
                                                                                const compress = () => {
                                                                                    canvas.toBlob(
                                                                                        (blob) => {
                                                                                            if (blob.size > (1024 * 1024 - 8 * 1024)) {
                                                                                                quality -= 0.05;
                                                                                                compress();
                                                                                            } else {
                                                                                                let compressOutputReader = new FileReader();
                                                                                                compressOutputReader.onload = async function (e) {
                                                                                                    addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                                                                        timestamp: Math.floor(Date.now() / 1000),
                                                                                                        noteId: noteId,
                                                                                                        image: {
                                                                                                            type: 'image/jpeg',
                                                                                                            content: await encrypt(key, e.target.result)
                                                                                                        },
                                                                                                    })
                                                                                                };
                                                                                                compressOutputReader.readAsArrayBuffer(blob);
                                                                                            }
                                                                                        },
                                                                                        'image/jpeg',
                                                                                        quality
                                                                                    );
                                                                                };
                                                                                compress();
                                                                            };
                                                                        };
                                                                    }),
                                                                    ...styles.button.l(),
                                                                    ...styles.colored.yellow.button.filledDark(),
                                                                    fontWeight: 600,
                                                                    text: 'OK'
                                                                }
                                                            ]),
                                                            ...styles.colored.yellow.panel(),
                                                        }
                                                    )
                                                } else {
                                                    const reader = new FileReader();
                                                    reader.onload = async function (e) {
                                                        addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                            timestamp: Math.floor(Date.now() / 1000),
                                                            noteId: noteId,
                                                            image: {
                                                                type: file.type,
                                                                content: await encrypt(key, e.target.result)
                                                            },
                                                        })
                                                    };
                                                    reader.readAsArrayBuffer(file);
                                                }
                                            }
                                        }
                                    },
                                    {
                                        ...components.button(async function (event) {
                                            event.stopPropagation();
                                            widgets['image-input'].domElement.click();
                                        }),
                                        ...styles.button.l(),
                                        ...styles.button.filledLight(),
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        children: [
                                            {
                                                html: icons.upload,
                                                width: '1.25rem',
                                                height: '1.25rem',
                                            },
                                            {
                                                fontWeight: 600,
                                                text: 'Image'
                                            }
                                        ]
                                    },
                                    {
                                        ...components.button(async function (event) {
                                            event.stopPropagation();
                                            addParagraphValid = true;
                                            if (!widgets['add-paragraph-input'].domElement.value.trim()) {
                                                addParagraphValid = false;
                                            }
                                            widgets['add-paragraph-hint'].update();
                                            if (!addParagraphValid) {
                                                return;
                                            }
                                            addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                timestamp: Math.floor(Date.now() / 1000),
                                                noteId: noteId,
                                                text: await encrypt(key, textEncoder.encode(widgets['add-paragraph-input'].domElement.value)),
                                            });
                                            widgets['add-paragraph-input'].domElement.value = '';
                                        }),
                                        ...styles.button.l(),
                                        ...styles.colored.blue.button.filledDark(),
                                        fontWeight: 600,
                                        text: 'Add'
                                    }
                                ]
                            },
                        ]
                    },
                    {
                        id: 'fiter-paragraphs',
                        width: 'min(640px, 100% - 1rem)',
                        padding: '0 0.25rem 0 0.5rem',
                        ...styles.border.default(),
                        borderRadius: '0.5rem',
                        ...row,
                        alignItems: 'center',
                        children: [
                            {
                                html: icons.search,
                                width: '1.25rem',
                                height: '1.25rem',
                                fill: colors.foreground2(),
                            },
                            {
                                flexGrow: 1,
                                ...components.input(),
                                type: 'text',
                                value: filterParagraphQuery,
                                oninput: function (event) {
                                    filterParagraphQuery = event.target.value;
                                    widgets['paragraphs'].update();
                                },
                            },
                            {
                                ...components.button(function (event) {
                                    filterParagraphQuery = undefined;
                                    widgets['fiter-paragraphs'].update();
                                    widgets['paragraphs'].update();
                                }),
                                ...styles.button.flat(),
                                padding: '0.25rem',
                                children: [
                                    {
                                        html: icons.close,
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        fill: colors.foreground2(),
                                    },
                                ]
                            }
                        ]
                    },
                    () => ({
                        id: 'paragraphs',
                        width: 'min(640px, 100% - 1rem)',
                        paddingBottom: '1rem',
                        ...col,
                        gap: '1rem',
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
                            return false;
                        }).map((paragraph, index) => paragraph.id === editParagraphId ? {
                            id: 'edit-paragraph',
                            ...col,
                            width: '100%',
                            gap: '1rem',
                            children: [
                                () => ({
                                    id: 'edit-paragraph-hint',
                                    display: editParagraphValid ? 'none' : 'block',
                                    ...styles.text.aux(),
                                    fontWeight: 500,
                                    color: colors.red[500],
                                    text: 'Required'
                                }),
                                {
                                    id: 'edit-paragraph-input',
                                    ...components.textArea(),
                                    ...styles.border.default(),
                                    ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].panel() : {}),
                                    width: '100%',
                                    height: `max(${widgets[`paragraph-${editParagraphId}`].domElement.getBoundingClientRect().height}px, 16rem)`,
                                    padding: '0.5rem',
                                    text: editParagraphText,
                                    oninput: function (event) {
                                        editParagraphText = event.target.value;
                                    }
                                },
                                {
                                    ...row,
                                    width: '100%',
                                    justifyContent: 'end',
                                    gap: '1rem',
                                    children: [
                                        {
                                            ...components.button(async function (event) {
                                                event.stopPropagation();
                                                editParagraphId = undefined;
                                                editParagraphValid = undefined;
                                                editParagraphText = undefined;
                                                widgets['paragraphs'].update();
                                            }),
                                            ...styles.button.l(),
                                            ...styles.button.filledLight(),
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            text: 'Cancel'
                                        },
                                        {
                                            ...components.button(async function (event) {
                                                event.stopPropagation();
                                                editParagraphValid = true;
                                                if (!widgets['edit-paragraph-input'].domElement.value.trim()) {
                                                    editParagraphValid = false;
                                                }
                                                widgets['edit-paragraph-hint'].update();
                                                if (!editParagraphValid) {
                                                    return;
                                                }
                                                editParagraphId = undefined;
                                                editParagraphValid = undefined;
                                                editParagraphText = undefined;
                                                updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                    text: await encrypt(key, textEncoder.encode(widgets['edit-paragraph-input'].domElement.value)),
                                                });
                                            }),
                                            ...styles.button.l(),
                                            ...styles.colored.blue.button.filledDark(),
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            text: 'Save'
                                        }
                                    ]
                                }
                            ]
                        } : {
                            id: `paragraph-${paragraph.id}`,
                            ...col,
                            ...styles.card.s(),
                            ...styles.border.default(),
                            ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].panel() : {}),
                            width: '100%',
                            padding: undefined,
                            gap: '1rem',
                            overflow: 'hidden',
                            children: [
                                paragraph.text ? {
                                    width: '100%',
                                    padding: '0.5rem 0.5rem 0 0.5rem',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.5rem',
                                    wordBreak: 'break-word',
                                    text: paragraph.text
                                } : null,
                                paragraph.image ? {
                                    tag: 'img',
                                    width: '100%',
                                    src: paragraph.image
                                } : null,
                                {
                                    ...row,
                                    width: '100%',
                                    padding: '0 0.5rem 0.5rem 0.5rem',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    children: [
                                        {
                                            ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].text.aux() : styles.text.aux()),
                                            text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                        },
                                        {
                                            ...row,
                                            gap: '0.5rem',
                                            children: [
                                                paragraph.text ? {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        navigator.clipboard.writeText(paragraph.text);
                                                    }),
                                                    ...styles.button.m(),
                                                    ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].button.flat() : { ...styles.button.flat(), fill: colors.foreground2() }),
                                                    children: [
                                                        {
                                                            html: icons.copy,
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                        }
                                                    ]
                                                } : null,
                                                paragraph.text ? {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        modalOn({
                                                            ...components.menu(),
                                                            alignItems: 'start',
                                                            gap: '1rem',
                                                            children: [
                                                                {
                                                                    fontWeight: 600,
                                                                    text: 'Color'
                                                                },
                                                                {
                                                                    ...grid,
                                                                    width: '100%',
                                                                    alignSelf: 'center',
                                                                    gridTemplateColumns: 'repeat(auto-fill, 3rem)',
                                                                    justifyContent: 'center',
                                                                    gap: '1rem',
                                                                    children: ['default', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'].map(color => ({
                                                                        ...components.button(async function (event) {
                                                                            event.stopPropagation();
                                                                            updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                color: color,
                                                                            });
                                                                            modalOff();
                                                                        }),
                                                                        width: '3rem',
                                                                        height: '3rem',
                                                                        ...styles.button.flat(),
                                                                        children: [
                                                                            {
                                                                                width: '1.75rem',
                                                                                height: '1.75rem',
                                                                                borderRadius: '2rem',
                                                                                borderWidth: '4px',
                                                                                borderStyle: 'solid',
                                                                                borderColor: color === 'default' ? colors.foreground1() : colors[color][500],
                                                                                backgroundColor: color === 'default' ? colors.background() : colors[color][darkMode ? 900 : 100],
                                                                            },
                                                                        ]
                                                                    }))
                                                                }
                                                            ]
                                                        });
                                                    }),
                                                    ...styles.button.m(),
                                                    ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].button.flat() : { ...styles.button.flat(), fill: colors.foreground2() }),
                                                    children: [
                                                        {
                                                            html: icons.color,
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                        }
                                                    ]
                                                } : null,
                                                paragraph.text ? {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        if (!editParagraphId) {
                                                            editParagraphId = paragraph.id;
                                                            editParagraphValid = true;
                                                            editParagraphText = paragraph.text;
                                                            widgets['paragraphs'].update();
                                                        }
                                                    }),
                                                    ...styles.button.m(),
                                                    ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].button.flat() : { ...styles.button.flat(), fill: colors.foreground2() }),
                                                    ...(editParagraphId ? styles.button.disabled() : {}),
                                                    children: [
                                                        {
                                                            html: icons.edit,
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                        }
                                                    ]
                                                } : null,
                                                {
                                                    ...components.button(function (event) {
                                                        event.stopPropagation();
                                                        modalOn({
                                                            ...components.prompt('Delete', 'You won\'t be able to restore it', [{
                                                                ...components.button(async function (event) {
                                                                    event.stopPropagation();
                                                                    deleteDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id));
                                                                    modalOff();
                                                                }),
                                                                ...styles.button.l(),
                                                                ...styles.colored.red.button.filledDark(),
                                                                fontWeight: 600,
                                                                text: 'Delete'
                                                            }]),
                                                        })
                                                    }),
                                                    ...styles.button.m(),
                                                    ...(paragraph.color && paragraph.color !== 'default' ? styles.colored[paragraph.color].button.flat() : { ...styles.button.flat(), fill: colors.foreground2() }),
                                                    children: [
                                                        {
                                                            html: icons.delete,
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                        }
                                                    ]
                                                },
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }),
                        !filterParagraphQuery && limitParagraphs && paragraphs.length > 32 ? {
                            ...components.button(function (event) {
                                limitParagraphs = false;
                                widgets['paragraphs'].update();
                            }),
                            ...styles.button.lFullWidth(),
                            ...styles.button.filledLight(),
                            justifyContent: 'center',
                            fontWeight: 600,
                            text: 'More'
                        } : null]
                    }),
                ]
            }),
        };
    }
}