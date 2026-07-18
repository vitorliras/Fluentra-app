export class ResultError {
  private constructor(public readonly code: string) {}

  static from(code: string): ResultError {
    return new ResultError(code);
  }
}
