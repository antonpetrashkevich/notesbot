import { appName, appState, widgets, pageWidget, colors, icons, updatePage, goTo, startApp, modalOn, modalOff, widget, templateWidget, row, column, grid, text, textLink, image, svg, canvas, video, youtubeVideo, button, select, input, textArea, hint, notification, imageInput, loadingPage, notFoundPage, generalErrorPage, fixedHeader, menu, base } from '/home/n1/projects/profiler/frontend/apex.js';
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { collection, doc, query, where, orderBy, limit, serverTimestamp, runTransaction, getDoc, getDocFromCache, getDocFromServer, getDocsFromCache, getDocs, getDocsFromServer, onSnapshot, addDoc, setDoc, updateDoc } from "firebase/firestore";


export const styles = {
    card: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: colors.gray[300],
    },
    filledCard: {
        padding: '0.75rem',
        borderRadius: '0.5rem',
        backgroundColor: colors.gray[100],
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
        backgroundColor: colors.red[600],
        hoverColor: colors.red[700],
        color: 'white',
    }
}


export function toBase64(uint8Array) {
    let binary = '';
    uint8Array.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}
export function fromBase64(base64) {
    const binaryString = atob(base64);
    const uint8Array = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
}


export async function generateKey(keyphrase, salt) {
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
            salt: fromBase64(salt),
            iterations: 2 ** 16,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}
export async function encrypt(key, data) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        data
    );
    return { iv: toBase64(iv), data: toBase64(new Uint8Array(encryptedData)) };
}
export async function decrypt(key, ivdata) {
    return await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: fromBase64(ivdata.iv),
        },
        key,
        fromBase64(ivdata.data)
    );
}


export function listenNotebook() {
    appState.stopListenNotebook = onSnapshot(doc(appState.firebase.firestore, 'notebooks', appState.user.uid),
        async (docSnap) => {
            if (!docSnap.exists()) {
                updatePage(setupTutorialPage());
            } else if (!window.localStorage.getItem('keyphrase')) {
                updatePage(keyphrasePage());
            } else {
                try {
                    const docData = docSnap.data();
                    appState.key = await generateKey(window.localStorage.getItem('keyphrase'), docData.salt);
                    appState.notes = JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.notes)));
                    appState.folders = JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.folders)));
                    if (!appState.initialized) {
                        appState.initialized = true;
                        updatePage(homePage());
                    } else {
                        widgets['folders-list']?.update();
                        widgets['notes-list']?.update();
                    }
                } catch (error) {
                    if (error instanceof DOMException && error.name === "OperationError") {
                        updatePage(keyphrasePage());
                    } else {
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
function listenParagraphs(noteId) {
    appState.stopListenParagraphs = onSnapshot(query(collection(appState.firebase.firestore, 'notebooks', appState.user.uid, 'paragraphs'), where('noteIds', 'array-contains', noteId), orderBy('timestamp', 'desc'), limit(32)),
        async (querySnapshot) => {
            appState.paragraphs = [];
            for (const docSnap of querySnapshot.docs) {
                const docData = docSnap.data();
                appState.paragraphs.push({ id: docSnap.id, timestamp: docData.timestamp, ...JSON.parse(appState.textDecoder.decode(await decrypt(appState.key, docData.content))) });
            }
            widgets['paragraphs-list']?.update();
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
                        text({ text: '🔐 Your data is encrypted with a keyphrase using end-to-end encryption. Only you can decrypt it.' }),
                        text({ text: '✍️ Store your keyphrase securely — if it\'s lost, you won\'t be able to recover your data.' }),
                        text({ text: '🕵️ Don\'t use easy-to-guess combinations like \'password\', \'12345\' and so on.' }),
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
                                    const salt = toBase64(window.crypto.getRandomValues(new Uint8Array(16)));
                                    const key = await generateKey(widgets['keyphrase-input'].domElement.value, salt);
                                    const notes = await encrypt(key, appState.textEncoder.encode(JSON.stringify({})));
                                    const folders = await encrypt(key, appState.textEncoder.encode(JSON.stringify({})));
                                    const notebookDocRef = doc(appState.firebase.firestore, 'notebooks', appState.user.uid);
                                    const txResult = await runTransaction(appState.firebase.firestore, async (transaction) => {
                                        const notebookDoc = await transaction.get(notebookDocRef);
                                        if (notebookDoc.exists()) {
                                            throw "User already exists";
                                        }
                                        transaction.set(notebookDocRef, {
                                            salt,
                                            notes,
                                            folders
                                        });
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
                                    appState.stopListenNotebook();
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


export function homePage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Home page'
                })
            ]
        }),
        meta: { title: `Home | ${appName}`, description: 'Home page.' }
    };
}


export function newFolderPage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Link sent. Check your email.'
                })
            ]
        }),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function newNotePage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Link sent. Check your email.'
                })
            ]
        }),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function notePage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Link sent. Check your email.'
                })
            ]
        }),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function paragraphPage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Link sent. Check your email.'
                })
            ]
        }),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}