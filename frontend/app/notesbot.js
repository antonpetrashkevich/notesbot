import { appName, appState, widgets, pageWidget, colors, updatePage, goTo, startApp, startPathController, setTheme, modalOn, modalOff, widget, templateWidget, row, column, grid, text, textLink, image, svg, canvas, video, youtubeVideo, button, select, input, textArea, base, menu, fixedHeader, hint, notification, imageInput, notFoundPage, generalErrorPage } from '/home/n1/projects/profiler/frontend/apex.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Bytes, collection, doc, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, getDoc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocs, getDocsFromServer, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";


export const icons = {
    add: '<svg viewBox="0 -960 960 960"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>',
    back: '<svg viewBox="0 -960 960 960"><path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z"/></svg>',
    checkBox: '<svg viewBox="0 -960 960 960"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z"/></svg>',
    checkBoxSelected: '<svg viewBox="0 -960 960 960"><path d="m424-312 282-282-56-56-226 226-114-114-56 56 170 170ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>',
    circle: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"/></svg>',
    close: '<svg viewBox="0 -960 960 960"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>',
    color: '<svg viewBox="0 -960 960 960"><path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 32.5-156t88-127Q256-817 330-848.5T488-880q80 0 151 27.5t124.5 76q53.5 48.5 85 115T880-518q0 115-70 176.5T640-280h-74q-9 0-12.5 5t-3.5 11q0 12 15 34.5t15 51.5q0 50-27.5 74T480-80Zm0-400Zm-220 40q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120-160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm200 0q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm120 160q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17ZM480-160q9 0 14.5-5t5.5-13q0-14-15-33t-15-57q0-42 29-67t71-25h70q66 0 113-38.5T800-518q0-121-92.5-201.5T488-800q-136 0-232 93t-96 227q0 133 93.5 226.5T480-160Z"/></svg>',
    copy: '<svg viewBox="0 -960 960 960"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>',
    date: '<svg viewBox="0 -960 960 960"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z"/></svg>',
    done: '<svg viewBox="0 -960 960 960"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    delete: '<svg viewBox="0 -960 960 960"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>',
    edit: '<svg viewBox="0 -960 960 960"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>',
    home: '<svg viewBox="0 -960 960 960"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>',
    menu: '<svg viewBox="0 -960 960 960"><path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"/></svg>',
    more: '<svg viewBox="0 -960 960 960"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>',
    radioButton: '<svg viewBox="0 -960 960 960"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    radioButtonSelected: '<svg viewBox="0 -960 960 960"><path d="M480-280q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680q-83 0-141.5 58.5T280-480q0 83 58.5 141.5T480-280Zm0 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>',
    spinner: '<svg viewBox="0 0 100 100" stroke-width="10"><circle cx="50" cy="50" r="45" stroke-dasharray="270" stroke-dashoffset="90"> <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.75s" repeatCount="indefinite"/></circle></svg>',
    time: '<svg viewBox="0 -960 960 960"><path d="m612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/></svg>',
    up: '<svg viewBox="0 -960 960 960"><path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"/></svg>',
    upload: '<svg viewBox="0 -960 960 960"><path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>',
}
export const lightTheme = {
    '--meta-theme-color': '#ffffff',
    '--font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    '--mono-font-family': 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    '--shadow-1': '0 1px 2px rgba(0, 0, 0, 0.1)',
    '--shadow-2': '0 2px 4px rgba(0, 0, 0, 0.1)',
    '--shadow-3': '0 4px 8px rgba(0, 0, 0, 0.1)',
    '--border': colors.gray[300],
    '--bg': 'white',
    '--header-bg': colors.gray[50],
    '--hover': colors.gray[100],
    '--hover-dark': colors.gray[200],
    '--hover-red': colors.red[100],
    '--fg': colors.gray[900],
    '--fg-accent': colors.gray[950],
    '--fg-secondary': colors.gray[500],
    '--fg-tertiary': colors.gray[400],
    '--fg-quaternary': colors.gray[300],
    '--fg-red': colors.red[500],
    '--button-bg': colors.gray[100],
    '--button-hover': colors.gray[200],
    '--action-button-bg': colors.blue[500],
    '--action-button-hover': colors.blue[600],
    '--action-button-fg': 'white',
    '--action-button-light-bg': colors.blue[400],
    '--action-button-light-hover': colors.blue[500],
    '--action-button-light-fg': colors.blue[900],
    '--danger-button-bg': colors.red[500],
    '--danger-button-hover': colors.red[600],
    '--danger-button-fg': 'white',

    '--panel-red-border': colors.red[300],
    '--panel-red-bg': colors.red[100],
    '--panel-red-hover': colors.red[200],
    '--panel-red-fg': colors.red[700],
    '--panel-red-fg-secondary': colors.red[600],
    '--panel-red-fg-tertiary': colors.red[500],

    '--panel-green-border': colors.green[300],
    '--panel-green-bg': colors.green[100],
    '--panel-green-hover': colors.green[200],
    '--panel-green-fg': colors.green[700],
    '--panel-green-fg-secondary': colors.green[600],
    '--panel-green-fg-tertiary': colors.green[500],

    '--panel-yellow-border': colors.yellow[300],
    '--panel-yellow-bg': colors.yellow[100],
    '--panel-yellow-hover': colors.yellow[200],
    '--panel-yellow-fg': colors.yellow[700],
    '--panel-yellow-fg-secondary': colors.yellow[600],
    '--panel-yellow-fg-tertiary': colors.yellow[500],

    '--panel-blue-border': colors.blue[300],
    '--panel-blue-bg': colors.blue[100],
    '--panel-blue-hover': colors.blue[200],
    '--panel-blue-fg': colors.blue[700],
    '--panel-blue-fg-secondary': colors.blue[600],
    '--panel-blue-fg-tertiary': colors.blue[500],

    '--panel-gray-border': colors.slate[300],
    '--panel-gray-bg': colors.slate[100],
    '--panel-gray-hover': colors.slate[200],
    '--panel-gray-fg': colors.slate[700],
    '--panel-gray-fg-secondary': colors.slate[600],
    '--panel-gray-fg-tertiary': colors.slate[500],
}
export const darkTheme = {
    '--meta-theme-color': '#364153',
    '--font-family': 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    '--mono-font-family': 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    '--shadow-1': '0 1px 2px rgba(255, 255, 255, 0.1)',
    '--shadow-2': '0 2px 4px rgba(255, 255, 255, 0.1)',
    '--shadow-3': '0 4px 8px rgba(255, 255, 255, 0.1)',
    '--border': colors.gray[600],
    '--bg': colors.gray[800],
    '--header-bg': colors.gray[700],
    '--hover': colors.gray[700],
    '--hover-dark': colors.gray[600],
    '--hover-red': colors.red[900],
    '--fg': colors.gray[300],
    '--fg-accent': colors.gray[100],
    '--fg-secondary': colors.gray[400],
    '--fg-tertiary': colors.gray[500],
    '--fg-quaternary': colors.gray[600],
    '--fg-red': colors.red[400],
    '--button-bg': colors.gray[700],
    '--button-hover': colors.gray[600],
    '--action-button-bg': colors.blue[600],
    '--action-button-hover': colors.blue[700],
    '--action-button-fg': 'white',
    '--action-button-light-bg': colors.blue[400],
    '--action-button-light-hover': colors.blue[500],
    '--action-button-light-fg': colors.blue[900],
    '--danger-button-bg': colors.red[700],
    '--danger-button-hover': colors.red[800],
    '--danger-button-fg': 'white',

    '--panel-red-border': colors.red[900],
    '--panel-red-bg': colors.red[950],
    '--panel-red-hover': colors.red[900],
    '--panel-red-fg': colors.red[300],
    '--panel-red-fg-secondary': colors.red[400],
    '--panel-red-fg-tertiary': colors.red[500],

    '--panel-green-border': colors.green[900],
    '--panel-green-bg': colors.green[950],
    '--panel-green-hover': colors.green[900],
    '--panel-green-fg': colors.green[400],
    '--panel-green-fg-secondary': colors.green[500],
    '--panel-green-fg-tertiary': colors.green[600],

    '--panel-yellow-border': colors.yellow[900],
    '--panel-yellow-bg': colors.yellow[950],
    '--panel-yellow-hover': colors.yellow[900],
    '--panel-yellow-fg': colors.yellow[500],
    '--panel-yellow-fg-secondary': colors.yellow[600],
    '--panel-yellow-fg-tertiary': colors.yellow[700],

    '--panel-blue-border': colors.blue[900],
    '--panel-blue-bg': colors.blue[950],
    '--panel-blue-hover': colors.blue[900],
    '--panel-blue-fg': colors.blue[300],
    '--panel-blue-fg-secondary': colors.blue[400],
    '--panel-blue-fg-tertiary': colors.blue[500],

    '--panel-gray-border': colors.slate[700],
    '--panel-gray-bg': colors.slate[900],
    '--panel-gray-hover': colors.slate[600],
    '--panel-gray-fg': colors.slate[300],
    '--panel-gray-fg-secondary': colors.slate[400],
    '--panel-gray-fg-tertiary': colors.slate[500],
}
export const styles = {
    border: {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
    },
    card: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
    },
    pageTitle: {
        fontSize: '2rem',
        fontWeight: 600,
        color: 'var(--fg-accent)',
    },
    hint: {
        normalColor: 'var(--fg-tertiary)',
        errorColor: 'var(--fg-red)',
    },
    button: {
        hoverColor: 'var(--hover)',
        fill: 'var(--fg-secondary)'
    },
    buttonL: {
        height: '2.5rem',
        minWidth: '6rem',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.75rem'
    },
    actionButton: {
        backgroundColor: 'var(--action-button-bg)',
        hoverColor: 'var(--action-button-hover)',
        fontWeight: 600,
        fill: 'var(--action-button-fg)',
        color: 'var(--action-button-fg)',
    },
    actionButtonLight: {
        backgroundColor: 'var(--action-button-light-bg)',
        hoverColor: 'var(--action-button-light-hover)',
        fontWeight: 600,
        fill: 'var(--action-button-light-fg)',
        color: 'var(--action-button-light-fg)',
    },
    actionButtonOptional: {
        backgroundColor: 'var(--button-bg)',
        hoverColor: 'var(--button-hover)',
        fontWeight: 600,
        fill: 'var(--fg-secondary)',
        color: 'var(--fg-secondary)',
    },
    dangerButton: {
        backgroundColor: 'var(--danger-button-bg)',
        hoverColor: 'var(--danger-button-hover)',
        fontWeight: 600,
        color: 'var(--danger-button-fg)',
    },
    menuButton: {
        width: '100%',
        justifyContent: 'center',
        hoverColor: 'var(--hover)',
        fontWeight: 600,
    },
    menuDangerButton: {
        width: '100%',
        justifyContent: 'center',
        hoverColor: 'var(--hover-red)',
        fontWeight: 600,
        color: 'var(--fg-red)',
    },
    menu: {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg)',
        boxShadow: 'var(--shadow-3)'
    },
    menuDanger: {
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--panel-red-border)',
        backgroundColor: 'var(--panel-red-bg)',
        fill: 'var(--panel-red-fg-secondary)',
        color: 'var(--panel-red-fg)',
        boxShadow: 'var(--shadow-3)'
    },
};


