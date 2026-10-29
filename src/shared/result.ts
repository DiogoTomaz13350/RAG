export type Result<T, E> = ok<T> | error<E>;

export type ok<T> = {
  IsSuccess: true;
  value: T;
};

export type error<E> = {
  IsSuccess: false;
  error: E;
};

export const ok = <T>(value: T): ok<T> => ({
  IsSuccess: true,
  value: value,
});

export const error = <E>(err: E): error<E> => ({
  IsSuccess: false,
  error: err,
});
