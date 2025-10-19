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

