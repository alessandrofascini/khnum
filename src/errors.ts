export class WebComponentsFactoryError extends Error {
  constructor(
    public readonly functionName: string,
    message: string,
  ) {
    super(message);
    this.name = "WebComponentsFactoryError";
  }

  override toString(): string {
    return `WebComponentsFactory.${this.functionName}: ${this.message}`;
  }
}
