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
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                input({
                    id: 'email-input',
                    width: '16rem',
                    attributes: {
                        placeholder: 'Email'
                    }
                }),
                button({
                    ...styles.actionButton,
                    text: 'Send link',
                    click: function (event) {
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(widgets['email-input'].value)) {
                            alert('Invalid email');
                        } else {
                            appState.sendSignInLinkToEmail(appState.auth, email, {
                                // url: 'https://notesbot-be271.web.app/auth-complete',
                                url: 'http://localhost:5173/auth-complete',
                                handleCodeInApp: true,
                                // linkDomain: 'notesbot-be271.web.app'
                            })
                                .then(() => {
                                    window.localStorage.setItem('loginemail', widgets['email-input'].value);
                                    updatePage(linkSentPage());
                                })
                                .catch((error) => {
                                    updatePage(generalErrorPage());
                                });
                            updatePage(loadingPage());
                        }
                    }
                })
            ]
        }),
        meta: { title: `Login | ${appName}`, description: '' }
    };
}


export function linkSentPage() {
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
    };
}


export function loginEmailNotFoundPage() {
    return {
        widget: row({
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            children: [
                text({
                    text: 'Login link must be opened from the same device that requested it.'
                })
            ]
        }),
        meta: { title: `Login | Email not found | ${appName}`, description: '' }
    };
}


export function setupPage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function homePage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function newFolderPage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function newNotePage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function notePage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}


export function paragraphPage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: `Error | ${appName}`, description: 'Server fault.' }
    };
}