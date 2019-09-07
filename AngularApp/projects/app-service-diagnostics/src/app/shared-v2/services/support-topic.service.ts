
import { map, flatMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/of';
import { ResourceService } from './resource.service';

@Injectable()
export class SupportTopicService {

  protected detectorTask: Observable<DetectorMetaData[]>;

  constructor(protected _diagnosticService: DiagnosticService, protected _webSiteService: ResourceService) {
    this.detectorTask = this._diagnosticService.getDetectors();
  }

  getPathForSupportCaseDiagnosis(supportTopicId: string, pesId: string, searchTerm: string): Observable<string>{
    return this._diagnosticService.getSupportTopicsForSearchConfig().pipe(flatMap(res => {
      if (res.hasOwnProperty("enabledSupportTopicIdsForSearch") && res["enabledSupportTopicIdsForSearch"].findIndex(spId => spId==supportTopicId)>=0){
        return Observable.of(`/analysis/searchResultsAnalysis/search/${encodeURIComponent(searchTerm)}`);
      }
      else{
        return this.detectorTask.pipe(flatMap(detectors => {
          let detectorPath = '';
    
          if (detectors) {
            const matchingDetector = detectors.find(detector =>
              detector.supportTopicList &&
              detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);
    
            if (matchingDetector) {
              if (matchingDetector.type === DetectorType.Detector) {
                detectorPath = `/detectors/${matchingDetector.id}`;
              } else if (matchingDetector.type === DetectorType.Analysis) {
                detectorPath = `/analysis/${matchingDetector.id}`;
              }
            }
          }
    
          return Observable.of(detectorPath);
        }));
      }
    }));
    //var searchTask = this._diagnosticService.getDetectorsSearch(searchTerm);

    /*return searchTask.pipe(map((detectors: any[]) => {
      let detectorPath = '';
      const matchingDetector = detectors[0];
      if (matchingDetector) {
        detectorPath = `/analysis/dynamicAnalysis/search/${encodeURIComponent(searchTerm)}`;
      }
      return detectorPath;
    }));*/
    //return Observable.of(`/analysis/searchResultsAnalysis/search/${encodeURIComponent(searchTerm)}`);
  }
}
