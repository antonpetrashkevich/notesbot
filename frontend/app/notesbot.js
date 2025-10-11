import { initializeApp as initializeFirebase } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { addDoc, arrayRemove, arrayUnion, Bytes, CACHE_SIZE_UNLIMITED, collection, deleteDoc, deleteField, doc, getDocs, increment, initializeFirestore, onSnapshot, orderBy, persistentLocalCache, persistentMultipleTabManager, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { appName, stack, smallViewport, darkMode, utils, updateMetaTags, updateBodyStyle, startApp, startViewportSizeController, startThemeController } from '/home/n1/projects/xpl_kit/core.js';
import { colors as baseColors, icons as baseIcons, fonts as baseFonts, styles as baseStyles, handlers as baseHandlers, layouts as baseLayouts, components as baseComponents, pages as basePages } from '/home/n1/projects/xpl_kit/commons';
// import { getAnalytics } from "firebase/analytics";


const firebase = {};
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
let stopListenNotebook;
let notebook;
let key;
let tree;

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
            'theme-color': colors.metaTheme()
        });
        updateBodyStyle({
            backgroundColor: colors.background(),
            color: colors.foreground1(),
        });
    });
    updateMetaTags({
        'theme-color': colors.metaTheme()
    });
    updateBodyStyle({
        fontFamily: fonts.default().family,
        backgroundColor: colors.background(),
        color: colors.foreground1(),
    });

    stack.push(pages.loadingPage('', { replaceOnTreeUpdate: true }));
    onAuthStateChanged(firebase.auth, async (user) => {
        if (user) {
            startListenNotebook();
        } else {
            stopListenNotebook?.();
            notebook = undefined;
            key = undefined;
            tree = undefined;
            window.localStorage.removeItem('keyphrase');
            await stack.pop(stack.length - 1);
            stack.replace(pages.loginPage('/'));
        }
    });
}

function startListenNotebook() {
    stopListenNotebook = onSnapshot(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid),
        async (docSnap) => {
            if (docSnap.exists()) {
                notebook = docSnap.data();
                if (notebook.status === 'deleted') {
                    key = undefined;
                    tree = undefined;
                    window.localStorage.removeItem('keyphrase');
                    await stack.pop(stack.length - 1);
                    stack.replace(pages.notebookDeletedPage('/'));
                } else if (!window.localStorage.getItem('keyphrase')) {
                    key = undefined;
                    tree = undefined;
                    window.localStorage.removeItem('keyphrase');
                    await stack.pop(stack.length - 1);
                    stack.replace(pages.keyphrasePage('/'));
                } else if (notebook.status === 'active' && window.localStorage.getItem('keyphrase')) {
                    key = await generateKey(window.localStorage.getItem('keyphrase'), notebook.salt.toUint8Array());
                    tree = {};
                    for (const id in notebook.tree) {
                        tree[id] = { type: notebook.tree[id].type, parent: notebook.tree[id].parent, order: notebook.tree[id].order, name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array())) };
                    }
                    for (const layer of stack) {
                        layer.widgets['folder']?.update();
                    }
                    if (stack.top.data.replaceOnTreeUpdate) {
                        const { segments, params, hash } = utils.pathCurrent();
                        if (segments.length === 2 && segments[0] === 'folder' && tree[segments[1]]) {
                            stack.replace(pages.folderPage('', segments[1]));
                        }
                        else if (segments.length === 2 && segments[0] === 'note' && tree[segments[1]]) {
                            stack.replace(pages.notePage('', segments[1]));
                        } else {
                            stack.replace({ path: '/', ...pages.folderPage('', 'root') });
                        }
                    }
                }
            } else {
                notebook = undefined;
                key = undefined;
                tree = undefined;
                window.localStorage.removeItem('keyphrase');
                await stack.pop(stack.length - 1);
                stack.replace(pages.setupPage('/'));
            }
        });
}

export const colors = {
    ...baseColors,
}

