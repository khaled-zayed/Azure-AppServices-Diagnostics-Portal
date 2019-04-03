import {
    CommsService, DiagnosticDataModule, DiagnosticService, PUBLIC_DEV_CONFIGURATION,
    PUBLIC_PROD_CONFIGURATION
} from 'diagnostic-data';
import { SiteService } from 'projects/app-service-diagnostics/src/app/shared/services/site.service';
import {
    DiagnosticSiteService
} from 'projects/diagnostic-data/src/lib/services/diagnostic-site.service';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, RouterModule } from '@angular/router';
import {
    KustoTelemetryService
} from '../../../diagnostic-data/src/lib/services/telemetry/kusto-telemetry.service';
import { environment } from '../environments/environment';
import { CustomReuseStrategy } from './app-route-reusestrategy.service';
import { AppComponent } from './app.component';
import {
    ResourceRedirectComponent
} from './shared/components/resource-redirect/resource-redirect.component';
import { TestInputComponent } from './shared/components/test-input/test-input.component';
import { GenericApiService } from './shared/services/generic-api.service';
import { GenericCommsService } from './shared/services/generic-comms.service';
import { LocalBackendService } from './shared/services/local-backend.service';
import { PortalKustoTelemetryService } from './shared/services/portal-kusto-telemetry.service';
import { SharedModule } from './shared/shared.module';
import { StartupModule } from './startup/startup.module';

@NgModule({
  imports: [
    BrowserModule,
    HttpClientModule,
    SharedModule.forRoot(),
    StartupModule.forRoot(),
    DiagnosticDataModule.forRoot(environment.production ? PUBLIC_PROD_CONFIGURATION : PUBLIC_DEV_CONFIGURATION),
    BrowserAnimationsModule,
    RouterModule.forRoot([
      {
        path: 'test',
        component: TestInputComponent
      },
      {
        path: 'resourceRedirect',
        component: ResourceRedirectComponent
      },
      {
        path: 'resource',
        loadChildren: './resources/resources.module#ResourcesModule'
      }
    ])
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    CustomReuseStrategy,
    { provide: KustoTelemetryService, useExisting: PortalKustoTelemetryService },
    { provide: RouteReuseStrategy, useExisting: CustomReuseStrategy },
    { provide: DiagnosticService,
      useFactory: (_localBackendService: LocalBackendService, _genericApiService: GenericApiService) => environment.useApplensBackend ? _localBackendService : _genericApiService,
      deps: [LocalBackendService, GenericApiService] },
    { provide: CommsService, useExisting: GenericCommsService },
    { provide: DiagnosticSiteService, useExisting: SiteService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
