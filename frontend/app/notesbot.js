import { appName, appState, widgets, pageWidget, colors, icons, updatePage, goTo, startApp, modalOn, modalOff, widget, templateWidget, row, column, grid, text, textLink, image, svg, canvas, video, youtubeVideo, button, select, input, textArea, hint, notification, imageInput, loadingPage, notFoundPage, generalErrorPage, fixedHeader, menu, base } from '/home/n1/projects/profiler/frontend/apex.js';


export const styles = {
    card: {
        padding: '0.65rem',
        borderRadius: '0.5rem',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: colors.gray[300],
    },
    filledCard: {
        padding: '0.65rem',
        borderRadius: '0.5rem',
        backgroundColor: colors.gray[100],
    },
    tag: {
        padding: '0.25rem 0.5rem',
        borderRadius: '0.25rem',
        backgroundColor: colors.cyan[200],
        fontWeight: 600,
        color: colors.cyan[900]
    },
    actionButton: {
        padding: '0.65rem',
        backgroundColor: colors.blue[600],
        hoverColor: colors.blue[700],
        color: 'white',
    },
    actionTextButton: {
        padding: '0.5rem',
        color: colors.blue[600],
        hoverColor: colors.blue[100],
    },
    dangerButton: {
        padding: '0.65rem',
        backgroundColor: colors.red[600],
        hoverColor: colors.red[700],
        color: 'white',
    },
    premiumButton: {
        backgroundColor: colors.yellow[400],
        hoverColor: colors.yellow[500],
        fontWeight: 600,
        color: colors.yellow[900],
    },
    disabledButton: {
        padding: '0.5rem',
        borderRadius: '0.5rem',
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: colors.gray[300],
        fontSize: '1rem',
        lineHeight: 1,
        color: colors.gray[500],
        cursor: 'not-allowed',
        userSelect: 'none',
        webkitTapHighlightColor: 'transparent',
    },
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
                        if (import.meta.env.DEV) {
                            appState.firebase.signInWithPopup(appState.firebase.auth, new appState.firebase.GoogleAuthProvider());
                        } else {
                            appState.firebase.signInWithRedirect(appState.firebase.auth, new appState.firebase.GoogleAuthProvider());
                        }
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


export function setupPage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                input({
                    id: 'e2ekey-input',
                    width: '16rem',
                    attributes: {
                        placeholder: 'Key phrase'
                    }
                }),
                button({
                    ...styles.actionButton,
                    text: 'Set',
                    click: function (event) {

                    }
                })
            ]
        }),
        meta: { title: `Setup | ${appName}`, description: 'Setup pgae.' }
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