export const $$ = (selector: string, container: ParentNode = document): HTMLElement[] => {
    const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));
    if (!elements) throw new Error(`Element not found: ${selector}`);
    return elements;
};

export const $ = (selector: string, container: ParentNode = document): HTMLElement => {
    const element = container?.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    return element;
};

export const useFetch = (setLoading: (loading: boolean) => void) => {
    const getText = async (url: string) => {
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

    const getJson = async (url: string) => {
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

export const randomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);

export const useWords = (setLoading: (loading: boolean) => void) => {
    const { getText, getJson } = useFetch(setLoading);

    const words: string[] = [];

    const loadWords = async () => {
        const word = await getText('https://iambrian.com/sordle-words/5-letter-words.txt');
        if (word) words.push(...word.split('\n'));
    };

    const getRandomWord = async (): Promise<Word> => {
        const word = words[randomNumber(0, 7435)];
        const response: Word[] = await getJson(
            'https://iambrian.com/sordle-words/5-letter-words/' + word + '.json'
        );
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
    const $notify = $('.notify')!;

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
