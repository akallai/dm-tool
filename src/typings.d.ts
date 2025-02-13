interface FileSystemFileHandle {
    getFile(): Promise<File>;
    createWritable(options?: { keepExistingData?: boolean }): Promise<FileSystemWritableFileStream>;
  }
  
  interface FileSystemWritableFileStream {
    write(data: Blob | BufferSource | string): Promise<void>;
    close(): Promise<void>;
  }
  
  interface Window {
    showSaveFilePicker?(options?: any): Promise<FileSystemFileHandle>;
    showOpenFilePicker?(options?: any): Promise<FileSystemFileHandle[]>;
  }
  