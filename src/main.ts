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

function cookieGet(str: string) {
    const cookieValue = document.cookie.match(new RegExp(`(^| )__sordle__${str}=([^;]+)`))?.[2] || '';
    try {
        return JSON.parse(decodeURIComponent(cookieValue));
    } catch {
        return null;
    }
}

function cookieSet<T>(str: string, value: T) {
    const cookieValue = encodeURIComponent(JSON.stringify(value));
    document.cookie = `__sordle__${str}=${cookieValue}; SameSite=None; Secure`;
}

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
    const $helper = $('.helper');

    const $buttons: Record<string, HTMLElement> = {};
    $$('[data-key]').forEach((element) => {
        $buttons[element.dataset.key!] = element;
    });

    const $attempts = $('.attempts');

    const $overlay = $('.overlay');

    const modalContent: Record<'welcome' | 'success' | 'fail', string> = {
        welcome: $overlay.innerHTML,
        success: $('[data-modal="success"]').innerHTML,
        fail: $('[data-modal="fail"]').innerHTML,
    } as const;

    const checkWord = async (value: string): Promise<Word | null> =>
        window
            .fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + value)
            .then((r) => r.json())
            .then((response) => {
                if (Array.isArray(response) && response.length) return response[0] as Word;
                return null;
            })
            .catch(() => null);

    let wordMeanings: Word;
    let word: string[] = [];
    const setWord = (next: typeof word) => {
        word = next;

        const char = `<div class="char"><div class="body"><div class="front"></div><div class="back"></div></div></div>`;
        $attempts.innerHTML = `<div class="attempt">${char.repeat(WORD_LENGTH)}</div>`.repeat(MAX_ATTEMPTS);

        Object.values($buttons).forEach((element) => element.classList.remove('yellow', 'green', 'none'));
    };

    setWord(['h', 'e', 'l', 'l', 'o']); // there 👋

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
    const animateFlip = async (row: HTMLElement, ms = 300) =>
        await Promise.all([
            ...word.map(async (_, i) =>
                timeoutPromise(i * ms, () => {
                    console.log(row.childNodes[i]);
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
        const tempWord = await window
            .fetch('https://random-word-api.herokuapp.com/word?length=' + WORD_LENGTH)
            .then((r) => r.json())
            .then((words) => {
                return words[0];
            });

        const tempWordMeanings = await checkWord(tempWord);

        if (tempWordMeanings) {
            wordMeanings = tempWordMeanings;
            setWord(tempWord.split(''));
            return;
        }

        if (getNewWordCount > 5) {
            showHelper('Still loading new word', false);
            return;
        }

        if (getNewWordCount > 10) {
            showHelper('Error loading new word', false);
            return;
        }

        getNewWordCount++;
        getNewWord();
    };

    const loadNewWord = async () => {
        $overlay.innerHTML = '';

        showHelper('Loading new word', false);

        await getNewWord();

        showHelper('Loading new word');

        setAttempt({ index: 0, chars: [] });
    };

    let showHelperTimeout: ReturnType<typeof setTimeout>;
    const showHelper = (str: string, autoClose = true) => {
        if (showHelperTimeout) clearTimeout(showHelperTimeout);
        $helper.innerHTML = str;

        setTimeout(() => {
            $helper.style.opacity = '1';
        }, 1);

        if (autoClose)
            showHelperTimeout = setTimeout(() => {
                $helper.style.opacity = '0';
                showHelperTimeout = setTimeout(() => {
                    $helper.innerHTML = '';
                }, 200);
            }, 1500);
    };

    const handleEnter = async () => {
        if (attempt.chars.length < WORD_LENGTH) {
            animateError();
            showHelper('Not enough letters');
            return;
        }

        const invalidWord = !(await checkWord(attempt.chars.join('')));

        if (invalidWord) {
            animateError('row');
            showHelper('Not in word list');
            return;
        }

        const currentAttemptRow = $attempts.childNodes[attempt.index] as HTMLElement;

        const currentAttemptElements = currentAttemptRow.childNodes;

        let correct = 0;

        attempt.chars.forEach((char, charIndex) => {
            const element = currentAttemptElements[charIndex] as HTMLElement;

            if (word[charIndex] === char) {
                keys[char] = 'green';
                element.classList.add('green');
                correct++;
            } else if (word.includes(char)) {
                keys[char] = keys[char] || 'yellow';
                element.classList.add('yellow');
            } else {
                keys[char] = 'none';
                element.classList.add('none');
            }
        });

        await animateFlip(currentAttemptRow);

        Object.entries(keys).forEach(([char, color]) => {
            $buttons[char].classList.add(color);
        });

        if (correct === WORD_LENGTH) {
            $overlay.innerHTML = modalContent.success;
            setTimeout(() => {
                $('[data-attempt-text]', $overlay).innerText = ` ${attempt.index} ${
                    attempt.index ? 'attempts' : 'attempt'
                }`;
            }, 1);
        }

        if (attempt.index + 1 === MAX_ATTEMPTS) {
            $overlay.innerHTML = modalContent.fail;
        }

        if ($overlay.innerHTML && wordMeanings?.meanings) {
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
        }

        setAttempt({ chars: [], index: attempt.index + 1 });
    };

    const handleClick = async (e: MouseEvent) => {
        if (flipping) return;

        const targetElement = e.target as HTMLElement;

        if (targetElement.nodeName.toLowerCase() === 'h1') {
            $overlay.innerHTML = modalContent.welcome;
            return;
        }

        if (targetElement.dataset.action === 'loadWord') {
            loadNewWord();
            return;
        }

        const key = targetElement.dataset.key;

        if (!key) return;

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

        if (attempt.chars.length === WORD_LENGTH) attempt.chars.pop();
        attempt.chars.push(key);
        setAttempt(attempt);
    };

    const existingWord = cookieGet('word');
    if (existingWord) {
        $overlay.innerHTML = '';
        setWord(existingWord.split(''));
    }

    $app.addEventListener('click', handleClick);
})();
