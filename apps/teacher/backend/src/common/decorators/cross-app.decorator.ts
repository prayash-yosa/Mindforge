import { SetMetadata, applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * Marks an endpoint as a cross-app API.
 * These endpoints are consumed by Student/Parent/Admin apps via the gateway.
 * RBAC is enforced at the gateway layer.
 */
export const CrossAppEndpoint = () =>
  applyDecorators(
    SetMetadata('isCrossApp', true),
    ApiHeader({
      name: 'X-Source-App',
      required: false,
      description: 'Source application identifier (student, parent, admin)',
    }),
  );
