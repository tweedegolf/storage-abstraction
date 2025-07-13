Thanks for letting me know and yes you are right, this is a flaw :disappointed:. 

Unfortunately there isn't a (quick) fix. Cloudflare only supports public buckets if you add a custom domain to your bucket. You could enable and use the Public Development URL but that is not meant to be used for production. See the [documentation](https://developers.cloudflare.com/r2/buckets/public-buckets/#managed-public-buckets-through-r2dev).

If you add a file to your bucket you can add an options object; if you provide the key `useSignedUrl` and set it to `true` in this options object you will get the correct presigned R2 url back:

```typescript
const r = await storage.addFileFromPath({
    bucketName: "myBucket",
    origPath: "./tests/data/image1.jpg",
    targetPath: "image1-path.jpg",
    options: {
        useSignedUrl: "true"
    }
});
// returns the presigned url
```

Also if you call `getFileAsUrl` you can add the `useSignedUrl` key to get the correct R2 presigned url:
```typescript
const r = await storage.getFileAsUrl({
    bucketName: "myBucket",
    fileName: "image1-path.jpg",
    options: {
        useSignedUrl: "true"
    }
});
// returns the presigned url
```

I will add this information to the documentation of the Amazon adapter. 

Apart from that I have implemented a check to the Amazon adapter that checks if you are connecting to Amazon S3 or to another S3 compatible cloud service. In the former case the public Amazon S3 url is returned (if you haven't set `useSignedUrl` to `true`) and in the latter case the presigned url is returned. This way you always get a usable url. 

I am still testing this feature, will be available soon.