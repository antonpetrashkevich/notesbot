import { appName, appState, widgets, pageWidget, modalWidget, smallViewport, darkMode, startApp, updateStyleProperties, updateMetaTags, updateBodyStyle, updateTheme, updatePage, startPathController, startViewportSizeController, startThemeController, goTo, modalOn, modalOff, row, column, grid, unselectable, button, buttonLink, select, input, textArea } from '/home/n1/projects/profiler/frontend/apex.js';
import { colors, lightTheme, darkTheme, card, border, text, buttons, colored, base, menu, prompt, fixedHeader, notification, switchThemeButton, imageInput, loadingPage, notFoundPage, generalErrorPage } from '/home/n1/projects/profiler/frontend/apex-commons.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Bytes, collection, doc, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, getDoc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocs, getDocsFromServer, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
}

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
        if (!appState.session.tree.hasOwnProperty(result) && appState.session.orphanNoteIds.indexOf(result) === -1) {
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
                    if (docData.status === 'deleted' && !appState.session.initialized) {
                        updatePage(setupTutorialPage());
                    } else if (docData.status === 'active' && !window.localStorage.getItem('keyphrase')) {
                        updatePage(keyphrasePage());
                    }
                    else if (docData.status === 'active' && window.localStorage.getItem('keyphrase')) {
                        appState.key = await generateKey(window.localStorage.getItem('keyphrase'), docData.salt.toUint8Array());
                        appState.session.tree = JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.tree.iv.toUint8Array(), docData.tree.data.toUint8Array())));
                        appState.session.orphanNoteIds = docData.orphanNoteIds;
                        if (!appState.session.initialized) {
                            appState.session.initialized = true;
                            startPathController(function pathController(segments, params) {
                                if (segments.length === 2 && segments[0] === 'folder') {
                                    appState.session.folderId = segments[1];
                                    updatePage(folderPage());
                                }
                                else if (segments.length === 2 && segments[0] === 'note') {
                                    appState.session.noteId = segments[1];
                                    updatePage(notePage());
                                    listenParagraphs();
                                } else {
                                    appState.session.folderId = 'root';
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
                        updatePage(keyphrasePage());
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

export function listenParagraphs() {
    appState.stopListenParagraphs?.();
    appState.page.paragraphs = [];
    appState.stopListenParagraphs = onSnapshot(query(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), where('noteId', '==', appState.session.noteId), orderBy('timestamp', 'desc'), limit(appState.page.paragraphsLimit)),
        async (querySnapshot) => {
            appState.page.paragraphs = [];
            for (const docSnap of querySnapshot.docs) {
                const docData = docSnap.data();
                appState.page.paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, color: docData.color ? appState.textDecoder.decode(await decrypt(appState.key, docData.color.iv.toUint8Array(), docData.color.data.toUint8Array())) : undefined, text: docData.text ? appState.textDecoder.decode(await decrypt(appState.key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())) : undefined, image: docData.image ? URL.createObjectURL(new Blob([await decrypt(appState.key, docData.image.content.iv.toUint8Array(), docData.image.content.data.toUint8Array())], { type: docData.image.type })) : undefined });
            }
            appState.page.paragraphsAllFetched = appState.page.paragraphs.length < appState.page.paragraphsLimit;
            widgets['note']?.update(['add-paragraph-input', 'edit-paragraph']);
        },
        (error) => {
            console.error(error);
            updatePage(generalErrorPage());
        }
    );
}

export function loginPage() {
    return {
        meta: {
            title: `Login | ${appName}`,
            description: 'Login page.'
        },
        config: {
            ...row,
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            children: [
                {
                    ...button(function (event) {
                        signInWithPopup(appState.firebase.auth, new GoogleAuthProvider());
                    }),
                    ...buttons.l,
                    ...buttons.flat,
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
        },
    };
}

export function setupTutorialPage() {
    return {
        meta: {
            title: `Setup | ${appName}`,
            description: 'Setup page.'
        },
        config: {
            ...base,
            justifyContent: 'center',
            children: [
                {
                    ...column,
                    ...card,
                    ...border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...text.h2,
                            text: 'Keyphrase'
                        },
                        {
                            ...column,
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
                                    ...button(function (event) {
                                        signOut(appState.firebase.auth);
                                    }),
                                    ...buttons.l,
                                    ...buttons.filledLight,
                                    fontWeight: 600,
                                    text: 'Log out'
                                },
                                {
                                    ...button(function (event) {
                                        updatePage(setupPage());
                                    }),
                                    ...buttons.l,
                                    ...colored('blue').buttons.filledDark,
                                    fontWeight: 600,
                                    text: 'Next'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
    };
}

export function setupPage() {
    appState.page = {
        keyphraseValid: true,
        keyphraseRepeatValid: true,
    };
    return {
        meta: {
            title: `Setup | ${appName}`,
            description: 'Setup page.'
        },
        config: {
            ...base,
            justifyContent: 'center',
            children: [
                {
                    ...column,
                    ...card,
                    ...border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...text.h2,
                            text: 'Keyphrase'
                        },
                        {
                            ...column,
                            width: '100%',
                            children: [
                                {
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                },
                                {
                                    id: 'keyphrase-hint',
                                    ...text.aux,
                                    display: () => appState.page.keyphraseValid ? 'none' : 'block',
                                    marginTop: '0.5rem',
                                    fontWeight: 500,
                                    color: colors.red[500],
                                    text: 'Required'
                                },
                                {
                                    id: 'keyphrase-input',
                                    ...input,
                                    ...border,
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
                                {
                                    id: 'keyphrase-repeat-hint',
                                    ...text.aux,
                                    display: () => appState.page.keyphraseRepeatValid ? 'none' : 'block',
                                    marginTop: '0.5rem',
                                    fontWeight: 500,
                                    color: colors.red[500],
                                    text: 'Invalid'
                                },
                                {
                                    id: 'keyphrase-repeat-input',
                                    ...input,
                                    ...border,
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
                                    ...button(function (event) {
                                        updatePage(setupTutorialPage());
                                    }),
                                    ...buttons.l,
                                    ...buttons.filledLight,
                                    fontWeight: 600,
                                    text: 'Back'
                                },
                                {
                                    ...button(async function (event) {
                                        appState.page.keyphraseValid = true;
                                        appState.page.keyphraseRepeatValid = true;
                                        widgets['keyphrase-hint'].update(true);
                                        widgets['keyphrase-repeat-hint'].update(true);
                                        if (!widgets['keyphrase-input'].domElement.value) {
                                            appState.page.keyphraseValid = true;
                                        }
                                        else if (!widgets['keyphrase-repeat-input'].domElement.value || widgets['keyphrase-input'].domElement.value != widgets['keyphrase-repeat-input'].domElement.value) {
                                            appState.page.keyphraseRepeatValid = true;
                                        }
                                        widgets['keyphrase-hint'].update();
                                        widgets['keyphrase-repeat-hint'].update();
                                        if (!appState.page.keyphraseValid || !appState.page.keyphraseRepeatValid) {
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        const keyphrase = widgets['keyphrase-input'].domElement.value;
                                        updatePage(loadingPage());
                                        try {
                                            window.localStorage.setItem('keyphrase', keyphrase);
                                            const salt = window.crypto.getRandomValues(new Uint8Array(16));
                                            const key = await generateKey(keyphrase, salt);
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
                                    }),
                                    ...buttons.l,
                                    ...colored('blue').buttons.filledDark,
                                    fontWeight: 600,
                                    text: 'Save'
                                }
                            ]
                        }
                    ]
                }]
        },
    };
}

export function keyphrasePage() {
    appState.page = {
        keyphraseValid: true,
    };
    return {
        meta: {
            title: `Keyphrase | ${appName}`,
            description: 'Keyphrase page.'
        },
        config: {
            ...base,
            justifyContent: 'center',
            children: [
                {
                    ...column,
                    ...card,
                    ...border,
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...text.h2,
                            text: 'Keyphrase'
                        },
                        {
                            ...column,
                            width: '100%',
                            justifyContent: 'center',
                            children: [
                                {
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                },
                                {
                                    id: 'keyphrase-hint',
                                    ...text.aux,
                                    display: () => appState.page.keyphraseValid ? 'none' : 'block',
                                    marginTop: '0.5rem',
                                    fontWeight: 500,
                                    color: colors.red[500],
                                    text: 'Invalid'
                                },
                                {
                                    id: 'keyphrase-input',
                                    ...input,
                                    ...border,
                                    width: '100%',
                                    marginTop: '0.5rem',
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
                                    ...button(function (event) {
                                        signOut(appState.firebase.auth);
                                    }),
                                    ...buttons.l,
                                    ...buttons.filledLight,
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    text: 'Log out'
                                },
                                {
                                    ...button(async function (event) {
                                        appState.page.keyphraseValid = true;
                                        if (!widgets['keyphrase-input'].domElement.value) {
                                            appState.page.keyphraseValid = false;
                                        }
                                        widgets['keyphrase-hint'].update();
                                        if (!appState.page.keyphraseValid) {
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                        updatePage(loadingPage());
                                        listenNotebook();
                                    }),
                                    ...buttons.l,
                                    ...colored('blue').buttons.filledDark,
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    text: 'Save',
                                }
                            ]
                        }
                    ]
                }
            ]
        },
    };
}

export function folderPage() {
    appState.page = {
        nameValid: true,
        moveToFolderId: undefined,
    };
    return {
        meta: {
            title: `${appState.session.tree[appState.session.folderId]['name']} | ${appName}`,
            description: 'Folder page.'
        },
        config: {
            id: 'folder',
            ...base,
            justifyContent: 'center',
            gap: '1rem',
            paddingTop: () => appState.session.folderId === 'root' ? undefined : '4rem',
            children: () => [
                appState.session.folderId === 'root' ? null : {
                    ...fixedHeader,
                    children: [
                        {
                            ...row,
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        goTo(`/folder/${appState.session.tree[appState.session.folderId].parent}`);
                                    }),
                                    ...buttons.m,
                                    ...buttons.flat,
                                    children: [
                                        {
                                            html: icons.up,
                                            width: '1.25rem',
                                            height: '1.25rem',
                                        }
                                    ]
                                },
                                {
                                    ...text.h5,
                                    text: appState.session.tree[appState.session.folderId].name
                                }
                            ]
                        }
                    ]
                },
                ...appState.session.tree[appState.session.folderId].children.map(cid => ({
                    ...button(function (event) {
                        if (appState.session.tree[cid]['type'] === 'folder') {
                            goTo(`/folder/${cid}`);
                        } else if (appState.session.tree[cid]['type'] === 'note') {
                            goTo(`/note/${cid}`);
                        }
                    }, function (event) {
                        modalOn({
                            ...menu,
                            children: [
                                appState.session.tree[appState.session.folderId].children.indexOf(cid) > 0 ? {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.session.tree[appState.session.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                        });
                                        modalOff();
                                    }),
                                    ...buttons.mFullWidth,
                                    ...buttons.flat,
                                    text: 'Move Up'
                                } : null,
                                appState.session.tree[appState.session.folderId].children.indexOf(cid) < appState.session.tree[appState.session.folderId].children.length - 1 ? {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.session.tree[appState.session.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                        });
                                        modalOff();
                                    }),
                                    ...buttons.mFullWidth,
                                    ...buttons.flat,
                                    text: 'Move Down'
                                } : null,
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        appState.page.moveToFolderId = 'root';
                                        modalOn({
                                            ...menu,
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: () => [
                                                {
                                                    marginBottom: '0.5rem',
                                                    fontWeight: 600,
                                                    text: 'Move to Folder'
                                                },
                                                appState.page.moveToFolderId === 'root' ? null : {
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        appState.page.moveToFolderId = appState.session.tree[appState.page.moveToFolderId].parent;
                                                        this.parent.update();
                                                    }),
                                                    ...buttons.mFullWidth,
                                                    ...buttons.flat,
                                                    text: '...'
                                                },
                                                ...appState.session.tree[appState.page.moveToFolderId].children.filter(id => appState.session.tree[id].type === 'folder').map(id => ({
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        appState.page.moveToFolderId = id;
                                                        this.parent.update();
                                                    }),
                                                    ...buttons.mFullWidth,
                                                    ...buttons.flat,
                                                    text: appState.session.tree[id].name
                                                })),
                                                {
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        const oldParent = appState.session.tree[appState.session.tree[cid].parent];
                                                        const newParent = appState.session.tree[appState.page.moveToFolderId];
                                                        oldParent.children = oldParent.children.filter(id => id !== cid);
                                                        newParent.children.push(cid);
                                                        appState.session.tree[cid].parent = appState.page.moveToFolderId;
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                        });
                                                        modalOff();
                                                    }),
                                                    ...buttons.l,
                                                    ...colored('blue').buttons.filledDark,
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    fontWeight: 600,
                                                    text: `Move to ${appState.session.tree[appState.page.moveToFolderId].name}`
                                                }
                                            ],
                                        });
                                    }),
                                    ...buttons.mFullWidth,
                                    ...buttons.flat,
                                    text: 'Move to Folder'
                                },
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        appState.page.nameValid = true;
                                        modalOn({
                                            ...menu,
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: [
                                                {
                                                    fontWeight: 600,
                                                    text: 'New Name'
                                                },
                                                {
                                                    id: 'new-folder-name-hint',
                                                    ...text.aux,
                                                    display: () => appState.page.nameValid ? 'none' : 'block',
                                                    fontWeight: 500,
                                                    color: colors.red[500],
                                                    text: 'Required'
                                                },
                                                {
                                                    id: 'new-folder-name-input',
                                                    ...input,
                                                    ...border,
                                                    width: '100%',
                                                    type: 'text',
                                                    maxlength: '64',
                                                    value: appState.session.tree[cid].name
                                                },
                                                {
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        appState.page.nameValid = true;
                                                        if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                            appState.page.nameValid = false;
                                                        }
                                                        widgets['new-folder-name-hint'].update();
                                                        if (!appState.page.nameValid) {
                                                            return;
                                                        }
                                                        appState.session.tree[cid]['name'] = widgets['new-folder-name-input'].domElement.value.trim();
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                        });
                                                        modalOff();
                                                    }),
                                                    ...buttons.l,
                                                    ...colored('blue').buttons.filledDark,
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    fontWeight: 600,
                                                    text: 'Rename'
                                                }
                                            ]
                                        })
                                    }),
                                    ...buttons.mFullWidth,
                                    ...buttons.flat,
                                    text: 'Rename'
                                },
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        if (appState.session.tree[cid].type === 'note') {
                                            modalOn({
                                                ...prompt('Delete note', 'You won\'t be able to restore it. Consider moving to "Archive" folder', [
                                                    {
                                                        ...button(async function (event) {
                                                            event.stopPropagation();
                                                            delete appState.session.tree[cid];
                                                            appState.session.tree[appState.session.folderId].children = appState.session.tree[appState.session.folderId].children.filter(id => id !== cid);
                                                            updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                                orphanNoteIds: arrayUnion(cid),
                                                            });
                                                            modalOff();
                                                        }),
                                                        ...buttons.l,
                                                        ...colored('red').buttons.filledDark,
                                                        fontWeight: 600,
                                                        text: 'Delete'
                                                    }
                                                ]),
                                            });
                                        }
                                        else if (appState.session.tree[cid].type === 'folder' && appState.session.tree[cid].children.length > 0) {
                                            modalOn({
                                                ...prompt('Delete folder', 'Before deleting, move or delete all the notes and folders inside'),
                                                ...colored('red').panel,
                                            })
                                        }
                                        else if (appState.session.tree[cid].type === 'folder' && appState.session.tree[cid].children.length === 0) {
                                            modalOn({
                                                ...prompt('Delete folder', 'You won\'t be able to restore it', [{
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        delete appState.session.tree[cid];
                                                        appState.session.tree[appState.session.folderId].children = appState.session.tree[appState.session.folderId].children.filter(id => id !== cid);
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                        });
                                                        modalOff();
                                                    }),
                                                    ...buttons.l,
                                                    ...colored('red').buttons.filledDark,
                                                    fontWeight: 600,
                                                    text: 'Delete'
                                                }]),
                                            })
                                        }
                                    }),
                                    ...buttons.mFullWidth,
                                    ...colored('red').buttons.flat,
                                    text: 'Delete'
                                },
                            ]
                        })
                    }),
                    ...buttons.flat,
                    width: '100%',
                    padding: '1rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '0.5rem',
                    fontSize: '1.125rem',
                    children: [
                        { text: appState.session.tree[cid]['name'] },
                    ]
                })),
                {
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    zIndex: 10,
                    ...button(function (event) {
                        event.stopPropagation();
                        modalOn({
                            ...menu,
                            children: [
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        modalOn({
                                            ...prompt('Delete account', 'You won\'t be able to restore it', [
                                                {
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        updatePage(loadingPage());
                                                        await updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            status: 'deleted',
                                                            orphanNoteIds: appState.session.orphanNoteIds.concat(Object.keys(appState.session.tree).filter(id => appState.session.tree[id].type === 'note')),
                                                        });
                                                        signOut(appState.firebase.auth);
                                                    }),
                                                    ...buttons.l,
                                                    ...colored('red').buttons.filledDark,
                                                    fontWeight: 600,
                                                    text: 'Delete'
                                                }
                                            ]),
                                        });
                                    }),
                                    ...buttons.mFullWidth,
                                    ...colored('red').buttons.flat,
                                    text: 'Delete account'
                                },
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        signOut(appState.firebase.auth);
                                    }),
                                    ...buttons.mFullWidth,
                                    ...colored('red').buttons.flat,
                                    text: 'Log out'
                                }
                            ]
                        })
                    }),
                    ...buttons.m,
                    ...buttons.filledLight,
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
                    ...column,
                    position: 'fixed',
                    bottom: 0,
                    right: 0,
                    zIndex: 10,
                    margin: '1rem',
                    gap: '1rem',
                    children: [
                        switchThemeButton,
                        {
                            ...button(function (event) {
                                event.stopPropagation();
                                modalOn({
                                    ...menu,
                                    children: [
                                        {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                appState.page.nameValid = true;
                                                modalOn({
                                                    ...menu,
                                                    alignItems: 'start',
                                                    gap: '0.5rem',
                                                    children: [
                                                        {
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        },
                                                        {
                                                            id: 'new-folder-name-hint',
                                                            ...text.aux,
                                                            display: () => appState.page.nameValid ? 'none' : 'block',
                                                            fontWeight: 500,
                                                            color: colors.red[500],
                                                            text: 'Required'
                                                        },
                                                        {
                                                            id: 'new-folder-name-input',
                                                            ...input,
                                                            ...border,
                                                            width: '100%',
                                                            type: 'text',
                                                            maxlength: '64'
                                                        },
                                                        {
                                                            ...button(async function (event) {
                                                                event.stopPropagation();
                                                                appState.page.nameValid = true;
                                                                if (!widgets['new-folder-name-input'].domElement.value?.trim()) {
                                                                    appState.page.nameValid = true;
                                                                }
                                                                widgets['new-folder-name-hint'].update();
                                                                if (!appState.page.nameValid) {
                                                                    return;
                                                                }
                                                                const newFolderId = generateTreeId();
                                                                appState.session.tree[newFolderId] = { name: widgets['new-folder-name-input'].domElement.value.trim(), type: 'folder', parent: appState.session.folderId, children: [] }
                                                                appState.session.tree[appState.session.folderId].children.push(newFolderId);
                                                                updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                    tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                                });
                                                                modalOff();
                                                            }),
                                                            ...buttons.l,
                                                            ...colored('blue').buttons.filledDark,
                                                            marginTop: '0.5rem',
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
                                                            text: 'Create'
                                                        }
                                                    ]
                                                })
                                            }),
                                            ...buttons.mFullWidth,
                                            ...buttons.flat,
                                            text: 'New Folder'
                                        },
                                        {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                appState.page.nameValid = true;
                                                modalOn({
                                                    ...menu,
                                                    alignItems: 'start',
                                                    gap: '0.5rem',
                                                    children: [
                                                        {
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        },
                                                        {
                                                            id: 'new-note-name-hint',
                                                            ...text.aux,
                                                            display: () => appState.page.nameValid ? 'none' : 'block',
                                                            fontWeight: 500,
                                                            color: colors.red[500],
                                                            text: 'Required'
                                                        },
                                                        {
                                                            id: 'new-note-name-input',
                                                            ...input,
                                                            ...border,
                                                            width: '100%',
                                                            type: 'text',
                                                            maxlength: '64'
                                                        },
                                                        {
                                                            ...button(async function (event) {
                                                                event.stopPropagation();
                                                                appState.page.nameValid = true;
                                                                if (!widgets['new-note-name-input'].domElement.value?.trim()) {
                                                                    appState.page.nameValid = false;
                                                                }
                                                                widgets['new-note-name-hint'].update();
                                                                if (!appState.page.nameValid) {
                                                                    return;
                                                                }
                                                                const newNoteId = generateTreeId();
                                                                appState.session.tree[newNoteId] = { name: widgets['new-note-name-input'].domElement.value.trim(), type: 'note', parent: appState.session.folderId }
                                                                appState.session.tree[appState.session.folderId].children.push(newNoteId);
                                                                updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                    tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.session.tree))),
                                                                });
                                                                modalOff();
                                                            }),
                                                            ...buttons.l,
                                                            ...colored('blue').buttons.filledDark,
                                                            marginTop: '0.5rem',
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
                                                            text: 'Create'
                                                        }
                                                    ]
                                                })
                                            }),
                                            ...buttons.mFullWidth,
                                            ...buttons.flat,
                                            text: 'New Note'
                                        },
                                    ]
                                })
                            }),
                            ...colored('blue').buttons.filledDark,
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
        },
    };
}

