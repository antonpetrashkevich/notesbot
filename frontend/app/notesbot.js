import { appName, appState, widgets, pageWidget, updateStyleProperties, updateMetaTags, updateTheme, updateBodyStyle, updatePage, goTo, startApp, startPathController, modalOn, modalOff, widget, templateWidget, row, column, grid, text, image, svg, canvas, video, button, buttonLink, select, input, textArea } from '/home/n1/projects/profiler/frontend/apex.js';
import { colors, lightTheme, darkTheme, card, border, text, buttons, base, menu, prompt, fixedHeader, notification, switchThemeButton, loadingPage, notFoundPage, generalErrorPage } from '/home/n1/projects/profiler/frontend/apex-commons.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Bytes, collection, doc, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, getDoc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocs, getDocsFromServer, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";


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
                appState.paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, color: docData.color ? appState.textDecoder.decode(await decrypt(appState.key, docData.color.iv.toUint8Array(), docData.color.data.toUint8Array())) : undefined, text: docData.text ? appState.textDecoder.decode(await decrypt(appState.key, docData.text.iv.toUint8Array(), docData.text.data.toUint8Array())) : undefined, image: docData.image ? URL.createObjectURL(new Blob([await decrypt(appState.key, docData.image.content.iv.toUint8Array(), docData.image.content.data.toUint8Array())], { type: docData.image.type })) : undefined });
            }
            widgets['note']?.update(appState.paragraphs.length === count);
        },
        (error) => {
            console.error(error);
            updatePage(generalErrorPage());
        }
    );
}


export function loginPage() {
    return {
        widget: {
            ...row(),
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            children: [
                {
                    ...button(function (event) {
                        signInWithPopup(appState.firebase.auth, new GoogleAuthProvider());
                    }),
                    ...buttons.l(),
                    ...buttons.flat(),
                    fontWeight: 400,
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
        meta: { title: `Login | ${appName}`, description: 'Login page.' }
    };
}


export function setupTutorialPage() {
    return {
        widget: base({
            justifyContent: 'center',
            children: [
                {
                    ...column(),
                    ...card,
                    ...border(),
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...textPageTitle,
                            text: 'Keyphrase'
                        },
                        {
                            ...column(),
                            gap: '0.5rem',
                            children: [
                                { text: 'Your data is encrypted with a keyphrase using end-to-end encryption. Only you can decrypt it.' },
                                { text: 'Store your keyphrase securely — if it\'s lost, you won\'t be able to recover your data.' },
                                { text: 'Don\'t use easy-to-guess combinations like \'password\', \'12345\' and so on.' },
                            ]
                        },
                        {
                            ...row(),
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        signOut(appState.firebase.auth);
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filled(),
                                    text: 'Log out'
                                },
                                {
                                    ...button(function (event) {
                                        updatePage(setupPage());
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filledBlue(),
                                    text: 'Next'
                                }
                            ]
                        }
                    ]
                }
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
                {
                    ...column(),
                    ...card,
                    ...border(),
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...textPageTitle,
                            text: 'Keyphrase'
                        },
                        {
                            ...column(),
                            width: '100%',
                            children: [
                                {
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                },
                                () => ({
                                    ...text.aux(),
                                    id: 'keyphrase-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Required'
                                }),
                                {
                                    ...input(),
                                    ...border(),
                                    id: 'keyphrase-input',
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
                                    ...text.aux(),
                                    id: 'keyphrase-repeat-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Invalid'
                                }),
                                {
                                    ...input(),
                                    ...border(),
                                    id: 'keyphrase-repeat-input',
                                    marginTop: '0.5rem',
                                    width: '100%',
                                    type: 'password',
                                    maxlength: '64'
                                },
                            ]
                        },
                        {
                            ...row(),
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        updatePage(setupTutorialPage());
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filled(),
                                    text: 'Back'
                                },
                                {
                                    ...button(async function (event) {
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
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filledBlue(),
                                    children: [
                                        { text: 'Save' }
                                    ]
                                }
                            ]
                        }
                    ]
                }]
        }),
        meta: { title: `Setup | ${appName}`, description: 'Setup page.' }
    };
}


