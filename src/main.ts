import './main.scss';

const MAX_ATTEMPTS = 6;

const WORD_LENGTH = 5;

const CHAR_CARD = `<div class="char"><div class="body"><div class="front"></div><div class="back"></div></div></div>`;

type Word = {
    word: string;
    meanings: {
        partOfSpeech: string;
        definitions?:
            | {
                  definition: string;
                  synonyms?: null[] | null;
                  antonyms?: null[] | null;
                  example: string;
              }[]
            | null;
        synonyms?: null[] | null;
        antonyms?: string[] | null;
    }[];
};

function useNotifications() {
    const $notify = $('.notify');

    let showHelperTimeout: ReturnType<typeof setTimeout>;

    const hideNotify = () => {
        $notify.style.opacity = '0';
        showHelperTimeout = setTimeout(() => {
            $notify.innerHTML = '';
        }, 200);
    };

    const notify = (str: string, autoClose = true) => {
        if (showHelperTimeout) clearTimeout(showHelperTimeout);
        $notify.innerHTML = str;

        setTimeout(() => {
            $notify.style.opacity = '1';
        }, 1);

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

// function cookieGet(str: string) {
//     const cookieValue = document.cookie.match(new RegExp(`(^| )__sordle__${str}=([^;]+)`))?.[2] || '';
//     try {
//         return JSON.parse(decodeURIComponent(cookieValue));
//     } catch {
//         return null;
//     }
// }

// function cookieSet<T>(str: string, value: T) {
//     const cookieValue = encodeURIComponent(JSON.stringify(value));
//     document.cookie = `__sordle__${str}=${cookieValue}; SameSite=None; Secure`;
// }

const timeoutPromise = async <T>(ms: number, callback?: () => T): Promise<T> =>
    await new Promise((resolve) =>
        setTimeout(() => {
            resolve(callback?.());
        }, ms)
    );

const $$ = (selector: string, container: ParentNode = document): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

const $ = (selector: string, container: ParentNode = document): HTMLElement =>
    container.querySelector<HTMLElement>(selector);

(async () => {
    const $app = $('.app');
    const $overlay = $('.overlay');
    const $main = $('main');
    const mainContent = $('main').innerHTML;

    const modalContent: Record<'welcome' | 'success' | 'fail', string> = {
        welcome: $overlay.innerHTML,
        success: $('[data-modal="success"]').innerHTML,
        fail: $('[data-modal="fail"]').innerHTML,
    } as const;

    const getJson = async <T>(url: string) => {
        try {
            return (
                window
                    .fetch(url)
                    .then((r) => r.json())
                    .catch(() => null) || null
            );
        } catch {
            // I don't care about 404s
            return null;
        }
    };

    const { hideNotify, notify } = useNotifications();

    let wordMeanings: Word;
    let word: string[] = [];
    let $attempts: HTMLElement;
    const $keyboardKeys: Record<string, HTMLElement> = {};

    const resetMain = (newWord: string[], newWordMeanings: Word) => {
        hideNotify();

        word = newWord;
        wordMeanings = newWordMeanings;

        $main.innerHTML = mainContent;

        $attempts = $('.attempts', $main);

        $attempts.innerHTML = `<div class="attempt">${CHAR_CARD.repeat(WORD_LENGTH)}</div>`.repeat(MAX_ATTEMPTS);

        setAttempt({ index: 0, chars: [] });

        setTimeout(() => {
            $$('[data-key]', $main).forEach((element) => {
                $keyboardKeys[element.dataset.key] = element;
            });
        }, 10);
    };

    const checkWord = async (value: string): Promise<Word | null> =>
        getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${value}`).then((response) => {
            if (Array.isArray(response) && response.length) return response[0] as Word;
            return null;
        });

    let attempt = {
        chars: [] as string[],
        index: 0,
    };

    const setAttempt = (next: typeof attempt) => {
        attempt = next;
        const attemptRow = $attempts.childNodes[attempt.index];

        for (let charIndex = 0; charIndex < WORD_LENGTH; charIndex++) {
            const char = attempt.chars[charIndex];
            const element = attemptRow.childNodes[charIndex] as HTMLElement;
            $('.front', element).innerText = char || '';
            $('.back', element).innerText = char || '';
        }
    };

    const keys: Record<string, 'yellow' | 'green' | 'none'> = {};

    let flipping = false;
    const attemptFlip = async (row: HTMLElement, ms = 300) =>
        await Promise.all([
            ...word.map(async (_, i) =>
                timeoutPromise(i * ms, () => {
                    (row.childNodes[i] as HTMLElement)!.classList.add('flip');
                })
            ),
            timeoutPromise(ms * (WORD_LENGTH + 2)),
        ]);

    let animateErrorTimeout: ReturnType<typeof setTimeout>;
    const animateError = (error: 'cell' | 'row' = 'cell') => {
        if (animateErrorTimeout) clearTimeout(animateErrorTimeout);

        let errorElements = [$attempts.childNodes[attempt.index]?.childNodes[attempt.chars.length] as HTMLElement];

        if (error === 'row')
            errorElements = Array.from($attempts.childNodes[attempt.index]?.childNodes as NodeListOf<HTMLElement>);

        errorElements.forEach((element) => element.classList.add('horizontal-shake'));

        animateErrorTimeout = setTimeout(() => {
            errorElements.forEach((element) => element.classList.remove('horizontal-shake'));
        }, 500);
    };

    let getNewWordCount = 0;
    const getNewWord = async () => {
        notify('Loading new word', false);

        const tempWord = await getJson<string>(`https://random-word-api.herokuapp.com/word?length=${WORD_LENGTH}`).then(
            (words) => words?.[0]
        );

        const tempWordMeanings = tempWord ? await checkWord(tempWord) : null;

        // success

        if (tempWordMeanings) {
            resetMain(tempWord.split(''), tempWordMeanings);
            return;
        }

        // failure - random word not in the dictionary

        if (getNewWordCount > 5) {
            notify('Still loading new word', false);
        }

        if (getNewWordCount > 10) {
            notify('Error loading new word', false);
        }

        getNewWordCount++;
        getNewWord();
    };

    const loadDefinitions = () => {
        if (!wordMeanings?.meanings) return;

        setTimeout(() => {
            $('[data-definition]', $overlay).innerHTML = `<h3>${word.join('')}</h3>
<ul class="meanings">
    ${wordMeanings?.meanings
        .map(
            (meaning) => `    
    <li>
        <p class="part-of-speech"><span>${meaning.partOfSpeech}</span></p>
        <ol>
            ${meaning.definitions
                .map(
                    (definition) => `
            <li>
                <p>${definition.definition}</p>
                ${definition.example ? `<p class="example">"${definition.example}"</p>` : ''}
            </li>`
                )
                .join('')}
        </ol>
    </li>`
        )
        .join('')}
</ul>`;
        }, 1);
    };

    const handleEnter = async () => {
        if (attempt.chars.length < WORD_LENGTH) {
            animateError();
            notify('Not enough letters');
            return;
        }

        const invalidWord = !(await checkWord(attempt.chars.join('')));

        if (invalidWord) {
            animateError('row');
            notify('Not in word list');
            return;
        }

        const currentAttemptRow = $attempts.childNodes[attempt.index] as HTMLElement;

        const currentAttemptElements = currentAttemptRow.childNodes;

        let correct = 0;

        attempt.chars.forEach((char, charIndex) => {
            const element = currentAttemptElements[charIndex] as HTMLElement;

            const backElement = element.firstChild.childNodes[1] as HTMLElement;
            if (word[charIndex] === char) {
                keys[char] = 'green';
                backElement.classList.add('green');
                correct++;
            } else if (word.includes(char)) {
                keys[char] = keys[char] || 'yellow';
                backElement.classList.add('yellow');
            } else {
                keys[char] = 'none';
                backElement.classList.add('none');
            }
        });

        await attemptFlip(currentAttemptRow);

        Object.entries(keys).forEach(([char, color]) => {
            $keyboardKeys[char].classList.add(color);
        });

        if (correct === WORD_LENGTH) {
            $overlay.innerHTML = modalContent.success;

            setTimeout(() => {
                $('[data-attempt-text]', $overlay).innerText = ` ${attempt.index} ${
                    attempt.index ? 'attempts' : 'attempt'
                }`;
            }, 1);
            loadDefinitions();
            getNewWord();
        } else if (attempt.index + 1 === MAX_ATTEMPTS) {
            $overlay.innerHTML = modalContent.fail;
            loadDefinitions();
            getNewWord();
        }

        setAttempt({ chars: [], index: attempt.index + 1 });
    };

    const handleKey = (key: keyof typeof $keyboardKeys) => {
        if (!$keyboardKeys[key]) return;

        if ('backspace' === key) {
            if (attempt.chars.length) {
                attempt.chars.pop();
                setAttempt(attempt);
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

        attempt.chars.push(key);
        setAttempt(attempt);
    };

    const handleClick = async (e: MouseEvent) => {
        e.preventDefault();

        if (flipping) return;

        const targetElement = e.target as HTMLElement;

        targetElement.blur();

        if (targetElement.nodeName.toLowerCase() === 'h1') {
            $overlay.innerHTML = modalContent.welcome;
            return;
        }

        if (targetElement.dataset.action === 'closeModal') {
            $overlay.innerHTML = '';
            return;
        }

        const key = targetElement.dataset.key;

        if (key) handleKey(key);
    };

    $app.addEventListener('click', handleClick);

    $overlay.addEventListener('click', () => {
        $overlay.innerHTML = '';
    });

    window.addEventListener('keyup', (e) => handleKey(e.key.toLowerCase()));

    getNewWord();
})();
