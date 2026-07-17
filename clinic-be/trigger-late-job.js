"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dns = require("dns");
dns.setServers(['8.8.8.8', '1.1.1.1']);
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const reminders_service_1 = require("./src/modules/reminders/reminders.service");
async function bootstrap() {
    console.log('Bootstrapping NestJS application...');
    process.env.NODE_ENV = 'dev';
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    console.log('App bootstrapped successfully.');
    const service = app.get(reminders_service_1.RemindersService);
    console.log('Triggering processLateAppointments()...');
    await service.processLateAppointments();
    console.log('Closing NestJS context...');
    await app.close();
    console.log('Done.');
}
bootstrap().catch(console.error);
//# sourceMappingURL=trigger-late-job.js.map