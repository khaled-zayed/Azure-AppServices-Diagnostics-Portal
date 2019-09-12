import { Component, OnInit } from '@angular/core';
import { GenericDetectorComponent } from '../generic-detector/generic-detector.component';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { FeatureNavigationService, TelemetryService, DiagnosticService } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'generic-analysis',
  templateUrl: './generic-analysis.component.html',
  styleUrls: ['./generic-analysis.component.scss']
})
export class GenericAnalysisComponent extends GenericDetectorComponent implements OnInit {

  detectorId: string = "";
  analysisId: string = "";
  detectorName: string = "";
  searchTerm: string = "";
  showSearchBar: boolean = false;
  searchBarFocus: boolean = false;

  constructor(private _activatedRouteLocal: ActivatedRoute, private _diagnosticServiceLocal: DiagnosticService, _resourceService: ResourceService, _authServiceInstance: AuthService, _telemetryService: TelemetryService,
    _navigator: FeatureNavigationService, private _routerLocal: Router) {
    super(_activatedRouteLocal, _diagnosticServiceLocal, _resourceService, _authServiceInstance, _telemetryService, _navigator, _routerLocal);
  }

  ngOnInit() {
    this._activatedRouteLocal.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
      this.detectorId = params.get('detectorName') === null ? "" : params.get('detectorName');
      this._activatedRouteLocal.queryParamMap.subscribe(qParams => {
        this.searchTerm = qParams.get('searchTerm') === null ? "" : qParams.get('searchTerm');
        if (this.analysisId=== "searchResultsAnalysis" && this.searchTerm && this.searchTerm.length>0){
          this.showSearchBar = true;
        }

        this._diagnosticServiceLocal.getDetectors().subscribe(detectorList => {
          if (detectorList) {

            if (this.detectorId !== "") {
              let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
              this.detectorName = currentDetector.name;
            }
          }
        });
      });
    });
  }

  triggerSearch(){
    if (this.searchTerm && this.searchTerm.length>1) {
      this.searchBarFocus = false;
      var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
      searchBar.blur();
      this._routerLocal.navigate([`../../${this.analysisId}/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: {searchTerm: this.searchTerm} });
    }
  }

  focusSearch(){
    var searchBar = document.getElementById('caseSubmissionFlowSearchBar');
    searchBar.focus();
    this.searchBarFocus = true;
  }

  goBackToAnalysis() {
    if (this.analysisId=== "searchResultsAnalysis" && this.searchTerm){
      this._routerLocal.navigate([`../../../../${this.analysisId}/search`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge', queryParams: {searchTerm: this.searchTerm} });
    }
    else{
      this._routerLocal.navigate([`../../../${this.analysisId}`], { relativeTo: this._activatedRouteLocal, queryParamsHandling: 'merge' });
    }
  }

}
