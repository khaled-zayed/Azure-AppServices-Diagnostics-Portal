import { mergeMap } from 'rxjs/operators';
import { Component, Input } from '@angular/core';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { Site } from '../../shared/models/site';
import { StartupInfo } from '../../shared/models/portal';
import { ResponseMessageEnvelope } from '../../shared/models/responsemessageenvelope';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { ArmService } from '../../shared/services/arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { RBACService } from '../../shared/services/rbac.service';
import { LoggingService } from '../../shared/services/logging/logging.service';

@Component({
    selector: 'tools-menu',
    templateUrl: 'tools-menu.component.html',
    styleUrls: ['tools-menu.component.scss']
})
export class ToolsMenuComponent  {

    public supportTools: any[];
    public premiumTools: any[];

    public mitigateLink: string;
    
    currentSite: Site;
    hasReadAccessToServerFarm: boolean;
    initialized: boolean = false;

    @Input() displayTools: boolean;

    constructor(private _portalActionService: PortalActionService, private _armService: ArmService, private _authService: AuthService, private _rbacService: RBACService, private _logger: LoggingService) {
        this.supportTools = [];
        this.premiumTools = [];

        this._authService.getStartupInfo().pipe(
            mergeMap((startUpInfo: StartupInfo) => {
                return this._armService.getResource<Site>(startUpInfo.resourceId);
            }),
            mergeMap((site: ResponseMessageEnvelope<Site>) => {
                this.currentSite = site.properties;
                return this._rbacService.hasPermission(this.currentSite.serverFarmId, [this._rbacService.readScope]);
            }))
            .subscribe((hasPermission: boolean) => {
                this.hasReadAccessToServerFarm = hasPermission;
                this.initialize();
            })
    }

    initialize() {
        this.mitigateLink =  "https://mawssupport.trafficmanager.net/?sitename=" + this.currentSite.name + "&tab=mitigate&source=ibiza";

        this.supportTools.push({
            title: "Metrics per Instance (Apps)",
            description: "View Performance Counters as well as Metrics for your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.MetricPerInstance.Identifier);
                this._portalActionService.openMdmMetricsV3Blade();
            }
        });

        this.supportTools.push({
            title: "Metrics per Instance (App Service Plan)",
            description: this.hasReadAccessToServerFarm ? "View Metrics for applications on your App Service Plan" :
                "You do not have access to the the app service plan to which this site belongs",
            enabled: this.hasReadAccessToServerFarm,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.AppServicePlanMetrics.Identifier);
                this._portalActionService.openMdmMetricsV3Blade(this._portalActionService.currentSite.properties.serverFarmId);
            }
        });

        this.supportTools.push({
            title: "Live HTTP Traffic",
            description: "View Live Requests and Failures to your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.Pulse.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.Pulse)
            }
        });

         this.supportTools.push({
            title: "Application Events",
            description: "View Event Log which often holds information about failed requests",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.EventViewer.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.EventViewer)
            }
        });

        this.supportTools.push({
            title: "Failed Request Tracing Logs",
            description: "View detailed logs for failed requests. This requires you to enable Failed Request Tracing",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.FREBLogs.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.FREBLogs)
            }
        });

        this.supportTools.push({
            title: "Diagnostics as a Service",
            description: "Run a Diagnostics as a Service session for a deep analysis of your application",
            enabled: true,
            action: () => { 
                this.logToolUse(SupportBladeDefinitions.DaaS.Identifier);
                this._portalActionService.openSupportIFrame(SupportBladeDefinitions.DaaS)
            }
        });

        this.supportTools.push({
            title: "Mitigate",
            description: "Set rules for recycling or taking other actions based on memory usage or request patterns",
            enabled: true,
            action: () => { 
                this.logToolUse("Mitigate");
                this._portalActionService.openAutoHealSite();
            }
        });

        this.supportTools.push({
            title: "Advanced Application Restart",
            description: "Restart your app on a specific instance",
            enabled: true,
            action: () => { 
                this.logToolUse("AdvancedAppRestart");
                this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
            }
        });

        this.premiumTools.push({
            title: "Security Scanning",
            description: "",
            enabled: true,
            action: () => { 
                this.logToolUse("TinfoilSecurity");
                this._portalActionService.openTifoilSecurityBlade();
            }
        });

        this.initialized = true;
    }

    logToolUse(tool: string): void{
        this._logger.LogClickEvent(tool, "Tools");
    }

    
}