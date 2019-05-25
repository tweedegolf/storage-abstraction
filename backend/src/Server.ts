import { ServerLoader, ServerSettings, GlobalAcceptMimesMiddleware } from "@tsed/common";
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import compress from 'compression';
import cors from 'cors';
import methodOverride from 'method-override';
import '@tsed/swagger';
import '@tsed/typeorm';
import '@tsed/ajv';
import 'reflect-metadata';
import { getConnection } from "typeorm";
import { Address } from "./entities/Address";

const rootDir = __dirname;

@ServerSettings({
  rootDir,
  acceptMimes: ["application/json"],
  port: 3000,
  mount: {
    '/api/v1': '${rootDir}/controllers/**/*.ts',
  },
  swagger: [{
    path: '/docs'
  }
  ],
  ajv: {
    errorFormat: (error) => `At ${error.modelName}${error.dataPath}, value '${error.data}' ${error.message}`,
    options: { verbose: true }
  },
  typeorm: [{
    name: 'tg',
    type: 'postgres',
    url: 'postgres://tg@psql:5432/tg',
    synchronize: true,
    entities: [
      `${rootDir}/entities/*.ts`,
    ]
  }]
})
export class Server extends ServerLoader {
  /**
   * @returns {Server}
   */
  public $onMountingMiddlewares(): void | Promise<any> {
    this
      .use(GlobalAcceptMimesMiddleware)
      .use(cookieParser())
      .use(compress({}))
      .use(methodOverride())
      .use(cors())
      .use(bodyParser.json())
      .use(bodyParser.urlencoded({
        extended: true
      }));

    return null;
  }
}

new Server().start()
  .then(async () => {
    const con = await getConnection('tg').getRepository(Address);
    // console.log('CONNECTION', con);
  })
  .catch((err) => {
    console.error(err);
  })