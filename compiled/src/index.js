"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const jsoning_1 = __importDefault(require("jsoning"));
const db = new jsoning_1.default('webhooks-db.json');
const config_json_1 = require("../config.json");
const Express_1 = require("./Express");
const Functions_1 = require("./Functions");
async function init() {
    // Start the Express server
    if (config_json_1.expresServer)
        (0, Express_1.startServer)();
    const repos = await getRepos();
    let i = 1;
    for (const repo of repos) {
        const repoInfo = await getRepoData(repo);
        const sourceChunks = (0, Functions_1.chunk)(repoInfo.sources.sort().map(x => `[${x.name}](${repoInfo.baseURL}) ${(0, Functions_1.applyEmotes)(x)}`), config_json_1.sourcesPerField);
        const fields = [];
        let isFirst = true;
        for (const sourceChunk of sourceChunks) {
            fields.push({
                'name': isFirst ? "Sources" : "\n\u200b",
                'value': sourceChunk.join('\n'),
                'inline': true
            });
            isFirst = false;
        }
        const embed = {
            'author': {
                'name': `Owned and maintained by: ${repoInfo.author.name}`,
                'url': repoInfo.repoURL
            },
            'title': repo.name,
            'url': repoInfo.baseURL,
            'description': `This embed has all the sources within this repo.\nClick the source name to go to the repo.\n\n**Discord**\n${repo.devId ? `<@${repo.devId}>` : 'N/A'}\n\n**Base URL**\n${repoInfo.baseURL}\n\n[Click Here](https://paperback.moe/addRepo/?name=${encodeURI(repo.name)}&url=${repoInfo.baseURL}) to open in Paperback\n\n**Github Repo**\n${repoInfo.repoURL}`,
            'color': (0, Functions_1.getColor)(repoInfo.version),
            'fields': fields,
            'timestamp': repoInfo.lastUpdated,
            'footer': {
                'text': 'Last repo update at'
            }
        };
        await postWebhook(repoInfo, embed);
        console.log(`Posted ${i++}/${repos.length} | ${embed.url}`);
    }
    console.log('Finished updating/posting webhooks.');
}
init();
async function getRepos() {
    try {
        const request = {
            method: 'GET',
            url: config_json_1.repoListingURL
        };
        const response = (await (0, axios_1.default)(request)).data;
        if (!response.repos)
            throw new Error(`No repos from response Err: ${JSON.stringify(response)}`);
        return response.repos;
    }
    catch (error) {
        throw new Error(error);
    }
}
async function getRepoData(repo) {
    try {
        const request = {
            method: 'GET',
            url: `${repo.url}/versioning.json`
        };
        const response = (await (0, axios_1.default)(request)).data;
        const githubUsername = repo.url.match(/\/\/(.+)\.github.io/)[1];
        const repoName = repo.url.match(/github.io\/+(.+)/)[1];
        return {
            author: {
                name: githubUsername,
                url: `https://github.com/${githubUsername}`
            },
            repoURL: `https://github.com/${githubUsername}/${repoName.split('/').shift()}`,
            baseURL: repo.url,
            name: repo.name ? repo.name : repoName,
            lastUpdated: response.buildTime,
            version: repo.version,
            sources: response.sources,
            devId: repo.devId
        };
    }
    catch (error) {
        throw new Error(error);
    }
}
async function postWebhook(repoInfo, embed) {
    try {
        const getMessageId = await db.get(repoInfo.baseURL);
        const webhookURL = (0, Functions_1.getWebhook)(repoInfo.version);
        let request;
        if (getMessageId) { // If repo has already been posted
            request = {
                method: 'PATCH',
                url: `${webhookURL}/messages/${getMessageId}?wait=true`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'embeds': [embed]
                }
            };
        }
        else { // If repo is new
            request = {
                method: 'POST',
                url: `${webhookURL}?wait=true`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'embeds': [embed]
                }
            };
        }
        const response = (await (0, axios_1.default)(request)).data;
        if (!response.id)
            throw new Error(`No messageId from response Err: ${JSON.stringify(response)}`);
        // Store messageId in database
        await db.set(embed.url, response.id);
        await new Promise(r => setTimeout(r, 3000)); // A 3 second delay to avoid being ratelimited!
    }
    catch (error) {
        throw new Error(error);
    }
}
//# sourceMappingURL=index.js.map