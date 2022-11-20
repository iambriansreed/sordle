import './main.scss';

const MAX_ATTEMPTS = 6;

const WORD_LENGTH = 5;

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

const $$ = (selector: string, container: ParentNode = document): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

const $ = (selector: string, container: ParentNode = document): HTMLElement =>
    container.querySelector<HTMLElement>(selector);

(async () => {
    const $app = $('.app');
    const $overlay = $('.overlay');
    const $main = $('main');
    const mainContent = $('main').innerHTML;

    const templates: Record<string, string> = {
        welcome: $('[data-template="modal-welcome"]').innerHTML,
        success: $('[data-template="modal-success"]').innerHTML,
        fail: $('[data-template="modal-fail"]').innerHTML,
    } as const;

    $overlay.innerHTML = templates.welcome;

    let loadingInterval: ReturnType<typeof setInterval>;
    let isLoading = false;
    const setLoading = (loading: boolean) => {
        if (loading === isLoading) return;
        isLoading = loading;
        if (loading) $app.classList.add('loading');
        loadingInterval = setTimeout(() => {
            if (!isLoading) {
                $app.classList.remove('loading');
                return;
            }
            setLoading(true);
        }, 2000);
    };

    const getJson = async <T>(url: string) => {
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

    const { hideNotify, notify } = useNotifications();

    let wordMeanings: Word;
    let word: string[] = [];
    let $attempts: HTMLElement;
    const $keyboardKeys: Record<string, HTMLElement> = {};
    let $chars = () => $$(`main .attempt:nth-child(${attempt.index + 1}) .char`);

    const resetMain = async (newWord: string[], newWordMeanings: Word) => {
        hideNotify();

        word = newWord;
        wordMeanings = newWordMeanings;

        $main.innerHTML = mainContent;

        $attempts = $('.attempts', $main);

        let attemptsHtml = '';
        for (let rowIndex = 0; rowIndex < MAX_ATTEMPTS; rowIndex++) {
            attemptsHtml += `<div class="attempt">`;
            for (let charIndex = 0; charIndex < WORD_LENGTH; charIndex++) {
                attemptsHtml += `<div class="char" id="char-${rowIndex}-${charIndex}"><div class="front"></div><div class="back"></div></div>`;
            }
            attemptsHtml += `</div>`;
        }

        $attempts.innerHTML = attemptsHtml;

        await waitForFramePaint();

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

    const setChar = (char: string) => {
        const $char = $(`#char-${attempt.index}-${attempt.chars.length}`);
        $('.front', $char).innerText = char || '';
        $('.back', $char).innerText = char || '';
    };

    const setAttempt = (next: typeof attempt) => {
        attempt = next;
    };

    let flipping = false;
    const attemptFlip = async (ms = 300) => {
        flipping = true;

        await Promise.all([
            ...$chars().map(async ($element, i) => {
                await waitFor(ms * i);
                $element!.classList.add('flip');
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

    let getNewWordCount = 0;
    const getNewWord = async () => {
        notify('Loading new word', false);

        const tempWord = await getJson<string>(`https://random-word-api.herokuapp.com/word?length=${WORD_LENGTH}`).then(
            (words) => words?.[0]
        );

        const tempWordMeanings = tempWord ? await checkWord(tempWord) : null;

        // success

        if (tempWordMeanings) {
            return resetMain(tempWord.split(''), tempWordMeanings);
        }

        // failure - random word not in the dictionary

        if (getNewWordCount > 5) {
            notify('Still loading new word', false);
        }

        if (getNewWordCount > 10) {
            notify('Error loading new word', false);
            return;
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

        let correct = 0;

        const keys: Record<string, 'yellow' | 'green' | 'none'> = {};

        const charElements = $chars();

        attempt.chars.forEach((char, charIndex) => {
            if (word[charIndex] === char) {
                keys[char] = 'green';
                charElements[charIndex].classList.add('green');
                correct++;
            } else if (word.includes(char)) {
                keys[char] = keys[char] || 'yellow';
                charElements[charIndex].classList.add('yellow');
            } else {
                keys[char] = keys[char] || 'none';
            }
        });

        await attemptFlip();

        Object.entries(keys).forEach(([char, color]) => {
            $keyboardKeys[char].classList.add(color);
        });

        if (correct === WORD_LENGTH) {
            $overlay.innerHTML = templates.success;

            setTimeout(() => {
                $('[data-attempt-text]', $overlay).innerText = ` ${attempt.index} ${
                    attempt.index ? 'attempts' : 'attempt'
                }`;
            }, 1);
            loadDefinitions();
            getNewWord();
        } else if (attempt.index + 1 === MAX_ATTEMPTS) {
            $overlay.innerHTML = templates.fail;
            loadDefinitions();
            getNewWord();
        }

        setAttempt({ chars: [], index: attempt.index + 1 });
    };

    const handleKey = (key: keyof typeof $keyboardKeys) => {
        if (flipping) return;

        if (!$keyboardKeys[key]) return;

        if ('backspace' === key) {
            if (attempt.chars.length) {
                attempt.chars.pop();
                setChar('');
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

        setChar(key);
        attempt.chars.push(key);
        setAttempt(attempt);
    };

    const handleClick = async (e: MouseEvent) => {
        e.preventDefault();

        if (flipping) return;

        const targetElement = e.target as HTMLElement;

        targetElement.blur();

        if (targetElement.nodeName.toLowerCase() === 'h1') {
            $overlay.innerHTML = templates.welcome;
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
