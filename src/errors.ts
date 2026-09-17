export class KhnumError extends Error {
  constructor(
    public readonly functionName: string,
    message: string,
  ) {
    super(message);
    this.name = "KhnumError";
  }

  override toString(): string {
    return `Khnum.${this.functionName}: ${this.message}`;
  }
}
