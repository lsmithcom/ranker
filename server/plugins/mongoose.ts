import mongoose from 'mongoose'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()
  const uri = config.mongodbUri

  if (!uri) {
    console.error('[MongoDB] MONGODB_URI is not set')
    return
  }

  const connect = async (retries = 5): Promise<void> => {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 60000,
        heartbeatFrequencyMS: 10000,
        connectTimeoutMS: 30000,
      })
      console.log('[MongoDB] Connected successfully')
    } catch (err) {
      console.error('[MongoDB] Connection error:', err)
      if (retries > 0) {
        console.log(`[MongoDB] Retrying... (${retries} attempts left)`)
        await new Promise(r => setTimeout(r, 5000))
        return connect(retries - 1)
      }
      console.error('[MongoDB] All connection attempts failed')
    }
  }

  await connect()

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected')
  })

  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] Error:', err)
  })

  process.on('SIGTERM', async () => {
    await mongoose.connection.close()
    console.log('[MongoDB] Connection closed on SIGTERM')
  })
})
