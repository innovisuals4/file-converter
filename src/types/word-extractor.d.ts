declare module "word-extractor" {
  export default class WordExtractor {
    extract(buffer: ArrayBuffer | Buffer): Promise<{ getBody: () => string }>;
  }
}
