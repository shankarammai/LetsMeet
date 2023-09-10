export type Message = {
    dataType: 'Text' | 'File';
    data: string;
    fileName?: string;
    file?: Blob;
    timestamp:number;
    userId: string;

}