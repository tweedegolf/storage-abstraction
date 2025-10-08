Documentation|Adapter API|Introspective API|Storage API
:---|:---|:---|:---
[1. How it works](README.md#how-it-works)|[listBuckets](README.md#listbuckets)           |[getProvider](README.md#getprovider)|[getAdapter](README.md#getadapter)
[2. Instantiate a storage](README.md#instantiate-a-storage)|[listFiles](README.md#listfiles)        |[getConfiguration](README.md#getconfiguration)|[switchAdapter](README.md#switchadapter)
[a. Configuration object](README.md#configuration-object)|[bucketIsPublic](README.md#bucketispublic)|[getConfigurationError](README.md#getconfigurationerror)|
&nbsp; [b. Configuration URL](README.md#configuration-url)|[bucketExists](README.md#bucketexists)  |[getServiceClient](README.md#getserviceclient)|
&nbsp; [c. How bucketName is used](README.md#how-bucketname-is-used)|[fileExists](README.md#fileexists)         |[getSelectedBucket](README.md#getselectedbucket)|
[3. Adapters](README.md#adapters)|[createBucket](README.md#createbucket)|[setSelectedBucket](README.md#setselectedbucket)|
[4. Adding an adapter](README.md#adding-an-adapter)|[clearBucket](README.md#clearbucket)||
&nbsp; [a. Add your storage type](README.md#add-your-storage-type)|[deleteBucket](README.md#deletebucket)||
&nbsp; [b. Define your configuration](README.md#define-your-configuration)|[addFile](README.md#addfile)||
&nbsp; [c. Adapter class](README.md#adapter-class)|[addFileFromPath](README.md#addfilefrompath)||
&nbsp; [d. Adapter function](README.md#adapter-function)|[addFileFromBuffer](README.md#addfilefrombuffer)||
&nbsp; [e. Register your adapter](README.md#register-your-adapter)|[addFileFromStream](README.md#addfilefromstream) ||
&nbsp; [f. Adding your adapter code to this package](README.md#adding-your-adapter-code-to-this-package)|[getPresignedUploadURL](README.md#getPresignedUploadURL)||
[5. Tests](README.md#tests)|[getPublicURL](README.md#getpublicurl)||
[6. Example application](README.md#example-application)|[getSignedURL](README.md#getsignedurl) ||
[7. Questions and requests](README.md#questions-and-requests)|[getFileAsStream](README.md#getfileasstream)||
&nbsp;|[removeFile](README.md#removefile)||
|[sizeOf](README.md#sizeof)||