async function generateKey(keyphrase, salt) {
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        appState.textEncoder.encode(keyphrase),
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
        if (!appState.tree.hasOwnProperty(result) && appState.orphanNoteIds.indexOf(result) === -1) {
            return result;
        }
    }
}


export function listenNotebook() {
    appState.stopListenNotebook?.();
    appState.stopListenNotebook = onSnapshot(doc(appState.firebase.firestore, 'notebooks', appState.user.uid),
        async (docSnap) => {
            if (!docSnap.exists()) {
                updatePage(setupTutorialPage());
            } else {
                try {
                    const docData = docSnap.data();
                    if (docData.status === 'deleted' && !appState.initialized) {
                        updatePage(setupTutorialPage());
                    } else if (docData.status === 'active' && !window.localStorage.getItem('keyphrase')) {
                        updatePage(keyphrasePage(false));
                    }
                    else if (docData.status === 'active' && window.localStorage.getItem('keyphrase')) {
                        appState.key = await generateKey(window.localStorage.getItem('keyphrase'), docData.salt.toUint8Array());
                        appState.tree = JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.tree.iv.toUint8Array(), docData.tree.data.toUint8Array())));
                        appState.orphanNoteIds = docData.orphanNoteIds;
                        if (!appState.initialized) {
                            appState.initialized = true;
                            startPathController(function pathController(segments, params) {
                                if (segments.length === 2 && segments[0] === 'folder') {
                                    appState.folderId = segments[1];
                                    updatePage(folderPage());
                                }
                                else if (segments.length === 2 && segments[0] === 'note') {
                                    appState.noteId = segments[1];
                                    appState.paragraphs = [];
                                    updatePage(notePage());
                                    listenParagraphs(32);
                                } else {
                                    appState.folderId = 'root';
                                    updatePage(folderPage());
                                }
                            });
                        } else {
                            widgets['folder']?.update();
                        }
                    }
                } catch (error) {
                    if (error instanceof DOMException && error.name === "OperationError") {
                        window.localStorage.removeItem('keyphrase');
                        updatePage(keyphrasePage(true));
                    } else {
                        console.error(error);
                        updatePage(generalErrorPage());
                    }
                }
            }
        },
        (error) => {
            console.error(error);
            updatePage(generalErrorPage());
        });
}


