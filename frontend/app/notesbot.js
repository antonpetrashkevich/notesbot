import { appState, widgets, pageWidget, colors, lightTheme, darkTheme, applyTheme, updatePage, goTo, initializeApp, widget, templateWidget, row, column, grid, text, textLink, image, svg, canvas, video, youtubeVideo, button, select, input, textArea } from '/home/n1/projects/profiler/frontend/apex.js';


const icons = {
    spinner: '<svg viewBox="0 0 100 100" stroke-width="10"><circle cx="50" cy="50" r="45" stroke-dasharray="270" stroke-dashoffset="90"> <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="0.75s" repeatCount="indefinite"/></circle></svg>'
}
export const tagStyle = { padding: '0.25rem 0.5rem', borderRadius: '0.25rem', backgroundColor: colors.cyan[100], fontWeight: 600, color: colors.cyan[900] };


export function loadingPage() {
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
                stroke: 'var(--gray-border-color)',
                svg: icons.spinner
            })]
        })),
        meta: { title: 'Profiler.me', description: 'Loading...' }
    };
}


export function notFoundPage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: '404. Page Not Found (invalid URL).' }),
            ]
        })),
        meta: { title: '404 | Profiler.me', description: 'Page Not Found. Invalid URL.' }
    };
}


export function generalErrorPage() {
    return {
        widget: column(() => ({
            width: '100%',
            height: '100%',
            children: [
                text({ margin: '25vh 1rem', alignSelf: 'center', text: 'Something went wrong. Try reloading the page.' }),
            ]
        })),
        meta: { title: 'Error | Profiler.me', description: 'Server fault.' }
    };
}