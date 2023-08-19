export const $$ = (selector: string, container: ParentNode = document): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(selector));

export const $ = (selector: string, container: ParentNode = document): HTMLElement =>
    container.querySelector<HTMLElement>(selector);

export const useFetch = <T>(setLoading: (loading: boolean) => void) => {
    const getText = async <T>(url: string) => {
        setLoading(true);
        return (
            window
                .fetch(url)
                .then((r) => r.text())
                .then(async (response) => {
                    setLoading(false);
                    return response;
                })
                .catch(() => null) || null
        );
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

    return { getJson, getText };
};

const WORD_COUNT = 7435;

export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

export const useWords = <T>(setLoading: (loading: boolean) => void) => {
    const { getText, getJson } = useFetch(setLoading);

    const words: string[] = [];

    const loadWords = () =>
        getText('https://iambrian.com/sordle-words/5-letter-words.txt').then((w) => {
            words.push(...w.split('\n'));
        });

    const getRandomWord = async (): Promise<Word> => {
        const word = words[randomNumber(0, 7435)];
        const response: Word[] = await getJson('https://iambrian.com/sordle-words/5-letter-words/' + word + '.json');
        return response[0];
    };

    const checkWord = (w: string) => words.includes(w);

    return {
        loadWords,
        getRandomWord,
        checkWord,
    };
};

export const waitFor = async (ms: number) =>
    await new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });

export const waitForFramePaint = async () =>
    await new Promise((resolve) => {
        requestAnimationFrame(() => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = resolve;
            messageChannel.port2.postMessage(undefined);
        });
    });

export function useNotifications() {
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

export function cookieGet(str: string) {
    const cookieValue = document.cookie.match(new RegExp(`(^| )__sordle__${str}=([^;]+)`))?.[2] || '';
    try {
        return JSON.parse(decodeURIComponent(cookieValue));
    } catch {
        return null;
    }
}

export function cookieSet<T>(str: string, value: T) {
    const cookieValue = encodeURIComponent(JSON.stringify(value));
    document.cookie = `__sordle__${str}=${cookieValue}; SameSite=None; Secure`;
}
