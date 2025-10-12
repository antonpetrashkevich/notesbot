import { initializeApp as initializeFirebase } from "firebase/app";
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { addDoc, arrayRemove, arrayUnion, Bytes, CACHE_SIZE_UNLIMITED, collection, deleteDoc, deleteField, doc, getDocs, increment, initializeFirestore, onSnapshot, orderBy, persistentLocalCache, persistentMultipleTabManager, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
import { appName, stack, smallViewport, darkMode, utils, updateMetaTags, updateBodyStyle, startApp, startViewportSizeController, startThemeController } from '/home/n1/projects/xpl_kit/core.js';
import { colors as baseColors, styles as baseStyles, handlers as baseHandlers, layouts as baseLayouts, components as baseComponents, pages as basePages } from '/home/n1/projects/xpl_kit/commons';
import materialFontUrl from './material_symbols_outlined_default.woff2';


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
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        backgroundColor: colors.background(),
        color: colors.foreground1(),
    });
    await utils.loadFont({
        fontFamily: 'material',
        url: materialFontUrl,
        format: 'woff2',
        params: {
            fontWeight: 400
        }
    })

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
    icon: ({ fontSize = '1.25rem', color = colors.foreground2(), ligature } = {}) => ({
        fontFamily: 'material',
        fontSize,
        lineHeight: 1,
        fontWeight: 400,
        color,
        webkitFontFeatureSettings: 'liga',
        webkitFontSmoothing: 'antialiased',
        text: ligature
    }),
    button: {
        ...baseComponents.button,
        formPrimary: ({ color, smallViewportGrow = true, disabled, href, onclick, ligature, text } = {}) => components.button.filledDark({
            minWidth: '6rem',
            height: '2.5rem',
            flexGrow: smallViewportGrow && smallViewport ? 1 : 0,
            flexBasis: smallViewportGrow && smallViewport ? 0 : undefined,
            padding: '0 0.75rem',
            color,
            disabled,
            href,
            onclick,
            child: {
                ...layouts.row('center', 'center', '0.5rem'),
                children: [
                    ligature ? components.icon({
                        color: 'white',
                        ligature
                    }) : null,
                    text ? {
                        fontWeight: 600,
                        color: 'white',
                        whiteSpace: 'nowrap',
                        text
                    } : null
                ]
            },
        }),
        formSecondary: ({ smallViewportGrow = true, disabled, href, onclick, ligature, text } = {}) => components.button.filled({
            minWidth: '6rem',
            height: '2.5rem',
            flexGrow: smallViewportGrow && smallViewport ? 1 : 0,
            flexBasis: smallViewportGrow && smallViewport ? 0 : undefined,
            padding: '0 0.75rem',
            disabled,
            href,
            onclick,
            child: {
                ...layouts.row('center', 'center', '0.5rem'),
                children: [
                    ligature ? components.icon({
                        ligature
                    }) : null,
                    text ? {
                        fontWeight: 600,
                        color: colors.foreground2(),
                        whiteSpace: 'nowrap',
                        text
                    } : null
                ]
            },
        }),
        menu: ({ color, size = 'm', wrap = false, borderRadius = '0.5rem', disabled, href, onclick, oncontextmenu, justifyContent = 'center', ligature, text } = {}) => components.button.flat({
            width: '100%',
            padding: size === 's' ? '0.25rem' : size === 'm' ? '0.5rem' : '0.75rem',
            borderRadius,
            color,
            disabled,
            href,
            onclick,
            oncontextmenu,
            child: {
                width: '100%',
                ...layouts.row(justifyContent, 'center', '0.5rem'),
                children: [
                    ligature ? components.icon({
                        fontSize: size === 's' ? '1rem' : size === 'm' ? '1.25rem' : '1.5rem',
                        color: colors.foreground1(color),
                        ligature
                    }) : null,
                    text ? {
                        minWidth: wrap ? undefined : 0,
                        fontSize: size === 's' ? '0.875rem' : size === 'm' ? '1rem' : '1.125rem',
                        color: colors.foreground1(color),
                        whiteSpace: wrap ? undefined : 'nowrap',
                        overflow: wrap ? undefined : 'hidden',
                        textOverflow: wrap ? undefined : 'ellipsis',
                        text
                    } : null
                ]
            },
        })
    }
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
                    components.button.formSecondary({
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
                    components.button.flat({
                        padding: '0.75rem',
                        onclick: function (event) {
                            stack.replace(pages.loadingPage('', { replaceOnTreeUpdate: true }));
                            signInWithPopup(firebase.auth, new GoogleAuthProvider());
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
                                    components.button.formSecondary({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.button.formPrimary({
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
                                    components.button.formSecondary({
                                        text: 'Log out',
                                        onclick: function (event) {
                                            signOut(firebase.auth);
                                        }
                                    }),
                                    components.button.formPrimary({
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
                            leading: folderId === 'root' ? null : components.button.flat({
                                href: '/',
                                child: components.icon({
                                    ligature: 'home'
                                }),
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
                                            hidePrior: false,
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
                                                                                        trailing: components.button.formPrimary({
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
                                                                    hidePrior: false,
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
                                                                                        components.button.formPrimary({
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
                                                                    hidePrior: false,
                                                                    config: () => components.modal.closeBackground({
                                                                        child: components.modal.prompt({
                                                                            title: tree[cid].type === 'note' ? 'Delete note' : 'Delete folder',
                                                                            description: 'Are you sure?',
                                                                            buttons: [
                                                                                components.button.formPrimary({
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
                                components.button.filled(
                                    {
                                        padding: '0.5rem',
                                        borderRadius: '2rem',
                                        child: components.icon({
                                            fontSize: '2rem',
                                            ligature: 'menu'
                                        }),
                                        onclick: function (event) {
                                            const notebookTimestamp = notebook.timestamp.toMillis();
                                            stack.push({
                                                path: '#menu',
                                                hidePrior: false,
                                                config: () => components.modal.closeBackground({
                                                    child: components.modal.menu({
                                                        buttons: [
                                                            components.button.menu({
                                                                text: 'Theme',
                                                                onclick: function (event) {
                                                                    stack.replace({
                                                                        path: '#theme',
                                                                        hidePrior: false,
                                                                        config: () => components.modal.closeBackground({
                                                                            child: {
                                                                                ...styles.modal(),
                                                                                ...layouts.column('start', 'start', '1rem'),
                                                                                children: [
                                                                                    {
                                                                                        fontWeight: 600,
                                                                                        text: 'Theme'
                                                                                    },
                                                                                    components.input.radioButton({
                                                                                        id: 'theme-system',
                                                                                        value: window.localStorage.getItem('theme') === 'auto',
                                                                                        iconFalse: components.icon({
                                                                                            ligature: 'radio_button_unchecked'
                                                                                        }),
                                                                                        iconTrue: components.icon({
                                                                                            color: colors.foreground1('blue'),
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
                                                                                    components.input.radioButton({
                                                                                        id: 'theme-light',
                                                                                        value: window.localStorage.getItem('theme') === 'light',
                                                                                        iconFalse: components.icon({
                                                                                            ligature: 'radio_button_unchecked'
                                                                                        }),
                                                                                        iconTrue: components.icon({
                                                                                            color: colors.foreground1('blue'),
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
                                                                                    components.input.radioButton({
                                                                                        id: 'theme-dark',
                                                                                        value: window.localStorage.getItem('theme') === 'dark',
                                                                                        iconFalse: components.icon({
                                                                                            ligature: 'radio_button_unchecked'
                                                                                        }),
                                                                                        iconTrue: components.icon({
                                                                                            color: colors.foreground1('blue'),
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
                                                            components.button.menu({
                                                                color: 'red',
                                                                text: 'Delete account',
                                                                onclick: function (event) {
                                                                    stack.replace({
                                                                        path: '#delete',
                                                                        hidePrior: false,
                                                                        config: () => components.modal.closeBackground({
                                                                            child: components.modal.prompt({
                                                                                title: 'Delete account',
                                                                                description: 'Are you sure?',
                                                                                buttons: [
                                                                                    components.button.formPrimary({
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
                                components.button.filled({
                                    color: 'blue',
                                    padding: '0.5rem',
                                    borderRadius: '2rem',
                                    child: components.icon({
                                        fontSize: '2rem',
                                        color: colors.foreground2('blue'),
                                        ligature: 'add_2'
                                    }),
                                    onclick: function (event) {
                                        const notebookTimestamp = notebook.timestamp.toMillis();
                                        stack.push({
                                            path: '#name',
                                            hidePrior: false,
                                            config: () => components.modal.closeBackground({
                                                child: components.modal.menu({
                                                    buttons: [
                                                        components.button.menu({
                                                            text: 'New Folder',
                                                            onclick: function (event) {
                                                                let nameValid = true;
                                                                stack.replace({
                                                                    path: '#newfolder',
                                                                    hidePrior: false,
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
                                                                                        components.button.formPrimary({
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
                                                                    hidePrior: false,
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
                                                                                        components.button.formPrimary({
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
                        leading: components.button.flat({
                            href: '/',
                            child: components.icon({
                                ligature: 'home'
                            }),
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
                                                        hidePrior: false,
                                                        config: () => components.modal.closeBackground({
                                                            child: components.modal.prompt({
                                                                color: 'yellow',
                                                                title: 'Image Upload',
                                                                description: 'Image would be compressed to 1MB jpeg.',
                                                                buttons: [
                                                                    components.button.formPrimary({
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
                                    components.button.formSecondary({
                                        ligature: 'upload',
                                        text: 'Attach',
                                        onclick: function (event) {
                                            stack.push({
                                                path: '#attach',
                                                hidePrior: false,
                                                config: () => components.modal.closeBackground({
                                                    child: components.modal.menu({
                                                        buttons: [
                                                            components.button.menu({
                                                                text: 'Image',
                                                                onclick: async function (event) {
                                                                    await stack.pop();
                                                                    stack.at(-1).widgets['image-input'].domElement.click();
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
                                                                                                        components.button.flat({
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
                                                                                                                    hidePrior: false,
                                                                                                                    config: () => components.modal.closeBackground({
                                                                                                                        child: components.modal.prompt({
                                                                                                                            title: 'Attach Paragraph',
                                                                                                                            description: 'Are you sure?',
                                                                                                                            buttons: [
                                                                                                                                components.button.formPrimary({
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
                                    components.button.formPrimary({
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
                                    components.button.flat({
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
                                                    components.button.formSecondary({
                                                        text: 'Cancel',
                                                        onclick: function (event) {
                                                            editParagraphId = undefined;
                                                            editParagraphValid = undefined;
                                                            editParagraphText = undefined;
                                                            this.layer.widgets['paragraphs'].update();
                                                        }
                                                    }),
                                                    components.button.formPrimary({
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
                                        overflow: 'hidden',
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
                                                            paragraph.text ? components.button.flat({
                                                                color: paragraph.color,
                                                                child: components.icon({
                                                                    color: colors.foreground2(paragraph.color),
                                                                    ligature: 'content_copy',
                                                                }),
                                                                onclick: function (event) {
                                                                    navigator.clipboard.writeText(paragraph.text);
                                                                }
                                                            }) : null,
                                                            paragraph.text ? components.button.flat({
                                                                color: paragraph.color,
                                                                child: components.icon({
                                                                    color: colors.foreground2(paragraph.color),
                                                                    ligature: 'palette',
                                                                }),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#color',
                                                                        hidePrior: false,
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
                                                                                        children: [null, 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'].map(color => components.button.filled({
                                                                                            color,
                                                                                            padding: '0.25rem',
                                                                                            borderRadius: '2rem',
                                                                                            child: components.icon({
                                                                                                fontSize: '2.5rem',
                                                                                                color: colors.foreground2(color),
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
                                                            }) : null,
                                                            paragraph.text ? components.button.flat({
                                                                color: paragraph.color,
                                                                child: components.icon({
                                                                    color: colors.foreground2(paragraph.color),
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
                                                            }) : null,
                                                            components.button.flat({
                                                                color: paragraph.color,
                                                                child: components.icon({
                                                                    color: colors.foreground2(paragraph.color),
                                                                    ligature: 'delete',
                                                                }),
                                                                onclick: function (event) {
                                                                    stack.push({
                                                                        path: '#delete',
                                                                        hidePrior: false,
                                                                        config: () => components.modal.closeBackground({
                                                                            child: components.modal.prompt({
                                                                                title: 'Delete',
                                                                                description: paragraph.noteIds.length > 1 ? 'Linked copies will not be affected.' : 'You won\'t be able to restore it.',
                                                                                buttons: [
                                                                                    components.button.formPrimary({
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
                                    !filterParagraphQuery && limitParagraphs && paragraphs.length > 32 ? components.button.filled({
                                        width: '100%',
                                        height: '2.5rem',
                                        padding: '0 0.75rem',
                                        onclick: function (event) {
                                            limitParagraphs = false;
                                            this.layer.widgets['paragraphs'].update();
                                        },
                                        child: {
                                            fontWeight: 600,
                                            color: colors.foreground2(),
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