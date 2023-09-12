export type Message = {
    dataType: 'Text' | 'File' | 'InitialConfig';
    data: string;
    fileName?: string;
    file?: Blob;
    timestamp:number;
    userId: string;

}