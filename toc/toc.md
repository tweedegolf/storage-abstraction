Documentation|Adapter API|Introspective API|Storage API
:---|:---|:---|:---
[1. How it works](#how-it-works)|[listBuckets](#listbuckets)           |[getProvider](#getprovider)|[getAdapter](#getadapter)
[2. Instantiate a storage](#instantiate-a-storage)|[listFiles](#listfiles)        |[getConfiguration](#getconfiguration)|[switchAdapter](#switchadapter)
[a. Configuration object](#configuration-object)|[bucketIsPublic](#bucketispublic)|[getConfigurationError](#getconfigurationerror)|
&nbsp; [b. Configuration URL](#configuration-url)|[bucketExists](#bucketexists)  |[getServiceClient](#getserviceclient)|
&nbsp; [c. How bucketName is used](#how-bucketname-is-used)|[fileExists](#fileexists)         |[getSelectedBucket](#getselectedbucket)|
[3. Adapters](#adapters)|[createBucket](#createbucket)|[setSelectedBucket](#setselectedbucket)|
[4. Adding an adapter](#adding-an-adapter)|[clearBucket](#clearbucket)||
&nbsp; [a. Add your storage type](#add-your-storage-type)|[deleteBucket](#deletebucket)||
&nbsp; [b. Define your configuration](#define-your-configuration)|[addFile](#addfile)||
&nbsp; [c. Adapter class](#adapter-class)|[addFileFromPath](#addfilefrompath)||
&nbsp; [d. Adapter function](#adapter-function)|[addFileFromBuffer](#addfilefrombuffer)||
&nbsp; [e. Register your adapter](#register-your-adapter)|[addFileFromStream](#addfilefromstream) ||
&nbsp; [f. Adding your adapter code to this package](#adding-your-adapter-code-to-this-package)|[getPresignedUploadURL](#getPresignedUploadURL)||
[5. Tests](#tests)|[getPublicURL](#getpublicurl)||
[6. Example application](#example-application)|[getSignedURL](#getsignedurl) ||
[7. Questions and requests](#questions-and-requests)|[getFileAsStream](#getfileasstream)||
&nbsp;|[removeFile](#removefile)||
&nbsp;|[sizeOf](#sizeof)||
