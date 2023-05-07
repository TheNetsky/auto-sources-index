"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhook = exports.getColor = exports.applyEmotes = exports.chunk = void 0;
const config_json_1 = require("../config.json");
require('dotenv').config();
function chunk(arr = [], size) {
    let r = [], i = 0, l = arr.length;
    for (; i < l; i += size) {
        // @ts-ignore
        r.push(arr.slice(i, i + size));
    }
    return r;
}
exports.chunk = chunk;
function applyEmotes(source) {
    let emotes = '';
    let tags = [];
    if (source.tags && source.tags.length > 0) {
        const tag = source.tags.find(x => x.type == 'info') ? source.tags.find(x => x.type == 'info') : [];
        if (tag && !Array.isArray(tag)) {
            tags = [tag];
        }
        else if (tag) {
            tags = tag;
        }
    }
    for (const tag of tags) {
        switch (tag.text.toUpperCase()) {
            case 'SPANISH':
                emotes = '🇪🇸';
                break;
            case 'BRAZIL':
                emotes = '🇧🇷';
                break;
            case 'RAW':
            case 'JAPANESE':
                emotes = '🇯🇵';
                break;
            case 'FRENCH':
                emotes = '🇫🇷';
                break;
            case 'RUSSIAN':
                emotes = '🇷🇺';
                break;
            case 'ARABIC':
                emotes = '🇦🇪';
                break;
            case 'PORTUGUESE':
                emotes = '🇵🇹';
                break;
            case 'ITALIAN':
                emotes = '🇮🇹';
                break;
            case 'GERMAN':
                emotes = '🇩🇪';
                break;
        }
    }
    if (source.contentRating == 'ADULT') {
        emotes += config_json_1.adult_emote;
    }
    return emotes;
}
exports.applyEmotes = applyEmotes;
function getColor(version) {
    switch (version) {
        case '0.8':
            return config_json_1.colors.orange;
        default:
            return config_json_1.colors.blue;
    }
}
exports.getColor = getColor;
function getWebhook(version) {
    switch (version) {
        case '0.8':
            return process.env['WEBHOOK_URL_0_8'];
        default:
            return process.env['WEBHOOK_URL_0_6'];
    }
}
exports.getWebhook = getWebhook;
//# sourceMappingURL=Functions.js.map