import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { OperatingSystem, Site } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { ArmService } from '../../../shared/services/arm.service';
import { Sku } from '../../../shared/models/server-farm';
import { IDiagnosticProperties } from '../../../shared/models/diagnosticproperties';
import { Observable ,  BehaviorSubject } from 'rxjs';

@Injectable()
export class WebSitesService extends ResourceService {

    private _resourceGroup: string;
    private _siteName: string;
    private _slotName: string;

    public appStack: string = '';
    public platform: OperatingSystem = OperatingSystem.any;
    public appType: AppType = AppType.WebApp;
    public sku: Sku = Sku.All;

    constructor(protected _armService: ArmService, private _appAnalysisService: AppAnalysisService) {
        super(_armService);
    }

    public get searchSuffix(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Azure Web App' : 'Azure Web App(Linux)' : 'Azure Function';
    }

    public get azureServiceName(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Web App (Windows)' : 'Web App (Linux)' : 'Function App';
    }

    public get isApplicableForLiveChat(): boolean {
        return this.resource
        && (this.sku & Sku.Paid) > 0
        && (this.appType & AppType.WebApp) > 0
        && (this.platform & (OperatingSystem.windows | OperatingSystem.linux)) > 0;
    }

    public getSitePremierAddOns(resourceUri: string): Observable<any> {
        return this._armService.getArmResource(`${resourceUri}/premieraddons`, '2018-02-01');
    }

    protected makeWarmUpCalls() {
        super.makeWarmUpCalls();
        this._populateSiteInfo();
        this.warmUpCallFinished.next(true);
    }

    private _populateSiteInfo(): void {
        const pieces = this.resource.id.toLowerCase().split('/');
        this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
        this._resourceGroup = pieces[pieces.indexOf('resourcegroups') + 1];
        this._siteName = pieces[pieces.indexOf('sites') + 1];
        this._slotName = pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : '';

        const site: Site = <Site>this.resource.properties;

        this._appAnalysisService.getDiagnosticProperties(this._subscription, this._resourceGroup, this._siteName, this._slotName).subscribe((data: IDiagnosticProperties) => {
            this.appStack = data && data.appStack && data.appStack != '' ? data.appStack : '';
        });

        this.appType = site.kind.toLowerCase().indexOf('functionapp') >= 0 ? AppType.FunctionApp : AppType.WebApp;
        this.platform = site.kind.toLowerCase().indexOf('linux') >= 0 ? OperatingSystem.linux : OperatingSystem.windows;
        this.sku = Sku[site.sku];
    }
}