export function keyphrasePage(invalidAttempt) {
    return {
        widget: base({
            justifyContent: 'center',
            children: [
                {
                    ...column(),
                    ...card,
                    ...border(),
                    width: '100%',
                    justifyContent: 'center',
                    gap: '2rem',
                    children: [
                        {
                            ...textPageTitle,
                            text: 'Keyphrase'
                        },
                        {
                            ...column(),
                            width: '100%',
                            justifyContent: 'center',
                            children: [
                                {
                                    fontWeight: 600,
                                    text: 'Your keyphrase'
                                },
                                () => ({
                                    ...text.aux(),
                                    id: 'keyphrase-hint',
                                    marginTop: '0.5rem',
                                    errorText: 'Invalid'
                                }),
                                {
                                    ...input(),
                                    ...border(),
                                    id: 'keyphrase-input',
                                    width: '100%',
                                    marginTop: '0.5rem',
                                    type: 'password',
                                    maxlength: '64'
                                },
                            ]
                        },
                        {
                            ...row(),
                            width: '100%',
                            justifyContent: 'end',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        signOut(appState.firebase.auth);
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filled(),
                                    justifyContent: 'center',
                                    text: 'Log out'
                                },
                                {
                                    ...button(async function (event) {
                                        if (!widgets['keyphrase-input'].domElement.value) {
                                            widgets['keyphrase-hint'].update(false);
                                            window.scrollTo(0, 0);
                                            return;
                                        }
                                        updatePage(loadingPage());
                                        window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                        listenNotebook();
                                    }),
                                    ...buttons.l(),
                                    ...buttons.filledBlue(),
                                    justifyContent: 'center',
                                    children: [
                                        { text: 'Save' }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }),
        meta: { title: `Keyphrase | ${appName}`, description: 'Keyphrase page.' }
    };
}


export function folderPage() {
    return {
        widget: base(() => ({
            id: 'folder',
            justifyContent: 'center',
            gap: '1rem',
            paddingTop: appState.folderId === 'root' ? undefined : '4rem',
            children: [
                appState.folderId === 'root' ? null : fixedHeader({
                    children: [
                        {
                            ...row(),
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        goTo(`/folder/${appState.tree[appState.folderId].parent}`);
                                    }),
                                    ...buttons.m(),
                                    ...buttons.flat(),
                                    children: [
                                        {
                                            html: icons.up,
                                            width: '1.5rem',
                                            height: '1.5rem',
                                        }
                                    ]
                                },
                                {
                                    ...textHeaderTitle,
                                    text: appState.tree[appState.folderId].name
                                }
                            ]
                        }
                    ]
                }),
                ...appState.tree[appState.folderId].children.map(cid => ({
                    ...button(function (event) {
                        if (appState.tree[cid]['type'] === 'folder') {
                            goTo(`/folder/${cid}`);
                        } else if (appState.tree[cid]['type'] === 'note') {
                            goTo(`/note/${cid}`);
                        }
                    }, function (event) {
                        modalOn({
                            ...menu(),
                            children: [
                                appState.tree[appState.folderId].children.indexOf(cid) > 0 ? {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.tree[appState.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index - 1]] = [arr[index - 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                        });
                                        modalOff();
                                    }),
                                    ...buttons.mFullWidth(),
                                    ...buttons.flat(),
                                    children: [{ text: 'Move Up' }]
                                } : null,
                                appState.tree[appState.folderId].children.indexOf(cid) < appState.tree[appState.folderId].children.length - 1 ? {
                                    ...button(async function (event) {
                                        event.stopPropagation();
                                        const arr = appState.tree[appState.folderId].children;
                                        const index = arr.indexOf(cid);
                                        [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                        });
                                        modalOff();
                                    }),
                                    ...buttons.mFullWidth(),
                                    ...buttons.flat(),
                                    children: [{ text: 'Move Down' }]
                                } : null,
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        modalOn(() => ({
                                            ...menu(),
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: [
                                                {
                                                    marginBottom: '0.5rem',
                                                    fontWeight: 600,
                                                    text: 'Move to Folder'
                                                },
                                                value === 'root' ? null : {
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        this.parent.update(appState.tree[value].parent);
                                                    }),
                                                    ...buttons.mFullWidth(),
                                                    ...buttons.flat(),
                                                    justifyContent: 'start',
                                                    fontWeight: 400,
                                                    children: [
                                                        { text: '...' }
                                                    ]
                                                },
                                                ...appState.tree[value].children.filter(id => appState.tree[id].type === 'folder').map(id => ({
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        this.parent.update(id);
                                                    }),
                                                    ...buttons.mFullWidth(),
                                                    ...buttons.flat(),
                                                    justifyContent: 'start',
                                                    fontWeight: 400,
                                                    children: [
                                                        { text: appState.tree[id].name }
                                                    ]
                                                })),
                                                {
                                                    ...button(async function (event) {
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
                                                    }),
                                                    ...buttons.l(),
                                                    ...buttons.filledBlue(),
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    children: [
                                                        { text: `Move to ${appState.tree[value].name}` }
                                                    ]
                                                }
                                            ],
                                        }));
                                    }),
                                    ...buttons.mFullWidth(),
                                    ...buttons.flat(),
                                    children: [{ text: 'Move to Folder' }]
                                },
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        modalOn({
                                            ...menu(),
                                            alignItems: 'start',
                                            gap: '0.5rem',
                                            children: [
                                                {
                                                    fontWeight: 600,
                                                    text: 'New Name'
                                                },
                                                {
                                                    ...text.aux(),
                                                    id: 'new-folder-name-hint',
                                                    errorText: 'Required'
                                                },
                                                {
                                                    ...input(),
                                                    ...border(),
                                                    id: 'new-folder-name-input',
                                                    width: '100%',
                                                    type: 'text',
                                                    maxlength: '64',
                                                    value: appState.tree[cid].name
                                                },
                                                {
                                                    ...button(async function (event) {
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
                                                    }),
                                                    ...buttons.l(),
                                                    ...buttons.filledBlue(),
                                                    marginTop: '0.5rem',
                                                    alignSelf: 'end',
                                                    children: [
                                                        { text: 'Rename' }
                                                    ]
                                                }
                                            ]
                                        })
                                    }),
                                    ...buttons.mFullWidth(),
                                    ...buttons.flat(),
                                    children: [{ text: 'Rename' }]
                                },
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        if (appState.tree[cid].type === 'note') {
                                            modalOn({
                                                ...prompt('Delete note', 'You won\'t be able to restore it. Consider moving to "Archive" folder', [
                                                    {
                                                        ...button(async function (event) {
                                                            event.stopPropagation();
                                                            delete appState.tree[cid];
                                                            appState.tree[appState.folderId].children = appState.tree[appState.folderId].children.filter(id => id !== cid);
                                                            updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                                tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                                orphanNoteIds: arrayUnion(cid),
                                                            });
                                                            modalOff();
                                                        }),
                                                        ...buttons.l(),
                                                        ...buttons.filledRed(),
                                                        children: [
                                                            { text: 'Delete' }]
                                                    }
                                                ]),
                                            });
                                        }
                                        else if (appState.tree[cid].type === 'folder' && appState.tree[cid].children.length > 0) {
                                            modalOn({
                                                ...prompt('Delete folder', 'Before deleting, move or delete all the notes and folders inside'),
                                                ...redPanel,
                                            })
                                        }
                                        else if (appState.tree[cid].type === 'folder' && appState.tree[cid].children.length === 0) {
                                            modalOn({
                                                ...prompt('Delete folder', 'You won\'t be able to restore it', [{
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        delete appState.tree[cid];
                                                        appState.tree[appState.folderId].children = appState.tree[appState.folderId].children.filter(id => id !== cid);
                                                        updateDoc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), {
                                                            tree: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify(appState.tree))),
                                                        });
                                                        modalOff();
                                                    }),
                                                    ...buttons.l(),
                                                    ...buttons.filledRed(),
                                                    children: [
                                                        { text: 'Delete' }]
                                                }]),
                                            })
                                        }
                                    }),
                                    ...buttons.mFullWidth(),
                                    ...buttons.flatRed(),
                                    children: [{ text: 'Delete' }]
                                },
                            ]
                        })
                    }),
                    ...buttons.flat(),
                    width: '100%',
                    padding: '1rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '0.5rem',
                    fontSize: '1.125rem',
                    fontWeight: 400,
                    children: [
                        { text: appState.tree[cid]['name'] },
                    ]
                })),
                {
                    ...row(),
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    zIndex: 10,
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'end',
                    children: [
                        {
                            ...button(function (event) {
                                event.stopPropagation();
                                modalOn({
                                    ...menu(),
                                    children: [
                                        {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                modalOn({
                                                    ...prompt('Delete account', 'You won\'t be able to restore it', [
                                                        {
                                                            ...button(),
                                                            ...buttons.l(),
                                                            ...buttons.filledRed(),
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
                                                                { text: 'Delete' }]
                                                        }
                                                    ]),
                                                });
                                            }),
                                            ...buttons.mFullWidth(),
                                            ...buttons.flatRed(),
                                            children: [{ text: 'Delete account' }]
                                        },
                                        {
                                            ...button(function (event) {
                                                event.stopPropagation();
                                                signOut(appState.firebase.auth);
                                            }),
                                            ...buttons.mFullWidth(),
                                            ...buttons.flatRed(),
                                            children: [{ text: 'Log out' }]
                                        }
                                    ]
                                })
                            }),
                            ...buttons.m(),
                            ...buttons.flat(),
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
                            ...column(),
                            margin: '1rem',
                            gap: '1rem',
                            children: [
                                switchThemeButton(),
                                {
                                    ...button(function (event) {
                                        event.stopPropagation();
                                        modalOn({
                                            ...menu(),
                                            children: [
                                                {
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        modalOn({
                                                            ...menu(),
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                {
                                                                    fontWeight: 600,
                                                                    text: 'Name'
                                                                },
                                                                {
                                                                    ...text.aux(),
                                                                    id: 'new-folder-name-hint',
                                                                    errorText: 'Required'
                                                                },
                                                                {
                                                                    ...input(),
                                                                    ...border(),
                                                                    id: 'new-folder-name-input',
                                                                    width: '100%',
                                                                    type: 'text',
                                                                    maxlength: '64'
                                                                },
                                                                {
                                                                    ...button(),
                                                                    ...buttons.l(),
                                                                    ...buttons.filledBlue(),
                                                                    marginTop: '0.5rem',
                                                                    alignSelf: 'end',
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
                                                                        { text: 'Create' }
                                                                    ]
                                                                }
                                                            ]
                                                        })
                                                    }),
                                                    ...buttons.mFullWidth(),
                                                    ...buttons.flat(),
                                                    children: [{ text: 'New Folder' }]
                                                },
                                                {
                                                    ...button(function (event) {
                                                        event.stopPropagation();
                                                        modalOn({
                                                            ...menu(),
                                                            alignItems: 'start',
                                                            gap: '0.5rem',
                                                            children: [
                                                                {
                                                                    fontWeight: 600,
                                                                    text: 'Name'
                                                                },
                                                                {
                                                                    ...text.aux(),
                                                                    id: 'new-note-name-hint',
                                                                    errorText: 'Required'
                                                                },
                                                                {
                                                                    ...input(),
                                                                    ...border(),
                                                                    id: 'new-note-name-input',
                                                                    width: '100%',
                                                                    type: 'text',
                                                                    maxlength: '64'
                                                                },
                                                                {
                                                                    ...button(),
                                                                    ...buttons.l(),
                                                                    ...buttons.filledBlue(),
                                                                    marginTop: '0.5rem',
                                                                    alignSelf: 'end',
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
                                                                        { text: 'Create' }
                                                                    ]
                                                                }
                                                            ]
                                                        })
                                                    }),
                                                    ...buttons.mFullWidth(),
                                                    ...buttons.flat(),
                                                    children: [{ text: 'New Note' }]
                                                },
                                            ]
                                        })
                                    }),
                                    ...panelBlueButtonFilled2,
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
                }
            ]
        })),
        meta: { title: `${appState.tree[appState.folderId]['name']} | ${appName}`, description: 'Folder page.' }
    };
}