export const icons = {
    ...baseIcons,
    menu: () => '<svg viewBox="0 -960 960 960"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>',
    home: () => '<svg viewBox="0 -960 960 960"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>',
    back: () => '<svg viewBox="0 -960 960 960"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>',
    circle: () => '<svg viewBox="0 -960 960 960"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    up: () => '<svg viewBox="0 -960 960 960"><path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"/></svg>',
    add: () => '<svg viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>',
    copy: () => '<svg viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>',
    upload: () => '<svg viewBox="0 -960 960 960"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>',
    edit: () => '<svg viewBox="0 -960 960 960"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    delete: () => '<svg viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
    color: () => '<svg viewBox="0 -960 960 960"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>',
    search: () => '<svg viewBox="0 -960 960 960"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>',
    filter: () => '<svg viewBox="0 -960 960 960"><path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z"/></svg>',
    close: () => '<svg viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>',
    link: () => '<svg viewBox="0 -960 960 960"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>',
    linkadd: () => '<svg viewBox="0 -960 960 960"><path d="M680-160v-120H560v-80h120v-120h80v120h120v80H760v120h-80ZM440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm560-40h-80q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480Z"/></svg>',
    linkoff: () => '<svg viewBox="0 -960 960 960"><path d="m770-302-60-62q40-11 65-42.5t25-73.5q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 57-29.5 105T770-302ZM634-440l-80-80h86v80h-6ZM792-56 56-792l56-56 736 736-56 56ZM440-280H280q-83 0-141.5-58.5T80-480q0-69 42-123t108-71l74 74h-24q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h65l79 80H320Z"/></svg>'
}

export const fonts = {
    ...baseFonts,
}

export const styles = {
    ...baseStyles,
}

export const layouts = {
    ...baseLayouts,
}

export const handlers = {
    ...baseHandlers,
}

export const components = {
    ...baseComponents,
}

