/**
 * Sordle client
 *
 * skrapa compiles this with tsconfig.client.json and inlines the output as a
 * plain <script>, so it must be self-contained: no imports, no exports.
 */

type Word = {
    word: string;
    meanings: {
        partOfSpeech: string;
        definitions?:
            | {
                  definition: string;
                  synonyms?: null | null[];
                  antonyms?: null | null[];
                  example: string;
              }[]
            | null;
        synonyms?: null | null[];
        antonyms?: null | string[];
    }[];
};

type Status = 'green' | 'none' | 'yellow';

type SavedGame = { word: string; guesses: string[]; current: string };

const SAVE_KEY = 'sordle.key';
const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;
const STATUS_PRIORITY: Record<Status, number> = {
    none: 0,
    yellow: 1,
    green: 2,
};
// matches word count in https://github.com/iambriansreed/sordle-words/tree/main
const WORD_COUNT = 7434;

// ---------------------------------------------------------------------------
// Utilities (formerly utils.ts)
// ---------------------------------------------------------------------------

const $$ = (selector: string, container: ParentNode = document): HTMLElement[] => {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (!elements) throw new Error(`Element not found: ${selector}`);
    return elements;
};

const $ = (selector: string, container: ParentNode = document): HTMLElement => {
    const element = container?.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    return element;
};

const useFetch = (setLoading: (loading: boolean) => void) => {
    return async (url: string) => {
        setLoading(true);
        return (
            window
                .fetch(url)
                .then((r) => r.json())
                .then(async (response) => {
                    setLoading(false);
                    return response;
                })
                .catch(() => null) || null
        );
    };
};

/*


```javascript
const words = await fetch('https://iambrian.com/sordle-words/5.json').then((r) => r.json());
```

**Get a single word:**

```javascript
const word = await fetch('https://iambrian.com/sordle-words/5/aargh.json').then((r) => r.json());
```

**Get a random word:**

```javascript
// Pick a random index (0-7433)
const randomIndex = Math.floor(Math.random() * 7434);

// Get the word file in one request
const word = await fetch(`https://iambrian.com/sordle-words/5/${randomIndex}.json`).then((r) => r.json());
```

 */
const useWords = (setLoading: (loading: boolean) => void) => {
    const fetcher = useFetch(setLoading);

    const getWord = async (word: string): Promise<null | Word> => {
        return await fetcher('https://iambrian.com/sordle-words/5/' + word + '.json');
    };

    const getRandomWord = async (): Promise<Word> => {
        const randomIndex = Math.floor(Math.random() * WORD_COUNT);

        // Get the word file in one request
        return await fetcher(`https://iambrian.com/sordle-words/5/${randomIndex}.json`);
    };

    return {
        getRandomWord,
        getWord,
    };
};

const waitFor = async (ms: number) =>
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });

const waitForFramePaint = async () =>
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = resolve;
            messageChannel.port2.postMessage(undefined);
        });
    });

function useNotifications() {
    const $notify = $('.notify');

    let showHelperTimeout: ReturnType<typeof setTimeout>;

    const hideNotify = () => {
        $notify.classList.remove('show');
        showHelperTimeout = setTimeout(() => {
            $notify.innerHTML = '';
        }, 220);
    };

    const notify = (str: string, autoClose = true) => {
        if (showHelperTimeout) clearTimeout(showHelperTimeout);
        $notify.innerHTML = str;

        requestAnimationFrame(() => {
            $notify.classList.add('show');
        });

        if (autoClose)
            showHelperTimeout = setTimeout(() => {
                hideNotify();
            }, 1500);
    };

    return {
        notify,
        hideNotify,
    };
}

function loadSavedGame(): null | SavedGame {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || typeof data.word !== 'string' || data.word.length !== WORD_LENGTH || !Array.isArray(data.guesses))
            return null;
        return {
            word: data.word,
            guesses: data.guesses.filter((g: unknown) => typeof g === 'string'),
            current: typeof data.current === 'string' ? data.current : '',
        };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Game (formerly main.ts)
// ---------------------------------------------------------------------------