export function notePage() {
    return {
        widget: base((value) => ({
            id: 'note',
            paddingTop: '4.5rem',
            gap: '1rem',
            children: [
                fixedHeader({
                    children: [
                        {
                            ...row(),
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                {
                                    ...button(function (event) {
                                        goTo(`/folder/${appState.tree[appState.noteId].parent}`);
                                    }),
                                    ...buttons.m(),
                                    ...buttons.flat(),
                                    children: [
                                        {
                                            html: icons.up,
                                            width: '1.5rem',
                                            height: '1.5rem',
                                        }
                                    ]
                                },
                                {
                                    ...textHeaderTitle,
                                    text: appState.tree[appState.noteId].name
                                }
                            ]
                        }
                    ]
                }),
                {
                    ...text.aux(),
                    id: 'add-note-hint',
                    errorText: 'Required'
                },
                {
                    ...textArea(),
                    ...border(),
                    id: 'add-note-input',
                    width: '100%',
                    rows: 8
                },
                {
                    ...row(),
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
                                                                                                    noteId: appState.noteId,
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
                                                                ...buttons.l(),
                                                                ...yellowButton,
                                                                children: [
                                                                    { text: 'OK' }
                                                                ]
                                                            }
                                                        ]),
                                                        ...yellowPanel,
                                                    }
                                                )
                                            } else {
                                                const reader = new FileReader();
                                                reader.onload = async function (e) {
                                                    addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                                        timestamp: Math.floor(Date.now() / 1000),
                                                        noteId: appState.noteId,
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
                            }
                        ),
                        {
                            ...button(async function (event) {
                                event.stopPropagation();
                                widgets['image-input'].domElement.click();
                            }),
                            ...buttons.l(),
                            ...buttons.filled(),
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            children: [
                                {
                                    html: icons.upload,
                                    width: '1.25rem',
                                    height: '1.25rem',
                                },
                                { text: 'Image' }
                            ]
                        },
                        {
                            ...button(async function (event) {
                                event.stopPropagation();
                                if (widgets['add-note-input'].domElement.value.trim()) {
                                    widgets['add-note-hint'].update(true);
                                    addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                        timestamp: Math.floor(Date.now() / 1000),
                                        noteId: appState.noteId,
                                        text: await encrypt(appState.key, appState.textEncoder.encode(widgets['add-note-input'].domElement.value)),
                                    });
                                } else {
                                    widgets['add-note-hint'].update(false);
                                }
                            }),
                            ...buttons.l(),
                            ...buttons.filledBlue(),
                            children: [
                                { text: 'Add' }
                            ]
                        }
                    ]
                },
                ...appState.paragraphs.map((paragraph, index) => {
                    return {
                        ...column(function (value) {
                            if (value === 'view') {
                                return {
                                    ...card,
                                    ...border(),
                                    ...((!paragraph.color || paragraph.color === 'default') ? undefined : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}`]),
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
                                            width: '100%',
                                            src: paragraph.image
                                        } : null,
                                        {
                                            ...row(),
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0 0.75rem 0.75rem 0.75rem',
                                            children: [
                                                {
                                                    ...((!paragraph.color || paragraph.color === 'default') ? styles.textAux1 : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}TextAux`]),
                                                    fontWeight: 400,
                                                    text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                                },
                                                {
                                                    ...row(),
                                                    gap: '0.5rem',
                                                    children: [
                                                        paragraph.text ? {
                                                            ...button(function (event) {
                                                                event.stopPropagation();
                                                                navigator.clipboard.writeText(paragraph.text);
                                                            }),
                                                            ...buttons.m(),
                                                            ...((!paragraph.color || paragraph.color === 'default') ? styles.buttonFlat : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}ButtonFlat`]),
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
                                                                    ...menu(),
                                                                    alignItems: 'start',
                                                                    gap: '0.5rem',
                                                                    children: [
                                                                        {
                                                                            fontWeight: 600,
                                                                            text: 'Color'
                                                                        },
                                                                        ...['default', 'red', 'green', 'yellow', 'blue'].map(color => ({
                                                                            ...button(async function (event) {
                                                                                event.stopPropagation();
                                                                                updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                                                    color: await encrypt(appState.key, appState.textEncoder.encode(color)),
                                                                                });
                                                                                modalOff();
                                                                            }),
                                                                            ...buttons.mFullWidth(),
                                                                            ...buttons.flat(),
                                                                            justifyContent: 'start',
                                                                            alignItems: 'center',
                                                                            gap: '1rem',
                                                                            fontWeight: 400,
                                                                            children: [
                                                                                {
                                                                                    html: icons.circle,
                                                                                    width: '1rem',
                                                                                    height: '1rem',
                                                                                    borderRadius: '2rem',
                                                                                    borderWidth: '2px',
                                                                                    borderStyle: 'solid',
                                                                                    borderColor: color === 'default' ? 'var(--fg-1)' : `var(--panel-${color}-fg-1)`,
                                                                                    fill: color === 'default' ? 'var(--bg-1)' : `var(--panel-${color}-bg-1)`,
                                                                                },
                                                                                { text: color.charAt(0).toUpperCase() + color.slice(1) }
                                                                            ]
                                                                        }))
                                                                    ]
                                                                });
                                                            }),
                                                            ...buttons.m(),
                                                            ...((!paragraph.color || paragraph.color === 'default') ? styles.buttonFlat : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}ButtonFlat`]),
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
                                                                this.parent.parent.parent.update('edit');
                                                                widgets[`edit-note-input-${paragraph.id}`].domElement.focus();
                                                            }),
                                                            ...buttons.m(),
                                                            ...((!paragraph.color || paragraph.color === 'default') ? styles.buttonFlat : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}ButtonFlat`]),
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
                                                                        ...buttons.l(),
                                                                        ...buttons.filledRed(),
                                                                        children: [
                                                                            { text: 'Delete' }]
                                                                    }]),
                                                                })
                                                            }),
                                                            ...buttons.m(),
                                                            ...((!paragraph.color || paragraph.color === 'default') ? styles.buttonFlat : styles[`panel${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}ButtonFlat`]),
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
                                };
                            } else if (value === 'edit') {
                                return {
                                    width: '100%',
                                    gap: '1rem',
                                    children: [
                                        {
                                            ...text.aux(),
                                            id: `edit-note-hint-${paragraph.id}`,
                                            errorText: 'Required'
                                        },
                                        {
                                            ...textArea(),
                                            ...border(),
                                            id: `edit-note-input-${paragraph.id}`,
                                            width: '100%',
                                            padding: '0.75rem',
                                            rows: 8,
                                            ...((!paragraph.color || paragraph.color === 'default') ? undefined : styles[`${paragraph.color.charAt(0).toUpperCase() + paragraph.color.slice(1)}Panel`]),
                                            value: paragraph.text
                                        },
                                        {
                                            ...row(),
                                            width: '100%',
                                            justifyContent: 'end',
                                            gap: '1rem',
                                            children: [
                                                {
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        this.parent.parent.update('view');
                                                    }),
                                                    ...buttons.l(),
                                                    ...buttons.filled(),
                                                    justifyContent: 'center',
                                                    children: [
                                                        { text: 'Cancel' }
                                                    ]
                                                },
                                                {
                                                    ...button(async function (event) {
                                                        event.stopPropagation();
                                                        if (widgets[`edit-note-input-${paragraph.id}`].domElement.value.trim()) {
                                                            updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                                text: await encrypt(appState.key, appState.textEncoder.encode(widgets[`edit-note-input-${paragraph.id}`].domElement.value)),
                                                            });
                                                        } else {
                                                            widgets[`edit-note-hint-${paragraph.id}`].update(false);
                                                        }
                                                    }),
                                                    ...buttons.l(),
                                                    ...buttons.filledBlue(),
                                                    justifyContent: 'center',
                                                    children: [
                                                        { text: 'Save' }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }, 'view')
                    }
                }),
                value ? {
                    ...button(function (event) {
                        listenParagraphs(appState.paragraphs.length + 32);
                    }),
                    ...buttons.lFullWidth(),
                    ...buttons.filled(),
                    justifyContent: 'center',
                    children: [
                        { text: 'More' }
                    ]
                } : null
            ]
        }), false),
        meta: { title: `${appState.tree[appState.noteId]['name']} | ${appName}`, description: 'Note page.' }
    };
}