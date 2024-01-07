/// <reference types="node" />
import { AdapterConfig } from "./general";
import { Readable } from "stream";
export type ParseUrlResult = {
    error: string | null;
    value: AdapterConfig;
};
export interface ResultObject {
    error: string | null;
    value: string | null;
}
export type ResultObjectNumber = {
    error: string | null;
    value: number | null;
};
export type ResultObjectBoolean = {
    error: string | null;
    value: boolean | null;
};
export type ResultObjectFiles = {
    error: string | null;
    value: Array<[string, number]> | null;
};
export type ResultObjectBuckets = {
    error: string | null;
    value: Array<string> | null;
};
export type ResultObjectStringArray = {
    error: string | null;
    value: Array<string> | null;
};
export type ResultObjectKeyValue = {
    error: string | null;
    value: {
        [key: string]: any;
    } | null;
};
export type ResultObjectStream = {
    error: string | null;
    value: Readable | null;
};
