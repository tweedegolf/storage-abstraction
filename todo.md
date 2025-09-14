```typescript
enum FileReturnType = {
  Stream,
  SomethingElse,
  ...
}

type GetFile = {
  bucketName: string,
  fileName: string,
  type: FileReturnType,
  options?: { start?: number; end?: number }
}

getFile(GetFile): Promise<ResultObjectStream | ResultObject>
```

- versioning

If the file can not be found an error will be returned: `No file [your filename] found in bucket [your bucketname]`