async function app() {
    // Styles load via the <link> in index.html; reveal the app now that we're running.
    document.documentElement.classList.remove('app-loading');

    const $app = $('.app');
    const $modals: Record<string, HTMLDialogElement> = {
        welcome: $('[data-modal="welcome"]') as HTMLDialogElement,
        success: $('[data-modal="success"]') as HTMLDialogElement,
        fail: $('[data-modal="fail"]') as HTMLDialogElement,
    };
    const $main = $('main');
    const themeToggle = $('[data-action="toggleTheme"]');
    const cleanAttempts = $('main .attempts').innerHTML;

    const THEME_KEY = 'sordle-theme';
    const getInitialTheme = () => {
        const stored = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };

    const setTheme = (theme: 'dark' | 'light') => {
        document.documentElement.classList.toggle('light-theme', theme === 'light');
        if (themeToggle)
            themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
        localStorage.setItem(THEME_KEY, theme);
    };

    setTheme(getInitialTheme());

    const swipeTheme = (next: 'dark' | 'light') => {
        // Incrementally wipe the new theme in over the old one via a View Transition.
        const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
        if (!doc.startViewTransition) {
            setTheme(next);
            return;
        }
        document.documentElement.classList.add('theme-swiping');
        const transition = doc.startViewTransition(() => setTheme(next)) as { finished: Promise<void> };
        transition.finished.finally(() => document.documentElement.classList.remove('theme-swiping'));
    };

    // Intro: title screen shows briefly, then reveals the game — the welcome modal for a
    // fresh game, or a "loading previous game" state while a saved game is restored.
    const $intro = $('[data-intro]', $app);
    let pendingRipple = false;
    let markGameReady: () => void = () => {};
    const gameReady = new Promise<void>((resolve) => (markGameReady = resolve));

    const slideAwayIntro = () => {
        $intro.classList.add('intro-done');
        setTimeout(() => $intro.remove(), 600);
    };

    const revealGame = async () => {
        const saved = loadSavedGame();
        const inProgress = !!saved && (saved.guesses.length > 0 || saved.current.length > 0);
        if (inProgress) {
            const tagline = $$('.intro-tagline', $intro)[0];
            if (tagline) tagline.innerText = 'Loading previous game…';
            await gameReady;
            slideAwayIntro();
            setTimeout(() => rippleKeyboard(), 650);
        } else {
            // Fresh game: show the welcome / explanation modal.
            slideAwayIntro();
            openWelcome();
            pendingRipple = true;
        }
    };

    const introTimer = setTimeout(revealGame, 2200);

    // Open/close native <dialog> modals through these helpers so the close
    // animation and an immediate reopen can't race each other. Only one modal is
    // ever open at a time; `openModal` tracks it.
    let openModal: HTMLDialogElement | null = null;
    let closeTimer: ReturnType<typeof setTimeout>;
    // The active confetti canvas, tracked so it can be lifted into the modal's
    // top layer (showModal() renders above everything else, canvases included).
    let $confetti: HTMLCanvasElement | null = null;

    const showModal = (name: keyof typeof $modals) => {
        clearTimeout(closeTimer);
        const dialog = $modals[name];
        // Swap instantly if a different modal is already open (no fade between them).
        if (openModal && openModal !== dialog && openModal.open) {
            openModal.classList.remove('closing');
            openModal.close();
        }
        dialog.classList.remove('closing');
        openModal = dialog;
        if (!dialog.open) dialog.showModal();
        // Re-parent in-flight confetti into the dialog so it keeps flying over it.
        if ($confetti && $confetti.parentElement !== dialog) dialog.appendChild($confetti);
    };

    const closeModal = () => {
        const dialog = openModal;
        if (!dialog || !dialog.open || dialog.classList.contains('closing')) return;
        // Fade the blur/opacity out before closing the dialog. On iOS Safari,
        // hiding a backdrop-filter element abruptly leaves a stale blurred
        // snapshot stuck on screen; transitioning to a clear frame avoids it.
        dialog.classList.add('closing');
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => {
            dialog.classList.remove('closing');
            dialog.close();
            if (openModal === dialog) openModal = null;
            if (pendingRipple) {
                pendingRipple = false;
                rippleKeyboard();
            }
        }, 260);
    };

    // Open the welcome / how-to modal. Reveal its "Give up" button only when a
    // game is actually underway (some guesses made or the current row started).
    const openWelcome = () => {
        showModal('welcome');
        const inProgress = guesses.length > 0 || attempt.chars.length > 0;
        $('.give-up', $modals.welcome).classList.toggle('show', inProgress);
    };

    const rippleKeyboard = () => {
        const keyboard = $('.keyboard', $main);
        if (!keyboard) return;
        const keys = $$('button', keyboard);
        const rect = keyboard.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let max = 1;
        const distances = keys.map((key) => {
            const r = key.getBoundingClientRect();
            const d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
            if (d > max) max = d;
            return d;
        });
        keys.forEach((key, i) => {
            key.style.setProperty('--ripple-delay', `${Math.round((distances[i] / max) * 260)}ms`);
        });
        keyboard.classList.remove('ripple');
        void keyboard.offsetWidth;
        keyboard.classList.add('ripple');
    };

    // Celebration: launch confetti up and inward from both bottom corners.
    const fireConfetti = () => {
        const canvas = document.createElement('canvas');
        canvas.className = 'confetti-canvas';
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        // Append into the open modal's top layer when one is showing, else the body.
        (openModal ?? document.body).appendChild(canvas);
        $confetti = canvas;
        ctx.scale(dpr, dpr);

        const colors = ['#86e29b', '#ffe27a', '#ffa8a6', '#a9d4ff', '#ffffff', '#d8c7ff'];
        type Particle = {
            x: number;
            y: number;
            vx: number;
            vy: number;
            rot: number;
            vr: number;
            size: number;
            color: string;
            life: number;
        };
        const particles: Particle[] = [];

        const burst = (originX: number, dir: number) => {
            for (let i = 0; i < 160; i++) {
                const angle = -Math.PI / 2 + dir * (Math.random() * 1.1 + 0.05);
                const speed = 11 + Math.random() * 16;
                particles.push({
                    x: originX,
                    y: h + 5,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - Math.random() * 4,
                    rot: Math.random() * Math.PI,
                    vr: (Math.random() - 0.5) * 0.3,
                    size: 5 + Math.random() * 7,
                    color: colors[(Math.random() * colors.length) | 0],
                    life: 1,
                });
            }
        };
        burst(0, 1);
        burst(w, -1);

        let frame = 0;
        const maxFrames = 340;
        const tick = () => {
            ctx.clearRect(0, 0, w, h);
            particles.forEach((p) => {
                // Light weight: low gravity + air drag so pieces drift and flutter down.
                p.vy += 0.08;
                p.vy *= 0.985;
                p.vx *= 0.98;
                p.x += p.vx + Math.sin(p.rot) * 0.6;
                p.y += p.vy;
                p.rot += p.vr;
                if (frame > 220) p.life -= 0.018;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });
            frame++;
            if (frame < maxFrames) requestAnimationFrame(tick);
            else {
                canvas.remove();
                if ($confetti === canvas) $confetti = null;
            }
        };
        requestAnimationFrame(tick);
    };

    void introTimer;

    let loadingInterval: ReturnType<typeof setInterval>;
    let isLoading = true;

    const setLoading = (loading: boolean) => {
        if (loading === isLoading) return;
        isLoading = loading;
        if (loading) $app.classList.add('loading');

        if (loadingInterval) clearInterval(loadingInterval);

        loadingInterval = setTimeout(() => {
            if (!isLoading) {
                $app.classList.remove('loading');
                return;
            }
            setLoading(true);
        }, 2000);
    };

    const { getRandomWord, getWord } = useWords(setLoading);

    const { hideNotify, notify } = useNotifications();

    let wordMeanings: Word;
    let word: string[] = [];
    const guesses: string[] = [];
    const keyStatus: Record<string, Status> = {};
    // let $attempts: HTMLElement;
    // let $attemptsWrapper: HTMLElement;
    const $keyboardKeys: Record<string, HTMLElement> = {};
    const $chars = () => $$(`main .char[data-row="${attempt.index}"]`);
    const $rowChars = (rowIndex: number) => $$(`main .char[data-row="${rowIndex}"]`);
    const $progress = $('[data-progress]', $app);

    // Top progress line: best guess scored as 20% per correct-placed letter (green)
    // and 10% per correct-but-misplaced letter (yellow); a solved word is 100%.
    const updateProgress = () => {
        let best = 0;
        guesses.forEach((guess) => {
            const chars = guess.split('');
            let score = 0;
            chars.forEach((char, i) => {
                const color = getCharacterColor(char, i, word, chars);
                if (color === 'green') score += 20;
                else if (color === 'yellow') score += 10;
            });
            if (score > best) best = score;
        });
        $progress.style.setProperty('--progress-num', `${Math.min(100, best)}`);
    };

    const resetMain = async (nextWord: Word) => {
        hideNotify();

        word = nextWord.word.split('');
        wordMeanings = nextWord;
        guesses.length = 0;
        Object.keys(keyStatus).forEach((key) => delete keyStatus[key]);

        // Cache keyboard keys synchronously so a restored game can color them immediately.
        Object.keys($keyboardKeys).forEach((key) => delete $keyboardKeys[key]);
        $$('[data-key]', $main).forEach((element) => {
            if (element.dataset.key) $keyboardKeys[element.dataset.key] = element;
        });

        await waitForFramePaint();

        setAttempt({ index: 0, chars: [] });
        updateProgress();
    };

    let attempt = {
        chars: [] as string[],
        index: 0,
    };

    const getChar = (row: number, col: number) => $(`.char[data-row="${row}"][data-col="${col}"]`);

    const setChar = (char: string) => {
        const $char = getChar(attempt.index, attempt.chars.length);
        $('.front', $char).innerText = char || '';
        $('.back', $char).innerText = char || '';
    };

    // Outline the next blank to be filled.
    const setActiveCell = () => {
        $$('main .char.active').forEach((element) => element.classList.remove('active'));
        if (attempt.chars.length < WORD_LENGTH) {
            getChar(attempt.index, attempt.chars.length).classList.add('active');
        }
    };

    const setAttempt = (next: typeof attempt) => {
        attempt = next;
        setActiveCell();
    };

    let flipping = false;
    const attemptFlip = async (ms = 300) => {
        flipping = true;

        await Promise.all([
            ...$chars().map(async ($element, i) => {
                await waitFor(ms * i);
                $element.classList.add('flip');
            }),

            await waitFor(ms * (WORD_LENGTH + 2)),
        ]);

        flipping = false;
    };

    let animateErrorTimeout: ReturnType<typeof setTimeout>;
    const animateError = (error: 'cell' | 'row' = 'cell') => {
        if (animateErrorTimeout) clearTimeout(animateErrorTimeout);

        let errorElements = $chars();

        if (error !== 'row') {
            errorElements = [errorElements[0]];
        }

        errorElements.forEach((element) => element.classList.add('horizontal-shake'));

        animateErrorTimeout = setTimeout(() => {
            errorElements.forEach((element) => element.classList.remove('horizontal-shake'));
        }, 500);
    };

    const getNewWord = async () => {
        // Locally (dev server) always play "brain" to make testing deterministic.
        let nextWord: null | Word = null;

        // dev only - nextWord = await getWord('brain');

        if (!nextWord) nextWord = await getRandomWord();

        await resetMain(nextWord);

        saveGame();
        markGameReady();
    };

    const loadDefinitions = (target: HTMLElement, solvedWord = word.join(''), meanings = wordMeanings) => {
        if (!meanings?.meanings) return;

        setTimeout(() => {
            $('[data-definition]', target).innerHTML = `<h3>${solvedWord}</h3>
<ul class="meanings">
    ${meanings?.meanings
        .map(
            (meaning) => `
    <li>
        <p class="part-of-speech"><span>${meaning.partOfSpeech}</span></p>
        <ol>
            ${meaning.definitions
                ?.map(
                    (definition) => `
            <li>
                <p>${definition.definition}</p>
                ${definition.example ? `<p class="example">"${definition.example}"</p>` : ''}
            </li>`,
                )
                .join('')}
        </ol>
    </li>`,
        )
        .join('')}
</ul>`;
        }, 1);
    };

    const saveGame = () => {
        localStorage.setItem(
            SAVE_KEY,
            JSON.stringify({ word: word.join(''), guesses: [...guesses], current: attempt.chars.join('') }),
        );
    };

    const clearGame = () => {
        localStorage.removeItem(SAVE_KEY);
        $('main .attempts').innerHTML = cleanAttempts;
    };

    const setKeyColor = (char: string, color: Status) => {
        const best = getKeyboardKeyColor(keyStatus[char], color);
        keyStatus[char] = best;
        const element = $keyboardKeys[char];
        if (element) {
            element.classList.remove('green', 'yellow', 'none');
            element.classList.add(best);
        }
    };

    // Paint a finished guess onto a row instantly (used when restoring a saved game).
    const renderRow = (rowIndex: number, chars: string[]) => {
        const charElements = $rowChars(rowIndex);
        chars.forEach((char, charIndex) => {
            const element = charElements[charIndex];
            if (!element) return;
            const color = getCharacterColor(char, charIndex, word, chars);
            $('.front', element).innerText = char;
            $('.back', element).innerText = char;
            element.classList.remove('green', 'yellow', 'none');
            element.classList.add(color, 'flip');
            setKeyColor(char, color);
        });
    };

    const restoreGame = async (saved: SavedGame) => {
        const won = saved.guesses[saved.guesses.length - 1] === saved.word;
        if (won || saved.guesses.length >= MAX_ATTEMPTS) {
            clearGame();
            return await getNewWord();
        }

        const savedWord = await getWord(saved.word);
        if (!savedWord) {
            return await getNewWord();
        }

        await resetMain(savedWord);

        saved.guesses.forEach((guess, rowIndex) => {
            guesses.push(guess);
            renderRow(rowIndex, guess.split(''));
        });
        updateProgress();

        const current = saved.current.split('');
        setAttempt({ chars: current, index: saved.guesses.length });
        current.forEach((char, charIndex) => {
            const element = getChar(attempt.index, charIndex);
            $('.front', element).innerText = char;
            $('.back', element).innerText = char;
        });

        saveGame();
        markGameReady();
    };

    const giveUp = () => {
        if (flipping || !word.length) return;
        showModal('fail');
        loadDefinitions($modals.fail);
        clearGame();
        getNewWord();
    };

    // Testing helper: reveal the success modal for the current word from the console.
    (window as unknown as { sordleWin: () => void }).sordleWin = () => {
        showModal('success');
        setTimeout(() => {
            const count = attempt.index || 1;
            $('[data-attempt-text]', $modals.success).innerText = ` ${count} ${count === 1 ? 'attempt' : 'attempts'}`;
        }, 1);
        loadDefinitions($modals.success);
        fireConfetti();
    };

    const handleEnter = async () => {
        if (attempt.chars.length < WORD_LENGTH) {
            animateError();
            notify('Not enough letters');
            return;
        }

        const invalidWord = !(await getWord(attempt.chars.join('')));

        if (invalidWord) {
            animateError('row');
            notify('Not in word list');
            return;
        }

        const charElements = $chars();
        const colors = attempt.chars.map((char, charIndex) => getCharacterColor(char, charIndex, word, attempt.chars));

        colors.forEach((color, charIndex) => {
            charElements[charIndex].classList.remove('green', 'yellow', 'none');
            charElements[charIndex].classList.add(color);
        });

        const correct = colors.filter((color) => color === 'green').length;
        const guessedIndex = attempt.index;

        guesses.push(attempt.chars.join(''));

        await attemptFlip();

        attempt.chars.forEach((char, charIndex) => setKeyColor(char, colors[charIndex]));
        updateProgress();

        const won = correct === WORD_LENGTH;
        const lost = !won && guessedIndex + 1 === MAX_ATTEMPTS;

        if (won) {
            // Celebrate on the winning board first, then reveal the success modal.
            const solvedWord = word.join('');
            const solvedMeanings = wordMeanings;
            fireConfetti();
            clearGame();
            setTimeout(() => {
                showModal('success');
                setTimeout(() => {
                    const count = guessedIndex + 1;
                    $('[data-attempt-text]', $modals.success).innerText =
                        ` ${count} ${count === 1 ? 'attempt' : 'attempts'}`;
                }, 1);
                loadDefinitions($modals.success, solvedWord, solvedMeanings);
                getNewWord();
            }, 1100);
        } else if (lost) {
            showModal('fail');
            loadDefinitions($modals.fail);
            clearGame();
            getNewWord();
        } else {
            saveGame();
            setAttempt({ chars: [], index: guessedIndex + 1 });
        }
    };

    const handleKey = (key: keyof typeof $keyboardKeys) => {
        if (flipping) return;

        // An open modal makes the board inert; ignore physical-keyboard input.
        if (openModal?.open) return;

        if (!$keyboardKeys[key]) return;

        if ('backspace' === key) {
            if (attempt.chars.length) {
                attempt.chars.pop();
                setChar('');
                setAttempt(attempt);
                saveGame();
            } else {
                animateError();
            }
            return;
        }

        if ('enter' === key) {
            handleEnter();
            return;
        }

        // a - z

        if (attempt.chars.length === WORD_LENGTH) {
            // overwrite last character
            attempt.chars.pop();
        }

        setChar(key);
        attempt.chars.push(key);
        setAttempt(attempt);
        saveGame();
    };

    const handleClick = async (e: MouseEvent) => {
        const rawTarget = e.target as HTMLElement;

        if (rawTarget.nodeName.toLowerCase() === 'a') {
            return;
        }

        // Resolve the actionable element so clicks on inner SVG icons still register.
        const targetElement = (rawTarget.closest('[data-action], [data-key], h1') as HTMLElement) ?? rawTarget;

        e.preventDefault();

        targetElement.blur();

        if (targetElement.dataset.action === 'toggleTheme') {
            const nextTheme = document.documentElement.classList.contains('light-theme') ? 'dark' : 'light';
            swipeTheme(nextTheme);
            return;
        }

        if (flipping) return;

        if (targetElement.nodeName.toLowerCase() === 'h1') {
            openWelcome();
            return;
        }

        if (targetElement.dataset.action === 'closeModal') {
            closeModal();
            return;
        }

        if (targetElement.dataset.action === 'giveUp') {
            giveUp();
            return;
        }

        const key = targetElement.dataset.key;

        if (key) handleKey(key);
    };

    $app.addEventListener('click', handleClick);

    Object.values($modals).forEach((dialog) => {
        // Click on the dimmed area around the modal (the dialog itself) dismisses it.
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeModal();
        });
        // ESC: run the fade-out close instead of the dialog's instant native close.
        dialog.addEventListener('cancel', (e) => {
            e.preventDefault();
            closeModal();
        });
    });

    window.addEventListener('keyup', (e) => handleKey(e.key.toLowerCase()));

    const saved = loadSavedGame();
    if (saved) await restoreGame(saved);
    else await getNewWord();
}

