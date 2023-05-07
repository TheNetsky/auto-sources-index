import express from 'express'

export function startServer() {
    const app = express()

    app.get("/", (req, res) => {
        console.log(new Date().toString() + 'Ping Received')
        res.status(200).send('Updating source index...')
    })
    app.listen(process.env.PORT)
}