export const pages = {
    ...basePages,
    notebookDeletedPage(path = '') {
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
                    components.button.form({
                        text: 'Log out',
                        onclick: function (event) {
                            signOut(firebase.auth);
                        }
                    })
                ]
            }),
        };
    },
    notebookOutOfSyncPage(path = '') {
        return {
            path,
            meta: {
                title: `Notebook Out of Sync | ${appName}`,
                description: 'Notebook out of sync.'
            },
            config: () => ({
                width: '100%',
                height: '100%',
                padding: '1rem',
                ...layouts.column('center', 'center'),
                children: [
                    {
                        text: 'Notebook is out of sync. Reload the page and try again.'
                    },
                ]
            }),
        };
    },
    loginPage(path = '') {
        return {
            path,
            meta: {
                title: `Login | ${appName}`,
                description: 'Login page.'
            },
            config: () => ({
                width: '100%',
                height: '100%',
                padding: '1rem',
                ...layouts.column('center', 'center'),
                children: [
                    components.button.custom({
                        padding: '0.75rem',
                        hover: {
                            backgroundColor: colors.background3(),
                        },
                        onclick: function (event) {
                            stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
                            signInWithPopup(firebase.auth, new GoogleAuthProvider());
                        },
                        leading: {
                            html: '<svg viewBox="0 0 48 48"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path> <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path> <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path> <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path> <path fill="none" d="M0 0h48v48H0z"></path></svg>',
                            width: '1.25rem',
                            height: '1.25rem',
                        },
                        trailing: {
                            text: 'Login with Google',
                        }
                    }),
                ]
            }),
        };
    },
    setupPage(path = '') {
        let keyphraseValid = true;
        let keyphraseRepeatValid = true;
        return {
            path,
            meta: {
                title: `Setup | ${appName}`,
                description: 'Setup page.'
            },
            config: () => ({
                padding: '0.5rem 0',
                ...layouts.base('center', 'center'),
                children: [
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '0.75rem',
                        border: `1px solid ${colors.foreground4()}`,
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
                                width: '100%',
                                ...layouts.column('start', 'start', '1rem'),
                                children: [
                                    {
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
                                                color: colors.foreground1('red'),
                                                text: 'Required',
                                            }),
                                            components.input.password({
                                                id: 'keyphrase-input',
                                                maxlength: 64
                                            })
                                        ]
                                    },
                                    {
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
                                                color: colors.foreground1('red'),
                                                text: 'Invalid',
                                            }),
                                            components.input.password({
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
                                    components.button.form({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.button.form({
                                        color: 'blue',
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
                                            const keyphrase = this.layer.widgets['keyphrase-input'].domElement.value;
                                            stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                    stack.replace(pages.networkErrorPage());
                                                } else {
                                                    console.error(error);
                                                    stack.replace(pages.generalErrorPage());
                                                }
                                            }
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
    keyphrasePage(path = '') {
        let keyphraseValid = true;
        return {
            path,
            meta: {
                title: `Keyphrase | ${appName}`,
                description: 'Keyphrase page.'
            },
            config: () => ({
                padding: '0.5rem 0',
                ...layouts.base('center', 'center'),
                children: [
                    {
                        width: 'min(640px, 100% - 1rem)',
                        padding: '0.75rem',
                        border: `1px solid ${colors.foreground4()}`,
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
                                        color: colors.foreground1('red'),
                                        text: 'Invalid'
                                    }),
                                    components.input.password({
                                        id: 'keyphrase-input',
                                        maxlength: 64
                                    }),
                                ]
                            },
                            {
                                width: '100%',
                                ...layouts.row('end', 'center', '1rem'),
                                children: [
                                    components.button.form({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.button.form({
                                        color: 'blue',
                                        text: 'Save',
                                        onclick: async function (event) {
                                            try {
                                                key = await generateKey(this.layer.widgets['keyphrase-input'].domElement.value, notebook.salt.toUint8Array());
                                                await decrypt(key, notebook.keytest.iv.toUint8Array(), notebook.keytest.data.toUint8Array());
                                                window.localStorage.setItem('keyphrase', this.layer.widgets['keyphrase-input'].domElement.value);
                                                tree = {};
                                                for (const id in notebook.tree) {
                                                    tree[id] = { type: notebook.tree[id].type, parent: notebook.tree[id].parent, order: notebook.tree[id].order, name: textDecoder.decode(await decrypt(key, notebook.tree[id].name.iv.toUint8Array(), notebook.tree[id].name.data.toUint8Array())) };
                                                }
                                                stack.replace(pages.folderPage('/', 'root'));
                                                return;
                                            } catch (error) {
                                                keyphraseValid = false;
                                                this.layer.widgets['keyphrase-hint'].update();
                                                this.layer.widgets['keyphrase-input'].update();
                                            }
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
    folderPage(path = '', folderId) {
        return {
            path,
            meta: {
                title: `${folderId === 'root' ? 'Home' : tree[folderId].name} | ${appName}`,
                description: 'Folder page.'
            },
            data: {
                folderId
            },
            config: () => {
                const children = Object.keys(tree).filter(id => tree[id].parent === folderId).sort((id1, id2) => tree[id1].order - tree[id2].order);
                return {
                    id: 'folder',
                    ...layouts.base('start', 'center'),
                    children: [
                        components.header({
                            leading: folderId === 'root' ? null : components.button.iconFlat({
                                icon: icons.home(),
                                href: '/',
                                onclick: function (event) {
                                    stack.push(pages.folderPage('/', 'root'));
                                }
                            }),
                            title: folderId === 'root' ? 'Home' : tree[folderId].name,
                        }),
                        {
                            flexGrow: 1,
                            width: 'min(640px, 100% - 1rem)',
                            padding: '1rem 0',
                            ...layouts.column('center', 'center', '1rem'),
                            children: children.map(cid =>
                                components.button.menu({
                                    size: 'l',
                                    text: tree[cid]['name'],
                                    onclick: function (event) {
                                        if (tree[cid].type === 'folder') {
                                            stack.push(pages.folderPage(`/folder/${cid}`, cid));
                                        } else if (tree[cid].type === 'note') {
                                            stack.push(pages.notePage(`/note/${cid}`, cid));
                                        }
                                    },
                                    oncontextmenu: function (event) {
                                        const notebookTimestamp = notebook.timestamp.toMillis();
                                        stack.push({
                                            path: '#menu',
                                            config: () => components.modal.closeBackground({
                                                child: components.modal.menu({
                                                    buttons: [
                                                        tree[cid].order > 0 ? components.button.menu({
                                                            text: 'Move Up',
                                                            onclick: async function (event) {
                                                                await stack.pop();
                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                            return false;
                                                                        }
                                                                    });
                                                                } catch (error) {
                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                        stack.replace(pages.networkErrorPage());
                                                                    } else {
                                                                        console.error(error);
                                                                        stack.replace(pages.generalErrorPage());
                                                                    }
                                                                }
                                                            }
                                                        }) : null,
                                                        tree[cid].order < children.length - 1 ? components.button.menu({
                                                            text: 'Move Down',
                                                            onclick: async function (event) {
                                                                await stack.pop();
                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                            return false;
                                                                        }
                                                                    });
                                                                } catch (error) {
                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                        stack.replace(pages.networkErrorPage());
                                                                    } else {
                                                                        console.error(error);
                                                                        stack.replace(pages.generalErrorPage());
                                                                    }
                                                                }
                                                            }
                                                        }) : null,
                                                        components.button.menu({
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
                                                                                        trailing: components.button.form({
                                                                                            color: 'blue',
                                                                                            smallViewportGrow: false,
                                                                                            text: 'Move',
                                                                                            onclick: async function (event) {
                                                                                                let steps = 0;
                                                                                                for (let i = stack.length - 1; i > 0; i--) {
                                                                                                    if (stack.at(i).data.folderId) {
                                                                                                        break;
                                                                                                    }
                                                                                                    steps += 1;
                                                                                                }
                                                                                                await stack.pop(steps);
                                                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
                                                                                                try {
                                                                                                    const notebookDocRef = doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid);
                                                                                                    const txResult = await runTransaction(firebase.firestore, async (transaction) => {
                                                                                                        const notebookDoc = await transaction.get(notebookDocRef);
                                                                                                        if (notebookDoc.data().timestamp.toMillis() === notebookTimestamp) {
                                                                                                            transaction.update(notebookDocRef, {
                                                                                                                timestamp: serverTimestamp(),
                                                                                                                [`tree.${cid}.parent`]: targetFolderId,
                                                                                                                [`tree.${cid}.order`]: Object.keys(tree).filter(id => tree[id].parent === targetFolderId).length,
                                                                                                            });
                                                                                                            return true;
                                                                                                        }
                                                                                                        else {
                                                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                                                            return false;
                                                                                                        }
                                                                                                    });
                                                                                                } catch (error) {
                                                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                        stack.replace(pages.networkErrorPage());
                                                                                                    } else {
                                                                                                        console.error(error);
                                                                                                        stack.replace(pages.generalErrorPage());
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
                                                                                        children: children.map(cid => components.button.menu({
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
                                                        components.button.menu({
                                                            text: 'Rename',
                                                            onclick: async function (event) {
                                                                let nameValid = true;
                                                                stack.replace({
                                                                    path: '#rename',
                                                                    config: () => components.modal.closeBackground({
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
                                                                                        color: colors.foreground1('red'),
                                                                                        text: 'Required'
                                                                                    }),
                                                                                    components.input.text({
                                                                                        id: 'new-folder-name-input',
                                                                                        maxlength: '64',
                                                                                        value: tree[cid].name,
                                                                                    })]
                                                                                },
                                                                                {
                                                                                    width: '100%',
                                                                                    ...layouts.row('end'),
                                                                                    children: [
                                                                                        components.button.form({
                                                                                            color: 'blue',
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
                                                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                                                            return false;
                                                                                                        }
                                                                                                    });
                                                                                                } catch (error) {
                                                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                        stack.replace(pages.networkErrorPage());
                                                                                                    } else {
                                                                                                        console.error(error);
                                                                                                        stack.replace(pages.generalErrorPage());
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
                                                        components.button.menu({
                                                            color: 'red',
                                                            text: 'Delete',
                                                            onclick: async function (event) {
                                                                stack.replace({
                                                                    path: '#delete',
                                                                    config: () => components.modal.closeBackground({
                                                                        child: components.modal.prompt({
                                                                            title: tree[cid].type === 'note' ? 'Delete note' : 'Delete folder',
                                                                            description: 'Are you sure?',
                                                                            buttons: [
                                                                                components.button.form({
                                                                                    color: 'red',
                                                                                    text: 'Delete',
                                                                                    onclick: async function (event) {
                                                                                        await stack.pop();
                                                                                        stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                                                    stack.replace(pages.notebookOutOfSyncPage());
                                                                                                    return false;
                                                                                                }
                                                                                            });
                                                                                        } catch (error) {
                                                                                            if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                stack.replace(pages.networkErrorPage());
                                                                                            } else {
                                                                                                console.error(error);
                                                                                                stack.replace(pages.generalErrorPage());
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                })
                                                                            ]
                                                                        })
                                                                    })
                                                                });
                                                            }
                                                        }),
                                                    ]
                                                })
                                            })
                                        });
                                    }
                                })
                            )
                        },
                        {
                            position: 'fixed',
                            bottom: '1rem',
                            left: '1rem',
                            zIndex: 10,
                            ...layouts.column('start', 'start', '1rem'),
                            children: [
                                components.button.iconFilled(
                                    {
                                        width: '3rem',
                                        height: '3rem',
                                        padding: '0.35rem',
                                        borderRadius: '2rem',
                                        icon: icons.menu(),
                                        onclick: function (event) {
                                            const notebookTimestamp = notebook.timestamp.toMillis();
                                            stack.push({
                                                path: '#menu',
                                                config: () => components.modal.closeBackground({
                                                    child: components.modal.menu({
                                                        buttons: [
                                                            components.button.menu({
                                                                color: 'red',
                                                                text: 'Delete account',
                                                                onclick: function (event) {
                                                                    stack.replace({
                                                                        path: '#delete',
                                                                        config: () => components.modal.closeBackground({
                                                                            child: components.modal.prompt({
                                                                                title: 'Delete account',
                                                                                description: 'Are you sure?',
                                                                                buttons: [
                                                                                    components.button.form({
                                                                                        color: 'red',
                                                                                        text: 'Delete',
                                                                                        onclick: async function (event) {
                                                                                            await stack.pop();
                                                                                            stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                                                        stack.replace(pages.notebookOutOfSyncPage());
                                                                                                        return false;
                                                                                                    }
                                                                                                });
                                                                                            } catch (error) {
                                                                                                if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                    stack.replace(pages.networkErrorPage());
                                                                                                } else {
                                                                                                    console.error(error);
                                                                                                    stack.replace(pages.generalErrorPage());
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    })
                                                                                ]
                                                                            })
                                                                        })
                                                                    });
                                                                }
                                                            }),
                                                            components.button.menu({
                                                                color: 'red',
                                                                text: 'Log out',
                                                                onclick: function (event) {
                                                                    signOut(firebase.auth);
                                                                }
                                                            }),
                                                        ]
                                                    })
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
                                components.button.switchTheme({
                                    width: '3rem',
                                    height: '3rem',
                                }),
                                components.button.iconFilled({
                                    color: 'blue',
                                    width: '3rem',
                                    height: '3rem',
                                    padding: 0,
                                    borderRadius: '2rem',
                                    icon: icons.add(),
                                    onclick: function (event) {
                                        const notebookTimestamp = notebook.timestamp.toMillis();
                                        stack.push({
                                            path: '#name',
                                            config: () => components.modal.closeBackground({
                                                child: components.modal.menu({
                                                    buttons: [
                                                        components.button.menu({
                                                            text: 'New Folder',
                                                            onclick: function (event) {
                                                                let nameValid = true;
                                                                stack.replace({
                                                                    path: '#newfolder',
                                                                    config: () => components.modal.closeBackground({
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
                                                                                            color: colors.foreground1('red'),
                                                                                            text: 'Required'
                                                                                        }),
                                                                                        components.input.text({
                                                                                            id: 'new-folder-name-input',
                                                                                            maxlength: '64'
                                                                                        }),
                                                                                    ]
                                                                                },
                                                                                {
                                                                                    width: '100%',
                                                                                    ...layouts.row('end'),
                                                                                    children: [
                                                                                        components.button.form({
                                                                                            color: 'blue',
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
                                                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                                                            return false;
                                                                                                        }
                                                                                                    });
                                                                                                } catch (error) {
                                                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                        stack.replace(pages.networkErrorPage());
                                                                                                    } else {
                                                                                                        console.error(error);
                                                                                                        stack.replace(pages.generalErrorPage());
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
                                                        components.button.menu({
                                                            text: 'New Note',
                                                            onclick: function (event) {
                                                                let nameValid = true;
                                                                stack.replace({
                                                                    path: '#newnote',
                                                                    config: () => components.modal.closeBackground({
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
                                                                                            color: colors.foreground1('red'),
                                                                                            text: 'Required'
                                                                                        }),
                                                                                        components.input.text({
                                                                                            id: 'new-note-name-input',
                                                                                            maxlength: '64'
                                                                                        }),
                                                                                    ]
                                                                                },
                                                                                {
                                                                                    width: '100%',
                                                                                    ...layouts.row('end'),
                                                                                    children: [
                                                                                        components.button.form({
                                                                                            color: 'blue',
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
                                                                                                stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
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
                                                                                                            stack.replace(pages.notebookOutOfSyncPage());
                                                                                                            return false;
                                                                                                        }
                                                                                                    });
                                                                                                } catch (error) {
                                                                                                    if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                                                                                                        stack.replace(pages.networkErrorPage());
                                                                                                    } else {
                                                                                                        console.error(error);
                                                                                                        stack.replace(pages.generalErrorPage());
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
    notePage(path = '', noteId) {
        const paragraphs = [];
        let limitParagraphs = true;
        let addParagraphValid = true;
        let editParagraphId;
        let editParagraphHeight;
        let editParagraphValid;
        let editParagraphText;
        let filterParagraphQuery;
        let stopListenParagraphs;
        return {
            path,
            meta: {
                title: `${tree[noteId]['name']} | ${appName}`,
                description: 'Note page.'
            },
            data: {
                noteId
            },
            onPush: function () {
                stopListenParagraphs = onSnapshot(query(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), where('noteIds', 'array-contains', noteId), orderBy('timestamp', 'desc')),
                    async (querySnapshot) => {
                        paragraphs.length = 0;
                        for (const docSnap of querySnapshot.docs) {
                            const docData = docSnap.data();
                            paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, noteIds: docData.noteIds, color: docData.color, text: docData.text ? textDecoder.decode(await decrypt(key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())) : undefined, image: docData.image ? URL.createObjectURL(new Blob([await decrypt(key, docData.image.content.iv.toUint8Array(), docData.image.content.data.toUint8Array())], { type: docData.image.type })) : undefined });
                        }
                        this.widgets['paragraphs'].update();
                    }
                );
            },
            onPop: function () {
                stopListenParagraphs();
            },
            config: () => ({
                id: 'note',
                ...layouts.base('start', 'center'),
                children: [
                    components.header({
                        leading: components.button.iconFlat({
                            icon: icons.home(),
                            href: '/',
                            onclick: function (event) {
                                stack.push(pages.folderPage('/', 'root'));
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
                                color: colors.foreground1('red'),
                                text: 'Required'
                            }),
                            components.input.textArea({
                                id: 'add-paragraph-input',
                                height: '16rem',
                            }),
                            {
                                width: '100%',
                                ...layouts.row('end', 'center', '1rem'),
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
                                                    stack.push({
                                                        path: '#compress',
                                                        config: () => components.modal.closeBackground({
                                                            child: components.modal.prompt({
                                                                color: 'yellow',
                                                                title: 'Image Upload',
                                                                description: 'Image would be compressed to 1MB jpeg.',
                                                                buttons: [
                                                                    components.button.form({
                                                                        color: 'yellow',
                                                                        text: 'OK',
                                                                        onclick: async function (event) {
                                                                            await stack.pop();
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
                                                                                                            noteIds: [noteId],
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
                                                                        }
                                                                    })
                                                                ]
                                                            })
                                                        })
                                                    });
                                                } else {
                                                    const reader = new FileReader();
                                                    reader.onload = async function (e) {
                                                        addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                            timestamp: Math.floor(Date.now() / 1000),
                                                            noteIds: [noteId],
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
                                    components.button.form({
                                        icon: icons.upload(),
                                        text: 'Attach',
                                        onclick: function (event) {
                                            stack.push({
                                                path: '#attach',
                                                config: () => components.modal.closeBackground({
                                                    child: components.modal.menu({
                                                        buttons: [
                                                            components.button.menu({
                                                                text: 'Image',
                                                                onclick: function (event) {
                                                                    stack.pop();
                                                                    this.layer.widgets['image-input'].domElement.click();
                                                                }
                                                            }),
                                                            components.button.menu({
                                                                text: 'File',
                                                                onclick: function (event) {
                                                                    stack.pop();
                                                                }
                                                            }),
                                                            components.button.menu({
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
                                                                                            children: children.map(cid => components.button.menu({
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
                                                                                stopListenParagraphs = onSnapshot(query(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), where('noteIds', 'array-contains', targetNoteId), orderBy('timestamp', 'desc')),
                                                                                    async (querySnapshot) => {
                                                                                        paragraphs.length = 0;
                                                                                        for (const docSnap of querySnapshot.docs) {
                                                                                            const docData = docSnap.data();
                                                                                            if (!docData.noteIds.includes(noteId)) {
                                                                                                paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, noteIds: docData.noteIds, color: docData.color, text: docData.text ? textDecoder.decode(await decrypt(key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())) : undefined, image: docData.image ? URL.createObjectURL(new Blob([await decrypt(key, docData.image.content.iv.toUint8Array(), docData.image.content.data.toUint8Array())], { type: docData.image.type })) : undefined });
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
                                                                                                    border: `1px solid ${colors.foreground4()}`,
                                                                                                    borderRadius: '0.5rem',
                                                                                                    ...layouts.row('start', 'center'),
                                                                                                    children: [
                                                                                                        {
                                                                                                            html: icons.search(),
                                                                                                            width: '1.25rem',
                                                                                                            height: '1.25rem',
                                                                                                            fill: colors.foreground2(),
                                                                                                        },
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
                                                                                                        components.button.iconFlat({
                                                                                                            width: '1.75rem',
                                                                                                            height: '1.75rem',
                                                                                                            padding: '0.25rem',
                                                                                                            icon: icons.close(),
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
                                                                                                            return false;
                                                                                                        }).map((paragraph, index) => ({
                                                                                                            id: `paragraph-${paragraph.id}`,
                                                                                                            width: '100%',
                                                                                                            border: `1px solid ${colors.foreground4(paragraph.color)}`,
                                                                                                            borderRadius: '0.5rem',
                                                                                                            backgroundColor: paragraph.color ? colors.background2(paragraph.color) : colors.background(),
                                                                                                            color: colors.foreground1(paragraph.color),
                                                                                                            ...styles.unselectable(),
                                                                                                            cursor: 'pointer',
                                                                                                            ...handlers.hover({
                                                                                                                backgroundColor: colors.background3(paragraph.color),
                                                                                                            }),
                                                                                                            ...handlers.button(function (event) {
                                                                                                                stack.push({
                                                                                                                    path: '#confirm',
                                                                                                                    config: () => components.modal.closeBackground({
                                                                                                                        child: components.modal.prompt({
                                                                                                                            title: 'Attach Paragraph',
                                                                                                                            description: 'Are you sure?',
                                                                                                                            buttons: [
                                                                                                                                components.button.form({
                                                                                                                                    color: 'blue',
                                                                                                                                    text: 'Attach',
                                                                                                                                    onclick: async function (event) {
                                                                                                                                        let steps = 0;
                                                                                                                                        for (let i = stack.length - 1; i > 0; i--) {
                                                                                                                                            if (stack.at(i).data.noteId) {
                                                                                                                                                break;
                                                                                                                                            }
                                                                                                                                            steps += 1;
                                                                                                                                        }
                                                                                                                                        await stack.pop(steps);
                                                                                                                                        updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                                                                            noteIds: arrayUnion(noteId),
                                                                                                                                        });
                                                                                                                                    }
                                                                                                                                })
                                                                                                                            ]
                                                                                                                        })
                                                                                                                    })
                                                                                                                });
                                                                                                            }),
                                                                                                            ...layouts.column('start', 'start', '1rem'),
                                                                                                            children: [
                                                                                                                paragraph.text ? {
                                                                                                                    width: '100%',
                                                                                                                    padding: '0.5rem 0.5rem 0 0.5rem',
                                                                                                                    whiteSpace: 'pre-wrap',
                                                                                                                    wordBreak: 'break-word',
                                                                                                                    text: paragraph.text
                                                                                                                } : null,
                                                                                                                paragraph.image ? {
                                                                                                                    tag: 'img',
                                                                                                                    width: '100%',
                                                                                                                    src: paragraph.image
                                                                                                                } : null,
                                                                                                                {
                                                                                                                    width: '100%',
                                                                                                                    padding: '0 0.5rem 0.5rem 0.5rem',
                                                                                                                    ...layouts.row('space-between', 'center', '1rem'),
                                                                                                                    children: [
                                                                                                                        {
                                                                                                                            fontSize: '0.875rem',
                                                                                                                            color: colors.foreground3(paragraph.color),
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
                                                })
                                            });
                                        }
                                    }),
                                    components.button.form({
                                        color: 'blue',
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
                                            addDoc(collection(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs'), {
                                                timestamp: Math.floor(Date.now() / 1000),
                                                noteIds: [noteId],
                                                text: await encrypt(key, textEncoder.encode(this.layer.widgets['add-paragraph-input'].domElement.value)),
                                            });
                                            this.layer.widgets['add-paragraph-input'].domElement.value = '';
                                        }
                                    })
                                ]
                            },
                            () => ({
                                id: 'filter-paragraphs',
                                width: '100%',
                                padding: '0 0.25rem 0 0.5rem',
                                border: `1px solid ${colors.foreground4()}`,
                                borderRadius: '0.5rem',
                                ...layouts.row('start', 'center'),
                                children: [
                                    {
                                        html: icons.search(),
                                        width: '1.25rem',
                                        height: '1.25rem',
                                        fill: colors.foreground2(),
                                    },
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
                                    components.button.iconFlat({
                                        width: '1.75rem',
                                        height: '1.75rem',
                                        padding: '0.25rem',
                                        icon: icons.close(),
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
                                                color: colors.foreground1('red'),
                                                text: 'Required'
                                            }),
                                            components.input.textArea({
                                                id: 'edit-paragraph-input',
                                                color: paragraph.color,
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
                                                    components.button.form({
                                                        text: 'Cancel',
                                                        onclick: function (event) {
                                                            editParagraphId = undefined;
                                                            editParagraphValid = undefined;
                                                            editParagraphText = undefined;
                                                            this.layer.widgets['paragraphs'].update();
                                                        }
                                                    }),
                                                    components.button.form({
                                                        color: 'blue',
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
                                                            updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                text: await encrypt(key, textEncoder.encode(this.layer.widgets['edit-paragraph-input'].domElement.value)),
                                                            });
                                                        }
                                                    })
                                                ]
                                            }
                                        ]
                                    } : {
                                        id: `paragraph-${paragraph.id}`,
                                        width: '100%',
                                        border: `1px solid ${colors.foreground4(paragraph.color)}`,
                                        borderRadius: '0.5rem',
                                        backgroundColor: paragraph.color ? colors.background2(paragraph.color) : colors.background(),
                                        color: colors.foreground1(paragraph.color),
                                        ...layouts.column('start', 'start', '1rem'),
                                        children: [
                                            paragraph.text ? {
                                                width: '100%',
                                                padding: '0.5rem 0.5rem 0 0.5rem',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                text: paragraph.text
                                            } : null,
                                            paragraph.image ? {
                                                tag: 'img',
                                                width: '100%',
                                                src: paragraph.image
                                            } : null,
                                            paragraph.noteIds.length > 1 ? {
                                                width: '100%',
                                                padding: '0 0.5rem 0 0.5rem',
                                                ...layouts.column('start', 'start', '0.5rem'),
                                                children: paragraph.noteIds.filter(nid => nid !== noteId).map(nid => components.button.textLink({
                                                    href: `/note/${nid}`,
                                                    text: tree[nid].name,
                                                    onclick: function (event) {
                                                        stack.push(pages.notePage(`/note/${nid}`, nid));
                                                    }
                                                }))
                                            } : null,
                                            {
                                                width: '100%',
                                                padding: '0 0.5rem 0.5rem 0.5rem',
                                                ...layouts.row('space-between', 'center', '1rem'),
                                                children: [
                                                    {
                                                        fontSize: '0.875rem',
                                                        color: colors.foreground3(paragraph.color),
                                                        text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                    },
                                                    {
                                                        ...layouts.row(),
                                                        children: [
                                                            paragraph.text ? components.button.iconFlat({
                                                                color: paragraph.color,
                                                                icon: icons.copy(),
                                                                onclick: function (event) {
                                                                    navigator.clipboard.writeText(paragraph.text);
                                                                }
                                                            }) : null,
                                                            paragraph.text ? components.button.iconFlat({
                                                                color: paragraph.color,
                                                                icon: icons.color(),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#color',
                                                                        config: () => components.modal.closeBackground({
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
                                                                                        children: [null, 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'].map(color => components.button.iconFilled({
                                                                                            color,
                                                                                            width: '3rem',
                                                                                            height: '3rem',
                                                                                            padding: '0.25rem',
                                                                                            borderRadius: '2rem',
                                                                                            icon: icons.circle(),
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
                                                            }) : null,
                                                            paragraph.text ? components.button.iconFlat({
                                                                color: paragraph.color,
                                                                icon: icons.edit(),
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
                                                            }) : null,
                                                            components.button.iconFlat({
                                                                color: paragraph.color,
                                                                icon: icons.delete(),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#delete',
                                                                        config: () => components.modal.closeBackground({
                                                                            child: components.modal.prompt({
                                                                                title: 'Delete',
                                                                                description: paragraph.noteIds.length > 1 ? 'Only removed here — linked copies remain.' : 'You won\'t be able to restore it.',
                                                                                buttons: [
                                                                                    components.button.form({
                                                                                        color: 'red',
                                                                                        text: 'Delete',
                                                                                        onclick: function (event) {
                                                                                            stack.pop();
                                                                                            updateDoc(doc(firebase.firestore, 'notebooks', firebase.auth.currentUser.uid, 'paragraphs', paragraph.id), {
                                                                                                noteIds: arrayRemove(noteId),
                                                                                            });
                                                                                        }
                                                                                    })
                                                                                ]
                                                                            })
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
                                    !filterParagraphQuery && limitParagraphs && paragraphs.length > 32 ? components.button.custom({
                                        width: '100%',
                                        height: '2.5rem',
                                        padding: '0 0.75rem',
                                        backgroundColor: colors.background3(),
                                        hover: {
                                            backgroundColor: colors.background4(),
                                        },
                                        onclick: function (event) {
                                            limitParagraphs = false;
                                            this.layer.widgets['paragraphs'].update();
                                        },
                                        leading: {
                                            fontWeight: 600,
                                            color: colors.foreground2(),
                                            text: 'More'
                                        },
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