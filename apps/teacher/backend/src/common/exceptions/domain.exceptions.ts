import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  readonly code: string;

  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ code, message }, status);
    this.code = code;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} with id '${id}' not found`, HttpStatus.NOT_FOUND);
  }
}

export class EditWindowExpiredException extends DomainException {
  constructor(resource: string) {
    super('EDIT_WINDOW_EXPIRED', `Edit window for ${resource} has expired`, HttpStatus.FORBIDDEN);
  }
}

export class DuplicateEntryException extends DomainException {
  constructor(entity: string, field: string) {
    super('DUPLICATE_ENTRY', `${entity} with this ${field} already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidOperationException extends DomainException {
  constructor(message: string) {
    super('INVALID_OPERATION', message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}
