import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import ufoStudioRoutes from '../Nexus ORM/routes/index'

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'UFO Server running' })
})

// Mount ufo-studio routes at /ufo-studio (serves new React app from studio/dist when built, else legacy)
app.use('/ufo-studio', ufoStudioRoutes)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`UFO Server listening on port ${PORT}`)
})
