import { ResultError } from './error';

export class Result<T = void> {
  private constructor(
    public readonly isSuccess: boolean,
    public readonly value: T | null,
    public readonly error: ResultError | null,
  ) {}

  static success<T>(value: T): Result<T> {
    return new Result<T>(true, value, null);
  }

  static failure<T = void>(error: ResultError): Result<T> {
    return new Result<T>(false, null, error);
  }
}
