declare module "nspell" {
  export interface Dictionary {
    aff: string | any
    dic?: string | any
  }

  export interface SpellingInfo {
    correct: boolean
    forbidden: boolean
    warn: boolean
  }

  export interface NSpell {
    correct(word: string): boolean
    suggest(word: string): string[]
    spell(word: string): SpellingInfo
    add(word: string, model?: string): this
    remove(word: string): this
    wordCharacters(): string | undefined
    dictionary(dic: string | any): this
    personal(dic: string | any): this
  }

  function nspell(dictionary: Dictionary): NSpell

  export = nspell
} 