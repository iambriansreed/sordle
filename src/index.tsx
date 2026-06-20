// The game board, keyboard, footer and <dialog> modals — formerly the static
// markup inside <body> in index.html. skrapa renders this to HTML at build time
// and injects it into the shared shell (src/index.html); src/client.ts is
// compiled and inlined right after it.
//

import pkg from '../package.json';

const TOP_ROW = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const MIDDLE_ROW = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
const ATTEMPT_ROWS = [0, 1, 2, 3, 4, 5];
const WORD_COLUMNS = [0, 1, 2, 3, 4];

const Key = (key: string) => (
    <button type="button" data-key={key}>
        {key}
    </button>
);

export function Page() {
    return (
        <>
            <noscript>You need to enable JavaScript to run this app.</noscript>
            <div class="app loading">
                <svg
                    class="progress"
                    data-progress=""
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    <rect pathLength="100" x="0" y="0" width="100" height="100" />
                </svg>
                <main>
                    <h1>
                        S<span class="loader">o</span>rdle
                    </h1>
                    <div class="attempts-wrapper">
                        <div class="attempts">
                            {ATTEMPT_ROWS.flatMap((rowIndex) =>
                                WORD_COLUMNS.map((charIndex) => (
                                    <div class="char" data-row={rowIndex} data-col={charIndex}>
                                        <div class="front"></div>
                                        <div class="back"></div>
                                    </div>
                                )),
                            )}
                        </div>
                    </div>
                    <div class="keyboard" role="group" aria-label="Keyboard">
                        <div>{TOP_ROW.map(Key)}</div>
                        <div>{MIDDLE_ROW.map(Key)}</div>
                        <div>
                            {BOTTOM_ROW.map(Key)}
                            <button type="button" data-key="backspace" class="lg" aria-label="backspace">
                                <svg viewBox="0 0 24 24">
                                    <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z" />
                                </svg>
                            </button>
                        </div>
                        <div class="enter-row">
                            <button type="button" data-key="enter">
                                enter
                            </button>
                        </div>
                    </div>
                </main>

                <dialog class="overlay" data-modal="welcome">
                    <div class="modal welcome">
                        <div class="body">
                            <div class="welcome-hero">
                                <h2 class="welcome-logo">
                                    S<span>o</span>rdle
                                </h2>
                                <p class="welcome-tagline">
                                    <em>Sort</em> of like Wordle — play as many times as you like.
                                </p>
                            </div>

                            <div class="welcome-how">
                                <h3>How to play</h3>
                                <p>Guess the 5-letter word in 6 tries. Each guess colors the tiles:</p>
                                <ul class="welcome-legend">
                                    <li>
                                        <span class="demo green">B</span> Right letter, right spot
                                    </li>
                                    <li>
                                        <span class="demo yellow">A</span> Right letter, wrong spot
                                    </li>
                                    <li>
                                        <span class="demo none">X</span> Not in the word
                                    </li>
                                </ul>
                            </div>

                            <p class="welcome-credits">
                                Definitions from{' '}
                                <a target="_blank" href="https://donate.wikimedia.org/">
                                    Wiktionary
                                </a>{' '}
                                · Contribute on{' '}
                                <a target="_blank" href="https://github.com/iambriansreed/sordle">
                                    GitHub
                                </a>
                                <br /> Uses Google Analytics &amp; cookies. Usage is consent.
                            </p>
                        </div>
                        <div class="footer">
                            <button type="button" class="give-up" data-action="giveUp">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    <line x1="4" y1="22" x2="4" y2="15" />
                                </svg>
                                Give up
                            </button>
                            <button type="button" data-action="closeModal">
                                Continue
                            </button>
                        </div>
                    </div>
                    <footer>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="11" height="11">
                                <path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" />
                            </svg>
                            <a href="https://iambrian.com">Brian</a>
                        </div>
                        <button
                            type="button"
                            class="theme-toggle"
                            data-action="toggleTheme"
                            aria-label="Toggle dark and light mode"
                        >
                            <svg
                                class="icon-sun"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                            <svg
                                class="icon-moon"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                aria-hidden="true"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </button>
                        <div class="version">{pkg.version}</div>
                    </footer>
                </dialog>
                <dialog class="overlay" data-modal="success">
                    <div class="modal">
                        <div class="body">
                            <div class="success">
                                <h2>Nice job!</h2>
                                <p>
                                    You got it in only <span data-attempt-text=""></span>.
                                </p>
                            </div>
                            <div data-definition="">Loading...</div>
                        </div>
                        <div class="footer">
                            <button type="button" data-action="closeModal">
                                Start
                            </button>
                        </div>
                    </div>
                </dialog>
                <dialog class="overlay" data-modal="fail">
                    <div class="modal">
                        <div class="body">
                            <div class="fail">
                                <h2>Nice try.</h2>
                                <p>No worries, you'll get it next time!</p>
                            </div>
                            <div data-definition="">Loading...</div>
                        </div>
                        <div class="footer">
                            <button type="button" data-action="closeModal">
                                Try Again
                            </button>
                        </div>
                    </div>
                </dialog>
                <div class="intro" data-intro="">
                    <section class="intro-slide intro-title">
                        <h1 class="intro-logo">
                            S<span>o</span>rdle
                        </h1>
                        <p class="intro-tagline">Unlimited plays. Quick wordplay. Instant feedback.</p>
                    </section>
                </div>
            </div>
            <div class="notify"></div>
            <div class="landscape-only">
                <h1>
                    S<span class="loader">o</span>rdle
                </h1>
                <p>Please rotate your device.</p>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 106.43">
                    <path
                        class="st0"
                        d="M11.1,0h35.63c3.05,0,5.85,1.25,7.85,3.25c2.03,2.03,3.25,4.8,3.25,7.85v31.46h-3.19V12.18H3.15v75.26l0,0   h7.61v11.61c0,1.58,0.27,3.1,0.77,4.51H11.1c-3.05,0-5.85-1.25-7.85-3.25C1.22,98.27,0,95.51,0,92.45V11.1   c0-3.05,1.25-5.85,3.25-7.85C5.28,1.22,8.04,0,11.1,0L11.1,0L11.1,0z M94.95,33.45c-0.37-5.8-2.64-10.56-6.06-13.97   c-3.64-3.63-8.59-5.74-13.94-5.93l2.46,2.95c0.73,0.88,0.62,2.18-0.26,2.91c-0.88,0.73-2.18,0.62-2.91-0.26l-5.72-6.85l0,0   c-0.72-0.86-0.62-2.14,0.22-2.88l6.71-5.89c0.86-0.75,2.16-0.66,2.91,0.19c0.75,0.86,0.66,2.16-0.19,2.91l-3.16,2.78   c6.43,0.21,12.4,2.75,16.8,7.13c4.07,4.06,6.79,9.69,7.25,16.49l2.58-3.08c0.73-0.88,2.04-0.99,2.91-0.26   c0.88,0.73,0.99,2.04,0.26,2.91l-5.73,6.84c-0.72,0.86-1.99,0.99-2.87,0.29l-6.98-5.56c-0.89-0.71-1.04-2.01-0.33-2.91   c0.71-0.89,2.01-1.04,2.91-0.33L94.95,33.45L94.95,33.45z M122.88,59.7v35.63c0,3.05-1.25,5.85-3.25,7.85   c-2.03,2.03-4.8,3.25-7.85,3.25h-78.9c-3.05,0-5.85-1.25-7.85-3.25c-2.03-2.03-3.25-4.8-3.25-7.85V59.7c0-3.05,1.25-5.85,3.25-7.85   c2.03-2.03,4.79-3.25,7.85-3.25h78.9c3.05,0,5.85,1.25,7.85,3.25C121.66,53.88,122.88,56.64,122.88,59.7L122.88,59.7L122.88,59.7z    M35.41,77.49c0,2.51-2.03,4.57-4.57,4.57c-2.51,0-4.57-2.03-4.57-4.57c0-2.51,2.03-4.57,4.57-4.57   C33.36,72.92,35.41,74.95,35.41,77.49L35.41,77.49L35.41,77.49z M37.88,51.75v51.49h72.82V51.75H37.88L37.88,51.75z"
                    />
                </svg>
            </div>
        </>
    );
}
