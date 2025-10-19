# Local Storage Adapter

An adapter that mimics a cloud storage service and uses your local file system to store files and folders.

This adapter is one of the adapters that is meant to be used as a plugin of the [Storage Abstraction package](https://www.npmjs.com/package/@tweedegolf/storage-abstraction). However it can be used standalone as well, see [below](#standalone).

The [API](https://github.com/tweedegolf/storage-abstraction/tree/master?tab=readme-ov-file#adapter-api) of the adapter abstracts away the differences between the API's of cloud storage services. The API only supports the basic, most commonly used cloud service operations such as creating a bucket, storing files and so on.

This adapter is meant to be used in development phase; you can develop and test your application using the local storage adapter and seamlessly switch to one of the available adapters that interact with a cloud storage service on your production server.

However you can use the local storage adapter on your production server as well; files will be stored on the hard disk of your server.

If you are new to the Storage Abstraction library you may want to read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#how-it-works) first.

```typescript
import { Storage, Provider } from "@tweedegolf/storage-abstraction";

const configuration = {
  type: Provider.LOCAL,
  directory: "path/to/directory",
  mode: 750,
};

const storage = new Storage(configuration);

const result = await storage.listBuckets();

console.log(result);
```

The Storage class is cloud service agnostic and doesn't know anything about the adapter it uses and adapters are completely interchangeable. It only expects the adapter to have implemented all methods of the `IAdapter` interface, see the [API](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api).

When you create a Storage instance it checks the mandatory `provider` key in the configuration object and then loads the appropriate adapter module automatically from your node_modules folder using `require()`. For more information please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#register-your-adapter).

## Configuration

The configuration object that you pass to the Storage constructor is forwarded to the constructor of the adapter.

The Storage constructor is only interested in the `provider` key of the configuration object, all other keys are necessary for configuring the adapter.

The Storage constructor expects the configuration to be of type `StorageAdapterConfig`.

The adapter expects the configuration to be of type `AdapterConfig` or a type that extends this type.

```typescript
export interface AdapterConfig {
  bucketName?: string;
  [id: string]: any; // any mandatory or optional key
}

export interface StorageAdapterConfig extends AdapterConfig {
  type: string;
}
```

The type of the configuration object for this adapter:

```typescript
export interface AdapterConfigLocal extends AdapterConfig {
  directory: string;
  mode?: number;
}
```

## Examples

Examples with configuration object:

```typescript
const s = new Storage({
  type: Provider.LOCAL,
  directory: "path/to/directory",
  mode: 750,
});

const s = new Storage({
  type: Provider.LOCAL,
  directory: "path/to/directory",
  mode: 750,
  bucketName: "the-buck",
});
```

Same examples with configuration url:

```typescript
const s = new Storage("local://path/to/directory?mode=750");

const s = new Storage("local://path/to/directory@the-buck?mode=750");
```

For more information about configuration urls please read [this](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#configuration-url).

## Local storage

With the optional key `mode` you can set the access rights when you create new local buckets. The default value is `0o777`, note that the actual value is dependent on the umask settings on your system (Linux and MacOS only). You can pass this value both in decimal and in octal format. E.g. `rwxrwxrwx` is `0o777` in octal format or `511` in decimal format.

When you use a configuration URL you can only pass values as strings. String values without radix prefix will be interpreted as decimal numbers, so "777" is _not_ the same as "0o777" and yields `41411`. This is probably not what you want. The configuration parser handles this by returning the default value in case you pass a value over decimal `511`.

Examples:

```typescript
const config = {
  type: Provider.LOCAL,
  directory: "path/to/folder",
  mode: 488, // decimal literal
};
const s = new Storage(config);

// or
const url = "local://path/to/folder&mode=488";
const s = new Storage(url);

// and the same with octal values:

const config = {
  type: Provider.LOCAL,
  directory: "path/to/folder",
  mode: 0o750, // octal literal
};
const s = new Storage(config);

// or
const url = "local://path/to/folder&mode=0o750";
const s = new Storage(url);
```

Buckets will be created inside the directory `path/to/folder`, parent folders will be created if necessary.

## Standalone

You can also use the adapter standalone, without the need to create a Storage instance:

```typescript
import { AdapterLocal } from "@tweedegolf/sab-adapter-local";

const a = new AdapterLocal({
  directory: "path/to/directory",
});
const r = await a.listBuckets();
console.log(r);
```

## API

For a complete description of the Adapter API see [this part](https://github.com/tweedegolf/storage-abstraction/blob/master/README.md#adapter-api) documentation of the Storage Abstraction package readme.
