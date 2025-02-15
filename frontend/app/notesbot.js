import { appName, appState, widgets, pageWidget, colors, lightTheme, darkTheme, icons, updatePage, goTo, startApp, startPathController, setTheme, modalOn, modalOff, widget, templateWidget, row, column, grid, text, textLink, image, svg, canvas, video, youtubeVideo, button, select, input, textArea, hint, notification, imageInput, loadingPage, notFoundPage, generalErrorPage, fixedHeader, menu, base, systemFontFamily } from '/home/n1/projects/profiler/frontend/apex.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Bytes, collection, doc, query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove, runTransaction, getDoc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocs, getDocsFromServer, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";


const styles = {
    card: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'var(--border-color)',
    },
    filledCard: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: colors.gray[100],
    },
    menu: {
    },
    menuButton: {
        width: '100%',
        justifyContent: 'center',
        hoverColor: colors.gray[100],
        fontWeight: 600,
    },
    dangeMenuButton: {
        width: '100%',
        justifyContent: 'center',
        hoverColor: colors.red[100],
        fontWeight: 600,
        color: colors.red[500],
    },
    actionButton: {
        padding: '0.75rem',
        justifyContent: 'center',
        backgroundColor: colors.blue[600],
        hoverColor: colors.blue[700],
        color: 'white',
    },
    actionSecondaryButton: {
        padding: '0.75rem',
        justifyContent: 'center',
        backgroundColor: 'inherit',
        hoverColor: colors.gray[100],
    },
    dangerButton: {
        padding: '0.75rem',
        justifyContent: 'center',
        backgroundColor: colors.red[500],
        hoverColor: colors.red[600],
        color: 'white',
    },
    folderEntry: {
        // padding: '0.75rem',
        borderRadius: '0.5rem',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: colors.gray[300],
    },


    h1: {
        fontSize: '2rem',
        fontWeight: 600,
        color: 'var(--text-accent-color)',
    },
    h2: {
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-accent-color)',
    },
    h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-accent-color)',
    },
    h4: {
        fontSize: '1rem',
        fontWeight: 600,
        color: 'var(--text-accent-color)',
    },
    textAux: {
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'var(--text-aux-color)',
    },
    textButton: {
        backgroundColor: 'var(--text-button-background-color)',
        hoverColor: 'var(--text-button-background-hover-color)',
        color: 'var(--text-button-text-color)',
        fill: 'var(--text-button-icon-color)',
    },
    textButtonBorder: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--text-button-background-color)',
        hoverColor: 'var(--text-button-background-hover-color)',
        color: 'var(--text-button-text-color)',
        fill: 'var(--text-button-icon-color)',
    },
    textButtonFilledSubtle: {
        backgroundColor: 'var(--text-button-filled-subtle--background-color)',
        hoverColor: 'var(--text-button-filled-subtle--background-hover-color)',
        color: 'var(--text-button-text-color)',
        fill: 'var(--text-button-icon-color)',
    },
    blueButton: {
        backgroundColor: 'var(--blue-button-background-color)',
        hoverColor: 'var(--blue-button-background-hover-color)',
        color: 'var(--blue-button-text-color)',
        fill: 'var(--blue-button-icon-color)',
    },
    blueButtonBorder: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--blue-button-background-color)',
        hoverColor: 'var(--blue-button-background-hover-color)',
        color: 'var(--blue-button-text-color)',
        fill: 'var(--blue-button-icon-color)',
    },
    blueButtonFilledSubtle: {
        backgroundColor: 'var(--blue-button-filled-subtle--background-color)',
        hoverColor: 'var(--blue-button-filled-subtle--background-hover-color)',
        color: 'var(--blue-button-text-color)',
        fill: 'var(--blue-button-icon-color)',
    },
    blueButtonFilled: {
        backgroundColor: 'var(--blue-button-filled-background-color)',
        hoverColor: 'var(--blue-button-filled-background-hover-color)',
        color: 'var(--blue-button-filled-text-color)',
        fill: 'var(--blue-button-filled-icon-color)',
    },
    redButton: {
        backgroundColor: 'var(--red-button-background-color)',
        hoverColor: 'var(--red-button-background-hover-color)',
        color: 'var(--red-button-text-color)',
        fill: 'var(--red-button-icon-color)',
    },
    redButtonBorder: {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'var(--border-color)',
        backgroundColor: 'var(--red-button-background-color)',
        hoverColor: 'var(--red-button-background-hover-color)',
        color: 'var(--red-button-text-color)',
        fill: 'var(--red-button-icon-color)',
    },
    redButtonFilledSubtle: {
        backgroundColor: 'var(--red-button-filled-subtle--background-color)',
        hoverColor: 'var(--red-button-filled-subtle--background-hover-color)',
        color: 'var(--red-button-text-color)',
        fill: 'var(--red-button-icon-color)',
    },
    redButtonFilled: {
        backgroundColor: 'var(--red-button-filled-background-color)',
        hoverColor: 'var(--red-button-filled-background-hover-color)',
        color: 'var(--red-button-filled-text-color)',
        fill: 'var(--red-button-filled-icon-color)',
    }
}
export function demoPage() {
    return {
        widget: base({
            justifyContent: 'center',
            alignItems: 'center',
            children: [
                column({
                    ...styles.card,
                    gap: '1rem',
                    children: [
                        text({
                            ...styles.h1,
                            text: 'Demo Title'
                        }),
                        text({
                            ...styles.textAux,
                            text: 'Hint auxilary message'
                        }),
                        text({
                            text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
                        }),
                        button({
                            ...styles.redButton,
                            alignSelf: 'end',
                            alignItems: 'center',
                            gap: '0.5rem',
                            children: [
                                svg({
                                    width: '1.25rem',
                                    svg: icons.time,
                                }),
                                text({
                                    fontWeight: 600,
                                    text: 'Button'
                                })
                            ]
                        })
                        // textLink({
                        //     attributes: {
                        //         href: 'https://domain.com',
                        //         target: '_blank'
                        //     },
                        //     text: 'domain.com'
                        // }),
                    ]
                })
            ]
        }),
        meta: { title: `Demo | ${appName}`, description: 'Demo page.' }
    };
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
                        updatePage(keyphrasePage());
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
                                    listenParagraphs();
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
    appState.paragraphs = [];
    updatePage(notePage());
    appState.stopListenParagraphs = onSnapshot(query(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), where('noteId', '==', appState.noteId), orderBy('timestamp', 'desc'), limit(32)),
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
                    hoverColor: colors.gray[100],
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
            justifyContent: 'space-between',
            gap: '2rem',
            children: [
                text({ fontSize: '2rem', fontWeight: 600, text: 'Keyphrase' }),
                column({
                    gap: '1rem',
                    children: [
                        text({ text: 'Your data is encrypted with a keyphrase using end-to-end encryption. Only you can decrypt it.' }),
                        text({ text: 'Store your keyphrase securely — if it\'s lost, you won\'t be able to recover your data.' }),
                        text({ text: 'Don\'t use easy-to-guess combinations like \'password\', \'12345\' and so on.' }),
                    ]
                }),
                row({
                    width: '100%',
                    gap: '1rem',
                    children: [
                        button({
                            flexGrow: 1,
                            ...styles.actionSecondaryButton,
                            click: function (event) {
                                signOut(appState.firebase.auth);
                            },
                            text: 'Log out'
                        }),
                        button({
                            flexGrow: 1,
                            ...styles.actionButton,
                            click: function (event) {
                                updatePage(setupPage());
                            },
                            text: 'Next'
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
            justifyContent: 'space-between',
            children: [
                text({ fontSize: '2rem', fontWeight: 600, text: 'Keyphrase' }),
                column({
                    width: '100%',
                    children: [
                        text({ fontWeight: 600, text: 'Your keyphrase' }),
                        hint(() => ({ marginTop: '0.5rem', id: 'keyphrase-hint', errorText: 'Required' }), true),
                        input({ id: 'keyphrase-input', marginTop: '0.5rem', width: '100%', attributes: { type: 'password', maxlength: '64' } }),
                        text({ marginTop: '1rem', fontWeight: 600, text: 'Repeat keyphrase' }),
                        hint(() => ({ id: 'keyphrase-repeat-hint', marginTop: '0.5rem', errorText: 'Invalid' }), true),
                        input({ id: 'keyphrase-repeat-input', marginTop: '0.5rem', width: '100%', attributes: { type: 'password', maxlength: '64' } }),
                    ]
                }),
                row({
                    width: '100%',
                    gap: '1rem',
                    children: [
                        button({
                            flexGrow: 1,
                            ...styles.actionSecondaryButton,
                            click: function (event) {
                                updatePage(setupTutorialPage());
                            },
                            text: 'Back'
                        }),
                        button({
                            flexGrow: 1,
                            ...styles.actionButton,
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
        }),
        meta: { title: `Setup | ${appName}`, description: 'Setup page.' }
    };
}


export function keyphrasePage(notesDocData) {
    return {
        widget: base({
            justifyContent: 'space-between',
            children: [
                text({ fontSize: '2rem', fontWeight: 600, text: 'Keyphrase' }),
                column({
                    width: '100%',
                    justifyContent: 'center',
                    children: [
                        text({ fontWeight: 600, text: 'Your keyphrase' }),
                        hint(() => ({ id: 'keyphrase-hint', marginTop: '0.5rem', errorText: 'Invalid' }), true),
                        input({ id: 'keyphrase-input', width: '100%', marginTop: '0.5rem', attributes: { type: 'password', maxlength: '64' } }),
                    ]
                }),
                row({
                    width: '100%',
                    gap: '1rem',
                    children: [
                        button({
                            flexGrow: 1,
                            ...styles.actionSecondaryButton,
                            click: function (event) {
                                signOut(appState.firebase.auth);
                            },
                            text: 'Log out'
                        }),
                        button({
                            flexGrow: 1,
                            ...styles.actionButton,
                            click: async function (event) {
                                if (!widgets['keyphrase-input'].domElement.value) {
                                    widgets['keyphrase-hint'].update(false);
                                    window.scrollTo(0, 0);
                                    return;
                                }
                                try {
                                    updatePage(loadingPage());
                                    window.localStorage.setItem('keyphrase', widgets['keyphrase-input'].domElement.value);
                                    listenNotebook();
                                } catch (error) {
                                    if (error instanceof DOMException && error.name === "OperationError") {
                                        updatePage(keyphrasePage());
                                        widgets['keyphrase-hint'].update(false);
                                    } else {
                                        updatePage(generalErrorPage());
                                    }
                                }
                            },
                            children: [
                                text({ text: 'Save' })
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
            gap: '1rem',
            children: [
                appState.folderId === 'root' ? null : button({
                    ...styles.folderEntry,
                    width: '100%',
                    click: function (event) {
                        goTo(`/folder/${appState.tree[appState.folderId].parent}`);
                    },
                    children: [
                        text({
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            text: '...'
                        })
                    ]
                }),
                ...appState.tree[appState.folderId].children.map(cid => button({
                    ...styles.folderEntry,
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    click: function (event) {
                        if (appState.tree[cid]['type'] === 'folder') {
                            goTo(`/folder/${cid}`);
                        } else if (appState.tree[cid]['type'] === 'note') {
                            goTo(`/note/${cid}`);
                        }
                    },
                    children: [
                        text({
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            text: appState.tree[cid]['name']
                        }),
                        button({
                            hoverColor: colors.gray[100],
                            click: function (event) {
                                event.stopPropagation();
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
                                                            fontWeight: 600,
                                                            text: 'Move to Folder'
                                                        }),
                                                        value === 'root' ? null : button({
                                                            ...styles.menuButton,
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
                                                            ...styles.menuButton,
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
                                                            ...styles.dangerButton,
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
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
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'New Name'
                                                        }),
                                                        hint({
                                                            id: 'new-folder-name-hint',
                                                            marginTop: '0.5rem',
                                                            errorText: 'Required'
                                                        }, true),
                                                        input({
                                                            marginTop: '0.5rem',
                                                            id: 'new-folder-name-input',
                                                            width: '100%',
                                                            attributes: { type: 'text', maxlength: '64' }
                                                        }, appState.tree[cid].name),
                                                        button({
                                                            ...styles.dangerButton,
                                                            marginTop: '1rem',
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
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
                                            ...styles.dangeMenuButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                if (appState.tree[cid].type === 'note') {
                                                    modalOn(menu({
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
                                                                alignSelf: 'end',
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
                                                        minWidth: undefined,
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
                                                        minWidth: undefined,
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
                                                                alignSelf: 'end',
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
                                }));
                            },
                            children: [
                                svg({
                                    width: '1rem',
                                    height: '1rem',
                                    fill: colors.gray[600],
                                    svg: icons.menu
                                })
                            ]
                        })
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
                            margin: '1rem',
                            borderRadius: '2rem',
                            hoverColor: colors.gray[100],
                            click: function (event) {
                                event.stopPropagation();
                                modalOn(menu({
                                    ...styles.menu,
                                    children: [
                                        button({
                                            ...styles.dangeMenuButton,
                                            click: function (event) {
                                                event.stopPropagation();
                                                modalOn(menu({
                                                    minWidth: undefined,
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
                                            ...styles.dangeMenuButton,
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
                                    fill: colors.gray[600],
                                    svg: icons.menu
                                })
                            ]
                        }),
                        button({
                            margin: '1rem',
                            padding: 0,
                            borderRadius: '2rem',
                            backgroundColor: colors.red[500],
                            hoverColor: colors.red[600],
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
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        }),
                                                        hint({
                                                            id: 'new-folder-name-hint',
                                                            marginTop: '0.5rem',
                                                            errorText: 'Required'
                                                        }, true),
                                                        input({
                                                            marginTop: '0.5rem',
                                                            id: 'new-folder-name-input',
                                                            width: '100%',
                                                            attributes: { type: 'text', maxlength: '64' }
                                                        }),
                                                        button({
                                                            ...styles.dangerButton,
                                                            marginTop: '1rem',
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
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
                                                    children: [
                                                        text({
                                                            fontWeight: 600,
                                                            text: 'Name'
                                                        }),
                                                        hint({
                                                            id: 'new-note-name-hint',
                                                            marginTop: '0.5rem',
                                                            errorText: 'Required'
                                                        }, true),
                                                        input({
                                                            marginTop: '0.5rem',
                                                            id: 'new-note-name-input',
                                                            width: '100%',
                                                            attributes: { type: 'text', maxlength: '64' }
                                                        }),
                                                        button({
                                                            ...styles.dangerButton,
                                                            marginTop: '1rem',
                                                            alignSelf: 'end',
                                                            fontWeight: 600,
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
                                    width: '4rem',
                                    height: '4rem',
                                    fill: 'white',
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
            gap: '1rem',
            children: [
                row({
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    children: [
                        text({
                            fontSize: '2rem',
                            fontWeight: 600,
                            text: appState.tree[appState.noteId].name
                        }),
                        button({
                            hoverColor: colors.gray[100],
                            click: function (event) {
                                event.stopPropagation();
                                goTo('/');
                            },
                            children: [
                                svg({
                                    width: '1.75rem',
                                    height: '1.75rem',
                                    fill: colors.gray[600],
                                    svg: icons.home
                                })
                            ]
                        })
                    ]
                }),
                column({
                    width: '100%',
                    gap: '0.5rem',
                    children: [
                        textArea({
                            id: 'add-note-input',
                            width: '100%',
                            attributes: { rows: 8 },
                        }),
                        button({
                            ...styles.dangerButton,
                            width: '100%',
                            fontWeight: 600,
                            click: async function (event) {
                                event.stopPropagation();
                                if (widgets['add-note-input'].domElement.value.trim()) {
                                    addDoc(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), {
                                        timestamp: Math.floor(Date.now() / 1000),
                                        noteId: appState.noteId,
                                        content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                            text: widgets['add-note-input'].domElement.value
                                        }))),
                                    });
                                } else {
                                    modalOn(menu({
                                        ...styles.menu,
                                        alignItems: 'start',
                                        gap: '0.5rem',
                                        children: [
                                            text({
                                                fontWeight: 600,
                                                text: 'Save'
                                            }),
                                            text({
                                                text: 'Empty text is not allowed'
                                            })
                                        ]
                                    }));
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
                            width: '100%',
                            gap: '2rem',
                            children: [
                                text({
                                    width: '100%',
                                    whiteSpace: 'pre-wrap',
                                    text: paragraph.text
                                }),
                                row({
                                    width: '100%',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    children: [
                                        text({
                                            fontSize: '0.875rem',
                                            color: colors.gray[600],
                                            text: new Date(paragraph.timestamp * 1000).toLocaleString()
                                        }),
                                        row({
                                            gap: '0.5rem',
                                            children: [
                                                button({
                                                    hoverColor: colors.gray[100],
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        navigator.clipboard.writeText(paragraph.text);
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            fill: colors.gray[600],
                                                            svg: icons.copy
                                                        })
                                                    ]
                                                }),
                                                button({
                                                    hoverColor: colors.gray[100],
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        this.parent.parent.parent.update('edit');
                                                    },
                                                    children: [
                                                        svg({
                                                            width: '1.25rem',
                                                            height: '1.25rem',
                                                            fill: colors.gray[600],
                                                            svg: icons.edit
                                                        })
                                                    ]
                                                }),
                                                button({
                                                    hoverColor: colors.gray[100],
                                                    click: function (event) {
                                                        event.stopPropagation();
                                                        modalOn(menu({
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
                                                                    alignSelf: 'end',
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
                                                            fill: colors.gray[600],
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
                            gap: '0.5rem',
                            children: [
                                textArea({
                                    id: `edit-note-input-${paragraph.id}`,
                                    width: '100%',
                                    attributes: { rows: 8 },
                                }, paragraph.text),
                                row({
                                    width: '100%',
                                    gap: '1rem',
                                    children: [
                                        button({
                                            ...styles.actionSecondaryButton,
                                            flexGrow: 1,
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
                                            ...styles.dangerButton,
                                            flexGrow: 1,
                                            fontWeight: 600,
                                            click: async function (event) {
                                                event.stopPropagation();
                                                if (widgets[`edit-note-input-${paragraph.id}`].domElement.value.trim()) {
                                                    updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                        content: await encrypt(appState.key, appState.textEncoder.encode(JSON.stringify({
                                                            text: widgets[`edit-note-input-${paragraph.id}`].domElement.value
                                                        }))),
                                                    });
                                                } else {
                                                    modalOn(menu({
                                                        ...styles.menu,
                                                        alignItems: 'start',
                                                        gap: '0.5rem',
                                                        children: [
                                                            text({
                                                                fontWeight: 600,
                                                                text: 'Save'
                                                            }),
                                                            text({
                                                                text: 'Empty text is not allowed'
                                                            })
                                                        ]
                                                    }));
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
                }, 'view'))
            ]
        })),
        meta: { title: `${appState.tree[appState.noteId]['name']} | ${appName}`, description: 'Note page.' }
    };
}