export function listenParagraphs(count) {
    appState.stopListenParagraphs?.();
    appState.paragraphs = [];
    appState.stopListenParagraphs = onSnapshot(query(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), where('noteId', '==', appState.noteId), orderBy('timestamp', 'desc'), limit(count)),
        async (querySnapshot) => {
            appState.paragraphs = [];
            for (const docSnap of querySnapshot.docs) {
                const docData = docSnap.data();
                appState.paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, ...JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.content.iv.toUint8Array(), docData.content.data.toUint8Array()))) });
            }
            widgets['note']?.update();
        },
        (error) => {
            console.error(error);
            updatePage(generalErrorPage());
        }
    );
}


export function loadingPage(color) {
    return {
        widget: row(() => ({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            children: [svg({
                width: '8vh',
                height: '8vh',
                alignSelf: 'center',
                fill: 'none',
                stroke: 'var(--fg-quaternary)',
                svg: '<svg viewBox="0 0 100 100" stroke-width="10"><circle cx="50" cy="50" r="45" stroke-dasharray="270" stroke-dashoffset="90"> <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.75s" repeatCount="indefinite"/></circle></svg>'
            })]
        })),
        meta: { title: `Loading | ${appName}`, description: 'Loading...' }
    };
}


export function loginPage() {
    return {
        widget: row(() => ({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            children: [
                button({
                    alignSelf: 'center',
                    gap: '0.5rem',
                    hoverColor: 'var(--hover)',
                    click: function (event) {
                        signInWithPopup(appState.firebase.auth, new GoogleAuthProvider());
                    },
                    children: [
                        svg({ height: '1.25rem', alignSelf: 'center', svg: '<svg viewBox="0 0 48 48"> <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path> <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path> <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path> <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path> <path fill="none" d="M0 0h48v48H0z"></path></svg>' }),
                        text({ alignSelf: 'center', text: 'Login with Google' })
                    ]
                })
            ]
        })),
        meta: { title: `Login | ${appName}`, description: 'Login page.' }
    };
}


export function setupTutorialPage() {
    return {
        widget: base({
            justifyContent: 'center',
            children: [
                column({
                    ...styles.card,
                    ...styles.border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        text({
                            ...styles.pageTitle,
                            text: 'Keyphrase'
                        }),
                        column({
                            gap: '0.5rem',
                            children: [
                                text({ text: 'Your data is encrypted with a keyphrase using end-to-end encryption. Only you can decrypt it.' }),
                                text({ text: 'Store your keyphrase securely — if it\'s lost, you won\'t be able to recover your data.' }),
                                text({ text: 'Don\'t use easy-to-guess combinations like \'password\', \'12345\' and so on.' }),
                            ]
                        }),
                        row({
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.actionButtonOptional,
                                    ...styles.buttonL,
                                    click: function (event) {
                                        signOut(appState.firebase.auth);
                                    },
                                    text: 'Log out'
                                }),
                                button({
                                    ...styles.actionButton,
                                    ...styles.buttonL,
                                    click: function (event) {
                                        updatePage(setupPage());
                                    },
                                    text: 'Next'
                                })
                            ]
                        })
                    ]
                })
            ]
        }),
        meta: { title: `Setup | ${appName}`, description: 'Setup page.' }
    };
}


