import { Component, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse } from '../../models/detector';
import { Form, FormInput, InputType, FormButton, ButtonStyles } from '../../models/form';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';

@Component({
  selector: 'custom-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent extends DataRenderBaseComponent {

  renderingProperties: Rendering;
  detectorForms: Form[] = [];
  isPublic: boolean;


  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private _diagnosticService: DiagnosticService, private _router: Router, protected telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService,
    private activatedRoute: ActivatedRoute,
    private locationService: Location,
  ) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;
    this.parseData(data.table);
    if (this.detectorControlService.detectorQueryParamsString != "" && !this.developmentMode) {
      this.setInputValues();
      this.getDetectorResponse();
    }
  }

  public isText(inputType: InputType) {
    return inputType === InputType.TextBox;
  }

  public isButton(inputType: InputType) {
    return inputType === InputType.Button;
  }

  // parses the incoming data to render a form
  private parseData(data: DataTableResponseObject) {
    let totalForms = data.rows.length;
    if (totalForms > 0) {
      for (let i = 0; i < totalForms; i++) {
        this.detectorForms[i] = new Form();
        this.detectorForms[i].formId = data.rows[i][0];
        this.detectorForms[i].formTitle = data.rows[i][1];
        let formInputs = data.rows[i][2];
        for (let ip = 0; ip < formInputs.length; ip++) {
          if (formInputs[ip]["inputType"] === InputType.Button) {
            this.detectorForms[i].formButtons.push(new FormButton(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["isRequired"],
              formInputs[ip]["buttonStyle"]
            ));
          } else {
            this.detectorForms[i].formInputs.push(new FormInput(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["isRequired"]));
          }
        }
      }
    }
  }

  OnSubmitFormAction(formId: any, buttonId: any) {

    let formToExecute = this.detectorForms.find(form => form.formId == formId);
    if (formToExecute != undefined) {
      // validate inputs. If there are validation errors displayed, do not proceed to execution
      if (!this.validateInputs(formToExecute.formInputs)) {
        return;
      }
      // Setting loading indicator and removing the existing form response from the ui
      formToExecute.loadingFormResponse = true;
      formToExecute.formResponse = undefined;
      formToExecute.errorMessage = '';
      let queryParams = `&fId=${formId}&btnId=${buttonId}`;
      formToExecute.formInputs.forEach(ip => {
        queryParams += `&inpId=${ip.inputId}&val=${ip.inputValue}`;
      });
      // Send telemetry event for Form Button click
      this.logFormButtonClick(formToExecute.formTitle);
      if (this.developmentMode) {
        // compile the code and show response
        var body = {
          script: this.executionScript
        };
        this._diagnosticService.getCompilerResponse(body, false, '', this.detectorControlService.startTimeString,
          this.detectorControlService.endTimeString, '', '', {
            formQueryParams: queryParams,
            scriptETag: this.compilationPackage.scriptETag,
            assemblyName: this.compilationPackage.assemblyName,
            getFullResponse: true
          })
          .subscribe((response: any) => {
            formToExecute.loadingFormResponse = false;
            if (response.body != undefined) {
              // If the script etag returned by the server does not match the previous script-etag, update the values in memory
              if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
                this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
                this.compilationPackage.assemblyName = response.body.compilationOutput.assemblyName;
              }
              formToExecute.formResponse = response.body.invocationOutput;
              formToExecute.errorMessage = '';
            }
          }, ((error: any) => {
            formToExecute.loadingFormResponse = false;
            formToExecute.errorMessage = 'Something went wrong while loading data';
          }));
      } else {
        let detectorParams = {
          'detectorId': this.detector,
          'fId': formId,
          'btnId': buttonId,
          'inputs': [],
        }
        formToExecute.formInputs.forEach(ip => {
          detectorParams.inputs.push({
            'inpId': ip.inputId,
            'val': ip.inputValue
          });
        });
        let detectorQueryParamsString = JSON.stringify(detectorParams);
        if (!this.isPublic) {
          let currentURL = new URL(window.location.href);
          currentURL.searchParams.set("detectorQueryParams", detectorQueryParamsString);
          this.locationService.go(currentURL.pathname + currentURL.search);
        }
        this.detectorControlService.setDetectorQueryParams(detectorQueryParamsString);
        this.getDetectorResponse();
      }
    }
  }

  setInputValues() {
    let detectorQueryParams = JSON.parse(this.detectorControlService.detectorQueryParamsString);
    if (detectorQueryParams != undefined && detectorQueryParams.detectorId == this.detector) {
      let formToSetValues = this.detectorForms.find(form => form.formId == detectorQueryParams.fId);
      detectorQueryParams.inputs.forEach(ip => {
        let inputElement = formToSetValues.formInputs.find(input => input.inputId == ip.inpId);
        inputElement.inputValue = ip.val;
      });
    }
  }

  getDetectorResponse() {
    let detectorQueryParams = JSON.parse(this.detectorControlService.detectorQueryParamsString);
    if (detectorQueryParams != undefined && detectorQueryParams.detectorId == this.detector) {
      let formToExecute = this.detectorForms.find(form => form.formId == detectorQueryParams.fId);
      let queryParams = `&fId=${detectorQueryParams.fId}&btnId=${detectorQueryParams.btnId}`;
      detectorQueryParams.inputs.forEach(ip => {
        queryParams += `&inpId=${ip.inpId}&val=${ip.val}`;
      });
      // Setting loading indicator and removing the existing form response from the ui
      formToExecute.loadingFormResponse = true;
      formToExecute.formResponse = undefined;
      formToExecute.errorMessage = '';

      this._diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
        this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
          formToExecute.formResponse = response;
          formToExecute.errorMessage = '';
          formToExecute.loadingFormResponse = false;
        }, (error: any) => {
          formToExecute.loadingFormResponse = false;
          formToExecute.errorMessage = 'Something went wrong while loading data';
        });
    }
  }

  validateInputs(formInputs: FormInput[]): boolean {
    for (let input of formInputs) {
      if (input.isRequired && (input.inputValue == undefined || input.inputValue == "")) {
        input.displayValidation = true;
        return false;
      }
    }
    return true;
  }

  inputChanged(formInput: FormInput) {
    formInput.displayValidation = false;
  }

  getButtonClass(buttonStyle: ButtonStyles): string {
    switch (buttonStyle) {
      case ButtonStyles.Primary:
        return "btn btn-primary";
      case ButtonStyles.Secondary:
        return "btn btn-secondary";
      case ButtonStyles.Success:
        return "btn btn-success";
      case ButtonStyles.Danger:
        return "btn btn-danger";
      case ButtonStyles.Warning:
        return "btn btn-warning";
      case ButtonStyles.Info:
        return "btn btn-info";
      case ButtonStyles.Light:
        return "btn btn-light";
      case ButtonStyles.Dark:
        return "btn btn-dark";
      case ButtonStyles.Link:
        return "btn btn-link";
      default:
        return "btn btn-primary";
    }
  }

  logFormButtonClick(formTitle?: string) {
    var eventProps = {
      'Detector': this.detector,
      'DevelopmentMode': this.developmentMode,
      'FormTitle': formTitle ? formTitle : ""
    };
    this.logEvent(TelemetryEventNames.FormButtonClicked, eventProps);
  }
}
