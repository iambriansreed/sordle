import './main.scss';
import { useWords, $, $$, useNotifications, waitFor, waitForFramePaint } from './utils';

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

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

    const { checkWord, getRandomWord, loadWords } = useWords(setLoading);

    loadWords().then(() => getNewWord());

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
                if (element.dataset.key) $keyboardKeys[element.dataset.key] = element;
            });
        }, 10);
    };

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

    const getNewWord = async () => {
        const newWordMeanings = await getRandomWord();
        return resetMain(newWordMeanings.word.split(''), newWordMeanings);
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
                ?.map(
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
        if (flipping) return;

        const targetElement = e.target as HTMLElement;

        if (targetElement.nodeName.toLowerCase() === 'a') {
            return;
        }

        e.preventDefault();

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
})();

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/serviceWorker.js')
            .then(() => console.info('service worker registered'))
            .catch((err) => console.info('service worker not registered', err));
    });
}