export function notePage() {
    appState.page = {
        paragraphsLimit: 32,
        paragraphsAllFetched: true,
        paragraphs: [],
        addParagraphValid: true,
        editParagraphId: undefined,
        editParagraphValid: undefined,
    }
    return {
        meta: {
            title: `${appState.session.tree[appState.session.noteId]['name']} | ${appName}`,
            description: 'Note page.'
        },
        config: {
            id: 'note',
            ...base,
            paddingTop: '4.5rem',
            gap: '1rem',
            children: () => [
                {
                    ...fixedHeader,
                    children: [
                        {
                            ...row,
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        goTo(`/folder/${appState.session.tree[appState.session.noteId].parent}`);
                                    }),
                                    ...buttons.m,
                                    ...buttons.flat,
                                    children: [
                                        {
                                            html: icons.up,
                                            width: '1.25rem',
                                            height: '1.25rem',
                                        }
                                    ]
                                },
                                {
                                    ...text.h5,
                                    text: appState.session.tree[appState.session.noteId].name
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'add-paragraph-hint',
                    ...text.aux,
                    display: () => appState.page.addParagraphValid ? 'none' : 'block',
                    fontWeight: 500,
                    color: colors.red[500],
                    text: 'Required'
                },
                {
                    id: 'add-paragraph-input',
                    ...textArea,
                    ...border,
                    width: '100%',
                    rows: 8
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
                                                ...prompt('Image Upload', 'Image would be compressed to 1MB jpeg', [
                                                    {
                                                        ...button(function (event) {
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
                                                                                        addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                                                                            timestamp: Math.floor(Date.now() / 1000),
                                                                                            noteId: appState.session.noteId,
                                                                                            image: {
                                                                                                type: 'image/jpeg',
                                                                                                content: await encrypt(appState.key, e.target.result)
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
                                                        ...buttons.l,
                                                        ...colored('yellow').buttons.filledDark,
                                                        fontWeight: 600,
                                                        text: 'OK'
                                                    }
                                                ]),
                                                ...colored('yellow').panel,
                                            }
                                        )
                                    } else {
                                        const reader = new FileReader();
                                        reader.onload = async function (e) {
                                            addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                                timestamp: Math.floor(Date.now() / 1000),
                                                noteId: appState.session.noteId,
                                                image: {
                                                    type: file.type,
                                                    content: await encrypt(appState.key, e.target.result)
                                                },
                                            })
                                        };
                                        reader.readAsArrayBuffer(file);
                                    }
                                }
                            }
                        },
                        {
                            ...button(async function (event) {
                                event.stopPropagation();
                                widgets['image-input'].domElement.click();
                            }),
                            ...buttons.l,
                            ...buttons.filledLight,
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
                            ...button(async function (event) {
                                event.stopPropagation();
                                appState.page.addParagraphValid = true;
                                if (!widgets['add-paragraph-input'].domElement.value.trim()) {
                                    appState.page.addParagraphValid = false;
                                }
                                widgets['add-paragraph-hint'].update();
                                if (!appState.page.addParagraphValid) {
                                    return;
                                }
                                addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                    timestamp: Math.floor(Date.now() / 1000),
                                    noteId: appState.session.noteId,
                                    text: await encrypt(appState.key, appState.textEncoder.encode(widgets['add-paragraph-input'].domElement.value)),
                                });
                                widgets['add-paragraph-input'].update();
                            }),
                            ...buttons.l,
                            ...colored('blue').buttons.filledDark,
                            fontWeight: 600,
                            text: 'Add'
                        }
                    ]
                },
                ...appState.page.paragraphs.map((paragraph, index) => paragraph.id === appState.page.editParagraphId ? {
                    id: 'edit-paragraph',
                    ...column,
                    width: '100%',
                    gap: '1rem',
                    children: [
                        {
                            id: 'edit-paragraph-hint',
                            display: () => appState.page.editParagraphValid ? 'none' : 'block',
                            ...text.aux,
                            fontWeight: 500,
                            color: colors.red[500],
                            text: 'Required'
                        },
                        {
                            id: 'edit-paragraph-input',
                            ...textArea,
                            ...border,
                            ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).panel : {}),
                            width: '100%',
                            padding: '0.75rem',
                            rows: 8,
                            text: paragraph.text
                        },
                        {
                            ...row,
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        appState.page.editParagraphId = undefined;
                                        widgets['note'].update(['add-paragraph-input']);
                                    }),
                                    ...buttons.l,
                                    ...buttons.filledLight,
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    text: 'Cancel'
                                },
                                {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        appState.page.editParagraphValid = true;
                                        if (!widgets['edit-paragraph-input'].domElement.value.trim()) {
                                            appState.page.editParagraphValid = false;
                                        }
                                        widgets['edit-paragraph-hint'].update();
                                        if (!appState.page.editParagraphValid) {
                                            return;
                                        }
                                        appState.page.editParagraphId = undefined;
                                        updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                            text: await encrypt(appState.key, appState.textEncoder.encode(widgets['edit-paragraph-input'].domElement.value)),
                                        });
                                    }),
                                    ...buttons.l,
                                    ...colored('blue').buttons.filledDark,
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    text: 'Save'
                                }
                            ]
                        }
                    ]
                } : {
                    id: `paragraph-${paragraph.id}`,
                    ...column,
                    ...card,
                    ...border,
                    ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).panel : {}),
                    width: '100%',
                    gap: '1rem',
                    padding: 0,
                    overflow: 'hidden',
                    children: [
                        paragraph.text ? {
                            width: '100%',
                            padding: '0.75rem 0.75rem 0 0.75rem',
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.5rem',
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
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0 0.75rem 0.75rem 0.75rem',
                            children: [
                                {
                                    ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).text.aux : text.aux),
                                    text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                },
                                {
                                    ...row,
                                    gap: '0.5rem',
                                    children: [
                                        paragraph.text ? {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                navigator.clipboard.writeText(paragraph.text);
                                            }),
                                            ...buttons.m,
                                            ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).buttons.flat : { ...buttons.flat, fill: 'var(--fg-2)' }),
                                            children: [
                                                {
                                                    html: icons.copy,
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                }
                                            ]
                                        } : null,
                                        paragraph.text ? {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                modalOn({
                                                    ...menu,
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
                                                                ...button(async function (event) {
                                                                    event.stopPropagation();
                                                                    updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                                        color: await encrypt(appState.key, appState.textEncoder.encode(color)),
                                                                    });
                                                                    modalOff();
                                                                }),
                                                                width: '3rem',
                                                                height: '3rem',
                                                                ...buttons.flat,
                                                                children: [
                                                                    {
                                                                        width: '1.75rem',
                                                                        height: '1.75rem',
                                                                        borderRadius: '2rem',
                                                                        borderWidth: '4px',
                                                                        borderStyle: 'solid',
                                                                        borderColor: () => color === 'default' ? 'var(--fg-1)' : colors[color][500],
                                                                        backgroundColor: () => color === 'default' ? 'var(--background-color)' : colors[color][darkMode ? 900 : 100],
                                                                    },
                                                                ]
                                                            }))
                                                        }
                                                    ]
                                                });
                                            }),
                                            ...buttons.m,
                                            ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).buttons.flat : { ...buttons.flat, fill: 'var(--fg-2)' }),
                                            children: [
                                                {
                                                    html: icons.color,
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                }
                                            ]
                                        } : null,
                                        paragraph.text ? {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                if (!appState.page.editParagraphId) {
                                                    appState.page.editParagraphId = paragraph.id;
                                                    appState.page.editParagraphValid = true;
                                                    widgets['note'].update(['add-paragraph-input']);
                                                    // widgets['edit-paragraph-input'].domElement.focus();
                                                }
                                            }),
                                            ...buttons.m,
                                            ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).buttons.flat : { ...buttons.flat, fill: 'var(--fg-2)' }),
                                            ...(appState.page.editParagraphId ? buttons.disabled : {}),
                                            children: [
                                                {
                                                    html: icons.edit,
                                                    width: '1.25rem',
                                                    height: '1.25rem',
                                                }
                                            ]
                                        } : null,
                                        {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                modalOn({
                                                    ...prompt('Delete', 'You won\'t be able to restore it', [{
                                                        ...button(async function (event) {
                                                            event.stopPropagation();
                                                            deleteDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs', paragraph.id));
                                                            modalOff();
                                                        }),
                                                        ...buttons.l,
                                                        ...colored('red').buttons.filledDark,
                                                        fontWeight: 600,
                                                        text: 'Delete'
                                                    }]),
                                                })
                                            }),
                                            ...buttons.m,
                                            ...(paragraph.color && paragraph.color !== 'default' ? colored(paragraph.color).buttons.flat : { ...buttons.flat, fill: 'var(--fg-2)' }),
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
                appState.page.paragraphsAllFetched ? null : {
                    ...button(function (event) {
                        appState.page.paragraphsLimit += 32;
                        listenParagraphs();
                    }),
                    ...buttons.lFullWidth,
                    ...buttons.filledLight,
                    justifyContent: 'center',
                    fontWeight: 600,
                    text: 'More'
                }
            ]
        },
    };
}