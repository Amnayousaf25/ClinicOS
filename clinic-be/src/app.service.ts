import { Injectable } from '@nestjs/common';

/**
 * Root application service.
 *
 * In this boilerplate this service is intentionally minimal and serves as a
 * placeholder / health-check target.  Feature-specific business logic lives
 * in dedicated module services (e.g. `AuthService`, `UsersService`).
 *
 * The `@Injectable()` decorator registers `AppService` with NestJS's IoC
 * container so it can be injected into `AppController` (and any other
 * provider that declares it as a dependency) without manual instantiation.
 *
 * @example
 * // Inject into a controller:
 * constructor(private readonly appService: AppService) {}
 *
 * // Call the health-check endpoint:
 * this.appService.getHello(); // → 'Hello World!'
 */
@Injectable()
export class AppService {
  /**
   * Returns a simple greeting string.
   *
   * This method is exposed by `AppController` at `GET /` (i.e. `GET /api/v1/`
   * after the global prefix is applied) and can be used as a lightweight
   * liveness probe.
   *
   * @returns A static greeting message confirming the service is running.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
