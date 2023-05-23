import { Source, Tag } from "./Interfaces"
import { adult_emote, colors } from '../config.json'
require('dotenv').config()


export function chunk(arr: any = [], size: number) {
    let r = [], i = 0, l = arr.length
    for (; i < l; i += size) {
        // @ts-ignore
        r.push(arr.slice(i, i + size))
    }
    return r
}


export function applyEmotes(source: Source) {
    let emotes = ''

    let tags: Tag[] = []
    if (source.tags && source.tags.length > 0) {
        const tag = source.tags.find(x => x.type == 'info') ? source.tags.find(x => x.type == 'info') : []
        if (tag && !Array.isArray(tag)) {
            tags = [tag]
        } else if (tag) {
            tags = tag
        }
    }

    for (const tag of tags) {
        switch (tag.text.toUpperCase()) {
            case 'SPANISH':
                emotes = '🇪🇸'
                break
            case 'BRAZIL':
                emotes = '🇧🇷'
                break
            case 'RAW':
            case 'JAPANESE':
                emotes = '🇯🇵'
                break
            case 'FRENCH':
                emotes = '🇫🇷'
                break
            case 'RUSSIAN':
                emotes = '🇷🇺'
                break
            case 'ARABIC':
                emotes = '🇦🇪'
                break
            case 'PORTUGUESE':
                emotes = '🇵🇹'
                break
            case 'ITALIAN':
                emotes = '🇮🇹'
                break
            case 'GERMAN':
                emotes = '🇩🇪'
                break
            case 'TURKISH':
                emotes = '🇹🇷'
                break
        }
    }

    if (source.contentRating == 'ADULT') {
        emotes += adult_emote
    }

    return emotes
}

export function getColor(version: string): number {
    switch (version) {
        case '0.8':
            return colors.orange

        default:
            return colors.blue
    }
}

export function getWebhook(version: string): string {
    switch (version) {
        case '0.8':
            return process.env['WEBHOOK_URL_0_8'] as string

        default:
            return process.env['WEBHOOK_URL_0_6'] as string
    }
}