export function setupPage() {
    return {
        widget: base({
            justifyContent: 'center',
            children: [
                column({
                    ...styles.card,
                    ...styles.border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        text({
                            ...styles.pageTitle,
                            text: 'Keyphrase'
                        }),
                        column({
                            width: '100%',
                            children: [
                                text({
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                }),
                                hint(() => ({
                                    ...styles.hint,
                                    id: 'keyphrase-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Required'
                                }), true),
                                input({
                                    ...styles.border,
                                    id: 'keyphrase-input',
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    attributes: { type: 'password', maxlength: '64' }
                                }),
                                text({
                                    marginTop: '1rem',
                                    fontWeight: 600,
                                    text: 'Repeat keyphrase'
                                }),
                                hint(() => ({
                                    ...styles.hint,
                                    id: 'keyphrase-repeat-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Invalid'
                                }),
                                    true),
                                input({
                                    ...styles.border,
                                    id: 'keyphrase-repeat-input',
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    attributes: { type: 'password', maxlength: '64' }
                                }),
                            ]
                        }),
                        row({
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.actionButtonOptional,
                                    ...styles.buttonL,
                                    click: function (event) {
                                        updatePage(setupTutorialPage());
                                    },
                                    text: 'Back'
                                }),
                                button({
                                    ...styles.actionButton,
                                    ...styles.buttonL,
                                    click: async function (event) {
                                        widgets['keyphrase-hint'].update(true);
                                        widgets['keyphrase-repeat-hint'].update(true);
                                        if (!widgets['keyphrase-input'].domElement.value) {
                                            widgets['keyphrase-hint'].update(false);
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        if (!widgets['keyphrase-repeat-input'].domElement.value || widgets['keyphrase-input'].domElement.value != widgets['keyphrase-repeat-input'].domElement.value) {
                                            widgets['keyphrase-repeat-hint'].update(false);
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        updatePage(loadingPage());
                                        try {
                                            window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                            const salt = window.crypto.getRandomValues(new Uint8Array(16));
                                            const key = await generateKey(widgets['keyphrase-input'].domElement.value, salt);
                                            const tree = await encrypt(key, appState.textEncoder.encode(JSON.stringify({ root: { name: 'Home', type: 'folder', parent: null, children: [] } })));
                                            const notebookDocRef = doc(appState.firebase.firestore, 'notebooks', appState.user.uid);
                                            const txResult = await runTransaction(appState.firebase.firestore, async (transaction) => {
                                                const notebookDoc = await transaction.get(notebookDocRef);
                                                if (notebookDoc.exists() && notebookDoc.data().status === 'active') {
                                                    throw "User already exists";
                                                } else if (notebookDoc.exists() && notebookDoc.data().status === 'deleted') {
                                                    transaction.update(notebookDocRef, {
                                                        status: 'active',
                                                        salt: Bytes.fromUint8Array(salt),
                                                        tree,
                                                    });
                                                }
                                                else {
                                                    transaction.set(notebookDocRef, {
                                                        status: 'active',
                                                        salt: Bytes.fromUint8Array(salt),
                                                        tree,
                                                        orphanNoteIds: []
                                                    });
                                                }
                                                return true;
                                            });
                                        } catch (error) {
                                            console.error(error);
                                            updatePage(generalErrorPage());
                                        }
                                    },
                                    children: [
                                        text({ text: 'Save' })
                                    ]
                                })
                            ]
                        })
                    ]
                })]
        }),
        meta: { title: `Setup | ${appName}`, description: 'Setup page.' }
    };
}


