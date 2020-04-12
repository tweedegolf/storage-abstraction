interface IConfig {
  id: string;
  name?: string;
}

interface AnotherConfig extends IConfig {
  type: string;
}

interface YetAnotherConfig extends IConfig {
  mode: number;
}

type Config = AnotherConfig | YetAnotherConfig;

const processConfig1 = (cfg: IConfig): IConfig => {
  console.log((cfg as AnotherConfig).type);
  return cfg;
};

const processConfig2 = (cfg: Config): Config => {
  console.log((cfg as AnotherConfig).type);
  return cfg;
};
