import { createServer } from "node:http";
import { createApp, defineEventHandler, serveStatic, toNodeListener, setResponseHeader, setResponseStatus } from "h3";
import { stat, readFile } from "node:fs/promises";
import { join } from "pathe";

export const app = createApp();

const publicDir = './node_modules/@medplum/app/dist';

const MEDPLUM_BASE_URL = 'http://localhost:4443/';
const MEDPLUM_CLIENT_ID = '';
const MEDPLUM_REGISTER_ENABLED = 'false';
const GOOGLE_CLIENT_ID = '';
const RECAPTCHA_SITE_KEY = '';

app.use(
  defineEventHandler((event) => {
    return serveStatic(event, {
      getContents: async (id) => {
        console.log("GET: " +id);
        let stats = await stat(join(publicDir, id)).catch(() => {});
        if (!stats || !stats.isFile()) {
          id = 'index.html';
        }
        const filePath = join(publicDir, id);
        if (id.endsWith(".js")) {
          try {
            let content = await readFile(filePath, 'utf-8');
            content = content.replace(/__MEDPLUM_BASE_URL__|__MEDPLUM_CLIENT_ID__|__MEDPLUM_REGISTER_ENABLED__|__GOOGLE_CLIENT_ID__|__RECAPTCHA_SITE_KEY__/g, (match) => {
              switch (match) {
                case "__MEDPLUM_BASE_URL__": return MEDPLUM_BASE_URL;
                case "__MEDPLUM_CLIENT_ID__": return MEDPLUM_CLIENT_ID;
                case "__MEDPLUM_REGISTER_ENABLED__": return MEDPLUM_REGISTER_ENABLED;
                case "__GOOGLE_CLIENT_ID__": return GOOGLE_CLIENT_ID;
                case "__RECAPTCHA_SITE_KEY__": return RECAPTCHA_SITE_KEY;
                default: return match;
              }
            });

            setResponseHeader(event, 'Content-Type', 'application/javascript');
            setResponseHeader(event, 'Content-Length', Buffer.byteLength(content));
            return content;
          } catch (err) {
            console.error('Error reading or processing file:', err);
            setResponseStatus(event, 500);
            return 'Internal Server Error';
          }
        }

        if (id.endsWith(".css")) {
          const content = await readFile(filePath, 'utf-8');
          setResponseHeader(event, 'Content-Type', 'text/css');
          setResponseHeader(event, 'Content-Length', Buffer.byteLength(content));
          return content;
        }

        let content = await readFile(filePath, 'utf-8').catch(() => {});
        if (!content) {
          console.log('No File');
          return null;
        }
        setResponseHeader(event, 'Content-Length', Buffer.byteLength(content));
        setResponseHeader(event, 'Content-Type', 'text/html');
        return content;
      },
      getMeta: async (id) => {
        let stats = await stat(join(publicDir, id)).catch(() => {});

        if (!stats || !stats.isFile()) {
          stats = await stat(join(publicDir, 'index.html')).catch(() => {});
        }

        return {
          size: stats.size,
          mtime: stats.mtimeMs,
        };
      },
      indexNames: ["index.html"],

    });
  }),
);


createServer(toNodeListener(app)).listen(process.env.PORT || 3030);

console.log('Server running on port 3030');