import { StorageAbstraction } from '.' // types and interfaces
import { Storage } from './Storage'
import { StorageLocal } from './StorageLocal'
import { StorageAmazonS3 } from './StorageAmazonS3'
import { StorageGoogleCloud } from './StorageGoogleCloud'


export {
  Storage,
  StorageLocal,
  StorageAmazonS3,
  StorageGoogleCloud,
  StorageAbstraction,
}