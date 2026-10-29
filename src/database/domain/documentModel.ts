export class Document {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly embedding: number[],
  ) {}
}

export class DocumentMatch {
  constructor(
    public readonly id: string,
    public readonly content: string,
    public readonly distance: number,
  ) {}
}
