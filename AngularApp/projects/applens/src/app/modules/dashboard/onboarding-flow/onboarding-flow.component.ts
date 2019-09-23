import { AdalService } from 'adal-angular4';
import {
    CompilationProperties, DetectorControlService, DetectorResponse, QueryResponse
} from 'diagnostic-data';
import * as momentNs from 'moment';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { forkJoin, Observable, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Package } from '../../../shared/models/package';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { RecommendedUtterance } from '../../../../../../diagnostic-data/src/public_api';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import {TelemetryEventNames} from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { environment } from '../../../../environments/environment';

const moment = momentNs;

export enum DevelopMode {
  Create,
  Edit,
  EditMonitoring,
  EditAnalytics
}

@Component({
  selector: 'onboarding-flow',
  templateUrl: './onboarding-flow.component.html',
  styleUrls: ['./onboarding-flow.component.scss']
})
export class OnboardingFlowComponent implements OnInit {
  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() id: string = '';
  @Input() dataSource: string = '';
  @Input() timeRange: string = '';
  @Input() startTime: momentNs.Moment = moment.utc().subtract(1, 'days');
  @Input() endTime: momentNs.Moment = moment.utc();
  @Input() gistMode: boolean = false;

  DevelopMode = DevelopMode;

  hideModal: boolean = false;
  fileName: string;
  editorOptions: any;
  code: string;
  reference: object = {};
  configuration: object = {};
  resourceId: string;
  queryResponse: QueryResponse<DetectorResponse>;
  errorState: any;
  buildOutput: string[];
  runButtonDisabled: boolean;
  publishButtonDisabled: boolean;
  localDevButtonDisabled: boolean;
  localDevText: string;
  localDevUrl: string;
  localDevIcon: string;
  devOptionsIcon: string;
  runButtonText: string;
  runButtonIcon: string;
  publishButtonText: string;
  gists: string[] = [];
  allGists: string[] = [];
  selectedGist: string = '';
  temporarySelection: object = {};
  allUtterances: any[] = [];
  recommendedUtterances: RecommendedUtterance[] = [];
  utteranceInput: string = "";
  
  modalPublishingButtonText: string;
  modalPublishingButtonDisabled: boolean;

  alertClass: string;
  alertMessage: string;
  showAlert: boolean;

  compilationPackage: CompilationProperties;

  initialized = false;

  private publishingPackage: Package;
  private userName: string;

