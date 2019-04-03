import { WebSitesService } from './web-sites.service';
import { Injectable } from '@angular/core';
import { SupportTopicService } from '../../../shared-v2/services/support-topic.service';
import { DiagnosticService } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { Observable, of } from 'rxjs';
import { OperatingSystem } from '../../../shared/models/site';
import { VersioningHelper } from '../../../shared/utilities/versioningHelper';

@Injectable()
export class SiteSupportTopicService extends SupportTopicService {

  private _hardCodedSupportTopicIdMapping = [
    {
      pesId: '14748',
      supportTopicId: '32457411',
      path: '/diagnostics/performance/analysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32570954',
      path: '/diagnostics/availability/apprestartanalysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32542218',
      path: '/diagnostics/availability/analysis',
    },
    {
      pesId: '14748',
      supportTopicId: '32581616',
      path: '/diagnostics/availability/memoryanalysis',
    }
  ];

  constructor(protected _diagnosticService: DiagnosticService, protected _webSiteService: WebSitesService) {
    super(_diagnosticService, _webSiteService);

    if (!VersioningHelper.isV2Subscription(_webSiteService.subscriptionId)) {
      this._hardCodedSupportTopicIdMapping.push({
        pesId: '14748',
        supportTopicId: '32583701',
        path: '/diagnostics/availability/detectors/sitecpuanalysis/focus',
      });
    }
  }

  getPathForSupportTopic(supportTopicId: string, pesId: string): Observable<string> {
    const matchingMapping = this._hardCodedSupportTopicIdMapping.find(
      supportTopic => supportTopic.supportTopicId === supportTopicId &&
        (!pesId || pesId === '' || supportTopic.pesId === pesId)
    );

    if (matchingMapping && this._webSiteService.platform == OperatingSystem.windows) {
      return of(`/legacy${matchingMapping.path}`);
    } else {
      return super.getPathForSupportTopic(supportTopicId, pesId);
    }
  }
}
