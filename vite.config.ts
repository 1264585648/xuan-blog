import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

type DevReq = {
  method?: string
  on: (event: string, listener: (chunk?: unknown) => void) => void
}

type DevRes = {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (body?: string) => void
}

function mindmapDevSavePlugin(): Plugin {
  return {
    name: 'mindmap-dev-save',
    configureServer(server) {
      server.middlewares.use('/__mindmap/save', (rawReq, rawRes) => {
        const req = rawReq as unknown as DevReq
        const res = rawRes as unknown as DevRes
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        const chunks: string[] = []
        req.on('data', (chunk) => {
          chunks.push(String(chunk ?? ''))
        })
        req.on('end', async () => {
          try {
            const rawBody = chunks.join('')
            const parsed = JSON.parse(rawBody)
            const fsModName = 'node:fs/promises'
            const pathModName = 'node:path'
            const fs = (await import(/* @vite-ignore */ fsModName)) as {
              writeFile: (p: string, data: string, enc: string) => Promise<void>
            }
            const path = (await import(/* @vite-ignore */ pathModName)) as {
              resolve: (... parts: string[]) => string
            }
            const targetFile = path.resolve(
              server.config.root,
              'content/mindmap.json',
            )
            await fs.writeFile(
              targetFile,
              JSON.stringify(parsed, null, 2) + '\n',
              'utf-8',
            )
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (err) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(err) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), mindmapDevSavePlugin()],
})
