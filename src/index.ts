import axios from 'axios'

import jsoning from 'jsoning'
const db = new jsoning('webhooks-db.json')


import { expresServer, repoListingURL, sourcesPerField, colors } from '../config.json'
import { startServer } from './Express'
import { Repo, RepoData, RepoInfo, Repos } from './Interfaces'
import { applyEmotes, chunk, getColor, getWebhook } from './Functions'

async function init() {
    // Start the Express server
    if (expresServer) startServer()

    const repos = await getRepos()

    let i = 1
    for (const repo of repos) {
        const repoInfo = await getRepoData(repo)
        const sourceChunks: any = chunk(repoInfo.sources.sort().map(x => `[${x.name}](${repoInfo.baseURL}) ${applyEmotes(x)}`), sourcesPerField)

        const fields: any[] = []
        let isFirst = true
        for (const sourceChunk of sourceChunks) {
            fields.push({
                'name': isFirst ? "Sources" : "\n\u200b",
                'value': sourceChunk.join('\n'),
                'inline': true
            })
            isFirst = false
        }

        const embed = {
            'author': {
                'name': `Owned and maintained by: ${repoInfo.author.name}`,
                'url': repoInfo.repoURL
            },
            'title': repo.name,
            'url': repoInfo.baseURL,
            'description': `This embed has all the sources within this repo.\nClick the source name to go to the repo.\n\n**Discord**\n${repo.devId ? `<@${repo.devId}>` : 'N/A'}\n\n**Base URL**\n${repoInfo.baseURL}\n\n[Click Here](https://paperback.moe/addRepo/?name=${encodeURI(repo.name)}&url=${repoInfo.baseURL}) to open in Paperback\n\n**Github Repo**\n${repoInfo.repoURL}`,
            'color': getColor(repoInfo.version),
            'fields': fields,
            'timestamp': repoInfo.lastUpdated,
            'footer': {
                'text': 'Last repo update at'
            }
        }

        await postWebhook(repoInfo, embed)
        console.log(`Posted ${i++}/${repos.length} | ${embed.url}`)
    }

    console.log('Finished updating/posting webhooks.')
}

init()

async function getRepos(): Promise<Repo[]> {
    try {
        const request = {
            method: 'GET',
            url: repoListingURL
        }

        const response: Repos = (await axios(request)).data
        if (!response.repos) throw new Error(`No repos from response Err: ${JSON.stringify(response)}`)

        return response.repos

    } catch (error) {
        throw new Error(error as string)
    }
}

async function getRepoData(repo: Repo): Promise<RepoInfo> {
    try {
        const request = {
            method: 'GET',
            url: `${repo.url}/versioning.json`
        }

        const response: RepoData = (await axios(request)).data

        const githubUsername = repo.url.match(/\/\/(.+)\.github.io/)![1]
        const repoName = repo.url.match(/github.io\/+(.+)/)![1]

        return {
            author: {
                name: githubUsername,
                url: `https://github.com/${githubUsername}`
            },
            repoURL: `https://github.com/${githubUsername}/${repoName.split('/').shift()}`,
            baseURL: repo.url,
            name: repo.name ? repo.name : repoName, // If no friendly repon name is provided, use the repoName
            lastUpdated: response.buildTime,
            version: repo.version,
            sources: response.sources,
            devId: repo.devId
        }

    } catch (error) {
        throw new Error(error as string)
    }
}

async function postWebhook(repoInfo: RepoInfo, embed) {
    try {
        const getMessageId = await db.get(repoInfo.baseURL)
        const webhookURL = getWebhook(repoInfo.version)

        let request: any
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
            }

        } else { // If repo is new
            request = {
                method: 'POST',
                url: `${webhookURL}?wait=true`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'embeds': [embed]
                }
            }
        }

        const response = (await axios(request)).data
        if (!response.id) throw new Error(`No messageId from response Err: ${JSON.stringify(response)}`)

        // Store messageId in database
        await db.set(embed.url, response.id)

        await new Promise(r => setTimeout(r, 3000)) // A 3 second delay to avoid being ratelimited!

    } catch (error) {
        throw new Error(error as string)
    }
}