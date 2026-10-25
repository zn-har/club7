import react from '@vitejs/plugin-react'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

/**
 * Dev-only: POST a data-URL to /__grab?name=x and it lands in .grabs/x.png.
 * Used to inspect canvas renders at full resolution while art-directing.
 */
function frameGrab(): Plugin {
  return {
    name: 'frame-grab',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__grab', (req, res) => {
        const name = (new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? 'grab').replace(/[^\w-]/g, '')
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          const dir = resolve(__dirname, '.grabs')
          mkdirSync(dir, { recursive: true })
          writeFileSync(resolve(dir, `${name}.png`), Buffer.from(body.replace(/^data:image\/png;base64,/, ''), 'base64'))
          res.end('ok')
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), frameGrab()],
})
