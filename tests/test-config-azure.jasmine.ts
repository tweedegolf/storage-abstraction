import "jasmine";
import { Storage } from "../src/Storage";
import { StorageType } from "../src/types";

describe(`testing Azure urls`, () => {
    it("[0] no options", () => {
        const storage = new Storage("azure://account:accessKey@can");
        expect(storage.getType()).toBe(StorageType.AZURESTORAGEBLOB);
        expect(storage.getSelectedBucket()).toBe("can");
        expect(storage.getConfiguration()['storageAccount']).toBe("account");
        expect(storage.getConfiguration()['accessKey']).toBe("accessKey");
    });

    
})