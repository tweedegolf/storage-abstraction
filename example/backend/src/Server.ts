import { ServerLoader, ServerSettings, GlobalAcceptMimesMiddleware, Request } from '@tsed/common';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import methodOverride from 'method-override';
import '@tsed/swagger';
import '@tsed/typeorm';
import '@tsed/ajv';
import 'reflect-metadata';
import { getConnection } from 'typeorm';
import { Address } from './entities/Address';
import { SUPPORTED_MIME_TYPES } from './controllers/MediaController';
import { AjvErrorObject } from '@tsed/ajv/lib/interfaces/IAjvSettings';
dotenv.config();

const rootDir = __dirname;

@ServerSettings({
  rootDir,
  uploadDir: '/tmp/uploads',
  acceptMimes: ['application/json'],
  port: 3000,
  mount: {
    '/api/v1': '${rootDir}/controllers/**/*.ts',
  },
  componentsScan: [
    `${rootDir}/services/**/**.ts`,
  ],
  typeorm: [{
    name: 'tg',
    type: 'postgres',
    url: 'postgres://tg@psql:5432/tg',
    synchronize: true,
    entities: [
      `${rootDir}/entities/*.ts`,
    ],
    migrations: [
      `${__dirname}/migrations/*{.ts,.js}`,
    ],
    subscribers: [
      `${__dirname}/subscriber/*{.ts,.js}`,
    ],
  }],
  multer: {
    fileFilter: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, SUPPORTED_MIME_TYPES.includes(file.mimetype));
    },
  },
  swagger: [{
    path: '/docs',
  }],
  ajv: {
    errorFormat: (error: AjvErrorObject) => {
      return `At ${error.modelName}${error.dataPath}, value '${error.data}' ${error.message}`;
    },
    options: { verbose: true },
  },
})
export class Server extends ServerLoader {
  /**
   * @returns {Server}
   */
  public $onMountingMiddlewares(): void | Promise<any> {
    this
      .use(GlobalAcceptMimesMiddleware)
      .use(cookieParser())
      .use(compression({}))
      .use(methodOverride())
      .use(cors())
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({
        extended: true,
      }));

    return null;
  }
}

new Server().start()
  // .then(async () => {
  //   const con = await getConnection('tg').getRepository(Address);
  //   console.log('CONNECTION', con);
  // })
  .catch((err) => {
    console.error(err);
  });