export function keyphrasePage(invalidAttempt) {
    return {
        widget: base({
            justifyContent: 'center',
            children: [
                column({
                    ...styles.card,
                    ...styles.border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        text({
                            ...styles.pageTitle,
                            text: 'Keyphrase'
                        }),
                        column({
                            width: '100%',
                            justifyContent: 'center',
                            children: [
                                text({
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                }),
                                hint(() => ({
                                    ...styles.hint,
                                    id: 'keyphrase-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Invalid'
                                }), !invalidAttempt),
                                input({
                                    ...styles.border,
                                    id: 'keyphrase-input',
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    attributes: { type: 'password', maxlength: '64' }
                                }),
                            ]
                        }),
                        row({
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.actionButtonOptional,
                                    ...styles.buttonL,
                                    justifyContent: 'center',
                                    click: function (event) {
                                        signOut(appState.firebase.auth);
                                    },
                                    text: 'Log out'
                                }),
                                button({
                                    ...styles.actionButton,
                                    ...styles.buttonL,
                                    justifyContent: 'center',
                                    click: async function (event) {
                                        if (!widgets['keyphrase-input'].domElement.value) {
                                            widgets['keyphrase-hint'].update(false);
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        updatePage(loadingPage());
                                        window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                        listenNotebook();
                                    },
                                    children: [
                                        text({ text: 'Save' })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            ]
        }),
        meta: { title: `Keyphrase | ${appName}`, description: 'Keyphrase page.' }
    };
}


export function folderPage() {
    return {
        widget: base(() => ({
            id: 'folder',
            paddingTop: appState.folderId === 'root' ? undefined : '4rem',
            gap: '1rem',
            children: [
                appState.folderId === 'root' ? null : fixedHeader({
                    width: '100%',
                    padding: '0.5rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--header-bg)',
                    children: [
                        row({
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.button,
                                    hoverColor: 'var(--hover-dark)',
                                    padding: '0.5rem',
                                    click: function (event) {
                                        goTo(`/folder/${appState.tree[appState.folderId].parent}`);
                                    },
                                    children: [
                                        svg({
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            svg: icons.up
                                        })
                                    ]
                                }),
                                text({
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    text: appState.tree[appState.folderId].name
                                })
                            ]
                        })
                    ]
                }),
                ...appState.tree[appState.folderId].children.map(cid => button({
                    width: '100%',
                    padding: '0.75rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '0.5rem',
                    hoverColor: 'var(--hover)',
                    fontSize: '1.125rem',
                    click: function (event) {
                        if (appState.tree[cid]['type'] === 'folder') {
                            goTo(`/folder/${cid}`);
                        } else if (appState.tree[cid]['type'] === 'note') {
                            goTo(`/note/${cid}`);
                        }
                    },
                    contextmenu: function (event) {
                        modalOn(menu({
                            ...styles.menu,
                            children: [
                                appState.tree[appState.folderId].children.indexOf(cid) > 0 ? button({
                                    ...styles.menuButton,
                                    click: async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.tree[appState.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                        });
                                        modalOff();
                                    },
                                    children: [text({
                                        text: 'Move Up'
                                    })]
                                }) : null,
                                appState.tree[appState.folderId].children.indexOf(cid) < appState.tree[appState.folderId].children.length - 1 ? button({
                                    ...styles.menuButton,
                                    click: async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.tree[appState.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                        });
                                        modalOff();
                                    },
                                    children: [text({
                                        text: 'Move Down'
                                    })]
                                }) : null,
                                button({
                                    ...styles.menuButton,
                                    click: function (event) {
                                        event.stopPropagation();
                                        modalOn(menu((value) => ({
                                            ...styles.menu,
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: [
                                                text({
                                                    marginBottom: '0.5rem',
                                                    fontWeight: 600,
                                                    text: 'Move to Folder'
                                                }),
                                                value === 'root' ? null : button({
                                                    width: '100%',
                                                    hoverColor: 'var(--hover)',
                                                    justifyContent: 'start',
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        this.parent.update(appState.tree[value].parent);
                                                    },
                                                    children: [
                                                        text({
                                                            text: '...'
                                                        })
                                                    ]
                                                }),
                                                ...appState.tree[value].children.filter(id => appState.tree[id].type === 'folder').map(id => button({
                                                    width: '100%',
                                                    hoverColor: 'var(--hover)',
                                                    justifyContent: 'start',
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        this.parent.update(id);
                                                    },
                                                    children: [
                                                        text({
                                                            text: appState.tree[id].name
                                                        })
                                                    ]
                                                })),
                                                button({
                                                    ...styles.actionButton,
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    ...styles.buttonL,
                                                    click: async function (event) {
                                                        event.stopPropagation();
                                                        const oldParent = appState.tree[appState.tree[cid].parent];
                                                        const newParent = appState.tree[value];
                                                        oldParent.children = oldParent.children.filter(id => id !== cid);
                                                        newParent.children.push(cid);
                                                        appState.tree[cid].parent = value;
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                        });
                                                        modalOff();
                                                    },
                                                    children: [
                                                        text({
                                                            text: `Move to ${appState.tree[value].name}`
                                                        })
                                                    ]
                                                })
                                            ],
                                        }), 'root'));
                                    },
                                    children: [text({
                                        text: 'Move to Folder'
                                    })]
                                }),
                                button({
                                    ...styles.menuButton,
                                    click: function (event) {
                                        event.stopPropagation();
                                        modalOn(menu({
                                            ...styles.menu,
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: [
                                                text({
                                                    fontWeight: 600,
                                                    text: 'New Name'
                                                }),
                                                hint({
                                                    ...styles.hint,
                                                    id: 'new-folder-name-hint',
                                                    errorText: 'Required'
                                                }, true),
                                                input({
                                                    ...styles.border,
                                                    id: 'new-folder-name-input',
                                                    width: '100%',
                                                    attributes: { type: 'text', maxlength: '64' }
                                                }, appState.tree[cid].name),
                                                button({
                                                    ...styles.actionButton,
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    ...styles.buttonL,
                                                    click: async function (event) {
                                                        event.stopPropagation();
                                                        if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                            widgets['new-folder-name-hint'].update(false);
                                                            return;
                                                        }
                                                        appState.tree[cid]['name'] = widgets['new-folder-name-input'].domElement.value.trim();
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                        });
                                                        modalOff();
                                                    },
                                                    children: [
                                                        text({ text: 'Rename' })
                                                    ]
                                                })
                                            ]
                                        }))
                                    },
                                    children: [text({
                                        text: 'Rename'
                                    })]
                                }),
                                button({
                                    ...styles.menuDangerButton,
                                    click: function (event) {
                                        event.stopPropagation();
                                        if (appState.tree[cid].type === 'note') {
                                            modalOn(menu({
                                                ...styles.menu,
                                                alignItems: 'start',
                                                gap: '0.5rem',
                                                children: [
                                                    text({
                                                        fontWeight: 600,
                                                        text: 'Delete note'
                                                    }),
                                                    text({
                                                        text: 'You won\'t be able to restore it. Consider moving to "Archive" folder'
                                                    }),
                                                    button({
                                                        ...styles.dangerButton,
                                                        marginTop: '0.5rem',
                                                        alignSelf: 'end',
                                                        ...styles.buttonL,
                                                        click: async function (event) {
                                                            event.stopPropagation();
                                                            delete appState.tree[cid];
                                                            appState.tree[appState.folderId].children = appState.tree[appState.folderId].children.filter(id => id !== cid);
                                                            updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                                orphanNoteIds: arrayUnion(cid),
                                                            });
                                                            modalOff();
                                                        },
                                                        children: [
                                                            text({
                                                                text: 'Delete'
                                                            })]
                                                    })
                                                ]
                                            }));
                                        }
                                        else if (appState.tree[cid].type === 'folder' && appState.tree[cid].children.length > 0) {
                                            modalOn(menu({
                                                ...styles.menu,
                                                alignItems: 'start',
                                                gap: '0.5rem',
                                                children: [
                                                    text({
                                                        fontWeight: 600,
                                                        text: 'Delete folder'
                                                    }),
                                                    text({
                                                        text: 'Before deleting, move or delete all the notes and folders inside'
                                                    }),
                                                ]
                                            }))
                                        }
                                        else if (appState.tree[cid].type === 'folder' && appState.tree[cid].children.length === 0) {
                                            modalOn(menu({
                                                ...styles.menu,
                                                alignItems: 'start',
                                                gap: '0.5rem',
                                                children: [
                                                    text({
                                                        fontWeight: 600,
                                                        text: 'Delete folder'
                                                    }),
                                                    text({
                                                        text: 'You won\'t be able to restore it'
                                                    }),
                                                    button({
                                                        ...styles.dangerButton,
                                                        marginTop: '0.5rem',
                                                        alignSelf: 'end',
                                                        ...styles.buttonL,
                                                        click: async function (event) {
                                                            event.stopPropagation();
                                                            delete appState.tree[cid];
                                                            appState.tree[appState.folderId].children = appState.tree[appState.folderId].children.filter(id => id !== cid);
                                                            updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                            });
                                                            modalOff();
                                                        },
                                                        children: [
                                                            text({
                                                                text: 'Delete'
                                                            })]
                                                    })
                                                ]
                                            }))
                                        }
                                    },
                                    children: [text({
                                        text: 'Delete'
                                    })]
                                }),
                            ]
                        }))
                    },
                    children: [
                        text({
                            text: appState.tree[cid]['name']
                        }),
                    ]
                })),
                row({
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    zIndex: 10,
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    children: [
                        button({
                            ...styles.button,
                            margin: '1rem',
                            borderRadius: '2rem',
                            click: function (event) {
                                event.stopPropagation();
                                modalOn(menu({
                                    ...styles.menu,
                                    children: [
                                        button(() => ({
                                            ...styles.menuButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                let theme;
                                                if (window.localStorage.getItem('theme') === 'auto') {
                                                    window.localStorage.setItem('theme', 'light');
                                                    theme = lightTheme;
                                                } else if (window.localStorage.getItem('theme') === 'light') {
                                                    window.localStorage.setItem('theme', 'dark');
                                                    theme = darkTheme;
                                                } else if (window.localStorage.getItem('theme') === 'dark') {
                                                    window.localStorage.setItem('theme', 'auto');
                                                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? darkTheme : lightTheme;
                                                }
                                                setTheme(theme);
                                                this.update();
                                            }, children: [
                                                text({
                                                    text: `Theme: ${window.localStorage.getItem('theme')}`
                                                })
                                            ]
                                        })),
                                        button({
                                            ...styles.menuDangerButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                modalOn(menu({
                                                    ...styles.menu,
                                                    alignItems: 'start',
                                                    gap: '0.5rem',
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'Delete account'
                                                        }),
                                                        text({
                                                            text: 'You won\'t be able to restore it'
                                                        }),
                                                        button({
                                                            ...styles.dangerButton,
                                                            marginTop: '0.5rem',
                                                            ...styles.buttonL,
                                                            alignSelf: 'end',
                                                            click: async function (event) {
                                                                event.stopPropagation();
                                                                updatePage(loadingPage());
                                                                await updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                    status: 'deleted',
                                                                    orphanNoteIds: appState.orphanNoteIds.concat(Object.keys(appState.tree).filter(id => appState.tree[id].type === 'note')),
                                                                });
                                                                signOut(appState.firebase.auth);
                                                            },
                                                            children: [
                                                                text({
                                                                    text: 'Delete'
                                                                })]
                                                        })
                                                    ]
                                                }));
                                            },
                                            children: [text({
                                                text: 'Delete account'
                                            })]
                                        }),
                                        button({
                                            ...styles.menuDangerButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                signOut(appState.firebase.auth);
                                            },
                                            children: [text({
                                                text: 'Log out'
                                            })]
                                        })
                                    ]
                                }))
                            },
                            children: [
                                svg({
                                    width: '2rem',
                                    height: '2rem',
                                    svg: icons.menu
                                })
                            ]
                        }),
                        button({
                            ...styles.actionButtonLight,
                            padding: 0,
                            margin: '1rem',
                            borderRadius: '2rem',
                            click: function (event) {
                                event.stopPropagation();
                                modalOn(menu({
                                    ...styles.menu,
                                    children: [
                                        button({
                                            ...styles.menuButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                modalOn(menu({
                                                    ...styles.menu,
                                                    alignItems: 'start',
                                                    gap: '0.5rem',
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        }),
                                                        hint({
                                                            ...styles.hint,
                                                            id: 'new-folder-name-hint',
                                                            errorText: 'Required'
                                                        }, true),
                                                        input({
                                                            ...styles.border,
                                                            id: 'new-folder-name-input',
                                                            width: '100%',
                                                            attributes: { type: 'text', maxlength: '64' }
                                                        }),
                                                        button({
                                                            ...styles.actionButton,
                                                            marginTop: '0.5rem',
                                                            alignSelf: 'end',
                                                            ...styles.buttonL,
                                                            click: async function (event) {
                                                                event.stopPropagation();
                                                                if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                    widgets['new-folder-name-hint'].update(false);
                                                                    return;
                                                                }
                                                                const newFolderId = generateTreeId();
                                                                appState.tree[newFolderId] = { name: widgets['new-folder-name-input'].domElement.value.trim(), type: 'folder', parent: appState.folderId, children: [] }
                                                                appState.tree[appState.folderId].children.push(newFolderId);
                                                                updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                    tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                                });
                                                                modalOff();
                                                            },
                                                            children: [
                                                                text({ text: 'Create' })
                                                            ]
                                                        })
                                                    ]
                                                }))
                                            },
                                            children: [text({
                                                text: 'New Folder'
                                            })]
                                        }),
                                        button({
                                            ...styles.menuButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                modalOn(menu({
                                                    ...styles.menu,
                                                    alignItems: 'start',
                                                    gap: '0.5rem',
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        }),
                                                        hint({
                                                            ...styles.hint,
                                                            id: 'new-note-name-hint',
                                                            errorText: 'Required'
                                                        }, true),
                                                        input({
                                                            ...styles.border,
                                                            id: 'new-note-name-input',
                                                            width: '100%',
                                                            attributes: { type: 'text', maxlength: '64' }
                                                        }),
                                                        button({
                                                            ...styles.actionButton,
                                                            marginTop: '0.5rem',
                                                            alignSelf: 'end',
                                                            ...styles.buttonL,
                                                            click: async function (event) {
                                                                event.stopPropagation();
                                                                if (!widgets['new-note-name-input'].domElement.value?.trim()) {
                                                                    widgets['new-note-name-hint'].update(false);
                                                                    return;
                                                                }
                                                                const newNoteId = generateTreeId();
                                                                appState.tree[newNoteId] = { name: widgets['new-note-name-input'].domElement.value.trim(), type: 'note', parent: appState.folderId }
                                                                appState.tree[appState.folderId].children.push(newNoteId);
                                                                updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                    tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                                });
                                                                modalOff();
                                                            },
                                                            children: [
                                                                text({ text: 'Create' })
                                                            ]
                                                        })
                                                    ]
                                                }))
                                            },
                                            children: [text({
                                                text: 'New Note'
                                            })]
                                        }),
                                    ]
                                }))
                            },
                            children: [
                                svg({
                                    width: '3rem',
                                    height: '3rem',
                                    svg: icons.add
                                })
                            ]
                        })
                    ]
                })
            ]
        })),
        meta: { title: `${appState.tree[appState.folderId]['name']} | ${appName}`, description: 'Folder page.' }
    };
}


