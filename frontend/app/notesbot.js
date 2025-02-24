import { appName, appState, widgets, pageWidget, updateStyleProperties, updateMetaTags, updateTheme, updateBodyStyle, updatePage, goTo, startApp, startPathController, modalOn, modalOff, widget, templateWidget, row, column, grid, text, image, svg, canvas, video, youtubeVideo, button, buttonLink, select, input, textArea } from '/home/n1/projects/profiler/frontend/apex.js';
import { colors, icons, lightTheme, darkTheme, styles, base, menu, fixedHeader, hint, notification, loadingPage, notFoundPage, generalErrorPage } from '/home/n1/projects/profiler/frontend/apex-commons.js';
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
        widget: row(() => ({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            children: [
                button({
                    ...styles.buttonL,
                    ...styles.textButton,
                    fontWeight: 400,
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
                                    ...styles.buttonL,
                                    ...styles.secondaryButton,
                                    click: function (event) {
                                        signOut(appState.firebase.auth);
                                    },
                                    text: 'Log out'
                                }),
                                button({
                                    ...styles.buttonL,
                                    ...styles.actionButton,
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
                                    ...styles.buttonL,
                                    ...styles.secondaryButton,
                                    click: function (event) {
                                        updatePage(setupTutorialPage());
                                    },
                                    text: 'Back'
                                }),
                                button({
                                    ...styles.buttonL,
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
                                    ...styles.buttonL,
                                    ...styles.secondaryButton,
                                    justifyContent: 'center',
                                    click: function (event) {
                                        signOut(appState.firebase.auth);
                                    },
                                    text: 'Log out'
                                }),
                                button({
                                    ...styles.buttonL,
                                    ...styles.actionButton,
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
                    backgroundColor: 'var(--bg-2)',
                    children: [
                        row({
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.buttonM,
                                    ...styles.textButton,
                                    hoverColor: 'var(--bg-4)',
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
                    padding: '1rem',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '0.5rem',
                    hoverColor: 'var(--bg-3)',
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
                                    ...styles.buttonMFullWidth,
                                    ...styles.textButton,
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
                                    ...styles.buttonMFullWidth,
                                    ...styles.textButton,
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
                                    ...styles.buttonMFullWidth,
                                    ...styles.textButton,
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
                                                    ...styles.buttonM,
                                                    ...styles.textButton,
                                                    width: '100%',
                                                    justifyContent: 'start',
                                                    fontWeight: 400,
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
                                                    ...styles.buttonM,
                                                    ...styles.textButton,
                                                    width: '100%',
                                                    justifyContent: 'start',
                                                    fontWeight: 400,
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
                                                    ...styles.buttonL,
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
                                    ...styles.buttonMFullWidth,
                                    ...styles.textButton,
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
                                                    ...styles.buttonL,
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
                                    ...styles.buttonMFullWidth,
                                    ...styles.dangerTextButton,
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
                                                        ...styles.buttonL,
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
                                                ...styles.menuDanger,
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
                                                        ...styles.buttonL,
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
                            ...styles.buttonM,
                            ...styles.textButton,
                            margin: '1rem',
                            borderRadius: '2rem',
                            click: function (event) {
                                event.stopPropagation();
                                modalOn(menu({
                                    ...styles.menu,
                                    children: [
                                        button(() => ({
                                            ...styles.buttonMFullWidth,
                                            ...styles.textButton,
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
                                                updateTheme(theme);
                                                this.update();
                                            }, children: [
                                                text({
                                                    text: `Theme: ${window.localStorage.getItem('theme')}`
                                                })
                                            ]
                                        })),
                                        button({
                                            ...styles.buttonMFullWidth,
                                            ...styles.dangerTextButton,
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
                                                            ...styles.buttonM,
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
                                            ...styles.buttonMFullWidth,
                                            ...styles.dangerTextButton,
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
                            margin: '1rem',
                            padding: 0,
                            borderRadius: '2rem',
                            backgroundColor: 'var(--panel-blue-bg-2)',
                            hoverColor: 'var(--panel-blue-bg-3)',
                            fill: 'var(--panel-blue-fg)',
                            click: function (event) {
                                event.stopPropagation();
                                modalOn(menu({
                                    ...styles.menu,
                                    children: [
                                        button({
                                            ...styles.buttonMFullWidth,
                                            ...styles.textButton,
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
                                                            ...styles.buttonL,
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
                                            ...styles.buttonMFullWidth,
                                            ...styles.textButton,
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
                                                            ...styles.buttonL,
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
        widget: base((value) => ({
            id: 'note',
            paddingTop: '4.5rem',
            gap: '1rem',
            children: [
                fixedHeader({
                    width: '100%',
                    padding: '0.5rem',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-2)',
                    children: [
                        row({
                            alignItems: 'center',
                            gap: '1rem',
                            children: [
                                button({
                                    ...styles.buttonM,
                                    ...styles.textButton,
                                    hoverColor: 'var(--bg-4)',
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
                                            if (file.size > (1024 * 1024 - 8 * 1024)) {
                                                modalOn(
                                                    menu({
                                                        ...styles.menuWarning,
                                                        alignItems: 'start',
                                                        gap: '0.5rem',
                                                        children: [
                                                            text({
                                                                fontWeight: 600,
                                                                text: 'Image Upload'
                                                            }),
                                                            text({
                                                                text: 'Image would be compressed to 1MB jpeg'
                                                            }),
                                                            button({
                                                                ...styles.buttonL,
                                                                ...styles.warningButton,
                                                                marginTop: '0.5rem',
                                                                alignSelf: 'end',
                                                                click: function (event) {
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
                                                                },
                                                                children: [
                                                                    text({
                                                                        text: 'OK'
                                                                    })
                                                                ]
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
                        button({
                            ...styles.buttonL,
                            ...styles.secondaryButton,
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
                            ...styles.buttonL,
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
                                        text: await encrypt(appState.key, appState.textEncoder.encode(widgets['add-note-input'].domElement.value)),
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
                                            color: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-3)' : `var(--panel-${paragraph.color}-fg-3)`,
                                            text: new Date(paragraph.timestamp * 1000).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                                        }),
                                        row({
                                            gap: '0.5rem',
                                            children: [
                                                paragraph.text ? button({
                                                    ...styles.buttonM,
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg-3)' : `var(--panel-${paragraph.color}-bg-2)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-2)' : `var(--panel-${paragraph.color}-fg-2)`,
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
                                                    ...styles.buttonM,
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg-3)' : `var(--panel-${paragraph.color}-bg-2)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-2)' : `var(--panel-${paragraph.color}-fg-2)`,
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
                                                                    ...styles.buttonMFullWidth,
                                                                    ...styles.textButton,
                                                                    justifyContent: 'start',
                                                                    alignItems: 'center',
                                                                    gap: '1rem',
                                                                    fontWeight: 400,
                                                                    click: async function (event) {
                                                                        event.stopPropagation();
                                                                        updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                                            color: await encrypt(appState.key, appState.textEncoder.encode(color)),
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
                                                    ...styles.buttonM,
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg-3)' : `var(--panel-${paragraph.color}-bg-2)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-2)' : `var(--panel-${paragraph.color}-fg-2)`,
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
                                                    ...styles.buttonM,
                                                    hoverColor: (!paragraph.color || paragraph.color === 'default') ? 'var(--bg-3)' : `var(--panel-${paragraph.color}-bg-2)`,
                                                    fill: (!paragraph.color || paragraph.color === 'default') ? 'var(--fg-2)' : `var(--panel-${paragraph.color}-fg-2)`,
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
                                                                    ...styles.buttonL,
                                                                    ...styles.dangerButton,
                                                                    marginTop: '0.5rem',
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
                                            ...styles.buttonL,
                                            ...styles.secondaryButton,
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
                                            ...styles.buttonL,
                                            ...styles.actionButton,
                                            justifyContent: 'center',
                                            click: async function (event) {
                                                event.stopPropagation();
                                                if (widgets[`edit-note-input-${paragraph.id}`].domElement.value.trim()) {
                                                    updateDoc(doc(doc(appState.firebase.firestore, 'notebooks', appState.user.uid), 'paragraphs', paragraph.id), {
                                                        text: await encrypt(appState.key, appState.textEncoder.encode(widgets[`edit-note-input-${paragraph.id}`].domElement.value)),
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
                value ? button({
                    ...styles.buttonL,
                    ...styles.secondaryButton,
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
        }), false),
        meta: { title: `${appState.tree[appState.noteId]['name']} | ${appName}`, description: 'Note page.' }
    };
}