  private emailRecipients: string = '';

  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService,
    private diagnosticApiService: ApplensDiagnosticService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService,
    public ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService) {

    this.editorOptions = {
      theme: 'vs',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true
    };

    this.buildOutput = [];
    this.localDevButtonDisabled = false;
    this.runButtonDisabled = false;
    this.publishButtonDisabled = true;
    this.localDevText = "Download Local Detector Package";
    this.localDevUrl = "";
    this.localDevIcon = "fa fa-download";
    this.devOptionsIcon = "fa fa-download";
    this.runButtonText = "Run";
    this.runButtonIcon = "fa fa-play";
    this.publishButtonText = "Publish";
    this.modalPublishingButtonText = "Publish";
    this.modalPublishingButtonDisabled = false;
    this.showAlert = false;

    this.userName = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    console.log(Object.keys(this._adalService.userInfo.profile).length === 0);
    this.emailRecipients = this.userName.replace('@microsoft.com', '');
  }

  ngOnInit() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
      this._telemetryService.logPageView(TelemetryEventNames.OnboardingFlowLoaded, {});
    }
  }

  ngOnChanges() {
    if (this.initialized) {
      this.initialize();
    }
  }

  gistVersionChange(event: string) {
    this.temporarySelection[this.selectedGist] = event;
  }

  confirm() {
    Object.keys(this.temporarySelection).forEach(id => {
      if (this.temporarySelection[id]['version'] !== this.configuration['dependencies'][id]) {
        this.configuration['dependencies'][id] = this.temporarySelection[id]['version'];
        this.reference[id] = this.temporarySelection[id]['code'];
      }
    });

    this.ngxSmartModalService.getModal('packageModal').close();
  }

  cancel() {
    this.selectedGist = '';
    this.temporarySelection = {};
    this.ngxSmartModalService.getModal('packageModal').close();
  }

  managePackage() {
    this.gists = Object.keys(this.configuration['dependencies']);
    this.selectedGist = '';
    this.temporarySelection = {};

    this.gists.forEach(g => this.temporarySelection[g] = { version: this.configuration['dependencies'][g], code: '' });

    this.ngxSmartModalService.getModal('packageModal').open();
  }

  saveProgress() {
    localStorage.setItem(`${this.id}_code`, this.code);
  }

  retrieveProgress() {
    let savedCode: string = localStorage.getItem(`${this.id}_code`)
    if (savedCode) {
      this.code = savedCode;
    }
  }

  deleteProgress() {
    localStorage.removeItem(`${this.id}_code`);
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  getDevOptions() {
    this.ngxSmartModalService.getModal('devModeModal').open();
  }

  dismissDevModal() {
    // Set the default popped up behaviour of local development modal as a key value pair in localStorage
    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");
    this.ngxSmartModalService.getModal('devModeModal').close();
  }

  downloadLocalDevTools() {
    this.localDevButtonDisabled = true;
    this.localDevText = "Preparing Local Tools";
    this.localDevIcon = "fa fa-circle-o-notch fa-spin";

    var body = {
      script: this.code,
      configuration: this.configuration,
      gists: this.allGists,
      baseUrl: window.location.origin
    };

    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");

    this.diagnosticApiService.prepareLocalDevelopment(body, this.id, this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange)
      .subscribe((response: string) => {
        this.localDevButtonDisabled = false;
        this.localDevUrl = response;
        this.localDevText = "Download Local Development Package";
        this.localDevIcon = "fa fa-download";
        // window.open(response);

        var element = document.createElement('a');
        element.setAttribute('href', response);
        element.setAttribute('download', "Local Development Package");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
      }, ((error: any) => {
        this.localDevButtonDisabled = false;
        this.publishingPackage = null;
        this.localDevText = "Something went wrong";
        this.localDevIcon = "fa fa-download";
      }));
  }

  runCompilation() {
    this.buildOutput = [];
    this.buildOutput.push("------ Build started ------");
    let currentCode = this.code;

    var body = {
      script: this.code,
      references: this.reference,
      entityType: this.gistMode ? 'gist' : 'signal',
      detectorUtterances: JSON.stringify(this.allUtterances.map(x => x.text))
    };

    this.runButtonDisabled = true;
    this.publishButtonDisabled = true;
    this.localDevButtonDisabled = true;
    this.runButtonText = "Running";
    this.runButtonIcon = "fa fa-circle-o-notch fa-spin";

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, this.id, this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange, {
        scriptETag: this.compilationPackage.scriptETag,
        assemblyName: this.compilationPackage.assemblyName,
        getFullResponse: true
      })
      .subscribe((response: any) => {
        this.queryResponse = response.body;
        if (this.queryResponse.invocationOutput && this.queryResponse.invocationOutput.metadata){
          this.id = this.queryResponse.invocationOutput.metadata.id;
        }
        if (this.queryResponse.invocationOutput.suggestedUtterances && this.queryResponse.invocationOutput.suggestedUtterances.results) {
          this.recommendedUtterances = this.queryResponse.invocationOutput.suggestedUtterances.results;
          this._telemetryService.logEvent("SuggestedUtterances", { detectorId: this.queryResponse.invocationOutput.metadata.id, detectorDescription: this.queryResponse.invocationOutput.metadata.description, numUtterances: this.allUtterances.length.toString(), numSuggestedUtterances: this.recommendedUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        }
        else{
          this._telemetryService.logEvent("SuggestedUtterancesNull", { detectorId: this.queryResponse.invocationOutput.metadata.id, detectorDescription: this.queryResponse.invocationOutput.metadata.description, numUtterances: this.allUtterances.length.toString(), ts: Math.floor((new Date()).getTime() / 1000).toString() });
        }
        this.runButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        if (this.queryResponse.compilationOutput.compilationTraces) {
          this.queryResponse.compilationOutput.compilationTraces.forEach(element => {
            this.buildOutput.push(element);
          });
        }
        // If the script etag returned by the server does not match the previous script-etag, update the values in memory
        if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
          this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
          this.compilationPackage.assemblyName = this.queryResponse.compilationOutput.assemblyName;
          this.compilationPackage.assemblyBytes = this.queryResponse.compilationOutput.assemblyBytes;
          this.compilationPackage.pdbBytes = this.queryResponse.compilationOutput.pdbBytes;
        }

        if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
          this.publishButtonDisabled = false;
          this.preparePublishingPackage(this.queryResponse, currentCode);
          this.buildOutput.push("========== Build: 1 succeeded, 0 failed ==========");
        } else {
          this.publishButtonDisabled = true;
          this.publishingPackage = null;
          this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
        }

        this.publishButtonDisabled = (
          !this.gistMode && this.queryResponse.runtimeSucceeded != null && !this.queryResponse.runtimeSucceeded
        ) || (
          this.gistMode && this.queryResponse.compilationOutput != null &&
          !this.queryResponse.compilationOutput.compilationSucceeded
        )

        this.localDevButtonDisabled = false;
      }, ((error: any) => {
        this.runButtonDisabled = false;
        this.publishingPackage = null;
        this.localDevButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        this.buildOutput.push("Something went wrong during detector invocation.");
        this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
      }));
  }

  confirmPublish() {
    if (!this.publishButtonDisabled) {
      this.ngxSmartModalService.getModal('publishModal').open();
    }
  }
  
  prepareMetadata() {
    this.publishingPackage.metadata = JSON.stringify({ "utterances": this.allUtterances });
  }

  publish() {
    if (!this.publishingPackage ||
      this.publishingPackage.codeString === '' ||
      this.publishingPackage.id === '' ||
      this.publishingPackage.dllBytes === '') {
      return;
    }
    
    this.prepareMetadata();
    this.publishButtonDisabled = true;
    this.runButtonDisabled = true;
    this.modalPublishingButtonDisabled = true;
    this.modalPublishingButtonText = "Publishing";

    this.diagnosticApiService.publishDetector(this.emailRecipients, this.publishingPackage).subscribe(data => {
      this.deleteProgress();
      this.utteranceInput = "";
      this.runButtonDisabled = false;
      this.localDevButtonDisabled = false;
      this.publishButtonText = "Publish";
      this.modalPublishingButtonDisabled = false;
      this.modalPublishingButtonText = "Publish";
      this.ngxSmartModalService.getModal('publishModal').close();
      this.showAlertBox('alert-success', 'Detector published successfully. Changes will be live shortly.');
      this._telemetryService.logEvent("SearchTermPublish", { detectorId: this.id, numUtterances: this.allUtterances.length.toString() , ts: Math.floor((new Date()).getTime() / 1000).toString()});
    }, err => {
      this.runButtonDisabled = false;
      this.localDevButtonDisabled = false;
      this.publishButtonText = "Publish";
      this.modalPublishingButtonDisabled = false;
      this.modalPublishingButtonText = "Publish";
      this.ngxSmartModalService.getModal('publishModal').close();
      this.showAlertBox('alert-danger', 'Publishing failed. Please try again after some time.');
    });
  }

  private UpdateConfiguration(queryResponse: QueryResponse<DetectorResponse>) {
    let temp = {};
    let newPackage = [];
    let ids = new Set(Object.keys(this.configuration['dependencies']));
    if(queryResponse.compilationOutput.references != null) {
      queryResponse.compilationOutput.references.forEach(r => {
        if (ids.has(r)) {
          temp[r] = this.configuration['dependencies'][r];
        } else {
          newPackage.push(r);
        }
      });
    }

    this.configuration['dependencies'] = temp;
    this.configuration['id'] = queryResponse.invocationOutput.metadata.id;
    this.configuration['name'] = queryResponse.invocationOutput.metadata.name;
    this.configuration['author'] = queryResponse.invocationOutput.metadata.author;
    this.configuration['description'] = queryResponse.invocationOutput.metadata.description;
    this.configuration['category'] = queryResponse.invocationOutput.metadata.category;
    this.configuration['type'] = this.gistMode ? 'Gist' : 'Detector';

    return newPackage;
  }

  private preparePublishingPackage(queryResponse: QueryResponse<DetectorResponse>, code: string) {
    if (queryResponse.invocationOutput.metadata.author !== null && queryResponse.invocationOutput.metadata.author !== "" && this.emailRecipients.indexOf(queryResponse.invocationOutput.metadata.author) < 0) {
      this.emailRecipients += ';' + queryResponse.invocationOutput.metadata.author;
    }

    let newPackage = this.UpdateConfiguration(queryResponse);

    let update = of(null);
    if (newPackage.length > 0) {
      update = forkJoin(newPackage.map(r => this.githubService.getChangelist(r).pipe(
        map(c => this.configuration['dependencies'][r] = c[c.length - 1].sha),
        flatMap(v => this.githubService.getCommitContent(r, v).pipe(map(s => this.reference[r] = s))))))
    }

    update.subscribe(_ => {
      this.publishingPackage = {
        id: queryResponse.invocationOutput.metadata.id,
        codeString: code,
        committedByAlias: this.userName,
        dllBytes: this.compilationPackage.assemblyBytes,
        pdbBytes: this.compilationPackage.pdbBytes,
        packageConfig: JSON.stringify(this.configuration),
        metadata: JSON.stringify({ "utterances": this.allUtterances })
      };
    });
  }

  private showAlertBox(alertClass: string, message: string) {
    this.alertClass = alertClass;
    this.alertMessage = message;
    this.showAlert = true;
  }

  private initialize() {
    this.resourceId = this.resourceService.getCurrentResourceId();
    this.hideModal = localStorage.getItem("localdevmodal.hidden") === "true";
    let detectorFile: Observable<string>;
    this.recommendedUtterances = [];
    this.utteranceInput = "";
    this.githubService.getMetadataFile(this.id).subscribe(res => {
      this.allUtterances = JSON.parse(res).utterances;
    },
      (err) => {
        this.allUtterances = [];
      });
    this.compilationPackage = new CompilationProperties();

    switch (this.mode) {
        case DevelopMode.Create: {
            let templateFileName = (this.gistMode ? "Gist_" : "Detector_") + this.resourceService.templateFileName;
            detectorFile = this.githubService.getTemplate(templateFileName);
            this.fileName = "new.csx";
            this.startTime = this._detectorControlService.startTime;
            this.endTime = this._detectorControlService.endTime;
            break;
        }
        case DevelopMode.Edit: {
            this.fileName = `${this.id}.csx`;
            detectorFile = this.githubService.getSourceFile(this.id);
            this.startTime = this._detectorControlService.startTime;
            this.endTime = this._detectorControlService.endTime;
            break;
        }
        case DevelopMode.EditMonitoring: {
            this.fileName = '__monitoring.csx';
            detectorFile = this.githubService.getSourceFile("__monitoring");
            break;
        }
        case DevelopMode.EditAnalytics: {
            this.fileName = '__analytics.csx';
            detectorFile = this.githubService.getSourceFile("__analytics");
            break;
        }
    }

    let configuration = of(null);
    if (this.id !== '') {
      configuration = this.githubService.getConfiguration(this.id).pipe(
        map(config => {
          if (!('dependencies' in config)) {
            config['dependencies'] = {};
          }

          this.configuration = config;
          return this.configuration['dependencies'];
        }),
        flatMap(dep => {
          let keys = Object.keys(dep);
          if (keys.length === 0) return of([]);
          return forkJoin(Object.keys(dep).map(key => this.githubService.getSourceReference(key, dep[key])));
        }));
    } else {
      if (!('dependencies' in this.configuration)) {
        this.configuration['dependencies'] = {};
      }
    }

    forkJoin(detectorFile, configuration, this.diagnosticApiService.getGists()).subscribe(res => {
      this.code = res[0];
      if (res[1] !== null) {
        this.gists = Object.keys(this.configuration['dependencies']);
        this.gists.forEach((name, index) => {
          this.reference[name] = res[1][index];
        });
      }

      if(res[2] !== null) {
        res[2].forEach(m => {
          this.allGists.push(m.id);
        });
      }

      if (!this.hideModal && !this.gistMode) {
        this.ngxSmartModalService.getModal('devModeModal').open();
      }
    });
  }
}