function getKeyboardKeyColor(prev: Status | undefined, next: Status): Status {
    return !prev || STATUS_PRIORITY[next] > STATUS_PRIORITY[prev] ? next : prev;
}

function getCharacterColor(char: string, charIndex: number, solutionChars: string[], attemptChars: string[]): Status {
    if (solutionChars[charIndex] === char) return 'green';

    if (solutionChars.includes(char)) {
        const solutionCharCounts: Record<string, number> = {};
        for (let i = 0; i < solutionChars.length; i++) {
            const c = solutionChars[i];
            solutionCharCounts[c] = (solutionCharCounts[c] || 0) + 1;
        }

        // Remove green (exact) matches from available solution counts
        for (let i = 0; i < attemptChars.length; i++) {
            if (solutionChars[i] === attemptChars[i]) {
                solutionCharCounts[attemptChars[i]] = (solutionCharCounts[attemptChars[i]] || 1) - 1;
            }
        }

        // Count how many times this character has been used in the attempt up to (and including) this position,
        // but only count positions that were not already green matches.
        const attemptCharCounts: Record<string, number> = {};
        for (let i = 0; i <= charIndex; i++) {
            if (solutionChars[i] === attemptChars[i]) continue; // skip greens
            const ac = attemptChars[i];
            attemptCharCounts[ac] = (attemptCharCounts[ac] || 0) + 1;
        }

        if (attemptCharCounts[char] <= (solutionCharCounts[char] || 0)) {
            return 'yellow';
        }
    }

    return 'none';
}

app();