export function notePage() {
    return {
        widget: base(() => ({
            id: 'note',
            paddingTop: '4rem',
            gap: '1rem',
            children: [
                fixedHeader({
                    width: '100%',
                    padding: '0.5rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--header-bg)',
                    children: [
                        row({
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.button,
                                    hoverColor: 'var(--hover-dark)',
                                    padding: '0.5rem',
                                    click: function (event) {
                                        goTo(`/folder/${appState.tree[appState.noteId].parent}`);
                                    },
                                    children: [
                                        svg({
                                            width: '1.5rem',
                                            height: '1.5rem',
                                            svg: icons.up
                                        })
                                    ]
                                }),
                                text({
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                    text: appState.tree[appState.noteId].name
                                })
                            ]
                        })
                    ]
                }),
                hint({
                    ...styles.hint,
                    id: 'add-note-hint',
                    errorText: 'Required'
                }, true),
                textArea({
                    ...styles.border,
                    id: 'add-note-input',
                    width: '100%',
                    attributes: { rows: 8 },
                }),
                row({
                    width: '100%',
                    justifyContent: 'end',
                    gap: '1rem',
                    children: [
                        widget(
                            {
                                id: 'image-input',
                                tag: 'input',
                                display: 'none',
                                attributes: {
                                    type: 'file',
                                    accept: 'image/*'
                                },
                                handlers: {
                                    change: function (event) {
                                        const file = event.target.files[0];
                                        if (file) {
                                            if (file.size > 750 * 1024) {
                                                modalOn(
                                                    menu({
                                                        ...styles.menuDanger,
                                                        alignItems: 'start',
                                                        gap: '0.5rem',
                                                        children: [
                                                            text({
                                                                fontWeight: 600,
                                                                text: 'Image Upload'
                                                            }),
                                                            text({
                                                                text: 'Image size exceeds 750KB'
                                                            })
                                                        ]
                                                    })
                                                )
                                            } else {
                                                const reader = new FileReader();
                                                reader.onload = async function (e) {
                                                    addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                                        timestamp: Math.floor(Date.now() / 1000),
                                                        noteId: appState.noteId,
                                                        content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                                            image: e.target.result,
                                                        }))),
                                                    })
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }
                                    }
                                },
                            }
                        ),
                        button({
                            ...styles.actionButtonOptional,
                            ...styles.buttonL,
                            alignSelf: 'end',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            click: async function (event) {
                                event.stopPropagation();
                                widgets['image-input'].domElement.click();
                            },
                            children: [
                                svg({
                                    width: '1.25rem',
                                    height: '1.25rem',
                                    svg: icons.upload
                                }),
                                text({
                                    text: 'Image'
                                })
                            ]
                        }),
                        button({
                            ...styles.actionButton,
                            alignSelf: 'end',
                            justifyContent: 'center',
                            ...styles.buttonL,
                            click: async function (event) {
                                event.stopPropagation();
                                if (widgets['add-note-input'].domElement.value.trim()) {
                                    widgets['add-note-hint'].update(true);
                                    addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                        timestamp: Math.floor(Date.now() / 1000),
                                        noteId: appState.noteId,
                                        content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                            text: widgets['add-note-input'].domElement.value
                                        }))),
                                    });
                                } else {
                                    widgets['add-note-hint'].update(false);
                                }
                            },
                            children: [
                                text({
                                    text: 'Add'
                                })
                            ]
                        })
                    ]
                }),
                ...appState.paragraphs.map((paragraph, index) => column(function (value) {
                    if (value === 'view') {
                        return {
                            ...styles.card,
                            ...styles.border,
                            width: '100%',
                            gap: '1rem',
                            padding: 0,
                            borderColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--border)' : `var(--panel-${paragraph.color}-border)`,
                            backgroundColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg)' : `var(--panel-${paragraph.color}-bg)`,
                            color: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg)' : `var(--panel-${paragraph.color}-fg)`,
                            overflow: 'hidden',
                            children: [
                                paragraph.text ? text({
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0 0.75rem',
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.5rem',
                                    text: paragraph.text
                                }) : null,
                                paragraph.image ? image({
                                    width: '100%',
                                    src: paragraph.image
                                }) : null,
                                row({
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0 0.75rem 0.75rem 0.75rem',
                                    children: [
                                        text({
                                            fontSize: '0.875rem',
                                            color: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-tertiary)' : `var(--panel-${paragraph.color}-fg-tertiary)`,
                                            text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                        }),
                                        row({
                                            gap: '0.5rem',
                                            children: [
                                                paragraph.text ? button({
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--hover)' : `var(--panel-${paragraph.color}-hover)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-secondary)' : `var(--panel-${paragraph.color}-fg-secondary)`,
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        navigator.clipboard.writeText(paragraph.text);
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            svg: icons.copy
                                                        })
                                                    ]
                                                }) : null,
                                                paragraph.text ? button({
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--hover)' : `var(--panel-${paragraph.color}-hover)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-secondary)' : `var(--panel-${paragraph.color}-fg-secondary)`,
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        modalOn(menu({
                                                            ...styles.menu,
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                text({
                                                                    fontWeight: 600,
                                                                    text: 'Color'
                                                                }),
                                                                ...['default', 'red', 'green', 'yellow', 'blue', 'gray'].map(color => button({
                                                                    ...styles.button,
                                                                    width: '100%',
                                                                    alignItems: 'center',
                                                                    gap: '1rem',
                                                                    click: async function (event) {
                                                                        event.stopPropagation();
                                                                        updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                                            content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                                                                text: paragraph.text,
                                                                                color
                                                                            }))),
                                                                        });
                                                                        modalOff();
                                                                    },
                                                                    children: [
                                                                        svg({
                                                                            width: '1rem',
                                                                            height: '1rem',
                                                                            borderRadius: '2rem',
                                                                            borderWidth: '2px',
                                                                            borderStyle: 'solid',
                                                                            borderColor: color === 'default' ? 'var(--border)' : `var(--panel-${color}-fg)`,
                                                                            fill: color === 'default' ? 'var(--bg)' : `var(--panel-${color}-bg)`,
                                                                            svg: icons.circle
                                                                        }),
                                                                        text({
                                                                            text: color.charAt(0).toUpperCase() + color.slice(1)
                                                                        })
                                                                    ]
                                                                }))
                                                            ]
                                                        }));
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            svg: icons.color
                                                        })
                                                    ]
                                                }) : null,
                                                paragraph.text ? button({
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--hover)' : `var(--panel-${paragraph.color}-hover)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-secondary)' : `var(--panel-${paragraph.color}-fg-secondary)`,
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        this.parent.parent.parent.update('edit');
                                                        widgets[`edit-note-input-${paragraph.id}`].domElement.focus();
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            svg: icons.edit
                                                        })
                                                    ]
                                                }) : null,
                                                button({
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--hover)' : `var(--panel-${paragraph.color}-hover)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-secondary)' : `var(--panel-${paragraph.color}-fg-secondary)`,
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        modalOn(menu({
                                                            ...styles.menu,
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                text({
                                                                    fontWeight: 600,
                                                                    text: 'Delete'
                                                                }),
                                                                text({
                                                                    text: 'You won\'t be able to restore it'
                                                                }),
                                                                button({
                                                                    ...styles.dangerButton,
                                                                    marginTop: '0.5rem',
                                                                    alignSelf: 'end',
                                                                    ...styles.buttonL,
                                                                    click: async function (event) {
                                                                        event.stopPropagation();
                                                                        deleteDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs', paragraph.id));
                                                                        modalOff();
                                                                    },
                                                                    children: [
                                                                        text({
                                                                            text: 'Delete'
                                                                        })]
                                                                })
                                                            ]
                                                        }))
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            svg: icons.delete
                                                        })
                                                    ]
                                                }),
                                            ]
                                        })
                                    ]
                                })
                            ]
                        };
                    } else if (value === 'edit') {
                        return {
                            width: '100%',
                            gap: '1rem',
                            children: [
                                hint({
                                    ...styles.hint,
                                    id: `edit-note-hint-${paragraph.id}`,
                                    errorText: 'Required'
                                }, true),
                                textArea({
                                    ...styles.border,
                                    id: `edit-note-input-${paragraph.id}`,
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--border)' : `var(--panel-${paragraph.color}-border)`,
                                    backgroundColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg)' : `var(--panel-${paragraph.color}-bg)`,
                                    color: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg)' : `var(--panel-${paragraph.color}-fg)`,
                                    attributes: { rows: 8 },
                                }, paragraph.text),
                                row({
                                    width: '100%',
                                    justifyContent: 'end',
                                    gap: '1rem',
                                    children: [
                                        button({
                                            ...styles.actionButtonOptional,
                                            ...styles.buttonL,
                                            justifyContent: 'center',
                                            click: async function (event) {
                                                event.stopPropagation();
                                                this.parent.parent.update('view');
                                            },
                                            children: [
                                                text({
                                                    text: 'Cancel'
                                                })
                                            ]
                                        }),
                                        button({
                                            ...styles.actionButton,
                                            ...styles.buttonL,
                                            justifyContent: 'center',
                                            click: async function (event) {
                                                event.stopPropagation();
                                                if (widgets[`edit-note-input-${paragraph.id}`].domElement.value.trim()) {
                                                    updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                        content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                                            text: widgets[`edit-note-input-${paragraph.id}`].domElement.value
                                                        }))),
                                                    });
                                                } else {
                                                    widgets[`edit-note-hint-${paragraph.id}`].update(false);
                                                }
                                            },
                                            children: [
                                                text({
                                                    text: 'Save'
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }
                    }
                }, 'view')),
                appState.paragraphs.length > 0 && appState.paragraphs.length % 32 === 0 ? button({
                    ...styles.actionButtonOptional,
                    width: '100%',
                    justifyContent: 'center',
                    ...styles.buttonL,
                    click: function (event) {
                        listenParagraphs(appState.paragraphs.length + 32);
                    },
                    children: [
                        text({
                            text: 'More'
                        })
                    ]
                }) : null
            ]
        })),
        meta: { title: `${appState.tree[appState.noteId]['name']} | ${appName}`, description: 'Note page.' }
    };
}