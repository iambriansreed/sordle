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
