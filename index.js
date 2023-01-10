const axios = require('axios')
const jsoning = require('jsoning')

require('dotenv').config()

const db = new jsoning('webhooks-db.json')
const config = require('./config.json')

// Express
if (config.expresServer) {
    const express = require('express')
    const app = express()

    app.get("/", (req, res) => {
        console.log(new Date().toString() + " Ping Received")
        res.status(200).send('Updating source index...')
    })
    app.listen(process.env.PORT)
}

// Array chunker
function chunk(arr, size) {
    let r = [], i = 0, l = arr.length
    for (; i < l; i += size) {
        r.push(arr.slice(i, i + size))
    }
    return r
}

// Get flag emotes
function applyEmotes(item) {
    let emotes = ''

    let tags = []
    if (item.tags && item.tags.length > 0) {
        tags = item.tags.find(x => x.type == 'info') ?? []
        if (!Array.isArray(tags)) tags = [tags]
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
        }
    }

    if (item.contentRating == 'ADULT') {
        emotes += config.adult_emote
    }

    return emotes
}


// Main function
async function init() {

    let repos
    try {
        const request = {
            method: 'GET',
            url: config.reposURL
        }

        const response = await axios(request)
        if (!response.data.repos) throw new Error(`No repos from response Err: ${JSON.stringify(response)}`)

        repos = response.data.repos

    } catch (error) {
        throw new Error(error)
    }

    const repoData = []
    for (const repo of repos) {

        try {
            const request = {
                method: 'GET',
                url: `${repo.url}/versioning.json`
            }

            const response = await axios(request)
            const data = response.data

            const authorRegex = /\/\/(.+)\.github.io/
            const repoAuthor = repo.url.match(authorRegex)[1]

            const nameRegex = /github.io\/+(.+)/
            const repoName = repo.url.match(nameRegex)[1]

            repoData.push({
                author: {
                    name: repoAuthor,
                    url: `https://github.com/${repoAuthor}`
                },
                repoURL: `https://github.com/${repoAuthor}/${repoName.split('/').shift()}`,
                baseURL: repo.url,
                name: repo.name ? repo.name : repoName, // If no friendly repon name is provided, use the repoName
                lastUpdated: data.buildTime,
                sources: data.sources
            })

            await new Promise(r => setTimeout(r, 200)) // Small timeout just in case!

        } catch (error) {
            throw new Error(error)
        } finally {
            console.log(`Fetched ${repoData.length}/${repos.length} | ${repo.url}`)
        }
    }

    console.log('Finished fetching repos.')

    const embeds = []
    for (const repo of repoData) {
        const sourceChunk = chunk(repo.sources.sort().map(x => `[${x.name}](${repo.baseURL}) ${applyEmotes(x)}`), config.sourcesPerField)

        const fields = []
        let isFirst = true
        for (const sourcePiece of sourceChunk) {
            fields.push({
                'name': isFirst ? "Sources" : "\n\u200b",
                'value': sourcePiece.join('\n'),
                'inline': true
            })
            isFirst = false
        }

        embeds.push({
            'author': {
                'name': `Owned and maintained by: ${repo.author.name}`,
                'url': repo.repoURL
            },
            'title': repo.name,
            'url': repo.baseURL,
            'description': `This embed has all the sources within this repo.\nClick the source name to go to the repo.\n\n**Base URL:**\n${repo.baseURL}\n\n[Click Here](https://paperback.moe/addRepo/?name=${encodeURI(repo.name)}&url=${repo.baseURL}) to open in Paperback`,
            'color': config.color,
            'fields': fields,
            'timestamp': repo.lastUpdated,
            'footer': {
                'text': 'Last repo update at'
            }
        })
    }

    // Send the webhook(s)
    let i = 1
    for (const embed of embeds) {
        const getMessageId = await db.get(embed.url)

        let request
        if (getMessageId) {
            request = {
                method: 'PATCH',
                url: `${process.env['WEBHOOK_URL']}/messages/${getMessageId}?wait=true`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'embeds': [embed]
                }
            }

        } else {
            request = {
                method: 'POST',
                url: `${process.env['WEBHOOK_URL']}?wait=true`,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    'embeds': [embed]
                }
            }
        }

        let response
        try {
            response = await axios(request)
        } catch (error) {
            throw new Error(error)
        } finally {
            console.log(`Posted ${i++}/${embeds.length} | ${embed.url}`)
        }

        if (!response.data.id) throw new Error(`No messageId from response Err: ${JSON.stringify(response)}`)

        // Store messageId in database
        await db.set(embed.url, response.data.id)

        await new Promise(r => setTimeout(r, 3000)) // A 3 second delay to avoid being ratelimited!
    }

    console.log('Finished updating/posting webhooks.')
    process.exitCode = 1
}

init()

// Set interval to repeat the main function every 1 hour
setInterval(() => {
    console.log('Posting...')
    init()
}, 3600000)
