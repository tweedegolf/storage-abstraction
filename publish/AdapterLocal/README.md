# MinIO Adapter

This adapter is a peer dependency of the [storage abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). It provides an abstraction layer over the API of the MinIO cloud storage service. You can use it both stand alone and as the adapter of a `Storage` instance:

1. Stand alone

```typescript
import { AdapterMinio } from "@tweedegolf/sab-adapter-minio";

const a = new AdapterMinio({
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

const r = await a.listBuckets();
console.log(r);
```

2. As the adapter of a `Storage` instance:

```typescript
import { Storage, StorageType } from "@tweedegolf/storage-abstraction";
import { AdapterMinio } from "@tweedegolf/sab-adapter-minio";

const s = new Storage({
  type: StorageType.MINIO,
  port: 9000,
  useSSL: true,
  region: "us-east-1",
  endPoint: "play.min.io",
  accessKey: "Q3AM3UQ867SPQQA43P2F",
  secretKey: "zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG",
});

const r = await a.listBuckets();
console.log(r);
```

## Configuration

The Adapter class takes one argument of type `AdapterConfig` and the Storage class takes one argument of type `StorageAdapterConfig`

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}

export interface StorageAdapterConfig {
  type: string;
  bucketName?: string;
  [id: string]: any; // eslint-disable-line
}
```

As you can see argument the Storage class expects had an additional key `type`. This is necessary because the Storage class is cloud service agnostic and doesn't know anything about the adapter it uses.

The Minio adapter requires some service specific mandatory keys:

```typescript
export interface AdapterConfigMinio extends AdapterConfig {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  useSSL?: boolean;
  port?: number;
  [key: string]: any; // eslint-disable-line
}
```

### Local storage

> peer dependencies: <br/> > `npm i glob rimraf`

Adapter config:

```typescript
export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
```

Example with configuration object:

```typescript
const s = new Storage({
  type: StorageType.LOCAL,
  directory: "path/to/directory",
  mode: 750,
});
```

Example with configuration url:

```typescript
const s = new Storage("local://directory=path/to/directory&mode=750");
```

With the optional key `mode` you can set the access rights when you create new local buckets. The default value is `0o777`, note that the actual value is dependent on the umask settings on your system (Linux and MacOS only). You can pass this value both in decimal and in octal format. E.g. `rwxrwxrwx` is `0o777` in octal format or `511` in decimal format.

When you use a configuration URL you can only pass values as strings. String values without radix prefix will be interpreted as decimal numbers, so "777" is _not_ the same as "0o777" and yields `41411`. This is probably not what you want. The configuration parser handles this by returning the default value in case you pass a value over decimal `511`.

Examples:

```typescript
const config = {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  mode: 488, // decimal literal
};
const s = new Storage(config);

// or
const url = "local://directory=path/to/folder&mode=488";
const s = new Storage(url);

// and the same with octal values:

const config = {
  type: StorageType.LOCAL,
  directory: "path/to/folder",
  mode: 0o750, // octal literal
};
const s = new Storage(config);

// or
const url = "local://directory=path/to/folder&mode=0o750";
const s = new Storage(url);
```

Buckets will be created inside the directory `path/to/folder`, parent folders will be created if necessary.

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
